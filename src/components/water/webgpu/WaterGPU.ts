/**
 * WebGPU Water Compute System
 * Manages all GPU compute pipelines for water simulation,
 * surface intent fields, and MLS-MPM particle emission.
 * 
 * Phase 2-4 enhancements:
 * - Particle feedback shader (two-way coupling)
 * - Fields passed to particle update for adhesion recapture
 * - Double-buffered staging for readback
 * - Emit every 2 frames, compact every 20
 */

import {
  GRID_SIZE,
  MAX_PARTICLES,
  waterDropShader,
  waterUpdateShader,
  waterNormalsShader,
  sphereDisplacementShader,
  surfaceFieldsShader,
  emitParticlesShader,
  updateParticlesShader,
  particleFeedbackShader,
  resetParticlesShader,
} from './shaders';

const WATER_BUFFER_SIZE = GRID_SIZE * GRID_SIZE * 4 * 4;
const FIELD_BUFFER_SIZE = GRID_SIZE * GRID_SIZE * 4 * 4;
const PARTICLE_BUFFER_SIZE = MAX_PARTICLES * 2 * 4 * 4;

interface Drop {
  x: number;
  y: number;
  radius: number;
  strength: number;
}

interface SphereState {
  oldX: number; oldY: number; oldZ: number;
  newX: number; newY: number; newZ: number;
  radius: number;
}

export class WaterGPU {
  waterData: Float32Array;
  fieldData: Float32Array;
  field2Data: Float32Array;
  particleData: Float32Array;
  activeParticles = 0;
  dataReady = false;
  dataVersion = 0;

  private device: any;

  private waterBuffers: [any, any];
  private currentWater = 0;
  private fieldBuffers: [any, any];
  private currentField = 0;
  private field2Buffer: any;
  private particleBuffer: any;
  private counterBuffer: any;
  
  // Double-buffered staging
  private stagingSets: Array<{
    water: any;
    field: any;
    field2: any;
    particles: any;
    counter: any;
  }>;
  private currentStaging = 0;
  
  private dropParamsBuffer: any;
  private updateParamsBuffer: any;
  private sphereParamsBuffer: any;
  private fieldParamsBuffer: any;
  private physicsParamsBuffer: any;
  
  private dropPipeline: any;
  private updatePipeline: any;
  private normalsPipeline: any;
  private spherePipeline: any;
  private fieldsPipeline: any;
  private emitPipeline: any;
  private updateParticlesPipeline: any;
  private feedbackPipeline: any;
  private resetParticlesPipeline: any;
  
  private waterRWLayout: any;
  private waterRWUniformLayout: any;
  private fieldsLayout: any;
  private emitLayout: any;
  private particleUpdateLayout: any;
  private feedbackLayout: any;
  private particleResetLayout: any;

  private dropQueue: Drop[] = [];
  private sphereState: SphereState | null = null;
  private readbackPending = false;
  private frameCount = 0;

