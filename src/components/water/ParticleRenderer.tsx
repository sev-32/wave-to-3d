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
    
    // Size attenuation: larger when closer, smaller when further
    float ageFactor = max(0.05, 1.0 - aAge * 0.25);
    float sizeBase = uPointSize * ageFactor;
    
    // Particles that are moving fast are slightly elongated (approximated by larger size)
    float speed = length(aVelocity);
    float speedBoost = 1.0 + min(speed * 0.3, 0.5);
    
    gl_PointSize = sizeBase * speedBoost * (300.0 / -mvPosition.z);
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
    
    // Discard outside the circle
    if (r2 > 1.0) discard;
    
    // Smooth falloff for blending particles together
    float alpha = exp(-r2 * 2.5);
    
    // Reconstruct pseudo-normal from point coord (sphere-like)
    float z = sqrt(max(0.0, 1.0 - r2));
    vec3 normal = normalize(vec3(coord, z));
    
    // Water-like coloring
    float speed = length(vVelocity);
    float ageFactor = clamp(vAge * 0.3, 0.0, 1.0);
    
    // Base water color - matches the pool water
    vec3 deepWater = vec3(0.15, 0.45, 0.65);
    vec3 shallowWater = vec3(0.4, 0.75, 0.9);
    vec3 foamColor = vec3(0.85, 0.92, 0.95);
    
    // Fresh particles are bright/foamy, aging ones become deep water
    vec3 baseColor = mix(foamColor, deepWater, ageFactor);
    
    // Speed adds white foam
    float foamFactor = smoothstep(0.5, 3.0, speed);
    baseColor = mix(baseColor, foamColor, foamFactor * 0.6);
    
    // Fresnel-like edge brightening
    float fresnel = pow(1.0 - z, 3.0);
    
    // Diffuse lighting
    float diffuse = max(0.0, dot(normal, uLightDir)) * 0.6;
    
    // Specular highlight
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vec3 halfDir = normalize(uLightDir + viewDir);
    float specular = pow(max(0.0, dot(normal, halfDir)), 80.0) * 0.8;
    
    // Subsurface scattering approximation
    float sss = max(0.0, dot(-normal, uLightDir)) * 0.15;
    
    vec3 color = baseColor * (0.3 + diffuse + sss) + vec3(specular);
    
    // Edge glow (Fresnel)
    color += vec3(0.3, 0.5, 0.7) * fresnel * 0.4;
    
    // Transparency: thick in center, transparent at edges
    float thickness = z * (1.0 - ageFactor * 0.5);
    float finalAlpha = alpha * mix(0.85, 0.3, ageFactor) * thickness;
    
    // Depth-based fog for particles far from camera
    float fogFactor = 1.0 - exp(-vDepth * 0.1);
    color = mix(color, vec3(0.3, 0.6, 0.8), fogFactor * 0.3);
    
    gl_FragColor = vec4(color, finalAlpha);
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
        uPointSize: { value: 18.0 },
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
