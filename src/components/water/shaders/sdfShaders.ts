/**
 * SDF-based Water Simulation Shaders
 * Implements realistic sphere-water collision using signed distance fields
 * Surface tension, capillary waves, meniscus effects
 */

// SDF simulation vertex shader
export const sdfSimulationVertexShader = `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// SDF-based water update shader with surface tension and capillary waves
export const sdfWaterUpdateShader = `
  precision highp float;
  
  uniform sampler2D tWater;
  uniform sampler2D tPrevWater;
  uniform vec2 delta;
  uniform vec3 sphereCenter;
  uniform vec3 sphereVelocity;
  uniform float sphereRadius;
  uniform float time;
  uniform float surfaceTension;   // σ/ρ ratio ~0.073/1000 scaled for sim
  uniform float capillaryDamping; // extra damping for high-k modes
  
  varying vec2 vUv;
  
  // Signed distance to sphere at water surface level
  float sdSphereSurface(vec2 xz, vec3 sc, float r) {
    if (sc.y > r) return 1.0e6;
    float dy = sc.y;
    float crossR = sqrt(max(0.0, r * r - dy * dy));
    return length(xz - sc.xz) - crossR;
  }
  
  // Sphere-water interaction
  vec3 sphereWaterInteraction(vec2 xz, vec3 sc, float r) {
    float dist = sdSphereSurface(xz, sc, r);
    vec2 toPoint = xz - sc.xz;
    float len = length(toPoint);
    vec2 normal2D = len > 0.001 ? toPoint / len : vec2(1.0, 0.0);
    
    float penetration = 0.0;
    if (dist < 0.0) {
      float dx = length(xz - sc.xz);
      float maxDepth = sqrt(max(0.0, r * r - dx * dx));
      penetration = max(0.0, sc.y + maxDepth);
    }
    
    return vec3(normal2D, penetration);
  }
  
  void main() {
    vec4 info = texture2D(tWater, vUv);
    vec2 worldXZ = vUv * 2.0 - 1.0;
    
    vec2 dx = vec2(delta.x, 0.0);
    vec2 dy = vec2(0.0, delta.y);
    
    float height = info.r;
    float velocity = info.g;
    
    // Sample neighbors (4-point stencil)
    float hL = texture2D(tWater, vUv - dx).r;
    float hR = texture2D(tWater, vUv + dx).r;
    float hU = texture2D(tWater, vUv - dy).r;
    float hD = texture2D(tWater, vUv + dy).r;
    
    // Diagonal neighbors for biharmonic (8-point for capillary)
    float hLU = texture2D(tWater, vUv - dx - dy).r;
    float hRU = texture2D(tWater, vUv + dx - dy).r;
    float hLD = texture2D(tWater, vUv - dx + dy).r;
    float hRD = texture2D(tWater, vUv + dx + dy).r;
    
    // SDF boundary: sphere collision
    float distToSphere = sdSphereSurface(worldXZ, sphereCenter, sphereRadius);
    vec3 interaction = sphereWaterInteraction(worldXZ, sphereCenter, sphereRadius);
    vec2 sphereNormal = interaction.xy;
    float penetration = interaction.z;
    
    // Wave reflection at sphere boundary
    vec2 leftXZ = (vUv - dx) * 2.0 - 1.0;
    vec2 rightXZ = (vUv + dx) * 2.0 - 1.0;
    vec2 upXZ = (vUv - dy) * 2.0 - 1.0;
    vec2 downXZ = (vUv + dy) * 2.0 - 1.0;
    
    float dL = sdSphereSurface(leftXZ, sphereCenter, sphereRadius);
    float dR = sdSphereSurface(rightXZ, sphereCenter, sphereRadius);
    float dU = sdSphereSurface(upXZ, sphereCenter, sphereRadius);
    float dD = sdSphereSurface(downXZ, sphereCenter, sphereRadius);
    
    if (dL < 0.0) hL = height + (height - hR);
    if (dR < 0.0) hR = height + (height - hL);
    if (dU < 0.0) hU = height + (height - hD);
    if (dD < 0.0) hD = height + (height - hU);
    
    // ── Gravity wave: Laplacian (∇²η) ──
    float laplacian = (hL + hR + hU + hD) - 4.0 * height;
    
    // ── Surface tension: Biharmonic (∇⁴η) ──
    // ∇⁴η = Laplacian of Laplacian
    // For capillary-gravity dispersion: ω² = gk + (σ/ρ)k³
    // The biharmonic term adds the k³ contribution
    float lapL = (texture2D(tWater, vUv - dx - dx).r + hR + hLU + hLD) - 4.0 * hL;
    float lapR = (hL + texture2D(tWater, vUv + dx + dx).r + hRU + hRD) - 4.0 * hR;
    float lapU = (hLU + hRU + texture2D(tWater, vUv - dy - dy).r + height) - 4.0 * hU;
    float lapD = (hLD + hRD + height + texture2D(tWater, vUv + dy + dy).r) - 4.0 * hD;
    float biharmonic = (lapL + lapR + lapU + lapD) - 4.0 * laplacian;
    
    // Gravity wave acceleration
    float gravityAccel = laplacian * 2.0;
    
    // Surface tension acceleration (negative sign: opposes curvature)
    // Scaled surfaceTension controls capillary ripple strength
    float tensionAccel = -surfaceTension * biharmonic;
    
    // Combined acceleration
    velocity += gravityAccel + tensionAccel;
    
    // Frequency-dependent damping: capillary waves damp faster
    // High curvature = high k = more damping
    float curvature = abs(laplacian);
    float dampingFactor = 0.995 - capillaryDamping * curvature;
    dampingFactor = max(dampingFactor, 0.95); // don't over-damp
    velocity *= dampingFactor;
    
    // ── Sphere displacement with meniscus ──
    if (distToSphere < 0.0) {
      // Inside sphere cross-section
      height = -penetration * 0.5;
      velocity += dot(sphereVelocity.xz, sphereNormal) * 0.1;
      
      // Meniscus: water climbs sphere due to surface tension
      float edgeFactor = smoothstep(0.0, 0.1, -distToSphere);
      height = mix(height, -penetration * 0.3, edgeFactor);
    } else if (distToSphere < sphereRadius * 0.8) {
      // Meniscus zone: surface tension pulls water up near sphere
      // Contact angle effect: water wets the sphere surface
      float t = distToSphere / (sphereRadius * 0.8);
      float meniscusHeight = penetration * 0.08 * exp(-3.0 * t * t);
      
      // Capillary length scale (~2.7mm for water, scaled to sim)
      float capillaryLength = 0.04;
      float meniscusFalloff = exp(-distToSphere / capillaryLength);
      
      // Blend meniscus smoothly
      height += meniscusHeight * meniscusFalloff;
      
      // Surface tension pulls toward sphere at contact
      velocity += meniscusHeight * 0.02 * (1.0 - t);
    }
    
    height += velocity;
    height = clamp(height, -0.5, 0.5);
    
    // Wall boundary: absorbing + reflecting
    float wallDist = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
    if (wallDist < delta.x * 2.0) {
      velocity *= 0.5;
    }
    
    info.r = height;
    info.g = velocity;
    
    gl_FragColor = info;
  }
