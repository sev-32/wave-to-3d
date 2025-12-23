/**
 * Caustics Hook for React Three Fiber
 * Ported from GPTWAVES reference - WORKING IMPLEMENTATION
 * 
 * CRITICAL: Uses UnsignedByteType render target for correct caustics
 */

import { useMemo, useCallback, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  CAUSTICS_VERTEX_SHADER,
  CAUSTICS_FRAGMENT_SHADER,
  CAUSTICS_FRAGMENT_SHADER_FALLBACK,
} from './shaders';

interface UseCausticsOptions {
  resolution?: number;
  waterMeshDetail?: number;
}

export function useCaustics({
  resolution = 1024,
  waterMeshDetail = 200,
}: UseCausticsOptions = {}) {
  const { gl } = useThree();

  // Check for OES_standard_derivatives support
  const hasDerivatives = useMemo(() => {
    const ctx = gl.getContext();
    const ext = ctx.getExtension('OES_standard_derivatives');
    return !!ext;
  }, [gl]);

  // CRITICAL: UnsignedByteType render target (not FloatType)
  const causticsTarget = useMemo(
    () =>
      new THREE.WebGLRenderTarget(resolution, resolution, {
        type: THREE.UnsignedByteType, // CRITICAL for correct caustics
        format: THREE.RGBAFormat,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        stencilBuffer: false,
        depthBuffer: false,
      }),
    [resolution]
  );

  // Water mesh geometry for caustics projection
  const causticsGeometry = useMemo(
    () => new THREE.PlaneGeometry(2, 2, waterMeshDetail, waterMeshDetail),
    [waterMeshDetail]
  );

  // Caustics material
  const causticsMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          water: { value: null },
          light: { value: new THREE.Vector3(2, 2, -1).normalize() },
          sphereCenter: { value: new THREE.Vector3() },
          sphereRadius: { value: 0.25 },
        },
        vertexShader: CAUSTICS_VERTEX_SHADER,
        fragmentShader: hasDerivatives
          ? CAUSTICS_FRAGMENT_SHADER
          : CAUSTICS_FRAGMENT_SHADER_FALLBACK,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [hasDerivatives]
  );

  // Caustics mesh
  const causticsMesh = useMemo(
    () => new THREE.Mesh(causticsGeometry, causticsMaterial),
    [causticsGeometry, causticsMaterial]
  );

  // Caustics scene
  const causticsScene = useMemo(() => {
    const scene = new THREE.Scene();
    scene.add(causticsMesh);
    return scene;
  }, [causticsMesh]);

  // Orthographic camera for caustics
  const causticsCamera = useMemo(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
    []
  );

  // Update caustics
  const updateCaustics = useCallback(
    (
      waterTexture: THREE.Texture,
      lightDir: THREE.Vector3,
      sphereCenter: THREE.Vector3,
      sphereRadius: number
    ) => {
      causticsMaterial.uniforms.water.value = waterTexture;
      causticsMaterial.uniforms.light.value.copy(lightDir);
      causticsMaterial.uniforms.sphereCenter.value.copy(sphereCenter);
      causticsMaterial.uniforms.sphereRadius.value = sphereRadius;

      // CRITICAL: Save and restore render target state
      const previousTarget = gl.getRenderTarget();
      const previousClearColor = gl.getClearColor(new THREE.Color());
      const previousClearAlpha = gl.getClearAlpha();

      gl.setClearColor(0x000000, 0);
      gl.setRenderTarget(causticsTarget);
      gl.clear(true, false, false);
      gl.render(causticsScene, causticsCamera);

      // Restore state
      gl.setRenderTarget(previousTarget);
      gl.setClearColor(previousClearColor, previousClearAlpha);
    },
    [gl, causticsMaterial, causticsTarget, causticsScene, causticsCamera]
  );

  return {
    texture: causticsTarget.texture,
    updateCaustics,
    hasDerivatives,
  };
}
