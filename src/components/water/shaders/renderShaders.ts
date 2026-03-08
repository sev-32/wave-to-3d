/**
 * Rendering Shaders for Water Surface, Pool, Sphere, and Heatmap Overlay
 */

import { helperFunctions } from './causticsShaders';

// Water surface vertex shader
export const waterSurfaceVertexShader = `
  precision highp float;
  
  uniform sampler2D tWater;
  
  varying vec3 vPosition;
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    
    // Sample water height
    vec4 info = texture2D(tWater, uv);
    
    // Displace vertex by water height
    vec3 pos = position;
    pos.y += info.r;
    
    vPosition = pos;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Water surface fragment shader (above water view)
export const waterSurfaceFragmentShaderAbove = `
  precision highp float;
  
  uniform sampler2D tWater;
  uniform sampler2D tTiles;
  uniform sampler2D tCaustics;
  uniform samplerCube tSky;
  uniform vec3 eye;
  uniform vec3 light;
  uniform vec3 sphereCenter;
  uniform float sphereRadius;
  
  varying vec3 vPosition;
  varying vec2 vUv;
  
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
  
  float intersectSphere(vec3 origin, vec3 ray, vec3 center, float radius) {
    vec3 toSphere = origin - center;
    float a = dot(ray, ray);
    float b = 2.0 * dot(toSphere, ray);
    float c = dot(toSphere, toSphere) - radius * radius;
    float discriminant = b*b - 4.0*a*c;
    if (discriminant > 0.0) {
      float t = (-b - sqrt(discriminant)) / (2.0 * a);
      if (t > 0.0) return t;
    }
    return 1.0e6;
  }
  
  vec3 getSphereColor(vec3 point) {
    vec3 color = vec3(0.5);
    color *= 1.0 - 0.9 / pow((1.0 + sphereRadius - abs(point.x)) / sphereRadius, 3.0);
    color *= 1.0 - 0.9 / pow((1.0 + sphereRadius - abs(point.z)) / sphereRadius, 3.0);
    color *= 1.0 - 0.9 / pow((point.y + 1.0 + sphereRadius) / sphereRadius, 3.0);
    
    vec3 sphereNormal = (point - sphereCenter) / sphereRadius;
    vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    float diffuse = max(0.0, dot(-refractedLight, sphereNormal)) * 0.5;
    vec4 info = texture2D(tWater, point.xz * 0.5 + 0.5);
    if (point.y < info.r) {
      vec4 caustic = texture2D(tCaustics, 0.75 * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5);
      diffuse *= caustic.r * 4.0;
    }
    color += diffuse;
    return color;
  }
  
  vec3 getWallColor(vec3 point) {
    float scale = 0.5;
    vec3 wallColor;
    vec3 normal;
    
    if (abs(point.x) > 0.999) {
      wallColor = texture2D(tTiles, point.yz * 0.5 + vec2(1.0, 0.5)).rgb;
      normal = vec3(-point.x, 0.0, 0.0);
    } else if (abs(point.z) > 0.999) {
      wallColor = texture2D(tTiles, point.yx * 0.5 + vec2(1.0, 0.5)).rgb;
      normal = vec3(0.0, 0.0, -point.z);
    } else {
      wallColor = texture2D(tTiles, point.xz * 0.5 + 0.5).rgb;
      normal = vec3(0.0, 1.0, 0.0);
    }
    
    scale /= length(point);
    scale *= 1.0 - 0.9 / pow(length(point - sphereCenter) / sphereRadius, 4.0);
    
    vec3 refractedLight = -refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    float diffuse = max(0.0, dot(refractedLight, normal));
    vec4 info = texture2D(tWater, point.xz * 0.5 + 0.5);
    
    if (point.y < info.r) {
      vec4 caustic = texture2D(tCaustics, 0.75 * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5);
      scale += diffuse * caustic.r * 2.0 * caustic.g;
    } else {
      vec2 t = intersectCube(point, refractedLight, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
      diffuse *= 1.0 / (1.0 + exp(-200.0 / (1.0 + 10.0 * (t.y - t.x)) * (point.y + refractedLight.y * t.y - 2.0 / 12.0)));
      scale += diffuse * 0.5;
    }
    
    return wallColor * scale;
  }
  
  vec3 getSurfaceRayColor(vec3 origin, vec3 ray, vec3 waterColor) {
    vec3 color;
    float q = intersectSphere(origin, ray, sphereCenter, sphereRadius);
    if (q < 1.0e6) {
      color = getSphereColor(origin + ray * q);
    } else if (ray.y < 0.0) {
      vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
      color = getWallColor(origin + ray * t.y);
    } else {
      vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
      vec3 hit = origin + ray * t.y;
      if (hit.y < 2.0 / 12.0) {
        color = getWallColor(hit);
      } else {
        color = textureCube(tSky, ray).rgb;
        color += vec3(pow(max(0.0, dot(light, ray)), 5000.0)) * vec3(10.0, 8.0, 6.0);
      }
    }
    if (ray.y < 0.0) color *= waterColor;
    return color;
  }
  
  void main() {
    vec2 coord = vPosition.xz * 0.5 + 0.5;
    vec4 info = texture2D(tWater, coord);
    
    for (int i = 0; i < 5; i++) {
      coord += info.ba * 0.005;
      info = texture2D(tWater, coord);
    }
    
    vec3 normal = vec3(info.b, sqrt(1.0 - dot(info.ba, info.ba)), info.a);
    vec3 incomingRay = normalize(vPosition - eye);
    
    vec3 reflectedRay = reflect(incomingRay, normal);
    vec3 refractedRay = refract(incomingRay, normal, IOR_AIR / IOR_WATER);
    float fresnel = mix(0.25, 1.0, pow(1.0 - dot(normal, -incomingRay), 3.0));
    
    vec3 reflectedColor = getSurfaceRayColor(vPosition, reflectedRay, abovewaterColor);
    vec3 refractedColor = getSurfaceRayColor(vPosition, refractedRay, abovewaterColor);
    
    gl_FragColor = vec4(mix(refractedColor, reflectedColor, fresnel), 1.0);
  }
`;

// Water surface fragment shader (below water view - underwater looking up)
export const waterSurfaceFragmentShaderBelow = `
  precision highp float;
  
  uniform sampler2D tWater;
  uniform sampler2D tTiles;
  uniform sampler2D tCaustics;
  uniform samplerCube tSky;
  uniform vec3 eye;
  uniform vec3 light;
  uniform vec3 sphereCenter;
  uniform float sphereRadius;
  
  varying vec3 vPosition;
  varying vec2 vUv;
  
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
  
  float intersectSphere(vec3 origin, vec3 ray, vec3 center, float radius) {
    vec3 toSphere = origin - center;
    float a = dot(ray, ray);
    float b = 2.0 * dot(toSphere, ray);
    float c = dot(toSphere, toSphere) - radius * radius;
    float discriminant = b*b - 4.0*a*c;
    if (discriminant > 0.0) {
      float t = (-b - sqrt(discriminant)) / (2.0 * a);
      if (t > 0.0) return t;
    }
    return 1.0e6;
  }
  
  vec3 getSphereColor(vec3 point) {
    vec3 color = vec3(0.5);
    color *= 1.0 - 0.9 / pow((1.0 + sphereRadius - abs(point.x)) / sphereRadius, 3.0);
    color *= 1.0 - 0.9 / pow((1.0 + sphereRadius - abs(point.z)) / sphereRadius, 3.0);
    color *= 1.0 - 0.9 / pow((point.y + 1.0 + sphereRadius) / sphereRadius, 3.0);
    
    vec3 sphereNormal = (point - sphereCenter) / sphereRadius;
    vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    float diffuse = max(0.0, dot(-refractedLight, sphereNormal)) * 0.5;
    vec4 info = texture2D(tWater, point.xz * 0.5 + 0.5);
    if (point.y < info.r) {
      vec4 caustic = texture2D(tCaustics, 0.75 * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5);
      diffuse *= caustic.r * 4.0;
    }
    color += diffuse;
    return color;
  }
  
  vec3 getWallColor(vec3 point) {
    float scale = 0.5;
    vec3 wallColor;
    vec3 normal;
    
    if (abs(point.x) > 0.999) {
      wallColor = texture2D(tTiles, point.yz * 0.5 + vec2(1.0, 0.5)).rgb;
      normal = vec3(-point.x, 0.0, 0.0);
    } else if (abs(point.z) > 0.999) {
      wallColor = texture2D(tTiles, point.yx * 0.5 + vec2(1.0, 0.5)).rgb;
      normal = vec3(0.0, 0.0, -point.z);
    } else {
      wallColor = texture2D(tTiles, point.xz * 0.5 + 0.5).rgb;
      normal = vec3(0.0, 1.0, 0.0);
    }
    
    scale /= length(point);
    scale *= 1.0 - 0.9 / pow(length(point - sphereCenter) / sphereRadius, 4.0);
    
    vec3 refractedLight = -refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    float diffuse = max(0.0, dot(refractedLight, normal));
    vec4 info = texture2D(tWater, point.xz * 0.5 + 0.5);
    
    if (point.y < info.r) {
      vec4 caustic = texture2D(tCaustics, 0.75 * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5);
      scale += diffuse * caustic.r * 2.0 * caustic.g;
    } else {
      vec2 t = intersectCube(point, refractedLight, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
      diffuse *= 1.0 / (1.0 + exp(-200.0 / (1.0 + 10.0 * (t.y - t.x)) * (point.y + refractedLight.y * t.y - 2.0 / 12.0)));
      scale += diffuse * 0.5;
    }
    
    return wallColor * scale;
  }
  
  vec3 getSurfaceRayColor(vec3 origin, vec3 ray, vec3 waterColor) {
    vec3 color;
    float q = intersectSphere(origin, ray, sphereCenter, sphereRadius);
    if (q < 1.0e6) {
      color = getSphereColor(origin + ray * q);
    } else if (ray.y < 0.0) {
      vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
      color = getWallColor(origin + ray * t.y);
    } else {
      vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
      vec3 hit = origin + ray * t.y;
      if (hit.y < 2.0 / 12.0) {
        color = getWallColor(hit);
      } else {
        color = textureCube(tSky, ray).rgb;
        color += vec3(pow(max(0.0, dot(light, ray)), 5000.0)) * vec3(10.0, 8.0, 6.0);
      }
    }
    if (ray.y < 0.0) color *= waterColor;
    return color;
  }
  
  void main() {
    vec2 coord = vPosition.xz * 0.5 + 0.5;
    vec4 info = texture2D(tWater, coord);
    
    for (int i = 0; i < 5; i++) {
      coord += info.ba * 0.005;
      info = texture2D(tWater, coord);
    }
    
    vec3 normal = -vec3(info.b, sqrt(1.0 - dot(info.ba, info.ba)), info.a);
    vec3 incomingRay = normalize(vPosition - eye);
    
    vec3 reflectedRay = reflect(incomingRay, normal);
    vec3 refractedRay = refract(incomingRay, normal, IOR_WATER / IOR_AIR);
    float fresnel = mix(0.5, 1.0, pow(1.0 - dot(normal, -incomingRay), 3.0));
    
    vec3 reflectedColor = getSurfaceRayColor(vPosition, reflectedRay, underwaterColor);
    vec3 refractedColor = getSurfaceRayColor(vPosition, refractedRay, vec3(1.0)) * vec3(0.8, 1.0, 1.1);
    
    gl_FragColor = vec4(mix(reflectedColor, refractedColor, (1.0 - fresnel) * length(refractedRay)), 1.0);
  }
`;

// Pool walls vertex shader
export const poolVertexShader = `
  precision highp float;
  
  varying vec3 vPosition;
  
  void main() {
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Pool walls fragment shader
export const poolFragmentShader = `
  precision highp float;
  
  uniform sampler2D tWater;
  uniform sampler2D tTiles;
  uniform sampler2D tCaustics;
  uniform vec3 light;
  uniform vec3 sphereCenter;
  uniform float sphereRadius;
  
  varying vec3 vPosition;
  
  const float IOR_AIR = 1.0;
  const float IOR_WATER = 1.333;
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
  
  vec3 getWallColor(vec3 point) {
    float scale = 0.5;
    vec3 wallColor;
    vec3 normal;
    
    if (abs(point.x) > 0.999) {
      wallColor = texture2D(tTiles, point.yz * 0.5 + vec2(1.0, 0.5)).rgb;
      normal = vec3(-point.x, 0.0, 0.0);
    } else if (abs(point.z) > 0.999) {
      wallColor = texture2D(tTiles, point.yx * 0.5 + vec2(1.0, 0.5)).rgb;
      normal = vec3(0.0, 0.0, -point.z);
    } else {
      wallColor = texture2D(tTiles, point.xz * 0.5 + 0.5).rgb;
      normal = vec3(0.0, 1.0, 0.0);
    }
    
    scale /= length(point);
    scale *= 1.0 - 0.9 / pow(length(point - sphereCenter) / sphereRadius, 4.0);
    
    vec3 refractedLight = -refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    float diffuse = max(0.0, dot(refractedLight, normal));
    vec4 info = texture2D(tWater, point.xz * 0.5 + 0.5);
    
    if (point.y < info.r) {
      vec4 caustic = texture2D(tCaustics, 0.75 * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5);
      scale += diffuse * caustic.r * 2.0 * caustic.g;
    } else {
      vec2 t = intersectCube(point, refractedLight, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
      diffuse *= 1.0 / (1.0 + exp(-200.0 / (1.0 + 10.0 * (t.y - t.x)) * (point.y + refractedLight.y * t.y - 2.0 / 12.0)));
      scale += diffuse * 0.5;
    }
    
    return wallColor * scale;
  }
  
  void main() {
    vec3 color = getWallColor(vPosition);
    
    vec4 info = texture2D(tWater, vPosition.xz * 0.5 + 0.5);
    if (vPosition.y < info.r) {
      color *= underwaterColor * 1.2;
    }
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Sphere vertex shader
export const sphereVertexShader = `
  precision highp float;
  
  uniform vec3 sphereCenter;
  uniform float sphereRadius;
  
  varying vec3 vPosition;
  
  void main() {
    vPosition = sphereCenter + position * sphereRadius;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
  }
`;

// Sphere fragment shader
export const sphereFragmentShader = `
  precision highp float;
  
  uniform sampler2D tWater;
  uniform sampler2D tCaustics;
  uniform vec3 light;
  uniform vec3 sphereCenter;
  uniform float sphereRadius;
  
  varying vec3 vPosition;
  
  const float IOR_AIR = 1.0;
  const float IOR_WATER = 1.333;
  
  void main() {
    vec3 color = vec3(0.5);
    
    color *= 1.0 - 0.9 / pow((1.0 + sphereRadius - abs(vPosition.x)) / sphereRadius, 3.0);
    color *= 1.0 - 0.9 / pow((1.0 + sphereRadius - abs(vPosition.z)) / sphereRadius, 3.0);
    color *= 1.0 - 0.9 / pow((vPosition.y + 1.0 + sphereRadius) / sphereRadius, 3.0);
    
    vec3 sphereNormal = (vPosition - sphereCenter) / sphereRadius;
    vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    float diffuse = max(0.0, dot(-refractedLight, sphereNormal)) * 0.5;
    
    vec4 info = texture2D(tWater, vPosition.xz * 0.5 + 0.5);
    if (vPosition.y < info.r) {
      vec4 caustic = texture2D(tCaustics, 0.75 * (vPosition.xz - vPosition.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5);
      diffuse *= caustic.r * 4.0;
    }
    color += diffuse;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// ========== HEATMAP OVERLAY SHADERS ==========

// Heatmap vertex shader - follows water surface
export const heatmapVertexShader = `
  precision highp float;
  
  uniform sampler2D tWater;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    
    vec4 info = texture2D(tWater, uv);
    vec3 pos = position;
    pos.y += info.r + 0.005; // Slightly above water
    
    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Heatmap fragment shader - visualizes surface intent fields
export const heatmapFragmentShader = `
  precision highp float;
  
  uniform sampler2D tFields;   // R, C, M, A
  uniform sampler2D tFields2;  // Ux, Uz, divU, slope
  uniform float time;
  uniform float opacity;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  
  const float PI = 3.141592653589793;
  
  // HSV to RGB conversion
  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }
  
  void main() {
    vec4 f0 = texture2D(tFields, vUv);
    vec4 f1 = texture2D(tFields2, vUv);
    
    float R = f0.r; // Rupture potential
    float C = f0.g; // Coherence
    float M = f0.b; // Reservoir mass
    float A = f0.a; // Adhesion
    
    vec2 U = f1.rg;  // Surface momentum
    float Umag = length(U);
    float angle = atan(U.y, U.x); // Polarity angle
    
    // === Polarity Visualization ===
    // Map momentum direction to hue (full rainbow)
    float hue = angle / (2.0 * PI) + 0.5;
    vec3 polarityColor = hsv2rgb(vec3(hue, 0.8, 1.0)) * Umag * 2.0;
    
    // === Rupture Heat ===
    // Red-orange-white gradient for rupture intensity
    vec3 ruptureColor = mix(
      vec3(0.8, 0.2, 0.0),  // dark orange
      vec3(1.0, 0.9, 0.7),  // bright white-yellow
      R
    ) * R * R * 3.0;
    
    // Pulsing glow for high rupture zones
    float pulse = sin(time * 6.0 + R * 15.0) * 0.5 + 0.5;
    ruptureColor += vec3(1.0, 0.4, 0.1) * R * R * pulse * 2.0;
    
    // === Coherence Glow ===
    vec3 coherenceColor = vec3(0.1, 0.7, 1.0) * C * C * 1.5;
    
    // === Reservoir Indicator ===
    vec3 reservoirColor = vec3(0.2, 0.8, 0.3) * M * 0.3;
    
    // === Flow Lines ===
    // Create directional flow pattern from U
    float flowPhase = dot(vUv * 20.0, normalize(U + vec2(0.001))) - time * Umag * 5.0;
    float flowLine = pow(abs(sin(flowPhase * PI)), 8.0) * Umag * 3.0;
    vec3 flowColor = hsv2rgb(vec3(hue, 0.6, 1.0)) * flowLine;
    
    // === Emission Zone Highlight ===
    float emitZone = step(0.06, R) * step(0.015, M) * 0.5;
    vec3 emitColor = vec3(1.0, 1.0, 0.8) * emitZone * (sin(time * 8.0) * 0.3 + 0.7);
    
    // Combine all layers
    vec3 color = ruptureColor + coherenceColor + reservoirColor + polarityColor * 0.4 + flowColor + emitColor;
    
    // Alpha: stronger where fields are active
    float alpha = max(max(R * 0.9, Umag * 0.6), C * 0.3) * opacity;
    alpha = clamp(alpha, 0.0, 0.95);
    
    // Edge glow at emission boundaries
    float edgeGlow = fwidth(R) * 50.0;
    color += vec3(1.0, 0.6, 0.2) * edgeGlow * 2.0;
    alpha = max(alpha, edgeGlow * 0.5);
    
    gl_FragColor = vec4(color, alpha);
  }
`;
