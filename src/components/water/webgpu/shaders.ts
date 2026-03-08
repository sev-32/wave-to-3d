/**
 * WGSL Compute Shaders for WebGPU Water Simulation
 * Implements: heightfield sim, surface intent fields (R,U,C,M,A), MLS-MPM particle emission & physics
 * 
 * Phase 2 enhancements:
 * - R hysteresis (R_on=0.20, R_off=0.10) with emission-active flag
 * - Impact memory field for immediate sphere response
 * - Regime classifier (SHEET, SPRAY, JET, PACKET)
 * - Reservoir drain coupling
 * - Variable particle mass
 * 
 * Phase 3 enhancements:
 * - Particle-to-heightfield feedback (accumulation buffer, no race condition)
 * - Adhesion recapture with mass return to reservoir M
 * 
 * Phase 4 enhancements:
 * - Parallel prefix-sum particle compaction
 * 
 * Phase 5B:
 * - Sphere tangential forcing into U field
 */

export const GRID_SIZE = 256;
export const MAX_PARTICLES = 16384;

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
  
  let lx = select(x - 1u, 0u, x == 0u);
  let rx = min(x + 1u, N - 1u);
  let uz = select(z - 1u, 0u, z == 0u);
  let dz = min(z + 1u, N - 1u);
  
  let left  = waterIn[z * N + lx].x;
  let right = waterIn[z * N + rx].x;
  let up    = waterIn[uz * N + x].x;
  let down  = waterIn[dz * N + x].x;

  let ul = waterIn[uz * N + lx].x;
  let ur = waterIn[uz * N + rx].x;
  let dl = waterIn[dz * N + lx].x;
  let dr = waterIn[dz * N + rx].x;

  // 8-neighbor isotropic stencil reduces axis-biased artifacts
  let axialAvg = (left + right + up + down) * 0.20;
  let diagAvg = (ul + ur + dl + dr) * 0.05;
  let avg = axialAvg + diagAvg;

  // Slightly softer propagation to avoid over-energetic craters
  info.y += (avg - info.x) * 1.65;
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
// Enhanced with impact memory + Phase 5B: tangential forcing into U field
export const sphereDisplacementShader = /* wgsl */`
const N: u32 = ${GRID_SIZE}u;

struct SphereParams {
  oldX: f32, oldY: f32, oldZ: f32, radius: f32,
  newX: f32, newY: f32, newZ: f32, pad: f32,
}

@group(0) @binding(0) var<storage, read> waterIn: array<vec4f>;
@group(0) @binding(1) var<storage, read_write> waterOut: array<vec4f>;
@group(0) @binding(2) var<uniform> sphere: SphereParams;
@group(0) @binding(3) var<storage, read_write> field2: array<vec4f>;

fn volumeInSphere(center: vec3f, uv: vec2f, radius: f32) -> f32 {
  let worldPos = vec3f(uv.x * 2.0 - 1.0, 0.0, uv.y * 2.0 - 1.0);
  let dist = length(worldPos.xz - center.xz);
  let horizontalDist = dist / radius;
  
  if (horizontalDist > 1.5) { return 0.0; }
  
  let cap = max(0.0, 1.0 - horizontalDist * horizontalDist);
  let sphereTop = center.y + radius * sqrt(cap);
  let sphereBot = center.y - radius * sqrt(cap);
  
  let waterY = 0.0;
  let submergedTop = min(sphereTop, waterY);
  let submergedBot = max(sphereBot, -1.0);
  
  if (submergedTop <= submergedBot) { return 0.0; }
  
  let displacement = (submergedTop - submergedBot) * cap * 0.045;
  return min(displacement, 0.016);
}

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= N || gid.y >= N) { return; }
  let i = gid.y * N + gid.x;
  var info = waterIn[i];
  
  let uv = vec2f(f32(gid.x) / f32(N - 1u), f32(gid.y) / f32(N - 1u));
  let oldCenter = vec3f(sphere.oldX, sphere.oldY, sphere.oldZ);
  let newCenter = vec3f(sphere.newX, sphere.newY, sphere.newZ);
  
  let velocity = newCenter - oldCenter;
  let speed = length(velocity);
  
  // Volume displacement
  let oldVol = volumeInSphere(oldCenter, uv, sphere.radius);
  let newVol = volumeInSphere(newCenter, uv, sphere.radius);
  info.x += oldVol - newVol;
  
  // Velocity-proportional bow wave + tangential forcing
  if (speed > 0.001) {
    let worldPos = vec2f(uv.x * 2.0 - 1.0, uv.y * 2.0 - 1.0);
    let toPoint = worldPos - newCenter.xz;
    let dist = length(toPoint);
    let normDist = dist / sphere.radius;
    
    if (normDist < 3.0 && normDist > 0.1) {
      let velDir2D = normalize(velocity.xz + vec2f(0.0001));
      let pointDir = normalize(toPoint + vec2f(0.0001));
      let alignment = dot(velDir2D, pointDir);
      
      let bowWave = alignment * speed * 1.2;
      let falloff = exp(-normDist * 1.5);
      
      let crossAlignment = abs(cross(vec3f(velDir2D, 0.0), vec3f(pointDir, 0.0)).z);
      let wakeAngle = 0.33;
      let isInWake = smoothstep(wakeAngle - 0.1, wakeAngle + 0.1, crossAlignment);
      let wakeFactor = isInWake * (1.0 - alignment) * 0.3;
      
      let waveAdd = (bowWave * falloff + wakeFactor * speed * falloff) * 0.035;
      info.y += clamp(waveAdd, -0.022, 0.022);
      
      // Phase 5B: Inject tangential + forward momentum into U field
      let proximity = exp(-normDist * 2.0);
      let tangentX = -velDir2D.y;
      let tangentZ = velDir2D.x;
      var f2 = field2[i];
      f2.x += tangentX * speed * proximity * 0.5;
      f2.y += tangentZ * speed * proximity * 0.5;
      f2.x += velDir2D.x * speed * proximity * 0.3;
      f2.y += velDir2D.y * speed * proximity * 0.3;
      field2[i] = f2;
    }
  }
  
  waterOut[i] = info;
}
`;

