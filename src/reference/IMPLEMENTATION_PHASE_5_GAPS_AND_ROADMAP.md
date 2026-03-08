# Phase 5 — Current Gaps, Known Issues & Improvement Roadmap

## Gap Analysis: Encyclopedia vs Current Implementation

### What the Encyclopedia Defines (Ideal System)

The Hybrid Water Encyclopedia describes a 4-regime system:
1. **Attached surface** (heightfield) ✅ Implemented
2. **Detached coherent sheets** (ribbons, lips, crowns) ❌ Not implemented
3. **Carrier particles** (MLS-MPM volumetric transport) ⚠️ Partially implemented (simplified)
4. **Fragmented regime** (spray, droplets, foam) ⚠️ Partially (age-based fadeout only)

### Status Per Encyclopedia Volume

| Encyclopedia Section | Status | Notes |
|---------------------|--------|-------|
| Heightfield wave simulation | ✅ Done | Standard 2D wave equation, working well |
| Surface Intent Fields (R,U,C,M,A) | ⚠️ Basic | Computed but several features missing |
| Patch-based emission | ❌ Missing | Emission is per-texel, not per-patch |
| Regime classification | ❌ Missing | No sheet vs spray vs jet distinction |
| Velocity decomposition (lift/throw/spread) | ⚠️ Basic | Formula exists but not regime-dependent |
| Reservoir drain coupling | ⚠️ Partial | Drain in field shader but not coupled to actual emission count |
| Hysteresis (R_on/R_off) | ❌ Missing | R flickers near threshold |
| Impact memory | ❌ Missing | Sphere collision doesn't charge fields |
| Detached sheet structures | ❌ Missing | No ribbons, lips, or crown geometry |
| Thickness/necking/tear dynamics | ❌ Missing | Would need sheet layer first |
| Carrier-heightfield feedback | ❌ Missing | Particles don't push back on water |
| Recapture/reabsorption | ❌ Missing | Dead particles just disappear |
| Particle-to-particle forces | ❌ Missing | No pressure, viscosity, cohesion |
| Screen-space fluid rendering | ❌ Missing | Using simple point splatting |
| Foam/aeration fields | ❌ Missing | No foam tracking |

---

## Priority Bug Fixes

### 1. Particle Size (HIGH)
**Problem**: Particles appear too large relative to the pool.
**Root cause**: `uPointSize` and attenuation factor not calibrated for camera distance and pool world-space size.
**Fix**: Reduce `uPointSize` further (try 1.5-2.0), adjust attenuation divisor, or use world-space sizing.

### 2. Wave Instability from Sphere (MEDIUM)
**Problem**: Fast sphere movement can still cause energy buildup.
**Root cause**: Clamping helps but the bow wave formula can still accumulate energy over many frames.
**Fix**: Add per-frame energy budget, or add stronger velocity-proportional damping near sphere.

### 3. Particle Emission Direction (MEDIUM)
**Problem**: Particles don't visually match natural splash patterns.
**Root cause**: Missing regime-dependent coefficients and no patch-based grouping.
**Fix**: Vary lift/throw/spread ratios based on C value; group nearby emitters.

---

## Improvement Roadmap (Ordered by Impact)

### Phase A: Tune What Exists (Quick Wins)
1. Calibrate particle size to pool (world-space sizing)
2. Add R hysteresis (R_on=0.2, R_off=0.1)
3. Connect reservoir M drain to actual emission (use atomicAdd in emit shader to track drain)
4. Use A field for particle recapture (pull-back force when A > 0.5)
5. Add impact memory to R charging from sphere proximity

### Phase B: Better Emission & Regime Classification
1. Add regime classifier based on (R, C, M, |U|):
   - High C → "sheet_emit" → strong throw, moderate lift, tight spread
   - Low C → "spray_emit" → moderate lift, wide spread, high noise
   - Very high R + localized → "jet_emit" → strong lift, low spread
2. Implement patch-based emission (GPU prefix sum to find connected R>threshold regions)
3. Regime-dependent velocity coefficients
4. Vary particle mass based on local conditions

### Phase C: Visual Quality
1. Screen-space depth pass for particles (render to separate target)
2. Bilateral depth smoothing
3. Normal reconstruction from smoothed depth
4. Composite particle fluid over heightfield with proper Fresnel
5. Age-based visual transition: fluid blob → white spray → fading mist

### Phase D: Two-Way Coupling
1. Particle-to-heightfield feedback: landing particles add impulse to water
2. Recapture: particles near calm surface (A > threshold, low relative velocity) → merge back, add mass to M
3. Particle-to-particle: simple SPH-like pressure in local neighborhoods
4. Energy conservation: track total system energy, apply correction

### Phase E: Detached Sheet Layer (Advanced)
1. Detect coherent emission patches with high C
2. Spawn ribbon/strip geometry driven by patch centroid + momentum
3. Sheet thickness tracking with stretch/thin/neck dynamics
4. Tear logic: overstretched sheets fragment into spray particles
5. Render sheets as thin mesh strips with refraction/Fresnel

---

## Performance Considerations

| Operation | Current Cost | Notes |
|-----------|-------------|-------|
| Water grid passes (5 dispatches) | Low | 256² = 65K threads, very fast |
| Surface fields | Low | Same grid, one pass |
| Particle emission | Low | Sparse (every 3rd texel) |
| Particle update | Low | Up to 4096 particles (MAX/2) |
| Particle compaction | Medium | Single-threaded (workgroup 1!) |
| Async readback | Variable | Can stall if GPU is busy |
| Point rendering | Low-Medium | Up to 4096 points with splatting |

### Bottleneck: Particle Compaction
The `resetParticlesShader` runs with workgroup_size(1) — it's a serial loop. For 4096 particles this is slow. Should be replaced with a parallel prefix-sum compaction.

### Bottleneck: Async Readback
`mapAsync` can add latency. Currently reading 3 buffers (water, field, field2) + particles per frame. Could reduce by only reading when data changes or using double-buffered staging.

---

## Reference Document Map

| Document | Content | Lines |
|----------|---------|-------|
| HYBRID_WATER_ENCYCLOPEDIA.md | Theory: fields, regimes, sheets, breakup | 16635 |
| LOVABLE_WAVES_REFERENCE.md | Original WebGL implementation (lovable-waves) | 3018 |
| splash-mls-mpm.html | Full 2D MLS-MPM fluid simulation | 1760 |
| OpusMagnusWater.html | Extended MLS-MPM with 3D rendering | 2067 |
| ProPool.html | Previous pool simulation attempt | 5895 |

### Key Takeaways Per Reference

**HYBRID_WATER_ENCYCLOPEDIA.md**: The design bible. Defines the field ontology, regime transitions, sheet structures, and visual principles. Everything we build should reference back to this.

**LOVABLE_WAVES_REFERENCE.md**: The original working WebGL pool demo. Has perfect caustics, sphere interaction, and pool rendering. Our R3F port is based on this. Key code: Water class (heightfield sim), Renderer class (caustics, reflections, refractions).

**splash-mls-mpm.html**: Shows what proper MLS-MPM looks like — P2G/G2P transfers, affine momentum, constitutive models. Also shows screen-space fluid rendering (Gaussian splatting → depth smoothing → normal reconstruction). This is the visual target for particles.

**OpusMagnusWater.html**: Extended version with 3D particle rendering on top of 2D MPM. Shows how to bridge 2D sim into 3D visual space. Has more advanced particle emission and visual effects.

**ProPool.html**: Earlier attempt at pool simulation. Has some useful patterns for React/Three.js integration but the physics are simpler.
