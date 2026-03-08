import { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWebGPUWater } from './useWebGPUWater';
import { useWaterSimulation } from './useWaterSimulation';
import { useCaustics } from './useCaustics';
import { useFallbackParticles } from './useFallbackParticles';
import { createTileTexture, createSkyboxTexture } from './textures';
import { ParticleRenderer } from './ParticleRenderer';
import { MAX_PARTICLES } from './webgpu';
import {
  waterSurfaceVertexShader,
  waterSurfaceFragmentShaderAbove,
  waterSurfaceFragmentShaderBelow,
  poolFragmentShader,
  poolVertexShader,
  sphereVertexShader,
  sphereFragmentShader,
  heatmapVertexShader,
  heatmapFragmentShader,
} from './shaders';

interface WaterSceneProps {
  onReady?: () => void;
  showHeatmap?: boolean;
  onWebGPUStatus?: (status: boolean) => void;
  onSphereDragChange?: (dragging: boolean) => void;
  paused?: boolean;
  sphereStartY?: number;
  sphereHeld?: boolean;
  onSphereImpact?: () => void;
}

const MODE_ADD_DROPS = 0;
const MODE_MOVE_SPHERE = 1;

export function WaterScene({ 
  onReady, showHeatmap = false, onWebGPUStatus, onSphereDragChange,
  paused = false, sphereStartY, sphereHeld = false, onSphereImpact,
}: WaterSceneProps) {
  const { camera, gl, raycaster, pointer } = useThree();
  
  const webgpu = useWebGPUWater();
  const webglSim = useWaterSimulation();
  const caustics = useCaustics();
  
  const useGPU = webgpu.isWebGPU && webgpu.isReady;
  
  const initialY = sphereStartY ?? -0.5;
  const sphereCenterRef = useRef(new THREE.Vector3(0, initialY, 0));
  const oldSphereCenter = useRef(new THREE.Vector3(0, initialY, 0));
  const sphereRadius = 0.25;
  const velocityRef = useRef(new THREE.Vector3());
  const lightDir = useMemo(() => new THREE.Vector3(2, 2, -1).normalize(), []);
  const isInitialized = useRef(false);
  const timeRef = useRef(0);
  const hasImpacted = useRef(false);
  
  const modeRef = useRef(-1);
  const prevHitRef = useRef<THREE.Vector3 | null>(null);
  const planeNormalRef = useRef<THREE.Vector3 | null>(null);
  const isDraggingRef = useRef(false);
  
  const tileTexture = useMemo(() => createTileTexture(), []);
  const skyboxTexture = useMemo(() => createSkyboxTexture(), []);
  
  // Reset sphere position when sphereStartY changes
  useEffect(() => {
    if (sphereStartY !== undefined) {
      sphereCenterRef.current.set(0, sphereStartY, 0);
      oldSphereCenter.current.set(0, sphereStartY, 0);
      velocityRef.current.set(0, 0, 0);
      hasImpacted.current = false;
    }
  }, [sphereStartY]);
  
  useEffect(() => {
    if (webgpu.isReady) {
      onWebGPUStatus?.(webgpu.isWebGPU);
    }
  }, [webgpu.isReady, webgpu.isWebGPU, onWebGPUStatus]);
  
  const waterGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(2, 2, 200, 200);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);
  
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
  
  const heatmapMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        tWater: { value: null },
        tFields: { value: null },
        tFields2: { value: null },
        time: { value: 0 },
        opacity: { value: 0.7 },
      },
      vertexShader: heatmapVertexShader,
      fragmentShader: heatmapFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, []);
  
  const sphereMeshRef = useRef<THREE.Mesh>(null);
  const waterMeshRef = useRef<THREE.Mesh>(null);
  
  // Initialize
  useEffect(() => {
    if (!isInitialized.current && webgpu.isReady) {
      // Start from calm water so impact diagnostics are physically readable
      if (!useGPU) webglSim.updateNormals();
      isInitialized.current = true;
      onReady?.();
    }
  }, [webgpu.isReady, useGPU, webglSim, onReady]);
  
  // Main render loop
  useFrame((state, delta) => {
    if (delta > 1) return;
    
    // Skip simulation updates when paused
    if (paused) {
      // Still update sphere visual position and material uniforms
      const cameraPos = camera.position.clone();
      [waterMaterialAbove, waterMaterialBelow].forEach(mat => {
        mat.uniforms.eye.value.copy(cameraPos);
        mat.uniforms.sphereCenter.value.copy(sphereCenterRef.current);
      });
      poolMaterial.uniforms.sphereCenter.value.copy(sphereCenterRef.current);
      sphereMaterial.uniforms.sphereCenter.value.copy(sphereCenterRef.current);
      return;
    }
    
    timeRef.current += delta;
    
    let waterTexture: THREE.Texture;
    
    if (useGPU) {
      if (!oldSphereCenter.current.equals(sphereCenterRef.current)) {
        webgpu.setSphere(
          oldSphereCenter.current.x, oldSphereCenter.current.y, oldSphereCenter.current.z,
          sphereCenterRef.current.x, sphereCenterRef.current.y, sphereCenterRef.current.z,
          sphereRadius
        );
      }
      
      webgpu.step();
      waterTexture = webgpu.waterTexture;
    } else {
      webglSim.stepSimulation();
      webglSim.updateNormals();
      waterTexture = webglSim.getWaterTexture();
    }
    
    caustics.updateCaustics(waterTexture, sphereCenterRef.current, sphereRadius, lightDir);
    const causticsTexture = caustics.getCausticsTexture();
    
    const cameraPos = camera.position.clone();
    
    [waterMaterialAbove, waterMaterialBelow].forEach(mat => {
      mat.uniforms.tWater.value = waterTexture;
      mat.uniforms.tCaustics.value = causticsTexture;
      mat.uniforms.eye.value.copy(cameraPos);
      mat.uniforms.sphereCenter.value.copy(sphereCenterRef.current);
    });
    
    poolMaterial.uniforms.tWater.value = waterTexture;
    poolMaterial.uniforms.tCaustics.value = causticsTexture;
    poolMaterial.uniforms.sphereCenter.value.copy(sphereCenterRef.current);
    
    sphereMaterial.uniforms.tWater.value = waterTexture;
    sphereMaterial.uniforms.tCaustics.value = causticsTexture;
    sphereMaterial.uniforms.sphereCenter.value.copy(sphereCenterRef.current);
    
    if (showHeatmap && useGPU) {
      heatmapMaterial.uniforms.tWater.value = waterTexture;
      heatmapMaterial.uniforms.tFields.value = webgpu.fieldTexture;
      heatmapMaterial.uniforms.tFields2.value = webgpu.field2Texture;
      heatmapMaterial.uniforms.time.value = timeRef.current;
    }
    
    // Sphere physics
    if (sphereHeld) {
      // Sphere is held in place above water
      return;
    }
    
    if (modeRef.current !== MODE_MOVE_SPHERE) {
      const v = velocityRef.current;
      const center = sphereCenterRef.current;
      const waterSurfaceY = 0;
      
      const prevY = center.y;
      
      // Gravity
      const gravity = -9.8;
      v.y += gravity * delta;
      
      // Buoyancy
      const submergedDepth = Math.max(0, waterSurfaceY + sphereRadius - center.y);
      const submergedFraction = Math.min(submergedDepth / (2 * sphereRadius), 1);
      if (submergedFraction > 0) {
        const buoyancyForce = 14.0 * submergedFraction;
        v.y += buoyancyForce * delta;
        
        const speed = v.length();
        if (speed > 0.001) {
          const dragCoeff = 2.5 * submergedFraction;
          const dragDecel = Math.min(dragCoeff * speed * delta, 0.4);
          v.multiplyScalar(1 - dragDecel);
        }
        
        const distToSurface = Math.abs(center.y - waterSurfaceY);
        if (distToSurface < sphereRadius * 0.3) {
          v.y *= 0.96;
        }
      }
      
      if (submergedFraction === 0) {
        v.multiplyScalar(0.999);
      }
      
      const newCenter = center.clone().add(v.clone().multiplyScalar(delta));
      
      // Detect impact: sphere crosses water surface — inject smooth cavity + annular rebound
      if (!hasImpacted.current && prevY > sphereRadius && newCenter.y <= sphereRadius) {
        hasImpacted.current = true;
        const impactSpeed = Math.abs(v.y);
        const impactX = newCenter.x;
        const impactZ = newCenter.z;

        const addDropFn = useGPU ? webgpu.addDrop : webglSim.addDrop;
        const strength = THREE.MathUtils.clamp(impactSpeed * 0.0035, 0.004, 0.016);

        // Primary cavity (smaller + softer)
        addDropFn(impactX, impactZ, sphereRadius * 0.72, -strength);

        // Broad rebound support to avoid discrete ring artifacts
        addDropFn(impactX, impactZ, sphereRadius * 1.35, strength * 0.22);

        // Smooth annular uplift (high sample count, low per-sample energy)
        const ringSamples = 36;
        const ringRadius = sphereRadius * 0.95;
        const ringDropRadius = sphereRadius * 0.11;
        const ringStrength = strength * 0.06;

        for (let i = 0; i < ringSamples; i++) {
          const angle = (i / ringSamples) * Math.PI * 2;
          const rx = impactX + Math.cos(angle) * ringRadius;
          const rz = impactZ + Math.sin(angle) * ringRadius;
          if (Math.abs(rx) < 0.98 && Math.abs(rz) < 0.98) {
            addDropFn(rx, rz, ringDropRadius, ringStrength);
          }
        }

        onSphereImpact?.();
      }
      
      // Floor collision
      const minY = -1 + sphereRadius;
      if (newCenter.y < minY) {
        newCenter.y = minY;
        v.y = -v.y * 0.25;
        v.x *= 0.85;
        v.z *= 0.85;
      }
      
      // Wall collisions
      const wallBound = 1 - sphereRadius;
      if (Math.abs(newCenter.x) > wallBound) {
        newCenter.x = Math.sign(newCenter.x) * wallBound;
        v.x = -v.x * 0.25;
      }
      if (Math.abs(newCenter.z) > wallBound) {
        newCenter.z = Math.sign(newCenter.z) * wallBound;
        v.z = -v.z * 0.25;
      }
      
      newCenter.y = Math.min(5, newCenter.y);
      
      if (!useGPU && !newCenter.equals(oldSphereCenter.current)) {
        webglSim.moveSphere(oldSphereCenter.current, newCenter, sphereRadius);
      }
      
      oldSphereCenter.current.copy(sphereCenterRef.current);
      sphereCenterRef.current.copy(newCenter);
    }
  });
  
  // Interaction handlers
  const handlePointerDown = useCallback((event: any) => {
    if (paused || sphereHeld) return;
    event.stopPropagation();
    isDraggingRef.current = true;
    
    if (sphereMeshRef.current) {
      raycaster.setFromCamera(pointer, camera);
      const spherePos = sphereCenterRef.current.clone();
      const boundingSphere = new THREE.Sphere(spherePos, sphereRadius);
      const intersectPoint = new THREE.Vector3();
      
      if (raycaster.ray.intersectSphere(boundingSphere, intersectPoint)) {
        modeRef.current = MODE_MOVE_SPHERE;
        prevHitRef.current = intersectPoint.clone();
        planeNormalRef.current = camera.position.clone().sub(spherePos).normalize();
        velocityRef.current.set(0, 0, 0);
        onSphereDragChange?.(true);
        return;
      }
    }
    
    modeRef.current = MODE_ADD_DROPS;
    if (event.uv) {
      const x = event.uv.x * 2 - 1;
      const z = event.uv.y * 2 - 1;
      const addDropFn = useGPU ? webgpu.addDrop : webglSim.addDrop;
      addDropFn(x, z, 0.03, 0.02);
    }
  }, [camera, pointer, raycaster, useGPU, webgpu, webglSim, onSphereDragChange, paused, sphereHeld]);
  
  const handlePointerMove = useCallback((event: any) => {
    if (!isDraggingRef.current || paused) return;
    
    switch (modeRef.current) {
      case MODE_ADD_DROPS: {
        if (event.uv) {
          const x = event.uv.x * 2 - 1;
          const z = event.uv.y * 2 - 1;
          const addDropFn = useGPU ? webgpu.addDrop : webglSim.addDrop;
          addDropFn(x, z, 0.03, 0.01);
        }
        break;
      }
      case MODE_MOVE_SPHERE: {
        if (!prevHitRef.current || !planeNormalRef.current) break;
        raycaster.setFromCamera(pointer, camera);
        const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
          planeNormalRef.current, prevHitRef.current
        );
        const nextHit = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, nextHit);
        
        if (nextHit) {
          const d = nextHit.clone().sub(prevHitRef.current);
          sphereCenterRef.current.add(d);
          sphereCenterRef.current.x = Math.max(-1 + sphereRadius, Math.min(1 - sphereRadius, sphereCenterRef.current.x));
          sphereCenterRef.current.y = Math.max(-1 + sphereRadius, Math.min(10, sphereCenterRef.current.y));
          sphereCenterRef.current.z = Math.max(-1 + sphereRadius, Math.min(1 - sphereRadius, sphereCenterRef.current.z));
          prevHitRef.current = nextHit;
          
          if (useGPU) {
            webgpu.setSphere(
              oldSphereCenter.current.x, oldSphereCenter.current.y, oldSphereCenter.current.z,
              sphereCenterRef.current.x, sphereCenterRef.current.y, sphereCenterRef.current.z,
              sphereRadius
            );
          } else {
            webglSim.moveSphere(oldSphereCenter.current, sphereCenterRef.current, sphereRadius);
          }
          oldSphereCenter.current.copy(sphereCenterRef.current);
        }
        break;
      }
    }
  }, [camera, pointer, raycaster, useGPU, webgpu, webglSim, paused]);
  
  const handlePointerUp = useCallback(() => {
    if (modeRef.current === MODE_MOVE_SPHERE) {
      onSphereDragChange?.(false);
    }
    isDraggingRef.current = false;
    modeRef.current = -1;
  }, [onSphereDragChange]);
  
  return (
    <group onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
      {/* Water Surface - Above */}
      <mesh
        ref={waterMeshRef}
        geometry={waterGeometry}
        material={waterMaterialAbove}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      />
      
      {/* Water Surface - Below */}
      <mesh geometry={waterGeometry} material={waterMaterialBelow} />
      
      {/* Heatmap Overlay */}
      {showHeatmap && useGPU && (
        <mesh geometry={waterGeometry} material={heatmapMaterial} />
      )}
      
      {/* Pool */}
      <mesh geometry={poolGeometry} material={poolMaterial} />
      
      {/* Sphere */}
      <mesh
        ref={sphereMeshRef}
        geometry={sphereGeometry}
        material={sphereMaterial}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      />
      
      {/* Particles */}
      {useGPU && (
        <ParticleRenderer
          positions={webgpu.particlePositions}
          count={webgpu.activeParticles}
          maxParticles={MAX_PARTICLES}
        />
      )}
      
      {/* Skybox */}
      <mesh>
        <sphereGeometry args={[50, 32, 32]} />
        <meshBasicMaterial side={THREE.BackSide}>
          <canvasTexture attach="map" image={createSkyboxCanvas()} />
        </meshBasicMaterial>
      </mesh>
      
      {/* Sun */}
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
