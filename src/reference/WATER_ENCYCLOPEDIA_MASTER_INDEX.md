Water Encyclopedia Master Index v0.1 (engine-ready)
0) How every entry is written (phenomenon card contract)

Every leaf node in the index becomes a Phenomenon Card with:

ID / Name

Where it lives: surface / subsurface / air–water interface / bottom boundary

Scale: wavelength/feature size, time scale

Dominant dimensionless regime (pick what matters):

Froude 
𝐹
𝑟
=
𝑈
𝑔
𝐿
Fr=
gL
	​

U
	​

 (gravity vs inertia)

Reynolds 
𝑅
𝑒
=
𝜌
𝑈
𝐿
𝜇
Re=
μ
ρUL
	​

 (turbulence vs viscosity)

Weber 
𝑊
𝑒
=
𝜌
𝑈
2
𝐿
𝜎
We=
σ
ρU
2
L
	​

 (breakup vs surface tension)

Bond/Eötvös 
𝐵
𝑜
=
𝜌
𝑔
𝐿
2
𝜎
Bo=
σ
ρgL
2
	​

 (gravity vs surface tension)

Governing model (math): the minimum equations needed

Observable cues (what the camera sees)

What looks wrong (anti-cues)

Engine mapping:

required fields: 
𝜂
η (height), 
∇
𝜂
∇η (slopes), 
𝑢
u (flow), foam 
𝐹
F, spray 
𝑆
S, bubbles 
𝐵
B, turbidity 
𝑇
T, thickness 
𝜏
τ, etc.

simulation tier: L0–L5 (see §9)

rendering terms: Fresnel, absorption, scattering, caustics, SSR, etc.

perf/LOD caps + fallbacks

Validation scenes (a reproducible test)

This format matches the project’s “AI-debuggable” goal: each phenomenon has a diagnostic and a rendering + simulation owner.

1) Water bodies and macro-environments (where the rules change)

1.1 Ocean (deep water)

swell + wind sea, long fetch spectra, deep-water dispersion, whitecaps, streak foam
1.2 Coastal / nearshore

bathymetry-driven refraction + shoaling, surf-zone breaking, rip currents, shoreline runup
1.3 Rivers / streams

open-channel flow, shear layers, standing waves, hydraulic jumps, bores, turbulence + aeration
1.4 Lakes / reservoirs

finite boundaries: seiches, reflected waves, wind set-up, calmer micro-roughness
1.5 Ponds / pools

walls/bottom strongly visible: caustics dominance, boundary reflections, shallow scattering
1.6 Waterfalls / spillways

thin sheets, breakup, mist plumes, plunge pools, high aeration
1.7 Wet ground / puddles / thin films

surface tension + contact angle, adhesion, rivulets, pooling, drying edges
1.8 Ice / slush / mixed phase (optional)

melting interface, brash ice damping, slush viscosity shift

2) Forcing, controls, and boundary conditions (what drives motion)

2.1 Wind forcing: stress, gusts, streaks, alignment to wind direction
2.2 Gravity + depth: dispersion changes with 
ℎ
h; shallow vs deep transitions
2.3 Bathymetry: refraction, shoaling, breaking likelihood
2.4 Boundaries: reflective/absorbing walls; beaches vs cliffs
2.5 Currents: advection of waves/foam; Doppler shift; shear instabilities
2.6 Objects: hulls/characters/projectiles: wakes, splashes, entrainment
2.7 External “director controls”: stylization knobs that preserve relationships (no category mistakes)

3) Surface wave taxonomy (the encyclopedia of “waves”)

3.1 Linear wave fundamentals

superposition, interference, standing waves, beats
3.2 Dispersion (core math)

gravity–capillary dispersion:

𝜔
2
=
(
𝑔
𝑘
+
𝜎
𝜌
𝑘
3
)
tanh
⁡
(
𝑘
ℎ
)
ω
2
=(gk+
ρ
σ
	​

k
3
)tanh(kh)

phase speed 
𝑐
=
𝜔
/
𝑘
c=ω/k, group speed 
𝑐
𝑔
=
𝑑
𝜔
/
𝑑
𝑘
c
g
	​

=dω/dk
3.3 Deep-water gravity waves

𝑘
ℎ
≫
1
kh≫1: 
𝜔
2
≈
𝑔
𝑘
ω
2
≈gk
3.4 Shallow-water waves

𝑘
ℎ
≪
1
kh≪1: 
𝑐
≈
𝑔
ℎ
c≈
gh
	​

 (less dispersive; shoreline behavior changes)
3.5 Capillary waves / ripples

surface tension dominated; sparkle + micro-roughness; quickly damped
3.6 Solitons / bores (shallow)

tidal bores, river bores
3.7 Internal waves (subsurface stratification)

surface might show subtle bands; important for “realism lore” but often faked
3.8 Ship wakes / Kelvin patterns

cusp angle + interference pattern; evolves with depth + speed
3.9 Seiches

basin resonances (lakes/pools)
3.10 Rogue / freak waves (rare)

interference focusing; cinematic toggle

4) Breaking, crests, and “water becomes a sheet” (your key cinematic moment)

This is where heightfields fail and the hybrid system activates. The project’s core visual truth is: a crest turns into a sheet, conforms to the wave, rides the wave—not “VFX pasted on.”

4.1 Shoaling + steepening
4.2 Breaking types (spilling / plunging / surging)
4.3 Curling lip + barrel air pocket (brief)
4.4 Sheet formation → ligament breakup → droplets (Weber number drives breakup)
4.5 Whitecaps (wind breaking)
4.6 Aftermath: foam advection/decay, ring waves, turbulence cues

5) Multiphase “secondarys” (foam, spray, bubbles, mist)

These are mandatory for “real water read.”

5.1 Foam (surface aeration)

generation triggers, advection, stretching, clumping, decay

representation: particles vs 2D foam density field
5.2 Spray / spindrift / mist

ballistic droplets + air drag; non-colliding cheap path
5.3 Bubbles (subsurface air)

entrainment, rise, pop → foam contribution
5.4 Turbidity / suspended sediment

“green/brown water,” visibility loss, forward scattering
5.5 Biological + debris (optional)

seaweed lines, flotsam streaking (helps scale)

6) Subsurface and near-surface flow phenomena (what you see through the water)

6.1 Refraction-driven distortion of bottom geometry
6.2 Underwater “veil”: absorption + scattering with distance
6.3 Caustics: focused light patterns on bottom/walls/objects
6.4 Volumetric shafts / god rays (participating media)
6.5 Boundary layers near bottom: sand ripples, resuspension (cinematic bonus)
6.6 Underwater wakes: bubbles + turbulence trails

7) Optics & lighting encyclopedia (above + below the surface)

This section must be unified across base water + breach/splash layers (shared cubemap, shared IOR, shared underwater tint), or it will look like two different “waters.”

7.1 Interface optics (air↔water)

Fresnel reflectance 
𝐹
(
𝜃
)
F(θ) (strong at grazing angles)

Snell refraction: 
𝑛
1
sin
⁡
𝜃
1
=
𝑛
2
sin
⁡
𝜃
2
n
1
	​

sinθ
1
	​

=n
2
	​

sinθ
2
	​


microfacet BRDF/BTDF approximations for real-time
7.2 Absorption (Beer–Lambert)

𝑇
(
𝜆
,
𝑑
)
=
exp
⁡
(
−
𝑎
(
𝜆
)
 
𝑑
)
T(λ,d)=exp(−a(λ)d)

7.3 Scattering (water + particulates)

phase functions (often Henyey–Greenstein), in-scattering haze
7.4 Caustics formation

from refracted sunlight via surface normals; in-engine: projected caustics texture (plus occlusion by thick splash volumes)
7.5 Sky + sun environment

sky radiance drives reflections; sun glints are key cues
7.6 Underwater camera model

color shift + contrast loss; “underwater line” transitions must match across layers
7.7 Lighting conditions (catalog)

noon sun, golden hour, overcast, storm, night/moon, artificial lights, bioluminescent stylization

8) Rendering representations (what geometry are we actually shading?)

8.1 Heightfield surface mesh (displacement)
8.2 Screen-space fluid surface (depth/thickness → normals)
8.3 Volume proxies (fog/mist)
8.4 Foam layers (decals/fields/particles)
8.5 Reflections: cubemap / SSR / planar (tiered)
8.6 Refractions: scene color + thickness + absorption
8.7 Compositing order: deterministic post-style composite is preferred to avoid “depth lies.”

9) Simulation ladder (how we decide “how real” per phenomenon)

This is the project’s crucial bridge from encyclopedia → code:

L0 Shading-only micro detail (wind shimmer normals)

L1 Kinematic waves (Gerstner/sum of sines)

L2 Spectral (FFT) waves (dispersion + plausible spectra)

L3 Heightfield PDE (SWE for wakes/shore/bulk flow)

L4 Event-driven volumetric detail (localized 3D: SPH/FLIP/MPM)

L5 Offline/film-grade (reference/ground-truth comparisons)

This ladder is already formalized in the docs; we’re extending it to every phenomenon and lighting term.

10) Hybrid coupling and “seam elimination” (the glue)

shared optical constants (IOR, absorption/scattering/tint)

shared environment (cubemap)

camera underwater test must match

breach layer adds thickness/transmittance but must not create a second water look

11) LOD, budgets, and “no-stall” constraints

Every expensive leaf node must declare:

activation conditions (distance, importance, triggers)

hard caps (events/sec, particles, passes)

fallbacks (foam-first proxies when budgets are exceeded)

no synchronous GPU readbacks in the hot loop (telemetry tiers)

This matches the engine’s performance-first contract and hybrid design intent.

12) Validation & canonical scenes (encyclopedia must be testable)

A minimal set (each becomes a “truth table” for visuals + perf):

calm lake + ripple rings + wall reflections

wind sea → whitecaps threshold + foam advection

shallow beach: refraction + shoaling + breaking type changes

river rapid: standing wave + aeration + mist

object entry: splash + bubble plume + ring waves

underwater camera crossing waterline + caustics on floor

cinematic breach: crest→sheet, coherent lighting match, no seam

Three “fully detailed” example entries (so you can see the level)
Example A — Gravity–Capillary Dispersion (core wave behavior)

Math: 
𝜔
2
=
(
𝑔
𝑘
+
𝜎
𝜌
𝑘
3
)
tanh
⁡
(
𝑘
ℎ
)
ω
2
=(gk+
ρ
σ
	​

k
3
)tanh(kh)

Cues: wave packets spread; in deep water, different wavelengths travel differently; in shallow water, speed becomes depth-driven and less dispersive

Looks wrong: “all wavelengths same speed” in deep-water gravity regime

Engine mapping:

L2 FFT owns deep-water dispersion; L3 SWE owns shallow/bathymetry transitions; L0 adds micro shimmer.

Validation: impulse ring test + depth ramp test (watch wavefront bend + compress near shore).

Example B — Foam / Spray / Bubbles (secondarys as indicators of violence)

Foam: spawned by breaking/turbulence; advected by surface flow; decays; render as particles or foam field

Spray: tiny droplets, often non-colliding; additive highlights; short lifetime

Bubbles: entrained air rises and pops; mostly visual in real-time

Engine mapping: foam field 
𝐹
(
𝑥
,
𝑧
)
F(x,z) + spray particles 
𝑆
S + bubble particles 
𝐵
B; coupling across layers is required so foam persists when detail sim turns off

Validation: plunging breaker scene → foam streaks advect + decay; underwater bubble plume rises and pops.

Example C — Underwater optics + breach blending (one water, two representations)

Rule: base water + breach layer must share: cubemap, IOR, underwater tint, tone mapping; otherwise it reads as two waters

Transmittance: thickness-based attenuation is a good bridge term for particle fluid rendering (depth/thickness RTs)

Caustics: simplest integration is occlusion of existing caustics by splash thickness (fast)

Validation: A/B toggle breach layer—base ocean must remain unchanged; breach should look like a continuation, not an overlay










1) What we’re changing (right now)

We’re freezing a canonical master index (ToC) for the entire water + lighting encyclopedia, aligned to the project’s existing Volumes I–VI / Part VII structure.

We’re defining a Phenomenon Card schema (every leaf node becomes an engine-spec “card”).

We’re populating the first batch of core cards (waves → breaking → foam/spray/bubbles → optics/underwater/caustics), because these directly drive the “perfect water” look and the hybrid ocean+splash system.

2) Why (physics → visuals → code, with drift prevention)

If the ToC isn’t rigid, we’ll drift into tuning symptoms instead of capturing the true causes (e.g., “ripples” accidentally treated as “main waves,” or “foam” as decoration rather than a violence indicator).

For the hybrid system specifically, the encyclopedia must encode the non-negotiable visual truth: crest → sheet, wave-conforming spawn, wave-inherited velocities, then (and only then) feedback/tuning.

3) Implementation steps (small, shippable increments)

Lock the ToC below as WATER_ENCYCLOPEDIA_MASTER_INDEX.md.

Add PHENOMENON_CARD_TEMPLATE.md (schema below).

Create CROSSWALK_MATRIX.md: phenomenon → required fields/textures → sim ladder L0–L5 → render features → LOD caps.

Fill cards in this priority order:

A) Surface waves + spectra + regimes

B) Breaking + genesis triggers (SF0/SF1 → ribbon/sheets)

C) Foam/spray/bubbles (lifecycles + rendering)

D) Optics: Fresnel/refraction/absorption/scattering/caustics/waterline

E) Rivers/shorelines (hydraulic jump, standing waves, shoaling)

Each card gets 1 validation scene + debug views (L0/L1 no readback; L2 throttled).

4) Master Index (the encyclopedia ToC)
Volume I — Vision, “North Star,” and controllability

Goals: realism and art direction without breaking physics relationships

Taxonomy rules: main waves ≠ ripples, foam ≠ albedo, spray ≠ smoke

The ladder: L0–L5 (what must be true at each)

Global unit system + symbol glossary (g, ρ, μ, σ, η, k, ω, h, U…)

Volume II — Splash & 3D detail fluids (MLS-MPM layer)

Sheet water (ribbons) vs droplets vs mist volumes

Genesis: wave-conforming position + wave-inherited velocity

Breakup: sheet → ligaments → droplets (Weber-driven)

Energy/accounting: what is allowed to feed back, when

Volume III — Hybrid ocean & wave systems (2.5D + localized 3D)

Base ocean representations: Gerstner / FFT / heightfield PDE

Coupling maps + textures: BAT, BFT, EBT, SF0/SF1

Seam elimination: shared optics + consistent underwater view

LOD/budget policy + “no stall” telemetry contract

Volume IV — Wave physics reference (the wave encyclopedia)

A. Fundamental regimes

Deep vs shallow: 
𝑘
ℎ
≫
1
kh≫1 vs 
𝑘
ℎ
≪
1
kh≪1

Gravity vs capillary (Bond number)

Dimensionless map: 
𝐹
𝑟
,
𝑅
𝑒
,
𝑊
𝑒
,
𝐵
𝑜
Fr,Re,We,Bo

B. Linear wave machinery (must be exact)

Dispersion (gravity-capillary):

𝜔
2
=
(
𝑔
𝑘
+
𝜎
𝜌
𝑘
3
)
tanh
⁡
(
𝑘
ℎ
)
ω
2
=(gk+
ρ
σ
	​

k
3
)tanh(kh)

Phase/group velocity, packets, interference

C. Catalog of waves

Wind sea, swell, seiches, tsunamis (as long waves), solitons/bores

Ship wakes (Kelvin pattern), standing waves, edge waves

Internal waves (optional realism layer)

D. Nonlinear + breaking

Steepening, crest sharpening, breaking types (spilling/plunging/surging)

Shoaling, refraction, diffraction, runup, surf zone

Volume V — Breach, spawn, and effects (foam/spray/bubbles)

“Violence detectors” (steepness/curvature/η̇ proxies) → triggers

Spawn Fields SF0/SF1 → ribbon parcel mapping

Foam lifecycle: generate → advect → stretch → decay

Spray lifecycle: emit → ballistic → light → fade

Bubbles: entrain → rise → pop → feed foam

Aftermath + ring waves (BFT), with strict gating

Volume VI — Rendering, lighting, underwater, and implementation specs

A. Interface optics

Fresnel reflectance, Snell refraction, total internal reflection

Microfacet surface for sun glints and sky streaks

B. Water color & visibility

Beer–Lambert absorption 
𝑇
(
𝜆
,
𝑑
)
=
𝑒
−
𝑎
(
𝜆
)
𝑑
T(λ,d)=e
−a(λ)d

Scattering/in-scattering, turbidity, underwater haze

C. Caustics

Surface-normal focusing, projection approximations, occlusion by thickness

D. Waterline & camera transitions

Above/below blend, “Snell’s window” look, consistent tone mapping

E. Feature LOD + budgets

Pass count caps, particle caps, screen-space RT tiers, fallback ordering

Part VII — Extreme-detail code reference

Per-feature exact data layouts, shader equations, pass graphs, debug views, perf traps (no synchronous readback).

5) Phenomenon Card Template (every leaf node uses this)

ID: (e.g. WAVE.DISPERSION.GRAV_CAP)
Domain: surface / subsurface / interface / air
Scales: 
𝐿
L (m), 
𝑇
T (s), typical ranges
Regime: key dimensionless numbers (Fr/Re/We/Bo)
Governing math: minimal equations + approximations
Observable cues: what the shot must show
Anti-cues: what looks fake
Engine fields needed: 
𝜂
,
∇
𝜂
,
𝜅
,
𝜂
˙
,
𝑢
,
𝐹
,
𝑆
,
𝐵
,
𝑇
,
𝜏
.
.
.
η,∇η,κ,
η
˙
	​

,u,F,S,B,T,τ...
Sim ladder: L0–L5 mapping
Rendering: reflection/refraction/absorption/scatter/caustics/foam shading
LOD/budgets: caps + fallbacks
Validation scene: reproducible test + camera moves
Debug views: what to visualize (no-stall tiers)

6) First batch of fully detailed cards (core “must nail” phenomena)
Card 1 — Gravity–Capillary Dispersion

ID: WAVE.DISPERSION.GRAV_CAP
Math: 
𝜔
2
=
(
𝑔
𝑘
+
𝜎
𝜌
𝑘
3
)
tanh
⁡
(
𝑘
ℎ
)
ω
2
=(gk+
ρ
σ
	​

k
3
)tanh(kh)
Cues: packets spread; short ripples move with different speed than long swell; shallow water becomes depth-driven
Anti-cues: all wavelengths travel identically in deep water
Engine mapping:

L2 FFT owns dispersion exactly for deep water

L3 heightfield PDE owns shallow transitions + boundaries

L0 adds micro-normal sparkle only (not energy)
Validation: impulse ring on (a) deep plane (b) depth ramp → watch refraction + speed change
Debug: visualize 
𝑘
k-bands energy, phase speed, group speed.

Card 2 — Capillary Ripples (micro-waves)

ID: WAVE.RIPPLES.CAPILLARY
Regime: small 
𝐿
L → surface tension matters (low 
𝐵
𝑜
Bo)
Cues: tight, fast, quickly damped; dominates glints/sparkle; aligns with wind near camera
Anti-cues: ripples changing the large swell height (category error)
Engine mapping:

L0 only: normal-map spectrum + anisotropy by wind

Optional L2: very high-k band in FFT affects normals only
Rendering: microfacet roughness modulated by ripple energy
LOD: near-only; fades to analytic roughness mid/far
Validation: low sun angle → sparkle streaks respond to wind direction.

Card 3 — Shallow-water Shoaling + Refraction

ID: WAVE.NEARSHORE.SHOAL_REFRACT
Math hooks: depth changes effective speed; rays bend toward slower region

(Conceptual) wave celerity decreases as 
ℎ
h decreases → wavelength shortens, height increases (until breaking)
Cues: wavefronts bend around sandbars; crests tighten near shore
Anti-cues: same wavelength everywhere; waves hit shore as perfect straight lines regardless of bathymetry
Engine mapping:

L3 heightfield PDE or ray-based directional spectrum advection

BAT channel should rise (steepness) as shoaling increases
Validation: diagonal swell over depth gradient → visible crest bending.

Card 4 — Breaking Genesis: crest → sheet

ID: BREAK.GENESIS.CREST_TO_SHEET
Regime: steepness high; nonlinear crest sharpening; local instability
Observable must-have: crest top becomes a thin sheet that conforms to the wave and rides it (not a detached VFX burst)
Trigger signals (GPU-friendly):

steepness proxy 
𝑠
=
∣
∇
𝜂
∣
s=∣∇η∣

curvature proxy 
𝜅
κ (screen-space or heightfield curvature)

vertical motion proxy 
𝜂
˙
η
˙
	​


Engine mapping:

BAT encodes steepness/curvature/η̇ proxies

SF0/SF1 encodes spawn parcels for ribbons (position + orientation + thickness + initial velocity)

L4 MLS-MPM runs only near active events
LOD: if L4 budget exceeded → foam-first fallback, then spray-only
Validation: traveling crest shot, side angle + top angle, slow-mo toggle: sheet must remain glued to crest motion.

Card 5 — Whitecaps (wind breaking)

ID: FOAM.WHITE_CAPS.WIND
Cues: patchy bright foam on crest tips; increases with wind speed and fetch; advects with surface flow and stretches
Anti-cues: uniform foam layer; foam ignoring wind direction/current
Engine mapping:

generate foam density 
𝐹
F from steepness threshold + persistence

advect 
𝐹
F by surface velocity field
Rendering: foam is high albedo but still Fresnel-affected; shadowing in foam clumps
Validation: wind ramps up → foam coverage increases smoothly; gusts create streaks.

Card 6 — Foam lifecycle (generate → advect → decay)

ID: FOAM.LIFECYCLE.SURFACE
Core model (minimal):

Generation term 
𝐺
(
steepness
,
𝜅
,
𝜂
˙
)
G(steepness,κ,
η
˙
	​

)

Advection: 
∂
𝑡
𝐹
+
𝑢
⋅
∇
𝐹
=
𝐺
−
𝐷
(
𝐹
)
∂
t
	​

F+u⋅∇F=G−D(F)

Decay 
𝐷
D: exponential + stretch-based thinning
Cues: foam trails behind breakers; streaks elongate; fades unevenly
Anti-cues: foam glued to world-space; foam fades uniformly like opacity
LOD: far field becomes cheaper “whitecap coverage” scalar.

Card 7 — Spray (ballistic droplets + mist)

ID: SPRAY.BALLISTIC.DROPLETS
Regime: droplets decouple from water; air drag dominates quickly
Minimal motion:

𝑥
˙
=
𝑣
x
˙
=v

𝑣
˙
=
𝑔
−
𝑐
𝑑
∣
𝑣
−
𝑣
𝑎
𝑖
𝑟
∣
(
𝑣
−
𝑣
𝑎
𝑖
𝑟
)
v
˙
=g−c
d
	​

∣v−v
air
	​

∣(v−v
air
	​

) (cheap drag)
Cues: sparkly arcs catching sun; wind bends spray downwind; fades with distance
Anti-cues: spray moving like smoke without gravity; or perfectly rigid arcs
LOD: near-only; mid becomes billboard mist; far becomes nothing.

Card 8 — Bubbles & subsurface aeration plume

ID: BUBBLES.PLUME.ENTRAINMENT
Cues: underwater whiteness near impact, rising bubble columns, pop at surface feeding foam
Anti-cues: bubbles that don’t rise; foam that appears without any violence source
Engine mapping:

spawn bubble particles from impact/breaking events

rise velocity + noise; pop at surface adds to foam 
𝐹
F
Validation: object entry → bubble plume visible underwater; surface foam appears where bubbles pop.

Card 9 — Beer–Lambert absorption (water color with depth)

ID: OPTICS.ABSORPTION.BEER_LAMBERT
Math: 
𝑇
(
𝜆
,
𝑑
)
=
𝑒
−
𝑎
(
𝜆
)
𝑑
T(λ,d)=e
−a(λ)d

Cues: red dies first; scene shifts blue/green with distance; shallow pools look clearer
Anti-cues: constant tint regardless of distance; underwater looks like fogged glass only
Engine mapping: thickness 
𝜏
τ from depth buffer / screen-space fluid thickness RT
Validation: underwater camera moves away from object → color/contrast shift smoothly with distance.

Card 10 — Fresnel reflection + refraction at interface

ID: OPTICS.INTERFACE.FRESNEL_SNELL
Must-have cues: grazing angles are mirror-like; looking down is more transmissive; reflections brighten at horizon
Anti-cues: same reflectivity at all angles
Engine mapping:

Fresnel term drives blend between reflection and refraction

consistent IOR across base ocean + splash layer (no “two waters”)
Validation: orbit camera low to water → reflection ramps naturally as angle approaches grazing.

Card 11 — Caustics (focused light patterns)

ID: OPTICS.CAUSTICS.PROJECTION
Cues: moving bright networks on bottom/walls; speed matches surface wave motion; occluded by objects
Anti-cues: static caustic texture; caustics moving unrelated to waves
Engine mapping:

projected caustics driven by surface normals (or precomputed animated field)

splash thickness can attenuate/occlude caustics near impacts
Validation: shallow pool, sun overhead, wave motion → caustic pattern speed/scale matches waves.

Card 12 — Waterline transition + “Snell’s window” feel

ID: CAMERA.WATERLINE.TRANSITION
Cues: above/below blend is sharp but not jagged; underwater view has compressed “window” to sky; reflections behave differently above vs below
Anti-cues: hard clip line with mismatched color/exposure; splash layer ignores underwater tint
Engine mapping: unified underwater fog/absorption; shared exposure curve; waterline mask stable with waves
Validation: camera slowly crosses surface near a breaking event: no seam, no double-water look.

6) Validation checklist (we run every time we add cards)
Visual sweeps

Distance tiers: near/mid/far

Angles: top-down, grazing, underwater, waterline

Motion: calm → windy → breaking; slow-mo toggle for crest→sheet

Perf + no-stall

Pass count audit (don’t “silently” add passes)

Particle caps enforced (spray/bubbles/foam)

No synchronous GPU readback in frame loop (L2 micro-readback only if explicitly throttled)

Regression safety

Feature toggles per card

Presets: lake / river / ocean / storm / pool

7) Telemetry / debug views we add immediately

Heightfield: 
𝜂
η, 
𝜂
˙
η
˙
	​

, slope magnitude 
∣
∇
𝜂
∣
∣∇η∣, curvature proxy 
𝜅
κ

BAT: steepness/curvature/η̇ channels (trigger sanity)

SF0/SF1: spawn parcel visualizer (arrows for inherited velocity)

Foam density 
𝐹
F + velocity advection arrows

Thickness 
𝜏
τ + transmittance 
𝑇
T (underwater correctness)












1) What we’re changing (this step)

We’re fully expanding Volume IV (Wave Physics Reference) into a complete wave catalog + regime map + engine crosswalk (L0–L5).

We’re fully expanding Volume VI (Rendering/Lighting/Underwater) into a complete optics + lighting condition catalog, again with an engine crosswalk.

We’re adding the data schema + code skeleton so this encyclopedia is directly codable (not just descriptive).

2) Why

A “perfect water engine” needs a single ontology that prevents category mistakes (ripples ≠ swell; foam ≠ albedo; spray ≠ smoke), while mapping every phenomenon to: fields → sims → shaders → LOD → tests.

The hybrid goal depends on correctness in this order: genesis visuals (crest→sheet) first, then coupling/feedback tuning.

Volume IV — Wave Physics Reference (Expanded Master Catalog)
IV.0 Symbols, units, and engine fields

Core physical constants

𝑔
g gravity 
≈
9.81
 
m
/
s
2
≈9.81m/s
2

𝜌
ρ density (water 
∼
1000
 
k
g
/
m
3
∼1000kg/m
3
)

𝜇
μ dynamic viscosity

𝜈
=
𝜇
/
𝜌
ν=μ/ρ kinematic viscosity

𝜎
σ surface tension

Wave variables

𝜂
(
𝑥
,
𝑧
,
𝑡
)
η(x,z,t) surface elevation (heightfield)

ℎ
(
𝑥
,
𝑧
)
h(x,z) water depth (bathymetry)

𝑘
=
2
𝜋
/
𝜆
k=2π/λ wavenumber

𝜔
=
2
𝜋
𝑓
ω=2πf angular frequency

𝑐
=
𝜔
/
𝑘
c=ω/k phase speed

𝑐
𝑔
=
𝑑
𝜔
/
𝑑
𝑘
c
g
	​

=dω/dk group speed

∇
𝜂
∇η slopes, 
𝜅
κ curvature proxy

Engine “must-have” fields

Height: 
𝜂
η

Slopes: 
∂
𝑥
𝜂
,
∂
𝑧
𝜂
∂
x
	​

η,∂
z
	​

η

Optional curvature proxy: 
𝜅
≈
∇
2
𝜂
κ≈∇
2
η or screen-space curvature

Surface velocity (at least near-surface): 
𝑢
u (or an approximation)

Secondary fields: foam 
𝐹
F, spray 
𝑆
S, bubbles 
𝐵
B, turbidity 
𝑇
T, thickness 
𝜏
τ

IV.1 Regime map (how to classify any wave you see)

Use these to decide which “chapter” a wave belongs to and which sim ladder tier is appropriate.

Depth regime

Deep water: 
𝑘
ℎ
≫
1
kh≫1

Shallow water: 
𝑘
ℎ
≪
1
kh≪1

Intermediate: 
𝑘
ℎ
≈
1
kh≈1

Restoring force

Gravity waves: gravity dominates (longer 
𝜆
λ)

Capillary waves: surface tension dominates (short 
𝜆
λ)

Linearity / steepness

Steepness 
𝑠
∼
𝑘
𝐴
s∼kA (A = amplitude)

Linear: 
𝑘
𝐴
≪
1
kA≪1

Nonlinear: 
𝑘
𝐴
≳
0.1
kA≳0.1 (crest sharpening, skewness)

Breaking-prone: larger steepness + nearshore shoaling

Dimensionless numbers

Froude 
𝐹
𝑟
=
𝑈
/
𝑔
𝐿
Fr=U/
gL
	​

 (critical for rivers, bores, wakes)

Reynolds 
𝑅
𝑒
=
𝜌
𝑈
𝐿
/
𝜇
Re=ρUL/μ (turbulence, boundary layers)

Weber 
𝑊
𝑒
=
𝜌
𝑈
2
𝐿
/
𝜎
We=ρU
2
L/σ (sheet/ligament breakup → spray)

Bond 
𝐵
𝑜
=
𝜌
𝑔
𝐿
2
/
𝜎
Bo=ρgL
2
/σ (gravity vs surface tension)

Engine mapping rule of thumb

Main waves (swell/wind sea) live in L1–L3 (geometry + motion).

Ripples/micro-roughness live in L0 (normals/BRDF only).

Breaking + sheet water triggers L4 (localized 3D detail).

IV.2 Dispersion (the backbone equation)
Gravity–capillary dispersion (finite depth)
𝜔
2
=
(
𝑔
𝑘
+
𝜎
𝜌
𝑘
3
)
tanh
⁡
(
𝑘
ℎ
)
ω
2
=(gk+
ρ
σ
	​

k
3
)tanh(kh)

Deep-water limit (
𝑘
ℎ
≫
1
kh≫1): 
𝜔
2
≈
𝑔
𝑘
+
𝜎
𝜌
𝑘
3
ω
2
≈gk+
ρ
σ
	​

k
3

Shallow-water limit (
𝑘
ℎ
≪
1
kh≪1): 
𝜔
2
≈
(
𝑔
ℎ
)
𝑘
2
ω
2
≈(gh)k
2
 for gravity-dominated waves

Group velocity

𝑐
𝑔
=
𝑑
𝜔
𝑑
𝑘
c
g
	​

=
dk
dω
	​


Why you care visually

Packets spread (dispersion).

Nearshore (shallow) waves become “less dispersive,” feel more locked together.

Engine crosswalk

L2 FFT: implements dispersion exactly (deep/intermediate).

L3 SWE/heightfield PDE: handles shallow + boundaries + bores.

L0: ripples only affect shading.

IV.3 Wave families (catalog)
A) Wind sea & swell (open ocean)

A1. Wind-generated gravity waves (wind sea)

Cues: choppy, broad directional spread, whitecaps at higher wind

Engine: L2 spectrum + L0 micro normals + foam triggers from steepness

A2. Swell (long-period, organized)

Cues: smooth, long crests, narrow directional spread

Engine: L2 spectrum with narrow spreading, or L1 multi-Gerstner with physical dispersion

A3. Mixed sea state

Cues: long swell under short chop; interference beating patterns

Engine: multi-band spectrum (separate “swell band” + “chop band”), keep ripple band shading-only

A4. Gusts / wind streaks

Cues: darker/bright streak bands aligned with wind; foam patches

Engine: modulate micro-roughness + directional spread locally; optional foam coverage modulation

B) Capillary ripples (micro-waves)

B1. Capillary ripples

Cues: tight sparkles, fast tiny waves, quickly damped

Engine: L0 only (normal spectrum) or “high-k normal-only band” in FFT

Anti-cue: ripples changing large swell amplitude (category error)

B2. Cat’s paws (localized ripple patches)

Cues: transient patches of micro-roughness moving with gusts

Engine: procedural roughness patches advected by wind field

C) Interference, reflection, standing waves (boundaries)

C1. Standing waves

Cues: fixed nodes/antinodes (pools, harbors)

Engine: superposition with reflective boundary conditions or explicit standing modes

C2. Reflection from cliffs/walls

Cues: crossing wave sets; “criss-cross” patterns near walls

Engine: boundary reflection in L3, or “reflected spectral copy” in L2 for simple cases

C3. Diffraction (around obstacles)

Cues: wavefront bending through gaps

Engine: best in L3 PDE; cheap hack: directional spectrum “blur” around occluders (LOD)

D) Nearshore transformations (shoaling/refraction/runup)

D1. Refraction (depth-driven bending)

Cue: crests bend to align with shoreline / sandbars

Engine: L3 PDE or ray-based directional advection of spectral energy

D2. Shoaling (height increase + wavelength decrease)

Cue: waves steepen as they approach shore

Engine: increase steepness proxies as depth decreases; drive breaking likelihood

D3. Surf zone components

spilling breakers: foamy tops, gradual

plunging breakers: curling lip + impact, strong spray

surging breakers: steep beach, wave surges up without classic curl

Engine: different spawn profiles for sheets/spray + foam persistence

D4. Runup/backwash

Cue: thin sheet climbing beach then retreating

Engine: L3 shallow-water sheet flow (or stylized wetness + thin film shader for LOD)

E) Rivers, rapids, and open-channel waves (Froude-driven)

E1. Subcritical flow (Fr < 1)

Cue: disturbances can travel upstream; gentler surface

Engine: L3 SWE with upstream influence

E2. Supercritical flow (Fr > 1)

Cue: disturbances swept downstream; aggressive rapids

Engine: L3 SWE; strong foam/aeration cues

E3. Hydraulic jump

Cue: abrupt rise + turbulence + lots of bubbles/foam

Engine: L3 shock-like feature + heavy foam/bubble spawn; mist volume optional

E4. Standing waves in rapids

Cue: stationary “river waves” anchored to bottom features

Engine: L3 with bed forcing; foam locked to turbulent zones but advected locally

F) Bores, solitons, and long waves (shallow-water)

F1. Tidal bore / river bore

Cue: moving wall-like front, long wavelength

Engine: L3 SWE (nonlinear + possible shock capturing approximation)

F2. Solitons

Cue: stable traveling hump

Engine: L3; can be authored as a coherent traveling mode

F3. Tsunami-like long waves (cinematic)

Cue: huge wavelength, shallow-water behavior dominates near coast

Engine: L3; careful scaling (visual plausibility > literal)

G) Basin resonances (lakes/pools)

G1. Seiche

Cue: slow sloshing modes; “tilting” surface in enclosed water

Engine: low-mode oscillator + boundary reflection; perfect for pools/tanks

G2. Wake slosh in tanks

Cue: reflected wakes forming complex standing patterns

Engine: reflection + damping; L3 preferred for accuracy

H) Wakes (boats, characters, projectiles)

H1. Kelvin ship wake (deep water)

Cue: V-shaped wake with characteristic interference (divergent + transverse)

Engine: L3 for true interaction; L1/L2 procedural wake stamps for cheaper

H2. Planing hull spray + rooster tail

Cue: strong sheet breakup + spray

Engine: L4 localized sheet/spray; foam trails advect behind hull

H3. Character wading wakes

Cue: bow waves at legs, small breaking, bubbles in turbulent zones

Engine: L3 disturbance injection + foam/bubbles, L4 only for hero shots

IV.4 Nonlinear wave shapes (what makes crests look “real”)

Skewness & crest sharpening

Real waves have sharper crests and flatter troughs vs perfect sine waves.

Engine options:

L1: Gerstner/trochoidal waves (crest sharpening)

L2: apply nonlinear “chop” mapping in shader (horizontal displacement)

L3: PDE naturally produces nonlinear steepening (depending on model)

Breaking threshold (practical engine proxies)

Use triggers based on:

slope magnitude 
∣
∇
𝜂
∣
∣∇η∣

curvature proxy 
𝜅
κ

vertical velocity proxy 
𝜂
˙
η
˙
	​


depth factor (nearshore)

Output: spawn fields for sheets/foam/spray (genesis)

IV.5 Wave spectra (for L2 FFT)

Directional spectrum 
𝑆
(
𝑘
,
𝜃
)
S(k,θ) conceptually:

magnitude distribution over wavenumber 
𝑘
k

directional spreading around wind direction

Key engine controls

wind speed, fetch, age (wind sea vs swell)

directional spread width

multi-band blending (swell + chop + ripple)

Hard rule

Ripple band affects normals/roughness only, not main displacement energy.

Volume VI — Rendering, Optics, Underwater, Lighting (Expanded)
VI.0 What the camera actually sees (layer model)

A pixel observing water is typically:

Specular reflection of sky/environment

Refracted view into water (scene color behind surface)

Volume attenuation (absorption + scattering) along the refracted path

Interface phenomena: foam, bubbles, spray occluding/adding light

Caustics lighting on submerged surfaces (and sometimes in-water shafts)

VI.1 Interface optics (air↔water)

Snell

𝑛
1
sin
⁡
𝜃
1
=
𝑛
2
sin
⁡
𝜃
2
n
1
	​

sinθ
1
	​

=n
2
	​

sinθ
2
	​


Fresnel (Schlick approximation)

𝐹
(
𝜃
)
=
𝐹
0
+
(
1
−
𝐹
0
)
(
1
−
cos
⁡
𝜃
)
5
F(θ)=F
0
	​

+(1−F
0
	​

)(1−cosθ)
5

Cue: grazing angles become mirror-like; straight-down looks more transmissive.

Anti-cue: constant reflectivity.

Microfacet surface

Use roughness driven by:

ripple energy (L0)

wind speed

foam coverage (foam changes the lobe)

VI.2 Refraction distortion (what makes underwater “wobble”)

Screen-space refract

offset screen UV by normal components (scaled by IOR + view angle + thickness)

must be consistent across base ocean + splash layers (no “two waters”)

Validation cue

pool floor lines bend smoothly with wave motion; distortion amplitude matches wave steepness.

VI.3 Absorption (water color with distance)

Beer–Lambert

𝑇
(
𝜆
,
𝑑
)
=
𝑒
−
𝑎
(
𝜆
)
𝑑
T(λ,d)=e
−a(λ)d

Use per-channel absorption 
𝑎
𝑅
,
𝑎
𝐺
,
𝑎
𝐵
a
R
	​

,a
G
	​

,a
B
	​

.

Cue: reds vanish first; distance adds blue/green bias; shallow looks clearer.

Anti-cue: fixed tint regardless of distance.

Engine mapping

Need thickness/path length 
𝑑
d (from depth buffer or thickness RT for screen-space fluid).

VI.4 Scattering & turbidity (underwater haze)

In-scattering

adds “veil” and reduces contrast with distance

increases with turbidity 
𝑇
T

Phase function (Henyey–Greenstein, common approximation)

𝑃
(
cos
⁡
𝜃
)
=
1
−
𝑔
2
4
𝜋
(
1
+
𝑔
2
−
2
𝑔
cos
⁡
𝜃
)
3
/
2
P(cosθ)=
4π(1+g
2
−2gcosθ)
3/2
1−g
2
	​


𝑔
>
0
g>0: forward scattering (murky water “glow” toward light)

Cue: god rays, bright haze near sun direction underwater.

VI.5 Caustics (light focusing by waves)

Cues

moving bright networks on bottom; speed/scale match surface normals

strongest in shallow clear water with strong directional light (sun)

Engine approximations

projected animated caustics driven by surface normal field (cheap)

occlude/attenuate caustics where splash thickness or foam coverage is high

VI.6 Foam shading (not just white paint)

Foam is a micro-bubble layer:

higher diffuse reflectance

different specular behavior than clear water

self-occlusion/clumping is key

Cues

foam clumps cast subtle occlusion; streaks stretch; edges feather irregularly
Anti-cue

uniform white overlay with constant opacity.

VI.7 Spray & mist lighting

Spray is a participating medium + sparkly droplets:

near: droplets can sparkle (specular)

mid: billboards/volumetric-ish haze

far: often invisible except in backlight

Cues

backlit spray glows; wind bends plumes.

VI.8 Lighting condition catalog (parameter sets you can dial)

Each condition defines:

sun/moon elevation + intensity

sky environment (clear/overcast/storm)

wind state (affects roughness + whitecaps)

underwater turbidity + absorption

optional: fog/haze in air (changes horizon reflections)

A) Clear noon

strong sun glints, high contrast caustics in shallow water

reflections crisp at grazing angles

B) Golden hour

warm highlights; long spec streaks; underwater shifts greener/teal with warm surface reflections

C) Overcast

soft reflections; reduced glints; water reads more by shape than sparkle

foam still bright but less “flashy”

D) Storm / squall

high wind roughness; whitecap coverage high; spray/mist dominates horizon

reflections become noisy; foam persistence longer

E) Night (moon)

low-intensity spec; silhouettes; foam can “pop” if exposure lifts

underwater: mostly dark except artificial lights

F) Artificial lights (harbor, pool lights)

strong local specular highlights; visible volumetric cones underwater if turbidity present

caustics can be strong and colored

G) Underwater hero shot (clear tropical)

low turbidity; sharp caustics; strong Snell’s-window look near surface

H) Underwater murky river/lake

high turbidity; fast contrast loss; shafts visible but soft; surface seen only as bright patch

4) Code (TS + GLSL) — encyclopedia → engine crosswalk
src/water/encyclopedia/types.ts
export type SimTier = "L0" | "L1" | "L2" | "L3" | "L4" | "L5";

export type Domain = "surface" | "subsurface" | "interface" | "air";

export interface PhenomenonCard {
  id: string;
  name: string;
  domain: Domain;
  scales: { L_m: [number, number]; T_s: [number, number] };
  regime: {
    depth?: "deep" | "intermediate" | "shallow";
    dimensionless?: Partial<{ Fr: string; Re: string; We: string; Bo: string }>;
    linearity?: "linear" | "nonlinear" | "breaking-prone";
  };
  governingMath: string[];        // keep as LaTeX strings
  cues: string[];
  antiCues: string[];
  engineFields: string[];         // ["eta","gradEta","kappa","etaDot","u","F","S","B","T","tau"]
  simTiers: SimTier[];
  renderingNotes: string[];
  lodBudgets: string[];
  validationScene: string[];
  debugViews: string[];
}

src/water/waves/dispersion.ts
// Gravity–capillary dispersion with finite depth.
// omega^2 = (gk + (sigma/rho) k^3) tanh(kh)
export function omegaOfK(k: number, h: number, g = 9.81, sigma = 0.074, rho = 1000): number {
  const kh = k * h;
  const tanh = Math.tanh(kh);
  const term = g * k + (sigma / rho) * k * k * k;
  return Math.sqrt(Math.max(0, term * tanh));
}

// Numerical group velocity cg = dω/dk (finite difference, cheap and stable for engine use)
export function groupVelocity(k: number, h: number): number {
  const eps = Math.max(1e-6, k * 1e-4);
  const w1 = omegaOfK(k - eps, h);
  const w2 = omegaOfK(k + eps, h);
  return (w2 - w1) / (2 * eps);
}

src/water/render/shaderChunks/waterOptics.glsl
float fresnelSchlick(float cosTheta, float F0) {
  float m = clamp(1.0 - cosTheta, 0.0, 1.0);
  float m2 = m*m; float m5 = m2*m2*m;
  return F0 + (1.0 - F0) * m5;
}

vec3 beerLambert(vec3 absorptionRGB, float distanceMeters) {
  return exp(-absorptionRGB * max(distanceMeters, 0.0));
}

// Henyey–Greenstein phase (scalar form)
float phaseHG(float cosTheta, float g) {
  float g2 = g*g;
  float denom = pow(max(1.0 + g2 - 2.0*g*cosTheta, 1e-4), 1.5);
  return (1.0 - g2) / (4.0 * 3.14159265 * denom);
}

5) Validation checklist (Wave + Optics)
Visual sweeps

Ocean: swell + chop + ripple sparkle (grazing camera)

Nearshore depth ramp: refraction bending + shoaling + break type shift

River rapid: standing waves + hydraulic jump foam/bubbles

Wakes: Kelvin pattern + foam trail

Underwater: pool floor distortion + Beer–Lambert depth tint + caustics motion

Waterline crossing: no seam; consistent tint and exposure

Perf/no-stall

L0 ripple band never adds displacement passes

L2 FFT pass count stays fixed across presets

L4 only runs when active events exist; hard caps enforced

No synchronous GPU readbacks in-frame

6) Telemetry/debug views added now

Wave debug: 
𝜂
η, 
∣
∇
𝜂
∣
∣∇η∣, curvature proxy 
𝜅
κ, spectral band energy (swell/chop/ripple)

Breaking debug: steepness trigger mask, spawn field vectors (inherited velocity)

Optics debug: Fresnel term, thickness 
𝜏
τ, transmittance 
𝑇
T, caustics intensity, turbidity veil










1) What we’re changing (this step)

We’re locking a leaf-by-leaf Wave Catalog as Phenomenon Card IDs (engine-ready, serializable).

We’re locking a Lighting + Optics Preset Library with exact shader knobs and LOD rules.

We’re adding the crosswalk glue: which phenomena require which fields/textures (η/η̇/normal, SF0/SF1, BFT/EBT) and which sim tier (L0–L5).

2) Why

This prevents category drift (ripples never “become” swell; foam never becomes “just white albedo”).

It also preserves the non-negotiable hybrid rule: genesis first (crest→sheet via SF0/SF1 + wave-inherited motion), feedback later (BFT tuning only after visuals are correct).

3) Implementation steps

Create WAVE_CATALOG.md (the ID tree below).

Create LIGHTING_PRESETS.md (the preset library below).

Implement cards/waves.ts + presets/lightingPresets.ts (code below).

Add one canonical validation scene per major branch (IDs included).

Add GPU-visual debug views (no stalls) for: band energy, steepness/curvature, SF0/SF1 decode, Fresnel/transmittance/caustics.

4) Leaf-by-leaf Wave Catalog (Phenomenon Card IDs)
WAVE.FOUNDATION — rules all waves use

WAVE.FOUNDATION.SYMBOLS_UNITS

Cues: all distances in meters, time in seconds, gravity consistent

Engine fields: unit scalars only

Validation: SCENE.UNITS.METER_CHECK

WAVE.FOUNDATION.DISPERSION.GRAVITY_CAPILLARY

Math: 
𝜔
2
=
(
𝑔
𝑘
+
𝜎
𝜌
𝑘
3
)
tanh
⁡
(
𝑘
ℎ
)
ω
2
=(gk+
ρ
σ
	​

k
3
)tanh(kh)

Sim: L2 (FFT exact), L3 (PDE shallow)

Validation: SCENE.WAVES.IMPULSE_RING.DEPTH_RAMP

WAVE.FOUNDATION.PHASE_GROUP_VELOCITY

Math: 
𝑐
=
𝜔
/
𝑘
,
  
𝑐
𝑔
=
𝑑
𝜔
/
𝑑
𝑘
c=ω/k,c
g
	​

=dω/dk

Cues: packet drift differs from crest speed

Validation: SCENE.WAVES.PACKET.DRIFT

WAVE.FOUNDATION.DIRECTIONAL_SPECTRUM

Concept: 
𝑆
(
𝑘
,
𝜃
)
S(k,θ) multi-band swell/chop/ripple separation

Hard rule: ripple band affects normals/roughness only

Validation: SCENE.OCEAN.CROSS_SEA

WAVE.SURFACE.GRAVITY — main ocean/lake waves
Deep water (kh ≫ 1)

WAVE.SURFACE.GRAVITY.DEEP.SWELL

Cues: long crests, organized direction, smooth curvature

Sim: L2 (primary), L1 (fallback)

Fields: η, ∇η, optional u

Validation: SCENE.OCEAN.SWELL.LOW_WIND

WAVE.SURFACE.GRAVITY.DEEP.WIND_SEA

Cues: choppy, broader direction spread, more crest noise

Sim: L2 + L0 micro-roughness

Validation: SCENE.OCEAN.WINDSEA.GUSTS

WAVE.SURFACE.GRAVITY.DEEP.CROSS_SEA

Cues: two directional sets interfere → diamond/egg patterns

Sim: L2 multi-peaked directional spectrum

Validation: SCENE.OCEAN.CROSS_SEA

WAVE.SURFACE.GRAVITY.DEEP.ROGUE_FOCUSING

Cues: occasional extreme crest from interference focusing

Sim: L2 authored event / rare boost (cinematic)

Validation: SCENE.OCEAN.ROGUE.CINEMATIC

Intermediate depth (kh ~ 1)

WAVE.SURFACE.GRAVITY.INTERMEDIATE.DISPERSION_SHIFT

Cues: phase/group speeds shift with depth; packets feel different

Sim: L2 with depth modulation, or L3 local

Validation: SCENE.WAVES.DEPTH_GRADIENT

Shallow water (kh ≪ 1)

WAVE.SURFACE.GRAVITY.SHALLOW.LONG_WAVE

Math: 
𝑐
≈
𝑔
ℎ
c≈
gh
	​


Cues: less dispersion, fronts move “together”

Sim: L3 preferred

Validation: SCENE.NEARSHORE.LONG_WAVE

WAVE.SURFACE.GRAVITY.SHALLOW.NONLINEAR_STEEPNING

Cues: crest sharpens, trough flattens, breaking likelihood rises

Sim: L3 + breaking triggers

Validation: SCENE.NEARSHORE.STEEPNING_TO_BREAK

WAVE.SURFACE.CAPILLARY — ripples (never main displacement energy)

WAVE.SURFACE.CAPILLARY.RIPPLES

Cues: sparkle/glints, fast tiny waves, quick damping

Sim: L0 only (normals/BRDF)

Validation: SCENE.LAKE.CALM.SUN_GLITTER

WAVE.SURFACE.CAPILLARY.CATS_PAWS

Cues: gust patches of micro-roughness moving over calm water

Sim: L0 procedural roughness patches, wind-advection

Validation: SCENE.LAKE.GUST_PATCHES

WAVE.BOUNDARY — reflections, standing waves, diffraction

WAVE.BOUNDARY.REFLECTION.CLIFF

Cues: reflected set crosses incoming set near wall

Sim: L3 boundary, or L2 mirrored spectrum (cheap)

Validation: SCENE.COAST.CLIFF_REFLECTION

WAVE.BOUNDARY.STANDING.MODE_01 / MODE_02 / MODE_03

Cues: nodes/antinodes fixed in space (pools/harbors)

Sim: low-mode oscillator (L1/L3)

Validation: SCENE.POOL.SLOSH.MODES

WAVE.BOUNDARY.DIFFRACTION.GAP

Cues: wavefront bends through opening

Sim: L3 (best) / spectrum blur (LOD)

Validation: SCENE.HARBOR.DIFFRACTION

WAVE.NEARSHORE — shoaling, refraction, runup, surf zone

WAVE.NEARSHORE.REFRACTION.BATHYMETRY

Cues: crest lines bend around sandbars

Sim: L3, or ray-advected directional energy

Validation: SCENE.NEARSHORE.SANDBAR_BEND

WAVE.NEARSHORE.SHOALING.AMPLIFY

Cues: wavelength shortens, height grows pre-break

Sim: L3 + steepness proxy boost

Validation: SCENE.NEARSHORE.SHOALING_RAMP

WAVE.NEARSHORE.BREAKING.SPILLING

Cues: foamy crest, gradual; less dramatic sheet

Sim: L3 triggers → L4 foam-first

Validation: SCENE.SURF.SPILLING_LINEUP

WAVE.NEARSHORE.BREAKING.PLUNGING

Cues: curling lip, strong spray, violent foam/bubbles

Sim: triggers → L4 sheet ribbons + spray

Validation: SCENE.SURF.PLUNGING_BARREL

WAVE.NEARSHORE.BREAKING.SURGING

Cues: steep beach, surge up face, less classic curl

Sim: L3 runup + foam

Validation: SCENE.SURF.SURGING_STEEP_BEACH

WAVE.NEARSHORE.RUNUP_BACKWASH.THIN_SHEET

Cues: thin film climbs then retreats; wetness edge

Sim: L3 thin sheet, or wetness shader (LOD)

Validation: SCENE.BEACH.RUNUP_FILM

WAVE.NEARSHORE.EDGE_WAVES

Cues: waves trapped along shoreline (subtle bands)

Sim: authored (cinematic) / L3 optional

Validation: SCENE.BEACH.EDGEWAVE_BANDS

WAVE.RIVER — open-channel phenomena (Fr-driven)

WAVE.RIVER.SUBCRITICAL.GENTLE

Regime: 
𝐹
𝑟
<
1
Fr<1

Cues: smoother surface; upstream influence possible

Sim: L3 SWE

Validation: SCENE.RIVER.SUBCRITICAL_BRIDGE

WAVE.RIVER.SUPERCRITICAL.RAPIDS

Regime: 
𝐹
𝑟
>
1
Fr>1

Cues: aggressive standing features; foam/aeration

Sim: L3 + foam/bubbles

Validation: SCENE.RIVER.RAPIDS_RUN

WAVE.RIVER.HYDRAULIC_JUMP

Cues: abrupt rise + heavy turbulence + bubbles + mist

Sim: L3 shock-like + L4 mist proxy

Validation: SCENE.RIVER.HYDRAULIC_JUMP_GATE

WAVE.RIVER.STANDING_WAVE.ANCHORED

Cues: stationary wave train pinned to boulder/ledge

Sim: L3 bed forcing, foam locked to turbulent zones

Validation: SCENE.RIVER.STANDING_WAVES_BOULDER

WAVE.BORE_SOLITON — long nonlinear shallow features

WAVE.BORE.TIDAL

Cues: traveling wall/front (river mouth)

Sim: L3 nonlinear SWE

Validation: SCENE.ESTUARY.TIDAL_BORE

WAVE.SOLITON.SINGLE_HUMP

Cues: stable traveling bump

Sim: L3 or authored mode

Validation: SCENE.CANAL.SOLITON

WAVE.WAKE — wakes from moving bodies

WAVE.WAKE.KELVIN.DEEP_DISPLACEMENT

Cues: V-shaped wake; interference structure

Sim: L3 preferred; L1/L2 wake stamps for LOD

Validation: SCENE.BOAT.KELVIN_WAKE

WAVE.WAKE.PLANING.ROOSTERTAIL

Cues: strong sheet breakup + spray; foam trail

Sim: triggers → L4 sheets/spray

Validation: SCENE.BOAT.PLANING_SPRAY

WAVE.WAKE.CHARACTER.WADING

Cues: bow waves at legs; bubbles; small breaking

Sim: L3 disturbance + foam/bubbles; L4 only hero

Validation: SCENE.CHARACTER.WADE_CROSSING

WAVE.BASIN — lakes, pools, tanks

WAVE.BASIN.SEICHE.SLOShing

Cues: slow basin oscillation

Sim: low-mode (cheap) or L3

Validation: SCENE.LAKE.SEICHE_WIND_SETUP

WAVE.BASIN.POOL.WALL_REFLECTION_COMPLEX

Cues: reflections create standing/beat patterns

Sim: L3 or reflection model

Validation: SCENE.POOL.REFLECTION_BEATS

FLOW.SURFACE.PATTERNS — not “waves” but must exist visually

FLOW.OCEAN.LANGMUIR_STREAKS

Cues: long parallel foam lines aligned with wind

Sim: procedural advection of foam/roughness bands (L0/L2)

Validation: SCENE.OCEAN.STREAK_LINES

FLOW.NEARSHORE.RIP_CURRENT

Cues: channelized outward flow; foam/debris lanes

Sim: L3 current field (or authored vector field)

Validation: SCENE.BEACH.RIP_CHANNEL

FLOW.RIVER.EDDIES_SURFACE_BOILS

Cues: rotating patches, upwelling “boils,” foam spinning

Sim: L3 velocity features + foam advection

Validation: SCENE.RIVER.EDDIES_BEND

Critical engine crosswalk notes (hybrid-specific)
Heightfield texture convention (needed by many cards)

uHeightfieldTex RGBA = (η, η̇_proxy, n.x, n.z)

Under wave-inherited velocity, η̇ is extracted from info.g with your dt/scale calibration.

Spawn Field convention (genesis driver)

uSf0Tex = (X, C, L, Ω)

uSf1Tex RG = F packed

Meaning in encyclopedia terms:

X: local spawn coordinate / parcel mapping coordinate

C: crest/center bias (where along the wave feature)

L: length scale (sheet/ribbon length)

Ω: orientation/phase/rotation descriptor

F: feature strength (how “breaking-ready” the parcel is)

These are the bridge from “wave physics” → “crest→sheet genesis.”

Lighting + Optics Preset Library (exact knobs + LOD rules)
Parameter model (what your shaders consume)

Core uniforms (recommend):

uIor (water IOR)

uAbsorptionRGB (1/m)

uScatteringRGB (1/m)

uPhaseG (HG anisotropy)

uMicroRoughBase, uMicroRoughWind

uWhitecapThreshold, uWhitecapGain, uWhitecapDecay

uFoamAlbedoRGB, uFoamRoughness

uCausticsStrength, uCausticsScale, uCausticsSpeed, uCausticsMaxDepth

uSSRQuality, uRefractQuality

uUnderwaterFogDensity, uGodRaysStrength

Two “hard physics” helpers you always use

Fresnel base reflectance from IOR:

𝐹
0
=
(
𝑛
−
1
𝑛
+
1
)
2
F
0
	​

=(
n+1
n−1
	​

)
2

Beer–Lambert:

𝑇
(
𝜆
,
𝑑
)
=
𝑒
−
𝑎
(
𝜆
)
𝑑
T(λ,d)=e
−a(λ)d
Presets (values are physically-plausible starting points; calibrate to art + exposure)
P0 — LIGHT.CLEAR_NOON_OCEAN

Sun/sky: strong directional sun, clear sky

Water: ior=1.333

Absorption (1/m): [0.35, 0.08, 0.02] (red absorbed fastest)

Scattering (1/m): [0.010, 0.012, 0.016]

Phase g: 0.85 (forward scattering)

Micro roughness: base 0.03, wind factor 0.12

Whitecaps: threshold 0.55, gain 1.2, decay 0.25

Caustics: on, strength 1.0, scale 1.0, speed 1.0, maxDepth 8m

LOD rules:

Near: SSR=3, refraction=2, caustics on

Mid: SSR=2, caustics on if depth<5m

Far: SSR=0, caustics off, micro detail collapses to roughness

P1 — LIGHT.GOLDEN_HOUR_OCEAN

Absorption: [0.30, 0.07, 0.02]

Scattering: [0.012, 0.012, 0.014]

Micro roughness: base 0.035, wind 0.14 (glints streak longer)

Whitecaps: threshold 0.58, gain 1.1

Caustics: on, strength 0.9, warmer tint via lighting not water coefficients

LOD: keep SSR longer near horizon shots (cinematic priority)

P2 — LIGHT.OVERCAST_LAKE

Absorption: [0.22, 0.06, 0.03]

Scattering: [0.020, 0.022, 0.026] (more haze feel)

Micro roughness: base 0.05, wind 0.10 (softer reflections)

Whitecaps: usually off (threshold 0.75, gain 0.3)

Caustics: weak or off (strength 0.2, only if very shallow/clear)

LOD: SSR often not worth it; use env reflection + roughness

P3 — LIGHT.STORM_SEA

Absorption: [0.40, 0.10, 0.04]

Scattering: [0.030, 0.032, 0.036] (misty, low visibility)

Micro roughness: base 0.08, wind 0.25

Whitecaps: threshold 0.42, gain 2.0, decay 0.35

Caustics: off (storm = no clear sun caustics)

LOD: prioritize foam/spray silhouettes; SSR off mid/far; spray LODs aggressive

P4 — LIGHT.NIGHT_MOON_OCEAN

Absorption: [0.35, 0.08, 0.02]

Scattering: [0.010, 0.012, 0.016]

Micro roughness: base 0.04, wind 0.12

Whitecaps: threshold 0.60, gain 1.0 (foam can still read)

Caustics: off (unless stylized)

LOD: SSR near-only; rely on moon highlight directionality

P5 — LIGHT.HARBOR_SODIUM_LAMPS

Absorption: [0.28, 0.07, 0.03]

Scattering: [0.018, 0.018, 0.018]

Micro roughness: base 0.05, wind 0.10

Special: enable local spec hotspots; underwater cones if turbidity > 0

LOD: refraction quality can drop; highlight blobs still sell it

P6 — LIGHT.POOL_CLEAR_NOON

Absorption: [0.18, 0.05, 0.02]

Scattering: [0.006, 0.007, 0.009]

Caustics: on, strength 1.4, scale 1.6, speed 1.2, maxDepth 3m

LOD: caustics near+mid are worth it; SSR optional; refraction high

P7 — LIGHT.UNDERWATER_CLEAR_TROPICAL

Absorption: [0.25, 0.06, 0.02]

Scattering: [0.008, 0.010, 0.012]

Phase g: 0.88

Underwater fog density: 0.06

God rays: on, strength 0.7 (only when sun visible)

LOD: underwater volumetrics near-only; mid uses cheap in-scatter

P8 — LIGHT.UNDERWATER_MURKY_RIVER

Absorption: [0.60, 0.35, 0.25]

Scattering: [0.080, 0.090, 0.100]

Phase g: 0.70 (less “laser forward,” more diffuse soup)

Underwater fog density: 0.25

God rays: usually off or very soft

LOD: everything is cheap because visibility is low (big perf win)

4) Code (TS + GLSL) — serializable wave IDs + lighting presets
src/water/encyclopedia/cards/waveCatalog.ts
export type SimTier = "L0" | "L1" | "L2" | "L3" | "L4" | "L5";
export type Domain = "surface" | "subsurface" | "interface" | "air";

export interface PhenomenonCard {
  id: string;
  name: string;
  domain: Domain;
  simTiers: SimTier[];
  engineFields: string[];     // e.g. ["eta","gradEta","etaDot","u","SF0","SF1","F"]
  cues: string[];
  antiCues: string[];
  validationScene: string;
}

export const WAVE_CARDS: PhenomenonCard[] = [
  {
    id: "WAVE.FOUNDATION.DISPERSION.GRAVITY_CAPILLARY",
    name: "Gravity–capillary dispersion (finite depth)",
    domain: "surface",
    simTiers: ["L2", "L3"],
    engineFields: ["eta", "h", "k", "omega"],
    cues: ["Packets spread; different wavelengths move differently", "Shallow water trends toward depth-driven speed"],
    antiCues: ["All wavelengths travel at the same speed in deep water"],
    validationScene: "SCENE.WAVES.IMPULSE_RING.DEPTH_RAMP",
  },
  {
    id: "WAVE.SURFACE.CAPILLARY.RIPPLES",
    name: "Capillary ripples (micro-roughness band)",
    domain: "surface",
    simTiers: ["L0"],
    engineFields: ["microNormals", "windDir", "windSpeed"],
    cues: ["Sparkle and tight micro undulations; fast damping", "Strongest at grazing angles"],
    antiCues: ["Ripples modify the main displacement amplitude (category error)"],
    validationScene: "SCENE.LAKE.CALM.SUN_GLITTER",
  },
  // …extend with the full ID list above (one row per leaf)
];

src/water/lighting/presets/lightingPresets.ts
export interface WaterLightingPreset {
  id: string;
  name: string;

  // Optics
  ior: number;
  absorptionRGB: [number, number, number]; // 1/m
  scatteringRGB: [number, number, number]; // 1/m
  phaseG: number;

  // Surface look
  microRoughBase: number;
  microRoughWind: number;

  whitecap: { threshold: number; gain: number; decay: number };

  foam: { albedoRGB: [number, number, number]; roughness: number };

  caustics: { enabled: boolean; strength: number; scale: number; speed: number; maxDepthM: number };

  // Quality knobs
  ssrQuality: 0 | 1 | 2 | 3;
  refractQuality: 0 | 1 | 2;

  underwater: { fogDensity: number; godRays: boolean; godRaysStrength: number };

  // LOD policy (distance)
  lod: { nearM: number; midM: number; farM: number; rules: string[] };
}

export const LIGHTING_PRESETS: WaterLightingPreset[] = [
  {
    id: "LIGHT.CLEAR_NOON_OCEAN",
    name: "Clear noon ocean",
    ior: 1.333,
    absorptionRGB: [0.35, 0.08, 0.02],
    scatteringRGB: [0.010, 0.012, 0.016],
    phaseG: 0.85,
    microRoughBase: 0.03,
    microRoughWind: 0.12,
    whitecap: { threshold: 0.55, gain: 1.2, decay: 0.25 },
    foam: { albedoRGB: [0.92, 0.92, 0.92], roughness: 0.35 },
    caustics: { enabled: true, strength: 1.0, scale: 1.0, speed: 1.0, maxDepthM: 8.0 },
    ssrQuality: 3,
    refractQuality: 2,
    underwater: { fogDensity: 0.08, godRays: true, godRaysStrength: 0.6 },
    lod: {
      nearM: 20, midM: 80, farM: 250,
      rules: [
        "Near: SSR=3, refract=2, caustics on (if depth<maxDepth)",
        "Mid: SSR=2, caustics only when depth<5m",
        "Far: SSR=0, caustics off, micro detail collapses to roughness",
      ],
    },
  },
  // …add the other presets P1–P8 verbatim
];

src/water/render/shaderChunks/opticsCore.glsl
float fresnelF0FromIor(float ior) {
  float a = (ior - 1.0) / (ior + 1.0);
  return a * a;
}

float fresnelSchlick(float cosTheta, float F0) {
  float m = clamp(1.0 - cosTheta, 0.0, 1.0);
  float m2 = m*m;
  float m5 = m2*m2*m;
  return F0 + (1.0 - F0) * m5;
}

vec3 beerLambert(vec3 absorptionRGB, float distM) {
  return exp(-absorptionRGB * max(distM, 0.0));
}

float phaseHG(float cosTheta, float g) {
  float g2 = g*g;
  float denom = pow(max(1.0 + g2 - 2.0*g*cosTheta, 1e-4), 1.5);
  return (1.0 - g2) / (4.0 * 3.14159265 * denom);
}

5) Validation checklist
Wave catalog correctness

SCENE.WAVES.IMPULSE_RING.DEPTH_RAMP: dispersion + shallow transition

SCENE.OCEAN.CROSS_SEA: interference reads correctly

SCENE.NEARSHORE.SHOALING_RAMP: crest tightening + steepening

SCENE.SURF.PLUNGING_BARREL: plunging vs spilling looks distinct

SCENE.RIVER.HYDRAULIC_JUMP_GATE: jump produces aeration + foam/bubbles

SCENE.BOAT.KELVIN_WAKE: wake structure stays stable vs speed

Lighting preset correctness

SCENE.POOL_CLEAR_NOON: caustics are wave-locked and depth-limited

SCENE.WATERLINE.CROSSING: above/below transition has no seam

SCENE.UNDERWATER_MURKY: visibility falls fast and saves perf (LOD works)

Perf / no-stall

No synchronous GPU readbacks in-frame

L4 sim only runs when events active; hard caps enforced (events/frame, particles)

6) Telemetry/debug views added

Wave bands: swell/chop/ripple energy (GPU visual)

Breaking readiness: steepness/curvature/η̇ proxies and the SF0/SF1 decoded vectors

Optics: Fresnel term, thickness/path length, transmittance RGB, caustics mask, underwater in-scatter








1) What we’re changing (this step)

We’re expanding the encyclopedia into Volume V (Foam/Spray/Bubbles/Mist/Turbidity) as a full leaf-card catalog + lifecycle math + engine fields.

We’re adding a Biome/Water-Type matrix (tropical clear ocean vs murky river vs arctic, etc.) that selects optical coefficients + wave/secondary behavior + LOD rules.

We’re defining the Underwater Volumetrics + Caustics Implementation Matrix: the exact pass graph, RT tiers, shader knobs, caps, and no-stall constraints.

2) Why (physics → visuals → perf, with the right gates)

These “secondary” phenomena are what make water read as real: foam/spray/bubbles aren’t decoration—they are violence indicators and lighting modifiers.

The underwater look is mostly optics + participating media, not geometry. Without a consistent volumetric model and caustics policy, above/below shots will never match.

Hybrid drift prevention still applies: genesis first (crest→sheet via SF0/SF1 + inherited velocities). Everything here assumes genesis fields exist; don’t tune feedback/coupling gains as a substitute for missing genesis.

3) Implementation steps (shippable increments)

Add EFFECT_CATALOG.md (IDs below) + a PhenomenonCard JSON schema for effects.

Implement surface foam field update (GPU ping-pong): semi-Lagrangian advection + stretch + decay + accumulation from breaking proxies.

Implement spray & bubble particle systems (GPU preferred) driven by SF0/SF1 parcels; enforce strict caps.

Implement turbidity field (optional but huge realism win): add turbidity injection near bottoms/impacts; drive underwater scattering.

Build the underwater pass graph with RT tiers (near/mid/far) and feature toggles per biome preset.

Add debug views: foam age/stretch, spray emitters, thickness/transmittance, caustics mask, turbidity veil.

4) Volume V — Effects Encyclopedia (Leaf-by-leaf IDs + lifecycle specs)
EFFECT.FOAM — surface foam (the “violence memory”)
Core IDs

EFFECT.FOAM.GENERATION.WHITE_CAPS_WIND

EFFECT.FOAM.GENERATION.BREAKING_SURF

EFFECT.FOAM.GENERATION.WAKE_TURBULENCE

EFFECT.FOAM.ADVECTION.SURFACE_FLOW

EFFECT.FOAM.STRETCHING.SHEAR_ELONGATION

EFFECT.FOAM.DECAY.DRAINAGE_COLLAPSE

EFFECT.FOAM.SHADING.MICROBUBBLE_LAYER

EFFECT.FOAM.PATTERNS.LANGMUIR_STREAKS

Minimal foam field model (GPU-friendly)

Represent foam as a 2D field on the surface:

𝐹
(
𝑥
,
𝑧
,
𝑡
)
F(x,z,t): foam density/coverage 
[
0
,
1
]
[0,1]

𝐴
(
𝑥
,
𝑧
,
𝑡
)
A(x,z,t): foam “age” (seconds)

𝑆
(
𝑥
,
𝑧
,
𝑡
)
S(x,z,t): foam stretch/anisotropy scalar (or 2D direction + amount)

Advection + sources + decay

∂
𝑡
𝐹
+
𝑢
⋅
∇
𝐹
=
𝐺
−
𝐷
∂
t
	​

F+u⋅∇F=G−D

Practical forms:

Generation 
𝐺
G:

wind whitecaps: 
𝐺
𝑤
=
𝑔
𝑤
 
saturate
(
(
𝑠
−
𝑠
0
)
 
𝑘
𝑤
)
G
w
	​

=g
w
	​

saturate((s−s
0
	​

)k
w
	​

)

breaking: 
𝐺
𝑏
=
𝑔
𝑏
 
saturate
(
(
𝜅
−
𝜅
0
)
𝑘
𝜅
)
⋅
saturate
(
(
𝜂
˙
−
𝜂
˙
0
)
𝑘
𝜂
˙
)
G
b
	​

=g
b
	​

saturate((κ−κ
0
	​

)k
κ
	​

)⋅saturate((
η
˙
	​

−
η
˙
	​

0
	​

)k
η
˙
	​

	​

)

wakes/impacts: stamped injection volumes

Decay 
𝐷
D: combine exponential + “drainage faster when thin”:

𝐷
=
𝜆
𝐹
+
𝜆
𝑎
 
saturate
(
𝐴
/
𝐴
max
⁡
)
𝐹
D=λF+λ
a
	​

saturate(A/A
max
	​

)F

Stretching (visual clumping + streaking):

Update a stretch measure from velocity gradient:

𝑆
←
lerp
(
𝑆
,
∥
∇
𝑢
∥
,
𝛼
)
S←lerp(S,∥∇u∥,α)

Use 
𝑆
S to bias foam texture anisotropy and breakup.

Observable cues

Foam appears where violence is, then drifts and stretches into streaks.

Coverage isn’t uniform; it clumps, tears, and fades unevenly.

Anti-cues

Foam glued to world-space, or fading like a single opacity slider.

Foam that appears without any cause (no steepness/breaking/wake).

LOD policy

Near: 
𝐹
F+age+stretch fields + foam shading + normal perturbation.

Mid: only 
𝐹
F + cheap advection or frozen flowmap.

Far: “whitecap coverage” scalar modulating albedo/roughness only.

EFFECT.SPRAY — droplets / spindrift / mist plumes
Core IDs

EFFECT.SPRAY.EMISSION.BREAKING_LIP

EFFECT.SPRAY.EMISSION.WIND_SPINDRIFT

EFFECT.SPRAY.EMISSION.PLANING_ROOSTERTAIL

EFFECT.SPRAY.MOTION.BALLISTIC_DRAG

EFFECT.SPRAY.LIGHTING.SPEC_GLINTS

EFFECT.SPRAY.LIGHTING.BACKLIT_GLOW

EFFECT.SPRAY.LOD.NEAR_DROPLETS_MID_BILLBOARD_FAR_NONE

Minimal motion model

Use particles (GPU), two classes:

(1) Droplets (near): sparkly, short-lived

𝑥
˙
=
𝑣
,
𝑣
˙
=
𝑔
−
𝑐
𝑑
∣
𝑣
−
𝑣
𝑎
𝑖
𝑟
∣
(
𝑣
−
𝑣
𝑎
𝑖
𝑟
)
x
˙
=v,
v
˙
=g−c
d
	​

∣v−v
air
	​

∣(v−v
air
	​

)

Spawn velocity:

inherit from wave crest / ribbon parcel: 
𝑣
0
=
𝑣
𝑤
𝑎
𝑣
𝑒
+
𝑣
𝑛
𝑛
+
𝑣
𝑤
𝑤
^
v
0
	​

=v
wave
	​

+v
n
	​

n+v
w
	​

w
^

𝑣
𝑛
v
n
	​

 depends on breaking intensity (from SF1 feature strength)

Lifetime: short (0.2–1.5s typical for hero spray).

(2) Mist (mid): billboard/volume proxy

Advect in wind + slight gravity sink

Render as soft particles with forward scattering emphasis (especially backlit).

Observable cues

Backlit spray “blooms” and drifts downwind.

Gravity is visible: arcs fall; spindrift peels off crests.

Anti-cues

Spray behaving like smoke (no gravity), or rigid parabolic arcs with no wind response.

LOD

Near: droplets with spec glints.

Mid: mist billboards only.

Far: disable entirely; rely on foam/roughness for distance read.

EFFECT.BUBBLES — subsurface aeration + surface popping
Core IDs

EFFECT.BUBBLES.ENTRAINMENT.BREAKING_IMPACT

EFFECT.BUBBLES.PLUME.RISE_AND_SPREAD

EFFECT.BUBBLES.POP.FEED_FOAM

EFFECT.BUBBLES.SHADING.SUBSURFACE_WHITENING

Minimal bubble model

Particles in volume (GPU) with buoyancy and drag:

Rise velocity toward surface:

𝑣
˙
=
𝑏
 
𝑦
^
−
𝑑
(
𝑣
−
𝑢
)
v
˙
=b
y
^
	​

−d(v−u)

When reaching surface (or a depth threshold), “pop”:

add foam: 
𝐹
←
𝐹
+
Δ
𝐹
F←F+ΔF

optionally add a tiny ring ripple stamp (cheap).

Observable cues

Underwater near impacts becomes “milky” with rising bubbles.

Foam increases where bubbles pop, not randomly.

LOD

Near underwater: visible bubbles.

Mid: volumetric “whiteness” proxy only.

Far: none; foam carries the memory.

EFFECT.TURBIDITY — sediment / algae / murk (optics driver)
Core IDs

EFFECT.TURBIDITY.FIELD.ADVECTION_DIFFUSION

EFFECT.TURBIDITY.INJECTION.BOTTOM_RESUSPEND

EFFECT.TURBIDITY.INJECTION.IMPACT_PLUME

EFFECT.TURBIDITY.OPTICS.SCATTERING_BOOST

EFFECT.TURBIDITY.LOD.VISIBILITY_BASED_CHEAPENING

Minimal turbidity field

A scalar field 
𝑇
(
𝑥
,
𝑦
,
𝑧
)
T(x,y,z) is expensive; for real-time, use:

a 2D “surface-adjacent turbidity” 
𝑇
𝑠
(
𝑥
,
𝑧
)
T
s
	​

(x,z) + a depth falloff, or

a coarse 3D froxel grid near camera only.

2D+depth cheap model

Maintain 
𝑇
𝑠
(
𝑥
,
𝑧
)
T
s
	​

(x,z) on surface/bottom projection:

∂
𝑡
𝑇
𝑠
+
𝑢
⋅
∇
𝑇
𝑠
=
𝑄
−
𝜆
𝑇
𝑠
∂
t
	​

T
s
	​

+u⋅∇T
s
	​

=Q−λT
s
	​


Convert to volume effect with depth:

𝑇
𝑣
𝑜
𝑙
(
𝑑
)
=
𝑇
𝑠
⋅
𝑒
−
𝛽
𝑑
T
vol
	​

(d)=T
s
	​

⋅e
−βd

Optics mapping

Scattering increases with turbidity:

𝜎
𝑠
=
𝜎
𝑠
0
+
𝑘
𝑠
𝑇
𝑣
𝑜
𝑙
σ
s
	​

=σ
s0
	​

+k
s
	​

T
vol
	​


Absorption can also shift (brown/green water).

Observable cues

Murky water loses contrast quickly; god rays get softer; visibility collapses.

River turns “opaque” in the distance underwater (huge realism).

Perf bonus

High turbidity means you can aggressively lower underwater quality (because you can’t see far anyway).

EFFECT.WETNESS — thin films, shoreline sheen, puddles
Core IDs

EFFECT.WETNESS.FILM.RUNUP_SHEET

EFFECT.WETNESS.DARKENING.ALBEDO_SHIFT

EFFECT.WETNESS.SPECULAR.SHEEN

EFFECT.WETNESS.DRYING.EDGE_RETREAT

Model wetness as a scalar 
𝑊
W on terrain:

Increased by runup contact / rain

Decays with time; increases specular, darkens diffuse, reduces roughness.

This is a massive “shoreline realism” multiplier for cheap.

5) Biome / Water-Type Matrix (engine presets that bundle physics + optics + effects)

Each biome preset defines:

Wave climate: typical swell/chop/river features

Secondary budget priorities: foam vs spray vs bubbles vs turbidity

Optics coefficients: absorption/scattering/phase

LOD strategy: what to keep near vs drop far

BIOME.OCEAN.TROPICAL_CLEAR

Look: bright cyan shallows, strong caustics, high visibility underwater

Keep: caustics + underwater volumetrics near/mid

Foam: moderate; mostly from breaking/wakes

Turbidity: low (perf cost justified because it’s visible)

BIOME.OCEAN.TEMPERATE_GREEN

Look: greener water, more haze; caustics weaker

Keep: reflections + foam; underwater fog moderate

Turbidity: medium; reduce caustics depth limit

BIOME.OCEAN.STORM_GRAY

Look: rough surface, whitecaps, spray haze

Keep: foam + spray silhouettes; underwater mostly irrelevant

Drop: caustics (no sun), SSR mid/far

BIOME.RIVER.CLEAR_FAST

Look: standing waves + aeration patches

Keep: foam/bubbles near rapids; wetness on rocks

Turbidity: low–medium depending on bed

BIOME.RIVER.MURKY_SILT

Look: brown/green opacity; underwater visibility near-zero

Keep: surface cues (foam streaks, eddies, wetness)

Drop: expensive underwater passes (turbidity lets you)

BIOME.LAKE.OVERCAST

Look: soft reflections, low sparkle

Keep: shape readability + subtle ripples + shoreline wetness

Foam: rare (except boat wakes)

BIOME.POOL.CLEAR

Look: refraction distortion + crisp caustics

Keep: caustics strong + accurate refraction + thickness-based absorption

Drop: ocean foam systems; use minimal wake/ripples

BIOME.ARCTIC_COLD

Look: dark blue water, low sun, sometimes slush/ice damping

Keep: specular directionality; reduced micro-chop; foam persistence can increase

Optional: floating ice/debris layer (separate system)

6) Underwater Volumetrics + Caustics Implementation Matrix (pass graph + LOD caps)
Pass graph (WebGL2-friendly, no stalls)

Order (per frame, near camera region):

Ocean surface render (displacement + normals)

Thickness pass (only if needed for splash/SS fluid):

render water/splash to thickness RT (screen-space)

Refraction gather:

sample scene color behind surface (opaque color buffer)

apply normal-based UV distortion + IOR

Absorption (Beer–Lambert):

compute path length 
𝑑
d (from depth difference or thickness RT)

apply 
𝑇
(
𝜆
,
𝑑
)
=
𝑒
−
𝑎
(
𝜆
)
𝑑
T(λ,d)=e
−a(λ)d

Underwater in-scatter fog (cheap single-scatter approx):

fog factor 
𝑓
=
1
−
𝑒
−
𝜌
𝑓
𝑑
f=1−e
−ρ
f
	​

d

add scattering color biased by light direction / phase function

Caustics (conditional):

projected caustics texture onto underwater surfaces, depth-limited

multiply by sunlight visibility + optionally attenuate by splash thickness / foam

Foam composite:

foam is an interface layer: affects albedo/roughness + occlusion

Spray/mist composite:

backlit glow + forward scattering feel

RT resolution tiers (hard caps)

Near tier: 1/1 or 1/2 res (hero shots)

Mid tier: 1/2 or 1/4 res

Far tier: disabled or analytic approximations only

Feature gating rules (must be explicit)

Caustics only if: sun visible AND depth < maxDepth AND biome supports it

Underwater volumetrics only if camera underwater OR waterline within view AND visibility warrants it

Spray only if active breaking/wakes AND near enough to matter

7) Code (TS/R3F + GLSL) — effect fields + pass graph
src/water/effects/foam/FoamFieldPass.ts
import * as THREE from "three";

export type FoamRT = {
  rtA: THREE.WebGLRenderTarget;
  rtB: THREE.WebGLRenderTarget;
  swap(): void;
};

export function createFoamRT(w: number, h: number): FoamRT {
  const opts: THREE.WebGLRenderTargetOptions = {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    depthBuffer: false,
    stencilBuffer: false,
  };
  const rtA = new THREE.WebGLRenderTarget(w, h, opts);
  const rtB = new THREE.WebGLRenderTarget(w, h, opts);

  return {
    rtA, rtB,
    swap() { const t = this.rtA; this.rtA = this.rtB; this.rtB = t; },
  };
}

src/water/effects/foam/foamUpdate.frag.glsl
// RGBA: (F, age, stretch, reserved)
uniform sampler2D uFoamPrev;
uniform sampler2D uVelocity;      // RG = surface velocity (x,z) in UV space
uniform sampler2D uBreakProxy;    // R = breaking intensity (from BAT/SF strength)
uniform float uDt;
uniform float uDecay;             // base decay
uniform float uAgeMax;
uniform vec2 uTexel;              // 1/size

// Semi-Lagrangian advection
vec4 advect(sampler2D tex, vec2 uv, vec2 vel) {
  vec2 back = uv - vel * uDt;
  return texture2D(tex, back);
}

void main() {
  vec2 uv = gl_FragCoord.xy * uTexel;

  vec2 vel = texture2D(uVelocity, uv).rg;
  vec4 prev = advect(uFoamPrev, uv, vel);

  float F = prev.r;
  float age = prev.g;
  float stretch = prev.b;

  float breakI = texture2D(uBreakProxy, uv).r;

  // Generation: saturating add
  float G = smoothstep(0.2, 0.8, breakI); // tune in card, not here
  F = clamp(F + G * uDt, 0.0, 1.0);

  // Age only when foam exists
  age = (F > 1e-3) ? min(age + uDt, uAgeMax) : 0.0;

  // Stretch proxy: follow breaking intensity changes (cheap placeholder)
  stretch = mix(stretch, breakI, 0.1);

  // Decay: stronger with age
  float D = uDecay * (1.0 + age / max(uAgeMax, 1e-3));
  F = max(0.0, F - D * uDt);

  gl_FragColor = vec4(F, age, stretch, 1.0);
}

src/water/render/graph/WaterRenderGraph.ts
import * as THREE from "three";

export interface WaterGraphInputs {
  sceneColor: THREE.Texture;      // opaque color
  sceneDepth: THREE.Texture;      // opaque depth
  foamTex: THREE.Texture;         // foam field (F/age/stretch)
  thicknessTex?: THREE.Texture;   // optional thickness RT
  causticsTex?: THREE.Texture;    // animated caustics
}

export interface WaterGraphParams {
  ior: number;
  absorptionRGB: THREE.Vector3;   // 1/m
  scatteringRGB: THREE.Vector3;   // 1/m
  fogDensity: number;
  phaseG: number;
  causticsEnabled: boolean;
  causticsStrength: number;
  causticsMaxDepthM: number;
  ssrQuality: 0|1|2|3;
  refractQuality: 0|1|2;
}

export class WaterRenderGraph {
  private rtRefraction: THREE.WebGLRenderTarget;
  private rtComposite: THREE.WebGLRenderTarget;

  // Fullscreen quad plumbing (left abstract; plug your existing fsQuad helper)
  private fsScene = new THREE.Scene();
  private fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private quad!: THREE.Mesh;

  constructor(private renderer: THREE.WebGLRenderer, w: number, h: number) {
    const opts: THREE.WebGLRenderTargetOptions = {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      depthBuffer: false,
      stencilBuffer: false,
    };
    this.rtRefraction = new THREE.WebGLRenderTarget(w, h, opts);
    this.rtComposite = new THREE.WebGLRenderTarget(w, h, opts);
  }

  resize(w: number, h: number) {
    this.rtRefraction.setSize(w, h);
    this.rtComposite.setSize(w, h);
  }

  render(inputs: WaterGraphInputs, params: WaterGraphParams, materialRefraction: THREE.ShaderMaterial, materialComposite: THREE.ShaderMaterial) {
    // Pass 1: Refraction + absorption + in-scatter into rtRefraction
    materialRefraction.uniforms.uSceneColor.value = inputs.sceneColor;
    materialRefraction.uniforms.uSceneDepth.value = inputs.sceneDepth;
    materialRefraction.uniforms.uThickness.value = inputs.thicknessTex ?? inputs.sceneDepth;
    materialRefraction.uniforms.uIor.value = params.ior;
    materialRefraction.uniforms.uAbsorption.value = params.absorptionRGB;
    materialRefraction.uniforms.uScattering.value = params.scatteringRGB;
    materialRefraction.uniforms.uFogDensity.value = params.fogDensity;
    materialRefraction.uniforms.uPhaseG.value = params.phaseG;

    this.quad.material = materialRefraction;
    this.renderer.setRenderTarget(this.rtRefraction);
    this.renderer.render(this.fsScene, this.fsCam);

    // Pass 2: Composite foam + caustics + spray (spray would be separate draw list)
    materialComposite.uniforms.uBase.value = this.rtRefraction.texture;
    materialComposite.uniforms.uFoam.value = inputs.foamTex;
    materialComposite.uniforms.uCaustics.value = inputs.causticsTex ?? inputs.foamTex;
    materialComposite.uniforms.uCausticsEnabled.value = params.causticsEnabled ? 1 : 0;
    materialComposite.uniforms.uCausticsStrength.value = params.causticsStrength;
    materialComposite.uniforms.uCausticsMaxDepthM.value = params.causticsMaxDepthM;

    this.quad.material = materialComposite;
    this.renderer.setRenderTarget(this.rtComposite);
    this.renderer.render(this.fsScene, this.fsCam);

    // Output: rtComposite.texture (blend into your main pipeline)
    this.renderer.setRenderTarget(null);
  }

  get output(): THREE.Texture {
    return this.rtComposite.texture;
  }
}

src/water/render/shaders/refractionAbsorbScatter.frag.glsl
uniform sampler2D uSceneColor;
uniform sampler2D uSceneDepth;
uniform sampler2D uThickness;     // if true thickness RT exists; else depth-derived
uniform float uIor;
uniform vec3 uAbsorption;         // 1/m
uniform vec3 uScattering;         // 1/m
uniform float uFogDensity;
uniform float uPhaseG;

uniform vec2 uInvRes;

// Provide your existing world recon / depth linearization helpers.
float linearizeDepth(float z);

float fresnelF0FromIor(float ior){
  float a = (ior - 1.0) / (ior + 1.0);
  return a*a;
}
float fresnelSchlick(float cosTheta, float F0){
  float m = clamp(1.0 - cosTheta, 0.0, 1.0);
  float m2 = m*m;
  float m5 = m2*m2*m;
  return F0 + (1.0 - F0)*m5;
}
vec3 beerLambert(vec3 absorption, float d){
  return exp(-absorption * max(d, 0.0));
}

void main(){
  vec2 uv = gl_FragCoord.xy * uInvRes;

  // Placeholder: assume normal is available from GBuffer or water normal texture.
  // Replace with your actual normal sampling.
  vec3 N = vec3(0.0, 1.0, 0.0);

  // View direction proxy
  vec3 V = vec3(0.0, 0.0, 1.0);
  float cosTheta = clamp(dot(N, V), 0.0, 1.0);

  float F0 = fresnelF0FromIor(uIor);
  float F = fresnelSchlick(cosTheta, F0);

  // Refraction UV offset: simple normal-based distortion
  vec2 refractOffset = (N.xz) * (1.0 - cosTheta) * 0.03;
  vec2 uvR = uv + refractOffset;

  vec3 behind = texture2D(uSceneColor, uvR).rgb;

  // Path length approximation: replace with thickness RT if available.
  float d = 2.0; // meters (placeholder). In practice derive from depth difference / thickness.
  vec3 T = beerLambert(uAbsorption, d);

  // Cheap in-scatter fog
  float fog = 1.0 - exp(-uFogDensity * d);
  vec3 scatterCol = uScattering; // proxy; you can bias by sun dir + phaseHG

  vec3 refracted = behind * T + scatterCol * fog;

  // Reflection is handled elsewhere (SSR/env), but this pass outputs transmissive component.
  gl_FragColor = vec4(refracted, 1.0);
}

8) Validation checklist (effects + biome + underwater)
Visual sweeps

Foam: generate→advect→stretch→decay (breaker line + wake trail)

Spray: backlit plume bends downwind; arcs fall; near glints

Bubbles: underwater plume rises; surface pop adds foam

Turbidity: murky river underwater visibility collapses quickly (correct “veil”)

Caustics: pool + tropical shallows only; motion locked to wave normals; depth limited

Waterline: crossing does not create two different waters (same absorption/scatter)

Perf/no-stall

Foam field: fixed RT sizes; one advect pass per frame (or every N frames mid)

Spray/bubbles: strict caps (spawns/sec, active count); LOD off mid/far

Underwater: RT tier scaling (1/2, 1/4); caustics conditional

Absolutely no synchronous GPU readbacks anywhere in the loop

Regression safety

Toggle groups: Foam / Spray / Bubbles / Turbidity / Caustics / UnderwaterVol

Biome preset switch must be reversible with identical exposure response

9) Telemetry/debug views added (this step)

DEBUG.FOAM: show (F, age, stretch) channels + velocity arrows

DEBUG.SPRAY: emitter points (from SF decode) + particle count + lifetime histogram (CPU counters only)

DEBUG.BUBBLES: bubble density heatmap + pop events/sec

DEBUG.TURBIDITY: turbidity scalar + resulting scattering/absorption multipliers

DEBUG.OPTICS: Fresnel term, path length/thickness, transmittance RGB

DEBUG.CAUSTICS: caustics mask, depth limit mask, occlusion by foam/thickness

DEBUG.LOD: active tier, RT resolution tier, pass count





1) What we’re changing (this step)

We’re adding a full Shoreline Interactions Encyclopedia (beaches/rocks/cliffs/structures), as leaf-card IDs + lifecycle math + engine fields.

We’re locking the Pass Budget Contract: hard caps + LOD rules for H0/H1/H2 hardware tiers and near/mid/far distance tiers, including “no-stall” enforcement.

We’re adding budget enforcement code (spawn governors + pass scheduler) so the encyclopedia can’t silently exceed perf.

2) Why

Shorelines are where viewers judge realism hardest: swash/backwash, wet sand sheen, foam lines, rock impacts, tide pools.

A “perfect” engine needs “perfect” constraints: if budgets aren’t explicit, features creep (extra passes, too many particles) and the look breaks under load.

Volume VII (new tranche) — Shoreline Interactions Encyclopedia
SHORELINE Master Index
A) Shoreline types (geometry + material)

SHORELINE.TYPE.SAND_BEACH

SHORELINE.TYPE.PEBBLE_GRAVEL

SHORELINE.TYPE.ROCKY_SLAB

SHORELINE.TYPE.CLIFF

SHORELINE.TYPE.MUD_BANK

SHORELINE.TYPE.MANMADE.SEAWALL

SHORELINE.TYPE.MANMADE.PIER_PILINGS

SHORELINE.TYPE.MANMADE.STEPS_RAMP

B) Swash-zone processes (the “shoreline signature”)

SHORELINE.SWASH.RUNUP.THIN_SHEET

SHORELINE.SWASH.BACKWASH.RETURN_FLOW

SHORELINE.SWASH.FOAM_LINE.STRANDLINE

SHORELINE.SWASH.WET_SAND.DARKENING_SHEEN

SHORELINE.SWASH.SAND_SUSPENSION.BROWN_PLUME

SHORELINE.SWASH.CUSP_PATTERNS (optional)

C) Wave impact on obstacles

SHORELINE.IMPACT.ROCK.SPLASH_SHEET

SHORELINE.IMPACT.ROCK.REBOUND_JET

SHORELINE.IMPACT.CLIFF.SPRAY_CLOUD

SHORELINE.IMPACT.SEAWALL.REFLECTIVE_CLAP (standing reflection + slap)

SHORELINE.IMPACT.PILINGS.VON_KARMAN_WAKE (stylized/LOD)

D) Shallow optics near shore

SHORELINE.OPTICS.SHORE_CAUSTICS

SHORELINE.OPTICS.SHORE_TURBIDITY_VEIL

SHORELINE.OPTICS.TIDEPOOL_REFRACT_REFLECT

E) Pools + tide pools

SHORELINE.TIDEPOOL.FILL_DRAIN

SHORELINE.TIDEPOOL.CAUSTICS_STRONG

SHORELINE.TIDEPOOL.FOAM_RESIDUE_RING

Phenomenon Cards (shoreline essentials)
Card — Runup thin sheet (the “wet film”)

ID: SHORELINE.SWASH.RUNUP.THIN_SHEET
Domain: interface + terrain boundary
Observable cues

A thin sheet climbs the beach, gets thinner, then breaks into rivulets.

The leading edge is irregular and fast (not a smooth line).
Anti-cues

A perfectly uniform wet edge; runup that looks like a texture wipe.
Minimal model

Maintain terrain wetness 
𝑊
(
𝑥
,
𝑧
)
∈
[
0
,
1
]
W(x,z)∈[0,1].

Runup contact stamps wetness; backwash decreases it; evaporation decays.

∂
𝑡
𝑊
=
𝑄
contact
−
𝜆
𝑊
∂
t
	​

W=Q
contact
	​

−λW

Engine fields

shoreline contact mask 
𝐶
C (where water intersects terrain)

wetness field 
𝑊
W (terrain decal/vertex/RT)

optional “flow direction” for streaking
Sim tiers

L3 best (thin sheet), but LOD fallback is 100% acceptable: wetness-only with animated edge.
Validation: SCENE.BEACH.RUNUP_FILM
Debug: DEBUG.WETNESS (W), DEBUG.SHORE_CONTACT (C)

Card — Backwash return flow (the “pull”)

ID: SHORELINE.SWASH.BACKWASH.RETURN_FLOW
Cues

Retreating sheet accelerates downhill, pulling foam streaks seaward.

Creates small ripples and chaotic interference near the boundary.
Anti-cues

Retreating motion at constant speed; foam not advecting with it.
Engine mapping

L3: shallow-water return flow near shore

LOD: use a shoreline-directed velocity field to advect foam 
𝐹
F and wetness streaks
Validation: SCENE.BEACH.BACKWASH_STREAKS
Debug: shoreline velocity arrows + foam advection overlay

Card — Foam strandline (the “shoreline signature line”)

ID: SHORELINE.SWASH.FOAM_LINE.STRANDLINE
Cues

Foam accumulates briefly near the max runup line, then breaks into patches.

Foam residue persists a bit longer than the water sheet.
Anti-cues

Foam stuck exactly at the waterline at all times.
Minimal model

When runup velocity drops and 
𝑊
W is high, deposit foam residue:

𝐹
←
𝐹
+
𝑘
⋅
saturate
(
𝑊
)
⋅
saturate
(
1
−
∥
𝑢
∥
)
F←F+k⋅saturate(W)⋅saturate(1−∥u∥)

Engine fields

foam field 
𝐹
F, wetness 
𝑊
W, near-shore velocity proxy 
𝑢
u
LOD

Near: full foam shading + clumping

Mid: residue-only decal strip

Far: none
Validation: SCENE.BEACH.FOAM_STRANDLINE

Card — Wet sand darkening + sheen

ID: SHORELINE.SWASH.WET_SAND.DARKENING_SHEEN
Cues

Wet sand is darker, smoother (lower roughness), higher specular “sheen.”

Drying edge retreats with time, unevenly.
Anti-cues

Wetness that only changes color without changing roughness/spec.
Shading model (terrain)

Blend terrain material by wetness 
𝑊
W:

baseColor darken: 
𝑎
𝑙
𝑏
𝑒
𝑑
𝑜
←
𝑙
𝑒
𝑟
𝑝
(
𝑎
𝑙
𝑏
𝑒
𝑑
𝑜
,
𝑎
𝑙
𝑏
𝑒
𝑑
𝑜
⋅
𝑑
,
𝑊
)
albedo←lerp(albedo,albedo⋅d,W)

roughness drop: 
𝑟
←
𝑙
𝑒
𝑟
𝑝
(
𝑟
,
𝑟
𝑤
𝑒
𝑡
,
𝑊
)
r←lerp(r,r
wet
	​

,W)

spec increase: 
𝑠
←
𝑙
𝑒
𝑟
𝑝
(
𝑠
,
𝑠
𝑤
𝑒
𝑡
,
𝑊
)
s←lerp(s,s
wet
	​

,W)
Validation: SCENE.BEACH.WET_SHEEN_GRAZING_CAM
Debug: show wetness and derived roughness

Card — Rock impact: splash sheet + rebound jet

ID: SHORELINE.IMPACT.ROCK.SPLASH_SHEET and SHORELINE.IMPACT.ROCK.REBOUND_JET
Cues

Crest hits rock → sheet fans out; rebound jet shoots upward then atomizes into mist.

Backlit spray glows; foam gathers in rock shadow pockets.
Anti-cues

Single explosion puff; splash not aligned to impact normal.
Engine mapping

Genesis uses impact normal + wave-inherited velocity:

sheet parcels emitted tangent to rock face

jet parcels emitted along reflected velocity direction

L4 near-only; LOD drops to mist billboard + foam stamp
Validation: SCENE.ROCKS.WAVE_IMPACT_SERIES
Debug: impact vectors + SF parcels + particle counts

Card — Cliff spray cloud (persistent haze)

ID: SHORELINE.IMPACT.CLIFF.SPRAY_CLOUD
Cues

A persistent, wind-blown mist sheet near the cliff; intensity correlates with breaker frequency.
Engine mapping

Use an “impact accumulator” field over time; emit mist volume with low-frequency updates.
LOD

Near: mist particles

Mid: single billboard volume

Far: none (or horizon haze only)
Validation: SCENE.CLIFF.SPRAY_WIND_SHIFT

Card — Tide pool fill/drain + optics

ID: SHORELINE.TIDEPOOL.FILL_DRAIN, SHORELINE.OPTICS.TIDEPOOL_REFRACT_REFLECT
Cues

Pools fill with runup, slosh, then drain; caustics are strong; reflections flip by angle.
Engine mapping

Water-in-pool can be a separate “small basin” surface (low-mode slosh) + strong refraction/caustics preset.
Validation: SCENE.TIDEPOOL.FILL_DRAIN_CAUSTICS

Pass Budget Contract (Hard Rules + Defaults)
A) Three tiers you must always enforce
Distance tiers

Near: hero detail, hybrid events allowed

Mid: reduced events, cheaper RTs

Far: analytic only (no particles, no caustics, minimal passes)

Hardware tiers

H0: low (integrated / mobile-class)

H1: mid

H2: high

Telemetry tiers (no-stall)

L0: CPU counters only (always on)

L1: GPU debug views (visualization only; no readback)

L2: tiny throttled readback (1×1 reductions, ≤1–2 Hz) optional

L3: forbidden

B) Hard caps (defaults)

These are caps, not targets. If a cap is hit, you degrade in the prescribed fallback order.

1) Fullscreen passes per frame (water-specific)

H0: ≤ 3 fullscreen water passes

H1: ≤ 5

H2: ≤ 7
(Counts include refraction/absorb/scatter, foam composite, caustics composite, thickness if used.)

2) Render target (RT) budgets (water subsystem)

Define max water RT pixels (sum of all active RT areas):

H0: ≤ 1.0× screen pixels

H1: ≤ 2.0×

H2: ≤ 3.5×
Rule: if you add an RT, you must remove/halve another in the same tier.

3) L4 event caps (hybrid sheets/splash)

Per frame caps:

H0: events/frame ≤ 2, parcels/event ≤ 64

H1: events/frame ≤ 4, parcels/event ≤ 128

H2: events/frame ≤ 8, parcels/event ≤ 256

Active particle caps (global)

H0: spray ≤ 20k, bubbles ≤ 10k

H1: spray ≤ 60k, bubbles ≤ 30k

H2: spray ≤ 150k, bubbles ≤ 80k

4) Foam field RT resolution

Near: H0 512², H1 1024², H2 1536²

Mid: half of near

Far: disabled or scalar coverage only

5) Update frequencies (decimation rules)

Foam advection:

Near: every frame

Mid: every 2–4 frames

Far: frozen or off

Caustics:

Near: every frame (if enabled)

Mid: every 2 frames

Far: off

Underwater volumetrics:

Only if camera underwater or waterline in view; otherwise off.

C) Fallback order (must be consistent)

When budgets are exceeded, degrade in this order:

Disable far spray → 2) reduce spray to mist-only → 3) foam-first only (no sheets)

lower RT resolution tier → 5) decimate updates → 6) disable caustics → 7) disable SSR → 8) collapse ripple band to analytic roughness

This keeps the “water read” intact as long as possible.

6) Code — budget enforcement + scheduler (TS)
src/water/perf/BudgetConfig.ts
export type HardwareTier = "H0" | "H1" | "H2";
export type DistanceTier = "near" | "mid" | "far";

export interface WaterBudgets {
  fullscreenPassesMax: number;
  rtPixelsMaxMultiplier: number;

  eventsPerFrameMax: number;
  parcelsPerEventMax: number;

  sprayMax: number;
  bubblesMax: number;

  foamResNear: number;
  foamResMid: number;

  updateEveryNFrames: {
    foamNear: number; foamMid: number;
    causticsNear: number; causticsMid: number;
    underwaterNear: number; underwaterMid: number;
  };
}

export const BUDGETS: Record<HardwareTier, WaterBudgets> = {
  H0: {
    fullscreenPassesMax: 3,
    rtPixelsMaxMultiplier: 1.0,
    eventsPerFrameMax: 2,
    parcelsPerEventMax: 64,
    sprayMax: 20_000,
    bubblesMax: 10_000,
    foamResNear: 512,
    foamResMid: 256,
    updateEveryNFrames: { foamNear: 1, foamMid: 3, causticsNear: 1, causticsMid: 2, underwaterNear: 1, underwaterMid: 3 },
  },
  H1: {
    fullscreenPassesMax: 5,
    rtPixelsMaxMultiplier: 2.0,
    eventsPerFrameMax: 4,
    parcelsPerEventMax: 128,
    sprayMax: 60_000,
    bubblesMax: 30_000,
    foamResNear: 1024,
    foamResMid: 512,
    updateEveryNFrames: { foamNear: 1, foamMid: 2, causticsNear: 1, causticsMid: 2, underwaterNear: 1, underwaterMid: 2 },
  },
  H2: {
    fullscreenPassesMax: 7,
    rtPixelsMaxMultiplier: 3.5,
    eventsPerFrameMax: 8,
    parcelsPerEventMax: 256,
    sprayMax: 150_000,
    bubblesMax: 80_000,
    foamResNear: 1536,
    foamResMid: 768,
    updateEveryNFrames: { foamNear: 1, foamMid: 2, causticsNear: 1, causticsMid: 1, underwaterNear: 1, underwaterMid: 2 },
  },
};

src/water/perf/BudgetGovernor.ts
import { BUDGETS, HardwareTier } from "./BudgetConfig";

export class BudgetGovernor {
  private frame = 0;

  // Per-frame counters (reset each frame)
  public eventsThisFrame = 0;
  public sprayActive = 0;
  public bubblesActive = 0;

  constructor(public tier: HardwareTier) {}

  beginFrame() {
    this.frame++;
    this.eventsThisFrame = 0;
  }

  canSpawnEvent(): boolean {
    return this.eventsThisFrame < BUDGETS[this.tier].eventsPerFrameMax;
  }

  reserveEvent(): boolean {
    if (!this.canSpawnEvent()) return false;
    this.eventsThisFrame++;
    return true;
  }

  clampParcels(requested: number): number {
    return Math.min(requested, BUDGETS[this.tier].parcelsPerEventMax);
  }

  allowSpraySpawn(requested: number): number {
    const max = BUDGETS[this.tier].sprayMax;
    const room = Math.max(0, max - this.sprayActive);
    const granted = Math.min(requested, room);
    this.sprayActive += granted;
    return granted;
  }

  allowBubbleSpawn(requested: number): number {
    const max = BUDGETS[this.tier].bubblesMax;
    const room = Math.max(0, max - this.bubblesActive);
    const granted = Math.min(requested, room);
    this.bubblesActive += granted;
    return granted;
  }

  // Scheduling helper
  everyN(n: number): boolean {
    return (this.frame % Math.max(1, n)) === 0;
  }
}

src/water/lod/DistanceTier.ts
export type DistanceTier = "near" | "mid" | "far";

export function distanceTier(distM: number, nearM: number, midM: number): DistanceTier {
  if (distM < nearM) return "near";
  if (distM < midM) return "mid";
  return "far";
}

7) Validation checklist (shoreline + budgets)
Visual sweeps

SCENE.BEACH.RUNUP_FILM: thin sheet + wet sheen + irregular edge

SCENE.BEACH.FOAM_STRANDLINE: foam residue line forms and breaks

SCENE.ROCKS.WAVE_IMPACT_SERIES: sheet fan + rebound jet + backlit mist

SCENE.TIDEPOOL.FILL_DRAIN_CAUSTICS: refraction + strong caustics + slosh

SCENE.SEAWALL.SLAP_REFLECTION: reflected standing pattern + impact

Perf/no-stall

Force worst-case: many impacts + wind sea + shoreline in view

Confirm: event caps enforced; fallback order triggers; pass counts never exceed tier caps

Confirm: no GPU readback introduced (only L0/L1 telemetry active)

8) Telemetry/debug views added

DEBUG.SHORE_CONTACT: water–terrain intersection mask

DEBUG.WETNESS: wetness scalar + drying rate

DEBUG.SWASH_VELOCITY: nearshore flow arrows used for foam/runup advection

DEBUG.IMPACT_EVENTS: event points + normals + allocated parcel counts

DEBUG.BUDGET_STATE: tier, pass count, RT pixels used, caps hit flags








1) What we’re changing (this step)

We’re adding the Water Body Encyclopedia as a one-click Environment Preset Library: oceans, coasts, estuaries, rivers, lakes, waterfalls, pools, puddles, marshes, etc.

Each environment becomes an Environment Card that bundles: wave climate + currents + bathymetry rules + optics + effects + shoreline + budgets + validation scenes.

We’re adding the application glue: a single TS preset object that selects the correct sim ladder tiers (L0–L4), lighting/optics coefficients, and effect caps—without breaking physics relationships.

2) Why

Realism is mostly context: the same wave shader looks “wrong” if the water body’s optics, turbulence cues, shoreline behavior, and budgets don’t match the environment.

A perfect engine needs repeatable presets that still respect hard rules:

Ripples are L0 shading, not displacement energy.

Foam/spray/bubbles are caused by violence, not decoration.

Hybrid detail (sheets/splash) is event-driven and budget-governed.

Genesis visuals first (crest→sheet), feedback tuning later.

3) Implementation steps

Create ENVIRONMENT_PRESETS.md containing the index + cards below.

Implement src/water/presets/environmentPresets.ts to serialize these cards.

Add applyEnvironmentPreset() that configures:

wave system (L1/L2/L3), bands, wind/current fields

lighting/optics preset (absorption/scattering/phase/caustics)

effects (foam/spray/bubbles/turbidity/wetness) + budgets

shoreline mode if relevant

Add validation scenes per environment (IDs below).

Add debug overlays: environment ID, active tiers, budgets hit, and the key fields that must match (η, ∇η, breaking proxies, SF0/SF1, foam F, thickness τ).

Volume VIII — Water Body Encyclopedia (Master Index + Environment Cards)
VIII.0 Master Index (water bodies as “contexts”)
A) Marine

ENV.OCEAN.DEEP_OPEN

ENV.OCEAN.TROPICAL_CLEAR

ENV.OCEAN.TEMPERATE_GREEN

ENV.OCEAN.STORM_GRAY

ENV.COAST.SAND_BEACH_SURF

ENV.COAST.ROCKY_CLIFFS

ENV.ESTUARY.BRACKISH_MURKY

ENV.HARBOR.MANMADE_DOCKS

B) Freshwater flowing

ENV.RIVER.MEANDERING_CALM

ENV.RIVER.BRAIDED_WIDE

ENV.RIVER.RAPIDS_WHITEWATER

ENV.CANAL.MANMADE_SMOOTH

ENV.WATERFALL.CASCADE

ENV.SPILLWAY_DAM_OUTFLOW

C) Freshwater still

ENV.LAKE.CLEAR_ALPINE

ENV.LAKE.EUTROPHIC_GREEN

ENV.POND.MURKY_STILL

ENV.POOL.CLEAR_TILED

ENV.CAVE_POOL_DARK

D) Shallow thin water

ENV.PUDDLE.RAIN_FILM

ENV.MARSH.WETLAND

ENV.MUDFLAT.TIDAL

VIII.1 Environment Card contract (every environment uses this)

Each environment preset must define:

ID / Name

Geometry context: depth model (flat/depthmap), shore type, bottom material

Wave climate: swell/chop/ripple bands, directionality, fetch, gusts

Currents/flow: surface velocity model (uniform, field, SWE)

Breaking policy: where/how breaking occurs + which spawn fields are required

Optics: IOR, absorption/scattering/phase, caustics policy

Effects priorities: foam vs spray vs bubbles vs turbidity vs wetness

LOD/budgets: near/mid/far + H0/H1/H2 caps + fallback order

Validation scenes: 1–3 canonical tests

VIII.2 Environment Cards (the “one-click” encyclopedia)
1) ENV.OCEAN.DEEP_OPEN — Open ocean (deep water, mixed sea state)

Camera read (above): long organized swell under wind chop; crisp horizon reflections; whitecaps only at higher wind
Camera read (below): visibility moderate; surface is bright “ceiling” with moving normals; bubbles only near impacts

Wave climate

Swell band: narrow direction spread, long λ (L2 FFT or L1 fallback)

Chop band: broader spread, shorter λ (L2)

Ripple band: normals only (L0)

Currents

Optional low-frequency current field advecting foam and wake textures

Breaking policy

Mostly whitecaps (wind breaking), not surf-zone breaking

Triggers: WAVE.SURFACE.GRAVITY.DEEP.WIND_SEA → EFFECT.FOAM.GENERATION.WHITE_CAPS_WIND

Optics

ior 1.333

Absorption: [0.35, 0.08, 0.02]

Scattering: [0.010, 0.012, 0.016]

Caustics: usually off (deep), or depth-limited “stylized” only

Effects priorities

Foam (whitecaps) > spray (spindrift in storms) > bubbles (rare)

LOD

Far: collapse to env reflections + analytic roughness + whitecap coverage scalar

Validation

SCENE.OCEAN.SWELL_CHOP_HORIZON

SCENE.OCEAN.CROSS_SEA (if enabled)

2) ENV.OCEAN.TROPICAL_CLEAR — Clear tropical shallows (cinematic caustics)

Above: turquoise shallows, strong refraction distortion, gentle swell; breaking only near reefs/beaches
Below: high visibility, strong caustics, sun shafts possible

Wave climate

Lower chop energy unless windy; ripples dominate glints

Geometry context

Depthmap-driven color shift (shallow bright, deep blue)

Sandy bottom with high albedo (caustics pop)

Breaking policy

If near reef/shore: allow localized plunging events (L4) with strict caps

Requires: breaking proxies + SF0/SF1 for crest→sheet

Optics

Absorption: [0.25, 0.06, 0.02]

Scattering: [0.008, 0.010, 0.012]

Caustics: ON, strong, maxDepth ~ 8–12m (tunable)

Effects

Foam limited (clear water usually shows foam sharply when it exists)

Bubbles visible underwater near impacts (big realism)

Validation

SCENE.TROPICAL.SHALLOW_CAUSTICS

SCENE.WATERLINE.CROSSING_CLEAR

3) ENV.OCEAN.STORM_GRAY — Storm sea (whitecaps + spray haze)

Above: noisy surface, streak foam, heavy spray/mist reduces contrast; reflections are broken/noisy
Below: usually not a focus; visibility low

Wave climate

High wind, broad directional spread, aggressive micro-roughness

Breaking policy

Whitecaps everywhere; frequent spindrift emission

L4 sheets only for hero moments (caps low)

Optics

Absorption: [0.40, 0.10, 0.04]

Scattering: [0.030, 0.032, 0.036]

Caustics: OFF

Effects

Foam + spray silhouettes dominate

Underwater volumetrics: OFF unless camera underwater (and even then cheap)

Validation

SCENE.STORM.WHITEcaps_SPRAY_WIND

SCENE.BUDGET.WORST_CASE_STORM (stress test)

4) ENV.COAST.SAND_BEACH_SURF — Classic surf beach (swash + wet sand)

Above: surf line, spilling/plunging transitions, foam strandlines, wet sheen on sand
Below: sandy turbidity near breaking; bubbles in plunge zone

Geometry

Shore slope profile + depthmap; wet sand material required

Wave climate

Incoming swell; shoaling/refraction into shore; surf-zone breaking types

Breaking policy

Full nearshore stack:

WAVE.NEARSHORE.SHOALING.AMPLIFY

WAVE.NEARSHORE.BREAKING.(SPILLING|PLUNGING|SURGING)

SHORELINE.SWASH.RUNUP.THIN_SHEET

Genesis requirement: SF0/SF1 parcels must ride the crest (crest→sheet)

Optics

Moderate turbidity near shore:

Absorption: [0.30, 0.08, 0.03]

Scattering: [0.020, 0.022, 0.026]

Caustics: weak/conditional (only when sun + clear + shallow)

Effects

Foam: heavy, persistent; strandline residue

Spray: backlit lip spray, mist at impact

Bubbles: strong in plunge zone

Wetness: mandatory

Validation

SCENE.SURF.LINEUP_TYPES (spilling vs plunging vs surging)

SCENE.BEACH.RUNUP_FILM

SCENE.BEACH.FOAM_STRANDLINE

5) ENV.COAST.ROCKY_CLIFFS — Rock impacts + cliff spray cloud

Above: reflections + impact splashes; persistent mist near cliff; reflected interference patterns
Below: aeration near impact zones, otherwise darker water

Breaking policy

Impact-driven sheets/jets:

SHORELINE.IMPACT.ROCK.SPLASH_SHEET

SHORELINE.IMPACT.CLIFF.SPRAY_CLOUD

Requires impact normals + wave-inherited velocity for correct fan/jet direction

Optics

Darker, less clear:

Absorption: [0.38, 0.10, 0.03]

Scattering: [0.018, 0.020, 0.024]

Caustics: generally off

Effects

Spray/mist is the star; foam collects in pockets

Validation

SCENE.CLIFF.IMPACTS_AND_MIST

SCENE.COAST.CLIFF_REFLECTION

6) ENV.ESTUARY.BRACKISH_MURKY — Brackish, silty, layered flow look

Above: brown-green water, foam/debris lanes, slow chop; strong current gradients
Below: visibility collapses quickly; scattering dominates

Flow

Current field is primary (advection cues > wave cues)

Add eddies, shear lanes, boil patches

Optics

Absorption: [0.60, 0.35, 0.25]

Scattering: [0.080, 0.090, 0.100]

Phase g: ~0.70 (less “laser” forward)

Effects

Turbidity is the realism anchor

Foam appears in shear/boil zones, not everywhere

LOD advantage

Because visibility is low, underwater features can be cheaper (huge perf win)

Validation

SCENE.ESTUARY.SHEAR_LANES

SCENE.UNDERWATER.MURKY_VISIBILITY

7) ENV.HARBOR.MANMADE_DOCKS — Piers, pilings, reflections, boat wakes

Above: complex reflections, oily calm patches, wakes ricochet off walls
Below: localized artificial lights, cones, particulate sparkle

Wave climate

Usually low sea state but high boundary complexity (standing/reflected patterns)

Flow

Boat wakes + reflections dominate

Optics

Often artificial light preset; caustics usually weak unless very clear and sunny

Effects

Foam mainly from boats and impacts

Wetness on docks/steps if wave slaps

Validation

SCENE.HARBOR.PILINGS_WAKE_REFLECTIONS

SCENE.HARBOR.NIGHT_LIGHT_CONES (optional)

8) ENV.RIVER.MEANDERING_CALM — Slow river (surface patterns + banks)

Above: gentle flow, eddies at bends, debris lanes; small ripples/wakes
Below: medium visibility; banks and bottom often visible if clear

Flow

L3 SWE optional; cheaper: authored vector field + surface pattern advection

Effects

Foam is rare except around obstacles

Wetness on banks is important

Turbidity depends on bed; default moderate

Validation

SCENE.RIVER.BEND_EDDIES

SCENE.CHARACTER.WADE_CROSSING (if gameplay)

9) ENV.RIVER.RAPIDS_WHITEWATER — Whitewater rapids (aeration world)

Above: standing waves, hydraulic jumps, constant foam and spray
Below: lots of bubbles; water looks “white” near turbulence

Flow

L3 SWE strongly recommended for anchored standing waves + jump regions

Effects

Foam + bubbles are primary (continuous)

Spray/mist near jumps and drops

Turbidity optional but can help “milky” look

Budgets

L4 sheets are rare; most “whiteness” comes from foam+bubbles+mists (cheaper and correct)

Validation

SCENE.RIVER.HYDRAULIC_JUMP_GATE

SCENE.RIVER.STANDING_WAVES_BOULDER

10) ENV.WATERFALL.CASCADE — Waterfall (sheet breakup + plunge mist)

Above: thin sheets → breakup → mist cloud; plunge pool rings; wet rock sheen
Below: bubble plumes + turbulence whiteness

Breaking policy

Continuous sheet-to-spray conversion (Weber-driven cues)

Use a waterfall emitter system:

near: ribbon sheets + droplets

mid: mist volumes

far: textured sheet + mist billboard

Optics

Often high aeration = more scattering (looks brighter/whiter)

Effects

Mist cloud is mandatory

Wetness on rocks is mandatory

Validation

SCENE.WATERFALL.CASCADE_PLUNGE

SCENE.WATERFALL.BACKLIT_MIST

11) ENV.LAKE.CLEAR_ALPINE — Clear lake (seiches + wind patches)

Above: calm most of the time; cat’s paws; subtle swell; beautiful reflections
Below: high clarity, gentle haze; caustics only if shallow + sunny

Wave climate

Mostly low energy; emphasize micro-roughness and reflection stability

Special

Optional seiche (basin slosh mode) for long shots

Validation

SCENE.LAKE.CALM_REFLECTIONS

SCENE.LAKE.GUST_PATCHES

12) ENV.LAKE.EUTROPHIC_GREEN — Green/algae lake (visibility loss)

Above: softer reflections, greener color, less sparkle
Below: visibility drops quickly; scattering dominates

Optics

Absorption: [0.45, 0.20, 0.10]

Scattering: [0.050, 0.060, 0.070]

Effects

Turbidity/particulates are primary; caustics weak/rare

Validation

SCENE.LAKE.GREEN_VISIBILITY

13) ENV.POOL.CLEAR_TILED — Pool (refraction + caustics king)

Above: crisp specular, strong refraction distortion, hard-edge geometry cues
Below: very clear, high-contrast caustics, visible light patterns on tiles

Wave climate

Small waves only; boundary reflections/standing patterns dominate

Optics

Strong caustics, maxDepth ~ 3m

Validation

SCENE.POOL_CLEAR_NOON

SCENE.POOL.REFLECTION_BEATS

14) ENV.PUDDLE.RAIN_FILM — Thin film + ripples + wet asphalt

Above: thin reflective film, raindrop rings, streak flow, micro-roughness changes
Below: typically not relevant (but can show “thickness tint” at edges)

Core

Wetness + thin film shading is everything

Ripples: ring-wave stamps (visual), not big displacement

Validation

SCENE.PUDDLE.RAIN_RIPPLES

SCENE.STREET.WET_REFLECTIONS

15) ENV.MARSH.WETLAND — Shallow, plant-filled, murky

Above: slow flow, patches of scum/foam, plant occlusions, low wave energy
Below: very low visibility; scattering heavy

Effects

Turbidity heavy; floating debris/scum layer (optional)

Caustics off

Validation

SCENE.MARSH.SHALLOW_MURK_AND_PLANTS

4) Code — environment presets (TS)
src/water/presets/environmentPresets.ts
import { WaterLightingPreset } from "../lighting/presets/lightingPresets";
import { HardwareTier } from "../perf/BudgetConfig";

export type WaveSystem = "L1_GERSTNER" | "L2_FFT" | "L3_SWE";
export type EffectsSet = {
  foam: boolean;
  spray: boolean;
  bubbles: boolean;
  turbidity: boolean;
  wetness: boolean;
  caustics: boolean;
  underwaterVolumetrics: boolean;
};

export interface EnvironmentPreset {
  id: string;
  name: string;

  waveSystem: WaveSystem;
  waveBands: {
    swell: { enabled: boolean; dirSpread: number; energy: number };
    chop:  { enabled: boolean; dirSpread: number; energy: number };
    ripple:{ enabled: boolean; energy: number; normalsOnly: true };
  };

  currents: { enabled: boolean; strength: number; field: "none" | "uniform" | "texture" | "swe"; };

  breaking: {
    enabled: boolean;
    mode: "whitecaps" | "nearshore" | "impact" | "waterfall";
    // Genesis requirements: SF0/SF1 must exist when enabled
    requiresSpawnFields: boolean;
    // Soft budget hints; hard caps come from BudgetConfig
    targetEventsPerSec: number;
  };

  lightingPresetId: WaterLightingPreset["id"];

  effects: EffectsSet;

  shoreline: { enabled: boolean; type?: "sand" | "rock" | "cliff" | "manmade" };

  // Default recommended tier (can be overridden by runtime detection)
  recommendedHardwareTier: HardwareTier;

  validationScenes: string[];
}

export const ENV_PRESETS: EnvironmentPreset[] = [
  {
    id: "ENV.COAST.SAND_BEACH_SURF",
    name: "Sand beach surf zone",
    waveSystem: "L3_SWE",
    waveBands: {
      swell: { enabled: true, dirSpread: 0.2, energy: 0.8 },
      chop:  { enabled: true, dirSpread: 0.6, energy: 0.6 },
      ripple:{ enabled: true, energy: 0.7, normalsOnly: true },
    },
    currents: { enabled: true, strength: 0.5, field: "swe" },
    breaking: { enabled: true, mode: "nearshore", requiresSpawnFields: true, targetEventsPerSec: 6 },
    lightingPresetId: "LIGHT.GOLDEN_HOUR_OCEAN",
    effects: { foam: true, spray: true, bubbles: true, turbidity: true, wetness: true, caustics: false, underwaterVolumetrics: true },
    shoreline: { enabled: true, type: "sand" },
    recommendedHardwareTier: "H1",
    validationScenes: ["SCENE.SURF.LINEUP_TYPES", "SCENE.BEACH.RUNUP_FILM", "SCENE.BEACH.FOAM_STRANDLINE"],
  },
  // Add the rest of the ENV.* presets mirroring the cards above
];

src/water/presets/applyEnvironmentPreset.ts
import { EnvironmentPreset } from "./environmentPresets";
import { LIGHTING_PRESETS } from "../lighting/presets/lightingPresets";

export function applyEnvironmentPreset(p: EnvironmentPreset) {
  const lighting = LIGHTING_PRESETS.find(x => x.id === p.lightingPresetId);
  if (!lighting) throw new Error(`Missing lighting preset: ${p.lightingPresetId}`);

  // 1) Wave system selection (L1/L2/L3)
  // - configure spectrum bands, direction spreads, and ensure ripple is normals-only
  // 2) Currents/flow field selection
  // 3) Breaking config: if enabled, assert spawn fields exist (SF0/SF1)
  // 4) Optics: set ior/absorption/scattering/phase; caustics policy from lighting + env
  // 5) Effects toggles + default budgets
  // 6) Shoreline mode: wetness + runup/backwash rules if enabled
}

5) Validation checklist (environment library)
Visual sweeps

Above-water read: horizon reflections (ocean), surf line (beach), anchored features (rapids), caustics (pool/tropics)

Underwater read: visibility curve matches preset (clear vs murky), waterline transition seamless

Effects causality: foam/spray/bubbles only where violence exists (breakers, impacts, jumps)

Perf/no-stall

Switching environments cannot silently add passes beyond tier caps

Hybrid events respect event/particle caps; fallbacks kick in predictably

No GPU readbacks introduced

Regression safety

Toggling between environments must not “change physics categories” (ripples stay shading-only, etc.)

Every ENV preset has at least one canonical validation scene you can run headless

6) Telemetry/debug views added (for the Environment Preset system)

DEBUG.ENV_PRESET: current ENV id + wave system tier + lighting preset id

DEBUG.BANDS: swell/chop/ripple energy (ripple flagged normals-only)

DEBUG.BREAKING: breaking mask + SF0/SF1 parcel vectors (inherit velocity visible)

DEBUG.OPTICS: absorption/scattering/phase, thickness τ, transmittance RGB

DEBUG.EFFECTS: foam F/age/stretch, spray counts, bubble density, turbidity scalar

DEBUG.BUDGET_STATE: pass counts + RT pixels + caps hit + fallback stage






1) What we’re changing (this step)

We’re building the Lighting/Weather Atlas: a combinatorial state space (sun elevation × cloud cover × precipitation × wind × air haze × water turbidity × camera mode) that can generate any condition smoothly.

We’re defining physically consistent blending rules so states crossfade with no preset pop, no double-water look, and no category violations.

We’re adding TS + GLSL plumbing: WeatherState → DerivedUniforms, plus LOD/budget gating rules that automatically cheapen features when visibility is low (storm/fog/murky underwater).

2) Why

“Perfect water” isn’t a list of presets; it’s a continuous manifold of conditions.

The big failure modes you want to prevent are:

Preset pop (parameters blend incorrectly, especially absorption/scattering and reflection sharpness)

Double-water seams (ocean vs splash use different optics or exposure)

Category drift (ripples become displacement, foam becomes paint, spray becomes smoke)

3) The Lighting/Weather Atlas (Index + axes)
3.1 State vector (the “atlas coordinates”)

Define a single struct (all normalized unless noted):

Astronomy / sky

sunElevRad : 
𝜃
𝑠
∈
[
−
𝜋
/
2
,
𝜋
/
2
]
θ
s
	​

∈[−π/2,π/2] (below horizon allowed)

sunVisibility : 
𝑉
𝑠
∈
[
0
,
1
]
V
s
	​

∈[0,1] (clouds hide sun disk)

cloudCover : 
𝐶
∈
[
0
,
1
]
C∈[0,1]

airHaze : 
𝐻
𝑎
∈
[
0
,
1
]
H
a
	​

∈[0,1] (aerosols/fog in air)

moonLevel : 
𝑀
∈
[
0
,
1
]
M∈[0,1] (night brightness driver)

Weather

windSpeedMS : 
𝑊
W (m/s)

gustiness : 
𝐺
∈
[
0
,
1
]
G∈[0,1]

precip : none|rain|snow

precipRate : 
𝑅
𝑝
∈
[
0
,
1
]
R
p
	​

∈[0,1] (normalized intensity)

Water

waterTurbidity : 
𝑇
𝑤
∈
[
0
,
1
]
T
w
	​

∈[0,1] (optical particulates)

waterType : tropical|temperate|river_murky|pool_clear|… (selects baseline absorption/scattering)

tempC (optional) (only matters if you later do steam/mist thresholds)

Camera mode

cameraMode : above|underwater|waterline

3.2 Atlas ID scheme (human-navigable index)

Instead of enumerating every combination, we index by corner anchors + continuous modifiers:

Anchor lighting families (corners)

ANCHOR.DAY.CLEAR

ANCHOR.DAY.OVERCAST

ANCHOR.DAY.STORM

ANCHOR.DUSK.CLEAR

ANCHOR.DUSK.OVERCAST

ANCHOR.NIGHT.CLEAR

ANCHOR.NIGHT.OVERCAST

ANCHOR.NIGHT.URBAN (artificial lights)

Continuous modifiers (orthogonal)

MOD.WIND(W)

MOD.GUST(G)

MOD.HAZE(H_a)

MOD.CLOUD(C)

MOD.PRECIP(type, Rp)

MOD.WATER_TURBIDITY(T_w)

MOD.CAMERA(mode)

This keeps the atlas complete without becoming a million-row table.

4) Physically consistent blending rules (the “no pop” contract)
4.1 Separate what blends linearly vs nonlinearly

Blend these in linear space (safe):

microRoughness, foamCoverage, whitecapGain, sprayOpacity, causticsStrength (with gating)

environment reflection “sharpness” proxy (roughness)

Blend these as coefficients (not colors):

absorption 
𝑎
(
𝜆
)
a(λ) [1/m]

scattering 
𝜎
𝑠
(
𝜆
)
σ
s
	​

(λ) [1/m]

fog density [1/m-ish]

Then compute transmittance after blending:

𝑇
(
𝜆
,
𝑑
)
=
exp
⁡
(
−
𝑎
(
𝜆
)
 
𝑑
)
T(λ,d)=exp(−a(λ)d)

Do NOT blend final underwater color directly between presets; blend the coefficients and recompute the optics. That’s the #1 “underwater pop” fix.

4.2 Monotonic constraint rules (prevents nonsense)

If cloudCover ↑ then sunVisibility ↓ (clamped relationship)

If airHaze ↑ then:

horizon contrast ↓

far reflection detail ↓ (SSR quality drops)

If windSpeedMS ↑ then:

microRoughness ↑

whitecap probability ↑

spindrift emission ↑ (only if wind high AND steepness high)

If waterTurbidity ↑ then:

scattering ↑ strongly

caustics strength ↓ (and maxDepth shrinks)

underwater quality can drop (visibility hides detail)

These monotonic rules are the “physics guardrails” for art direction.

4.3 Gating rules (feature enable/disable without popping)

Instead of hard toggles, use soft gates with smoothstep ramps:

Caustics gate

enable only when sunElevRad > 0 AND sunVisibility high AND waterTurbidity low AND depth < maxDepth.

fade in/out over 1–3 seconds (time smoothing).

SSR gate

reduce SSR with airHaze, cloudCover, and distance tier.

never “snap”: SSRQuality is discrete, so crossfade by blending SSR contribution weight down before lowering the discrete level.

Underwater volumetrics gate

only when camera underwater or waterline in view

if turbidity is high, use cheaper fog (and that’s physically fine)

4.4 Time smoothing (removes preset pop completely)

All high-impact scalars must be critically damped:

absorptionRGB, scatteringRGB, fogDensity, microRoughness, whitecapCoverage, causticsStrength, exposure

Use a standard exponential smoothing:

𝑥
←
𝑥
+
(
𝑥
𝑡
𝑎
𝑟
𝑔
𝑒
𝑡
−
𝑥
)
 
(
1
−
𝑒
−
𝑘
 
𝑑
𝑡
)
x←x+(x
target
	​

−x)(1−e
−kdt
)

Pick larger 
𝑘
k for fast cues (wind roughness), smaller 
𝑘
k for slow cues (water turbidity).

5) Derived parameter model (the engine’s single source of truth)
5.1 Core derived uniforms (shared by ocean + splash)

These must be identical across base ocean and L4 splash layers:

uIor

uAbsorptionRGB (1/m)

uScatteringRGB (1/m)

uPhaseG

uMicroRoughness

uEnvSharpness (optional proxy)

uUnderwaterFogDensity

uExposure (or shared tonemap parameters)

That’s how you avoid “two different waters.”

5.2 Functional relationships (simple, controllable, correct)

Micro roughness from wind

Let 
𝑊
W be wind speed in m/s.

Map to roughness with a saturating curve:

𝑟
=
𝑟
0
+
𝑟
𝑚
𝑎
𝑥
 
(
1
−
𝑒
−
𝑘
𝑤
𝑊
)
r=r
0
	​

+r
max
	​

(1−e
−k
w
	​

W
)

Whitecap probability

Use wind + steepness proxy 
𝑠
=
∣
∇
𝜂
∣
s=∣∇η∣:

𝑝
𝑤
𝑐
=
saturate
(
𝛼
𝑤
 
𝜎
(
𝑊
)
+
𝛼
𝑠
 
𝜎
(
𝑠
−
𝑠
0
)
)
p
wc
	​

=saturate(α
w
	​

σ(W)+α
s
	​

σ(s−s
0
	​

))

Then foam generation uses 
𝑝
𝑤
𝑐
p
wc
	​

 (not a constant “white overlay”).

Caustics depth limit shrink with turbidity

𝑑
𝑚
𝑎
𝑥
=
𝑑
𝑐
𝑙
𝑒
𝑎
𝑟
 
saturate
(
1
−
𝛽
𝑇
𝑤
)
d
max
	​

=d
clear
	​

saturate(1−βT
w
	​

)

Underwater scattering boost from turbidity

𝜎
𝑠
=
𝜎
𝑠
0
+
𝑘
𝑠
 
𝑇
𝑤
σ
s
	​

=σ
s0
	​

+k
s
	​

T
w
	​

6) Code (TS) — WeatherState → DerivedUniforms + blending
src/water/weather/WeatherState.ts
export type CameraMode = "above" | "underwater" | "waterline";
export type PrecipType = "none" | "rain" | "snow";

export interface WeatherState {
  sunElevRad: number;        // [-pi/2..pi/2]
  cloudCover: number;        // [0..1]
  airHaze: number;           // [0..1]
  sunVisibility: number;     // [0..1] (can be derived from cloudCover)
  moonLevel: number;         // [0..1]

  windSpeedMS: number;       // m/s
  gustiness: number;         // [0..1]

  precip: PrecipType;
  precipRate: number;        // [0..1]

  waterTurbidity: number;    // [0..1]
  waterType: string;         // selects baseline optics

  cameraMode: CameraMode;
}

src/water/weather/deriveUniforms.ts
import * as THREE from "three";
import { WeatherState } from "./WeatherState";
import { LIGHTING_PRESETS } from "../lighting/presets/lightingPresets";

// Output uniforms shared by ocean + splash
export interface WaterDerivedUniforms {
  ior: number;
  absorptionRGB: THREE.Vector3;  // 1/m
  scatteringRGB: THREE.Vector3;  // 1/m
  phaseG: number;

  microRoughness: number;

  causticsEnabled: boolean;
  causticsStrength: number;
  causticsMaxDepthM: number;

  ssrWeight: number;             // 0..1 (fade before discrete SSRQuality drop)
  refractWeight: number;         // 0..1

  underwaterFogDensity: number;  // 1/m-ish
  exposure: number;              // simple scalar for now
}

function saturate(x: number) { return Math.min(1, Math.max(0, x)); }
function expSmoother(alphaK: number, dt: number) { return 1 - Math.exp(-alphaK * dt); }

function windToRoughness(w: number, r0: number, rMax: number, k: number) {
  return r0 + rMax * (1 - Math.exp(-k * Math.max(0, w)));
}

export function deriveWaterUniformTargets(w: WeatherState): WaterDerivedUniforms {
  // Pick a baseline optics preset by waterType + anchor family (you can refine this mapping)
  const base = LIGHTING_PRESETS.find(p => p.id === "LIGHT.CLEAR_NOON_OCEAN")!;

  // Derive sun visibility if you want a strict rule (optional override)
  const sunVis = saturate(w.sunVisibility * (1 - 0.85 * w.cloudCover));

  // Start from baseline coefficients
  const absorption = new THREE.Vector3(...base.absorptionRGB);
  const scattering = new THREE.Vector3(...base.scatteringRGB);

  // Apply turbidity: increase scattering strongly, absorption moderately
  const Tw = saturate(w.waterTurbidity);
  scattering.multiplyScalar(1 + 6.0 * Tw);
  absorption.multiplyScalar(1 + 1.2 * Tw);

  // Phase function: murk tends to reduce “laser-forward” feel a bit
  const phaseG = THREE.MathUtils.lerp(base.phaseG, 0.70, Tw);

  // Micro roughness: wind increases roughness; overcast slightly increases perceived roughness too
  const r = windToRoughness(w.windSpeedMS, base.microRoughBase, base.microRoughWind, 0.18);
  const microRoughness = saturate(r + 0.04 * w.cloudCover);

  // Caustics: only meaningful with sun above horizon and visible, and low turbidity
  const sunUp = w.sunElevRad > 0;
  const causticsGate = (sunUp ? 1 : 0) * sunVis * (1 - Tw);
  const causticsEnabled = causticsGate > 0.05;

  const causticsStrength = base.caustics.strength * causticsGate;
  const causticsMaxDepthM = base.caustics.maxDepthM * saturate(1 - 0.7 * Tw);

  // Reflections/SSR: haze + cloud cover reduce useful sharp reflection detail
  const ssrWeight = saturate(1 - (0.6 * w.airHaze + 0.25 * w.cloudCover));
  const refractWeight = saturate(1 - 0.15 * w.airHaze);

  // Underwater fog density: increases with turbidity; also with air haze (stormy water often murkier feel)
  const underwaterFogDensity = base.underwater.fogDensity * (1 + 4.0 * Tw);

  // Exposure: crude starter (you’ll likely replace with your tone mapper)
  const dayFactor = saturate((Math.sin(w.sunElevRad) + 0.1) / 1.1);
  const exposure = THREE.MathUtils.lerp(0.4, 1.0, dayFactor) * (1 - 0.35 * w.cloudCover);

  return {
    ior: base.ior,
    absorptionRGB: absorption,
    scatteringRGB: scattering,
    phaseG,
    microRoughness,
    causticsEnabled,
    causticsStrength,
    causticsMaxDepthM,
    ssrWeight,
    refractWeight,
    underwaterFogDensity,
    exposure,
  };
}

// Smooth to prevent “preset pop”
export function smoothDerivedUniforms(
  current: WaterDerivedUniforms,
  target: WaterDerivedUniformTargets,
  dt: number
): WaterDerivedUniforms {
  const kFast = expSmoother(8.0, dt);   // wind/roughness-ish
  const kSlow = expSmoother(2.0, dt);   // turbidity/optics-ish

  current.absorptionRGB.lerp(target.absorptionRGB, kSlow);
  current.scatteringRGB.lerp(target.scatteringRGB, kSlow);
  current.phaseG = THREE.MathUtils.lerp(current.phaseG, target.phaseG, kSlow);

  current.microRoughness = THREE.MathUtils.lerp(current.microRoughness, target.microRoughness, kFast);

  current.causticsStrength = THREE.MathUtils.lerp(current.causticsStrength, target.causticsStrength, kFast);
  current.causticsMaxDepthM = THREE.MathUtils.lerp(current.causticsMaxDepthM, target.causticsMaxDepthM, kSlow);
  current.causticsEnabled = target.causticsEnabled; // gate is already smooth via strength

  current.ssrWeight = THREE.MathUtils.lerp(current.ssrWeight, target.ssrWeight, kFast);
  current.refractWeight = THREE.MathUtils.lerp(current.refractWeight, target.refractWeight, kFast);

  current.underwaterFogDensity = THREE.MathUtils.lerp(current.underwaterFogDensity, target.underwaterFogDensity, kSlow);
  current.exposure = THREE.MathUtils.lerp(current.exposure, target.exposure, kSlow);

  current.ior = target.ior;
  return current;
}

type WaterDerivedUniformTargets = WaterDerivedUniforms;

7) Shader integration rule (prevents “double-water”)

Every shader stage (ocean surface, splash/sheets, underwater composite) must reference the same derived uniforms:

uAbsorptionRGB, uScatteringRGB, uPhaseG, uIor, uExposure
If a layer invents its own, you get seams.

Also: SSR contribution should be multiplied by ssrWeight so you can fade SSR out smoothly before dropping discrete quality.

8) Atlas sweeps (canonical validation scenes)

These are not “pretty demos”; they’re continuity tests.

A) Continuous sky sweep

SCENE.ATLAS.SUN_ELEV_SWEEP

ramp sunElevRad from -10° → 70° over 30s

check: no pop in reflections, caustics, exposure

B) Cloud cover sweep

SCENE.ATLAS.CLOUD_SWEEP

ramp cloudCover 0 → 1

check: sunVisibility decreases smoothly; caustics fade out smoothly; SSR weight lowers smoothly

C) Wind sweep

SCENE.ATLAS.WIND_SWEEP

ramp wind 0 → 20 m/s

check: micro roughness rises smoothly; whitecap probability rises; spindrift appears only at high wind + steepness

D) Turbidity sweep (underwater critical)

SCENE.ATLAS.TURBIDITY_SWEEP_UNDERWATER

ramp waterTurbidity 0 → 1

check: visibility collapses smoothly; caustics depth shrinks; underwater gets cheaper without looking like a bug

E) Waterline crossing in changing weather

SCENE.ATLAS.WATERLINE_CROSSING_STORM_TO_CLEAR

switch anchors while camera crosses waterline

check: no “two water” moment (shared optics + exposure)

9) Perf/budget hooks driven by the atlas (free realism)

Weather can legitimately change what’s worth rendering:

High air haze / storm: reduce SSR and refraction quality; emphasize foam/spray silhouettes

High water turbidity: reduce underwater RT tiers; caustics off; cheaper fog works because visibility is low

Overcast: less glint; micro detail can be cheaper mid/far

This is physically motivated and saves performance.







1) What we’re changing

We’re defining a single deterministic render graph that merges ocean + shoreline + effects + underwater into one ordered pipeline.

We’re adding RenderTarget pooling rules (fixed tiers, no accidental RT growth).

We’re adding a “no-new-pass” audit: new passes can’t appear silently—adding one requires an explicit registry entry, budget metadata, and a test/update.

2) Why

Water breaks visually when the order is ambiguous: foam/spray occlude wrong, refraction samples wrong buffers, underwater tint diverges between layers (“double-water”).

Performance breaks when passes and RTs creep. The audit + pool is what prevents slow regressions.

Hybrid rule alignment: genesis is upstream (SF0/SF1 + inherited velocity). The render graph must consume those fields consistently; it must not “patch” missing genesis with post tricks.

3) Implementation steps

Add Pass Registry (IDs + dependencies + cost tags + feature flags).

Add RT Pool (tiered descriptors, hard pixel budgets, reuse by key).

Build the WaterGraphBuilder that:

assembles passes in strict order

applies budgets/fallbacks (H0/H1/H2 × near/mid/far)

emits a final WaterComposite texture (or directly draws into main target).

Add Audit:

runtime: pass count + RT pixels must be ≤ caps

build-time test: registry IDs must match a golden snapshot

Add debug overlays: pass list, RT pool usage, fallback stage, key textures.

4) Master deterministic pass graph
Naming conventions

SIM = produces fields (η, ∇η, u, BAT, SF0/SF1, foam F, turbidity T…)

RENDER = draws geometry into color/depth

COMPOSE = fullscreen resolves and blends

Global ordering (authoritative)

Phase A — SIM (no framebuffer dependencies)

SIM.WAVES.BASE

L1 Gerstner CPU uniforms or L2 FFT textures or L3 SWE textures

Outputs: HF.eta, HF.grad, optional HF.u, optional HF.etaDot

SIM.BREAKING.PROXIES (BAT)

Inputs: heightfield outputs

Outputs: BAT.breakI, BAT.kappa, BAT.etaDotProxy

SIM.GENESIS.SPAWN_FIELDS (SF0/SF1) (only if breaking enabled)

Inputs: heightfield + BAT + wave velocity model

Outputs: SF0, SF1

SIM.FOAM.UPDATE (ping-pong)

Inputs: BAT.breakI + surface velocity + previous foam

Outputs: FOAM.rt

SIM.TURBIDITY.UPDATE (optional)

Inputs: impacts/bottom interaction + flow

Outputs: TURB.rt (2D or coarse froxel)

SIM.PARTICLES.SPRAY and SIM.PARTICLES.BUBBLES (optional, budgeted)

Inputs: SF0/SF1 + wind + camera tier

Outputs: particle buffers (GPU)

Phase B — SCENE RENDER (your existing pipeline)
7. RENDER.OPAQUE (main scene to SceneColor, SceneDepth)

Output: G.sceneColor, G.sceneDepth

Phase C — WATER RENDER (deterministic blending)
8. RENDER.WATER.SURFACE (forward draw, writes depth if needed)

Samples: heightfield, normals, env/SSR inputs, foam (for roughness modulation)

Output: W.surfaceColor (either direct to main target or to RT)

RENDER.WATER.THICKNESS (only when needed)

Splash/sheets thickness or screen-space fluid thickness

Output: W.thickness

COMPOSE.WATER.REFRACT_ABSORB_SCATTER (underwater transmissive component)

Inputs: G.sceneColor, G.sceneDepth, W.thickness?, shared optics uniforms

Output: W.transmit

COMPOSE.WATER.CAUSTICS (conditional)

Inputs: caustics tex + depth + turbidity gate

Output: W.caustics (or inline add into W.transmit)

COMPOSE.WATER.FOAM

Inputs: FOAM.rt, lighting, view angle

Output: W.foamLayer (premultiplied)

RENDER.WATER.SPRAY_MIST (draw particles, additive/alpha)

Output: W.sprayLayer

COMPOSE.WATER.FINAL (the one authoritative composite)

Inputs: surface reflection term + W.transmit + W.foamLayer + W.sprayLayer

Output: W.finalColor (blended into main target)

Determinism rules

All water-related fullscreen passes are executed in the above order only.

Anything that needs refraction samples must sample G.sceneColor (opaque-only) or W.surfaceColor (if you intentionally want self-refraction)—but you must pick one and keep it consistent per feature flag.

Foam is composited after transmit and before spray (foam occludes transmit; spray sits in air).

5) RT Pooling + “no-new-pass” audit
RT Pool rules (hard)

Every RT is allocated through the pool via a descriptor key:

(name, format, type, width, height, mip, samples)

Width/height must be expressed as tier scalars: 1/1, 1/2, 1/4 of screen (or fixed squares for foam).

The pool tracks total pixel area and refuses allocations beyond the tier’s rtPixelsMaxMultiplier.

Pass Registry rules (hard)

Every pass has:

id, phase, featureFlag, deps[], produces[], costTags[]

The builder can only execute passes that exist in the registry.

A test asserts the registry IDs match a golden snapshot (pass_registry.golden.json). If you add a pass, the test forces you to acknowledge it.

6) Code (TS / three.js) — file boundaries
src/water/graph/PassTypes.ts
export type PassPhase = "SIM" | "RENDER" | "COMPOSE";
export type FeatureFlag =
  | "wavesL1" | "wavesL2" | "wavesL3"
  | "breaking" | "spawnFields"
  | "foam" | "spray" | "bubbles" | "turbidity"
  | "underwater" | "caustics" | "ssr";

export interface PassDef {
  id: string;
  phase: PassPhase;
  flag?: FeatureFlag;              // pass runs only if enabled
  deps: string[];                  // other pass IDs
  produces: string[];              // symbolic outputs (e.g. "HF.eta", "FOAM.rt")
  costTags: string[];              // ["fsPass","rtHalf","particles"]
}

src/water/graph/PassRegistry.ts
import { PassDef } from "./PassTypes";

export const PASS_REGISTRY: PassDef[] = [
  { id: "SIM.WAVES.BASE", phase: "SIM", deps: [], produces: ["HF.eta","HF.grad"], costTags: ["sim"] },
  { id: "SIM.BREAKING.PROXIES", phase: "SIM", flag: "breaking", deps: ["SIM.WAVES.BASE"], produces: ["BAT.breakI"], costTags: ["sim"] },
  { id: "SIM.GENESIS.SPAWN_FIELDS", phase: "SIM", flag: "spawnFields", deps: ["SIM.BREAKING.PROXIES"], produces: ["SF0","SF1"], costTags: ["sim"] },
  { id: "SIM.FOAM.UPDATE", phase: "SIM", flag: "foam", deps: ["SIM.BREAKING.PROXIES"], produces: ["FOAM.rt"], costTags: ["fsPass","rtFoam"] },

  { id: "RENDER.OPAQUE", phase: "RENDER", deps: [], produces: ["G.sceneColor","G.sceneDepth"], costTags: ["scene"] },
  { id: "RENDER.WATER.SURFACE", phase: "RENDER", deps: ["RENDER.OPAQUE","SIM.WAVES.BASE"], produces: ["W.surfaceColor"], costTags: ["draw"] },

  { id: "RENDER.WATER.THICKNESS", phase: "RENDER", flag: "underwater", deps: ["RENDER.WATER.SURFACE"], produces: ["W.thickness"], costTags: ["draw","rtHalf"] },
  { id: "COMPOSE.WATER.REFRACT_ABSORB_SCATTER", phase: "COMPOSE", flag: "underwater", deps: ["RENDER.OPAQUE"], produces: ["W.transmit"], costTags: ["fsPass","rtHalf"] },
  { id: "COMPOSE.WATER.CAUSTICS", phase: "COMPOSE", flag: "caustics", deps: ["COMPOSE.WATER.REFRACT_ABSORB_SCATTER"], produces: ["W.caustics"], costTags: ["fsPass","rtHalf"] },
  { id: "COMPOSE.WATER.FOAM", phase: "COMPOSE", flag: "foam", deps: ["COMPOSE.WATER.REFRACT_ABSORB_SCATTER","SIM.FOAM.UPDATE"], produces: ["W.foamLayer"], costTags: ["fsPass","rtHalf"] },

  { id: "RENDER.WATER.SPRAY_MIST", phase: "RENDER", flag: "spray", deps: ["SIM.GENESIS.SPAWN_FIELDS"], produces: ["W.sprayLayer"], costTags: ["particles"] },
  { id: "COMPOSE.WATER.FINAL", phase: "COMPOSE", deps: ["RENDER.WATER.SURFACE","COMPOSE.WATER.REFRACT_ABSORB_SCATTER"], produces: ["W.finalColor"], costTags: ["fsPass"] },
];

src/water/rt/RenderTargetPool.ts
import * as THREE from "three";

export type RtKey = string;

export interface RtDesc {
  name: string;
  w: number;
  h: number;
  type: THREE.TextureDataType;
  format: THREE.PixelFormat;
  depth: boolean;
}

function keyOf(d: RtDesc): RtKey {
  return `${d.name}|${d.w}x${d.h}|${d.type}|${d.format}|d${d.depth ? 1 : 0}`;
}

export class RenderTargetPool {
  private pool = new Map<RtKey, THREE.WebGLRenderTarget[]>();
  private inUse = new Set<THREE.WebGLRenderTarget>();
  public pixelsAllocated = 0;

  constructor(private renderer: THREE.WebGLRenderer, private pixelsBudget: number) {}

  acquire(desc: RtDesc): THREE.WebGLRenderTarget {
    const key = keyOf(desc);
    const arr = this.pool.get(key) ?? [];
    let rt = arr.pop();
    if (!rt) {
      const nextPixels = this.pixelsAllocated + desc.w * desc.h;
      if (nextPixels > this.pixelsBudget) {
        throw new Error(`RT budget exceeded: need ${desc.w}x${desc.h}, have ${this.pixelsAllocated}/${this.pixelsBudget}`);
      }
      rt = new THREE.WebGLRenderTarget(desc.w, desc.h, {
        type: desc.type,
        format: desc.format,
        depthBuffer: desc.depth,
        stencilBuffer: false,
      });
      this.pixelsAllocated = nextPixels;
    }
    this.inUse.add(rt);
    return rt;
  }

  release(rt: THREE.WebGLRenderTarget, desc: RtDesc) {
    if (!this.inUse.has(rt)) return;
    this.inUse.delete(rt);
    const key = keyOf(desc);
    const arr = this.pool.get(key) ?? [];
    arr.push(rt);
    this.pool.set(key, arr);
  }

  resetFrame() {
    // sanity: any leaked RTs show as inUse not empty
  }
}

src/water/graph/PassAudit.ts
import { PASS_REGISTRY } from "./PassRegistry";
import { WaterBudgets } from "../perf/BudgetConfig";

export function assertNoUnknownPassIds(activeIds: string[]) {
  const known = new Set(PASS_REGISTRY.map(p => p.id));
  for (const id of activeIds) {
    if (!known.has(id)) throw new Error(`Unknown pass executed: ${id}`);
  }
}

export function assertPassCount(activeIds: string[], budgets: WaterBudgets) {
  // Count fullscreen-ish passes by costTags
  const defs = new Map(PASS_REGISTRY.map(p => [p.id, p]));
  let fs = 0;
  for (const id of activeIds) {
    const d = defs.get(id);
    if (d?.costTags.includes("fsPass")) fs++;
  }
  if (fs > budgets.fullscreenPassesMax) {
    throw new Error(`Water fullscreen passes ${fs} exceed cap ${budgets.fullscreenPassesMax}`);
  }
}

src/water/graph/WaterGraphBuilder.ts
import { PASS_REGISTRY } from "./PassRegistry";
import { FeatureFlag } from "./PassTypes";
import { WaterBudgets } from "../perf/BudgetConfig";

export interface BuildInputs {
  enabled: Partial<Record<FeatureFlag, boolean>>;
  budgets: WaterBudgets;
  distanceTier: "near" | "mid" | "far";
  cameraMode: "above" | "underwater" | "waterline";
}

export function buildPassList(i: BuildInputs): string[] {
  // 1) Filter by flags + camera mode + distance tier
  // 2) Apply fallback order when budgets would be exceeded
  // 3) Topologically order by deps (registry order is already mostly sorted, but we enforce)
  const enabled = (flag?: FeatureFlag) => !flag || !!i.enabled[flag];

  const candidates = PASS_REGISTRY.filter(p => enabled(p.flag));

  // Simple distance gating examples
  const gated = candidates.filter(p => {
    if (i.distanceTier === "far" && (p.id.includes("SPRAY") || p.id.includes("CAUSTICS"))) return false;
    if (i.cameraMode === "above" && p.id.includes("REFRACT_ABSORB_SCATTER")) return false;
    return true;
  });

  // TODO: enforce deps + budget fallback order (disable spray->caustics->SSR->etc.)
  return topoSort(gated.map(p => p.id));
}

function topoSort(ids: string[]): string[] {
  const deps = new Map(PASS_REGISTRY.map(p => [p.id, p.deps]));
  const visited = new Set<string>();
  const out: string[] = [];

  function visit(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    for (const d of deps.get(id) ?? []) if (ids.includes(d)) visit(d);
    out.push(id);
  }

  for (const id of ids) visit(id);
  return out;
}

7) Validation checklist
Visual determinism

Toggle foam/spray/caustics on/off: order must remain correct (foam occludes transmit; spray sits on top).

Waterline crossing: ocean + splash layers share identical optics uniforms (no seam).

Shoreline runup + foam strandline: wetness + foam deposit consistent across frames (no jitter from ordering).

Budget determinism

H0/H1/H2: run worst-case scene and confirm:

fullscreen pass count never exceeds caps

RT pixel budget never exceeds caps

fallback order triggers exactly as specified (spray → caustics → SSR → etc.)

Perf/no-stall

Confirm: no synchronous GPU readbacks introduced in any pass.

Confirm: particle systems cap correctly (no runaway allocations).

Confirm: RT pool has no per-frame allocations once warmed.

8) Telemetry/debug views added

DEBUG.PASS_LIST: ordered list of active pass IDs this frame

DEBUG.RT_POOL: pixelsAllocated / budget + per-descriptor counts

DEBUG.FALLBACK_STAGE: which features were disabled due to caps

DEBUG.WATER_UNIFORMS: absorption/scattering/phase/IOR/exposure shown on screen

DEBUG.SF_DECODE: SF0/SF1 vectors + inherited velocity arrows (genesis sanity)

















) What we’re changing

We’re turning the encyclopedia into a build artifact: a generated JSON knowledge tree + markdown docs + in-engine browser UI.

We’re wiring every Phenomenon Card to (a) code owners (passes, shaders, sims), (b) debug views, and (c) validation scenes so “encyclopedia browsing” = “jump straight to the right test + overlays.”

We’re adding schema validation + registry linting so new features can’t land without a card, a budget tag, and a validation scene.

2) Why

Natural language + math is only useful if it is actionable: you want “look up phenomenon → see required fields → see which pass produces them → toggle debug overlays → run the canonical scene.”

This is also the strongest drift-prevention tool: you can’t “tune feedback” because the UI will show you genesis fields (SF0/SF1 + inherited velocity) are missing.

3) Implementation steps (shippable)

Add schema: EncyclopediaTree.json + PhenomenonCard.json + EnvironmentPreset.json.

Convert your registries into source-of-truth TS objects (cards/presets/pass registry already exist; we extend them with IDs/links).

Add a generator: tools/encyclopedia/build.ts

emits:

public/encyclopedia/tree.json (for runtime UI)

docs/encyclopedia/*.md (human docs)

src/water/encyclopedia/generated/index.ts (typed imports for runtime)

Add an in-engine UI: WaterEncyclopediaPanel.tsx

search, tree navigation, card view

buttons: Run Validation Scene, Toggle Debug Views, Open Owner Files

Add lint/tests:

every referenced sceneId, debugViewId, passId, fieldId must exist

no unknown pass can execute without a registry entry (already started)

Add telemetry hooks so UI shows what’s actually active this frame (passes, budgets, LOD tier, event caps hit).

4) Build artifact design
4.1 Canonical IDs (single namespace, no ambiguity)

Phenomenon cards: WAVE.*, BREAK.*, EFFECT.*, OPTICS.*, SHORELINE.*, FLOW.*, CAMERA.*

Environments: ENV.*

Lighting anchors/modifiers: ANCHOR.*, MOD.*

Passes: SIM.*, RENDER.*, COMPOSE.*

Debug views: DEBUG.*

Validation scenes: SCENE.*

4.2 JSON tree structure (runtime-browsable)

A “tree node” can be a category or a leaf card.

Leaf nodes contain:

summary + cues/anti-cues

required fields (η, ∇η, κ, η̇, u, SF0/SF1, foam F…)

owners: pass IDs + shader chunk IDs + file paths

debug views

validation scenes

sim ladder tiers + LOD/budget tags

5) Code (TS/R3F) — generator + schema + UI browser
5.1 Schema (runtime + lint)
src/water/encyclopedia/schema.ts
export type SimTier = "L0" | "L1" | "L2" | "L3" | "L4" | "L5";
export type Domain = "surface" | "subsurface" | "interface" | "air";

export type FieldId =
  | "eta" | "gradEta" | "kappa" | "etaDot"
  | "uSurface"
  | "BAT.breakI" | "BAT.kappa" | "BAT.etaDotProxy"
  | "SF0" | "SF1"
  | "FOAM.F" | "FOAM.age" | "FOAM.stretch"
  | "THICKNESS.tau"
  | "TURB.T";

export interface OwnerRef {
  passIds?: string[];         // SIM/RENDER/COMPOSE pass IDs
  shaderChunks?: string[];    // e.g. "opticsCore.glsl", "foamUpdate.frag.glsl"
  files?: string[];           // repo-relative paths
}

export interface PhenomenonCard {
  id: string;
  name: string;
  domain: Domain;
  simTiers: SimTier[];

  governingMath: string[];    // LaTeX strings
  cues: string[];
  antiCues: string[];

  requiredFields: FieldId[];
  owner: OwnerRef;

  debugViews: string[];       // DEBUG.*
  validationScenes: string[]; // SCENE.*
  lodBudgets: string[];       // human-readable caps/fallback notes
  tags: string[];             // ["nearshore","breaking","caustics",...]
}

export interface EncyclopediaNode {
  id: string;                 // e.g. "INDEX.WAVE", "WAVE.SURFACE.GRAVITY.DEEP.SWELL"
  title: string;
  kind: "category" | "card";
  children?: EncyclopediaNode[];
  cardRef?: string;           // card ID if kind="card"
}

export interface EncyclopediaTree {
  version: string;
  generatedAtISO: string;
  root: EncyclopediaNode;
  cards: Record<string, PhenomenonCard>;  // id -> card
}

5.2 Generator: TS registries → tree.json + docs/*.md
tools/encyclopedia/build.ts
/* eslint-disable no-console */
import fs from "node:fs";
import path from "node:path";

import { PASS_REGISTRY } from "../../src/water/graph/PassRegistry";
import { WAVE_CARDS } from "../../src/water/encyclopedia/cards/waveCatalog"; // extend to full list
import { LIGHTING_PRESETS } from "../../src/water/lighting/presets/lightingPresets";
import { ENV_PRESETS } from "../../src/water/presets/environmentPresets";

import type { EncyclopediaTree, EncyclopediaNode, PhenomenonCard } from "../../src/water/encyclopedia/schema";

// --- helpers ---
const iso = () => new Date().toISOString();
const outPublic = path.resolve("public/encyclopedia");
const outDocs = path.resolve("docs/encyclopedia");

function ensureDir(p: string) { fs.mkdirSync(p, { recursive: true }); }

function writeJson(file: string, obj: unknown) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2), "utf8");
}

function mdEscape(s: string) {
  return s.replaceAll("\n", " ").replaceAll("|", "\\|");
}

function makeIndexTree(cards: PhenomenonCard[]): EncyclopediaNode {
  // Simple prefix-based tree builder: "WAVE.SURFACE.GRAVITY..." -> nested categories
  const root: EncyclopediaNode = { id: "INDEX.ROOT", title: "Water Encyclopedia", kind: "category", children: [] };

  const ensurePath = (parts: string[]) => {
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const id = "INDEX." + parts.slice(0, i + 1).join(".");
      const title = parts[i];
      node.children ??= [];
      let child = node.children.find(c => c.id === id);
      if (!child) {
        child = { id, title, kind: "category", children: [] };
        node.children.push(child);
      }
      node = child;
    }
    return node;
  };

  for (const c of cards) {
    const parts = c.id.split(".");
    // group by first 2 segments as categories (tunable)
    const groupParts = parts.slice(0, Math.max(1, Math.min(3, parts.length - 1)));
    const parent = ensurePath(groupParts);
    parent.children ??= [];
    parent.children.push({
      id: c.id,
      title: c.name,
      kind: "card",
      cardRef: c.id,
    });
  }
  return root;
}

function validateCrossRefs(tree: EncyclopediaTree) {
  // 1) pass refs exist
  const passIds = new Set(PASS_REGISTRY.map(p => p.id));
  // 2) basic: ensure cards reference only known passes if provided
  for (const card of Object.values(tree.cards)) {
    const refs = card.owner.passIds ?? [];
    for (const pid of refs) {
      if (!passIds.has(pid)) throw new Error(`Card ${card.id} references unknown pass ${pid}`);
    }
  }

  // You can expand here:
  // - validationScenes exist in a SceneRegistry
  // - debugViews exist in DebugRegistry
  // - requiredFields are from FieldId union
}

function renderCardMarkdown(card: PhenomenonCard): string {
  const lines: string[] = [];
  lines.push(`# ${mdEscape(card.name)}`);
  lines.push(`**ID:** \`${card.id}\``);
  lines.push(`**Domain:** ${card.domain}`);
  lines.push(`**Sim tiers:** ${card.simTiers.join(", ")}`);
  lines.push("");
  if (card.governingMath.length) {
    lines.push("## Governing math");
    for (const m of card.governingMath) lines.push(`- ${m}`);
    lines.push("");
  }
  lines.push("## Observable cues");
  for (const s of card.cues) lines.push(`- ${mdEscape(s)}`);
  lines.push("");
  lines.push("## Anti-cues");
  for (const s of card.antiCues) lines.push(`- ${mdEscape(s)}`);
  lines.push("");
  lines.push("## Required fields");
  for (const f of card.requiredFields) lines.push(`- \`${f}\``);
  lines.push("");
  lines.push("## Owners");
  if (card.owner.passIds?.length) lines.push(`- Passes: ${card.owner.passIds.map(x => `\`${x}\``).join(", ")}`);
  if (card.owner.shaderChunks?.length) lines.push(`- Shaders: ${card.owner.shaderChunks.map(x => `\`${x}\``).join(", ")}`);
  if (card.owner.files?.length) lines.push(`- Files: ${card.owner.files.map(x => `\`${x}\``).join(", ")}`);
  lines.push("");
  lines.push("## Debug views");
  for (const d of card.debugViews) lines.push(`- \`${d}\``);
  lines.push("");
  lines.push("## Validation scenes");
  for (const s of card.validationScenes) lines.push(`- \`${s}\``);
  lines.push("");
  lines.push("## LOD/Budgets");
  for (const b of card.lodBudgets) lines.push(`- ${mdEscape(b)}`);
  lines.push("");
  return lines.join("\n");
}

// --- main ---
function main() {
  ensureDir(outPublic);
  ensureDir(outDocs);

  // Merge all cards: start with waves; you’ll append effects/optics/shoreline catalogs similarly
  const cards: PhenomenonCard[] = [
    ...WAVE_CARDS,
    // ...EFFECT_CARDS,
    // ...OPTICS_CARDS,
    // ...SHORELINE_CARDS,
  ] as unknown as PhenomenonCard[];

  const cardsMap: Record<string, PhenomenonCard> = {};
  for (const c of cards) cardsMap[c.id] = c;

  const tree: EncyclopediaTree = {
    version: "0.1.0",
    generatedAtISO: iso(),
    root: makeIndexTree(cards),
    cards: cardsMap,
  };

  validateCrossRefs(tree);

  writeJson(path.join(outPublic, "tree.json"), tree);

  // Emit markdown per card
  for (const c of cards) {
    const md = renderCardMarkdown(c);
    const file = path.join(outDocs, `${c.id}.md`.replaceAll("/", "_"));
    fs.writeFileSync(file, md, "utf8");
  }

  // Also emit a small index summary
  fs.writeFileSync(
    path.join(outDocs, `INDEX.md`),
    `# Water Encyclopedia Index\nGenerated at ${tree.generatedAtISO}\n\n- Cards: ${cards.length}\n- Passes: ${PASS_REGISTRY.length}\n- Env presets: ${ENV_PRESETS.length}\n- Lighting presets: ${LIGHTING_PRESETS.length}\n`,
    "utf8"
  );

  console.log(`Wrote ${cards.length} cards → ${outPublic}/tree.json and ${outDocs}/*.md`);
}

main();


Add it to scripts:

package.json
{
  "scripts": {
    "encyclopedia:build": "ts-node tools/encyclopedia/build.ts"
  }
}

5.3 In-engine Encyclopedia Browser (R3F overlay)
src/water/encyclopedia/ui/WaterEncyclopediaPanel.tsx
import React, { useMemo, useState } from "react";
import type { EncyclopediaTree, EncyclopediaNode, PhenomenonCard } from "../schema";

export interface EncyclopediaUIActions {
  setDebugView(id: string, enabled: boolean): void;
  runScene(sceneId: string): void;
  openFile(path: string): void; // optional: maps to your dev tooling
}

function flattenNodes(node: EncyclopediaNode, out: EncyclopediaNode[] = []) {
  out.push(node);
  for (const c of node.children ?? []) flattenNodes(c, out);
  return out;
}

export function WaterEncyclopediaPanel(props: {
  tree: EncyclopediaTree;
  actions: EncyclopediaUIActions;
  visible: boolean;
  onClose(): void;
}) {
  const { tree, actions, visible, onClose } = props;
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");

  const nodes = useMemo(() => flattenNodes(tree.root), [tree.root]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return nodes.filter(n => n.kind === "card");
    return nodes.filter(n =>
      n.kind === "card" &&
      (n.id.toLowerCase().includes(q) || (n.title ?? "").toLowerCase().includes(q))
    );
  }, [nodes, query]);

  const selectedCard: PhenomenonCard | null = selectedId ? (tree.cards[selectedId] ?? null) : null;

  if (!visible) return null;

  return (
    <div style={{
      position: "absolute", top: 12, left: 12, width: 520, height: 720,
      background: "rgba(0,0,0,0.75)", color: "white", padding: 12,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      overflow: "hidden", borderRadius: 10
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700 }}>Water Encyclopedia</div>
        <button onClick={onClose}>Close</button>
      </div>

      <div style={{ marginTop: 10 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search card ID or name..."
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 10, height: 640 }}>
        {/* results */}
        <div style={{ flex: "0 0 220px", overflow: "auto", border: "1px solid rgba(255,255,255,0.2)", padding: 6 }}>
          {matches.map(n => (
            <div
              key={n.id}
              onClick={() => setSelectedId(n.cardRef ?? n.id)}
              style={{
                cursor: "pointer",
                padding: "4px 6px",
                background: (selectedId === (n.cardRef ?? n.id)) ? "rgba(255,255,255,0.15)" : "transparent"
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.9 }}>{n.title}</div>
              <div style={{ fontSize: 10, opacity: 0.7 }}>{n.id}</div>
            </div>
          ))}
        </div>

        {/* details */}
        <div style={{ flex: 1, overflow: "auto", border: "1px solid rgba(255,255,255,0.2)", padding: 8 }}>
          {!selectedCard ? (
            <div style={{ opacity: 0.75 }}>Select a card.</div>
          ) : (
            <>
              <div style={{ fontWeight: 800 }}>{selectedCard.name}</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>{selectedCard.id}</div>

              <div style={{ fontSize: 12 }}>
                <div><b>Domain:</b> {selectedCard.domain}</div>
                <div><b>Sim tiers:</b> {selectedCard.simTiers.join(", ")}</div>
              </div>

              <hr />

              <div>
                <div style={{ fontWeight: 700 }}>Cues</div>
                <ul>{selectedCard.cues.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>

              <div>
                <div style={{ fontWeight: 700 }}>Anti-cues</div>
                <ul>{selectedCard.antiCues.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>

              <div>
                <div style={{ fontWeight: 700 }}>Required fields</div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>
                  {selectedCard.requiredFields.map(f => <code key={f} style={{ marginRight: 6 }}>{f}</code>)}
                </div>
              </div>

              <hr />

              <div>
                <div style={{ fontWeight: 700 }}>Debug views</div>
                {selectedCard.debugViews.map(d => (
                  <button key={d} onClick={() => actions.setDebugView(d, true)} style={{ marginRight: 6, marginTop: 6 }}>
                    {d}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 10 }}>
                <div style={{ fontWeight: 700 }}>Validation scenes</div>
                {selectedCard.validationScenes.map(s => (
                  <button key={s} onClick={() => actions.runScene(s)} style={{ marginRight: 6, marginTop: 6 }}>
                    Run {s}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 10 }}>
                <div style={{ fontWeight: 700 }}>Owners</div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>
                  {(selectedCard.owner.files ?? []).map(f => (
                    <div key={f}>
                      <button onClick={() => actions.openFile(f)} style={{ marginRight: 6 }}>Open</button>
                      <code>{f}</code>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

Runtime loading (simple path)

public/encyclopedia/tree.json is fetchable.

You can cache it and hot-reload in dev.

src/water/encyclopedia/ui/useEncyclopedia.ts
import { useEffect, useState } from "react";
import type { EncyclopediaTree } from "../schema";

export function useEncyclopedia(url = "/encyclopedia/tree.json") {
  const [tree, setTree] = useState<EncyclopediaTree | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(url).then(r => r.json()).then((j) => { if (alive) setTree(j); });
    return () => { alive = false; };
  }, [url]);

  return tree;
}

6) Encyclopedia ↔ Engine “glue” (the master linkage)
6.1 Registries the UI must talk to

SceneRegistry: maps SCENE.* → scene factory / level loader

DebugRegistry: maps DEBUG.* → debug material/overlay toggles

PassRegistry: already exists; UI can show active pass list each frame

BudgetGovernor: already exists; UI shows caps hit & fallback stage

DerivedUniforms: shared optics state; UI displays absorption/scattering/etc.

6.2 One rule that prevents 90% of drift

If a card requires SF0/SF1, the UI must show:

“SF0/SF1 present?” (yes/no)

“Inherited velocity debug arrows” overlay available
If not present, the card is “blocked,” and you don’t tune feedback.

7) Validation checklist
Visual sweeps

Open panel → pick BREAK.GENESIS.CREST_TO_SHEET

run SCENE.SURF.PLUNGING_BARREL

enable debug overlays: DEBUG.SF_DECODE, DEBUG.BREAKING, DEBUG.PASS_LIST

verify: spawn arrows ride crest; sheet aligns with wave; no seam in optics

Build correctness

yarn encyclopedia:build produces:

public/encyclopedia/tree.json

docs/encyclopedia/INDEX.md

one .md per card

Lint correctness

Any card referencing an unknown passId fails generation.

Any runtime-executed pass not in registry throws via audit.

Perf/no-stall

Panel visible does not add GPU readbacks.

Debug views are L1 (GPU-only) or L0 (CPU counters), with any L2 explicitly throttled.

8) Telemetry/debug views added (to support the browser)

DEBUG.ENCYCLOPEDIA_STATE: selected card ID + required fields present/missing

DEBUG.PASS_LIST: active pass IDs this frame

DEBUG.RT_POOL: pixelsAllocated / budget + RT keys

DEBUG.BUDGET_STATE: caps hit + fallback stage

DEBUG.DERIVED_UNIFORMS: absorption/scattering/phase/IOR/exposure in a small HUD

















OPTICS.INTERFACE.SNELL_REFRACTION

OPTICS.INTERFACE.FRESNEL_REFLECTANCE

OPTICS.INTERFACE.TOTAL_INTERNAL_REFLECTION

OPTICS.INTERFACE.MICROFACET_BRDF

OPTICS.INTERFACE.MICROFACET_BTDF

OPTICS.INTERFACE.SUN_GLINTS_SPECULAR_STREAKS

Water color & volume

OPTICS.VOLUME.ABSORPTION.BEER_LAMBERT

OPTICS.VOLUME.SCATTERING.SINGLE_SCATTER_APPROX

OPTICS.VOLUME.SCATTERING.PHASE_HG

OPTICS.VOLUME.VISIBILITY.CONTRAST_LOSS

OPTICS.VOLUME.GODRAYS.CAMERA_FROXEL_NEAR (near-only tier)

Caustics

OPTICS.CAUSTICS.PROJECTION.SURFACE_NORMAL_DRIVEN

OPTICS.CAUSTICS.DEPTH_LIMIT

OPTICS.CAUSTICS.OCCLUSION.BY_FOAM_THICKNESS

OPTICS.CAUSTICS.COLOR_TINT (from light, not water coeffs)

Waterline / camera transition

OPTICS.WATERLINE.MASK_STABILITY

OPTICS.WATERLINE.SNELL_WINDOW_FEEL

OPTICS.WATERLINE.EXPOSURE_CONTINUITY

OPTICS.WATERLINE.DUAL_MEDIA_FOG_BLEND (air fog ↔ water fog)

Reflections (rendering phenomena)

OPTICS.REFLECTIONS.ENVMAP_PROBE

OPTICS.REFLECTIONS.SSR

OPTICS.REFLECTIONS.PLANAR (only if you consciously allow it)

OPTICS.REFLECTIONS.ROUGHNESS_MIP_MAPPING

OPTICS.REFLECTIONS.HORIZON_FADE_WITH_HAZE

Refraction (rendering phenomena)

OPTICS.REFRACTION.SCREENSPACE_DISTORTION

OPTICS.REFRACTION.THICKNESS_PATH_LENGTH

OPTICS.REFRACTION.DEPTH_RECONSTRUCTION

OPTICS.REFRACTION.SELF_REFRACT_POLICY (explicit choice: opaque-only vs include water)

2.3 SHORELINE catalog (full leaf set)

You already have many; here’s the “complete shoreline spine”:

Swash / beach

SHORELINE.SWASH.RUNUP.THIN_SHEET

SHORELINE.SWASH.BACKWASH.RETURN_FLOW

SHORELINE.SWASH.FOAM_LINE.STRANDLINE

SHORELINE.SWASH.WET_SAND.DARKENING_SHEEN

SHORELINE.SWASH.WET_SAND.DRYING_EDGE_RETREAT

SHORELINE.SWASH.SEDIMENT.SUSPENSION_PLUME

SHORELINE.SWASH.RILLS.RIVULET_NETWORK (optional cinematic)

Rocks/cliffs/structures

SHORELINE.IMPACT.ROCK.SPLASH_SHEET

SHORELINE.IMPACT.ROCK.REBOUND_JET

SHORELINE.IMPACT.CLIFF.SPRAY_CLOUD

SHORELINE.IMPACT.SEAWALL.SLAP_REFLECTION

SHORELINE.IMPACT.PILINGS.WAKE_SHEDDING_PROXY

Tide pools

SHORELINE.TIDEPOOL.FILL_DRAIN

SHORELINE.TIDEPOOL.SLOSH_LOW_MODES

SHORELINE.TIDEPOOL.OPTICS.CAUSTICS_STRONG

SHORELINE.TIDEPOOL.FOAM_RESIDUE_RING

2.4 CAMERA + RENDER “phenomena” (so debugging is first-class)

CAMERA.MODE.ABOVE

CAMERA.MODE.UNDERWATER

CAMERA.MODE.WATERLINE

RENDER.PIPELINE.ORDERING.DETERMINISTIC

RENDER.QUALITY.LOD_DISTANCE_TIERS

RENDER.PERF.NO_STALL_CONTRACT

These cards are what your UI shows when you need to prove the pipeline is correct.

3) Turning these into generator inputs

Create these files (mirroring waveCatalog.ts):

src/water/encyclopedia/cards/effectCatalog.ts

src/water/encyclopedia/cards/opticsCatalog.ts

src/water/encyclopedia/cards/shorelineCatalog.ts

src/water/encyclopedia/cards/cameraCatalog.ts

Each exports EFFECT_CARDS, etc., and you merge them in tools/encyclopedia/build.ts.

Example pattern (short, but do this for every leaf):

// src/water/encyclopedia/cards/opticsCatalog.ts
import type { PhenomenonCard } from "../schema";

export const OPTICS_CARDS: PhenomenonCard[] = [
  {
    id: "OPTICS.VOLUME.ABSORPTION.BEER_LAMBERT",
    name: "Beer–Lambert absorption (water color with distance)",
    domain: "subsurface",
    simTiers: ["L0","L2","L3","L4"],

    governingMath: ["T(\\lambda,d)=\\exp(-a(\\lambda)\\,d)"],
    cues: ["Reds vanish first; distant underwater loses contrast; shallow water looks clearer."],
    antiCues: ["Fixed tint regardless of distance; underwater looks like uniform gray fog."],

    requiredFields: ["THICKNESS.tau"],
    owner: {
      passIds: ["COMPOSE.WATER.REFRACT_ABSORB_SCATTER"],
      shaderChunks: ["opticsCore.glsl", "refractionAbsorbScatter.frag.glsl"],
      files: ["src/water/render/shaders/refractionAbsorbScatter.frag.glsl"]
    },

    debugViews: ["DEBUG.OPTICS"],
    validationScenes: ["SCENE.ATLAS.TURBIDITY_SWEEP_UNDERWATER"],
    lodBudgets: ["Compute transmittance from coefficients; do not blend final underwater color directly."],
    tags: ["underwater","absorption"]
  },
];

4) Scene Harness (deterministic runner)
4.1 Scene registry contract

Each SCENE.* must define:

seed (for deterministic noise)

fixedDt (simulation tick)

warmupFrames (stabilize FFT/RT ping-pong)

captureFrames (frames to capture)

cameraPath (procedural, deterministic)

envPresetId + lighting/atlas state (or sweeps)

src/water/scenes/SceneTypes.ts
export interface SceneContext {
  setEnvironment(id: string): void;
  setWeatherState(partial: any): void; // your WeatherState type
  setDebugView(id: string, on: boolean): void;

  // deterministic clock hook:
  stepFixed(dt: number): void;

  // capture hook (only enabled in CAPTURE mode):
  requestCapture(label: string): void;
}

export interface SceneDef {
  id: string;                // SCENE.*
  name: string;

  seed: number;
  fixedDt: number;
  warmupFrames: number;
  totalFrames: number;

  setup(ctx: SceneContext): void;
  frame(ctx: SceneContext, frameIndex: number): void;
  teardown?(ctx: SceneContext): void;
}

src/water/scenes/SceneRegistry.ts
import type { SceneDef } from "./SceneTypes";
import { sceneAtlasSunElevSweep } from "./atlas/sceneAtlasSunElevSweep";
import { sceneSurfPlungingBarrel } from "./surf/sceneSurfPlungingBarrel";
// ...etc

export const SCENE_REGISTRY: SceneDef[] = [
  sceneAtlasSunElevSweep,
  sceneSurfPlungingBarrel,
  // ...
];

export function getScene(id: string): SceneDef {
  const s = SCENE_REGISTRY.find(x => x.id === id);
  if (!s) throw new Error(`Unknown scene: ${id}`);
  return s;
}

4.2 The runner (fixed dt, deterministic, capture hooks)
src/water/scenes/SceneRunner.ts
import type { SceneDef, SceneContext } from "./SceneTypes";

export class SceneRunner {
  private frameIndex = 0;

  constructor(private scene: SceneDef, private ctx: SceneContext) {}

  start() {
    this.scene.setup(this.ctx);
  }

  tick() {
    const { fixedDt, totalFrames, warmupFrames } = this.scene;

    // Fixed-step sim (decouple from render delta)
    this.ctx.stepFixed(fixedDt);

    // Scene logic (camera paths, sweeps, toggles)
    this.scene.frame(this.ctx, this.frameIndex);

    // Capture schedule: only after warmup
    if (this.frameIndex === warmupFrames || this.frameIndex === totalFrames - 1) {
      this.ctx.requestCapture(`${this.scene.id}_f${this.frameIndex}`);
    }

    this.frameIndex++;
    if (this.frameIndex >= totalFrames) {
      this.scene.teardown?.(this.ctx);
      return false;
    }
    return true;
  }
}

5) CI screenshot diffs (without polluting runtime)
5.1 The rule

Production/runtime: zero capture readbacks.

Capture mode only: allowed to read back only when requested (e.g., 2 frames per scene), and only in a build flagged CAPTURE=1.

5.2 Capture implementation (WebGL readback isolated)

If you want per-canvas captures (not full-page screenshots), do it only behind a flag:

// src/water/capture/CaptureController.ts
export class CaptureController {
  enabled = false; // set true only when CAPTURE=1
  pendingLabel: string | null = null;

  request(label: string) {
    if (!this.enabled) return;
    this.pendingLabel = label;
  }

  // Called after render, only when pendingLabel exists.
  consumeCanvasPNG(canvas: HTMLCanvasElement): { label: string; dataURL: string } | null {
    if (!this.enabled || !this.pendingLabel) return null;
    const label = this.pendingLabel;
    this.pendingLabel = null;

    // This is a GPU readback. OK only in CAPTURE builds and only a few times.
    const dataURL = canvas.toDataURL("image/png");
    return { label, dataURL };
  }
}


Write the PNGs to disk via a small browser-side POST to a local test server, or (simpler) let Playwright do page screenshots.

5.3 Playwright-based CI (simplest, robust)

This avoids custom readback plumbing: Playwright screenshots the page.

tools/ci/runScenesAndCapture.ts
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("artifacts/captures");
fs.mkdirSync(OUT, { recursive: true });

const scenes = [
  "SCENE.ATLAS.SUN_ELEV_SWEEP",
  "SCENE.ATLAS.TURBIDITY_SWEEP_UNDERWATER",
  "SCENE.SURF.PLUNGING_BARREL",
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  for (const sceneId of scenes) {
    await page.goto(`http://localhost:4173/?scene=${encodeURIComponent(sceneId)}&capture=1`);

    // App should set a global when it has finished running and is stable.
    await page.waitForFunction(() => (window as any).__SCENE_DONE__ === true, { timeout: 120000 });

    await page.screenshot({ path: path.join(OUT, `${sceneId}.png`) });
  }

  await browser.close();
})();


Your app side just needs:

read URL param scene

run fixed-step scene harness

set window.__SCENE_DONE__ = true at end

5.4 Image diff (pixelmatch)
tools/ci/diffPngs.ts
import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const GOLD = path.resolve("tools/ci/goldens");
const CAP = path.resolve("artifacts/captures");
const DIFF = path.resolve("artifacts/diffs");

fs.mkdirSync(DIFF, { recursive: true });

function readPng(p: string) {
  return PNG.sync.read(fs.readFileSync(p));
}

let failed = 0;
for (const file of fs.readdirSync(CAP).filter(f => f.endsWith(".png"))) {
  const cap = readPng(path.join(CAP, file));
  const goldPath = path.join(GOLD, file);

  if (!fs.existsSync(goldPath)) {
    console.error(`Missing golden: ${file}`);
    failed++;
    continue;
  }

  const gold = readPng(goldPath);
  if (cap.width !== gold.width || cap.height !== gold.height) {
    console.error(`Size mismatch: ${file}`);
    failed++;
    continue;
  }

  const diff = new PNG({ width: cap.width, height: cap.height });
  const n = pixelmatch(gold.data, cap.data, diff.data, cap.width, cap.height, {
    threshold: 0.08,
    includeAA: true,
  });

  if (n > 0) {
    fs.writeFileSync(path.join(DIFF, file), PNG.sync.write(diff));
    console.error(`Diff pixels ${n}: ${file}`);
    failed++;
  }
}

process.exit(failed ? 1 : 0);


Key determinism requirements (non-negotiable for CI):

fixed dt

deterministic seeds

stable camera path

freeze time-varying noise unless seeded

disable nondeterministic GPU features where possible (or accept small thresholds)

6) “Blocked until genesis is correct” (UI + CI gate)

Add one gating rule into the encyclopedia generator / UI:

If a card requires SF0/SF1, then the corresponding scene must enable DEBUG.SF_DECODE and the harness must assert “spawn fields non-empty” (GPU visual OK; if you absolutely must assert numerically, do it only in CAPTURE/CI mode at low Hz).

This keeps us from drifting into feedback tuning before genesis.

7) Next concrete action to finish the “whole library”

To complete “everything” without hand-writing thousands of lines, do this:

Write one card per leaf ID with:

requiredFields and owner.passIds

2–5 cues + 2–5 anti-cues

1 validation scene

Then run yarn encyclopedia:build and let the UI + lints tell you what’s missing.








1) What we’re changing

We’re locking a complete default SceneRegistry (all SCENE.* IDs) that covers waves/effects/optics/shoreline/environments/budgets/atlas sweeps.

We’re defining a Golden Capture Matrix for H0/H1/H2 so CI runs note-worthy scenes per tier (fast + meaningful).

We’re specifying the exact debug overlay set per scene (so screenshots test invariants, not vibes).

2) Why

You can’t claim “encyclopedia complete” unless every major phenomenon has:

a deterministic validation scene

required debug views

a stable capture plan (golden diffs)

Debug overlays must be deliberate; otherwise CI becomes “pretty picture drift” and misses the real failures (genesis missing, wrong optics coefficients, pass creep).

3) Implementation steps

Add DebugRegistry + canonical overlay IDs (below).

Add SceneRegistry + scene defs (below).

Add CapturePlan (per scene: capture frames + overlays).

Add CI entrypoints:

tools/ci/scenes.h0.json, scenes.h1.json, scenes.h2.json

Playwright runner reads the list for the tier.

Add audit gates:

pass list + RT pool budget must be under caps

if a scene requires SF0/SF1, it must enable DEBUG.SF_DECODE

4) Canonical debug overlay IDs (the “debug vocabulary”)
src/water/debug/DebugIds.ts
export const DEBUG = {
  // Global state
  PASS_LIST: "DEBUG.PASS_LIST",
  RT_POOL: "DEBUG.RT_POOL",
  BUDGET_STATE: "DEBUG.BUDGET_STATE",
  LOD: "DEBUG.LOD",
  ENV_PRESET: "DEBUG.ENV_PRESET",
  DERIVED_UNIFORMS: "DEBUG.DERIVED_UNIFORMS",

  // Waves & breaking
  WAVEFIELDS: "DEBUG.WAVEFIELDS",         // η, |∇η|, κ proxy, η̇ proxy
  BANDS: "DEBUG.BANDS",                   // swell/chop/ripple energy
  BREAKING: "DEBUG.BREAKING",             // break intensity mask, thresholds
  SF_DECODE: "DEBUG.SF_DECODE",           // SF0/SF1 parcel vectors + inherited velocity arrows

  // Effects
  FOAM: "DEBUG.FOAM",                     // F/age/stretch
  SPRAY: "DEBUG.SPRAY",                   // emitters + counts
  BUBBLES: "DEBUG.BUBBLES",               // density + pop rate
  TURBIDITY: "DEBUG.TURBIDITY",           // turbidity scalar + optical multipliers
  WETNESS: "DEBUG.WETNESS",               // terrain wetness W + drying

  // Optics
  OPTICS: "DEBUG.OPTICS",                 // Fresnel, τ/path length, transmittance RGB
  CAUSTICS: "DEBUG.CAUSTICS",             // caustics mask + depth limit + occlusion
  WATERLINE: "DEBUG.WATERLINE",           // waterline mask stability & continuity

  // Shoreline
  SHORE_CONTACT: "DEBUG.SHORE_CONTACT",   // water/terrain intersection mask
  SWASH_VELOCITY: "DEBUG.SWASH_VELOCITY", // nearshore flow arrows
  IMPACT_EVENTS: "DEBUG.IMPACT_EVENTS",   // impact normals + parcel allocation
} as const;

5) SceneRegistry: complete default list + what each scene validates
5.1 Scene categories (complete spine)
Atlas sweeps (continuity / no-pop)

SCENE.ATLAS.SUN_ELEV_SWEEP

SCENE.ATLAS.CLOUD_SWEEP

SCENE.ATLAS.WIND_SWEEP

SCENE.ATLAS.TURBIDITY_SWEEP_UNDERWATER

SCENE.ATLAS.WATERLINE_CROSSING_STORM_TO_CLEAR

Waves (physics “truth table”)

SCENE.WAVES.IMPULSE_RING.DEEP

SCENE.WAVES.IMPULSE_RING.DEPTH_RAMP

SCENE.WAVES.PACKET.DRIFT

SCENE.OCEAN.SWELL.LOW_WIND

SCENE.OCEAN.WINDSEA.GUSTS

SCENE.OCEAN.CROSS_SEA

SCENE.NEARSHORE.SANDBAR_BEND

SCENE.NEARSHORE.SHOALING_RAMP

SCENE.SURF.LINEUP_TYPES (spilling/plunging/surging)

SCENE.BOAT.KELVIN_WAKE

SCENE.BOAT.PLANING_SPRAY

SCENE.CHARACTER.WADE_CROSSING

Effects (causality & lifecycle)

SCENE.FOAM.WHITEcaps_WIND_RAMP

SCENE.FOAM.WAKE_TRAIL_ADVECTION

SCENE.SPRAY.BACKLIT_LIP_PLUME

SCENE.BUBBLES.OBJECT_ENTRY_PLUME

SCENE.TURBIDITY.IMPACT_PLUME_CLEAR_TO_MURKY

SCENE.LANGMUIR.STREAK_LINES

Optics (above/under/waterline)

SCENE.OPTICS.FRESNEL_GRAZING_ORBIT

SCENE.OPTICS.REFRACTION_POOL_FLOOR_GRID

SCENE.POOL_CLEAR_NOON (strong caustics)

SCENE.TROPICAL.SHALLOW_CAUSTICS

SCENE.UNDERWATER.CLEAR_VISIBILITY

SCENE.UNDERWATER.MURKY_VISIBILITY

SCENE.WATERLINE.CROSSING_CLEAR

SCENE.WATERLINE.CROSSING_NIGHT_HARBOR

Shoreline (swash/wetness/impacts)

SCENE.BEACH.RUNUP_FILM

SCENE.BEACH.BACKWASH_STREAKS

SCENE.BEACH.FOAM_STRANDLINE

SCENE.ROCKS.WAVE_IMPACT_SERIES

SCENE.CLIFF.IMPACTS_AND_MIST

SCENE.SEAWALL.SLAP_REFLECTION

SCENE.TIDEPOOL.FILL_DRAIN_CAUSTICS

Environments (one-click presets sanity)

SCENE.ENV.OCEAN_DEEP_OPEN_HORIZON

SCENE.ENV.ESTUARY.SHEAR_LANES

SCENE.ENV.RIVER.RAPIDS_RUN

SCENE.ENV.WATERFALL.CASCADE_PLUNGE

SCENE.ENV.PUDDLE.RAIN_RIPPLES

SCENE.ENV.MARSH.SHALLOW_MURK_AND_PLANTS

Budgets / no-stall / graph determinism

SCENE.BUDGET.WORST_CASE_STORM

SCENE.BUDGET.WORST_CASE_SURF_SHORELINE

SCENE.PIPELINE.PASS_ORDER_AUDIT

SCENE.PIPELINE.RT_POOL_WARMUP_AUDIT

5.2 Exact debug overlay sets per scene (required)
src/water/scenes/DebugOverlaySets.ts
import { DEBUG } from "../debug/DebugIds";

export const OVERLAYS = {
  // Always-on in CI debug captures
  AUDIT: [DEBUG.PASS_LIST, DEBUG.RT_POOL, DEBUG.BUDGET_STATE, DEBUG.LOD, DEBUG.ENV_PRESET],

  // Waves
  WAVE_PHYS: [DEBUG.WAVEFIELDS, DEBUG.BANDS],
  BREAKING_GENESIS: [DEBUG.BREAKING, DEBUG.SF_DECODE],

  // Effects
  FOAM_LIFE: [DEBUG.FOAM],
  SPRAY_LIFE: [DEBUG.SPRAY],
  BUBBLE_LIFE: [DEBUG.BUBBLES],
  TURB_LIFE: [DEBUG.TURBIDITY],

  // Optics
  OPTICS_CORE: [DEBUG.OPTICS, DEBUG.DERIVED_UNIFORMS],
  CAUSTICS_CORE: [DEBUG.CAUSTICS],
  WATERLINE_CORE: [DEBUG.WATERLINE, DEBUG.OPTICS, DEBUG.DERIVED_UNIFORMS],

  // Shoreline
  SHORE_SWASH: [DEBUG.SHORE_CONTACT, DEBUG.SWASH_VELOCITY, DEBUG.WETNESS],
  SHORE_IMPACT: [DEBUG.IMPACT_EVENTS, DEBUG.SF_DECODE, DEBUG.SPRAY, DEBUG.FOAM],
} as const;

Scene → overlay mapping (authoritative)

Atlas sweeps:

SUN_ELEV_SWEEP: AUDIT + OPTICS_CORE + CAUSTICS_CORE

CLOUD_SWEEP: AUDIT + OPTICS_CORE + CAUSTICS_CORE

WIND_SWEEP: AUDIT + WAVE_PHYS + BREAKING (if enabled) + FOAM_LIFE

TURBIDITY_SWEEP_UNDERWATER: AUDIT + OPTICS_CORE + TURB_LIFE

WATERLINE_CROSSING_STORM_TO_CLEAR: AUDIT + WATERLINE_CORE

Breaking/surf:

SURF.LINEUP_TYPES: AUDIT + WAVE_PHYS + BREAKING_GENESIS + FOAM_LIFE + SPRAY_LIFE

NEARSHORE.SHOALING_RAMP: AUDIT + WAVE_PHYS + BREAKING (optional)

Foam lifecycle:

FOAM.WHITEcaps_WIND_RAMP: AUDIT + WAVE_PHYS + FOAM_LIFE

FOAM.WAKE_TRAIL_ADVECTION: AUDIT + FOAM_LIFE + WAVE_PHYS

Optics:

POOL_CLEAR_NOON: AUDIT + OPTICS_CORE + CAUSTICS_CORE

OPTICS.FRESNEL_GRAZING_ORBIT: AUDIT + OPTICS_CORE

WATERLINE.CROSSING_CLEAR: AUDIT + WATERLINE_CORE

Shoreline:

BEACH.RUNUP_FILM: AUDIT + SHORE_SWASH + FOAM_LIFE

ROCKS.WAVE_IMPACT_SERIES: AUDIT + SHORE_IMPACT

Budget/pipeline:

PIPELINE.PASS_ORDER_AUDIT: AUDIT (debug capture is the entire point)

6) SceneDef + capture plan (beauty + debug invariant captures)
6.1 SceneDef extension: capture specs
src/water/scenes/SceneTypes.ts
export interface CaptureSpec {
  frame: number;
  label: string;        // e.g. "beauty_A", "debug_A"
  overlays: string[];   // DEBUG.* ids to enable for this capture
}

export interface SceneDef {
  id: string;
  name: string;

  seed: number;
  fixedDt: number;
  warmupFrames: number;
  totalFrames: number;

  // Optional per-scene environment + weather anchors
  envPresetId?: string;
  cameraMode?: "above" | "underwater" | "waterline";

  captures: CaptureSpec[];

  setup(ctx: any): void;
  frame(ctx: any, frameIndex: number): void;
}

6.2 Example capture policy (standardized)

Every scene has 2 captures:

beauty_A (no overlays) at a representative frame

debug_A (required overlays) at same or nearby frame

7) Full default SceneRegistry (code skeleton with IDs)
src/water/scenes/SceneRegistry.ts
import type { SceneDef } from "./SceneTypes";

// Import actual scene defs (you’ll implement each file gradually)
import { sceneAtlasSunElevSweep } from "./atlas/sceneAtlasSunElevSweep";
import { sceneAtlasCloudSweep } from "./atlas/sceneAtlasCloudSweep";
import { sceneAtlasWindSweep } from "./atlas/sceneAtlasWindSweep";
import { sceneAtlasTurbiditySweepUnderwater } from "./atlas/sceneAtlasTurbiditySweepUnderwater";
import { sceneAtlasWaterlineStormToClear } from "./atlas/sceneAtlasWaterlineStormToClear";

import { sceneWavesImpulseDeep } from "./waves/sceneWavesImpulseDeep";
import { sceneWavesImpulseDepthRamp } from "./waves/sceneWavesImpulseDepthRamp";
import { sceneWavesPacketDrift } from "./waves/sceneWavesPacketDrift";
import { sceneOceanSwellLowWind } from "./ocean/sceneOceanSwellLowWind";
import { sceneOceanWindseaGusts } from "./ocean/sceneOceanWindseaGusts";
import { sceneOceanCrossSea } from "./ocean/sceneOceanCrossSea";
import { sceneNearshoreSandbarBend } from "./nearshore/sceneNearshoreSandbarBend";
import { sceneNearshoreShoalingRamp } from "./nearshore/sceneNearshoreShoalingRamp";
import { sceneSurfLineupTypes } from "./surf/sceneSurfLineupTypes";
import { sceneBoatKelvinWake } from "./wakes/sceneBoatKelvinWake";
import { sceneBoatPlaningSpray } from "./wakes/sceneBoatPlaningSpray";
import { sceneCharacterWadeCrossing } from "./wakes/sceneCharacterWadeCrossing";

import { sceneFoamWhitecapsWindRamp } from "./effects/sceneFoamWhitecapsWindRamp";
import { sceneFoamWakeTrailAdvection } from "./effects/sceneFoamWakeTrailAdvection";
import { sceneSprayBacklitLipPlume } from "./effects/sceneSprayBacklitLipPlume";
import { sceneBubblesObjectEntryPlume } from "./effects/sceneBubblesObjectEntryPlume";
import { sceneTurbidityImpactPlumeClearToMurky } from "./effects/sceneTurbidityImpactPlumeClearToMurky";
import { sceneLangmuirStreakLines } from "./effects/sceneLangmuirStreakLines";

import { sceneOpticsFresnelGrazingOrbit } from "./optics/sceneOpticsFresnelGrazingOrbit";
import { sceneOpticsRefractionPoolFloorGrid } from "./optics/sceneOpticsRefractionPoolFloorGrid";
import { scenePoolClearNoon } from "./optics/scenePoolClearNoon";
import { sceneTropicalShallowCaustics } from "./optics/sceneTropicalShallowCaustics";
import { sceneUnderwaterClearVisibility } from "./optics/sceneUnderwaterClearVisibility";
import { sceneUnderwaterMurkyVisibility } from "./optics/sceneUnderwaterMurkyVisibility";
import { sceneWaterlineCrossingClear } from "./optics/sceneWaterlineCrossingClear";
import { sceneWaterlineCrossingNightHarbor } from "./optics/sceneWaterlineCrossingNightHarbor";

import { sceneBeachRunupFilm } from "./shoreline/sceneBeachRunupFilm";
import { sceneBeachBackwashStreaks } from "./shoreline/sceneBeachBackwashStreaks";
import { sceneBeachFoamStrandline } from "./shoreline/sceneBeachFoamStrandline";
import { sceneRocksWaveImpactSeries } from "./shoreline/sceneRocksWaveImpactSeries";
import { sceneCliffImpactsAndMist } from "./shoreline/sceneCliffImpactsAndMist";
import { sceneSeawallSlapReflection } from "./shoreline/sceneSeawallSlapReflection";
import { sceneTidepoolFillDrainCaustics } from "./shoreline/sceneTidepoolFillDrainCaustics";

import { sceneEnvOceanDeepOpenHorizon } from "./env/sceneEnvOceanDeepOpenHorizon";
import { sceneEnvEstuaryShearLanes } from "./env/sceneEnvEstuaryShearLanes";
import { sceneEnvRiverRapidsRun } from "./env/sceneEnvRiverRapidsRun";
import { sceneEnvWaterfallCascadePlunge } from "./env/sceneEnvWaterfallCascadePlunge";
import { sceneEnvPuddleRainRipples } from "./env/sceneEnvPuddleRainRipples";
import { sceneEnvMarshShallowMurkPlants } from "./env/sceneEnvMarshShallowMurkPlants";

import { sceneBudgetWorstCaseStorm } from "./budget/sceneBudgetWorstCaseStorm";
import { sceneBudgetWorstCaseSurfShoreline } from "./budget/sceneBudgetWorstCaseSurfShoreline";
import { scenePipelinePassOrderAudit } from "./pipeline/scenePipelinePassOrderAudit";
import { scenePipelineRtPoolWarmupAudit } from "./pipeline/scenePipelineRtPoolWarmupAudit";

export const SCENE_REGISTRY: SceneDef[] = [
  // Atlas sweeps
  sceneAtlasSunElevSweep,
  sceneAtlasCloudSweep,
  sceneAtlasWindSweep,
  sceneAtlasTurbiditySweepUnderwater,
  sceneAtlasWaterlineStormToClear,

  // Waves
  sceneWavesImpulseDeep,
  sceneWavesImpulseDepthRamp,
  sceneWavesPacketDrift,
  sceneOceanSwellLowWind,
  sceneOceanWindseaGusts,
  sceneOceanCrossSea,
  sceneNearshoreSandbarBend,
  sceneNearshoreShoalingRamp,
  sceneSurfLineupTypes,
  sceneBoatKelvinWake,
  sceneBoatPlaningSpray,
  sceneCharacterWadeCrossing,

  // Effects
  sceneFoamWhitecapsWindRamp,
  sceneFoamWakeTrailAdvection,
  sceneSprayBacklitLipPlume,
  sceneBubblesObjectEntryPlume,
  sceneTurbidityImpactPlumeClearToMurky,
  sceneLangmuirStreakLines,

  // Optics
  sceneOpticsFresnelGrazingOrbit,
  sceneOpticsRefractionPoolFloorGrid,
  scenePoolClearNoon,
  sceneTropicalShallowCaustics,
  sceneUnderwaterClearVisibility,
  sceneUnderwaterMurkyVisibility,
  sceneWaterlineCrossingClear,
  sceneWaterlineCrossingNightHarbor,

  // Shoreline
  sceneBeachRunupFilm,
  sceneBeachBackwashStreaks,
  sceneBeachFoamStrandline,
  sceneRocksWaveImpactSeries,
  sceneCliffImpactsAndMist,
  sceneSeawallSlapReflection,
  sceneTidepoolFillDrainCaustics,

  // Environments
  sceneEnvOceanDeepOpenHorizon,
  sceneEnvEstuaryShearLanes,
  sceneEnvRiverRapidsRun,
  sceneEnvWaterfallCascadePlunge,
  sceneEnvPuddleRainRipples,
  sceneEnvMarshShallowMurkPlants,

  // Budgets / pipeline
  sceneBudgetWorstCaseStorm,
  sceneBudgetWorstCaseSurfShoreline,
  scenePipelinePassOrderAudit,
  scenePipelineRtPoolWarmupAudit,
];

export function getScene(id: string): SceneDef {
  const s = SCENE_REGISTRY.find(x => x.id === id);
  if (!s) throw new Error(`Unknown scene: ${id}`);
  return s;
}

8) Golden Capture Matrix (H0/H1/H2)

Rule: H0 runs the smallest set that still proves correctness; H2 runs the whole “truth table.”

tools/ci/scenes.h0.json
{
  "viewport": [1280, 720],
  "scenes": [
    "SCENE.WAVES.IMPULSE_RING.DEPTH_RAMP",
    "SCENE.OCEAN.WINDSEA.GUSTS",
    "SCENE.SURF.LINEUP_TYPES",
    "SCENE.OPTICS.FRESNEL_GRAZING_ORBIT",
    "SCENE.WATERLINE.CROSSING_CLEAR",
    "SCENE.UNDERWATER.MURKY_VISIBILITY",
    "SCENE.BEACH.RUNUP_FILM",
    "SCENE.BUDGET.WORST_CASE_STORM",
    "SCENE.PIPELINE.PASS_ORDER_AUDIT"
  ]
}

tools/ci/scenes.h1.json
{
  "viewport": [1280, 720],
  "scenes": [
    "SCENE.ATLAS.CLOUD_SWEEP",
    "SCENE.ATLAS.WIND_SWEEP",
    "SCENE.WAVES.IMPULSE_RING.DEPTH_RAMP",
    "SCENE.WAVES.PACKET.DRIFT",
    "SCENE.OCEAN.CROSS_SEA",
    "SCENE.NEARSHORE.SHOALING_RAMP",
    "SCENE.SURF.LINEUP_TYPES",
    "SCENE.FOAM.WHITEcaps_WIND_RAMP",
    "SCENE.SPRAY.BACKLIT_LIP_PLUME",
    "SCENE.BUBBLES.OBJECT_ENTRY_PLUME",
    "SCENE.TROPICAL.SHALLOW_CAUSTICS",
    "SCENE.WATERLINE.CROSSING_CLEAR",
    "SCENE.BEACH.FOAM_STRANDLINE",
    "SCENE.ROCKS.WAVE_IMPACT_SERIES",
    "SCENE.BUDGET.WORST_CASE_SURF_SHORELINE",
    "SCENE.PIPELINE.RT_POOL_WARMUP_AUDIT"
  ]
}

tools/ci/scenes.h2.json
{
  "viewport": [1920, 1080],
  "scenes": [
    "SCENE.ATLAS.SUN_ELEV_SWEEP",
    "SCENE.ATLAS.CLOUD_SWEEP",
    "SCENE.ATLAS.WIND_SWEEP",
    "SCENE.ATLAS.TURBIDITY_SWEEP_UNDERWATER",
    "SCENE.ATLAS.WATERLINE_CROSSING_STORM_TO_CLEAR",

    "SCENE.WAVES.IMPULSE_RING.DEEP",
    "SCENE.WAVES.IMPULSE_RING.DEPTH_RAMP",
    "SCENE.WAVES.PACKET.DRIFT",
    "SCENE.OCEAN.SWELL.LOW_WIND",
    "SCENE.OCEAN.WINDSEA.GUSTS",
    "SCENE.OCEAN.CROSS_SEA",
    "SCENE.NEARSHORE.SANDBAR_BEND",
    "SCENE.NEARSHORE.SHOALING_RAMP",
    "SCENE.SURF.LINEUP_TYPES",
    "SCENE.BOAT.KELVIN_WAKE",
    "SCENE.BOAT.PLANING_SPRAY",
    "SCENE.CHARACTER.WADE_CROSSING",

    "SCENE.FOAM.WHITEcaps_WIND_RAMP",
    "SCENE.FOAM.WAKE_TRAIL_ADVECTION",
    "SCENE.TURBIDITY.IMPACT_PLUME_CLEAR_TO_MURKY",
    "SCENE.LANGMUIR.STREAK_LINES",

    "SCENE.OPTICS.FRESNEL_GRAZING_ORBIT",
    "SCENE.OPTICS.REFRACTION_POOL_FLOOR_GRID",
    "SCENE.POOL_CLEAR_NOON",
    "SCENE.TROPICAL.SHALLOW_CAUSTICS",
    "SCENE.UNDERWATER.CLEAR_VISIBILITY",
    "SCENE.UNDERWATER.MURKY_VISIBILITY",
    "SCENE.WATERLINE.CROSSING_CLEAR",
    "SCENE.WATERLINE.CROSSING_NIGHT_HARBOR",

    "SCENE.BEACH.RUNUP_FILM",
    "SCENE.BEACH.BACKWASH_STREAKS",
    "SCENE.BEACH.FOAM_STRANDLINE",
    "SCENE.ROCKS.WAVE_IMPACT_SERIES",
    "SCENE.CLIFF.IMPACTS_AND_MIST",
    "SCENE.SEAWALL.SLAP_REFLECTION",
    "SCENE.TIDEPOOL.FILL_DRAIN_CAUSTICS",

    "SCENE.ENV.OCEAN_DEEP_OPEN_HORIZON",
    "SCENE.ENV.ESTUARY.SHEAR_LANES",
    "SCENE.ENV.RIVER.RAPIDS_RUN",
    "SCENE.ENV.WATERFALL.CASCADE_PLUNGE",
    "SCENE.ENV.PUDDLE.RAIN_RIPPLES",
    "SCENE.ENV.MARSH.SHALLOW_MURK_AND_PLANTS",

    "SCENE.BUDGET.WORST_CASE_STORM",
    "SCENE.BUDGET.WORST_CASE_SURF_SHORELINE",
    "SCENE.PIPELINE.PASS_ORDER_AUDIT",
    "SCENE.PIPELINE.RT_POOL_WARMUP_AUDIT"
  ]
}

9) Exact capture overlays per scene (beauty + debug)

Contract: each scene defines captures[]. Standard pattern:

Capture A (beauty): overlays []

Capture B (debug): overlays = AUDIT + scene-specific overlays

Example: SCENE.SURF.LINEUP_TYPES

beauty_A @ frame 360: overlays []

debug_A @ frame 360: overlays AUDIT + WAVE_PHYS + BREAKING_GENESIS + FOAM_LIFE + SPRAY_LIFE

Example: SCENE.ATLAS.TURBIDITY_SWEEP_UNDERWATER

beauty_A @ frame 480: overlays []

debug_A @ frame 480: overlays AUDIT + OPTICS_CORE + TURB_LIFE

Example: SCENE.PIPELINE.PASS_ORDER_AUDIT

beauty_A @ frame 120: overlays [] (optional)

debug_A @ frame 120: overlays AUDIT (required)

10) Validation checklist
Visual invariants

Dispersion: tells apart deep vs shallow behavior (DEPTH_RAMP).

Genesis: SURF.LINEUP_TYPES must show SF0/SF1 vectors riding the crest (debug capture).

Optics: waterline crossing must not create double-water (shared uniforms visible in debug).

Shoreline: wetness + foam strandline form causally, not as a texture wipe.

Budget: worst-case scenes must trigger fallbacks but keep “water read.”

Perf/no-stall

CI captures are only at a few frames; no readback in hot loops.

Debug overlays are GPU-only; any L2 readback is disabled unless CAPTURE=1 (and throttled).

11) Telemetry/debug views added

DEBUG.AUDIT grouping (pass list + RT pool + budget state) is now a first-class requirement in CI scenes.

Scene runner exposes “active overlays” so the Encyclopedia UI can show: this card’s required debug views are enabled in its validation scene.








1) What we’re changing

We’re defining a single typed SceneControlAPI that every SceneRecipe can drive (impulses, boats, sandbars, shoreline runup, impacts, tidepools, puddle rain, rapids, waterfall, budget stress).

We’re adding a SceneParamApplier that maps recipe.params → concrete engine calls (so implementing scenes is plumbing, not guesswork).

We’re adding hard gates for genesis scenes: if a recipe requires SF0/SF1, the API must be able to verify presence without GPU readback (visual-only L1 debug; optional CI-only L2 micro readback).

2) Why

Recipes are only “zero ambiguity” if the engine exposes precise control knobs.

This is also drift prevention: a surf/genesis scene must be able to:

force a breaker type/strength,

show SF0/SF1 vectors,

and refuse to proceed to “feedback tuning” when genesis fields aren’t live.

3) Implementation steps

Add SceneControlAPI.ts (typed surface area).

Implement SceneContextImpl.ts that adapts your real systems (waves/SWE, foam, spray, shoreline, terrain, boats) to the API.

Add SceneParamApplier.ts (central mapping from params keys to API calls).

Update makeSceneFromRecipe() to:

call ctx.applyParams(recipe.params)

enforce required capabilities for certain scene tags (e.g. surf requires SF0/SF1 support)

Add CI-only optional CAPTURE=1 L2 micro assertions (1×1 reductions, throttled), never in runtime.

4) Code (TS) — the typed SceneControlAPI + param mapping
src/water/scenes/SceneControlAPI.ts
import * as THREE from "three";
import type { WeatherState } from "../weather/WeatherState";

export type CameraMode = "above" | "underwater" | "waterline";

export interface ImpulseSpec {
  atFrame: number;
  amp: number;
  radiusM: number;
  worldXZ?: [number, number];
}

export interface DepthRampSpec {
  deepM: number;
  shallowM: number;
  rampStartXZ: [number, number];
  rampEndXZ: [number, number];
}

export interface SandbarSpec {
  ampM: number;
  widthM: number;
  centerXZ: [number, number];
  incomingDirDeg: number;
}

export interface BoatSpec {
  id: string;
  speedMS: number;
  planing?: boolean;
  wakeStrength?: number;
  sprayBoost?: number;
  path?: { start: [number, number, number]; end: [number, number, number] };
}

export interface CharacterSpec {
  id: string;
  speedMS: number;
  depthM: number;
  path?: { start: [number, number, number]; end: [number, number, number] };
}

export interface SurfControl {
  // For lineup types / genesis tests
  forceType?: "spilling" | "plunging" | "surging";
  breakStrength?: number;      // [0..] scalar
  lipSprayBoost?: number;      // [0..] scalar
  requireSpawnFields?: boolean;// If true, SF0/SF1 must be active
}

export interface ShorelineControl {
  emphasizeBackwash?: boolean;
  wetnessEnabled?: boolean;
  swashStrength?: number;
}

export interface ImpactSeriesSpec {
  enabled: boolean;
  count: number;
  spacingS: number;
  strength?: number;
}

export interface TidepoolSpec {
  enabled: boolean;
  fillPeriodS: number;
  poolDepthM: number;
  causticsBoost?: number;
}

export interface RapidsSpec {
  enabled: boolean;
  currentStrength: number;
  standingWaveStrength?: number;
  aerationBoost?: number;
}

export interface WaterfallSpec {
  enabled: boolean;
  sheetStrength: number;
  mistStrength: number;
  plungeStrength: number;
}

export interface PuddleRainSpec {
  enabled: boolean;
  rate01: number;
  dropRateHz?: number;
  rippleAmp?: number;
}

export interface BudgetStressSpec {
  spawnPressure01?: number;      // pushes event budgets
  forceMaxWhitecaps?: boolean;
  forceSpindrift?: boolean;
  warmupRtPressure?: boolean;
}

export interface SceneControlAPI {
  // Core deterministic control
  setSeed(seed: number): void;
  setEnvironment(id: string): void;
  setWeatherState(partial: Partial<WeatherState>): void;
  setCameraMode(mode: CameraMode): void;
  setCameraPose(pos: THREE.Vector3, lookAt: THREE.Vector3, fov: number): void;

  // Debug overlays (L0/L1 only by default)
  setDebugOverlays(ids: string[]): void;

  // Time/clock
  stepFixed(dt: number): void;

  // ===== Scene knobs =====
  // Waves & geometry
  setDepthRamp?(spec: DepthRampSpec): void;
  setSandbar?(spec: SandbarSpec): void;
  queueImpulse?(spec: ImpulseSpec): void;
  setWaveBandOverrides?(o: { swellEnergy?: number; chopEnergy?: number; rippleEnergy?: number }): void;

  // Breaking / genesis (must not be “fake”)
  setSurfControl?(c: SurfControl): void;
  // Required for genesis validation scenes: must make SF0/SF1 visible (L1 overlay)
  hasSpawnFieldsSupport?(): boolean;

  // Flow / SWE-ish fields
  setCurrentField?(o: { strength: number; mode: "uniform" | "texture" | "swe" }): void;

  // Effects
  setFoamOverrides?(o: { gain?: number; decay?: number; advection?: number }): void;
  setSprayOverrides?(o: { gain?: number; windAdvection?: number }): void;
  setBubbleOverrides?(o: { gain?: number; riseSpeed?: number; popToFoam?: number }): void;
  setTurbidityInjection?(o: { atFrame: number; strength: number; radiusM: number; worldXZ?: [number, number] }): void;

  // Shoreline & impacts
  setShorelineControl?(c: ShorelineControl): void;
  setImpactSeries?(s: ImpactSeriesSpec): void;

  // Special env emitters
  setTidepool?(s: TidepoolSpec): void;
  setRapids?(s: RapidsSpec): void;
  setWaterfall?(s: WaterfallSpec): void;
  setPuddleRain?(s: PuddleRainSpec): void;

  // Actors
  setBoat?(b: BoatSpec): void;
  setCharacter?(c: CharacterSpec): void;

  // Budget stress / pipeline audits
  setBudgetStress?(s: BudgetStressSpec): void;

  // Optional CI-only micro assertions (must be disabled in shipping builds)
  assertCI?(name: string, ok: boolean): void;
}

src/water/scenes/SceneParamApplier.ts

Central mapping from your SceneRecipe.params keys (the ones we used) to API calls.

import type { SceneControlAPI } from "./SceneControlAPI";

export function applyRecipeParams(ctx: SceneControlAPI, params?: Record<string, any>) {
  if (!params) return;

  // ---- Waves / bathymetry ----
  if (params.depthM !== undefined && ctx.setDepthRamp) {
    // If a single depth is specified, you can treat it as a flat ramp.
    ctx.setDepthRamp({
      deepM: params.depthM,
      shallowM: params.depthM,
      rampStartXZ: [0, 0],
      rampEndXZ: [1, 0],
    });
  }

  if (params.depthDeepM !== undefined && params.depthShallowM !== undefined && ctx.setDepthRamp) {
    ctx.setDepthRamp({
      deepM: params.depthDeepM,
      shallowM: params.depthShallowM,
      rampStartXZ: [0, 0],
      rampEndXZ: [120, 0],
    });
  }

  if (params.sandbarAmpM !== undefined && ctx.setSandbar) {
    ctx.setSandbar({
      ampM: params.sandbarAmpM,
      widthM: params.sandbarWidthM ?? 120,
      centerXZ: [0, 0],
      incomingDirDeg: params.incomingDirDeg ?? 25,
    });
  }

  if (params.swellEnergy !== undefined || params.chopEnergy !== undefined || params.rippleEnergy !== undefined) {
    ctx.setWaveBandOverrides?.({
      swellEnergy: params.swellEnergy,
      chopEnergy: params.chopEnergy,
      rippleEnergy: params.rippleEnergy,
    });
  }

  // Impulses
  if (params.impulseAtFrame !== undefined && ctx.queueImpulse) {
    ctx.queueImpulse({
      atFrame: params.impulseAtFrame,
      amp: params.impulseAmp ?? 0.6,
      radiusM: params.impulseRadiusM ?? 8,
      worldXZ: params.impulseWorldXZ,
    });
  }

  // ---- Currents / shear lanes ----
  if (params.currentStrength !== undefined) {
    ctx.setCurrentField?.({ strength: params.currentStrength, mode: "texture" });
  }

  // ---- Surf / breaking genesis ----
  if (params.forcePlunging !== undefined && ctx.setSurfControl) {
    ctx.setSurfControl({ forceType: params.forcePlunging ? "plunging" : undefined, requireSpawnFields: true });
  }
  if (params.breakStrength !== undefined && ctx.setSurfControl) {
    ctx.setSurfControl({ breakStrength: params.breakStrength, requireSpawnFields: true });
  }
  if (params.sprayBoost !== undefined && ctx.setSurfControl) {
    ctx.setSurfControl({ lipSprayBoost: params.sprayBoost, requireSpawnFields: true });
  }

  // ---- Shoreline swash ----
  if (params.emphasizeBackwash !== undefined && ctx.setShorelineControl) {
    ctx.setShorelineControl({ emphasizeBackwash: !!params.emphasizeBackwash, wetnessEnabled: true });
  }

  // ---- Impacts ----
  if (params.impactCount !== undefined && ctx.setImpactSeries) {
    ctx.setImpactSeries({
      enabled: true,
      count: params.impactCount,
      spacingS: params.impactSpacingS ?? 3.0,
      strength: params.impactStrength ?? 1.0,
    });
  }

  // ---- Tidepool ----
  if (params.fillPeriodS !== undefined && ctx.setTidepool) {
    ctx.setTidepool({
      enabled: true,
      fillPeriodS: params.fillPeriodS,
      poolDepthM: params.poolDepthM ?? 0.6,
      causticsBoost: params.causticsBoost ?? 1.0,
    });
  }

  // ---- Bubbles object entry ----
  if (params.dropAtFrame !== undefined) {
    // Your engine decides whether this is a rigid body drop or a scripted entry event.
    // Map to bubbles injection / splash event hooks as you implement them.
    ctx.setBubbleOverrides?.({ gain: 1.0 });
  }

  // ---- Turbidity plume ----
  if (params.impactAtFrame !== undefined && ctx.setTurbidityInjection) {
    ctx.setTurbidityInjection({
      atFrame: params.impactAtFrame,
      strength: params.plumeStrength ?? 1.0,
      radiusM: params.plumeRadiusM ?? 3.0,
    });
  }

  // ---- Boats / characters ----
  if (params.boatSpeedMS !== undefined) {
    ctx.setBoat?.({
      id: "boat0",
      speedMS: params.boatSpeedMS,
      planing: !!params.planing,
      wakeStrength: params.wakeStrength ?? 1.0,
      sprayBoost: params.sprayBoost,
    });
  }
  if (params.charSpeedMS !== undefined) {
    ctx.setCharacter?.({
      id: "char0",
      speedMS: params.charSpeedMS,
      depthM: params.depthM ?? 0.7,
    });
  }

  // ---- Rapids / waterfall / puddle ----
  if (params.aerationBoost !== undefined) {
    ctx.setRapids?.({ enabled: true, currentStrength: params.currentStrength ?? 1.0, aerationBoost: params.aerationBoost });
  }
  if (params.warmupRtPressure !== undefined) {
    ctx.setBudgetStress?.({ warmupRtPressure: !!params.warmupRtPressure });
  }

  // Budget stress knobs
  if (params.spawnPressure !== undefined || params.forceMaxWhitecaps !== undefined || params.forceSpindrift !== undefined) {
    ctx.setBudgetStress?.({
      spawnPressure01: params.spawnPressure ?? 0.0,
      forceMaxWhitecaps: !!params.forceMaxWhitecaps,
      forceSpindrift: !!params.forceSpindrift,
    });
  }
}

src/water/scenes/makeSceneFromRecipe.ts (patch)
import { applyRecipeParams } from "./SceneParamApplier";

// inside setup(ctx):
// ...
applyRecipeParams(ctx, r.params);

// Genesis gate: if recipe intends breaking/genesis, require SF0/SF1 support.
if ((r.params?.forcePlunging || r.params?.breakStrength !== undefined) && ctx.hasSpawnFieldsSupport) {
  if (!ctx.hasSpawnFieldsSupport()) {
    ctx.assertCI?.("spawnFieldsSupport", false);
    throw new Error(`Scene ${r.id} requires SF0/SF1 support (genesis), but engine reports unsupported.`);
  }
}

5) Validation checklist

Genesis scenes (SCENE.SURF.LINEUP_TYPES, SCENE.SPRAY.BACKLIT_LIP_PLUME, rock impacts):

ctx.setSurfControl({ requireSpawnFields:true }) must actually enable SF0/SF1 production (not cosmetic).

Debug capture includes DEBUG.SF_DECODE and shows crest-aligned vectors.

Wave truth table scenes:

queueImpulse produces visible ring behavior; depth ramp changes group/phase characteristics.

Budget stress scenes:

setBudgetStress({spawnPressure01:1}) triggers fallback order, not runaway allocations.

No-stall:

applyRecipeParams must not call any synchronous GPU readback. CI-only assertCI can exist but must be behind CAPTURE=1 and throttled.





1) What we’re changing

Implement MV (minimum viable) scene hooks for the three hardest controls:

Genesis gating: hasSpawnFieldsSupport() + setSurfControl() that actually turns on SF0/SF1-driven genesis (no “fake foam overlays”).

Wave truth-table controls: queueImpulse() + setDepthRamp() (and setSandbar() as the same bathymetry pipe).

Budget stress: setBudgetStress() that pushes caps/fallbacks without adding stalls.

Add one explicit SIM pass: SIM.WAVES.IMPULSE_INJECT (registered; not silent) that injects impulse rings into the heightfield without GPU readback.

2) Why

Your monoliths make the priority unambiguous: Genesis (Step 2.5/2.6) before feedback, and SF0/SF1 is already the canonical mechanism for wave-driven breach/spawn. (Hybrid + Ocean monoliths reference useSpawnField.ts and show genesis as implemented.)

The “truth table” scenes (impulse ring, depth ramp) need deterministic, direct forcing. If you can’t inject an impulse or change bathymetry, you can’t validate dispersion/shoaling/nearshore regimes.

Budget stress must validate the LOD/budget governor + pass audit under pressure, while respecting the no-stall contract (no hot-loop readbacks).

3) Implementation steps

Add a central runtime store for scene-driven overrides:

surf control (breaker type/strength, require SF)

impulse queue

bathymetry field (depth ramp + sandbar)

budget stress scalars

Implement SceneContextImpl that adapts these to your existing systems:

heightfield sim (L1/L2/L3) + bathymetry input

spawn field system (SF0/SF1) + MLS-MPM spawner

budget governor + pass/RT pool audit

Add SIM.WAVES.IMPULSE_INJECT to PassRegistry and build graph (only runs when impulses due).

Add the impulse injection shader (single fullscreen pass into HF.eta ping-pong).

Wire surf control to enable spawn fields and expose hasSpawnFieldsSupport().

4) Code (TS / three.js) — file boundaries
4.1 Scene runtime overrides (single source of truth)
src/water/scenes/runtime/SceneRuntimeState.ts
import type { ImpulseSpec, DepthRampSpec, SandbarSpec, SurfControl, BudgetStressSpec } from "../SceneControlAPI";

export class SceneRuntimeState {
  // Breaking / genesis
  surf: SurfControl = { requireSpawnFields: false };

  // Impulses (ring/bump) scheduled by frame
  impulses: ImpulseSpec[] = [];

  // Bathymetry (optional)
  depthRamp: DepthRampSpec | null = null;
  sandbar: SandbarSpec | null = null;

  // Budget stress
  stress: BudgetStressSpec = {};

  clearForSceneStart() {
    this.surf = { requireSpawnFields: false };
    this.impulses = [];
    this.depthRamp = null;
    this.sandbar = null;
    this.stress = {};
  }
}

4.2 Bathymetry field (depth ramp + sandbar) as a texture

This is the “pipe” setDepthRamp()/setSandbar() writes into.

src/water/bathymetry/BathymetryField.ts
import * as THREE from "three";
import type { DepthRampSpec, SandbarSpec } from "../scenes/SceneControlAPI";

export class BathymetryField {
  readonly res: number;
  readonly tex: THREE.DataTexture;

  // Depth in meters (positive)
  private data: Float32Array;

  constructor(res = 256) {
    this.res = res;
    this.data = new Float32Array(res * res);
    // default: deep water
    this.data.fill(100);

    this.tex = new THREE.DataTexture(this.data, res, res, THREE.RedFormat, THREE.FloatType);
    this.tex.needsUpdate = true;
    this.tex.wrapS = this.tex.wrapT = THREE.ClampToEdgeWrapping;
    this.tex.minFilter = this.tex.magFilter = THREE.LinearFilter;
  }

  setDepthRamp(spec: DepthRampSpec) {
    // Simple linear ramp along a segment in world XZ.
    // For MV, assume world maps to [0..1] across a fixed domain.
    const { deepM, shallowM } = spec;
    const N = this.res;
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const u = i / (N - 1);
        // MV ramp uses u only; you can upgrade to world-projected ramp later.
        const d = deepM + (shallowM - deepM) * u;
        this.data[j * N + i] = Math.max(0.1, d);
      }
    }
    this.tex.needsUpdate = true;
  }

  setSandbar(spec: SandbarSpec) {
    // Sandbar = depth reduced by a Gaussian ridge.
    const N = this.res;
    const { ampM, widthM } = spec;

    // MV: interpret widthM as normalized width; use a fixed scale.
    const sigma = Math.max(1e-3, 0.15); // normalized
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const u = i / (N - 1);
        const v = j / (N - 1);
        const dx = u - 0.5;
        const dy = v - 0.5;
        const r2 = dx * dx + dy * dy;
        const ridge = ampM * Math.exp(-r2 / (2 * sigma * sigma));
        const base = this.data[j * N + i];
        this.data[j * N + i] = Math.max(0.1, base - ridge);
      }
    }
    this.tex.needsUpdate = true;
  }
}


Important: This doesn’t “solve shallow-water physics” by itself; it provides the bathymetry input your L3 SWE / nearshore module uses. The hook is what we’re implementing here.

4.3 Impulse queue + “due now” packing
src/water/waves/ImpulseQueue.ts
import type { ImpulseSpec } from "../scenes/SceneControlAPI";

export class ImpulseQueue {
  private list: ImpulseSpec[] = [];

  queue(spec: ImpulseSpec) {
    this.list.push(spec);
  }

  // Pull impulses scheduled for this frame; keep the rest.
  popDue(frameIndex: number, maxCount: number): ImpulseSpec[] {
    const due: ImpulseSpec[] = [];
    const keep: ImpulseSpec[] = [];
    for (const s of this.list) {
      if (s.atFrame === frameIndex && due.length < maxCount) due.push(s);
      else keep.push(s);
    }
    this.list = keep;
    return due;
  }

  get count() { return this.list.length; }
}

4.4 Fullscreen pass helper
src/water/render/FullscreenPass.ts
import * as THREE from "three";

export class FullscreenPass {
  private scene: THREE.Scene;
  private cam: THREE.OrthographicCamera;
  private mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;

  constructor(private material: THREE.ShaderMaterial) {
    this.scene = new THREE.Scene();
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    this.scene.add(this.mesh);
  }

  render(renderer: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget | null) {
    renderer.setRenderTarget(target);
    renderer.render(this.scene, this.cam);
    renderer.setRenderTarget(null);
  }

  get mat() { return this.material; }
}

4.5 Impulse injection pass (registered, no stalls)

We inject a ring: 
Δ
𝜂
=
𝐴
exp
⁡
(
−
(
𝑟
−
𝑅
)
2
/
(
2
𝜎
2
)
)
Δη=Aexp(−(r−R)
2
/(2σ
2
))

src/water/waves/passes/ImpulseInjectPass.ts
import * as THREE from "three";
import { FullscreenPass } from "../../render/FullscreenPass";
import type { ImpulseSpec } from "../../scenes/SceneControlAPI";

const MAX_IMPULSES = 8;

export class ImpulseInjectPass {
  private pass: FullscreenPass;

  constructor(private renderer: THREE.WebGLRenderer, frag: string) {
    const mat = new THREE.ShaderMaterial({
      vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: frag,
      uniforms: {
        uEtaTex: { value: null as unknown as THREE.Texture },
        uImpulseCount: { value: 0 },
        uImpulses: { value: new Array(MAX_IMPULSES).fill(0).map(() => new THREE.Vector4()) },
        // uImpulses[k] = (x, z, amp, radius) in *UV space* for MV
        uSigma: { value: 0.015 }, // ring thickness in UV units
      },
      depthTest: false,
      depthWrite: false,
    });
    this.pass = new FullscreenPass(mat);
  }

  /**
   * Inject into etaPing -> etaPong (or in-place if your sim supports it).
   * For MV: caller supplies input eta texture and output RT.
   */
  run(inputEta: THREE.Texture, outRT: THREE.WebGLRenderTarget, impulses: ImpulseSpec[]) {
    const count = Math.min(MAX_IMPULSES, impulses.length);
    const arr = this.pass.mat.uniforms.uImpulses.value as THREE.Vector4[];

    for (let i = 0; i < MAX_IMPULSES; i++) arr[i].set(0, 0, 0, 0);
    for (let i = 0; i < count; i++) {
      const s = impulses[i];
      // MV mapping: worldXZ -> UV must be provided by scene/environment. If omitted, center.
      const x = s.worldXZ ? s.worldXZ[0] : 0.5;
      const z = s.worldXZ ? s.worldXZ[1] : 0.5;
      arr[i].set(x, z, s.amp, s.radiusM);
    }

    this.pass.mat.uniforms.uEtaTex.value = inputEta;
    this.pass.mat.uniforms.uImpulseCount.value = count;

    this.pass.render(this.renderer, outRT);
  }
}

src/water/waves/shaders/impulseInject.frag.glsl
precision highp float;
varying vec2 vUv;

uniform sampler2D uEtaTex;
uniform int uImpulseCount;
uniform vec4 uImpulses[8];  // (x,z,amp,radius)
uniform float uSigma;

float ring(float r, float R, float sigma) {
  float d = r - R;
  return exp(-(d*d) / (2.0*sigma*sigma));
}

void main() {
  float eta = texture2D(uEtaTex, vUv).r;

  float add = 0.0;
  for (int i = 0; i < 8; i++) {
    if (i >= uImpulseCount) break;
    vec4 s = uImpulses[i];
    vec2 c = vec2(s.x, s.y);
    float A = s.z;

    // MV: interpret radius in UV units if you pass it that way; otherwise convert upstream.
    float R = s.w;
    float r = length(vUv - c);

    add += A * ring(r, R, uSigma);
  }

  gl_FragColor = vec4(eta + add, 0.0, 0.0, 1.0);
}

4.6 PassRegistry addition (not silent)
src/water/graph/PassRegistry.ts (add)
{ id: "SIM.WAVES.IMPULSE_INJECT", phase: "SIM", flag: "wavesL3", deps: ["SIM.WAVES.BASE"], produces: ["HF.eta"], costTags: ["fsPass","rtHF"] },


GraphBuilder rule: include this pass only when ImpulseQueue.popDue() returns non-empty for the current frame.

4.7 Budget stress hook (pure CPU control, no stalls)
src/water/perf/BudgetGovernor.ts
export interface BudgetStressState {
  spawnPressure01: number;     // 0..1
  forceMaxWhitecaps: boolean;
  forceSpindrift: boolean;
  warmupRtPressure: boolean;
}

export class BudgetGovernor {
  stress: BudgetStressState = {
    spawnPressure01: 0,
    forceMaxWhitecaps: false,
    forceSpindrift: false,
    warmupRtPressure: false,
  };

  setStress(partial: Partial<BudgetStressState>) {
    this.stress = { ...this.stress, ...partial };
  }

  // Example: scale caps by stress (fallback order should still apply)
  getSpawnEventBudgetPerSec(base: number) {
    // push toward cap as stress rises
    return base * (1 + 2.0 * this.stress.spawnPressure01);
  }
}

4.8 SceneContextImpl bridging into your engine

This is the MV implementation of the three hard hooks in SceneControlAPI.

src/water/scenes/SceneContextImpl.ts
import * as THREE from "three";
import type { SceneControlAPI, SurfControl, ImpulseSpec, DepthRampSpec, BudgetStressSpec, SandbarSpec } from "./SceneControlAPI";
import type { WeatherState } from "../weather/WeatherState";
import { SceneRuntimeState } from "./runtime/SceneRuntimeState";
import { ImpulseQueue } from "../waves/ImpulseQueue";
import { BathymetryField } from "../bathymetry/BathymetryField";
import type { BudgetGovernor } from "../perf/BudgetGovernor";

export interface EngineBindings {
  runtime: SceneRuntimeState;

  // Clock
  stepFixed(dt: number): void;
  frameIndex(): number;

  // Environment + weather + camera
  setEnvironment(id: string): void;
  setWeather(partial: Partial<WeatherState>): void;
  setCameraMode(mode: "above" | "underwater" | "waterline"): void;
  setCameraPose(pos: THREE.Vector3, lookAt: THREE.Vector3, fov: number): void;

  // Debug overlays
  setDebugOverlays(ids: string[]): void;

  // Wave sim integration points
  impulseQueue: ImpulseQueue;
  bathymetry: BathymetryField;

  // Spawn fields / genesis integration points
  // (Your codebase references useSpawnField.ts; this is the runtime bridge)
  spawnFieldsEnabled(): boolean;
  setSpawnFieldsEnabled(on: boolean): void;

  // Surf/break config
  setSurfParams(p: { forceType?: string; breakStrength?: number; lipSprayBoost?: number }): void;

  // Budgets
  budgetGovernor: BudgetGovernor;

  // Optional CI
  assertCI?(name: string, ok: boolean): void;
}

export class SceneContextImpl implements SceneControlAPI {
  constructor(private b: EngineBindings) {}

  setSeed(seed: number) { /* bind into your noise/FFT seeds */ }
  setEnvironment(id: string) { this.b.setEnvironment(id); }
  setWeatherState(partial: Partial<WeatherState>) { this.b.setWeather(partial); }
  setCameraMode(mode: "above" | "underwater" | "waterline") { this.b.setCameraMode(mode); }
  setCameraPose(pos: THREE.Vector3, lookAt: THREE.Vector3, fov: number) { this.b.setCameraPose(pos, lookAt, fov); }
  setDebugOverlays(ids: string[]) { this.b.setDebugOverlays(ids); }
  stepFixed(dt: number) { this.b.stepFixed(dt); }

  // ===== Hard hook #1: genesis gating =====
  hasSpawnFieldsSupport() {
    // “Support” means the SF0/SF1 producer exists and can be enabled.
    return typeof this.b.setSpawnFieldsEnabled === "function";
  }

  setSurfControl(c: SurfControl) {
    // IMPORTANT: This only configures genesis inputs. It does NOT tune feedback/BFT.
    this.b.runtime.surf = { ...this.b.runtime.surf, ...c };

    if (c.requireSpawnFields) {
      this.b.setSpawnFieldsEnabled(true);
    }

    this.b.setSurfParams({
      forceType: c.forceType,
      breakStrength: c.breakStrength,
      lipSprayBoost: c.lipSprayBoost,
    });
  }

  // ===== Hard hook #2: wave truth table =====
  queueImpulse(spec: ImpulseSpec) {
    this.b.impulseQueue.queue(spec);
  }

  setDepthRamp(spec: DepthRampSpec) {
    this.b.runtime.depthRamp = spec;
    this.b.bathymetry.setDepthRamp(spec);
  }

  setSandbar(spec: SandbarSpec) {
    this.b.runtime.sandbar = spec;
    this.b.bathymetry.setSandbar(spec);
  }

  // ===== Hard hook #3: budget stress =====
  setBudgetStress(s: BudgetStressSpec) {
    this.b.runtime.stress = { ...this.b.runtime.stress, ...s };
    this.b.budgetGovernor.setStress({
      spawnPressure01: s.spawnPressure01 ?? this.b.budgetGovernor.stress.spawnPressure01,
      forceMaxWhitecaps: !!s.forceMaxWhitecaps,
      forceSpindrift: !!s.forceSpindrift,
      warmupRtPressure: !!s.warmupRtPressure,
    });
  }

  // Optional CI assertion hook (compile/route only in CAPTURE builds)
  assertCI(name: string, ok: boolean) { this.b.assertCI?.(name, ok); }
}

4.9 Where the impulse pass runs (inside your sim tick)

You likely have a “heightfield update” function (monolith mentions useWaterSimulationV1.ts). MV wiring looks like:

src/water/waves/HeightfieldSimController.ts (conceptual patch)
import type { ImpulseQueue } from "./ImpulseQueue";
import type { ImpulseInjectPass } from "./passes/ImpulseInjectPass";

export class HeightfieldSimController {
  constructor(
    private impulses: ImpulseQueue,
    private impulsePass: ImpulseInjectPass
  ) {}

  // Ping-pong RTs holding eta
  etaPingTex!: THREE.Texture;
  etaPongRT!: THREE.WebGLRenderTarget;

  update(frameIndex: number) {
    // ... your SIM.WAVES.BASE step updates etaPingTex/RTs ...

    // Inject impulses ONLY if due this frame (cap for determinism)
    const due = this.impulses.popDue(frameIndex, 8);
    if (due.length) {
      this.impulsePass.run(this.etaPingTex, this.etaPongRT, due);
      // swap ping/pong here in your sim
    }
  }
}

5) Validation checklist
Genesis gating (must pass before any feedback tuning)

Run SCENE.SURF.LINEUP_TYPES debug capture:

Overlays include DEBUG.SF_DECODE and DEBUG.BREAKING.

setSurfControl({ requireSpawnFields:true }) results in:

spawn fields enabled (SF0/SF1 producer running)

SF vectors visibly aligned with crest motion (no “static random arrows”)

Confirm no BFT/feedback parameters are modified by setSurfControl() (genesis-only).

Impulse + depth ramp truth table

SCENE.WAVES.IMPULSE_RING.DEEP:

ring appears and propagates deterministically from the same center/amp.

DEBUG.WAVEFIELDS shows a clean, symmetric disturbance.

SCENE.WAVES.IMPULSE_RING.DEPTH_RAMP (requires L3/nearshore solver to use bathymetry):

wave behavior differs across ramp (shoaling/slowdown/steepening cues).

DEBUG.WAVEFIELDS shows gradient/curvature changes near shallow side.

Budget stress

SCENE.BUDGET.WORST_CASE_STORM:

DEBUG.BUDGET_STATE shows fallback stage transitions.

DEBUG.PASS_LIST does not show unregistered passes.

DEBUG.RT_POOL stays within pixel caps; no per-frame allocations after warmup.

Confirm: no GPU readbacks were added (runtime), and CI capture uses page screenshot (or gated capture only).

6) Telemetry/debug views added

DEBUG.SCENE_RUNTIME (optional HUD):

impulsesQueued, impulsesInjectedThisFrame

spawnFieldsEnabled, requireSpawnFields

stress.spawnPressure01, forceMaxWhitecaps, forceSpindrift

CPU counters (L0):

impulseInjectPassRuns/frame

dueImpulseCount/frame

fallbackStage transitions/frame







## 1) What we’re changing

* We’re upgrading the trigger from **single winner** → **top-K crest events** per frame, written into **EBT slots 0..K-1** with **GPU non-max suppression (NMS)**.
* We’re adding a **breaker classifier** that labels each event as **spilling / plunging / surging / whitecap** using **SF0/SF1 (+ optional bathymetry depth)**, still **GPU-only**.
* We’re binding this to `GenesisPreset.budgets` so events stay **capped + deterministic** (no runaway, no stalls, no silent passes).

---

## 2) Why

* A lineup scene needs **multiple crest parcels** (not just “one best crest”) to look like real surf: several lips forming along the line.
* Top-K + NMS is the simplest, most deterministic, bounded GPU method: **(seed score) → (reduce winner) → (write slot) → (suppress neighborhood)** repeated K times.
* Classification makes EBT self-describing so MLS init can vary ribbon geometry/vel by type (or you can force type via preset).

---

## 3) Implementation steps

1. Replace the current SF seed output with a **score texture** (R=score, G=u, B=v).
2. Add `SFSuppressPass` that zeros score in a radius around the chosen winner UV (NMS).
3. Add `EventWriteSlotPass` that writes **one slot** into EBT while copying other slots from the previous EBT (ping-pong).
4. Update `useBreachTriggerSystem` to loop `k=0..K-1`:

   * reduce → winner1x1
   * write slot k → EBT
   * suppress winner region → score tex
5. Add a deterministic CPU-only `EventRateLimiter` to compute `K_thisFrame` from `GenesisPreset.budgets.eventsPerSec/cooldownS` (no readback).
6. Add debug views: `DEBUG.SF_SCORE`, `DEBUG.EBT_STRIP`, `DEBUG.BREAKER_CLASS`.

---

## 4) Code

### 4.1 Event rate limiter (CPU-only, deterministic, no stall)

`water-showcase-unified/src/engines/oceansimv1/breach/EventRateLimiter.ts`

```ts
export class EventRateLimiter {
  private credit = 0;
  private lastEventTime = -1e9;

  constructor(private eventsPerSec: number, private cooldownS: number) {}

  setParams(eventsPerSec: number, cooldownS: number) {
    this.eventsPerSec = eventsPerSec;
    this.cooldownS = cooldownS;
  }

  // Returns how many slots we’re allowed to fill this frame (0..maxK)
  step(dt: number, timeSec: number, maxK: number): number {
    if (timeSec - this.lastEventTime < this.cooldownS) return 0;

    this.credit += this.eventsPerSec * dt;
    let k = Math.floor(this.credit);
    if (k > 0) {
      this.credit -= k;
      this.lastEventTime = timeSec;
    }
    if (k > maxK) k = maxK;
    return k;
  }
}
```

---

### 4.2 Suppression pass (NMS on the score texture)

`water-showcase-unified/src/engines/oceansimv1/breach/SFSuppressPass.ts`

```ts
import * as THREE from "three";
import { FullscreenPass } from "../render/FullscreenPass";

export class SFSuppressPass {
  private pass: FullscreenPass;

  constructor() {
    const mat = new THREE.ShaderMaterial({
      vertexShader: /* glsl */`
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = vec4(position.xy,0.0,1.0); }
      `,
      fragmentShader: SUPPRESS_FRAG,
      uniforms: {
        uScoreSrc: { value: null as unknown as THREE.Texture }, // RGBA: (score,u,v,_)
        uWinner: { value: null as unknown as THREE.Texture },   // 1x1: (score,u,v,_)
        uRadiusUv: { value: 0.05 },
      },
      depthTest: false, depthWrite: false,
    });
    this.pass = new FullscreenPass(mat);
  }

  run(gl: THREE.WebGLRenderer, scoreSrc: THREE.Texture, winner1x1: THREE.Texture, radiusUv: number, outRT: THREE.WebGLRenderTarget) {
    this.pass.mat.uniforms.uScoreSrc.value = scoreSrc;
    this.pass.mat.uniforms.uWinner.value = winner1x1;
    this.pass.mat.uniforms.uRadiusUv.value = radiusUv;
    this.pass.render(gl, outRT);
  }
}

const SUPPRESS_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;

uniform sampler2D uScoreSrc;
uniform sampler2D uWinner;
uniform float uRadiusUv;

void main(){
  vec4 s = texture2D(uScoreSrc, vUv);
  vec4 w = texture2D(uWinner, vec2(0.5,0.5));
  float best = w.r;
  vec2 uvW = vec2(w.g, w.b);

  // If winner is empty, keep texture as-is (no-op)
  if (best <= 1e-6) { gl_FragColor = s; return; }

  float d = length(vUv - uvW);
  if (d < uRadiusUv) {
    // suppress local neighborhood
    gl_FragColor = vec4(0.0, s.g, s.b, 0.0);
  } else {
    gl_FragColor = s;
  }
}
`;
```

---

### 4.3 Write one EBT slot while preserving others (ping-pong)

`water-showcase-unified/src/engines/oceansimv1/breach/EventWriteSlotPass.ts`

```ts
import * as THREE from "three";
import { FullscreenPass } from "../render/FullscreenPass";

export class EventWriteSlotPass {
  private pass0: FullscreenPass;
  private pass1: FullscreenPass;

  constructor(private EVENT_SLOTS = 8) {
    this.pass0 = new FullscreenPass(new THREE.ShaderMaterial({
      vertexShader: VS,
      fragmentShader: EBT0_SLOT_FRAG.replaceAll("${SLOTS}", String(EVENT_SLOTS)),
      uniforms: {
        uSlotK: { value: 0 },
        uPrev: { value: null as unknown as THREE.Texture },
        uWinner: { value: null as unknown as THREE.Texture }, // 1x1 score,u,v
        uSF0: { value: null as unknown as THREE.Texture },
        uSF1: { value: null as unknown as THREE.Texture },
        uBath: { value: null as unknown as THREE.Texture },   // optional depth (meters)
        uUseBath: { value: 0 },
        uDomainMin: { value: new THREE.Vector2() },
        uDomainSize: { value: new THREE.Vector2() },
        uForceType: { value: 0 },      // 0=auto, else 1..4
      },
      depthTest:false, depthWrite:false,
    }));

    this.pass1 = new FullscreenPass(new THREE.ShaderMaterial({
      vertexShader: VS,
      fragmentShader: EBT1_SLOT_FRAG.replaceAll("${SLOTS}", String(EVENT_SLOTS)),
      uniforms: {
        uSlotK: { value: 0 },
        uPrev: { value: null as unknown as THREE.Texture },
        uWinner: { value: null as unknown as THREE.Texture },
        uSF0: { value: null as unknown as THREE.Texture },
        uSF1: { value: null as unknown as THREE.Texture },
        uTime: { value: 0 },
      },
      depthTest:false, depthWrite:false,
    }));
  }

  run(
    gl: THREE.WebGLRenderer,
    slotK: number,
    prevEBT0: THREE.Texture,
    prevEBT1: THREE.Texture,
    winner1x1: THREE.Texture,
    sf0: THREE.Texture,
    sf1: THREE.Texture,
    domainMinXZ: THREE.Vector2,
    domainSizeXZ: THREE.Vector2,
    timeSec: number,
    outEBT0: THREE.WebGLRenderTarget,
    outEBT1: THREE.WebGLRenderTarget,
    bathTex?: THREE.Texture,
    forceTypeCode: number = 0
  ) {
    // EBT0
    const u0 = this.pass0.mat.uniforms;
    u0.uSlotK.value = slotK;
    u0.uPrev.value = prevEBT0;
    u0.uWinner.value = winner1x1;
    u0.uSF0.value = sf0;
    u0.uSF1.value = sf1;
    u0.uDomainMin.value.copy(domainMinXZ);
    u0.uDomainSize.value.copy(domainSizeXZ);
    u0.uForceType.value = forceTypeCode;
    if (bathTex) { u0.uBath.value = bathTex; u0.uUseBath.value = 1; } else { u0.uUseBath.value = 0; }
    this.pass0.render(gl, outEBT0);

    // EBT1
    const u1 = this.pass1.mat.uniforms;
    u1.uSlotK.value = slotK;
    u1.uPrev.value = prevEBT1;
    u1.uWinner.value = winner1x1;
    u1.uSF0.value = sf0;
    u1.uSF1.value = sf1;
    u1.uTime.value = timeSec;
    this.pass1.render(gl, outEBT1);
  }
}

const VS = /* glsl */`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy,0.0,1.0); }
`;

// EBT0 = (x,z,radius,typeCode + 0.01*energy)
const EBT0_SLOT_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;

uniform int uSlotK;
uniform sampler2D uPrev;
uniform sampler2D uWinner;
uniform sampler2D uSF0;
uniform sampler2D uSF1;

uniform sampler2D uBath;
uniform int uUseBath;

uniform vec2 uDomainMin;
uniform vec2 uDomainSize;
uniform int uForceType;

float sat(float x){ return clamp(x,0.0,1.0); }

vec2 decodeF(vec2 rg){
  vec2 f = rg * 2.0 - 1.0;
  return f / max(1e-4, length(f));
}

// 1=spilling,2=plunging,3=surging,4=whitecap
int classify(float X,float C,float L,float O,float depthM){
  // simple, stable rule set
  float deep = sat((depthM - 2.0) / 10.0); // 0 shallow, 1 deep (optional)
  float plunge = C * L * O;
  float spill  = C * L * (1.0 - O);
  float surge  = C * (1.0 - L) * (1.0 - O);
  float white  = deep * C * X * (1.0 - L);

  float m = spill; int t = 1;
  if (plunge > m) { m = plunge; t = 2; }
  if (surge  > m) { m = surge;  t = 3; }
  if (white  > m) { m = white;  t = 4; }
  return t;
}

void main(){
  float slots = float(${SLOTS});
  float s = floor(vUv.x * slots);

  vec4 prev = texture2D(uPrev, vUv);
  if (int(s) != uSlotK) { gl_FragColor = prev; return; }

  vec4 w = texture2D(uWinner, vec2(0.5,0.5));
  float score = w.r;
  if (score <= 1e-6) { gl_FragColor = vec4(0.0); return; }

  vec2 uv = vec2(w.g, w.b);
  vec4 sf0 = texture2D(uSF0, uv);
  vec4 sf1 = texture2D(uSF1, uv);

  float X = sat(sf0.r);
  float C = sat(sf0.g);
  float L = sat(sf0.b);
  float O = sat(sf0.a);

  float depthM = 5.0;
  if (uUseBath == 1) depthM = texture2D(uBath, uv).r;

  int typeCode = uForceType;
  if (typeCode == 0) typeCode = classify(X,C,L,O,depthM);

  vec2 xz = uDomainMin + uv * uDomainSize;

  float energy = sat(0.7*C + 0.3*X);
  float radius = mix(0.6, 2.6, pow(C, 1.2)); // meters

  gl_FragColor = vec4(xz.x, xz.y, radius, float(typeCode) + 0.01 * energy);
}
`;

// EBT1 = (dirx,dirz,energy,time)
const EBT1_SLOT_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;

uniform int uSlotK;
uniform sampler2D uPrev;
uniform sampler2D uWinner;
uniform sampler2D uSF0;
uniform sampler2D uSF1;
uniform float uTime;

float sat(float x){ return clamp(x,0.0,1.0); }

vec2 decodeF(vec2 rg){
  vec2 f = rg * 2.0 - 1.0;
  return f / max(1e-4, length(f));
}

void main(){
  float slots = float(${SLOTS});
  float s = floor(vUv.x * slots);

  vec4 prev = texture2D(uPrev, vUv);
  if (int(s) != uSlotK) { gl_FragColor = prev; return; }

  vec4 w = texture2D(uWinner, vec2(0.5,0.5));
  float score = w.r;
  if (score <= 1e-6) { gl_FragColor = vec4(0.0); return; }

  vec2 uv = vec2(w.g, w.b);
  vec4 sf0 = texture2D(uSF0, uv);
  vec4 sf1 = texture2D(uSF1, uv);

  float energy = sat(0.7*sf0.g + 0.3*sf0.r);
  vec2 F = decodeF(sf1.rg);

  gl_FragColor = vec4(F.x, F.y, energy, uTime);
}
`;
```

---

### 4.4 Updated `useBreachTriggerSystem`: top-K loop + NMS + EBT ping-pong

`water-showcase-unified/src/engines/oceansimv1/hooks/useBreachTriggerSystem.ts` (core idea)

```ts
import * as THREE from "three";
import { EventBuffer } from "../breach/EventBuffer";
import { SFSeedPass } from "../breach/SFSeedPass";
import { SFReducePass } from "../breach/SFReducePass";
import { SFSuppressPass } from "../breach/SFSuppressPass";
import { EventWriteSlotPass } from "../breach/EventWriteSlotPass";
import { EventRateLimiter } from "../breach/EventRateLimiter";
import type { GenesisPreset } from "../../../water/scenes/genesis/GenesisPreset";

export function useBreachTriggerSystem(gl: THREE.WebGLRenderer, args: {
  enabled: boolean;
  preset: GenesisPreset;
  sf0Tex: THREE.Texture;
  sf1Tex: THREE.Texture;
  sfRes: number;

  // Optional bathymetry depth
  bathTex?: THREE.Texture;

  domainMinXZ: THREE.Vector2;
  domainSizeXZ: THREE.Vector2;

  dt: number;
  timeSec: number;
}) {
  const EVENT_SLOTS = 8;
  const ebtA = new EventBuffer(EVENT_SLOTS);
  const ebtB = new EventBuffer(EVENT_SLOTS);

  const limiter = new EventRateLimiter(args.preset.budgets.eventsPerSec, args.preset.budgets.cooldownS);

  const scoreA = new THREE.WebGLRenderTarget(args.sfRes, args.sfRes, { type: THREE.FloatType, format: THREE.RGBAFormat, depthBuffer:false, stencilBuffer:false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  const scoreB = scoreA.clone();

  const seedPass = new SFSeedPass(gl);       // must accept gates/weights from preset
  const reducePass = new SFReducePass(gl);
  const suppressPass = new SFSuppressPass();
  const writeSlotPass = new EventWriteSlotPass(EVENT_SLOTS);

  // reduction pyramid (same as before)
  const levels: THREE.WebGLRenderTarget[] = [];
  let w = args.sfRes, h = args.sfRes;
  while (w > 1 || h > 1) {
    w = Math.max(1, (w / 2) | 0);
    h = Math.max(1, (h / 2) | 0);
    levels.push(new THREE.WebGLRenderTarget(w, h, { type: THREE.FloatType, format: THREE.RGBAFormat, depthBuffer:false, stencilBuffer:false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter }));
  }

  function clearEBT(rt0: THREE.WebGLRenderTarget, rt1: THREE.WebGLRenderTarget) {
    gl.setRenderTarget(rt0); gl.clearColor(); gl.clear(true, false, false);
    gl.setRenderTarget(rt1); gl.clearColor(); gl.clear(true, false, false);
    gl.setRenderTarget(null);
  }

  function reduceTo1x1(srcTex: THREE.Texture, srcW: number, srcH: number): THREE.Texture {
    let t = srcTex, tw = srcW, th = srcH;
    for (const rt of levels) {
      reducePass.run(gl, t, tw, th, rt);
      t = rt.texture as THREE.Texture;
      tw = rt.width; th = rt.height;
    }
    return t; // 1x1 texture
  }

  function update() {
    if (!args.enabled) return;

    // Update limiter params if preset changed
    limiter.setParams(args.preset.budgets.eventsPerSec, args.preset.budgets.cooldownS);
    const K = limiter.step(args.dt, args.timeSec, Math.min(EVENT_SLOTS, 4)); // MV: cap K<=4 for cost

    // 1) seed score (R=score,G=u,B=v)
    seedPass.setPreset?.(args.preset); // implement: push gates/weights uniforms
    seedPass.run(gl, args.sf0Tex, scoreA);

    // 2) clear EBT (start empty)
    clearEBT(ebtA.ebt0, ebtA.ebt1);

    // 3) top-K loop: winner -> write slot -> suppress -> repeat
    let scoreSrc = scoreA, scoreDst = scoreB;
    let prevEBT = ebtA, nextEBT = ebtB;

    // NMS radius (meters -> UV)
    const minDomain = Math.min(args.domainSizeXZ.x, args.domainSizeXZ.y);
    const nmsRadiusUv = (1.2 / Math.max(1e-3, minDomain)); // ~1.2m default neighborhood

    // Force type if preset.type is explicit; 0=auto classify
    const forceTypeCode = args.preset.type === "spilling" ? 1
      : args.preset.type === "plunging" ? 2
      : args.preset.type === "surging" ? 3
      : args.preset.type === "whitecap" ? 4
      : 0;

    for (let k = 0; k < K; k++) {
      const winner1x1 = reduceTo1x1(scoreSrc.texture as THREE.Texture, args.sfRes, args.sfRes);

      // write slot k into nextEBT from prevEBT
      writeSlotPass.run(
        gl,
        k,
        prevEBT.ebt0.texture,
        prevEBT.ebt1.texture,
        winner1x1,
        args.sf0Tex,
        args.sf1Tex,
        args.domainMinXZ,
        args.domainSizeXZ,
        args.timeSec,
        nextEBT.ebt0,
        nextEBT.ebt1,
        args.bathTex,
        forceTypeCode // set to 0 for auto classify mode scenes
      );

      // suppress around winner for next iteration
      suppressPass.run(gl, scoreSrc.texture as THREE.Texture, winner1x1, nmsRadiusUv, scoreDst);

      // swap
      [prevEBT, nextEBT] = [nextEBT, prevEBT];
      [scoreSrc, scoreDst] = [scoreDst, scoreSrc];
    }

    // After loop, the current events are in prevEBT
    // Expose that as eventBuffer outputs:
    active.eventBuffer.ebt0 = prevEBT.ebt0;
    active.eventBuffer.ebt1 = prevEBT.ebt1;
  }

  const active = { eventBuffer: ebtA, update };
  return active;
}
```

---

### 4.5 MLS side: per-slot spawn (bounded)

In your MLS init step, instead of only slot0, spawn from slots `[0..K-1]` with caps:

* `particlesPerEvent` (from preset)
* `maxParticlesAlive` (global cap)
* optionally per type multipliers (plunge spawns more, whitecaps fewer)

You already have the EBT strip; in init shader, select which slot you’re spawning for via `uSlotK` and run a spawn pass per slot (K passes), or spawn all slots in one pass by splitting particles across slots (more work; keep MV as K passes with small K).

---

## 5) Validation checklist

### Visual sweeps (must hit “crest→sheet”)

* `SCENE.SURF.LINEUP_TYPES` (debug):

  * **K>1** events appear along the lineup (not all stacked).
  * NMS works: events are separated; no “all slots at same UV”.
  * Each event’s spawned sheet **conforms to wave** and inherits wave velocity (fast start).
* Breaker types:

  * Auto classify mode: you can see mixed type codes across slots when conditions vary.
  * Forced preset mode: all events show the preset’s type code.

### Perf / no-stall

* No readbacks; all selection is seed→reduce→write→suppress on GPU.
* Hard caps:

  * `K <= 4` (MV), `EVENT_SLOTS=8`
  * `particlesPerEvent`, `maxParticlesAlive` respected

### Regression safety

* If SF score is empty, EBT stays zero and MLS spawns nothing (stable).

---









1) What we’re changing

We’re adding exact per-type particle quotas (plunging gets more, whitecaps fewer) inside the existing init passes (INIT_POS + INIT_VEL), without adding any new passes.

We’re switching from “slot = mod(idx,K)” to a deterministic quota allocator:

compute per-slot quotas from (typeCode, energy01) in EBT

map each spawning particle index into one slot’s quota range

We’re adding a spawn ring window so we can inject new particles each frame deterministically without GPU readback.

2) Why

You want lineup scenes to look right: plunging lips must be denser/thicker, whitecaps must be sparser/smaller, surging must be thin, spilling moderately dense.

“Probabilistic” per-particle acceptance looks noisy. A quota allocator produces stable, repeatable event density with hard caps.

Still no stalls: everything comes from EBT + SF + heightfield; no counters, no readbacks, no scans.

3) Implementation steps

Add a small uniform block to the init shaders:

uTypeMult4 (4 multipliers)

uBaseParticlesPerEvent

uEnergyPow, uEnergyMin

uSpawnCursor, uSpawnRegionSize, uMaxSlotsSpawn (<=4 MV)

In INIT_POS (and INIT_VEL), compute:

quota[k] = round(base * typeMult[type(k)] * energy(k)^energyPow) (clamped)

total = sum(quota[k])

For each particle index i:

compute ring-relative index r = (i - uSpawnCursor) mod uSpawnRegionSize

if r >= total, don’t spawn (keep previous)

else binary select which slot k owns that r (via cumulative sums)

Use (k, localIndexWithinSlot) to drive the existing ribbon sampling hashes (stable distribution).

CPU updates uSpawnCursor deterministically each frame by a fixed advance (safe, capped). The quotas still control distribution.

4) Code
4.1 Add spawn distribution config (per-type multipliers)
src/water/scenes/genesis/SpawnDistribution.ts
export interface SpawnDistribution {
  // Multiplier per typeCode 1..4
  // 1 spill, 2 plunge, 3 surge, 4 whitecap
  typeMult: [number, number, number, number];

  baseParticlesPerEvent: number;
  energyMin: number;   // below this -> 0 quota
  energyPow: number;   // energy response
  maxSlotsSpawn: number; // MV: 4
}

export const SURF_SPAWN_DIST: SpawnDistribution = {
  typeMult: [1.0, 1.4, 0.7, 0.35],
  baseParticlesPerEvent: 2048,
  energyMin: 0.12,
  energyPow: 0.85,
  maxSlotsSpawn: 4,
};

export const STORM_SPAWN_DIST: SpawnDistribution = {
  typeMult: [0.6, 0.6, 0.6, 1.0],
  baseParticlesPerEvent: 768,
  energyMin: 0.10,
  energyPow: 0.80,
  maxSlotsSpawn: 4,
};


You can store this on the preset/bank, but keeping it separate avoids bloating GenesisPreset.

4.2 Hook uniforms into your init materials
water-showcase-unified/src/engines/oceansimv1/hooks/useMLSMPMSimulation.ts (patch)
import type { SpawnDistribution } from "../../../water/scenes/genesis/SpawnDistribution";

export function applySpawnDistribution(dist: SpawnDistribution, initPosMat: any, initVelMat: any) {
  // shared
  const flat = [
    dist.typeMult[0], dist.typeMult[1], dist.typeMult[2], dist.typeMult[3]
  ];

  initPosMat.uniforms.uTypeMult4.value = flat;
  initPosMat.uniforms.uBaseParticlesPerEvent.value = dist.baseParticlesPerEvent;
  initPosMat.uniforms.uEnergyMin.value = dist.energyMin;
  initPosMat.uniforms.uEnergyPow.value = dist.energyPow;
  initPosMat.uniforms.uMaxSlotsSpawn.value = dist.maxSlotsSpawn;

  // same for vel (so slot selection is identical)
  initVelMat.uniforms.uTypeMult4.value = flat;
  initVelMat.uniforms.uBaseParticlesPerEvent.value = dist.baseParticlesPerEvent;
  initVelMat.uniforms.uEnergyMin.value = dist.energyMin;
  initVelMat.uniforms.uEnergyPow.value = dist.energyPow;
  initVelMat.uniforms.uMaxSlotsSpawn.value = dist.maxSlotsSpawn;
}


Add ring allocator uniforms (same to both mats):

initPosMat.uniforms.uSpawnCursor.value = spawnCursor;
initPosMat.uniforms.uSpawnRegionSize.value = spawnRegionSize;

initVelMat.uniforms.uSpawnCursor.value = spawnCursor;
initVelMat.uniforms.uSpawnRegionSize.value = spawnRegionSize;

4.3 Deterministic spawn cursor (CPU-only, no readback)
water-showcase-unified/src/engines/oceansimv1/breach/SpawnRingAllocator.ts
export class SpawnRingAllocator {
  cursor = 0;

  constructor(public regionSize: number, public advancePerFrame: number) {}

  setAdvance(advancePerFrame: number) {
    this.advancePerFrame = Math.max(0, Math.floor(advancePerFrame));
  }

  step() {
    if (this.regionSize <= 0) return;
    this.cursor = (this.cursor + this.advancePerFrame) % this.regionSize;
  }
}


Choosing advancePerFrame (safe MV):

// worst-case: all 4 slots are plunging at full energy
const worst = dist.baseParticlesPerEvent * dist.maxSlotsSpawn * Math.max(...dist.typeMult);
allocator.setAdvance(Math.min(allocator.regionSize, Math.floor(worst)));


This does not change quotas; it only moves the injection window. Quotas still determine how many indices in that window actually spawn this frame.

4.4 INIT_POS typed shader changes: quota allocator + ring window

Assume your INIT_POS already has:

uEBT0Tex/uEBT1Tex, uSF0Tex/uSF1Tex, uHeightfieldTex, domain mapping

uGeom* typebanks (from the previous step)

Now add:

uTypeMult4[4], uBaseParticlesPerEvent, uEnergyMin, uEnergyPow, uMaxSlotsSpawn

uSpawnCursor, uSpawnRegionSize

uPosPrevTex to preserve existing particles outside the spawn window

.../shaders/initPosRibbonTyped.frag.glsl (drop-in block)
uniform sampler2D uPosPrevTex;

uniform float uTypeMult4[4];          // typeCode 1..4 -> index 0..3
uniform float uBaseParticlesPerEvent; // e.g. 2048
uniform float uEnergyMin;
uniform float uEnergyPow;
uniform int   uMaxSlotsSpawn;         // MV: 4

uniform int uSpawnCursor;             // ring cursor in [0..regionSize)
uniform int uSpawnRegionSize;         // hard cap region size

// Returns quota for slot k (0..uMaxSlotsSpawn-1)
float quotaForSlot(int k) {
  float slotU = (float(k) + 0.5) / 8.0;  // EVENT_SLOTS=8
  vec4 e0 = texture2D(uEBT0Tex, vec2(slotU, 0.5));
  vec4 e1 = texture2D(uEBT1Tex, vec2(slotU, 0.5));

  float typeF = e0.a;
  float energy = e1.b;
  if (energy < uEnergyMin) return 0.0;

  int typeCode = int(clamp(round(typeF), 1.0, 4.0));
  float m = uTypeMult4[typeCode - 1];

  float q = uBaseParticlesPerEvent * m * pow(clamp(energy,0.0,1.0), uEnergyPow);
  // stable integer quota
  return floor(q + 0.5);
}

// Map ring-relative r -> slotK and local index j within that slot.
// Outputs slotK=-1 when no spawn.
void assignSlotFromQuotas(float r, out int slotK, out float jLocal, out float totalQ) {
  float q0 = (uMaxSlotsSpawn > 0) ? quotaForSlot(0) : 0.0;
  float q1 = (uMaxSlotsSpawn > 1) ? quotaForSlot(1) : 0.0;
  float q2 = (uMaxSlotsSpawn > 2) ? quotaForSlot(2) : 0.0;
  float q3 = (uMaxSlotsSpawn > 3) ? quotaForSlot(3) : 0.0;

  float c0 = q0;
  float c1 = c0 + q1;
  float c2 = c1 + q2;
  float c3 = c2 + q3;
  totalQ = c3;

  slotK = -1;
  jLocal = 0.0;

  if (r < c0) { slotK = 0; jLocal = r; return; }
  if (r < c1) { slotK = 1; jLocal = r - c0; return; }
  if (r < c2) { slotK = 2; jLocal = r - c1; return; }
  if (r < c3) { slotK = 3; jLocal = r - c2; return; }
}


Then in main() (right at the top), replace “slotK = mod(idx,4)” logic with:

// compute global linear index (adapt to your layout; keep consistent across passes)
float idx = floor(vUv.x * 1024.0) + floor(vUv.y * 1024.0) * 1024.0;

// Preserve existing by default
vec4 prev = texture2D(uPosPrevTex, vUv);

// Ring-relative coordinate r in [0..uSpawnRegionSize)
float region = float(max(uSpawnRegionSize, 1));
float cursor = float(uSpawnCursor);
float r = mod(idx - cursor + region, region);

// Assign slot by quotas
int slotK; float jLocal; float totalQ;
assignSlotFromQuotas(r, slotK, jLocal, totalQ);

// If outside the quota window, keep previous particle (no spawn)
if (r >= totalQ || slotK < 0) {
  gl_FragColor = prev;
  return;
}

// Otherwise: spawn using (slotK, jLocal) for deterministic sampling


Now your existing ribbon sampling (hashes) should use jLocal instead of raw idx so each slot gets its own stable distribution:

float seed = jLocal + float(slotK) * 8192.0; // deterministic separation
float r1 = hash1(seed + 1.0);
float r2 = hash1(seed + 2.0);
float r3 = hash1(seed + 3.0);


Everything else (type-conditioned geom, η sampling, etc.) remains the same.

4.5 INIT_VEL must use the same slot assignment

Do the exact same quota/ring mapping in INIT_VEL so each particle’s velocity corresponds to the slot it was spawned from.

Add uPosPrevTex if you preserve velocities similarly; or just compute velocity only when life > 0 && spawnedThisFrame (your choice). MV: mirror INIT_POS behavior and preserve previous vel when not spawning.

5) Validation checklist
Visual sweeps

SCENE.SURF.LINEUP_TYPES with auto-classify:

Plunging slots produce visibly denser sheets than whitecap slots.

Whitecaps appear sparser and smaller (even if many events occur).

Density doesn’t flicker frame-to-frame (quota allocator is stable).

Perf / caps

Confirm totalQ <= uSpawnRegionSize always.

Confirm advancePerFrame <= uSpawnRegionSize.

Confirm uMaxSlotsSpawn stays small (<=4 MV) to keep init shader loops cheap.

Genesis correctness

Still must satisfy: INIT samples η/η̇ and SF direction; EBT drives everything.

If EBT energies are zero → quotas go zero → spawn window effectively does nothing.

6) Telemetry/debug views added

DEBUG.SPAWN_QUOTAS HUD:

per-slot (typeCode, energy01, quota)

totalQ, spawnCursor, advancePerFrame

DEBUG.SPAWN_WINDOW overlay (optional): highlight which index range is being used this frame (CPU-side visualization).

L0 counters:

quotaTotal, quotaByType[1..4] (computed on CPU from preset + assumed worst-case; and on GPU visually via debug HUD sampling EBT without readback)








1) What we’re changing

We’re adding a type-conditioned effects lifecycle driven by the same EBT events (slots) you already have:

Foam (surface field): advection + decay + breakup, plus event/impact injection.

Spray/mist (GPU particles): typed spawn + ballistic update + wind drift.

Bubbles (underwater field or particles): typed injection + rise + pop→foam.

We’re making the lifecycle per breaker type (1 spill, 2 plunge, 3 surge, 4 whitecap) with stable budgets + no stalls.

We’re registering the new passes explicitly (no silent passes): SIM.FOAM.UPDATE, SIM.FOAM.INJECT_EBT, SIM.SPRAY.UPDATE, SIM.SPRAY.INIT_EBT, SIM.BUBBLES.UPDATE, SIM.BUBBLES.INJECT_EBT, SIM.BUBBLES.POP_TO_FOAM.

2) Why

A correct “crest→sheet” genesis gives you where and how to spawn, but the shot reads as real only if:

Spilling → persistent surface foam sheets + mild mist.

Plunging → explosive spray plume + strong aeration (bubbles) + rapid foam growth.

Surging → thin face film/streaking, minimal lift.

Whitecaps → shredded micro-foam + wind-streaked spindrift.

The only safe way to do this in-engine is GPU-only with hard caps and LOD gating, keeping the no-stall contract.

3) Implementation steps

Add an EffectTypeBank (per-type foam/spray/bubble parameters).

Implement FoamField (2D RT) with:

Update: semi-Lagrangian advection by surface velocity + decay + mild diffusion.

Inject: splat from EBT slots (type-conditioned).

Implement SprayParticles (ping-pong RTs) with:

Init: typed quotas from EBT (same quota allocator approach).

Update: gravity + drag + wind advection + lifetime.

Implement BubbleField (2D RT, MV) with:

Update: rise/advection + decay.

Inject: splat from EBT.

Pop→foam: when bubbles reach near-surface band.

Add pass registry entries + schedule gating:

Only run foam/spray/bubbles when (events exist) OR (field density above threshold).

Add debug overlays + L0 counters.

4) Code
4.1 Type-conditioned effect parameters
src/water/effects/EffectTypeBank.ts
export type TypeCode = 1 | 2 | 3 | 4; // 1 spill, 2 plunge, 3 surge, 4 whitecap

export interface FoamParams {
  injectGain: number;      // splat gain from events
  decayPerSec: number;     // foam decay
  diffuse: number;         // small diffusion (0..)
  streakAniso: number;     // 0=none, 1=strong along wave tangent (surging)
}

export interface SprayParams {
  quotaMult: number;       // affects spawn quotas (relative)
  life0: number;
  life1: number;
  drag: number;            // higher = slower
  windCouple: number;      // 0..1
  gravityScale: number;    // 1 = normal gravity
}

export interface BubbleParams {
  injectGain: number;
  riseMps: number;         // MV proxy
  decayPerSec: number;
  popToFoam: number;       // foam gain when bubbles reach surface
}

export interface EffectTypeParams {
  foam: FoamParams;
  spray: SprayParams;
  bubbles: BubbleParams;
}

export interface EffectTypeBank {
  id: string;
  types: Record<TypeCode, EffectTypeParams>;
}

export const SURF_EFFECT_BANK: EffectTypeBank = {
  id: "BANK.EFX.SURF",
  types: {
    1: { // spilling
      foam:   { injectGain: 1.10, decayPerSec: 0.18, diffuse: 0.10, streakAniso: 0.25 },
      spray:  { quotaMult: 0.60, life0: 0.35, life1: 0.90, drag: 0.9, windCouple: 0.55, gravityScale: 1.0 },
      bubbles:{ injectGain: 0.55, riseMps: 0.35, decayPerSec: 0.35, popToFoam: 0.55 },
    },
    2: { // plunging
      foam:   { injectGain: 1.55, decayPerSec: 0.28, diffuse: 0.08, streakAniso: 0.15 },
      spray:  { quotaMult: 1.60, life0: 0.45, life1: 1.40, drag: 0.6, windCouple: 0.75, gravityScale: 0.95 },
      bubbles:{ injectGain: 1.30, riseMps: 0.55, decayPerSec: 0.25, popToFoam: 1.10 },
    },
    3: { // surging
      foam:   { injectGain: 0.70, decayPerSec: 0.12, diffuse: 0.05, streakAniso: 0.85 },
      spray:  { quotaMult: 0.25, life0: 0.25, life1: 0.60, drag: 1.0, windCouple: 0.45, gravityScale: 1.0 },
      bubbles:{ injectGain: 0.25, riseMps: 0.25, decayPerSec: 0.45, popToFoam: 0.25 },
    },
    4: { // whitecap
      foam:   { injectGain: 0.95, decayPerSec: 0.55, diffuse: 0.18, streakAniso: 0.35 },
      spray:  { quotaMult: 0.55, life0: 0.20, life1: 0.65, drag: 0.7, windCouple: 0.90, gravityScale: 1.05 },
      bubbles:{ injectGain: 0.40, riseMps: 0.30, decayPerSec: 0.40, popToFoam: 0.35 },
    },
  },
};

4.2 Foam field (2D) update + event injection
water-showcase-unified/src/engines/oceansimv1/effects/FoamField.ts
import * as THREE from "three";
import { FullscreenPass } from "../render/FullscreenPass";

export class FoamField {
  foamA: THREE.WebGLRenderTarget; // RG: foam, age
  foamB: THREE.WebGLRenderTarget;

  private updatePass: FullscreenPass;
  private injectPass: FullscreenPass;

  constructor(private gl: THREE.WebGLRenderer, res = 512) {
    const opts: THREE.WebGLRenderTargetOptions = {
      type: THREE.FloatType,
      format: THREE.RGBAFormat,
      depthBuffer: false,
      stencilBuffer: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    };
    this.foamA = new THREE.WebGLRenderTarget(res, res, opts);
    this.foamB = new THREE.WebGLRenderTarget(res, res, opts);

    this.updatePass = new FullscreenPass(new THREE.ShaderMaterial({
      vertexShader: VS,
      fragmentShader: FOAM_UPDATE_FRAG,
      uniforms: {
        uFoamPrev: { value: this.foamA.texture },
        uSurfVel: { value: null as unknown as THREE.Texture }, // RG: vx,vz in m/s or normalized
        uDt: { value: 1/60 },
        uDomainSize: { value: new THREE.Vector2(1,1) }, // meters
        uDecay: { value: 0.25 },
        uDiffuse: { value: 0.08 },
        uStreakAniso: { value: 0.2 },
      },
      depthTest: false, depthWrite: false,
    }));

    this.injectPass = new FullscreenPass(new THREE.ShaderMaterial({
      vertexShader: VS,
      fragmentShader: FOAM_INJECT_EBT_FRAG,
      uniforms: {
        uFoamPrev: { value: this.foamA.texture },
        uEBT0: { value: null as unknown as THREE.Texture }, // x,z,radius,type
        uEBT1: { value: null as unknown as THREE.Texture }, // dirx,dirz,energy,time
        uDomainMin: { value: new THREE.Vector2() },
        uDomainSize: { value: new THREE.Vector2(1,1) },

        // per-type params packed into vec4 arrays (type1..4)
        // x = injectGain, y = decayPerSec, z = diffuse, w = streakAniso
        uFoamType4: { value: new Array(16).fill(0) },

        uSlots: { value: 8 },
      },
      depthTest: false, depthWrite: false,
    }));
  }

  injectFromEBT(args: {
    ebt0: THREE.Texture; ebt1: THREE.Texture;
    domainMin: THREE.Vector2; domainSize: THREE.Vector2;
    foamType4: number[]; // len 16
  }) {
    const u = this.injectPass.mat.uniforms;
    u.uFoamPrev.value = this.foamA.texture;
    u.uEBT0.value = args.ebt0;
    u.uEBT1.value = args.ebt1;
    u.uDomainMin.value.copy(args.domainMin);
    u.uDomainSize.value.copy(args.domainSize);
    u.uFoamType4.value = args.foamType4;

    this.injectPass.render(this.gl, this.foamB);
    this.swap();
  }

  update(args: {
    surfVelTex: THREE.Texture;
    dt: number;
    domainSize: THREE.Vector2;
    // scene-wide scalars (can come from budget/LOD)
    decay: number;
    diffuse: number;
    streakAniso: number;
  }) {
    const u = this.updatePass.mat.uniforms;
    u.uFoamPrev.value = this.foamA.texture;
    u.uSurfVel.value = args.surfVelTex;
    u.uDt.value = args.dt;
    u.uDomainSize.value.copy(args.domainSize);
    u.uDecay.value = args.decay;
    u.uDiffuse.value = args.diffuse;
    u.uStreakAniso.value = args.streakAniso;

    this.updatePass.render(this.gl, this.foamB);
    this.swap();
  }

  private swap() {
    const t = this.foamA; this.foamA = this.foamB; this.foamB = t;
  }
}

const VS = /* glsl */`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy,0.0,1.0); }
`;

const FOAM_UPDATE_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;

uniform sampler2D uFoamPrev;  // RG: foam, age
uniform sampler2D uSurfVel;   // RG: vx,vz (m/s)
uniform float uDt;
uniform vec2 uDomainSize;
uniform float uDecay;
uniform float uDiffuse;
uniform float uStreakAniso;

vec2 texelSize(sampler2D tex){
  // not available; approximate with derivative-free assumption using fwidth is messy.
  // MV: treat diffusion as a small constant blend with neighbors via manual offsets below.
  return vec2(1.0/512.0); // set to your res or pass as uniform if needed
}

void main(){
  vec2 vel = texture2D(uSurfVel, vUv).rg; // m/s in xz
  vec2 duv = (vel * uDt) / max(vec2(1e-3), uDomainSize);

  // Semi-Lagrangian backtrace
  vec2 uv0 = vUv - duv;

  vec4 prev = texture2D(uFoamPrev, uv0);
  float foam = prev.r;
  float age  = prev.g;

  // Decay
  foam = max(0.0, foam * exp(-uDecay * uDt));
  age  = min(1.0, age + uDt * 0.25);

  // Mild diffusion + anisotropic streaking (surging)
  vec2 ts = texelSize(uFoamPrev);
  float n = texture2D(uFoamPrev, uv0 + vec2(0.0, ts.y)).r;
  float s = texture2D(uFoamPrev, uv0 - vec2(0.0, ts.y)).r;
  float e = texture2D(uFoamPrev, uv0 + vec2(ts.x, 0.0)).r;
  float w = texture2D(uFoamPrev, uv0 - vec2(ts.x, 0.0)).r;
  float lap = (n + s + e + w - 4.0 * prev.r);

  // streaking: bias diffusion along vel direction (proxy)
  float vlen = length(vel) + 1e-4;
  vec2 dir = vel / vlen;
  float along = texture2D(uFoamPrev, uv0 + dir * ts.x).r + texture2D(uFoamPrev, uv0 - dir * ts.x).r - 2.0 * prev.r;

  foam += uDiffuse * lap * uDt;
  foam += (uDiffuse * uStreakAniso) * along * uDt;

  foam = clamp(foam, 0.0, 1.0);
  gl_FragColor = vec4(foam, age, 0.0, 1.0);
}
`;

const FOAM_INJECT_EBT_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;

uniform sampler2D uFoamPrev;
uniform sampler2D uEBT0;
uniform sampler2D uEBT1;
uniform vec2 uDomainMin;
uniform vec2 uDomainSize;
uniform float uFoamType4[16];
uniform int uSlots;

vec4 load4(const float a[16], int idx){
  int o = idx * 4;
  return vec4(a[o+0], a[o+1], a[o+2], a[o+3]);
}

float gauss(float r, float sigma){
  float x = r / max(1e-5, sigma);
  return exp(-0.5 * x * x);
}

void main(){
  vec4 prev = texture2D(uFoamPrev, vUv);
  float foam = prev.r;
  float age  = prev.g;

  vec2 xz = uDomainMin + vUv * uDomainSize;

  // Accumulate contributions from event slots (cheap loop, small slots)
  for (int k = 0; k < 8; k++){
    if (k >= uSlots) break;

    float slotU = (float(k) + 0.5) / float(uSlots);
    vec4 e0 = texture2D(uEBT0, vec2(slotU, 0.5)); // x,z,r,type
    vec4 e1 = texture2D(uEBT1, vec2(slotU, 0.5)); // dirx,dirz,energy,time
    float typeF = e0.a;
    float energy = e1.b;
    if (energy <= 1e-4) continue;

    int typeCode = int(clamp(round(typeF), 1.0, 4.0));
    int tIdx = typeCode - 1;

    vec4 p = load4(uFoamType4, tIdx);
    float gain = p.x;

    vec2 exz = e0.rg;
    float radiusM = max(0.25, e0.b);

    float r = length(xz - exz);
    float sigma = radiusM * 0.55;
    float w = gauss(r, sigma);

    foam = max(foam, foam + gain * energy * w); // additive; clamp later
    age  = min(age, 0.1); // fresh foam resets age a bit
  }

  foam = clamp(foam, 0.0, 1.0);
  gl_FragColor = vec4(foam, age, 0.0, 1.0);
}
`;


Packing uFoamType4:

// flatten 4 vec4s: (injectGain, decayPerSec, diffuse, streakAniso)
const foamType4 = [
  bank.types[1].foam.injectGain, bank.types[1].foam.decayPerSec, bank.types[1].foam.diffuse, bank.types[1].foam.streakAniso,
  bank.types[2].foam.injectGain, bank.types[2].foam.decayPerSec, bank.types[2].foam.diffuse, bank.types[2].foam.streakAniso,
  bank.types[3].foam.injectGain, bank.types[3].foam.decayPerSec, bank.types[3].foam.diffuse, bank.types[3].foam.streakAniso,
  bank.types[4].foam.injectGain, bank.types[4].foam.decayPerSec, bank.types[4].foam.diffuse, bank.types[4].foam.streakAniso,
];

4.3 Spray particles (typed quotas, no new passes beyond init+update)
Pass IDs

SIM.SPRAY.INIT_EBT (INIT_POS-like for spray particles)

SIM.SPRAY.UPDATE (integrate)

water-showcase-unified/src/engines/oceansimv1/effects/SprayParticles.ts (skeleton)
import * as THREE from "three";
import { FullscreenPass } from "../render/FullscreenPass";

export class SprayParticles {
  posA: THREE.WebGLRenderTarget; // xyz pos, w life
  posB: THREE.WebGLRenderTarget;
  velA: THREE.WebGLRenderTarget; // xyz vel, w unused
  velB: THREE.WebGLRenderTarget;

  initPass: FullscreenPass;
  updatePass: FullscreenPass;

  constructor(private gl: THREE.WebGLRenderer, res = 512) {
    const opts: THREE.WebGLRenderTargetOptions = {
      type: THREE.FloatType, format: THREE.RGBAFormat,
      depthBuffer:false, stencilBuffer:false,
      minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
    };
    this.posA = new THREE.WebGLRenderTarget(res, res, opts);
    this.posB = new THREE.WebGLRenderTarget(res, res, opts);
    this.velA = new THREE.WebGLRenderTarget(res, res, opts);
    this.velB = new THREE.WebGLRenderTarget(res, res, opts);

    this.initPass = new FullscreenPass(new THREE.ShaderMaterial({
      vertexShader: VS, fragmentShader: SPRAY_INIT_TYPED_FRAG,
      uniforms: {
        uPosPrev: { value: this.posA.texture },
        uVelPrev: { value: this.velA.texture },
        uEBT0: { value: null as any },
        uEBT1: { value: null as any },
        uHeightfieldTex: { value: null as any },
        uSF1Tex: { value: null as any },
        uDomainMin: { value: new THREE.Vector2() },
        uDomainSize: { value: new THREE.Vector2(1,1) },
        uDt: { value: 1/60 },

        // spawn ring allocator + quotas (reuse your quota allocator idea)
        uSpawnCursor: { value: 0 },
        uSpawnRegionSize: { value: 262144 }, // res*res
        uBasePerEvent: { value: 1024 },
        uTypeMult4: { value: [0.6, 1.6, 0.25, 0.55] },
        uEnergyMin: { value: 0.10 },
        uEnergyPow: { value: 0.85 },
        uMaxSlotsSpawn: { value: 4 },

        // type-conditioned spray params packed: (life0,life1,drag,windCouple)*4
        uSprayType4: { value: new Array(16).fill(0) },

        // emission shaping
        uEmitHeightM: { value: 0.10 },   // spawn just above surface
        uUpKickMps: { value: 2.0 },      // adds vertical for plunging via type params
      },
      depthTest:false, depthWrite:false,
    }));

    this.updatePass = new FullscreenPass(new THREE.ShaderMaterial({
      vertexShader: VS, fragmentShader: SPRAY_UPDATE_FRAG,
      uniforms: {
        uPosPrev: { value: this.posA.texture },
        uVelPrev: { value: this.velA.texture },
        uDt: { value: 1/60 },
        uWindVel: { value: new THREE.Vector3(0,0,0) },
        uDrag: { value: 0.8 },
        uGravity: { value: 9.81 },
        uHeightfieldTex: { value: null as any },
        uDomainMin: { value: new THREE.Vector2() },
        uDomainSize: { value: new THREE.Vector2(1,1) },
      },
      depthTest:false, depthWrite:false,
    }));
  }

  // run init -> update in your sim tick
  // (rendering spray is separate: point sprites / impostors from pos texture)
}

const VS = /* glsl */`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy,0.0,1.0); }
`;

// Keep these shaders in separate .glsl files in real code.
const SPRAY_INIT_TYPED_FRAG = /* glsl */`/* omitted here for brevity: same quota allocator pattern as earlier,
select slot by quotas, then spawn a droplet cluster around eventXZ with type-conditioned life/drag/windCouple */`;

const SPRAY_UPDATE_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;

uniform sampler2D uPosPrev;
uniform sampler2D uVelPrev;
uniform sampler2D uHeightfieldTex;
uniform vec2 uDomainMin;
uniform vec2 uDomainSize;

uniform float uDt;
uniform vec3 uWindVel;
uniform float uDrag;
uniform float uGravity;

vec2 worldToUv(vec2 xz){ return (xz - uDomainMin) / uDomainSize; }

void main(){
  vec4 p = texture2D(uPosPrev, vUv);
  vec4 v = texture2D(uVelPrev, vUv);
  float life = p.w;
  if (life <= 0.0) { gl_FragColor = vec4(0.0); return; }

  vec3 pos = p.xyz;
  vec3 vel = v.xyz;

  // simple drag toward wind
  vel += (uWindVel - vel) * (1.0 - exp(-uDrag * uDt));

  // gravity
  vel.y -= uGravity * uDt;

  // integrate
  pos += vel * uDt;

  // kill if intersects water (no CPU readback)
  vec2 uv = worldToUv(pos.xz);
  float eta = texture2D(uHeightfieldTex, uv).r;
  if (pos.y <= eta + 0.01) {
    life = 0.0;
  } else {
    life = max(0.0, life - uDt);
  }

  // NOTE: In real implementation you output to MRT (pos+vel), here keep simple (pos only).
  gl_FragColor = vec4(pos, life);
}
`;


The spray init shader should use the exact same quota/slot mapping as your MLS init, but with sprayType params controlling life/drag/windCouple and a type-conditioned “upkick”.

4.4 Bubbles (MV 2D field) + pop→foam coupling

MV choice: 2D bubble density field in patch space (good enough for shots unless you’re inside the plume). When close-up underwater, you can LOD-switch to bubble particles.

water-showcase-unified/src/engines/oceansimv1/effects/BubbleField.ts (conceptual)

bubbleRT stores bubble density.

Update: advect by current + rise proxy (bias upward doesn’t exist in 2D, so treat it as moving toward surface band via decay shaping).

Pop→foam: when camera is above/waterline or for surface shots, convert some density into foam injection around event center and/or around detected “near-surface” zone.

Key coupling pass: SIM.BUBBLES.POP_TO_FOAM uses bubble density to add to foam field (again GPU-only).

4.5 Pass registry additions (explicit)
src/water/graph/PassRegistry.ts (add)
{ id:"SIM.FOAM.INJECT_EBT", phase:"SIM", flag:"foam", deps:["SIM.WAVES.BASE"], produces:["FOAM.field"], costTags:["fsPass","rtFoam"] },
{ id:"SIM.FOAM.UPDATE",     phase:"SIM", flag:"foam", deps:["SIM.FOAM.INJECT_EBT"], produces:["FOAM.field"], costTags:["fsPass","rtFoam"] },

{ id:"SIM.SPRAY.INIT_EBT",  phase:"SIM", flag:"spray", deps:["SIM.WAVES.BASE"], produces:["SPRAY.pos","SPRAY.vel"], costTags:["fsPass","rtSpray"] },
{ id:"SIM.SPRAY.UPDATE",    phase:"SIM", flag:"spray", deps:["SIM.SPRAY.INIT_EBT"], produces:["SPRAY.pos","SPRAY.vel"], costTags:["fsPass","rtSpray"] },

{ id:"SIM.BUBBLES.INJECT_EBT", phase:"SIM", flag:"bubbles", deps:["SIM.WAVES.BASE"], produces:["BUBBLE.field"], costTags:["fsPass","rtBubble"] },
{ id:"SIM.BUBBLES.UPDATE",     phase:"SIM", flag:"bubbles", deps:["SIM.BUBBLES.INJECT_EBT"], produces:["BUBBLE.field"], costTags:["fsPass","rtBubble"] },
{ id:"SIM.BUBBLES.POP_TO_FOAM",phase:"SIM", flag:"bubbles", deps:["SIM.BUBBLES.UPDATE"], produces:["FOAM.field"], costTags:["fsPass","rtFoam"] },


Scheduling gates (important):

If EBT energies are all ~0 AND foam max < ε → skip FOAM.UPDATE.

If sprayAliveCount == 0 AND K_thisFrame == 0 → skip SPRAY.UPDATE (use a CPU-side “likely alive” counter; no readback).

5) Validation checklist
Visual sweeps (type-conditioned lifecycle)

SCENE.SURF.LINEUP_TYPES:

plunging slots spawn spray plume and bubble-heavy foam growth.

spilling slots spawn persistent surface foam sheets with mild mist.

surging slots show streaky face film (anisotropic foam) with little spray.

whitecaps show shredded micro-foam, strong wind drift, fast decay.

SCENE.SPRAY.BACKLIT_LIP_PLUME:

spray particles visible in backlight and move with wind.

SCENE.BUBBLES.OBJECT_ENTRY_PLUME:

bubble density accumulates below surface; pop produces surface foam patch.

Perf (no-stall, caps)

No GPU readbacks added.

Caps enforced:

sprayParticlesMax, foamResTier, bubbleResTier, passesEnabledByLOD.

Pass audit: only registered passes appear; pass counts stable.

Regression safety

Disable spawnFieldsEnabled → EBT empty → foam inject does nothing → stable.

Budget stress scenes show fallbacks (lower res foam, fewer spray updates) rather than spikes.









Thought for 59s
1) What we’re changing

We’re implementing the Visual Integration Contract: one coherent water appearance pipeline with shared lighting inputs across ocean + splash, with no “double water” and consistent underwater/waterline behavior.

We’re wiring foam / spray / bubbles into the optical model as first-class contributors:

foam → surface diffuse/albedo + roughness + extinction

spray → backlit volumetric-ish additive lobe + forward scattering

bubbles/turbidity → underwater scattering/extinction + glints

We’re adding explicit render passes (registered, no silent passes): RENDER.WATER.SURFACE, RENDER.WATER.REFRACT, RENDER.UNDERWATER.VOLUME, RENDER.CAUSTICS, RENDER.WATER.COMPOSITE, plus debug views.

2) Why

The “encyclopedia-grade” look isn’t just sim: it’s optics. Water is mostly reflection + refraction + attenuation, and your secondaries (foam/spray/bubbles) change the BRDF/BTDF and the volume.

Your hybrid system demands seam elimination: same IOR/sky/light/tonemap, foam from one truth, caustics continuous, underwater consistent.

This is also performance-safe: everything uses render targets + screen-space sampling, never GPU readback.

3) Implementation steps

Define SharedWaterLightingUniforms used by every water material/pass.

Add a two-layer renderer:

render scene without water to SceneColor + SceneDepth

render water surface using those textures for refraction + reflection

Add underwater pipeline:

UNDERWATER.VOLUME pass applies Beer–Lambert absorption + single-scatter approximation using bubble/turbidity fields

waterline blend uses a signed mask from camera height vs η

Add caustics:

compute CAUSTICS.tex from surface normals + sun dir (cheap focusing approximation)

project onto underwater surfaces (or apply as screen-space light modulation in underwater pass)

Integrate foam/spray/bubbles into shading:

foamMask drives albedo/roughness + reduces Fresnel dominance

spray uses backlit forward-scatter lobe + depth fade

bubble density increases scattering/extinction underwater and adds sparkle term

Add debug overlays proving consistency: Fresnel, transmittance, foamMask, bubbleDensity, caustics, waterlineMask, LOD state.

4) Code (TS / R3F + GLSL)
4.1 Shared lighting uniform pack

src/water/render/SharedWaterLighting.ts

import * as THREE from "three";

export interface SharedWaterLighting {
  // Surface optics
  ior: number;                 // 1.333 water
  sunDir: THREE.Vector3;       // normalized
  sunColor: THREE.Color;       // radiance-ish
  skyEnvMap: THREE.Texture | null;

  // Volume optics (per-meter coefficients)
  absorptionRGB: THREE.Vector3; // σ_a (R,G,B)
  scatteringRGB: THREE.Vector3; // σ_s (R,G,B)
  gHG: number;                  // Henyey-Greenstein anisotropy (0..0.95)

  // Camera / mode
  cameraPos: THREE.Vector3;
  underwater: number;          // 0/1
  waterlineBlend: number;      // 0..1 (optional)
}

export function defaultSharedWaterLighting(): SharedWaterLighting {
  return {
    ior: 1.333,
    sunDir: new THREE.Vector3(0.3, 0.9, 0.2).normalize(),
    sunColor: new THREE.Color(1, 1, 1),
    skyEnvMap: null,
    // Clear ocean-ish defaults (tune by biome later)
    absorptionRGB: new THREE.Vector3(0.15, 0.05, 0.02),
    scatteringRGB: new THREE.Vector3(0.02, 0.03, 0.04),
    gHG: 0.80,
    cameraPos: new THREE.Vector3(),
    underwater: 0,
    waterlineBlend: 0,
  };
}

4.2 Render graph (no silent passes)

src/water/render/WaterRenderGraph.ts

import * as THREE from "three";

export interface WaterFrameTargets {
  sceneColor: THREE.WebGLRenderTarget; // scene without water
  sceneDepth: THREE.Texture;           // depth texture
  refractColor: THREE.WebGLRenderTarget;
  caustics: THREE.WebGLRenderTarget;
  underwaterColor: THREE.WebGLRenderTarget;
}

export function allocateWaterTargets(gl: THREE.WebGLRenderer, w: number, h: number): WaterFrameTargets {
  const depthTex = new THREE.DepthTexture(w, h, THREE.FloatType);

  const rtOpts: THREE.WebGLRenderTargetOptions = {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    depthBuffer: true,
    depthTexture: depthTex,
  };

  const sceneColor = new THREE.WebGLRenderTarget(w, h, rtOpts);
  const refractColor = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, format: THREE.RGBAFormat });
  const caustics = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, format: THREE.RGBAFormat });
  const underwaterColor = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, format: THREE.RGBAFormat });

  return { sceneColor, sceneDepth: depthTex, refractColor, caustics, underwaterColor };
}


PassRegistry additions (example):

{ id:"RENDER.SCENE.NO_WATER", phase:"RENDER", deps:[], produces:["SCENE.color","SCENE.depth"] },
{ id:"RENDER.CAUSTICS", phase:"RENDER", deps:["SIM.WAVES.BASE"], produces:["CAUSTICS.tex"] },
{ id:"RENDER.UNDERWATER.VOLUME", phase:"RENDER", deps:["RENDER.SCENE.NO_WATER","RENDER.CAUSTICS"], produces:["UNDERWATER.color"] },
{ id:"RENDER.WATER.SURFACE", phase:"RENDER", deps:["RENDER.SCENE.NO_WATER"], produces:["WATER.surface"] },
{ id:"RENDER.WATER.COMPOSITE", phase:"RENDER", deps:["RENDER.WATER.SURFACE","RENDER.UNDERWATER.VOLUME"], produces:["FINAL.color"] },

4.3 Water surface material (Fresnel + screen-space refraction + foam)

src/water/materials/WaterSurfaceMaterial.ts

import * as THREE from "three";
import type { SharedWaterLighting } from "../render/SharedWaterLighting";

export function makeWaterSurfaceMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: true,
    depthTest: true,
    vertexShader: WATER_SURF_VS,
    fragmentShader: WATER_SURF_FS,
    uniforms: {
      // Geometry / mapping
      uDomainMin: { value: new THREE.Vector2() },
      uDomainSize: { value: new THREE.Vector2(1, 1) },
      uHeightfieldInfoTex: { value: null as unknown as THREE.Texture }, // r=eta, g=etaDotProxy
      uNormalTex: { value: null as unknown as THREE.Texture },          // optional: packed normal

      // Scene buffers
      uSceneColor: { value: null as unknown as THREE.Texture },
      uSceneDepth: { value: null as unknown as THREE.Texture },
      uProjInv: { value: new THREE.Matrix4() },
      uViewInv: { value: new THREE.Matrix4() },

      // Foam / bubbles
      uFoamTex: { value: null as unknown as THREE.Texture },    // R=foam
      uBubbleTex: { value: null as unknown as THREE.Texture },  // R=bubble density (optional)
      uFoamTint: { value: new THREE.Color(0.95, 0.98, 1.0) },

      // Lighting (shared)
      uIOR: { value: 1.333 },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uSunColor: { value: new THREE.Color(1, 1, 1) },
      uEnvMap: { value: null as THREE.Texture | null },

      // Extinction for transmitted color (surface view)
      uAbsorptionRGB: { value: new THREE.Vector3(0.15, 0.05, 0.02) },

      // Tuning
      uRoughnessWater: { value: 0.02 },
      uRoughnessFoam: { value: 0.35 },
      uRefractionStrength: { value: 0.03 }, // screen-space offset
      uFoamStrength: { value: 1.0 },
      uTime: { value: 0 },
    },
  });
}

export function applySharedLighting(mat: THREE.ShaderMaterial, L: SharedWaterLighting) {
  mat.uniforms.uIOR.value = L.ior;
  mat.uniforms.uSunDir.value.copy(L.sunDir);
  mat.uniforms.uSunColor.value.copy(L.sunColor);
  mat.uniforms.uEnvMap.value = L.skyEnvMap;
  mat.uniforms.uAbsorptionRGB.value.copy(L.absorptionRGB);
}


WATER_SURF_FS core optics (GLSL, condensed but complete enough):

precision highp float;
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec4 vClipPos;

uniform sampler2D uHeightfieldInfoTex;
uniform sampler2D uNormalTex;

uniform sampler2D uSceneColor;
uniform sampler2D uSceneDepth;
uniform mat4 uProjInv;
uniform mat4 uViewInv;

uniform sampler2D uFoamTex;
uniform sampler2D uBubbleTex;
uniform vec3 uFoamTint;

uniform float uIOR;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform samplerCube uEnvMap;

uniform vec3 uAbsorptionRGB;

uniform float uRoughnessWater;
uniform float uRoughnessFoam;
uniform float uRefractionStrength;
uniform float uFoamStrength;

float saturate(float x){ return clamp(x,0.0,1.0); }

// Schlick Fresnel
vec3 fresnelSchlick(float cosTheta, vec3 F0){
  return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

// Reconstruct view-space position from depth (screen-space refraction)
vec3 reconstructWorld(vec2 uv, float depth01){
  vec4 ndc = vec4(uv*2.0-1.0, depth01*2.0-1.0, 1.0);
  vec4 view = uProjInv * ndc;
  view /= max(1e-6, view.w);
  vec4 world = uViewInv * view;
  return world.xyz;
}

void main(){
  // Normal (use normal map/tex; fallback: up)
  vec3 N = vec3(0.0, 1.0, 0.0);
  vec3 nTex = texture2D(uNormalTex, vUv).xyz * 2.0 - 1.0;
  N = normalize(mix(N, nTex, 1.0));

  vec3 V = normalize(cameraPosition - vWorldPos);
  float NoV = saturate(dot(N, V));

  // Foam mask
  float foam = texture2D(uFoamTex, vUv).r * uFoamStrength;
  foam = saturate(foam);

  // Base F0 from IOR
  float f0s = pow((1.0 - uIOR) / (1.0 + uIOR), 2.0);
  vec3 F0 = vec3(f0s);

  // Fresnel with foam reducing mirror-like behavior
  vec3 F = fresnelSchlick(NoV, mix(F0, vec3(0.02), foam));

  // Reflection color (env)
  vec3 R = reflect(-V, N);
  vec3 env = textureCube(uEnvMap, R).rgb;

  // Screen-space refraction: offset by normal (cheap)
  vec2 screenUv = (vClipPos.xy / vClipPos.w) * 0.5 + 0.5;
  vec2 refrUv = screenUv + N.xz * uRefractionStrength * (1.0 - foam);

  float depth01 = texture2D(uSceneDepth, refrUv).r;
  vec3 worldHit = reconstructWorld(refrUv, depth01);

  // Approx optical path length (meters): distance between water surface and hit point
  float distM = length(worldHit - vWorldPos);
  vec3 trans = exp(-uAbsorptionRGB * distM); // Beer-Lambert

  vec3 behind = texture2D(uSceneColor, refrUv).rgb;
  vec3 refrCol = behind * trans;

  // Foam albedo overrides: diffuse-ish bright
  vec3 foamCol = uFoamTint * (0.65 + 0.35 * saturate(dot(N, uSunDir)));

  // Final surface
  vec3 waterCol = mix(refrCol, env, F);
  waterCol = mix(waterCol, foamCol, foam);

  gl_FragColor = vec4(waterCol, 1.0);
}


This is the “glue”: same IOR + Fresnel + Beer–Lambert across ocean & splash, foam is not a second water surface, it’s a material override.

4.4 Underwater volume pass (absorption + single-scatter approx + bubbles)

src/water/passes/UnderwaterVolumePass.ts

import * as THREE from "three";
import { FullscreenPass } from "../render/FullscreenPass";

export function makeUnderwaterVolumePass() {
  return new FullscreenPass(new THREE.ShaderMaterial({
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }
    `,
    fragmentShader: UNDERWATER_FS,
    uniforms: {
      uSceneColor: { value: null as unknown as THREE.Texture },
      uSceneDepth: { value: null as unknown as THREE.Texture },
      uWaterDepthTex: { value: null as unknown as THREE.Texture }, // optional thickness/eta vs camera
      uBubbleTex: { value: null as unknown as THREE.Texture },     // R=bubble density
      uCausticsTex: { value: null as unknown as THREE.Texture },

      uAbsorb: { value: new THREE.Vector3(0.15, 0.05, 0.02) },
      uScatter:{ value: new THREE.Vector3(0.02, 0.03, 0.04) },
      uG:      { value: 0.80 },
      uSunDir: { value: new THREE.Vector3(0,1,0) },
      uSunCol: { value: new THREE.Color(1,1,1) },

      uFogScale: { value: 1.0 },
    },
    depthTest:false, depthWrite:false,
  }));
}


UNDERWATER_FS (single-scatter-ish):

precision highp float;
varying vec2 vUv;

uniform sampler2D uSceneColor;
uniform sampler2D uSceneDepth;
uniform sampler2D uBubbleTex;
uniform sampler2D uCausticsTex;

uniform vec3 uAbsorb;   // σa
uniform vec3 uScatter;  // σs
uniform float uG;
uniform vec3 uSunDir;
uniform vec3 uSunCol;
uniform float uFogScale;

float saturate(float x){ return clamp(x,0.0,1.0); }

// Henyey-Greenstein phase (single direction approx)
float phaseHG(float cosT, float g){
  float gg = g*g;
  return (1.0 - gg) / pow(max(1e-4, 1.0 + gg - 2.0*g*cosT), 1.5);
}

void main(){
  vec3 col = texture2D(uSceneColor, vUv).rgb;

  // Use scene depth as a proxy for distance; ideally you use water thickness along view.
  float d01 = texture2D(uSceneDepth, vUv).r;
  float dist = saturate(d01) * 50.0; // MV: map to meters; replace with proper reconstruction

  float bubble = texture2D(uBubbleTex, vUv).r;
  // Bubbles increase scattering/extinction
  vec3 sigmaS = uScatter * (1.0 + 3.0 * bubble);
  vec3 sigmaA = uAbsorb * (1.0 + 1.0 * bubble);
  vec3 sigmaT = sigmaS + sigmaA;

  // Transmittance
  vec3 Tr = exp(-sigmaT * (dist * uFogScale));

  // Single-scatter approximation from sun (view-independent cheap version)
  // cosT ≈ dot(viewDir, sunDir); we don’t reconstruct viewDir here in MV; treat as forward bias
  float cosT = 0.6;
  float ph = phaseHG(cosT, uG);

  // In-scattered light ≈ (1 - Tr) * (σs/σt) * L * phase
  vec3 albedo = sigmaS / max(sigmaT, vec3(1e-4));
  vec3 inscatter = (vec3(1.0) - Tr) * albedo * uSunCol * ph;

  // Caustics modulate in-scatter near surfaces
  float cau = texture2D(uCausticsTex, vUv).r;
  inscatter *= (0.6 + 0.8 * cau);

  vec3 outCol = col * Tr + inscatter;
  gl_FragColor = vec4(outCol, 1.0);
}

4.5 Caustics pass (cheap focusing from normals)

src/water/passes/CausticsPass.ts (conceptual)

Input: uNormalTex, uSunDir

Output: CAUSTICS.tex (R intensity)

Core idea: intensity increases where surface normal field locally converges along sun direction. MV approximation:

compute n = normal(x)

compute refracted light direction into water (Snell)

compute screen-space divergence/curvature proxy of that direction; invert and clamp.

You can start with an even cheaper placeholder:

// cau ≈ pow(max(0, dot(N, sunDir)), k) * curvatureProxy


…and swap later to a better Jacobian estimate without changing the pass interface.

4.6 Waterline seam (no double-water)

Rule: exactly one surface shading; underwater is a post pass. Waterline is a blend mask:

mask = smoothstep(-ε, +ε, cameraY - η(xz)) or based on signed distance to surface.

Use it in composite:

above-water: WATER.surface

underwater: UNDERWATER.color

final = mix(UNDERWATER, WATER, mask) (plus optional “meniscus” rim)

Add debug DEBUG.WATERLINE_MASK.

5) Validation checklist
Visual sweeps (must look coherent)

Above water

glancing angles show strong reflection (Fresnel), face-on shows more refraction

foam areas look diffuse/bright and reduce mirror look

storm: whitecaps + wind streaks still reflect sky but are more matte

Underwater

distance fades with turbidity (σt), color shifts via absorption (σa)

bubbles increase haze/brightness and soften contrast

caustics visible in sunlit shallow shots; disappears in deep/overcast

Waterline

no double refraction, no duplicated highlights

stable blend when camera crosses surface (no flicker)

Perf / no-stall

No readbacks; all screen-space from RTs.

Pass count stable and registered.

LOD tiers:

far: disable underwater volume and caustics, keep simple surface + foam

mid: enable foam + basic refraction

near: enable underwater + caustics + spray lighting

Regression safety

If uEnvMap missing → fallback to sky color

If uSceneDepth missing → refraction disabled (safe)

6) Telemetry/debug views added

DEBUG.FRESNEL (NoV→F)

DEBUG.TRANSMITTANCE (Beer–Lambert Tr)

DEBUG.FOAM_MASK

DEBUG.BUBBLE_DENSITY

DEBUG.CAUSTICS

DEBUG.WATERLINE_MASK

DEBUG.PASS_LIST / DEBUG.RT_POOL / DEBUG.LOD_STATE












1) What we’re changing

Add backlit spray / mist lighting that matches the same SharedWaterLighting inputs (sun, sky/env, absorption/scatter) used by surface + underwater.

Render spray as a screen-space participating-medium proxy (per-particle “micro-volume”): outputs scattered radiance + soft extinction (not just additive glow).

Add depth-aware compositing (occlusion + soft depth fade) and LOD caps (distance tiers + max rendered particles), with no GPU readbacks.

2) Why

“Photo-real” lips in cinematics hinge on forward scattering: droplets look dim head-on, but explode in brightness when backlit (sun behind the spray relative to camera).

If spray lighting doesn’t share the same sun/sky inputs and tonemapping space as water surface/underwater, you get obvious seams (“glow stickers”).

We must keep the no-stall contract: spray lighting must be purely GPU, bounded by budgets, and schedulable (skip when no spray alive).

3) Implementation steps

Introduce SprayOptics uniforms and a shared HG phase function.

Add RENDER.SPRAY.ACCUM:

draw spray particles (from SPRAY.pos/vel textures) into an accum RT with premultiplied alpha.

Add RENDER.SPRAY.COMPOSITE:

final = base*(1-α) + sprayRGB (sprayRGB is premultiplied).

Add depth tests:

sample SceneDepth to hide spray behind geometry

sample water surface (η) to fade/kill droplets under the surface

Add LOD:

near: full spray lighting

mid: cheaper isotropic phase + no extinction

far: disable (keep only foam)

Add debug views: DEBUG.SPRAY_PHASE, DEBUG.SPRAY_ALPHA, DEBUG.SPRAY_OCCLUSION, DEBUG.SPRAY_LOD.

4) Code (TS / R3F + GLSL)
4.1 Optics model (math)

Treat each rendered droplet sprite as a tiny participating slab along the view ray.

Extinction: 
𝜎
𝑡
=
𝜎
𝑎
+
𝜎
𝑠
σ
t
	​

=σ
a
	​

+σ
s
	​


Transmittance through thickness 
𝑡
t:

𝑇
=
𝑒
−
𝜎
𝑡
𝑡
T=e
−σ
t
	​

t

Single-scatter from sun into camera (slab approximation):

𝐿
𝑠
𝑐
𝑎
𝑡
≈
𝐿
𝑠
𝑢
𝑛
  
𝜙
(
cos
⁡
𝜃
)
  
𝜎
𝑠
𝜎
𝑡
  
(
1
−
𝑇
)
L
scat
	​

≈L
sun
	​

ϕ(cosθ)
σ
t
	​

σ
s
	​

	​

(1−T)

Henyey–Greenstein phase (forward-scattering):

𝜙
(
cos
⁡
𝜃
)
=
1
−
𝑔
2
(
1
+
𝑔
2
−
2
𝑔
cos
⁡
𝜃
)
3
/
2
ϕ(cosθ)=
(1+g
2
−2gcosθ)
3/2
1−g
2
	​


Use 
𝑔
∈
[
0.8
,
0.95
]
g∈[0.8,0.95] for spray/mist.

Where:

cos
⁡
𝜃
=
⟨
−
𝐿
,
𝑉
⟩
cosθ=⟨−L,V⟩ (incoming from sun is 
−
𝐿
−L, outgoing to camera is 
𝑉
V)

backlit ⇒ 
cos
⁡
𝜃
→
1
cosθ→1 ⇒ strong lobe.

4.2 Render targets + pass registry

Add explicit passes:

{ id:"RENDER.SPRAY.ACCUM", phase:"RENDER", deps:["RENDER.SCENE.NO_WATER"], produces:["SPRAY.accum"], costTags:["draw","rtSprayAccum"] },
{ id:"RENDER.SPRAY.COMPOSITE", phase:"RENDER", deps:["RENDER.SPRAY.ACCUM"], produces:["FINAL.color"], costTags:["fsPass"] },


Allocate:

sprayAccumRT (RGBA half float). Store premultiplied color in RGB and alpha in A.

4.3 Spray renderer (draw from pos/vel textures)

Key idea: render N points; in vertex shader, use gl_VertexID to fetch particle position from SPRAY.posTex.

src/water/render/SprayRenderMaterial.ts
import * as THREE from "three";
import type { SharedWaterLighting } from "./SharedWaterLighting";

export function makeSprayRenderMaterial() {
  return new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    transparent: true,
    depthTest: false,      // we’ll do manual depth occlusion against scene depth
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendEquation: THREE.AddEquation,
    vertexShader: SPRAY_VS,
    fragmentShader: SPRAY_FS,
    uniforms: {
      // particle sim
      uPosTex: { value: null as unknown as THREE.Texture }, // xyz=pos, w=life
      uVelTex: { value: null as unknown as THREE.Texture },
      uTexSize: { value: new THREE.Vector2(512, 512) },
      uMaxParticlesDraw: { value: 262144 },

      // camera matrices
      uView: { value: new THREE.Matrix4() },
      uProj: { value: new THREE.Matrix4() },

      // scene buffers
      uSceneDepth: { value: null as unknown as THREE.Texture },
      uProjInv: { value: new THREE.Matrix4() },
      uViewInv: { value: new THREE.Matrix4() },

      // water surface for “underwater kill/fade”
      uHeightfieldInfoTex: { value: null as unknown as THREE.Texture }, // r=eta
      uDomainMin: { value: new THREE.Vector2() },
      uDomainSize: { value: new THREE.Vector2(1, 1) },

      // lighting
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uSunColor: { value: new THREE.Color(1, 1, 1) },
      uSkyColor: { value: new THREE.Color(0.6, 0.7, 0.9) },

      // spray optics
      uSigmaS: { value: 2.0 },       // effective σs (artist-scaled)
      uSigmaA: { value: 0.2 },       // effective σa (artist-scaled)
      uG: { value: 0.90 },           // HG anisotropy
      uThickness: { value: 0.06 },   // meters, effective slab thickness for dense core
      uSoftEdge: { value: 1.8 },     // controls sprite radial falloff
      uBacklightBoost: { value: 1.8 },

      // sizing/LOD
      uPointRadiusM: { value: 0.06 },  // meters -> pixels in VS
      uNearFadeM: { value: 1.0 },
      uFarFadeM: { value: 40.0 },

      // debug
      uDebugMode: { value: 0 }, // 0 normal, 1 phase, 2 alpha, 3 occlusion
      uTime: { value: 0 },
    },
  });
}

export function applySharedLightingToSpray(mat: THREE.RawShaderMaterial, L: SharedWaterLighting) {
  mat.uniforms.uSunDir.value.copy(L.sunDir);
  mat.uniforms.uSunColor.value.copy(L.sunColor);
  // sky color can be derived from env; keep as explicit for MV
}

src/water/render/SprayRenderer.ts
import * as THREE from "three";
import { makeSprayRenderMaterial } from "./SprayRenderMaterial";

export class SprayRenderer {
  private geom: THREE.BufferGeometry;
  private mat: THREE.RawShaderMaterial;
  private points: THREE.Points;

  constructor(maxParticlesDraw = 262144) {
    // Dummy vertex buffer: positions not used; gl_VertexID drives fetch
    const positions = new Float32Array(maxParticlesDraw * 3);
    this.geom = new THREE.BufferGeometry();
    this.geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.geom.setDrawRange(0, maxParticlesDraw);

    this.mat = makeSprayRenderMaterial();
    this.mat.uniforms.uMaxParticlesDraw.value = maxParticlesDraw;

    this.points = new THREE.Points(this.geom, this.mat);
    this.points.frustumCulled = false;
  }

  get object3D() { return this.points; }
  get material() { return this.mat; }
}

4.4 GLSL: backlit phase + extinction + depth occlusion
SPRAY_VS (GLSL3)
#version 300 es
precision highp float;

in vec3 position; // unused
uniform sampler2D uPosTex;
uniform vec2 uTexSize;
uniform float uMaxParticlesDraw;

uniform mat4 uView;
uniform mat4 uProj;

uniform float uPointRadiusM;
uniform float uNearFadeM;
uniform float uFarFadeM;

out vec4 vClip;
out vec3 vWorld;
out float vLife;
out float vFade;

vec4 fetchPos(int idx){
  int w = int(uTexSize.x);
  int x = idx % w;
  int y = idx / w;
  return texelFetch(uPosTex, ivec2(x,y), 0);
}

void main(){
  int idx = gl_VertexID;
  if (float(idx) >= uMaxParticlesDraw) {
    gl_Position = vec4(2.0,2.0,2.0,1.0);
    gl_PointSize = 0.0;
    vLife = 0.0;
    return;
  }

  vec4 p = fetchPos(idx);
  vLife = p.w;
  if (vLife <= 0.0){
    gl_Position = vec4(2.0,2.0,2.0,1.0);
    gl_PointSize = 0.0;
    return;
  }

  vWorld = p.xyz;

  vec4 viewPos = uView * vec4(vWorld, 1.0);
  float dist = length(viewPos.xyz);

  // LOD fade by distance
  float fade = 1.0;
  fade *= clamp((dist - uNearFadeM) / max(1e-3, (uFarFadeM - uNearFadeM)), 0.0, 1.0);
  fade = 1.0 - fade; // 1 near, 0 far
  vFade = fade;

  // Convert meters -> pixels (approx): size inversely proportional to depth
  // This is a simple heuristic; you can replace with exact projection scaling.
  float size = uPointRadiusM * 800.0 / max(1e-3, -viewPos.z);
  gl_PointSize = clamp(size, 1.0, 64.0);

  vClip = uProj * viewPos;
  gl_Position = vClip;
}

SPRAY_FS (GLSL3)
#version 300 es
precision highp float;

uniform sampler2D uSceneDepth;
uniform mat4 uProjInv;
uniform mat4 uViewInv;

uniform sampler2D uHeightfieldInfoTex;
uniform vec2 uDomainMin;
uniform vec2 uDomainSize;

uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uSkyColor;

uniform float uSigmaS;
uniform float uSigmaA;
uniform float uG;
uniform float uThickness;
uniform float uSoftEdge;
uniform float uBacklightBoost;

uniform int uDebugMode;

in vec4 vClip;
in vec3 vWorld;
in float vLife;
in float vFade;

out vec4 outColor;

float saturate(float x){ return clamp(x,0.0,1.0); }

vec3 reconstructWorld(vec2 uv, float depth01){
  vec4 ndc = vec4(uv*2.0-1.0, depth01*2.0-1.0, 1.0);
  vec4 view = uProjInv * ndc;
  view /= max(1e-6, view.w);
  vec4 world = uViewInv * view;
  return world.xyz;
}

float phaseHG(float cosT, float g){
  float gg = g*g;
  return (1.0 - gg) / pow(max(1e-4, 1.0 + gg - 2.0*g*cosT), 1.5);
}

float sampleEta(vec2 xz){
  vec2 uv = (xz - uDomainMin) / uDomainSize;
  uv = clamp(uv, 0.0, 1.0);
  return texture(uHeightfieldInfoTex, uv).r;
}

void main(){
  // Sprite radial profile (soft “micro-volume” footprint)
  vec2 pc = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(pc, pc);
  if (r2 > 1.0) discard;

  // Softer core -> more thickness near center
  float core = exp(-uSoftEdge * r2);
  float t = uThickness * core;

  // Camera ray vectors
  vec3 V = normalize(cameraPosition - vWorld);

  // Backlit scattering: cosθ = dot(incomingFromSun, outgoingToCam) = dot(-L, V)
  vec3 L = normalize(uSunDir);     // direction from point to sun
  float cosT = saturate(dot(-L, V));
  float ph = phaseHG(cosT, uG);

  // Depth occlusion vs scene
  vec2 screenUv = (vClip.xy / vClip.w) * 0.5 + 0.5;
  float d01 = texture(uSceneDepth, screenUv).r;
  vec3 hit = reconstructWorld(screenUv, d01);

  // If spray is behind hit point, fade it out (soft)
  float camToSpray = length(cameraPosition - vWorld);
  float camToHit = length(cameraPosition - hit);
  float occ = saturate((camToHit - camToSpray) * 6.0); // >0 means spray in front
  // occ ~1 in front, ~0 behind
  // Note: depends on your depth reconstruction correctness.

  // Kill/attenuate underwater spray (mist above surface only)
  float eta = sampleEta(vWorld.xz);
  float above = saturate((vWorld.y - (eta + 0.02)) * 40.0); // 0 below, 1 above

  // Effective coefficients
  float sigmaT = max(1e-4, uSigmaS + uSigmaA);
  float Tr = exp(-sigmaT * t);
  float alpha = (1.0 - Tr) * core;

  // Energy source: sun + a little sky fill
  vec3 sunIn = uSunColor * ph * uBacklightBoost;
  vec3 skyIn = uSkyColor * 0.25;
  vec3 Li = sunIn + skyIn;

  // Single scatter radiance proxy
  vec3 albedo = vec3(uSigmaS / sigmaT);
  vec3 scatter = Li * albedo * (1.0 - Tr);

  // Apply fades
  alpha *= vFade * occ * above * saturate(vLife);
  scatter *= vFade * occ * above * saturate(vLife);

  // Debug modes
  if (uDebugMode == 1) { outColor = vec4(vec3(ph * 0.2), 1.0); return; }
  if (uDebugMode == 2) { outColor = vec4(vec3(alpha), 1.0); return; }
  if (uDebugMode == 3) { outColor = vec4(vec3(occ), 1.0); return; }

  // Premultiplied output
  outColor = vec4(scatter, alpha);
}

4.5 Composite pass
src/water/passes/SprayCompositePass.ts
import * as THREE from "three";
import { FullscreenPass } from "../render/FullscreenPass";

export function makeSprayCompositePass() {
  return new FullscreenPass(new THREE.ShaderMaterial({
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }
    `,
    fragmentShader: /* glsl */`
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uBase;
      uniform sampler2D uSpray; // premultiplied rgb + alpha
      void main(){
        vec4 base = texture2D(uBase, vUv);
        vec4 s = texture2D(uSpray, vUv);
        vec3 outCol = base.rgb * (1.0 - s.a) + s.rgb;
        gl_FragColor = vec4(outCol, 1.0);
      }
    `,
    uniforms: {
      uBase: { value: null as unknown as THREE.Texture },
      uSpray: { value: null as unknown as THREE.Texture },
    },
    depthTest:false,
    depthWrite:false,
  }));
}

4.6 LOD + budgets (hard rules)

maxParticlesDraw by tier:

H0: 16k–32k

H1: 64k–128k

H2: 256k

Distance cull in VS already fades; also reduce drawRange:

near camera: draw full cap

mid: draw 25–50%

far: skip pass

Schedule:

if sprayAliveLikely == 0 and K_events_thisFrame == 0 → skip RENDER.SPRAY.ACCUM.

No readbacks. Maintain CPU-side “likely alive” counter from spawn budgets and lifetimes.

5) Validation checklist
Visual sweeps

SCENE.SPRAY.BACKLIT_LIP_PLUME:

with sun behind lip relative to camera, spray becomes bright and volumetric, not a flat glow.

rotate camera to front-lit: spray dims and becomes subtle.

SCENE.SURF.LINEUP_TYPES:

plunging events produce stronger spray brightness than spilling/surging/whitecaps (matches type bank).

Waterline:

spray is not visible underwater (above-mask works), and does not “cut out” incorrectly at horizon.

Perf

Pass count stable and registered.

No GPU readbacks.

Confirm RENDER.SPRAY.ACCUM cost scales with maxParticlesDraw only, and drops with LOD.

Regression safety

If no uHeightfieldInfoTex, disable underwater kill (or set above=1) rather than breaking.

If no scene depth, set occ=1 (spray always visible) in debug builds.















Thought for 1m 21s
1) What we’re changing

Add a Sea-Surface Aerosol (SSA) layer: a thin, wind-sheared mist/spindrift sheet that bridges foam ↔ spray and hugs crests continuously.

Drive SSA from the same truth sources you already have:

FoamField (persistent emitter)

EBT events (burst emitters: plunging + whitecap)

Wind (+ optional surface velocity) for advection/shear

Render SSA as a thin participating-medium proxy (HG forward scattering + soft extinction), sharing SharedWaterLighting with surface + underwater + spray.

2) Why

Storm/surf cinematics need the “continuous haze on crests” that connects:

foam sheets (surface)

spray plumes (particles)

atmosphere (air)

If this SSA isn’t unified with the same sun/sky/tonemap space, it reads as a separate effect. If it isn’t driven by foam/EBT, it drifts or pops.

We keep the no-stall contract: SSA is GPU-only (RTs + draw), with LOD caps and pass gating.

3) Implementation steps

SSA field (2D RT) in patch UV: R=density, G=age

Inject pass: add density from

foam (wind-dependent emission)

EBT slots (typed bursts with NMS-separated events)

Update pass: semi-Lagrangian advection by wind + (optional) surfVel, plus decay/diffusion

Render SSA mesh (same displaced water geometry, offset slightly upward):

compute per-pixel optical thickness from SSA density

use HG phase (forward scatter) + extinction (premultiplied)

depth-occlude against scene depth (like spray)

Add LOD & budgets:

SSA RT tiers (256/512)

disable SSA far distance

skip SSA update if (no events) AND (density below ε) (tracked CPU-side as “likely active”)

Add debug overlays + L0 counters.

4) Code (TS / three + GLSL)
4.1 Type-conditioned SSA parameters

src/water/effects/AerosolTypeBank.ts

export type TypeCode = 1 | 2 | 3 | 4; // spill, plunge, surge, whitecap

export interface AerosolParams {
  emitGain: number;      // burst gain from EBT
  foamEmitGain: number;  // continuous gain from foam
  decayPerSec: number;
  heightM: number;       // effective layer thickness
  drift: number;         // advection multiplier
}

export interface AerosolTypeBank {
  id: string;
  types: Record<TypeCode, AerosolParams>;
}

export const SURF_AEROSOL_BANK: AerosolTypeBank = {
  id: "BANK.SSA.SURF",
  types: {
    1: { emitGain: 0.40, foamEmitGain: 0.55, decayPerSec: 0.45, heightM: 0.20, drift: 1.00 }, // spilling: gentle haze
    2: { emitGain: 1.35, foamEmitGain: 0.75, decayPerSec: 0.70, heightM: 0.45, drift: 1.05 }, // plunging: strong spindrift
    3: { emitGain: 0.15, foamEmitGain: 0.25, decayPerSec: 0.35, heightM: 0.12, drift: 1.10 }, // surging: minimal
    4: { emitGain: 0.85, foamEmitGain: 0.65, decayPerSec: 1.10, heightM: 0.28, drift: 1.25 }, // whitecaps: shredded
  },
};

4.2 SSA field (inject + update)

water-showcase-unified/src/engines/oceansimv1/effects/AerosolField.ts

import * as THREE from "three";
import { FullscreenPass } from "../render/FullscreenPass";

export class AerosolField {
  aA: THREE.WebGLRenderTarget; // RGBA: R=density, G=age
  aB: THREE.WebGLRenderTarget;

  private injectPass: FullscreenPass;
  private updatePass: FullscreenPass;

  constructor(private gl: THREE.WebGLRenderer, res = 512) {
    const opts: THREE.WebGLRenderTargetOptions = {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      depthBuffer: false,
      stencilBuffer: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    };

    this.aA = new THREE.WebGLRenderTarget(res, res, opts);
    this.aB = new THREE.WebGLRenderTarget(res, res, opts);

    this.injectPass = new FullscreenPass(new THREE.ShaderMaterial({
      vertexShader: VS,
      fragmentShader: AEROSOL_INJECT_FRAG,
      uniforms: {
        uPrev: { value: this.aA.texture },
        uFoam: { value: null as unknown as THREE.Texture },   // R=foam
        uEBT0: { value: null as unknown as THREE.Texture },   // x,z,r,type
        uEBT1: { value: null as unknown as THREE.Texture },   // dirx,dirz,energy,time
        uDomainMin: { value: new THREE.Vector2() },
        uDomainSize: { value: new THREE.Vector2(1, 1) },
        uWindXZ: { value: new THREE.Vector2(6, 0) },          // m/s
        uSlots: { value: 8 },

        // per-type packed vec4: (emitGain, foamEmitGain, decayPerSec, heightM)
        uSSAType4: { value: new Array(16).fill(0) },

        uFoamPow: { value: 1.3 },
        uWindPow: { value: 1.2 },
      },
      depthTest: false, depthWrite: false,
    }));

    this.updatePass = new FullscreenPass(new THREE.ShaderMaterial({
      vertexShader: VS,
      fragmentShader: AEROSOL_UPDATE_FRAG,
      uniforms: {
        uPrev: { value: this.aA.texture },
        uSurfVel: { value: null as unknown as THREE.Texture }, // optional RG: vx,vz
        uUseSurfVel: { value: 0 },
        uWindXZ: { value: new THREE.Vector2(6, 0) },           // m/s
        uDomainSize: { value: new THREE.Vector2(1, 1) },
        uDt: { value: 1 / 60 },
        uDecay: { value: 0.80 },
        uDiffuse: { value: 0.06 },
        uDrift: { value: 1.0 },
      },
      depthTest: false, depthWrite: false,
    }));
  }

  inject(args: {
    foamTex: THREE.Texture;
    ebt0: THREE.Texture;
    ebt1: THREE.Texture;
    domainMin: THREE.Vector2;
    domainSize: THREE.Vector2;
    windXZ: THREE.Vector2;
    ssaType4: number[]; // len 16
  }) {
    const u = this.injectPass.mat.uniforms;
    u.uPrev.value = this.aA.texture;
    u.uFoam.value = args.foamTex;
    u.uEBT0.value = args.ebt0;
    u.uEBT1.value = args.ebt1;
    u.uDomainMin.value.copy(args.domainMin);
    u.uDomainSize.value.copy(args.domainSize);
    u.uWindXZ.value.copy(args.windXZ);
    u.uSSAType4.value = args.ssaType4;

    this.injectPass.render(this.gl, this.aB);
    this.swap();
  }

  update(args: {
    dt: number;
    domainSize: THREE.Vector2;
    windXZ: THREE.Vector2;
    decay: number;
    diffuse: number;
    drift: number;
    surfVelTex?: THREE.Texture;
  }) {
    const u = this.updatePass.mat.uniforms;
    u.uPrev.value = this.aA.texture;
    u.uDt.value = args.dt;
    u.uDomainSize.value.copy(args.domainSize);
    u.uWindXZ.value.copy(args.windXZ);
    u.uDecay.value = args.decay;
    u.uDiffuse.value = args.diffuse;
    u.uDrift.value = args.drift;

    if (args.surfVelTex) {
      u.uSurfVel.value = args.surfVelTex;
      u.uUseSurfVel.value = 1;
    } else {
      u.uUseSurfVel.value = 0;
    }

    this.updatePass.render(this.gl, this.aB);
    this.swap();
  }

  private swap() {
    const t = this.aA; this.aA = this.aB; this.aB = t;
  }
}

const VS = /* glsl */`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy,0.0,1.0); }
`;

const AEROSOL_INJECT_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;

uniform sampler2D uPrev;
uniform sampler2D uFoam;
uniform sampler2D uEBT0;
uniform sampler2D uEBT1;
uniform vec2 uDomainMin;
uniform vec2 uDomainSize;
uniform vec2 uWindXZ;
uniform int uSlots;
uniform float uSSAType4[16];
uniform float uFoamPow;
uniform float uWindPow;

vec4 load4(const float a[16], int idx){
  int o = idx * 4;
  return vec4(a[o+0], a[o+1], a[o+2], a[o+3]);
}

float sat(float x){ return clamp(x,0.0,1.0); }
float gauss(float r, float sigma){
  float x = r / max(1e-5, sigma);
  return exp(-0.5 * x * x);
}

void main(){
  vec4 prev = texture2D(uPrev, vUv);
  float dens = prev.r;
  float age  = prev.g;

  float foam = texture2D(uFoam, vUv).r;
  float wind = length(uWindXZ);

  // continuous emission from foam (wind-dependent)
  float foamEmit = pow(sat(foam), uFoamPow) * pow(sat(wind / 12.0), uWindPow);

  // typed bursts from EBT slots
  vec2 xz = uDomainMin + vUv * uDomainSize;
  float burst = 0.0;
  float decayLocal = 0.8;
  float heightLocal = 0.25;

  for (int k = 0; k < 8; k++){
    if (k >= uSlots) break;
    float slotU = (float(k) + 0.5) / float(uSlots);

    vec4 e0 = texture2D(uEBT0, vec2(slotU, 0.5)); // x,z,r,type
    vec4 e1 = texture2D(uEBT1, vec2(slotU, 0.5)); // dirx,dirz,energy,time

    float energy = e1.b;
    if (energy <= 1e-4) continue;

    int typeCode = int(clamp(round(e0.a), 1.0, 4.0));
    int tIdx = typeCode - 1;
    vec4 p = load4(uSSAType4, tIdx);
    float emitGain = p.x;
    float foamGain = p.y;
    decayLocal = max(decayLocal, p.z);
    heightLocal = max(heightLocal, p.w);

    vec2 exz = e0.rg;
    float radiusM = max(0.25, e0.b);
    float r = length(xz - exz);

    // burst footprint (wider than foam injection to look like haze)
    float w = gauss(r, radiusM * 0.9);
    burst += emitGain * energy * w;

    // foam contribution “boosted” near active events
    foamEmit *= (1.0 + foamGain * energy * w);
  }

  dens += burst + 0.6 * foamEmit;
  dens = clamp(dens, 0.0, 1.0);

  // refresh age when emitting
  age = (burst + foamEmit > 1e-3) ? 0.0 : min(1.0, age + 0.01);

  gl_FragColor = vec4(dens, age, 0.0, 1.0);
}
`;

const AEROSOL_UPDATE_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;

uniform sampler2D uPrev;
uniform sampler2D uSurfVel;
uniform int uUseSurfVel;
uniform vec2 uWindXZ;
uniform vec2 uDomainSize;
uniform float uDt;
uniform float uDecay;
uniform float uDiffuse;
uniform float uDrift;

float sat(float x){ return clamp(x,0.0,1.0); }

vec2 texelSize(){
  // MV; pass exact size if you want
  return vec2(1.0/512.0);
}

void main(){
  vec2 wind = uWindXZ * uDrift;
  vec2 vel = wind;

  if (uUseSurfVel == 1) {
    vec2 sv = texture2D(uSurfVel, vUv).rg;
    vel += 0.25 * sv; // SSA mostly wind-driven
  }

  vec2 duv = (vel * uDt) / max(vec2(1e-3), uDomainSize);
  vec2 uv0 = vUv - duv;

  vec4 prev = texture2D(uPrev, uv0);
  float dens = prev.r;
  float age  = prev.g;

  dens = dens * exp(-uDecay * uDt);
  age  = min(1.0, age + uDt * 0.25);

  // small diffusion to avoid aliasing/flicker
  vec2 ts = texelSize();
  float n = texture2D(uPrev, uv0 + vec2(0.0, ts.y)).r;
  float s = texture2D(uPrev, uv0 - vec2(0.0, ts.y)).r;
  float e = texture2D(uPrev, uv0 + vec2(ts.x, 0.0)).r;
  float w = texture2D(uPrev, uv0 - vec2(ts.x, 0.0)).r;
  float lap = (n + s + e + w - 4.0 * prev.r);

  dens = clamp(dens + uDiffuse * lap * uDt, 0.0, 1.0);

  gl_FragColor = vec4(dens, age, 0.0, 1.0);
}
`;


Packing uSSAType4:

// vec4 per type: (emitGain, foamEmitGain, decayPerSec, heightM)
const ssaType4 = [
  bank.types[1].emitGain, bank.types[1].foamEmitGain, bank.types[1].decayPerSec, bank.types[1].heightM,
  bank.types[2].emitGain, bank.types[2].foamEmitGain, bank.types[2].decayPerSec, bank.types[2].heightM,
  bank.types[3].emitGain, bank.types[3].foamEmitGain, bank.types[3].decayPerSec, bank.types[3].heightM,
  bank.types[4].emitGain, bank.types[4].foamEmitGain, bank.types[4].decayPerSec, bank.types[4].heightM,
];

4.3 SSA renderer as a displaced “mist sheet” mesh

This makes haze visible against the sky (not only on water pixels).

src/water/render/AerosolSurfaceMaterial.ts

import * as THREE from "three";
import type { SharedWaterLighting } from "./SharedWaterLighting";

export function makeAerosolSurfaceMaterial() {
  return new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    transparent: true,
    depthWrite: false,
    depthTest: false, // manual depth occlusion like spray
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendEquation: THREE.AddEquation,
    vertexShader: SSA_VS,
    fragmentShader: SSA_FS,
    uniforms: {
      // geometry mapping
      uDomainMin: { value: new THREE.Vector2() },
      uDomainSize: { value: new THREE.Vector2(1, 1) },
      uHeightfieldInfoTex: { value: null as unknown as THREE.Texture }, // r=eta
      uAerosolTex: { value: null as unknown as THREE.Texture },         // R=density, G=age
      uSSAType4: { value: new Array(16).fill(0) },                      // (emitGain, foamGain, decay, height)*4

      // scene depth occlusion
      uSceneDepth: { value: null as unknown as THREE.Texture },
      uProjInv: { value: new THREE.Matrix4() },
      uViewInv: { value: new THREE.Matrix4() },

      // lighting (shared)
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uSunColor: { value: new THREE.Color(1, 1, 1) },
      uSkyColor: { value: new THREE.Color(0.6, 0.7, 0.9) },

      // optics
      uSigmaS: { value: 1.6 },
      uSigmaA: { value: 0.12 },
      uG: { value: 0.90 },
      uBacklightBoost: { value: 1.6 },

      // placement
      uLiftM: { value: 0.06 },        // push above water to avoid z-fight
      uAlphaScale: { value: 1.0 },
      uUnderwater: { value: 0 },      // fade out when underwater

      // debug
      uDebugMode: { value: 0 }, // 0 normal, 1 phase, 2 alpha, 3 occlusion, 4 density
    },
  });
}

export function applySharedLightingToSSA(mat: THREE.RawShaderMaterial, L: SharedWaterLighting) {
  mat.uniforms.uSunDir.value.copy(L.sunDir);
  mat.uniforms.uSunColor.value.copy(L.sunColor);
  mat.uniforms.uUnderwater.value = L.underwater | 0;
}


SSA_VS (displace water mesh upward by η + lift):

#version 300 es
precision highp float;

in vec3 position;
in vec2 uv;

uniform sampler2D uHeightfieldInfoTex;
uniform float uLiftM;

out vec2 vUv;
out vec3 vWorld;
out vec4 vClip;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

void main(){
  vUv = uv;

  // heightfield in the same UV domain
  float eta = texture(uHeightfieldInfoTex, uv).r;

  vec3 pos = position;
  pos.y += eta + uLiftM;

  vec4 world = modelMatrix * vec4(pos, 1.0);
  vWorld = world.xyz;

  vec4 clip = projectionMatrix * viewMatrix * world;
  vClip = clip;
  gl_Position = clip;
}


SSA_FS (HG forward scatter + extinction, premultiplied + depth-occlude):

#version 300 es
precision highp float;

in vec2 vUv;
in vec3 vWorld;
in vec4 vClip;
out vec4 outColor;

uniform sampler2D uAerosolTex; // R=density
uniform sampler2D uSceneDepth;
uniform mat4 uProjInv;
uniform mat4 uViewInv;

uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uSkyColor;

uniform float uSigmaS;
uniform float uSigmaA;
uniform float uG;
uniform float uBacklightBoost;

uniform float uAlphaScale;
uniform int uUnderwater;
uniform int uDebugMode;

float sat(float x){ return clamp(x,0.0,1.0); }

vec3 reconstructWorld(vec2 uv, float depth01){
  vec4 ndc = vec4(uv*2.0-1.0, depth01*2.0-1.0, 1.0);
  vec4 view = uProjInv * ndc;
  view /= max(1e-6, view.w);
  vec4 world = uViewInv * view;
  return world.xyz;
}

float phaseHG(float cosT, float g){
  float gg = g*g;
  return (1.0 - gg) / pow(max(1e-4, 1.0 + gg - 2.0*g*cosT), 1.5);
}

void main(){
  float dens = texture(uAerosolTex, vUv).r;
  if (dens <= 1e-4) discard;

  // compute backlit phase
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 L = normalize(uSunDir);
  float cosT = sat(dot(-L, V));
  float ph = phaseHG(cosT, uG);

  // depth occlusion against scene
  vec2 screenUv = (vClip.xy / vClip.w) * 0.5 + 0.5;
  float d01 = texture(uSceneDepth, screenUv).r;
  vec3 hit = reconstructWorld(screenUv, d01);
  float camToSSA = length(cameraPosition - vWorld);
  float camToHit = length(cameraPosition - hit);
  float occ = sat((camToHit - camToSSA) * 6.0);

  // thickness proxy: density scales effective slab thickness
  float t = 0.20 * dens; // meters (MV). You can use per-type height later if needed.
  float sigmaT = max(1e-4, uSigmaS + uSigmaA);
  float Tr = exp(-sigmaT * t);

  float alpha = (1.0 - Tr) * dens * uAlphaScale;
  vec3 albedo = vec3(uSigmaS / sigmaT);

  vec3 Li = uSunColor * (ph * uBacklightBoost) + uSkyColor * 0.20;
  vec3 scatter = Li * albedo * (1.0 - Tr);

  // underwater fade-out (SSA is atmospheric; you can keep tiny residue if desired)
  float uw = (uUnderwater == 1) ? 0.0 : 1.0;

  alpha *= occ * uw;
  scatter *= occ * uw;

  if (uDebugMode == 1) { outColor = vec4(vec3(ph * 0.2), 1.0); return; }
  if (uDebugMode == 2) { outColor = vec4(vec3(alpha), 1.0); return; }
  if (uDebugMode == 3) { outColor = vec4(vec3(occ), 1.0); return; }
  if (uDebugMode == 4) { outColor = vec4(vec3(dens), 1.0); return; }

  outColor = vec4(scatter, alpha); // premultiplied
}

4.4 Pass registry (explicit, gated)

Add:

{ id:"SIM.SSA.INJECT", phase:"SIM", flag:"ssa", deps:["SIM.FOAM.UPDATE"], produces:["SSA.field"], costTags:["fsPass","rtSSA"] },
{ id:"SIM.SSA.UPDATE", phase:"SIM", flag:"ssa", deps:["SIM.SSA.INJECT"], produces:["SSA.field"], costTags:["fsPass","rtSSA"] },
{ id:"RENDER.SSA.DRAW", phase:"RENDER", flag:"ssa", deps:["RENDER.SCENE.NO_WATER"], produces:["SSA.accum"], costTags:["draw"] },
{ id:"RENDER.SSA.COMPOSITE", phase:"RENDER", flag:"ssa", deps:["RENDER.SSA.DRAW"], produces:["FINAL.color"], costTags:["fsPass"] },


Scheduling gates:

Skip SSA sim if: K_events_thisFrame == 0 AND foamLikelyLow == true AND ssaLikelyActive == false

Skip SSA render if: ssaLikelyActive == false OR camera far tier

No readbacks—“likelyActive” comes from budgets/emission decisions on CPU.

5) Validation checklist
Visual sweeps

Storm crest haze continuity

SSA appears as a continuous low layer hugging crests and streaking with wind.

It bridges foam areas into faint spindrift without needing dense spray particles everywhere.

Backlit behavior

Turn sun behind the crests: SSA brightens strongly (forward scattering).

Front-lit: SSA becomes subtle and mostly disappears.

Type behavior

Plunging/whitecaps yield more SSA density near active EBT slots.

Surging yields minimal SSA.

Waterline

SSA does not pop when camera crosses near the surface; it fades out underwater.

Perf / no-stall

No new readbacks.

SSA RT tier scales (256/512); render can be disabled at distance.

Pass count stable and visible in DEBUG.PASS_LIST.

Regression safety

If no foam/EBT: SSA stays empty (no haze).

If no scene depth: set occ=1 fallback (SSA visible, but stable).




















1) What we’re changing

Add a Shoreline + Swash system that unifies ocean / lake / river edges with the same dataflow:

Contact (water covers terrain?) + band (shoreline distance) + swash velocity

Wetness memory (hysteresis) + swash foam band (deposit + decay)

Feed shoreline outputs into terrain shading (wet sand/rock, spec/roughness shift, darkening) and into water/foam injection (swash foam line).

Register explicit passes (no silent work): SIM.SHORE.CONTACT, SIM.SHORE.WETNESS, SIM.SHORE.FOAM_BAND, RENDER.TERRAIN.WETNESS_APPLY, plus debug views.

2) Why

Shoreline realism is the #1 giveaway in games: the runup/backwash band, wet sand darkening, specular sheen, and micro ripples must all agree with actual water coverage.

This must work across water types:

Ocean: waves drive runup

Lake: gentle oscillation, minimal flow

River: strong directional flow + bank wetting

Must obey no-stall: shoreline is derived from GPU textures (water height, terrain height/normal, optional flow), never read back.

3) Implementation steps

Define canonical textures (same UV/domain as near patch):

WATER.heightInfoTex (η)

TERRAIN.heightTex (terrain Y in meters), optional TERRAIN.normalTex

Outputs:

SHORE.contactTex (R=cover, G=band01, B=slope, A=unused)

SHORE.wetTex (R=wetness01, G=wetAge, B=swash01, A=foamDeposit)

SIM.SHORE.CONTACT: compute cover + shoreline band (cheap signed-distance proxy) + slope magnitude.

SIM.SHORE.WETNESS: update wetness with hysteresis:

if covered → wetness rises fast

if uncovered → wetness decays slowly (material memory)

SIM.SHORE.FOAM_BAND: deposit foam in a thin band near the shoreline based on incoming swash strength (ocean uses wave direction SF1; river uses flow).

RENDER.TERRAIN.WETNESS_APPLY: terrain shader uses wetness01 to darken albedo + reduce roughness + boost spec + add micro-normal.

Add LOD gating:

only near/mid tiers compute wetness/foam band; far uses static shoreline tint.

4) Code (TS + GLSL)
4.1 Shoreline system wiring
water-showcase-unified/src/engines/oceansimv1/shore/ShorelineSystem.ts
import * as THREE from "three";
import { FullscreenPass } from "../render/FullscreenPass";

export class ShorelineSystem {
  contactA: THREE.WebGLRenderTarget;
  contactB: THREE.WebGLRenderTarget;

  wetA: THREE.WebGLRenderTarget;
  wetB: THREE.WebGLRenderTarget;

  private contactPass: FullscreenPass;
  private wetnessPass: FullscreenPass;
  private foamBandPass: FullscreenPass;

  constructor(private gl: THREE.WebGLRenderer, res = 512) {
    const rtOpts: THREE.WebGLRenderTargetOptions = {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      depthBuffer: false,
      stencilBuffer: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    };

    this.contactA = new THREE.WebGLRenderTarget(res, res, rtOpts);
    this.contactB = new THREE.WebGLRenderTarget(res, res, rtOpts);
    this.wetA = new THREE.WebGLRenderTarget(res, res, rtOpts);
    this.wetB = new THREE.WebGLRenderTarget(res, res, rtOpts);

    this.contactPass = new FullscreenPass(new THREE.ShaderMaterial({
      vertexShader: VS,
      fragmentShader: SHORE_CONTACT_FRAG,
      uniforms: {
        uWaterInfo: { value: null as unknown as THREE.Texture }, // r=eta
        uTerrainH: { value: null as unknown as THREE.Texture },  // r=height
        uDomainMin: { value: new THREE.Vector2() },
        uDomainSize:{ value: new THREE.Vector2(1,1) },
        uSeaLevel: { value: 0.0 },
        uBandMeters: { value: 3.0 }, // width of shoreline band
      },
      depthTest:false, depthWrite:false,
    }));

    this.wetnessPass = new FullscreenPass(new THREE.ShaderMaterial({
      vertexShader: VS,
      fragmentShader: SHORE_WETNESS_FRAG,
      uniforms: {
        uContact: { value: this.contactA.texture },
        uWetPrev: { value: this.wetA.texture },
        uDt: { value: 1/60 },
        uWetRisePerSec: { value: 3.5 },   // fast wetting when covered
        uWetDryPerSec: { value: 0.20 },   // slow drying when uncovered
        uEdgeBoost: { value: 0.8 },       // extra wetting near shoreline band
      },
      depthTest:false, depthWrite:false,
    }));

    this.foamBandPass = new FullscreenPass(new THREE.ShaderMaterial({
      vertexShader: VS,
      fragmentShader: SHORE_FOAM_BAND_FRAG,
      uniforms: {
        uContact: { value: this.contactA.texture }, // R cover, G band01
        uWet: { value: this.wetA.texture },         // R wetness
        uFoamPrev: { value: this.wetA.texture },    // store foamDeposit in A
        uSF1: { value: null as unknown as THREE.Texture }, // optional wave dir
        uFlow: { value: null as unknown as THREE.Texture },// optional river flow
        uUseFlow: { value: 0 },
        uDt: { value: 1/60 },
        uDepositGain: { value: 1.0 },
        uFoamDecayPerSec: { value: 0.8 },
      },
      depthTest:false, depthWrite:false,
    }));
  }

  update(args: {
    waterInfoTex: THREE.Texture;
    terrainHeightTex: THREE.Texture;
    domainMin: THREE.Vector2;
    domainSize: THREE.Vector2;
    seaLevel: number;
    dt: number;

    // optional drivers
    sf1Tex?: THREE.Texture;     // ocean wave direction
    flowTex?: THREE.Texture;    // river flow direction/speed

    // LOD knobs
    bandMeters: number;
  }) {
    // CONTACT
    {
      const u = this.contactPass.mat.uniforms;
      u.uWaterInfo.value = args.waterInfoTex;
      u.uTerrainH.value = args.terrainHeightTex;
      u.uDomainMin.value.copy(args.domainMin);
      u.uDomainSize.value.copy(args.domainSize);
      u.uSeaLevel.value = args.seaLevel;
      u.uBandMeters.value = args.bandMeters;
      this.contactPass.render(this.gl, this.contactB);
      this.swapContact();
    }

    // WETNESS
    {
      const u = this.wetnessPass.mat.uniforms;
      u.uContact.value = this.contactA.texture;
      u.uWetPrev.value = this.wetA.texture;
      u.uDt.value = args.dt;
      this.wetnessPass.render(this.gl, this.wetB);
      this.swapWet();
    }

    // FOAM BAND (writes foamDeposit into wetTex alpha)
    {
      const u = this.foamBandPass.mat.uniforms;
      u.uContact.value = this.contactA.texture;
      u.uWet.value = this.wetA.texture;
      u.uFoamPrev.value = this.wetA.texture;

      if (args.flowTex) { u.uFlow.value = args.flowTex; u.uUseFlow.value = 1; }
      else { u.uUseFlow.value = 0; }

      if (args.sf1Tex) u.uSF1.value = args.sf1Tex;

      u.uDt.value = args.dt;
      this.foamBandPass.render(this.gl, this.wetB);
      this.swapWet();
    }
  }

  private swapContact(){ const t=this.contactA; this.contactA=this.contactB; this.contactB=t; }
  private swapWet(){ const t=this.wetA; this.wetA=this.wetB; this.wetB=t; }
}

const VS = /* glsl */`
varying vec2 vUv;
void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }
`;

4.2 Shore contact shader (cover + shoreline band)
SHORE_CONTACT_FRAG (contact field)
precision highp float;
varying vec2 vUv;

uniform sampler2D uWaterInfo; // r=eta
uniform sampler2D uTerrainH;  // r=terrain height (m)
uniform vec2 uDomainMin;
uniform vec2 uDomainSize;
uniform float uSeaLevel;
uniform float uBandMeters;

float sat(float x){ return clamp(x,0.0,1.0); }

// Approx band using local height difference |(waterY - terrainY)|
// (Not true distance-to-contour, but stable, cheap, and good-looking.)
void main(){
  float eta = texture2D(uWaterInfo, vUv).r + uSeaLevel;
  float hT  = texture2D(uTerrainH, vUv).r;

  float d = eta - hT;              // + means water above terrain
  float cover = sat(d * 20.0);     // sharp cover (tune)
  // band01 = 1 near the shoreline, 0 away (both sides)
  float band01 = 1.0 - sat(abs(d) / max(1e-3, uBandMeters));

  // slope proxy (optional): finite diff on terrain height
  vec2 ts = vec2(1.0/512.0); // pass exact if desired
  float hx = texture2D(uTerrainH, vUv + vec2(ts.x,0)).r - texture2D(uTerrainH, vUv - vec2(ts.x,0)).r;
  float hz = texture2D(uTerrainH, vUv + vec2(0,ts.y)).r - texture2D(uTerrainH, vUv - vec2(0,ts.y)).r;
  float slope = sat(length(vec2(hx,hz)) * 30.0);

  gl_FragColor = vec4(cover, band01, slope, 1.0);
}

4.3 Wetness memory shader (hysteresis)
SHORE_WETNESS_FRAG
precision highp float;
varying vec2 vUv;

uniform sampler2D uContact; // R cover, G band01
uniform sampler2D uWetPrev; // R wetness, G age, B swash, A foamDeposit
uniform float uDt;
uniform float uWetRisePerSec;
uniform float uWetDryPerSec;
uniform float uEdgeBoost;

float sat(float x){ return clamp(x,0.0,1.0); }

void main(){
  vec4 c = texture2D(uContact, vUv);
  float cover = c.r;
  float band01 = c.g;

  vec4 prev = texture2D(uWetPrev, vUv);
  float wet = prev.r;
  float age = prev.g;
  float swash = prev.b;
  float foamDeposit = prev.a;

  // Wetting when covered, drying when uncovered
  float rise = uWetRisePerSec * (1.0 + uEdgeBoost * band01);
  float dry  = uWetDryPerSec;

  wet += (cover > 0.5 ? rise : -dry) * uDt;
  wet = sat(wet);

  // Age is "time since last wet"
  age = (cover > 0.5) ? 0.0 : min(1.0, age + uDt * 0.15);

  // swash (B) reserved for later; keep stable
  swash = prev.b;

  gl_FragColor = vec4(wet, age, swash, foamDeposit);
}

4.4 Swash foam band deposition (ocean uses SF1, river uses flow)
SHORE_FOAM_BAND_FRAG
precision highp float;
varying vec2 vUv;

uniform sampler2D uContact; // R cover, G band01
uniform sampler2D uWet;     // R wetness
uniform sampler2D uFoamPrev;// A foamDeposit

uniform sampler2D uSF1;     // RG packed wave dir (optional)
uniform sampler2D uFlow;    // RG flow dir/speed (optional)
uniform int uUseFlow;

uniform float uDt;
uniform float uDepositGain;
uniform float uFoamDecayPerSec;

float sat(float x){ return clamp(x,0.0,1.0); }

vec2 decodeDir(vec2 rg){
  vec2 d = rg * 2.0 - 1.0;
  return d / max(1e-4, length(d));
}

void main(){
  vec4 c = texture2D(uContact, vUv);
  float cover = c.r;
  float band01 = c.g;

  vec4 w = texture2D(uWet, vUv);
  float wet = w.r;

  float foamDeposit = texture2D(uFoamPrev, vUv).a;
  foamDeposit *= exp(-uFoamDecayPerSec * uDt);

  // “Incoming swash” proxy:
  // - Ocean: stronger where band is high + wet is high (recently covered), wave dir exists
  // - River: stronger where band is high + flow exists
  float incoming = band01 * wet;

  if (uUseFlow == 1) {
    vec2 f = texture2D(uFlow, vUv).rg; // assume magnitude encoded
    float speed = length(f);
    incoming *= sat(speed / 2.0);
  } else {
    vec2 sf1 = texture2D(uSF1, vUv).rg;
    vec2 F = decodeDir(sf1);
    // If you have shoreline normal, project; MV just uses presence
    incoming *= 1.0;
  }

  // Deposit foam right at shoreline (thin band)
  float deposit = uDepositGain * incoming * band01;
  foamDeposit = sat(foamDeposit + deposit * uDt * 2.0);

  // Output keeps wetness/age, writes foamDeposit in A
  gl_FragColor = vec4(wet, w.g, w.b, foamDeposit);
}

4.5 Terrain shading hook (wet sand/rock)

Rule: Wetness affects terrain material, not water. One truth.

src/terrain/materials/TerrainWetness.glsl (snippet)
// inputs: baseColor, roughness, normal
uniform sampler2D uWetTex; // R wetness
uniform vec3 uWetDarken;   // e.g. (0.22,0.18,0.12)
uniform float uWetRoughnessMin; // e.g. 0.12
uniform float uWetSpecBoost;    // e.g. 0.25

float wet = texture2D(uWetTex, vUvWaterDomain).r; // same domain UV mapping for shoreline area

// Darken toward wet color
baseColor = mix(baseColor, baseColor * (1.0 - uWetDarken), wet);

// Reduce roughness (more sheen)
roughness = mix(roughness, min(roughness, uWetRoughnessMin), wet);

// Optional: boost spec intensity (if you have spec/metal workflow)
specular = specular + uWetSpecBoost * wet;

// Micro-normal: add subtle ripples only where wet (separate from main waves!)
normal = normalize(mix(normal, perturbWetMicroNormal(normal), wet));

5) Validation checklist
Visual sweeps (shoreline must read real)

Swash band: a thin, dynamic foam line appears at the edge and retreats/advances smoothly.

Wet sand: darkening + sheen persists briefly after water leaves (hysteresis), then dries.

Ocean vs lake vs river:

lake: wetness changes but little directional streaking

river: wetness + foam streaks align with flow

ocean: foam band aligns with wave-driven runup

Perf / no-stall

No readbacks.

RT tiers: shoreRes=256/512 gated by distance tier.

Pass gating: if shoreline not in view (or camera far), skip SIM.SHORE.*.

Regression safety

If terrainHeightTex absent → disable shoreline system (wetness = 0).

If SF/flow missing → foam band deposits only from wetness (still stable).












1) What we’re changing

We’re adding a nearshore Swash solver (runup + backwash) that produces film thickness + along-slope velocity + wetness memory + foam deposit in one GPU state texture.

We’re replacing the “shoreline foam band = wetness * band” hack with physics-shaped motion: wave impulse pushes water upslope, gravity + friction pulls it downslope, and the film advects along the shoreline normal.

We’re keeping it GPU-only, LOD-capped, no-stall and explicitly registered as SIM.SWASH.UPDATE.

2) Why

The shoreline “truth” isn’t just coverage; it’s runup/backwash dynamics:

the wet band advances with incoming waves, then retreats as backwash

foam appears as a moving front with shear, not a static ring

wet sand has memory (hysteresis), not frame-to-frame toggling

This gives you a unified solution for ocean / lake / river edges:

ocean: driven by η̇ + wave direction (SF1)

river: driven by flow velocity

lake: weak periodic drive (η̇ small), mostly gravity/friction

3) Implementation steps

Keep SIM.SHORE.CONTACT as-is (cover + band + slope proxy).

Add a single Swash state RT:
SHORE.swashTex RGBA = (h_film_m, u_alongN_mps, wetness01, foamDeposit01)

Implement SIM.SWASH.UPDATE (one fullscreen pass) that:

computes shoreline normal n_uphill from terrain height gradient

builds 2D velocity v = u * n_uphill

semi-Lagrangian advects (h, u) by v (stable, CFL-friendly)

applies forces:

wave impulse (ocean): +k * max(0,η̇) * max(0, dot(F, n_uphill)) * band

flow impulse (river): +kFlow * dot(flow, n_uphill)

gravity pullback: -g * slope * dt

friction: u *= exp(-c_f * dt)

updates wetness hysteresis from film thickness + cover

updates foamDeposit from shear |u| near shoreline band

Terrain shading uses wetness (B) and foamDeposit (A) directly.

Water/foam injection uses foamDeposit to seed FoamField near shore (cheap and coherent).

LOD caps:

swashResTier 256/512 near-only

skip pass if shoreline band not visible or if bandMax is low (CPU-side camera heuristics, no readback)

4) Code
4.1 New pass registration (explicit)
{ id:"SIM.SWASH.UPDATE", phase:"SIM", flag:"swash", deps:["SIM.SHORE.CONTACT"], produces:["SHORE.swashTex"], costTags:["fsPass","rtSwash"] },
{ id:"RENDER.TERRAIN.WETNESS_APPLY", phase:"RENDER", flag:"swash", deps:["SIM.SWASH.UPDATE"], produces:["TERRAIN.shaded"], costTags:["terrain"] },

4.2 Swash system (TS)

water-showcase-unified/src/engines/oceansimv1/shore/SwashSystem.ts

import * as THREE from "three";
import { FullscreenPass } from "../render/FullscreenPass";

export class SwashSystem {
  swashA: THREE.WebGLRenderTarget; // RGBA: h,u,wet,foam
  swashB: THREE.WebGLRenderTarget;

  private pass: FullscreenPass;

  constructor(private gl: THREE.WebGLRenderer, res = 512) {
    const opts: THREE.WebGLRenderTargetOptions = {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      depthBuffer: false,
      stencilBuffer: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    };
    this.swashA = new THREE.WebGLRenderTarget(res, res, opts);
    this.swashB = new THREE.WebGLRenderTarget(res, res, opts);

    this.pass = new FullscreenPass(new THREE.ShaderMaterial({
      vertexShader: VS,
      fragmentShader: SWASH_UPDATE_FRAG,
      uniforms: {
        uSwashPrev: { value: this.swashA.texture },
        uContact: { value: null as unknown as THREE.Texture },   // R cover, G band01, B slopeProxy
        uTerrainH: { value: null as unknown as THREE.Texture },  // R height (m)

        // Ocean drive
        uWaterInfo: { value: null as unknown as THREE.Texture }, // r=eta, g=etaDotProxy
        uSF1: { value: null as unknown as THREE.Texture },       // RG packed F
        uUseOceanDrive: { value: 1 },

        // River drive (optional)
        uFlow: { value: null as unknown as THREE.Texture },      // RG flow (m/s) or packed
        uUseFlow: { value: 0 },

        uDomainSize: { value: new THREE.Vector2(1, 1) },
        uDt: { value: 1/60 },

        // Physics knobs (scene-scaled)
        uG: { value: 9.81 },
        uFriction: { value: 2.2 },         // 1/s
        uInfiltration: { value: 0.45 },    // 1/s (kills thin film over time)
        uCoverFillRate: { value: 0.12 },   // m/s source when covered (caps)
        uFilmCapM: { value: 0.12 },        // max film thickness (m)

        // Ocean impulse
        uWaveImpulseGain: { value: 0.55 }, // scales η̇-driven runup
        uEtaDotScale: { value: 1.0 },      // converts info.g to m/s if needed

        // Wetness + foam
        uWetRefM: { value: 0.02 },         // thickness that maps to wet=1
        uWetDryPerSec: { value: 0.18 },
        uFoamDepositGain: { value: 0.55 },
        uFoamDecayPerSec: { value: 0.85 },

        // Stability clamps
        uUMax: { value: 8.0 },             // m/s
      },
      depthTest:false,
      depthWrite:false,
    }));
  }

  update(args: {
    contactTex: THREE.Texture;
    terrainHeightTex: THREE.Texture;
    waterInfoTex: THREE.Texture;
    sf1Tex: THREE.Texture;
    domainSize: THREE.Vector2;
    dt: number;

    flowTex?: THREE.Texture;

    // knobs
    useOceanDrive: boolean;
    waveImpulseGain: number;
  }) {
    const u = this.pass.mat.uniforms;
    u.uSwashPrev.value = this.swashA.texture;
    u.uContact.value = args.contactTex;
    u.uTerrainH.value = args.terrainHeightTex;

    u.uWaterInfo.value = args.waterInfoTex;
    u.uSF1.value = args.sf1Tex;
    u.uUseOceanDrive.value = args.useOceanDrive ? 1 : 0;

    if (args.flowTex) { u.uFlow.value = args.flowTex; u.uUseFlow.value = 1; }
    else { u.uUseFlow.value = 0; }

    u.uDomainSize.value.copy(args.domainSize);
    u.uDt.value = args.dt;
    u.uWaveImpulseGain.value = args.waveImpulseGain;

    this.pass.render(this.gl, this.swashB);
    this.swap();
  }

  private swap() {
    const t = this.swashA; this.swashA = this.swashB; this.swashB = t;
  }
}

const VS = /* glsl */`
varying vec2 vUv;
void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }
`;

4.3 Swash update shader (GLSL)

SWASH_UPDATE_FRAG (single-pass “thin film” SWE proxy)

precision highp float;
varying vec2 vUv;

uniform sampler2D uSwashPrev; // RGBA: h,u,wet,foam
uniform sampler2D uContact;   // R cover, G band01, B slopeProxy
uniform sampler2D uTerrainH;  // R terrain height (m)

uniform sampler2D uWaterInfo; // r=eta, g=etaDotProxy
uniform sampler2D uSF1;       // RG packed wave dir
uniform int uUseOceanDrive;

uniform sampler2D uFlow;      // optional flow (m/s)
uniform int uUseFlow;

uniform vec2 uDomainSize;
uniform float uDt;

uniform float uG;
uniform float uFriction;
uniform float uInfiltration;
uniform float uCoverFillRate;
uniform float uFilmCapM;

uniform float uWaveImpulseGain;
uniform float uEtaDotScale;

uniform float uWetRefM;
uniform float uWetDryPerSec;
uniform float uFoamDepositGain;
uniform float uFoamDecayPerSec;

uniform float uUMax;

float sat(float x){ return clamp(x,0.0,1.0); }

vec2 decodeDir(vec2 rg){
  vec2 d = rg * 2.0 - 1.0;
  return d / max(1e-4, length(d));
}

vec2 texel() {
  // MV: assume 512; pass exact if you want
  return vec2(1.0/512.0, 1.0/512.0);
}

void main(){
  vec4 c = texture2D(uContact, vUv);
  float cover = c.r;
  float band  = c.g;
  // slopeProxy available as c.b, but we compute slope more consistently from terrain gradient

  vec4 prev = texture2D(uSwashPrev, vUv);
  float hPrev   = prev.r; // film thickness (m)
  float uPrev   = prev.g; // m/s along n_uphill (positive inland)
  float wetPrev = prev.b; // 0..1
  float foamPrev= prev.a; // 0..1

  // Terrain gradient -> n_uphill in xz (UV space proxy)
  vec2 ts = texel();
  float hL = texture2D(uTerrainH, vUv - vec2(ts.x, 0.0)).r;
  float hR = texture2D(uTerrainH, vUv + vec2(ts.x, 0.0)).r;
  float hD = texture2D(uTerrainH, vUv - vec2(0.0, ts.y)).r;
  float hU = texture2D(uTerrainH, vUv + vec2(0.0, ts.y)).r;

  // dh/dx, dh/dz in meters per uv-step; scale to meters per meter is messy—use as directional guide
  vec2 grad = vec2(hR - hL, hU - hD);
  vec2 nUv = grad / max(1e-4, length(grad)); // points uphill in UV coordinates

  // Convert along-n velocity into a UV advection vector:
  // v_world ≈ u * n_world; but we only have nUv, so treat u as driving UV advection scaled by domainSize.
  vec2 vUvAdv = (uPrev * nUv * uDt) / max(vec2(1e-3), uDomainSize);

  // Semi-Lagrangian backtrace
  vec2 uv0 = vUv - vUvAdv;
  vec4 adv = texture2D(uSwashPrev, uv0);
  float h = adv.r;
  float u = adv.g;
  float wet = adv.b;
  float foam = adv.a;

  // Gravity wants to push film downslope: u += -g*slope*dt
  // slope magnitude proxy from terrain gradient
  float slope = sat(length(grad) * 40.0); // tune factor for your terrain scale
  u += (-uG * slope) * uDt;

  // Ocean impulse: incoming wave pushes upslope
  if (uUseOceanDrive == 1) {
    float etaDot = texture2D(uWaterInfo, vUv).g * uEtaDotScale; // m/s-ish
    vec2 F = decodeDir(texture2D(uSF1, vUv).rg);
    float hit = sat(dot(F, nUv));        // wave heading inland
    float push = max(0.0, etaDot) * hit; // only rising / incoming
    u += uWaveImpulseGain * push * band * uDt;
  }

  // River impulse: flow can wet banks / drive along nUv (optional)
  if (uUseFlow == 1) {
    vec2 flow = texture2D(uFlow, vUv).rg; // assume m/s in uv axes
    u += 0.6 * dot(flow, nUv) * band * uDt;
  }

  // Friction (exponential decay)
  u *= exp(-uFriction * uDt);
  u = clamp(u, -uUMax, uUMax);

  // Film thickness sources/sinks
  // - when covered: fill toward cap
  // - when uncovered: infiltrate/evaporate
  h += cover * uCoverFillRate * uDt;
  h *= exp(-uInfiltration * (1.0 - cover) * uDt);
  h = clamp(h, 0.0, uFilmCapM);

  // Gate swash to shoreline region (avoid “film everywhere”)
  float gate = sat((band - 0.05) * 8.0); // only in band
  h *= gate;
  u *= mix(0.2, 1.0, gate);

  // Wetness hysteresis from film + cover
  float wetFromFilm = sat(h / max(1e-4, uWetRefM));
  wet = max(wet * exp(-uWetDryPerSec * (1.0 - cover) * uDt), wetFromFilm);
  wet = clamp(wet, 0.0, 1.0);

  // Foam deposit from shear (|u|) in the band, decays over time
  foam *= exp(-uFoamDecayPerSec * uDt);
  float shear = abs(u);
  foam += uFoamDepositGain * shear * wet * band * uDt;
  foam = clamp(foam, 0.0, 1.0);

  gl_FragColor = vec4(h, u, wet, foam);
}


Notes (by design):

This is a stable “thin film” model (semi-Lagrangian) rather than a full SWE Riemann solver.

It produces the right cinematic cues: runup, retreat, wetness memory, foam at the moving front.

It stays bounded and cheap (one fullscreen pass).

4.4 Using swash outputs

Terrain shading:

wetness = swashTex.b

foam deposit (shore foam line) = swashTex.a

Water foam injection (optional, cheap bridge):

in your FoamField.injectFromEBT, add a second injector that splats from shoreline foamDeposit (A) near shore.

5) Validation checklist
Visual sweeps

Runup/backwash: the wet band and foam line visibly advance, then recede (not just flicker).

Slope dependence: steeper beaches show faster retreat; shallow beaches show longer runup linger.

Ocean vs river

ocean: runup responds to incoming crests (η̇ and F alignment)

river: bank wetting aligns with flow and is steadier

No category mistake: shoreline micro ripples (terrain wet micro-normal) stay separate from main waves.

Perf / no-stall

No GPU readbacks.

Only one new SIM pass (SIM.SWASH.UPDATE) and it is LOD-gated.

RT tier: 256/512; skip when far.

Regression safety

If uSF1 missing: set uUseOceanDrive=0 and rely on gravity/cover (still stable).

If terrain height missing: disable swash system (wetness=0, foamDeposit=0).

6) Telemetry/debug views added

DEBUG.SWASH_H (R = film thickness meters)

DEBUG.SWASH_U (G = velocity along shore-normal, signed)

DEBUG.SWASH_WET (B = wetness)

DEBUG.SWASH_FOAM (A = foamDeposit)

DEBUG.SHORE_NORMAL (optional: visualize nUv direction field)

L0 counters:

swashPassEnabled, swashResTier

swashOceanDriveOn, swashFlowDriveOn










1) What we’re changing

We’re introducing a single WaterTypeProfile system that drives everything (surface dynamics, optics, foam/spray/bubbles/SSA, shoreline swash) for oceans / lakes / rivers / puddles—one codepath, different profiles.

We’re adding a WaterType blending mechanism so you can smoothly transition (river→estuary→ocean, lake→shore, puddle→wet ground) without seams:

either via a weight map texture (GPU sampled)

or per-waterbody assignment (single profile per domain)

We’re wiring profiles into the existing Shared Lighting + Genesis pipeline without breaking the drift rules:

Genesis stays the driver for breach/splash spawn (SF/EBT); profiles only modulate appearance + secondary lifecycles + flow coupling.

2) Why

“Water” isn’t one thing: rivers are advective + directional, lakes are bounded + standing waves, oceans are multi-scale + wind seas + breakers, puddles are thin-film + surface tension dominated.

If you treat these as separate engines, you’ll get inconsistent optics, foam truth duplication, and broken LOD budgets.

A profile system gives you:

authoring clarity (“this is a muddy river, fast flow”)

render consistency (same IOR / Fresnel / Beer–Lambert pipeline)

perf control (each type has caps + pass schedule rules)

3) Implementation steps

Create WaterTypeProfile with five subprofiles:

SurfaceProfile (waves/flow/bounds/damping)

OpticsProfile (IOR, absorption/scatter, g, foam tint, refraction strength)

SecondaryFXProfile (foam/spray/bubbles/SSA banks + budgets)

ShoreProfile (swash parameters, wetness response, foam band behavior)

LODProfile (RT tiers + pass enable rules)

Add a WaterTypeRegistry and ship canonical profiles:

OCEAN_DEEP_CLEAR, OCEAN_COASTAL_GREEN

LAKE_CLEAR, LAKE_MURKY

RIVER_CLEAR_FAST, RIVER_MUDDY_SLOW

PUDDLE_THIN_FILM

Add a GPU-friendly blending interface:

uWaterTypeParams[] arrays (packed vec4s)

optional uWaterTypeWeightMap sampled in water shaders/passes

Update all systems to pull parameters from one function:

resolveWaterParams(uv/worldXZ) -> {optics, fx, shore, ...}

Add debug:

DEBUG.WATER_TYPE_ID/WEIGHTS

DEBUG.OPTICS_COEFFS (σa/σs/g)

DEBUG.FX_BUDGETS_BY_TYPE

4) Code
4.1 src/water/types/WaterTypeProfile.ts
import * as THREE from "three";

export type WaterTypeId =
  | "OCEAN_DEEP_CLEAR"
  | "OCEAN_COASTAL_GREEN"
  | "LAKE_CLEAR"
  | "LAKE_MURKY"
  | "RIVER_CLEAR_FAST"
  | "RIVER_MUDDY_SLOW"
  | "PUDDLE_THIN_FILM";

export interface SurfaceProfile {
  // “Big” surface behavior (heightfield driver selection)
  mode: "OCEAN_WAVES" | "LAKE_BOUNDED" | "RIVER_FLOW" | "THIN_FILM";

  // Energy/damping (does NOT change genesis; it changes base heightfield & flow coupling)
  swellEnergy01: number;
  chopEnergy01: number;
  dampingPerSec: number;

  // Flow coupling (rivers) in m/s; lakes/ocean can have mild currents
  flowSpeedMps: number;
  flowDirXZ: THREE.Vector2;

  // Boundary behavior (lakes)
  boundary: "OPEN" | "CLOSED";
}

export interface OpticsProfile {
  ior: number; // usually 1.333

  // Per-meter coefficients for Beer–Lambert / underwater volume
  absorptionRGB: THREE.Vector3; // σa [1/m]
  scatteringRGB: THREE.Vector3; // σs [1/m]
  gHG: number;                  // 0..0.95

  // Surface look
  refractionStrength: number;
  roughnessWater: number;
  foamTint: THREE.Color;
  foamRoughness: number;
}

export interface SecondaryFXProfile {
  // Multipliers that scale the banks you already built
  foamPersistence: number;  // higher -> slower decay
  sprayAmount: number;      // scales spray quotas + brightness
  bubbleAmount: number;     // scales bubble inject + haze
  ssaAmount: number;        // sea-surface aerosol amount

  // Hard caps by type (LOD policy)
  maxSprayDraw: number;
  foamRes: 256 | 512 | 1024;
  bubbleRes: 256 | 512;
  ssaRes: 256 | 512;
}

export interface ShoreProfile {
  // Swash solver knobs (thin film)
  swashEnabled: boolean;
  swashBandMeters: number;
  waveImpulseGain: number;
  friction: number;
  infiltration: number;
  wetDryPerSec: number;
  foamDepositGain: number;
}

export interface LODProfile {
  // Per type scheduling: what to disable as distance grows
  enableUnderwater: boolean;
  enableCaustics: boolean;
  enableSprayLighting: boolean;
  enableSSA: boolean;
}

export interface WaterTypeProfile {
  id: WaterTypeId;
  surface: SurfaceProfile;
  optics: OpticsProfile;
  fx: SecondaryFXProfile;
  shore: ShoreProfile;
  lod: LODProfile;
}

4.2 src/water/types/WaterTypeRegistry.ts (canonical profiles)

These numbers are engine-authored starting points (units are consistent: σ in 1/m).

import * as THREE from "three";
import type { WaterTypeProfile, WaterTypeId } from "./WaterTypeProfile";

const v3 = (r:number,g:number,b:number)=> new THREE.Vector3(r,g,b);
const c3 = (r:number,g:number,b:number)=> new THREE.Color(r,g,b);

export const WATER_TYPES: Record<WaterTypeId, WaterTypeProfile> = {
  OCEAN_DEEP_CLEAR: {
    id: "OCEAN_DEEP_CLEAR",
    surface: {
      mode: "OCEAN_WAVES",
      swellEnergy01: 0.85,
      chopEnergy01: 0.35,
      dampingPerSec: 0.04,
      flowSpeedMps: 0.3,
      flowDirXZ: new THREE.Vector2(1, 0),
      boundary: "OPEN",
    },
    optics: {
      ior: 1.333,
      absorptionRGB: v3(0.18, 0.06, 0.02),
      scatteringRGB: v3(0.02, 0.03, 0.04),
      gHG: 0.80,
      refractionStrength: 0.030,
      roughnessWater: 0.02,
      foamTint: c3(0.95, 0.98, 1.00),
      foamRoughness: 0.35,
    },
    fx: {
      foamPersistence: 1.0,
      sprayAmount: 1.0,
      bubbleAmount: 0.8,
      ssaAmount: 0.9,
      maxSprayDraw: 262144,
      foamRes: 512,
      bubbleRes: 512,
      ssaRes: 512,
    },
    shore: {
      swashEnabled: true,
      swashBandMeters: 3.0,
      waveImpulseGain: 0.55,
      friction: 2.2,
      infiltration: 0.45,
      wetDryPerSec: 0.18,
      foamDepositGain: 0.55,
    },
    lod: {
      enableUnderwater: true,
      enableCaustics: true,
      enableSprayLighting: true,
      enableSSA: true,
    },
  },

  OCEAN_COASTAL_GREEN: {
    id: "OCEAN_COASTAL_GREEN",
    surface: {
      mode: "OCEAN_WAVES",
      swellEnergy01: 0.75,
      chopEnergy01: 0.45,
      dampingPerSec: 0.06,
      flowSpeedMps: 0.4,
      flowDirXZ: new THREE.Vector2(0.8, 0.2),
      boundary: "OPEN",
    },
    optics: {
      ior: 1.333,
      // more particulate: higher σs and slightly higher σa
      absorptionRGB: v3(0.25, 0.10, 0.05),
      scatteringRGB: v3(0.06, 0.08, 0.10),
      gHG: 0.85,
      refractionStrength: 0.028,
      roughnessWater: 0.03,
      foamTint: c3(0.94, 0.98, 1.00),
      foamRoughness: 0.38,
    },
    fx: {
      foamPersistence: 1.15,
      sprayAmount: 1.1,
      bubbleAmount: 1.0,
      ssaAmount: 1.0,
      maxSprayDraw: 196608,
      foamRes: 512,
      bubbleRes: 512,
      ssaRes: 512,
    },
    shore: {
      swashEnabled: true,
      swashBandMeters: 3.5,
      waveImpulseGain: 0.65,
      friction: 2.4,
      infiltration: 0.40,
      wetDryPerSec: 0.20,
      foamDepositGain: 0.65,
    },
    lod: { enableUnderwater: true, enableCaustics: true, enableSprayLighting: true, enableSSA: true },
  },

  LAKE_CLEAR: {
    id: "LAKE_CLEAR",
    surface: {
      mode: "LAKE_BOUNDED",
      swellEnergy01: 0.25,
      chopEnergy01: 0.20,
      dampingPerSec: 0.10,
      flowSpeedMps: 0.05,
      flowDirXZ: new THREE.Vector2(1, 0),
      boundary: "CLOSED",
    },
    optics: {
      ior: 1.333,
      absorptionRGB: v3(0.20, 0.08, 0.03),
      scatteringRGB: v3(0.03, 0.04, 0.05),
      gHG: 0.80,
      refractionStrength: 0.020,
      roughnessWater: 0.015,
      foamTint: c3(0.97, 0.99, 1.00),
      foamRoughness: 0.30,
    },
    fx: {
      foamPersistence: 0.75,
      sprayAmount: 0.35,
      bubbleAmount: 0.35,
      ssaAmount: 0.20,
      maxSprayDraw: 65536,
      foamRes: 256,
      bubbleRes: 256,
      ssaRes: 256,
    },
    shore: {
      swashEnabled: true,
      swashBandMeters: 2.0,
      waveImpulseGain: 0.18,
      friction: 2.8,
      infiltration: 0.55,
      wetDryPerSec: 0.25,
      foamDepositGain: 0.20,
    },
    lod: { enableUnderwater: true, enableCaustics: true, enableSprayLighting: false, enableSSA: false },
  },

  LAKE_MURKY: {
    id: "LAKE_MURKY",
    surface: {
      mode: "LAKE_BOUNDED",
      swellEnergy01: 0.20,
      chopEnergy01: 0.18,
      dampingPerSec: 0.12,
      flowSpeedMps: 0.06,
      flowDirXZ: new THREE.Vector2(1, 0),
      boundary: "CLOSED",
    },
    optics: {
      ior: 1.333,
      absorptionRGB: v3(0.35, 0.22, 0.12),
      scatteringRGB: v3(0.10, 0.12, 0.14),
      gHG: 0.88,
      refractionStrength: 0.018,
      roughnessWater: 0.02,
      foamTint: c3(0.95, 0.98, 1.0),
      foamRoughness: 0.34,
    },
    fx: {
      foamPersistence: 0.85,
      sprayAmount: 0.25,
      bubbleAmount: 0.55,
      ssaAmount: 0.10,
      maxSprayDraw: 32768,
      foamRes: 256,
      bubbleRes: 256,
      ssaRes: 256,
    },
    shore: {
      swashEnabled: true,
      swashBandMeters: 2.2,
      waveImpulseGain: 0.16,
      friction: 3.0,
      infiltration: 0.60,
      wetDryPerSec: 0.28,
      foamDepositGain: 0.18,
    },
    lod: { enableUnderwater: true, enableCaustics: false, enableSprayLighting: false, enableSSA: false },
  },

  RIVER_CLEAR_FAST: {
    id: "RIVER_CLEAR_FAST",
    surface: {
      mode: "RIVER_FLOW",
      swellEnergy01: 0.05,
      chopEnergy01: 0.20,      // ripples from flow/rocks, not ocean chop injection
      dampingPerSec: 0.14,
      flowSpeedMps: 1.8,
      flowDirXZ: new THREE.Vector2(1, 0),
      boundary: "OPEN",
    },
    optics: {
      ior: 1.333,
      absorptionRGB: v3(0.22, 0.12, 0.06),
      scatteringRGB: v3(0.05, 0.06, 0.07),
      gHG: 0.82,
      refractionStrength: 0.024,
      roughnessWater: 0.02,
      foamTint: c3(0.96, 0.99, 1.0),
      foamRoughness: 0.32,
    },
    fx: {
      foamPersistence: 0.90,
      sprayAmount: 0.25,
      bubbleAmount: 0.30,
      ssaAmount: 0.05,
      maxSprayDraw: 32768,
      foamRes: 256,
      bubbleRes: 256,
      ssaRes: 256,
    },
    shore: {
      swashEnabled: true,
      swashBandMeters: 1.6,
      waveImpulseGain: 0.00,   // use flow drive instead
      friction: 3.2,
      infiltration: 0.70,
      wetDryPerSec: 0.22,
      foamDepositGain: 0.25,
    },
    lod: { enableUnderwater: true, enableCaustics: true, enableSprayLighting: false, enableSSA: false },
  },

  RIVER_MUDDY_SLOW: {
    id: "RIVER_MUDDY_SLOW",
    surface: {
      mode: "RIVER_FLOW",
      swellEnergy01: 0.02,
      chopEnergy01: 0.12,
      dampingPerSec: 0.18,
      flowSpeedMps: 0.7,
      flowDirXZ: new THREE.Vector2(1, 0),
      boundary: "OPEN",
    },
    optics: {
      ior: 1.333,
      absorptionRGB: v3(0.55, 0.40, 0.26),
      scatteringRGB: v3(0.18, 0.20, 0.22),
      gHG: 0.90,
      refractionStrength: 0.020,
      roughnessWater: 0.03,
      foamTint: c3(0.94, 0.97, 1.0),
      foamRoughness: 0.36,
    },
    fx: {
      foamPersistence: 0.75,
      sprayAmount: 0.10,
      bubbleAmount: 0.45,
      ssaAmount: 0.02,
      maxSprayDraw: 16384,
      foamRes: 256,
      bubbleRes: 256,
      ssaRes: 256,
    },
    shore: {
      swashEnabled: true,
      swashBandMeters: 1.8,
      waveImpulseGain: 0.00,
      friction: 3.6,
      infiltration: 0.80,
      wetDryPerSec: 0.24,
      foamDepositGain: 0.18,
    },
    lod: { enableUnderwater: true, enableCaustics: false, enableSprayLighting: false, enableSSA: false },
  },

  PUDDLE_THIN_FILM: {
    id: "PUDDLE_THIN_FILM",
    surface: {
      mode: "THIN_FILM",
      swellEnergy01: 0.00,
      chopEnergy01: 0.06,
      dampingPerSec: 0.35,
      flowSpeedMps: 0.0,
      flowDirXZ: new THREE.Vector2(1, 0),
      boundary: "CLOSED",
    },
    optics: {
      ior: 1.333,
      absorptionRGB: v3(0.10, 0.06, 0.04),
      scatteringRGB: v3(0.01, 0.01, 0.01),
      gHG: 0.75,
      refractionStrength: 0.010,
      roughnessWater: 0.01,
      foamTint: c3(0.98, 0.99, 1.0),
      foamRoughness: 0.25,
    },
    fx: {
      foamPersistence: 0.30,
      sprayAmount: 0.00,
      bubbleAmount: 0.05,
      ssaAmount: 0.00,
      maxSprayDraw: 0,
      foamRes: 256,
      bubbleRes: 256,
      ssaRes: 256,
    },
    shore: {
      swashEnabled: false,
      swashBandMeters: 0.8,
      waveImpulseGain: 0.0,
      friction: 6.0,
      infiltration: 1.4,
      wetDryPerSec: 0.35,
      foamDepositGain: 0.0,
    },
    lod: { enableUnderwater: false, enableCaustics: false, enableSprayLighting: false, enableSSA: false },
  },
};

export function getWaterType(id: WaterTypeId) {
  const t = WATER_TYPES[id];
  if (!t) throw new Error(`Unknown WaterTypeId: ${id}`);
  return t;
}

4.3 Optional blending: Weight map + packed uniforms
Weight map convention (GPU)

uWaterTypeWeightMap RGBA = weights for 4 active types in this scene patch.

uActiveTypeIds[4] tells which profiles correspond to RGBA channels.

src/water/types/WaterTypePacking.ts
import type { WaterTypeProfile } from "./WaterTypeProfile";

export interface PackedWaterTypeParams {
  // Each array is float[16] = vec4[4] flattened (4 active types)
  opticsA: number[]; // (σa.r, σa.g, σa.b, ior)
  opticsS: number[]; // (σs.r, σs.g, σs.b, g)
  surf:   number[];  // (refractionStrength, roughnessWater, foamRoughness, _)
  foam:   number[];  // (foamTint.r, foamTint.g, foamTint.b, foamPersistence)
  fxCaps: number[];  // (sprayAmount, bubbleAmount, ssaAmount, maxSprayDrawNorm)
}

export function pack4(types: WaterTypeProfile[], maxSprayDrawRef = 262144): PackedWaterTypeParams {
  if (types.length !== 4) throw new Error("pack4 requires exactly 4 active types");

  const opticsA:number[] = [];
  const opticsS:number[] = [];
  const surf:number[] = [];
  const foam:number[] = [];
  const fxCaps:number[] = [];

  for (const t of types) {
    opticsA.push(t.optics.absorptionRGB.x, t.optics.absorptionRGB.y, t.optics.absorptionRGB.z, t.optics.ior);
    opticsS.push(t.optics.scatteringRGB.x, t.optics.scatteringRGB.y, t.optics.scatteringRGB.z, t.optics.gHG);
    surf.push(t.optics.refractionStrength, t.optics.roughnessWater, t.optics.foamRoughness, 0);

    foam.push(t.optics.foamTint.r, t.optics.foamTint.g, t.optics.foamTint.b, t.fx.foamPersistence);

    const sprayNorm = Math.min(1, t.fx.maxSprayDraw / maxSprayDrawRef);
    fxCaps.push(t.fx.sprayAmount, t.fx.bubbleAmount, t.fx.ssaAmount, sprayNorm);
  }

  return { opticsA, opticsS, surf, foam, fxCaps };
}

Shader-side resolver (GLSL snippet)
uniform sampler2D uWaterTypeWeightMap; // RGBA weights
uniform float uOpticsA4[16]; // vec4[4] flattened
uniform float uOpticsS4[16];
uniform float uSurf4[16];
uniform float uFoam4[16];
uniform float uFxCaps4[16];

vec4 load4(const float a[16], int idx){
  int o = idx * 4;
  return vec4(a[o+0], a[o+1], a[o+2], a[o+3]);
}

void resolveParams(vec2 uv, out vec3 sigmaA, out vec3 sigmaS, out float ior, out float gHG, out vec3 foamTint){
  vec4 w = texture2D(uWaterTypeWeightMap, uv);
  float s = w.r + w.g + w.b + w.a;
  w = (s > 1e-4) ? (w / s) : vec4(1.0,0.0,0.0,0.0);

  vec4 A0 = load4(uOpticsA4, 0);
  vec4 A1 = load4(uOpticsA4, 1);
  vec4 A2 = load4(uOpticsA4, 2);
  vec4 A3 = load4(uOpticsA4, 3);

  vec4 S0 = load4(uOpticsS4, 0);
  vec4 S1 = load4(uOpticsS4, 1);
  vec4 S2 = load4(uOpticsS4, 2);
  vec4 S3 = load4(uOpticsS4, 3);

  vec4 F0 = load4(uFoam4, 0);
  vec4 F1 = load4(uFoam4, 1);
  vec4 F2 = load4(uFoam4, 2);
  vec4 F3 = load4(uFoam4, 3);

  vec4 A = w.r*A0 + w.g*A1 + w.b*A2 + w.a*A3;
  vec4 S = w.r*S0 + w.g*S1 + w.b*S2 + w.a*S3;
  vec4 F = w.r*F0 + w.g*F1 + w.b*F2 + w.a*F3;

  sigmaA = A.rgb; ior = A.a;
  sigmaS = S.rgb; gHG = S.a;
  foamTint = F.rgb;
}


This gives you smooth biome transitions with no branchy “if ocean then …”.

4.4 How profiles connect to your existing systems (one truth)

SharedWaterLighting comes from OpticsProfile (σa/σs/g/ior).

Foam/spray/bubbles/SSA systems take type multipliers + caps from SecondaryFXProfile.

Shore swash uses ShoreProfile.

Genesis/breach stays driven by SF/EBT; you can optionally choose a GenesisPreset bank per WaterTypeId (surf vs river impact vs puddle splash), but don’t tune feedback here.

5) Validation checklist
Visual sweeps

Ocean→coastal transition:

underwater gets greener/milkier (σs up, σa up), caustics soften, foam persists more near shore.

River:

surface is directional/advective; chop looks like flow ripples (not ocean swell).

banks wet correctly; minimal spray lighting.

Lake:

calmer surface; bounded feel; caustics visible in clear lake, not in murky.

Puddle:

thin refraction, minimal volume fog; no ocean-style spray.

Perf / no-stall

Weight-map blending adds one texture sample and a few vec4 mixes—cheap.

Caps apply correctly:

spray draw count clamps by type

foam/bubble/ssa RT tiers obey profile and distance LOD

Regression safety

If no weight map, fall back to a single active type (w = (1,0,0,0)).

If a type is missing, default to OCEAN_DEEP_CLEAR (safe) and log once.

