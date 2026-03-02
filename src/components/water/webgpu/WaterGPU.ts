/**
 * WebGPU Water Compute System
 * Manages all GPU compute pipelines for water simulation,
 * surface intent fields, and particle emission.
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
  resetParticlesShader,
} from './shaders';

const WATER_BUFFER_SIZE = GRID_SIZE * GRID_SIZE * 4 * 4; // vec4f per texel
const FIELD_BUFFER_SIZE = GRID_SIZE * GRID_SIZE * 4 * 4;
const PARTICLE_BUFFER_SIZE = MAX_PARTICLES * 2 * 4 * 4; // 2 vec4f per particle
const COUNTER_SIZE = 4; // 1 u32

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
  // Public readback data
  waterData: Float32Array;
  fieldData: Float32Array;
  field2Data: Float32Array;
  particleData: Float32Array;
  activeParticles = 0;
  dataReady = false;
  dataVersion = 0;

  private device: GPUDevice;

  // Ping-pong water buffers
  private waterBuffers: [GPUBuffer, GPUBuffer];
  private currentWater = 0;

  // Ping-pong field buffers
  private fieldBuffers: [GPUBuffer, GPUBuffer];
  private currentField = 0;

  // Field2 buffer (derived, no ping-pong)
  private field2Buffer: GPUBuffer;

  // Particle buffers
  private particleBuffer: GPUBuffer;
  private counterBuffer: GPUBuffer;

  // Staging buffers for readback
  private stagingWater: GPUBuffer;
  private stagingField: GPUBuffer;
  private stagingField2: GPUBuffer;
  private stagingParticles: GPUBuffer;
  private stagingCounter: GPUBuffer;

  // Uniform buffers
  private dropParamsBuffer: GPUBuffer;
  private updateParamsBuffer: GPUBuffer;
  private sphereParamsBuffer: GPUBuffer;
  private fieldParamsBuffer: GPUBuffer;
  private physicsParamsBuffer: GPUBuffer;

  // Pipelines
  private dropPipeline: GPUComputePipeline;
  private updatePipeline: GPUComputePipeline;
  private normalsPipeline: GPUComputePipeline;
  private spherePipeline: GPUComputePipeline;
  private fieldsPipeline: GPUComputePipeline;
  private emitPipeline: GPUComputePipeline;
  private updateParticlesPipeline: GPUComputePipeline;
  private resetParticlesPipeline: GPUComputePipeline;

  // Bind group layouts
  private waterRWLayout: GPUBindGroupLayout;
  private waterRWUniformLayout: GPUBindGroupLayout;
  private fieldsLayout: GPUBindGroupLayout;
  private emitLayout: GPUBindGroupLayout;
  private particleUpdateLayout: GPUBindGroupLayout;
  private particleResetLayout: GPUBindGroupLayout;

  // State
  private dropQueue: Drop[] = [];
  private sphereState: SphereState | null = null;
  private readbackPending = false;
  private frameCount = 0;

  private constructor(device: GPUDevice) {
    this.device = device;
    
    const bufSize = WATER_BUFFER_SIZE;
    
    // Water data arrays
    this.waterData = new Float32Array(GRID_SIZE * GRID_SIZE * 4);
    this.fieldData = new Float32Array(GRID_SIZE * GRID_SIZE * 4);
    this.field2Data = new Float32Array(GRID_SIZE * GRID_SIZE * 4);
    this.particleData = new Float32Array(MAX_PARTICLES * 8);

    // Create water buffers (ping-pong)
    this.waterBuffers = [
      device.createBuffer({ size: bufSize, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC }),
      device.createBuffer({ size: bufSize, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC }),
    ];

    // Create field buffers (ping-pong)
    this.fieldBuffers = [
      device.createBuffer({ size: FIELD_BUFFER_SIZE, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC }),
      device.createBuffer({ size: FIELD_BUFFER_SIZE, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC }),
    ];

    // Field2 (derived each frame)
    this.field2Buffer = device.createBuffer({ size: FIELD_BUFFER_SIZE, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC });

    // Particles
    this.particleBuffer = device.createBuffer({ size: PARTICLE_BUFFER_SIZE, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC });
    this.counterBuffer = device.createBuffer({ size: 256, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST });
    
    // Zero counter
    device.queue.writeBuffer(this.counterBuffer, 0, new Uint32Array([0]));

    // Staging buffers
    this.stagingWater = device.createBuffer({ size: bufSize, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });
    this.stagingField = device.createBuffer({ size: FIELD_BUFFER_SIZE, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });
    this.stagingField2 = device.createBuffer({ size: FIELD_BUFFER_SIZE, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });
    this.stagingParticles = device.createBuffer({ size: PARTICLE_BUFFER_SIZE, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });
    this.stagingCounter = device.createBuffer({ size: 256, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });

    // Uniform buffers
    this.dropParamsBuffer = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    this.updateParamsBuffer = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    this.sphereParamsBuffer = device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    this.fieldParamsBuffer = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    this.physicsParamsBuffer = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });

    // Set default params
    device.queue.writeBuffer(this.updateParamsBuffer, 0, new Float32Array([0.995, 0, 0, 0]));
    device.queue.writeBuffer(this.fieldParamsBuffer, 0, new Float32Array([0.016, 0.3, 2.0, 0.4]));
    device.queue.writeBuffer(this.physicsParamsBuffer, 0, new Float32Array([0.016, 9.8, 0.995, 3.0]));

    // Create bind group layouts
    this.waterRWLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
      ],
    });

    this.waterRWUniformLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
      ],
    });

    this.fieldsLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 4, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
      ],
    });

    this.emitLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 4, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
      ],
    });

    this.particleUpdateLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
      ],
    });

    this.particleResetLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
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
    this.resetParticlesPipeline = this.createPipeline(resetParticlesShader, this.particleResetLayout);
  }

  static async create(): Promise<WaterGPU | null> {
    if (typeof navigator === 'undefined' || !('gpu' in navigator)) return null;
    try {
      const gpu = (navigator as any).gpu as GPU;
      const adapter = await gpu.requestAdapter({ powerPreference: 'high-performance' });
      if (!adapter) return null;
      
      const device = await adapter.requestDevice({
        requiredLimits: {
          maxStorageBufferBindingSize: Math.max(WATER_BUFFER_SIZE, PARTICLE_BUFFER_SIZE),
          maxBufferSize: Math.max(WATER_BUFFER_SIZE, PARTICLE_BUFFER_SIZE),
        },
      });
      
      device.lost.then((info) => {
        console.error('WebGPU device lost:', info.message);
      });
      
      return new WaterGPU(device);
    } catch (e) {
      console.warn('WebGPU init failed:', e);
      return null;
    }
  }

  private createPipeline(shaderCode: string, layout: GPUBindGroupLayout): GPUComputePipeline {
    const module = this.device.createShaderModule({ code: shaderCode });
    return this.device.createComputePipeline({
      layout: this.device.createPipelineLayout({ bindGroupLayouts: [layout] }),
      compute: { module, entryPoint: 'main' },
    });
  }

  // ---- Water buffer helpers ----
  private get waterRead() { return this.waterBuffers[this.currentWater]; }
  private get waterWrite() { return this.waterBuffers[1 - this.currentWater]; }
  private swapWater() { this.currentWater = 1 - this.currentWater; }
  
  private get fieldRead() { return this.fieldBuffers[this.currentField]; }
  private get fieldWrite() { return this.fieldBuffers[1 - this.currentField]; }
  private swapField() { this.currentField = 1 - this.currentField; }

  // ---- Public API ----
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

    // 6. Emit particles (every 3rd frame to control rate)
    if (this.frameCount % 3 === 0) {
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

    // 7. Update particles
    {
      const bg = this.device.createBindGroup({
        layout: this.particleUpdateLayout,
        entries: [
          { binding: 0, resource: { buffer: this.particleBuffer } },
          { binding: 1, resource: { buffer: this.counterBuffer } },
          { binding: 2, resource: { buffer: this.physicsParamsBuffer } },
        ],
      });
      const pass = encoder.beginComputePass();
      pass.setPipeline(this.updateParticlesPipeline);
      pass.setBindGroup(0, bg);
      pass.dispatchWorkgroups(Math.ceil(MAX_PARTICLES / 256));
      pass.end();
    }

    // 8. Reset/compact particles (every 30 frames)
    if (this.frameCount % 30 === 0) {
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

    // Copy to staging
    encoder.copyBufferToBuffer(this.waterRead, 0, this.stagingWater, 0, WATER_BUFFER_SIZE);
    encoder.copyBufferToBuffer(this.fieldRead, 0, this.stagingField, 0, FIELD_BUFFER_SIZE);
    encoder.copyBufferToBuffer(this.field2Buffer, 0, this.stagingField2, 0, FIELD_BUFFER_SIZE);
    encoder.copyBufferToBuffer(this.particleBuffer, 0, this.stagingParticles, 0, PARTICLE_BUFFER_SIZE);
    encoder.copyBufferToBuffer(this.counterBuffer, 0, this.stagingCounter, 0, 4);

    this.device.queue.submit([encoder.finish()]);
    this.frameCount++;

    // Async readback
    this.readbackPending = true;
    Promise.all([
      this.stagingWater.mapAsync(GPUMapMode.READ),
      this.stagingField.mapAsync(GPUMapMode.READ),
      this.stagingField2.mapAsync(GPUMapMode.READ),
      this.stagingParticles.mapAsync(GPUMapMode.READ),
      this.stagingCounter.mapAsync(GPUMapMode.READ),
    ]).then(() => {
      this.waterData.set(new Float32Array(this.stagingWater.getMappedRange()));
      this.fieldData.set(new Float32Array(this.stagingField.getMappedRange()));
      this.field2Data.set(new Float32Array(this.stagingField2.getMappedRange()));
      this.particleData.set(new Float32Array(this.stagingParticles.getMappedRange()));
      
      const counterData = new Uint32Array(this.stagingCounter.getMappedRange());
      this.activeParticles = counterData[0];

      this.stagingWater.unmap();
      this.stagingField.unmap();
      this.stagingField2.unmap();
      this.stagingParticles.unmap();
      this.stagingCounter.unmap();
      
      this.readbackPending = false;
      this.dataReady = true;
      this.dataVersion++;
    }).catch(() => {
      this.readbackPending = false;
    });
  }

  destroy() {
    this.waterBuffers.forEach(b => b.destroy());
    this.fieldBuffers.forEach(b => b.destroy());
    this.field2Buffer.destroy();
    this.particleBuffer.destroy();
    this.counterBuffer.destroy();
    this.stagingWater.destroy();
    this.stagingField.destroy();
    this.stagingField2.destroy();
    this.stagingParticles.destroy();
    this.stagingCounter.destroy();
    this.dropParamsBuffer.destroy();
    this.updateParamsBuffer.destroy();
    this.sphereParamsBuffer.destroy();
    this.fieldParamsBuffer.destroy();
    this.physicsParamsBuffer.destroy();
    this.device.destroy();
  }
}
