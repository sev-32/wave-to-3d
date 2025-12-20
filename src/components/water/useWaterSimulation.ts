import { useRef, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  simulationVertexShader,
  dropFragmentShader,
  updateFragmentShader,
  normalFragmentShader,
  sphereDisplacementFragmentShader,
} from './shaders';

const TEXTURE_SIZE = 256;

export function useWaterSimulation() {
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

  // Current texture reference (ping-pong)
  const currentTarget = useRef(renderTargetA);
  const nextTarget = useRef(renderTargetB);

  // Fullscreen quad for simulation passes
  const quadGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(2, 2);
    return geo;
  }, []);

  // Shader materials
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

  const updateMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        tWater: { value: null },
        delta: { value: new THREE.Vector2(1 / TEXTURE_SIZE, 1 / TEXTURE_SIZE) },
      },
      vertexShader: simulationVertexShader,
      fragmentShader: updateFragmentShader,
      depthTest: false,
      depthWrite: false,
    });
  }, []);

  const normalMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        tWater: { value: null },
        delta: { value: new THREE.Vector2(1 / TEXTURE_SIZE, 1 / TEXTURE_SIZE) },
      },
      vertexShader: simulationVertexShader,
      fragmentShader: normalFragmentShader,
      depthTest: false,
      depthWrite: false,
    });
  }, []);

  const sphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        tWater: { value: null },
        oldCenter: { value: new THREE.Vector3() },
        newCenter: { value: new THREE.Vector3() },
        radius: { value: 0.25 },
      },
      vertexShader: simulationVertexShader,
      fragmentShader: sphereDisplacementFragmentShader,
      depthTest: false,
      depthWrite: false,
    });
  }, []);

  // Quad mesh for simulation
  const quadMesh = useMemo(() => {
    const mesh = new THREE.Mesh(quadGeometry, dropMaterial);
    return mesh;
  }, [quadGeometry, dropMaterial]);

  // Simulation camera
  const simCamera = useMemo(() => {
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    return camera;
  }, []);

  // Simulation scene
  const simScene = useMemo(() => {
    const scene = new THREE.Scene();
    scene.add(quadMesh);
    return scene;
  }, [quadMesh]);

  // Swap render targets
  const swapTargets = useCallback(() => {
    const temp = currentTarget.current;
    currentTarget.current = nextTarget.current;
    nextTarget.current = temp;
  }, []);

  // Render a simulation pass
  const renderPass = useCallback((material: THREE.ShaderMaterial) => {
    material.uniforms.tWater.value = currentTarget.current.texture;
    quadMesh.material = material;
    
    gl.setRenderTarget(nextTarget.current);
    gl.render(simScene, simCamera);
    gl.setRenderTarget(null);
    
    swapTargets();
  }, [gl, quadMesh, simScene, simCamera, swapTargets]);

  // Add a drop at the specified position
  const addDrop = useCallback((x: number, z: number, radius = 0.03, strength = 0.01) => {
    dropMaterial.uniforms.center.value.set((x + 1) * 0.5, (z + 1) * 0.5);
    dropMaterial.uniforms.radius.value = radius;
    dropMaterial.uniforms.strength.value = strength;
    renderPass(dropMaterial);
  }, [dropMaterial, renderPass]);

  // Move sphere in water
  const moveSphere = useCallback((oldPos: THREE.Vector3, newPos: THREE.Vector3, radius: number) => {
    sphereMaterial.uniforms.oldCenter.value.copy(oldPos);
    sphereMaterial.uniforms.newCenter.value.copy(newPos);
    sphereMaterial.uniforms.radius.value = radius;
    renderPass(sphereMaterial);
  }, [sphereMaterial, renderPass]);

  // Step simulation
  const stepSimulation = useCallback(() => {
    renderPass(updateMaterial);
  }, [updateMaterial, renderPass]);

  // Update normals
  const updateNormals = useCallback(() => {
    renderPass(normalMaterial);
  }, [normalMaterial, renderPass]);

  // Reset simulation
  const reset = useCallback(() => {
    const renderer = gl;
    renderer.setRenderTarget(renderTargetA);
    renderer.clear();
    renderer.setRenderTarget(renderTargetB);
    renderer.clear();
    renderer.setRenderTarget(null);
    currentTarget.current = renderTargetA;
    nextTarget.current = renderTargetB;
  }, [gl, renderTargetA, renderTargetB]);

  // Get current water texture
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