`;

// SDF sphere movement shader - creates waves from sphere motion
export const sdfSphereMovementShader = `
  precision highp float;
  
  uniform sampler2D tWater;
  uniform vec3 oldCenter;
  uniform vec3 newCenter;
  uniform vec3 velocity;
  uniform float radius;
  uniform float time;
  
  varying vec2 vUv;
  
  float sdSphereCrossSection(vec2 xz, vec3 sc, float r) {
    if (sc.y > r) return 1.0e6;
    float dy = sc.y;
    float crossR = sqrt(max(0.0, r * r - dy * dy));
    return length(xz - sc.xz) - crossR;
  }
  
  void main() {
    vec4 info = texture2D(tWater, vUv);
    vec2 worldXZ = vUv * 2.0 - 1.0;
    
    float distOld = sdSphereCrossSection(worldXZ, oldCenter, radius);
    float distNew = sdSphereCrossSection(worldXZ, newCenter, radius);
    
    if (distNew < 0.0) {
      float pushDepth = -distNew;
      info.r = -pushDepth * 0.3;
      info.g += length(velocity.xz) * 0.5 * sign(distOld);
    } else if (distOld < 0.0 && distNew >= 0.0) {
      vec2 moveDir = normalize(newCenter.xz - oldCenter.xz + vec2(0.001));
      vec2 toPoint = normalize(worldXZ - newCenter.xz);
      float waveStrength = length(velocity) * 0.3;
      float directionFactor = dot(moveDir, toPoint) * 0.5 + 0.5;
      info.r += waveStrength * directionFactor;
      info.g += waveStrength * directionFactor * 2.0;
    } else if (distNew < radius * 0.3 && distNew > 0.0) {
      vec2 moveDir = newCenter.xz - oldCenter.xz;
      float speed = length(moveDir);
      if (speed > 0.001) {
        moveDir /= speed;
        vec2 toPoint = normalize(worldXZ - newCenter.xz);
        float bowFactor = max(0.0, dot(moveDir, toPoint));
        float nearFactor = 1.0 - distNew / (radius * 0.3);
        info.r += speed * bowFactor * nearFactor * 0.5;
        info.g += speed * bowFactor * nearFactor;
      }
    }
    
    // Vertical movement creates circular waves  
    float verticalSpeed = newCenter.y - oldCenter.y;
    if (abs(verticalSpeed) > 0.001 && distNew > 0.0 && distNew < radius * 2.0) {
      float rippleFactor = 1.0 - distNew / (radius * 2.0);
      info.r += verticalSpeed * rippleFactor * 0.3;
      info.g += verticalSpeed * rippleFactor;
    }
    
    gl_FragColor = info;
  }
