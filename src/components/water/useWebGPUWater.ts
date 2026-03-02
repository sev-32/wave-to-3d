/**
 * React hook bridging WebGPU compute to Three.js/R3F rendering.
 * Manages WaterGPU lifecycle, DataTextures, and particle data.
 */

import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import * as THREE from 'three';
import { WaterGPU, GRID_SIZE, MAX_PARTICLES } from './webgpu';

export interface WebGPUWaterAPI {
  waterTexture: THREE.DataTexture;
  fieldTexture: THREE.DataTexture;
  field2Texture: THREE.DataTexture;
  particlePositions: Float32Array;
  activeParticles: number;
  addDrop: (x: number, z: number, radius?: number, strength?: number) => void;
  setSphere: (
    oldX: number, oldY: number, oldZ: number,
    newX: number, newY: number, newZ: number,
    radius: number
  ) => void;
  step: () => void;
  isReady: boolean;
  isWebGPU: boolean;
}

function createDataTexture(size: number): THREE.DataTexture {
  const data = new Float32Array(size * size * 4);
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

export function useWebGPUWater(): WebGPUWaterAPI {
  const gpuRef = useRef<WaterGPU | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isWebGPU, setIsWebGPU] = useState(false);
  const lastVersion = useRef(-1);

  // Create persistent DataTextures
  const waterTexture = useMemo(() => createDataTexture(GRID_SIZE), []);
  const fieldTexture = useMemo(() => createDataTexture(GRID_SIZE), []);
  const field2Texture = useMemo(() => createDataTexture(GRID_SIZE), []);
  const particlePositions = useMemo(() => new Float32Array(MAX_PARTICLES * 8), []);
  const activeParticlesRef = useRef(0);

  // Initialize WebGPU
  useEffect(() => {
    let cancelled = false;
    
    WaterGPU.create().then((gpu) => {
      if (cancelled) {
        gpu?.destroy();
        return;
      }
      if (gpu) {
        gpuRef.current = gpu;
        setIsWebGPU(true);
        setIsReady(true);
        console.log('✅ WebGPU water simulation initialized');
      } else {
        console.warn('⚠️ WebGPU not available, using WebGL fallback');
        setIsWebGPU(false);
        setIsReady(true);
      }
    });

    return () => {
      cancelled = true;
      gpuRef.current?.destroy();
      gpuRef.current = null;
    };
  }, []);

  const addDrop = useCallback((x: number, z: number, radius = 0.03, strength = 0.01) => {
    gpuRef.current?.addDrop(x, z, radius, strength);
  }, []);

  const setSphere = useCallback((
    oldX: number, oldY: number, oldZ: number,
    newX: number, newY: number, newZ: number,
    radius: number
  ) => {
    gpuRef.current?.setSphere(oldX, oldY, oldZ, newX, newY, newZ, radius);
  }, []);

  const step = useCallback(() => {
    const gpu = gpuRef.current;
    if (!gpu) return;

    gpu.step();

    // Update textures when new data is ready
    if (gpu.dataReady && gpu.dataVersion !== lastVersion.current) {
      lastVersion.current = gpu.dataVersion;

      // Update water texture
      const waterData = waterTexture.image.data as Float32Array;
      waterData.set(gpu.waterData);
      waterTexture.needsUpdate = true;

      // Update field textures
      const fieldData = fieldTexture.image.data as Float32Array;
      fieldData.set(gpu.fieldData);
      fieldTexture.needsUpdate = true;

      const field2Data = field2Texture.image.data as Float32Array;
      field2Data.set(gpu.field2Data);
      field2Texture.needsUpdate = true;

      // Update particles
      particlePositions.set(gpu.particleData);
      activeParticlesRef.current = gpu.activeParticles;
    }
  }, [waterTexture, fieldTexture, field2Texture, particlePositions]);

  return {
    waterTexture,
    fieldTexture,
    field2Texture,
    particlePositions,
    get activeParticles() { return activeParticlesRef.current; },
    addDrop,
    setSphere,
    step,
    isReady,
    isWebGPU,
  };
}
