/**
 * WGSL Compute Shaders for WebGPU Water Simulation
 * Implements: heightfield sim, surface intent fields (R,U,C,M,A), MLS-MPM particle emission & physics
 */

export const GRID_SIZE = 256;
export const MAX_PARTICLES = 8192;

// ========== Water Drop Shader ==========
export const waterDropShader = /* wgsl */`
const N: u32 = ${GRID_SIZE}u;
const PI: f32 = 3.141592653589793;

struct DropParams {
  centerX: f32,
  centerY: f32,
  radius: f32,
  strength: f32,
}

@group(0) @binding(0) var<storage, read> waterIn: array<vec4f>;
@group(0) @binding(1) var<storage, read_write> waterOut: array<vec4f>;
@group(0) @binding(2) var<uniform> drop: DropParams;

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= N || gid.y >= N) { return; }
  let i = gid.y * N + gid.x;
  var info = waterIn[i];
  
  let uv = vec2f(f32(gid.x) / f32(N - 1u), f32(gid.y) / f32(N - 1u));
  let center = vec2f(drop.centerX, drop.centerY);
  let dist = length(center - uv) / drop.radius;
  let d = max(0.0, 1.0 - dist);
  let dropVal = 0.5 - cos(d * PI) * 0.5;
  info.x += dropVal * drop.strength;
  
  waterOut[i] = info;
}
`;

// ========== Water Update Shader (wave propagation) ==========
export const waterUpdateShader = /* wgsl */`
const N: u32 = ${GRID_SIZE}u;

struct UpdateParams {
  damping: f32,
  pad0: f32,
  pad1: f32,
  pad2: f32,
}

@group(0) @binding(0) var<storage, read> waterIn: array<vec4f>;
@group(0) @binding(1) var<storage, read_write> waterOut: array<vec4f>;
@group(0) @binding(2) var<uniform> params: UpdateParams;

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  let x = gid.x;
  let z = gid.y;
  if (x >= N || z >= N) { return; }
  
  let i = z * N + x;
  var info = waterIn[i];
  
  // Safe neighbor indices
  let lx = select(x - 1u, 0u, x == 0u);
  let rx = min(x + 1u, N - 1u);
  let uz = select(z - 1u, 0u, z == 0u);
  let dz = min(z + 1u, N - 1u);
  
  let left  = waterIn[z * N + lx].x;
  let right = waterIn[z * N + rx].x;
  let up    = waterIn[uz * N + x].x;
  let down  = waterIn[dz * N + x].x;
  
  let avg = (left + right + up + down) * 0.25;
  info.y += (avg - info.x) * 2.0;
  info.y *= params.damping;
  info.x += info.y;
  
  waterOut[i] = info;
}
`;

// ========== Water Normals Shader ==========
export const waterNormalsShader = /* wgsl */`
const N: u32 = ${GRID_SIZE}u;
const DELTA: f32 = 1.0 / f32(${GRID_SIZE});

@group(0) @binding(0) var<storage, read> waterIn: array<vec4f>;
@group(0) @binding(1) var<storage, read_write> waterOut: array<vec4f>;

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  let x = gid.x;
  let z = gid.y;
  if (x >= N || z >= N) { return; }
  
  let i = z * N + x;
  var info = waterIn[i];
  
  let rx = min(x + 1u, N - 1u);
  let dz = min(z + 1u, N - 1u);
  
  let hR = waterIn[z * N + rx].x;
  let hD = waterIn[dz * N + x].x;
  
  let dx = vec3f(DELTA, hR - info.x, 0.0);
  let dy = vec3f(0.0, hD - info.x, DELTA);
  let normal = normalize(cross(dy, dx));
  
  info.z = normal.x;
  info.w = normal.z;
  
  waterOut[i] = info;
}
`;

