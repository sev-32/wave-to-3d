/**
 * Spray Particle System
 * Ballistic droplets emitted from wave breaking and sphere interaction
 * Encyclopedia ref: Card 7 — Spray (ballistic droplets + mist)
 * 
 * Motion: ẍ = g - Cd·|v|·v (gravity + air drag)
 * Lifetime: short, emitted at high energy events
 * Rendering: additive point sprites with light scattering
 */

import { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MAX_PARTICLES = 2000;
const GRAVITY = -9.8;
const AIR_DRAG = 2.0;

interface SprayParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
}

interface SprayParticlesProps {
  waterTexture: THREE.Texture | null;
  sphereCenter: THREE.Vector3;
  sphereVelocity: THREE.Vector3;
  sphereRadius: number;
  lightDir: THREE.Vector3;
}

export function SprayParticles({
  waterTexture,
  sphereCenter,
  sphereVelocity,
  sphereRadius,
  lightDir,
}: SprayParticlesProps) {
  const particlesRef = useRef<SprayParticle[]>([]);
  const meshRef = useRef<THREE.Points>(null);
  const emitAccum = useRef(0);

  // Geometry with positions, sizes, and opacity attributes
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const sizes = new Float32Array(MAX_PARTICLES);
    const opacities = new Float32Array(MAX_PARTICLES);

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aOpacity', new THREE.BufferAttribute(opacities, 1));

    return geo;
  }, []);

  // Spray material - additive point sprites
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        light: { value: new THREE.Vector3() },
        color: { value: new THREE.Color(0.9, 0.95, 1.0) },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aOpacity;
        varying float vOpacity;
        varying float vLight;
        uniform vec3 light;
        
        void main() {
          vOpacity = aOpacity;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (300.0 / -mvPosition.z);
          gl_PointSize = clamp(gl_PointSize, 1.0, 20.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Simple light scattering on droplet
          vec3 viewDir = normalize(-mvPosition.xyz);
          vLight = 0.5 + 0.5 * dot(viewDir, light);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform vec3 color;
        varying float vOpacity;
        varying float vLight;
        
        void main() {
          // Circular droplet shape
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          if (dist > 0.5) discard;
          
          // Soft edge
          float alpha = smoothstep(0.5, 0.2, dist) * vOpacity;
          
          // Highlight on droplet
          float highlight = pow(max(0.0, 1.0 - dist * 3.0), 4.0);
          vec3 dropColor = color * vLight + vec3(highlight * 0.5);
          
          gl_FragColor = vec4(dropColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  // Emit particles from sphere interaction
  const emitFromSphere = useCallback((count: number) => {
    const particles = particlesRef.current;
    const speed = sphereVelocity.length();
    if (speed < 0.05) return;

    for (let i = 0; i < count; i++) {
      if (particles.length >= MAX_PARTICLES) break;

      // Emit from sphere waterline ring
      const angle = Math.random() * Math.PI * 2;
      const crossRadius = Math.sqrt(
        Math.max(0, sphereRadius * sphereRadius - sphereCenter.y * sphereCenter.y)
      );

      if (crossRadius <= 0) continue;

      const emitPos = new THREE.Vector3(
        sphereCenter.x + Math.cos(angle) * crossRadius,
        Math.max(0, sphereCenter.y) + Math.random() * 0.05,
        sphereCenter.z + Math.sin(angle) * crossRadius
      );

      // Velocity: outward + upward + some of sphere velocity
      const outward = new THREE.Vector3(
        Math.cos(angle),
        0,
        Math.sin(angle)
      );

      // Favor emission in sphere's direction of travel
      const moveDir = sphereVelocity.clone().normalize();
      const dirBias = Math.max(0, outward.dot(moveDir)) * 0.5 + 0.5;

      const emitVel = new THREE.Vector3(
        outward.x * speed * 1.5 * dirBias + sphereVelocity.x * 0.3,
        speed * (1.0 + Math.random() * 2.0) + Math.abs(sphereVelocity.y) * 0.5,
        outward.z * speed * 1.5 * dirBias + sphereVelocity.z * 0.3
      );

      // Add randomness
      emitVel.x += (Math.random() - 0.5) * speed * 0.5;
      emitVel.y += Math.random() * speed * 0.5;
      emitVel.z += (Math.random() - 0.5) * speed * 0.5;

      const life = 0.3 + Math.random() * 0.7;

      particles.push({
        position: emitPos,
        velocity: emitVel,
        life,
        maxLife: life,
        size: 0.01 + Math.random() * 0.02,
      });
    }
  }, [sphereCenter, sphereVelocity, sphereRadius]);

  // Emit from wave breaking (high curvature regions)
  const emitFromWaveBreaking = useCallback((count: number) => {
    // This would sample the water texture for high-violence areas
    // For now, emit based on overall water activity (velocity)
    const particles = particlesRef.current;

    for (let i = 0; i < count; i++) {
      if (particles.length >= MAX_PARTICLES) break;

      const x = Math.random() * 2 - 1;
      const z = Math.random() * 2 - 1;

      // Only emit within pool bounds
      if (Math.abs(x) > 0.95 || Math.abs(z) > 0.95) continue;

      const emitPos = new THREE.Vector3(x, 0.02, z);
      const emitVel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        1.0 + Math.random() * 2.0,
        (Math.random() - 0.5) * 0.5
      );

      const life = 0.2 + Math.random() * 0.5;

      particles.push({
        position: emitPos,
        velocity: emitVel,
        life,
        maxLife: life,
        size: 0.005 + Math.random() * 0.015,
      });
    }
  }, []);

  useFrame((_, delta) => {
    if (delta > 0.1) return;
    const particles = particlesRef.current;

    // Emission logic
    const sphereSpeed = sphereVelocity.length();
    if (sphereSpeed > 0.1 && sphereCenter.y < sphereRadius) {
      emitAccum.current += sphereSpeed * delta * 50;
      const toEmit = Math.floor(emitAccum.current);
      emitAccum.current -= toEmit;
      emitFromSphere(Math.min(toEmit, 20));
    }

    // Update particles: physics + remove dead
    let alive = 0;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.life -= delta;

      if (p.life <= 0) continue;

      // Ballistic + air drag: ẍ = g - Cd·|v|·v
      const speed = p.velocity.length();
      const dragMag = AIR_DRAG * speed * delta;

      p.velocity.y += GRAVITY * delta;

      if (speed > 0.001) {
        p.velocity.x -= p.velocity.x * dragMag;
        p.velocity.z -= p.velocity.z * dragMag;
        p.velocity.y -= p.velocity.y * dragMag * 0.3; // less vertical drag
      }

      p.position.addScaledVector(p.velocity, delta);

      // Kill if below water or outside bounds
      if (p.position.y < -0.1 || Math.abs(p.position.x) > 1.2 || Math.abs(p.position.z) > 1.2) {
        p.life = 0;
        continue;
      }

      particles[alive++] = p;
    }
    particles.length = alive;

    // Update GPU buffers
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const sizeAttr = geometry.getAttribute('aSize') as THREE.BufferAttribute;
    const opacityAttr = geometry.getAttribute('aOpacity') as THREE.BufferAttribute;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (i < alive) {
        const p = particles[i];
        posAttr.array[i * 3] = p.position.x;
        posAttr.array[i * 3 + 1] = p.position.y;
        posAttr.array[i * 3 + 2] = p.position.z;
        sizeAttr.array[i] = p.size * (p.life / p.maxLife);
        opacityAttr.array[i] = Math.min(1, p.life / p.maxLife * 2);
      } else {
        posAttr.array[i * 3] = 0;
        posAttr.array[i * 3 + 1] = -10;
        posAttr.array[i * 3 + 2] = 0;
        sizeAttr.array[i] = 0;
        opacityAttr.array[i] = 0;
      }
    }

    posAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    opacityAttr.needsUpdate = true;
    geometry.setDrawRange(0, alive);

    // Update light uniform
    material.uniforms.light.value.copy(lightDir);
  });

  return (
    <points ref={meshRef} geometry={geometry} material={material} frustumCulled={false} />
  );
}
