/**
 * Caustics Shaders for React Three Fiber
 * CRITICAL: This is the most important shader for realistic water effects
 * Uses OES_standard_derivatives for dFdx/dFdy calculations
 */

// Helper functions shared across shaders
export const helperFunctions = `
  const float IOR_AIR = 1.0;
  const float IOR_WATER = 1.333;
  const vec3 abovewaterColor = vec3(0.25, 1.0, 1.25);
  const vec3 underwaterColor = vec3(0.4, 0.9, 1.0);
  const float poolHeight = 1.0;
  
  vec2 intersectCube(vec3 origin, vec3 ray, vec3 cubeMin, vec3 cubeMax) {
    vec3 tMin = (cubeMin - origin) / ray;
    vec3 tMax = (cubeMax - origin) / ray;
    vec3 t1 = min(tMin, tMax);
    vec3 t2 = max(tMin, tMax);
    float tNear = max(max(t1.x, t1.y), t1.z);
    float tFar = min(min(t2.x, t2.y), t2.z);
    return vec2(tNear, tFar);
  }
  
  float intersectSphere(vec3 origin, vec3 ray, vec3 sphereCenter, float sphereRadius) {
    vec3 toSphere = origin - sphereCenter;
    float a = dot(ray, ray);
    float b = 2.0 * dot(toSphere, ray);
    float c = dot(toSphere, toSphere) - sphereRadius * sphereRadius;
    float discriminant = b*b - 4.0*a*c;
    if (discriminant > 0.0) {
      float t = (-b - sqrt(discriminant)) / (2.0 * a);
      if (t > 0.0) return t;
    }
    return 1.0e6;
  }
`;

// Caustics vertex shader
export const causticsVertexShader = `
  precision highp float;
  
  uniform sampler2D tWater;
  uniform vec3 light;
  
  varying vec3 oldPos;
  varying vec3 newPos;
  varying vec3 vRay;
  
  const float IOR_AIR = 1.0;
  const float IOR_WATER = 1.333;
  const float poolHeight = 1.0;
  
  vec2 intersectCube(vec3 origin, vec3 ray, vec3 cubeMin, vec3 cubeMax) {
    vec3 tMin = (cubeMin - origin) / ray;
    vec3 tMax = (cubeMax - origin) / ray;
    vec3 t1 = min(tMin, tMax);
    vec3 t2 = max(tMin, tMax);
    float tNear = max(max(t1.x, t1.y), t1.z);
    float tFar = min(min(t2.x, t2.y), t2.z);
    return vec2(tNear, tFar);
  }
  
  vec3 project(vec3 origin, vec3 ray, vec3 refractedLight) {
    vec2 tcube = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
    origin += ray * tcube.y;
    float tplane = (-origin.y - 1.0) / refractedLight.y;
    return origin + refractedLight * tplane;
  }
  
  void main() {
    // Sample water height and normal
    vec4 info = texture2D(tWater, uv);
    info.ba *= 0.5;
    vec3 normal = vec3(info.b, sqrt(1.0 - dot(info.ba, info.ba)), info.a);
    
    // Calculate refracted light rays
    vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    vRay = refract(-light, normal, IOR_AIR / IOR_WATER);
    
    // Project positions
    vec3 vertexPos = vec3(position.x, 0.0, position.y);
    oldPos = project(vertexPos, refractedLight, refractedLight);
    newPos = project(vertexPos + vec3(0.0, info.r, 0.0), vRay, refractedLight);
    
    // Output position for caustics texture
    gl_Position = vec4(0.75 * (newPos.xz + refractedLight.xz / refractedLight.y), 0.0, 1.0);
  }
`;