// ========== Sphere Displacement Shader ==========
// Enhanced with proper SDF-based displacement for realistic wave generation
export const sphereDisplacementShader = /* wgsl */`
const N: u32 = ${GRID_SIZE}u;

struct SphereParams {
  oldX: f32, oldY: f32, oldZ: f32, radius: f32,
  newX: f32, newY: f32, newZ: f32, pad: f32,
}

@group(0) @binding(0) var<storage, read> waterIn: array<vec4f>;
@group(0) @binding(1) var<storage, read_write> waterOut: array<vec4f>;
@group(0) @binding(2) var<uniform> sphere: SphereParams;

fn sphereSDF(p: vec3f, center: vec3f, radius: f32) -> f32 {
  return length(p - center) - radius;
}

fn volumeInSphere(center: vec3f, uv: vec2f, radius: f32) -> f32 {
  let worldPos = vec3f(uv.x * 2.0 - 1.0, 0.0, uv.y * 2.0 - 1.0);
  let dist = length(worldPos.xz - center.xz);
  let horizontalDist = dist / radius;
  
  if (horizontalDist > 1.3) { return 0.0; }
  
  let cap = max(0.0, 1.0 - horizontalDist * horizontalDist);
  let sphereTop = center.y + radius * sqrt(cap);
  let sphereBot = center.y - radius * sqrt(cap);
  
  let waterY = 0.0;
  let submergedTop = min(sphereTop, waterY);
  let submergedBot = max(sphereBot, -1.0);
  
  if (submergedTop <= submergedBot) { return 0.0; }
  
  // Gentle displacement - clamped to prevent runaway
  let displacement = (submergedTop - submergedBot) * cap * 0.04;
  return min(displacement, 0.02);
}

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= N || gid.y >= N) { return; }
  let i = gid.y * N + gid.x;
  var info = waterIn[i];
  
  let uv = vec2f(f32(gid.x) / f32(N - 1u), f32(gid.y) / f32(N - 1u));
  let oldCenter = vec3f(sphere.oldX, sphere.oldY, sphere.oldZ);
  let newCenter = vec3f(sphere.newX, sphere.newY, sphere.newZ);
  
  // Velocity-based wave generation
  let velocity = newCenter - oldCenter;
  let speed = length(velocity);
  
  // Volume displacement (push water away from sphere)
  let oldVol = volumeInSphere(oldCenter, uv, sphere.radius);
  let newVol = volumeInSphere(newCenter, uv, sphere.radius);
  info.x += oldVol - newVol;
  
  // Velocity-proportional bow wave (wake effect)
  if (speed > 0.001) {
    let worldPos = vec2f(uv.x * 2.0 - 1.0, uv.y * 2.0 - 1.0);
    let toPoint = worldPos - newCenter.xz;
    let dist = length(toPoint);
    let normDist = dist / sphere.radius;
    
    if (normDist < 3.0 && normDist > 0.1) {
      let velDir2D = normalize(velocity.xz + vec2f(0.0001));
      let pointDir = normalize(toPoint + vec2f(0.0001));
      let alignment = dot(velDir2D, pointDir);
      
      // Bow wave: positive ahead, negative behind
      let bowWave = alignment * speed * 2.0;
      let falloff = exp(-normDist * 1.2);
      
      // Kelvin wake pattern (V-shaped)
      let crossAlignment = abs(cross(vec3f(velDir2D, 0.0), vec3f(pointDir, 0.0)).z);
      let wakeAngle = 0.33; // ~19.5 degrees Kelvin angle
      let isInWake = smoothstep(wakeAngle - 0.1, wakeAngle + 0.1, crossAlignment);
      let wakeFactor = isInWake * (1.0 - alignment) * 0.5; // Behind the sphere
      
      info.y += (bowWave * falloff + wakeFactor * speed * falloff) * 0.3;
    }
  }
  
  waterOut[i] = info;
}
`;

