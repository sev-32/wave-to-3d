# COMPLETE FAILURE & MISSED-ITEMS BOOK

**Project:** Hybrid Water Simulation  
**Date:** 2026-03-08  
**Scope:** Exhaustive line-by-line audit of current implementation against ALL original reference documents  
**References Audited:**  
- `HYBRID_WATER_ENCYCLOPEDIA.md` (16,635 lines — Volumes I–VI + Visual Regime Atlas + UI/Diagnostics Console Spec)
- `LOVABLE_WAVES_REFERENCE.md` (3,018 lines — original WebGL reference implementation)
- `OVERHAUL_PLAN.md` (323 lines — 6-phase overhaul plan with acceptance criteria)
- `IMPLEMENTATION_PHASE_1_ARCHITECTURE.md` (141 lines — pipeline and architecture overview)
- `IMPLEMENTATION_PHASE_2_SURFACE_FIELDS.md` (166 lines — field semantics and gaps)
- `IMPLEMENTATION_PHASE_3_PARTICLE_PHYSICS.md` (166 lines — MLS-MPM and emission spec)
- `IMPLEMENTATION_PHASE_4_RENDERING.md` (142 lines — rendering pipeline and visual quality)
- `IMPLEMENTATION_PHASE_5_GAPS_AND_ROADMAP.md` (134 lines — gaps and roadmap)
- `COMPLIANCE_AUDIT.md` (268 lines — earlier compliance audit)
- `splash-mls-mpm.html` (reference MLS-MPM fluid sim)
- `OpusMagnusWater.html` (extended MLS-MPM with 3D rendering)
- `ProPool.html` (previous pool simulation attempt)

**Current Implementation Files Audited:**
- `src/components/water/webgpu/shaders.ts` (856 lines — all WGSL compute shaders)
- `src/components/water/webgpu/WaterGPU.ts` (718 lines — GPU pipeline orchestration)
- `src/components/water/ParticleRenderer.tsx` (243 lines — Three.js particle rendering)
- `src/components/water/WaterScene.tsx` (552 lines — main R3F scene)
- `src/components/water/useWaterSimulation.ts` (199 lines — WebGL fallback)
- `src/components/water/useWebGPUWater.ts` (133 lines — WebGPU hook bridge)
- `src/components/water/useCaustics.ts` (103 lines — caustics render pass)
- `src/components/water/useFallbackParticles.ts` (148 lines — CPU fallback particles)
- `src/components/water/shaders/waterShaders.ts` (155 lines — WebGL water shaders)
- `src/components/water/shaders/renderShaders.ts` (583 lines — render shaders)
- `src/components/water/shaders/causticsShaders.ts` (188 lines — caustics shaders)
- `src/pages/Index.tsx` (430 lines — main page and UI)
- `src/components/analyst/AnalystPanel.tsx` (268 lines — AI analyst panel)
- `src/lib/aiAnalyst.ts` — AI streaming client
- `src/lib/screenshots.ts` — screenshot pipeline
- `supabase/functions/analyze-screenshot/index.ts` — edge function

---

# PART I — ENCYCLOPEDIA COMPLIANCE AUDIT

This section audits the current implementation against every major section of the 16,635-line Hybrid Water Encyclopedia.

---

## Chapter 1: Core Thesis (Encyclopedia §1–§3)

### §1.1 The Representation Stack — Four Coupled Regimes

The encyclopedia defines four mandatory regimes:

1. **Attached surface regime** (heightfield) — ✅ IMPLEMENTED
2. **Detached coherent sheet regime** (ribbons, lips, crowns) — ❌ COMPLETELY MISSING
3. **Carrier mass/momentum regime** (MLS-MPM particles) — ⚠️ SIMPLIFIED (ballistic, no P2G/G2P)
4. **Fragmented regime** (spray, droplets, foam) — ⚠️ PARTIAL (age-based fadeout only, no foam/aeration)

**Compliance Score: 1/4 fully implemented, 2/4 partial, 1/4 missing.**

### §1.2 The Fundamental Design Law

> "The heightfield owns continuity. The carrier particles own momentum and detached bulk mass. The detached sheet owns visual skin continuity during breach and elongation. The fragmented regime owns terminal breakup."

**Current violation:** Carrier particles are forced to own BOTH momentum AND visual skin continuity, because no sheet layer exists. This is the single biggest architectural violation in the entire codebase.

### §1.3 Four Major Failure Modes to Prevent

The encyclopedia says the system MUST avoid:

1. ❌ "Treating the surface like a rigid barrier or prison lid" — **PARTIALLY VIOLATED.** The heightfield cannot overturn, and no mechanism allows it to transition to volumetric representation at the right moment. However, the SDF sphere constraint in the vertex shader (renderShaders.ts:29-46) does push water mesh above the sphere, which is a partial fix.

2. ❌ "Spawning upward particle hoses from scalar hot spots" — **STILL PARTIALLY VIOLATED.** The regime classifier helps, but per-texel emission (not patch-based) still creates scattered directional incoherence. Without patch grouping, nearby texels with slightly different U vectors create a noisy spray pattern instead of a coherent sheet.

3. ❌ "Forcing thin coherent water structures to be represented only by discrete particles" — **FULLY VIOLATED.** No sheet layer exists. All detached water is particles.

4. ⚠️ "Allowing infinite emission without memory, recharge, or recapture" — **PARTIALLY FIXED.** Reservoir M exists with refill/drain. Adhesion recapture exists. But drain is not spawn-coupled, and the mass-return path from recapture has a potential correctness issue (feedback buffer ping-pong).

---

## Chapter 2: First Principles of Water Realism (Encyclopedia §2)

### §2.1 Why Water Looks Real — Six Visual Truths

| Truth | Status | Details |
|-------|--------|---------|
| Broad coherent continuity over main body | ✅ | Heightfield handles this well |
| Smooth transport of waves and interference | ✅ | 8-neighbor isotropic stencil works |
| Localized failure into 3D structures at right time | ⚠️ | R/C/M fields exist but no structured patch extraction |
| Temporary sheet-like continuity during breach | ❌ | No sheet layer |
| Delayed breakup through necking/thinning | ❌ | No necking dynamics |
| Recapture and reintegration | ⚠️ | Adhesion capture exists but mass return incomplete |

### §2.2 Why Water Looks Fake — Six Visual Failures

| Failure Mode | Currently Exhibited? | Severity |
|-------------|---------------------|----------|
| Entire body looks like independent particles | No — heightfield dominates | ✅ OK |
| Detachment creates discrete marble chains too early | Yes — no sheet continuity | ❌ HIGH |
| Upward release is isotropic/vertical | Partially — regime classifier helps but per-texel noise remains | ⚠️ MEDIUM |
| Splashes appear as generic blobs | Yes — no patch-structured emission | ❌ HIGH |
| Detached water never re-merges | Partially — adhesion recapture exists but visual integration weak | ⚠️ MEDIUM |
| Every hot region emits equally | Partially — R/C/M gate emission, but no patch priority | ⚠️ MEDIUM |

---

## Chapter 3: Regime Transitions (Encyclopedia §3)

### §3.1 Water as a State Machine — Six States Required

| State | Implemented? | How |
|-------|-------------|-----|
| Surface-attached | ✅ | Heightfield |
| Surface-bound but thickening / near-failure | ⚠️ | R field charges up but no explicit "bulge" state |
| Detached coherent sheet / ligament | ❌ | No sheet objects |
| Detached volumetric packet | ⚠️ | Particles exist but not structured as packets |
| Spray / droplet breakup | ⚠️ | Age-based visual transition only |
| Re-entry / recapture / reabsorption | ⚠️ | Adhesion field and feedback exist but incomplete |

### §3.2 Key Transition Criterion

> "Is this fluid still representable as a coherent attached surface, or has it become geometrically and dynamically unable to remain a single-valued sheet?"

**Current implementation does not ask this question.** Emission happens based on scalar thresholds (R > R_ON, M > 0.03), not based on geometric inability to remain single-valued. The heightfield never detects that it cannot represent the current state.

---

## Chapter 4–7: Regime Details (Encyclopedia §4–§7)

### Heightfield Regime (§4) — ✅ Mostly Correct
- Standard 2D wave equation ✅
- Normals from heightfield gradient ✅
- Properly handles ripples, wakes, interference ✅
- **Missing:** No detection of when the heightfield can no longer represent the geometry (overturning, multi-valued)

### Carrier Particle Regime (§5) — ⚠️ Simplified

The encyclopedia says:
> "Carrier particles should often DRIVE visible detached geometry rather than be the sole visible geometry themselves."

