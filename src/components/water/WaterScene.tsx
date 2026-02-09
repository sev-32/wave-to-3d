import { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSDFWaterSimulation } from './useSDFWaterSimulation';
import { useCaustics } from './useCaustics';
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

// Interaction modes
const MODE_ADD_DROPS = 0;
const MODE_MOVE_SPHERE = 1;

export function WaterScene({ onReady }: WaterSceneProps) {
  const { camera, gl, raycaster, pointer } = useThree();

  // SDF water simulation + caustics hooks
  const waterSim = useSDFWaterSimulation();
  const caustics = useCaustics();

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

  // Water surface geometry (200x200 grid matching original)
  const waterGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(2, 2, 200, 200);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  // Water material for above-water view (FRONT side = looking down from above)
  const waterMaterialAbove = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        tWater: { value: null },
        tTiles: { value: tileTexture },
        tCaustics: { value: null },
        tSky: { value: skyboxTexture },
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

  // Water material for below-water view (BACK side = looking up from underwater)
  const waterMaterialBelow = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        tWater: { value: null },
        tTiles: { value: tileTexture },
        tCaustics: { value: null },
        tSky: { value: skyboxTexture },
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

  // Pool geometry - box matching original cube shader
  // Original: position.y = ((1.0 - gl_Vertex.y) * (7.0 / 12.0) - 1.0) * poolHeight
  // This maps vertex y from [-1,1] to pool coords [-1, 2/12]
  // We use a BoxGeometry and position it so the pool extends from y=-1 to y=0
  const poolGeometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(2, 1, 2);
    // Shift so top is at y=0 and bottom is at y=-1
    geo.translate(0, -0.5, 0);
    return geo;
  }, []);

  // Pool material - rendered with BACK face (looking from inside/through walls)
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

  // Sphere geometry and material
  const sphereGeometry = useMemo(() => {
    return new THREE.IcosahedronGeometry(1, 3);
  }, []);

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

  // Sphere mesh ref for raycasting
  const sphereMeshRef = useRef<THREE.Mesh>(null);
  const waterMeshRef = useRef<THREE.Mesh>(null);

  // Initialize with some drops (matching original: 20 drops)
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

  // Animation loop - matches original update() and draw()
  useFrame((state, delta) => {
    if (delta > 1) return;
    timeRef.current += delta;

    // Sphere physics (matching original buoyancy model)
    if (modeRef.current === MODE_MOVE_SPHERE) {
      velocityRef.current.set(0, 0, 0);
    } else if (useSpherePhysics.current) {
      const percentUnderWater = Math.max(0, Math.min(1,
        (sphereRadius - sphereCenterRef.current.y) / (2 * sphereRadius)
      ));

      // Gravity with buoyancy
      const gravity = new THREE.Vector3(0, -4, 0);
      velocityRef.current.add(
        gravity.clone().multiplyScalar(delta - 1.1 * delta * percentUnderWater)
      );

      // Water drag
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

      // Collision with pool bottom
      if (newCenter.y < sphereRadius - 1) {
        newCenter.y = sphereRadius - 1;
        velocityRef.current.y = Math.abs(velocityRef.current.y) * 0.7;
      }

      // Collision with pool walls
      const wallBound = 1 - sphereRadius;
      newCenter.x = Math.max(-wallBound, Math.min(wallBound, newCenter.x));
      newCenter.z = Math.max(-wallBound, Math.min(wallBound, newCenter.z));
      newCenter.y = Math.min(10, newCenter.y);

      sphereCenterRef.current.copy(newCenter);
    }

    // Move sphere in water (SDF-based)
    waterSim.moveSphere(
      oldSphereCenter.current,
      sphereCenterRef.current,
      velocityRef.current,
      sphereRadius,
      timeRef.current
    );
    oldSphereCenter.current.copy(sphereCenterRef.current);

    // Step simulation twice (matching original: water.stepSimulation() x2)
    waterSim.stepSimulation(sphereCenterRef.current, velocityRef.current, sphereRadius, timeRef.current);
    waterSim.stepSimulation(sphereCenterRef.current, velocityRef.current, sphereRadius, timeRef.current);
    waterSim.updateNormals(sphereCenterRef.current, sphereRadius);

    // Update caustics
    const waterTexture = waterSim.getWaterTexture();
    caustics.updateCaustics(waterTexture, sphereCenterRef.current, sphereRadius, lightDir);
    const causticsTexture = caustics.getCausticsTexture();

    // Get camera position
    const cameraPos = camera.position.clone();

    // Update water materials
    [waterMaterialAbove, waterMaterialBelow].forEach(mat => {
      mat.uniforms.tWater.value = waterTexture;
      mat.uniforms.tCaustics.value = causticsTexture;
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

  // Handle pointer down - determine interaction mode
  const handlePointerDown = useCallback((event: any) => {
    event.stopPropagation();
    isDraggingRef.current = true;

    // Check if clicking on sphere
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

    // Otherwise, add a drop at the water surface
    modeRef.current = MODE_ADD_DROPS;
    if (event.uv) {
      const x = event.uv.x * 2 - 1;
      const z = event.uv.y * 2 - 1;
      waterSim.addDrop(x, z, 0.03, 0.01);
    }
  }, [camera, pointer, raycaster, waterSim]);

  // Handle pointer move
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

          // Clamp to bounds
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

  // Handle pointer up
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

      {/* Water Surface - Below view (underwater looking up) */}
      <mesh
        geometry={waterGeometry}
        material={waterMaterialBelow}
        position={[0, 0, 0]}
      />

      {/* Pool Walls with caustics */}
      <mesh
        geometry={poolGeometry}
        material={poolMaterial}
        position={[0, 0, 0]}
      />

      {/* Draggable Sphere */}
      <mesh
        ref={sphereMeshRef}
        geometry={sphereGeometry}
        material={sphereMaterial}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
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

// Create a procedural skybox canvas with sun
function createSkyboxCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Sky gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#0d1f33');
  gradient.addColorStop(0.3, '#1e3a5f');
  gradient.addColorStop(0.6, '#3d6b99');
  gradient.addColorStop(1, '#87CEEB');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Sun glow
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

  // Clouds
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
