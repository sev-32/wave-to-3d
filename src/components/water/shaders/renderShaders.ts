/**
 * Rendering Shaders for Water Surface, Pool, and Sphere
 * Ported from GPTWAVES reference - WORKING IMPLEMENTATION
 */

// Water surface vertex shader
export const waterSurfaceVertexShader = `
  precision highp float;
  
  uniform sampler2D tWater;
  
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vWorldPos;
  
  void main() {
    vUv = uv;
    
    // Sample water height
    vec4 info = texture2D(tWater, uv);
    
    // Displace vertex by water height
    vec3 pos = position;
    pos.y += info.r;
    
    vPosition = pos;
    vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Common functions for water/pool shaders
const shaderCommon = `
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
  
  // Volumetric shadow calculation
  float computeVolumeShadow(vec3 pos, vec3 sphereCenter, float sphereRadius, vec3 lightDir) {
    vec3 refractedLight = refract(-lightDir, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    vec3 toLight = -refractedLight;
    
    // Sphere shadow
    vec3 oc = pos - sphereCenter;
    float a = dot(toLight, toLight);
    float b = 2.0 * dot(oc, toLight);
    float c = dot(oc, oc) - sphereRadius * sphereRadius;
    float discriminant = b * b - 4.0 * a * c;
    
    float shadow = 1.0;
    if (discriminant > 0.0) {
      float t1 = (-b - sqrt(discriminant)) / (2.0 * a);
      if (t1 > 0.0) {
        // Calculate soft shadow based on distance to shadow edge
        vec3 hitPoint = pos + toLight * t1;
        float distFromCenter = length(hitPoint - sphereCenter);
        float softness = smoothstep(sphereRadius * 0.8, sphereRadius * 1.2, distFromCenter);
        shadow = mix(0.15, 1.0, softness);
      }
    }
    
    // Pool edge shadows - walls cast shadows into water
    if (pos.y < 0.0) {
      float lightAngle = atan(-refractedLight.y, length(refractedLight.xz));
      float tanAngle = tan(max(0.1, lightAngle));
      
      // Shadow from each wall
      float shadowX = 1.0, shadowZ = 1.0;
      
      // +X wall shadow
      if (refractedLight.x > 0.0) {
        float shadowDist = (1.0 - pos.x) * tanAngle;
        float depth = -pos.y;
        if (depth < shadowDist) {
          float softness = (shadowDist - depth) / (shadowDist * 0.3 + 0.01);
          shadowX = min(shadowX, mix(0.3, 1.0, clamp(softness, 0.0, 1.0)));
        }
      }
      // -X wall shadow
      if (refractedLight.x < 0.0) {
        float shadowDist = (1.0 + pos.x) * tanAngle;
        float depth = -pos.y;
        if (depth < shadowDist) {
          float softness = (shadowDist - depth) / (shadowDist * 0.3 + 0.01);
          shadowX = min(shadowX, mix(0.3, 1.0, clamp(softness, 0.0, 1.0)));
        }
      }
      // +Z wall shadow
      if (refractedLight.z > 0.0) {
        float shadowDist = (1.0 - pos.z) * tanAngle;
        float depth = -pos.y;
        if (depth < shadowDist) {
          float softness = (shadowDist - depth) / (shadowDist * 0.3 + 0.01);
          shadowZ = min(shadowZ, mix(0.3, 1.0, clamp(softness, 0.0, 1.0)));
        }
      }
      // -Z wall shadow
      if (refractedLight.z < 0.0) {
        float shadowDist = (1.0 + pos.z) * tanAngle;
        float depth = -pos.y;
        if (depth < shadowDist) {
          float softness = (shadowDist - depth) / (shadowDist * 0.3 + 0.01);
          shadowZ = min(shadowZ, mix(0.3, 1.0, clamp(softness, 0.0, 1.0)));
        }
      }
      
      shadow *= min(shadowX, shadowZ);
    }
    
    return shadow;
  }
  
  vec3 getSphereColor(vec3 point, vec3 sphereCenter, float sphereRadius, vec3 light, sampler2D water, sampler2D causticTex) {
    vec3 color = vec3(0.5);
    
    // Edge darkening based on distance to walls
    color *= 1.0 - 0.9 / pow((1.0 + sphereRadius - abs(point.x)) / sphereRadius, 3.0);
    color *= 1.0 - 0.9 / pow((1.0 + sphereRadius - abs(point.z)) / sphereRadius, 3.0);
    color *= 1.0 - 0.9 / pow((point.y + 1.0 + sphereRadius) / sphereRadius, 3.0);
    
    vec3 sphereNormal = (point - sphereCenter) / sphereRadius;
    vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    float diffuse = max(0.0, dot(-refractedLight, sphereNormal)) * 0.5;
    
    vec4 info = texture2D(water, point.xz * 0.5 + 0.5);
    if (point.y < info.r) {
      // Underwater - apply caustics
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
    
    // Determine which wall we're on and get appropriate texture coords
    if (abs(point.x) > 0.999) {
      wallColor = texture2D(tiles, point.yz * 0.5 + vec2(1.0, 0.5)).rgb;
      normal = vec3(-point.x, 0.0, 0.0);
    } else if (abs(point.z) > 0.999) {
      wallColor = texture2D(tiles, point.yx * 0.5 + vec2(1.0, 0.5)).rgb;
      normal = vec3(0.0, 0.0, -point.z);
    } else {
      // Floor
      wallColor = texture2D(tiles, point.xz * 0.5 + 0.5).rgb;
      normal = vec3(0.0, 1.0, 0.0);
    }
    
    // Distance-based darkening
    scale /= length(point);
    
    // Sphere proximity darkening (ambient occlusion)
    float sphereDist = length(point - sphereCenter);
    scale *= 1.0 - 0.9 / pow(sphereDist / sphereRadius, 4.0);
    
    // Volumetric shadow
    float volumeShadow = computeVolumeShadow(point, sphereCenter, sphereRadius, light);
    
    vec3 refractedLight = -refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    float diffuse = max(0.0, dot(refractedLight, normal));
    
    vec4 info = texture2D(water, point.xz * 0.5 + 0.5);
    
    // Check if point is underwater
    if (point.y < info.r) {
      // Sample caustics with proper projection
      vec2 causticUV = 0.75 * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5;
      vec4 caustic = texture2D(causticTex, causticUV);
      
      // Apply caustics with shadow modulation
      scale += diffuse * caustic.r * 2.0 * caustic.g * volumeShadow;
    } else {
      // Above water - direct light with shadow
      vec2 t = intersectCube(point, refractedLight, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
      diffuse *= 1.0 / (1.0 + exp(-200.0 / (1.0 + 10.0 * (t.y - t.x)) * (point.y + refractedLight.y * t.y - 2.0 / 12.0)));
      scale += diffuse * 0.5 * volumeShadow;
    }
    
    return wallColor * scale;
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
  
  ${shaderCommon}
  
  vec3 getSurfaceRayColor(vec3 origin, vec3 ray, vec3 waterColor) {
    vec3 color;
    float q = intersectSphere(origin, ray, sphereCenter, sphereRadius);
    
    if (q < 1.0e6) {
      color = getSphereColor(origin + ray * q, sphereCenter, sphereRadius, light, tWater, tCaustics);
    } else if (ray.y < 0.0) {
      vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
      color = getWallColor(origin + ray * t.y, sphereCenter, sphereRadius, light, tTiles, tWater, tCaustics);
    } else {
      vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
      vec3 hit = origin + ray * t.y;
      if (hit.y < 2.0 / 12.0) {
        color = getWallColor(hit, sphereCenter, sphereRadius, light, tTiles, tWater, tCaustics);
      } else {
        color = textureCube(tSky, ray).rgb;
        // Sun highlight
        color += vec3(pow(max(0.0, dot(light, ray)), 5000.0)) * vec3(10.0, 8.0, 6.0);
      }
    }
    
    if (ray.y < 0.0) color *= waterColor;
    return color;
  }
  
  void main() {
    vec2 coord = vPosition.xz * 0.5 + 0.5;
    vec4 info = texture2D(tWater, coord);
    
    // Refine coordinate with normal offset for ripple distortion
    for (int i = 0; i < 5; i++) {
      coord += info.ba * 0.005;
      info = texture2D(tWater, coord);
    }
    
    // Calculate surface normal from water info
    vec3 normal = vec3(info.b, sqrt(1.0 - dot(info.ba, info.ba)), info.a);
    vec3 incomingRay = normalize(vPosition - eye);
    
    // Above water: reflect and refract
    vec3 reflectedRay = reflect(incomingRay, normal);
    vec3 refractedRay = refract(incomingRay, normal, IOR_AIR / IOR_WATER);
    
    // Fresnel effect - more reflection at grazing angles
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
  
  ${shaderCommon}
  
  vec3 getSurfaceRayColor(vec3 origin, vec3 ray, vec3 waterColor) {
    vec3 color;
    float q = intersectSphere(origin, ray, sphereCenter, sphereRadius);
    
    if (q < 1.0e6) {
      color = getSphereColor(origin + ray * q, sphereCenter, sphereRadius, light, tWater, tCaustics);
    } else if (ray.y < 0.0) {
      vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
      color = getWallColor(origin + ray * t.y, sphereCenter, sphereRadius, light, tTiles, tWater, tCaustics);
    } else {
      vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
      vec3 hit = origin + ray * t.y;
      if (hit.y < 2.0 / 12.0) {
        color = getWallColor(hit, sphereCenter, sphereRadius, light, tTiles, tWater, tCaustics);
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
    
    // Refine coordinate with normal offset
    for (int i = 0; i < 5; i++) {
      coord += info.ba * 0.005;
      info = texture2D(tWater, coord);
    }
    
    // Calculate surface normal (flipped for underwater view)
    vec3 normal = -vec3(info.b, sqrt(1.0 - dot(info.ba, info.ba)), info.a);
    vec3 incomingRay = normalize(vPosition - eye);
    
    // Underwater: internal reflection and refraction
    vec3 reflectedRay = reflect(incomingRay, normal);
    vec3 refractedRay = refract(incomingRay, normal, IOR_WATER / IOR_AIR);
    
    // Total internal reflection check
    float fresnel = mix(0.5, 1.0, pow(1.0 - dot(normal, -incomingRay), 3.0));
    
    // If refraction fails (total internal reflection), use reflection
    float refractStrength = length(refractedRay);
    
    vec3 reflectedColor = getSurfaceRayColor(vPosition, reflectedRay, underwaterColor);
    vec3 refractedColor;
    
    if (refractStrength > 0.0) {
      refractedColor = getSurfaceRayColor(vPosition, refractedRay, vec3(1.0)) * vec3(0.8, 1.0, 1.1);
    } else {
      refractedColor = reflectedColor;
      fresnel = 1.0;
    }
    
    gl_FragColor = vec4(mix(reflectedColor, refractedColor, (1.0 - fresnel) * refractStrength), 1.0);
  }
`;

// Pool walls vertex shader - uses original geometry coordinates
export const poolVertexShader = `
  precision highp float;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  void main() {
    // Position is already in pool-space (-1 to 1 for x,z, -1 to 0 for y)
    vPosition = position;
    vNormal = normal;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Pool walls fragment shader with volumetric shadows and caustics
export const poolFragmentShader = `
  precision highp float;
  
  uniform sampler2D tWater;
  uniform sampler2D tTiles;
  uniform sampler2D tCaustics;
  uniform vec3 light;
  uniform vec3 sphereCenter;
  uniform float sphereRadius;
  uniform vec3 eye;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  ${shaderCommon}
  
  void main() {
    vec3 color = getWallColor(vPosition, sphereCenter, sphereRadius, light, tTiles, tWater, tCaustics);
    
    // Underwater tinting
    vec4 info = texture2D(tWater, vPosition.xz * 0.5 + 0.5);
    if (vPosition.y < info.r) {
      color *= underwaterColor * 1.2;
    }
    
    // Distance fog underwater
    float distToCamera = length(vPosition - eye);
    float fogFactor = 1.0 - exp(-distToCamera * 0.15);
    vec3 fogColor = underwaterColor * 0.3;
    
    if (eye.y < 0.0) {
      color = mix(color, fogColor, fogFactor * 0.5);
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
  varying vec3 vNormal;
  
  void main() {
    // Transform unit sphere to world position
    vPosition = sphereCenter + position * sphereRadius;
    vNormal = normalize(position);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
  }
`;

// Sphere fragment shader with caustics
export const sphereFragmentShader = `
  precision highp float;
  
  uniform sampler2D tWater;
  uniform sampler2D tCaustics;
  uniform vec3 light;
  uniform vec3 sphereCenter;
  uniform float sphereRadius;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  const float IOR_AIR = 1.0;
  const float IOR_WATER = 1.333;
  
  void main() {
    vec3 color = vec3(0.5);
    
    // Edge darkening based on distance to walls
    color *= 1.0 - 0.9 / pow((1.0 + sphereRadius - abs(vPosition.x)) / sphereRadius, 3.0);
    color *= 1.0 - 0.9 / pow((1.0 + sphereRadius - abs(vPosition.z)) / sphereRadius, 3.0);
    color *= 1.0 - 0.9 / pow((vPosition.y + 1.0 + sphereRadius) / sphereRadius, 3.0);
    
    // Diffuse lighting
    vec3 sphereNormal = vNormal;
    vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    float diffuse = max(0.0, dot(-refractedLight, sphereNormal)) * 0.5;
    
    // Check if underwater for caustics
    vec4 info = texture2D(tWater, vPosition.xz * 0.5 + 0.5);
    if (vPosition.y < info.r) {
      // Sample caustics
      vec2 causticUV = 0.75 * (vPosition.xz - vPosition.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5;
      vec4 caustic = texture2D(tCaustics, causticUV);
      diffuse *= caustic.r * 4.0 * caustic.g;
    }
    
    color += diffuse;
    
    // Specular highlight
    vec3 viewDir = normalize(cameraPosition - vPosition);
    vec3 halfDir = normalize(viewDir - refractedLight);
    float specular = pow(max(0.0, dot(sphereNormal, halfDir)), 32.0);
    color += specular * 0.3;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;