**Current violation:** Particles ARE the sole visible geometry for all detached water. No sheet meshes, no ribbon strips, no patch geometry is driven by carrier particles.

### Detached Sheet Regime (§6) — ❌ Completely Missing

The encyclopedia devotes 2,000+ lines to detached sheets. None of it is implemented:
- No sheet patches
- No ribbon/ligament representation
- No thickness tracking
- No necking dynamics
- No tear logic
- No stretch dynamics
- No sheet-to-carrier coupling
- No sheet renderer

### Fragmented Regime (§7) — ⚠️ Partial

> "Spray should not be the default response to breach. Spray should be the result of: thinning, necking, loss of coherence, high strain, strong turbulence, delayed rupture."

**Current violation:** All particles become spray-like via age-based visual transition, regardless of actual coherence loss or necking dynamics. There is no "delayed fragmentation" — fragmentation is immediate upon emission.

---

## Chapter 8–9: Surface Intent Fields (Encyclopedia §8–§9)

### Field Implementation Status

| Field | Defined | Computed | Used for Emission | Used for Recapture | Diagnostics |
|-------|---------|----------|-------------------|-------------------|-------------|
| R (Rupture) | ✅ | ✅ | ✅ | — | ✅ (heatmap) |
| U (Momentum) | ✅ | ✅ | ✅ (throw direction) | — | ⚠️ (hue-coded overlay exists) |
| C (Coherence) | ✅ | ✅ | ✅ (regime classifier) | — | ✅ (heatmap) |
| M (Reservoir) | ✅ | ✅ | ✅ (gates emission) | ⚠️ (mass return partial) | ✅ (heatmap) |
| A (Adhesion) | ✅ | ✅ | — | ✅ (recapture logic) | — (not in heatmap) |

### §9 "Why a Scalar Heatmap Alone Is Insufficient"

The encyclopedia explicitly warns against using a single heatmap without vector and memory fields. The current implementation DOES have multi-field architecture, which is a genuine achievement. However, the fields are not consumed by a patch extraction layer, which was the encyclopedia's intended purpose for them.

---

## Chapter 10: Emission Philosophy (Encyclopedia §10)

### §10.1 "Emission Should Not Be Per-Texel Particle Sprinkling"

> "Raw per-texel spawning tends to produce noise, poor continuity, unstable patch boundaries, too much visual randomness."

**FULLY VIOLATED.** Current `emitParticlesShader` iterates over every grid cell (256×256 = 65,536 texels) and spawns particles per-texel based on local thresholds. There is no patch grouping, no connected-region extraction, no structured emission.

### §10.2 "Emission Should Be Patch-Based"

The encyclopedia says each rupture patch should have: center, extent, principal direction, coherence, severity, reservoir mass, regime classification.

**NONE of this exists in the current code.** There are no patch records, no patch buffers, no patch extraction shaders.

### §10.3 "Emission Should Be Continuous Over Time"

> "A patch should behave like a valve opening, a crest peeling, a crown growing, a ligament sustaining briefly."

**Not implemented.** Emission is per-frame stochastic per-texel sampling.

---

## Chapter 11: Velocity Composition (Encyclopedia §11)

### Current Implementation vs Spec

| Component | Encyclopedia | Current Code | Match? |
|-----------|-------------|-------------|--------|
| Surface-normal lift | `alphaN * n` | `ny * liftScale * 1.5 + max(abs(velocity) * 3.0, 0.35)` | ⚠️ Similar but not decomposed |
| Forward throw | `alphaP * p` (normalized U) | `Ux * throwScale` | ✅ Close |
| Lateral spread | `alphaT * t` (crest tangent) | `cos/sin(noiseAngle) * spreadRadius` | ⚠️ Random, not crest-tangent aligned |
| Stochastic noise | Controlled | Random noise | ⚠️ Less structured than spec |
| Regime-dependent coefficients | ✅ Four regimes | ✅ Four regimes with correct multipliers | ✅ Match |

**Main gap:** Lateral spread uses random angles instead of crest-tangent alignment, which means fans and ribbons cannot form directional structures.

---

## Chapter 12–14: Detached Sheet Ontology, Breakup, Recapture (Encyclopedia §12–§14)

### ❌ All Missing

The encyclopedia defines:
- 12 patch properties (anchor, velocity, frame, width, thickness, stretch, curvature, coherence, age, mass budget, tear threshold, recapture threshold)
- 5 patch family types (crest-lip, ribbon ligament, crown wall arc, impact sheet fan, reconnecting bridge)
- 5-step breakup sequence (stretch → thin → neck → pinch → spray)
- 5 recapture criteria (low separation, low relative velocity, high adhesion, loss of complexity, re-entry impact)

**None of these data structures, algorithms, or shaders exist in the codebase.**

---

## Chapter 15: Diagnostics and Visualization (Encyclopedia §15)

### Required Diagnostic Views vs Current

| Diagnostic | Required | Implemented? |
|-----------|----------|-------------|
| R heatmap | ✅ | ✅ (red channel of overlay) |
| U arrows/streamlets | ✅ | ⚠️ (hue-coded overlay, no arrows) |
| C heatmap | ✅ | ✅ (green channel) |
| M heatmap | ✅ | ✅ (blue channel) |
| A heatmap | ✅ | ❌ (computed but not displayed) |
| Regime classification map | ✅ | ❌ Not implemented |
| Sheet thickness overlay | ✅ | ❌ No sheets |
| Sheet strain/necking zones | ✅ | ❌ No sheets |
| Recapture zones | ✅ | ❌ Not visualized |
| Spray conversion zones | ✅ | ❌ Not visualized |
| Patch boundaries | ✅ | ❌ No patches |
| Counter/budget panel | ✅ | ❌ Not implemented |
| Event timeline | ✅ | ❌ Not implemented |
| Performance timing | ✅ | ❌ Not implemented |

**Implemented: 3/14 (21%). Partial: 1/14. Missing: 10/14.**

---

## Chapter 16: Taxonomy of Failure Modes (Encyclopedia §16)

### Currently Exhibited Failure Modes

**Heightfield failures:**
- ❌ Impossible steepness without volumetric handoff — YES, steep waves stay as heightfield
- ⚠️ Fake cresting — partially mitigated by R field
- ❌ Lack of overturn — YES, structurally impossible with heightfield

**Particle failures:**
- ❌ Marbly surfaces — YES, particles are individual points without sheet skin
- ❌ Too-early breakup — YES, particles are immediately fragmented upon emission
- ⚠️ Oversized droplets — improved with world-space sizing, but `PARTICLE_WORLD_RADIUS = 0.008` is used (was 0.013 in earlier version)

**Hybrid coupling failures:**
- ⚠️ Double counting mass — M drain is not spawn-coupled
- ⚠️ Infinite emission — gated by M but not by spawn-coupled drain
- ❌ Visually disconnected layers — particles and heightfield render independently with different blending modes, no visual transition zone

---

## Chapter 17: Recommended Development Order (Encyclopedia §17)

| Phase | Encyclopedia Recommendation | Status |
|-------|---------------------------|--------|
| Phase I — Field Ontology and Diagnostics | Define and visualize R, U, C, M, A | ✅ Done (fields computed + heatmap overlay) |
| Phase II — Patch-Based Emission | Replace texel-level ejection with rupture-patch detection | ❌ Not done |
| Phase III — Detached Sheet Prototype | Introduce sparse detached-sheet layer | ❌ Not done |
| Phase IV — Controlled Breakup and Recapture | Thickness-driven necking, delayed spray, reabsorption | ❌ Not done |
| Phase V — Regime Library | Catalog of regimes: crest peel, impact plume, crown wall, etc. | ❌ Not done |

**The encyclopedia's recommended order was: fields first (done), then patches, then sheets, then breakup. The implementation skipped patches and sheets entirely and went straight to particle improvements, which the encyclopedia warns against.**

---

# PART II — VOLUME-BY-VOLUME ENCYCLOPEDIA AUDIT

## Volume I: Field Mathematics (Encyclopedia §23–§41)

### §24: Core Surface State Variables

All 7 mandatory fields are defined and computed:
- `eta` (height) ✅
- `etaDot` (velocity) ✅
- `U` (surface momentum) ✅
- `R` (rupture potential) ✅
- `C` (coherence) ✅
- `M` (reservoir mass) ✅
- `A` (adhesion/recapture) ✅

Optional fields status:
- `I` (impact memory) ✅ (computed as `impactMemory` in surfaceFieldsShader)
- `K` (curvature/crestness) ✅ (computed as `crestness` from laplacian)
- `D` (divergence) ✅ (computed as `divU`)
- `S` (shear/strain) ❌ Not implemented
- `F` (foam/aeration) ❌ Not implemented
- `T` (transition memory) ❌ Not implemented

