/**
 * Water Simulation Hook for React Three Fiber
 * Ported from GPTWAVES reference - WORKING IMPLEMENTATION
 * 
 * CRITICAL: Uses ping-pong buffers with proper state management
 */

import { useRef, useMemo, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  SIMULATION_VERTEX_SHADER,
  DROP_FRAGMENT_SHADER,
  UPDATE_FRAGMENT_SHADER,
  NORMAL_FRAGMENT_SHADER,
  SPHERE_DISPLACEMENT_FRAGMENT_SHADER,
} from './shaders';

interface UseWaterSimulationOptions {
  resolution?: number;
}

export function useWaterSimulation({ resolution = 256 }: UseWaterSimulationOptions = {}) {
  const { gl } = useThree();

  // Determine best texture type for platform
  const textureType = useMemo(() => {
    const ctx = gl.getContext() as WebGL2RenderingContext;
    const ext = ctx.getExtension('OES_texture_float');
    const extLinear = ctx.getExtension('OES_texture_float_linear');
    if (ext && extLinear) return THREE.FloatType;
    return THREE.HalfFloatType;
  }, [gl]);

  // Ping-pong render targets
  const textureA = useMemo(
    () =>
      new THREE.WebGLRenderTarget(resolution, resolution, {
        type: textureType,
        format: THREE.RGBAFormat,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        stencilBuffer: false,
        depthBuffer: false,
      }),
    [resolution, textureType]
  );

  const textureB = useMemo(
    () =>
      new THREE.WebGLRenderTarget(resolution, resolution, {
        type: textureType,
        format: THREE.RGBAFormat,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        stencilBuffer: false,
        depthBuffer: false,
      }),
    [resolution, textureType]
  );

  // Current buffer tracking
  const currentRef = useRef<'A' | 'B'>('A');

  // Obstacle texture ref
  const obstacleTextureRef = useRef<THREE.Texture | null>(null);

  // Default obstacle texture (all white = no obstacles)
  const defaultObstacleTexture = useMemo(() => {
    const data = new Uint8Array([255, 255, 255, 255]);
    const tex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return tex;
  }, []);

  // Fullscreen quad geometry
  const quadGeometry = useMemo(() => new THREE.PlaneGeometry(2, 2), []);

  // Orthographic camera for simulation passes
  const quadCamera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);

  // Simulation scene
  const quadScene = useMemo(() => new THREE.Scene(), []);

  // Quad mesh (material will be swapped per pass)
  const quadMesh = useMemo(() => {
    const mesh = new THREE.Mesh(quadGeometry);
    quadScene.add(mesh);
    return mesh;
  }, [quadGeometry, quadScene]);

  // Shader materials
  const dropMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          texture: { value: null },
          center: { value: new THREE.Vector2() },
          radius: { value: 0.03 },
          strength: { value: 0.01 },
        },
        vertexShader: SIMULATION_VERTEX_SHADER,
        fragmentShader: DROP_FRAGMENT_SHADER,
        depthTest: false,
        depthWrite: false,
      }),
    []
  );

  const updateMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          texture: { value: null },
          delta: { value: new THREE.Vector2(1 / resolution, 1 / resolution) },
          obstacles: { value: defaultObstacleTexture },
        },
        vertexShader: SIMULATION_VERTEX_SHADER,
        fragmentShader: UPDATE_FRAGMENT_SHADER,
        depthTest: false,
        depthWrite: false,
      }),
    [resolution, defaultObstacleTexture]
  );

  const normalMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          texture: { value: null },
          delta: { value: new THREE.Vector2(1 / resolution, 1 / resolution) },
        },
        vertexShader: SIMULATION_VERTEX_SHADER,
        fragmentShader: NORMAL_FRAGMENT_SHADER,
        depthTest: false,
        depthWrite: false,
      }),
    [resolution]
  );

  const sphereMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          texture: { value: null },
          oldCenter: { value: new THREE.Vector3() },
          newCenter: { value: new THREE.Vector3() },
          radius: { value: 0.25 },
        },
        vertexShader: SIMULATION_VERTEX_SHADER,
        fragmentShader: SPHERE_DISPLACEMENT_FRAGMENT_SHADER,
        depthTest: false,
        depthWrite: false,
      }),
    []
  );

  // Get current and next targets
  const getTargets = useCallback(() => {
    const current = currentRef.current === 'A' ? textureA : textureB;
    const next = currentRef.current === 'A' ? textureB : textureA;
    return { current, next };
  }, [textureA, textureB]);

  // Swap buffers
  const swap = useCallback(() => {
    currentRef.current = currentRef.current === 'A' ? 'B' : 'A';
  }, []);

  // Render a simulation pass
  const renderPass = useCallback(
    (material: THREE.ShaderMaterial) => {
      const { current, next } = getTargets();
      material.uniforms.texture.value = current.texture;
      quadMesh.material = material;

      const previousTarget = gl.getRenderTarget();
      gl.setRenderTarget(next);
      gl.render(quadScene, quadCamera);
      gl.setRenderTarget(previousTarget);

      swap();
    },
    [getTargets, gl, quadCamera, quadMesh, quadScene, swap]
  );

  // Add a drop at the specified position
  const addDrop = useCallback(
    (x: number, z: number, radius = 0.03, strength = 0.01) => {
      dropMaterial.uniforms.center.value.set((x + 1) * 0.5, (z + 1) * 0.5);
      dropMaterial.uniforms.radius.value = radius;
      dropMaterial.uniforms.strength.value = strength;
      renderPass(dropMaterial);
    },
    [dropMaterial, renderPass]
  );

  // Move sphere in water
  const moveSphere = useCallback(
    (oldCenter: THREE.Vector3, newCenter: THREE.Vector3, radius: number) => {
      sphereMaterial.uniforms.oldCenter.value.copy(oldCenter);
      sphereMaterial.uniforms.newCenter.value.copy(newCenter);
      sphereMaterial.uniforms.radius.value = radius;
      renderPass(sphereMaterial);
    },
    [sphereMaterial, renderPass]
  );

  // Step simulation
  const stepSimulation = useCallback(() => {
    updateMaterial.uniforms.obstacles.value =
      obstacleTextureRef.current ?? defaultObstacleTexture;
    renderPass(updateMaterial);
  }, [updateMaterial, renderPass, defaultObstacleTexture]);

  // Update normals
  const updateNormals = useCallback(() => {
    renderPass(normalMaterial);
  }, [normalMaterial, renderPass]);

  // Reset simulation
  const reset = useCallback(() => {
    const previousTarget = gl.getRenderTarget();
    const previousClearColor = gl.getClearColor(new THREE.Color());
    const previousClearAlpha = gl.getClearAlpha();

    gl.setClearColor(0x000000, 0);

    gl.setRenderTarget(textureA);
    gl.clear(true, false, false);
    gl.setRenderTarget(textureB);
    gl.clear(true, false, false);

    gl.setRenderTarget(previousTarget);
    gl.setClearColor(previousClearColor, previousClearAlpha);

    currentRef.current = 'A';
  }, [gl, textureA, textureB]);

  // Get current water texture - CRITICAL: returns current active buffer
  const getTexture = useCallback(() => {
    const { current } = getTargets();
    return current.texture;
  }, [getTargets]);

  // Set obstacle texture
  const setObstacleTexture = useCallback((texture: THREE.Texture | null) => {
    obstacleTextureRef.current = texture;
  }, []);

  return {
    addDrop,
    moveSphere,
    stepSimulation,
    updateNormals,
    reset,
    getTexture,
    setObstacleTexture,
  };
}
