/**
 * Screen-Space Fluid Particle Renderer
 * Phase 1: World-space sizing, Gaussian density splatting, age-based visual transition.
 * Particles are tiny and only visible through density accumulation.
 */

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleRendererProps {
  positions: Float32Array;
  count: number;
  maxParticles: number;
  light?: THREE.Vector3;
}

// World-space particle radius in world units
// Pool is 2 units wide, particle ≈ 0.4% of pool width
const PARTICLE_WORLD_RADIUS = 0.008;

const fluidVertexShader = `
  precision highp float;
  
  attribute float aAge;
  attribute float aMass;
  attribute vec3 aVelocity;
  
  varying float vAge;
  varying float vMass;
  varying float vDepth;
  varying vec3 vVelocity;
  varying float vSpeed;
  
  uniform float uWorldRadius;
  uniform float uResolutionY;
  uniform float uFov; // radians
  uniform float uTime;
  
  void main() {
    vAge = aAge;
    vMass = aMass;
    vVelocity = aVelocity;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mvPosition.z;
    vSpeed = length(aVelocity);
    
    // World-space sizing: consistent scale regardless of screen resolution
    // Formula: pixelSize = (worldRadius * resY) / (-z * tan(fov/2))
    float worldRadius = uWorldRadius;
    
    // Slightly larger for fast particles (stretched splash)
    float speedBoost = 1.0 + min(vSpeed * 0.1, 0.4);
    // Slightly smaller for old particles
    float ageShrink = max(0.3, 1.0 - aAge * 0.15);
    
    float effectiveRadius = worldRadius * speedBoost * ageShrink;
    float pixelSize = (effectiveRadius * uResolutionY) / (-mvPosition.z * tan(uFov * 0.5));
    
    gl_PointSize = max(1.0, pixelSize);
    gl_Position = projectionMatrix * mvPosition;
    
    // Hide inactive particles
    if (aMass <= 0.0) {
      gl_Position = vec4(0.0, 0.0, -999.0, 1.0);
      gl_PointSize = 0.0;
    }
  }
`;

const fluidFragmentShader = `
  precision highp float;
  
  varying float vAge;
  varying float vMass;
  varying float vDepth;
  varying vec3 vVelocity;
  varying float vSpeed;
  
  uniform float uTime;
  uniform vec3 uLightDir;
  
  void main() {
    vec2 coord = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(coord, coord);
    
    if (r2 > 1.0) discard;
    
    // Gaussian kernel for smooth density splatting
    float weight = exp(-r2 * 3.5);
    
    // ---- Age-based visual transition ----
    // Age 0–0.3s: Dense fluid blob (blue-tinted, high density)
    // Age 0.3–1.0s: White spray (high scatter)
    // Age 1.0–2.5s: Fading mist (low alpha, diffuse)
    
    float ageFrac = vAge;
    
    // Color transition
    vec3 fluidColor = vec3(0.15, 0.45, 0.7);  // Deep water blue
    vec3 sprayColor = vec3(0.7, 0.85, 0.95);  // White-blue spray
    vec3 mistColor  = vec3(0.8, 0.9, 0.95);   // Near-white mist
    
    float toSpray = smoothstep(0.2, 0.6, ageFrac);
    float toMist  = smoothstep(0.8, 1.5, ageFrac);
    
    vec3 color = mix(fluidColor, sprayColor, toSpray);
    color = mix(color, mistColor, toMist);
    
    // Speed-based foam
    float foamFactor = smoothstep(0.3, 2.0, vSpeed);
    color = mix(color, vec3(0.85, 0.92, 0.97), foamFactor * 0.4);
    
    // Alpha: young = dense, old = fading
    float youngAlpha = 0.08;  // Dense fluid accumulation
    float sprayAlpha = 0.04;  // Lighter spray
    float mistAlpha  = 0.015; // Very faint mist
    
    float baseAlpha = mix(youngAlpha, sprayAlpha, toSpray);
    baseAlpha = mix(baseAlpha, mistAlpha, toMist);
    
    // Mass-weighted: heavier particles contribute more
    baseAlpha *= vMass * 1.5;
    
    // Final fade at end of life
    float lifeFade = 1.0 - smoothstep(1.8, 2.5, ageFrac);
    
    float finalAlpha = weight * baseAlpha * lifeFade;
    
    // Simple pseudo-normal from point coord for specular hint
    vec3 pointNormal = normalize(vec3(coord, sqrt(max(0.0, 1.0 - r2))));
    float specular = pow(max(0.0, dot(reflect(-uLightDir, pointNormal), vec3(0.0, 0.0, 1.0))), 16.0);
    color += specular * 0.15 * (1.0 - toMist);
    
    // Fresnel-like edge brightening for fluid particles
    float fresnel = pow(1.0 - sqrt(max(0.0, 1.0 - r2)), 2.0);
    color += fresnel * 0.1 * (1.0 - toSpray);
    
    // Premultiplied alpha output
    gl_FragColor = vec4(color * finalAlpha, finalAlpha);
  }
`;

export function ParticleRenderer({ positions, count, maxParticles, light }: ParticleRendererProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const { camera, size } = useThree();
  
  const maxRender = maxParticles / 2;
  
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
        uWorldRadius: { value: PARTICLE_WORLD_RADIUS },
        uResolutionY: { value: 1 },
        uFov: { value: 1 },
        uTime: { value: 0 },
        uLightDir: { value: light || new THREE.Vector3(0.5, 0.7, -0.3).normalize() },
      },
      vertexShader: fluidVertexShader,
      fragmentShader: fluidFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
    });
  }, [light]);
  
  useFrame((state) => {
    const actualCount = Math.min(count, maxRender);
    
    // Update camera-dependent uniforms
    const cam = camera as THREE.PerspectiveCamera;
    material.uniforms.uResolutionY.value = size.height;
    material.uniforms.uFov.value = cam.fov * Math.PI / 180;
    
    const posArray = posAttr.array as Float32Array;
    const ageArray = ageAttr.array as Float32Array;
    const massArray = massAttr.array as Float32Array;
    const velArray = velAttr.array as Float32Array;
    
    for (let i = 0; i < actualCount; i++) {
      const pi = i * 8;
      posArray[i * 3]     = positions[pi];
      posArray[i * 3 + 1] = positions[pi + 1];
      posArray[i * 3 + 2] = positions[pi + 2];
      massArray[i]        = positions[pi + 3];
      velArray[i * 3]     = positions[pi + 4];
      velArray[i * 3 + 1] = positions[pi + 5];
      velArray[i * 3 + 2] = positions[pi + 6];
      ageArray[i]         = positions[pi + 7];
    }
    
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