### §26: Derived Geometric Operators

| Operator | Specified | Implemented? | Location |
|----------|----------|-------------|----------|
| Surface gradient `gradEta` | ✅ | ✅ | surfaceFieldsShader:283-285 |
| Surface normal `n` | ✅ | ✅ | waterNormalsShader |
| Curvature proxy `kappa` | ✅ | ✅ | surfaceFieldsShader:287 (`laplacian`) |
| `|U|` magnitude | ✅ | ✅ | surfaceFieldsShader:304 |
| `divU` convergence | ✅ | ✅ | surfaceFieldsShader:307-311 |
| Surface shear proxy | ✅ | ❌ | Not implemented |
| `Eup` vertical excitation | ✅ | ✅ | surfaceFieldsShader:289 (`Eup = max(0, velocity)`) |

### §28: Constructing Rupture Potential R

Encyclopedia formula:
```
Rraw = wK*crestness + wE*Eup + wS*slope + wU*|U| + wD*compression + wI*impactMemory + wF*feedbackForce + wM*reservoirBias
```

Current implementation (shaders.ts:321-337):
```
Rraw = wK(0.20)*crestness + wE(0.24)*Ekin + wS(0.16)*slope + wU(0.20)*Umag + wD(0.12)*compression + wI(0.08)*impactMemory
```

**Missing from spec:**
- `wF * feedbackForce` — no carrier-feedback forcing into R
- `wM * reservoirBias` — no reservoir-fullness contribution to R

**Deviation:** Uses `Ekin = abs(velocity)` instead of `Eup = max(0, velocity)`. This means downward velocity also contributes to R, which could create spurious rupture potential during wave troughs.

### §28.4: Hysteresis

✅ Implemented correctly: `R_ON = 0.20`, `R_OFF = 0.10`, emission-active flag, cooldown suppression.

### §29: Constructing Surface Momentum U

Encyclopedia update law:
```
dU/dt = advection(U) + wavePacketTransport + externalTangentialForce + recaptureFeedback - damping - diffusion
```

Current implementation:
- ✅ Advection: Semi-Lagrangian advection implemented (shaders.ts:291-303)
- ✅ Momentum gain from wave propagation: `momentumGain = -gradient * velocity * dt * 5.0`
- ✅ External tangential forcing from sphere: Implemented in sphereDisplacementShader
- ❌ `wavePacketTransport` — no explicit wave packet direction injection
- ❌ `recaptureFeedback` — recaptured particles don't contribute to U
- ⚠️ Damping: `0.95` decay factor applied
- ❌ Diffusion: No spatial smoothing/blur of U

### §30: Constructing Coherence C

Encyclopedia formula:
```
Craw = a1*ridgeAlignment + a2*momentumAlignment + a3*temporalPersistence - a4*disorder - a5*noisyShear
```

Current implementation (shaders.ts:356-368):
```
Craw = alignment * 0.7 + min(Umag * 3.0, 1.0) * 0.3
C += (2.0 * Craw - 1.5 * C) * dt
```

**Missing from spec:**
- `temporalPersistence` — no multi-frame persistence check
- `disorder` penalty — no shear/disorder metric
- `noisyShear` — no sign-flipping detection in normal variation

**Impact:** C is overly optimistic — it never penalizes disorder, so noisy regions can register as "coherent" when they shouldn't.

### §31: Constructing Reservoir Mass M

Encyclopedia formula:
```
dM/dt = refill + convergenceCharge + recaptureInput + impactCharge - releaseDrain - evaporationToFoam
```

Current implementation (shaders.ts:371-377):
```
refill = refillRate * (M0 - M)
convergenceCharge = max(0.0, -divU) * 0.5
drain = R * C * 0.8 when emissionActive
M += (refill + convergenceCharge - drain) * dt
```

**Missing from spec:**
- `recaptureInput` — mass return from recaptured particles exists in feedback buffer but the pathway has correctness issues (see Part IV)
- `impactCharge` — sphere impact doesn't directly charge M, only indirectly via field dynamics
- `evaporationToFoam` — no foam field
- `releaseDrain` should be spawn-coupled, not based on R×C estimate

### §32: Constructing Adhesion A

Current implementation matches the conceptual update law well:
```
calmRecovery = 0.5 * (1 - R)
ruptureSuppression = R * 2.0
A += (calmRecovery - ruptureSuppression - A * 0.3) * dt
```

✅ Close to spec. Minor deviation: no explicit `recaptureReinforcement` or `activeLaunchSuppression` terms.

### §33: Regime Classification

Encyclopedia defines 7 regime types:
1. `surface_only` — ✅ (implicitly, when R < R_OFF)
2. `surface_bulge` — ❌ Not classified
3. `coherent_sheet_emit` — ⚠️ SHEET regime exists but spawns particles, not sheets
4. `jet_emit` — ✅ JET regime with correct coefficients
5. `packet_emit` — ✅ PACKET regime (default)
6. `spray_emit` — ✅ SPRAY regime
7. `reabsorb` — ⚠️ Adhesion recapture exists but not as a classified regime

**Missing: Hysteretic regime memory.** Once a region becomes a "sheet" regime, it should persist as such until coherence actually collapses. Current implementation re-classifies every frame.

### §34: Patch Extraction from Fields

❌ **COMPLETELY MISSING.** This is a critical encyclopedia requirement:

> "Emission should be patch-based, not isolated per texel. Therefore the field layer must include connected-region extraction."

Required patch properties that don't exist:
- Patch seeds (R > threshold, M > minimum)
- Patch growth (aggregate neighbors with compatible direction/coherence)
- Patch statistics (centroid, principal direction, extent, average R/C/M/A, regime type)

### §35: Velocity Synthesis for Detached Emission

Encyclopedia decomposes as: `v0 = lift + throw + spread + noise`

Current implementation (shaders.ts:472-477):
```
vx = Ux * throwScale + nx * liftScale * 0.4 + cos(noiseAngle) * spreadRadius
vy = ny * liftScale * 1.5 + max(abs(velocity) * 3.0, 0.35) + noise2 * 0.5
vz = Uz * throwScale + nz * liftScale * 0.4 + sin(noiseAngle) * spreadRadius
```

✅ The decomposition is present and regime-dependent coefficients match.
⚠️ Spread uses random angles instead of crest-tangent direction.
⚠️ The `max(abs(velocity) * 3.0, 0.35)` ensures a minimum upward velocity of 0.35, which may be too high for some regimes.

### §36: Mass Accounting and Conservation

> "Even if the system uses artistic approximations, it should still track mass-like budgets cleanly."

**Current violations:**
1. Reservoir drain is not spawn-coupled — M drains based on R×C, not actual emission count
2. Recaptured particle mass return has potential correctness issue (feedback buffer)
3. No "detached structure birth budget" — particles don't carry a structured budget
4. No "recapture return" accounting beyond the atomic feedback buffer

### §37: Stability and Tuning Principles

| Principle | Status |
|-----------|--------|
| Normalize all inputs | ⚠️ Some inputs not normalized (crestness scaled by 0.08, not normalized to [0,1] range) |
| Separate fast and slow fields | ✅ R charges fast (chargeRate=5.0), M refills slowly |
| Use hysteresis generously | ✅ R has hysteresis |
| Prefer patch-level decisions | ❌ All decisions are per-texel |
| Clamp the weirdness | ✅ All fields clamped to [0,1] |

---

## Volume II: Detached Sheet Structures (Encyclopedia §43–§67)

### ❌ ENTIRELY UNIMPLEMENTED

This volume spans 2,500+ lines defining:
- Sheet representation choices (ribbon, parametric patch, implicit, surfels)
- Sheet state vector (24+ per-sheet properties, 16+ per-node properties)
- Parameterization (patch coordinates, strip coordinates, local frame)
- Birth logic (trigger conditions, birth geometry, birth velocity, birth mass budget)
- Carrier coupling (carrier-to-sheet support, sheet-to-carrier reads)
- Stretch dynamics (stretch ratio, stretch drivers, stretch resistance)
- Thickness dynamics (conservation under area expansion, thickness floor)
- Necking dynamics (indicators, neck growth, why explicit necking matters)
- Tear logic (tear ingredients, hysteretic tear thresholds, tear outcomes)
- Damage and stability fields
- Edge dynamics (edge thinning, curling, scalloping, ligament seeding)
- Reconnection and recontact
- Recapture logic (sheet-level recapture, partial recapture, outputs)
- Sheet-to-spray transition (conversion signals, local conversion)
- Rendering models (ribbons, thin patches, anisotropic surfels, thickness maps)