// Caustics fragment shader - CRITICAL: uses dFdx/dFdy for area calculation
export const causticsFragmentShader = `
  #extension GL_OES_standard_derivatives : enable
  
  precision highp float;
  
  uniform vec3 light;
  uniform vec3 sphereCenter;
  uniform float sphereRadius;
  
  varying vec3 oldPos;
  varying vec3 newPos;
  varying vec3 vRay;
  
  const float IOR_AIR = 1.0;
  const float IOR_WATER = 1.333;
  const float poolHeight = 1.0;
  
  vec2 intersectCube(vec3 origin, vec3 ray, vec3 cubeMin, vec3 cubeMax) {
    vec3 tMin = (cubeMin - origin) / ray;
    vec3 tMax = (cubeMax - origin) / ray;
    vec3 t1 = min(tMin, tMax);
    vec3 t2 = max(tMin, tMax);
    float tNear = max(max(t1.x, t1.y), t1.z);
    float tFar = min(min(t2.x, t2.y), t2.z);
    return vec2(tNear, tFar);
  }
  
  void main() {
    // Calculate caustic intensity from area change
    // This is the CRITICAL part that makes caustics work
    float oldArea = length(dFdx(oldPos)) * length(dFdy(oldPos));
    float newArea = length(dFdx(newPos)) * length(dFdy(newPos));
    gl_FragColor = vec4(oldArea / newArea * 0.2, 1.0, 0.0, 0.0);
    
    // Calculate sphere shadow
    vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    
    vec3 dir = (sphereCenter - newPos) / sphereRadius;
    vec3 area = cross(dir, refractedLight);
    float shadow = dot(area, area);
    float dist = dot(dir, -refractedLight);
    shadow = 1.0 + (shadow - 1.0) / (0.05 + dist * 0.025);
    shadow = clamp(1.0 / (1.0 + exp(-shadow)), 0.0, 1.0);
    shadow = mix(1.0, shadow, clamp(dist * 2.0, 0.0, 1.0));
    gl_FragColor.g = shadow;
    
    // Edge fade
    vec2 t = intersectCube(newPos, -refractedLight, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
    gl_FragColor.r *= 1.0 / (1.0 + exp(-200.0 / (1.0 + 10.0 * (t.y - t.x)) * (newPos.y - refractedLight.y * t.y - 2.0 / 12.0)));
  }
`;

// Fallback caustics fragment shader (no derivatives support)
export const causticsFragmentShaderFallback = `
  precision highp float;
  
  uniform vec3 light;
  uniform vec3 sphereCenter;
  uniform float sphereRadius;
  
  varying vec3 oldPos;
  varying vec3 newPos;
  varying vec3 vRay;
  
  const float IOR_AIR = 1.0;
  const float IOR_WATER = 1.333;
  const float poolHeight = 1.0;
  
  vec2 intersectCube(vec3 origin, vec3 ray, vec3 cubeMin, vec3 cubeMax) {
    vec3 tMin = (cubeMin - origin) / ray;
    vec3 tMax = (cubeMax - origin) / ray;
    vec3 t1 = min(tMin, tMax);
    vec3 t2 = max(tMin, tMax);
    float tNear = max(max(t1.x, t1.y), t1.z);
    float tFar = min(min(t2.x, t2.y), t2.z);
    return vec2(tNear, tFar);
  }
  
  void main() {
    // Fallback: constant caustic intensity
    gl_FragColor = vec4(0.2, 0.2, 0.0, 0.0);
    
    vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    
    vec3 dir = (sphereCenter - newPos) / sphereRadius;
    vec3 area = cross(dir, refractedLight);
    float shadow = dot(area, area);
    float dist = dot(dir, -refractedLight);
    shadow = 1.0 + (shadow - 1.0) / (0.05 + dist * 0.025);
    shadow = clamp(1.0 / (1.0 + exp(-shadow)), 0.0, 1.0);
    shadow = mix(1.0, shadow, clamp(dist * 2.0, 0.0, 1.0));
    gl_FragColor.g = shadow;
    
    vec2 t = intersectCube(newPos, -refractedLight, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
    gl_FragColor.r *= 1.0 / (1.0 + exp(-200.0 / (1.0 + 10.0 * (t.y - t.x)) * (newPos.y - refractedLight.y * t.y - 2.0 / 12.0)));
  }
`;
