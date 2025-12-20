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

// Update shader - wave propagation simulation
export const updateFragmentShader = `
  precision highp float;
  
  uniform sampler2D tWater;
  uniform vec2 delta;
  varying vec2 vUv;
  
  void main() {
    vec4 info = texture2D(tWater, vUv);
    
    // Sample neighboring heights
    vec2 dx = vec2(delta.x, 0.0);
    vec2 dy = vec2(0.0, delta.y);
    
    float average = (
      texture2D(tWater, vUv - dx).r +
      texture2D(tWater, vUv - dy).r +
      texture2D(tWater, vUv + dx).r +
      texture2D(tWater, vUv + dy).r
    ) * 0.25;
    
    // Update velocity (g channel)
    info.g += (average - info.r) * 2.0;
    
    // Apply damping
    info.g *= 0.995;
    
    // Update height
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

// Sphere displacement shader - handles sphere movement in water
export const sphereDisplacementFragmentShader = `
  precision highp float;
  
  uniform sampler2D tWater;
  uniform vec3 oldCenter;
  uniform vec3 newCenter;
  uniform float radius;
  varying vec2 vUv;
  
  float volumeInSphere(vec3 center) {
    vec3 toCenter = vec3(vUv.x * 2.0 - 1.0, 0.0, vUv.y * 2.0 - 1.0) - center;
    float t = length(toCenter) / radius;
    float dy = exp(-pow(t * 1.5, 6.0));
    float ymin = min(0.0, center.y - dy);
    float ymax = min(max(0.0, center.y + dy), ymin + 2.0 * dy);
    return (ymax - ymin) * 0.1;
  }
  
  void main() {
    vec4 info = texture2D(tWater, vUv);
    
    // Add volume displacement
    info.r += volumeInSphere(oldCenter);
    info.r -= volumeInSphere(newCenter);
    
    gl_FragColor = info;
  }
`;