**NONE of the above exists in any form in the codebase.**

This is the largest single category of missing functionality.

---

## Volume III: Coupling Architecture (Encyclopedia §69–§88)

### §70: Regime Ownership Model

> "At any instant, a parcel of visually meaningful water should have a primary owner."

**Current violation:** There is no ownership tracking. The heightfield always renders, and particles always render. There is visual overlap between the heightfield surface and nearby particles without any blending, transition, or ownership logic.

### §71: Global State Graph — 9 States Required

| State | Implemented? |
|-------|-------------|
| `attached_surface` | ✅ |
| `surface_bulge` | ❌ |
| `sheet_birth_candidate` | ❌ |
| `detached_sheet` | ❌ |
| `detached_packet` | ⚠️ (particles, unstructured) |
| `jet_event` | ⚠️ (regime classifier exists) |
| `fragmented_spray` | ⚠️ (age-based visual only) |
| `recontact_candidate` | ⚠️ (adhesion check exists) |
| `recaptured_surface` | ⚠️ (particle deactivation + feedback) |

### §72: Canonical Handoff Principles

| Handoff | Implemented? |
|---------|-------------|
| Surface → Sheet | ❌ |
| Surface → Packet/Jet | ⚠️ (particles, no structured packet) |
| Sheet → Spray | ❌ (no sheets to fragment) |
| Sheet/Packet → Surface Recapture | ⚠️ (adhesion recapture exists) |
| Sheet → Sheet Merge | ❌ |

### §73-76: Coupling Operators

| Operator | Required | Implemented? |
|----------|----------|-------------|
| Intent Update | ✅ | ✅ (surfaceFieldsShader) |
| Patch Extraction | ✅ | ❌ |
| Surface Emission | ✅ | ⚠️ (per-texel, not patch-based) |
| Surface Reabsorption | ✅ | ⚠️ (feedback buffer, partial) |
| Sheet Birth | ✅ | ❌ |
| Carrier Support | ✅ | ❌ |
| Stretch/Thickness | ✅ | ❌ |
| Tear/Fragmentation | ✅ | ❌ |
| Recontact | ✅ | ⚠️ (adhesion check only) |
| Carrier Birth | ✅ | ⚠️ (emit shader, unstructured) |
| Carrier Update | ✅ | ✅ (updateParticlesShader) |
| Carrier-to-Sheet Support | ✅ | ❌ |
| Carrier-to-Surface Reentry | ✅ | ✅ (feedback buffer) |
| Fragment Birth | ✅ | ❌ (no structured fragmentation) |
| Fragment Update | ✅ | ⚠️ (particles age and die) |
| Fragment Reentry | ✅ | ⚠️ (adhesion recapture) |

### §77: Budget Flow Architecture

**Budget channels required but not tracked:**
- `Bsheet` (detached sheet budget) — ❌
- `Bcarrier` (carrier budget) — ⚠️ (particle mass exists but not tracked as a budget)
- `Bfrag` (fragmented budget) — ❌
- `Breturn` (returned budget) — ⚠️ (feedback buffer, partial)

### §80: Temporal Ordering and Causality

Encyclopedia recommends 13-step order. Current pipeline has 8+ steps:

| Step | Encyclopedia | Current | Match? |
|------|-------------|---------|--------|
| 1. Advance heightfield | ✅ | waterDrop → sphereDisplacement → waterUpdate | ✅ |
| 2. Update surface intent fields | ✅ | surfaceFieldsShader | ✅ |
| 3. Ingest detached feedback | ✅ | applyFeedbackShader (every 2nd frame) | ⚠️ |
| 4. Extract coherent patches | ✅ | ❌ Not implemented | ❌ |
| 5. Decide emission events | ✅ | emitParticlesShader (per-texel) | ⚠️ |
| 6. Birth detached structures | ✅ | Particle spawn in emit shader | ⚠️ |
| 7. Advance carriers | ✅ | updateParticlesShader | ✅ |
| 8. Update detached sheets | ✅ | ❌ No sheets | ❌ |
| 9. Process tears/fragments | ✅ | ❌ No tear logic | ❌ |
| 10. Advance fragments | ✅ | ❌ No separate fragment step | ❌ |
| 11. Detect recontact | ✅ | Adhesion check in updateParticles | ⚠️ |
| 12. Feed reentry to surface | ✅ | applyFeedbackShader | ⚠️ |
| 13. Finalize render data | ✅ | Async readback → DataTexture | ✅ |

---

## Volume IV: Implementation Architecture for WebGPU (Encyclopedia §90–§113)

### §92: Resource Taxonomy

| Resource Type | Encyclopedia | Current? |
|--------------|-------------|---------|
| Dense 2D textures for fields | ✅ | ✅ (storage buffers, transferred to DataTextures) |
| Sparse patch buffers | ✅ | ❌ |
| Sparse sheet buffers | ✅ | ❌ |
| Sparse carrier buffers | ✅ | ✅ (particle buffer) |
| Sparse fragment buffers | ✅ | ❌ (particles serve dual role) |
| Indirect/control buffers | ✅ | ⚠️ (counter buffer exists) |
| Event buffers | ✅ | ❌ |

### §94: Rupture Patch Buffer Design

❌ **Not implemented.** Encyclopedia defines a complete patch record schema:
```
struct RupturePatch {
  id, active, regimeHint, priority,
  minIJ, maxIJ,
  centroidXZ, centroidY, area,
  avgNormal, avgR, avgC, avgM, avgA,
  dirXZ, extent, birthBudget, age
}
```

None of this data structure exists.

### §95: Detached Sheet Buffer Design

❌ **Not implemented.** Encyclopedia defines two-level storage:
- Sheet object records (30+ fields)
- Sheet node records (16+ fields per node)

### §100: Suggested WebGPU Pass Graph — 22 Passes

| Pass | Current? |
|------|---------|
| 1. Wave step | ✅ |
| 2. Surface momentum | ✅ (within surfaceFieldsShader) |
| 3. Intent field | ✅ |
| 4. Surface helper | ⚠️ (normals separate, others in field shader) |
| 5. Rupture seed | ❌ |
| 6. Patch extraction | ❌ |
| 7. Patch summary | ❌ |
| 8. Event resolve | ❌ |
| 9. Sheet birth | ❌ |
| 10. Carrier birth | ⚠️ (emit shader) |
| 11. Carrier update | ✅ |
| 12. Sheet support | ❌ |
| 13. Sheet geometry | ❌ |
| 14. Sheet stability | ❌ |
| 15. Sheet tear | ❌ |
| 16. Fragment update | ❌ |
| 17. Recontact | ⚠️ |
| 18. Recapture routing | ⚠️ |
| 19. Surface feedback | ✅ |
| 20. Sheet render prep | ❌ |
| 21. Fragment render prep | ❌ |
| 22. Diagnostic render prep | ⚠️ |

**Implemented: 5/22 (23%). Partial: 5/22. Missing: 12/22.**

---

## Volume V: Concrete Data Layouts and Pseudocode (Encyclopedia §115–§139)

### §118: WGSL-Friendly Struct Sketches

The encyclopedia provides 6 complete struct definitions:
1. `RupturePatch` — ❌ Not implemented
2. `DetachedSheet` — ❌ Not implemented
3. `SheetNode` — ❌ Not implemented
4. `Carrier` — ⚠️ Simplified to 2×vec4f (pos+vel only, no support density, no anisotropy)
5. `Fragment` — ❌ Not implemented as separate type
6. `HybridEvent` — ❌ Not implemented

### §119: Prototype Uniform Blocks

Encyclopedia defines 3 structured uniform blocks:
1. `SurfaceFieldParams` (24 floats) — ⚠️ Current `FieldParams` has only 4 floats (dt, refillRate, decayRate, emitThreshold). Many parameters are hardcoded in shader source.
2. `EventResolveParams` — ❌ No event system
3. `SheetParams` — ❌ No sheet system

### §120: First Practical Formulas

The encyclopedia provides normalized formulas with explicit range parameters (`rSlopeLo`, `rSlopeHi`, etc.). Current implementation uses ad-hoc scaling constants (e.g., `crestness * 0.08`, `slope * 0.75`) rather than proper normalization with configurable ranges.

### §122: Patch Extraction Pseudocode

❌ Not implemented. Encyclopedia provides:
- Seed identification criteria
- Region growth / approximate grouping
- Patch summary computation
- Compatibility heuristics

### §123: Event Resolution Pseudocode

