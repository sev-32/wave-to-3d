/**
 * Rendering Shaders for Water Surface, Pool, and Sphere
 * Ported from GPTWAVES reference - WORKING IMPLEMENTATION
 */

const SHADER_COMMON = `
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
  
  vec3 getSphereColor(vec3 point, vec3 sphereCenter, float sphereRadius, vec3 light, sampler2D water, sampler2D causticTex) {
    vec3 color = vec3(0.5);
    
    // Edge darkening
    color *= 1.0 - 0.9 / pow((1.0 + sphereRadius - abs(point.x)) / sphereRadius, 3.0);
    color *= 1.0 - 0.9 / pow((1.0 + sphereRadius - abs(point.z)) / sphereRadius, 3.0);
    color *= 1.0 - 0.9 / pow((point.y + 1.0 + sphereRadius) / sphereRadius, 3.0);
    
    vec3 sphereNormal = (point - sphereCenter) / sphereRadius;
    vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    float diffuse = max(0.0, dot(-refractedLight, sphereNormal)) * 0.5;
    
    vec4 info = texture2D(water, point.xz * 0.5 + 0.5);
    if (point.y < info.r) {
      vec2 causticUV = 0.75 * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5;
      vec4 caustic = texture2D(causticTex, causticUV);
      diffuse *= caustic.r * 4.0 * caustic.g;
    }
    color += diffuse;
    
    return color;
  }
  
  vec3 getWallColor(vec3 point, vec3 sphereCenter, float sphereRadius, vec3 light, sampler2D tiles, sampler2D water, sampler2D causticTex) {
    float scale = 0.5;
    vec3 wallColor;
    vec3 normal;
    
    if (abs(point.x) > 0.999) {
      wallColor = texture2D(tiles, point.yz * 0.5 + vec2(1.0, 0.5)).rgb;
      normal = vec3(-point.x, 0.0, 0.0);
    } else if (abs(point.z) > 0.999) {
      wallColor = texture2D(tiles, point.yx * 0.5 + vec2(1.0, 0.5)).rgb;
      normal = vec3(0.0, 0.0, -point.z);
    } else {
      wallColor = texture2D(tiles, point.xz * 0.5 + 0.5).rgb;
      normal = vec3(0.0, 1.0, 0.0);
    }
    
    scale /= length(point);
    
    float sphereDist = length(point - sphereCenter);
    scale *= 1.0 - 0.9 / pow(sphereDist / sphereRadius, 4.0);
    
    vec3 refractedLight = -refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    float diffuse = max(0.0, dot(refractedLight, normal));
    
    vec4 info = texture2D(water, point.xz * 0.5 + 0.5);
    
    if (point.y < info.r) {
      vec2 causticUV = 0.75 * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5;
      vec4 caustic = texture2D(causticTex, causticUV);
      scale += diffuse * caustic.r * 2.0 * caustic.g;
    } else {
      vec2 t = intersectCube(point, refractedLight, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
      diffuse *= 1.0 / (1.0 + exp(-200.0 / (1.0 + 10.0 * (t.y - t.x)) * (point.y + refractedLight.y * t.y - 2.0 / 12.0)));
      scale += diffuse * 0.5;
    }
    
    return wallColor * scale;
  }
`;

// Water surface vertex shader
export const WATER_VERTEX_SHADER = `
  precision highp float;
  
  uniform sampler2D water;
  
  varying vec3 position_v;
  varying vec2 coord;
  
  void main() {
    coord = position.xy * 0.5 + 0.5;
    vec4 info = texture2D(water, coord);
    
    position_v = vec3(position.x, info.r, position.y);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position_v, 1.0);
  }
`;