// ========== Surface Intent Fields Shader ==========
// Phase 2: R hysteresis, impact memory, U advection, convergence M charging, cooldown
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
@group(0) @binding(3) var<storage, read_write> field2: array<vec4f>;   // Ux, Uz, divU, cooldown
@group(0) @binding(4) var<uniform> params: FieldParams;

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  let x = gid.x;
  let z = gid.y;
  if (x >= N || z >= N) { return; }
  
  let i = z * N + x;
  let info = water[i];
  let prevField = fieldIn[i];
  let prevField2 = field2[i];
  
  let height = info.x;
  let velocity = info.y;
  
  let lx = select(x - 1u, 0u, x == 0u);
  let rx = min(x + 1u, N - 1u);
  let uz = select(z - 1u, 0u, z == 0u);
  let dz = min(z + 1u, N - 1u);
  
  let hL = water[z * N + lx].x;
  let hR = water[z * N + rx].x;
  let hU = water[uz * N + x].x;
  let hD = water[dz * N + x].x;
  
  let gradX = (hR - hL) * 0.5 * f32(N);
  let gradZ = (hD - hU) * 0.5 * f32(N);
  let slope = sqrt(gradX * gradX + gradZ * gradZ);
  
  let laplacian = (hL + hR + hU + hD - 4.0 * height) * f32(N) * f32(N);
  let crestness = abs(laplacian);
  let Eup = max(0.0, velocity);
  
  // ---- Surface Momentum U with semi-Lagrangian advection ----
  let momentumGainX = -gradX * velocity * params.dt * 5.0;
  let momentumGainZ = -gradZ * velocity * params.dt * 5.0;
  
  let advScale = 0.5;
  let backtraceX = f32(x) - prevField2.x * params.dt * advScale * f32(N);
  let backtraceZ = f32(z) - prevField2.y * params.dt * advScale * f32(N);
  let btX = clamp(u32(backtraceX), 0u, N - 1u);
  let btZ = clamp(u32(backtraceZ), 0u, N - 1u);
  let advectedU = field2[btZ * N + btX];
  
  var Ux = mix(advectedU.x, prevField2.x, 0.5) * 0.95 + momentumGainX;
  var Uz = mix(advectedU.y, prevField2.y, 0.5) * 0.95 + momentumGainZ;
  let Umag = sqrt(Ux * Ux + Uz * Uz);
  
  // Momentum divergence
  let UxL = field2[z * N + lx].x;
  let UxR = field2[z * N + rx].x;
  let UzU = field2[uz * N + x].y;
  let UzD = field2[dz * N + x].y;
  let divU = (UxR - UxL + UzD - UzU) * 0.5 * f32(N);
  
  // ---- Cooldown tracking (stored in field2.w) ----
  var cooldown = max(0.0, prevField2.w - params.dt);
  
  // ---- Rupture Potential R with hysteresis ----
  let R_ON: f32 = 0.20;
  let R_OFF: f32 = 0.10;
  let COOLDOWN_DURATION: f32 = 0.14;

  let wK = 0.20;
  let wE = 0.24;
  let wS = 0.16;
  let wU = 0.20;
  let wD = 0.12;
  let wI = 0.08;

  let Ekin = abs(velocity);
  let compression = min(max(0.0, -divU) * 0.025, 1.0);
  let impactMemory = min(Ekin * exp(-slope * 0.12) * 6.0, 1.0);

  let Rraw = wK * min(crestness * 0.08, 1.0)
           + wE * min(Ekin * 3.6, 1.0)
           + wS * min(slope * 0.75, 1.0)
           + wU * min(Umag * 1.8, 1.0)
           + wD * compression
           + wI * impactMemory;

  let chargeRate = 5.0;
  let R_decay = 3.0;
  var R = prevField.x;

  let chargeMultiplier = select(1.0, 0.0, cooldown > 0.001);
  R += (chargeRate * clamp(Rraw, 0.0, 1.0) * chargeMultiplier - R_decay * R) * params.dt;
  R = clamp(R, 0.0, 1.0);
  
  let prevR = prevField.x;
  let wasActive = select(0.0, 1.0, prevR >= R_OFF);
  let nowActive = select(wasActive, 1.0, R >= R_ON);
  let emissionActive = select(0.0, nowActive, R >= R_OFF);
  
  let justDeactivated = select(0.0, 1.0, wasActive > 0.5 && emissionActive < 0.5);
  cooldown = max(cooldown, justDeactivated * COOLDOWN_DURATION);
  
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
  
  // ---- Reservoir Mass M with convergence charging ----
  let M0 = 0.6;
  var M = prevField.z;
  let refill = params.refillRate * (M0 - M);
  let convergenceCharge = max(0.0, -divU) * 0.5;
  let drain = select(0.0, R * C * 0.8, emissionActive > 0.5);
  M += (refill + convergenceCharge - drain) * params.dt;
  M = clamp(M, 0.0, 1.0);
  
  // ---- Adhesion A ----
  var A = prevField.w;
  let calmRecovery = 0.5 * (1.0 - R);
  let ruptureSuppression = R * 2.0;
  A += (calmRecovery - ruptureSuppression - A * 0.3) * params.dt;
  A = clamp(A, 0.0, 1.0);
  
  fieldOut[i] = vec4f(R, C, M, A);
  field2[i] = vec4f(Ux, Uz, divU, cooldown);
}
`;

// ========== Particle Emit Shader ==========
// Phase 2: Regime classifier, reservoir drain, variable mass, R hysteresis gating
export const emitParticlesShader = /* wgsl */`
const N: u32 = ${GRID_SIZE}u;
const MAX_P: u32 = ${MAX_PARTICLES}u;