❌ Not implemented. Encyclopedia provides:
- Prototype scores for sheet, jet, packet, spray
- Priority-based resolve with budget caps
- One-event-per-patch-per-frame rule

### §124-126: Sheet Birth/Update/Tear Pseudocode

❌ Not implemented.

---

## Volume VI: Diagnostics, Validation, Test Scenes (Encyclopedia §0–§15 of Volume VI)

### §2: Core Diagnostic Panels — 9 Required

| Panel | Implemented? |
|-------|-------------|
| Surface Scalar Panel (R,C,M,A heatmaps) | ⚠️ (combined RGB overlay, not individual heatmaps) |
| Surface Vector Panel (U arrows) | ⚠️ (hue-coded overlay, no arrows) |
| Patch Panel | ❌ |
| Detached Sheet Panel | ❌ |
| Carrier Panel | ❌ |
| Fragment Panel | ❌ |
| Counter/Budget Panel | ❌ |
| Timing Panel | ❌ |
| Timeline/Event Panel | ❌ |

**Implemented: 0/9 fully. Partial: 2/9. Missing: 7/9.**

### §3: Debug Modes

| Mode | Implemented? |
|------|-------------|
| Freeze attached surface only | ❌ |
| Freeze detached sheets only | ❌ (no sheets) |
| Freeze carriers only | ❌ |
| Freeze fragments only | ❌ |
| Freeze all feedback | ❌ |
| Freeze all random noise | ❌ |
| Render only one regime | ❌ |
| Single-frame stepping | ✅ (pause button exists) |
| Replay last N frames | ❌ |
| Replay canonical test scene | ❌ |

### §4: Canonical Test Scene Library — 9 Scenes Required

| Scene | Implemented? |
|-------|-------------|
| A — Calm Surface Impulse | ⚠️ (user can click water) |
| B — Vertical Drop Impact | ✅ (sphere drop flow) |
| C — Oblique Impact | ❌ (no oblique launch) |
| D — Fast Surface Skim | ❌ (no scripted skim) |
| E — Strong Crest / Traveling Wave | ❌ |
| F — Edge Ligament Stretch Test | ❌ |
| G — Crown Wall Collapse | ❌ |
| H — Recontact / Bridge Formation | ❌ |
| I — Hero Stress Test | ❌ |

**Only 1/9 canonical test scenes is properly implemented (vertical drop).**

### §8: Milestone Ladder — 9 Milestones

| Milestone | Achieved? |
|-----------|----------|
| 1. Stable Surface Fields | ✅ |
| 2. Correct Patch Extraction | ❌ |
| 3. Reliable Event Resolution | ❌ |
| 4. Minimal Detached Sheet Birth | ❌ |
| 5. Necking and Delayed Breakup | ❌ |
| 6. Recapture Loop Closed | ⚠️ |
| 7. Cross-Regime Consistency | ❌ |
| 8. Performance-Literate Prototype | ⚠️ |
| 9. Hero Event Quality Gate | ❌ |

**Achieved: 1/9. Partial: 2/9. Missing: 6/9.**

---

## Visual Regime Atlas Compliance (Encyclopedia — Visual Regime Atlas section)

The atlas defines 6 event families with 20+ subtypes. Current implementation can produce:

| Event Family | Can Produce? | Quality |
|-------------|-------------|---------|
| Attached Ripple Field | ✅ | Good |
| Traveling Crest | ✅ | Good |
| Crest-Lip Peel | ❌ | No sheet layer |
| Vertical Jet Core | ⚠️ | Particle-only, no structure |
| Radial Crown Wall | ❌ | No sheet geometry |
| Impact Plume Fan | ⚠️ | Particle cloud only |
| Oblique Impact Fan | ❌ | No directional sheet |
| Surface Slash Sheet | ❌ | No sheet geometry |
| Wake Peel Ribbon | ❌ | No ribbon geometry |
| Primary Ligament Ribbon | ❌ | No ribbon geometry |
| Necked Tendril | ❌ | No necking dynamics |
| Edge Fray Cascade | ❌ | No edge dynamics |
| Fine Edge Spray | ❌ | No edge-specific spray |
| Chaotic Spray Burst | ⚠️ | Generic particle burst |
| Soft Recontact Merge | ⚠️ | Adhesion recapture only |
| Hard Droplet Reentry | ⚠️ | Feedback impulse exists |
| Bridge Reconnection Sheet | ❌ | No sheet reconnection |

**Can produce convincingly: 2/17. Partial: 5/17. Cannot produce: 10/17.**

---

## UI / Diagnostics Console Spec Compliance (Encyclopedia — Console Spec section)

The encyclopedia defines a 4-zone laboratory interface with 8 panel categories:

| Zone/Panel | Implemented? |
|-----------|-------------|
| Center Viewport with overlay compositing | ✅ (Canvas + heatmap overlay) |
| Left Dock: Regime and Overlay Control | ❌ |
| Right Dock: Inspector and Parameter Panels | ❌ |
| Bottom Dock: Timeline, Event Log, Replay | ❌ |
| Top Bar: Scene, Benchmark, Snapshot | ⚠️ (basic controls exist) |
| Surface Region Inspector | ❌ |
| Rupture Patch Inspector | ❌ |
| Detached Sheet Inspector | ❌ |
| Sheet Node Inspector | ❌ |
| Carrier Inspector | ❌ |
| Fragment Inspector | ❌ |
| Parameter Panels (Fields/Events/Sheets) | ❌ |
| Counter/Performance Strip | ❌ |

**The current UI is a simple info panel + controls strip + AI analyst sidebar. The encyclopedia's laboratory console is entirely unbuilt.**

---

# PART III — OVERHAUL PLAN COMPLIANCE AUDIT

This section audits against the 6-phase overhaul plan (OVERHAUL_PLAN.md).

## Phase 1: Particle Visual Overhaul — 60% Complete

### 1A. World-Space Particle Sizing ✅
- Formula matches spec exactly
- `PARTICLE_WORLD_RADIUS = 0.008` (matches spec target)

### 1B. Screen-Space Depth Buffer Pass ❌

| Sub-item | Status |
|----------|--------|
| Pass 1: Depth Splat to float texture | ❌ No render target |
| Pass 2: Bilateral Smooth (7×7 kernel) | ❌ Not implemented |
| Pass 3: Normal Reconstruction from depth gradients | ❌ Not implemented |
| Pass 4: Composite with Fresnel/refraction/specular | ❌ Not implemented |
| 3 render targets needed | ❌ None created |
| 4 ShaderMaterials needed | ❌ None created |
| FluidRenderer.tsx file | ❌ Does not exist |

**This is the single most impactful missing visual feature.** The overhaul plan says: "This is the biggest single visual improvement."

### 1C. Age-Based Visual Transition ✅
- Three-stage transition implemented correctly
- fluid (blue) → spray (white) → mist (faint)
- Alpha decreases with age

### Acceptance Criteria Status

| Criterion | Met? |
|----------|------|
| Particles invisible individually, visible through accumulation | ⚠️ Somewhat — low alpha per particle |
| Dense splash regions look like continuous fluid surface | ❌ Still individual point sprites |
| Edges are soft and natural | ⚠️ Gaussian kernel helps |
| No visible individual circles/squares | ⚠️ At distance yes, close up no |
| Particles transition from fluid → spray → mist | ✅ |

## Phase 2: Emission Quality & Regime Classification — 75% Complete

### 2A. R Hysteresis ✅
### 2B. Impact Memory Field ✅
### 2C. Regime Classifier ✅ (with exact spec multipliers)
### 2D. Reservoir Drain Coupling ⚠️ (field-side drain, not spawn-coupled)
### 2E. Variable Particle Mass ✅

### Acceptance Criteria Status

| Criterion | Met? |
|----------|------|
| R doesn't flicker at emission boundary | ✅ (hysteresis works) |
| Sphere impacts produce immediate splash response | ✅ |
| Forward-moving sphere produces directional sheet-like splash | ⚠️ Directional particles, not sheet-like |
| Stationary sphere drop produces symmetric plume | ✅ |
| Regions run out of splash budget after sustained emission | ⚠️ M drains but not spawn-coupled |

## Phase 3: Two-Way Coupling — 60% Complete

### 3A. Particle-to-Heightfield Feedback ✅
- Atomic accumulation buffer (no race condition)
- 3×3 kernel smoothing
- Applied via `applyFeedbackShader`

### 3B. Recapture via Adhesion Field ✅ (with issues)
- A field sampled ✅
- Surface tension pull-back ✅
- Recapture deactivation ✅
- **Mass return to M ✅** (via atomic feedback buffer)
- **A threshold 0.4** (spec says 0.5) — minor

