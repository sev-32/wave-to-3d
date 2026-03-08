# Complete Overhaul Plan — Hybrid Water Simulation

## Executive Summary

The current system has a working foundation: heightfield wave sim, surface intent fields (R,U,C,M,A), particle emission, caustics, and a solid R3F rendering pipeline. However, the particles look like scattered blobs instead of cohesive fluid, several field features are incomplete, and there's no two-way coupling or regime classification.

This plan defines 6 overhaul phases, ordered by visual impact and dependency chain. Each phase has specific file-level changes, shader modifications, and acceptance criteria.

---

## Phase 1: Particle Visual Overhaul (Screen-Space Fluid Rendering)

**Goal**: Make particles look like continuous fluid, not point clouds.

**Why first**: This is the most visible problem. Even with perfect physics, bad rendering kills the effect.

### 1A. World-Space Particle Sizing
- **File**: `ParticleRenderer.tsx` (vertex shader)
- **Change**: Replace screen-space `gl_PointSize` with world-space sizing
- **Formula**: `gl_PointSize = (worldRadius * resolution.y) / (-mvPosition.z * tan(fov/2))`
- **Target particle radius**: ~0.008 world units (pool is 2 units wide, so particle ≈ 0.4% of pool width)
- **Accept**: At default camera, particles are tiny dots that only become visible through density accumulation

### 1B. Screen-Space Depth Buffer Pass
- **New file**: `FluidRenderer.tsx` (replaces `ParticleRenderer.tsx`)
- **Architecture**: Multi-pass render-to-texture using `THREE.WebGLRenderTarget`
  - **Pass 1 (Depth Splat)**: Render particles to a float depth texture. Each particle writes camera-space depth with Gaussian falloff. Use `THREE.Points` with depth-only shader.
  - **Pass 2 (Bilateral Smooth)**: Full-screen quad shader that smooths the depth buffer. Bilateral filter preserves edges while filling gaps between particles. Kernel: 7×7, depth-edge threshold ~0.05.
  - **Pass 3 (Normal Reconstruction)**: Compute screen-space normals from smoothed depth gradients: `normal = normalize(vec3(dDepth/dx, dDepth/dy, 1.0))`
  - **Pass 4 (Composite)**: Shade the fluid surface with Fresnel, refraction sampling from the scene, specular highlights. Composite over the main scene with proper depth testing.
- **Materials needed**: 4 ShaderMaterials, 3 render targets (depth, smoothed depth, normals)
- **Integration**: Hook into `WaterScene.tsx` render loop via `useFrame` with manual `gl.render()` calls

### 1C. Age-Based Visual Transition
- **In composite shader**: Particles transition visually based on age:
  - Age 0–0.3s: Dense fluid blob (blue-tinted, refractive)
  - Age 0.3–1.0s: White spray (high scatter, less refraction)
  - Age 1.0–2.0s: Fading mist (low alpha, diffuse)
- **Accept**: Splash starts as cohesive water, breaks into spray, fades naturally

### Acceptance Criteria
- [ ] Particles are invisible individually, only visible through accumulation
- [ ] Dense splash regions look like continuous fluid surface
- [ ] Edges are soft and natural
- [ ] No visible individual circles/squares
- [ ] Particles transition from fluid → spray → mist

---

## Phase 2: Emission Quality & Regime Classification

**Goal**: Particles emit with correct directionality and structure based on what's happening on the surface.

### 2A. R Hysteresis
- **File**: `shaders.ts` (surfaceFieldsShader)
- **Change**: Add `R_on` / `R_off` thresholds with per-texel state bit
- **Implementation**: Store emission-active flag in an unused bit of field buffer. Use `R_on = 0.2`, `R_off = 0.1`.
- **Effect**: Eliminates R flickering at threshold boundary

### 2B. Impact Memory Field
- **File**: `shaders.ts` (surfaceFieldsShader + sphereDisplacementShader)
- **Change**: Sphere proximity charges R and M directly
- **Implementation**: In sphere displacement shader, compute `impactCharge = exp(-dist/radius) * speed`. Pass this as an additional channel or accumulate into R's charge term.
- **Effect**: Sphere impacts create immediate, localized splash potential

