/**
 * Screen-Space Fluid Particle Renderer
 * Renders MLS-MPM particles as smooth billboards with water-like shading,
 * mimicking the screen-space fluid rendering technique from the splash reference.
 * Uses THREE.Points with custom shaders for metaball-like blending.
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleRendererProps {
  positions: Float32Array;
  count: number;
  maxParticles: number;
  waterTexture?: THREE.Texture;
  light?: THREE.Vector3;
}

// Vertex shader: billboard particles in screen space with size attenuation
const fluidVertexShader = `
  precision highp float;
  
  attribute float aAge;
  attribute float aMass;
  attribute vec3 aVelocity;
  
  varying float vAge;
  varying float vMass;
  varying float vDepth;
  varying vec3 vVelocity;
  varying vec3 vWorldPos;
  
  uniform float uPointSize;
  uniform float uTime;
  
  void main() {
    vAge = aAge;
    vMass = aMass;
    vVelocity = aVelocity;
    vWorldPos = position;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mvPosition.z;
    
    // Size attenuation
    float ageFactor = max(0.05, 1.0 - aAge * 0.25);
    float sizeBase = uPointSize * ageFactor;
    
    float speed = length(aVelocity);
    float speedBoost = 1.0 + min(speed * 0.15, 0.3);
    
    gl_PointSize = sizeBase * speedBoost * (30.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
    
    // Hide inactive particles
    if (aMass <= 0.0) {
      gl_Position = vec4(0.0, 0.0, -999.0, 1.0);
      gl_PointSize = 0.0;
    }
  }
`;

// Fragment shader: smooth metaball-like circle with water shading
const fluidFragmentShader = `
  precision highp float;
  
  varying float vAge;
  varying float vMass;
  varying float vDepth;
  varying vec3 vVelocity;
  varying vec3 vWorldPos;
  
  uniform float uTime;
  uniform vec3 uLightDir;
  
  const float IOR_AIR = 1.0;
  const float IOR_WATER = 1.333;
  
  void main() {
    // Smooth circle with soft edges (metaball-like)
    vec2 coord = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(coord, coord);
    
    // Soft gaussian blob - key to fluid look
    if (r2 > 1.0) discard;
    
    // Gaussian kernel for smooth density splatting (like SPH/MLS-MPM rendering)
    float weight = exp(-r2 * 4.0);
    
    float speed = length(vVelocity);
    float ageFactor = clamp(vAge * 0.3, 0.0, 1.0);
    
    // Translucent water tint - NOT opaque spheres
    vec3 waterTint = vec3(0.2, 0.5, 0.75);
    vec3 foamTint = vec3(0.6, 0.8, 0.95);
    
    float foamFactor = smoothstep(0.3, 2.0, speed);
    vec3 color = mix(waterTint, foamTint, foamFactor * 0.5 + ageFactor * 0.2);
    
    // Very low alpha - particles overlap and accumulate to form fluid density
    float baseAlpha = mix(0.12, 0.04, ageFactor);
    float finalAlpha = weight * baseAlpha;
    
    gl_FragColor = vec4(color * finalAlpha, finalAlpha);
  }
`;

export function ParticleRenderer({ positions, count, maxParticles, light }: ParticleRendererProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const { camera } = useThree();
  
  const maxRender = maxParticles / 2;
  
  // Create geometry with custom attributes
  const { geometry, posAttr, ageAttr, massAttr, velAttr } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(maxRender * 3);
    const ages = new Float32Array(maxRender);
    const masses = new Float32Array(maxRender);
    const vels = new Float32Array(maxRender * 3);
    
    const posAttribute = new THREE.BufferAttribute(pos, 3);
    posAttribute.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', posAttribute);
    
    const ageAttribute = new THREE.BufferAttribute(ages, 1);
    ageAttribute.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aAge', ageAttribute);
    
    const massAttribute = new THREE.BufferAttribute(masses, 1);
    massAttribute.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aMass', massAttribute);
    
    const velAttribute = new THREE.BufferAttribute(vels, 3);
    velAttribute.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aVelocity', velAttribute);
    
    return { geometry: geo, posAttr: posAttribute, ageAttr: ageAttribute, massAttr: massAttribute, velAttr: velAttribute };
  }, [maxRender]);
  
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uPointSize: { value: 3.0 },
        uTime: { value: 0 },
        uLightDir: { value: light || new THREE.Vector3(0.5, 0.7, -0.3).normalize() },
      },
      vertexShader: fluidVertexShader,
      fragmentShader: fluidFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
    });
  }, [light]);
  
  useFrame((state) => {
    const actualCount = Math.min(count, maxRender);
    
    const posArray = posAttr.array as Float32Array;
    const ageArray = ageAttr.array as Float32Array;
    const massArray = massAttr.array as Float32Array;
    const velArray = velAttr.array as Float32Array;
    
    for (let i = 0; i < actualCount; i++) {
      const pi = i * 8; // 2 vec4f per particle = 8 floats
      posArray[i * 3]     = positions[pi];
      posArray[i * 3 + 1] = positions[pi + 1];
      posArray[i * 3 + 2] = positions[pi + 2];
      massArray[i]        = positions[pi + 3];
      velArray[i * 3]     = positions[pi + 4];
      velArray[i * 3 + 1] = positions[pi + 5];
      velArray[i * 3 + 2] = positions[pi + 6];
      ageArray[i]         = positions[pi + 7];
    }
    
    // Zero out remaining
    for (let i = actualCount; i < maxRender; i++) {
      posArray[i * 3] = 0;
      posArray[i * 3 + 1] = -100;
      posArray[i * 3 + 2] = 0;
      massArray[i] = 0;
      ageArray[i] = 100;
    }
    
    posAttr.needsUpdate = true;
    ageAttr.needsUpdate = true;
    massAttr.needsUpdate = true;
    velAttr.needsUpdate = true;
    
    geometry.setDrawRange(0, actualCount);
    
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });
  
  return (
    <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
  );
}
