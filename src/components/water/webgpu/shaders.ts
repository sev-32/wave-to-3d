/**
 * WGSL Compute Shaders for WebGPU Water Simulation
 * Implements: heightfield sim, surface intent fields (R,U,C,M,A), particle emission
 */

export const GRID_SIZE = 256;
export const MAX_PARTICLES = 4096;

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
export const sphereDisplacementShader = /* wgsl */`
const N: u32 = ${GRID_SIZE}u;

struct SphereParams {
  oldX: f32, oldY: f32, oldZ: f32, radius: f32,
  newX: f32, newY: f32, newZ: f32, pad: f32,
}

@group(0) @binding(0) var<storage, read> waterIn: array<vec4f>;
@group(0) @binding(1) var<storage, read_write> waterOut: array<vec4f>;
@group(0) @binding(2) var<uniform> sphere: SphereParams;

fn volumeInSphere(center: vec3f, uv: vec2f, radius: f32) -> f32 {
  let toCenter = vec3f(uv.x * 2.0 - 1.0, 0.0, uv.y * 2.0 - 1.0) - center;
  let t = length(toCenter) / radius;
  let dy = exp(-pow(t * 1.5, 6.0));
  let ymin = min(0.0, center.y - dy);
  let ymax = min(max(0.0, center.y + dy), ymin + 2.0 * dy);
  return (ymax - ymin) * 0.1;
}

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= N || gid.y >= N) { return; }
  let i = gid.y * N + gid.x;
  var info = waterIn[i];
  
  let uv = vec2f(f32(gid.x) / f32(N - 1u), f32(gid.y) / f32(N - 1u));
  let oldCenter = vec3f(sphere.oldX, sphere.oldY, sphere.oldZ);
  let newCenter = vec3f(sphere.newX, sphere.newY, sphere.newZ);
  
  info.x += volumeInSphere(oldCenter, uv, sphere.radius);
  info.x -= volumeInSphere(newCenter, uv, sphere.radius);
  
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
  
  // Velocity gradient for momentum
  let vL = water[z * N + lx].y;
  let vR = water[z * N + rx].y;
  let vU = water[uz * N + x].y;
  let vD = water[dz * N + x].y;
  
  // ---- Surface Momentum U ----
  // Derived from height gradient × velocity (surface transport direction)
  var Ux = prevField.x; // Actually stored in field2, but let's compute fresh
  var Uz = prevField.y;
  
  // Update momentum from wave motion
  let momentumGainX = -gradX * velocity * params.dt * 5.0;
  let momentumGainZ = -gradZ * velocity * params.dt * 5.0;
  Ux = Ux * 0.95 + momentumGainX;
  Uz = Uz * 0.95 + momentumGainZ;
  let Umag = sqrt(Ux * Ux + Uz * Uz);
  
  // Momentum divergence
  let UxL = fieldIn[z * N + lx].x; // Approximate
  let UxR = fieldIn[z * N + rx].x;
  let UzU = fieldIn[uz * N + x].y;
  let UzD = fieldIn[dz * N + x].y;
  let divU = (UxR - UxL + UzD - UzU) * 0.5 * f32(N);
  
  // ---- Rupture Potential R ----
  let wK = 0.3;   // crestness weight
  let wE = 0.4;   // upward excitation weight
  let wS = 0.15;  // slope weight
  let wU = 0.15;  // momentum weight
  
  let Rraw = wK * min(crestness * 0.5, 1.0) 
           + wE * min(Eup * 20.0, 1.0) 
           + wS * min(slope * 2.0, 1.0) 
           + wU * min(Umag * 5.0, 1.0);
  
  // Temporal integration with hysteresis
  let chargeRate = 3.0;
  let R_decay = 2.0;
  var R = prevField.x;
  R += (chargeRate * clamp(Rraw, 0.0, 1.0) - R_decay * R) * params.dt;
  R = clamp(R, 0.0, 1.0);
  
  // ---- Coherence C ----
  // Measures structural order (ridge alignment)
  let gradMag = max(slope, 0.001);
  let normGradX = gradX / gradMag;
  let normGradZ = gradZ / gradMag;
  
  // Check alignment with neighbors
  let gradXR = (water[z * N + min(rx + 1u, N - 1u)].x - hR) * f32(N);
  let gradZD = (water[min(dz + 1u, N - 1u) * N + x].x - hD) * f32(N);
  let neighborGradMag = max(sqrt(gradXR * gradXR + gradZD * gradZD), 0.001);
  let alignment = abs(normGradX * gradXR / neighborGradMag + normGradZ * gradZD / neighborGradMag);
  
  let Craw = alignment * 0.7 + min(Umag * 3.0, 1.0) * 0.3;
  var C = prevField.y;
  C += (2.0 * Craw - 1.5 * C) * params.dt;
  C = clamp(C, 0.0, 1.0);
  
  // ---- Reservoir Mass M ----
  let M0 = 0.5; // equilibrium
  var M = prevField.z;
  let refill = params.refillRate * (M0 - M);
  let drain = select(0.0, R * C * 0.5, R > params.emitThreshold);
  M += (refill - drain) * params.dt;
  M = clamp(M, 0.0, 1.0);
  
  // ---- Adhesion A ----
  var A = prevField.w;
  let calmRecovery = 0.5 * (1.0 - R);
  let ruptureSuppression = R * 2.0;
  A += (calmRecovery - ruptureSuppression - A * 0.3) * params.dt;
  A = clamp(A, 0.0, 1.0);
  
  // Write outputs
  fieldOut[i] = vec4f(R, C, M, A);
  field2[i] = vec4f(Ux, Uz, divU, slope);
}
`;