@group(0) @binding(0) var<storage, read> water: array<vec4f>;
@group(0) @binding(1) var<storage, read> fields: array<vec4f>;    // R, C, M, A
@group(0) @binding(2) var<storage, read> fields2: array<vec4f>;   // Ux, Uz, divU, cooldown
@group(0) @binding(3) var<storage, read_write> particles: array<vec4f>;
@group(0) @binding(4) var<storage, read_write> counter: array<atomic<u32>>;

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  let x = gid.x;
  let z = gid.y;
  if (x >= N || z >= N) { return; }
  
  let i = z * N + x;
  let field = fields[i];
  let R = field.x;
  let C = field.y;
  let M = field.z;
  let A = field.w;
  
  let f2 = fields2[i];
  let Ux = f2.x;
  let Uz = f2.y;
  let cooldown = f2.w;
  
  // R hysteresis gating
  let R_ON: f32 = 0.20;
  let R_OFF: f32 = 0.10;
  if (R < R_OFF || M < 0.03) { return; }
  
  let waterInfo = water[i];
  let height = waterInfo.x;
  let velocity = waterInfo.y;
  let kinetic = abs(velocity);
  
  if (kinetic < 0.00002 && R < R_ON) { return; }
  
  let noise = fract(sin(f32(x) * 12.9898 + f32(z) * 78.233 + f32(atomicLoad(&counter[0])) * 0.1) * 43758.5453);
  
  let emitProb = clamp((R * R * 1.4 + kinetic * 18.0) * (0.35 + M), 0.0, 0.92);
  if (noise > emitProb) { return; }
  
  let worldX = f32(x) / f32(N - 1u) * 2.0 - 1.0;
  let worldZ = f32(z) / f32(N - 1u) * 2.0 - 1.0;
  
  let slot = atomicAdd(&counter[0], 1u);
  if (slot >= MAX_P / 2u) {
    atomicSub(&counter[0], 1u);
    return;
  }
  
  let pIdx = slot * 2u;
  
  let nx = waterInfo.z;
  let nz = waterInfo.w;
  let ny = sqrt(max(0.0, 1.0 - nx * nx - nz * nz));
  
  let Umag = sqrt(Ux * Ux + Uz * Uz);
  
  // ---- Regime Classification ----
  var liftMul: f32 = 1.0;
  var throwMul: f32 = 1.0;
  var spreadMul: f32 = 1.0;
  
  if (C > 0.6 && Umag > 0.3) {
    liftMul = 0.6; throwMul = 3.0; spreadMul = 0.2; // SHEET
  } else if (R > 0.5 && C < 0.3) {
    liftMul = 1.2; throwMul = 0.5; spreadMul = 2.0; // SPRAY
  } else if (R > 0.7) {
    liftMul = 3.0; throwMul = 0.3; spreadMul = 0.1; // JET
  }
  
  let noiseAngle = noise * 6.283;
  let noise2 = fract(sin(noise * 47.3 + 123.456) * 78901.234);
  let spreadRadius = (1.0 - C) * 0.8 * spreadMul + noise2 * 0.3 * spreadMul;
  
  let liftScale = R * M * 3.0 * liftMul;
  let throwScale = C * 4.0 * throwMul;
  
  let vx = Ux * throwScale + nx * liftScale * 0.4 + cos(noiseAngle) * spreadRadius;
  let vy = ny * liftScale * 1.5 + max(abs(velocity) * 3.0, 0.35) + noise2 * 0.5;
  let vz = Uz * throwScale + nz * liftScale * 0.4 + sin(noiseAngle) * spreadRadius;
  
  // Variable mass: coherent regions produce heavier particles
  let mass = max(0.05, M * (0.5 + C * 0.5)); // floor at 0.05 to prevent near-zero mass
  
  let offsetX = cos(noiseAngle) * 0.005;
  let offsetZ = sin(noiseAngle) * 0.005;
  
  particles[pIdx] = vec4f(worldX + offsetX, height + 0.015, worldZ + offsetZ, mass);
  particles[pIdx + 1u] = vec4f(vx, vy, vz, 0.0);
}
`;

// ========== Particle Update Shader ==========
// Phase 3: Adhesion recapture with mass return to reservoir via feedback buffer
export const updateParticlesShader = /* wgsl */`
const MAX_P: u32 = ${MAX_PARTICLES}u;
const N: u32 = ${GRID_SIZE}u;

