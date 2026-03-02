/**
 * GPU Particle Renderer using InstancedMesh
 * Renders MLS-MPM particles emitted from surface intent fields
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleRendererProps {
  positions: Float32Array;
  count: number;
  maxParticles: number;
}

const dummy = new THREE.Object3D();
const color = new THREE.Color();

export function ParticleRenderer({ positions, count, maxParticles }: ParticleRendererProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const geometry = useMemo(() => new THREE.SphereGeometry(0.012, 6, 4), []);
  const material = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.85,
      roughness: 0.1,
      metalness: 0.0,
      transmission: 0.4,
      thickness: 0.5,
    });
  }, []);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const actualCount = Math.min(count, maxParticles / 2);

    for (let i = 0; i < actualCount; i++) {
      const pi = i * 8; // 2 vec4f per particle = 8 floats
      const px = positions[pi];
      const py = positions[pi + 1];
      const pz = positions[pi + 2];
      const mass = positions[pi + 3];
      const age = positions[pi + 7]; // vel.w = age

      if (mass <= 0) continue;

      // Scale by age (shrink as particles age)
      const ageFactor = Math.max(0.1, 1.0 - age * 0.3);
      dummy.position.set(px, py, pz);
      dummy.scale.setScalar(ageFactor);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // Color: white → blue based on age
      const t = Math.min(age * 0.5, 1);
      color.setHSL(0.55 + t * 0.05, 0.7, 0.8 - t * 0.3);
      mesh.setColorAt(i, color);
    }

    // Hide remaining instances
    for (let i = actualCount; i < maxParticles / 2; i++) {
      dummy.position.set(0, -100, 0);
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.count = actualCount;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, maxParticles / 2]}
      frustumCulled={false}
    />
  );
}