// Water surface fragment shader (above water view)
export const WATER_FRAGMENT_SHADER_ABOVE = `
  precision highp float;
  
  uniform sampler2D water;
  uniform sampler2D tiles;
  uniform sampler2D causticTex;
  uniform samplerCube sky;
  uniform vec3 eye;
  uniform vec3 light;
  uniform vec3 sphereCenter;
  uniform float sphereRadius;
  
  varying vec3 position_v;
  varying vec2 coord;
  
  ${SHADER_COMMON}
  
  vec3 getSurfaceRayColor(vec3 origin, vec3 ray, vec3 waterColor) {
    vec3 color;
    float q = intersectSphere(origin, ray, sphereCenter, sphereRadius);
    
    if (q < 1.0e6) {
      color = getSphereColor(origin + ray * q, sphereCenter, sphereRadius, light, water, causticTex);
    } else if (ray.y < 0.0) {
      vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
      color = getWallColor(origin + ray * t.y, sphereCenter, sphereRadius, light, tiles, water, causticTex);
    } else {
      vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
      vec3 hit = origin + ray * t.y;
      if (hit.y < 2.0 / 12.0) {
        color = getWallColor(hit, sphereCenter, sphereRadius, light, tiles, water, causticTex);
      } else {
        color = textureCube(sky, ray).rgb;
        color += vec3(pow(max(0.0, dot(light, ray)), 5000.0)) * vec3(10.0, 8.0, 6.0);
      }
    }
    
    if (ray.y < 0.0) color *= waterColor;
    return color;
  }
  
  void main() {
    vec2 uv = coord;
    vec4 info = texture2D(water, uv);
    
    for (int i = 0; i < 5; i++) {
      uv += info.ba * 0.005;
      info = texture2D(water, uv);
    }
    
    vec3 normal = vec3(info.b, sqrt(1.0 - dot(info.ba, info.ba)), info.a);
    vec3 incomingRay = normalize(position_v - eye);
    
    vec3 reflectedRay = reflect(incomingRay, normal);
    vec3 refractedRay = refract(incomingRay, normal, IOR_AIR / IOR_WATER);
    
    float fresnel = mix(0.25, 1.0, pow(1.0 - dot(normal, -incomingRay), 3.0));
    
    vec3 reflectedColor = getSurfaceRayColor(position_v, reflectedRay, abovewaterColor);
    vec3 refractedColor = getSurfaceRayColor(position_v, refractedRay, abovewaterColor);
    
    gl_FragColor = vec4(mix(refractedColor, reflectedColor, fresnel), 1.0);
  }
`;

// Water surface fragment shader (underwater view)
export const WATER_FRAGMENT_SHADER_UNDERWATER = `
  precision highp float;
  
  uniform sampler2D water;
  uniform sampler2D tiles;
  uniform sampler2D causticTex;
  uniform samplerCube sky;
  uniform vec3 eye;
  uniform vec3 light;
  uniform vec3 sphereCenter;
  uniform float sphereRadius;
  
  varying vec3 position_v;
  varying vec2 coord;
  
  ${SHADER_COMMON}
  
  vec3 getSurfaceRayColor(vec3 origin, vec3 ray, vec3 waterColor) {
    vec3 color;
    float q = intersectSphere(origin, ray, sphereCenter, sphereRadius);
    
    if (q < 1.0e6) {
      color = getSphereColor(origin + ray * q, sphereCenter, sphereRadius, light, water, causticTex);
    } else if (ray.y < 0.0) {
      vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
      color = getWallColor(origin + ray * t.y, sphereCenter, sphereRadius, light, tiles, water, causticTex);
    } else {
      vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
      vec3 hit = origin + ray * t.y;
      if (hit.y < 2.0 / 12.0) {
        color = getWallColor(hit, sphereCenter, sphereRadius, light, tiles, water, causticTex);
      } else {
        color = textureCube(sky, ray).rgb;
        color += vec3(pow(max(0.0, dot(light, ray)), 5000.0)) * vec3(10.0, 8.0, 6.0);
      }
    }
    
    if (ray.y < 0.0) color *= waterColor;
    return color;
  }
  
  void main() {
    vec2 uv = coord;
    vec4 info = texture2D(water, uv);
    
    for (int i = 0; i < 5; i++) {
      uv += info.ba * 0.005;
      info = texture2D(water, uv);
    }
    
    vec3 normal = vec3(info.b, sqrt(1.0 - dot(info.ba, info.ba)), info.a);
    normal.y *= -1.0;
    
    vec3 incomingRay = normalize(position_v - eye);
    
    vec3 reflectedRay = reflect(incomingRay, normal);
    vec3 refractedRay = refract(incomingRay, normal, IOR_WATER / IOR_AIR);
    
    float fresnel = mix(0.5, 1.0, pow(1.0 - dot(normal, -incomingRay), 3.0));
    
    float refractStrength = length(refractedRay);
    
    vec3 reflectedColor = getSurfaceRayColor(position_v, reflectedRay, underwaterColor);
    vec3 refractedColor;
    
    if (refractStrength > 0.0) {
      refractedColor = getSurfaceRayColor(position_v, refractedRay, vec3(1.0)) * vec3(0.8, 1.0, 1.1);
    } else {
      refractedColor = reflectedColor;
      fresnel = 1.0;
    }
    
    gl_FragColor = vec4(mix(reflectedColor, refractedColor, (1.0 - fresnel) * refractStrength), 1.0);
  }
`;

