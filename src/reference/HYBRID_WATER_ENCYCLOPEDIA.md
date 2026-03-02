# Hybrid Water Encyclopedia

## A first-principles encyclopedia of heightfields, particle carriers, detached sheets, rupture logic, and volumetric water synthesis

---

## 0. Purpose

This document is the beginning of a full encyclopedia for a hybrid water system designed to achieve believable, high-performance, high-control water in browser-based real-time simulation.

The central claim is simple:

**No single representation is sufficient for convincing water across all regimes.**

A heightfield is excellent for coherent surface transport but fails when the surface becomes truly volumetric. Pure particles or MLS-MPM can carry mass and momentum, but they struggle to maintain elegant, continuous, thin surface skin. Therefore the correct system is not a single solver, but a **representation stack** with explicit state transitions.

This encyclopedia defines the ontology, first principles, fields, dynamics, transitions, diagnostics, and implementation strategies for such a system.

---

## 1. Core Thesis

### 1.1 The Representation Stack

A believable real-time water system should be treated as four coupled regimes:

1. **Attached surface regime** — represented by a heightfield or similar 2.5D surface model.
2. **Detached coherent sheet regime** — represented by sparse deformable surface patches, ribbons, ligaments, or other local thin-sheet structures.
3. **Carrier mass/momentum regime** — represented by MLS-MPM or another particle-based volumetric carrier model.
4. **Fragmented regime** — spray, droplets, foam, aeration, and mist.

Each regime exists because it is the most efficient and most visually faithful representation for a different class of fluid behavior.

### 1.2 The Fundamental Design Law

**The heightfield owns continuity.**

**The carrier particles own momentum and detached bulk mass.**

**The detached sheet owns visual skin continuity during breach and elongation.**

**The fragmented regime owns terminal breakup.**

### 1.3 What the Hybrid System Must Prevent

The system must avoid four major failure modes:

* treating the surface like a rigid barrier or prison lid
* spawning upward particle hoses from scalar hot spots
* forcing thin coherent water structures to be represented only by discrete particles
* allowing infinite emission without memory, recharge, or recapture

---

## 2. First Principles of Water Realism

### 2.1 Why Water Looks Real

Water looks convincing when the simulation preserves the following visual and dynamic truths:

* broad coherent continuity over the main body
* smooth transport of waves and interference patterns
* localized failure into three-dimensional structures at the right time
* temporary sheet-like continuity during breach, curl, tendril formation, and crown growth
* delayed breakup through necking and thinning rather than immediate beading
* recapture and reintegration of detached fluid back into larger coherent bodies

### 2.2 Why Water Looks Fake

Water looks fake when:

* the entire body behaves like independent particles
* detachment creates discrete marble chains too early
* upward release is isotropic or purely vertical
* splashes appear as generic blobs rather than coherent sheets, lips, crowns, or ligaments
* detached water never re-merges and accumulates as particle clutter
* every hot region emits equally without directional structure, coherence, or reservoir logic

### 2.3 The Representation Mismatch Problem

Particles are excellent for moving mass, but weak for guaranteeing a beautiful visible surface. This is not just a tuning issue; it is a representation issue.

A discrete particle set must work extremely hard to approximate:

* smooth continuous skin
* thin stable films
* coherent ligaments
* temporally controlled rupture
* elegant silhouettes

That burden should not fall entirely on the carrier particles.

---

## 3. The Regime Transition View of Water

### 3.1 Water as a State Machine

Water should be modeled not only by equations of motion, but by **regime transitions**.

At minimum, the system should recognize these states:

1. **Surface-attached**
2. **Surface-bound but thickening / near-failure**
3. **Detached coherent sheet / ligament**
4. **Detached volumetric packet**
5. **Spray / droplet breakup**
6. **Re-entry / recapture / reabsorption**

### 3.2 The Key Transition Criterion

The critical question is not: "Is this water high enough above the surface?"

The critical question is:

**Is this fluid still representable as a coherent attached surface, or has it become geometrically and dynamically unable to remain a single-valued sheet?**

That is the correct handoff criterion between heightfield and volumetric or detached-sheet representations.

---

## 4. The Heightfield Regime

### 4.1 What the Heightfield Is Good At

The heightfield should remain the dominant representation for:

* the main water body
* ripples and wakes
* wave packets
* interference patterns
* broad continuity
* artist control and diagnostics
* efficient transport of large-scale surface energy

### 4.2 What the Heightfield Is Bad At

The heightfield is fundamentally poor at:

* overturning geometry
* undercuts and folds
* multi-valued surface shapes
* curling lips
* plunging sheets
* crown walls
* detached tendrils
* volumetric breakup

### 4.3 Conclusion

The heightfield should remain the first responder and dominant attached-surface representation, but it must not be forced to simulate topologies it cannot represent.

---

## 5. The Carrier Particle / MLS-MPM Regime

### 5.1 Role of Carrier Particles

Carrier particles exist to carry:

* bulk detached mass
* momentum
* inertial response
* internal motion and turbulence cues
* impact response
* pressure-like support beneath detached thin sheets

### 5.2 The Limits of Pure Carrier Rendering

Pure particle rendering tends toward:

* marbly silhouettes
* premature breakup
* large visible droplets in tendrils
* insufficient sheet continuity
* visually granular thin water

### 5.3 Design Rule

Carrier particles should often **drive** visible detached geometry rather than be the sole visible geometry themselves.

---

## 6. The Detached Sheet Regime

### 6.1 Central Claim

When water breaches and remains coherent, it should often enter a **detached sheet** regime before becoming spray.

This detached sheet is not a standard planar heightfield. It is a sparse, local, deformable surface representation.

### 6.2 Why Detached Sheets Matter

Detached sheets provide:

* continuous skin over breached water
* controlled elongation
* thickness memory
* necking before breakup
* delayed fragmentation
* better silhouettes
* more realistic tendrils, lips, and crown walls

### 6.3 Acceptable Detached Sheet Forms

Examples include:

* oriented ribbons
* local parametric patches
* fan-like crest sheets
* ligament tubes / strips
* sparse moving surface charts
* narrow-band local implicit patches

### 6.4 Design Law

**Detached coherent water should stop being “just particles” and become “particle-driven sheet structures that later fragment into particles.”**

---

## 7. The Fragmented Regime

### 7.1 Fragmentation Is a Late State, Not an Immediate State

Spray should not be the default response to breach.

Spray should be the result of:

* thinning
* necking
* loss of coherence
* high strain
* strong turbulence
* delayed rupture

### 7.2 Fragment Categories

The fragmented regime includes:

* droplets
* fine spray
* mist
* aeration
* foam seeds
* sub-grid breakup products

### 7.3 Why This Matters

If the system enters fragmentation too early, all thin water becomes marbles.

---

## 8. Surface Intent Fields

The attached surface should not rely on a single scalar heatmap. It should carry a set of latent fields that describe its tendency to remain a surface, thicken, rupture, emit, and recapture.

### 8.1 Release Severity / Rupture Potential `R(x,z)`

This scalar answers:

* how strongly the local patch wants to become 3D
* how much emission should occur
* what regime transition is likely

This is not literal pressure. It is a composite field representing volumetric release potential.

### 8.2 Surface Momentum / Azimuth `U(x,z)`

This vector answers:

* what horizontal direction the local surface energy is moving
* what forward throw detached water should inherit
* how emitted structures should lean, peel, or fan

### 8.3 Coherence `C(x,z)`

This scalar answers:

* whether the local feature is coherent enough to form a sheet, crest lip, or ligament
* or whether it should devolve toward noisy spray and breakup

### 8.4 Reservoir / Available Detachable Mass `M(x,z)`

This scalar answers:

* how much detachable water is available at the local surface patch
* whether emission is sustainable or exhausted
* how the surface charges, discharges, and recovers over time

### 8.5 Adhesion / Recapture Tendency `A(x,z)`

This scalar answers:

* how strongly nearby detached water should re-bind to the surface
* whether the local region tends to recapture or repel nearby volumetric water

---

## 9. Why a Scalar Heatmap Alone Is Insufficient

A single severity or pressure map cannot by itself define believable emission because it lacks:

* directionality
* coherence
* available mass
* history
* structured regime classification

A hot pixel map without vector and memory fields creates:

* hose behavior
* generic upward jets
* isotropic nonsense
* no sustained peel dynamics

Therefore the system should evolve from a single diagnostic heatmap into a structured **surface intent field bundle**.

---

## 10. Emission Philosophy

### 10.1 Emission Should Not Be Per-Texel Particle Sprinkling

Raw per-texel spawning tends to produce:

* noise
* poor continuity
* unstable patch boundaries
* too much visual randomness

### 10.2 Emission Should Be Patch-Based

The system should detect active rupture patches or crest patches and emit from them as structured objects.

Each rupture patch should have:

* center
* extent
* principal direction
* coherence
* severity
* reservoir mass
* regime classification

### 10.3 Emission Should Be Continuous Over Time

Emission is better modeled as a rate process than as a one-frame burst.

A patch should behave like:

* a valve opening
* a crest peeling
* a crown growing
* a ligament sustaining briefly

rather than a single instant pop.

---

## 11. Velocity Composition of Detached Water

Initial detached water motion should not be purely upward.

### 11.1 Components of Initial Velocity

The launch velocity should be composed from several directions:

* **surface-normal lift**
* **forward throw from local surface momentum / azimuth**
* **lateral spread along a crest tangent or sheet width axis**
* **controlled stochastic breakup noise**

### 11.2 Why This Matters

Without forward throw and lateral spread, emission looks like:

* hoses
* fountains
* generic blobs

With directional decomposition, emission can form:

* crest lips
* leaning sheets
* ribbons
* fans
* crowns
* oblique splash plumes

---

## 12. Detached Sheet Ontology

### 12.1 What a Sheet Patch Is

A detached sheet patch is a local moving surface object with its own geometry, state, and failure logic.

### 12.2 Patch Properties

A sheet patch may store:

* anchor position or centroid
* average velocity
* tangent / normal / binormal frame
* width
* thickness
* stretch
* curvature cues
* coherence
* age
* mass budget
* tear threshold
* recapture threshold

### 12.3 Patch Types

The encyclopedia should later define specific families such as:

* crest-lip patch
* ribbon ligament
* crown wall arc
* impact sheet fan
* reconnecting bridge sheet

---

## 13. Breakup Philosophy

### 13.1 Realistic Breakup Is Usually Necking-First

Thin water should usually not break into particles immediately. Instead it should:

1. stretch
2. thin
3. neck locally
4. pinch off
5. become droplets or spray

### 13.2 Required Fields for Controlled Breakup

Detached structures should be able to track at least:

* local thickness
* strain
* coherence
* age
* curvature / instability cues

### 13.3 Breakup Rule

Fragmentation should occur when thin structures become both too thin and too unstable, rather than merely when they become detached.

---

## 14. Recapture and Reabsorption

### 14.1 Why Recapture Matters

A hybrid system becomes cluttered and fake if detached material never returns to the surface regime.

### 14.2 Reabsorption Principle

Detached water should be reabsorbed into the heightfield and surface reservoir when it is once again well approximated by a coherent attached surface.

### 14.3 Recapture Signals

Possible recapture criteria include:

* low separation from the main surface
* low relative normal velocity
* high local adhesion
* loss of volumetric complexity
* re-entry impact outcomes

---

## 15. Diagnostics and Visualization

The diagnostics system should allow direct visualization of latent regime fields.

### 15.1 Essential Diagnostic Views

1. rupture potential `R`
2. surface momentum / azimuth `U`
3. coherence `C`
4. reservoir mass `M`
5. adhesion / recapture `A`
6. regime classification map
7. detached sheet thickness
8. detached sheet strain / necking zones
9. recapture zones
10. spray conversion zones

### 15.2 Why Diagnostics Matter

Without field visualization, tuning a hybrid water system becomes mysticism.

With diagnostics, the system becomes legible and controllable.

---

## 16. A Taxonomy of Failure Modes

The encyclopedia should maintain a running taxonomy of visual and dynamical failure modes.

### 16.1 Heightfield Failure Modes

* impossible steepness without volumetric handoff
* fake cresting
* lack of overturn
* flat-sheet limitation

### 16.2 Particle Failure Modes

* marbly surfaces
* too-early breakup
* oversized droplets
* weak coherence in thin features

### 16.3 Detached Sheet Failure Modes

* over-stretch without tear
* rubber-sheet look
* insufficient coupling to carrier momentum
* too much control, too little fluidity

### 16.4 Hybrid Coupling Failure Modes

* double counting mass
* infinite emission
* delayed recapture
* visually disconnected layers
* broken causality between surface forcing and detached response

---

## 17. Recommended Development Order

### 17.1 Phase I — Field Ontology and Diagnostics

Define and visualize:

* rupture potential
* surface momentum
* coherence
* reservoir mass
* adhesion

### 17.2 Phase II — Patch-Based Emission

Replace simplistic texel-level particle ejection with rupture-patch detection and structured packet emission.

### 17.3 Phase III — Detached Sheet Prototype

Introduce a sparse detached-sheet layer for coherent breach structures.

### 17.4 Phase IV — Controlled Breakup and Recapture

Add thickness-driven necking, delayed spray conversion, and heightfield reabsorption.

### 17.5 Phase V — Regime Library

Build a catalog of regimes:

* crest peel
* impact plume
* crown wall
* ligament stretch
* reconnecting sheet
* sheet-to-spray transition

---

## 18. The Central Engineering Principle

The engineering goal is not to create a single perfect water solver.

The goal is to create a **cleanly orchestrated family of coupled representations**, each allowed to do the job it is naturally good at.

---

## 19. The Central Visual Principle

Believable water depends on preserving the right form of continuity at the right moment.

* attached continuity on the main body
* detached continuity during coherent breach
* delayed discontinuity during breakup
* recovered continuity during recapture

---

## 20. Provisional Glossary

### Heightfield

A 2.5D representation of surface elevation over a base domain.

### Carrier Particles

Particles used to carry detached mass and momentum, often via MLS-MPM or similar schemes.

### Detached Sheet

A local deformable thin surface representation spawned when the free surface can no longer be treated as a single-valued attached sheet.

### Rupture Potential

A scalar field expressing how strongly a local surface region wants to transition into volumetric or detached-sheet behavior.

### Surface Momentum / Azimuth

A 2D vector field describing local horizontal transport direction on the surface.

### Coherence

A measure of how structured, ridge-like, or sheet-like a local feature is.

### Reservoir Mass

A stored quantity describing how much detachable water is locally available for release.

### Recapture

The process by which detached water is re-absorbed back into the attached surface regime.

---

## 21. Closing Statement for This Foundation Draft

The central insight of this encyclopedia is that believable hybrid water emerges when the system stops asking one representation to solve all of fluid reality.

The main surface must remain efficient and coherent.
The detached structures must preserve skin continuity.
The carrier particles must preserve motion.
The spray regime must arrive late, not immediately.
And all of these regimes must transition through explicit fields, rules, and diagnostics rather than vague ad hoc heuristics.

This document is the foundation. Future volumes should expand each regime, field, operator, transition law, rendering technique, and implementation strategy in detail.

---

## 22. Planned Next Volumes

1. **Field Mathematics Volume** — formulas and operators for rupture potential, momentum, coherence, and reservoir dynamics
2. **Detached Sheet Volume** — data structures, patch models, stretch/thickness/tear laws, and render strategies
3. **Coupling Volume** — exact handoff logic between heightfield, carriers, sheets, and spray
4. **Diagnostics Volume** — debug views, tuning methodology, failure case analysis
5. **Implementation Volume** — browser/WebGPU-oriented pass graph, buffers, textures, update order, and optimization strategies
6. **Visual Regime Atlas** — a taxonomy of splash types, crest types, crown types, and tendril behaviors

---

# Volume I — Field Mathematics and Operator Design

## A formal design language for rupture, transport, coherence, reservoir dynamics, adhesion, patch extraction, and regime transitions

---

## 23. Goal of the Field Layer

The field layer exists to answer one central question:

**At each surface location, what kind of water behavior is the surface trying to become next?**

The field layer is the bridge between:

* the attached heightfield regime
* external forcing and moving bodies
* carrier-particle feedback
* detached coherent sheet emission
* spray and reabsorption logic

It should not be treated as a cosmetic diagnostic overlay. It is the control architecture for the entire hybrid system.

---

## 24. Core Surface State Variables

A strong hybrid system needs more than height and vertical velocity. The minimal useful surface state should include the following fields.

### 24.1 Height `eta(x,z,t)`

The scalar surface elevation over the base domain.

Role:

* defines the visible attached water surface
* feeds normals, slope, and curvature
* defines the contact manifold for attached coupling and recapture

### 24.2 Vertical Surface Velocity `etaDot(x,z,t)`

The time derivative of height.

Role:

* captures upward and downward motion of the surface
* distinguishes rising crests from static slopes
* contributes to release timing and re-entry handling

### 24.3 Surface Momentum / Azimuth `U(x,z,t)`

A 2D vector field on the surface plane.

Role:

* encodes horizontal transport direction and strength
* drives forward throw of emitted structures
* distinguishes coherent traveling features from standing oscillation
* supports regime orientation, crest peel direction, and splash lean

### 24.4 Rupture Potential `R(x,z,t)`

A scalar field measuring local tendency to become volumetric or detached-sheet behavior.

Role:

* controls where coherent detachment should begin
* drives patch extraction and emission rate
* participates in regime selection

### 24.5 Coherence `C(x,z,t)`

A scalar field measuring structural order in the local feature.

Role:

* distinguishes clean crest/lip/ridge features from noisy disturbances
* controls whether detachment should produce a sheet, a packet, or direct spray

### 24.6 Reservoir Mass `M(x,z,t)`

A scalar field describing how much detachable water is locally available.

Role:

* prevents infinite emission
* introduces charging and exhaustion
* controls sustain time of detachment
* provides memory of local water availability

### 24.7 Adhesion / Recapture `A(x,z,t)`

A scalar field describing local tendency to bind or reabsorb detached water.

Role:

* biases recapture of nearby detached structures
* influences how long a detached structure remains independent
* modulates the threshold for returning water to the heightfield regime

### 24.8 Optional Supporting Fields

Depending on the implementation, the system may also use:

* `I(x,z,t)` — impact memory / recent forcing memory
* `K(x,z,t)` — curvature severity or crestness helper field
* `D(x,z,t)` — local surface divergence or convergence of horizontal transport
* `S(x,z,t)` — shear or strain proxy on the surface
* `F(x,z,t)` — foam / aeration predisposition
* `T(x,z,t)` — detached sheet contact likelihood or transition memory

---

## 25. Design Semantics of Each Field

### 25.1 Height Is Geometry, Not Intent

`eta` tells us what the surface is. It does not tell us what it wants to become.

### 25.2 Velocity Is Motion, Not Structure

`etaDot` and `U` describe motion, but they do not alone tell us whether the motion is coherent enough to produce a crest lip, a fan, or a spray burst.

### 25.3 Rupture Potential Is Intent

`R` is the field that answers:

* how close the surface is to failing as a pure attached heightfield
* how strongly it wants to emit detached structure

### 25.4 Coherence Is Organization

`C` tells us whether that failure is organized enough to look like a sheet rather than garbage.

### 25.5 Reservoir Mass Is Memory

`M` ensures the surface has a budget and temporal persistence.

### 25.6 Adhesion Is Return Logic

`A` controls how the detached world talks back to the attached world.

---

## 26. Derived Geometric Operators

The core fields should be augmented by local differential operators derived from the heightfield and surface momentum.

### 26.1 Surface Gradient `gradEta`

A 2D gradient of the heightfield.

Useful for:

* slope magnitude
* local normals
* identifying steep features
* shaping emission normal and sheet tilt

A standard approximation is:

`gradEta = (d eta / d x, d eta / d z)`

### 26.2 Surface Normal `n`

A local approximate normal derived from the height gradient:

`n = normalize((-gradEta.x, 1, -gradEta.y))`

Role:

* lift direction
* recapture projection direction
* contact orientation for detached sheets

### 26.3 Curvature Proxy `kappa`

A second-order measure of crestness or local bending.

Possible approximation:

`kappa ~ laplacian(eta)`

Useful for:

* identifying crests and bowls
* distinguishing broad slopes from sharp ridge-like features
* contributing to rupture potential and coherence

### 26.4 Surface Momentum Magnitude `|U|`

Useful for:

* estimating how strongly surface energy is translating
* determining forward throw strength
* detecting traveling packets vs static oscillation

### 26.5 Momentum Convergence / Divergence `divU`

Useful for:

* detecting compression and pile-up
* identifying likely crest charging or depletion zones
* helping drive reservoir evolution and rupture potential

### 26.6 Surface Shear Proxy `shearU`

Useful for:

* distinguishing smooth translation from shearing or turbulent features
* helping determine breakup tendency vs sheet coherence

### 26.7 Vertical Excitation Proxy `Eup`

A scalar indicating whether the local surface is actively accelerating upward.

Possible sources:

* positive `etaDot`
* positive change in `etaDot`
* recent external forcing

This helps distinguish static steepness from active launch.

---

## 27. Sources Feeding the Field Layer

The field layer should integrate information from multiple sources.

### 27.1 Internal Wave Dynamics

These include:

* height
* vertical velocity
* propagating packets
* local slope and curvature

### 27.2 External Impactors

Examples:

* spheres entering the water
* hulls or projectiles
* cursor-driven impulses
* plunging objects

These can inject:

* local reservoir charge
* momentum bias
* coherence seeds
* rupture potential spikes

### 27.3 Detached Carrier Feedback

Detached particles or sheet patches can feed back:

* re-entry impulses
* recapture mass
* local surface momentum
* local rupture reinforcement or suppression

### 27.4 Historical Memory

Useful memories include:

* recent impacts
* recent emission
* recent recapture
* cooldown after rupture

These temporal memories are critical for hysteresis and realism.

---

## 28. Constructing Rupture Potential `R`

### 28.1 What `R` Must Mean

`R` is not literal pressure. It is not simply height. It is not simply slope. It is a composite measure of how strongly the local surface is trying to become volumetric.

### 28.2 Candidate Ingredients

A useful `Rraw` can be built from a weighted combination of normalized features such as:

* crestness from curvature magnitude
* upward excitation
* slope severity
* surface momentum magnitude
* convergence or pile-up
* external impact memory
* carrier-feedback forcing
* reservoir fullness

A conceptual form is:

`Rraw = wK * crestness + wE * Eup + wS * slope + wU * |U| + wD * compression + wI * impactMemory + wF * feedbackForce + wM * reservoirBias`

Where:

* `crestness` favors features near ridge formation
* `Eup` detects active launch, not just static shape
* `compression` rewards local buildup
* `reservoirBias` makes well-charged regions more able to emit

### 28.3 Temporal Integration of `R`

Rather than using `Rraw` directly, the system should integrate toward a smoothed and hysteretic field:

`dR/dt = chargeRate * sat(Rraw) - decayRate * R - cooldownSuppression`

Where:

* `sat(.)` is a saturation or soft clamp
* `cooldownSuppression` prevents flicker after recent rupture

### 28.4 Hysteresis

The emission threshold should not equal the emission reset threshold.

For example:

* enter detachment when `R > R_on`
* stop detachment when `R < R_off`

with `R_off < R_on`

This prevents frame-to-frame chatter.

---

## 29. Constructing Surface Momentum `U`

### 29.1 Why `U` Must Be Explicit

Temporal motion inferred from height alone is ambiguous. Therefore a dedicated surface momentum field is strongly preferred.

### 29.2 Meaning of `U`

`U` should represent local horizontal transport tendency of surface energy or surface-carried mass.

It is not necessarily identical to subsurface fluid velocity. It is the effective directional guide for visible surface transport and detached emission orientation.

### 29.3 Update Law for `U`

A useful conceptual update is:

`dU/dt = advection(U) + wavePacketTransport + externalTangentialForce + recaptureFeedback - damping - diffusion`

Components may include:

* advection by the local surface field
* explicit packet direction injection from wake systems
* tangential forcing from moving bodies
* impact-induced radial transport
* feedback from re-entering detached structures
* controlled damping and diffusion for stability

### 29.4 Preferred Direction Extraction

Where `|U|` is non-trivial:

`p = normalize(U)`

This `p` is the forward throw direction for many detached regimes.

### 29.5 Handling Low-Momentum Ambiguity

If `|U|` falls below a threshold, the system should avoid over-interpreting noisy direction.

Fallbacks may include:

* use local wave packet direction if known
* use impact tangent direction
* reduce directional throw and favor bulge or symmetric plume regimes

---

## 30. Constructing Coherence `C`

### 30.1 Meaning of `C`

`C` measures whether the local feature is ordered enough to create a coherent detached structure.

High coherence means:

* ridge-like
* aligned
* smooth in direction
* temporally persistent

Low coherence means:

* noisy
* isotropic
* turbulent
* fragmented

### 30.2 Candidate Ingredients

A conceptual coherence field may combine:

* alignment of local gradients across a neighborhood
* directional consistency of `U`
* persistence of crestness over time
* low local shear disorder
* low sign-flipping in local normal variation

A useful conceptual form is:

`Craw = a1 * ridgeAlignment + a2 * momentumAlignment + a3 * temporalPersistence - a4 * disorder - a5 * noisyShear`

### 30.3 Temporal Filtering

Like `R`, coherence should be smoothed over time:

`dC/dt = gain * Craw - loss * C`

This prevents one-frame nonsense from becoming a fake sheet.

### 30.4 Why `C` Is Essential

Without coherence, every energetic event becomes equally likely to emit a sheet. That would be incorrect. Some energetic regions should emit plumes or spray, not ribbons.

---

## 31. Constructing Reservoir Mass `M`

### 31.1 Meaning of `M`

`M` is the local detachable-water budget.

It does not need to equal true physical mass depth. It is a control field representing how much detachable material is available for coherent release.

### 31.2 Why `M` Is Mandatory

Without `M`, any hot region becomes an infinite faucet.

### 31.3 Reservoir Charging

Possible charging sources:

* local surface convergence
* quiet refill toward an equilibrium baseline
* recaptured detached mass
* upward compression from impacts
* local pile-up from wave packet transport

A conceptual update might be:

`dM/dt = refill + convergenceCharge + recaptureInput + impactCharge - releaseDrain - evaporationToFoam`

### 31.4 Equilibrium Bias

The reservoir may relax toward a preferred baseline `M0`:

`refill = beta * (M0 - M)`

This avoids permanent depletion.

### 31.5 Release Coupling

Emission rate should be multiplicatively limited by `M`:

`releaseRate ~ f(R, C) * g(M)`

Where `g(M)` smoothly tends to zero as `M` depletes.

---

## 32. Constructing Adhesion / Recapture `A`

### 32.1 Meaning of `A`

`A` measures how welcoming the local surface is to returning detached water.

### 32.2 High Adhesion Regions

High `A` may correspond to:

* calm or flattening regions
* thicker nearby surface bands
* low rupture activity
* high recapture history
* low tangential tearing

### 32.3 Low Adhesion Regions

Low `A` may correspond to:

* actively erupting crest zones
* strong outward launch
* unstable rupture patches
* sheet-detaching boundaries

### 32.4 Conceptual Update

`dA/dt = calmRecovery + recaptureReinforcement - ruptureSuppression - activeLaunchSuppression`

### 32.5 Why `A` Matters

Without `A`, detached structures either stick too easily or never come home. Realistic hybrid flow needs graded return behavior.

---

## 33. Regime Classification from Fields

### 33.1 The Need for a Regime Classifier

The field layer must ultimately classify behavior. A useful classifier converts field combinations into regime decisions.

### 33.2 Example Regimes

A patch or texel neighborhood may be classified as:

* `surface_only`
* `surface_bulge`
* `coherent_sheet_emit`
* `jet_emit`
* `packet_emit`
* `spray_emit`
* `reabsorb`

### 33.3 Example Decision Logic

The logic might conceptually be:

* low `R` => remain attached
* moderate `R`, moderate `M`, low `C` => bulge or packet
* high `R`, high `C`, sufficient `M`, directional `U` => coherent sheet
* high `R`, localized forcing, lower lateral coherence => jet
* high `R`, low `C`, high instability => spray
* detached nearby + high `A` + low outward intent => reabsorb

### 33.4 Hysteretic Regime Memory

Regimes should have persistence. Once a patch becomes a coherent sheet, it should not instantly flip to spray unless its thickness/coherence state actually collapses.

---

## 34. Patch Extraction from Fields

### 34.1 Why Patch Extraction Exists

Emission should be patch-based, not isolated per texel. Therefore the field layer must include connected-region extraction or equivalent local grouping.

### 34.2 Patch Seeds

Patch seeds can be drawn from regions where:

* `R > threshold`
* `M > minimum`
* local peak criteria are satisfied

### 34.3 Patch Growth

Grow a patch by aggregating neighboring texels with compatible:

* rupture potential
* direction of `U`
* coherence
* regime class

### 34.4 Patch Statistics

Each patch should compute summary properties such as:

* centroid
* average normal
* principal direction from mean `U`
* average coherence
* total detachable mass
* width and extent
* dominant regime type

These patch statistics drive actual detached emission.

---

## 35. Velocity Synthesis for Detached Emission

### 35.1 Core Idea

The initial velocity of a detached structure should be decomposed into physically meaningful components.

### 35.2 Components

`v0 = lift + throw + spread + noise`

Where:

* `lift = alphaN * n`
* `throw = alphaP * p`
* `spread = alphaT * t`
* `noise = controlled stochastic perturbation`

Here:

* `n` is the local surface normal
* `p` is normalized `U`
* `t` is a lateral tangent derived from the crest or patch orientation

### 35.3 Regime-Dependent Coefficients

Different regimes prefer different coefficient balances.

For example:

* coherent crest peel: moderate lift, strong throw, modest spread
* impact jet: strong lift, modest throw, small spread
* crown wall: moderate lift, radial throw, strong lateral spread
* packet bulge: weak lift, weak throw, broad spread

### 35.4 Why This Matters

Without directional synthesis, detachment degenerates into upward-nozzle behavior.

---

## 36. Mass Accounting and Conservation Logic

### 36.1 The Hybrid Needs Explicit Mass Bookkeeping

Even if the system uses artistic approximations, it should still track mass-like budgets cleanly.

### 36.2 Reservoir Drain

When a rupture patch emits detached material, the surface reservoir field must decrease accordingly.

### 36.3 Detached Structure Birth Budget

The emitted detached object should carry:

* a mass budget
* an expected thickness/area budget
* a lifetime or conversion budget

### 36.4 Recapture Return

When detached structures rejoin the surface, mass-like budget should return to:

* `M`
* local wave impulse
* foam/aeration fields as appropriate

### 36.5 Avoiding Double Counting

The attached and detached layers must not both fully own the same material without accounting rules. This is one of the main coupling dangers in hybrid systems.

---

## 37. Stability and Tuning Principles

### 37.1 Normalize All Inputs

All scalar field ingredients should be normalized into predictable ranges before weighted combination.

### 37.2 Separate Fast and Slow Fields

Some fields should react quickly:

* impact spikes
* short rupture triggers
* high-frequency momentum impulses

Some should evolve slowly:

* reservoir recovery
* coherence memory
* adhesion recovery

This separation is important for believable timing.

### 37.3 Use Hysteresis Generously

Hysteresis prevents:

* flicker
* chatter
* unstable regime switching
* micro-bursts from noise

### 37.4 Prefer Patch-Level Decisions Over Raw Texel Decisions

This improves continuity, stability, and artistic control.

### 37.5 Clamp the Weirdness

All fields should have safety clamping, especially:

* `R`
* `C`
* `M`
* `A`
* emission rate
* reabsorption rate

Fluid chaos is welcome. Numeric goblins are not.

---

## 38. Diagnostics for the Field Layer

The field layer must be visible and tunable.

### 38.1 Scalar Diagnostics

The system should expose heatmap views for:

* `R`
* `C`
* `M`
* `A`
* impact memory
* coherence persistence

### 38.2 Vector Diagnostics

`U` should be visible as:

* arrows
* streamlets
* hue-coded azimuth
* brightness-coded magnitude

### 38.3 Patch Diagnostics

Patch overlays should show:

* patch boundary
* regime class
* principal throw direction
* patch mass budget
* patch age and stability

### 38.4 Transition Diagnostics

The system should clearly show:

* where attached surface wants to rupture
* where rupture was denied by low coherence or low mass
* where emission occurred
* where recapture is active

---

## 39. Example Minimal Practical Field Bundle

If implementation cost is tight, a minimal powerful bundle might be:

* `eta`
* `etaDot`
* `U`
* `R`
* `M`
* `C`

If one more field can be afforded, add:

* `A`

This bundle is already dramatically stronger than a simple height-plus-heatmap system.

---

## 40. Example High-Level Per-Step Field Pipeline

A practical per-step order may look like this:

1. advance base heightfield
2. update `etaDot`
3. update surface momentum `U`
4. compute derived operators: slope, normal, curvature, divergence, shear
5. ingest external impactors and detached feedback
6. update `R`, `C`, `M`, and `A`
7. classify rupture-capable regions
8. extract coherent patches
9. emit or update detached structures based on patch summaries
10. drain reservoir budgets
11. later, process recapture and re-injection back into surface fields

This sequence should be adapted per engine architecture, but the field layer should always sit between raw surface evolution and detached structure orchestration.

---

## 41. What This Volume Establishes

This volume establishes the mathematical and semantic control layer of the hybrid water system.

It defines:

* the necessary latent surface fields
* their meanings
* how they are constructed
* how they drive regime selection
* how they support patch extraction and detached emission
* how they enable recharge, depletion, adhesion, and recapture

The next volume should define the detached sheet itself in full detail.

---

## 42. Planned Next Volume

**Volume II — Detached Sheet Structures, Stretch Laws, Thickness Dynamics, Necking, Tear Logic, and Render Models**

That volume should answer:

* what kinds of sheet patches exist
* how they are parameterized
* how they are driven by carrier particles and field patches
* how they stretch, thin, and neck
* how they tear into spray
* how they reconnect or reabsorb into the surface

---

# Volume II — Detached Sheet Structures

## A formal system for coherent breached water, ligament continuity, thickness memory, controlled necking, and delayed fragmentation

---

## 43. Purpose of the Detached Sheet Layer

The detached sheet layer exists to solve a specific failure of pure heightfields and pure particles.

### 43.1 The Heightfield Failure

The attached surface cannot represent:

* overturning
* multi-valued folds
* crown walls
* thin detached ribbons
* filaments and reconnecting bridges

### 43.2 The Particle Failure

Carrier particles alone tend to produce:

* marbly silhouettes
* premature breakup
* weak continuity in thin structures
* visually granular detached water

### 43.3 The Detached Sheet Solution

The detached sheet layer exists to provide:

* coherent visible skin over detached water
* controlled elongation
* thickness-aware breakup
* delayed droplet formation
* smoother silhouettes and more believable tendrils

The detached sheet is not a replacement for particles. It is a local surface structure driven by particles and field patches.

---

## 44. What a Detached Sheet Is

A detached sheet is a sparse local surface object representing water that has left the attached surface regime but has not yet fragmented into spray.

It is:

* local, not global
* deformable, not rigid
* short-lived, not permanent
* mass-limited, not infinite
* driven by nearby momentum carriers and field intent
* capable of reconnecting, recapturing, necking, and tearing

It should be thought of as a temporary coherent skin over detached fluid.

---

## 45. Detached Sheet Families

Not all detached structures are the same. The encyclopedia should classify sheet families explicitly.

### 45.1 Crest-Lip Sheet

A forward-leaning thin detached lip formed from an energetic traveling crest.

Typical properties:

* high directional coherence
* strong forward throw
* moderate lift
* ribbon or fan-like geometry
* often transitions into ligament breakup or plunging recontact

### 45.2 Ribbon Ligament

A long narrow coherent strip of detached water.

Typical properties:

* strong anisotropy
* thickness-sensitive necking
* delayed droplet pinch-off
* often emerges from edge pull, oblique impact, or crest peeling

### 45.3 Crown Wall Arc

A curved sheet ring or arc rising from a strong impact.

Typical properties:

* radial or semi-radial spread
* strong lateral width
* high curvature around the arc
* eventual scalloping and finger breakup

### 45.4 Impact Fan Sheet

A broad detached fan emitted from oblique impact or fast tangential body motion.

Typical properties:

* wide local parameter domain
* strong directional throw
* rapid thinning near edges
* often tears asymmetrically

### 45.5 Bridge / Reconnection Sheet

A thin water connection between two bodies of water or between detached and attached regions.

Typical properties:

* tension-like thinning
* strong recapture influence
* can collapse or reconnect rather than spray

### 45.6 Plunging Pocket Sheet

A rolling or folding sheet that partially encloses an air pocket or plunging volume.

Typical properties:

* strong curvature change
* complex normal variation
* likely to transition into aeration and recapture rather than clean spray

---

## 46. Representation Choices for Detached Sheets

Several implementation forms are possible. The best choice depends on cost, controllability, and visual goals.

### 46.1 Ribbon / Strip Representation

Represent the sheet as one or more centerlines with width and thickness fields.

Strengths:

* very efficient
* excellent for ligaments and crest lips
* easy stretch and necking logic

Weaknesses:

* less expressive for broad fan or crown geometry
* topology changes require extra handling

### 46.2 Local Parametric Patch Representation

Represent the sheet as a small deformable 2D chart or patch grid.

Strengths:

* good for fans, crowns, lips, and reconnecting bridges
* explicit thickness and strain fields
* direct rendering possibilities

Weaknesses:

* more bookkeeping than ribbons
* patch distortion must be controlled

### 46.3 Oriented Implicit Patch / Narrow-Band Local Field

Represent the sheet through a sparse implicit field around detached structures.

Strengths:

* smooth visual continuity
* can support wrap and roll
* natural raymarch rendering

Weaknesses:

* heavier compute cost
* weaker direct control over stretch/tear timing unless carefully designed

### 46.4 Surfels / Anisotropic Skin Particles

Represent the sheet as oriented surface elements driven by carrier particles.

Strengths:

* naturally tied to carrier motion
* can be cheap and flexible

Weaknesses:

* can drift back toward particle-look if not strongly regularized
* sheet memory and tear logic are less explicit

### 46.5 Recommended Practical Direction

For a browser-first hybrid system, the most attractive starting point is usually:

* local parametric patch grids for broad coherent sheet pieces
* strip/ribbon forms for narrow ligaments

This creates a manageable sparse geometry layer with explicit thickness and stretch control.

---

## 47. The Detached Sheet State Vector

Each detached sheet object should have a state vector rich enough to support motion, geometry, mass accounting, and failure logic.

### 47.1 Sheet-Level Properties

A detached sheet object may include:

* unique identifier
* sheet family type
* birth time / age
* centroid position
* average velocity
* orientation frame
* bounding volume
* total mass budget
* total area estimate
* total thickness budget
* coherence score
* stability score
* recapture bias
* source patch reference

### 47.2 Per-Element Properties

If the sheet is a strip or patch grid, each element or node may store:

* local position
* local velocity
* local normal
* local tangent directions
* local thickness
* local stretch ratio
* local strain rate
* local curvature proxy
* local tear resistance
* local age or damage
* local linkage to carrier particles

### 47.3 Optional Topology Data

Some sheet models may also track:

* edge flags
* tear candidate edges
* seam constraints
* reconnectable boundaries
* local principal direction estimates

---

## 48. Parameterization of Sheet Geometry

### 48.1 Why Parameterization Matters

Detached sheet behavior depends on having a local surface coordinate system in which stretch, width, thickness, and tearing can be reasoned about.

### 48.2 Patch Coordinates `(u,v)`

A patch-like detached sheet may use local coordinates `(u,v)` over a small chart.

These coordinates need not be globally stable forever. They only need to remain usable for the short life of the patch.

### 48.3 Strip Coordinates `(s,r)`

For ribbons and ligaments:

* `s` follows the centerline or main elongation axis
* `r` spans across width

This is often the cleanest formulation for necking and pinch-off.

### 48.4 Local Frame

A detached sheet should carry a local frame:

* main tangent direction
* lateral tangent direction
* local normal

This frame is needed for:

* stretching
* rendering
* thickness update
* tear direction reasoning
* recapture projection

---

## 49. Birth of a Detached Sheet

### 49.1 Birth Trigger

A sheet is born when a rupture patch reaches a coherent detachment condition.

Typical conditions include:

* high rupture potential `R`
* sufficient coherence `C`
* sufficient reservoir `M`
* directional structure from `U`
* regime classifier selecting a coherent sheet family

### 49.2 Birth Geometry

The birth geometry should be seeded from the rupture patch statistics.

For example:

* centroid from patch center
* main tangent from patch principal direction
* local normal from attached surface normal
* width from patch extent
* initial thickness from mass budget divided by area estimate

### 49.3 Birth Velocity

Initial motion should come from the patch synthesis logic defined previously:

* lift from surface normal
* throw from surface momentum
* spread from patch width axis
* optional noise from breakup variation

### 49.4 Birth Mass Budget

The sheet must receive an explicit mass-like budget drained from the local reservoir. This prevents free material creation.

---

## 50. Carrier Coupling

### 50.1 Why Carrier Coupling Exists

The detached sheet is the surface skin, but it still needs internal support and momentum from carrier particles or equivalent volumetric packets.

### 50.2 Carrier Roles

Carrier particles should contribute:

* centroid motion
* local acceleration
* pressure-like support under the sheet
* thickness preservation under compression
* breakup cues under low support

### 50.3 Sheet-to-Carrier Links

A practical implementation may assign each sheet element or local sheet region a set of linked carriers.

Possible couplings:

* nearest carrier set
* weighted carrier neighborhood
* carrier cluster per sheet node
* particle splat statistics into sheet coordinates

### 50.4 What the Sheet Reads from Carriers

The sheet may read:

* mean velocity
* mean acceleration
* support density
* anisotropy of support
* local turbulence/disorder
* local relative separation

### 50.5 What Carriers Read from the Sheet

Carriers may also read back:

* local sheet adhesion
* constraint tendency
* desired coherent axis
* breakup suppression while still skin-supported

The coupling should be two-way but carefully damped to avoid oscillatory nonsense.

---

## 51. Stretch Dynamics

### 51.1 Stretch Is Central

Detached water often becomes visually interesting because it stretches while remaining continuous for a short time.

### 51.2 Stretch Ratio

Each sheet element should maintain a measure of current stretch relative to birth or relaxed configuration.

For a strip this may include:

* axial stretch along `s`
* lateral stretch across `r`

For a patch this may include principal stretch measures.

### 51.3 Stretch Drivers

Stretch is driven by:

* local velocity gradients
* directional throw
* carrier separation
* edge pull
* gravity and inertia
* interaction with attached surface or obstacles

### 51.4 Stretch Resistance

The sheet should not behave like rubber or cloth, but it can still have limited stabilization terms that delay breakup.

These should be interpreted as:

* continuity-preserving regularization
* film persistence bias
* anti-bead stabilization

not as literal elastic material behavior

### 51.5 Controlled Stretch Rule

A practical conceptual update is:

* accumulate directional strain from motion and carrier support
* allow stretch to rise quickly under coherent motion
* apply mild smoothing or relaxation across neighboring sheet elements
* convert excessive stretch into thinning and damage rather than eternal extension

---

## 52. Thickness Dynamics

### 52.1 Thickness Is a Core State Variable

Without local thickness, the sheet cannot thin, neck, or break convincingly.

### 52.2 Sources of Thickness Change

Thickness may change due to:

* mass conservation under area expansion
* carrier support concentrating or dispersing
* recapture inflow or spray shedding outflow
* edge drainage
* local compression

### 52.3 Conservation-Like Principle

As area increases at roughly fixed mass budget, thickness should decrease.

This gives the correct qualitative behavior:

* broader stretch
* thinner film
* increased fragility

### 52.4 Thickness Floor and Sub-Grid Handling

Below a threshold, the sheet should not simply numerically collapse into nonsense. Instead it should approach a sub-grid breakup or spray conversion state.

### 52.5 Thickness Smoothing

Some light spatial smoothing may be useful to avoid checkerboard thickness artifacts, but it must not erase real necking.

---

## 53. Necking Dynamics

### 53.1 Why Necking Matters

Real water ligaments do not instantly become droplets. They usually develop thin necks first.

### 53.2 What Necking Is

Necking is localized thinning stronger than the surroundings, often driven by stretch, curvature, low support, and instability.

### 53.3 Necking Indicators

A local neck candidate may be indicated by:

* low thickness relative to neighbors
* high axial stretch
* falling carrier support density
* rising instability / disorder
* locally increased curvature

### 53.4 Neck Growth

Once necking starts, it should intensify unless support returns. This creates delayed pinch-off rather than immediate atomization.

### 53.5 Why Necking Should Be Explicit

Without explicit necking logic, detached water either tears too early or stretches forever like cursed taffy.

---

## 54. Tear Logic

### 54.1 Tear Is Not Just Low Thickness

A sheet should not tear merely because thickness is low. Many thin structures remain coherent briefly.

### 54.2 Tear Ingredients

A useful tear criterion may depend on:

* thickness below a critical band
* high stretch or strain rate
* low coherence
* low carrier support
* high damage accumulation
* adverse curvature or edge instability

### 54.3 Hysteretic Tear Thresholds

Like rupture logic, tear logic should use hysteresis or temporal persistence.

That means:

* a region becomes a tear candidate
* if the candidate persists or worsens, an actual tear occurs
* transient thinness alone does not instantly sever the sheet

### 54.4 Tear Outcomes

A tear may produce:

* two child sheet patches
* a detached droplet packet
* a spray packet
* a reconnecting boundary that retracts

### 54.5 Edge Tearing vs Interior Tearing

Edges often fray first. Interior tears can occur, but should be treated differently from edge scalloping.

---

## 55. Damage and Stability Fields on the Sheet

### 55.1 Why Damage Memory Helps

A detached sheet should remember where it has become weak.

### 55.2 Damage Sources

Damage may accumulate from:

* repeated high stretch
* very low support
* strong turbulence
* repeated impacts
* edge flutter or oscillation

### 55.3 Stability Score

A stability score can summarize:

* support quality
* coherence
* thickness margin
* strain margin

This helps drive when the sheet remains coherent versus transitions toward fragmentation.

---

## 56. Edge Dynamics

### 56.1 Sheet Edges Are Special

Most thin water drama happens at edges.

Edges may:

* thin faster
* curl
  n- scallop
* seed ligaments
* generate droplets
* reconnect to the main body

### 56.2 Edge Metrics

Useful edge properties include:

* edge thickness
* edge curvature
* edge speed relative to interior
* edge support deficit
* edge tear likelihood

### 56.3 Edge-Generated Ligaments

The detached sheet can spawn ribbon ligaments from unstable edges rather than directly atomizing the entire structure.

This is important for realistic crown and fan evolution.

---

## 57. Reconnection and Recontact

### 57.1 Not All Detached Sheets End in Spray

Many detached structures reconnect to the main body or collapse back into it.

### 57.2 Recontact Detection

A detached sheet should detect proximity and relative motion to:

* attached heightfield surface
* other sheet patches
* obstacles or boundaries

### 57.3 Recontact Outcomes

Possible outcomes:

* recapture into the attached surface
* merge into another sheet patch
* impact-induced tear and splash
* bubble/aeration injection if closure traps air

### 57.4 Recontact with Low Relative Speed

Low relative speed recontact should favor smooth reabsorption rather than explosive breakup.

---

## 58. Recapture Logic

### 58.1 Sheet-Level Recapture

A detached sheet can be retired and its budget returned when:

* it is near the attached surface
* relative normal velocity is low or inward
* local adhesion `A` is high
* volumetric distinctness has collapsed

### 58.2 Partial Recapture

Large sheets may recapture region by region rather than all at once.

### 58.3 Recapture Outputs

Recapture can feed:

* reservoir mass `M`
* local wave impulse
* foam/aeration fields
* surface momentum reinforcement

This closes the hybrid loop.

---

## 59. Sheet-to-Spray Transition

### 59.1 Spray Is a Late Outcome

The detached sheet should only become spray when coherence and thickness support are truly lost.

### 59.2 Conversion Signals

Sheet-to-spray transition should be driven by:

* very low thickness
* high neck severity
* low stability
* low carrier support
* high disorder or turbulence
* persistent tear conditions

### 59.3 Conversion Granularity

The conversion should often happen locally:

* edge fray first
* neck pinch-off second
* surviving sheet remainder continues briefly

This local conversion produces much richer dynamics than all-at-once destruction.

---

## 60. Rendering Models for Detached Sheets

### 60.1 Why Rendering Matters

Even a good sheet model will fail visually if rendered as a jagged mesh or obvious particle cloud.

### 60.2 Candidate Render Models

Detached sheets may be rendered via:

* camera-facing but frame-aware ribbons
* thin triangulated local patches
* anisotropic surfel splats
* raymarched local implicit surfaces
* hybrid thickness maps with refraction and transmission cues

### 60.3 Visual Properties to Preserve

Rendering should emphasize:

* smooth silhouette continuity
* thickness variation
* thin-film translucency cues where appropriate
* edge sparkle only at the right scale
* continuity into spray and foam transitions

### 60.4 Practical Browser Strategy

A strong practical path is:

* strip meshes for ligaments and ribbon sheets
* small triangulated patches for fans and crown walls
* spray rendered separately as particles / billboards / volumetric specks

This keeps the detached layer sparse and controllable.

---

## 61. Mass and Area Accounting for Sheets

### 61.1 Why Accounting Matters

The sheet should not be a free visual decal disconnected from simulation budgets.

### 61.2 Sheet Budget Variables

At minimum, each sheet should track:

* available mass-like budget
* current area
* inferred average thickness
* amount already converted to spray
* amount already recaptured

### 61.3 Budget Update Principle

The sheet evolves by redistributing its budget into:

* larger area with lower thickness
* smaller area with greater thickness
* fragmented spray output
* reabsorbed surface return

This makes the detached structure visually and dynamically legible.

---

## 62. Suggested Sheet Update Pipeline

A high-level per-step detached-sheet update may look like this:

1. ingest newly created rupture-patch births
2. update sheet transforms and local frames from carrier support
3. advect sheet nodes or strip control points
4. update stretch and strain
5. update thickness from area change and support change
6. update stability and damage
7. detect necking candidates
8. process edge instability and local tears
9. convert local failed regions to spray or droplets
10. process recontact and partial recapture
11. retire dead or fully recaptured sheets

This update need not be fully physical. It needs to be coherent, stable, and visually truthful.

---

## 63. Performance Strategy

### 63.1 Detached Sheets Must Be Sparse

The detached layer should only exist where needed.

### 63.2 Spawn Only in Coherent High-Value Zones

Do not create sheets for every minor splash. Use the regime fields to reserve sheet creation for meaningful coherent breach events.

### 63.3 Limit Active Sheet Count

Maintain caps and priority rules based on:

* screen importance
* coherence
* mass budget
* age
* camera distance

### 63.4 Use Family-Specific LOD

Examples:

* far ribbons simplify to elongated surfels
* distant crown walls simplify to coarser patches
* thin small surviving ligaments collapse into spray proxies

### 63.5 Sparse Wins Over Full Domain

A sparse detached layer gives most of the visual payoff at a fraction of the cost of full 3D volumetric reconstruction.

---

## 64. Failure Modes of Detached Sheets

The encyclopedia should explicitly track detached-sheet failure modes.

### 64.1 Rubber-Sheet Failure

Too much continuity preservation and not enough breakup.

Symptoms:

* unnatural elastic stretch
* cloth-like behavior
* water looking like slime membrane

### 64.2 Instant-Marble Failure

Too little continuity preservation.

Symptoms:

* immediate bead chains
* no necking stage
* no believable lip or tendril phase

### 64.3 Ghost-Sheet Failure

The visible skin drifts away from supporting motion.

Symptoms:

* sheet appears disconnected from mass
* delayed or floating geometry
* mismatch with impacts

### 64.4 Infinite-Sheet Failure

The sheet persists without adequate mass or reason.

Symptoms:

* immortal ribbons
* no exhaustion
* no recapture

### 64.5 Mesh-Goblin Failure

Rendering artifacts dominate.

Symptoms:

* tessellation popping
* folding glitches
* aliasing at thin edges
* visible parametric distortion

---

## 65. Recommended Minimal Prototype

A minimal serious prototype can be much simpler than the full eventual system.

### 65.1 Minimal Prototype Goals

* prove delayed breakup
* prove coherent tendrils and crest lips
* prove local recapture
* prove mass-limited detached continuity

### 65.2 Minimal Detached Sheet Form

Start with:

* one ribbon/strip family
* one small patch family
* explicit thickness field
* explicit stretch field
* simple necking score
* simple tear rule
* simple recapture rule

### 65.3 Minimal Inputs

Use:

* rupture patches from `R`, `C`, `M`, `U`
* carrier neighborhood mean motion
* attached surface normal and proximity

### 65.4 Minimal Outputs

Produce:

* strip mesh or patch mesh render
* local spray generation on tear
* reservoir drain on birth
* reservoir/impulse return on recapture

This prototype would already answer the central artistic question.

---

## 66. How This Volume Changes the Whole System

This volume changes the architecture from:

* heightfield plus particles plus spray

into:

* heightfield plus rupture fields plus detached coherent sheet plus carriers plus spray plus recapture

That is a profound shift. It gives the system a missing middle layer — the layer where water remains beautiful while no longer being representable as a simple attached surface.

---

## 67. What the Next Volume Should Solve

The next volume should define exact coupling logic between:

* heightfield fields
* rupture patches
* detached sheet births
* carrier clusters
* spray conversion
* recapture and reservoir return

This must include pass ordering, budget bookkeeping, feedback channels, and timing.

---

## 68. Planned Next Volume

**Volume III — Coupling Architecture and Regime Transition Operators**

That volume should answer:

* when a rupture patch becomes a sheet, packet, jet, or spray event
* how the detached sheet reads and writes carrier data
* how the surface reservoir drains and refills
* how recontact and reabsorption are processed
* how to avoid double ownership of mass and motion
* how to structure the full update loop in a browser/WebGPU implementation

---

# Volume III — Coupling Architecture and Regime Transition Operators

## A formal orchestration model for ownership, handoff, budget flow, feedback channels, and pass ordering in the hybrid water system

---

## 69. Purpose of the Coupling Layer

The coupling layer exists to solve the hardest problem in hybrid water:

**How do multiple representations cooperate without contradicting each other, double-owning the same water, or falling out of causal sync?**

A successful hybrid system does not merely contain multiple solvers. It contains a disciplined architecture for:

* deciding which regime is authoritative at a given place and time
* transferring responsibility between regimes
* preserving continuity during handoff
* routing feedback in both directions
* keeping mass-like and momentum-like budgets coherent enough to remain believable

Without this layer, even excellent individual subsystems become an orchestra of drunken trombones.

---

## 70. Regime Ownership Model

### 70.1 Why Ownership Matters

At any instant, a parcel of visually meaningful water should have a primary owner.

If the same material is fully represented and fully rendered by multiple regimes without accounting, the system will suffer from:

* double brightness
* double force contribution
* infinite material appearance
* detached structures that never deplete the source surface
* visually incoherent overlap

### 70.2 Primary Regimes

The system uses four main representational owners:

1. **Attached Surface Owner** — the heightfield and its latent intent fields
2. **Detached Sheet Owner** — coherent detached skin structures
3. **Carrier Owner** — detached volumetric support and momentum packets / particles
4. **Fragmented Owner** — spray, droplets, aeration, foam outputs

### 70.3 Ownership Principle

A water structure may be influenced by multiple regimes, but at any moment it should have a clear primary owner for:

* visible surface continuity
* mass-like budget source
* main kinematic update
* handoff decision responsibility

### 70.4 Shared Influence vs Shared Ownership

It is acceptable for a detached sheet to read carrier velocity and for the attached surface to receive recapture impulses from a sheet.

It is not acceptable for all three of these to behave as though they independently own the same water without explicit transfer logic.

---

## 71. Global State Graph

### 71.1 Core States

A practical high-level graph is:

* `attached_surface`
* `surface_bulge`
* `sheet_birth_candidate`
* `detached_sheet`
* `detached_packet`
* `jet_event`
* `fragmented_spray`
* `recontact_candidate`
* `recaptured_surface`

### 71.2 State Meaning

* `attached_surface`: fully heightfield-owned
* `surface_bulge`: still attached, but charged and near failure
* `sheet_birth_candidate`: coherent patch about to detach
* `detached_sheet`: coherent skin object exists
* `detached_packet`: detached carrier-only packet with weak or no skin
* `jet_event`: localized high-lift emission regime
* `fragmented_spray`: incoherent breakup products
* `recontact_candidate`: detached structure near surface or another coherent owner
* `recaptured_surface`: detached budget reintegrated into heightfield fields

### 71.3 State Persistence

Transitions should not be stateless one-frame reactions. Each state should have:

* entry conditions
* persistence conditions
* exit conditions
* optional cooldown or memory effects

This is how the system resists chatter.

---

## 72. Canonical Handoff Principles

### 72.1 Surface to Sheet Handoff

Occurs when:

* rupture potential is high enough
* coherence is sufficient
* reservoir mass is sufficient
* a patch-based coherent event exists
* directional structure supports a coherent detached object

### 72.2 Surface to Packet / Jet Handoff

Occurs when:

* rupture is strong but coherence is insufficient for a sheet
* forcing is localized and verticalized
* geometry suggests plume or packet rather than ribbon or fan

### 72.3 Sheet to Spray Handoff

Occurs when:

* thickness becomes critically low
* necking persists
* support collapses
* coherence falls
* damage accumulates beyond threshold

### 72.4 Sheet / Packet to Surface Recapture

Occurs when:

* detached structures lose distinctness
* contact with the attached surface is regained
* relative motion favors reintegration
* local adhesion is high enough

### 72.5 Sheet to Sheet Merge

Occurs when:

* detached coherent structures recontact each other slowly enough
* their frames and mass budgets allow a stable merged continuation

### 72.6 Surface to Surface Only

Occurs when:

* rupture is never activated or later suppressed by low mass, low coherence, or high adhesion

---

## 73. Surface-Side Coupling Operators

### 73.1 Intent Update Operator

This operator updates:

* rupture potential `R`
* coherence `C`
* reservoir `M`
* adhesion `A`
* optional memories and helper fields

It consumes:

* base heightfield state
* external forcing
* re-entry and recapture feedback
* carrier / detached structure feedback

### 73.2 Patch Extraction Operator

This operator groups rupture-capable regions into structured patches.

It outputs per-patch summaries:

* centroid
* extent
* principal direction
* normal estimate
* coherence
* available budget
* regime suggestion

### 73.3 Surface Emission Operator

This operator decides which patches actually emit detached structures this step.

It drains surface-side budgets and creates detached births.

### 73.4 Surface Reabsorption Operator

This operator accepts returning budget and impulse from detached structures.

It writes back to:

* reservoir `M`
* local wave impulse / velocity
* local momentum field `U`
* foam / aeration where relevant

---

## 74. Detached Sheet Coupling Operators

### 74.1 Birth Operator

Consumes:

* selected rupture patch summary
* drained mass-like budget
* initial orientation and velocity synthesis
* reference to source surface region

Produces:

* a detached sheet object
* linked carrier references or carrier birth instructions
* renderable local geometry representation

### 74.2 Carrier Support Operator

Updates sheet elements from carrier neighborhoods.

Consumes:

* carrier positions
* carrier velocity and support density
* local turbulence or disorder

Produces:

* sheet centroid update
* local support / stability updates
* thickness support term
* breakup cues

### 74.3 Stretch and Thickness Operator

Consumes local motion and geometry changes to update:

* stretch
* thickness
* necking score
* local stability and damage

### 74.4 Tear and Fragmentation Operator

Converts failing local regions into:

* child sheet pieces
* spray packets
* droplets
* edge ligaments

### 74.5 Recontact Operator

Checks detached sheet against:

* attached surface
* other detached sheets
* obstacles or scene boundaries

It determines whether to:

* merge
* reabsorb
* rebound
* fragment
* inject aeration

---

## 75. Carrier Coupling Operators

### 75.1 Carrier Birth Operator

Creates or assigns carrier particles / packets in response to a surface emission event.

These carriers receive:

* mass-like support budget
* initial velocity
* local anisotropy cues
* source patch identity if needed

### 75.2 Carrier Update Operator

Updates detached volumetric support motion.

This may use:

* MLS-MPM steps
* simplified packet dynamics
* aerodynamic drag or gravity terms
* coupling to detached sheet constraints

### 75.3 Carrier-to-Sheet Support Operator

Aggregates carrier statistics into the detached sheet layer.

### 75.4 Carrier-to-Surface Reentry Operator

When detached carriers intersect the attached surface domain, this operator computes:

* local impulse feedback
* recapture candidate mass
* spray or foam generation
* possible sheet birth reinforcement if the event is violent enough

---

## 76. Fragmentation Coupling Operators

### 76.1 Fragment Birth Operator

Creates spray or droplet objects from:

* sheet tears
* unstable edges
* packet breakup
* impact re-entry breakup

### 76.2 Fragment Update Operator

Handles:

* ballistic motion
* drag
* lifetime
* evaporation into mist / disappearance if desired
* possible recollision or reentry

### 76.3 Fragment Reentry Operator

Allows spray or droplets to:

* return mass-like budget
* inject ripples or impulse
* seed foam or aeration
* merge back into detached or attached regimes depending on scale and state

---

## 77. Budget Flow Architecture

### 77.1 Why Budget Flow Must Be Explicit

The hybrid system does not need exact physical conservation everywhere, but it does need coherent budget flow.

### 77.2 Main Budget Channels

A useful conceptual budget network is:

* attached reservoir `M`
* detached sheet budget `Bsheet`
* carrier budget `Bcarrier`
* fragmented budget `Bfrag`
* returned budget `Breturn`

### 77.3 Typical Transfers

Examples:

* surface emission: `M -> Bsheet + Bcarrier`
* packet emission without sheet: `M -> Bcarrier`
* sheet fragmentation: `Bsheet -> Bfrag`
* sheet thinning with carrier dominance: `Bsheet -> Bcarrier`
* recapture: `Bsheet/Bcarrier/Bfrag -> Breturn -> M + wave feedback`

### 77.4 Practical Rule

Exact conservation may be softened, but every birth and death should have a budget story.

### 77.5 Avoiding Infinite Gain

Every emission path should be limited by at least one of:

* local reservoir mass
* patch budget cap
* active structure cap
* screen-space / importance LOD budget

---

## 78. Momentum and Impulse Flow

### 78.1 The Need for Momentum-Like Continuity

Even if mass accounting is approximate, motion transfer must remain visually continuous.

### 78.2 Surface to Detached Motion Transfer

When a surface patch emits a detached structure, detached initial velocity should inherit:

* local normal lift
* horizontal surface momentum
* patch-scale spread
* source object forcing if applicable

### 78.3 Detached to Surface Feedback

When detached structures re-enter or recapture, they should transfer back:

* local impulse into heightfield velocity
* local horizontal surface momentum reinforcement or disruption
* possible reservoir refill
* local coherence disturbance or foam/aeration generation

### 78.4 Detached Internal Motion

Carrier motion and sheet motion should stay close enough to avoid ghosting. Damped two-way coupling is the right compromise.

---

## 79. Authority Rules by Regime

### 79.1 Attached Surface Authority

Primary authority over:

* visible attached water body
* broad wave continuity
* rupture intent fields
* recapture destination

### 79.2 Detached Sheet Authority

Primary authority over:

* visible coherent detached skin
* local thickness / stretch / tear timing
* coherent ligament and ribbon geometry

### 79.3 Carrier Authority

Primary authority over:

* detached bulk momentum
* volumetric support beneath detached skin
* inertial motion after emission

### 79.4 Fragment Authority

Primary authority over:

* final incoherent breakup
* mist, droplets, fine spray, micro-scale impact returns

### 79.5 Authority Precedence in Conflicts

If visual continuity and carrier dynamics disagree slightly, the detached sheet should usually win visually while the carrier layer continues to drive its next update. This avoids marbly visible nonsense while preserving momentum support.

---

## 80. Temporal Ordering and Causality

### 80.1 Why Ordering Matters

The same operators in the wrong order can produce a one-frame causal mush.

### 80.2 Recommended High-Level Order

A strong baseline order is:

1. advance attached heightfield core state
2. update surface intent fields (`R`, `C`, `M`, `A`, `U`)
3. ingest previous detached feedback and recent external forcing
4. extract coherent rupture patches
5. decide emission events and drain reservoir budgets
6. birth new detached sheets / packets / jets
7. advance carriers
8. update detached sheets from carriers and local geometry rules
9. process sheet tears and fragment births
10. advance fragments
11. detect recontact and recapture for sheets, carriers, and fragments
12. feed reentry and recapture outputs back to the surface
13. finalize render data for all regimes

### 80.3 Alternate Reordered Variant

Some engines may prefer to ingest previous-frame recapture at the beginning of the next frame rather than the end of the current frame. That is acceptable as long as the architecture is consistent and tuning respects the latency.

### 80.4 Substep Considerations

Violent events may require substeps for:

* carrier updates
* sheet stretch / tear
* reentry collision with the attached surface

The field layer can often evolve at a lower rate than the most violent detached dynamics.

---

## 81. Patch Event Resolution

### 81.1 Why Patch Events Need Priority

Multiple rupture patches may compete for limited structure budgets.

### 81.2 Priority Signals

Priority may depend on:

* rupture potential
* coherence
* available mass
* camera importance
* recent under-served history
* family type importance

### 81.3 Event Types

A patch may resolve into:

* no emission
* bulge only
* coherent sheet birth
* jet event
* packet event
* direct spray event

### 81.4 Event Exclusivity

A patch generally should not spawn every regime at once. It should choose one dominant event, with optional secondary edge spray if appropriate.

---

## 82. Coupling Between Sheet and Packet Forms

### 82.1 Why Both Exist

Some detached events are coherent enough for visible sheets. Others are better treated as packet/plume structures without a stable skin.

### 82.2 Sheet-to-Packet Collapse

A detached sheet may lose coherence and collapse into packet-dominant motion before fully becoming spray.

### 82.3 Packet-to-Sheet Upgrade

A detached packet may become sheet-bearing if local coherence rises, support becomes anisotropic, and a visible coherent skin becomes worthwhile.

This is likely rare but valuable for certain impact fans and reconnecting surfaces.

---

## 83. Recapture Routing Rules

### 83.1 The Need for Routing

Not all returning detached budget should go to the same destination.

### 83.2 Candidate Return Channels

Returning material may be routed into:

* surface reservoir refill
* direct wave impulse
* local surface momentum `U`
* foam/aeration storage
* splash rebound or secondary emission trigger

### 83.3 Routing by Event Type

Examples:

* gentle reconnection: mostly reservoir + mild surface momentum
* hard droplet reentry: mostly wave impulse + foam
* collapsing sheet: reservoir + localized coherence disruption + aeration

---

## 84. Coupling Failure Modes

### 84.1 Double Ownership Failure

Symptoms:

* surface does not deplete when detaching
* detached structures seem to create material from nowhere
* brightness or volume seems duplicated

### 84.2 Delayed Causality Failure

Symptoms:

* detached water visually reacts too late to the surface
* reentry feels one beat behind
* system seems mushy or disconnected

### 84.3 Oscillatory Handoff Failure

Symptoms:

* regime flips back and forth frame to frame
* sheet births and dies instantly
* recapture and re-emission chatter

### 84.4 One-Way World Failure

Symptoms:

* detached structures never meaningfully feed back to the surface
* main body feels dead to splash returns

### 84.5 Ownership Drift Failure

Symptoms:

* sheet geometry is visible but carriers no longer support it
* recapture happens visually but budgets do not return

---

## 85. Browser / WebGPU Pass Graph Strategy

### 85.1 Why Pass Graph Design Matters

A browser/WebGPU implementation benefits from a clear separation of:

* 2D surface field passes
* sparse detached structure passes
* particle / carrier passes
* fragment passes
* render preparation passes

### 85.2 Suggested Resource Classes

A practical architecture may use:

* 2D textures for attached surface fields and diagnostics
* structured buffers for rupture patches
* structured buffers for detached sheet objects and nodes
* structured buffers for carriers
* structured buffers for fragments
* append / indirect draw buffers for active renderables

### 85.3 Typical Pass Families

Possible pass families:

* wave/heightfield update pass
* field intent update pass
* patch extraction / compaction pass
* event resolve / emission pass
* carrier step pass
* detached sheet update pass
* tear / spray conversion pass
* recontact / recapture pass
* render buffer build pass

### 85.4 Compaction and Sparsity

Sparse structures should be compacted regularly so detached-sheet and fragment workloads scale with active events rather than full world size.

### 85.5 LOD and Budget Gates

LOD decisions should be applied before expensive births and before expensive render preparation. The browser will thank you instead of screaming in shader dialect.

---

## 86. Minimal Coupling Prototype

### 86.1 Purpose

The first integrated prototype should prove that the coupling architecture behaves coherently before the system grows more detailed.

### 86.2 Minimal Regimes

A minimal prototype can include:

* attached surface with `R`, `C`, `M`, `U`
* one coherent sheet family
* one packet / jet family
* one spray family
* recapture back into the attached surface

### 86.3 Minimal Operators

A minimal pass graph can include:

1. update heightfield
2. update fields
3. extract patches
4. resolve events
5. step carriers
6. step sheets
7. convert tears to spray
8. process recapture
9. render

### 86.4 Success Criteria

The prototype is successful if it demonstrates:

* attached surface depletion during emission
* coherent detached sheet continuity
* delayed breakup
* believable reentry and return to the surface
* no obvious double ownership

---

## 87. Integration Contract Between Volumes

### 87.1 Volume I Provides

* latent fields
* field semantics
* patch extraction basis
* regime intent

### 87.2 Volume II Provides

* detached coherent sheet structures
* thickness and tear laws
* local skin continuity machinery

### 87.3 Volume III Provides

* authority rules
* handoff timing
* budget flow
* pass ordering
* feedback channels

Together these three volumes define the conceptual engine core.

---

## 88. What the Next Volume Should Solve

The next volume should turn this orchestration model into a direct implementation plan for browser graphics and compute.

It should specify:

* concrete data layouts
* buffer schemas
* texture formats
* dispatch patterns
* memory life cycles
* synchronization assumptions
* debug pathways
* LOD policies

---

## 89. Planned Next Volume

**Volume IV — Implementation Architecture for Browser and WebGPU**

That volume should answer:

* how to map the field layer into textures and buffers
* how to represent rupture patches and detached sheet nodes efficiently
* how to organize append/compact workflows
* how to build the render paths for attached, detached, and fragmented water
* how to budget the system for browser constraints
* how to stage debugging, instrumentation, and incremental rollout

---

# Volume IV — Implementation Architecture for Browser and WebGPU

## A concrete systems blueprint for textures, buffers, sparse object pools, pass graphs, dispatch order, rendering, debugging, and performance budgeting

---

## 90. Purpose of the Implementation Volume

The previous volumes define what the hybrid water system is and how its regimes should couple. This volume defines how such a system can actually be realized in a browser-first WebGPU architecture without collapsing under its own ambition.

The implementation problem is not only about correctness. It is about:

* keeping the dominant attached surface cheap
* making detached structures sparse and event-driven
* ensuring pass ordering is stable and legible
* minimizing memory bandwidth waste
* maintaining enough diagnostics that the system can be tuned sanely
* allowing incremental rollout from a small prototype to a richer engine

---

## 91. Core Architectural Principle

The system should be built around a separation of concerns:

1. **Dense 2D surface fields** for the attached regime
2. **Sparse structured buffers** for detached coherent objects and carriers
3. **Sparse fragment buffers** for spray and droplet regimes
4. **Render-preparation passes** that convert simulation data into draw-ready buffers
5. **Diagnostics and instrumentation channels** that remain first-class citizens throughout development

This split is the implementation counterpart of the regime ontology.

---

## 92. Resource Taxonomy

### 92.1 Dense Resources

Dense resources are most appropriate for the attached surface regime because it is spatially broad and mostly defined over a stable 2D domain.

Use dense 2D textures for:

* `eta`
* `etaDot`
* `U`
* `R`
* `C`
* `M`
* `A`
* optional helper fields like impact memory, foam seeds, coherence persistence, or recapture tendency

### 92.2 Sparse Resources

Sparse resources are most appropriate for detached coherent structures and fragments because these events should only exist in local active zones.

Use structured buffers for:

* rupture patch records
* detached sheet records
* detached sheet nodes or strip control points
* carrier particles or packet records
* fragment records
* event records

### 92.3 Indirect / Control Resources

Use indirect and control buffers for:

* active counts
* append counters
* compacted list lengths
* indirect dispatch arguments
* indirect draw arguments

### 92.4 Render Resources

Use render-specific buffers/textures for:

* detached sheet vertex streams
* ribbon mesh control data
* patch mesh index/vertex expansion inputs
* spray billboards or point sprites
* thickness/refraction/transmission auxiliary maps if needed

---

## 93. Attached Surface Texture Layout

### 93.1 Texture Resolution Strategy

The attached surface domain should remain the highest-coverage representation in the system. It is usually the cheapest place to spend resolution.

Possible strategy:

* one primary simulation resolution
* one or more reduced-resolution helper fields
* optional display-upsampled diagnostics

### 93.2 Suggested Field Packing

A practical packing strategy may include:

* texture A: `eta`, `etaDot`
* texture B: `U.x`, `U.y`
* texture C: `R`, `C`
* texture D: `M`, `A`
* texture E: optional helper channels such as impact memory and foam seed

Actual packing should reflect format availability, filtering needs, and update frequency.

### 93.3 Precision Choices

The system should prefer lower precision only where it is safe. Examples:

* `R`, `C`, `M`, `A` often tolerate reduced precision
* `eta`, `etaDot`, and `U` may require higher stability depending on scale and update math

The implementation should test half precision aggressively, but not worship it blindly. Wrong precision becomes glittering chaos very quickly.

---

## 94. Rupture Patch Buffer Design

### 94.1 Why a Patch Buffer Exists

The patch buffer bridges dense surface fields and sparse detached structures.

### 94.2 Patch Record Schema

A rupture patch record may store:

* patch id
* active flag
* bounding box in surface texel space
* centroid in world/domain space
* average attached-surface height
* average normal
* principal direction
* extent / width / area estimate
* average `R`, `C`, `M`, `A`
* dominant regime class
* birth readiness / priority score
* source time stamp / age

### 94.3 Patch Extraction Workflow

A practical workflow:

1. identify seed texels above threshold
2. assign temporary labels or build seed list
3. grow / merge local regions in compute
4. compact valid regions into patch records
5. compute patch summary statistics

### 94.4 Patch Extraction Complexity Strategy

Do not overcomplicate the first version. An approximate connected-region system plus local peak suppression is enough to begin. The point is coherent event grouping, not perfect image segmentation wizardry.

---

## 95. Detached Sheet Buffer Design

### 95.1 Two-Level Storage Model

Detached sheets are easiest to manage with a two-level model:

* **sheet object buffer** for coarse per-sheet state
* **sheet node/control buffer** for per-node or per-element geometry state

### 95.2 Sheet Object Record

A sheet object record may contain:

* sheet id
* family type
* active flag
* source patch id
* age
* centroid
* average velocity
* orientation frame summary
* total budget
* average thickness
* average stability
* average coherence
* node start offset
* node count
* bounding sphere / AABB
* lod tier
* render mode

### 95.3 Sheet Node Record

A sheet node or strip control point record may contain:

* local or world position
* velocity
* normal
* tangent frame
* thickness
* stretch
* strain rate
* damage
* stability
* carrier link metadata
* edge flag
* active flag

### 95.4 Allocation Strategy

Use a fixed-capacity pool plus free-list or active compaction approach.

A browser engine generally benefits from predictable maximum capacity rather than constantly reallocating buffers like a caffeinated raccoon.

---

## 96. Carrier Buffer Design

### 96.1 Carrier Representation Options

Carriers may be stored as:

* full MLS-MPM particles
* lighter packet proxies for certain event families
* hybrid: true particles near hero events, cheaper packets elsewhere

### 96.2 Carrier Record Schema

A carrier record may include:

* carrier id
* active flag
* position
* velocity
* support mass / weight
* support radius or anisotropy parameters
* source sheet id or source patch id
* support density estimate
* turbulence/disorder proxy
* age
* lod tier

### 96.3 Packet Alternative

For some non-hero detached events, a packet record may be more efficient than a large true particle swarm.

A packet record can hold:

* centroid
* dominant direction
* radius/extent
* momentum magnitude
* coherence / instability
* reentry likelihood

This is especially useful when the goal is impressionistic support rather than precise internal fluid evolution.

---

## 97. Fragment Buffer Design

### 97.1 Fragment Types

Fragments may include:

* droplets
* spray particles
* mist sprites
* aeration seeds

### 97.2 Fragment Record Schema

A fragment record may contain:

* fragment id
* active flag
* type
* position
* velocity
* size / radius
* lifetime
* brightness/opacity proxy
* source regime
* recollision / reentry flag
* lod tier

### 97.3 Fragment Pool Strategy

Fragments should use aggressive caps, kill rules, and LOD collapse. Fine spray is visually useful but happily infinite if left unsupervised.

---

## 98. Event Buffer Design

### 98.1 Why an Event Buffer Helps

Rather than letting every stage mutate every other structure directly, use event buffers to make handoffs explicit and debuggable.

### 98.2 Example Event Types

An event record may represent:

* patch emission request
* sheet birth
* carrier birth
* sheet tear
* fragment birth
* recapture request
* reentry impulse
* merge request

### 98.3 Benefits

Event buffers provide:

* decoupled pass design
* easier debugging
* explicit instrumentation
* cleaner synchronization boundaries

They are the bureaucrats of the system, which sounds dull until you realize bureaucracy is what keeps the goblins from stealing your budgets.

---

## 99. Append, Compact, and Indirect Workflow

### 99.1 Why This Workflow Matters

Detached structures are sparse and variable. Therefore the engine should rely on append/compact patterns rather than scanning full-capacity pools blindly.

### 99.2 Canonical Sparse Workflow

Typical pattern:

1. generate candidates into append buffer
2. compact or filter candidates
3. produce active list and count
4. drive downstream dispatch or draw with indirect arguments

### 99.3 Where to Use It

This pattern is useful for:

* rupture patch extraction
* emission events
* active sheet list generation
* tear candidate list generation
* fragment birth list generation
* recapture candidate list generation

### 99.4 Stability Rule

Always clear and validate counters explicitly. Counter corruption is the sort of tiny implementation gremlin that can cost a full day and three spiritual crises.

---

## 100. Suggested High-Level WebGPU Pass Graph

### 100.1 Dense Surface Passes

1. **wave step pass** — update `eta` and `etaDot`
2. **surface momentum pass** — update `U`
3. **intent field pass** — compute/update `R`, `C`, `M`, `A`
4. **surface helper pass** — optional derived fields: slope, curvature, divergence, impact memory

### 100.2 Patch and Event Passes

5. **rupture seed pass** — mark seed texels or generate seed list
6. **patch extraction pass** — group seeds into patches
7. **patch summary pass** — compute patch statistics
8. **event resolve pass** — choose bulge, sheet, jet, packet, or spray actions

### 100.3 Detached Regime Passes

9. **sheet birth pass** — allocate sheet objects/nodes
10. **carrier birth pass** — allocate carriers or packets
11. **carrier update pass** — advance detached carriers
12. **sheet support pass** — ingest carrier support into sheets
13. **sheet geometry pass** — update node positions, frames, stretch, thickness
14. **sheet stability pass** — update necking, damage, tear candidates
15. **sheet tear pass** — produce child sheets or fragment births

### 100.4 Fragment and Return Passes

16. **fragment birth/update pass** — create and step spray/mist/droplets
17. **recontact pass** — detect sheet/surface, carrier/surface, fragment/surface interactions
18. **recapture routing pass** — compute return channels to surface fields
19. **surface feedback pass** — inject impulse, refill, foam, or momentum return

### 100.5 Render Preparation Passes

20. **sheet render prep pass** — expand strip/patch data into draw buffers
21. **fragment render prep pass** — build billboard or point draw data
22. **diagnostic render prep pass** — optional debug overlays and vector glyph buffers

This is a conceptual graph. Actual implementation may merge some passes for performance or clarity.

---

## 101. Synchronization and Frame Staging

### 101.1 Temporal Philosophy

The engine should decide early whether detached feedback is applied within the same frame or deferred to the next. Either choice can work if it is consistent and tuned around.

### 101.2 Practical Recommendation

A practical browser implementation often benefits from:

* current-frame detached simulation
* end-of-frame feedback accumulation
* next-frame surface ingestion of that feedback

This avoids fragile same-frame dependency chains.

### 101.3 Ping-Pong Strategy

Dense surface textures should typically ping-pong.
Sparse buffers may use in-place update where safe, but many event lists benefit from separate input/output buffers per stage.

### 101.4 Debugging Synchronization

Expose mode toggles for:

* one-frame-late feedback
* same-frame feedback where possible
* frozen feedback
* frozen detached layer

These modes are enormously useful during diagnosis.

---

## 102. LOD Architecture

### 102.1 Why LOD Must Be Built In Early

Detached structures can explode in count during energetic scenes. LOD must be part of the design, not a desperate patch after the house is already on fire.

### 102.2 Regime-Specific LOD

#### Attached Surface LOD

* different sim resolution tiers
* optional display refinement separate from simulation

#### Patch/Event LOD

* suppress low-priority rupture patches
* merge nearby minor events
* enforce per-frame birth budgets

#### Sheet LOD

* reduce node density for distant sheets
* downgrade far sheets to ribbons or even packets
* retire low-importance sheets earlier

#### Carrier LOD

* use true particles for hero zones
* use packets or reduced carrier counts for mid/far zones

#### Fragment LOD

* aggressively prune mist and micro-droplets at distance
* collapse fine spray into volumetric/fog-like or screen-space impression

### 102.3 Importance Metrics

Importance can combine:

* screen size
* distance to camera
* centrality in frame
* brightness/specular visibility potential
* source event intensity
* user-selected hero region flags

---

## 103. Rendering Architecture

### 103.1 Attached Surface Rendering

The attached surface should remain the dominant render anchor.

Typical components:

* displaced grid or mesh
* normals from `eta`
* optional thickness/foam/roughness modulation
* refraction/reflection and shading models

### 103.2 Detached Sheet Rendering

Detached coherent sheets should render as sparse explicit geometry or geometry-like constructs.

Good practical options:

* ribbon strips for ligaments and lips
* triangulated patch meshes for fans and crowns
* optional local implicit refinement for hero shots

### 103.3 Carrier Rendering

Carriers should often be invisible or only indirectly visible. Their job is support. Render them directly only in debug modes or special stylized modes.

### 103.4 Fragment Rendering

Fragments may render as:

* billboards
* point sprites
* tiny mesh droplets for very high-end hero shots
* mist/aeration proxies

### 103.5 Cross-Regime Shading Consistency

The renderer should preserve continuity of:

* base water color
* reflectance behavior
* foam/aeration cues
* thickness-dependent translucency
* transition from coherent water to spray

This prevents detached regimes from looking like unrelated visual species.

---

## 104. Sheet Render Preparation

### 104.1 Why a Prep Pass Exists

Simulation-friendly sheet storage is not always draw-friendly. Therefore a render prep pass should convert active sheet state into explicit draw data.

### 104.2 Ribbon Expansion

For strip-like sheets:

* read centerline/control points
* compute per-segment frames
* expand to ribbon vertices
* generate thickness-aware normals / widths

### 104.3 Patch Expansion

For patch-like sheets:

* read patch nodes
* triangulate local topology or use pre-baked connectivity
* emit vertex attributes for shading

### 104.4 Optional Sheet Thickness Textures

Hero modes may produce local thickness maps or projected thickness accumulations for better translucency.

---

## 105. Diagnostics Architecture

### 105.1 Diagnostics Are Not Optional

This system is too complex to tune blind. Diagnostics must be integrated at the resource and pass level.

### 105.2 Surface Diagnostics

Support visualizing:

* `eta`
* `etaDot`
* `U`
* `R`
* `C`
* `M`
* `A`
* curvature, divergence, impact memory

### 105.3 Sparse Diagnostics

Support overlays for:

* rupture patch boundaries
* patch ids and priorities
* active sheet bounds
* sheet node thickness
* necking severity
* tear candidates
* carrier support density
* recapture zones

### 105.4 Counter Diagnostics

Display counts each frame for:

* seed texels
* extracted patches
* sheet births
* active sheets
* active nodes
* carriers
* fragments
* recapture events
* dropped / LOD-culled events

### 105.5 Timing Diagnostics

Measure GPU time or approximate pass cost for:

* dense surface passes
* patch extraction
* detached updates
* fragment steps
* render prep

Without this, optimization becomes ceremonial chanting.

---

## 106. Instrumentation and Replay Strategy

### 106.1 Event Logging

For development, log compact histories of:

* patch births
* sheet births
* tear events
* recapture events
* major reentry impulses

### 106.2 Freeze/Replay Modes

Useful debug modes include:

* freeze attached surface
* freeze detached sheets
* replay last N rupture events
* single-step detached update
* isolate one patch family

### 106.3 Hero Event Capture

Allow targeted capture of a strong event for repeated tuning. Water debugging benefits enormously from letting one beautiful disaster replay over and over.

---

## 107. Incremental Rollout Plan

### 107.1 Stage 1 — Surface Field Upgrade

Implement:

* `U`, `R`, `C`, `M`
* diagnostic views
* basic rupture patch extraction

Do not birth sheets yet.

### 107.2 Stage 2 — Simple Event Emission

Implement:

* patch-based packet / jet events
* surface reservoir drain
* reentry impulse return

Still no full detached sheet layer.

### 107.3 Stage 3 — Minimal Detached Sheet Prototype

Implement:

* one ribbon family
* one patch family
* explicit thickness and necking
* local spray conversion
* basic recapture

### 107.4 Stage 4 — Carrier Support Integration

Implement:

* carrier neighborhoods
* sheet support/stability coupling
* improved reentry and recontact

### 107.5 Stage 5 — Full Sparse Hybrid Layer

Implement:

* multiple sheet families
* merge/split logic
* richer LOD policies
* full diagnostics and event replay

This staged rollout prevents the implementation from detonating into an un-debuggable cathedral immediately.

---

## 108. Memory and Budget Planning

### 108.1 Define Hard Caps Early

Before implementation, define maximum capacities for:

* active rupture patches
* active sheet objects
* active sheet nodes
* active carriers
* active fragments
* per-frame births

### 108.2 Design for Graceful Saturation

When limits are hit, degrade gracefully:

* prioritize hero events
* merge or suppress low-priority events
* downgrade far sheets to packets or spray proxies
* shorten fragment lifetimes

### 108.3 Avoid Dynamic Allocation Churn

Prefer persistent buffers and resettable counters. Allocation churn in browser GPU workflows is a subtle performance tax and a stability gremlin.

---

## 109. Browser-Specific Engineering Constraints

### 109.1 Bind Group Discipline

Keep resource grouping legible. The more sprawling and unstable the bind model, the more likely the implementation becomes a nest of mismatched layouts and mysterious validation errors.

### 109.2 Minimize Readback Dependence

Do not depend heavily on CPU readbacks for runtime behavior. Use GPU-side counters and on-screen diagnostics where possible.

### 109.3 Prefer Predictable Dispatch Shapes

Dense passes should use regular dispatches. Sparse passes should rely on compact active counts and indirect workflows.

### 109.4 Be Careful with Synchronization Complexity

A theoretically elegant pass graph is useless if it requires brittle barriers or subtle ordering assumptions the browser implementation cannot keep sane.

### 109.5 Optimize for Mid-Range Hardware First

If the architecture only survives on monster hardware, it is not yet wise. The system should scale down cleanly.

---

## 110. Failure Modes of the Implementation Layer

### 110.1 Resource Bloat Failure

Too many textures, too many full-resolution helpers, too many always-live sparse pools.

Symptoms:

* bandwidth collapse
* memory exhaustion
* unusable mobile or laptop performance

### 110.2 Pass Explosion Failure

Too many tiny passes with poor batching.

Symptoms:

* excessive overhead
* difficult debugging
* synchronization confusion

### 110.3 Sparse Chaos Failure

Append/compact workflow is under-instrumented or poorly bounded.

Symptoms:

* phantom structures
* corrupted counters
* impossible active counts

### 110.4 Render Drift Failure

Simulation data and render-prep data fall out of sync.

Symptoms:

* popping geometry
* detached sheet ghosts
* fragments rendering after logical death

### 110.5 Diagnostic Poverty Failure

Too little introspection.

Symptoms:

* parameter tuning becomes mystical suffering
* no one knows whether the math or the implementation is wrong

---

## 111. Minimal Browser Prototype Specification

### 111.1 Dense Surface

Implement 2D textures for:

* `eta`
* `etaDot`
* `U`
* `R`
* `C`
* `M`

### 111.2 Sparse Buffers

Implement fixed-capacity pools for:

* rupture patches
* sheet objects
* sheet nodes
* carrier packets
* fragments

### 111.3 Pass Sequence

Implement this minimal pass list:

1. wave step
2. intent field update
3. patch extraction
4. event resolve
5. sheet/packet birth
6. carrier update
7. sheet update
8. fragment update
9. recapture routing
10. render prep
11. render

### 111.4 Mandatory Debug Overlays

At minimum, expose:

* `R`
* `U`
* patch boundaries
* sheet thickness
* active counters

This is enough to test the core architecture honestly.

---

## 112. What This Volume Establishes

This volume translates the encyclopedia from conceptual architecture into a practical WebGPU system design.

It establishes:

* which parts should be dense textures versus sparse buffers
* how detached objects and events should be stored
* how append/compact workflows should orchestrate sparse behavior
* how the pass graph can be staged
* how the renderer should receive data
* how diagnostics, replay, and incremental rollout should be treated as core engineering concerns

This is the layer that makes the hybrid water system implementable rather than merely admirable.

---

## 113. What the Next Volume Should Solve

The next volume should move from architecture into explicit formulas, data layouts, and pseudocode.

It should define:

* exact struct schemas
* exact update equations or normalized approximations
* patch extraction pseudocode
* necking and tear pseudocode
* recapture routing pseudocode
* recommended shader pass interfaces

---

## 114. Planned Next Volume

**Volume V — Concrete Data Layouts, Pseudocode, and Shader-Oriented Implementation Contracts**

That volume should answer:

* what the exact WGSL-friendly structs should look like
* how each pass reads and writes resources
* how to compute the first practical versions of `R`, `C`, `M`, and `U`
* how to prototype patch extraction and detached-sheet updates without architectural ambiguity
* how to make the first implementation robust enough to iterate on rapidly

---

# Volume V — Concrete Data Layouts, Pseudocode, and Shader-Oriented Implementation Contracts

## A pragmatic specification for first implementation, normalized formulas, pass interfaces, and prototype-ready logic

---

## 115. Goal of This Volume

The previous volumes define the ontology, field semantics, detached-sheet regime, coupling architecture, and browser implementation structure. This volume narrows the system into something a coding agent can begin implementing with far less ambiguity.

The goal is not to freeze the final perfect equations forever. The goal is to define:

* a stable first-pass data contract
* practical normalized field formulas
* pass-by-pass input/output expectations
* sparse object pool layouts
* pseudocode robust enough to support rapid iteration

This volume intentionally favors:

* clarity over theoretical purity
* controllable approximations over overfitted pseudo-physics
* explicit data ownership over magical hidden coupling

---

## 116. Numeric and Layout Conventions

### 116.1 Coordinate Spaces

The implementation should distinguish clearly between:

* **surface grid space** — integer texel coordinates `(i,j)`
* **surface domain space** — normalized or simulation-plane coordinates `(x,z)`
* **world space** — full 3D coordinates `(x,y,z)`
* **sheet local space** — local strip/patch coordinates `(s,r)` or `(u,v)`

### 116.2 Time Step Symbols

Use:

* `dt` — frame delta or sim substep delta
* `subDt` — inner detached update substep where needed

### 116.3 Normalization Philosophy

Any field that blends multiple ingredients should use normalized inputs.

Practical pattern:

`norm(x; lo, hi) = saturate((x - lo) / max(hi - lo, eps))`

This keeps field tuning legible.

### 116.4 Stable Utility Functions

Useful utility functions:

* `saturate(x)`
* `safeNormalize(v)`
* `smoothstep(a,b,x)`
* `remapClamped(x, inLo, inHi, outLo, outHi)`
* `lerp(a,b,t)`
* `approach(a,b,rate,dt)`

These should be implemented centrally and reused shamelessly.

---

## 117. Suggested Texture Formats and Packing

### 117.1 Surface Textures

A first practical layout may use:

* `texSurfaceA`: `rg16f` or `rgba16f`

  * `r = eta`
  * `g = etaDot`
* `texSurfaceB`: `rg16f`

  * `rg = U.xy`
* `texSurfaceC`: `rg16f`

  * `r = R`
  * `g = C`
* `texSurfaceD`: `rg16f`

  * `r = M`
  * `g = A`
* `texSurfaceE` (optional): `rg16f`

  * `r = impactMemory`
  * `g = foamSeed or cooldown`

### 117.2 Helper Textures

Optional helper fields may be stored transiently or recomputed:

* curvature
* slope magnitude
* divergence of `U`
* support feedback splats from recapture

### 117.3 Ping-Pong Scheme

At minimum, ping-pong:

* `eta/etaDot`
* `U`
* latent fields when updated in-place hazards become annoying

If the implementation can avoid extra ping-pong by safe read/write separation, excellent. But do not save one texture only to summon race-condition gremlins.

---

## 118. WGSL-Friendly Struct Sketches

### 118.1 Rupture Patch Record

A compact patch record could conceptually be:

```text
struct RupturePatch {
  id: u32;
  active: u32;
  regimeHint: u32;
  priority: f32;

  minIJ: vec2<u32>;
  maxIJ: vec2<u32>;

  centroidXZ: vec2<f32>;
  centroidY: f32;
  area: f32;

  avgNormal: vec3<f32>;
  avgR: f32;
  avgC: f32;
  avgM: f32;
  avgA: f32;

  dirXZ: vec2<f32>;
  extent: vec2<f32>;
  birthBudget: f32;
  age: f32;
};
```

### 118.2 Detached Sheet Object Record

```text
struct DetachedSheet {
  id: u32;
  active: u32;
  family: u32;
  lodTier: u32;

  sourcePatchId: u32;
  nodeStart: u32;
  nodeCount: u32;
  flags: u32;

  age: f32;
  totalBudget: f32;
  avgThickness: f32;
  avgStability: f32;

  centroid: vec3<f32>;
  avgVelocity: vec3<f32>;

  tangent: vec3<f32>;
  bitangent: vec3<f32>;
  normal: vec3<f32>;

  bboxMin: vec3<f32>;
  bboxMax: vec3<f32>;
};
```

### 118.3 Detached Sheet Node Record

```text
struct SheetNode {
  active: u32;
  edgeFlag: u32;
  carrierLinkStart: u32;
  carrierLinkCount: u32;

  pos: vec3<f32>;
  thickness: f32;

  vel: vec3<f32>;
  stretch: f32;

  normal: vec3<f32>;
  strainRate: f32;

  tangent: vec3<f32>;
  damage: f32;

  stability: f32;
  neckScore: f32;
  aux0: f32;
  aux1: f32;
};
```

### 118.4 Carrier Record

```text
struct Carrier {
  id: u32;
  active: u32;
  sourceSheetId: u32;
  flags: u32;

  pos: vec3<f32>;
  supportMass: f32;

  vel: vec3<f32>;
  supportDensity: f32;

  anisotropy: vec3<f32>;
  disorder: f32;

  age: f32;
  lodTier: f32;
  aux0: f32;
  aux1: f32;
};
```

### 118.5 Fragment Record

```text
struct Fragment {
  id: u32;
  active: u32;
  type: u32;
  flags: u32;

  pos: vec3<f32>;
  radius: f32;

  vel: vec3<f32>;
  lifetime: f32;

  opacity: f32;
  sourceEnergy: f32;
  aux0: f32;
  aux1: f32;
};
```

### 118.6 Event Record

```text
struct HybridEvent {
  type: u32;
  sourceId: u32;
  targetId: u32;
  flags: u32;

  pos: vec3<f32>;
  scalar0: f32;

  dir: vec3<f32>;
  scalar1: f32;

  aux: vec4<f32>;
};
```

These are not sacred tablets. They are good sturdy scaffolds.

---

## 119. Prototype Uniform Blocks

### 119.1 Surface Field Params

A first-pass surface field parameter block may include:

```text
struct SurfaceFieldParams {
  dt: f32;
  invGridSizeX: f32;
  invGridSizeZ: f32;
  surfaceCellSize: f32;

  rSlopeLo: f32;
  rSlopeHi: f32;
  rCurvLo: f32;
  rCurvHi: f32;

  rUpVelLo: f32;
  rUpVelHi: f32;
  rMomLo: f32;
  rMomHi: f32;

  cDisorderLo: f32;
  cDisorderHi: f32;
  cPersistGain: f32;
  cPersistLoss: f32;

  mRefillRate: f32;
  mBaseline: f32;
  mDrainScale: f32;
  mRecaptureScale: f32;

  aRecoverRate: f32;
  aRuptureSuppress: f32;
  aRecaptureBoost: f32;
  padding0: f32;
};
```

### 119.2 Event Resolve Params

```text
struct EventResolveParams {
  rOn: f32;
  rOff: f32;
  cSheetMin: f32;
  mMin: f32;

  jetBias: f32;
  sprayBias: f32;
  packetBias: f32;
  sheetBias: f32;

  maxBirthPerFrame: u32;
  maxSheetBirthsPerFrame: u32;
  maxPacketBirthsPerFrame: u32;
  maxSprayBirthsPerFrame: u32;
};
```

### 119.3 Sheet Params

```text
struct SheetParams {
  dt: f32;
  stretchGain: f32;
  stretchRelax: f32;
  thicknessSmooth: f32;

  neckGain: f32;
  neckDecay: f32;
  tearThreshold: f32;
  damageGain: f32;

  supportGain: f32;
  supportLoss: f32;
  recaptureDist: f32;
  recaptureSpeed: f32;

  edgeFrayGain: f32;
  edgeLigamentBias: f32;
  sprayConvGain: f32;
  padding0: f32;
};
```

---

## 120. First Practical Formulas for Surface Fields

### 120.1 Derived Helpers

At each texel, compute:

* `gradEta`
* `slopeMag = length(gradEta)`
* `kappa = laplacian(eta)`
* `upVel = max(etaDot, 0)`
* `momMag = length(U)`
* `divU`
* `compression = saturate(-divU * compressionScale)`

Normalize these:

* `Nslope = norm(slopeMag; rSlopeLo, rSlopeHi)`
* `Ncurv = norm(abs(kappa); rCurvLo, rCurvHi)`
* `Nup = norm(upVel; rUpVelLo, rUpVelHi)`
* `Nmom = norm(momMag; rMomLo, rMomHi)`

### 120.2 First Rupture Potential Formula

A strong first formula for raw rupture intent:

`Rraw = ws * Nslope + wc * Ncurv + wu * Nup + wm * Nmom + wd * compression + wi * impactMemory + wf * feedbackImpulse + wr * saturate(M)`

Then update with hysteretic smoothing:

`Rnext = saturate( R + dt * (rCharge * Rraw - rDecay * R - cooldown) )`

This is intentionally direct. Fancy later. Honest first.

### 120.3 First Coherence Formula

A practical first coherence metric can combine:

* directional agreement of neighboring `U`
* local ridge alignment from neighboring `gradEta`
* temporal persistence of previous coherence
* penalty from high disorder / noisy shear

Conceptually:

`Craw = aU * momentumAlignment + aG * ridgeAlignment + aP * prevC - aD * disorder`

Then:

`Cnext = saturate( C + dt * (cGain * Craw - cLoss * C) )`

Where `disorder` can start as a cheap proxy like local variance of `U` direction and sign variation of curvature.

### 120.4 First Reservoir Formula

`refill = mRefillRate * (mBaseline - M)`

`Mnext = saturate( M + dt * ( refill + mConvGain * compression + mRecaptureScale * recaptureInput - mDrainPending ) )`

Important: `mDrainPending` should come from actual emitted events, not guessed ahead of time.

### 120.5 First Adhesion Formula

`Araw = aBase + aCalm * (1 - R) + aRec * recaptureHistory - aRupt * R - aOut * outwardLaunch`

`Anext = saturate( A + dt * (aRecoverRate * Araw - aLoss * A) )`

This is good enough to create meaningful return gradients without pretending we discovered a new law of the universe.

---

## 121. Surface Momentum `U` Prototype Logic

### 121.1 First Practical Philosophy

Do not attempt an overcomplicated fluid-accurate 2D momentum derivation on day one. Start with a controllable transport field that is good enough to drive detachment direction.

### 121.2 Inputs to `U`

A first implementation can combine:

* previous `U`
* wave packet direction injection if available
* tangential body forcing
* radial impact forcing from recent collisions
* recapture/reentry tangential momentum return
* damping and mild blur/diffusion

### 121.3 Prototype Update

Conceptually:

`Unext = Udamped + Uwave + Uimpact + Ubody + Ureturn`

Where:

* `Udamped = U * exp(-uDamp * dt)`
* `Uimpact` pushes outward from recent impact centers
* `Ubody` follows body motion projected onto the surface
* `Ureturn` comes from reentry events

Optionally add a small diffusion / neighborhood blend:

`Unext = lerp(Unext, neighborhoodMeanU, uDiffuse)`

This is crude, but effective enough to orient first detached births.

---

## 122. Patch Extraction Pseudocode

### 122.1 Seed Identification

A texel is a seed if:

* `R > rOn`
* `M > mMin`
* not in cooldown
* not already heavily suppressed by a nearby dominant patch

### 122.2 Prototype Seed Pass

```text
for each texel:
  if isSeed(texel):
    append seed index to seedBuffer
```

### 122.3 Region Growth / Approximate Grouping

For a first prototype, do not build a heroic GPU connected-components cathedral unless truly needed.

A practical approximation:

* sort or bucket seeds spatially if useful
* for each seed, grow a small neighborhood flood within radius `rPatch`
* only include texels with compatible direction and comparable `R`
* mark consumed texels

### 122.4 Patch Summary Pseudocode

```text
for each surviving seed:
  init patch accumulators
  for each texel in local neighborhood:
    if compatible(texel, seed):
      accumulate position, normal, U, R, C, M, A
      mark consumed
  finalize patch stats
  append patch if area >= areaMin
```

### 122.5 Compatibility Heuristic

A texel is compatible if:

* distance to seed < radius
* `R` above lower patch threshold
* direction difference with seed `U` < dirThreshold
* optional curvature sign compatibility

This is enough to get useful coherent patches without pretending to solve computer vision in a puddle.

---

## 123. Event Resolution Pseudocode

### 123.1 Purpose

Each patch must resolve into one dominant action.

### 123.2 Prototype Scores

Compute rough scores:

* `sheetScore = avgR * avgC * saturate(avgM) * sheetBias`
* `jetScore = avgR * (1 - avgC * 0.5) * verticality * jetBias`
* `packetScore = avgR * (1 - avgC) * packetBias`
* `sprayScore = avgR * lowSupportHint * (1 - avgC) * sprayBias`

Where `verticality` may come from normal alignment or impact direction, and `lowSupportHint` can come from disorder or previous sheet failure history.

### 123.3 Prototype Resolve

```text
for each patch by priority:
  if birthBudgetExhausted: continue
  scores = computeScores(patch)
  regime = argmax(scores)
  if regime score < minEventScore: continue
  emit event(regime, patch)
  reserve patch.birthBudget from M drain map
```

### 123.4 Important Rule

Only one dominant event per patch per frame, unless there is an explicit edge-spray secondary path.

---

## 124. Sheet Birth Pseudocode

### 124.1 Ribbon Birth

```text
function birthRibbonFromPatch(patch):
  sheet = allocSheet()
  if invalid(sheet): return

  dir = safeNormalize(patch.dirXZ.x, 0, patch.dirXZ.y)
  n = safeNormalize(patch.avgNormal)
  t = safeNormalize(cross(vec3(0,1,0), dir))

  sheet.family = FAMILY_RIBBON
  sheet.centroid = vec3(patch.centroidXZ.x, patch.centroidY, patch.centroidXZ.y)
  sheet.normal = n
  sheet.tangent = dir
  sheet.bitangent = t
  sheet.totalBudget = patch.birthBudget
  sheet.avgThickness = estimateInitialThickness(patch)

  nodeCount = chooseRibbonNodeCount(patch.extent)
  nodeStart = allocNodes(nodeCount)
  if invalid(nodeStart): free(sheet); return

  for k in 0..nodeCount-1:
    s = remap(k, 0, nodeCount-1, -0.5, 0.5)
    pos = sheet.centroid + dir * (s * patch.extent.x)
    vel = synthesizeBirthVelocity(patch, s)
    init node[k] with pos, vel, thickness, stretch=1, damage=0, stability=1

  append sheet active
```

### 124.2 Patch Birth

Similar, but initialize a small 2D node grid using patch extent major/minor axes.

---

## 125. Birth Velocity Synthesis Pseudocode

### 125.1 Inputs

Use:

* patch normal `n`
* forward direction `p`
* lateral direction `t`
* patch regime family
* patch severity and coherence

### 125.2 Prototype Formula

```text
lift  = n * (baseLift + liftScale * patch.avgR)
throw = p * (throwScale * length(patch.dirXZ) * patch.avgC)
spread = t * (spreadScale * lateralShape(s))
noise = randomVec3(seed) * noiseScale
v0 = lift + throw + spread + noise
```

For jets, increase `lift` and reduce `spread`.
For crowns, orient `p` radially from impact center.
For ribbons, keep `throw` dominant.

---

## 126. Carrier Birth Prototype

### 126.1 Simple Option

Birth a small cluster of carriers per sheet node or per major sheet segment.

### 126.2 Prototype Logic

```text
for each new sheet node:
  spawn N carriers near node.pos
  carrier.vel = node.vel + smallAnisotropicJitter
  carrier.supportMass = node.thickness * supportScale
  carrier.sourceSheetId = sheet.id
```

### 126.3 Packet Shortcut

A cheaper first version can skip dense carriers for many events and use a single packet or a few packet records to support the detached sheet globally.

That is a good cheat. Use it shamelessly until the system proves itself worthy of denser support.

---

## 127. Sheet Support Update Pseudocode

### 127.1 Purpose

Sheet nodes need support information from nearby carriers or packets.

### 127.2 Prototype Support Metric

For each node, accumulate from linked carriers:

* weighted mean velocity
* support density
* disorder

```text
for each node:
  sumW = 0
  sumVel = 0
  sumDensity = 0
  sumDisorder = 0
  for each linked carrier:
    w = supportKernel(distance(node.pos, carrier.pos))
    sumW += w
    sumVel += w * carrier.vel
    sumDensity += w * carrier.supportDensity
    sumDisorder += w * carrier.disorder
  if sumW > eps:
    nodeSupportVel = sumVel / sumW
    nodeSupportDensity = sumDensity / sumW
    nodeDisorder = sumDisorder / sumW
```

### 127.3 Support Blending

Blend node velocity toward support velocity rather than hard-snapping.

`node.vel = lerp(node.vel, nodeSupportVel, supportGain * dt)`

This keeps the skin riding the flesh without becoming nailed to it.

---

## 128. Stretch and Thickness Update Pseudocode

### 128.1 Stretch

For ribbon nodes, estimate axial stretch from neighboring node separation.

```text
restLen = restSegmentLength(node i, i+1)
curLen = length(pos[i+1] - pos[i])
localStretch = curLen / max(restLen, eps)
```

For patch nodes, estimate principal stretch from neighboring edges or local Jacobian approximations.

### 128.2 Thickness Update

A good first approximation:

`targetThickness = sheetMassLocal / max(localAreaEstimate, eps)`

Then smooth toward it:

`node.thickness = lerp(node.thickness, targetThickness, thicknessGain * dt)`

### 128.3 Support-Aware Thickness

Let better carrier support modestly resist thinning:

`targetThickness *= lerp(1.0, supportBoost, saturate(nodeSupportDensity))`

This is not literal physics. It is good hybrid engineering.

---

## 129. Necking and Damage Prototype

### 129.1 Neck Score

A useful first neck score:

`thinness = 1 - norm(node.thickness; thickLo, thickHi)`

`stretchExcess = saturate((node.stretch - stretchNeckLo) / (stretchNeckHi - stretchNeckLo))`

`supportLoss = 1 - saturate(nodeSupportDensity)`

`neckRaw = kThin * thinness + kStretch * stretchExcess + kSupport * supportLoss`

`node.neckScore = saturate( node.neckScore + dt * (neckGain * neckRaw - neckDecay * node.neckScore) )`

### 129.2 Damage

```text
node.damage += dt * damageGain * max(0, node.neckScore - neckDamageStart)
node.damage = saturate(node.damage)
```

This makes fragile areas remember they were stressed instead of recovering instantly like nothing happened. Water is weird, but not that weird.

---

## 130. Tear Decision Prototype

### 130.1 Tear Condition

A node or segment becomes a tear candidate if:

* `neckScore > neckTearThreshold`
* `damage > damageThreshold`
* `stability < stabilityMin`
* optional edge-specific fray logic

### 130.2 Ribbon Tear Pseudocode

```text
for each segment:
  if tearCandidate(segment):
    if isEdge(segment):
      emitEdgeSprayOrLigament(segment)
    else:
      splitRibbonAt(segment)
      emitPinchDroplets(segment)
```

### 130.3 Patch Tear Pseudocode

For a patch grid, mark cells or edges as broken and either:

* create child patches
* punch holes
* convert local regions to spray

A first prototype should keep this simple: local region to spray + patch shrink is enough.

---

## 131. Fragment Birth Prototype

### 131.1 Simple Spray Spawn

```text
function emitSprayFromTear(pos, vel, severity):
  count = chooseSprayCount(severity)
  for i in 0..count-1:
    frag = allocFragment()
    frag.pos = pos + jitterPos(i)
    frag.vel = vel + sprayConeJitter(i, severity)
    frag.radius = remapRandom(severity)
    frag.lifetime = baseLife + randomLife
    frag.opacity = 1
```

### 131.2 Ligament Pinch-Off

For neck pinch-off, create:

* one or two larger droplets
* optional fine mist trail

That is much better than vaporizing the whole region into confetti.

---

## 132. Recapture Routing Pseudocode

### 132.1 Recapture Candidate

A detached object is a recapture candidate if:

* distance to attached surface < `recaptureDist`
* relative normal velocity < `recaptureSpeed`
* local adhesion `A` sampled at projection point is high enough

### 132.2 Prototype Routing

```text
for each detached object:
  surfPos = projectToSurfaceXZ(object.pos)
  surfY = sampleEta(surfPos)
  dist = object.pos.y - surfY
  relVN = dot(object.vel - surfaceVelAt(surfPos), surfaceNormalAt(surfPos))

  if dist < recaptureDist and relVN < recaptureSpeed:
    recaptureMass = objectBudget * recaptureFrac
    appendRecaptureEvent(surfPos, recaptureMass, object.vel)
    reduce object budget
    if object budget < retireThreshold:
      retire object
```

### 132.3 Surface Feedback from Recapture Event

```text
for each recapture event:
  add to M at surfPos
  add small impulse to etaDot
  add tangential return to U
  optionally add foam/aeration seed depending on impact energy
```

This is enough to make the loop feel alive.

---

## 133. Surface Drain Map Contract

### 133.1 Why a Drain Map Helps

When events are resolved from patches, multiple nearby events may want to drain the same reservoir region. A drain map makes this explicit.

### 133.2 Prototype Contract

* event resolve pass writes pending drain contributions into a drain texture or buffer
* latent-field update consumes drain map on next update
* `Mnext` subtracts drain amount and clamps to nonnegative

### 133.3 Benefit

This avoids hidden budget theft and makes emission accounting debuggable.

---

## 134. First Pass Interface Contracts

### 134.1 Intent Field Pass

Inputs:

* `eta`, `etaDot`, `U`, previous `R/C/M/A`
* impact memory / return splats / drain map
* `SurfaceFieldParams`

Outputs:

* updated `R/C/M/A`
* optional helper outputs

### 134.2 Patch Extraction Pass

Inputs:

* `R/C/M/A/U`
* thresholds

Outputs:

* seed buffer
* patch buffer
* patch count

### 134.3 Event Resolve Pass

Inputs:

* patch buffer
* event params
* active structure counts / budget caps

Outputs:

* event buffer
* drain map contributions

### 134.4 Sheet Birth Pass

Inputs:

* event buffer
* surface fields / patch buffer
* free-list or active pool metadata

Outputs:

* new sheet records
* node records
* optional carrier birth requests

### 134.5 Sheet Update Pass

Inputs:

* sheet object buffer
* node buffer
* carrier support buffer or packet buffer
* `SheetParams`

Outputs:

* updated sheet/node state
* tear events
* recapture events

These contracts should be documented before implementation. Otherwise the system will slowly transform into folklore.

---

## 135. Prototype Dispatch Strategy

### 135.1 Dense Passes

Use standard 2D workgroups, for example:

* 8x8 or 16x16 texel groups

### 135.2 Sparse Passes

Use 1D dispatch over active counts:

* patches
* events
* sheets
* nodes
* carriers
* fragments

### 135.3 Compaction Timing

Compact when:

* candidate generation creates lots of dead entries
* a pass needs a contiguous active list
* render prep needs only active live objects

Do not compact after every micro-step unless profiling proves it worthwhile.

---

## 136. Recommended First Prototype Defaults

### 136.1 Surface Fields

Start with:

* `R` driven mostly by slope, curvature, up velocity, and impact memory
* `C` driven mostly by neighborhood directional agreement
* `M` with simple refill baseline and event drain
* `U` with body forcing + impact radial impulse + damping

### 136.2 Detached Types

Start with only:

* one ribbon family
* one packet family
* simple spray fragments

### 136.3 Keep It Honest

Do not add five sheet families before one ribbon family behaves well. That way lies an empire of parameters and no good water.

---

## 137. Prototype Tuning Order

Tune in this order:

1. attached surface fields and diagnostics
2. patch extraction quality
3. event resolution stability
4. ribbon birth direction and velocity feel
5. thickness and necking timing
6. tear and spray conversion
7. recapture feel
8. carrier support strength
9. performance and LOD

This prevents you from tuning a later-stage symptom while the underlying field logic is still nonsense.

---

## 138. Minimal WGSL Module Partitioning

A clean source partition may look like:

* `surface_fields.wgsl`
* `surface_helpers.wgsl`
* `patch_extract.wgsl`
* `event_resolve.wgsl`
* `sheet_birth.wgsl`
* `sheet_update.wgsl`
* `sheet_tear.wgsl`
* `carrier_update.wgsl`
* `fragment_update.wgsl`
* `recapture_route.wgsl`
* `render_sheet_prep.wgsl`
* `debug_overlay.wgsl`

Plus shared include-style modules or generated code for:

* math utils
* field normalization
* struct definitions
* random/hash helpers

This keeps the implementation legible and keeps the future you from swearing at the present you.

---

## 139. What This Volume Establishes

This volume establishes the first concrete build contract for the hybrid water system.

It defines:

* actual data shapes
* practical formulas for the main latent fields
* first-pass event resolution logic
* sheet birth/update/tear pseudocode
* recapture and drain contracts
* pass I/O expectations
* a direct path to WGSL module organization

This is the point where the encyclopedia becomes genuinely handoff-ready for a coding agent.

---

## 140. What the Next Volume Should Solve

The next volume should become a development and validation manual.

It should define:

* test scenes
* diagnostics boards
* reference behaviors
* tuning recipes
* failure signatures
* milestone checklist
* hero-event benchmarks

Because a system like this will not be perfected by code alone. It will be perfected by disciplined comparison between intended behavior and observed behavior.

---

## 141. Planned Next Volume

**Volume VI — Diagnostics, Validation, Test Scenes, Tuning Methodology, and Milestone Ladder**

That volume should answer:

* how to know when each regime is behaving correctly
* what debug views must be available at each phase
* what canonical splash scenes to test repeatedly
* how to tune fields and thresholds without getting lost
* what incremental milestone ladder should guide implementation toward a production-capable hybrid water engine









































# Hybrid Water Validation Manual

## Volume VI — Diagnostics, Validation, Test Scenes, Tuning Methodology, and Milestone Ladder

---

## 0. Purpose

This document is a dedicated validation and tuning manual for the hybrid water system described in the main encyclopedia. Its purpose is to prevent the implementation from devolving into parameter folklore, lucky screenshots, and unrepeatable splash accidents.

A water system of this complexity cannot be judged only by whether it looks good in one scene. It must be evaluated across a structured set of regimes, diagnostics, repeatable tests, and milestone gates.

This manual defines:

* what must be visible in diagnostics
* how to tell whether each subsystem is behaving correctly
* what canonical test scenes must exist
* how to tune field and regime parameters in a sane order
* what failure signatures to watch for
* what milestone ladder should govern progress toward a production-capable hybrid water engine

---

## 1. Validation Philosophy

### 1.1 The System Must Be Legible

If the hybrid water system cannot explain itself through diagnostics, it is not yet mature.

Every major behavior should be inspectable through:

* latent field overlays
* sparse object overlays
* active counters
* event logs
* repeatable test scenes
* before/after comparisons

### 1.2 The System Must Be Repeatable

Every major splash behavior should be reproducible through deterministic or near-deterministic setups.

At minimum, the implementation should support:

* resetting to known initial states
* replaying a fixed impact
* replaying a fixed body motion path
* freezing specific subsystems
* stepping frame-by-frame

### 1.3 The System Must Be Tuned by Regime, Not by Chaos

Do not tune everything at once.

Tune in layered order:

1. attached surface fields
2. patch extraction
3. event resolution
4. detached sheet birth and motion
5. necking and breakup
6. recapture and return
7. rendering continuity
8. performance and LOD

### 1.4 A Beautiful Failure Is Still a Failure

If the system produces a stunning splash for the wrong reasons, that may still poison later development.

Validation is not about suppressing beauty. It is about ensuring beauty is structurally reproducible.

---

## 2. Core Diagnostic Panels

A serious implementation should expose a dedicated diagnostics board or panel system. This may be integrated into the app UI as overlays, side panels, toggles, histograms, and timeline widgets.

### 2.1 Surface Scalar Panel

Must be able to display as heatmaps:

* `eta`
* `etaDot`
* `R`
* `C`
* `M`
* `A`
* impact memory
* cooldown / suppression fields
* foam seed or recapture seed fields if present

### 2.2 Surface Vector Panel

Must be able to display:

* `U` as arrows
* `U` as hue-coded azimuth + brightness-coded magnitude
* optional divergence/convergence overlay
* optional slope/normal preview

### 2.3 Patch Panel

Must be able to display:

* rupture seeds
* extracted patch boundaries
* patch ids
* patch principal directions
* patch priority values
* patch regime classification
* patch birth budget

### 2.4 Detached Sheet Panel

Must be able to display:

* active sheet bounds
* family type color coding
* node/control-point locations
* thickness map on the sheet
* stretch map on the sheet
* neck score
* damage score
* edge flags
* tear candidates

### 2.5 Carrier Panel

Must be able to display:

* carrier positions
* support density
* support anisotropy
* disorder / turbulence proxy
* carrier-to-sheet links or neighborhoods in debug mode

### 2.6 Fragment Panel

Must be able to display:

* droplet/spray positions
* fragment type
* lifetime
* source event class
* reentry candidates

### 2.7 Counter / Budget Panel

Must display per-frame and rolling counters for:

* active rupture seeds
* active rupture patches
* event resolves by type
* sheet births
* active sheets
* active sheet nodes
* carriers
* fragments
* recapture events
* dropped / suppressed events
* LOD-culled events
* exhausted birth budget

### 2.8 Timing Panel

Must display pass timing or approximate cost for:

* dense surface passes
* patch extraction
* event resolution
* sheet update
* carrier update
* fragment update
* recapture routing
* render prep
* total frame contribution

### 2.9 Timeline / Event Panel

Must allow inspection of:

* recent major rupture events
* sheet births
* tears
* recaptures
* reentry impulses
* user-triggered test events

This is especially useful for tuning delayed breakup and recapture timing.

---

## 3. Debug Modes

### 3.1 Freeze Modes

The system should support freezing:

* attached surface only
* detached sheets only
* carriers only
* fragments only
* all feedback to surface
* all random noise

### 3.2 Isolation Modes

The system should support rendering only:

* attached surface
* rupture fields
* detached sheets
* carriers
* fragments
* recapture events

### 3.3 Step Modes

The system should support:

* single-frame stepping
* substep stepping for detached dynamics
* event-by-event stepping in debug builds if practical

### 3.4 Replay Modes

The system should support:

* replaying last N frames
* replaying a captured impact event
* replaying a canonical test scene path
* comparing current frame to previous tuning snapshot

---

## 4. Canonical Test Scene Library

A real water engine needs a repeatable set of canonical scenes. These scenes should be available from a debug menu and should be used regularly during development.

### 4.1 Scene A — Calm Surface Impulse

**Purpose:** validate ripples, wave propagation, and surface field stability before detachment is even considered.

Setup:

* calm water plane
* single small vertical impulse at center
* no detached structures allowed initially

What to inspect:

* ripple symmetry
* `eta` and `etaDot` behavior
* `U` behavior under simple impulse
* no spurious rupture patches

Failure signs:

* asymmetry with symmetric forcing
* noisy `R` activations
* unstable momentum field drift

### 4.2 Scene B — Vertical Drop Impact

**Purpose:** validate radial crown logic, reservoir charging, sheet/jet selection, and recapture.

Setup:

* sphere dropped vertically into calm surface
* tunable radius, speed, and depth

What to inspect:

* radial `U` pattern
* central high-rupture region
* crown wall or jet emergence depending on tuning
* coherent detached-sheet birth
* delayed breakup rather than instant confetti
* recapture timing after collapse

Failure signs:

* purely upward nozzle with no crown structure
* infinite emission from impact center
* no recapture, only eternal particle clutter

### 4.3 Scene C — Oblique Impact

**Purpose:** validate azimuth-sensitive detachment and fan/ribbon asymmetry.

Setup:

* sphere enters at a shallow angle
* controllable tangential velocity component

What to inspect:

* `U` directional bias matching impact
* coherent directional fan or ribbon peel
* asymmetrical rupture patch shapes
* forward-leaning detached sheets

Failure signs:

* symmetric emission despite oblique forcing
* vertical jets where fan-like release should occur
* detached structures ignoring directional momentum

### 4.4 Scene D — Fast Surface Skim / Planing Pass

**Purpose:** validate sustained directional rupture patches, repeated emission, edge ligaments, and reentry.

Setup:

* moving body skims across surface
* configurable speed, angle, and contact depth

What to inspect:

* stable wake-driven `U`
* sustained patch extraction without random flicker
* repeated coherent ribbon births from edges
* realistic reentry trail

Failure signs:

* patch chatter
* hose-like repeated jets
* detached sheets born everywhere without coherence

### 4.5 Scene E — Strong Crest / Traveling Wave Packet

**Purpose:** validate non-impact detachment from wave dynamics themselves.

Setup:

* generated traveling wave packet or steep crest
* no rigid body impact

What to inspect:

* crest-driven `R` rise
* coherent crest-lip sheet birth
* forward peel direction from `U`
* plunge and recapture behavior

Failure signs:

* no detachment even at extreme crest conditions
* detachment only from impacts, never from wave geometry
* crest simply turns into bead soup

### 4.6 Scene F — Edge Ligament Stretch Test

**Purpose:** validate thin coherent tendrils, necking, and pinch-off.

Setup:

* force a narrow ribbon-like detached event
* optionally use a tool or controlled sheet edge pull

What to inspect:

* smooth ligament continuity
* thickness reduction with stretch
* neck formation before breakup
* droplet pinch-off timing

Failure signs:

* instant bead chain
* infinite taffy ribbon that never breaks
* visible mesh collapse or parametric artifacts

### 4.7 Scene G — Crown Wall Collapse

**Purpose:** validate edge fray, scalloping, sheet-to-spray transition, and recapture.

Setup:

* energetic vertical impact tuned to form a crown-like structure

What to inspect:

* coherent wall initially
* edge instability later
* local conversion to ligaments and spray
* collapse back to surface with feedback

Failure signs:

* immediate full disintegration
* no edge behavior, only generic spray burst
* crown wall persists too long with no thinning

### 4.8 Scene H — Recontact / Bridge Formation

**Purpose:** validate partial reconnection, bridge sheets, and non-explosive recapture.

Setup:

* detached structure guided back toward surface or another detached patch

What to inspect:

* smooth recontact when velocities are compatible
* partial recapture before full collapse where appropriate
* limited splash if low-speed reconnection

Failure signs:

* every contact becomes violent breakup
* bridge cannot form or reconnect
* detached sheets pass through each other like ghosts

### 4.9 Scene I — Hero Stress Test

**Purpose:** validate simultaneous regimes under production-like intensity.

Setup:

* multiple impacts or one very strong event
* wake, sheet birth, spray, reentry, and recapture all active

What to inspect:

* stable counters
* no budget runaway
* LOD behavior
* performance under load
* cross-regime continuity

Failure signs:

* append/compact chaos
* ghost sheets
* counters exploding
* frame time collapse without graceful degradation

---

## 5. Regime-Specific Validation Questions

Each subsystem should be evaluated by explicit questions rather than by vibes alone.

### 5.1 Attached Surface Questions

* Does the attached surface remain stable in calm and low-energy scenarios?
* Do `R`, `C`, and `M` remain quiet when they should?
* Does `U` match visible wave transport and impact direction?
* Do rupture patches form where expected and not elsewhere?

### 5.2 Patch Extraction Questions

* Are coherent regions grouped correctly?
* Are neighboring hot texels producing one meaningful patch instead of many tiny ones?
* Does patch direction align with visible transport?
* Are patch priorities sensible under multiple simultaneous events?

### 5.3 Event Resolution Questions

* Does the system choose sheet vs jet vs packet vs spray in plausible ways?
* Are event decisions stable over time?
* Are events mass-limited by `M`?
* Does event suppression work when coherence or budget is insufficient?

### 5.4 Detached Sheet Questions

* Do detached sheets preserve continuity long enough to look like water skin?
* Do they stretch and thin plausibly?
* Do they avoid both instant marbling and eternal rubber-sheet behavior?
* Do they move with carrier support instead of ghosting away?

### 5.5 Breakup Questions

* Does necking precede droplet formation?
* Do edges fray before entire sheets explode?
* Is pinch-off timing plausible?
* Is local breakup favored over all-at-once destruction?

### 5.6 Recapture Questions

* Do detached structures return to the main surface when they should?
* Does low-speed recontact produce soft reintegration?
* Does violent reentry produce sensible impulse and foam cues?
* Does recaptured budget visibly affect the surface afterward?

### 5.7 Rendering Questions

* Does detached coherent water still look like the same water species as the attached surface?
* Are sheet silhouettes smooth?
* Is spray visually continuous with breakup rather than a separate particle effect?
* Are lighting and thickness cues consistent across regimes?

### 5.8 Performance Questions

* Does sparse activity remain sparse?
* Are event counts bounded?
* Do LOD gates kick in before catastrophic frame collapse?
* Can the system sustain target performance on non-hero hardware?

---

## 6. Tuning Methodology

### 6.1 General Rule

Tune one layer at a time. Lock it. Then move on.

If you keep changing surface fields while trying to tune sheet tear thresholds, you are not tuning — you are summoning confusion.

### 6.2 Tuning Stage 1 — Surface Fields

Tune:

* `R` activation range
* `C` smoothness and structure bias
* `M` refill/drain feel
* `U` stability and directionality

Do this using:

* calm impulse scene
* oblique impact scene
* traveling wave scene

Success looks like:

* rupture appears only in plausible energetic regions
* directionality is visible and stable
* reservoir is neither dead nor infinite

### 6.3 Tuning Stage 2 — Patch Extraction

Tune:

* seed thresholds
* growth radius
* direction compatibility threshold
* patch min area
* patch suppression / merge behavior

Success looks like:

* one meaningful event region yields one meaningful patch
* minor noise does not become patch spam

### 6.4 Tuning Stage 3 — Event Resolution

Tune:

* sheet vs jet vs packet biases
* per-frame birth caps
* score thresholds
* cooldowns / hysteresis

Success looks like:

* impacts choose different event families appropriately
* no patch chatter
* no multi-family nonsense from a single patch unless deliberate

### 6.5 Tuning Stage 4 — Detached Sheet Birth and Motion

Tune:

* initial thickness
* lift/throw/spread balance
* carrier support blending
* stretch gain and relax

Success looks like:

* detached sheets launch in plausible directions
* they neither collapse instantly nor hover disconnected

### 6.6 Tuning Stage 5 — Necking and Breakup

Tune:

* neck score gains/decays
* damage accumulation
* tear thresholds
* edge fray gains
* spray conversion rates

Success looks like:

* thin ligaments hold briefly, then neck, then pinch off
* crown edges fray progressively

### 6.7 Tuning Stage 6 — Recapture and Return

Tune:

* recapture distance and velocity thresholds
* adhesion recovery and suppression
* return routing into `M`, `U`, and `etaDot`

Success looks like:

* low-energy return re-merges softly
* hard return makes visible wave consequences

### 6.8 Tuning Stage 7 — Rendering and Cross-Regime Continuity

Tune:

* detached-sheet shading
* fragment shading
* thickness cues
* edge appearance
* foam/aeration transitions

Success looks like:

* no visual species jump between attached and detached water
* breakup looks like evolution, not effect switching

### 6.9 Tuning Stage 8 — Performance and LOD

Tune:

* event caps
* sheet node counts
* fragment counts
* compaction frequency
* LOD downgrade thresholds

Success looks like:

* target frame time maintained under hero events
* graceful degradation rather than catastrophic collapse

---

## 7. Failure Signature Atlas

This section should be used during debugging to identify the likely source of a problem from its visible symptoms.

### 7.1 Symptom: Water Emits Straight Up Like a Hose

Likely causes:

* `U` too weak or ignored
* lift term too dominant in birth velocity synthesis
* patch direction extraction poor or noisy
* event resolver over-biased toward jet regime

### 7.2 Symptom: Bead Soup Immediately After Detachment

Likely causes:

* no detached-sheet continuity
* sheet thickness too low at birth
* neck gain too high or tear threshold too low
* edge fray too aggressive
* carrier support too weak

### 7.3 Symptom: Infinite Rubber Membrane Water

Likely causes:

* stretch regularization too strong
* tear thresholds too high
* damage too weak
* recapture and spray conversion both too weak

### 7.4 Symptom: Random Patch Spam Everywhere

Likely causes:

* `R` too sensitive
* coherence filter too weak
* seed threshold too low
* patch area minimum too low
* cooldown absent

### 7.5 Symptom: Detached Sheets Look Ghosted or Disconnected

Likely causes:

* carrier support blending too weak
* detached geometry update lagging a frame behind support
* render prep reading stale sheet state
* sheet authority and carrier authority out of sync

### 7.6 Symptom: Surface Never Feels Splash Returns

Likely causes:

* recapture routing not feeding back into `etaDot`, `M`, or `U`
* reentry events culled or too weak
* detached feedback delayed too much

### 7.7 Symptom: Performance Dies During Hero Events

Likely causes:

* no birth caps
* weak LOD
* fragment explosion
* excessive compaction or pass overhead
* detached sheets spawned for low-value events

### 7.8 Symptom: Beautiful One-Off Splash But Unstable Tuning

Likely causes:

* parameter interactions not isolated
* tuning multiple stages at once
* lack of deterministic scene replay
* relying on visual luck instead of field inspection

---

## 8. Milestone Ladder

The implementation should advance through explicit milestones. Do not skip them just because one lucky splash looked cool.

### Milestone 1 — Stable Surface Field Layer

Must demonstrate:

* stable attached water
* diagnostics for `eta`, `etaDot`, `U`, `R`, `C`, `M`
* calm impulse and oblique impact scenes behaving sanely

### Milestone 2 — Rupture Patch Extraction

Must demonstrate:

* coherent patch grouping
* sensible patch priorities
* minimal patch spam
* useful patch overlays

### Milestone 3 — Event Resolution Stability

Must demonstrate:

* patch-to-event decisions that are stable over time
* event budgets draining from `M`
* no obvious double ownership

### Milestone 4 — Minimal Detached Sheet Birth

Must demonstrate:

* one ribbon family
* one patch family or equivalent
* plausible launch direction and initial thickness
* visible detached skin continuity

### Milestone 5 — Necking and Delayed Breakup

Must demonstrate:

* ligament stretch
* neck formation
* pinch-off or local spray conversion
* no instant bead soup

### Milestone 6 — Recapture Loop Closed

Must demonstrate:

* detached structures recontacting surface
* return of budget and impulse
* visible surface response after return

### Milestone 7 — Cross-Regime Consistency

Must demonstrate:

* attached, detached, and fragmented water reading as one visual system
* strong hero events without haunted overlap

### Milestone 8 — Performance-Literate Prototype

Must demonstrate:

* counters remain bounded
* sparse workloads stay sparse
* acceptable performance on target development hardware
* graceful degradation with LOD enabled

### Milestone 9 — Hero Event Quality Gate

Must demonstrate:

* vertical impact crown
* oblique directional fan
* crest peel or plunging lip
* ligament stretch and pinch-off
* recapture and secondary ripple response

Only after this should the system be considered ready for broader production expansion.

---

## 9. Hero Benchmarks

In addition to canonical scenes, define hero benchmark targets — scenes good enough to be shown publicly or used as internal quality bars.

### 9.1 Benchmark H1 — Cinematic Crown Impact

Target qualities:

* readable radial wall
* edge fray and ligament formation
* delayed collapse
* believable return energy

### 9.2 Benchmark H2 — Oblique Slash Fan

Target qualities:

* strong directional asymmetry
* fan sheet with edge tendrils
* minimal hose behavior

### 9.3 Benchmark H3 — Crest Peel

Target qualities:

* coherent forward sheet lip
* plunge or reconnection
* little to no bead soup before late breakup

### 9.4 Benchmark H4 — Ligament Pinch-Off Closeup

Target qualities:

* stable thin ribbon
* visible necking
* delayed pinch-off into larger droplets plus fine spray

### 9.5 Benchmark H5 — Full Mixed-Regime Event

Target qualities:

* attached surface motion
* coherent detached sheets
* fragments
* reentry
* recapture
* no visual disunity between layers

---

## 10. Comparison Protocol

### 10.1 Before/After Capture

Every major tuning change should be evaluated with:

* same seed / same scene
* same camera
* same duration
* side-by-side frame or clip comparison

### 10.2 Metrics to Compare

At minimum compare:

* patch counts
* event type counts
* sheet birth counts
* average detached lifetime
* average recapture rate
* fragment count peaks
* approximate frame cost

### 10.3 Human Evaluation Notes

Add structured notes such as:

* “improved directional throw”
* “too much early spray”
* “patch spam on secondary ripples”
* “reentry feels dead”

This creates an engineering memory rather than a fog of impressions.

---

## 11. Recommended Tuning Session Workflow

A productive session should look like this:

1. choose one canonical scene
2. choose one subsystem target
3. enable relevant diagnostics only
4. capture baseline
5. change one parameter cluster
6. replay same scene
7. compare counters and visuals
8. write notes
9. either keep or revert

This is boring in the best way. Boring process is what lets the spectacular water emerge without delusion.

---

## 12. Team / Agent Coordination Guidance

If multiple coding agents or humans work on the system, this validation manual should be the common contract.

Each contributor should specify:

* which scene they tested
* which diagnostics they examined
* which counters changed
* what milestone they were targeting
* whether the change helped or hurt benchmark scenes

This avoids the classic catastrophe where one agent “improves” splash drama by quietly breaking recapture or budget logic elsewhere.

---

## 13. Production Readiness Criteria

Before the system is called production-capable, it should satisfy all of the following:

* canonical scenes run repeatably
* diagnostics cover all major regimes
* no core haunted-overlap or double-ownership failures remain
* hero benchmarks look consistently strong from multiple angles
* recapture is reliable enough that detached clutter does not accumulate indefinitely
* performance degradation is graceful rather than catastrophic
* milestone 9 is satisfied

---

## 14. Closing Principle

The hybrid water engine will not become excellent by adding more equations forever. It will become excellent when its behaviors are made visible, repeatable, diagnosable, and tunable under pressure.

The validation layer is not administrative overhead. It is the discipline that turns an ambitious simulation into an actual craft.

---

## 15. Planned Next Documents

1. **Visual Regime Atlas** — a richly organized taxonomy of splash types, crest types, ligament types, crown behaviors, and return patterns
2. **Implementation Milestone Board** — an execution-focused engineering roadmap derived from the milestone ladder
3. **UI / Diagnostics Console Spec** — a concrete blueprint for the panels, overlays, graphs, and replay controls inside the app
4. **Hero Event Benchmark Pack** — a formal test pack with named scenes, target captures, and expected success signatures





































# Hybrid Water Visual Regime Atlas

## A taxonomy of water event families, shapes, transitions, failure signatures, and visual targets for the hybrid water engine

---

## 0. Purpose

This document is a visual and behavioral atlas for the hybrid water system. Its purpose is to define the major families of water events the engine must represent, how those events should evolve over time, what fields and regimes drive them, and what visual failure modes indicate that the implementation is going wrong.

The atlas is not merely artistic reference language. It is an engineering instrument.

It exists to answer questions like:

* What kind of detached event is this?
* Should this event produce a ribbon, a fan, a crown, a jet, or spray?
* What should its temporal evolution look like?
* Which latent fields should be dominant?
* What common wrong versions of this event should be recognized immediately?

A successful atlas gives the engine a shared visual ontology.

---

## 1. Meta-Principles of Water Event Taxonomy

### 1.1 Water Events Are Regime Chains, Not Static Objects

A “splash type” is not one frozen shape. It is usually a time sequence moving through multiple regimes:

* attached surface build-up
* coherent detachment
* stretching / thickening / thinning
* edge fray or necking
* fragmentation or recapture
* return to the main body

Therefore each atlas entry should describe:

* birth conditions
* early phase
* mature phase
* terminal phase
* likely transitions

### 1.2 Similar Shapes May Arise from Different Causes

Two events can look superficially similar but belong to different families because their dynamics, directionality, or termination modes differ.

For example:

* a crown wall from a vertical impact
* a fan sheet from an oblique slash

Both may contain curved thin water, but they are not the same beast.

### 1.3 A Good Atlas Entry Includes Wrong Versions

Each event family should define:

* what the convincing version looks like
* what the common fake version looks like
* which subsystem usually causes the fake version

This is critical for debugging.

---

## 2. Global Regime Axes

Every visual water event can be located across several axes. These axes help classify events and determine the correct representation strategy.

### 2.1 Attachment Axis

* fully attached
* attached but near-failure
* partially detached
* fully detached coherent
* fragmented
* recontacting / recapturing

### 2.2 Coherence Axis

* highly coherent
* moderately coherent
* weakly coherent
* fully incoherent

### 2.3 Directionality Axis

* symmetric / radial
* uni-directional
* bi-directional split
* tangential sweep
* turbulent / disordered

### 2.4 Thickness Axis

* thick volume-like water
* medium coherent sheet
* thin film / ribbon
* necked ligament
* droplets / mist

### 2.5 Temporal Energy Axis

* building
* erupting
* sustained
* collapsing
* returning

These axes help place an event family within the broader hybrid system.

---

## 3. Master Event Families

The atlas divides water events into six primary families:

1. **Surface Wave Events**
2. **Impact Uplift Events**
3. **Directional Sheet Events**
4. **Ligament and Tendril Events**
5. **Fragmentation Events**
6. **Return / Recontact Events**

Each family contains subtypes.

---

# Family I — Surface Wave Events

## 4. Attached Ripple Field

### 4.1 Description

A small to moderate disturbance propagating as coherent attached ripples or wavelets without detachment.

### 4.2 Birth Conditions

* low to moderate energy
* low rupture potential
* no need for volumetric handoff

### 4.3 Dominant Fields

* `eta`
* `etaDot`
* `U`

### 4.4 Desired Visual Qualities

* clean propagation
* coherent interference
* no spurious detached artifacts
* stable decay or transmission

### 4.5 Wrong Versions

* patch spam on small ripples
* random detached particles from harmless disturbances
* unstable directional field where symmetry should dominate

### 4.6 Likely Causes of Failure

* `R` too sensitive
* poor field smoothing
* patch seed threshold too low

---

## 5. Traveling Crest

### 5.1 Description

A coherent wave crest translating across the surface, potentially approaching a detachment threshold if steep enough.

### 5.2 Birth Conditions

* directional wave energy
* coherent `U`
* rising slope and curvature

### 5.3 Dominant Fields

* `U`
* `R`
* `C`
* curvature proxy

### 5.4 Desired Visual Qualities

* strong directionality
* coherent crest line
* increasing severity near steep regions
* no premature particle breakup

### 5.5 Wrong Versions

* broad mushy ridge without direction
* detached spray without visible crest formation
* crest remains infinitely stable at impossible steepness

---

## 6. Crest-Lip Peel

### 6.1 Description

A traveling crest reaches the point where it no longer remains representable as an attached single-valued surface and forms a forward-leaning detached lip.

### 6.2 Birth Conditions

* high `R`
* high `C`
* strong directional `U`
* sufficient reservoir `M`

### 6.3 Dominant Regimes

* attached surface -> detached coherent sheet -> plunge or fragmentation

### 6.4 Desired Visual Qualities

* coherent forward peel
* clear relation to crest direction
* delayed breakup
* possible plunge or recapture

### 6.5 Wrong Versions

* upward spout instead of forward peel
* bead soup immediately after detachment
* impossible hovering flap

### 6.6 Likely Causes of Failure

* lift overpowering throw
* detached sheet support too weak
* neck/tear too aggressive

---

# Family II — Impact Uplift Events

## 7. Vertical Jet Core

### 7.1 Description

A concentrated vertical or near-vertical uplift caused by a strong localized impact.

### 7.2 Birth Conditions

* strong localized upward impulse
* concentrated rupture core
* limited lateral coherence

### 7.3 Dominant Fields

* `R`
* impact memory
* local `etaDot`

### 7.4 Desired Visual Qualities

* strong central rise
* finite duration
* possible secondary crown or plume behavior
* no infinite faucet

### 7.5 Wrong Versions

* endless nozzle
* too-thick rigid column
* no surface depletion at origin

---

## 8. Radial Crown Wall

### 8.1 Description

A circular or arc-like wall emitted from a strong vertical impact, expanding outward while remaining coherent for a short time.

### 8.2 Birth Conditions

* strong radial surface momentum from impact
* ring-like coherent rupture region
* high but structured energy

### 8.3 Dominant Regimes

* attached impact -> radial patch extraction -> detached patch/fan family -> edge fray -> return

### 8.4 Desired Visual Qualities

* clear radial wall shape
* coherent early wall
* edge fray later, not immediately
* inward/outward collapse with believable return

### 8.5 Wrong Versions

* central nozzle only, no wall
* wall disintegrates instantly into droplets
* wall remains rigid too long with no thinning

### 8.6 Diagnostic Clues

* `U` should be radially structured
* patch extraction should identify ring or arc structure
* edge damage should rise later than central wall birth

---

## 9. Impact Plume Fan

### 9.1 Description

A more chaotic but still partially coherent uplift plume, often less structured than a crown wall and more appropriate for strong localized expulsions.

### 9.2 Birth Conditions

* high rupture
* moderate coherence
* localized impact violence
* limited sheet organization

### 9.3 Desired Visual Qualities

* energetic volume uplift
* mixed packet / sheet / fragment behavior
* plausible collapse or reentry

### 9.4 Wrong Versions

* one generic particle burst
* no coherent core
* no visible transition from coherent to fragmented structure

---

# Family III — Directional Sheet Events

## 10. Oblique Impact Fan

### 10.1 Description

A broad asymmetric sheet emitted by a shallow-angle impact or slash-like body motion.

### 10.2 Birth Conditions

* strong tangential forcing
* directional `U`
* moderate to high coherence along a sweep direction

### 10.3 Dominant Fields

* `U`
* `R`
* `C`
* body tangential forcing memory

### 10.4 Desired Visual Qualities

* obvious asymmetry
* forward lean in travel direction
* broad fan shape with thinner edges
* edge ligaments emerging later

### 10.5 Wrong Versions

* vertical splash despite oblique impact
* symmetric fan from asymmetric forcing
* immediate confetti spray

### 10.6 Likely Causes of Failure

* `U` not carrying tangential bias
* event resolver over-preferring jet
* patch orientation extraction poor

---

## 11. Surface Slash Sheet

### 11.1 Description

A low-angle sweeping sheet emitted when a fast object slices across the surface and drags coherent water outward.

### 11.2 Birth Conditions

* sustained tangential sweep
* repeated coherent patches along body path
* strong directional reservoir drainage

### 11.3 Desired Visual Qualities

* sheet appears dragged, not exploded
* coherent main body plus edge breakup
* repeated but stable event rhythm along path

### 11.4 Wrong Versions

* patch chatter everywhere along trajectory
* repeated identical hose bursts
* sheet not aligned with object motion

---

## 12. Wake Peel Ribbon

### 12.1 Description

A narrower directional ribbon-like detachment emerging from a wake edge or fast-moving contact boundary.

### 12.2 Desired Visual Qualities

* strong anisotropy
* edge-localized birth
* persistent ribbon before pinch-off or recapture

### 12.3 Wrong Versions

* broad fan where a ribbon should form
* ribbon too thick and blunt
* no edge specificity

---

# Family IV — Ligament and Tendril Events

## 13. Primary Ligament Ribbon

### 13.1 Description

A narrow coherent water strip stretching from a detached sheet edge or rupture boundary.

### 13.2 Birth Conditions

* edge instability on coherent sheet
* anisotropic stretch
* nonzero support from carriers

### 13.3 Dominant Regimes

* detached sheet edge -> ligament ribbon -> necking -> droplet pinch-off or recapture

### 13.4 Desired Visual Qualities

* strong continuity
* visibly thinning with stretch
* delayed pinch-off
* larger droplets formed from necking, not random dust

### 13.5 Wrong Versions

* instant bead chain
* immortal spaghetti ribbon
* rigid rod-like ligament

### 13.6 Likely Causes of Failure

* tear too early
* stretch regularization too strong
* thickness update poor
* no neck memory

---

## 14. Necked Tendril

### 14.1 Description

A more advanced ligament state where local thinning has intensified and pinch-off is imminent.

### 14.2 Desired Visual Qualities

* visible thin neck region
* thicker lobes on either side
* plausible delay before severing

### 14.3 Wrong Versions

* no necking, only sudden cut
* full-body collapse instead of local pinch-off
* neck oscillates forever without resolving

---

## 15. Edge Fray Cascade

### 15.1 Description

A coherent sheet edge begins to scallop and emit multiple small ligaments or fine structures.

### 15.2 Birth Conditions

* broad sheet edge
* rising edge damage
* falling thickness at edge
* partial coherence still present

### 15.3 Desired Visual Qualities

* edge breaks first, not whole sheet at once
* mixed ligament sizes
* progressive fray

### 15.4 Wrong Versions

* full sheet atomizes simultaneously
* edge remains perfectly clean forever
* fray looks like repeated cloned patterns

---

# Family V — Fragmentation Events

## 16. Pinch-Off Droplet Pair

### 16.1 Description

A ligament neck collapses and yields one or more larger droplets, sometimes with fine mist.

### 16.2 Desired Visual Qualities

* droplets come from a necking history
* droplet scale relates to ligament thickness
* local, not global fragmentation

### 16.3 Wrong Versions

* random droplet rain with no ligament precursor
* tiny confetti instead of a meaningful pinch-off event

---

## 17. Fine Edge Spray

### 17.1 Description

Small droplets or mist emitted from unstable sheet edges or violent fraying regions.

### 17.2 Birth Conditions

* high edge damage
* low local thickness
* low local coherence
* strong velocity gradients

### 17.3 Desired Visual Qualities

* secondary to coherent water
* accents the breakup rather than replacing it
* spatially concentrated near unstable edges

### 17.4 Wrong Versions

* spray everywhere all the time
* spray appears before any coherent event has formed
* mist is too large or too sparse to read correctly

---

## 18. Chaotic Spray Burst

### 18.1 Description

An incoherent fragmented event resulting from violent collapse, direct spray regime resolution, or severe tear cascades.

### 18.2 Desired Visual Qualities

* clearly more chaotic than coherent sheet families
* still spatially tied to an underlying cause
* finite lifespan

### 18.3 Wrong Versions

* generic particle explosion detached from water logic
* no relationship to impact or tear origin
* fragments live too long and clutter scene

---

# Family VI — Return / Recontact Events

## 19. Soft Recontact Merge

### 19.1 Description

A detached coherent structure returns to the attached surface with relatively low relative normal velocity and merges gently.

### 19.2 Desired Visual Qualities

* visible reunion with surface
* small secondary ripples
* no unnecessary explosion

### 19.3 Wrong Versions

* every return becomes a splash bomb
* detached sheet passes through surface with no consequence
* no surface response at all

---

## 20. Hard Reentry Impact

### 20.1 Description

A detached structure or fragment reenters the main surface with substantial energy, creating visible secondary disturbance.

### 20.2 Desired Visual Qualities

* clear impulse into surface
* local wave response
* possible foam/aeration seed
* not equivalent to initial primary impact unless energy warrants it

### 20.3 Wrong Versions

* dead reentry with no surface effect
* reentry causes absurdly large new event from tiny fragment

---

## 21. Bridge Sheet Reconnection

### 21.1 Description

A detached sheet forms or preserves a connection between bodies before reconnecting or collapsing back into the main body.

### 21.2 Desired Visual Qualities

* tension-like continuity
* local thinning before merge or tear
* visually coherent reunion path

### 21.3 Wrong Versions

* no bridge possible, only breakup
* bridge becomes rubber membrane
* reconnection is visually discontinuous

---

# 22. Transition Atlas

This section describes common cross-family transitions.

## 22.1 Crest -> Lip -> Plunge -> Return

A core wave-driven sequence:

* attached traveling crest
* coherent forward lip
* partial plunge or fold
* recapture and secondary ripple

## 22.2 Impact Core -> Crown Wall -> Edge Fray -> Spray + Collapse

A classic impact sequence:

* strong central disturbance
* radial wall
* edge ligament/fray
* collapse and return

## 22.3 Oblique Fan -> Ribbon Edge -> Necking -> Pinch-Off

A directional sheet sequence:

* fan birth
* edge-local ribbon
* neck formation
* localized droplet birth

## 22.4 Sheet -> Packet -> Spray

A coherence-loss sequence:

* detached coherent surface
* coherent support weakens
* packet/plume dominance rises
* eventual fragment burst or fall-back

## 22.5 Sheet -> Recontact -> Soft Merge

A coherence-preserving return sequence:

* detached sheet remains coherent
* approaches surface compatibly
* merges with low violence

---

## 23. Atlas by Dominant Representation

This section reorganizes events by what representation should visually dominate.

### 23.1 Heightfield-Dominant Events

* calm ripple field
* traveling crest below failure threshold
* broad wakes without detachment

### 23.2 Heightfield-to-Sheet Handoff Events

* crest-lip peel
* radial crown wall
* oblique impact fan
* wake peel ribbon

### 23.3 Sheet-Dominant Events

* coherent detached fan
* primary ligament ribbon
* bridge reconnection sheet
* early crown wall

### 23.4 Sheet-to-Fragment Transition Events

* edge fray cascade
* necked tendril
* pinch-off droplet pair
* fine edge spray

### 23.5 Fragment-Dominant Events

* chaotic spray burst
* late-stage mist
* terminal droplet rain

### 23.6 Return-Dominant Events

* soft recontact merge
* hard reentry impact
* reconnecting bridge collapse

---

## 24. Atlas by Dominant Field Signature

This section helps connect visual events to latent field expectations.

### 24.1 High `R`, High `C`, Strong `U`

Likely events:

* crest-lip peel
* oblique fan sheet
* wake peel ribbon

### 24.2 High `R`, Moderate `C`, High Local Uplift

Likely events:

* vertical jet core
* impact plume fan
* packet-dominant emission

### 24.3 High `R`, Ring-Like Direction Pattern, Good `M`

Likely events:

* radial crown wall

### 24.4 Moderate `R`, High `C`, Edge-Localized Damage

Likely events:

* primary ligament ribbon
* edge fray cascade

### 24.5 Low `C`, High Disorder, Falling Thickness

Likely events:

* fine edge spray
* chaotic spray burst

### 24.6 High `A`, Low Relative Return Speed

Likely events:

* soft recontact merge
* bridge reconnection

---

## 25. Atlas by Common Wrong Look

Sometimes the fastest classification comes from what is wrong.

### 25.1 Hose Look

Symptoms:

* straight upward emission
* too little forward throw
* no sheetness

Likely event families being corrupted:

* crest-lip peel
* oblique impact fan
* wake peel ribbon

### 25.2 Bead Soup Look

Symptoms:

* detached water instantly granular
* no smooth tendril continuity
* no delayed pinch-off

Likely event families being corrupted:

* primary ligament ribbon
* crown wall edge fray
* crest-lip peel

### 25.3 Rubber Membrane Look

Symptoms:

* detached sheets stretch forever
* over-stabilized continuity
* no local thinning consequences

Likely event families being corrupted:

* bridge reconnection sheet
* large fan sheet
* ligament ribbon

### 25.4 Particle Confetti Look

Symptoms:

* fragmented events dominate too early
* no hierarchy from coherent to incoherent

Likely event families being corrupted:

* all impact uplift events
* all directional sheet events
* crown wall collapse

### 25.5 Ghost Water Look

Symptoms:

* visible detached skin disconnected from supporting motion
* reentry visually mismatched to impact point

Likely event families being corrupted:

* detached sheet families broadly
* soft recontact merge
* oblique fan sheet

---

## 26. Hero Event Compositions

The following complex events are compositions of atlas entries and should be treated as orchestrated combinations, not single primitive types.

### 26.1 Cinematic Boulder Drop

Composition:

* radial crown wall
* vertical jet core
* edge fray cascade
* hard reentry impacts
* soft collapse merge in late phase

### 26.2 Blade or Hull Slash

Composition:

* oblique impact fan
* surface slash sheet
* wake peel ribbon
* fine edge spray
* repeated soft reentry trail

### 26.3 Breaking Crest Closeup

Composition:

* traveling crest
* crest-lip peel
* primary ligament ribbon
* necked tendril
* pinch-off droplet pair
* plunge return

### 26.4 Mixed-Chaos Storm Event

Composition:

* multiple traveling crests
* repeated peel events
* fragments
* recapture chaos
* strong performance and LOD stress

---

## 27. Suggested Atlas Usage in the App

This atlas should not live only as a document. It should influence the UI and debugging experience.

### 27.1 Event Labels

The app should be able to annotate or classify events using atlas family names where feasible.

### 27.2 Color Language

Each major family or regime may use consistent debug colors:

* crest/lip events
* crown events
* ligament events
* fragment events
* return events

### 27.3 Benchmark Links

Each canonical test scene in the validation manual should link to one or more atlas entries.

### 27.4 Failure Hints

The app could optionally map visible failure signatures to likely subsystem problems.

For example:

* “bead soup likely: detached sheet continuity too weak or tear threshold too low”
* “hose look likely: throw vector underweighted relative to lift”

That would be glorious and mischievously useful.

---

## 28. Expansion Directions

Future versions of the atlas should include:

* image references or frame captures from the engine
* real-water reference comparisons
* event timelines with frame markers
* recommended camera setups for judging each family
* LOD-specific variants of each event type
* atlas entries for shoreline and obstacle interactions
* atlas entries for foam and aeration visual regimes

---

## 29. Closing Principle

A water engine becomes powerful when it stops thinking of “a splash” as one generic thing.

Real water expresses many distinct event families, each with its own birth logic, shape language, temporal arc, and failure modes. The atlas gives those families names, structure, and diagnostic meaning.

This is how the engine gains visual intelligence instead of merely numerical activity.

---

## 30. Planned Next Documents

1. **UI / Diagnostics Console Spec** — a full blueprint for the app panels, overlays, toggles, counters, and replay tools
2. **Implementation Milestone Board** — a project-management and execution document derived from the validation ladder
3. **Hero Event Benchmark Pack** — formal benchmark cards for each major showcase event
4. **Reference Capture Companion** — a document for linking engine captures, notes, and atlas categories over time







































# Hybrid Water UI / Diagnostics Console Spec

## A full blueprint for the laboratory interface, panels, overlays, inspectors, counters, replay tools, and benchmark controls of the hybrid water engine

---

## 0. Purpose

This document defines the UI and diagnostics console for the hybrid water engine.

Its purpose is not merely to expose settings. It is to create a **laboratory interface** that lets a developer, artist, or AI coding agent inspect, validate, tune, and compare every major regime of the system without getting lost in hidden state.

The console must make the engine:

* legible
* tunable
* benchmarkable
* replayable
* inspectable across regimes
* practical for long-term iterative development

This spec assumes the engine includes:

* attached surface fields
* rupture patch extraction
* detached sheet structures
* carrier support structures
* fragments / spray
* recapture routing
* benchmark scenes and event logs

---

## 1. Design Philosophy

### 1.1 The Console Is a Scientific Instrument

The console is not a pile of sliders. It is a structured interface for understanding causal relationships in the simulation.

Every major control or panel should answer one of these questions:

* What is happening?
* Why is it happening?
* Which regime owns it?
* Which fields caused it?
* What changed recently?
* What would happen if I changed this?

### 1.2 The Console Must Support Two Modes of Thinking

The UI must serve both:

* **broad visual inspection** — watching the whole event unfold
* **precise subsystem diagnosis** — isolating one field, patch, sheet, or event

### 1.3 The Console Must Respect Temporal Behavior

Water is not just spatial. The UI must support:

* replay
* pause
* stepping
* timeline scrubbing
* event history
* before/after comparison

### 1.4 The Console Should Minimize Cognitive Mud

The interface must separate:

* simulation state
* debug visualization
* tuning controls
* scene control
* event inspection
* performance telemetry

Do not bury everything in one accordion swamp. That way lies sorrow.

---

## 2. High-Level Layout

The recommended layout is a four-zone laboratory shell around the viewport.

### 2.1 Center: Main Viewport

The center contains the main real-time water view.

It must support:

* normal shaded rendering
* diagnostic overlay compositing
* benchmark scene camera controls
* event selection / picking
* split comparison mode

### 2.2 Left Dock: Regime and Overlay Control

Primary purpose:

* toggle visual layers
* switch debug overlays
* choose atlas family highlights
* isolate attached/sheet/carrier/fragment regimes

### 2.3 Right Dock: Inspector and Parameter Panels

Primary purpose:

* inspect selected patch/sheet/event/fragment
* edit parameter groups
* view derived metrics and histories

### 2.4 Bottom Dock: Timeline, Event Log, Replay, Performance Strip

Primary purpose:

* temporal navigation
* recent major events
* frame stepping
* capture/replay tools
* frame-time and counter strip

### 2.5 Top Bar: Scene, Benchmark, Snapshot, and Session Controls

Primary purpose:

* scene selection
* benchmark launcher
* save/load presets
* snapshot compare
* diagnostics mode presets

---

## 3. Core UI Regions in Detail

## 3.1 Top Bar

### 3.1.1 Sections

The top bar should contain:

* project/session title
* current benchmark scene dropdown
* camera preset dropdown
* diagnostics preset dropdown
* snapshot A/B compare controls
* save / load tuning preset controls
* capture controls
* reset scene button
* deterministic replay toggle

### 3.1.2 Benchmark Launcher

A prominent control should allow switching instantly between canonical test scenes such as:

* Calm Surface Impulse
* Vertical Drop Impact
* Oblique Impact
* Fast Surface Skim
* Traveling Crest
* Ligament Stretch Test
* Crown Wall Collapse
* Recontact / Bridge Formation
* Hero Stress Test

Each benchmark should optionally expose scene-specific parameters beside the main dropdown.

### 3.1.3 Snapshot Controls

Should allow:

* capture current parameter state
* label snapshot
* compare current vs snapshot A
* compare current vs snapshot B
* revert to snapshot

This is crucial for disciplined tuning.

---

## 3.2 Left Dock — Regime Layer Console

The left dock is the primary place for visual filtering and overlay management.

### 3.2.1 Regime Visibility Group

Checkboxes / toggles:

* Attached Surface
* Rupture Fields
* Rupture Seeds
* Rupture Patches
* Detached Sheets
* Sheet Nodes / Control Points
* Carriers
* Fragments
* Reentry / Recapture Markers
* Foam / Aeration Markers

### 3.2.2 Overlay Mode Group

Mutually exclusive or blendable overlays:

* None / Beauty View
* `eta`
* `etaDot`
* `U` vector field
* `U` hue/magnitude field
* `R`
* `C`
* `M`
* `A`
* curvature
* divergence / compression
* patch classification
* sheet thickness
* sheet stretch
* sheet neck score
* sheet damage
* carrier support density
* fragment lifetime
* recapture zones

### 3.2.3 Atlas Highlight Group

Optional overlay to highlight events by atlas family:

* Crest / Lip Events
* Crown Events
* Fan / Slash Events
* Ligament Events
* Fragmentation Events
* Return / Recontact Events

This links the runtime system to the visual regime atlas.

### 3.2.4 Selection Filters

Controls for selection scope:

* select only patches
* select only sheets
* select only carriers
* select only fragments
* prefer highest-priority event under cursor

---

## 3.3 Right Dock — Inspector and Tuning Stack

The right dock changes based on current selection and active tab.

### 3.3.1 Main Tabs

Recommended tabs:

* Inspector
* Fields
* Events
* Sheets
* Carriers
* Fragments
* Performance
* Presets

### 3.3.2 Inspector Tab

Context-sensitive inspector for currently selected entity.

Possible selections:

* surface texel / region
* rupture patch
* detached sheet
* sheet node
* carrier
* fragment
* event log entry

Fields shown should include both raw and derived values.

---

## 4. Inspector Panel Specifications

## 4.1 Surface Region Inspector

When the user clicks a location on the attached surface, the inspector should show:

* world position
* surface grid coordinates
* `eta`
* `etaDot`
* `U` vector and magnitude
* `R`
* `C`
* `M`
* `A`
* slope magnitude
* curvature proxy
* divergence/compression
* recent impact memory
* recapture input at location
* nearby patch membership if any

Optional mini-history graphs:

* `R` over last N frames
* `M` over last N frames
* `U` magnitude over last N frames

---

## 4.2 Rupture Patch Inspector

When a rupture patch is selected, show:

* patch id
* regime classification / hint
* patch priority
* centroid
* area / extent
* principal direction
* average normal
* average `R`, `C`, `M`, `A`
* estimated birth budget
* age
* whether emitted this frame
* linked source scene object if applicable

Additional sub-panels:

* patch field heat mini-map
* patch event history
* compatibility summary for neighboring texels

---

## 4.3 Detached Sheet Inspector

When a sheet is selected, show:

* sheet id
* family type
* source patch id
* age
* total budget
* average thickness
* average stretch
* average stability
* average damage
* node count
* lod tier
* current render mode
* bounding box / bounding sphere
* linked carrier count
* recapture readiness

Optional mini-graphs:

* avg thickness over time
* avg stretch over time
* active damage over time
* fraction of budget converted to spray / returned

---

## 4.4 Sheet Node Inspector

When a single node is selected, show:

* node id / local index
* position
* velocity
* thickness
* stretch
* strain rate
* neck score
* damage
* stability
* support density
* linked carrier ids or count
* edge flag
* tear candidate flag

This is useful for debugging necking and pinch-off.

---

## 4.5 Carrier Inspector

When a carrier is selected, show:

* carrier id
* source sheet id / source event
* position
* velocity
* support mass
* support density
* anisotropy
* disorder
* age
* lod tier
* nearby sheet influence
* reentry status

---

## 4.6 Fragment Inspector

When a fragment is selected, show:

* fragment id
* type
* source regime
* position
* velocity
* radius / size
* lifetime remaining
* opacity
* reentry candidate status
* parent tear event if tracked

---

## 5. Parameter Panels

The console should provide structured parameter panels grouped by subsystem. These should not be a giant undifferentiated dump.

## 5.1 Fields Panel

Contains grouped controls for:

### Rupture Potential

* slope weights / thresholds
* curvature weights / thresholds
* up-velocity weights / thresholds
* momentum contribution
* compression contribution
* impact memory influence
* smoothing / decay
* cooldown behavior

### Coherence

* neighborhood alignment weights
* persistence gain / loss
* disorder penalties
* thresholding

### Reservoir

* baseline
* refill rate
* event drain scale
* recapture return scale

### Adhesion

* recovery rate
* rupture suppression
* recapture boost
* outward-launch suppression

### Surface Momentum

* body forcing gain
* impact radial gain
* damping
* diffusion
* recapture return tangential gain

---

## 5.2 Event Panel

Contains:

* seed thresholds
* patch growth radius
* direction compatibility threshold
* patch min area
* patch merge / suppression strength
* event score biases (sheet / jet / packet / spray)
* per-frame birth caps
* cooldown durations
* atlas family overrides if needed for testing

---

## 5.3 Sheet Panel

Contains:

* initial thickness scales by family
* lift / throw / spread scales
* carrier support blending
* stretch gain and relaxation
* thickness smoothing
* neck gain and decay
* damage accumulation
* tear threshold
* edge fray gain
* spray conversion gain
* recapture distance and speed thresholds

These should be grouped into collapsible subsections:

* Birth
* Support
* Stretch/Thickness
* Necking/Tear
* Return

---

## 5.4 Carrier Panel

Contains:

* carrier count per birth type
* support mass scale
* support density influence
* disorder influence
* drag / damping
* anisotropic jitter / spread
* packet fallback toggles
* hero-zone density multiplier

---

## 5.5 Fragment Panel

Contains:

* fragment birth counts
* spray cone spread
* fragment size ranges
* lifetimes
* drag
* reentry sensitivity
* culling thresholds
* distance-based downgrade rules

---

## 5.6 LOD / Budget Panel

Contains:

* patch cap
* sheet cap
* sheet node cap
* carrier cap
* fragment cap
* per-frame birth cap
* distant downgrade thresholds
* hero region radius
* importance weighting factors

This panel is crucial for keeping the project grounded in browser reality rather than beautiful self-deception.

---

## 6. Bottom Dock — Timeline, Log, and Performance

## 6.1 Timeline Strip

A timeline should display:

* current simulation time
* recent event markers
* sheet births
* tears
* recaptures
* scene reset markers
* snapshot capture markers

The user should be able to:

* scrub within a buffered replay window
* pause on an event marker
* click an event to inspect it

## 6.2 Event Log

A scrollable event log should list recent notable events with rows like:

* `[12.433s] Patch 18 -> Sheet Birth (Ribbon)`
* `[12.517s] Sheet 4 edge tear -> 7 fragments`
* `[12.650s] Fragment cluster reentry -> impulse return`
* `[12.817s] Sheet 4 recaptured 62% budget`

Each entry should be clickable and linked to the inspector.

## 6.3 Performance Strip

A compact strip should show:

* frame time
* GPU pass cost breakdown
* active object counts
* capped / culled event counts
* memory pool usage percentages

Recommended visualization:

* sparkline per category
* color warnings when caps or frame budgets are stressed

---

## 7. Viewport Interaction Model

### 7.1 Picking

The viewport should support click or hover picking for:

* surface points
* rupture patches
* detached sheets
* sheet nodes
* carriers
* fragments

### 7.2 Hover Tooltips

Optional lightweight hover display:

* object type
* id
* key metric summary
* current atlas family label if classified

### 7.3 Region Brush / Probe

A brush or probe tool should allow sampling a region of the surface to inspect average values.

Useful for:

* measuring `R`, `C`, `M`, `A` over a patch
* comparing before/after tuning

### 7.4 Comparative Split View

The viewport should optionally support:

* left/right parameter comparison
* before/after snapshot comparison
* beauty vs diagnostics side-by-side
* surface-only vs full hybrid side-by-side

This is absurdly useful and should not be postponed forever.

---

## 8. Diagnostics Presets

The UI should provide one-click presets, because nobody wants to manually toggle twelve overlays every time.

### 8.1 Preset: Surface Field Audit

Shows:

* `R`, `C`, `M`, `U`
* no detached layers
* patch seeds and boundaries

### 8.2 Preset: Event Resolution Audit

Shows:

* rupture patches
* patch priorities
* regime classifications
* event log focus

### 8.3 Preset: Detached Sheet Anatomy

Shows:

* detached sheets only
* thickness, stretch, neck score
* node and edge overlays

### 8.4 Preset: Carrier Support Audit

Shows:

* detached sheets plus carriers
* support density
* linked neighborhoods

### 8.5 Preset: Breakup Audit

Shows:

* sheet damage
* tear candidates
* fragments
* event log filtered to tear and fragment births

### 8.6 Preset: Return / Recapture Audit

Shows:

* recapture zones
* reentry markers
* local `A`
* return routing overlays

### 8.7 Preset: Performance Audit

Shows:

* object counts
* pool usage
* frame timing
* active LOD downgrades
* cull events

---

## 9. Benchmark Scene Controls

A benchmark scene launcher should not just switch scenes; it should expose controlled scene parameters.

### 9.1 Common Controls

* reset scene
* seed / deterministic replay toggle
* simulation speed
* camera preset
* duration buffer

### 9.2 Per-Scene Controls

Examples:

#### Vertical Drop Impact

* sphere radius
* drop height
* impact velocity
* water depth

#### Oblique Impact

* entry angle
* tangential velocity
* impact offset

#### Traveling Crest

* crest amplitude
* crest speed
* packet width

#### Ligament Stretch Test

* initial ribbon width
* pull speed
* support density bias

These controls should be visible and editable without spelunking through raw config files.

---

## 10. Replay and Capture Tools

## 10.1 Replay Buffer

The app should maintain a rolling replay buffer for:

* simulation state identifiers or compact event-state checkpoints
* camera state
* event markers

Even a short replay window is better than none.

## 10.2 Capture Types

Should support:

* frame capture
* short clip capture
* event capture card
* snapshot of parameter state
* benchmark result capture

## 10.3 Event Capture Card

A capture card should include:

* scene name
* timestamp
* event type
* key counters
* screenshot or clip reference
* notes
* current preset name

This would be a glorious engine memory system.

---

## 11. Comparison Workflows

### 11.1 Snapshot Compare

Allow:

* current vs snapshot A
* current vs snapshot B
* A vs B

Differences should be visible in:

* image output
* event counts
* key metrics
* parameter diffs

### 11.2 Regime Compare

Allow comparing:

* heightfield-only mode
* heightfield + packets
* full hybrid with detached sheets

This is essential for proving that the extra architecture is actually earning its keep.

### 11.3 Benchmark Compare Dashboard

Show historical benchmark captures side-by-side with notes and key metrics.

That prevents the classic “I think it got better?” fog.

---

## 12. Preset and Session System

### 12.1 Preset Types

The console should support:

* field presets
* event presets
* sheet behavior presets
* benchmark presets
* UI diagnostics presets

### 12.2 Session Save

A session save should include:

* active benchmark scene
* camera state
* parameter values
* active diagnostics preset
* replay seed or deterministic state
* notes

### 12.3 Recommended Named Preset Families

* Calm / Stable Surface
* Strong Crown
* Directional Fan
* Hero Ligament
* Soft Return
* Stress Test LOD

---

## 13. AI / Agent-Facing Features

Since this project is intended for heavy AI-assisted development, the console should expose machine-readable summaries where possible.

### 13.1 Summary Panel

A textual summary panel should be able to emit concise machine-readable state summaries such as:

* current benchmark
* active event counts
* top 3 active sheet families
* current dominant failure signatures
* active caps hit
* last major event

### 13.2 Exportable Diagnostics Snapshot

Should support exporting a compact report of:

* parameter values
* selected object data
* counters
* scene identity
* timing breakdown
* notes

This would let another coding agent reason from a concrete state rather than vague anecdote.

### 13.3 Suggested Prompt-Ready Copy Blocks

The UI could include a “copy debug summary” button that formats useful context for external AI tools.

That would be extremely powerful and delightfully dangerous.

---

## 14. Accessibility and Ergonomics

### 14.1 Readability

* use clear labels
* keep units visible where relevant
* separate raw values from normalized values

### 14.2 Color Discipline

Use a consistent debug color language across the app. Do not reinvent colors panel by panel like a chaotic goblin painter.

### 14.3 Screen Density

The console should support:

* compact mode for dense debugging
* expanded mode for deeper inspection
* collapsible panels
* detachable or floating inspector windows in future versions if practical

---

## 15. Suggested Initial Build Order for the Console

Do not attempt the entire cathedral at once.

### Phase 1

* top bar benchmark launcher
* basic overlay toggles
* scalar/vector field overlays
* counter strip
* reset / pause / step controls

### Phase 2

* patch inspector
* event log
* parameter group panels for fields and events

### Phase 3

* sheet inspector
* node-level overlays
* replay timeline
* snapshot compare

### Phase 4

* capture cards
* benchmark dashboard
* AI/agent summary export
* regime compare modes

This staged rollout ensures the diagnostics console matures alongside the simulation rather than becoming a giant unfinished cockpit.

---

## 16. Closing Principle

A hybrid water engine worthy of serious development needs a console that thinks like a laboratory, not like a toy options menu.

The UI must reveal the causal anatomy of the water:

* fields
* patches
* events
* sheets
* carriers
* fragments
* return paths
* costs
* failures
* improvements over time

When the console does this well, the engine becomes not only more tunable, but more intelligible. That is how complex simulation stops being sorcery and becomes craft.

---

## 17. Planned Next Documents

1. **Implementation Milestone Board** — execution roadmap derived from the milestone ladder and console needs
2. **Hero Event Benchmark Pack** — formal cards for showcase scenes, target visuals, and pass/fail signatures
3. **Reference Capture Companion** — structured archive format for notes, stills, clips, and benchmark comparisons
4. **Runtime Data Model / Editor Schema** — how presets, scenes, overlays, and diagnostics states are serialized and versioned






























# Hybrid Water Implementation Milestone Board

## A phased execution roadmap for building the hybrid water engine from core field layer to production-capable benchmark system

---

## 0. Purpose

This document is the execution board for the hybrid water engine.

It translates the encyclopedia, validation manual, visual atlas, and diagnostics console spec into a practical build sequence with:

* implementation phases
* dependencies
* success criteria
* risks
* deliverables
* recommended handoff chunks for coding agents

Its job is to answer:

* What should be built first?
* What should not be built yet?
* What must be true before the next milestone begins?
* How do we prevent the project from turning into an ambitious swamp?

This document should be used as the operational guide for engineering work.

---

## 1. Execution Philosophy

### 1.1 Build the Spine Before the Flourishes

The engine must first become:

* stable
* inspectable
* repeatable
* causally legible

Only then should it become elaborate.

This means the build order should favor:

1. field clarity
2. patch/event stability
3. detached-sheet continuity
4. return/recapture closure
5. performance literacy
6. visual polish and family expansion

### 1.2 Every Phase Must Produce Something Testable

No phase should be purely abstract.

Each phase must end with:

* a runnable scene or set of scenes
* visible diagnostics
* a pass/fail gate
* notes on known limitations

### 1.3 Every New Regime Must Pay Rent

Do not add a new subsystem because it sounds cool. Add it only if it solves a visible failure in the current system.

### 1.4 The Goal Is a Ladder, Not a Leap

This engine should advance through controlled ladders:

* heightfield competence
* field-aware event logic
* minimal detached sheet
* delayed breakup
* recapture
* scalable complexity

No heroic one-jump cathedral nonsense.

---

## 2. Master Phase Map

The implementation is divided into eleven major phases:

1. **Foundation & Harness**
2. **Surface Field Layer**
3. **Patch Extraction & Event Resolution**
4. **Minimal Detached Event Birth**
5. **Minimal Detached Sheet Layer**
6. **Carrier Support Integration**
7. **Breakup, Necking, and Spray**
8. **Recapture and Return Routing**
9. **Diagnostics Console Maturation**
10. **Performance, LOD, and Budget Hardening**
11. **Hero Event Quality and Production Readiness**

Each phase below includes goals, dependencies, deliverables, risks, and exit criteria.

---

# Phase 1 — Foundation & Harness

## 3. Goal

Create the simulation harness, benchmark scene framework, diagnostics foundation, and deterministic control structure required for all later phases.

## 4. Why This Phase Exists

Without a harness, every later result becomes hard to reproduce, compare, or debug.

## 5. Core Deliverables

* benchmark scene loader / switcher
* resettable deterministic scene states
* pause / step / replay seed support
* baseline viewport and debug overlay architecture
* counter strip and frame timing strip
* top-level parameter group system
* initial save/load of tuning presets

## 6. Required Inputs

* basic engine shell
* rendering viewport
* current surface simulation scaffold

## 7. Recommended Subtasks

### 7.1 Scene Harness

Implement:

* scene registry
* scene reset contract
* scene parameter injection
* deterministic random seed or controlled event playback

### 7.2 Diagnostics Bootstrap

Implement:

* overlay mode enum
* debug color pipeline
* on-screen counters
* frame time breakdown placeholders

### 7.3 Session State

Implement:

* pause
* resume
* single-step
* reset
* preset save/load

## 8. Risks

* trying to build too much simulation before replay and diagnostics exist
* poor scene reset logic leading to ghost state

## 9. Exit Criteria

This phase is complete when:

* at least 3 canonical scenes can be loaded and reset deterministically
* pause/step/reset works reliably
* basic on-screen counters and overlay toggles function
* a parameter preset can be saved and restored

## 10. Handoff Chunk Suggestions

Good coding-agent chunks:

* scene harness module
* diagnostics bootstrap overlay module
* session preset/state manager

---

# Phase 2 — Surface Field Layer

## 11. Goal

Build the latent field layer on top of the attached surface so the engine can reason about rupture, directionality, coherence, and detachable budget.

## 12. Why This Phase Exists

Without this phase, later event logic will be heuristic chaos instead of structured regime intent.

## 13. Core Deliverables

* textures for `eta`, `etaDot`, `U`, `R`, `C`, `M` (and optionally `A`)
* field update passes
* visualization overlays for these fields
* stable normalized parameter blocks

## 14. Dependencies

Requires Phase 1 harness and overlay framework.

## 15. Recommended Subtasks

### 15.1 Surface Momentum `U`

Implement:

* body/impact directional injection
* damping/diffusion
* debug visualization

### 15.2 Rupture Potential `R`

Implement first normalized formula using:

* slope
* curvature
* up velocity
* momentum magnitude
* impact memory
* reservoir bias

### 15.3 Coherence `C`

Implement first persistence-based coherence metric.

### 15.4 Reservoir `M`

Implement:

* baseline refill
* future drain contract
* debug visualization

### 15.5 Adhesion `A` (Optional Early / Required Soon)

If budget allows, add early. If not, stub the channel now so later integration is easier.

## 16. Risks

* overcomplicated formulas too early
* non-normalized field ingredients
* fields flickering because hysteresis/persistence is missing

## 17. Exit Criteria

This phase is complete when:

* `R`, `C`, `M`, and `U` are visible and stable
* calm impulse scene does not create patch spam
* oblique impact scene produces directional bias in `U`
* traveling crest scene shows plausible `R` buildup

## 18. Handoff Chunk Suggestions

* surface field compute pass set
* field visualization overlay set
* normalized field parameter schema

---

# Phase 3 — Patch Extraction & Event Resolution

## 19. Goal

Turn dense field intent into sparse coherent event candidates.

## 20. Why This Phase Exists

This is the bridge from “surface wants something” to “the engine decides what to do.”

## 21. Core Deliverables

* rupture seed pass
* patch extraction pass
* patch summary buffer
* event resolution pass
* event counters and overlay labels

## 22. Dependencies

Requires stable field layer from Phase 2.

## 23. Recommended Subtasks

### 23.1 Rupture Seeds

Implement seed identification from `R`, `M`, and suppression rules.

### 23.2 Patch Grouping

Implement approximate local grouping with:

* radius-based growth
* direction compatibility
* minimum area
* consumed texel suppression

### 23.3 Patch Summary

Compute:

* centroid
* extent
* average normal
* average `R`, `C`, `M`, `A`
* direction
* priority

### 23.4 Event Resolution

Implement first decision between:

* no event
* packet/jet event
* sheet event (stub or placeholder if detached sheets not yet built)

## 24. Risks

* patch spam from low thresholds
* unstable direction summaries
* event chatter frame to frame

## 25. Exit Criteria

This phase is complete when:

* one meaningful disturbance yields one or a few meaningful patches instead of dozens
* event resolution is visible and mostly stable frame-to-frame
* patch overlays align with visual surface energy

## 26. Handoff Chunk Suggestions

* rupture patch extraction pipeline
* patch inspector data model
* event resolve scoring module

---

# Phase 4 — Minimal Detached Event Birth

## 27. Goal

Create the first actual detached outputs from resolved events without yet requiring full sheet sophistication.

## 28. Why This Phase Exists

This phase proves the event architecture can birth sparse detached behavior and drain surface budgets cleanly.

## 29. Core Deliverables

* packet / jet birth events
* drain map application to `M`
* detached event counters
* initial reentry stubs

## 30. Dependencies

Requires stable patch and event resolution from Phase 3.

## 31. Recommended Subtasks

### 31.1 Birth Velocity Synthesis

Implement:

* lift
* throw
* spread
* noise

### 31.2 Budget Drain

Implement explicit drain map and reservoir consumption.

### 31.3 Minimal Detached Visuals

Temporary forms may include:

* packet glyphs
* stub ribbon placeholders
* simple debug geometry

### 31.4 Return Stub

Allow detached packets to reenter and generate basic feedback events.

## 32. Risks

* detached birth looks like generic nozzle behavior
* detached objects create apparent water without draining the surface
* reentry ignored entirely

## 33. Exit Criteria

This phase is complete when:

* events visibly drain `M`
* detached births are directionally distinct across scenes
* reentry stubs can feed at least minimal impulse back to surface

## 34. Handoff Chunk Suggestions

* drain map path
* packet birth pass
* reentry stub path

---

# Phase 5 — Minimal Detached Sheet Layer

## 35. Goal

Introduce the first true detached-sheet representation so detached coherent water is no longer only packets or raw particles.

## 36. Why This Phase Exists

This is the first phase that directly attacks the bead-soup problem.

## 37. Core Deliverables

* one ribbon family
* one patch or fan family (optional but strongly recommended)
* sheet object buffer
* sheet node/control-point buffer
* sheet render prep pass
* sheet inspector overlays

## 38. Dependencies

Requires detached event birth and drain logic from Phase 4.

## 39. Recommended Subtasks

### 39.1 Ribbon Family

Implement:

* birth from directional patches
* control points / nodes
* render prep to strip mesh

### 39.2 Patch/Fan Family (Optional First / Recommended Soon)

Implement small parametric patch for fan or crown-like events.

### 39.3 Sheet Metrics

Track:

* thickness
* stretch
* stability
* damage (even if simplified)

### 39.4 Inspector / Overlay Support

Add thickness and stretch overlays plus sheet bounds.

## 40. Risks

* detached sheet looks ghosted or disconnected
* too much render complexity too early
* no clear improvement over packets

## 41. Exit Criteria

This phase is complete when:

* detached coherent water visibly holds together better than packet-only mode
* ribbon detachment can be seen in oblique fan or crest-peel scenarios
* thickness and stretch overlays are working

## 42. Handoff Chunk Suggestions

* ribbon sheet family implementation
* sheet render-prep module
* sheet inspector UI integration

---

# Phase 6 — Carrier Support Integration

## 43. Goal

Give detached sheets internal support and motion guidance from carriers so the sheet becomes a skin riding a momentum-carrying substrate instead of a decorative ghost.

## 44. Why This Phase Exists

This phase is what makes detached sheets feel physically inhabited rather than purely kinematic.

## 45. Core Deliverables

* carrier pool or packet-support layer
* carrier-to-sheet support sampling
* support density metric
* support-aware thickness/stability updates

## 46. Dependencies

Requires minimal sheet layer from Phase 5.

## 47. Recommended Subtasks

### 47.1 Carrier Record and Pool

Implement fixed-capacity carrier or packet pool.

### 47.2 Carrier Birth

Spawn carrier support from new detached sheet births.

### 47.3 Support Sampling

For each sheet node:

* gather support density
* gather mean support velocity
* gather disorder

### 47.4 Blended Support Coupling

Blend node velocity and thickness behavior toward support.

## 48. Risks

* expensive neighbor search too early
* oscillation between carriers and sheet nodes
* support too weak to matter or too strong to look rigid

## 49. Exit Criteria

This phase is complete when:

* detached sheets no longer visibly drift away from their underlying motion
* support density meaningfully influences stability / thickness behavior
* carrier overlays and inspector values are readable

## 50. Handoff Chunk Suggestions

* carrier buffer and birth path
* node support gather pass
* support/stability coupling module

---

# Phase 7 — Breakup, Necking, and Spray

## 51. Goal

Introduce controlled failure of detached coherent structures through necking, tear, edge fray, and fragment conversion.

## 52. Why This Phase Exists

This phase solves the difference between convincing tendrils and cursed rubber ribbons.

## 53. Core Deliverables

* neck score
* damage accumulation
* tear candidates
* edge fray logic
* fragment birth pass
* fragment overlays and counters

## 54. Dependencies

Requires detached sheet metrics and support integration from Phases 5 and 6.

## 55. Recommended Subtasks

### 55.1 Necking Model

Implement thinness + stretch + support loss based neck score.

### 55.2 Tear Logic

Implement local tear rules for ribbons and patch edges.

### 55.3 Fragment Birth

Spawn:

* pinch-off droplets
* fine edge spray
* chaotic burst only when genuinely warranted

### 55.4 Breakup Diagnostics

Expose:

* neck score overlay
* tear candidate overlay
* fragment source labels

## 56. Risks

* instant confetti spray
* no breakup at all
* all-or-nothing destruction instead of local failure

## 57. Exit Criteria

This phase is complete when:

* ligament stretch test shows visible necking before pinch-off
* crown edge fray progresses locally, not globally
* fragments are spatially tied to actual tear regions

## 58. Handoff Chunk Suggestions

* necking/damage module
* tear pass
* spray/fragment birth pipeline

---

# Phase 8 — Recapture and Return Routing

## 59. Goal

Close the loop so detached material can return to the attached surface with meaningful consequences.

## 60. Why This Phase Exists

Without this phase, the engine becomes an ever-expanding graveyard of detached clutter and dead-end events.

## 61. Core Deliverables

* recapture candidate detection
* return routing into `M`, `U`, and `etaDot`
* soft merge vs hard reentry split
* return overlays and counters

## 62. Dependencies

Requires detached sheet and fragment systems from earlier phases.

## 63. Recommended Subtasks

### 63.1 Surface Projection Queries

Implement projection from detached object to surface sample.

### 63.2 Return Classification

Classify:

* soft merge
* hard reentry
* partial recapture
* reentry with foam/aeration seed

### 63.3 Routing Outputs

Write back to:

* reservoir return
* surface impulse
* tangential momentum return
* auxiliary fields where applicable

## 64. Risks

* every return acts like explosion
* no visible consequence of return
* return budgets not actually restored

## 65. Exit Criteria

This phase is complete when:

* detached structures visibly and measurably rejoin the surface
* soft and hard return cases are meaningfully distinguishable
* surface fields visibly respond to returned energy/mass

## 66. Handoff Chunk Suggestions

* recapture route pass
* return classification logic
* surface feedback application pass

---

# Phase 9 — Diagnostics Console Maturation

## 67. Goal

Expand the console from basic overlays to a true laboratory interface with inspectors, timeline, event log, replay, and compare workflows.

## 68. Why This Phase Exists

By this point the simulation is too complex to manage with minimal overlays.

## 69. Core Deliverables

* patch inspector
* sheet inspector
* carrier and fragment inspector
* timeline / event log
* snapshot compare
* diagnostics presets
* benchmark parameter panels

## 70. Dependencies

Requires sufficient runtime data from earlier phases.

## 71. Recommended Subtasks

### 71.1 Context Inspectors

Build context-sensitive right-dock inspection.

### 71.2 Timeline and Event Log

Add clickable event history.

### 71.3 Snapshot Compare

Implement before/after comparison workflow.

### 71.4 AI Summary Export

Optional but strongly valuable: copyable machine-readable debug summary.

## 72. Risks

* diagnostics console lags behind actual runtime state
* too many panels with no hierarchy
* no compare workflow, leading to tuning fog

## 73. Exit Criteria

This phase is complete when:

* major runtime objects can be inspected interactively
* timeline and event log are usable
* diagnostics presets reduce panel chaos
* snapshot compare works

## 74. Handoff Chunk Suggestions

* inspector system
* event log timeline widget
* snapshot compare and export tools

---

# Phase 10 — Performance, LOD, and Budget Hardening

## 75. Goal

Make the system robust on target hardware through caps, downgrades, sparse discipline, and graceful degradation.

## 76. Why This Phase Exists

A convincing system that only survives on a monster machine is still unfinished.

## 77. Core Deliverables

* active caps for patches, sheets, nodes, carriers, fragments
* family-specific LOD
* hero region prioritization
* downgrade and cull policies
* performance diagnostics refinement

## 78. Dependencies

Requires most runtime systems to exist.

## 79. Recommended Subtasks

### 79.1 Hard Cap Strategy

Define and enforce hard capacities.

### 79.2 LOD Downgrades

Examples:

* far sheets -> simpler ribbons
* far packets -> lower carrier counts
* far spray -> shorter lifetime or impostor rendering

### 79.3 Importance Metrics

Implement camera/distance/event-strength based priority.

### 79.4 Budget Telemetry

Expose cap hit rates and downgrade counts.

## 80. Risks

* bolting on LOD too late
* ugly popping due to poor downgrade transitions
* fragment overload crushing frame time

## 81. Exit Criteria

This phase is complete when:

* hero stress test does not catastrophically collapse
* caps and downgrade events are visible and controllable
* target hardware runs the system within acceptable budgets in benchmark scenes

## 82. Handoff Chunk Suggestions

* LOD manager
* active-cap enforcement layer
* importance-scoring module

---

# Phase 11 — Hero Event Quality and Production Readiness

## 83. Goal

Polish the hybrid system until it consistently achieves strong hero events, robust return behavior, and stable benchmark performance.

## 84. Why This Phase Exists

This is where the engine proves it is more than a prototype pile of subsystems.

## 85. Core Deliverables

* hero benchmark scene pack
* polished event-family tuning
* production-ready preset library
* finalized validation pass/fail board
* showcase captures / clips

## 86. Dependencies

Requires all prior systems functioning coherently.

## 87. Recommended Subtasks

### 87.1 Hero Benchmark Pass

Tune against:

* Cinematic Crown Impact
* Oblique Slash Fan
* Crest Peel
* Ligament Pinch-Off Closeup
* Full Mixed-Regime Event

### 87.2 Failure Atlas Audit

Cross-check wrong-look signatures against actual runtime failures and update tuning/diagnostics accordingly.

### 87.3 Preset Library Finalization

Create named presets:

* Strong Crown
* Directional Fan
* Hero Ligament
* Soft Return
* Stress Test LOD

### 87.4 Capture and Review Workflow

Generate repeatable captures for before/after quality review.

## 88. Risks

* polishing too early before core instability is solved
* overfitting to one hero scene
* visually strong captures masking hidden budget or recapture failures

## 89. Exit Criteria

This phase is complete when:

* hero benchmark scenes pass visually and structurally
* validation manual milestone ladder is satisfied
* system is stable enough for broader production integration

## 90. Handoff Chunk Suggestions

* hero benchmark tuning pass
* preset curation pass
* validation audit pass

---

## 91. Cross-Phase Dependency Table

### 91.1 Strict Dependencies

* Phase 2 depends on Phase 1
* Phase 3 depends on Phase 2
* Phase 4 depends on Phase 3
* Phase 5 depends on Phase 4
* Phase 6 depends on Phase 5
* Phase 7 depends on Phases 5 and 6
* Phase 8 depends on Phases 5 through 7
* Phase 9 depends on runtime data from Phases 3 through 8
* Phase 10 depends on broad runtime maturity
* Phase 11 depends on all major systems existing

### 91.2 Parallelizable Work

Some work can happen in parallel if carefully coordinated:

* Phase 1 diagnostics shell can overlap with early Phase 2 field visualization
* parts of Phase 9 console development can overlap with runtime phases
* parts of Phase 10 performance instrumentation can begin early
* benchmark authoring and atlas cross-linking can happen alongside core simulation work

---

## 92. Suggested Agent / Team Allocation

If multiple agents or contributors work in parallel, responsibilities can be divided as follows.

### 92.1 Surface / Field Agent

Focus:

* heightfield updates
* `U`, `R`, `C`, `M`, `A`
* field overlays
* patch seeds

### 92.2 Event / Sparse Logic Agent

Focus:

* patch extraction
* event resolution
* drain map
* event buffers

### 92.3 Detached Sheet Agent

Focus:

* sheet object/node model
* ribbon/patch families
* render prep
* necking/tear

### 92.4 Carrier / Fragment Agent

Focus:

* carrier pool
* support gathering
* fragment birth/update
* return candidates

### 92.5 UI / Console Agent

Focus:

* overlays
* inspector panels
* benchmark launcher
* timeline/log/snapshot compare

### 92.6 Validation / Benchmark Agent

Focus:

* scene library
* milestone board tracking
* hero benchmarks
* pass/fail reporting

This division is extremely useful as long as everyone honors the shared contracts instead of improvising in glorious isolation.

---

## 93. Milestone Review Template

Every milestone review should answer the following:

### 93.1 What Was Built?

* passes added
* UI added
* scenes affected
* new diagnostics available

### 93.2 What Now Works?

* canonical scenes improved
* counters stable
* event family newly represented

### 93.3 What Still Fails?

* known wrong-look signatures
* performance regressions
* missing feedback loops

### 93.4 What Evidence Supports the Claim?

* benchmark scene names
* capture IDs
* parameter presets used
* counters / timings

### 93.5 What Is the Next Smallest Valuable Step?

This prevents giant drifting wishlists.

---

## 94. Anti-Swamp Rules

These rules should be followed ruthlessly.

### 94.1 Do Not Add a New Event Family Before the Current One Is Legible

### 94.2 Do Not Tune Breakup Until Detached Birth Direction Is Convincing

### 94.3 Do Not Tune Recapture Until Return Routing Exists

### 94.4 Do Not Trust Pretty Captures Without Benchmark Replays

### 94.5 Do Not Add More Particles to Solve a Surface Continuity Problem First

### 94.6 Do Not Let the Diagnostics Console Lag Too Far Behind Runtime Complexity

These rules are boring, and that is why they save projects.

---

## 95. First Recommended Execution Sprint

If starting immediately, the first sprint should target:

### Sprint Goal

Reach the end of Phase 2 and lay the groundwork for Phase 3.

### Sprint Deliverables

* benchmark harness
* pause/reset/step
* field textures and overlays for `U`, `R`, `C`, `M`
* first normalized formulas
* calm impulse / vertical drop / oblique impact scenes
* counter strip and basic top bar controls

### Sprint Success Test

A developer can:

* switch scenes
* inspect fields live
* confirm directional `U`
* confirm plausible `R` hot zones
* confirm `M` is not trivial nonsense

This is the right place to start. Not with ten thousand droplets. Not with a cathedral of ligaments. With the field spine.

---

## 96. Closing Principle

A project like this succeeds when its ambition is organized into a ladder of earned complexity.

This milestone board exists to protect the engine from two equal and opposite disasters:

* oversimplifying until it can never achieve the target look
* overbuilding too early until it becomes impossible to reason about

The wise path is the narrow one:

build the structure that the visuals genuinely require,
prove each rung,
then climb.

---

## 97. Planned Next Operational Documents

1. **Hero Event Benchmark Pack** — formal cards for named benchmark scenes, targets, and pass/fail signatures
2. **Reference Capture Companion** — archive format for benchmark stills, clips, notes, and parameter state
3. **Runtime Data Model / Editor Schema** — preset, scene, overlay, and inspector data serialization contracts
4. **Agent Handoff Prompt Pack** — concrete prompts for coding agents aligned with the milestone board





































# Hybrid Water Implementation Milestone Board

## A phased execution roadmap for building the hybrid water engine from core field layer to production-capable benchmark system

---

## 0. Purpose

This document is the execution board for the hybrid water engine.

It translates the encyclopedia, validation manual, visual atlas, and diagnostics console spec into a practical build sequence with:

* implementation phases
* dependencies
* success criteria
* risks
* deliverables
* recommended handoff chunks for coding agents

Its job is to answer:

* What should be built first?
* What should not be built yet?
* What must be true before the next milestone begins?
* How do we prevent the project from turning into an ambitious swamp?

This document should be used as the operational guide for engineering work.

---

## 1. Execution Philosophy

### 1.1 Build the Spine Before the Flourishes

The engine must first become:

* stable
* inspectable
* repeatable
* causally legible

Only then should it become elaborate.

This means the build order should favor:

1. field clarity
2. patch/event stability
3. detached-sheet continuity
4. return/recapture closure
5. performance literacy
6. visual polish and family expansion

### 1.2 Every Phase Must Produce Something Testable

No phase should be purely abstract.

Each phase must end with:

* a runnable scene or set of scenes
* visible diagnostics
* a pass/fail gate
* notes on known limitations

### 1.3 Every New Regime Must Pay Rent

Do not add a new subsystem because it sounds cool. Add it only if it solves a visible failure in the current system.

### 1.4 The Goal Is a Ladder, Not a Leap

This engine should advance through controlled ladders:

* heightfield competence
* field-aware event logic
* minimal detached sheet
* delayed breakup
* recapture
* scalable complexity

No heroic one-jump cathedral nonsense.

---

## 2. Master Phase Map

The implementation is divided into eleven major phases:

1. **Foundation & Harness**
2. **Surface Field Layer**
3. **Patch Extraction & Event Resolution**
4. **Minimal Detached Event Birth**
5. **Minimal Detached Sheet Layer**
6. **Carrier Support Integration**
7. **Breakup, Necking, and Spray**
8. **Recapture and Return Routing**
9. **Diagnostics Console Maturation**
10. **Performance, LOD, and Budget Hardening**
11. **Hero Event Quality and Production Readiness**

Each phase below includes goals, dependencies, deliverables, risks, and exit criteria.

---

# Phase 1 — Foundation & Harness

## 3. Goal

Create the simulation harness, benchmark scene framework, diagnostics foundation, and deterministic control structure required for all later phases.

## 4. Why This Phase Exists

Without a harness, every later result becomes hard to reproduce, compare, or debug.

## 5. Core Deliverables

* benchmark scene loader / switcher
* resettable deterministic scene states
* pause / step / replay seed support
* baseline viewport and debug overlay architecture
* counter strip and frame timing strip
* top-level parameter group system
* initial save/load of tuning presets

## 6. Required Inputs

* basic engine shell
* rendering viewport
* current surface simulation scaffold

## 7. Recommended Subtasks

### 7.1 Scene Harness

Implement:

* scene registry
* scene reset contract
* scene parameter injection
* deterministic random seed or controlled event playback

### 7.2 Diagnostics Bootstrap

Implement:

* overlay mode enum
* debug color pipeline
* on-screen counters
* frame time breakdown placeholders

### 7.3 Session State

Implement:

* pause
* resume
* single-step
* reset
* preset save/load

## 8. Risks

* trying to build too much simulation before replay and diagnostics exist
* poor scene reset logic leading to ghost state

## 9. Exit Criteria

This phase is complete when:

* at least 3 canonical scenes can be loaded and reset deterministically
* pause/step/reset works reliably
* basic on-screen counters and overlay toggles function
* a parameter preset can be saved and restored

## 10. Handoff Chunk Suggestions

Good coding-agent chunks:

* scene harness module
* diagnostics bootstrap overlay module
* session preset/state manager

---

# Phase 2 — Surface Field Layer

## 11. Goal

Build the latent field layer on top of the attached surface so the engine can reason about rupture, directionality, coherence, and detachable budget.

## 12. Why This Phase Exists

Without this phase, later event logic will be heuristic chaos instead of structured regime intent.

## 13. Core Deliverables

* textures for `eta`, `etaDot`, `U`, `R`, `C`, `M` (and optionally `A`)
* field update passes
* visualization overlays for these fields
* stable normalized parameter blocks

## 14. Dependencies

Requires Phase 1 harness and overlay framework.

## 15. Recommended Subtasks

### 15.1 Surface Momentum `U`

Implement:

* body/impact directional injection
* damping/diffusion
* debug visualization

### 15.2 Rupture Potential `R`

Implement first normalized formula using:

* slope
* curvature
* up velocity
* momentum magnitude
* impact memory
* reservoir bias

### 15.3 Coherence `C`

Implement first persistence-based coherence metric.

### 15.4 Reservoir `M`

Implement:

* baseline refill
* future drain contract
* debug visualization

### 15.5 Adhesion `A` (Optional Early / Required Soon)

If budget allows, add early. If not, stub the channel now so later integration is easier.

## 16. Risks

* overcomplicated formulas too early
* non-normalized field ingredients
* fields flickering because hysteresis/persistence is missing

## 17. Exit Criteria

This phase is complete when:

* `R`, `C`, `M`, and `U` are visible and stable
* calm impulse scene does not create patch spam
* oblique impact scene produces directional bias in `U`
* traveling crest scene shows plausible `R` buildup

## 18. Handoff Chunk Suggestions

* surface field compute pass set
* field visualization overlay set
* normalized field parameter schema

---

# Phase 3 — Patch Extraction & Event Resolution

## 19. Goal

Turn dense field intent into sparse coherent event candidates.

## 20. Why This Phase Exists

This is the bridge from “surface wants something” to “the engine decides what to do.”

## 21. Core Deliverables

* rupture seed pass
* patch extraction pass
* patch summary buffer
* event resolution pass
* event counters and overlay labels

## 22. Dependencies

Requires stable field layer from Phase 2.

## 23. Recommended Subtasks

### 23.1 Rupture Seeds

Implement seed identification from `R`, `M`, and suppression rules.

### 23.2 Patch Grouping

Implement approximate local grouping with:

* radius-based growth
* direction compatibility
* minimum area
* consumed texel suppression

### 23.3 Patch Summary

Compute:

* centroid
* extent
* average normal
* average `R`, `C`, `M`, `A`
* direction
* priority

### 23.4 Event Resolution

Implement first decision between:

* no event
* packet/jet event
* sheet event (stub or placeholder if detached sheets not yet built)

## 24. Risks

* patch spam from low thresholds
* unstable direction summaries
* event chatter frame to frame

## 25. Exit Criteria

This phase is complete when:

* one meaningful disturbance yields one or a few meaningful patches instead of dozens
* event resolution is visible and mostly stable frame-to-frame
* patch overlays align with visual surface energy

## 26. Handoff Chunk Suggestions

* rupture patch extraction pipeline
* patch inspector data model
* event resolve scoring module

---

# Phase 4 — Minimal Detached Event Birth

## 27. Goal

Create the first actual detached outputs from resolved events without yet requiring full sheet sophistication.

## 28. Why This Phase Exists

This phase proves the event architecture can birth sparse detached behavior and drain surface budgets cleanly.

## 29. Core Deliverables

* packet / jet birth events
* drain map application to `M`
* detached event counters
* initial reentry stubs

## 30. Dependencies

Requires stable patch and event resolution from Phase 3.

## 31. Recommended Subtasks

### 31.1 Birth Velocity Synthesis

Implement:

* lift
* throw
* spread
* noise

### 31.2 Budget Drain

Implement explicit drain map and reservoir consumption.

### 31.3 Minimal Detached Visuals

Temporary forms may include:

* packet glyphs
* stub ribbon placeholders
* simple debug geometry

### 31.4 Return Stub

Allow detached packets to reenter and generate basic feedback events.

## 32. Risks

* detached birth looks like generic nozzle behavior
* detached objects create apparent water without draining the surface
* reentry ignored entirely

## 33. Exit Criteria

This phase is complete when:

* events visibly drain `M`
* detached births are directionally distinct across scenes
* reentry stubs can feed at least minimal impulse back to surface

## 34. Handoff Chunk Suggestions

* drain map path
* packet birth pass
* reentry stub path

---

# Phase 5 — Minimal Detached Sheet Layer

## 35. Goal

Introduce the first true detached-sheet representation so detached coherent water is no longer only packets or raw particles.

## 36. Why This Phase Exists

This is the first phase that directly attacks the bead-soup problem.

## 37. Core Deliverables

* one ribbon family
* one patch or fan family (optional but strongly recommended)
* sheet object buffer
* sheet node/control-point buffer
* sheet render prep pass
* sheet inspector overlays

## 38. Dependencies

Requires detached event birth and drain logic from Phase 4.

## 39. Recommended Subtasks

### 39.1 Ribbon Family

Implement:

* birth from directional patches
* control points / nodes
* render prep to strip mesh

### 39.2 Patch/Fan Family (Optional First / Recommended Soon)

Implement small parametric patch for fan or crown-like events.

### 39.3 Sheet Metrics

Track:

* thickness
* stretch
* stability
* damage (even if simplified)

### 39.4 Inspector / Overlay Support

Add thickness and stretch overlays plus sheet bounds.

## 40. Risks

* detached sheet looks ghosted or disconnected
* too much render complexity too early
* no clear improvement over packets

## 41. Exit Criteria

This phase is complete when:

* detached coherent water visibly holds together better than packet-only mode
* ribbon detachment can be seen in oblique fan or crest-peel scenarios
* thickness and stretch overlays are working

## 42. Handoff Chunk Suggestions

* ribbon sheet family implementation
* sheet render-prep module
* sheet inspector UI integration

---

# Phase 6 — Carrier Support Integration

## 43. Goal

Give detached sheets internal support and motion guidance from carriers so the sheet becomes a skin riding a momentum-carrying substrate instead of a decorative ghost.

## 44. Why This Phase Exists

This phase is what makes detached sheets feel physically inhabited rather than purely kinematic.

## 45. Core Deliverables

* carrier pool or packet-support layer
* carrier-to-sheet support sampling
* support density metric
* support-aware thickness/stability updates

## 46. Dependencies

Requires minimal sheet layer from Phase 5.

## 47. Recommended Subtasks

### 47.1 Carrier Record and Pool

Implement fixed-capacity carrier or packet pool.

### 47.2 Carrier Birth

Spawn carrier support from new detached sheet births.

### 47.3 Support Sampling

For each sheet node:

* gather support density
* gather mean support velocity
* gather disorder

### 47.4 Blended Support Coupling

Blend node velocity and thickness behavior toward support.

## 48. Risks

* expensive neighbor search too early
* oscillation between carriers and sheet nodes
* support too weak to matter or too strong to look rigid

## 49. Exit Criteria

This phase is complete when:

* detached sheets no longer visibly drift away from their underlying motion
* support density meaningfully influences stability / thickness behavior
* carrier overlays and inspector values are readable

## 50. Handoff Chunk Suggestions

* carrier buffer and birth path
* node support gather pass
* support/stability coupling module

---

# Phase 7 — Breakup, Necking, and Spray

## 51. Goal

Introduce controlled failure of detached coherent structures through necking, tear, edge fray, and fragment conversion.

## 52. Why This Phase Exists

This phase solves the difference between convincing tendrils and cursed rubber ribbons.

## 53. Core Deliverables

* neck score
* damage accumulation
* tear candidates
* edge fray logic
* fragment birth pass
* fragment overlays and counters

## 54. Dependencies

Requires detached sheet metrics and support integration from Phases 5 and 6.

## 55. Recommended Subtasks

### 55.1 Necking Model

Implement thinness + stretch + support loss based neck score.

### 55.2 Tear Logic

Implement local tear rules for ribbons and patch edges.

### 55.3 Fragment Birth

Spawn:

* pinch-off droplets
* fine edge spray
* chaotic burst only when genuinely warranted

### 55.4 Breakup Diagnostics

Expose:

* neck score overlay
* tear candidate overlay
* fragment source labels

## 56. Risks

* instant confetti spray
* no breakup at all
* all-or-nothing destruction instead of local failure

## 57. Exit Criteria

This phase is complete when:

* ligament stretch test shows visible necking before pinch-off
* crown edge fray progresses locally, not globally
* fragments are spatially tied to actual tear regions

## 58. Handoff Chunk Suggestions

* necking/damage module
* tear pass
* spray/fragment birth pipeline

---

# Phase 8 — Recapture and Return Routing

## 59. Goal

Close the loop so detached material can return to the attached surface with meaningful consequences.

## 60. Why This Phase Exists

Without this phase, the engine becomes an ever-expanding graveyard of detached clutter and dead-end events.

## 61. Core Deliverables

* recapture candidate detection
* return routing into `M`, `U`, and `etaDot`
* soft merge vs hard reentry split
* return overlays and counters

## 62. Dependencies

Requires detached sheet and fragment systems from earlier phases.

## 63. Recommended Subtasks

### 63.1 Surface Projection Queries

Implement projection from detached object to surface sample.

### 63.2 Return Classification

Classify:

* soft merge
* hard reentry
* partial recapture
* reentry with foam/aeration seed

### 63.3 Routing Outputs

Write back to:

* reservoir return
* surface impulse
* tangential momentum return
* auxiliary fields where applicable

## 64. Risks

* every return acts like explosion
* no visible consequence of return
* return budgets not actually restored

## 65. Exit Criteria

This phase is complete when:

* detached structures visibly and measurably rejoin the surface
* soft and hard return cases are meaningfully distinguishable
* surface fields visibly respond to returned energy/mass

## 66. Handoff Chunk Suggestions

* recapture route pass
* return classification logic
* surface feedback application pass

---

# Phase 9 — Diagnostics Console Maturation

## 67. Goal

Expand the console from basic overlays to a true laboratory interface with inspectors, timeline, event log, replay, and compare workflows.

## 68. Why This Phase Exists

By this point the simulation is too complex to manage with minimal overlays.

## 69. Core Deliverables

* patch inspector
* sheet inspector
* carrier and fragment inspector
* timeline / event log
* snapshot compare
* diagnostics presets
* benchmark parameter panels

## 70. Dependencies

Requires sufficient runtime data from earlier phases.

## 71. Recommended Subtasks

### 71.1 Context Inspectors

Build context-sensitive right-dock inspection.

### 71.2 Timeline and Event Log

Add clickable event history.

### 71.3 Snapshot Compare

Implement before/after comparison workflow.

### 71.4 AI Summary Export

Optional but strongly valuable: copyable machine-readable debug summary.

## 72. Risks

* diagnostics console lags behind actual runtime state
* too many panels with no hierarchy
* no compare workflow, leading to tuning fog

## 73. Exit Criteria

This phase is complete when:

* major runtime objects can be inspected interactively
* timeline and event log are usable
* diagnostics presets reduce panel chaos
* snapshot compare works

## 74. Handoff Chunk Suggestions

* inspector system
* event log timeline widget
* snapshot compare and export tools

---

# Phase 10 — Performance, LOD, and Budget Hardening

## 75. Goal

Make the system robust on target hardware through caps, downgrades, sparse discipline, and graceful degradation.

## 76. Why This Phase Exists

A convincing system that only survives on a monster machine is still unfinished.

## 77. Core Deliverables

* active caps for patches, sheets, nodes, carriers, fragments
* family-specific LOD
* hero region prioritization
* downgrade and cull policies
* performance diagnostics refinement

## 78. Dependencies

Requires most runtime systems to exist.

## 79. Recommended Subtasks

### 79.1 Hard Cap Strategy

Define and enforce hard capacities.

### 79.2 LOD Downgrades

Examples:

* far sheets -> simpler ribbons
* far packets -> lower carrier counts
* far spray -> shorter lifetime or impostor rendering

### 79.3 Importance Metrics

Implement camera/distance/event-strength based priority.

### 79.4 Budget Telemetry

Expose cap hit rates and downgrade counts.

## 80. Risks

* bolting on LOD too late
* ugly popping due to poor downgrade transitions
* fragment overload crushing frame time

## 81. Exit Criteria

This phase is complete when:

* hero stress test does not catastrophically collapse
* caps and downgrade events are visible and controllable
* target hardware runs the system within acceptable budgets in benchmark scenes

## 82. Handoff Chunk Suggestions

* LOD manager
* active-cap enforcement layer
* importance-scoring module

---

# Phase 11 — Hero Event Quality and Production Readiness

## 83. Goal

Polish the hybrid system until it consistently achieves strong hero events, robust return behavior, and stable benchmark performance.

## 84. Why This Phase Exists

This is where the engine proves it is more than a prototype pile of subsystems.

## 85. Core Deliverables

* hero benchmark scene pack
* polished event-family tuning
* production-ready preset library
* finalized validation pass/fail board
* showcase captures / clips

## 86. Dependencies

Requires all prior systems functioning coherently.

## 87. Recommended Subtasks

### 87.1 Hero Benchmark Pass

Tune against:

* Cinematic Crown Impact
* Oblique Slash Fan
* Crest Peel
* Ligament Pinch-Off Closeup
* Full Mixed-Regime Event

### 87.2 Failure Atlas Audit

Cross-check wrong-look signatures against actual runtime failures and update tuning/diagnostics accordingly.

### 87.3 Preset Library Finalization

Create named presets:

* Strong Crown
* Directional Fan
* Hero Ligament
* Soft Return
* Stress Test LOD

### 87.4 Capture and Review Workflow

Generate repeatable captures for before/after quality review.

## 88. Risks

* polishing too early before core instability is solved
* overfitting to one hero scene
* visually strong captures masking hidden budget or recapture failures

## 89. Exit Criteria

This phase is complete when:

* hero benchmark scenes pass visually and structurally
* validation manual milestone ladder is satisfied
* system is stable enough for broader production integration

## 90. Handoff Chunk Suggestions

* hero benchmark tuning pass
* preset curation pass
* validation audit pass

---

## 91. Cross-Phase Dependency Table

### 91.1 Strict Dependencies

* Phase 2 depends on Phase 1
* Phase 3 depends on Phase 2
* Phase 4 depends on Phase 3
* Phase 5 depends on Phase 4
* Phase 6 depends on Phase 5
* Phase 7 depends on Phases 5 and 6
* Phase 8 depends on Phases 5 through 7
* Phase 9 depends on runtime data from Phases 3 through 8
* Phase 10 depends on broad runtime maturity
* Phase 11 depends on all major systems existing

### 91.2 Parallelizable Work

Some work can happen in parallel if carefully coordinated:

* Phase 1 diagnostics shell can overlap with early Phase 2 field visualization
* parts of Phase 9 console development can overlap with runtime phases
* parts of Phase 10 performance instrumentation can begin early
* benchmark authoring and atlas cross-linking can happen alongside core simulation work

---

## 92. Suggested Agent / Team Allocation

If multiple agents or contributors work in parallel, responsibilities can be divided as follows.

### 92.1 Surface / Field Agent

Focus:

* heightfield updates
* `U`, `R`, `C`, `M`, `A`
* field overlays
* patch seeds

### 92.2 Event / Sparse Logic Agent

Focus:

* patch extraction
* event resolution
* drain map
* event buffers

### 92.3 Detached Sheet Agent

Focus:

* sheet object/node model
* ribbon/patch families
* render prep
* necking/tear

### 92.4 Carrier / Fragment Agent

Focus:

* carrier pool
* support gathering
* fragment birth/update
* return candidates

### 92.5 UI / Console Agent

Focus:

* overlays
* inspector panels
* benchmark launcher
* timeline/log/snapshot compare

### 92.6 Validation / Benchmark Agent

Focus:

* scene library
* milestone board tracking
* hero benchmarks
* pass/fail reporting

This division is extremely useful as long as everyone honors the shared contracts instead of improvising in glorious isolation.

---

## 93. Milestone Review Template

Every milestone review should answer the following:

### 93.1 What Was Built?

* passes added
* UI added
* scenes affected
* new diagnostics available

### 93.2 What Now Works?

* canonical scenes improved
* counters stable
* event family newly represented

### 93.3 What Still Fails?

* known wrong-look signatures
* performance regressions
* missing feedback loops

### 93.4 What Evidence Supports the Claim?

* benchmark scene names
* capture IDs
* parameter presets used
* counters / timings

### 93.5 What Is the Next Smallest Valuable Step?

This prevents giant drifting wishlists.

---

## 94. Anti-Swamp Rules

These rules should be followed ruthlessly.

### 94.1 Do Not Add a New Event Family Before the Current One Is Legible

### 94.2 Do Not Tune Breakup Until Detached Birth Direction Is Convincing

### 94.3 Do Not Tune Recapture Until Return Routing Exists

### 94.4 Do Not Trust Pretty Captures Without Benchmark Replays

### 94.5 Do Not Add More Particles to Solve a Surface Continuity Problem First

### 94.6 Do Not Let the Diagnostics Console Lag Too Far Behind Runtime Complexity

These rules are boring, and that is why they save projects.

---

## 95. First Recommended Execution Sprint

If starting immediately, the first sprint should target:

### Sprint Goal

Reach the end of Phase 2 and lay the groundwork for Phase 3.

### Sprint Deliverables

* benchmark harness
* pause/reset/step
* field textures and overlays for `U`, `R`, `C`, `M`
* first normalized formulas
* calm impulse / vertical drop / oblique impact scenes
* counter strip and basic top bar controls

### Sprint Success Test

A developer can:

* switch scenes
* inspect fields live
* confirm directional `U`
* confirm plausible `R` hot zones
* confirm `M` is not trivial nonsense

This is the right place to start. Not with ten thousand droplets. Not with a cathedral of ligaments. With the field spine.

---

## 96. Closing Principle

A project like this succeeds when its ambition is organized into a ladder of earned complexity.

This milestone board exists to protect the engine from two equal and opposite disasters:

* oversimplifying until it can never achieve the target look
* overbuilding too early until it becomes impossible to reason about

The wise path is the narrow one:

build the structure that the visuals genuinely require,
prove each rung,
then climb.

---

## 97. Planned Next Operational Documents

1. **Hero Event Benchmark Pack** — formal cards for named benchmark scenes, targets, and pass/fail signatures
2. **Reference Capture Companion** — archive format for benchmark stills, clips, notes, and parameter state
3. **Runtime Data Model / Editor Schema** — preset, scene, overlay, and inspector data serialization contracts
4. **Agent Handoff Prompt Pack** — concrete prompts for coding agents aligned with the milestone board




























# Hybrid Water Visual Review Governance & Snapshot Pipeline

## A governance document for visual sign-off authority, snapshot evidence, external vision review, and auditable approval states in the hybrid water engine

---

## 0. Purpose

This document defines the rules and workflow for visual review in the hybrid water project.

Its purpose is to prevent one of the most common and destructive failures in AI-assisted graphics development:

**allowing a non-visual or weakly visual AI system to declare that the water “looks correct.”**

In this project, structural reasoning and visual approval are explicitly separated.

This document defines:

* who is allowed to approve visuals
* who is not allowed to approve visuals
* how snapshots and review packets are captured
* how external visual review is requested
* how verdicts are recorded
* how structural pass/fail states differ from visual pass/fail states
* how benchmark history stores review evidence over time

This document is not optional policy fluff. It is a hard safety rail for development quality.

---

## 1. Core Principle

### 1.1 Visual Sign-Off Is Gated

The project must adopt the following hard rule:

**Generic coding/reasoning AI systems are never authorized to grant final visual approval.**

They may assist with:

* structural diagnosis
* field interpretation
* counter analysis
* event/log analysis
* likely-cause reasoning
* parameter suggestions
* pass ordering and architecture suggestions

They may not be treated as authoritative for:

* whether the splash looks right
* whether a benchmark visually passes
* whether an event family reads correctly to the eye
* whether artistic/perceptual targets have been met

### 1.2 Authorized Visual Review Sources

Visual sign-off may only come from one or more of the following:

* a human reviewer
* a designated high-capability visual evaluation model explicitly approved for image understanding
* a designated hybrid review path where a human interprets outputs from a specialized visual model

### 1.3 Structural and Visual Success Are Not the Same

A scene may be:

* structurally healthy but visually wrong
* visually impressive but structurally unsound
* both structurally and visually strong
* neither

The project must preserve this distinction at all times.

---

## 2. Sign-Off Authority Matrix

### 2.1 Reviewer Classes

The project should explicitly distinguish reviewer classes.

#### Class A — Structural AI

Examples:

* coding agents
* reasoning agents
* architecture agents
* general LLMs without designated image-review authority

Allowed actions:

* analyze diagnostics
* read counters and event logs
* infer likely causes
* recommend changes
* declare `structurally_passed` or `structurally_failed` if permitted by project workflow

Forbidden actions:

* declare `visually_approved`
* overrule human visual judgment
* act as final authority on benchmark appearance

#### Class B — Visual Specialist AI

Examples:

* explicitly chosen image-understanding models
* designated external image reviewers
* multimodal systems approved for visual assessment

Allowed actions:

* evaluate snapshot packets
* comment on whether event family reads correctly
* compare captures against intended visual targets
* produce review notes and a provisional visual verdict

Restrictions:

* only valid if the project explicitly designates the model as a visual-review authority
* verdict must be attached to actual snapshot evidence and review metadata

#### Class C — Human Reviewer

Allowed actions:

* final visual approval
* final visual rejection
* arbitration when reviewers disagree
* acceptance of benchmark visual quality

### 2.2 Practical Rule

If there is any ambiguity, visual approval defaults back to the human reviewer.

---

## 3. Review State Model

The runtime, benchmark system, and review archive should distinguish at least the following states.

### 3.1 Structural States

* `structurally_untested`
* `structurally_pending`
* `structurally_passed`
* `structurally_failed`

### 3.2 Visual States

* `visually_untested`
* `visually_pending_human_review`
* `visually_pending_external_vision_review`
* `visually_reviewed_needs_iteration`
* `visually_approved`
* `visually_rejected`

### 3.3 Combined Benchmark Status

A benchmark card may therefore exist in combinations like:

* structurally passed / visually pending
* structurally passed / visually rejected
* structurally failed / visually untested
* structurally passed / visually approved

This should be explicit in the UI and archive.

---

## 4. Structural Review vs Visual Review

## 4.1 Structural Review Questions

Structural review may ask:

* Did `R`, `C`, `M`, and `U` behave plausibly?
* Did patch extraction remain coherent?
* Did event routing drain budget correctly?
* Did detached sheets recapture appropriately?
* Were counters bounded?
* Were timings acceptable?

These questions are appropriate for general AI systems and engineering diagnostics.

## 4.2 Visual Review Questions

Visual review asks different questions:

* Does this read as a crest-lip peel rather than an upward jet?
* Does the crown wall feel coherent before fraying?
* Does the ligament show delayed necking rather than instant bead soup?
* Does detached water still read as water rather than rubber membrane?
* Does the return read as a soft merge or a violent reimpact, and is that visually appropriate?

These questions require image evidence and perceptual judgment.

---

## 5. Snapshot Packet Philosophy

### 5.1 Why Snapshot Packets Exist

Visual review should never rely on:

* memory
* a casual screenshot with missing context
* a random frame with unknown camera state
* vague verbal descriptions of what “looked wrong”

Instead, visual review should be based on a **snapshot packet** that captures the visual evidence and the simulation context together.

### 5.2 The Snapshot Packet Is the Unit of Visual Review

Every visual verdict should point to one or more snapshot packets.

A snapshot packet is a structured bundle containing:

* image or clip evidence
* exact camera state
* exact scene/preset state
* exact benchmark identity
* review brief and intended target
* associated runtime diagnostics summary

This makes the review reproducible and auditable.

---

## 6. Snapshot Packet Schema

A snapshot packet should contain, at minimum, the following categories.

## 6.1 Identity Metadata

* snapshot packet id
* benchmark scene id
* scene name
* benchmark family label
* capture timestamp
* simulation frame index or timecode
* deterministic seed if applicable
* session id / preset id

## 6.2 Camera Metadata

* camera position
* camera orientation
* target / look-at
* field of view
* near/far clip values
* projection type
* camera preset name

## 6.3 Rendering Metadata

* active shader/material mode
* lighting/environment preset
* tone mapping / exposure state if relevant
* beauty/debug mode identifier
* LOD mode summary
* active water render features

## 6.4 Simulation Metadata

* active tuning preset
* active diagnostics preset
* dominant event families currently detected
* key counters at capture time
* active patch count
* active sheet count
* active carrier count
* active fragment count
* performance strip summary

## 6.5 Evidence Media

At minimum one of:

* beauty screenshot
* short clip

Ideally multiple media types.

## 6.6 Review Metadata

* mission statement
* expected regime chain
* specific review question(s)
* known current weakness
* intended benchmark target
* sign-off class requested (human / visual specialist AI / both)

---

## 7. Multi-Angle Review Sets

### 7.1 Why a Single Image Is Often Not Enough

A single flattering frame can hide major failures such as:

* ghosted detached geometry
* poor thickness evolution
* wrong directionality
* recontact errors
* dead return behavior

### 7.2 Recommended Snapshot Set

A serious review packet should support a multi-angle set such as:

* **beauty hero camera**
* **side/profile camera**
* **top-down or orthographic camera**
* **field overlay view**
* **detached-sheet anatomy view**
* **short temporal clip or frame strip**

### 7.3 Minimal vs Full Review Packets

#### Minimal Packet

* 1 beauty screenshot
* camera metadata
* benchmark metadata
* review question

#### Standard Packet

* 2–4 images from multiple angles
* runtime diagnostics summary
* one short clip or frame strip

#### Full Review Packet

* full standard packet
* side-by-side beauty/debug captures
* benchmark notes
* parameter diff from previous approved attempt

---

## 8. Review Brief Design

Each packet should include a concise, structured review brief.

### 8.1 Review Brief Fields

* target event family
* expected regime chain
* suspected current failure mode
* exact question to reviewer
* review focus priority
* forbidden assumptions

### 8.2 Example Review Briefs

#### Example A — Crest Peel

* target event family: `crest_lip_peel`
* expected regime chain: `traveling crest -> detached lip -> plunge -> return`
* suspected failure: `hose-like upward bias`
* question: `Does this read as forward peel rather than vertical jet?`

#### Example B — Ligament Closeup

* target event family: `primary_ligament_ribbon`
* expected regime chain: `sheet edge -> ligament -> necking -> pinch-off`
* suspected failure: `bead soup too early`
* question: `Is there visible necking before breakup, or does it granularize too early?`

#### Example C — Soft Return

* target event family: `soft_recontact_merge`
* expected regime chain: `detached sheet -> low-speed return -> soft merge`
* suspected failure: `every return looks explosive`
* question: `Does this return read as a soft merge rather than a secondary impact burst?`

---

## 9. External Visual Review Workflow

### 9.1 Canonical Workflow

The project should support the following explicit workflow:

1. run benchmark scene
2. reach review-worthy state
3. capture snapshot packet
4. attach review brief
5. route to designated reviewer
6. receive review notes and verdict
7. record result in benchmark history
8. update benchmark status

### 9.2 Reviewer Routing

Possible routing targets:

* human-only review
* visual-specialist-AI-only provisional review
* visual-specialist AI followed by human confirmation
* human arbitration when model and prior expectations conflict

### 9.3 Hard Rule

Do **not** auto-mark `visually_approved` simply because a generic AI debug assistant produced optimistic language.

---

## 10. Review Verdict Model

A review verdict should contain both categorical and descriptive elements.

### 10.1 Verdict Fields

* verdict state
* reviewer class
* reviewer identity or source
* confidence if applicable
* benchmark id
* snapshot packet id
* notes
* recommended next action

### 10.2 Example Recommended Next Actions

* `approve`
* `iterate_birth_direction`
* `iterate_detached_sheet_continuity`
* `iterate_necking_timing`
* `iterate_recontact_behavior`
* `collect_more_angles`
* `needs_human_arbitration`

### 10.3 Provisional vs Final Approval

If a visual-specialist AI is used, its verdict may optionally be stored as:

* `provisional_visual_review`

with final conversion to `visually_approved` requiring human confirmation, depending on project policy.

---

## 11. Benchmark History Integration

### 11.1 Each Benchmark Should Carry Review History

A benchmark card should record:

* structural status history
* visual review history
* snapshot packet references
* reviewer notes
* parameter preset references
* capture media references

### 11.2 Why This Matters

Without historical review context, teams repeatedly forget:

* what was previously wrong
* which tuning improved the look
* whether a “better” version was actually better

### 11.3 Suggested Benchmark Review Timeline

For each benchmark, maintain a timeline such as:

* first structurally stable version
* first detached-sheet credible version
* first acceptable breakup version
* first acceptable recapture version
* latest approved visual version

That creates an actual developmental memory.

---

## 12. UI Requirements for Review Governance

The diagnostics console should visibly support this governance model.

### 12.1 Required UI Elements

* snapshot packet capture button
* review brief editor
* review state badges
* benchmark status panel showing structural vs visual states
* review history list
* external review export action
* compare current capture vs last approved capture

### 12.2 Review Status Badges

The UI should visibly show states like:

* `STRUCTURAL PASS`
* `VISUAL PENDING`
* `VISUAL REJECTED`
* `VISUAL APPROVED`

These should not be hidden in submenus. They are central truth labels.

### 12.3 Review Source Display

Each approval/rejection should visibly indicate source:

* Human
* External Vision Model
* Human Confirmed External Model Review

---

## 13. Auditability and Record Storage

### 13.1 Every Visual Verdict Must Be Traceable

Each verdict should be tied to:

* snapshot packet id
* media reference
* benchmark id
* preset id
* reviewer identity/source
* review date/time
* notes

### 13.2 Why Auditability Matters

Without auditability, visual approval becomes hand-wavy mythology. That is exactly what this policy exists to prevent.

### 13.3 Storage Advice

Store review records in a structured, queryable form rather than only in freeform notes.

Useful fields:

* benchmark name
* event family
* verdict
* major failure signature
* linked media
* linked preset
* linked scene configuration

---

## 14. Anti-Failure Rules

These rules should be treated as hard constraints.

### 14.1 No Generic AI Visual Sign-Off

A generic AI may never be the final authority for visual approval.

### 14.2 No Review Without Evidence

No benchmark may be visually approved without linked snapshot evidence.

### 14.3 No Approval From a Single Ambiguous Frame

If the event is temporally important, include a clip or frame strip.

### 14.4 No Approval Without Context Metadata

A screenshot without camera, preset, benchmark, and scene context is not enough.

### 14.5 No Mixing Structural Pass With Visual Pass

These must remain explicitly separate states.

### 14.6 No Silent Reviewer Identity

The source of every visual verdict must be recorded.

---

## 15. Recommended Integration With Other Documents

### 15.1 Validation Manual

The validation manual defines benchmark scenes and milestone criteria.

This governance document defines how visual approval for those benchmarks is actually granted.

### 15.2 Visual Regime Atlas

The atlas provides the target event family language and wrong-look categories that should appear in review briefs.

### 15.3 Diagnostics Console Spec

The console spec should support capture, export, and review badges consistent with this document.

### 15.4 Implementation Milestone Board

The milestone board should treat visual sign-off as a separate gate from structural completion.

---

## 16. Suggested First Implementation Slice

A wise first implementation of this governance system should include:

* snapshot packet capture
* review brief text fields
* structural vs visual status badges
* review history list
* exportable review packet bundle
* compare-to-last-approved snapshot view

This is enough to establish discipline without building an absurd bureaucracy monster on day one.

---

## 17. Example Review Record

```text
benchmark_id: H3_CrestPeel
snapshot_packet_id: snap_00421
structural_state: structurally_passed
visual_state: visually_reviewed_needs_iteration
review_source: external_vision_model_designated
review_timestamp: 2026-02-26T18:42:13Z
preset_id: crest_peel_iter_07
camera_preset: hero_side_close
mission: assess whether crest detaches forward as a lip rather than erupting vertically
notes:
- forward throw improved
- still too much upward nozzle bias at first release
- detached sheet continuity better than prior capture
recommended_next_action: iterate_birth_direction
```

This is the kind of sober, useful record that saves months of confusion.

---

## 18. Closing Principle

A hybrid water system becomes far more trustworthy when it acknowledges a simple truth:

**structural intelligence and visual intelligence are not the same thing.**

Generic AI can help reason about the machinery.
Humans and explicitly chosen vision-specialist systems must judge the look.
Snapshot packets provide the evidence.
Review history provides the memory.
And explicit governance prevents the project from drifting into false confidence.

That is not bureaucracy for its own sake.
It is how a visually ambitious simulation protects itself from convincing nonsense.

---

## 19. Planned Companion Documents

1. **Hero Event Benchmark Pack** — formal benchmark cards with target event families and review prompts
2. **Reference Capture Companion** — structured archive system for captures, clips, packet ids, and review notes
3. **Runtime Data Model / Editor Schema** — serialization contracts for snapshot packets, review states, and review history
4. **Agent Handoff Prompt Pack** — prompts that explicitly preserve the structural-vs-visual authority boundary



























# Hybrid Water Hero Event Benchmark Pack

## Formal benchmark cards for showcase water events, structural checks, visual review prompts, and approval workflow integration

---

## 0. Purpose

This document defines the formal benchmark pack for the hybrid water engine.

Its purpose is to turn major showcase events into repeatable, reviewable benchmark cards with:

* canonical setup
* target event family
* expected regime chain
* expected field signatures
* expected wrong-look signatures
* structural validation checks
* snapshot packet requirements
* visual review prompts
* pass/fail criteria

This benchmark pack is the practical scoreboard for the project.

It should be used together with:

* the **Validation Manual**
* the **Visual Regime Atlas**
* the **Visual Review Governance & Snapshot Pipeline**
* the **Implementation Milestone Board**

---

## 1. Benchmark Philosophy

### 1.1 A Benchmark Is Not Just a Scene

A benchmark is a contract between:

* a scene setup
* an intended event family
* a structural expectation
* a visual expectation
* a review protocol

### 1.2 Each Benchmark Must Be Repeatable

A valid benchmark card should always specify:

* deterministic seed or reproducible setup
* camera presets
* tuning preset used
* scene parameters
* review packet requirements

### 1.3 Each Benchmark Must Distinguish Structural and Visual Success

A benchmark may:

* structurally pass while visually failing
* structurally fail while producing a pretty frame
* pass both

This distinction must be explicit.

### 1.4 Each Benchmark Should Target a Specific Water Truth

Every benchmark must be designed to teach the engine one hard lesson.

Examples:

* radial coherence
* directional throw
* delayed breakup
* necking before pinch-off
* soft return vs hard reentry
* budget-bounded behavior under stress

---

## 2. Benchmark Card Template

Every benchmark card should contain the following sections.

### 2.1 Identity

* benchmark id
* benchmark name
* event family or family composition
* priority tier
* milestone relevance

### 2.2 Setup

* scene description
* object/body configuration
* initial conditions
* tunable parameters
* deterministic seed requirements

### 2.3 Camera Pack

* primary beauty camera
* side/profile camera
* top-down/orthographic camera
* optional detached-sheet anatomy camera

### 2.4 Expected Regime Chain

The intended progression of representations and behaviors.

### 2.5 Expected Field Signatures

How `R`, `C`, `M`, `A`, and `U` should broadly behave.

### 2.6 Expected Structural Behaviors

What the simulation should do in terms of events, budgets, sheets, breakup, and recapture.

### 2.7 Expected Wrong Looks

What common incorrect versions look like.

### 2.8 Structural Check List

Specific checks that can be answered from diagnostics and counters.

### 2.9 Visual Review Prompt Set

Specific questions for human or designated visual-specialist review.

### 2.10 Snapshot Packet Requirements

What images/clips/angles are required before visual review.

### 2.11 Pass / Fail Gates

Separate structural and visual pass gates.

---

## 3. Priority Tiers

### Tier 1 — Foundational Hero Benchmarks

These define whether the hybrid system is actually working at a high level.

* H1 Cinematic Crown Impact
* H2 Oblique Slash Fan
* H3 Crest Peel
* H4 Ligament Pinch-Off Closeup
* H5 Full Mixed-Regime Event

### Tier 2 — Structural Discipline Benchmarks

These stress narrow subsystems.

* calm impulse sanity
  n- traveling crest pre-failure
* recapture merge test
* edge fray cascade
* packet vs sheet resolve split

### Tier 3 — Stress and LOD Benchmarks

These stress runtime practicality.

* hero stress test
* heavy fragment budget test
* multiple simultaneous detachments
* distant-event downgrade test

---

# H1 — Cinematic Crown Impact

## 4. Identity

* benchmark id: `H1_CinematicCrownImpact`
* event family: radial crown wall + central uplift + edge fray + collapse return
* priority tier: Tier 1
* milestone relevance: Phases 3 through 11, especially 5, 7, 8, 10, 11

## 5. Setup

### 5.1 Scene

A spherical or boulder-like object drops vertically into a calm water surface.

### 5.2 Tunable Parameters

* sphere radius
* impact velocity
* drop height
* water depth
* surface tension proxy settings if any
* detached sheet birth thresholds

### 5.3 Determinism

Must support deterministic replay.

## 6. Camera Pack

* beauty hero camera: angled three-quarter view of impact and crown rise
* side camera: profile of crown wall height and collapse
* top-down camera: radial symmetry and patch/ring structure
* optional sheet anatomy camera: detached wall thickness and edge fray

## 7. Expected Regime Chain

`attached impact -> radial rupture patch/ring -> crown wall sheet birth -> edge fray / ligament emission -> collapse -> reentry / recapture`

## 8. Expected Field Signatures

* `R` spikes strongly at impact center and ring region
* `U` exhibits radial outward pattern
* `C` high on early crown wall, lower later at fraying edge
* `M` drains locally into crown wall birth and later receives return
* `A` low during eruption, recovering during collapse

## 9. Expected Structural Behaviors

* one dominant crown event rather than patch confetti
* coherent early radial wall
* finite central uplift, not infinite nozzle
* edge fray later than wall birth
* visible return routing after collapse

## 10. Expected Wrong Looks

* central hose with no radial wall
* crown wall exploding instantly into spray
* crown wall remaining rigid and thick too long
* collapse with no surface consequence

## 11. Structural Check List

* does patch extraction identify coherent radial structure?
* does event resolution favor crown/sheet behavior over generic jet spam?
* is `M` visibly drained in the source region?
* are edge tear/fragment events delayed relative to sheet birth?
* does recapture or reentry write back into the surface?

## 12. Visual Review Prompt Set

* Does the event read as a coherent radial crown rather than a central nozzle with decoration?
* Does the wall feel like water skin before it begins to fray?
* Does the edge breakup feel progressive rather than instant confetti?
* Does the collapse return read as water rejoining water rather than dead particles disappearing?

## 13. Snapshot Packet Requirements

Required:

* beauty frame at crown peak
* side/profile frame at crown peak
* top-down radial structure frame
* short clip covering impact through early collapse
* optional detached-sheet thickness overlay frame

## 14. Pass / Fail Gates

### Structural Pass

* coherent crown event forms
* radial `U` pattern visible
* no obvious infinite emission
* delayed edge breakup present
* return routing observable

### Visual Pass

* human or designated visual reviewer confirms crown reads as coherent water wall
* no dominant hose look
* no dominant bead soup look before late breakup

---

# H2 — Oblique Slash Fan

## 15. Identity

* benchmark id: `H2_ObliqueSlashFan`
* event family: oblique impact fan + directional sheet + edge tendrils
* priority tier: Tier 1
* milestone relevance: Phases 2 through 11, especially 2, 3, 5, 7, 11

## 16. Setup

A sphere, blade-like proxy, or hull-like body enters or skims the surface at a shallow angle with strong tangential velocity.

### Tunable Parameters

* entry angle
* tangential velocity
* contact depth
* path length
* event bias weights for sheet vs jet

## 17. Camera Pack

* beauty camera: oblique three-quarter tracking view
* side camera: launch angle and fan thickness silhouette
* top-down camera: directional sweep and asymmetry
* optional ligament detail camera: edge tendrils

## 18. Expected Regime Chain

`oblique contact -> directional rupture patch -> fan-like sheet birth -> edge ribbons/tendrils -> breakup or reentry trail`

## 19. Expected Field Signatures

* `U` strongly biased along motion direction
* `R` elongated along sweep path
* `C` high in main fan body, lower at unstable edges
* `M` drains along directional birth region rather than isotropically

## 20. Expected Structural Behaviors

* asymmetrical sheet emission
* obvious forward throw
* repeated coherent births possible along path without patch chatter
* edge-localized ligament formation

## 21. Expected Wrong Looks

* vertical jets despite oblique forcing
* symmetric splash from asymmetric motion
* generic packet burst with no fan structure
* cloned repeated bursts along path

## 22. Structural Check List

* is `U` aligned with object motion?
* are patches elongated directionally rather than isotropic blobs?
* does event resolver prefer sheet/fan behavior over jet behavior?
* are repeated emissions budget-bounded?
* do edge ribbons emerge later than the main sheet?

## 23. Visual Review Prompt Set

* Does this read as water being dragged and thrown directionally rather than erupting upward?
* Is the fan visibly asymmetric in the correct direction?
* Do edge structures feel like tendrils from a sheet rather than arbitrary spray noise?

## 24. Snapshot Packet Requirements

Required:

* beauty frame during peak fan spread
* side/profile frame showing launch angle
* top-down directional field frame
* short clip of contact through fan evolution
* optional `U` overlay frame for diagnostics packet

## 25. Pass / Fail Gates

### Structural Pass

* directional `U` stable
* directional patch extraction stable
* fan or ribbon event chosen consistently
* no dominant hose or symmetric misfire

### Visual Pass

* reviewer confirms strong directional asymmetry
* sheet reads as dragged/thrown water rather than generic splash burst

---

# H3 — Crest Peel

## 26. Identity

* benchmark id: `H3_CrestPeel`
* event family: traveling crest -> detached lip -> plunge / return
* priority tier: Tier 1
* milestone relevance: Phases 2, 3, 5, 6, 7, 8, 11

## 27. Setup

A generated traveling wave packet or steep crest approaches the detachment threshold without rigid-body impact.

### Tunable Parameters

* crest amplitude
* crest speed
* packet width
* detachment threshold weights
* lift vs throw balance

## 28. Camera Pack

* beauty side-close camera focused on crest peel
* front oblique camera showing forward motion
* top-down camera showing crest line coherence
* optional sheet anatomy frame during lip birth

## 29. Expected Regime Chain

`attached traveling crest -> high-coherence rupture band -> forward lip sheet -> plunge / reconnect / late breakup -> return`

## 30. Expected Field Signatures

* `R` rises along crest line, not just at a point
* `U` strongly aligned with crest travel direction
* `C` high across the peeling band
* `M` available along crest before drain

## 31. Expected Structural Behaviors

* detachment happens as a forward peel, not vertical jet
* lip remains coherent briefly
* possible plunge or reconnection to main body
* limited late breakup only when warranted

## 32. Expected Wrong Looks

* upward spout instead of peel
* no detachment even at extreme crest
* immediate bead soup at lip birth
* detached flap hovering without plunge/return logic

## 33. Structural Check List

* does crest line produce coherent elongated patches?
* is `U` contributing forward throw strongly enough?
* does sheet birth happen along the crest band instead of as point jets?
* does late-stage return or recontact occur?

## 34. Visual Review Prompt Set

* Does the crest detach forward as a lip rather than erupt upward?
* Does the lip remain coherent long enough to read as water skin?
* Does the event read as wave-driven rather than impact-driven?

## 35. Snapshot Packet Requirements

Required:

* beauty side-close frame at lip birth
* oblique frame showing forward travel
* short clip from pre-detachment through return/plunge
* optional field overlay frame for `R` and `U`

## 36. Pass / Fail Gates

### Structural Pass

* crest-line patching stable
* forward-directed detached birth observed
* no point-jet substitution dominates
* return/plunge behavior exists

### Visual Pass

* reviewer confirms forward peel read
* no dominant hose look
* no dominant bead soup during initial lip phase

---

# H4 — Ligament Pinch-Off Closeup

## 37. Identity

* benchmark id: `H4_LigamentPinchOffCloseup`
* event family: ribbon ligament -> necking -> pinch-off droplets
* priority tier: Tier 1
* milestone relevance: Phases 5, 6, 7, 11

## 38. Setup

A controlled narrow detached ribbon or sheet-edge tendril is forced to stretch under known conditions.

### Tunable Parameters

* initial ribbon width
* pull speed / support separation
* carrier support strength
* neck gain / damage gain / tear threshold

## 39. Camera Pack

* macro side camera for neck evolution
* macro three-quarter camera for thickness read
* optional debug camera with thickness/neck overlays

## 40. Expected Regime Chain

`coherent ribbon -> stretch -> local neck formation -> pinch-off -> droplets + optional mist`

## 41. Expected Field / State Signatures

This benchmark depends more on detached-sheet metrics than on surface fields.

Expected:

* rising stretch
* falling thickness at the neck
* neck score preceding tear
* local damage buildup before pinch-off
* limited fragment birth centered on neck region

## 42. Expected Structural Behaviors

* continuous ribbon initially
* neck forms locally rather than whole-ribbon collapse
* one or more larger droplets after pinch-off
* optional fine spray secondary, not dominant

## 43. Expected Wrong Looks

* immediate bead chain
* ribbon stretches forever like rubber
* sudden cut with no neck history
* confetti burst instead of pinch-off

## 44. Structural Check List

* do thickness and stretch overlays behave plausibly?
* does neck score rise before tear?
* does tear remain local?
* are resulting droplets tied to neck location?

## 45. Visual Review Prompt Set

* Is there visible necking before pinch-off?
* Does the ligament stay coherent long enough to read as fluid rather than particles?
* Does the pinch-off produce meaningful droplets rather than instant confetti?

## 46. Snapshot Packet Requirements

Required:

* macro beauty frame before necking
* macro beauty frame at peak necking
* macro beauty frame post pinch-off
* short clip covering the full ligament evolution
* detached-sheet anatomy overlay strongly recommended

## 47. Pass / Fail Gates

### Structural Pass

* neck score precedes tear
* local tear produces limited child fragments/droplets
* no all-at-once destruction

### Visual Pass

* reviewer confirms visible neck-before-pinch behavior
* detached ribbon does not read as bead soup or rubber membrane

---

# H5 — Full Mixed-Regime Event

## 48. Identity

* benchmark id: `H5_FullMixedRegimeEvent`
* event family: composite multi-regime showcase
* priority tier: Tier 1
* milestone relevance: all late phases, especially 8, 9, 10, 11

## 49. Setup

A highly energetic scene containing multiple simultaneous or sequential event families.

Possible setup:

* one strong impact
* one directional slash/wake component
* secondary returns and fragment reentry
* broad visible attached surface motion

## 50. Camera Pack

* beauty hero camera
* wide system camera
* detached-heavy camera
* diagnostics multi-overlay capture set

## 51. Expected Regime Chain

Composite. Must show interaction among:

* attached surface
* coherent detached sheets
* carriers/packets
* fragments
* recapture/return

## 52. Expected Field Signatures

* `R`, `C`, `M`, `U` all active but bounded
* multiple patches without total patch spam
* budget use and return visible across scene

## 53. Expected Structural Behaviors

* at least two distinct atlas families visible
* detached structures remain sparse rather than everywhere
* returns visibly affect main surface
* counters remain bounded under load

## 54. Expected Wrong Looks

* all regimes blur into generic chaos
* detached clutter accumulates with no recapture
* frame time collapse with no graceful downgrade
* event-family identity lost completely

## 55. Structural Check List

* are multiple event families distinguishable in logs and overlays?
* do object counts remain within caps or controlled downgrade?
* does recapture happen under stress?
* is the main surface still readable as the anchor body?

## 56. Visual Review Prompt Set

* Does the scene still read as one water system rather than several disconnected effects?
* Are the major event families visually distinguishable?
* Does the chaos remain legible rather than becoming noisy sludge?
* Does return energy still feel connected to the main surface?

## 57. Snapshot Packet Requirements

Required:

* beauty hero frame
* wide diagnostic frame
* short clip across the event peak and return phase
* performance/counter summary attached
* review packet must include structural summary before visual review

## 58. Pass / Fail Gates

### Structural Pass

* bounded counts
* bounded budgets
* coherent event-family classification
* return routing active
* no catastrophic frame collapse on target hardware class

### Visual Pass

* reviewer confirms visual legibility across mixed regimes
* scene reads as one unified water simulation rather than effect salad

---

# Tier 2 Structural Discipline Benchmarks

## 59. S1 — Calm Impulse Sanity

Purpose:

* verify attached surface stability
* verify no spurious rupture patch spam

Key pass criteria:

* symmetric ripple behavior
* quiet detached layers
* low/no false patch extraction

## 60. S2 — Traveling Crest Pre-Failure

Purpose:

* verify crest coherence before detachment

Key pass criteria:

* clear directional crest
* `R` buildup without premature detach

## 61. S3 — Soft Recontact Merge

Purpose:

* verify gentle return behavior

Key pass criteria:

* low-speed return does not explode
* surface response is subtle but real

## 62. S4 — Edge Fray Cascade

Purpose:

* verify local edge breakup rather than global disintegration

Key pass criteria:

* edge fray starts locally
* child ligaments/fragments remain edge-biased

## 63. S5 — Packet vs Sheet Resolve Split

Purpose:

* verify that different patch conditions select different detached families

Key pass criteria:

* sheet-biased scenes choose sheet
* lower-coherence scenes choose packet/jet
* no one-size-fits-all event logic

---

# Tier 3 Stress / Runtime Benchmarks

## 64. P1 — Fragment Budget Stress

Purpose:

* verify caps and culling under heavy breakup

Key pass criteria:

* fragment counts capped
* graceful degradation
* no memory/pool runaway

## 65. P2 — Multiple Simultaneous Detachments

Purpose:

* verify sparse orchestration under concurrent events

Key pass criteria:

* patch priorities sensible
* no scheduler chaos
* event identities preserved

## 66. P3 — Distance / LOD Downgrade

Purpose:

* verify distant events downgrade cleanly

Key pass criteria:

* minimal ugly popping
* visual importance prioritized

## 67. P4 — Hero Stress Test

Purpose:

* verify full system under near-production energy load

Key pass criteria:

* no catastrophic frame collapse
* clear cap-hit telemetry
* mixed-regime legibility maintained enough for production goals

---

## 68. Benchmark Review Workflow Integration

Each benchmark card should integrate with the visual review governance system.

### 68.1 Required Workflow

1. run benchmark
2. gather structural diagnostics
3. set structural pass/fail state
4. if structurally passed, capture snapshot packet
5. send to human and/or designated visual reviewer
6. record visual verdict
7. update benchmark history

### 68.2 Important Rule

No benchmark should be marked fully passed if it only passes structurally.

Full pass requires:

* structural pass
* visual approval through authorized path

---

## 69. Required Snapshot Packet Mapping by Benchmark

### H1 Cinematic Crown Impact

Must include:

* radial top-down view
* side/profile peak view
* clip through collapse

### H2 Oblique Slash Fan

Must include:

* top-down directional asymmetry view
* side launch-angle view
* clip through fan spread

### H3 Crest Peel

Must include:

* side-close peel frame
* oblique forward-travel frame
* clip through detach and return

### H4 Ligament Pinch-Off Closeup

Must include:

* pre-neck frame
* peak-neck frame
* post-pinch frame
* clip of whole evolution

### H5 Full Mixed-Regime Event

Must include:

* wide beauty frame
* wide diagnostics frame
* peak-event clip
* structural summary attachment

---

## 70. Benchmark Passboard Fields

Each benchmark should have a passboard entry with:

* benchmark id
* latest structural state
* latest visual state
* latest approved preset
* last reviewed packet id
* reviewer source
* current known failure signature
* notes

This passboard should be visible in the app and/or debug dashboard.

---

## 71. Suggested Initial Build Order for Benchmarks

The benchmark pack itself should be introduced in this order:

1. S1 Calm Impulse Sanity
2. H2 Oblique Slash Fan
3. H1 Cinematic Crown Impact
4. H3 Crest Peel
5. H4 Ligament Pinch-Off Closeup
6. S3 Soft Recontact Merge
7. H5 Full Mixed-Regime Event
8. remaining stress/runtime cards

This order mirrors the engine’s actual learning ladder.

---

## 72. Anti-Fog Rules for Benchmarks

### 72.1 No Benchmark Without a Named Event Family

### 72.2 No Visual Review Without Required Packet Angles

### 72.3 No “Looks Better” Claims Without Reference Capture Comparison

### 72.4 No Structural Pass If Budget Flow Is Obviously Broken

### 72.5 No Full Pass If Only a Generic AI Approved It

These rules should be treated as project law.

---

## 73. Closing Principle

A benchmark pack is what keeps a beautiful simulation project honest.

It forces every major water event to answer:

* what it is supposed to be
* how it is supposed to evolve
* how we know it is structurally healthy
* how we know it actually looks right
* who is allowed to make that call

That is how spectacle becomes engineering.

---

## 74. Planned Companion Documents

1. **Reference Capture Companion** — structured archive format for benchmark captures, clips, notes, and approvals
2. **Runtime Data Model / Editor Schema** — serialization contracts for benchmark cards, passboard state, packet ids, and preset links
3. **Agent Handoff Prompt Pack** — benchmark-aligned prompts for coding agents with strict structural/visual authority boundaries
4. **Benchmark Dashboard Spec** — UI spec for passboard, capture comparisons, and review history views






























# Hybrid Water Reference Capture Companion

## A structured archive system for benchmark captures, snapshot packets, review evidence, preset links, and visual memory across the hybrid water project

---

## 0. Purpose

This document defines the reference capture system for the hybrid water project.

Its purpose is to prevent one of the most common pathologies in visually ambitious simulation work:

* losing track of what actually improved
* forgetting which parameter set produced a result
* confusing pretty accidents with repeatable progress
* mixing structural notes, visual notes, and captures into useless chaos

The Reference Capture Companion is the project’s visual memory layer.

It defines how captures, clips, snapshot packets, benchmark records, review verdicts, and tuning notes should be organized so that visual progress becomes queryable, comparable, and historically grounded.

This system should work together with:

* the **Hero Event Benchmark Pack**
* the **Visual Review Governance & Snapshot Pipeline**
* the **Validation Manual**
* the **Implementation Milestone Board**
* the **UI / Diagnostics Console Spec**

---

## 1. Core Principle

### 1.1 A Capture Is Not Just an Image

In this project, a useful capture is not merely:

* a screenshot
* a clip
* a file name like `water_test_final_final2.png`

A useful capture is a **context-bound evidence record**.

It must remain linked to:

* benchmark identity
* camera state
* preset state
* scene setup
* simulation timestamp
* review packet id
* reviewer notes
* structural/visual status

### 1.2 The Capture Archive Is a Memory System

The archive should answer questions like:

* What was the last visually approved crest peel?
* Which preset produced the strongest oblique fan last month?
* When did bead soup get reduced in the ligament benchmark?
* Which captures are structurally sound but visually rejected?
* Which benchmark regressions appeared after a certain tuning shift?

If the archive cannot answer these, it is not yet good enough.

---

## 2. Capture Object Types

The archive should distinguish several capture-related object types.

### 2.1 Raw Capture

A raw screenshot or raw video clip taken from the engine.

Examples:

* beauty screenshot
* top-down diagnostics screenshot
* side profile screenshot
* short replay clip
* detached-sheet anatomy frame

### 2.2 Snapshot Packet

A structured packet used for visual review, containing one or more raw captures plus metadata.

This should align with the Visual Review Governance document.

### 2.3 Benchmark Capture Record

A benchmark-linked record tying a capture or packet to:

* a benchmark id
* a preset
* a structural status
* a visual review state
* notes and verdicts

### 2.4 Comparison Record

A record linking two or more captures to document:

* before/after improvements
* regressions
* alternative presets
* benchmark progress over time

### 2.5 Milestone Capture Set

A curated set of captures representing a milestone achievement.

Examples:

* first structurally stable crown
* first acceptable crest peel
* first ligament pinch-off with visible necking
* first visually approved mixed-regime event

---

## 3. Archive Design Goals

### 3.1 Queryability

The archive should be searchable/filterable by:

* benchmark id
* event family
* review status
* capture type
* preset id
* date/time
* reviewer
* failure signature
* milestone phase

### 3.2 Comparability

The archive should support comparison workflows such as:

* current vs last approved
* preset A vs preset B
* milestone N vs milestone N+1
* structurally passed but visually rejected vs later visually approved

### 3.3 Auditability

Every important capture should preserve:

* who captured it
* why it was captured
* what it was meant to show
* what review outcome it received

### 3.4 Non-Folklore Memory

The archive must reduce reliance on memory, anecdotes, and wishful thinking.

---

## 4. Capture Record Taxonomy

## 4.1 Minimal Capture Record

A minimal useful capture record should contain:

* capture id
* file/media reference
* capture type
* benchmark id
* timestamp
* preset id
* camera preset id
* short note

## 4.2 Standard Capture Record

A standard record should also include:

* structural state at capture time
* visual review state
* snapshot packet id if part of one
* dominant event family
* active counters summary
* reviewer notes if available

## 4.3 Full Review Record

A full review-ready record should include:

* all standard fields
* review brief
* reviewer identity/source
* verdict
* failure signature tags
* parameter diff vs previous reference capture
* linked comparison records

---

## 5. Recommended Capture Schema

A practical capture schema may include the following fields.

### 5.1 Identity

* `capture_id`
* `packet_id` (nullable)
* `benchmark_id`
* `scene_id`
* `session_id`
* `preset_id`
* `capture_kind`

### 5.2 Timing

* `captured_at`
* `simulation_time`
* `frame_index`
* `deterministic_seed`

### 5.3 Camera

* `camera_preset`
* `camera_position`
* `camera_orientation`
* `camera_target`
* `camera_fov`
* `projection_type`

### 5.4 Rendering Context

* `material_mode`
* `lighting_preset`
* `beauty_or_debug_mode`
* `lod_summary`

### 5.5 Structural Context

* `structural_state`
* `event_family_labels`
* `active_patch_count`
* `active_sheet_count`
* `active_carrier_count`
* `active_fragment_count`
* `frame_time_summary`

### 5.6 Review Context

* `visual_state`
* `review_source`
* `review_brief`
* `verdict`
* `review_notes`

### 5.7 Classification / Tags

* `milestone_phase`
* `failure_signature_tags`
* `atlas_family_tags`
* `hero_candidate_flag`
* `approved_reference_flag`

### 5.8 Media Links

* `image_paths`
* `clip_paths`
* `thumbnail_path`
* `comparison_group_ids`

---

## 6. Capture Kinds

The archive should use explicit capture kinds.

### 6.1 Beauty Frame

Primary aesthetic render intended for visual judgment.

### 6.2 Diagnostics Frame

A frame showing latent fields, object overlays, counters, or anatomy views.

### 6.3 Anatomy Frame

A frame focused on detached-sheet internals such as thickness, stretch, neck score, or support density.

### 6.4 Clip

A short sequence showing temporal evolution.

### 6.5 Frame Strip

A sequence of stills sampled over a short evolution window.

### 6.6 Comparison Pair / Comparison Set

A curated set used to show a change across versions, presets, or milestones.

---

## 7. Naming and ID Conventions

The project should use consistent naming and IDs to avoid turning the archive into archaeological sludge.

### 7.1 Capture ID Pattern

A good pattern might include:

`cap_<benchmark>_<date>_<time>_<variant>`

Example:

`cap_H3_CrestPeel_2026-02-26_1842_iter07`

### 7.2 Packet ID Pattern

`pkt_<benchmark>_<date>_<seq>`

### 7.3 Comparison ID Pattern

`cmp_<benchmark>_<topic>_<seq>`

### 7.4 Milestone Set ID Pattern

`mile_<phase>_<eventfamily>_<seq>`

These do not need to be beautiful poetry. They need to be unambiguous.

---

## 8. Folder / Storage Strategy

The archive should be organized so humans and tools can both navigate it.

### 8.1 Logical Structure

Recommended high-level categories:

* `captures/raw/`
* `captures/packets/`
* `captures/comparisons/`
* `captures/milestones/`
* `captures/approved/`
* `captures/rejected/`
* `captures/benchmarks/`

### 8.2 Benchmark-Centric Subfolders

Within benchmark folders:

* `beauty/`
* `diagnostics/`
* `anatomy/`
* `clips/`
* `packets/`
* `reviews/`

### 8.3 Metadata Storage

Metadata should not live only in filenames.

Use:

* JSON sidecars
* database entries
* project-internal registry files
* or a combination

The crucial thing is that the metadata is structured and queriable.

---

## 9. Snapshot Packet Archive Relationship

### 9.1 Packets as Review Bundles

Snapshot packets should be treated as first-class archive objects.

Each packet should reference:

* included captures
* review brief
* requested reviewer class
* benchmark context
* current structural state

### 9.2 Packet Lifecycle

A packet may move through states such as:

* drafted
* captured
* exported
* under_review
* reviewed
* archived

### 9.3 Packet-to-Capture Mapping

Each raw capture can belong to:

* no packet yet
* one packet
* multiple comparison contexts

The archive should preserve these relationships.

---

## 10. Reference Capture Classes

Not all captures matter equally. The archive should distinguish them.

### 10.1 Working Capture

A temporary capture used during tuning.

### 10.2 Diagnostic Reference

A capture worth preserving because it shows a structural state or failure clearly.

### 10.3 Benchmark Candidate

A capture considered good enough for formal benchmark review.

### 10.4 Approved Reference

A capture or packet representing an approved visual benchmark state.

### 10.5 Historical Failure Reference

A capture worth preserving because it documents an important wrong-look or failure signature.

This is very valuable. Future you will want to remember what “hose look” actually looked like in phase 4, not just that it was bad.

---

## 11. Failure Signature Tagging

The archive should support tagging captures with failure signatures from the atlas and validation docs.

### 11.1 Recommended Tag Families

* `hose_look`
* `bead_soup`
* `rubber_membrane`
* `particle_confetti`
* `ghost_water`
* `dead_reentry`
* `patch_spam`
* `no_recapture`
* `lod_popping`
* `budget_runaway`

### 11.2 Why Tags Matter

This lets the archive answer questions like:

* Show me all captures where bead soup was still present.
* Show me the latest approved crest peel without hose look.
* Show me captures tagged with ghost water after carrier integration.

That is serious engineering leverage.

---

## 12. Comparison Records

### 12.1 Purpose

Comparisons are how progress becomes concrete.

### 12.2 Comparison Record Fields

A comparison record should include:

* comparison id
* benchmark id
* compared capture ids
* comparison purpose
* summary note
* parameter diff summary
* reviewer note if available

### 12.3 Common Comparison Modes

* current vs last approved
* preset A vs preset B
* before vs after one parameter cluster change
* pre-carrier vs post-carrier support
* pre-necking logic vs post-necking logic

### 12.4 Mandatory Comparison Moments

Comparisons should be created for at least:

* first detached-sheet implementation
* first visible necking improvement
* first acceptable recapture
* first approved benchmark per Tier 1 card

---

## 13. Milestone Capture Sets

### 13.1 Purpose

Milestone capture sets document what the engine could do at a given development stage.

### 13.2 Suggested Milestone Sets

Examples:

* `mile_phase2_surface_fields`
* `mile_phase5_first_detached_sheet`
* `mile_phase7_first_necking_success`
* `mile_phase8_return_loop_closed`
* `mile_phase11_first_tier1_pass_set`

### 13.3 Set Contents

Each milestone set should include:

* representative beauty captures
* representative diagnostics captures
* key comparisons
* associated benchmark ids
* milestone notes
* known remaining failure signatures

This becomes the project’s visual evolution diary.

---

## 14. Capture Workflow

A disciplined capture workflow should look like this.

### 14.1 Working Capture Flow

1. run or replay benchmark
2. identify interesting frame/event
3. capture beauty and diagnostics views
4. attach minimal metadata
5. mark as working or benchmark candidate

### 14.2 Benchmark Review Capture Flow

1. confirm structural status
2. capture required angles and clip
3. assemble snapshot packet
4. attach review brief
5. send for authorized visual review
6. record verdict
7. archive as approved, rejected, or needs iteration

### 14.3 Comparison Flow

1. select prior reference capture
2. capture new version
3. create comparison record
4. note what changed
5. record whether change was improvement/regression/ambiguous

---

## 15. Capture Notes and Commentary

Each important capture should allow concise structured notes.

### 15.1 Recommended Note Fields

* what improved
* what still fails
* likely cause
* next target
* linked atlas family
* linked failure signature

### 15.2 Example Note

```text
benchmark: H3_CrestPeel
capture: cap_H3_CrestPeel_2026-02-26_1842_iter07
improved: stronger forward lip continuity
still_fails: initial release still slightly nozzle-biased
likely_cause: lift too dominant relative to throw
next_target: reduce lift scale, strengthen crest-line direction extraction
failure_tags: [hose_look]
```

This is the kind of note that saves many hours of circular suffering.

---

## 16. Review Verdict Integration

### 16.1 Every Approved Capture Must Be Review-Linked

An approved reference should always point to:

* packet id
* review source
* verdict record
* benchmark id

### 16.2 Rejected Captures Matter Too

Rejected or needs-iteration captures should not simply vanish.

They are useful for:

* showing progress
* diagnosing recurring failure patterns
* teaching future tuning what not to repeat

### 16.3 Approval Classes

Recommended archive classes:

* `approved_structural_reference`
* `approved_visual_reference`
* `rejected_visual_reference`
* `historical_failure_reference`
* `candidate_pending_review`

---

## 17. UI / Tooling Requirements

The diagnostics console and benchmark dashboard should support archive operations directly.

### 17.1 Required UI Actions

* capture beauty frame
* capture diagnostics frame
* capture clip
* create snapshot packet
* tag capture with benchmark id
* add note
* create comparison from selected captures
* mark capture as candidate / reference / approved / rejected

### 17.2 Browser/Engine Convenience Features

Useful features include:

* auto-fill current benchmark id
* auto-fill current preset id
* auto-fill camera preset id
* auto-attach key counters
* auto-link to last approved capture for same benchmark

That reduces friction and prevents metadata rot.

---

## 18. Query Examples

A mature archive should be able to answer queries like:

* Show all visually approved H3 crest peel captures.
* Show all H4 ligament captures tagged `bead_soup`.
* Show the latest structurally passed but visually rejected H2 capture.
* Show comparisons between phase 5 and phase 7 for crown-edge breakup.
* Show all captures produced by preset `hero_ligament_iter_04`.
* Show all historical failure references tagged `ghost_water` after carrier integration.

If the archive can do this, it is actually useful instead of decorative.

---

## 19. Suggested Minimal First Version

A first useful archive implementation does not need to be huge.

### 19.1 Minimal Requirements

* capture id
* benchmark id
* preset id
* camera preset id
* image/clip path
* note field
* structural state
* visual state
* failure tags
* packet link if applicable

### 19.2 Minimal Operations

* capture and save
* browse by benchmark
* mark as candidate / approved / rejected
* compare two captures
* search by failure tag

That alone would already be dramatically better than chaos.

---

## 20. Anti-Failure Rules

### 20.1 No Unlabeled Hero Capture

Any hero-worthy capture without benchmark and preset context is untrustworthy.

### 20.2 No Approved Capture Without Review Link

If it is visually approved, the verdict path must be stored.

### 20.3 No Deleted Failure History Without Reason

Failure captures are part of the project’s intelligence.

### 20.4 No Filename-Only Archive

Metadata must live in structured records, not just filenames.

### 20.5 No Comparison Without Stating What Changed

Otherwise the comparison becomes vague theater.

---

## 21. Recommended Build Order for the Archive System

### Stage A

* raw capture save
* benchmark/preset/camera metadata
* capture browser by benchmark

### Stage B

* packet linking
* review verdict linking
* failure tags
* candidate/approved/rejected states

### Stage C

* comparison records
* milestone capture sets
* search/filter UI
* latest approved / latest rejected views

### Stage D

* benchmark dashboard integration
* AI/export summaries
* historical trend views

This staged rollout keeps the archive from becoming a giant unfinished filing cabinet monster.

---

## 22. Relationship to the Milestone Board

The milestone board defines what phases the engine must pass.

The capture companion records what those phases actually looked like.

Together they answer both:

* what the project should do
* what the project actually did

That is a very powerful pairing.

---

## 23. Closing Principle

A visually ambitious simulation needs memory just as badly as it needs equations.

Without structured capture history, every improvement is fragile, every regression is confusing, and every beautiful frame risks becoming a myth.

The Reference Capture Companion makes the project remember:

* what it showed
* what it meant
* who approved it
* what still failed
* how it changed over time

That is how visual progress becomes real progress.

---

## 24. Planned Companion Documents

1. **Runtime Data Model / Editor Schema** — serialization contracts for captures, packets, verdicts, presets, and comparisons
2. **Agent Handoff Prompt Pack** — prompts that let coding agents reason from archived evidence without granting visual authority
3. **Benchmark Dashboard Spec** — UI specification for browsing passboard state, comparisons, and review-linked capture history
4. **Capture Review Checklist Pack** — lightweight standardized checklists for annotating new captures consistently























# Hybrid Water Runtime Data Model / Editor Schema

## Serialization contracts for scenes, presets, overlays, benchmark cards, passboard state, snapshot packets, review verdicts, captures, comparisons, and editor session memory

---

## 0. Purpose

This document defines the runtime data model and editor-facing schema for the hybrid water project.

Its purpose is to provide the **data spine** connecting all major systems:

* simulation scenes
* tuning presets
* diagnostics overlays
* benchmark cards
* passboard states
* snapshot packets
* visual review verdicts
* capture archive records
* comparisons and milestone sets
* UI/editor session state

Without a coherent schema, the project risks becoming a fragmented ecosystem of:

* ad hoc JSON blobs
* mismatched identifiers
* silently drifting presets
* unqueryable review history
* brittle UI state
* benchmark records that cannot be compared cleanly over time

This document exists to prevent that.

---

## 1. Schema Philosophy

### 1.1 Data Must Be First-Class, Not Accidental

Every major system in the project should produce structured records rather than implicit state hidden in memory, filenames, or code constants.

### 1.2 The Schema Must Serve Both Runtime and Tooling

The data model must work for:

* runtime simulation control
* diagnostics console state
* benchmark execution
* capture/review archiving
* AI-assisted debugging summaries
* future editor tooling

### 1.3 Structural and Visual State Must Remain Separate

The data model must explicitly distinguish:

* structural validation state
* visual review state

This is a core governance rule, not a cosmetic detail.

### 1.4 Versioning Must Be Planned Early

These schemas will evolve. Every major top-level record type should carry:

* `schema_version`
* optional migration notes or compatibility hints

Otherwise, six months from now, the archive turns into a haunted museum of incompatible blobs.

---

## 2. Top-Level Record Types

The system should explicitly support the following record families:

1. **SceneDefinition**
2. **SceneInstanceState**
3. **TuningPreset**
4. **DiagnosticsPreset**
5. **BenchmarkCard**
6. **BenchmarkPassboardEntry**
7. **SnapshotPacket**
8. **ReviewVerdict**
9. **CaptureRecord**
10. **ComparisonRecord**
11. **MilestoneCaptureSet**
12. **EditorSessionState**
13. **RuntimeSummaryRecord**
14. **AtlasTagRecord** (optional but useful)

These types should remain linked through stable ids rather than fragile positional assumptions.

---

## 3. Shared Base Fields

Most top-level records should share a common metadata base.

### 3.1 Base Metadata Fields

Recommended base fields:

* `id`
* `schema_version`
* `created_at`
* `updated_at`
* `created_by`
* `updated_by`
* `label`
* `description`
* `tags`
* `notes`

### 3.2 Provenance Fields

Where useful, include:

* `source_record_ids`
* `derived_from`
* `parent_id`
* `related_ids`

This makes lineage explicit.

---

## 4. SceneDefinition Schema

A SceneDefinition describes a reusable benchmark or sandbox scene template.

### 4.1 Purpose

A SceneDefinition should define:

* the scenario identity
* initial object/body setup
* parameterized scene configuration
* available camera presets
* deterministic setup rules

### 4.2 Suggested Fields

* `id`
* `scene_type`
* `benchmark_candidate` (bool)
* `default_seed`
* `deterministic_supported` (bool)
* `water_domain`
* `body_definitions`
* `initial_conditions`
* `scene_parameters`
* `camera_presets`
* `recommended_diagnostics_presets`
* `recommended_tuning_presets`
* `atlas_family_targets`

### 4.3 Example Scene Types

* `calm_impulse`
* `vertical_drop_impact`
* `oblique_slash`
* `traveling_crest`
* `ligament_stretch`
* `recontact_merge`
* `hero_mixed_regime`

---

## 5. SceneInstanceState Schema

A SceneInstanceState describes a specific instantiated run or replay of a scene.

### 5.1 Purpose

It should record:

* the exact state of a scene at runtime or replay time
* seed and timing details
* linked preset selections
* current camera state

### 5.2 Suggested Fields

* `id`
* `scene_definition_id`
* `seed`
* `sim_time`
* `frame_index`
* `paused` (bool)
* `playback_mode`
* `active_tuning_preset_id`
* `active_diagnostics_preset_id`
* `active_camera_preset_id`
* `camera_state_override`
* `runtime_flags`
* `current_benchmark_id` (nullable)

---

## 6. TuningPreset Schema

A TuningPreset stores grouped simulation and rendering parameters.

### 6.1 Purpose

It should be possible to restore a full meaningful tuning state from a preset.

### 6.2 Suggested Structure

```text
TuningPreset
- id
- preset_family
- milestone_phase
- intended_benchmarks
- field_params
- event_params
- sheet_params
- carrier_params
- fragment_params
- lod_params
- render_params
- notes
- known_strengths
- known_failure_tags
```

### 6.3 Preset Families

Examples:

* `strong_crown`
* `directional_fan`
* `hero_ligament`
* `soft_return`
* `stress_lod`
* `baseline_stable`

### 6.4 Important Rule

A preset should describe **intent** as well as numbers.

Useful fields:

* `intended_event_families`
* `known_weaknesses`
* `recommended_benchmarks`

---

## 7. DiagnosticsPreset Schema

A DiagnosticsPreset stores a named configuration of overlays, inspectors, layout, and filtering rules.

### 7.1 Purpose

This makes repeatable debugging possible without manual toggle soup.

### 7.2 Suggested Fields

* `id`
* `layout_mode`
* `visible_regimes`
* `active_overlay`
* `overlay_stack`
* `selection_filters`
* `inspector_tab`
* `timeline_filters`
* `counter_groups`
* `performance_panel_mode`
* `camera_debug_options`

### 7.3 Example Presets

* `surface_field_audit`
* `event_resolution_audit`
* `detached_sheet_anatomy`
* `carrier_support_audit`
* `breakup_audit`
* `return_recapture_audit`
* `performance_audit`

---

## 8. BenchmarkCard Schema

A BenchmarkCard represents the formal benchmark definition, aligned with the Hero Event Benchmark Pack.

### 8.1 Purpose

It describes what a benchmark is supposed to prove.

### 8.2 Suggested Fields

* `id`
* `benchmark_name`
* `priority_tier`
* `milestone_relevance`
* `scene_definition_id`
* `target_event_families`
* `expected_regime_chain`
* `expected_field_signatures`
* `expected_structural_behaviors`
* `expected_wrong_looks`
* `structural_checks`
* `visual_review_prompts`
* `required_snapshot_views`
* `structural_pass_gates`
* `visual_pass_gates`
* `recommended_presets`

### 8.3 Optional Extensions

* `historical_notes`
* `benchmark_owner`
* `benchmark_status_summary`

---

## 9. BenchmarkPassboardEntry Schema

A BenchmarkPassboardEntry represents the current rolling state of a benchmark in practice.

### 9.1 Purpose

It answers:

* what is the latest state of this benchmark?
* what was the last reviewed capture?
* what still fails?

### 9.2 Suggested Fields

* `id`
* `benchmark_id`
* `latest_structural_state`
* `latest_visual_state`
* `latest_capture_id`
* `latest_packet_id`
* `latest_review_verdict_id`
* `latest_approved_capture_id`
* `latest_approved_preset_id`
* `current_failure_tags`
* `last_reviewed_at`
* `review_source`
* `summary_note`

### 9.3 Importance

This is the compact truth panel for a benchmark.

---

## 10. SnapshotPacket Schema

This should align tightly with the Visual Review Governance document.

### 10.1 Purpose

A SnapshotPacket is the unit of visual review.

### 10.2 Suggested Fields

* `id`
* `benchmark_id`
* `scene_instance_id`
* `preset_id`
* `diagnostics_preset_id`
* `capture_ids`
* `clip_ids`
* `requested_review_class`
* `mission_statement`
* `expected_regime_chain`
* `specific_review_questions`
* `known_current_weaknesses`
* `camera_pack`
* `render_context`
* `runtime_summary`
* `packet_state`

### 10.3 Packet States

* `drafted`
* `captured`
* `exported`
* `under_review`
* `reviewed`
* `archived`

---

## 11. ReviewVerdict Schema

A ReviewVerdict stores the actual response from a reviewer.

### 11.1 Purpose

It provides auditable visual or structural review memory.

### 11.2 Suggested Fields

* `id`
* `benchmark_id`
* `packet_id`
* `capture_ids`
* `review_kind` (`structural`, `visual`, `provisional_visual`)
* `review_source_class`
* `review_source_identity`
* `verdict_state`
* `confidence` (optional)
* `notes`
* `recommended_next_action`
* `failure_tags`
* `reviewed_at`

### 11.3 Example Verdict States

* `structurally_passed`
* `structurally_failed`
* `visually_approved`
* `visually_rejected`
* `visually_reviewed_needs_iteration`

---

## 12. CaptureRecord Schema

A CaptureRecord is the core evidence unit of the Reference Capture Companion.

### 12.1 Suggested Fields

* `id`
* `benchmark_id`
* `scene_instance_id`
* `preset_id`
* `diagnostics_preset_id`
* `camera_preset_id`
* `capture_kind`
* `captured_at`
* `frame_index`
* `simulation_time`
* `media_paths`
* `thumbnail_path`
* `structural_state`
* `visual_state`
* `event_family_tags`
* `failure_signature_tags`
* `hero_candidate_flag`
* `approved_reference_flag`
* `note`
* `linked_packet_ids`
* `linked_comparison_ids`

### 12.2 Capture Kinds

* `beauty_frame`
* `diagnostics_frame`
* `anatomy_frame`
* `clip`
* `frame_strip`
* `comparison_set_member`

---

## 13. ComparisonRecord Schema

A ComparisonRecord stores a structured comparison between two or more captures or packets.

### 13.1 Purpose

This turns “I think it got better” into an actual artifact.

### 13.2 Suggested Fields

* `id`
* `benchmark_id`
* `left_capture_ids`
* `right_capture_ids`
* `comparison_type`
* `comparison_purpose`
* `parameter_diff_summary`
* `summary_note`
* `reviewer_note`
* `created_at`

### 13.3 Comparison Types

* `before_after`
* `preset_vs_preset`
* `milestone_vs_milestone`
* `approved_vs_candidate`
* `regression_audit`

---

## 14. MilestoneCaptureSet Schema

A MilestoneCaptureSet groups captures that represent a meaningful development stage.

### 14.1 Suggested Fields

* `id`
* `milestone_phase`
* `label`
* `benchmark_ids`
* `capture_ids`
* `comparison_ids`
* `summary_note`
* `remaining_failure_tags`
* `approved_reference_ids`

### 14.2 Example Uses

* first detached sheet worthy of preservation
* first visible necking success
* first visually approved Tier 1 benchmark set

---

## 15. EditorSessionState Schema

The editor/session layer needs to remember UI and review context.

### 15.1 Purpose

It should make the tool feel continuous rather than amnesiac.

### 15.2 Suggested Fields

* `id`
* `active_scene_definition_id`
* `active_scene_instance_id`
* `active_benchmark_id`
* `active_tuning_preset_id`
* `active_diagnostics_preset_id`
* `active_camera_preset_id`
* `selected_object_type`
* `selected_object_id`
* `layout_state`
* `open_panels`
* `timeline_state`
* `comparison_mode`
* `pending_capture_draft`
* `last_snapshot_packet_id`

---

## 16. RuntimeSummaryRecord Schema

This record is useful for AI-assisted export, quick reviews, and benchmark dashboards.

### 16.1 Purpose

It provides a concise machine-readable snapshot of the current runtime.

### 16.2 Suggested Fields

* `id`
* `scene_instance_id`
* `benchmark_id`
* `preset_id`
* `sim_time`
* `frame_index`
* `active_patch_count`
* `active_sheet_count`
* `active_carrier_count`
* `active_fragment_count`
* `dominant_event_families`
* `current_failure_tags`
* `frame_time_summary`
* `structural_state`
* `visual_state`
* `summary_text`

This is a very useful bridge for agent tooling without granting visual authority.

---

## 17. AtlasTagRecord Schema (Optional but Valuable)

An AtlasTagRecord can formalize the relationship between runtime artifacts and the visual regime atlas.

### 17.1 Suggested Fields

* `id`
* `atlas_family_id`
* `label`
* `description`
* `wrong_look_counterparts`
* `related_benchmarks`
* `suggested_review_questions`

This helps keep event-family language consistent across tools.

---

## 18. Relationship Graph

The core relationships should look roughly like this:

* `SceneDefinition -> SceneInstanceState`
* `SceneInstanceState -> CaptureRecord`
* `TuningPreset -> SceneInstanceState`
* `DiagnosticsPreset -> SceneInstanceState`
* `BenchmarkCard -> BenchmarkPassboardEntry`
* `BenchmarkCard -> SnapshotPacket`
* `SnapshotPacket -> CaptureRecord`
* `SnapshotPacket -> ReviewVerdict`
* `CaptureRecord -> ComparisonRecord`
* `CaptureRecord -> MilestoneCaptureSet`
* `BenchmarkPassboardEntry -> latest ReviewVerdict / latest approved CaptureRecord`

This should be treated as a true graph, not a bag of disconnected tables.

---

## 19. ID Discipline and Referential Integrity

### 19.1 Stable IDs

Every top-level record must use a stable id.

### 19.2 No Weak Linkage by Filename Alone

Relationships must not depend solely on media filenames.

### 19.3 Missing Reference Handling

If referenced assets are missing, the system should mark records as:

* `orphaned_media`
* `missing_packet_link`
* `stale_preset_reference`

Better an honest wound than silent corruption.

---

## 20. Schema Versioning Strategy

### 20.1 Top-Level Versioning

Every record type should carry a `schema_version`.

### 20.2 Migration Notes

If practical, also include:

* `migrated_from_version`
* `migration_notes`

### 20.3 Compatibility Policy

Records should be readable even if partially outdated, but the system should warn when a migration is needed.

---

## 21. Serialization Strategy

### 21.1 Human-Readable vs Efficient

The project will likely benefit from both:

* human-readable JSON or YAML for authoring/config
* more optimized internal/runtime representations for speed

### 21.2 Recommended Split

Use:

* JSON/YAML for presets, benchmark cards, diagnostics presets, session drafts
* structured runtime objects for live simulation state
* JSON sidecars or database entries for captures and verdicts

### 21.3 Avoid One Giant Monolith File

Do not stuff the whole project state into one massive unversioned blob. That is how tools begin to rot.

---

## 22. Minimal First Schema Slice

The first implementation does not need everything at once.

### 22.1 Minimum Useful Types

Start with:

* `SceneDefinition`
* `TuningPreset`
* `DiagnosticsPreset`
* `BenchmarkCard`
* `BenchmarkPassboardEntry`
* `CaptureRecord`
* `SnapshotPacket`
* `ReviewVerdict`
* `EditorSessionState`

### 22.2 Minimum Useful Relationships

At minimum, the system should support:

* current scene <-> current preset
* benchmark <-> latest passboard status
* capture <-> packet <-> verdict
* capture <-> benchmark
* capture <-> preset

That alone would give the project a coherent memory spine.

---

## 23. UI / Tooling Implications

The schema should directly support the diagnostics console and benchmark dashboard.

### 23.1 Console Needs

* active preset records
* diagnostics preset records
* selected object/session state
* pending capture draft state
* last packet state

### 23.2 Benchmark Dashboard Needs

* benchmark cards
* passboard entries
* latest approved references
* latest rejected or needs-iteration verdicts
* comparison links

### 23.3 Archive Browser Needs

* searchable capture records
* failure tags
* event family tags
* approved/reference flags

---

## 24. AI / Agent Workflow Implications

The schema should support AI-assisted work without granting AI visual authority.

### 24.1 Good Agent Inputs

Agents should be able to consume:

* RuntimeSummaryRecord
* BenchmarkCard
* latest BenchmarkPassboardEntry
* relevant CaptureRecord metadata
* SnapshotPacket review brief
* ReviewVerdict notes

### 24.2 Governance Boundary

The schema must not imply that AI structural records are equivalent to visual approval.

A structural AI may generate:

* runtime summaries
* failure guesses
* suggested next actions

But only authorized review records may mark a visual pass.

---

## 25. Anti-Failure Rules

### 25.1 No Hidden State That Matters

If a state matters to tuning, review, or history, it should be serializable.

### 25.2 No Visual Approval Without a ReviewVerdict Record

### 25.3 No Benchmark Status Without a Passboard Entry

### 25.4 No Capture Without Benchmark/Preset Context for Important Runs

### 25.5 No Drift Between UI Labels and Stored Enumerations

The UI and schema enums must stay aligned.

### 25.6 No Schema That Assumes Only One Reviewer Type

The model must preserve human vs visual-model vs structural-AI distinctions.

---

## 26. Example Minimal JSON Sketches

### 26.1 BenchmarkPassboardEntry

```json
{
  "id": "pb_H3_CrestPeel",
  "schema_version": 1,
  "benchmark_id": "H3_CrestPeel",
  "latest_structural_state": "structurally_passed",
  "latest_visual_state": "visually_reviewed_needs_iteration",
  "latest_capture_id": "cap_H3_CrestPeel_2026-02-26_1842_iter07",
  "latest_packet_id": "pkt_H3_CrestPeel_2026-02-26_01",
  "latest_review_verdict_id": "rv_H3_0042",
  "latest_approved_capture_id": null,
  "latest_approved_preset_id": null,
  "current_failure_tags": ["hose_look"],
  "review_source": "external_vision_model_designated",
  "summary_note": "Forward peel improved, still too nozzle-biased at initial release."
}
```

### 26.2 CaptureRecord

```json
{
  "id": "cap_H3_CrestPeel_2026-02-26_1842_iter07",
  "schema_version": 1,
  "benchmark_id": "H3_CrestPeel",
  "scene_instance_id": "sceneinst_119",
  "preset_id": "crest_peel_iter_07",
  "diagnostics_preset_id": "surface_field_audit",
  "camera_preset_id": "hero_side_close",
  "capture_kind": "beauty_frame",
  "captured_at": "2026-02-26T18:42:13Z",
  "frame_index": 412,
  "simulation_time": 12.433,
  "media_paths": ["captures/benchmarks/H3/beauty/cap_H3_CrestPeel_2026-02-26_1842_iter07.png"],
  "structural_state": "structurally_passed",
  "visual_state": "visually_reviewed_needs_iteration",
  "event_family_tags": ["crest_lip_peel"],
  "failure_signature_tags": ["hose_look"],
  "hero_candidate_flag": true,
  "approved_reference_flag": false,
  "linked_packet_ids": ["pkt_H3_CrestPeel_2026-02-26_01"],
  "note": "Forward lip continuity improved, but initial launch still slightly too vertical."
}
```

### 26.3 ReviewVerdict

```json
{
  "id": "rv_H3_0042",
  "schema_version": 1,
  "benchmark_id": "H3_CrestPeel",
  "packet_id": "pkt_H3_CrestPeel_2026-02-26_01",
  "review_kind": "visual",
  "review_source_class": "visual_specialist_ai_designated",
  "review_source_identity": "designated_external_vision_model",
  "verdict_state": "visually_reviewed_needs_iteration",
  "notes": "Improved forward throw, but release still reads too nozzle-like at onset.",
  "recommended_next_action": "iterate_birth_direction",
  "failure_tags": ["hose_look"],
  "reviewed_at": "2026-02-26T19:01:00Z"
}
```

---

## 27. Recommended Next Engineering Step

Once this schema is accepted conceptually, the next implementation task should be:

1. define enums and ids centrally
2. implement the minimal first schema slice
3. wire benchmark, capture, packet, and verdict records into the console and archive
4. only then expand into richer comparison and milestone set tooling

This prevents the project from building a huge UI on top of mushy state.

---

## 28. Closing Principle

A project like this does not just need a simulation architecture. It needs a **memory architecture**.

The runtime data model is how the engine remembers:

* what scene it was in
* what it was trying to prove
* what preset it used
* what it showed
* who reviewed it
* whether it truly passed
* how it compares to the past

That is how the project becomes cumulative rather than forgetful.

---

## 29. Planned Companion Documents

1. **Agent Handoff Prompt Pack** — prompts and task templates aligned to the schema, milestones, and benchmark workflow
2. **Benchmark Dashboard Spec** — UI specification for passboard, review states, and archive comparison browsing
3. **Capture Review Checklist Pack** — standardized annotation forms for benchmark and working captures
4. **Schema Migration Notes** — future compatibility and evolution guide for record versioning









# Hybrid Water Agent Handoff Prompt Pack

## Operational prompt templates for coding agents working on the hybrid water engine under strict structural, benchmark, and visual-governance constraints

---

## 0. Purpose

This document defines a prompt pack for handing hybrid water tasks to AI coding agents.

Its purpose is to turn the project’s architecture, validation rules, benchmark system, data model, and visual-governance policies into concrete, reusable task prompts that are safe to hand to implementation agents.

The prompt pack is designed to prevent the most common AI-development failures in this project, including:

* solving the wrong problem
* ignoring milestone order
* making untracked architectural changes
* claiming success without benchmark evidence
* confusing structural improvement with visual approval
* overbuilding beyond the current phase
* silently violating shared data contracts

This pack should be used alongside:

* the **Hybrid Water Encyclopedia**
* the **Validation Manual**
* the **Visual Regime Atlas**
* the **UI / Diagnostics Console Spec**
* the **Implementation Milestone Board**
* the **Visual Review Governance & Snapshot Pipeline**
* the **Hero Event Benchmark Pack**
* the **Runtime Data Model / Editor Schema**

---

## 1. Core Handoff Philosophy

### 1.1 The Agent Is a Builder, Not a Judge

A coding agent may:

* implement systems
* refactor code
* expose diagnostics
* improve structural behavior
* produce benchmark evidence
* explain likely causes of visible failures

A coding agent may **not**:

* claim final visual approval
* declare a benchmark visually passed
* overrule human or designated vision-review judgment
* replace benchmark evidence with verbal confidence

### 1.2 Every Task Must Name Its Phase and Benchmark Relevance

Every prompt should explicitly state:

* current milestone phase
* target subsystem
* target benchmark(s)
* what counts as success
* what is out of scope

### 1.3 Every Task Must Require Evidence

At the end of a task, the agent should report:

* what changed
* what benchmark or scene was used
* what diagnostics were checked
* what structural status improved or failed
* what is still unknown

### 1.4 No Visual Bluffing

The agent must never say things like:

* “this now looks correct”
* “the visuals are fixed”
* “benchmark approved visually”

unless explicitly reporting a stored external/human review verdict.

---

## 2. Prompt Anatomy Template

Every good handoff prompt should contain the following sections.

### 2.1 Mission

What exact subsystem or behavior is being worked on?

### 2.2 Phase Context

Which milestone phase is active, and which future phases are intentionally out of scope?

### 2.3 Existing Project Contracts

Which documents / rules must be obeyed?

### 2.4 Target Benchmark(s)

Which benchmark cards are the primary evidence targets?

### 2.5 Implementation Scope

What code or systems may be edited?

### 2.6 Forbidden Moves

What the agent must not do.

### 2.7 Required Outputs

What files, summaries, or evidence the agent must produce.

### 2.8 Success Criteria

What constitutes structural success.

### 2.9 Reporting Format

How the agent should summarize its work.

---

## 3. Global Guardrails Block

The following guardrail block should be reused in most prompts.

### 3.1 Standard Guardrails

* Work only within the stated milestone phase and immediate dependencies.
* Do not silently redesign unrelated architecture.
* Preserve alignment with the runtime data model and diagnostics contracts.
* Do not claim visual approval.
* If visual impact is discussed, phrase it as a **structural expectation** or **hypothesis**, not a final verdict.
* Prefer incremental, testable changes over giant rewrites unless the task explicitly asks for one.
* Keep benchmark evidence and diagnostics first-class.
* If a behavior cannot be confirmed structurally, say so plainly.
* If a benchmark likely improved structurally but visual outcome is unknown, report it as visually pending review.

### 3.2 Standard Required Evidence

The agent should report:

* touched files/modules
* systems added or changed
* benchmark scene(s) exercised
* diagnostics consulted
* counters or states expected to change
* known limitations
* next recommended step

---

## 4. Standard End-of-Task Report Template

Every coding agent prompt should request this report shape.

```text
TASK REPORT
1. Summary of change
2. Files/modules changed
3. Milestone phase alignment
4. Benchmarks exercised or intended
5. Structural behaviors expected to improve
6. Diagnostics to inspect
7. What remains uncertain
8. Visual approval status: visually pending external review
9. Next smallest valuable step
```

This prevents agents from handing back mushy prose and calling it a day.

---

# Prompt Family A — Milestone Phase Prompts

## 5. Prompt A1 — Phase 1 Foundation & Harness

### Use When

You want an agent to implement the harness layer, benchmark switching, deterministic reset, and debug bootstrap.

### Prompt Template

```text
You are implementing Phase 1 of the Hybrid Water Implementation Milestone Board: Foundation & Harness.

MISSION
Build or improve the simulation harness required for repeatable benchmark-driven development.

PHASE CONTEXT
This task is restricted to Phase 1. Do not implement detached sheets, breakup logic, or production LOD behavior here.

TARGET DELIVERABLES
- benchmark scene loader/switcher
- deterministic reset support
- pause/resume/single-step controls
- baseline overlay toggles
- counter strip and timing strip
- preset save/load scaffold

TARGET BENCHMARKS
Focus on enabling these scenes to run deterministically:
- Calm Impulse Sanity
- Vertical Drop Impact
- Oblique Impact

CONSTRAINTS
- Preserve future compatibility with diagnostics console and runtime data schema.
- Do not claim visual success.
- Do not add unrelated simulation complexity.

REQUIRED OUTPUT
Produce:
1. implementation changes
2. any new data contracts or scene registry structures
3. notes on how to run or test the harness
4. a TASK REPORT using the required template

SUCCESS CRITERIA
Success means a developer can switch scenes, reset deterministically, step frame-by-frame, and view basic counters/overlays.

VISUAL GOVERNANCE RULE
You are not authorized to claim visual sign-off. Any reference to improved appearance must be framed as visually pending human/external review.
```

---

## 6. Prompt A2 — Phase 2 Surface Field Layer

### Use When

You want an agent to implement or improve `U`, `R`, `C`, `M`, and optionally `A`.

### Prompt Template

```text
You are implementing Phase 2 of the Hybrid Water Implementation Milestone Board: Surface Field Layer.

MISSION
Build the latent field layer that allows the surface to express rupture intent, directionality, coherence, and detachable budget.

PHASE CONTEXT
Stay within the surface field layer. Do not implement detached sheets, necking, or visual benchmark approval logic.

TARGET DELIVERABLES
- stable surface textures/buffers for eta, etaDot, U, R, C, M (and optionally A)
- first normalized field formulas
- field update passes
- debug overlays for field inspection

TARGET BENCHMARKS
Use these as the primary evidence scenes:
- Calm Impulse Sanity
- Oblique Slash Fan (directional bias precursor)
- Crest Peel (field precursor only)

SUCCESS CRITERIA
- calm impulse does not create patch spam
- oblique forcing creates meaningful U directionality
- crest-like scenarios show plausible R buildup
- fields are inspectable and reasonably stable

FORBIDDEN MOVES
- do not implement patch extraction here unless strictly necessary for field debugging
- do not tune detached event visuals here
- do not describe the result as visually approved

REQUIRED OUTPUT
Return code changes plus a TASK REPORT with explicit diagnostics to inspect: U, R, C, M, and any helper overlays.
```

---

## 7. Prompt A3 — Phase 3 Patch Extraction & Event Resolution

```text
You are implementing Phase 3 of the Hybrid Water Implementation Milestone Board: Patch Extraction & Event Resolution.

MISSION
Convert dense surface intent fields into sparse coherent event candidates and a first-pass event resolver.

TARGET DELIVERABLES
- rupture seed logic
- patch extraction/grouping
- patch summary buffer or records
- event scoring / event resolution pass
- patch/event overlays and counters

TARGET BENCHMARKS
- Calm Impulse Sanity
- Vertical Drop Impact
- Oblique Slash Fan
- Crest Peel (patching precursor)

SUCCESS CRITERIA
- one meaningful disturbance produces a small number of coherent patches instead of noisy patch spam
- patch direction and priority are inspectable
- event resolve decisions are stable enough to reason about

FORBIDDEN MOVES
- no full detached sheet implementation yet
- no giant scene-specific hacks that break generality
- no visual sign-off claims

REQUIRED OUTPUT
Include the patch record/data contract, event scoring summary, diagnostics to inspect, and a TASK REPORT.
```

---

## 8. Prompt A4 — Phase 4 Minimal Detached Event Birth

```text
You are implementing Phase 4 of the Hybrid Water Implementation Milestone Board: Minimal Detached Event Birth.

MISSION
Birth the first sparse detached events from resolved patches while draining source budget explicitly.

TARGET DELIVERABLES
- packet/jet birth logic
- birth velocity synthesis (lift/throw/spread/noise)
- drain map application to M
- detached event counters
- basic reentry stub behavior

TARGET BENCHMARKS
- Vertical Drop Impact
- Oblique Slash Fan
- Crest Peel precursor scenario

SUCCESS CRITERIA
- detached events drain source reservoir visibly and structurally
- directional scenes produce distinct detached launch directions
- reentry stub can feed minimal surface response

FORBIDDEN MOVES
- do not claim the visuals are solved by packet births
- do not bypass reservoir accounting
- do not declare visual benchmark pass

REQUIRED OUTPUT
Provide implementation summary, touched files, drain-map contract notes, and TASK REPORT.
```

---

## 9. Prompt A5 — Phase 5 Minimal Detached Sheet Layer

```text
You are implementing Phase 5 of the Hybrid Water Implementation Milestone Board: Minimal Detached Sheet Layer.

MISSION
Introduce the first true detached-sheet representation so detached coherent water no longer appears only as packets or particles.

TARGET DELIVERABLES
- one ribbon sheet family
- optional small fan/patch family if feasible
- sheet object buffer
- sheet node/control-point buffer
- sheet render prep path
- thickness/stretch overlays

TARGET BENCHMARKS
- Oblique Slash Fan
- Crest Peel
- early Crown Impact sheet body

SUCCESS CRITERIA
- detached coherent structures visibly hold together better than packet-only mode
- thickness/stretch state is inspectable
- ribbon or fan behavior exists in the correct benchmarks

FORBIDDEN MOVES
- do not add full breakup logic yet unless minimally required for stability
- do not claim visual approval
- do not overbuild multiple families if one family is still incoherent

REQUIRED OUTPUT
Return code changes, sheet data contract updates, expected diagnostics to inspect, and TASK REPORT.
```

---

## 10. Prompt A6 — Phase 6 Carrier Support Integration

```text
You are implementing Phase 6 of the Hybrid Water Implementation Milestone Board: Carrier Support Integration.

MISSION
Give detached sheets internal support and motion guidance so they behave like skin over momentum-carrying support rather than ghost geometry.

TARGET DELIVERABLES
- carrier or support-packet pool
- carrier birth from sheet events
- support density / support velocity gather
- support-aware sheet updates

TARGET BENCHMARKS
- Crest Peel
- Oblique Slash Fan
- Ligament Pinch-Off Closeup (support precursor)

SUCCESS CRITERIA
- detached sheets track underlying motion better
- support density visibly influences stability/thickness behavior
- carrier overlays and inspector values are usable

FORBIDDEN MOVES
- no visual sign-off claims
- do not add high-cost neighbor search complexity unless justified and documented
- do not make carriers the visible final authority of thin water

REQUIRED OUTPUT
Include support-gather strategy, cost considerations, diagnostics to inspect, and TASK REPORT.
```

---

## 11. Prompt A7 — Phase 7 Breakup, Necking, and Spray

```text
You are implementing Phase 7 of the Hybrid Water Implementation Milestone Board: Breakup, Necking, and Spray.

MISSION
Introduce controlled failure of detached sheets via necking, local tear, edge fray, and fragment conversion.

TARGET DELIVERABLES
- neck score
- damage accumulation
- local tear logic
- edge fray behavior
- fragment birth/update path
- breakup diagnostics overlays

TARGET BENCHMARKS
- Ligament Pinch-Off Closeup
- Crown Impact edge fray
- Oblique Slash edge tendrils

SUCCESS CRITERIA
- necking visibly precedes pinch-off in the closeup benchmark
- edge fray is local rather than global
- fragment births are tied to actual tear regions

FORBIDDEN MOVES
- do not replace all coherent water with confetti particles
- do not claim the breakup now looks correct visually
- do not ignore diagnostics: neck score, damage, tear candidates must be inspectable

REQUIRED OUTPUT
Include explanation of tear logic, fragment source routing, diagnostics to inspect, and TASK REPORT.
```

---

## 12. Prompt A8 — Phase 8 Recapture and Return Routing

```text
You are implementing Phase 8 of the Hybrid Water Implementation Milestone Board: Recapture and Return Routing.

MISSION
Close the loop so detached material can return to the attached surface with meaningful structural consequences.

TARGET DELIVERABLES
- return candidate detection
- soft merge vs hard reentry classification
- return routing into M, U, etaDot, and optional auxiliary fields
- return diagnostics overlays and counters

TARGET BENCHMARKS
- Soft Recontact Merge
- Crown Impact collapse return
- Mixed-Regime Event reentry phases

SUCCESS CRITERIA
- detached structures measurably and visibly rejoin the surface structurally
- soft vs hard return cases differ meaningfully
- return affects surface fields and counters

FORBIDDEN MOVES
- do not treat every return as explosion
- do not silently delete detached material instead of routing it
- do not claim visual approval of return behavior

REQUIRED OUTPUT
Return routing summary, affected records/contracts, diagnostics to inspect, and TASK REPORT.
```

---

## 13. Prompt A9 — Phase 9 Diagnostics Console Maturation

```text
You are implementing Phase 9 of the Hybrid Water Implementation Milestone Board: Diagnostics Console Maturation.

MISSION
Expand the debug shell into a true laboratory console with inspectors, timeline, event log, snapshot compare, and benchmark-facing panels.

TARGET DELIVERABLES
- patch/sheet/carrier/fragment inspectors
- timeline and event log
- diagnostics presets
- snapshot compare workflow
- benchmark parameter panels
- optional machine-readable summary export

TARGET BENCHMARKS
Use any Tier 1 and Tier 2 benchmark where these tools materially improve diagnosis.

SUCCESS CRITERIA
- major runtime objects can be inspected interactively
- timeline and event log are usable
- snapshot compare works
- diagnostics presets reduce manual toggle chaos

FORBIDDEN MOVES
- do not let UI labels drift from schema enums
- do not implement visual approval logic that violates governance documents
- do not bury important benchmark status information

REQUIRED OUTPUT
Return UI modules changed, new schema/state usage, screenshots or usage notes if available, and TASK REPORT.
```

---

## 14. Prompt A10 — Phase 10 Performance, LOD, and Budget Hardening

```text
You are implementing Phase 10 of the Hybrid Water Implementation Milestone Board: Performance, LOD, and Budget Hardening.

MISSION
Make the hybrid water system robust on target hardware using caps, LOD, downgrade rules, and sparse-discipline enforcement.

TARGET DELIVERABLES
- hard caps for sparse pools
- family-specific LOD/downgrade rules
- importance scoring
- budget telemetry and cap-hit diagnostics

TARGET BENCHMARKS
- Hero Stress Test
- Fragment Budget Stress
- Distance/LOD Downgrade
- Full Mixed-Regime Event

SUCCESS CRITERIA
- no catastrophic collapse in stress scenes
- cap hits and downgrades are visible in diagnostics
- system degrades gracefully

FORBIDDEN MOVES
- do not hide failures by silently dropping critical hero events without reporting it
- do not destroy event-family identity just to lower counts
- do not claim visual approval from performance success

REQUIRED OUTPUT
Return cap strategy, LOD rules, diagnostics to inspect, target hardware assumptions, and TASK REPORT.
```

---

## 15. Prompt A11 — Phase 11 Hero Event Quality and Production Readiness

```text
You are implementing Phase 11 of the Hybrid Water Implementation Milestone Board: Hero Event Quality and Production Readiness.

MISSION
Polish the system until Tier 1 benchmarks are structurally strong, benchmark workflow is complete, and the engine is ready for broader production integration.

TARGET DELIVERABLES
- tuned Tier 1 benchmark presets
- benchmark evidence improvements
- validation board updates
- polished cross-regime behavior
- final structural readiness notes

TARGET BENCHMARKS
- H1 Cinematic Crown Impact
- H2 Oblique Slash Fan
- H3 Crest Peel
- H4 Ligament Pinch-Off Closeup
- H5 Full Mixed-Regime Event

SUCCESS CRITERIA
- benchmarks improve structurally without hiding failure modes
- benchmark records, passboard, captures, and review packets are aligned
- engine is ready for human/external visual review loops at production quality

FORBIDDEN MOVES
- do not mark visual approval yourself
- do not overfit one benchmark while regressing others without reporting it
- do not polish away evidence

REQUIRED OUTPUT
Return benchmark-by-benchmark structural status summary, preset changes, remaining known weaknesses, and TASK REPORT.
```

---

# Prompt Family B — Benchmark-Focused Prompts

## 16. Prompt B1 — Improve One Benchmark Structurally

```text
MISSION
Improve the structural behavior of benchmark <BENCHMARK_ID> without claiming visual approval.

BENCHMARK CONTEXT
Use the benchmark card for <BENCHMARK_ID> and the current passboard entry as the source of truth.

TASK
Identify the smallest implementation change likely to improve the benchmark structurally while preserving milestone alignment.

REQUIRED EVIDENCE
Report:
- which expected regime chain step is currently failing
- which diagnostics or counters support that claim
- which subsystem you changed
- what structural change is expected
- what remains visually pending review

FORBIDDEN MOVES
- no visual sign-off claims
- no broad unrelated refactors unless explicitly justified
- no benchmark evidence without naming the benchmark card and failure signatures
```

---

## 17. Prompt B2 — Diagnose Wrong-Look Failure

```text
MISSION
Diagnose the likely structural causes of the wrong-look signature <FAILURE_TAG> in benchmark <BENCHMARK_ID>.

TASK
Use the Visual Regime Atlas, Validation Manual, and current diagnostics to infer which structural subsystem is most likely responsible.

OUTPUT REQUIREMENTS
Provide:
1. likely cause ranking
2. diagnostics that should confirm or falsify each cause
3. smallest recommended implementation or tuning step
4. visual status reminder: visually pending authorized review

FORBIDDEN MOVES
- do not claim that the look is fixed
- do not confuse diagnosis with approval
```

---

## 18. Prompt B3 — Prepare Snapshot Packet for Review

```text
MISSION
Prepare the system to capture a valid snapshot packet for benchmark <BENCHMARK_ID>.

TASK
Ensure the required cameras, diagnostics views, metadata, and packet fields are available so a human or designated vision reviewer can inspect the event properly.

REQUIRED OUTPUT
- what packet views are required
- what metadata must be present
- what runtime summary should be attached
- what review brief should be written

FORBIDDEN MOVES
- do not author the visual verdict
- do not substitute a generic AI opinion for a review packet
```

---

# Prompt Family C — Data / Tooling Prompts

## 19. Prompt C1 — Implement Runtime Schema Slice

```text
MISSION
Implement the minimal first schema slice from the Runtime Data Model / Editor Schema.

TARGET TYPES
- SceneDefinition
- TuningPreset
- DiagnosticsPreset
- BenchmarkCard
- BenchmarkPassboardEntry
- CaptureRecord
- SnapshotPacket
- ReviewVerdict
- EditorSessionState

TASK
Build the data contracts and basic persistence/serialization paths without overbuilding unrelated tooling.

SUCCESS CRITERIA
- records can be created and linked
- benchmark/passboard/capture/packet/verdict chain is coherent
- structural vs visual states remain distinct

FORBIDDEN MOVES
- no unversioned ad hoc blobs
- no schema that erases reviewer class distinctions
- no visual approval shortcuts
```

---

## 20. Prompt C2 — Build Capture Archive Features

```text
MISSION
Implement the core archive features from the Reference Capture Companion.

TARGET DELIVERABLES
- CaptureRecord creation
- benchmark/preset/camera metadata linkage
- failure-tag assignment
- candidate/approved/rejected state support
- comparison record scaffold

SUCCESS CRITERIA
- important captures are searchable by benchmark and failure tag
- approved captures are linked to verdicts
- comparison records can reference two or more captures

FORBIDDEN MOVES
- no filename-only archive logic
- no approved capture without review linkage
```

---

## 21. Prompt C3 — Build Benchmark Dashboard / Passboard

```text
MISSION
Implement the benchmark passboard/dashboard layer using BenchmarkCard and BenchmarkPassboardEntry records.

TASK
Expose benchmark status, latest verdicts, latest approved captures, and current failure tags in a way that supports engineering and review workflows.

SUCCESS CRITERIA
- benchmarks can be browsed by status
- structural and visual states are clearly separated
- latest approved and latest rejected references are visible

FORBIDDEN MOVES
- do not compress structural and visual states into one ambiguous label
- do not hide reviewer identity/source
```

---

# Prompt Family D — Review-Governance Prompts

## 22. Prompt D1 — Add Visual Governance Hooks Without Violating Them

```text
MISSION
Implement support for visual review governance in the UI/runtime/archive without granting visual sign-off authority to generic AI paths.

TARGET DELIVERABLES
- review state badges
- review brief fields
- snapshot packet export hooks
- verdict record linkage
- structural vs visual status display

SUCCESS CRITERIA
- the system can mark visually pending / visually approved / visually rejected states from stored verdict records
- generic AI summary paths cannot directly mint visual approval

FORBIDDEN MOVES
- no generic AI visual sign-off
- no hidden approval state mutation
- no benchmark full-pass state without authorized review record
```

---

## 23. Prompt D2 — Build Agent-Safe Summary Export

```text
MISSION
Create a machine-readable runtime summary export that helps coding agents reason about the system without granting them visual authority.

TARGET DELIVERABLES
- RuntimeSummaryRecord generation
- export/copy path from diagnostics console
- summary includes benchmark id, active counts, dominant event families, current failure tags, structural state, and visual state

SUCCESS CRITERIA
- agents can reason from structured summaries
- summaries clearly indicate visually pending or externally reviewed status

FORBIDDEN MOVES
- do not let the summary imply that structural AI analysis equals visual approval
```

---

# Prompt Family E — Refactor / Audit Prompts

## 24. Prompt E1 — Refactor Without Contract Drift

```text
MISSION
Refactor subsystem <SUBSYSTEM_NAME> for clarity/performance while preserving all relevant data contracts, benchmark behavior, and diagnostics hooks.

TASK
Refactor only what is necessary. Preserve compatibility with:
- benchmark cards
- diagnostics overlays
- runtime schema
- review/capture hooks

REQUIRED OUTPUT
- contract changes, if any
- migration notes, if any
- benchmarks to re-run structurally
- diagnostics to inspect after refactor

FORBIDDEN MOVES
- no silent schema drift
- no removal of diagnostics hooks that benchmark workflows depend on
- no visual approval claims
```

---

## 25. Prompt E2 — Regression Audit

```text
MISSION
Audit a suspected regression between <REFERENCE_CAPTURE_OR_PRESET_A> and <REFERENCE_CAPTURE_OR_PRESET_B>.

TASK
Use benchmark records, capture metadata, comparison records, and diagnostics expectations to identify the most likely subsystem regression.

REQUIRED OUTPUT
- suspected regression area
- evidence from captures/benchmarks/counters
- whether regression is structural, visual, or both
- next smallest corrective step

FORBIDDEN MOVES
- do not declare visual quality better/worse without citing stored authorized review or clearly labeling it as a structural inference/hypothesis
```

---

# Prompt Family F — Master Handoff Wrappers

## 26. Prompt F1 — Narrow Implementation Task Wrapper

Use this for most day-to-day coding work.

```text
You are working on the Hybrid Water project.

CURRENT PHASE
<PHASE_ID_AND_NAME>

MISSION
<ONE_EXACT_IMPLEMENTATION_GOAL>

TARGET BENCHMARKS
<LIST>

RELEVANT CONTRACTS
- follow the current milestone board
- obey runtime data model contracts
- preserve diagnostics hooks
- preserve benchmark/capture/review workflows
- obey visual review governance: you may not grant visual approval

FILES / SYSTEMS IN SCOPE
<LIST>

OUT OF SCOPE
<LIST>

SUCCESS CRITERIA
<LIST>

REQUIRED OUTPUT
- implementation summary
- files changed
- data contracts touched
- benchmarks exercised or intended
- diagnostics to inspect
- TASK REPORT in required format
```

---

## 27. Prompt F2 — Broader Feature Build Wrapper

Use when a subsystem spans multiple modules but still must stay inside a phase boundary.

```text
You are implementing a bounded feature for the Hybrid Water project.

FEATURE
<FEATURE_NAME>

PHASE BOUNDARY
You must stay within <PHASE_NAME> and immediate dependencies. Do not overbuild later phases.

BENCHMARK GOAL
This work exists to improve structural readiness for:
<LIST OF BENCHMARKS>

AUTHORITY BOUNDARY
You are a coding/structural agent, not a visual sign-off authority. Do not claim visual approval. Phrase any aesthetic claims as structural hypotheses pending authorized visual review.

REQUIRED DELIVERABLES
<LIST>

REQUIRED REPORTING
Use the TASK REPORT template and explicitly call out:
- what changed structurally
- what remains visually unapproved
- what benchmark packet should be captured next
```

---

## 28. Prompt F3 — Human/Agent Collaboration Wrapper

Use when a human is steering and wants the agent tightly constrained.

```text
You are implementing a human-directed change in the Hybrid Water project.

HUMAN INTENT
<PASTE HUMAN GOAL>

PROJECT CONTRACTS
- do not violate milestone order
- do not remove diagnostics or schema hooks casually
- do not claim visual sign-off
- benchmark evidence matters more than confident prose

YOUR JOB
Translate the human goal into the smallest coherent implementation change that fits the current phase.

OUTPUT
1. brief interpretation of the task
2. implementation plan
3. code/changes
4. TASK REPORT
```

---

## 29. Review-State Phrases Agents Should Use

To reduce sloppy wording, agents should prefer phrases like:

* `structurally improved`
* `structurally stabilized`
* `likely improves directional detachment`
* `should reduce patch spam structurally`
* `visually pending authorized review`
* `requires snapshot packet confirmation`
* `no visual verdict claimed`

And avoid phrases like:

* `looks right now`
* `visuals are fixed`
* `approved`
* `done visually`
* `now realistic`

unless explicitly quoting stored authorized review verdicts.

---

## 30. Anti-Failure Rules for Agent Prompts

### 30.1 Never Give an Agent a Goal Without a Benchmark Context If One Exists

### 30.2 Never Let an Agent Declare Full Success Without Structural Evidence

### 30.3 Never Let an Agent Declare Visual Success Without Authorized Review Record

### 30.4 Never Ask for “General Improvements” Without Naming the Phase Boundary

### 30.5 Never Accept Output That Hides Touched Contracts

### 30.6 Never Accept Output That Claims the System “Looks Correct” Based Only on General AI Reasoning

These rules are not ceremonial. They are what keep the prompts useful.

---

## 31. Suggested First Real Prompt Sequence

If beginning actual implementation immediately, the recommended first prompt sequence is:

1. **A1 — Phase 1 Foundation & Harness**
2. **A2 — Phase 2 Surface Field Layer**
3. **C1 — Implement Runtime Schema Slice**
4. **A3 — Patch Extraction & Event Resolution**
5. **C3 — Benchmark Dashboard / Passboard**
6. **A4 — Minimal Detached Event Birth**
7. later continue with sheet, carrier, breakup, and recapture phases

This sequence builds the field spine, data spine, and benchmark spine before asking agents to be clever about detached water.

---

## 32. Closing Principle

A strong prompt pack does not merely tell an agent what to build.
It tells the agent:

* what phase of truth the project is currently in
* which evidence matters
* which contracts are sacred
* which kinds of confidence are forbidden
* how to report honestly

That is how AI assistance stops being chaos amplification and becomes disciplined leverage.

---

## 33. Planned Companion Documents

1. **Benchmark Dashboard Spec** — UI specification for passboard, comparisons, and review-linked browsing
2. **Capture Review Checklist Pack** — short standard forms for annotating benchmark captures and packet reviews
3. **Schema Migration Notes** — future-facing guide for evolving record types safely
4. **Execution Sprint Pack** — sprint-sized task bundles derived from the milestone board and prompt pack
















# Hybrid Water Benchmark Dashboard Spec

## A command-center UI specification for benchmark status, passboard truth, capture history, comparisons, review verdicts, and milestone visibility across the hybrid water project

---

## 0. Purpose

This document defines the Benchmark Dashboard for the hybrid water project.

Its purpose is to provide a single operational command center where a developer, reviewer, or AI-assisted engineer can see:

* which benchmarks exist
* which ones are structurally passing or failing
* which ones are visually pending, approved, or rejected
* what the latest captures and packets are
* what changed between versions
* what the current dominant failure signatures are
* what milestone phase each benchmark is blocking or advancing

The dashboard should not be a decorative gallery. It should function as the **truth surface** of the project’s benchmark and review system.

It should integrate data and workflows from:

* the **Hero Event Benchmark Pack**
* the **Visual Review Governance & Snapshot Pipeline**
* the **Reference Capture Companion**
* the **Runtime Data Model / Editor Schema**
* the **Validation Manual**
* the **Implementation Milestone Board**
* the **UI / Diagnostics Console Spec**

---

## 1. Dashboard Philosophy

### 1.1 One Place for Project Truth

A project like this should not require hunting through:

* code notes
* screenshots folders
* random captures
* old verdict messages
* vague memory

just to answer:

* Which benchmarks are healthy?
* Which are visually blocked?
* Which regressed?
* Which still suffer from hose look, bead soup, or dead recapture?

The dashboard should centralize that truth.

### 1.2 Structural and Visual States Must Be Shown Separately

The dashboard must never collapse structural status and visual status into a single ambiguous badge.

A benchmark can be:

* structurally passed / visually pending
* structurally passed / visually rejected
* structurally failed / visually untested
* structurally passed / visually approved

The dashboard must make this impossible to miss.

### 1.3 Benchmarks Are Operational Units, Not Just Pretty Scenes

Each benchmark card in the dashboard should be actionable.

It should answer:

* what this benchmark is testing
* what phase it supports
* what is currently wrong
* what the latest evidence is
* what should happen next

### 1.4 Comparison Must Be Built In

The dashboard is not complete unless a user can compare:

* latest candidate vs last approved
* candidate vs candidate
* milestone A vs milestone B
* before vs after a tuning change

Without that, the whole thing becomes a glorified screenshot scrapbook.

---

## 2. Primary Dashboard Views

The dashboard should support multiple coordinated views rather than one giant overcrowded table.

### 2.1 Overview Grid View

Shows all benchmarks as cards or rows with key status indicators.

### 2.2 Benchmark Detail View

Shows the full record for one benchmark:

* benchmark definition
* current passboard state
* latest captures
* verdict history
* comparisons
* related failure signatures

### 2.3 Comparison View

Side-by-side or multi-panel comparison of captures, presets, and verdict history.

### 2.4 Review Queue View

Shows benchmarks or snapshot packets currently awaiting human or designated visual review.

### 2.5 Milestone View

Shows benchmarks grouped by milestone phase relevance and blocking status.

### 2.6 Failure Signature View

Shows benchmarks grouped by common wrong-look tags such as:

* hose look
* bead soup
* rubber membrane
* particle confetti
* ghost water
* dead reentry

This is extremely useful when trying to stamp out systemic ugliness across multiple scenes.

---

## 3. Overview Grid View

The Overview Grid is the default command-center surface.

### 3.1 Each Benchmark Card Should Show

* benchmark id
* benchmark name
* priority tier
* target atlas family or family composition
* milestone relevance
* latest structural state
* latest visual state
* latest approved preset (if any)
* current dominant failure tags
* latest reviewed packet id
* review source of latest verdict
* last updated timestamp

### 3.2 Card Visual Language

Recommended layout:

* top: benchmark label and event family
* center: structural and visual state badges
* lower area: current failure tags and last capture thumbnail
* footer: latest approved / latest candidate / pending review indicators

### 3.3 Status Colors

Use separate but consistent color systems for:

* structural status
* visual status
* severity of current failure signatures

Do not use one muddy traffic-light scheme for everything. That way lies dashboard soup.

---

## 4. Benchmark Detail View

Selecting a benchmark opens a deep detail page or right-dock detail panel.

### 4.1 Header Section

Should show:

* benchmark id
* benchmark name
* event family
* milestone relevance
* current structural state
* current visual state
* last reviewed timestamp
* last review source

### 4.2 Definition Section

Should show data from the BenchmarkCard:

* canonical setup summary
* expected regime chain
* expected field signatures
* expected structural behaviors
* expected wrong looks
* review prompt set
* required snapshot packet angles

### 4.3 Current Passboard Section

Should show data from BenchmarkPassboardEntry:

* latest capture id
* latest packet id
* latest verdict id
* latest approved capture id
* latest approved preset id
* current failure tags
* summary note

### 4.4 Latest Evidence Section

Should show:

* latest candidate capture thumbnails
* latest approved reference if any
* latest rejected or needs-iteration reference if any
* associated structural summary

### 4.5 Review History Section

Should list:

* review verdict timeline
* reviewer source
* verdict state
* linked packet/capture
* notes

### 4.6 Comparison Section

Should show quick links for:

* current vs last approved
* current vs last rejected
* milestone-to-milestone comparisons
* preset-to-preset comparisons

### 4.7 Related Failure Signatures Section

Should show:

* current active failure tags
* historical recurring failure tags
* likely subsystems implicated
* linked atlas wrong-look entries

That last part is deliciously useful.

---

## 5. Review Queue View

This view should help manage the visual review pipeline.

### 5.1 Queue Categories

* structurally passed / visually pending human review
* structurally passed / visually pending designated vision review
* under review
* reviewed needs iteration
* pending arbitration

### 5.2 Each Queue Item Should Show

* benchmark id/name
* packet id
* requested reviewer class
* mission statement
* review question summary
* required packet completeness status
* structural state
* capture timestamp

### 5.3 Queue Actions

Possible actions:

* open packet
* open benchmark detail
* export review packet
* mark under review
* attach verdict
* assign reviewer
* flag packet incomplete

### 5.4 Incomplete Packet Warnings

The queue should make it obvious when a supposedly review-ready packet is missing:

* required camera angle
* clip
* review brief
* benchmark context
* preset link

No phantom review packets.

---

## 6. Comparison View

The Comparison View is where progress stops being vague.

### 6.1 Supported Comparison Modes

* candidate vs last approved
* candidate vs candidate
* preset A vs preset B
* milestone A vs milestone B
* structural pass but visual fail vs later visual pass

### 6.2 View Layout

A strong layout is:

* left media panel
* right media panel
* shared metadata strip
* parameter diff summary
* failure tag diff
* verdict diff
* note panel

### 6.3 Comparison Metadata Panel

Show:

* benchmark id
* capture ids
* preset ids
* timestamps
* structural states
* visual states
* reviewer sources
* failure tags
* parameter summary diff

### 6.4 Comparison Judgment Helpers

Optional but very powerful:

* highlight changed failure tags
* show whether visual state improved, regressed, or stayed unknown
* show which benchmark checklist items newly passed or newly failed

This makes the dashboard feel like a real instrument instead of just two images staring at each other awkwardly.

---

## 7. Milestone View

The Milestone View organizes benchmark truth against the Implementation Milestone Board.

### 7.1 Grouping

Benchmarks should be grouped by milestone relevance, for example:

* Phase 2 critical benchmarks
* Phase 3 critical benchmarks
* Phase 5 detached-sheet benchmarks
* Phase 7 breakup benchmarks
* Phase 8 recapture benchmarks
* Phase 11 hero-finish benchmarks

### 7.2 Purpose

This lets the team answer:

* which milestone is currently blocked by benchmark failures?
* which benchmarks are already strong enough to stop spending time on?
* which failure signatures are phase-defining right now?

### 7.3 Milestone Status Rollup

Each phase group should show rollup counts such as:

* total relevant benchmarks
* structurally passed count
* visually approved count
* pending review count
* rejected count
* most common blocking failure tag

### 7.4 Blocker Panel

A milestone blocker section should call out benchmarks that are:

* preventing phase exit
* repeatedly failing the same signature
* lacking required review evidence

---

## 8. Failure Signature View

This is a cross-benchmark debugging dashboard organized by wrong-look signatures.

### 8.1 Grouping by Failure Tag

Examples:

* hose look
* bead soup
* rubber membrane
* particle confetti
* ghost water
* dead reentry
* patch spam
* no recapture
* budget runaway
* lod popping

### 8.2 Purpose

This helps identify systemic issues such as:

* one birth-velocity bug causing hose behavior in multiple benchmarks
* one support/coupling weakness causing ghost water across detached events
* one tear threshold family causing bead soup everywhere

### 8.3 Per-Tag Detail

For each failure tag, show:

* linked benchmarks
* latest captures carrying the tag
* historical trend of the tag
* likely subsystem owners
* comparison links showing improvement or regression

This is the dashboard equivalent of hunting monsters by footprint instead of waiting for them to bite you again.

---

## 9. Dashboard Filters and Search

The dashboard must be filterable, or it will become sludge.

### 9.1 Core Filters

* benchmark id
* benchmark family
* milestone phase
* structural status
* visual status
* reviewer class/source
* failure signature tags
* preset id
* time window
* approval state

### 9.2 Search Targets

Free-text search should hit:

* benchmark names
* notes
* review prompts
* failure tags
* review notes
* preset labels

### 9.3 Saved Filter Presets

Useful saved views:

* all visually pending Tier 1 benchmarks
* all benchmarks with `hose_look`
* all structurally passed but visually rejected candidates
* all benchmarks blocking Phase 7 exit
* latest approved references only

---

## 10. Required Data Sources

The dashboard should be powered by the runtime/editor schema rather than ad hoc scraping.

### 10.1 Primary Records Consumed

* `BenchmarkCard`
* `BenchmarkPassboardEntry`
* `CaptureRecord`
* `SnapshotPacket`
* `ReviewVerdict`
* `ComparisonRecord`
* `MilestoneCaptureSet`
* `TuningPreset`
* `RuntimeSummaryRecord`

### 10.2 Optional Supporting Records

* `AtlasTagRecord`
* scene definitions and scene instance summaries
* diagnostics preset records

### 10.3 Hard Rule

Do not infer critical status from filenames or freeform notes when structured records already exist. That is how truth becomes mush.

---

## 11. Passboard Panel Spec

The passboard is the compact truth layer inside the dashboard.

### 11.1 Required Fields per Row

* benchmark id
* latest structural state
* latest visual state
* latest approved capture id
* latest candidate capture id
* latest verdict source
* current failure tags
* last updated time

### 11.2 Optional Expanded Fields

* milestone phase relevance
* priority tier
* next recommended action
* latest approved preset
* latest packet completeness score

### 11.3 Sorting Options

* by priority tier
* by last updated
* by structural state
* by visual state
* by number of active failure tags
* by milestone blocking severity

---

## 12. Benchmark Status Badges

The dashboard should use explicit badges.

### 12.1 Structural Badges

* `STRUCTURAL UNTESTED`
* `STRUCTURAL PENDING`
* `STRUCTURAL PASS`
* `STRUCTURAL FAIL`

### 12.2 Visual Badges

* `VISUAL UNTESTED`
* `VISUAL PENDING HUMAN REVIEW`
* `VISUAL PENDING EXTERNAL VISION REVIEW`
* `VISUAL NEEDS ITERATION`
* `VISUAL APPROVED`
* `VISUAL REJECTED`

### 12.3 Review Source Badge

* `SOURCE: HUMAN`
* `SOURCE: DESIGNATED VISION MODEL`
* `SOURCE: HUMAN CONFIRMED EXTERNAL REVIEW`

These should be loud and hard to misread.

---

## 13. Benchmark Capture Strip

Within the detail view, each benchmark should have a capture strip.

### 13.1 Lanes

Recommended lanes:

* latest candidate
* latest approved
* latest rejected
* latest structurally passed
* historical milestones

### 13.2 Each Capture Tile Should Show

* thumbnail
* capture id
* preset id
* capture type
* structural state
* visual state
* key failure tags
* timestamp

### 13.3 Tile Actions

* open full detail
* compare with another
* jump to packet
* jump to verdict
* add to milestone set
* export

---

## 14. Packet and Verdict Detail Panels

The dashboard should allow deep inspection of packet and verdict records.

### 14.1 Packet Detail

Show:

* packet id
* packet state
* benchmark id
* mission statement
* review questions
* included captures/clips
* requested reviewer class
* completeness status
* export history

### 14.2 Verdict Detail

Show:

* verdict id
* review kind
* review source class
* reviewer identity/source
* verdict state
* failure tags
* recommended next action
* notes
* linked packet and captures

This is where governance becomes concrete.

---

## 15. Workflow Actions

The dashboard should support direct workflow actions.

### 15.1 Benchmark Actions

* open benchmark in scene
* open latest candidate capture
* open latest approved reference
* create new snapshot packet
* assign review
* compare current vs approved
* mark structurally pending retest

### 15.2 Review Actions

* attach verdict
* route to human review
* route to designated vision review
* mark packet incomplete
* mark needs more angles
* archive review result

### 15.3 Comparison Actions

* create comparison record
* compare selected captures
* promote comparison to milestone reference

### 15.4 Archive Actions

* open capture browser filtered to this benchmark
* show all historical failures of this benchmark
* show all approved references of this family

---

## 16. Dashboard Notifications and Warnings

The system should actively warn about broken states.

### 16.1 Important Warnings

* structurally passed but visually never reviewed
* visual verdict exists but required packet angles missing
* approved capture missing linked verdict
* benchmark marked approved but latest passboard is stale
* recurring failure signature across multiple benchmarks
* milestone blocker not reviewed recently

### 16.2 Why Warnings Matter

They prevent the dashboard from drifting into false reassurance.

---

## 17. Suggested Layout Variants

### 17.1 Wide Desktop Layout

* left: benchmark list/passboard
* center: selected benchmark detail
* right: capture/verdict/packet inspectors
* bottom: comparisons or review timeline

### 17.2 Compact Layout

* top passboard strip
* tabbed detail panes
* collapsible side inspectors

### 17.3 Review Mode Layout

* large packet preview
* verdict form or verdict detail
* benchmark summary side rail
* prior approved reference side-by-side

### 17.4 Milestone Mode Layout

* grouped phase columns
* blockers and pass counts
* quick jump to failing benchmarks

---

## 18. Dashboard Build Order

This should be implemented in phases, not all at once.

### Phase A — Core Passboard

Build:

* overview grid
* benchmark status badges
* basic benchmark detail panel
* latest capture links

### Phase B — Review and Packet Integration

Build:

* review queue view
* packet detail panel
* verdict detail panel
* structurally vs visually pending flows

### Phase C — Comparison Layer

Build:

* side-by-side comparison view
* parameter diff summary
* historical compare shortcuts

### Phase D — Milestone and Failure Views

Build:

* milestone grouping
* failure signature dashboard
* blocker panel

### Phase E — Advanced Search / Trend Layer

Build:

* historical trends
* filter presets
* recurring failure charts
* approval cadence views

This rollout makes the dashboard useful early without demanding a whole cathedral before first use.

---

## 19. AI / Agent Usage Boundaries

The dashboard may support AI-assisted summaries, but must preserve authority boundaries.

### 19.1 Allowed AI Uses

* summarize passboard state
* summarize recurring failure tags
* suggest likely subsystem owners based on structured records
* generate next-action recommendations from benchmark history

### 19.2 Forbidden AI Uses

* auto-mark visual approval without authorized verdict record
* replace review queue with AI guesses
* collapse human and model review sources into one ambiguous “AI approved” label

### 19.3 Dashboard Truth Rule

The dashboard should derive visual approval state only from stored authorized review verdicts, not from optimistic agent prose.

---

## 20. Example Overview Row Sketch

```text
[H3_CrestPeel]  Tier1  Phase 5/7/8/11
STRUCTURAL PASS   VISUAL NEEDS ITERATION   SOURCE: DESIGNATED VISION MODEL
Failure tags: hose_look
Latest candidate: cap_H3_CrestPeel_2026-02-26_1842_iter07
Latest approved: none
Next action: iterate_birth_direction
Last updated: 2026-02-26 19:01
```

That is the level of sober clarity the dashboard should aim for.

---

## 21. Success Criteria

The Benchmark Dashboard is successful when a developer or reviewer can answer, within seconds:

* What are the top 3 blocked benchmarks right now?
* Which benchmarks are structurally healthy but still visually pending?
* Which captures are the last approved references for each Tier 1 event?
* Which failure signature is currently most widespread?
* Which benchmark regressed after the last tuning change?
* Which phase is blocked by what evidence?

If the dashboard can answer these cleanly, it is earning its keep.

---

## 22. Closing Principle

A project like this needs a place where all its truths meet:

* benchmark intent
* runtime evidence
* capture memory
* review governance
* milestone pressure
* historical comparison

That place is the Benchmark Dashboard.

When built well, it becomes the operational brainstem of the hybrid water project: not where the simulation thinks, but where the team can finally see what the simulation has actually become.

---

## 23. Planned Companion Documents

1. **Capture Review Checklist Pack** — short standardized forms for benchmark captures, packet completeness, and review annotation
2. **Schema Migration Notes** — evolving the runtime/editor schema safely over time
3. **Execution Sprint Pack** — sprint-sized implementation bundles derived from the milestone board and agent prompt pack
4. **Dashboard Interaction Flow Spec** — click-path and UX flow details for benchmark triage, review queue processing, and comparison workflows






# Section 20. Detailed Runtime State Machine

## Purpose

This document expands the thesis into an explicit runtime state machine for the hybrid MLS-MPM fluid surface and breakup system. It defines:

* the state domains,
* the transition rules,
* the hysteresis structure,
* the cooldown and budget mechanisms,
* the relationship between primary and secondary populations,
* and the logic required to prevent threshold chatter, runaway spawning, and visual incoherence.

This section should be understood as the bridge between theory and implementation. It is the layer where derived quantities such as exposure, coherence, sheetness, rollingness, elongation, thinning, breakup instability, and reabsorption potential become operational decisions.

---

# 20.1. Runtime Philosophy

The system is not governed by one monolithic state. It is governed by two linked state domains:

1. **Primary fluid states** for the mass-carrying MLS-MPM body
2. **Secondary breakup states** for transient filament, droplet, and mist populations

The primary state machine determines how coherent fluid should be represented and when it becomes a breakup source. The secondary state machine governs the lifecycle of fragments once breakup begins.

The state machine must obey five core requirements:

1. **Continuity** — coherent water must remain coherent until sufficient evidence for breakup accumulates.
2. **Hysteresis** — state transitions must not flicker under noisy thresholds.
3. **Budget control** — breakup spawning must remain bounded.
4. **Reversibility where appropriate** — calm water may become rolling water and settle again; proto-filaments may briefly re-stabilize.
5. **Irreversibility where appropriate** — certain detached states should not unrealistically snap backward into earlier branch states without passing through merge-back logic.

---

# 20.2. State Domains

## 20.2.1. Primary Domain

The primary domain acts on fluid regions or primary particles. Its canonical states are:

* `P_BULK`
* `P_SHEET_CALM`
* `P_SHEET_ROLLING`
* `P_BREAKUP_SOURCE`

These states classify the coherent body.

## 20.2.2. Secondary Domain

The secondary domain acts on spawned breakup entities. Its canonical states are:

* `S_PROTO_FILAMENT`
* `S_LIGAMENT`
* `S_BEAD_CHAIN`
* `S_DROPLET_MACRO`
* `S_DROPLET_STD`
* `S_DROPLET_MICRO`
* `S_MIST`
* `S_REABSORBING`
* `S_DEAD`

These states classify the detached or semi-detached hierarchy.

---

# 20.3. Primary State Definitions

## 20.3.1. `P_BULK`

This state represents fluid that is not significantly exposed to air or not meaningful as a distinct visible surface regime.

### Required character

* low exposure
* high burial or strong support
* no immediate breakup relevance

### Visual meaning

This state contributes to the fluid body but is not itself a direct candidate for calm-sheet flattening or breakup spawning.

---

## 20.3.2. `P_SHEET_CALM`

This state represents exposed coherent fluid whose motion remains calm enough to justify strong surface-envelope treatment.

### Required character

* high exposure
* high coherence
* high sheetness
* low breakup instability
* high top-envelope validity

### Visual meaning

The surface may strongly favor flattening, top-envelope reconstruction, and ripple-preserving smoothing.

---

## 20.3.3. `P_SHEET_ROLLING`

This state represents exposed coherent wave skin with more active motion than calm sheet but without true fragmentation.

### Required character

* high exposure
* high coherence
* rollingness above threshold
* breakup instability still below fragmentation threshold

### Visual meaning

The surface remains coherent and smooth but permits stronger relief, directional bias, and reduced flattening.

---

## 20.3.4. `P_BREAKUP_SOURCE`

This state represents exposed coherent or semi-coherent fluid that has accumulated sufficient evidence to act as a parent source for secondary breakup entities.

### Required character

* high exposure
* sufficient elongation
* sufficient thinning
* sustained breakup instability

### Visual meaning

This state is the hand-off zone between coherent surface representation and explicit breakup hierarchy.

---

# 20.4. Secondary State Definitions

## 20.4.1. `S_PROTO_FILAMENT`

A newly spawned attached or near-attached branch emerging from a breakup source.

### Required character

* still continuous
* still visibly branch-like
* not yet necked into beads
* attachment still significant

### Visual meaning

Tapered stretched branch or streak.

---

## 20.4.2. `S_LIGAMENT`

A thinner and more unstable thread than the proto-filament.

### Required character

* thinning increasing
* instability increasing
* still continuous enough to remain branch-like

### Visual meaning

Narrow unstable filament with strong taper and imminent necking.

---

## 20.4.3. `S_BEAD_CHAIN`

A ligament whose necking signal has crossed threshold and now exhibits alternating thick and thin structure.

### Required character

* high necking readiness
* attachment reduced but not necessarily zero
* local bead structure available or synthesizable

### Visual meaning

Pearl-chain structure bridging thread and droplets.

---

## 20.4.4. `S_DROPLET_MACRO`

A detached large droplet, typically emitted from a major bead or violent snap.

## 20.4.5. `S_DROPLET_STD`

A normal detached droplet.

## 20.4.6. `S_DROPLET_MICRO`

A small detached droplet approaching mist scale.

### Shared character

* detached
* ballistic or drag-driven
* reabsorption candidate on fluid contact

---

## 20.4.7. `S_MIST`

The smallest spray population.

### Required character

* very small scale
* short lifetime
* high event-count but low individual importance

### Visual meaning

Soft, ephemeral terminal spray.

---

## 20.4.8. `S_REABSORBING`

A temporary merge-back state for fragments that have contacted coherent fluid and are accumulating merge age.

### Required character

* contact with coherent fluid field
* sufficient merge compatibility
* no immediate bounce-back into free spray

### Visual meaning

The fragment is no longer a free independent entity, but not yet removed.

---

## 20.4.9. `S_DEAD`

Terminal state for expired or fully merged secondary entities.

---

# 20.5. Primary Transition Logic

This section defines the primary-domain transitions using explicit enter and exit rules.

## 20.5.1. `P_BULK -> P_SHEET_CALM`

Enter calm sheet when:

* `E > E_sheet_enter`
* `C > C_sheet_enter`
* `Sheet > Sheet_enter`
* `B < B_sheet_enter`
* `Venv > Venv_enter`
* and conditions persist for `t_sheet_enter`

Exit condition back toward bulk:

* `E < E_sheet_exit`
* or `C < C_sheet_exit`
* persisting for `t_sheet_exit`

Constraint:
`E_sheet_enter > E_sheet_exit`, `C_sheet_enter > C_sheet_exit`

This creates hysteresis and prevents flicker when the surface hovers near exposure thresholds.

---

## 20.5.2. `P_SHEET_CALM -> P_SHEET_ROLLING`

Enter rolling sheet when:

* `Roll > Roll_enter`
* `speedN > speed_roll_enter`
* `B < B_roll_cap`
* and `upAgg < up_roll_cap`
* persisting for `t_roll_enter`

Exit back to calm sheet when:

* `Roll < Roll_exit`
* or `R > Rest_recover_enter`
* persisting for `t_roll_exit`

This allows ordinary wave motion to move between calm and rolling regimes without falsely becoming breakup.

---

## 20.5.3. `P_SHEET_ROLLING -> P_BREAKUP_SOURCE`

Enter breakup source when:

* `E > E_break_enter`
* `L > L_break_enter`
* `T > T_break_enter`
* `B > B_break_enter`
* and `BreakAge > BreakAge_enter`
* optionally with `Pproto > Pproto_enter`

Exit back to rolling sheet when:

* `B < B_break_exit`
* and `L < L_break_exit`
* and `T < T_break_exit`
* persisting for `t_break_exit`

This is the crucial gate between coherent wave behavior and explicit fragmentation.

---

## 20.5.4. `P_SHEET_CALM -> P_BREAKUP_SOURCE`

This path should be rare but legal.

Direct calm-sheet to breakup-source transition is allowed when a localized violent event occurs, such as:

* sudden impact
* sudden upward impulse
* strong local ejection

Required condition:

* `impactEvent = true` or `upAgg > up_break_direct`
* plus `B > B_break_direct`
* plus short persistence or explicit impulse event latch

This prevents the architecture from being unrealistically forced through a long rolling phase when the water is abruptly disturbed.

---

## 20.5.5. `P_BREAKUP_SOURCE -> P_SHEET_ROLLING`

If breakup conditions relax before substantial secondary spawning occurs, the source may return to coherent wave behavior.

Enter rolling recovery when:

* `B < B_recover_enter`
* `C > C_recover_enter`
* `L < L_recover_enter`
* `T < T_recover_enter`
* and no active spawn latch remains

This prevents every temporary crest from becoming a permanent fragment factory.

---

## 20.5.6. `P_BREAKUP_SOURCE -> P_BULK`

This should be unusual. It occurs when the region ceases to be meaningfully exposed.

Required condition:

* `E < E_bulk_return`
* persisting for `t_bulk_return`

---

# 20.6. Secondary Transition Logic

## 20.6.1. Spawn Rule: `P_BREAKUP_SOURCE -> S_PROTO_FILAMENT`

Spawning a proto-filament is not automatic for every breakup-source particle. A source must satisfy both state validity and spawn policy.

### Spawn validity

* `Pproto > Pproto_spawn`
* `BreakAge > BreakAge_spawn`
* `cooldownPrimary <= 0`

### Spawn policy

* within frame spawn budget
* within local density of active secondary entities
* within visibility/importance budget if desired

### Spawn result

* create a proto-filament entity
* initialize tangent from local flow direction or dominant anisotropy axis
* initialize thickness from parent support scale
* initialize attachment high
* initialize instability from local `B`

Then set parent source cooldown.

---

## 20.6.2. `S_PROTO_FILAMENT -> S_LIGAMENT`

Enter ligament when:

* `thinSeg > thin_lig_enter`
* `instability > inst_lig_enter`
* `age > age_lig_enter`
* `attach > attach_lig_min`

Exit back to proto-filament when:

* `thinSeg < thin_lig_exit`
* and `instability < inst_lig_exit`
* persisting for `t_lig_exit`

This limited reversibility is allowed because early branches may briefly re-stabilize.

---

## 20.6.3. `S_LIGAMENT -> S_BEAD_CHAIN`

Enter bead-chain when:

* `neck > neck_bead_enter`
* `Qbead > Qbead_enter`
* `age > age_bead_enter`

Exit back to ligament only if:

* `neck < neck_bead_exit`
* `Qbead < Qbead_exit`
* and no detached children have yet been emitted

Once repeated detachment has begun, full reversal should usually be suppressed.

---

## 20.6.4. `S_BEAD_CHAIN -> S_DROPLET_*`

Detachment occurs at one or more bead candidates when:

* `Detach > Detach_enter`
* local neck collapse criterion satisfied
* detach cooldown <= 0
* droplet spawn budget available

The emitted droplet class depends on radius:

* `r >= r_macro_min` -> `S_DROPLET_MACRO`
* `r_micro_max < r < r_macro_min` -> `S_DROPLET_STD`
* `r <= r_micro_max` -> `S_DROPLET_MICRO`

The parent bead-chain may remain alive after partial droplet emission.

This is important. Real breakup is often progressive, not one-frame total annihilation.

---

## 20.6.5. `S_LIGAMENT -> S_DROPLET_*` (direct snap)

Direct ligament-to-droplet transition is allowed when:

* `instability > inst_snap_enter`
* `attach < attach_snap_max`
* `thinSeg > thin_snap_enter`
* or a violent impulse event occurs

This handles fast snaps where bead-chain visualization is too brief or too fine to justify a long intermediate stage.

---

## 20.6.6. `S_DROPLET_MICRO -> S_MIST`

Enter mist when:

* `Mist > Mist_enter`
* and either high impact energy or very small radius is present
* and mist budget is available

This can occur either by converting micro-droplets into mist entities or by emitting mist from them while killing or shrinking the parent.

---

## 20.6.7. `S_DROPLET_* -> S_REABSORBING`

Enter reabsorbing state when:

* `Rmerge > Rmerge_enter`
* `MergeAge` begins accumulating
* local coherent-fluid contact is present

Exit back to free droplet when:

* contact is lost
* or `Rmerge < Rmerge_exit`
* before merge age threshold completes

This prevents droplets from instantly disappearing the moment they graze the parent surface.

---

## 20.6.8. `S_REABSORBING -> S_DEAD`

When:

* `MergeAge > MergeAge_enter`

At this point the fragment is considered merged back into the coherent body. The system should optionally deposit visual or momentum cues into the main fluid representation before removing the entity.

---

## 20.6.9. Lifetime Death

Any secondary entity may transition to `S_DEAD` if:

* `age > lifetime`
* entity leaves relevant bounds
* contribution falls below visibility threshold
* or explicit culling is required by budget policy

Mist especially should be aggressively lifetime-bounded.

---

# 20.7. Hysteresis Structure

Hysteresis is not optional. It is a first-class stabilizer.

## 20.7.1. Entry/Exit Threshold Pairs

Every state-driving quantity should use paired thresholds:

* `enter`
* `exit`

with:

* `enter > exit` for positive-going activation
* `enter < exit` for negative-going deactivation where appropriate

Examples:

* `Sheet_enter`, `Sheet_exit`
* `Break_enter`, `Break_exit`
* `Qbead_enter`, `Qbead_exit`
* `Rmerge_enter`, `Rmerge_exit`

This prevents state thrashing when a value hovers near threshold.

---

## 20.7.2. Age Accumulators

Entry into important states should usually require persistence.

Canonical accumulators:

* `BreakAge`
* `ThinAge`
* `MergeAge`
* optional `NeckAge`

Generic form:

`dAge/dt = kEnter * max(0, X - X_enter) - kDecay * Age`

A state becomes active only when `Age > Age_enter`.

This provides temporal memory and suppresses one-frame noise.

---

## 20.7.3. Cooldowns

Cooldowns prevent repeated instant respawn or rapid oscillation.

Recommended cooldowns:

* `cooldownPrimarySpawn`
* `cooldownDetach`
* `cooldownMerge`
* `cooldownMist`

Example rule:

After a breakup source spawns a proto-filament, set `cooldownPrimarySpawn = t_spawn_cd`. While this cooldown is positive, the same source cannot spawn again.

This stops pathological particle machine-gunning.

---

## 20.7.4. Latches

Some events should be latched for a short time even if the raw driving score falls immediately.

Useful latches:

* impact latch
* detach latch
* merge-contact latch

An impact latch is especially useful for direct calm-sheet to breakup-source transitions caused by strong collisions.

---

# 20.8. Spawn Budgets and Population Control

The breakup hierarchy must remain bounded.

## 20.8.1. Global Budgets

Recommended per-frame or rolling budgets:

* `maxProtoPerFrame`
* `maxLigamentsActive`
* `maxDropletsPerFrame`
* `maxDropletsActive`
* `maxMistPerFrame`
* `maxMistActive`

## 20.8.2. Local Density Limits

In addition to global budgets, each local region should have a cap on active secondary entities.

This prevents overpopulation of breakup structures in one crest region.

## 20.8.3. Priority Ranking

When more candidates exist than budget permits, rank them by a priority score such as:

`Priority = w1 * B + w2 * exposure + w3 * elongation + w4 * viewImportance + w5 * eventImportance`

This ensures the most important breakup events survive budget pressure.

---

# 20.9. State Ownership and Parent-Child Relationships

Secondary entities should retain a notion of parentage.

## 20.9.1. Parent Source Reference

Each secondary entity should store:

* parent primary id or region id
* parent spawn time or generation id
* optional chain id for grouped branch systems

## 20.9.2. Ownership Use Cases

Parentage is useful for:

* preventing duplicate local spawning
* reabsorption attribution
* visual coherence of branch families
* debugging lineage

## 20.9.3. Ownership Decay

Once a droplet has existed long enough or moved far enough from the source, parent identity may matter less. At that point the entity may become effectively independent except for merge-back logic.

---

# 20.10. Reversibility and Irreversibility Rules

Not all state transitions should be equally reversible.

## 20.10.1. Reversible Zones

These transitions should be allowed to reverse:

* `P_SHEET_CALM <-> P_SHEET_ROLLING`
* `P_SHEET_ROLLING <-> P_BREAKUP_SOURCE` if fragmentation has not meaningfully spawned
* `S_PROTO_FILAMENT <-> S_LIGAMENT` in early branch life
* `S_DROPLET_* <-> S_REABSORBING` while merge is incomplete

## 20.10.2. Weakly Reversible Zones

These transitions may reverse only in limited cases:

* `S_LIGAMENT <-> S_BEAD_CHAIN` before significant detachment

## 20.10.3. Irreversible Zones

These transitions should generally be treated as one-way:

* `S_BEAD_CHAIN -> detached droplet emission` once multiple detachments have occurred
* `S_REABSORBING -> S_DEAD`
* `S_DEAD` to anything else

This preserves believable lifecycle progression.

---

# 20.11. Canonical Update Order

The state machine should be evaluated in a stable order each frame or simulation step.

## 20.11.1. Primary Update Order

1. compute derived state quantities for primaries
2. update primary age accumulators
3. resolve primary state transitions
4. determine breakup-source candidates
5. enforce primary spawn cooldowns and budgets

## 20.11.2. Secondary Update Order

1. update existing secondary kinematics
2. update secondary state quantities
3. update thinning, necking, and merge accumulators
4. resolve secondary state transitions
5. emit droplets or mist subject to budgets
6. update reabsorption states
7. cull dead entities

This order prevents contradictory evaluation where a newly spawned entity is instantly reclassified multiple times in one frame.

---

# 20.12. Canonical Transition Table

## Primary Domain

* `P_BULK -> P_SHEET_CALM`
* `P_SHEET_CALM -> P_BULK`
* `P_SHEET_CALM -> P_SHEET_ROLLING`
* `P_SHEET_ROLLING -> P_SHEET_CALM`
* `P_SHEET_ROLLING -> P_BREAKUP_SOURCE`
* `P_SHEET_CALM -> P_BREAKUP_SOURCE` (rare direct event path)
* `P_BREAKUP_SOURCE -> P_SHEET_ROLLING`
* `P_BREAKUP_SOURCE -> P_BULK` (rare burial path)

## Secondary Domain

* `spawn -> S_PROTO_FILAMENT`
* `S_PROTO_FILAMENT -> S_LIGAMENT`
* `S_LIGAMENT -> S_PROTO_FILAMENT` (limited)
* `S_LIGAMENT -> S_BEAD_CHAIN`
* `S_BEAD_CHAIN -> S_LIGAMENT` (limited, pre-detach only)
* `S_BEAD_CHAIN -> S_DROPLET_*`
* `S_LIGAMENT -> S_DROPLET_*` (direct snap)
* `S_DROPLET_MICRO -> S_MIST`
* `S_DROPLET_* -> S_REABSORBING`
* `S_REABSORBING -> S_DEAD`
* `any secondary -> S_DEAD` by lifetime or cull

---

# 20.13. Failure Modes This State Machine Prevents

This explicit structure exists to prevent common catastrophic behaviors.

## 20.13.1. Threshold Flicker

Without hysteresis, the fluid chatters between calm sheet, rolling sheet, and breakup-source states.

## 20.13.2. Spawn Machine-Gunning

Without cooldowns and budgets, one crest emits absurd numbers of secondary entities.

## 20.13.3. Fake Binary Splashing

Without intermediate filament and bead-chain states, breakup jumps directly from coherent surface to equal-size droplets.

## 20.13.4. Immortal Spray Confetti

Without reabsorption and lifetime death, the scene fills with permanent tiny fragments.

## 20.13.5. Unrealistic Forced Irreversibility

Without limited reversibility, small wave crests cannot calm back down and every disturbance becomes catastrophic.

---

# 20.14. Operational Summary

The runtime state machine can be summarized as follows:

1. Classify coherent fluid into bulk, calm sheet, rolling sheet, or breakup source.
2. Require exposure, elongation, thinning, and persistent breakup evidence before spawning secondary branches.
3. Evolve secondary branches from proto-filament to ligament to bead-chain.
4. Emit droplets progressively rather than all at once.
5. Convert only the smallest and most violent terminal fragments into mist.
6. Merge detached fragments back into the coherent body through an explicit reabsorbing state.
7. Bound everything with hysteresis, cooldowns, spawn budgets, and lifetime rules.

This transforms the hierarchy from a poetic idea into an executable behavioral doctrine.

---

# 20.15. Next Expansion Targets After Section 20

The strongest next sections to build are:

1. **GPU data structures, buffer schemas, and bind-group architecture**
2. **Sheet-envelope reconstruction theory and top-envelope extraction**
3. **Filament and bead-chain geometry synthesis**
4. **Droplet ballistic motion, drag, and merge-back deposition**
5. **Budgeting, scheduling, diagnostics, and visual debugging tools**