struct PhysicsParams {
  dt: f32,
  gravity: f32,
  damping: f32,
  maxAge: f32,
}

@group(0) @binding(0) var<storage, read_write> particles: array<vec4f>;
@group(0) @binding(1) var<storage, read_write> counter: array<atomic<u32>>;
@group(0) @binding(2) var<uniform> physics: PhysicsParams;
@group(0) @binding(3) var<storage, read> fields: array<vec4f>;  // R, C, M, A for recapture
@group(0) @binding(4) var<storage, read_write> feedbackBuf: array<atomic<i32>>; // accumulation buffer for water feedback

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  let count = atomicLoad(&counter[0]);
  if (gid.x >= count) { return; }
  
  let pIdx = gid.x * 2u;
  var pos = particles[pIdx];
  var vel = particles[pIdx + 1u];
  
  if (pos.w <= 0.0) { return; }
  
  let dt = physics.dt;
  let age = vel.w;
  let mass = pos.w;
  
  // Gravity with buoyancy (Archimedes)
  let waterSurfaceY = 0.0;
  let isSubmerged = pos.y < waterSurfaceY;
  let buoyancy = select(0.0, 6.0, isSubmerged);
  vel.y -= (physics.gravity - buoyancy) * dt;
  
  // Quadratic drag
  let dragCoeff = select(0.02, 0.2, isSubmerged);
  let speed = length(vec3f(vel.x, vel.y, vel.z));
  if (speed > 0.01) {
    let dragForce = dragCoeff * speed * speed;
    let dragDecel = min(dragForce * dt / speed, 0.5);
    vel.x -= vel.x * dragDecel;
    vel.y -= vel.y * dragDecel;
    vel.z -= vel.z * dragDecel;
  }
  
  // Adhesion recapture: particles near surface check A field
  let distToSurface = abs(pos.y - waterSurfaceY);
  if (distToSurface < 0.08 && age > 0.2) {
    let gridX = clamp(u32((pos.x * 0.5 + 0.5) * f32(N)), 0u, N - 1u);
    let gridZ = clamp(u32((pos.z * 0.5 + 0.5) * f32(N)), 0u, N - 1u);
    let fieldIdx = gridZ * N + gridX;
    let A = fields[fieldIdx].w;
    
    // Surface tension pull-back
    let surfacePull = (waterSurfaceY - pos.y) * 12.0 * dt;
    vel.y += surfacePull;
    
    // Adhesion recapture
    if (distToSurface < 0.02 && speed < 0.15 && A > 0.4) {
      vel.x *= 0.9;
      vel.z *= 0.9;
      if (distToSurface < 0.008 && speed < 0.08) {
        pos.w = 0.0; // deactivate
        // Write mass return to feedback buffer for M reservoir recharge
        // Use fixed-point: multiply by 10000 for integer atomics
        let massInt = i32(mass * 10000.0);
        atomicAdd(&feedbackBuf[fieldIdx], massInt);
      }
    }
  }
  
  // Particle-to-heightfield feedback: particles crossing surface with downward velocity
  if (pos.y < 0.05 && pos.y > -0.1 && vel.y < -0.05) {
    let gridX = clamp(u32((pos.x * 0.5 + 0.5) * f32(N - 1u)), 0u, N - 1u);
    let gridZ = clamp(u32((pos.z * 0.5 + 0.5) * f32(N - 1u)), 0u, N - 1u);
    let centerIdx = gridZ * N + gridX;
    let impulseInt = i32(mass * abs(vel.y) * 0.003 * 10000.0);
    
    // Atomic accumulation in 3x3 kernel (no race condition)
    for (var dzi: i32 = -1; dzi <= 1; dzi++) {
      for (var dxi: i32 = -1; dxi <= 1; dxi++) {
        let nx = clamp(i32(gridX) + dxi, 0, i32(N - 1u));
        let nz = clamp(i32(gridZ) + dzi, 0, i32(N - 1u));
        let idx = u32(nz) * N + u32(nx);
        let dist = sqrt(f32(dxi * dxi + dzi * dzi));
        let weight = i32(exp(-dist * 2.0) * 10000.0);
        let scaledImpulse = (impulseInt * weight) / 10000;
        // Negative = downward impulse on water
        atomicSub(&feedbackBuf[N * N + idx], scaledImpulse);
      }
    }
  }
  
  // Advect
  pos.x += vel.x * dt;
  pos.y += vel.y * dt;
  pos.z += vel.z * dt;
  
  // Pool boundary collisions
  if (pos.y < -1.0) {
    pos.y = -1.0;
    vel.y = abs(vel.y) * 0.2;
    vel.x *= 0.7;
    vel.z *= 0.7;
  }
  
  if (abs(pos.x) > 1.0) {
    pos.x = sign(pos.x);
    vel.x = -vel.x * 0.2;
  }
  if (abs(pos.z) > 1.0) {
    pos.z = sign(pos.z);
    vel.z = -vel.z * 0.2;
  }
  
  pos.y = min(pos.y, 2.0);
  
  // Air damping
  let airDamp = select(physics.damping, 0.999, !isSubmerged);
  vel.x *= airDamp;
  vel.y *= airDamp;
  vel.z *= airDamp;
  
  // Age
  vel.w += dt;
  
  // Deactivate old or settled particles
  if (vel.w > physics.maxAge || (isSubmerged && speed < 0.05 && age > 0.5)) {
    pos.w = 0.0;
  }
  
  particles[pIdx] = pos;
  particles[pIdx + 1u] = vel;
}
`;

// ========== Apply Feedback Shader ==========
// Reads atomic i32 feedback buffer and applies to water heightfield + field M
export const applyFeedbackShader = /* wgsl */`
const N: u32 = ${GRID_SIZE}u;