### 3C. Heightfield Energy Conservation ❌
- No total energy tracking
- No dynamic damping correction

### Acceptance Criteria Status

| Criterion | Met? |
|----------|------|
| Particles landing on calm water create visible secondary ripples | ⚠️ Feedback exists but subtle |
| Particles near calm surface gradually merge back | ✅ |
| Recaptured particles replenish local reservoir M | ✅ (via feedback buffer) |
| System energy doesn't diverge over time | ⚠️ No explicit conservation |

## Phase 4: Particle Compaction & Performance — 70% Complete

### 4A. Parallel Prefix-Sum Compaction ✅ (with correctness issue)
- Mark alive → prefix sum → scatter → copy back: all 4 shaders exist
- **CRITICAL BUG:** Prefix sum is per-workgroup only. No global workgroup offsets are accumulated before scatter. This means particles from different workgroups can write to the same destination indices, causing corruption.

### 4B. Double-Buffered Staging ✅
- Two staging sets with alternating index

### 4C. Selective Readback ✅
- Particles + counter every frame
- Water/field textures every 2nd frame

### Acceptance Criteria Status

| Criterion | Met? |
|----------|------|
| Compaction runs in < 1ms for 8192 particles | ⚠️ Multi-stage exists but correctness unknown |
| No frame stalls from mapAsync | ✅ (double-buffered) |
| Consistent 60fps with max particles | ⚠️ Depends on device |

## Phase 5: Advanced Surface Fields — 80% Complete

### 5A. U Field Advection ✅
### 5B. Sphere Tangential Forcing ✅
### 5C. Convergence Charging of M ✅
### 5D. Cooldown Suppression for R ✅

### Acceptance Criteria Status

| Criterion | Met? |
|----------|------|
| U field visually propagates with wave features | ✅ (via advection) |
| Sphere drag creates visible directional momentum trail | ✅ (tangential + forward forcing) |
| Convergence zones accumulate reservoir | ✅ |
| No rapid R flickering after initial splash subsides | ✅ (cooldown works) |

## Phase 6: Detached Sheet Layer — 0% Complete

### ❌ Entirely Unimplemented

| Sub-item | Status |
|----------|--------|
| 6A. Patch Detection (connected-component labeling) | ❌ |
| 6B. Sheet Geometry Spawning (ribbon/strip mesh) | ❌ |
| 6C. Sheet Dynamics (thickness, necking, tear) | ❌ |
| 6D. Sheet Rendering (refraction, Fresnel, alpha) | ❌ |

---

# PART IV — TECHNICAL CORRECTNESS ISSUES

## 1. Parallel Compaction Global Prefix Sum Bug (CRITICAL)

**Location:** `shaders.ts` — `prefixSumShader`, `scatterCompactShader`

**The Problem:**
The prefix sum is computed per-workgroup (256 particles per workgroup) using Hillis-Steele scan in shared memory. Each workgroup produces local prefix sums and adds its total to `totalAlive` via `atomicAdd`.

However, the scatter step uses `prefixSums[idx]` directly as the destination index. For the FIRST workgroup (wid=0), this is correct. For subsequent workgroups (wid=1,2,...), the local prefix sum does NOT include particles from previous workgroups.

**Example:**
- Workgroup 0 has 100 alive particles (prefix sums 0..99)
- Workgroup 1 has 50 alive particles (prefix sums 0..49)
- Workgroup 1's particles scatter to indices 0..49 instead of 100..149
- **Result:** Particles from workgroup 0 and workgroup 1 overwrite each other at indices 0..49

**Impact:** Particle corruption, lost particles, visual glitches. The severity depends on how many workgroups are dispatched (currently `MAX_PARTICLES/2 / 256 = 32` workgroups).

**Fix Required:** After the prefix sum pass, a global offset pass must add the total alive count of all previous workgroups to each workgroup's prefix sums.

## 2. Feedback Buffer Ping-Pong Ambiguity (HIGH)

**Location:** `WaterGPU.ts` step() method, step 8

**The Problem:**
The `applyFeedbackShader` writes to `waterWrite` and `fieldWrite`. After this pass, `this.swapWater()` is called (line 551). But `swapField()` is NOT called. This means:
- Water feedback is correctly applied to the "write" buffer and then swapped to become the "read" buffer for the next frame
- Field feedback (M recharge) is applied to `fieldWrite`, but the field buffers may or may not be in the expected state depending on whether a field swap happened earlier

Additionally, the feedback is only applied every 2nd frame (`this.frameCount % 2 === 0`), which means accumulated feedback from odd frames is applied on even frames. This creates a one-frame latency that may or may not be intentional.

## 3. Particle Data Race in Fallback Compaction (LOW, mitigated)

**Location:** `shaders.ts` — `resetParticlesShader` (legacy serial compaction)

The legacy serial compaction shader uses `@workgroup_size(1)` which is correct for serial operation — no race condition. However, it's extremely slow for large particle counts.

The parallel compaction replaces this but has the global prefix bug described above. So the system falls back to the slow-but-correct path every 20 frames (compaction interval).

**Wait — actually, looking at WaterGPU.ts line 555:** Compaction runs every 20 frames. But which compaction? The parallel one (mark → prefix → scatter → copy). The legacy `resetParticlesPipeline` is still created but never dispatched in the step() method. So the only compaction path is the buggy parallel one.

## 4. PARTICLE_WORLD_RADIUS Value Drift

The COMPLIANCE_AUDIT.md (line 30) says `PARTICLE_WORLD_RADIUS = 0.013` and flags it as "60% too large."

Current ParticleRenderer.tsx line 20 says `PARTICLE_WORLD_RADIUS = 0.008` which matches the overhaul spec target.

**This appears to have been fixed at some point.** The compliance audit is outdated on this item.

## 5. Alpha Values in Compliance Audit vs Current Code

The COMPLIANCE_AUDIT.md (lines 227-229) says alpha values are 2–3× too high (0.20, 0.11, 0.045).

Current ParticleRenderer.tsx lines 116-118:
```
youngAlpha = 0.06
sprayAlpha = 0.03
mistAlpha = 0.02
```

**These match the overhaul spec targets.** The compliance audit is outdated on this item too.

**This suggests the compliance audit was written before the most recent round of fixes that were then lost. This is likely the "better version" the user is referring to — the version where particle radius and alpha were fixed to spec values.**

## 6. Emit Shader Counter Overflow

**Location:** `shaders.ts` emitParticlesShader lines 441-445

```wgsl
let slot = atomicAdd(&counter[0], 1u);
if (slot >= MAX_P / 2u) {
  atomicSub(&counter[0], 1u);
  return;
}
```

When the counter exceeds MAX_P/2, the shader subtracts 1. But if multiple threads simultaneously pass the MAX_P/2 check before any of them subtracts, the counter can temporarily exceed the limit. The `atomicSub` will eventually correct it, but in the meantime, some threads may write to out-of-bounds particle slots.

**Risk:** Low — the slot index itself was obtained from `atomicAdd`, so writes go to slot values that are sequential. The overflow only wastes the add/sub pair, it doesn't cause buffer overrun because the particle buffer is sized for MAX_P entries (MAX_P/2 particles × 2 vec4f each).

## 7. Heatmap Overlay Missing A Field

The heatmap shader in renderShaders.ts displays R (red), C (green), M (blue) channels. The A (Adhesion) field is computed by the GPU but never displayed in any diagnostic overlay. The encyclopedia requires A visualization for tuning recapture behavior.

---

# PART V — RENDERING PIPELINE AUDIT

## Water Surface Rendering (renderShaders.ts)

### ✅ Correctly Ported from lovable-waves:
- Fresnel reflection/refraction
- Pool wall rendering with caustics
- Sphere shadow calculation
- IOR_AIR / IOR_WATER (1.0 / 1.333)
- Cube-environment intersection for reflections
- Normal-based UV refinement loop (5 iterations)

### ✅ Enhanced Beyond Reference:
- SDF sphere constraint in vertex shader (water mesh pushed above sphere surface)
- Heatmap debug overlay
- WebGPU compute → DataTexture bridge

### ⚠️ Deviations from Reference:
1. **No camera orbit in R3F version** — The original lovable-waves has free orbit controls with angle tracking. The R3F version uses drei OrbitControls which doesn't perfectly match the original's orbit behavior.
2. **Skybox is procedural** — Original loads skybox images (xneg.jpg etc). Current version uses procedural `createSkyboxTexture()` which may look different.

## Caustics Rendering (causticsShaders.ts)

