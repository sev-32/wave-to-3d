/**
 * WaterScene - Main water simulation scene component
 * Ported from GPTWAVES reference - WORKING IMPLEMENTATION
 */

import { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWaterSimulation } from './useWaterSimulation';
import { useCaustics } from './useCaustics';
import { createTileTexture, createSkyboxTexture } from './textures';
import {
  WATER_VERTEX_SHADER,
  WATER_FRAGMENT_SHADER_ABOVE,
  WATER_FRAGMENT_SHADER_UNDERWATER,
  CUBE_VERTEX_SHADER,
  CUBE_FRAGMENT_SHADER,
  SPHERE_VERTEX_SHADER,
  SPHERE_FRAGMENT_SHADER,
} from './shaders';

interface WaterSceneProps {
  onReady?: () => void;
}

const MODE_NONE = -1;
const MODE_ADD_DROPS = 0;
const MODE_MOVE_SPHERE = 1;

export function WaterScene({ onReady }: WaterSceneProps) {
  const { camera, gl, raycaster, pointer } = useThree();

  // Hooks
  const { addDrop, moveSphere, stepSimulation, updateNormals, reset, getTexture } = useWaterSimulation();
  const { texture: causticsTexture, updateCaustics } = useCaustics();

  // State
  const sphereCenterRef = useRef(new THREE.Vector3(-0.4, -0.75, 0.2));
  const oldSphereCenterRef = useRef(sphereCenterRef.current.clone());
  const sphereRadius = 0.25;
  const velocityRef = useRef(new THREE.Vector3());
  const lightDir = useMemo(() => new THREE.Vector3(2, 2, -1).normalize(), []);
  const isInitialized = useRef(false);

  // Interaction state
  const modeRef = useRef(MODE_NONE);
  const prevHitRef = useRef<THREE.Vector3 | null>(null);
  const planeNormalRef = useRef<THREE.Vector3 | null>(null);
  const isDraggingRef = useRef(false);

  // Textures
  const tileTexture = useMemo(() => createTileTexture(), []);
  const skyCubemap = useMemo(() => createSkyboxTexture(), []);

  // Geometry
  const waterGeometry = useMemo(() => new THREE.PlaneGeometry(2, 2, 200, 200), []);

  // Pool geometry - matches original GPTWAVES
  const poolGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const pickOctant = (i: number) =>
      new THREE.Vector3((i & 1) * 2 - 1, (i & 2) - 1, (i & 4) / 2 - 1);

    const faces: [number, number, number, number][] = [
      [0, 4, 2, 6], // -x
      [1, 3, 5, 7], // +x
      [2, 6, 3, 7], // +y (becomes pool bottom)
      [0, 2, 1, 3], // -z
      [4, 5, 6, 7], // +z
    ];

    const positions: number[] = [];
    const indices: number[] = [];

    for (let faceIndex = 0; faceIndex < faces.length; faceIndex++) {
      const base = faceIndex * 4;
      const [a, b, c, d] = faces[faceIndex];
      for (const corner of [a, b, c, d]) {
        const p = pickOctant(corner);
        positions.push(p.x, p.y, p.z);
      }
      indices.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }, []);

  const sphereGeometry = useMemo(() => new THREE.SphereGeometry(1, 32, 32), []);

  // Materials
  const waterMaterialAbove = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      water: { value: null },
      tiles: { value: tileTexture },
      causticTex: { value: causticsTexture },
      sky: { value: skyCubemap },
      eye: { value: new THREE.Vector3() },
      light: { value: lightDir.clone() },
      sphereCenter: { value: new THREE.Vector3() },
      sphereRadius: { value: sphereRadius },
    },
    vertexShader: WATER_VERTEX_SHADER,
    fragmentShader: WATER_FRAGMENT_SHADER_ABOVE,
    side: THREE.BackSide,
  }), [tileTexture, causticsTexture, skyCubemap, lightDir]);

  const waterMaterialUnderwater = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      water: { value: null },
      tiles: { value: tileTexture },
      causticTex: { value: causticsTexture },
      sky: { value: skyCubemap },
      eye: { value: new THREE.Vector3() },
      light: { value: lightDir.clone() },
      sphereCenter: { value: new THREE.Vector3() },
      sphereRadius: { value: sphereRadius },
    },
    vertexShader: WATER_VERTEX_SHADER,
    fragmentShader: WATER_FRAGMENT_SHADER_UNDERWATER,
    side: THREE.FrontSide,
  }), [tileTexture, causticsTexture, skyCubemap, lightDir]);

  const poolMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      water: { value: null },
      tiles: { value: tileTexture },
      causticTex: { value: causticsTexture },
      light: { value: lightDir.clone() },
      sphereCenter: { value: new THREE.Vector3() },
      sphereRadius: { value: sphereRadius },
    },
    vertexShader: CUBE_VERTEX_SHADER,
    fragmentShader: CUBE_FRAGMENT_SHADER,
    side: THREE.FrontSide,
  }), [tileTexture, causticsTexture, lightDir]);

  const sphereMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      water: { value: null },
      causticTex: { value: causticsTexture },
      light: { value: lightDir.clone() },
      sphereCenter: { value: new THREE.Vector3() },
      sphereRadius: { value: sphereRadius },
    },
    vertexShader: SPHERE_VERTEX_SHADER,
    fragmentShader: SPHERE_FRAGMENT_SHADER,
  }), [causticsTexture, lightDir]);

  // Initialize
  useEffect(() => {
    if (!isInitialized.current) {
      reset();
      for (let i = 0; i < 20; i++) {
        addDrop(Math.random() * 2 - 1, Math.random() * 2 - 1, 0.03, i % 2 === 0 ? 0.01 : -0.01);
      }
      isInitialized.current = true;
      onReady?.();
    }
  }, [addDrop, reset, onReady]);

  // Animation loop
  useFrame((_, delta) => {
    if (delta > 1) return;

    // Step simulation
    stepSimulation();
    stepSimulation();
    updateNormals();

    // Update caustics
    const waterTexture = getTexture();
    updateCaustics(waterTexture, lightDir, sphereCenterRef.current, sphereRadius);

    // Get eye position
    const eye = camera.position.clone();

    // Update all materials
    [waterMaterialAbove, waterMaterialUnderwater].forEach(mat => {
      mat.uniforms.water.value = waterTexture;
      mat.uniforms.causticTex.value = causticsTexture;
      mat.uniforms.eye.value.copy(eye);
      mat.uniforms.sphereCenter.value.copy(sphereCenterRef.current);
    });

    poolMaterial.uniforms.water.value = waterTexture;
    poolMaterial.uniforms.causticTex.value = causticsTexture;
    poolMaterial.uniforms.sphereCenter.value.copy(sphereCenterRef.current);

    sphereMaterial.uniforms.water.value = waterTexture;
    sphereMaterial.uniforms.causticTex.value = causticsTexture;
    sphereMaterial.uniforms.sphereCenter.value.copy(sphereCenterRef.current);

    // Sphere physics
    if (modeRef.current !== MODE_MOVE_SPHERE) {
      const gravity = new THREE.Vector3(0, -4, 0);
      velocityRef.current.add(gravity.clone().multiplyScalar(delta));
      const newCenter = sphereCenterRef.current.clone().add(velocityRef.current.clone().multiplyScalar(delta));

      const minY = -1 + sphereRadius;
      if (newCenter.y < minY) {
        newCenter.y = minY;
        velocityRef.current.y = -velocityRef.current.y * 0.3;
        velocityRef.current.x *= 0.9;
        velocityRef.current.z *= 0.9;
      }

      const wallBound = 1 - sphereRadius;
      if (Math.abs(newCenter.x) > wallBound) {
        newCenter.x = Math.sign(newCenter.x) * wallBound;
        velocityRef.current.x = -velocityRef.current.x * 0.3;
      }
      if (Math.abs(newCenter.z) > wallBound) {
        newCenter.z = Math.sign(newCenter.z) * wallBound;
        velocityRef.current.z = -velocityRef.current.z * 0.3;
      }

      newCenter.y = Math.min(10, newCenter.y);

      if (!newCenter.equals(oldSphereCenterRef.current)) {
        moveSphere(oldSphereCenterRef.current, newCenter, sphereRadius);
      }

      oldSphereCenterRef.current.copy(sphereCenterRef.current);
      sphereCenterRef.current.copy(newCenter);
    }
  }, -1);

  // Pointer handlers
  const handlePointerDown = useCallback((event: any) => {
    event.stopPropagation();
    isDraggingRef.current = true;

    raycaster.setFromCamera(pointer, camera);
    const ray = raycaster.ray;
    const spherePos = sphereCenterRef.current.clone();
    const boundingSphere = new THREE.Sphere(spherePos, sphereRadius);
    const intersectPoint = new THREE.Vector3();

    if (ray.intersectSphere(boundingSphere, intersectPoint)) {
      modeRef.current = MODE_MOVE_SPHERE;
      prevHitRef.current = intersectPoint.clone();
      planeNormalRef.current = camera.position.clone().sub(spherePos).normalize();
      velocityRef.current.set(0, 0, 0);
      return;
    }

    modeRef.current = MODE_ADD_DROPS;
    if (event.uv) {
      addDrop(event.uv.x * 2 - 1, event.uv.y * 2 - 1, 0.03, 0.02);
    }
  }, [camera, pointer, raycaster, addDrop]);

  const handlePointerMove = useCallback((event: any) => {
    if (!isDraggingRef.current) return;

    if (modeRef.current === MODE_ADD_DROPS && event.uv) {
      addDrop(event.uv.x * 2 - 1, event.uv.y * 2 - 1, 0.03, 0.01);
    } else if (modeRef.current === MODE_MOVE_SPHERE && prevHitRef.current && planeNormalRef.current) {
      raycaster.setFromCamera(pointer, camera);
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormalRef.current, prevHitRef.current);
      const nextHit = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, nextHit);

      if (nextHit) {
        const delta = nextHit.clone().sub(prevHitRef.current);
        sphereCenterRef.current.add(delta);
        sphereCenterRef.current.x = Math.max(-1 + sphereRadius, Math.min(1 - sphereRadius, sphereCenterRef.current.x));
        sphereCenterRef.current.y = Math.max(-1 + sphereRadius, Math.min(10, sphereCenterRef.current.y));
        sphereCenterRef.current.z = Math.max(-1 + sphereRadius, Math.min(1 - sphereRadius, sphereCenterRef.current.z));
        prevHitRef.current = nextHit;
        moveSphere(oldSphereCenterRef.current, sphereCenterRef.current, sphereRadius);
        oldSphereCenterRef.current.copy(sphereCenterRef.current);
      }
    }
  }, [camera, pointer, raycaster, addDrop, moveSphere]);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
    modeRef.current = MODE_NONE;
  }, []);

  return (
    <group onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
      <mesh geometry={waterGeometry} material={waterMaterialAbove} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} />
      <mesh geometry={waterGeometry} material={waterMaterialUnderwater} />
      <mesh geometry={poolGeometry} material={poolMaterial} />
      <mesh geometry={sphereGeometry} material={sphereMaterial} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} />
    </group>
  );
}