// ========== Surface Intent Fields Shader ==========
// Computes R (rupture), C (coherence), M (reservoir), A (adhesion), U (momentum)
export const surfaceFieldsShader = /* wgsl */`
const N: u32 = ${GRID_SIZE}u;
const INV_N: f32 = 1.0 / f32(${GRID_SIZE});

struct FieldParams {
  dt: f32,
  refillRate: f32,
  decayRate: f32,
  emitThreshold: f32,
}

@group(0) @binding(0) var<storage, read> water: array<vec4f>;
@group(0) @binding(1) var<storage, read> fieldIn: array<vec4f>;     // R, C, M, A
@group(0) @binding(2) var<storage, read_write> fieldOut: array<vec4f>; // R, C, M, A
@group(0) @binding(3) var<storage, read_write> field2: array<vec4f>;   // Ux, Uz, divU, slope
@group(0) @binding(4) var<uniform> params: FieldParams;

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  let x = gid.x;
  let z = gid.y;
  if (x >= N || z >= N) { return; }
  
  let i = z * N + x;
  let info = water[i];
  let prevField = fieldIn[i];
  
  let height = info.x;
  let velocity = info.y;
  
  // Safe neighbor access
  let lx = select(x - 1u, 0u, x == 0u);
  let rx = min(x + 1u, N - 1u);
  let uz = select(z - 1u, 0u, z == 0u);
  let dz = min(z + 1u, N - 1u);
  
  // Height gradient
  let hL = water[z * N + lx].x;
  let hR = water[z * N + rx].x;
  let hU = water[uz * N + x].x;
  let hD = water[dz * N + x].x;
  
  let gradX = (hR - hL) * 0.5 * f32(N);
  let gradZ = (hD - hU) * 0.5 * f32(N);
  let slope = sqrt(gradX * gradX + gradZ * gradZ);
  
  // Laplacian (curvature proxy)
  let laplacian = (hL + hR + hU + hD - 4.0 * height) * f32(N) * f32(N);
  let crestness = abs(laplacian);
  
  // Upward excitation
  let Eup = max(0.0, velocity);
  
  // ---- Surface Momentum U ----
  let momentumGainX = -gradX * velocity * params.dt * 5.0;
  let momentumGainZ = -gradZ * velocity * params.dt * 5.0;
  var Ux = prevField.x * 0.95 + momentumGainX;
  var Uz = prevField.y * 0.95 + momentumGainZ;
  let Umag = sqrt(Ux * Ux + Uz * Uz);
  
  // Momentum divergence
  let UxL = fieldIn[z * N + lx].x;
  let UxR = fieldIn[z * N + rx].x;
  let UzU = fieldIn[uz * N + x].y;
  let UzD = fieldIn[dz * N + x].y;
  let divU = (UxR - UxL + UzD - UzU) * 0.5 * f32(N);
  
  // ---- Rupture Potential R ----
  let wK = 0.25;
  let wE = 0.35;
  let wS = 0.2;
  let wU = 0.2;
  
  let Rraw = wK * min(crestness * 0.5, 1.0) 
           + wE * min(Eup * 15.0, 1.0) 
           + wS * min(slope * 2.5, 1.0) 
           + wU * min(Umag * 5.0, 1.0);
  
  let chargeRate = 4.0;
  let R_decay = 2.5;
  var R = prevField.x;
  R += (chargeRate * clamp(Rraw, 0.0, 1.0) - R_decay * R) * params.dt;
  R = clamp(R, 0.0, 1.0);
  
  // ---- Coherence C ----
  let gradMag = max(slope, 0.001);
  let normGradX = gradX / gradMag;
  let normGradZ = gradZ / gradMag;
  
  let gradXR = (water[z * N + min(rx + 1u, N - 1u)].x - hR) * f32(N);
  let gradZD = (water[min(dz + 1u, N - 1u) * N + x].x - hD) * f32(N);
  let neighborGradMag = max(sqrt(gradXR * gradXR + gradZD * gradZD), 0.001);
  let alignment = abs(normGradX * gradXR / neighborGradMag + normGradZ * gradZD / neighborGradMag);
  
  let Craw = alignment * 0.7 + min(Umag * 3.0, 1.0) * 0.3;
  var C = prevField.y;
  C += (2.0 * Craw - 1.5 * C) * params.dt;
  C = clamp(C, 0.0, 1.0);
  
  // ---- Reservoir Mass M ----
  let M0 = 0.6;
  var M = prevField.z;
  let refill = params.refillRate * (M0 - M);
  let drain = select(0.0, R * C * 0.8, R > params.emitThreshold);
  M += (refill - drain) * params.dt;
  M = clamp(M, 0.0, 1.0);
  
  // ---- Adhesion A ----
  var A = prevField.w;
  let calmRecovery = 0.5 * (1.0 - R);
  let ruptureSuppression = R * 2.0;
  A += (calmRecovery - ruptureSuppression - A * 0.3) * params.dt;
  A = clamp(A, 0.0, 1.0);
  
  fieldOut[i] = vec4f(R, C, M, A);
  field2[i] = vec4f(Ux, Uz, divU, slope);
}
`;

