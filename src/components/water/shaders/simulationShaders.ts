/**
 * Water Simulation Shaders for React Three Fiber
 * Ported from GPTWAVES reference - WORKING IMPLEMENTATION
 */

// Vertex shader for simulation passes (fullscreen quad)
export const SIMULATION_VERTEX_SHADER = `
  varying vec2 coord;
  void main() {
    coord = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xyz, 1.0);
  }
`;

// Drop shader - adds ripples at a point
export const DROP_FRAGMENT_SHADER = `
  precision highp float;
  
  const float PI = 3.141592653589793;
  
  uniform sampler2D texture;
  uniform vec2 center;
  uniform float radius;
  uniform float strength;
  
  varying vec2 coord;
  
  void main() {
    vec4 info = texture2D(texture, coord);
    
    float drop = max(0.0, 1.0 - length(center - coord) / radius);
    drop = 0.5 - cos(drop * PI) * 0.5;
    info.r += drop * strength;
    
    gl_FragColor = info;
  }
`;

// Update shader - wave propagation simulation
export const UPDATE_FRAGMENT_SHADER = `
  precision highp float;
  
  uniform sampler2D texture;
  uniform vec2 delta;
  uniform sampler2D obstacles;
  
  varying vec2 coord;
  
  void main() {
    vec4 info = texture2D(texture, coord);
    
    // Sample neighbors with obstacle awareness
    vec4 obsL = texture2D(obstacles, coord - vec2(delta.x, 0.0));
    vec4 obsR = texture2D(obstacles, coord + vec2(delta.x, 0.0));
    vec4 obsD = texture2D(obstacles, coord - vec2(0.0, delta.y));
    vec4 obsU = texture2D(obstacles, coord + vec2(0.0, delta.y));
    
    float hL = (obsL.r > 0.5) ? texture2D(texture, coord - vec2(delta.x, 0.0)).r : info.r;
    float hR = (obsR.r > 0.5) ? texture2D(texture, coord + vec2(delta.x, 0.0)).r : info.r;
    float hD = (obsD.r > 0.5) ? texture2D(texture, coord - vec2(0.0, delta.y)).r : info.r;
    float hU = (obsU.r > 0.5) ? texture2D(texture, coord + vec2(0.0, delta.y)).r : info.r;
    
    float average = (hL + hR + hD + hU) * 0.25;
    
    info.g += (average - info.r) * 2.0;
    info.g *= 0.995;
    info.r += info.g;
    
    gl_FragColor = info;
  }
`;

// Normal shader - calculates surface normals from height field
export const NORMAL_FRAGMENT_SHADER = `
  precision highp float;
  
  uniform sampler2D texture;
  uniform vec2 delta;
  
  varying vec2 coord;
  
  void main() {
    vec4 info = texture2D(texture, coord);
    
    vec3 dx = vec3(delta.x, texture2D(texture, vec2(coord.x + delta.x, coord.y)).r - info.r, 0.0);
    vec3 dy = vec3(0.0, texture2D(texture, vec2(coord.x, coord.y + delta.y)).r - info.r, delta.y);
    
    info.ba = normalize(cross(dy, dx)).xz;
    
    gl_FragColor = info;
  }
`;

// Sphere displacement shader - handles sphere movement in water
export const SPHERE_FRAGMENT_SHADER = `
  precision highp float;
  
  uniform sampler2D texture;
  uniform vec3 oldCenter;
  uniform vec3 newCenter;
  uniform float radius;
  
  varying vec2 coord;
  
  float volumeInSphere(vec3 center) {
    vec3 toCenter = vec3(coord.x * 2.0 - 1.0, 0.0, coord.y * 2.0 - 1.0) - center;
    float t = length(toCenter) / radius;
    float dy = exp(-pow(t * 1.5, 6.0));
    float ymin = min(0.0, center.y - dy);
    float ymax = min(max(0.0, center.y + dy), ymin + 2.0 * dy);
    return (ymax - ymin) * 0.1;
  }
  
  void main() {
    vec4 info = texture2D(texture, coord);
    
    info.r += volumeInSphere(oldCenter);
    info.r -= volumeInSphere(newCenter);
    
    gl_FragColor = info;
  }
`;