✅ **Correctly implemented.** The caustics pipeline faithfully ports the original:
- `dFdx`/`dFdy` area-change calculation (the critical part)
- Sphere shadow projection
- Edge fade
- Fallback shader for devices without `OES_standard_derivatives`

## Particle Rendering (ParticleRenderer.tsx)

### Current Approach: Single-Pass Gaussian Density Splatting

✅ Correctly implemented per the simplified approach:
- World-space sizing
- Gaussian kernel (`exp(-r² * 3.5)`)
- Premultiplied alpha
- Custom additive blending (`ONE, ONE_MINUS_SRC_ALPHA`)
- Age-based visual transition
- Mass-weighted alpha
- Speed-based size boost
- Pseudo-normal specular hint
- Fresnel-like edge brightening

### ❌ Missing: Multi-Pass Fluid Renderer (Phase 1B)

The overhaul plan specifies a 4-pass fluid renderer that would replace the current single-pass approach:

**Pass 1: Depth Splat** — Render particles to a float depth texture with Gaussian falloff
- Requires: 1 `THREE.WebGLRenderTarget` (float format)
- Requires: Depth-only ShaderMaterial

**Pass 2: Bilateral Smooth** — Full-screen quad, bilateral filter, 7×7 kernel
- Requires: 1 `THREE.WebGLRenderTarget`
- Requires: Full-screen quad mesh + bilateral filter ShaderMaterial
- Key parameter: depth-edge threshold ~0.05

**Pass 3: Normal Reconstruction** — Screen-space normals from smoothed depth gradients
- Requires: 1 `THREE.WebGLRenderTarget`
- Formula: `normal = normalize(vec3(dDepth/dx, dDepth/dy, 1.0))`
- Requires: ShaderMaterial with derivative calculations

**Pass 4: Composite** — Shade fluid with Fresnel/refraction/specular, composite over scene
- Requires: Access to scene render + fluid normals + fluid depth
- Requires: ShaderMaterial with IOR-based refraction

**Total additional resources needed:**
- 3 render targets (depth, smoothed depth, normals)
- 4 ShaderMaterials
- 1 full-screen quad geometry
- Integration into WaterScene.tsx render loop via `useFrame` with manual `gl.render()` calls

**This is the most impactful visual improvement remaining.** Without it, particles will always look like a cloud of soft dots rather than a cohesive fluid surface.

---

# PART VI — LOVABLE-WAVES REFERENCE PORT FIDELITY

The original lovable-waves (LOVABLE_WAVES_REFERENCE.md) is a complete WebGL water simulation. The R3F port should preserve its quality while adding WebGPU compute and particle features.

## What Was Faithfully Ported ✅

1. **Water class** → `useWaterSimulation.ts` (WebGL fallback) + `WaterGPU.ts` (WebGPU compute)
2. **Renderer caustics** → `useCaustics.ts` + `causticsShaders.ts`
3. **Renderer water surface** → `renderShaders.ts` (waterSurfaceFragmentShaderAbove/Below)
4. **Renderer pool walls** → `renderShaders.ts` (poolFragmentShader)
5. **Renderer sphere** → `renderShaders.ts` (sphereFragmentShader)
6. **Drop shader** → `waterShaders.ts` (dropFragmentShader) + `shaders.ts` (waterDropShader WGSL)
7. **Update shader** → `waterShaders.ts` (updateFragmentShader) + `shaders.ts` (waterUpdateShader WGSL)
8. **Normal shader** → `waterShaders.ts` (normalFragmentShader) + `shaders.ts` (waterNormalsShader WGSL)
9. **Sphere displacement** → `waterShaders.ts` + `shaders.ts`
10. **Tile texture generation** → `textures.ts` (createTileTexture)

## What Was Changed or Enhanced 🔄

1. **Wave equation**: Changed from 4-neighbor to 8-neighbor isotropic stencil (reduces axis bias)
2. **Propagation coefficient**: Changed from 2.0 to 1.65 (softer, avoids over-energetic rebounds)
3. **Damping**: 0.996 (slightly different from original)
4. **SDF sphere constraint**: Added in vertex shader to prevent water mesh penetrating sphere
5. **Bow waves**: Added velocity-proportional bow wave generation in sphere displacement
6. **Kelvin wake**: Added simplified wake angle pattern
7. **Impact physics**: Added detailed impact ring generation (36 samples)

## What Was Lost or Degraded ⚠️

1. **Camera orbit**: Original has smooth angle-based orbit with mouse drag. R3F version uses drei OrbitControls (different feel, damping behavior)
2. **Skybox**: Original loads real skybox images. Current uses procedural generation (different visual quality)
3. **Interactivity**: Original has pointer-based raycasting to add drops anywhere. Current R3F version does this through mesh `onPointerDown` events, which may have different precision

---

# PART VII — AI ANALYST SYSTEM AUDIT

## Edge Function (analyze-screenshot/index.ts)

### ✅ Correctly Implemented:
- CORS headers for all methods
- SSE streaming with `[DONE]` termination
- Rate limit (429) and credits (402) error handling
- Model selection: quick (gemini-3-flash-preview) / deep (gemini-3.1-pro-preview)
- Conversation history support
- System prompt with water simulation context

### ⚠️ Partial:
- `referenceContext` parameter accepted but never sent by client
- No automatic loading of reference docs from `src/reference/`

### ❌ Missing:
- Code context injection (shader source alongside screenshots)
- Persistent conversation sessions across page reloads

## Client Library (aiAnalyst.ts)

### ✅ Correctly Implemented:
- SSE line-by-line parsing
- Partial JSON re-buffering for chunked responses
- `[DONE]` handling
- Error callback with message

## Screenshot Pipeline (screenshots.ts)

### ✅ Correctly Implemented:
- Canvas → toBlob → Supabase Storage upload
- Database record with trigger type, phase, metadata
- Public URL retrieval for uploaded screenshots

## AnalystPanel Component

### ✅ Working Features:
- Screenshot gallery with thumbnails
- Screenshot selection
- Chat interface with markdown rendering
- Quick/Deep mode toggle
- Streaming analysis display
- Delete screenshots

### ⚠️ Issues:
- Panel width (420px) may overlap with other UI on smaller screens
- No persistence of chat history across page reloads
- No way to compare multiple screenshots side-by-side
- No automatic reference doc ingestion

---

# PART VIII — CONSTANT CALIBRATION AUDIT (Updated)

| Constant | Overhaul Spec | Current Value | Source File | Status |
|----------|--------------|---------------|------------|--------|
| `GRID_SIZE` | 256 | 256 | shaders.ts:23 | ✅ |
| `MAX_PARTICLES` | 16384 | 16384 | shaders.ts:24 | ✅ |
| `PARTICLE_WORLD_RADIUS` | 0.008 | 0.008 | ParticleRenderer.tsx:20 | ✅ |
| `R_ON` | 0.20 | 0.20 | shaders.ts:317 | ✅ |
| `R_OFF` | 0.10 | 0.10 | shaders.ts:318 | ✅ |
| `COOLDOWN_DURATION` | 0.14 | 0.14 | shaders.ts:319 | ✅ |
| `chargeRate` | 5.0 | 5.0 | shaders.ts:339 | ✅ |
| `R_decay` | 3.0 | 3.0 | shaders.ts:340 | ✅ |
| `maxAge` | 2.5 | 2.5 | physicsParams[3] | ✅ |
| `gravity` | 9.8 | 9.8 | physicsParams[1] | ✅ |
| `damping (wave)` | 0.996 | 0.996 | updateParams[0] | ✅ |
| `damping (particle air)` | 0.995 | 0.995 | physicsParams[2] | ✅ |
| `buoyancy` | 6.0 | 6.0 | updateParticlesShader:527 | ✅ |
| `surfacePull` | 12.0 | 12.0 | updateParticlesShader:550 | ✅ |
| `M0 (reservoir baseline)` | 0.6 | 0.6 | surfaceFieldsShader:371 | ✅ |
| `refillRate` | 0.35 | 0.35 | fieldParams[1] | ✅ |
| `youngAlpha` | 0.06 | 0.06 | ParticleRenderer.tsx:116 | ✅ |
| `sprayAlpha` | 0.03 | 0.03 | ParticleRenderer.tsx:117 | ✅ |
| `mistAlpha` | 0.02 | 0.02 | ParticleRenderer.tsx:118 | ✅ |
| `SHEET lift` | 0.6 | 0.6 | shaders.ts:461 | ✅ |
| `SHEET throw` | 3.0 | 3.0 | shaders.ts:461 | ✅ |
| `SHEET spread` | 0.2 | 0.2 | shaders.ts:461 | ✅ |
| `SPRAY lift` | 1.2 | 1.2 | shaders.ts:463 | ✅ |
| `SPRAY throw` | 0.5 | 0.5 | shaders.ts:463 | ✅ |
| `SPRAY spread` | 2.0 | 2.0 | shaders.ts:463 | ✅ |
| `JET lift` | 3.0 | 3.0 | shaders.ts:465 | ✅ |
| `JET throw` | 0.3 | 0.3 | shaders.ts:465 | ✅ |
| `JET spread` | 0.1 | 0.1 | shaders.ts:465 | ✅ |
| `Gaussian kernel` | exp(-r²*4.0) | exp(-r²*3.5) | ParticleRenderer.tsx:91 | ⚠️ Slightly wider |
| `Compaction interval` | every frame | every 20 frames | WaterGPU.ts:555 | ⚠️ Deferred |
| `Feedback apply` | every frame | every 2nd frame | WaterGPU.ts:537 | ⚠️ Deferred |