  private constructor(device: any) {
    this.device = device;
    
    this.waterData = new Float32Array(GRID_SIZE * GRID_SIZE * 4);
    this.fieldData = new Float32Array(GRID_SIZE * GRID_SIZE * 4);
    this.field2Data = new Float32Array(GRID_SIZE * GRID_SIZE * 4);
    this.particleData = new Float32Array(MAX_PARTICLES * 8);

    const STORAGE = 0x80;
    const COPY_SRC = 0x04;
    const COPY_DST = 0x08;
    const MAP_READ = 0x01;
    const UNIFORM = 0x40;
    const COMPUTE = 0x04;

    // Water buffers (ping-pong)
    this.waterBuffers = [
      device.createBuffer({ size: WATER_BUFFER_SIZE, usage: STORAGE | COPY_SRC }),
      device.createBuffer({ size: WATER_BUFFER_SIZE, usage: STORAGE | COPY_SRC }),
    ];

    // Field buffers (ping-pong)
    this.fieldBuffers = [
      device.createBuffer({ size: FIELD_BUFFER_SIZE, usage: STORAGE | COPY_SRC }),
      device.createBuffer({ size: FIELD_BUFFER_SIZE, usage: STORAGE | COPY_SRC }),
    ];

    this.field2Buffer = device.createBuffer({ size: FIELD_BUFFER_SIZE, usage: STORAGE | COPY_SRC });
    this.particleBuffer = device.createBuffer({ size: PARTICLE_BUFFER_SIZE, usage: STORAGE | COPY_SRC });
    this.counterBuffer = device.createBuffer({ size: 256, usage: STORAGE | COPY_SRC | COPY_DST });
    
    device.queue.writeBuffer(this.counterBuffer, 0, new Uint32Array([0]));

    // Double-buffered staging
    this.stagingSets = [0, 1].map(() => ({
      water: device.createBuffer({ size: WATER_BUFFER_SIZE, usage: MAP_READ | COPY_DST }),
      field: device.createBuffer({ size: FIELD_BUFFER_SIZE, usage: MAP_READ | COPY_DST }),
      field2: device.createBuffer({ size: FIELD_BUFFER_SIZE, usage: MAP_READ | COPY_DST }),
      particles: device.createBuffer({ size: PARTICLE_BUFFER_SIZE, usage: MAP_READ | COPY_DST }),
      counter: device.createBuffer({ size: 256, usage: MAP_READ | COPY_DST }),
    }));

    // Uniform buffers
    this.dropParamsBuffer = device.createBuffer({ size: 16, usage: UNIFORM | COPY_DST });
    this.updateParamsBuffer = device.createBuffer({ size: 16, usage: UNIFORM | COPY_DST });
    this.sphereParamsBuffer = device.createBuffer({ size: 32, usage: UNIFORM | COPY_DST });
    this.fieldParamsBuffer = device.createBuffer({ size: 16, usage: UNIFORM | COPY_DST });
    this.physicsParamsBuffer = device.createBuffer({ size: 16, usage: UNIFORM | COPY_DST });

    // Default params
    device.queue.writeBuffer(this.updateParamsBuffer, 0, new Float32Array([0.995, 0, 0, 0]));
    device.queue.writeBuffer(this.fieldParamsBuffer, 0, new Float32Array([0.016, 0.3, 2.0, 0.4]));
    device.queue.writeBuffer(this.physicsParamsBuffer, 0, new Float32Array([0.016, 9.8, 0.995, 2.5]));

    // Bind group layouts
    this.waterRWLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 1, visibility: COMPUTE, buffer: { type: 'storage' } },
      ],
    });

    this.waterRWUniformLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 1, visibility: COMPUTE, buffer: { type: 'storage' } },
        { binding: 2, visibility: COMPUTE, buffer: { type: 'uniform' } },
      ],
    });

    this.fieldsLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 1, visibility: COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 2, visibility: COMPUTE, buffer: { type: 'storage' } },
        { binding: 3, visibility: COMPUTE, buffer: { type: 'storage' } },
        { binding: 4, visibility: COMPUTE, buffer: { type: 'uniform' } },
      ],
    });

    this.emitLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 1, visibility: COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 2, visibility: COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 3, visibility: COMPUTE, buffer: { type: 'storage' } },
        { binding: 4, visibility: COMPUTE, buffer: { type: 'storage' } },
      ],
    });

    // Particle update now needs fields for adhesion recapture
    this.particleUpdateLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: COMPUTE, buffer: { type: 'storage' } },
        { binding: 1, visibility: COMPUTE, buffer: { type: 'storage' } },
        { binding: 2, visibility: COMPUTE, buffer: { type: 'uniform' } },
        { binding: 3, visibility: COMPUTE, buffer: { type: 'read-only-storage' } },
      ],
    });

    // Particle feedback: particles write impulses to water
    this.feedbackLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 1, visibility: COMPUTE, buffer: { type: 'storage' } },
        { binding: 2, visibility: COMPUTE, buffer: { type: 'storage' } },
      ],
    });

    this.particleResetLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: COMPUTE, buffer: { type: 'storage' } },
        { binding: 1, visibility: COMPUTE, buffer: { type: 'storage' } },
      ],
    });

    // Create pipelines
    this.dropPipeline = this.createPipeline(waterDropShader, this.waterRWUniformLayout);
    this.updatePipeline = this.createPipeline(waterUpdateShader, this.waterRWUniformLayout);
    this.normalsPipeline = this.createPipeline(waterNormalsShader, this.waterRWLayout);
    this.spherePipeline = this.createPipeline(sphereDisplacementShader, this.waterRWUniformLayout);
    this.fieldsPipeline = this.createPipeline(surfaceFieldsShader, this.fieldsLayout);
    this.emitPipeline = this.createPipeline(emitParticlesShader, this.emitLayout);
    this.updateParticlesPipeline = this.createPipeline(updateParticlesShader, this.particleUpdateLayout);
    this.feedbackPipeline = this.createPipeline(particleFeedbackShader, this.feedbackLayout);
    this.resetParticlesPipeline = this.createPipeline(resetParticlesShader, this.particleResetLayout);
  }

  static async create(): Promise<WaterGPU | null> {
    if (typeof navigator === 'undefined' || !('gpu' in navigator)) return null;
    try {
      const gpu = (navigator as any).gpu;
      const adapter = await gpu.requestAdapter({ powerPreference: 'high-performance' });
      if (!adapter) return null;
      
      const device = await adapter.requestDevice({
        requiredLimits: {
          maxStorageBufferBindingSize: Math.max(WATER_BUFFER_SIZE, PARTICLE_BUFFER_SIZE),
          maxBufferSize: Math.max(WATER_BUFFER_SIZE, PARTICLE_BUFFER_SIZE),
        },
      });
      
      device.lost.then((info: any) => {
        console.error('WebGPU device lost:', info.message);
      });
      
      return new WaterGPU(device);
    } catch (e) {
      console.warn('WebGPU init failed:', e);
      return null;
    }
  }

  private createPipeline(shaderCode: string, layout: any): any {
    const module = this.device.createShaderModule({ code: shaderCode });
    return this.device.createComputePipeline({
      layout: this.device.createPipelineLayout({ bindGroupLayouts: [layout] }),
      compute: { module, entryPoint: 'main' },
    });
  }

  private get waterRead() { return this.waterBuffers[this.currentWater]; }
  private get waterWrite() { return this.waterBuffers[1 - this.currentWater]; }
  private swapWater() { this.currentWater = 1 - this.currentWater; }
  
  private get fieldRead() { return this.fieldBuffers[this.currentField]; }
  private get fieldWrite() { return this.fieldBuffers[1 - this.currentField]; }
  private swapField() { this.currentField = 1 - this.currentField; }

  addDrop(x: number, z: number, radius = 0.03, strength = 0.01) {
    this.dropQueue.push({
      x: (x + 1) * 0.5,
      y: (z + 1) * 0.5,
      radius, strength,
    });
  }

  setSphere(oldX: number, oldY: number, oldZ: number, newX: number, newY: number, newZ: number, radius: number) {
    this.sphereState = { oldX, oldY, oldZ, newX, newY, newZ, radius };
  }

  step() {
    if (this.readbackPending) return;
    
    const encoder = this.device.createCommandEncoder();
    const wg = Math.ceil(GRID_SIZE / 16);

    // 1. Process drops
    for (const drop of this.dropQueue) {
      this.device.queue.writeBuffer(this.dropParamsBuffer, 0, new Float32Array([drop.x, drop.y, drop.radius, drop.strength]));
      const bg = this.device.createBindGroup({
        layout: this.waterRWUniformLayout,
        entries: [
          { binding: 0, resource: { buffer: this.waterRead } },
          { binding: 1, resource: { buffer: this.waterWrite } },
          { binding: 2, resource: { buffer: this.dropParamsBuffer } },
        ],
      });
      const pass = encoder.beginComputePass();
      pass.setPipeline(this.dropPipeline);
      pass.setBindGroup(0, bg);
      pass.dispatchWorkgroups(wg, wg);
      pass.end();
      this.swapWater();
    }
    this.dropQueue = [];

    // 2. Sphere displacement
    if (this.sphereState) {
      const s = this.sphereState;
      this.device.queue.writeBuffer(this.sphereParamsBuffer, 0, new Float32Array([
        s.oldX, s.oldY, s.oldZ, s.radius,
        s.newX, s.newY, s.newZ, 0,
      ]));
      const bg = this.device.createBindGroup({
        layout: this.waterRWUniformLayout,
        entries: [
          { binding: 0, resource: { buffer: this.waterRead } },
          { binding: 1, resource: { buffer: this.waterWrite } },
          { binding: 2, resource: { buffer: this.sphereParamsBuffer } },
        ],
      });
      const pass = encoder.beginComputePass();
      pass.setPipeline(this.spherePipeline);
      pass.setBindGroup(0, bg);
      pass.dispatchWorkgroups(wg, wg);
      pass.end();
      this.swapWater();
      this.sphereState = null;
    }

    // 3. Water update (wave propagation)
    {
      const bg = this.device.createBindGroup({
        layout: this.waterRWUniformLayout,
        entries: [
          { binding: 0, resource: { buffer: this.waterRead } },
          { binding: 1, resource: { buffer: this.waterWrite } },
          { binding: 2, resource: { buffer: this.updateParamsBuffer } },
        ],
      });
      const pass = encoder.beginComputePass();
      pass.setPipeline(this.updatePipeline);
      pass.setBindGroup(0, bg);
      pass.dispatchWorkgroups(wg, wg);
      pass.end();
      this.swapWater();
    }

    // 4. Water normals
    {
      const bg = this.device.createBindGroup({
        layout: this.waterRWLayout,
        entries: [
          { binding: 0, resource: { buffer: this.waterRead } },
          { binding: 1, resource: { buffer: this.waterWrite } },
        ],
      });
      const pass = encoder.beginComputePass();
      pass.setPipeline(this.normalsPipeline);
      pass.setBindGroup(0, bg);
      pass.dispatchWorkgroups(wg, wg);
      pass.end();
      this.swapWater();
    }

    // 5. Surface intent fields
    {
      const bg = this.device.createBindGroup({
        layout: this.fieldsLayout,
        entries: [
          { binding: 0, resource: { buffer: this.waterRead } },
          { binding: 1, resource: { buffer: this.fieldRead } },
          { binding: 2, resource: { buffer: this.fieldWrite } },
          { binding: 3, resource: { buffer: this.field2Buffer } },
          { binding: 4, resource: { buffer: this.fieldParamsBuffer } },
        ],
      });
      const pass = encoder.beginComputePass();
      pass.setPipeline(this.fieldsPipeline);
      pass.setBindGroup(0, bg);
      pass.dispatchWorkgroups(wg, wg);
      pass.end();
      this.swapField();
    }

    // 6. Emit particles (every frame for responsive impact spray)
    {
      const bg = this.device.createBindGroup({
        layout: this.emitLayout,
        entries: [
          { binding: 0, resource: { buffer: this.waterRead } },
          { binding: 1, resource: { buffer: this.fieldRead } },
          { binding: 2, resource: { buffer: this.field2Buffer } },
          { binding: 3, resource: { buffer: this.particleBuffer } },
          { binding: 4, resource: { buffer: this.counterBuffer } },
        ],
      });
      const pass = encoder.beginComputePass();
      pass.setPipeline(this.emitPipeline);
      pass.setBindGroup(0, bg);
      pass.dispatchWorkgroups(wg, wg);
      pass.end();
    }

    // 7. Update particles (with fields for adhesion recapture)
    {
      const bg = this.device.createBindGroup({
        layout: this.particleUpdateLayout,
        entries: [
          { binding: 0, resource: { buffer: this.particleBuffer } },
          { binding: 1, resource: { buffer: this.counterBuffer } },
          { binding: 2, resource: { buffer: this.physicsParamsBuffer } },
          { binding: 3, resource: { buffer: this.fieldRead } },
        ],
      });
      const pass = encoder.beginComputePass();
      pass.setPipeline(this.updateParticlesPipeline);
      pass.setBindGroup(0, bg);
      pass.dispatchWorkgroups(Math.ceil(MAX_PARTICLES / 256));
      pass.end();
    }

    // 8. Particle feedback to water (two-way coupling)
    if (this.frameCount % 2 === 0) {
      const bg = this.device.createBindGroup({
        layout: this.feedbackLayout,
        entries: [
          { binding: 0, resource: { buffer: this.particleBuffer } },
          { binding: 1, resource: { buffer: this.waterWrite } },
          { binding: 2, resource: { buffer: this.counterBuffer } },
        ],
      });
      const pass = encoder.beginComputePass();
      pass.setPipeline(this.feedbackPipeline);
      pass.setBindGroup(0, bg);
      pass.dispatchWorkgroups(Math.ceil(MAX_PARTICLES / 256));
      pass.end();
      // Note: feedback writes to waterWrite, so we need to swap
      this.swapWater();
    }

    // 9. Reset/compact particles (every 20 frames)
    if (this.frameCount % 20 === 0) {
      const bg = this.device.createBindGroup({
        layout: this.particleResetLayout,
        entries: [
          { binding: 0, resource: { buffer: this.particleBuffer } },
          { binding: 1, resource: { buffer: this.counterBuffer } },
        ],
      });
      const pass = encoder.beginComputePass();
      pass.setPipeline(this.resetParticlesPipeline);
      pass.setBindGroup(0, bg);
      pass.dispatchWorkgroups(1);
      pass.end();
    }

    // Copy to staging (use current staging set)
    const staging = this.stagingSets[this.currentStaging];
    encoder.copyBufferToBuffer(this.waterRead, 0, staging.water, 0, WATER_BUFFER_SIZE);
    encoder.copyBufferToBuffer(this.fieldRead, 0, staging.field, 0, FIELD_BUFFER_SIZE);
    encoder.copyBufferToBuffer(this.field2Buffer, 0, staging.field2, 0, FIELD_BUFFER_SIZE);
    encoder.copyBufferToBuffer(this.particleBuffer, 0, staging.particles, 0, PARTICLE_BUFFER_SIZE);
    encoder.copyBufferToBuffer(this.counterBuffer, 0, staging.counter, 0, 4);

    this.device.queue.submit([encoder.finish()]);
    this.frameCount++;

    // Async readback
    this.readbackPending = true;
    const READ = 0x01;
    const stagingRef = staging;
    
    Promise.all([
      stagingRef.water.mapAsync(READ),
      stagingRef.field.mapAsync(READ),
      stagingRef.field2.mapAsync(READ),
      stagingRef.particles.mapAsync(READ),
      stagingRef.counter.mapAsync(READ),
    ]).then(() => {
      this.waterData.set(new Float32Array(stagingRef.water.getMappedRange()));
      this.fieldData.set(new Float32Array(stagingRef.field.getMappedRange()));
      this.field2Data.set(new Float32Array(stagingRef.field2.getMappedRange()));
      this.particleData.set(new Float32Array(stagingRef.particles.getMappedRange()));
      
      const counterData = new Uint32Array(stagingRef.counter.getMappedRange());
      this.activeParticles = counterData[0];

      stagingRef.water.unmap();
      stagingRef.field.unmap();
      stagingRef.field2.unmap();
      stagingRef.particles.unmap();
      stagingRef.counter.unmap();
      
      this.readbackPending = false;
      this.dataReady = true;
      this.dataVersion++;
      
      // Flip staging for next frame
      this.currentStaging = 1 - this.currentStaging;
    }).catch(() => {
      this.readbackPending = false;
    });
  }

  destroy() {
    this.waterBuffers.forEach((b: any) => b.destroy());
    this.fieldBuffers.forEach((b: any) => b.destroy());
    this.field2Buffer.destroy();
    this.particleBuffer.destroy();
    this.counterBuffer.destroy();
    this.stagingSets.forEach(s => {
      s.water.destroy();
      s.field.destroy();
      s.field2.destroy();
      s.particles.destroy();
      s.counter.destroy();
    });
    this.dropParamsBuffer.destroy();
    this.updateParamsBuffer.destroy();
    this.sphereParamsBuffer.destroy();
    this.fieldParamsBuffer.destroy();
    this.physicsParamsBuffer.destroy();
  }
}
