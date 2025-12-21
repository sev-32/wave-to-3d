/**
 * SDF-based Water Simulation Shaders
 * Implements realistic sphere-water collision using signed distance fields
 * Waves reflect off sphere boundary, surface tension effects
 */

// SDF simulation vertex shader (same as regular simulation)
export const sdfSimulationVertexShader = `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// SDF-based water update shader
// Replaces the soft exponential displacement with proper boundary conditions
export const sdfWaterUpdateShader = `
  precision highp float;
  
  uniform sampler2D tWater;
  uniform sampler2D tPrevWater;
  uniform vec2 delta;
  uniform vec3 sphereCenter;
  uniform vec3 sphereVelocity;
  uniform float sphereRadius;
  uniform float time;
  
  varying vec2 vUv;
  
  // Signed distance to sphere at water surface level
  float sdSphereSurface(vec2 xz, vec3 sphereCenter, float radius) {
    // Project sphere onto XZ plane at y=0
    vec2 sphereXZ = sphereCenter.xz;
    
    // If sphere is above water, no intersection
    if (sphereCenter.y > radius) return 1.0e6;
    
    // Calculate the radius of sphere's cross-section at y=0
    float dy = sphereCenter.y;
    float crossSectionRadius = sqrt(max(0.0, radius * radius - dy * dy));
    
    // Distance from point to sphere circle on water surface
    return length(xz - sphereXZ) - crossSectionRadius;
  }
  
  // Calculate sphere penetration depth and normal
  vec3 sphereWaterInteraction(vec2 xz, vec3 sphereCenter, float radius) {
    float dist = sdSphereSurface(xz, sphereCenter, radius);
    
    // Normal pointing away from sphere center (in XZ plane)
    vec2 toPoint = xz - sphereCenter.xz;
    float len = length(toPoint);
    vec2 normal2D = len > 0.001 ? toPoint / len : vec2(1.0, 0.0);
    
    // Penetration depth (how far sphere pushes water down)
    float penetration = 0.0;
    if (dist < 0.0) {
      // Inside sphere cross-section
      float dx = length(xz - sphereCenter.xz);
      float maxDepth = sqrt(max(0.0, radius * radius - dx * dx));
      penetration = max(0.0, sphereCenter.y + maxDepth);
    }
    
    return vec3(normal2D, penetration);
  }
  
  void main() {
    vec4 info = texture2D(tWater, vUv);
    
    // Convert UV to world XZ coordinates (-1 to 1)
    vec2 worldXZ = vUv * 2.0 - 1.0;
    
    // Standard wave equation update
    vec2 dx = vec2(delta.x, 0.0);
    vec2 dy = vec2(0.0, delta.y);
    
    float height = info.r;
    float velocity = info.g;
    
    // Sample neighbors
    float hLeft = texture2D(tWater, vUv - dx).r;
    float hRight = texture2D(tWater, vUv + dx).r;
    float hUp = texture2D(tWater, vUv - dy).r;
    float hDown = texture2D(tWater, vUv + dy).r;
    
    // SDF-based boundary conditions for sphere
    float distToSphere = sdSphereSurface(worldXZ, sphereCenter, sphereRadius);
    vec3 interaction = sphereWaterInteraction(worldXZ, sphereCenter, sphereRadius);
    vec2 sphereNormal = interaction.xy;
    float penetration = interaction.z;
    
    // Check if neighbors are inside sphere (for wave reflection)
    vec2 leftXZ = (vUv - dx) * 2.0 - 1.0;
    vec2 rightXZ = (vUv + dx) * 2.0 - 1.0;
    vec2 upXZ = (vUv - dy) * 2.0 - 1.0;
    vec2 downXZ = (vUv + dy) * 2.0 - 1.0;
    
    float distLeft = sdSphereSurface(leftXZ, sphereCenter, sphereRadius);
    float distRight = sdSphereSurface(rightXZ, sphereCenter, sphereRadius);
    float distUp = sdSphereSurface(upXZ, sphereCenter, sphereRadius);
    float distDown = sdSphereSurface(downXZ, sphereCenter, sphereRadius);
    
    // Wave reflection at sphere boundary
    // If neighbor is inside sphere, reflect the wave
    if (distLeft < 0.0) hLeft = height + (height - hRight);
    if (distRight < 0.0) hRight = height + (height - hLeft);
    if (distUp < 0.0) hUp = height + (height - hDown);
    if (distDown < 0.0) hDown = height + (height - hUp);
    
    // Average of neighbors
    float average = (hLeft + hRight + hUp + hDown) * 0.25;
    
    // Wave equation: acceleration proportional to curvature
    velocity += (average - height) * 2.0;
    
    // Damping
    velocity *= 0.995;
    
    // Apply sphere displacement
    if (distToSphere < 0.0) {
      // Inside sphere - push water to edge
      float pushStrength = -distToSphere / sphereRadius;
      
      // Water is displaced outward and downward
      height = -penetration * 0.5;
      
      // Add velocity from sphere movement
      velocity += dot(sphereVelocity.xz, sphereNormal) * 0.1;
      
      // Surface tension at boundary - creates meniscus effect
      float edgeFactor = smoothstep(0.0, 0.1, -distToSphere);
      height = mix(height, -penetration * 0.3, edgeFactor);
    } else if (distToSphere < sphereRadius * 0.5) {
      // Near sphere - create surface tension effect (meniscus)
      float tensionFactor = 1.0 - distToSphere / (sphereRadius * 0.5);
      tensionFactor = tensionFactor * tensionFactor;
      
      // Pull water up slightly near sphere (surface tension)
      float targetHeight = penetration * 0.05 * tensionFactor;
      height += (targetHeight - height) * 0.1;
    }
    
    // Clamp height
    height += velocity;
    height = clamp(height, -0.5, 0.5);
    
    // Pool boundary conditions - waves reflect at walls
    float wallDist = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
    if (wallDist < delta.x * 2.0) {
      velocity *= 0.5; // Damping at walls
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
  
  // Signed distance to sphere cross-section at y=0
  float sdSphereCrossSection(vec2 xz, vec3 sphereCenter, float r) {
    if (sphereCenter.y > r) return 1.0e6;
    float dy = sphereCenter.y;
    float crossRadius = sqrt(max(0.0, r * r - dy * dy));
    return length(xz - sphereCenter.xz) - crossRadius;
  }
  
  void main() {
    vec4 info = texture2D(tWater, vUv);
    vec2 worldXZ = vUv * 2.0 - 1.0;
    
    // Check distance to old and new sphere positions
    float distOld = sdSphereCrossSection(worldXZ, oldCenter, radius);
    float distNew = sdSphereCrossSection(worldXZ, newCenter, radius);
    
    // Water displacement based on sphere movement
    if (distNew < 0.0) {
      // Point is now inside sphere - must displace
      float pushDepth = -distNew;
      info.r = -pushDepth * 0.3;
      info.g += length(velocity.xz) * 0.5 * sign(distOld);
    } else if (distOld < 0.0 && distNew >= 0.0) {
      // Point was inside, now outside - create wave
      vec2 moveDir = normalize(newCenter.xz - oldCenter.xz + vec2(0.001));
      vec2 toPoint = normalize(worldXZ - newCenter.xz);
      
      // Wave amplitude based on how fast sphere moved
      float waveStrength = length(velocity) * 0.3;
      float directionFactor = dot(moveDir, toPoint) * 0.5 + 0.5;
      
      // Create outward wave
      info.r += waveStrength * directionFactor;
      info.g += waveStrength * directionFactor * 2.0;
    } else if (distNew < radius * 0.3 && distNew > 0.0) {
      // Near sphere - create bow wave effect
      vec2 moveDir = newCenter.xz - oldCenter.xz;
      float speed = length(moveDir);
      
      if (speed > 0.001) {
        moveDir /= speed;
        vec2 toPoint = normalize(worldXZ - newCenter.xz);
        float bowFactor = max(0.0, dot(moveDir, toPoint));
        
        // Bow wave - water pushed ahead of sphere
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

// Normal calculation shader with SDF boundary awareness
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
    float crossRadius = sqrt(max(0.0, r * r - dy * dy));
    return length(xz - center.xz) - crossRadius;
  }
  
  void main() {
    vec4 info = texture2D(tWater, vUv);
    vec2 worldXZ = vUv * 2.0 - 1.0;
    
    // Sample heights for normal calculation
    vec2 dx = vec2(delta.x, 0.0);
    vec2 dy = vec2(0.0, delta.y);
    
    float height = info.r;
    float hRight = texture2D(tWater, vUv + dx).r;
    float hUp = texture2D(tWater, vUv + dy).r;
    
    // Check if samples are inside sphere
    vec2 rightXZ = (vUv + dx) * 2.0 - 1.0;
    vec2 upXZ = (vUv + dy) * 2.0 - 1.0;
    
    float distRight = sdSphereSurface(rightXZ, sphereCenter, sphereRadius);
    float distUp = sdSphereSurface(upXZ, sphereCenter, sphereRadius);
    
    // If inside sphere, use current height (no gradient)
    if (distRight < 0.0) hRight = height;
    if (distUp < 0.0) hUp = height;
    
    // Calculate normal from height gradients
    vec3 tangentX = vec3(delta.x * 2.0, hRight - height, 0.0);
    vec3 tangentY = vec3(0.0, hUp - height, delta.y * 2.0);
    vec3 normal = normalize(cross(tangentY, tangentX));
    
    // Store normal in ba channels (xz components)
    info.b = normal.x;
    info.a = normal.z;
    
    gl_FragColor = info;
  }
`;
