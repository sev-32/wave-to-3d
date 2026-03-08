# Failure & Missed-Items Book

**Project:** Hybrid Water Simulation  
**Date:** 2026-03-08  
**Scope:** Audit against original references in `src/reference/` and current implementation in `src/components/water/`.

---

## 1) What I audited

### Original docs reviewed
- `HYBRID_WATER_ENCYCLOPEDIA.md`
- `LOVABLE_WAVES_REFERENCE.md`
- `OVERHAUL_PLAN.md`
- `IMPLEMENTATION_PHASE_1_ARCHITECTURE.md`
- `IMPLEMENTATION_PHASE_2_SURFACE_FIELDS.md`
- `IMPLEMENTATION_PHASE_3_PARTICLE_PHYSICS.md`
- `IMPLEMENTATION_PHASE_4_RENDERING.md`
- `IMPLEMENTATION_PHASE_5_GAPS_AND_ROADMAP.md`

### Current implementation reviewed
- `src/components/water/webgpu/shaders.ts`
- `src/components/water/webgpu/WaterGPU.ts`
- `src/components/water/ParticleRenderer.tsx`
- `src/components/water/WaterScene.tsx`
- `src/components/water/useWaterSimulation.ts`

---

## 2) Big truth first

A lot of Phases 2–5 work is now present (R hysteresis, regime classifier, adhesion recapture, particle feedback, higher particle cap, selective readback), but the **core visual target from Phase 1B and the encyclopedia is still not met**:

- No true screen-space fluid pipeline (depth pass → bilateral smooth → normal reconstruction → composite)
- No detached coherent sheet layer
- No patch-based emission architecture

That is why it can still feel like a “better version got lost”: some internals improved while the most visible cinematic layer is still missing.

---

## 3) Failures and misses by phase

## Phase 1 (Visual Overhaul)

### ✅ Implemented
1. **World-space particle sizing** in `ParticleRenderer.tsx` via
   - `gl_PointSize = (worldRadius * uResolutionY) / (-mvPosition.z * tan(uFov * 0.5))`
2. **Age-based visual transition** (fluid → spray → mist) implemented in fragment shader.

### ❌ Missed / failed
1. **No multi-pass fluid renderer** (`FluidRenderer.tsx`) as specified in overhaul plan.
2. **No depth splat render target** for particle fluid depth.
3. **No bilateral smoothing pass**.
4. **No normal reconstruction pass from smoothed depth**.
5. **No physically coherent composite pass with refractive integration into scene depth**.
6. `ParticleRenderer` header says “Screen-Space Fluid Particle Renderer” but implementation is still single-pass point splatting (naming mismatch / doc drift).

### Impact
- Visuals still read as particles rather than cohesive detached water skin.

---

## Phase 2 (Emission Quality & Regimes)

### ✅ Implemented
1. **R hysteresis** (`R_ON`, `R_OFF`) in `surfaceFieldsShader`.
2. **Cooldown suppression** after rupture deactivation.
3. **Impact memory term** included in R charge equation.
4. **Regime classifier** in `emitParticlesShader` (SHEET, SPRAY, JET, PACKET coefficient sets).
5. **Variable particle mass** (`mass = M * (0.5 + C * 0.5)`).
6. **Sphere tangential forcing** into `U` field in `sphereDisplacementShader`.

### ⚠️ Partial / incorrect
1. **Reservoir drain coupling to actual emission count is still incomplete**.
   - Current drain is field-side (`drain = R*C*...`) and not direct per-spawn drain accounting.
   - The overhaul spec asked for direct spawn-coupled drain counter.
2. **Patch-based emission still missing** (still per-texel emission).

### Impact
- Better than before, but still lacks coherent structure spawning from connected rupture regions.

---

## Phase 3 (Two-way Coupling)

### ✅ Implemented
1. **Particle-to-heightfield feedback** exists:
   - particles accumulate impact impulses into atomic feedback buffer.
2. **Adhesion recapture logic** implemented (A-field assisted capture).
3. **Mass return to M** written through feedback accumulation.

### ❌ Missed / failed
1. **No explicit system-energy conservation pass** (called out in plan).
2. **No true MLS-MPM transfer (P2G/G2P)**; still ballistic/drag model.

