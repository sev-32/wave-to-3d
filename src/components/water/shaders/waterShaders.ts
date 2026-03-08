/**
 * Water Simulation Shaders for React Three Fiber
 * Ported from lovable-waves WebGL implementation
 */

// Vertex shader for simulation passes (fullscreen quad)
export const simulationVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Drop shader - adds ripples at a point
export const dropFragmentShader = `
  precision highp float;
  
  uniform sampler2D tWater;
  uniform vec2 center;
  uniform float radius;
  uniform float strength;
  varying vec2 vUv;
  
  const float PI = 3.141592653589793;
  
  void main() {
    vec4 info = texture2D(tWater, vUv);
    
    // Calculate distance from center
    float drop = max(0.0, 1.0 - length(center - vUv) / radius);
    drop = 0.5 - cos(drop * PI) * 0.5;
    
    // Add drop to height (r channel)
    info.r += drop * strength;
    
    gl_FragColor = info;
  }
`;

// Update shader - isotropic wave propagation simulation
export const updateFragmentShader = `
  precision highp float;
  
  uniform sampler2D tWater;
  uniform vec2 delta;
  varying vec2 vUv;
  
  void main() {
    vec4 info = texture2D(tWater, vUv);
    
    vec2 dx = vec2(delta.x, 0.0);
    vec2 dy = vec2(0.0, delta.y);
    
    float left  = texture2D(tWater, vUv - dx).r;
    float right = texture2D(tWater, vUv + dx).r;
    float up    = texture2D(tWater, vUv - dy).r;
    float down  = texture2D(tWater, vUv + dy).r;
    
    float ul = texture2D(tWater, vUv - dx - dy).r;
    float ur = texture2D(tWater, vUv + dx - dy).r;
    float dl = texture2D(tWater, vUv - dx + dy).r;
    float dr = texture2D(tWater, vUv + dx + dy).r;
    
    float average = (left + right + up + down) * 0.20
                  + (ul + ur + dl + dr) * 0.05;
    
    // Softer propagation to avoid over-energetic cavity rebound
    info.g += (average - info.r) * 1.65;
    info.g *= 0.996;
    info.r += info.g;
    
    gl_FragColor = info;
  }
`;

// Normal shader - calculates surface normals from height field
export const normalFragmentShader = `
  precision highp float;
  
  uniform sampler2D tWater;
  uniform vec2 delta;
  varying vec2 vUv;
  
  void main() {
    vec4 info = texture2D(tWater, vUv);
    
    // Calculate gradient
    vec3 dx = vec3(delta.x, texture2D(tWater, vec2(vUv.x + delta.x, vUv.y)).r - info.r, 0.0);
    vec3 dy = vec3(0.0, texture2D(tWater, vec2(vUv.x, vUv.y + delta.y)).r - info.r, delta.y);
    
    // Store normal x and z in b and a channels
    info.ba = normalize(cross(dy, dx)).xz;
    
    gl_FragColor = info;
  }
`;

// Sphere displacement shader - physically conservative coupling
export const sphereDisplacementFragmentShader = `
  precision highp float;
  
  uniform sampler2D tWater;
  uniform vec3 oldCenter;
  uniform vec3 newCenter;
  uniform float radius;
  varying vec2 vUv;
  
  float volumeInSphere(vec3 center) {
    vec2 world = vec2(vUv.x * 2.0 - 1.0, vUv.y * 2.0 - 1.0);
    float dist = length(world - center.xz);
    float horizontalDist = dist / radius;
    if (horizontalDist > 1.5) return 0.0;

    float cap = max(0.0, 1.0 - horizontalDist * horizontalDist);
    float shell = sqrt(cap);
    float sphereTop = center.y + radius * shell;
    float sphereBot = center.y - radius * shell;

    float submergedTop = min(sphereTop, 0.0);
    float submergedBot = max(sphereBot, -1.0);
    if (submergedTop <= submergedBot) return 0.0;

    float displacement = (submergedTop - submergedBot) * cap * 0.045;
    return min(displacement, 0.016);
  }
  
  void main() {
    vec4 info = texture2D(tWater, vUv);
    
    info.r += volumeInSphere(oldCenter);
    info.r -= volumeInSphere(newCenter);

    vec2 vel = newCenter.xz - oldCenter.xz;
    float speed = length(vel);
    if (speed > 0.0001) {
      vec2 world = vec2(vUv.x * 2.0 - 1.0, vUv.y * 2.0 - 1.0);
      vec2 toPoint = world - newCenter.xz;
      float dist = length(toPoint);
      float normDist = dist / radius;

      if (normDist < 3.0 && normDist > 0.1) {
        vec2 velDir = normalize(vel + vec2(0.0001));
        vec2 pointDir = normalize(toPoint + vec2(0.0001));
        float alignment = dot(velDir, pointDir);
        float bowWave = alignment * speed * 1.2;
        float falloff = exp(-normDist * 1.5);
        float waveAdd = bowWave * falloff * 0.035;
        info.g += clamp(waveAdd, -0.022, 0.022);
      }
    }
    
    gl_FragColor = info;
  }
`;