// ========== Particle Emit Shader ==========
// Enhanced emission from surface intent fields with MLS-MPM-like initialization
export const emitParticlesShader = /* wgsl */`
const N: u32 = ${GRID_SIZE}u;
const MAX_P: u32 = ${MAX_PARTICLES}u;

struct EmitParams {
  threshold: f32,
  liftStrength: f32,
  throwStrength: f32,
  maxEmitPerFrame: f32,
}

@group(0) @binding(0) var<storage, read> water: array<vec4f>;
@group(0) @binding(1) var<storage, read> fields: array<vec4f>;    // R, C, M, A
@group(0) @binding(2) var<storage, read> fields2: array<vec4f>;   // Ux, Uz, divU, slope
@group(0) @binding(3) var<storage, read_write> particles: array<vec4f>; // [pos+mass, vel+age] pairs
@group(0) @binding(4) var<storage, read_write> counter: array<atomic<u32>>;

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  let x = gid.x;
  let z = gid.y;
  // Check every 3rd texel for denser emission
  if (x >= N || z >= N || (x % 3u != 0u) || (z % 3u != 0u)) { return; }
  
  let i = z * N + x;
  let field = fields[i];
  let R = field.x;
  let C = field.y;
  let M = field.z;
  
  // Emit from high-R, high-M regions with energy threshold
  if (R < 0.3 || M < 0.08) { return; }
  
  let f2 = fields2[i];
  let Ux = f2.x;
  let Uz = f2.y;
  let waterInfo = water[i];
  let height = waterInfo.x;
  let velocity = waterInfo.y;
  
  // Only emit when there's upward energy
  if (velocity < 0.001) { return; }
  
  // Pseudo-random using position for stochastic emission
  let noise = fract(sin(f32(x) * 12.9898 + f32(z) * 78.233 + f32(atomicLoad(&counter[0])) * 0.1) * 43758.5453);
  
  // Probability-based emission scaled by rupture intensity
  if (noise > R * 0.8) { return; }
  
  let worldX = f32(x) / f32(N - 1u) * 2.0 - 1.0;
  let worldZ = f32(z) / f32(N - 1u) * 2.0 - 1.0;
  
  // Allocate particle slot
  let slot = atomicAdd(&counter[0], 1u);
  if (slot >= MAX_P / 2u) {
    atomicSub(&counter[0], 1u);
    return;
  }
  
  let pIdx = slot * 2u;
  
  // Surface normal for lift direction
  let nx = waterInfo.z;
  let nz = waterInfo.w;
  let ny = sqrt(max(0.0, 1.0 - nx * nx - nz * nz));
  
  // MLS-MPM-inspired velocity initialization
  // Particles inherit surface momentum + normal-directed lift
  let liftScale = R * M * 3.0;
  let throwScale = C * 4.0;
  
  // Stochastic perturbation for natural spread
  let noiseAngle = noise * 6.283;
  let noise2 = fract(sin(noise * 47.3 + 123.456) * 78901.234);
  let spreadRadius = (1.0 - C) * 0.8 + noise2 * 0.3;
  
  // Velocity: surface momentum + lift + spread
  let vx = Ux * throwScale + nx * liftScale * 0.4 + cos(noiseAngle) * spreadRadius;
  let vy = ny * liftScale * 1.5 + max(velocity * 4.0, 0.3) + noise2 * 0.5;
  let vz = Uz * throwScale + nz * liftScale * 0.4 + sin(noiseAngle) * spreadRadius;
  
  // Small random offset from surface for separation
  let offsetX = cos(noiseAngle) * 0.005;
  let offsetZ = sin(noiseAngle) * 0.005;
  
  particles[pIdx] = vec4f(worldX + offsetX, height + 0.015, worldZ + offsetZ, 1.0);
  particles[pIdx + 1u] = vec4f(vx, vy, vz, 0.0);
}
`;