### ⚠️ High-risk correctness issue
1. In `WaterGPU.step()`, apply-feedback writes to `fieldWrite` but **does not swap field buffers afterward**.
   - This risks feedback updates being overwritten or delayed incorrectly.
   - This is a pipeline ordering/state management miss.

### Impact
- Coupling exists but can be inconsistent due to field ping-pong handling.

---

## Phase 4 (Compaction & Performance)

### ✅ Implemented
1. Double-buffered staging readback.
2. Selective readback cadence (textures every second frame).
3. Multi-stage compaction flow added (mark → prefix → scatter → copy).

### ❌ Failed implementation detail (critical)
1. **Prefix-sum compaction appears logically incorrect across workgroups.**
   - Prefix values are computed per workgroup chunk.
   - No global workgroup offset accumulation is applied before scatter.
   - Scatter uses `destIdx = prefixSums[idx]`, which can cause collisions between groups.

### Impact
- Potential particle corruption, unstable alive counts, and visual glitches under load.

---

## Phase 5 (Advanced Surface Fields)

### ✅ Implemented
1. U field semi-Lagrangian advection.
2. Sphere tangential momentum injection.
3. Convergence charging for M.
4. Cooldown suppression of R.

### ⚠️ Partial / still missing ecosystem pieces
1. Advanced persistence/shear-aware coherence refinements not present.
2. No patch extraction layer that consumes fields into coherent structures.

---

## Phase 6 (Detached Sheets)

### ❌ Not implemented
1. No sheet patch detection.
2. No ribbon/strip sheet spawning.
3. No sheet thickness / necking / tear dynamics.
4. No sheet renderer integration.

### Impact
- Missing the encyclopedia’s core “coherent detached sheet before spray” visual law.

---

## 4) Cross-cutting misses vs encyclopedia core laws

From `HYBRID_WATER_ENCYCLOPEDIA.md` core claims:

1. **Detached coherent water should not be only particles** → still violated (no sheet layer).
2. **Avoid hose-like hotspot emission** → improved but not solved (no patch extraction).
3. **Representation stack with explicit transitions** → only partially implemented.
4. **Carrier drives visible detached geometry** → not yet (carrier mostly directly rendered as points).

---

## 5) Specific technical risks currently in code

1. **Field feedback ping-pong risk** (`WaterGPU.ts`): apply-feedback writes to `fieldWrite` without `swapField()`.
2. **Compaction global-prefix issue** (`shaders.ts`): per-group scan without global offsets.
3. **Render integration gap** (`ParticleRenderer.tsx`): depthTest false + no fluid depth compositing keeps particles decoupled from water body.
4. **Counter capacity ambiguity** (`emitParticlesShader` uses `MAX_P/2` slots): effective active count can be lower than expected by naming.

---

## 6) Delivery/process failures (the collaboration failures you felt)

1. Multiple behavioral changes were combined instead of single isolated deltas.
2. No strict one-change-per-step stabilization between edits.
3. Not enough hard checkpoints after each “working” step.
4. Mismatch between “what changed” and “what was visibly fixed” tracking.

These are process failures, not just shader failures.

---

## 7) Recovery-grade remediation plan (strict, no scope drift)

1. **Lock single-change protocol**: exactly one scoped change per prompt.
2. **Fix correctness first**:
   - 2.1 compaction global prefix correctness
   - 2.2 feedback field ping-pong correctness
3. **Then visual milestone**:
   - Phase 1B minimal implementation: particle depth pass + blur + composite
4. **Then structure milestone**:
   - patch-based emission scaffold
5. **Then detached sheet MVP**.

---

## 8) Checklist of currently missed major deliverables

- [ ] Multi-pass screen-space fluid renderer
- [ ] Bilateral depth smoothing
- [ ] Screen-space normal reconstruction
- [ ] Proper fluid composite integration with water surface
- [ ] Patch-based emission (connected rupture regions)
- [ ] Spawn-coupled reservoir drain accounting
- [ ] Global-correct parallel compaction prefix sums
- [ ] Verified feedback field ping-pong correctness
- [ ] Detached sheet layer (ribbons/ligaments)
- [ ] Sheet breakup dynamics (necking/tear)
- [ ] Full state-transition architecture from encyclopedia

---

## 9) Bottom line

The current codebase is **not a total failure**, but it is also **not at the original reference target**. The biggest misses are exactly where visual believability depends most: **screen-space fluid compositing, patch-structured emission, and detached sheet regime**.
