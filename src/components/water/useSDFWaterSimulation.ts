import { useRef, useMemo, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  simulationVertexShader,
  dropFragmentShader,
  normalFragmentShader,
} from './shaders';
import {
  sdfWaterUpdateShader,
  sdfSphereMovementShader,
  sdfNormalShader,
  sdfSimulationVertexShader,
} from './shaders/sdfShaders';

const TEXTURE_SIZE = 256;

export function useSDFWaterSimulation() {
  const { gl } = useThree();

  // Ping-pong render targets for water simulation
  const renderTargetA = useMemo(() => {
    return new THREE.WebGLRenderTarget(TEXTURE_SIZE, TEXTURE_SIZE, {
      type: THREE.FloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      stencilBuffer: false,
      depthBuffer: false,
    });
  }, []);

  const renderTargetB = useMemo(() => {
    return new THREE.WebGLRenderTarget(TEXTURE_SIZE, TEXTURE_SIZE, {
      type: THREE.FloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      stencilBuffer: false,
      depthBuffer: false,
    });
  }, []);

  const currentTarget = useRef(renderTargetA);
  const nextTarget = useRef(renderTargetB);

  const quadGeometry = useMemo(() => new THREE.PlaneGeometry(2, 2), []);

  // Drop material (same as original - adds ripples)
  const dropMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        tWater: { value: null },
        center: { value: new THREE.Vector2(0.5, 0.5) },
        radius: { value: 0.03 },
        strength: { value: 0.01 },
      },
      vertexShader: simulationVertexShader,
      fragmentShader: dropFragmentShader,
      depthTest: false,
      depthWrite: false,
    });
  }, []);

  // SDF-based water update material (replaces simple wave equation)
  const updateMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        tWater: { value: null },
        tPrevWater: { value: null },
        delta: { value: new THREE.Vector2(1 / TEXTURE_SIZE, 1 / TEXTURE_SIZE) },
        sphereCenter: { value: new THREE.Vector3() },
        sphereVelocity: { value: new THREE.Vector3() },
        sphereRadius: { value: 0.25 },
        time: { value: 0 },
      },
      vertexShader: sdfSimulationVertexShader,
      fragmentShader: sdfWaterUpdateShader,
      depthTest: false,
      depthWrite: false,
    });
  }, []);

  // SDF normal calculation material
  const normalMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        tWater: { value: null },
        delta: { value: new THREE.Vector2(1 / TEXTURE_SIZE, 1 / TEXTURE_SIZE) },
        sphereCenter: { value: new THREE.Vector3() },
        sphereRadius: { value: 0.25 },
      },
      vertexShader: sdfSimulationVertexShader,
      fragmentShader: sdfNormalShader,
      depthTest: false,
      depthWrite: false,
    });
  }, []);

  // SDF sphere movement material
  const sphereMoveMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        tWater: { value: null },
        oldCenter: { value: new THREE.Vector3() },
        newCenter: { value: new THREE.Vector3() },
        velocity: { value: new THREE.Vector3() },
        radius: { value: 0.25 },
        time: { value: 0 },
      },
      vertexShader: sdfSimulationVertexShader,
      fragmentShader: sdfSphereMovementShader,
      depthTest: false,
      depthWrite: false,
    });
  }, []);

  const quadMesh = useMemo(() => {
    return new THREE.Mesh(quadGeometry, dropMaterial);
  }, [quadGeometry, dropMaterial]);

  const simCamera = useMemo(() => {
    return new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }, []);

  const simScene = useMemo(() => {
    const scene = new THREE.Scene();
    scene.add(quadMesh);
    return scene;
  }, [quadMesh]);

  const swapTargets = useCallback(() => {
    const temp = currentTarget.current;
    currentTarget.current = nextTarget.current;
    nextTarget.current = temp;
  }, []);

  const renderPass = useCallback((material: THREE.ShaderMaterial) => {
    material.uniforms.tWater.value = currentTarget.current.texture;
    quadMesh.material = material;

    gl.setRenderTarget(nextTarget.current);
    gl.render(simScene, simCamera);
    gl.setRenderTarget(null);

    swapTargets();
  }, [gl, quadMesh, simScene, simCamera, swapTargets]);

  const addDrop = useCallback((x: number, z: number, radius = 0.03, strength = 0.01) => {
    dropMaterial.uniforms.center.value.set((x + 1) * 0.5, (z + 1) * 0.5);
    dropMaterial.uniforms.radius.value = radius;
    dropMaterial.uniforms.strength.value = strength;
    renderPass(dropMaterial);
  }, [dropMaterial, renderPass]);

  const moveSphere = useCallback((
    oldPos: THREE.Vector3,
    newPos: THREE.Vector3,
    velocity: THREE.Vector3,
    radius: number,
    time: number
  ) => {
    sphereMoveMaterial.uniforms.oldCenter.value.copy(oldPos);
    sphereMoveMaterial.uniforms.newCenter.value.copy(newPos);
    sphereMoveMaterial.uniforms.velocity.value.copy(velocity);
    sphereMoveMaterial.uniforms.radius.value = radius;
    sphereMoveMaterial.uniforms.time.value = time;
    renderPass(sphereMoveMaterial);
  }, [sphereMoveMaterial, renderPass]);

  const stepSimulation = useCallback((
    sphereCenter: THREE.Vector3,
    sphereVelocity: THREE.Vector3,
    sphereRadius: number,
    time: number
  ) => {
    updateMaterial.uniforms.sphereCenter.value.copy(sphereCenter);
    updateMaterial.uniforms.sphereVelocity.value.copy(sphereVelocity);
    updateMaterial.uniforms.sphereRadius.value = sphereRadius;
    updateMaterial.uniforms.time.value = time;
    renderPass(updateMaterial);
  }, [updateMaterial, renderPass]);

  const updateNormals = useCallback((
    sphereCenter: THREE.Vector3,
    sphereRadius: number
  ) => {
    normalMaterial.uniforms.sphereCenter.value.copy(sphereCenter);
    normalMaterial.uniforms.sphereRadius.value = sphereRadius;
    renderPass(normalMaterial);
  }, [normalMaterial, renderPass]);

  const reset = useCallback(() => {
    gl.setRenderTarget(renderTargetA);
    gl.clear();
    gl.setRenderTarget(renderTargetB);
    gl.clear();
    gl.setRenderTarget(null);
    currentTarget.current = renderTargetA;
    nextTarget.current = renderTargetB;
  }, [gl, renderTargetA, renderTargetB]);

  const getWaterTexture = useCallback(() => {
    return currentTarget.current.texture;
  }, []);

  return {
    addDrop,
    moveSphere,
    stepSimulation,
    updateNormals,
    reset,
    getWaterTexture,
    renderTargetA,
    renderTargetB,
    currentTarget,
  };
}