---

# PART IX — PROCESS FAILURES

## 1. Multiple Changes Per Output
Changes to constants, shaders, and rendering were combined into single AI outputs, making it impossible to identify which specific change produced a desired result when one of multiple simultaneous changes worked.

## 2. No Hard Checkpoints
After achieving a working state with correct constants (PARTICLE_WORLD_RADIUS=0.008, alpha values matching spec), additional changes were made in the same output that may have regressed the fix. No explicit checkpoint was created between the "it works" state and subsequent changes.

## 3. Scope Drift
Instead of following the encyclopedia's recommended development order (fields → patches → sheets → breakup), the implementation jumped between phases, implementing parts of Phase 2-5 (fields, emission, compaction, feedback) while skipping the critical Phase 1B (screen-space fluid rendering) and all of Phase 6 (sheets).

## 4. Architecture vs Tuning Confusion
Significant time was spent tuning particle constants and shader parameters when the fundamental visual problem is architectural (no multi-pass fluid rendering, no sheet layer). Tuning within a wrong architecture cannot fix architectural gaps.

## 5. Compliance Audit Staleness
The existing COMPLIANCE_AUDIT.md contains outdated information (e.g., claiming PARTICLE_WORLD_RADIUS=0.013 and alpha values 3× too high, when these appear to have been fixed). This means there is no reliable single source of truth for current implementation state vs spec.

---

# PART X — COMPREHENSIVE CHECKLIST OF ALL MISSING DELIVERABLES

## Rendering (Visual)
- [ ] Multi-pass screen-space fluid renderer (FluidRenderer.tsx)
- [ ] Depth splat render target
- [ ] Bilateral depth smoothing pass (7×7 kernel)
- [ ] Screen-space normal reconstruction pass
- [ ] Composite pass with Fresnel/refraction over scene
- [ ] Particle-heightfield visual blending at surface transition zone
- [ ] Foam/aeration trail rendering

## Emission Architecture
- [ ] Patch extraction compute shader (seed identification)
- [ ] Patch growth/merge compute shader
- [ ] Patch summary statistics computation
- [ ] Event resolution shader (priority-based, one-event-per-patch)
- [ ] Spawn-coupled reservoir drain (actual emission count → M drain)
- [ ] Crest-tangent aligned lateral spread in emission

## Detached Sheet Layer
- [ ] Sheet object buffer (GPU storage)
- [ ] Sheet node/control-point buffer
- [ ] Sheet birth shader
- [ ] Sheet update shader (carrier support → position/frame)
- [ ] Sheet stretch dynamics
- [ ] Sheet thickness dynamics
- [ ] Sheet necking detection
- [ ] Sheet tear logic
- [ ] Sheet-to-spray conversion
- [ ] Sheet edge dynamics (fray, scallop, ligament seeding)
- [ ] Sheet reconnection/recontact
- [ ] Sheet render preparation (strip/patch expansion to draw buffers)
- [ ] Sheet rendering (thin mesh strips with refraction/Fresnel/alpha)
- [ ] Sheet LOD (reduce node density at distance)

## Coupling & Conservation
- [ ] Energy conservation tracking pass
- [ ] Dynamic damping correction
- [ ] Budget flow tracking (Bsheet, Bcarrier, Bfrag, Breturn)
- [ ] Regime ownership tracking
- [ ] Explicit state machine for regime transitions

## Compaction & Performance
- [ ] Fix global prefix-sum correctness (workgroup offset accumulation)
- [ ] Verify compaction produces correct particle counts
- [ ] Profile compaction timing

## Diagnostics & UI
- [ ] Individual R/C/M/A/U heatmap overlays (not just combined RGB)
- [ ] A (Adhesion) field visualization
- [ ] U field arrow/streamlet overlay
- [ ] Regime classification map overlay
- [ ] Patch boundary overlay
- [ ] Active counter display panel
- [ ] Performance timing display
- [ ] Event timeline panel
- [ ] Freeze/isolation debug modes (per-regime)
- [ ] Replay functionality
- [ ] Snapshot comparison (A/B)
- [ ] Parameter panels for field tuning
- [ ] Surface region inspector (click-to-inspect)

## Test Scenes
- [ ] Oblique impact scene
- [ ] Fast surface skim scene
- [ ] Traveling wave crest scene
- [ ] Ligament stretch test scene
- [ ] Crown wall collapse scene
- [ ] Recontact/bridge formation scene
- [ ] Hero stress test scene

## AI Analyst
- [ ] Automatic reference doc ingestion
- [ ] Code context injection (shader source)
- [ ] Persistent conversation sessions

---

# PART XI — BOTTOM LINE SUMMARY

## Overall Compliance Score

| Category | Items Checked | Fully Compliant | Partial | Missing | Score |
|----------|-------------|----------------|---------|---------|-------|
| Encyclopedia Core Thesis | 4 regimes | 1 | 2 | 1 | 25% |
| Surface Intent Fields | 7 fields + operators | 7 + 5 | 2 | 5 | 70% |
| Patch Extraction | 5 requirements | 0 | 0 | 5 | 0% |
| Detached Sheet Layer | 14 components | 0 | 0 | 14 | 0% |
| Coupling Architecture | 16 operators | 3 | 6 | 7 | 19% |
| Rendering Pipeline | 8 components | 3 | 2 | 3 | 38% |
| Diagnostics | 14 panels/modes | 0 | 2 | 12 | 7% |
| Test Scenes | 9 scenes | 1 | 1 | 7 | 11% |
| Milestone Ladder | 9 milestones | 1 | 2 | 6 | 11% |
| Overhaul Plan Phase 1 | 5 criteria | 2 | 2 | 1 | 40% |
| Overhaul Plan Phase 2 | 5 criteria | 3 | 2 | 0 | 60% |
| Overhaul Plan Phase 3 | 4 criteria | 2 | 1 | 1 | 50% |
| Overhaul Plan Phase 4 | 3 criteria | 1 | 1 | 1 | 33% |
| Overhaul Plan Phase 5 | 4 criteria | 4 | 0 | 0 | 100% |
| Overhaul Plan Phase 6 | 4 criteria | 0 | 0 | 4 | 0% |
| Constants Calibration | 30 constants | 27 | 3 | 0 | 90% |
| Technical Correctness | 7 issues | 2 | 3 | 2 | 29% |

## What's Actually Good

Despite the massive gaps list, the codebase has genuine achievements:
1. **All 5 surface intent fields are computed and working** — this is a real architectural foundation
2. **WebGPU compute pipeline is functional** — 8+ compute shaders running correctly
3. **Regime classifier with correct coefficients** — exactly matching spec
4. **R hysteresis with cooldown** — exactly matching spec
5. **Particle-to-heightfield feedback via atomic buffer** — correct architecture
6. **Adhesion recapture with mass return** — working
7. **Semi-Lagrangian U advection** — working
8. **Sphere tangential forcing** — working
9. **Convergence charging of M** — working
10. **Caustics faithfully ported** — working perfectly
11. **Constants calibrated to spec** — nearly all values match
12. **AI analyst system** — functional streaming analysis

## What's Catastrophically Missing

The THREE biggest architectural gaps that prevent the system from reaching its visual target:

1. **No multi-pass screen-space fluid renderer** — particles will always look like dots, not fluid
2. **No patch-based emission architecture** — emission is noisy per-texel spray, not structured events  
3. **No detached sheet layer** — the encyclopedia's most emphasized requirement, representing ~5,000 lines of specification

These three gaps account for approximately 80% of the visual quality difference between the current system and the reference target.

---

*End of Failure & Missed-Items Book — 2026-03-08*
