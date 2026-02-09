import { useMemo, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  causticsVertexShader,
  causticsFragmentShader,
  causticsFragmentShaderFallback,
} from './shaders';

const CAUSTIC_SIZE = 1024;

export function useCaustics() {
  const { gl } = useThree();

  // Check for OES_standard_derivatives support
  const hasDerivatives = useMemo(() => {
    const ext = gl.getContext().getExtension('OES_standard_derivatives');
    return !!ext;
  }, [gl]);

  // Caustics render target
  const causticsTarget = useMemo(() => {
    return new THREE.WebGLRenderTarget(CAUSTIC_SIZE, CAUSTIC_SIZE, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      stencilBuffer: false,
      depthBuffer: false,
    });
  }, []);

  // Water mesh for caustics rendering (200x200 grid matching original)
  const causticsMesh = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(2, 2, 200, 200);
    // Don't rotate - the vertex shader handles the coordinate transform
    // position.xy maps to xz in world space via gl_Vertex.xzy
    return geometry;
  }, []);

  // Caustics material
  const causticsMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        tWater: { value: null },
        light: { value: new THREE.Vector3(2, 2, -1).normalize() },
        sphereCenter: { value: new THREE.Vector3() },
        sphereRadius: { value: 0.25 },
      },
      vertexShader: causticsVertexShader,
      fragmentShader: hasDerivatives ? causticsFragmentShader : causticsFragmentShaderFallback,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [hasDerivatives]);

  // Mesh for rendering
  const mesh = useMemo(() => {
    return new THREE.Mesh(causticsMesh, causticsMaterial);
  }, [causticsMesh, causticsMaterial]);

  // Scene and camera for caustics
  const causticsScene = useMemo(() => {
    const scene = new THREE.Scene();
    scene.add(mesh);
    return scene;
  }, [mesh]);

  const causticsCamera = useMemo(() => {
    return new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }, []);

  // Update caustics
  const updateCaustics = useCallback((
    waterTexture: THREE.Texture,
    sphereCenter: THREE.Vector3,
    sphereRadius: number,
    lightDir: THREE.Vector3
  ) => {
    causticsMaterial.uniforms.tWater.value = waterTexture;
    causticsMaterial.uniforms.sphereCenter.value.copy(sphereCenter);
    causticsMaterial.uniforms.sphereRadius.value = sphereRadius;
    causticsMaterial.uniforms.light.value.copy(lightDir);

    const renderer = gl;
    renderer.setRenderTarget(causticsTarget);
    renderer.clear();
    renderer.render(causticsScene, causticsCamera);
    renderer.setRenderTarget(null);
  }, [gl, causticsMaterial, causticsTarget, causticsScene, causticsCamera]);

  // Get caustics texture
  const getCausticsTexture = useCallback(() => {
    return causticsTarget.texture;
  }, [causticsTarget]);

  return {
    updateCaustics,
    getCausticsTexture,
    causticsTarget,
    hasDerivatives,
  };
}