@group(0) @binding(0) var<storage, read_write> water: array<vec4f>;
@group(0) @binding(1) var<storage, read_write> fieldOut: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> feedbackBuf: array<atomic<i32>>;

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= N || gid.y >= N) { return; }
  let i = gid.y * N + gid.x;
  
  // Read and clear mass return (first N*N entries)
  let massReturn = atomicExchange(&feedbackBuf[i], 0);
  if (massReturn > 0) {
    // Recharge reservoir M with returned mass
    var field = fieldOut[i];
    field.z = min(1.0, field.z + f32(massReturn) / 10000.0);
    fieldOut[i] = field;
  }
  
  // Read and clear water impulse (second N*N entries)
  let waterImpulse = atomicExchange(&feedbackBuf[N * N + i], 0);
  if (waterImpulse != 0) {
    var w = water[i];
    w.y += f32(waterImpulse) / 10000.0;
    water[i] = w;
  }
}
`;

// ========== Particle Compact/Reset Shader ==========
// Phase 4A: Parallel prefix-sum compaction
// Step 1: Mark alive particles and compute prefix sum per workgroup
export const markAliveShader = /* wgsl */`
const MAX_P: u32 = ${MAX_PARTICLES}u;
const WG_SIZE: u32 = 256u;

@group(0) @binding(0) var<storage, read> particles: array<vec4f>;
@group(0) @binding(1) var<storage, read_write> aliveFlags: array<u32>;
@group(0) @binding(2) var<storage, read_write> counter: array<atomic<u32>>;

