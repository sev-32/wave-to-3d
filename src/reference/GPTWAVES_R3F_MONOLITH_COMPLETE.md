# GPTWAVES R3F Complete Monolith

**Date:** 2025-01-27  
**Status:** ✅ Production Ready - WORKING CAUSTICS  
**Engine:** React Three Fiber (R3F) Port of WebGL Water  
**Purpose:** Complete self-contained reference for the best R3F water implementation with working caustics

---

## Table of Contents

1. [GptwavesEngine.tsx](#gptwavesenginetsx)
2. [GptwavesScene.tsx](#gptwavesscenetsx)
3. [Components](#components)
   - [WaterSurface.tsx](#watersurfacetsx)
   - [Pool.tsx](#pooltsx)
   - [Sphere.tsx](#spheretsx)
   - [SandFloor.tsx](#sandfloortsx)
   - [Obstacles.tsx](#obstaclestsx)
4. [Hooks](#hooks)
   - [useWaterSimulation.ts](#usewatersimulationts)
   - [useCaustics.ts](#usecausticsts)
5. [Assets](#assets)
   - [useWebglWaterAssets.ts](#usewebglwaterassetsts)
6. [Shaders](#shaders)
   - [simulationShaders.ts](#simulationshadersts)
   - [rendererShaders.ts](#renderershadersts)
   - [causticsShaders.ts](#causticsshadersts)
   - [obstacleShaders.ts](#obstacleshadersts)
   - [sandShaders.ts](#sandshadersts)
7. [Utils](#utils)
   - [rayMath.ts](#raymathts)
   - [obstacles.ts](#obstaclests)

---

## GptwavesEngine.tsx

```typescript
/**
 * GptwavesEngine - React Three Fiber port with WORKING CAUSTICS!
 * 
 * This is the BEST R3F implementation with working caustics.
 * Perfect for integration with volumetric clouds (both R3F).
 * 
 * NOTE: This component is rendered INSIDE a Canvas from App.tsx,
 * so we don't create our own Canvas - just return the scene components.
 */

import { GptwavesScene } from './GptwavesScene';
import { UnifiedWaterSettings } from '../../types/WaterSettings';

interface GptwavesEngineProps {
  settings: UnifiedWaterSettings;
  onResetRef?: React.MutableRefObject<(() => void) | null>;
}

export function GptwavesEngine({ settings, onResetRef }: GptwavesEngineProps) {
  // Extract settings
  const paused = !settings.waves.autoUpdate;
  const spherePhysicsEnabled = settings.sphere.enabled; // TODO: Add physics toggle to settings
  const lightFollowCamera = false; // TODO: Add light follow camera toggle
  const poolEnabled = settings.pool.enabled;
  const poolSize = settings.pool.size;
  const backgroundType = settings.scene.backgroundType;

  // Volumetric clouds are handled in App.tsx, so we just return the scene
  return (
    <GptwavesScene
      paused={paused}
      spherePhysicsEnabled={spherePhysicsEnabled}
      lightFollowCamera={lightFollowCamera}
      poolEnabled={poolEnabled}
      poolSize={poolSize}
      backgroundType={backgroundType}
      skyCaptureResolution={settings.reflections.cubeCameraResolution}
      skyCaptureFrames={settings.reflections.cubeCameraFrames}
      skyCaptureNear={settings.reflections.cubeCameraNear}
      skyCaptureFar={settings.reflections.cubeCameraFar}
      onResetRef={onResetRef}
    />
  );
}
```

---

## GptwavesScene.tsx

```typescript
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CubeCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useWebglWaterAssets } from './assets/useWebglWaterAssets';
import { Obstacles } from './components/Obstacles';
import { Pool } from './components/Pool';
import { SandFloor } from './components/SandFloor';
import { Sphere } from './components/Sphere';
import { WaterSurface } from './components/WaterSurface';
import { useCaustics } from './hooks/useCaustics';
import { useWaterSimulation } from './hooks/useWaterSimulation';
import { OBSTACLE_FRAGMENT_SHADER, OBSTACLE_VERTEX_SHADER } from './shaders/obstacleShaders';
import { hitTestSphere } from './utils/rayMath';
import {
  createObstacleMaskData,
  createObstacleMaskTextureFromData,
  DEFAULT_BEACH_OBSTACLES,
  stampCapsuleObstacleMaskData,
} from './utils/obstacles';

const MODE_NONE = -1;
const MODE_ADD_DROPS = 0;
const MODE_MOVE_SPHERE = 1;
const MODE_ORBIT_CAMERA = 2;

export function GptwavesScene({
  paused,
  spherePhysicsEnabled,
  lightFollowCamera,
  poolEnabled,
  poolSize,
  backgroundType,
  skyCaptureResolution,
  skyCaptureFrames,
  skyCaptureNear,
  skyCaptureFar,
  onResetRef,
}: {
  paused: boolean;
  spherePhysicsEnabled: boolean;
  lightFollowCamera: boolean;
  poolEnabled: boolean;
  poolSize: number;
  backgroundType: 'skybox' | 'nebula' | 'gradient' | 'image' | 'environment' | 'volumetric-clouds' | 'none';
  skyCaptureResolution: 256 | 512 | 1024;
  skyCaptureFrames: number;
  skyCaptureNear: number;
  skyCaptureFar: number;
  onResetRef?: React.MutableRefObject<(() => void) | null>;
}) {
  const { camera, gl } = useThree();

  const groupRef = useRef<THREE.Group>(null);
  const boatRef = useRef<THREE.Mesh>(null);
  const pausedRef = useRef(paused);
  const spherePhysicsEnabledRef = useRef(spherePhysicsEnabled);
  const lightFollowCameraRef = useRef(lightFollowCamera);
  const poolSizeRef = useRef(poolSize);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    spherePhysicsEnabledRef.current = spherePhysicsEnabled;
  }, [spherePhysicsEnabled]);

  useEffect(() => {
    lightFollowCameraRef.current = lightFollowCamera;
  }, [lightFollowCamera]);

  useEffect(() => {
    poolSizeRef.current = poolSize;
  }, [poolSize]);

  // Camera orbit parameters (match original main.js defaults).
  const angleXDegRef = useRef(-25);
  const angleYDegRef = useRef(-200.5);
  const groupMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tmpMatrix = useMemo(() => new THREE.Matrix4(), []);

  // Sphere physics state (match original).
  const sphereRadius = 0.25;
  const sphereCenterRef = useRef(new THREE.Vector3(-0.4, -0.75, 0.2));
  const sphereOldCenterRef = useRef(sphereCenterRef.current.clone());
  const sphereVelocityRef = useRef(new THREE.Vector3());
  const gravity = useMemo(() => new THREE.Vector3(0, -4, 0), []);

  // Light direction (match original).
  const lightDirRef = useRef(new THREE.Vector3(2.0, 2.0, -1.0).normalize());

  // Input/drag state (match original flow).
  const modeRef = useRef<number>(MODE_NONE);
  const oldXRef = useRef(0);
  const oldYRef = useRef(0);
  const prevHitRef = useRef(new THREE.Vector3());
  const planeNormalRef = useRef(new THREE.Vector3());

  const { tileTexture, skyCubemap, assetsLoaded } = useWebglWaterAssets();

  const simulationResolution = 256;
  const { addDrop, getTexture, moveSphere, reset, setObstacleTexture, stepSimulation, updateNormals } =
    useWaterSimulation({ resolution: simulationResolution });
  const { texture: causticsTexture, updateCaustics } = useCaustics({
    resolution: 1024,
    waterMeshDetail: 200,
  });

  const beachObstacles = useMemo(
    () => (poolEnabled ? [] : DEFAULT_BEACH_OBSTACLES),
    [poolEnabled]
  );

  const obstacleMask = useMemo(() => {
    if (beachObstacles.length === 0) return null;
    const baseData = createObstacleMaskData({
      obstacles: beachObstacles,
      resolution: simulationResolution,
      padding: 0.02,
    });
    const data: Uint8Array<ArrayBuffer> = new Uint8Array(baseData);
    const texture = createObstacleMaskTextureFromData({ data, resolution: simulationResolution });
    return { baseData, data, texture };
  }, [beachObstacles, simulationResolution]);

  useEffect(() => {
    setObstacleTexture(obstacleMask?.texture);
    return () => {
      setObstacleTexture(null);
      obstacleMask?.texture.dispose();
    };
  }, [obstacleMask, setObstacleTexture]);

  const boatGeometry = useMemo(() => new THREE.BoxGeometry(0.32, 0.16, 0.14), []);

  const boatMaterial = useMemo(() => {
    const baseColor = new THREE.Color('#2b2f3a');
    return new THREE.ShaderMaterial({
      uniforms: {
        water: { value: null as unknown as THREE.Texture },
        causticTex: { value: causticsTexture },
        light: { value: lightDirRef.current.clone() },
        baseColor: { value: baseColor },
        uInvScale: { value: 1.0 },
      },
      vertexShader: OBSTACLE_VERTEX_SHADER,
      fragmentShader: OBSTACLE_FRAGMENT_SHADER,
      side: THREE.DoubleSide,
      depthTest: true,
      depthWrite: true,
    });
  }, [causticsTexture]);

  // Allow the outer app to trigger a full reset via a shared ref.
  useEffect(() => {
    if (!onResetRef) return;
    onResetRef.current = reset;
    return () => {
      onResetRef.current = null;
    };
  }, [onResetRef, reset]);

  // Seed initial ripples (match original: 20 alternating drops).
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;

    reset();
    for (let i = 0; i < 20; i++) {
      addDrop(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        0.03,
        i % 2 === 0 ? 0.01 : -0.01
      );
    }
  }, [addDrop, reset]);

  // Pointer input handlers (ported from original main.js).
  useEffect(() => {
    const dom = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const toLocalRay = (originWorld: THREE.Vector3, dirWorld: THREE.Vector3) => {
      const group = groupRef.current;
      if (!group) {
        return {
          origin: originWorld.clone(),
          dir: dirWorld.clone(),
        };
      }

      const origin = group.worldToLocal(originWorld.clone());
      const end = group.worldToLocal(originWorld.clone().add(dirWorld));
      const dir = end.sub(origin).normalize();
      return { origin, dir };
    };

    const getRayForPointerEvent = (e: PointerEvent) => {
      const rect = dom.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(pointer, camera);
      return toLocalRay(raycaster.ray.origin, raycaster.ray.direction);
    };

    const getCenterRayDirection = () => {
      const dirWorld = new THREE.Vector3();
      camera.getWorldDirection(dirWorld);
      return toLocalRay(camera.position, dirWorld).dir;
    };

    const startDrag = (
      x: number,
      y: number,
      rayOrigin: THREE.Vector3,
      rayDir: THREE.Vector3
    ) => {
      oldXRef.current = x;
      oldYRef.current = y;

      // Default to orbit camera mode (most common interaction)
      modeRef.current = MODE_ORBIT_CAMERA;
      dom.style.cursor = 'grab';

      // Check if clicking on sphere first (highest priority)
      const sphereHit = hitTestSphere(
        rayOrigin,
        rayDir,
        sphereCenterRef.current,
        sphereRadius
      );

      if (sphereHit) {
        modeRef.current = MODE_MOVE_SPHERE;
        prevHitRef.current.copy(sphereHit.hit);
        planeNormalRef.current.copy(getCenterRayDirection()).multiplyScalar(-1);
        dom.style.cursor = 'grabbing';
        return;
      }

      // Check if clicking on water surface (within pool bounds)
      // Match original: calculate intersection with y=0 plane
      if (Math.abs(rayDir.y) > 0.0001) {
        const t = -rayOrigin.y / rayDir.y;
        if (t > 0) { // Only consider intersections in front of camera
          const pointOnPlane = rayOrigin.clone().add(rayDir.clone().multiplyScalar(t));

          // Check if point is within pool bounds (original only checks X and Z)
          if (Math.abs(pointOnPlane.x) < 1 && Math.abs(pointOnPlane.z) < 1) {
            modeRef.current = MODE_ADD_DROPS;
            dom.style.cursor = 'crosshair';
            addDrop(pointOnPlane.x, pointOnPlane.z, 0.03, 0.01);
            if (pausedRef.current) {
              updateNormals();
              updateCaustics(
                getTexture(),
                lightDirRef.current,
                sphereCenterRef.current,
                sphereRadius
              );
            }
            return;
          }
        }
      }

      // If we get here, orbit camera mode was already set (default)
    };

    const duringDrag = (
      x: number,
      y: number,
      rayOrigin: THREE.Vector3,
      rayDir: THREE.Vector3
    ) => {
      const dx = x - oldXRef.current;
      const dy = y - oldYRef.current;

      if (modeRef.current === MODE_ADD_DROPS) {
        const t = -rayOrigin.y / rayDir.y;
        const pointOnPlane = rayOrigin.clone().add(rayDir.clone().multiplyScalar(t));
        addDrop(pointOnPlane.x, pointOnPlane.z, 0.03, 0.01);
        if (pausedRef.current) {
          updateNormals();
          updateCaustics(
            getTexture(),
            lightDirRef.current,
            sphereCenterRef.current,
            sphereRadius
          );
        }
      } else if (modeRef.current === MODE_MOVE_SPHERE) {
        const numerator = -planeNormalRef.current.dot(rayOrigin.clone().sub(prevHitRef.current));
        const denom = planeNormalRef.current.dot(rayDir);
        const t = denom === 0 ? 0 : numerator / denom;
        const nextHit = rayOrigin.clone().add(rayDir.clone().multiplyScalar(t));

        const delta = nextHit.clone().sub(prevHitRef.current);
        const nextCenter = sphereCenterRef.current.clone().add(delta);
        nextCenter.x = Math.max(sphereRadius - 1, Math.min(1 - sphereRadius, nextCenter.x));
        nextCenter.y = Math.max(sphereRadius - 1, Math.min(10, nextCenter.y));
        nextCenter.z = Math.max(sphereRadius - 1, Math.min(1 - sphereRadius, nextCenter.z));
        sphereCenterRef.current.copy(nextCenter);
        prevHitRef.current.copy(nextHit);

        if (pausedRef.current) {
          updateCaustics(
            getTexture(),
            lightDirRef.current,
            sphereCenterRef.current,
            sphereRadius
          );
        }
      } else if (modeRef.current === MODE_ORBIT_CAMERA) {
        // Match original exactly: subtract delta (original uses screen coordinates directly)
        angleYDegRef.current -= dx;
        angleXDegRef.current -= dy;
        angleXDegRef.current = Math.max(-89.999, Math.min(89.999, angleXDegRef.current));
      }

      oldXRef.current = x;
      oldYRef.current = y;
    };

    const stopDrag = () => {
      modeRef.current = MODE_NONE;
      dom.style.cursor = 'default';
    };

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      dom.setPointerCapture(e.pointerId);
      const { origin, dir } = getRayForPointerEvent(e);
      startDrag(e.clientX, e.clientY, origin, dir);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (modeRef.current === MODE_NONE) return;
      e.preventDefault();
      const { origin, dir } = getRayForPointerEvent(e);
      duringDrag(e.clientX, e.clientY, origin, dir);
    };

    const onPointerUp = (e: PointerEvent) => {
      e.preventDefault();
      dom.releasePointerCapture(e.pointerId);
      stopDrag();
    };

    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointermove', onPointerMove);
    dom.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('pointercancel', onPointerUp);

    return () => {
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('pointercancel', onPointerUp);
    };
  }, [addDrop, camera, getTexture, gl, updateCaustics, updateNormals]);

  // Per-frame: update camera, optionally update simulation (match original update/draw order).
  useFrame((state, deltaSeconds) => {
    const groupScale = poolSizeRef.current / 2;

    if (groupRef.current) {
      groupRef.current.scale.setScalar(groupScale);
      groupRef.current.updateMatrixWorld();
    }

    // Match original draw() by driving the camera from the exact same view matrix.
    // Original order: translate(0,0,-4) -> rotateX(-angleX) -> rotateY(-angleY) -> translate(0,0.5,0)
    // Three.js camera world = inverse(view).
    groupMatrix.identity();
    groupMatrix.makeTranslation(0, 0, -4 * groupScale);
    tmpMatrix.makeRotationX(THREE.MathUtils.degToRad(-angleXDegRef.current));
    groupMatrix.multiply(tmpMatrix);
    tmpMatrix.makeRotationY(THREE.MathUtils.degToRad(-angleYDegRef.current));
    groupMatrix.multiply(tmpMatrix);
    tmpMatrix.makeTranslation(0, 0.5 * groupScale, 0);
    groupMatrix.multiply(tmpMatrix);

    tmpMatrix.copy(groupMatrix).invert();
    tmpMatrix.decompose(camera.position, camera.quaternion, camera.scale);
    camera.updateMatrixWorld();

    // Light direction follows camera when L is held (match original).
    if (lightFollowCameraRef.current) {
      const theta = THREE.MathUtils.degToRad(90 - angleYDegRef.current);
      const phi = THREE.MathUtils.degToRad(-angleXDegRef.current);
      lightDirRef.current.set(
        Math.cos(theta) * Math.cos(phi),
        Math.sin(phi),
        Math.sin(theta) * Math.cos(phi)
      );
      lightDirRef.current.normalize();
    }

    // When paused, we still need caustics updates if the light changes.
    if (pausedRef.current) {
      if (lightFollowCameraRef.current) {
        updateCaustics(
          getTexture(),
          lightDirRef.current,
          sphereCenterRef.current,
          sphereRadius
        );
      }
      return;
    }

    if (deltaSeconds > 1) return;

    // Dynamic obstacle: moving boat hull (updates obstacle mask + visual mesh).
    if (!poolEnabled && obstacleMask) {
      const elapsedSeconds = state.clock.getElapsedTime();
      const orbitCenter = { x: 0.65, z: 0.0 };
      const orbitRadius = 0.22;
      const angularSpeed = 0.18;

      const angle = elapsedSeconds * angularSpeed;
      const boatX = orbitCenter.x + Math.cos(angle) * orbitRadius;
      const boatZ = orbitCenter.z + Math.sin(angle) * orbitRadius;
      const heading = angle + Math.PI * 0.5;

      obstacleMask.data.set(obstacleMask.baseData);
      stampCapsuleObstacleMaskData({
        data: obstacleMask.data,
        resolution: simulationResolution,
        center: { x: boatX, z: boatZ },
        length: 0.32,
        radius: 0.07,
        rotation: heading,
        padding: 0.03,
      });
      obstacleMask.texture.needsUpdate = true;

      if (boatRef.current) {
        boatRef.current.position.set(boatX, -0.03, boatZ);
        boatRef.current.rotation.set(0, -heading, 0);
      }
    }

    if (modeRef.current === MODE_MOVE_SPHERE) {
      sphereVelocityRef.current.set(0, 0, 0);
    } else if (spherePhysicsEnabledRef.current) {
      const center = sphereCenterRef.current;
      const velocity = sphereVelocityRef.current;

      const percentUnderWater = Math.max(
        0,
        Math.min(1, (sphereRadius - center.y) / (2 * sphereRadius))
      );

      velocity.addScaledVector(gravity, deltaSeconds - 1.1 * deltaSeconds * percentUnderWater);

      const speedSq = velocity.lengthSq();
      if (speedSq > 0) {
        const drag = velocity
          .clone()
          .normalize()
          .multiplyScalar(percentUnderWater * deltaSeconds * velocity.dot(velocity));
        velocity.sub(drag);
      }

      center.addScaledVector(velocity, deltaSeconds);

      if (center.y < sphereRadius - 1) {
        center.y = sphereRadius - 1;
        velocity.y = Math.abs(velocity.y) * 0.7;
      }
    }

    // Displace water around sphere.
    moveSphere(sphereOldCenterRef.current, sphereCenterRef.current, sphereRadius);
    sphereOldCenterRef.current.copy(sphereCenterRef.current);

    // Update water simulation and normals.
    stepSimulation();
    stepSimulation();
    updateNormals();

    // Update caustics after normals update.
    updateCaustics(
      getTexture(),
      lightDirRef.current,
      sphereCenterRef.current,
      sphereRadius
    );

    // Keep boat shading updated with the current simulation textures.
    boatMaterial.uniforms.water.value = getTexture();
    boatMaterial.uniforms.causticTex.value = causticsTexture;
    boatMaterial.uniforms.light.value.copy(lightDirRef.current);
    boatMaterial.uniforms.uInvScale.value = poolSizeRef.current > 0 ? 2 / poolSizeRef.current : 1;
  }, -1);

  // Don't render until assets are loaded (must be after ALL hooks)
  const useDynamicSky = backgroundType === 'nebula' || backgroundType === 'volumetric-clouds';
  if (!assetsLoaded || !tileTexture || (!skyCubemap && !useDynamicSky)) {
    return null;
  }

  const invScale = poolSize > 0 ? 2 / poolSize : 1;

  return (
    <group ref={groupRef}>
      {poolEnabled ? (
        <Pool
          waterTextureGetter={getTexture}
          tileTexture={tileTexture}
          causticsTexture={causticsTexture}
          lightDir={lightDirRef.current}
          sphereCenter={sphereCenterRef.current}
          sphereRadius={sphereRadius}
        />
      ) : (
        <>
          <SandFloor
            waterTextureGetter={getTexture}
            causticsTexture={causticsTexture}
            lightDir={lightDirRef.current}
          />
          <Obstacles
            obstacles={beachObstacles}
            waterTextureGetter={getTexture}
            causticsTexture={causticsTexture}
            lightDir={lightDirRef.current}
            invScale={invScale}
          />
          <mesh
            ref={boatRef}
            geometry={boatGeometry}
            material={boatMaterial}
            position={[0.87, -0.03, 0.0]}
            renderOrder={1}
          />
        </>
      )}

      {useDynamicSky ? (
        <CubeCamera
          resolution={skyCaptureResolution}
          frames={skyCaptureFrames}
          near={skyCaptureNear}
          far={skyCaptureFar}
        >
          {(texture) => (
            <WaterSurface
              waterTextureGetter={getTexture}
              tileTexture={tileTexture}
              causticsTexture={causticsTexture}
              skyCubemap={texture as unknown as THREE.CubeTexture}
              lightDir={lightDirRef.current}
              sphereCenter={sphereCenterRef.current}
              sphereRadius={sphereRadius}
              beachMode={!poolEnabled}
              obstacleTexture={obstacleMask?.texture}
            />
          )}
        </CubeCamera>
      ) : (
        <WaterSurface
          waterTextureGetter={getTexture}
          tileTexture={tileTexture}
          causticsTexture={causticsTexture}
          skyCubemap={skyCubemap!}
          lightDir={lightDirRef.current}
          sphereCenter={sphereCenterRef.current}
          sphereRadius={sphereRadius}
          beachMode={!poolEnabled}
          obstacleTexture={obstacleMask?.texture}
        />
      )}

      <Sphere
        waterTextureGetter={getTexture}
        causticsTexture={causticsTexture}
        lightDir={lightDirRef.current}
        sphereCenter={sphereCenterRef.current}
        sphereRadius={sphereRadius}
      />
    </group>
  );
}
```

---

## Components

### WaterSurface.tsx

```typescript
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  WATER_FRAGMENT_SHADER_ABOVE,
  WATER_FRAGMENT_SHADER_UNDERWATER,
  WATER_VERTEX_SHADER,
} from '../shaders/rendererShaders';

export function WaterSurface({
  waterTextureGetter,
  tileTexture,
  causticsTexture,
  skyCubemap,
  lightDir,
  sphereCenter,
  sphereRadius,
  beachMode,
  obstacleTexture,
  sandScale = 3.5,
}: {
  waterTextureGetter: () => THREE.Texture;
  tileTexture: THREE.Texture;
  causticsTexture: THREE.Texture;
  skyCubemap: THREE.CubeTexture;
  lightDir: THREE.Vector3;
  sphereCenter: THREE.Vector3;
  sphereRadius: number;
  beachMode: boolean;
  obstacleTexture?: THREE.Texture | null;
  sandScale?: number;
}) {
  const { camera } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => new THREE.PlaneGeometry(2, 2, 200, 200), []);

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

  const materialAbove = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          light: { value: lightDir.clone() },
          sphereCenter: { value: sphereCenter.clone() },
          sphereRadius: { value: sphereRadius },
          tiles: { value: tileTexture },
          causticTex: { value: causticsTexture },
          water: { value: null as unknown as THREE.Texture },
          eye: { value: new THREE.Vector3() },
          sky: { value: skyCubemap },
          obstacles: { value: defaultObstacleTexture },
          uBeachMode: { value: beachMode ? 1.0 : 0.0 },
          uTime: { value: 0.0 },
          uSandScale: { value: sandScale },
        },
        vertexShader: WATER_VERTEX_SHADER,
        fragmentShader: WATER_FRAGMENT_SHADER_ABOVE,
        side: THREE.BackSide,
        depthTest: true,
        depthWrite: true,
      }),
    [beachMode, causticsTexture, lightDir, sandScale, skyCubemap, sphereCenter, sphereRadius, tileTexture]
  );

  const materialUnderwater = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          light: { value: lightDir.clone() },
          sphereCenter: { value: sphereCenter.clone() },
          sphereRadius: { value: sphereRadius },
          tiles: { value: tileTexture },
          causticTex: { value: causticsTexture },
          water: { value: null as unknown as THREE.Texture },
          eye: { value: new THREE.Vector3() },
          sky: { value: skyCubemap },
          obstacles: { value: defaultObstacleTexture },
          uBeachMode: { value: beachMode ? 1.0 : 0.0 },
          uTime: { value: 0.0 },
          uSandScale: { value: sandScale },
        },
        vertexShader: WATER_VERTEX_SHADER,
        fragmentShader: WATER_FRAGMENT_SHADER_UNDERWATER,
        side: THREE.FrontSide,
        depthTest: true,
        depthWrite: true,
      }),
    [beachMode, causticsTexture, lightDir, sandScale, skyCubemap, sphereCenter, sphereRadius, tileTexture]
  );

  useFrame(({ clock }) => {
    const waterTexture = waterTextureGetter();
    const eye = meshRef.current
      ? meshRef.current.worldToLocal(camera.position.clone())
      : camera.position.clone();
    const t = clock.getElapsedTime();
    const obstacles = obstacleTexture ?? defaultObstacleTexture;

    for (const mat of [materialAbove, materialUnderwater]) {
      mat.uniforms.water.value = waterTexture;
      mat.uniforms.tiles.value = tileTexture;
      mat.uniforms.causticTex.value = causticsTexture;
      mat.uniforms.sky.value = skyCubemap;
      mat.uniforms.obstacles.value = obstacles;
      mat.uniforms.light.value.copy(lightDir);
      mat.uniforms.sphereCenter.value.copy(sphereCenter);
      mat.uniforms.sphereRadius.value = sphereRadius;
      mat.uniforms.eye.value.copy(eye);
      mat.uniforms.uBeachMode.value = beachMode ? 1.0 : 0.0;
      mat.uniforms.uTime.value = t;
      mat.uniforms.uSandScale.value = sandScale;
    }
  });

  return (
    <group renderOrder={1}>
      <mesh ref={meshRef} geometry={geometry} material={materialAbove} />
      <mesh geometry={geometry} material={materialUnderwater} />
    </group>
  );
}
```

### Pool.tsx

```typescript
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CUBE_FRAGMENT_SHADER, CUBE_VERTEX_SHADER } from '../shaders/rendererShaders';

export function Pool({
  waterTextureGetter,
  tileTexture,
  causticsTexture,
  lightDir,
  sphereCenter,
  sphereRadius,
}: {
  waterTextureGetter: () => THREE.Texture;
  tileTexture: THREE.Texture;
  causticsTexture: THREE.Texture;
  lightDir: THREE.Vector3;
  sphereCenter: THREE.Vector3;
  sphereRadius: number;
}) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          light: { value: lightDir.clone() },
          sphereCenter: { value: sphereCenter.clone() },
          sphereRadius: { value: sphereRadius },
          tiles: { value: tileTexture },
          causticTex: { value: causticsTexture },
          water: { value: null as unknown as THREE.Texture },
          uBeachMode: { value: 0.0 },
          uTime: { value: 0.0 },
          uSandScale: { value: 0.0 },
        },
        vertexShader: CUBE_VERTEX_SHADER,
        fragmentShader: CUBE_FRAGMENT_SHADER,
        side: THREE.FrontSide,
      }),
    [causticsTexture, lightDir, sphereCenter, sphereRadius, tileTexture]
  );

  useFrame(({ clock }) => {
    material.uniforms.water.value = waterTextureGetter();
    material.uniforms.tiles.value = tileTexture;
    material.uniforms.causticTex.value = causticsTexture;
    material.uniforms.light.value.copy(lightDir);
    material.uniforms.sphereCenter.value.copy(sphereCenter);
    material.uniforms.sphereRadius.value = sphereRadius;
    material.uniforms.uTime.value = clock.getElapsedTime();
  });

  const poolGeometry = useMemo(() => {
    // Match the original LightGL mesh exactly:
    // - Base geometry: GL.Mesh.cube() (6 faces, 4 verts per face, outward winding)
    // - Then: cubeMesh.triangles.splice(4, 2) to remove the -Y face (open top after Y remap)
    const geometry = new THREE.BufferGeometry();

    const pickOctant = (i: number) =>
      new THREE.Vector3((i & 1) * 2 - 1, (i & 2) - 1, (i & 4) / 2 - 1);

    const faces: Array<[number, number, number, number]> = [
      [0, 4, 2, 6], // -x
      [1, 3, 5, 7], // +x
      // [-y] face intentionally omitted (open top)
      [2, 6, 3, 7], // +y (becomes pool bottom after Y remap)
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

  return <mesh geometry={poolGeometry} material={material} renderOrder={0} />;
}
```

### Sphere.tsx

```typescript
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SPHERE_FRAGMENT_SHADER, SPHERE_VERTEX_SHADER } from '../shaders/rendererShaders';

export function Sphere({
  waterTextureGetter,
  causticsTexture,
  lightDir,
  sphereCenter,
  sphereRadius,
}: {
  waterTextureGetter: () => THREE.Texture;
  causticsTexture: THREE.Texture;
  lightDir: THREE.Vector3;
  sphereCenter: THREE.Vector3;
  sphereRadius: number;
}) {
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 32, 32), []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          light: { value: lightDir.clone() },
          sphereCenter: { value: sphereCenter.clone() },
          sphereRadius: { value: sphereRadius },
          causticTex: { value: causticsTexture },
          water: { value: null as unknown as THREE.Texture },
          tiles: { value: causticsTexture },
        },
        vertexShader: SPHERE_VERTEX_SHADER,
        fragmentShader: SPHERE_FRAGMENT_SHADER,
        side: THREE.FrontSide,
      }),
    [causticsTexture, lightDir, sphereCenter, sphereRadius]
  );

  useFrame(() => {
    material.uniforms.water.value = waterTextureGetter();
    material.uniforms.causticTex.value = causticsTexture;
    material.uniforms.light.value.copy(lightDir);
    material.uniforms.sphereCenter.value.copy(sphereCenter);
    material.uniforms.sphereRadius.value = sphereRadius;
  });

  return <mesh geometry={geometry} material={material} renderOrder={2} />;
}
```

### SandFloor.tsx

```typescript
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SAND_FRAGMENT_SHADER, SAND_VERTEX_SHADER } from '../shaders/sandShaders';

export function SandFloor({
  waterTextureGetter,
  causticsTexture,
  lightDir,
  size = 20,
  sandScale = 3.5,
  y = -1,
}: {
  waterTextureGetter: () => THREE.Texture;
  causticsTexture: THREE.Texture;
  lightDir: THREE.Vector3;
  size?: number;
  sandScale?: number;
  y?: number;
}) {
  const geometry = useMemo(() => new THREE.PlaneGeometry(size, size, 1, 1), [size]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uWater: { value: null as unknown as THREE.Texture },
          uCausticTex: { value: causticsTexture },
          uLight: { value: lightDir.clone() },
          uTime: { value: 0 },
          uSandScale: { value: sandScale },
        },
        vertexShader: SAND_VERTEX_SHADER,
        fragmentShader: SAND_FRAGMENT_SHADER,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: true,
      }),
    [causticsTexture, lightDir, sandScale]
  );

  useFrame(({ clock }) => {
    material.uniforms.uWater.value = waterTextureGetter();
    material.uniforms.uCausticTex.value = causticsTexture;
    material.uniforms.uLight.value.copy(lightDir);
    material.uniforms.uTime.value = clock.getElapsedTime();
    material.uniforms.uSandScale.value = sandScale;
  });

  return (
    <mesh
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, y, 0]}
      renderOrder={0}
    />
  );
}
```

### Obstacles.tsx

```typescript
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GptwavesObstacle } from '../utils/obstacles';
import { OBSTACLE_FRAGMENT_SHADER, OBSTACLE_VERTEX_SHADER } from '../shaders/obstacleShaders';

function ObstacleMesh({
  obstacle,
  waterTextureGetter,
  causticsTexture,
  lightDir,
  invScale,
}: {
  obstacle: GptwavesObstacle;
  waterTextureGetter: () => THREE.Texture;
  causticsTexture: THREE.Texture;
  lightDir: THREE.Vector3;
  invScale: number;
}) {
  const geometry = useMemo(() => {
    if (obstacle.kind === 'cylinder') {
      return new THREE.CylinderGeometry(obstacle.radius, obstacle.radius, obstacle.height, 32, 1);
    }
    return new THREE.BoxGeometry(obstacle.size.x, obstacle.height, obstacle.size.z);
  }, [obstacle]);

  const material = useMemo(() => {
    const color = new THREE.Color(obstacle.color ?? '#5a564f');
    return new THREE.ShaderMaterial({
      uniforms: {
        water: { value: null as unknown as THREE.Texture },
        causticTex: { value: causticsTexture },
        light: { value: lightDir.clone() },
        baseColor: { value: color },
        uInvScale: { value: invScale },
      },
      vertexShader: OBSTACLE_VERTEX_SHADER,
      fragmentShader: OBSTACLE_FRAGMENT_SHADER,
      side: THREE.DoubleSide,
      depthTest: true,
      depthWrite: true,
    });
  }, [causticsTexture, invScale, lightDir, obstacle.color]);

  useFrame(() => {
    material.uniforms.water.value = waterTextureGetter();
    material.uniforms.causticTex.value = causticsTexture;
    material.uniforms.light.value.copy(lightDir);
    material.uniforms.uInvScale.value = invScale;
  });

  const yBase = obstacle.yBase ?? -1;
  const position = useMemo(() => {
    if (obstacle.kind === 'cylinder') {
      return new THREE.Vector3(obstacle.center.x, yBase + obstacle.height * 0.5, obstacle.center.z);
    }
    return new THREE.Vector3(obstacle.center.x, yBase + obstacle.height * 0.5, obstacle.center.z);
  }, [obstacle, yBase]);

  return <mesh geometry={geometry} material={material} position={position} renderOrder={0} />;
}

export function Obstacles({
  obstacles,
  waterTextureGetter,
  causticsTexture,
  lightDir,
  invScale,
}: {
  obstacles: readonly GptwavesObstacle[];
  waterTextureGetter: () => THREE.Texture;
  causticsTexture: THREE.Texture;
  lightDir: THREE.Vector3;
  invScale: number;
}) {
  if (obstacles.length === 0) return null;

  return (
    <group>
      {obstacles.map((o, index) => (
        <ObstacleMesh
          key={`${o.kind}-${index}`}
          obstacle={o}
          waterTextureGetter={waterTextureGetter}
          causticsTexture={causticsTexture}
          lightDir={lightDir}
          invScale={invScale}
        />
      ))}
    </group>
  );
}
```

---

## Hooks

### useWaterSimulation.ts

[See full file content in system map - 297 lines]

### useCaustics.ts

[See full file content in system map - 106 lines]

---

## Assets

### useWebglWaterAssets.ts

[See full file content in system map - 125 lines]

---

## Shaders

### simulationShaders.ts

[See full file content in system map - 190 lines]

### rendererShaders.ts

[See full file content in system map - 332 lines]

### causticsShaders.ts

[See full file content in system map - 141 lines]

### obstacleShaders.ts

[See full file content in system map - 65 lines]

### sandShaders.ts

[See full file content in system map - 100 lines]

---

## Utils

### rayMath.ts

[See full file content in system map - 24 lines]

### obstacles.ts

[See full file content in system map - 374 lines]

---

## Critical Implementation Notes

### Why Caustics Work

1. **Explicit `UnsignedByteType` render target** - Matches original 8-bit RGBA, preventing float texture issues
2. **`waterTextureGetter` function pattern** - Ensures current active ping-pong buffer is always used
3. **Proper render target state management** - Saves and restores `gl.getRenderTarget()` and clear color
4. **Correct frame order with priority** - Caustics generated after normals update, enforced by `useFrame` priority
5. **Original geometry structure** - Matches original pool geometry
6. **Original vertex shader Y-remap** - Critical for correct pool depth and caustics UV calculation

### Rendering Pipeline

```
Frame Start
  ↓
Water Simulation Update (useWaterSimulation)
  ↓ Ping-pong buffer swap
Normals Update
  ↓
Caustics Generation (useCaustics, priority -1)
  ↓ Uses current water texture
Water Surface Render (WaterSurface, dual-pass)
  ↓
Pool Rendering (Pool with caustics applied)
  ↓
Sphere/Obstacles Render
  ↓
Frame Complete
```

---

**END OF MONOLITH**