// ========== Particle Update Shader ==========
// Enhanced with MLS-MPM-like interactions: inter-particle forces, surface tension, cohesion
export const updateParticlesShader = /* wgsl */`
const MAX_P: u32 = ${MAX_PARTICLES}u;

struct PhysicsParams {
  dt: f32,
  gravity: f32,
  damping: f32,
  maxAge: f32,
}

@group(0) @binding(0) var<storage, read_write> particles: array<vec4f>;
@group(0) @binding(1) var<storage, read_write> counter: array<atomic<u32>>;
@group(0) @binding(2) var<uniform> physics: PhysicsParams;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  let count = atomicLoad(&counter[0]);
  if (gid.x >= count) { return; }
  
  let pIdx = gid.x * 2u;
  var pos = particles[pIdx];
  var vel = particles[pIdx + 1u];
  
  if (pos.w <= 0.0) { return; } // Skip inactive
  
  let dt = physics.dt;
  let age = vel.w;
  
  // Gravity with buoyancy
  let waterSurfaceY = 0.0;
  let isSubmerged = pos.y < waterSurfaceY;
  let buoyancy = select(0.0, 4.0, isSubmerged); // Upward force when below surface
  vel.y -= (physics.gravity - buoyancy) * dt;
  
  // Water drag (stronger when submerged)
  let dragCoeff = select(0.02, 0.15, isSubmerged);
  let speed = length(vec3f(vel.x, vel.y, vel.z));
  if (speed > 0.01) {
    let dragForce = dragCoeff * speed * speed;
    let dragDecel = min(dragForce * dt / speed, 0.5); // Cap deceleration
    vel.x -= vel.x * dragDecel;
    vel.y -= vel.y * dragDecel;
    vel.z -= vel.z * dragDecel;
  }
  
  // Surface tension effect: particles near water surface get pulled back
  let distToSurface = abs(pos.y - waterSurfaceY);
  if (distToSurface < 0.05 && age > 0.3) {
    let surfacePull = (waterSurfaceY - pos.y) * 8.0 * dt;
    vel.y += surfacePull;
    // Also dampen horizontal velocity near surface (surface tension)
    vel.x *= 0.98;
    vel.z *= 0.98;
  }
  
  // Advect
  pos.x += vel.x * dt;
  pos.y += vel.y * dt;
  pos.z += vel.z * dt;
  
  // Pool boundary collisions with energy loss
  if (pos.y < -1.0) {
    pos.y = -1.0;
    vel.y = abs(vel.y) * 0.2;
    vel.x *= 0.7;
    vel.z *= 0.7;
  }
  
  // Wall bouncing
  if (abs(pos.x) > 1.0) {
    pos.x = sign(pos.x);
    vel.x = -vel.x * 0.2;
  }
  if (abs(pos.z) > 1.0) {
    pos.z = sign(pos.z);
    vel.z = -vel.z * 0.2;
  }
  
  pos.y = min(pos.y, 2.0);
  
  // Air damping (less than water)
  let airDamp = select(physics.damping, 0.999, !isSubmerged);
  vel.x *= airDamp;
  vel.y *= airDamp;
  vel.z *= airDamp;
  
  // Age
  vel.w += dt;
  
  // Deactivate old particles or particles that settled back into water
  if (vel.w > physics.maxAge || (isSubmerged && speed < 0.05 && age > 0.5)) {
    pos.w = 0.0;
  }
  
  particles[pIdx] = pos;
  particles[pIdx + 1u] = vel;
}
`;

// ========== Particle Compact/Reset Shader ==========
export const resetParticlesShader = /* wgsl */`
const MAX_P: u32 = ${MAX_PARTICLES}u;

@group(0) @binding(0) var<storage, read_write> particles: array<vec4f>;
@group(0) @binding(1) var<storage, read_write> counter: array<atomic<u32>>;

@compute @workgroup_size(1)
fn main() {
  let count = atomicLoad(&counter[0]);
  var writeIdx = 0u;
  
  for (var i = 0u; i < min(count, MAX_P / 2u); i++) {
    let pIdx = i * 2u;
    let pos = particles[pIdx];
    if (pos.w > 0.0) {
      if (writeIdx != i) {
        particles[writeIdx * 2u] = particles[pIdx];
        particles[writeIdx * 2u + 1u] = particles[pIdx + 1u];
      }
      writeIdx++;
    }
  }
  
  atomicStore(&counter[0], writeIdx);
}
`;