### 2C. Regime Classifier
- **File**: `shaders.ts` (emitParticlesShader)
- **New logic**: Classify each emission texel into a regime before computing velocity:
  ```
  regime = classify(R, C, M, |U|):
    if C > 0.6 && |U| > 0.3 → SHEET_EMIT (strong throw, moderate lift, tight spread)
    if R > 0.5 && C < 0.3   → SPRAY_EMIT (moderate lift, wide spread, high noise)
    if R > 0.7 && localized  → JET_EMIT (strong lift, low spread)
    else                     → PACKET_EMIT (default balanced)
  ```
- **Regime-dependent coefficients**:
  - SHEET: `liftMul=0.6, throwMul=3.0, spreadMul=0.2`
  - SPRAY: `liftMul=1.2, throwMul=0.5, spreadMul=2.0`
  - JET: `liftMul=3.0, throwMul=0.3, spreadMul=0.1`
  - PACKET: `liftMul=1.0, throwMul=1.0, spreadMul=1.0`

### 2D. Reservoir Drain Coupling
- **File**: `shaders.ts` (emitParticlesShader)
- **Change**: When a particle is emitted, atomically decrement a drain counter. In the field shader, use this counter to reduce M proportionally.
- **Implementation**: Add `drainCounter` to counter buffer. Emit shader increments on spawn. Field shader reads drain and applies `M -= drainAmount * dt`.

### 2E. Variable Particle Mass
- **File**: `shaders.ts` (emitParticlesShader)
- **Change**: `mass = M * (0.5 + C * 0.5)` — coherent, well-charged regions produce heavier particles
- **Effect**: Sheet-like splashes feel weightier; spray feels lighter

### Acceptance Criteria
- [ ] R doesn't flicker at emission boundary
- [ ] Sphere impacts produce immediate splash response
- [ ] Forward-moving sphere produces directional sheet-like splash
- [ ] Stationary sphere drop produces symmetric plume
- [ ] Regions run out of splash budget after sustained emission

---

## Phase 3: Two-Way Coupling (Particle ↔ Heightfield)

**Goal**: Particles affect the water surface when they land, creating secondary ripples and returning mass.

### 3A. Particle-to-Heightfield Feedback
- **New shader**: `particleFeedbackShader` (WGSL compute)
- **Architecture**: After particle update, scan particles near the water surface. For each particle below Y=0 with downward velocity:
  - Add impulse to water heightfield at particle's XZ position
  - `waterHeight += particleMass * particleVelY * feedbackStrength`
  - Create a small splash ring at impact point
- **Buffer access**: Particle shader writes to a feedback buffer; a new compute pass applies feedback to water grid
- **Integration**: New pipeline + bind group in `WaterGPU.ts`, runs between particle update and water drop

### 3B. Recapture via Adhesion Field
- **File**: `shaders.ts` (updateParticlesShader)
- **Change**: Particles near the surface check the A (adhesion) field:
  ```
  // Sample A at particle's XZ position (approximated from grid)
  if (distToSurface < 0.05 && A > 0.5 && speed < 0.3) {
    // Pull toward surface
    vel.y += (surfaceY - pos.y) * A * 15.0 * dt;
    // When close enough and slow enough, recapture
    if (distToSurface < 0.01 && speed < 0.1) {
      pos.w = 0.0; // deactivate
      // Flag for M recharge (via feedback buffer)
    }
  }
  ```
- **M Recharge**: Recaptured particles feed mass back into the reservoir field at their XZ location

### 3C. Heightfield Energy Conservation
- **New logic in water update**: Track total system energy (kinetic + potential) across heightfield and particles. Apply a gentle correction factor to prevent energy drift.
- **Implementation**: Compute pass that sums `0.5 * velocity² + 0.5 * height²` across grid, adjusts damping dynamically

### Acceptance Criteria
- [ ] Particles landing on calm water create visible secondary ripples
- [ ] Particles near calm surface gradually merge back
- [ ] Recaptured particles replenish local reservoir M
- [ ] System energy doesn't diverge over time

