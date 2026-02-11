import { useMemo, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  foamSimulationVertexShader,
  foamUpdateShader,
} from './shaders/foamShaders';

const FOAM_SIZE = 256;

export function useFoamSimulation() {
  const { gl } = useThree();

  // Ping-pong targets for foam density field
  const foamTargetA = useMemo(() => {
    return new THREE.WebGLRenderTarget(FOAM_SIZE, FOAM_SIZE, {
      type: THREE.FloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      stencilBuffer: false,
      depthBuffer: false,
    });
  }, []);

  const foamTargetB = useMemo(() => {
    return new THREE.WebGLRenderTarget(FOAM_SIZE, FOAM_SIZE, {
      type: THREE.FloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      stencilBuffer: false,
      depthBuffer: false,
    });
  }, []);

  const currentFoam = { current: foamTargetA };
  const nextFoam = { current: foamTargetB };

  const quadGeometry = useMemo(() => new THREE.PlaneGeometry(2, 2), []);

  // Foam update material
  const foamMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        tFoam: { value: null },
        tWater: { value: null },
        delta: { value: new THREE.Vector2(1 / FOAM_SIZE, 1 / FOAM_SIZE) },
        dt: { value: 0.016 },
        sphereCenter: { value: new THREE.Vector3() },
        sphereVelocity: { value: new THREE.Vector3() },
        sphereRadius: { value: 0.25 },
      },
      vertexShader: foamSimulationVertexShader,
      fragmentShader: foamUpdateShader,
      depthTest: false,
      depthWrite: false,
    });
  }, []);

  const quadMesh = useMemo(() => new THREE.Mesh(quadGeometry, foamMaterial), [quadGeometry, foamMaterial]);
  const simCamera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);
  const simScene = useMemo(() => {
    const scene = new THREE.Scene();
    scene.add(quadMesh);
    return scene;
  }, [quadMesh]);

  const stepFoam = useCallback((
    waterTexture: THREE.Texture,
    sphereCenter: THREE.Vector3,
    sphereVelocity: THREE.Vector3,
    sphereRadius: number,
    dt: number
  ) => {
    foamMaterial.uniforms.tFoam.value = currentFoam.current.texture;
    foamMaterial.uniforms.tWater.value = waterTexture;
    foamMaterial.uniforms.sphereCenter.value.copy(sphereCenter);
    foamMaterial.uniforms.sphereVelocity.value.copy(sphereVelocity);
    foamMaterial.uniforms.sphereRadius.value = sphereRadius;
    foamMaterial.uniforms.dt.value = dt;

    quadMesh.material = foamMaterial;
    gl.setRenderTarget(nextFoam.current);
    gl.render(simScene, simCamera);
    gl.setRenderTarget(null);

    // Swap
    const temp = currentFoam.current;
    currentFoam.current = nextFoam.current;
    nextFoam.current = temp;
  }, [gl, foamMaterial, quadMesh, simScene, simCamera]);

  const getFoamTexture = useCallback(() => {
    return currentFoam.current.texture;
  }, []);

  const reset = useCallback(() => {
    gl.setRenderTarget(foamTargetA);
    gl.clear();
    gl.setRenderTarget(foamTargetB);
    gl.clear();
    gl.setRenderTarget(null);
    currentFoam.current = foamTargetA;
    nextFoam.current = foamTargetB;
  }, [gl, foamTargetA, foamTargetB]);

  return { stepFoam, getFoamTexture, reset };
}
