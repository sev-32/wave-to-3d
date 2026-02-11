/**
 * Foam Simulation Shaders
 * GPU-based foam density field: generation from wave breaking + advection + decay
 * Foam field F(x,z): generate → advect by surface flow → stretch → decay
 * 
 * Encyclopedia ref: Card 6 — Foam lifecycle
 * ∂F/∂t + u·∇F = G - D(F)
 * G = generation from steepness/curvature/η̇
 * D = exponential + stretch-based decay
 */

export const foamSimulationVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Foam update shader: generation + advection + decay
// Input: tFoam (RG = foam density + age), tWater (R = height, G = velocity, BA = normal)
export const foamUpdateShader = `
  precision highp float;
  
  uniform sampler2D tFoam;
  uniform sampler2D tWater;
  uniform vec2 delta;
  uniform float dt;
  uniform vec3 sphereCenter;
  uniform vec3 sphereVelocity;
  uniform float sphereRadius;
  
  varying vec2 vUv;
  
  // Wave breaking / violence detection
  // Steepness proxy: |∇η|, curvature proxy: ∇²η, vertical velocity: η̇
  float foamGeneration(vec2 uv) {
    vec4 water = texture2D(tWater, uv);
    float height = water.r;
    float vertVel = water.g;
    
    // Sample neighbors for gradients
    vec2 dx = vec2(delta.x, 0.0);
    vec2 dy = vec2(0.0, delta.y);
    
    float hL = texture2D(tWater, uv - dx).r;
    float hR = texture2D(tWater, uv + dx).r;
    float hU = texture2D(tWater, uv - dy).r;
    float hD = texture2D(tWater, uv + dy).r;
    
    // Steepness: |∇η|
    vec2 gradient = vec2(hR - hL, hD - hU) / (2.0 * delta);
    float steepness = length(gradient);
    
    // Curvature: ∇²η (Laplacian)
    float laplacian = (hL + hR + hU + hD - 4.0 * height) / (delta.x * delta.x);
    float curvature = abs(laplacian);
    
    // Vertical velocity magnitude
    float vertSpeed = abs(vertVel);
    
    // Generation triggers (thresholded)
    float fromSteepness = smoothstep(3.0, 8.0, steepness) * 0.5;
    float fromCurvature = smoothstep(50.0, 200.0, curvature) * 0.3;
    float fromVertVel = smoothstep(0.05, 0.2, vertSpeed) * 0.4;
    
    return fromSteepness + fromCurvature + fromVertVel;
  }
  
  // Sphere interaction foam generation
  float sphereFoamGeneration(vec2 uv) {
    vec2 worldXZ = uv * 2.0 - 1.0;
    
    // Distance to sphere cross-section at water surface
    if (sphereCenter.y > sphereRadius) return 0.0;
    float dy = sphereCenter.y;
    float crossR = sqrt(max(0.0, sphereRadius * sphereRadius - dy * dy));
    float dist = length(worldXZ - sphereCenter.xz) - crossR;
    
    // Foam at sphere-water contact ring
    float contactFoam = 0.0;
    float speed = length(sphereVelocity);
    
    if (dist > -0.02 && dist < 0.1) {
      // Ring of foam around sphere waterline
      float ringFactor = 1.0 - abs(dist) / 0.1;
      contactFoam = ringFactor * speed * 2.0;
      
      // Extra foam where sphere is pushing water (bow wave)
      if (speed > 0.01) {
        vec2 moveDir = normalize(sphereVelocity.xz);
        vec2 toPoint = normalize(worldXZ - sphereCenter.xz);
        float bowFactor = max(0.0, dot(moveDir, toPoint));
        contactFoam += bowFactor * ringFactor * speed * 3.0;
      }
    }
    
    // Splash foam from vertical entry
    if (abs(sphereVelocity.y) > 0.1 && dist > 0.0 && dist < sphereRadius) {
      float splashFactor = (1.0 - dist / sphereRadius);
      contactFoam += splashFactor * abs(sphereVelocity.y) * 1.5;
    }
    
    return contactFoam;
  }
  
  void main() {
    vec4 foam = texture2D(tFoam, vUv);
    vec4 water = texture2D(tWater, vUv);
    
    float foamDensity = foam.r;
    float foamAge = foam.g;
    
    // ── Advection by surface flow ──
    // Estimate surface velocity from height gradients
    vec2 dx = vec2(delta.x, 0.0);
    vec2 dy = vec2(0.0, delta.y);
    float hL = texture2D(tWater, vUv - dx).r;
    float hR = texture2D(tWater, vUv + dx).r;
    float hU = texture2D(tWater, vUv - dy).r;
    float hD = texture2D(tWater, vUv + dy).r;
    
    // Surface velocity approximation from height gradient
    vec2 surfaceVel = -vec2(hR - hL, hD - hU) * 0.5;
    
    // Semi-Lagrangian advection: trace back
    vec2 backtraceUV = vUv - surfaceVel * dt * 0.5;
    backtraceUV = clamp(backtraceUV, vec2(0.0), vec2(1.0));
    vec4 advectedFoam = texture2D(tFoam, backtraceUV);
    foamDensity = advectedFoam.r;
    foamAge = advectedFoam.g;
    
    // ── Generation ──
    float waveGen = foamGeneration(vUv);
    float sphereGen = sphereFoamGeneration(vUv);
    float totalGen = waveGen + sphereGen;
    
    foamDensity += totalGen * dt;
    if (totalGen > 0.01) {
      // Reset age for fresh foam
      foamAge = mix(foamAge, 0.0, totalGen * dt * 2.0);
    }
    
    // ── Decay ──
    // Exponential decay + age-based thinning
    foamAge += dt;
    float decayRate = 0.3 + 0.5 * foamAge; // older foam decays faster
    foamDensity *= exp(-decayRate * dt);
    
    // Stretch-based thinning: divergence of surface flow
    float divergence = (
      texture2D(tWater, vUv + dx).g - texture2D(tWater, vUv - dx).g +
      texture2D(tWater, vUv + dy).g - texture2D(tWater, vUv - dy).g
    ) * 0.25;
    foamDensity *= 1.0 - max(0.0, divergence) * dt * 2.0;
    
    // Clamp
    foamDensity = clamp(foamDensity, 0.0, 1.0);
    foamAge = min(foamAge, 10.0);
    
    gl_FragColor = vec4(foamDensity, foamAge, 0.0, 1.0);
  }
`;

// Foam rendering helpers (included in water surface shaders)
export const foamRenderingGLSL = `
  // Foam color calculation
  // Foam is high-albedo (white) but still Fresnel-affected
  vec3 getFoamColor(float foamDensity, float foamAge, vec3 baseColor, float fresnel) {
    if (foamDensity < 0.01) return baseColor;
    
    // Foam albedo: white with slight blue tint, darkens with age
    vec3 foamAlbedo = vec3(0.9, 0.95, 1.0);
    float ageFactor = exp(-foamAge * 0.5);
    foamAlbedo *= 0.7 + 0.3 * ageFactor;
    
    // Foam opacity: density-driven with noise variation
    float foamOpacity = smoothstep(0.0, 0.3, foamDensity);
    foamOpacity *= 0.8 + 0.2 * ageFactor; // young foam is more opaque
    
    // Fresnel still affects foam but less so
    float foamFresnel = mix(0.1, fresnel, 0.3);
    
    // Blend foam with base color
    return mix(baseColor, foamAlbedo, foamOpacity);
  }
`;