// Pool/Cube vertex shader - CRITICAL: Y-remap for correct depth
export const CUBE_VERTEX_SHADER = `
  precision highp float;
  
  const float poolHeight = 1.0;
  
  varying vec3 position_v;
  
  void main() {
    // CRITICAL: Y-remap to match original
    position_v = position;
    position_v.y = ((1.0 - position_v.y) * (7.0 / 12.0) - 1.0) * poolHeight;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position_v, 1.0);
  }
`;

// Pool/Cube fragment shader
export const CUBE_FRAGMENT_SHADER = `
  precision highp float;
  
  uniform sampler2D water;
  uniform sampler2D tiles;
  uniform sampler2D causticTex;
  uniform vec3 light;
  uniform vec3 sphereCenter;
  uniform float sphereRadius;
  
  varying vec3 position_v;
  
  ${SHADER_COMMON}
  
  void main() {
    vec3 color = getWallColor(position_v, sphereCenter, sphereRadius, light, tiles, water, causticTex);
    
    vec4 info = texture2D(water, position_v.xz * 0.5 + 0.5);
    if (position_v.y < info.r) {
      color *= underwaterColor * 1.2;
    }
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Sphere vertex shader
export const SPHERE_VERTEX_SHADER = `
  precision highp float;
  
  uniform vec3 sphereCenter;
  uniform float sphereRadius;
  
  varying vec3 position_v;
  
  void main() {
    position_v = sphereCenter + position * sphereRadius;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position_v, 1.0);
  }
`;

// Sphere fragment shader
export const SPHERE_FRAGMENT_SHADER = `
  precision highp float;
  
  uniform sampler2D water;
  uniform sampler2D causticTex;
  uniform vec3 light;
  uniform vec3 sphereCenter;
  uniform float sphereRadius;
  
  varying vec3 position_v;
  
  const float IOR_AIR = 1.0;
  const float IOR_WATER = 1.333;
  
  void main() {
    vec3 color = vec3(0.5);
    
    color *= 1.0 - 0.9 / pow((1.0 + sphereRadius - abs(position_v.x)) / sphereRadius, 3.0);
    color *= 1.0 - 0.9 / pow((1.0 + sphereRadius - abs(position_v.z)) / sphereRadius, 3.0);
    color *= 1.0 - 0.9 / pow((position_v.y + 1.0 + sphereRadius) / sphereRadius, 3.0);
    
    vec3 sphereNormal = normalize(position_v - sphereCenter);
    vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    float diffuse = max(0.0, dot(-refractedLight, sphereNormal)) * 0.5;
    
    vec4 info = texture2D(water, position_v.xz * 0.5 + 0.5);
    if (position_v.y < info.r) {
      vec2 causticUV = 0.75 * (position_v.xz - position_v.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5;
      vec4 caustic = texture2D(causticTex, causticUV);
      diffuse *= caustic.r * 4.0 * caustic.g;
    }
    
    color += diffuse;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;