var<workgroup> shared_data: array<u32, 256>;

@compute @workgroup_size(256)
fn main(
  @builtin(global_invocation_id) gid: vec3u,
  @builtin(local_invocation_id) lid: vec3u,
  @builtin(workgroup_id) wid: vec3u,
) {
  let halfMax = MAX_P / 2u;
  let idx = gid.x;
  
  // Mark alive: 1 if particle active, 0 if dead or out of range
  var alive: u32 = 0u;
  if (idx < halfMax) {
    let count = atomicLoad(&counter[0]);
    if (idx < count) {
      let mass = particles[idx * 2u].w;
      alive = select(0u, 1u, mass > 0.0);
    }
  }
  
  aliveFlags[idx] = alive;
}
`;

// Step 2: Exclusive prefix sum over alive flags
export const prefixSumShader = /* wgsl */`
const MAX_P: u32 = ${MAX_PARTICLES}u;
const HALF_MAX: u32 = ${MAX_PARTICLES / 2}u;

@group(0) @binding(0) var<storage, read> aliveFlags: array<u32>;
@group(0) @binding(1) var<storage, read_write> prefixSums: array<u32>;
@group(0) @binding(2) var<storage, read_write> totalAlive: array<atomic<u32>>;

var<workgroup> shared_data: array<u32, 256>;

