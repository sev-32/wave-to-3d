/**
 * Volumetric Lighting Shaders
 * Implements god rays and volumetric shadows through water medium
 * Uses ray marching for light scattering and absorption
 */

// Volumetric lighting vertex shader
export const volumetricVertexShader = `
  precision highp float;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Volumetric lighting fragment shader - god rays through water
export const volumetricFragmentShader = `
  precision highp float;
  
  uniform sampler2D tWater;
  uniform sampler2D tCaustics;
  uniform sampler2D tDepth;
  uniform vec3 light;
  uniform vec3 cameraPos;
  uniform vec3 sphereCenter;
  uniform float sphereRadius;
  uniform float time;
  uniform mat4 inverseProjection;
  uniform mat4 inverseView;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  
  const float IOR_AIR = 1.0;
  const float IOR_WATER = 1.333;
  const float poolHeight = 1.0;
  const int RAY_STEPS = 32;
  const float SCATTER_AMOUNT = 0.015;
  const float ABSORPTION = 0.3;
  
  // Signed distance to sphere
  float sdSphere(vec3 p, vec3 center, float radius) {
    return length(p - center) - radius;
  }
  
  // Signed distance to box
  float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
  }
  
  // Pool SDF - box with water surface at y=0, floor at y=-1
  float sdPool(vec3 p) {
    // Pool interior - open top
    vec3 poolCenter = vec3(0.0, -0.5, 0.0);
    vec3 poolSize = vec3(1.0, 0.5, 1.0);
    return sdBox(p - poolCenter, poolSize);
  }
  
  // Get water height at xz position
  float getWaterHeight(vec2 xz) {
    vec2 uv = xz * 0.5 + 0.5;
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 0.0;
    return texture2D(tWater, uv).r;
  }
  
  // Check if point is underwater
  bool isUnderwater(vec3 p) {
    if (abs(p.x) > 1.0 || abs(p.z) > 1.0) return false;
    if (p.y < -1.0 || p.y > 0.5) return false;
    float waterHeight = getWaterHeight(p.xz);
    return p.y < waterHeight;
  }
  
  // Sample caustics at world position
  float sampleCaustics(vec3 p) {
    vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    vec2 causticUV = 0.75 * (p.xz - p.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5;
    if (causticUV.x < 0.0 || causticUV.x > 1.0 || causticUV.y < 0.0 || causticUV.y > 1.0) return 0.0;
    vec4 caustic = texture2D(tCaustics, causticUV);
    return caustic.r * caustic.g;
  }
  
  // Calculate shadow from sphere
  float sphereShadow(vec3 rayOrigin, vec3 rayDir) {
    vec3 oc = rayOrigin - sphereCenter;
    float a = dot(rayDir, rayDir);
    float b = 2.0 * dot(oc, rayDir);
    float c = dot(oc, oc) - sphereRadius * sphereRadius;
    float discriminant = b * b - 4.0 * a * c;
    
    if (discriminant > 0.0) {
      float t = (-b - sqrt(discriminant)) / (2.0 * a);
      if (t > 0.0) {
        // Soft shadow based on distance
        return 0.0;
      }
    }
    return 1.0;
  }
  
  // Ray march through water volume for volumetric lighting
  vec3 rayMarchVolume(vec3 rayOrigin, vec3 rayDir, float maxDist) {
    vec3 accumulated = vec3(0.0);
    float transmittance = 1.0;
    
    vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    
    float stepSize = maxDist / float(RAY_STEPS);
    vec3 step = rayDir * stepSize;
    vec3 currentPos = rayOrigin;
    
    for (int i = 0; i < RAY_STEPS; i++) {
      currentPos += step;
      
      // Check if in water volume
      if (!isUnderwater(currentPos)) continue;
      
      // Sample caustics at this point
      float caustic = sampleCaustics(currentPos);
      
      // Calculate light contribution with sphere shadow
      float shadow = sphereShadow(currentPos, -refractedLight);
      
      // Distance-based shadow softness for pool edges
      float edgeDist = min(
        min(1.0 - abs(currentPos.x), 1.0 - abs(currentPos.z)),
        currentPos.y + 1.0
      );
      float edgeShadow = smoothstep(0.0, 0.2, edgeDist);
      
      // Light scattering - god ray contribution
      float scatter = SCATTER_AMOUNT * (1.0 + caustic * 3.0) * shadow * edgeShadow;
      
      // Water color tint
      vec3 waterTint = vec3(0.2, 0.5, 0.6);
      
      // Accumulate light with absorption
      accumulated += transmittance * scatter * waterTint;
      transmittance *= exp(-ABSORPTION * stepSize);
      
      if (transmittance < 0.01) break;
    }
    
    return accumulated;
  }
  
  void main() {
    // Reconstruct world position from depth
    // For now, use a simple approach
    vec3 rayDir = normalize(vPosition - cameraPos);
    float maxDist = 4.0;
    
    // Check if we're looking through water
    bool cameraUnderwater = isUnderwater(cameraPos);
    
    vec3 volumetricLight = rayMarchVolume(cameraPos, rayDir, maxDist);
    
    gl_FragColor = vec4(volumetricLight, 1.0);
  }
`;

// God rays vertex shader - screen space
export const godRaysVertexShader = `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// God rays fragment shader - radial blur from light source
export const godRaysFragmentShader = `
  precision highp float;
  
  uniform sampler2D tDiffuse;
  uniform sampler2D tCaustics;
  uniform vec2 lightScreenPos;
  uniform float exposure;
  uniform float decay;
  uniform float density;
  uniform float weight;
  
  varying vec2 vUv;
  
  const int NUM_SAMPLES = 64;
  
  void main() {
    vec2 texCoord = vUv;
    vec2 deltaTexCoord = (texCoord - lightScreenPos);
    deltaTexCoord *= 1.0 / float(NUM_SAMPLES) * density;
    
    vec3 color = texture2D(tDiffuse, texCoord).rgb;
    float illuminationDecay = 1.0;
    
    for (int i = 0; i < NUM_SAMPLES; i++) {
      texCoord -= deltaTexCoord;
      vec3 sample = texture2D(tDiffuse, texCoord).rgb;
      sample *= illuminationDecay * weight;
      color += sample;
      illuminationDecay *= decay;
    }
    
    gl_FragColor = vec4(color * exposure, 1.0);
  }
`;

// Volumetric shadow accumulation shader
export const volumetricShadowShader = `
  precision highp float;
  
  uniform sampler2D tWater;
  uniform vec3 light;
  uniform vec3 sphereCenter;
  uniform float sphereRadius;
  uniform vec3 samplePos;
  
  const float IOR_AIR = 1.0;
  const float IOR_WATER = 1.333;
  
  varying vec2 vUv;
  
  // Compute shadow intensity at a point in the water volume
  float computeVolumeShadow(vec3 pos) {
    vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    
    // Ray from pos toward light
    vec3 toLight = -refractedLight;
    
    // Check sphere intersection
    vec3 oc = pos - sphereCenter;
    float a = dot(toLight, toLight);
    float b = 2.0 * dot(oc, toLight);
    float c = dot(oc, oc) - sphereRadius * sphereRadius;
    float discriminant = b * b - 4.0 * a * c;
    
    if (discriminant > 0.0) {
      float t1 = (-b - sqrt(discriminant)) / (2.0 * a);
      float t2 = (-b + sqrt(discriminant)) / (2.0 * a);
      
      if (t1 > 0.0 || t2 > 0.0) {
        // In shadow - calculate softness based on distance
        float minT = max(0.0, min(t1, t2));
        vec3 hitPoint = pos + toLight * minT;
        float distToEdge = length(hitPoint - sphereCenter) - sphereRadius;
        
        // Soft shadow falloff
        float softness = smoothstep(0.0, sphereRadius * 0.5, abs(distToEdge));
        return mix(0.2, 1.0, softness);
      }
    }
    
    // Check pool wall shadows
    // Distance from edge of pool to shadow line
    float poolEdgeShadow = 1.0;
    
    // Top edges cast shadows into the water
    if (pos.y < 0.0) {
      // Calculate shadow from pool rim
      float lightAngle = atan(refractedLight.y, length(refractedLight.xz));
      float shadowDepth = (0.0 - pos.y) / tan(max(0.1, lightAngle));
      
      float distToWall = min(1.0 - abs(pos.x), 1.0 - abs(pos.z));
      if (distToWall < shadowDepth * 0.5) {
        float shadowIntensity = smoothstep(0.0, shadowDepth * 0.3, distToWall);
        poolEdgeShadow = mix(0.3, 1.0, shadowIntensity);
      }
    }
    
    return poolEdgeShadow;
  }
  
  void main() {
    float shadow = computeVolumeShadow(samplePos);
    gl_FragColor = vec4(shadow, shadow, shadow, 1.0);
  }
`;
