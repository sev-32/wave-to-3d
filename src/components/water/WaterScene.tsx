import { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWaterSimulation } from './useWaterSimulation';
import { useCaustics } from './useCaustics';
import { createTileTexture, createSkyboxTexture } from './textures';
import {
  waterSurfaceVertexShader,
  waterSurfaceFragmentShaderAbove,
  poolVertexShader,
  poolFragmentShader,
  sphereVertexShader,
  sphereFragmentShader,
} from './shaders';

interface WaterSceneProps {
  onReady?: () => void;
}

export function WaterScene({ onReady }: WaterSceneProps) {
  const { camera, gl, size } = useThree();
  
  // Water simulation hooks
  const waterSim = useWaterSimulation();
  const caustics = useCaustics();
  
  // State refs
  const sphereCenterRef = useRef(new THREE.Vector3(-0.4, -0.75, 0.2));
  const oldSphereCenter = useRef(new THREE.Vector3(-0.4, -0.75, 0.2));
  const sphereRadius = 0.25;
  const velocityRef = useRef(new THREE.Vector3());
  const lightDir = useMemo(() => new THREE.Vector3(2, 2, -1).normalize(), []);
  const isInitialized = useRef(false);
  
  // Textures
  const tileTexture = useMemo(() => createTileTexture(), []);
  const skyboxTexture = useMemo(() => createSkyboxTexture(), []);
  
  // Water surface geometry (200x200 grid)
  const waterGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(2, 2, 200, 200);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);
  
  // Water surface material
  const waterMaterial = useMemo(() => {
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
      side: THREE.DoubleSide,
    });
  }, [tileTexture, skyboxTexture, lightDir]);
  
  // Pool geometry - simple box, we'll use the shader to handle depth
  const poolGeometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(2, 1.5, 2);
    return geo;
  }, []);
  
  // Pool material - use standard material with tiles for simpler rendering
  const poolMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: tileTexture,
      side: THREE.BackSide,
      roughness: 0.8,
      metalness: 0.1,
    });
  }, [tileTexture]);
  
  // Sphere geometry
  const sphereGeometry = useMemo(() => {
    return new THREE.IcosahedronGeometry(1, 3);
  }, []);
  
  // Sphere material
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
  
  // Initialize with some drops
  useEffect(() => {
    if (!isInitialized.current) {
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * 2 - 1;
        const z = Math.random() * 2 - 1;
        const strength = (i % 2 === 0) ? 0.01 : -0.01;
        waterSim.addDrop(x, z, 0.03, strength);
      }
      waterSim.updateNormals();
      isInitialized.current = true;
      onReady?.();
    }
  }, [waterSim, onReady]);
  
  // Animation loop
  useFrame((state, delta) => {
    if (delta > 1) return; // Skip large time gaps
    
    // Step simulation
    waterSim.stepSimulation();
    waterSim.updateNormals();
    
    // Update caustics
    const waterTexture = waterSim.getWaterTexture();
    caustics.updateCaustics(waterTexture, sphereCenterRef.current, sphereRadius, lightDir);
    const causticsTexture = caustics.getCausticsTexture();
    
    // Get camera position for eye uniform
    const cameraPos = camera.position.clone();
    
    // Update water material
    waterMaterial.uniforms.tWater.value = waterTexture;
    waterMaterial.uniforms.tCaustics.value = causticsTexture;
    waterMaterial.uniforms.eye.value.copy(cameraPos);
    waterMaterial.uniforms.sphereCenter.value.copy(sphereCenterRef.current);
    
    // Pool uses standard material, no uniforms to update
    
    // Update sphere material
    sphereMaterial.uniforms.tWater.value = waterTexture;
    sphereMaterial.uniforms.tCaustics.value = causticsTexture;
    sphereMaterial.uniforms.sphereCenter.value.copy(sphereCenterRef.current);
    
    // Simple sphere physics (gravity + bounce)
    const gravity = new THREE.Vector3(0, -4, 0);
    velocityRef.current.add(gravity.clone().multiplyScalar(delta));
    
    const newCenter = sphereCenterRef.current.clone().add(velocityRef.current.clone().multiplyScalar(delta));
    
    // Collision with pool boundaries
    const minY = -1 + sphereRadius;
    if (newCenter.y < minY) {
      newCenter.y = minY;
      velocityRef.current.y = -velocityRef.current.y * 0.5;
    }
    
    // Clamp to pool bounds
    newCenter.x = Math.max(-1 + sphereRadius, Math.min(1 - sphereRadius, newCenter.x));
    newCenter.z = Math.max(-1 + sphereRadius, Math.min(1 - sphereRadius, newCenter.z));
    
    // Move sphere in water if it moved
    if (!newCenter.equals(oldSphereCenter.current)) {
      waterSim.moveSphere(oldSphereCenter.current, newCenter, sphereRadius);
    }
    
    oldSphereCenter.current.copy(sphereCenterRef.current);
    sphereCenterRef.current.copy(newCenter);
  });
  
  // Mouse interaction for adding drops
  const handlePointerMove = useCallback((event: THREE.Event) => {
    const e = event as unknown as { uv?: THREE.Vector2 };
    if (e.uv) {
      const x = e.uv.x * 2 - 1;
      const z = e.uv.y * 2 - 1;
      waterSim.addDrop(x, z, 0.03, 0.02);
    }
  }, [waterSim]);
  
  return (
    <group>
      {/* Water Surface */}
      <mesh
        geometry={waterGeometry}
        material={waterMaterial}
        position={[0, 0, 0]}
        onPointerMove={handlePointerMove}
      />
      
      {/* Pool Walls */}
      <mesh
        geometry={poolGeometry}
        material={poolMaterial}
        position={[0, -0.5, 0]}
      />
      
      {/* Sphere */}
      <mesh
        geometry={sphereGeometry}
        material={sphereMaterial}
      />
      
      {/* Skybox */}
      <mesh>
        <boxGeometry args={[100, 100, 100]} />
        <meshBasicMaterial side={THREE.BackSide} envMap={skyboxTexture} />
      </mesh>
    </group>
  );
}