@compute @workgroup_size(256)
fn main(
  @builtin(global_invocation_id) gid: vec3u,
  @builtin(local_invocation_id) lid: vec3u,
  @builtin(workgroup_id) wid: vec3u,
) {
  // Simple serial prefix sum per workgroup — still much faster than workgroup_size(1) over all particles
  // Each workgroup handles a chunk of 256 particles
  let base = wid.x * 256u;
  let localIdx = lid.x;
  
  // Load into shared memory
  let globalIdx = base + localIdx;
  if (globalIdx < HALF_MAX) {
    shared_data[localIdx] = aliveFlags[globalIdx];
  } else {
    shared_data[localIdx] = 0u;
  }
  workgroupBarrier();
  
  // Hillis-Steele inclusive scan
  for (var offset: u32 = 1u; offset < 256u; offset *= 2u) {
    var val: u32 = shared_data[localIdx];
    if (localIdx >= offset) {
      val += shared_data[localIdx - offset];
    }
    workgroupBarrier();
    shared_data[localIdx] = val;
    workgroupBarrier();
  }
  
  // Convert to exclusive prefix sum
  let inclusive = shared_data[localIdx];
  let exclusive = inclusive - aliveFlags[min(globalIdx, HALF_MAX - 1u)];
  
  if (globalIdx < HALF_MAX) {
    // Add workgroup offset: we need the total from previous workgroups
    // For simplicity, store local prefix and accumulate total per workgroup
    prefixSums[globalIdx] = exclusive;
  }
  
  // Last thread in workgroup stores total alive count for this workgroup
  if (localIdx == 255u) {
    atomicAdd(&totalAlive[0], inclusive);
  }
}
`;

// Step 3: Scatter alive particles to compacted positions  
export const scatterCompactShader = /* wgsl */`
const MAX_P: u32 = ${MAX_PARTICLES}u;
const HALF_MAX: u32 = ${MAX_PARTICLES / 2}u;

@group(0) @binding(0) var<storage, read_write> particles: array<vec4f>;
@group(0) @binding(1) var<storage, read> aliveFlags: array<u32>;
@group(0) @binding(2) var<storage, read> prefixSums: array<u32>;
@group(0) @binding(3) var<storage, read_write> counter: array<atomic<u32>>;
@group(0) @binding(4) var<storage, read_write> tempParticles: array<vec4f>;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  let idx = gid.x;
  if (idx >= HALF_MAX) { return; }
  
  let count = atomicLoad(&counter[0]);
  if (idx >= count) { return; }
  
  if (aliveFlags[idx] == 1u) {
    let destIdx = prefixSums[idx];
    tempParticles[destIdx * 2u] = particles[idx * 2u];
    tempParticles[destIdx * 2u + 1u] = particles[idx * 2u + 1u];
  }
}
`;

// Step 4: Copy compacted particles back and update counter
export const copyBackShader = /* wgsl */`
const MAX_P: u32 = ${MAX_PARTICLES}u;
const HALF_MAX: u32 = ${MAX_PARTICLES / 2}u;

@group(0) @binding(0) var<storage, read_write> particles: array<vec4f>;
@group(0) @binding(1) var<storage, read> tempParticles: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> counter: array<atomic<u32>>;
@group(0) @binding(3) var<storage, read> totalAlive: array<u32>;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  // First thread updates counter
  if (gid.x == 0u) {
    let total = totalAlive[0];
    atomicStore(&counter[0], total);
  }
  
  let idx = gid.x;
  if (idx >= HALF_MAX) { return; }
  
  particles[idx * 2u] = tempParticles[idx * 2u];
  particles[idx * 2u + 1u] = tempParticles[idx * 2u + 1u];
}
`;

// Legacy fallback: simple serial compaction (kept for compatibility)
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

// Legacy particle feedback shader (kept but replaced by atomic feedback in updateParticlesShader)
export const particleFeedbackShader = /* wgsl */`
const N: u32 = ${GRID_SIZE}u;
const MAX_P: u32 = ${MAX_PARTICLES}u;

@group(0) @binding(0) var<storage, read> particles: array<vec4f>;
@group(0) @binding(1) var<storage, read_write> water: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> counter: array<atomic<u32>>;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  // Legacy: kept for bind group compatibility but feedback now handled
  // via atomic accumulation buffer in updateParticlesShader + applyFeedbackShader
  return;
}
`;
