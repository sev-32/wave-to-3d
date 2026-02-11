import { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSDFWaterSimulation } from './useSDFWaterSimulation';
import { useCaustics } from './useCaustics';
import { useFoamSimulation } from './useFoamSimulation';
import { SprayParticles } from './SprayParticles';
import { createTileTexture, createSkyboxTexture } from './textures';
import {
  waterSurfaceVertexShader,
  waterSurfaceFragmentShaderAbove,
  waterSurfaceFragmentShaderBelow,
  poolFragmentShader,
  poolVertexShader,
  sphereVertexShader,
  sphereFragmentShader,
} from './shaders';

interface WaterSceneProps {
  onReady?: () => void;
}

const MODE_ADD_DROPS = 0;
const MODE_MOVE_SPHERE = 1;

export function WaterScene({ onReady }: WaterSceneProps) {
  const { camera, gl, raycaster, pointer } = useThree();

  const waterSim = useSDFWaterSimulation();
  const caustics = useCaustics();
  const foamSim = useFoamSimulation();

  // State refs
  const sphereCenterRef = useRef(new THREE.Vector3(-0.4, -0.75, 0.2));
  const oldSphereCenter = useRef(new THREE.Vector3(-0.4, -0.75, 0.2));
  const sphereRadius = 0.25;
  const velocityRef = useRef(new THREE.Vector3());
  const lightDir = useMemo(() => new THREE.Vector3(2, 2, -1).normalize(), []);
  const isInitialized = useRef(false);
  const useSpherePhysics = useRef(false);
  const timeRef = useRef(0);

  // Interaction state
  const modeRef = useRef(-1);
  const prevHitRef = useRef<THREE.Vector3 | null>(null);
  const planeNormalRef = useRef<THREE.Vector3 | null>(null);
  const isDraggingRef = useRef(false);

  // Textures
  const tileTexture = useMemo(() => createTileTexture(), []);
  const skyboxTexture = useMemo(() => createSkyboxTexture(), []);

  // Water surface geometry
  const waterGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(2, 2, 200, 200);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  // Water material for above-water view
  const waterMaterialAbove = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        tWater: { value: null },
        tTiles: { value: tileTexture },
        tCaustics: { value: null },
        tSky: { value: skyboxTexture },
        tFoam: { value: null },
        eye: { value: new THREE.Vector3() },
        light: { value: lightDir },
        sphereCenter: { value: new THREE.Vector3() },
        sphereRadius: { value: sphereRadius },
      },
      vertexShader: waterSurfaceVertexShader,
      fragmentShader: waterSurfaceFragmentShaderAbove,
      side: THREE.FrontSide,
    });
  }, [tileTexture, skyboxTexture, lightDir]);

  // Water material for below-water view
  const waterMaterialBelow = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        tWater: { value: null },
        tTiles: { value: tileTexture },
        tCaustics: { value: null },
        tSky: { value: skyboxTexture },
        tFoam: { value: null },
        eye: { value: new THREE.Vector3() },
        light: { value: lightDir },
        sphereCenter: { value: new THREE.Vector3() },
        sphereRadius: { value: sphereRadius },
      },
      vertexShader: waterSurfaceVertexShader,
      fragmentShader: waterSurfaceFragmentShaderBelow,
      side: THREE.BackSide,
    });
  }, [tileTexture, skyboxTexture, lightDir]);

  // Pool geometry
  const poolGeometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(2, 1, 2);
    geo.translate(0, -0.5, 0);
    return geo;
  }, []);

  const poolMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        tWater: { value: null },
        tTiles: { value: tileTexture },
        tCaustics: { value: null },
        light: { value: lightDir },
        sphereCenter: { value: new THREE.Vector3() },
        sphereRadius: { value: sphereRadius },
      },
      vertexShader: poolVertexShader,
      fragmentShader: poolFragmentShader,
      side: THREE.BackSide,
    });
  }, [tileTexture, lightDir]);

  // Sphere
  const sphereGeometry = useMemo(() => new THREE.IcosahedronGeometry(1, 3), []);
  const sphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        tWater: { value: null },
        tCaustics: { value: null },
        light: { value: lightDir },
        sphereCenter: { value: new THREE.Vector3() },
        sphereRadius: { value: sphereRadius },
      },
      vertexShader: sphereVertexShader,
      fragmentShader: sphereFragmentShader,
    });
  }, [lightDir]);

  const sphereMeshRef = useRef<THREE.Mesh>(null);
  const waterMeshRef = useRef<THREE.Mesh>(null);

  // Initialize
  useEffect(() => {
    if (!isInitialized.current) {
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * 2 - 1;
        const z = Math.random() * 2 - 1;
        const strength = (i & 1) ? 0.01 : -0.01;
        waterSim.addDrop(x, z, 0.03, strength);
      }
      waterSim.updateNormals(sphereCenterRef.current, sphereRadius);
      isInitialized.current = true;
      onReady?.();
    }
  }, [waterSim, onReady]);

  // Animation loop
  useFrame((state, delta) => {
    if (delta > 1) return;
    timeRef.current += delta;

    // Sphere physics
    if (modeRef.current === MODE_MOVE_SPHERE) {
      velocityRef.current.set(0, 0, 0);
    } else if (useSpherePhysics.current) {
      const percentUnderWater = Math.max(0, Math.min(1,
        (sphereRadius - sphereCenterRef.current.y) / (2 * sphereRadius)
      ));

      const gravity = new THREE.Vector3(0, -4, 0);
      velocityRef.current.add(
        gravity.clone().multiplyScalar(delta - 1.1 * delta * percentUnderWater)
      );

      const speed = velocityRef.current.length();
      if (speed > 0.001) {
        const dragForce = velocityRef.current.clone().normalize().multiplyScalar(
          percentUnderWater * delta * velocityRef.current.dot(velocityRef.current)
        );
        velocityRef.current.sub(dragForce);
      }

      const newCenter = sphereCenterRef.current.clone().add(
        velocityRef.current.clone().multiplyScalar(delta)
      );

      if (newCenter.y < sphereRadius - 1) {
        newCenter.y = sphereRadius - 1;
        velocityRef.current.y = Math.abs(velocityRef.current.y) * 0.7;
      }

      const wallBound = 1 - sphereRadius;
      newCenter.x = Math.max(-wallBound, Math.min(wallBound, newCenter.x));
      newCenter.z = Math.max(-wallBound, Math.min(wallBound, newCenter.z));
      newCenter.y = Math.min(10, newCenter.y);

      sphereCenterRef.current.copy(newCenter);
    }

    // SDF sphere movement in water
    waterSim.moveSphere(
      oldSphereCenter.current,
      sphereCenterRef.current,
      velocityRef.current,
      sphereRadius,
      timeRef.current
    );
    oldSphereCenter.current.copy(sphereCenterRef.current);

    // Step water simulation (x2 for stability)
    waterSim.stepSimulation(sphereCenterRef.current, velocityRef.current, sphereRadius, timeRef.current);
    waterSim.stepSimulation(sphereCenterRef.current, velocityRef.current, sphereRadius, timeRef.current);
    waterSim.updateNormals(sphereCenterRef.current, sphereRadius);

    const waterTexture = waterSim.getWaterTexture();

    // Step foam simulation
    foamSim.stepFoam(
      waterTexture,
      sphereCenterRef.current,
      velocityRef.current,
      sphereRadius,
      delta
    );
    const foamTexture = foamSim.getFoamTexture();

    // Update caustics
    caustics.updateCaustics(waterTexture, sphereCenterRef.current, sphereRadius, lightDir);
    const causticsTexture = caustics.getCausticsTexture();

    const cameraPos = camera.position.clone();

    // Update water materials (including foam texture)
    [waterMaterialAbove, waterMaterialBelow].forEach(mat => {
      mat.uniforms.tWater.value = waterTexture;
      mat.uniforms.tCaustics.value = causticsTexture;
      mat.uniforms.tFoam.value = foamTexture;
      mat.uniforms.eye.value.copy(cameraPos);
      mat.uniforms.sphereCenter.value.copy(sphereCenterRef.current);
    });

    // Update pool material
    poolMaterial.uniforms.tWater.value = waterTexture;
    poolMaterial.uniforms.tCaustics.value = causticsTexture;
    poolMaterial.uniforms.sphereCenter.value.copy(sphereCenterRef.current);

    // Update sphere material
    sphereMaterial.uniforms.tWater.value = waterTexture;
    sphereMaterial.uniforms.tCaustics.value = causticsTexture;
    sphereMaterial.uniforms.sphereCenter.value.copy(sphereCenterRef.current);
  });

  // Interaction handlers
  const handlePointerDown = useCallback((event: any) => {
    event.stopPropagation();
    isDraggingRef.current = true;

    if (sphereMeshRef.current) {
      raycaster.setFromCamera(pointer, camera);
      const spherePos = sphereCenterRef.current.clone();
      const boundingSphere = new THREE.Sphere(spherePos, sphereRadius);
      const ray = raycaster.ray;
      const intersectPoint = new THREE.Vector3();

      if (ray.intersectSphere(boundingSphere, intersectPoint)) {
        modeRef.current = MODE_MOVE_SPHERE;
        prevHitRef.current = intersectPoint.clone();
        planeNormalRef.current = camera.position.clone().sub(spherePos).normalize();
        velocityRef.current.set(0, 0, 0);
        return;
      }
    }

    modeRef.current = MODE_ADD_DROPS;
    if (event.uv) {
      const x = event.uv.x * 2 - 1;
      const z = event.uv.y * 2 - 1;
      waterSim.addDrop(x, z, 0.03, 0.01);
    }
  }, [camera, pointer, raycaster, waterSim]);

  const handlePointerMove = useCallback((event: any) => {
    if (!isDraggingRef.current) return;

    switch (modeRef.current) {
      case MODE_ADD_DROPS: {
        if (event.uv) {
          const x = event.uv.x * 2 - 1;
          const z = event.uv.y * 2 - 1;
          waterSim.addDrop(x, z, 0.03, 0.01);
        }
        break;
      }
      case MODE_MOVE_SPHERE: {
        if (!prevHitRef.current || !planeNormalRef.current) break;

        raycaster.setFromCamera(pointer, camera);
        const ray = raycaster.ray;

        const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
          planeNormalRef.current,
          prevHitRef.current
        );
        const nextHit = new THREE.Vector3();
        ray.intersectPlane(plane, nextHit);

        if (nextHit) {
          const moveDelta = nextHit.clone().sub(prevHitRef.current);
          sphereCenterRef.current.add(moveDelta);

          const wallBound = 1 - sphereRadius;
          sphereCenterRef.current.x = Math.max(-wallBound, Math.min(wallBound, sphereCenterRef.current.x));
          sphereCenterRef.current.y = Math.max(sphereRadius - 1, Math.min(10, sphereCenterRef.current.y));
          sphereCenterRef.current.z = Math.max(-wallBound, Math.min(wallBound, sphereCenterRef.current.z));

          prevHitRef.current = nextHit;
        }
        break;
      }
    }
  }, [camera, pointer, raycaster, waterSim]);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
    modeRef.current = -1;
  }, []);

  return (
    <group onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
      {/* Water Surface - Above view */}
      <mesh
        ref={waterMeshRef}
        geometry={waterGeometry}
        material={waterMaterialAbove}
        position={[0, 0, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      />

      {/* Water Surface - Below view */}
      <mesh
        geometry={waterGeometry}
        material={waterMaterialBelow}
        position={[0, 0, 0]}
      />

      {/* Pool Walls */}
      <mesh
        geometry={poolGeometry}
        material={poolMaterial}
        position={[0, 0, 0]}
      />

      {/* Sphere */}
      <mesh
        ref={sphereMeshRef}
        geometry={sphereGeometry}
        material={sphereMaterial}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      />

      {/* Spray Particles */}
      <SprayParticles
        waterTexture={waterSim.getWaterTexture()}
        sphereCenter={sphereCenterRef.current}
        sphereVelocity={velocityRef.current}
        sphereRadius={sphereRadius}
        lightDir={lightDir}
      />

      {/* Skybox */}
      <mesh>
        <sphereGeometry args={[50, 32, 32]} />
        <meshBasicMaterial side={THREE.BackSide}>
          <canvasTexture attach="map" image={createSkyboxCanvas()} />
        </meshBasicMaterial>
      </mesh>

      {/* Sun sprite */}
      <sprite position={lightDir.clone().multiplyScalar(40)}>
        <spriteMaterial
          color="#fff8e0"
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
    </group>
  );
}

function createSkyboxCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#0d1f33');
  gradient.addColorStop(0.3, '#1e3a5f');
  gradient.addColorStop(0.6, '#3d6b99');
  gradient.addColorStop(1, '#87CEEB');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const sunX = canvas.width * 0.7;
  const sunY = canvas.height * 0.25;
  const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 150);
  sunGradient.addColorStop(0, 'rgba(255, 250, 220, 1)');
  sunGradient.addColorStop(0.1, 'rgba(255, 240, 180, 0.9)');
  sunGradient.addColorStop(0.3, 'rgba(255, 200, 100, 0.4)');
  sunGradient.addColorStop(0.6, 'rgba(255, 150, 50, 0.1)');
  sunGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
  ctx.fillStyle = sunGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * canvas.width;
    const y = canvas.height * 0.2 + Math.random() * canvas.height * 0.3;
    const w = 80 + Math.random() * 150;
    const h = 20 + Math.random() * 40;
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}