`;

// Normal calculation with SDF boundary awareness
export const sdfNormalShader = `
  precision highp float;
  
  uniform sampler2D tWater;
  uniform vec2 delta;
  uniform vec3 sphereCenter;
  uniform float sphereRadius;
  
  varying vec2 vUv;
  
  float sdSphereSurface(vec2 xz, vec3 center, float r) {
    if (center.y > r) return 1.0e6;
    float dy = center.y;
    float crossR = sqrt(max(0.0, r * r - dy * dy));
    return length(xz - center.xz) - crossR;
  }
  
  void main() {
    vec4 info = texture2D(tWater, vUv);
    vec2 worldXZ = vUv * 2.0 - 1.0;
    
    vec2 dx = vec2(delta.x, 0.0);
    vec2 dy = vec2(0.0, delta.y);
    
    float height = info.r;
    float hRight = texture2D(tWater, vUv + dx).r;
    float hUp = texture2D(tWater, vUv + dy).r;
    
    vec2 rightXZ = (vUv + dx) * 2.0 - 1.0;
    vec2 upXZ = (vUv + dy) * 2.0 - 1.0;
    
    float distRight = sdSphereSurface(rightXZ, sphereCenter, sphereRadius);
    float distUp = sdSphereSurface(upXZ, sphereCenter, sphereRadius);
    
    if (distRight < 0.0) hRight = height;
    if (distUp < 0.0) hUp = height;
    
    vec3 tangentX = vec3(delta.x * 2.0, hRight - height, 0.0);
    vec3 tangentY = vec3(0.0, hUp - height, delta.y * 2.0);
    vec3 normal = normalize(cross(tangentY, tangentX));
    
    info.b = normal.x;
    info.a = normal.z;
    
    gl_FragColor = info;
  }
`;