// ========== Particle Emit Shader ==========
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
  // Only check every 4th texel to limit emission rate
  if (x >= N || z >= N || (x % 4u != 0u) || (z % 4u != 0u)) { return; }
  
  let i = z * N + x;
  let field = fields[i];
  let R = field.x;
  let C = field.y;
  let M = field.z;
  
  // Only emit from high-R, high-M regions
  if (R < 0.4 || M < 0.1) { return; }
  
  let f2 = fields2[i];
  let Ux = f2.x;
  let Uz = f2.y;
  let waterInfo = water[i];
  let height = waterInfo.x;
  let velocity = waterInfo.y;
  
  // Compute world position
  let worldX = f32(x) / f32(N - 1u) * 2.0 - 1.0;
  let worldZ = f32(z) / f32(N - 1u) * 2.0 - 1.0;
  
  // Allocate particle slot
  let slot = atomicAdd(&counter[0], 1u);
  if (slot >= MAX_P / 2u) { // Limit to half max to leave room
    atomicSub(&counter[0], 1u);
    return;
  }
  
  let pIdx = slot * 2u;
  
  // Compute surface normal for lift direction
  let nx = waterInfo.z;
  let nz = waterInfo.w;
  let ny = sqrt(max(0.0, 1.0 - nx * nx - nz * nz));
  
  // Velocity composition: lift + throw + noise
  let liftScale = R * 2.0;
  let throwScale = C * 3.0;
  
  // Pseudo-random noise from position
  let noise = fract(sin(f32(x) * 12.9898 + f32(z) * 78.233) * 43758.5453);
  let noiseAngle = noise * 6.283;
  let noiseStrength = (1.0 - C) * 0.5;
  
  let vx = Ux * throwScale + nx * liftScale * 0.3 + cos(noiseAngle) * noiseStrength;
  let vy = ny * liftScale + max(velocity * 3.0, 0.5);
  let vz = Uz * throwScale + nz * liftScale * 0.3 + sin(noiseAngle) * noiseStrength;
  
  particles[pIdx] = vec4f(worldX, height + 0.02, worldZ, 1.0);   // pos + mass
  particles[pIdx + 1u] = vec4f(vx, vy, vz, 0.0);                  // vel + age
}
`;

// ========== Particle Update Shader ==========
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
  
  let dt = physics.dt;
  
  // Gravity
  vel.y -= physics.gravity * dt;
  
  // Advect
  pos.x += vel.x * dt;
  pos.y += vel.y * dt;
  pos.z += vel.z * dt;
  
  // Pool boundary collisions
  if (pos.y < -1.0) {
    pos.y = -1.0;
    vel.y = abs(vel.y) * 0.3;
    vel.x *= 0.8;
    vel.z *= 0.8;
  }
  
  // Wall bouncing
  if (abs(pos.x) > 1.0) {
    pos.x = sign(pos.x);
    vel.x = -vel.x * 0.3;
  }
  if (abs(pos.z) > 1.0) {
    pos.z = sign(pos.z);
    vel.z = -vel.z * 0.3;
  }
  
  // Cap upward
  pos.y = min(pos.y, 3.0);
  
  // Damping
  vel.x *= physics.damping;
  vel.y *= physics.damping;
  vel.z *= physics.damping;
  
  // Age
  vel.w += dt;
  
  // Deactivate old particles (mark mass as 0)
  if (vel.w > physics.maxAge) {
    pos.w = 0.0; // inactive
  }
  
  particles[pIdx] = pos;
  particles[pIdx + 1u] = vel;
}
`;

// ========== Particle Compact/Reset Shader ==========
// Resets counter for particles that have expired
export const resetParticlesShader = /* wgsl */`
const MAX_P: u32 = ${MAX_PARTICLES}u;

@group(0) @binding(0) var<storage, read_write> particles: array<vec4f>;
@group(0) @binding(1) var<storage, read_write> counter: array<atomic<u32>>;

@compute @workgroup_size(1)
fn main() {
  let count = atomicLoad(&counter[0]);
  var writeIdx = 0u;
  
  // Simple compaction: move active particles to front
  for (var i = 0u; i < min(count, MAX_P / 2u); i++) {
    let pIdx = i * 2u;
    let pos = particles[pIdx];
    if (pos.w > 0.0) { // active
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