---

## Phase 4: Particle Compaction & Performance

**Goal**: Remove the serial compaction bottleneck and optimize readback.

### 4A. Parallel Prefix-Sum Compaction
- **File**: `shaders.ts` (replace `resetParticlesShader`)
- **Algorithm**: 
  1. Mark alive/dead (parallel scan)
  2. Exclusive prefix sum over alive flags
  3. Scatter alive particles to compacted positions
- **Workgroup**: Use workgroup_size(256) with shared memory for prefix sum
- **Effect**: Compaction goes from O(n) serial to O(n/256) parallel

### 4B. Double-Buffered Staging
- **File**: `WaterGPU.ts`
- **Change**: Use two sets of staging buffers. While one set is being mapped for CPU read, the other is available for GPU writes. This prevents `mapAsync` stalls.
- **Implementation**: Track a `stagingFlip` index, alternate each frame

### 4C. Selective Readback
- **File**: `WaterGPU.ts`
- **Change**: Only read back particle data every frame. Water/field textures can be read every 2nd frame (they change slowly). Counter can be read every frame (it's only 4 bytes).
- **Effect**: Reduces staging buffer pressure by ~60%

### Acceptance Criteria
- [ ] Compaction runs in < 1ms for 8192 particles
- [ ] No frame stalls from mapAsync
- [ ] Consistent 60fps with max particles

---

## Phase 5: Advanced Surface Fields

**Goal**: Complete the field system per the encyclopedia spec.

### 5A. U Field Advection
- **File**: `shaders.ts` (surfaceFieldsShader)
- **Change**: Advect U by the flow field:
  ```
  // Semi-Lagrangian advection of U
  let backtracePos = uv - U * dt * advectionScale;
  let advectedU = sampleField2(backtracePos);
  U = mix(advectedU, U, 0.5) * 0.95 + momentumGain;
  ```
- **Effect**: U propagates with waves instead of just decaying

### 5B. Sphere Tangential Forcing
- **File**: `shaders.ts` (sphereDisplacementShader)
- **Change**: Inject tangential momentum into field2 (Ux, Uz) near sphere:
  ```
  let tangent = normalize(cross(velocity, vec3(0,1,0)));
  field2[i].xy += tangent.xz * speed * proximity * 0.5;
  ```
- **Effect**: Moving sphere creates directional momentum bias in the field

### 5C. Convergence Charging of M
- **File**: `shaders.ts` (surfaceFieldsShader)  
- **Change**: Use `divU` to charge M where flow converges:
  ```
  let convergenceCharge = max(0.0, -divU) * 0.5;
  M += (refill + convergenceCharge - drain) * dt;
  ```
- **Effect**: Pile-up zones accumulate splash potential naturally

### 5D. Cooldown Suppression for R
- **File**: `shaders.ts` (surfaceFieldsShader)
- **Change**: After R drops below R_off (rupture ends), suppress re-charging for a cooldown period:
  ```
  let recentlyRuptured = step(R_off, prevR) * step(prevR, R_off + 0.01); // just crossed down
  cooldown = max(cooldown - dt, recentlyRuptured * cooldownDuration);
  R_charge *= step(cooldown, 0.001); // suppress if cooling down
  ```
- **Effect**: Prevents rapid on-off-on-off emission flicker

### Acceptance Criteria
- [ ] U field visually propagates with wave features (visible in heatmap)
- [ ] Sphere drag creates visible directional momentum trail
- [ ] Convergence zones accumulate reservoir
- [ ] No rapid R flickering after initial splash subsides

---

## Phase 6: Detached Sheet Layer (Future / Advanced)

**Goal**: Add coherent thin-sheet structures between heightfield and particles.

> This phase is architecturally complex and should only be attempted after Phases 1–5 are solid. Including it here for completeness.

### 6A. Patch Detection
- Detect connected rupture regions with high C using GPU flood-fill or connected-component labeling
- Extract patch centroid, principal direction, extent, coherence, reservoir mass

### 6B. Sheet Geometry Spawning
- When a high-C patch triggers emission, spawn a ribbon/strip mesh instead of (or in addition to) particles
- Ribbon is a narrow triangle strip driven by patch centroid + momentum U
- Sheet stores: position, velocity, width, thickness, age

### 6C. Sheet Dynamics
- Thickness tracking: sheets thin as they stretch
- Necking: when thickness < threshold, sheet tears into particles
- Curvature: sheets can curl based on velocity differential across width

### 6D. Sheet Rendering
- Render as thin mesh strips with:
  - Water-like refraction/Fresnel on faces
  - Alpha based on thickness (thinner = more transparent)
  - Edge glow/rim light for silhouette definition

### Acceptance Criteria
- [ ] Coherent splash creates visible sheet/lip structure
- [ ] Sheet stretches and thins over time
- [ ] Sheet eventually tears into spray particles
- [ ] Sheets are visually integrated with heightfield water

---

## File Change Summary

| Phase | Files Modified | Files Created | Files Removed |
|-------|---------------|---------------|---------------|
| 1 | WaterScene.tsx, ParticleRenderer.tsx | FluidRenderer.tsx (or refactored PR) | — |
| 2 | shaders.ts (WGSL), WaterGPU.ts | — | — |
| 3 | shaders.ts, WaterGPU.ts | particleFeedbackShader (in shaders.ts) | — |
| 4 | shaders.ts, WaterGPU.ts | — | — |
| 5 | shaders.ts | — | — |
| 6 | WaterScene.tsx, shaders.ts, WaterGPU.ts | SheetRenderer.tsx, sheetShaders.ts | — |

---

## Implementation Order & Dependencies

```
Phase 1 (Visual) ←── no deps, start here
    ↓
Phase 2 (Emission) ←── improves what Phase 1 renders
    ↓
Phase 3 (Coupling) ←── needs Phase 2's regime system
    ↓
Phase 4 (Perf) ←── needed before scaling up particles
    ↓
Phase 5 (Fields) ←── refines control for all above
    ↓
Phase 6 (Sheets) ←── needs everything above working well
```

---

## Key Constants to Calibrate

| Constant | Current | Proposed | Rationale |
|----------|---------|----------|-----------|
| `uPointSize` | 4.0 | 1.5 | World-space sizing makes this camera-independent |
| `attenuation` | 30.0 | N/A | Replaced by world-space formula |
| `baseAlpha` | 0.12–0.04 | 0.06–0.02 | Smaller particles need less alpha per point |
| `R_on` | 0.15 | 0.20 | Higher threshold, more decisive emission |
| `R_off` | 0.15 (same) | 0.10 | Hysteresis gap prevents flicker |
| `maxAge` | 3.0 | 2.5 | Slightly shorter lifetime, less clutter |
| `emitEvery` | 3 frames | 2 frames | Denser emission for fluid look |
| `texelSkip` | every 3rd | every 2nd | More emitters for density |
| `MAX_PARTICLES` | 8192 | 16384 | Need more for fluid density |
| `gravity` | 9.8 | 9.8 | Correct |
| `buoyancy` | 4.0 | 6.0 | Stronger pull-back for recapture |
| `surfacePull` | 8.0 | 12.0 | Stronger adhesion |

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Screen-space fluid rendering too expensive | High | Keep Gaussian splatting as fallback; profile aggressively |
| Particle feedback creates instability | Medium | Clamp feedback impulse; use running average |
| Prefix-sum compaction bugs | Medium | Test with known particle arrays; validate count |
| Too many render passes hurt FPS | High | Combine passes where possible; half-res for smoothing |
| Sheet geometry complexity explodes | High | Cap max sheets at 8; simple strip geometry only |

---

## How to Proceed

Start with **Phase 1A** (world-space particle sizing) — it's a single uniform change in `ParticleRenderer.tsx` that immediately improves the look. Then move to **Phase 1B** (screen-space fluid rendering) which is the biggest single visual improvement. Phases 2–5 can be done incrementally after that.

Tell me which phase to start implementing.
