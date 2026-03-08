# Phase 2 — Surface Intent Fields: The Brain of the System

## Why Surface Intent Fields Exist

The reference encyclopedia (HYBRID_WATER_ENCYCLOPEDIA.md) makes this clear: a single height + velocity field **cannot** decide where, when, and how water should break apart. The surface needs "intent" — latent fields that describe what the surface *wants to become next*.

Without these fields, you get:
- Particles spraying everywhere like a hose
- No directional structure to splashes
- Infinite emission from hot spots
- No memory or budget for detachment

---

## The Five Fields

### R — Rupture Potential `R(x,z,t)` [range 0-1]

**What it answers**: How strongly does this surface patch want to become 3D?

**How it's built** (current implementation):
```
Rraw = 0.25 * crestness(laplacian) 
     + 0.35 * upward_velocity
     + 0.20 * slope_magnitude  
     + 0.20 * momentum_magnitude
```

**Temporal integration**:
```
dR/dt = chargeRate(4.0) * clamp(Rraw) - decayRate(2.5) * R
```

This means R charges up when there's energy and decays when calm. It has inertia — a brief disturbance charges R slowly, sustained energy charges it high.

**What's missing from the encyclopedia spec**:
- Hysteresis (R_on vs R_off thresholds to prevent flicker)
- Cooldown suppression after recent rupture
- Impact memory feeding into R
- Carrier-feedback reinforcement

---

### U — Surface Momentum `U(x,z,t)` [2D vector]

**What it answers**: Which direction is surface energy traveling?

**How it's built**:
```
momentum_gain = -gradient * velocity * dt * 5.0
U = previous_U * 0.95 + momentum_gain
```

This tracks horizontal transport direction. When the surface rises on one side and falls on the other, momentum points in the direction of wave travel.

**Critical for**: Forward throw direction of emitted particles. Without U, all particles would go straight up (the "hose" failure mode).

**Derived quantities**:
- `|U|` — momentum magnitude, used in R calculation
- `normalize(U)` — throw direction for emission
- `divU` — convergence/divergence, indicates pile-up zones

**What's missing**:
- Advection of U by the flow field itself
- External tangential forcing from sphere motion
- Wake packet direction injection

---

### C — Coherence `C(x,z,t)` [range 0-1]

**What it answers**: Is this feature organized enough for a sheet/ribbon, or should it become spray?

**How it's built**:
```
Craw = 0.7 * gradient_alignment_with_neighbors + 0.3 * momentum_magnitude
C integrates: dC/dt = 2.0 * Craw - 1.5 * C
```

High C means: ridge-like, aligned, smooth directional structure.
Low C means: noisy, isotropic, turbulent.

**Why it matters**: Without C, every energetic event emits the same way. In reality:
- High C + high R → coherent sheet/lip (forward-leaning splash)
- Low C + high R → spray burst (scattered droplets)
- High C + low R → gentle wave crest (stays attached)

**What's missing**:
- Temporal persistence check (does the ridge maintain for multiple frames?)
- Shear/disorder penalty
- Sign-flipping detection in normal variation

---

### M — Reservoir Mass `M(x,z,t)` [range 0-1]

**What it answers**: How much detachable water is available here?

**How it's built**:
```
M0 = 0.6 (equilibrium baseline)
refill = refillRate * (M0 - M)  // relaxes back to 0.6
drain = R * C * 0.8 when R > threshold
dM/dt = refill - drain
```

**Why it's mandatory**: Without M, any hot region becomes an infinite faucet. M ensures:
- A region can run out of "splash budget"
- After a big splash, it takes time to recharge
- Sustained emission gradually weakens
- `releaseRate ~ f(R,C) * g(M)` — emission is multiplicatively limited by M

**What's missing**:
- Convergence charging (water flowing toward a point builds up reservoir)
- Recapture input (returned particles feed back into M)
- Impact charging (sphere hitting water charges local M)

---

### A — Adhesion/Recapture `A(x,z,t)` [range 0-1]

**What it answers**: How welcoming is this surface to returning detached water?

**How it's built**:
```
calm_recovery = 0.5 * (1 - R)  // calm regions become sticky
rupture_suppression = R * 2.0   // active eruption zones repel
dA/dt = calm_recovery - rupture_suppression - A * 0.3
```

High A = calm, thick, low-energy region → particles should merge back here
Low A = active eruption zone → particles should stay detached

**Currently**: A is computed but not yet used by particle physics. It should:
- Pull nearby particles toward the surface when A is high
- Suppress recapture when A is low (near active splash zones)
- Feed returned mass back into M

---

## Field Buffer Layout

Two storage buffers per frame (ping-pong with waterIn/waterOut):

| Buffer | Channel | Field | Range |
|--------|---------|-------|-------|
| fieldOut | .x | R (Rupture) | [0, 1] |
| fieldOut | .y | C (Coherence) | [0, 1] |
| fieldOut | .z | M (Reservoir) | [0, 1] |
| fieldOut | .w | A (Adhesion) | [0, 1] |
| field2 | .x | Ux (Momentum X) | unbounded |
| field2 | .y | Uz (Momentum Z) | unbounded |
| field2 | .z | divU (Divergence) | unbounded |
| field2 | .w | slope | [0, ∞) |

---

## Current Issues & Gaps

1. **No hysteresis** — R flickers when surface oscillates near threshold
2. **No impact memory** — Sphere collision doesn't explicitly charge R or M
3. **Momentum U not advected** — It damps but doesn't transport
4. **A field unused** — Computed but particles don't check it for recapture
5. **No patch extraction** — Emission is per-texel, not per-connected-region
6. **No regime classification** — Every emission is the same "type" regardless of C value
