# Phase 3 — MLS-MPM Particle Physics & Emission

## What MLS-MPM Means Here

MLS-MPM (Moving Least Squares Material Point Method) is a hybrid particle-grid method for simulating materials. In a full implementation:
- **Particles** carry mass, velocity, and a deformation gradient (affine momentum matrix)
- **Grid** provides a structured backdrop for computing forces, pressure, and collisions
- Each timestep: particles → grid (P2G), grid solve, grid → particles (G2P)

### What We Actually Have

Our implementation is **MLS-MPM-inspired** but simplified:
- Particles carry position, velocity, mass, and age (no deformation gradient)
- No P2G/G2P transfer — particles move independently via Euler integration
- No inter-particle pressure or viscosity
- The "grid" role is played by the heightfield surface intent fields for *emission only*
- After emission, particles are ballistic + buoyancy + drag

### What the Splash Reference Does (splash-mls-mpm.html)

The splash reference is a full 2D MLS-MPM fluid simulation:
- Particles carry mass, velocity, and a 2×2 affine momentum matrix `C`
- Uses a regular grid for P2G/G2P transfers
- Computes neo-Hookean or fluid constitutive models
- Handles solid-fluid interaction via grid-level boundary conditions
- Renders particles as screen-space metaballs using additive Gaussian splatting

Key differences from our system:
1. Splash is 2D, we're 3D
2. Splash particles all start in the fluid domain, ours spawn from a surface
3. Splash uses grid-based pressure, ours uses individual buoyancy/drag
4. Splash renders via screen-space fluid, we render via world-space points

---

## Current Particle Emission Logic

### Trigger Conditions (emitParticlesShader)

A particle spawns from grid cell (x,z) when ALL of:
1. `R > 0.15` — rupture potential exceeds threshold
2. `M > 0.05` — reservoir has available mass
3. `velocity > 0.0005` — surface is moving upward
4. `fract(sin(...)) > R * 0.8` — stochastic probability scaled by R
5. Check every 3rd texel in both X and Z (density control)

### Initial Velocity Composition

```wgsl
liftScale = R * M * 3.0
throwScale = C * 4.0
spreadRadius = (1 - C) * 0.8 + noise * 0.3

vx = Ux * throwScale + nx * liftScale * 0.4 + cos(angle) * spread
vy = ny * liftScale * 1.5 + max(velocity * 4.0, 0.3) + noise * 0.5  
vz = Uz * throwScale + nz * liftScale * 0.4 + sin(angle) * spread
```

This decomposes into the encyclopedia's recommended components:
- **Lift**: Surface normal × rupture × reservoir → upward launch
- **Throw**: Surface momentum U × coherence → forward direction
- **Spread**: Inversely proportional to coherence → noisy when incoherent

### What's Right
- Velocity decomposition follows the encyclopedia's `v0 = lift + throw + spread + noise`
- Stochastic emission prevents uniform curtains
- R and M gate emission appropriately

### What's Wrong / Missing
1. **No regime-dependent coefficients**: A crest peel should have strong throw + moderate lift; an impact jet should have strong lift + modest throw. Currently all emissions use the same formula.
2. **Per-texel instead of patch-based**: The encyclopedia strongly recommends detecting connected rupture *patches* and emitting structured objects from them, not spraying from individual hot pixels.
3. **No reservoir drain in emit shader**: M should decrease when particles are emitted. Currently drain happens in the field shader but isn't directly coupled to actual emission count.
4. **Mass always 1.0**: All particles have equal mass. Should vary based on local conditions.

---

## Current Particle Physics (updateParticlesShader)

### Forces Applied Each Step

1. **Gravity**: `vel.y -= 9.8 * dt` (when not submerged)
2. **Buoyancy**: `vel.y += 4.0 * dt` when below Y=0 (Archimedes)
3. **Water drag**: Quadratic drag with coefficient 0.15 when submerged
4. **Air drag**: Very light drag coefficient 0.02 when airborne
5. **Surface tension**: When within 0.05 of surface AND age > 0.3:
   - Vertical pull toward Y=0
   - Horizontal velocity damping (0.98×)
6. **General damping**: Air damp 0.999 vs water damp from physics params

### Boundary Handling
- Floor at Y=-1: Bounce with 0.2 restitution, friction 0.7
- Walls at X,Z=±1: Bounce with 0.2 restitution
- Ceiling at Y=2: Hard clamp

### Deactivation
Particle dies (mass → 0) when:
- `age > maxAge`
- Submerged AND speed < 0.05 AND age > 0.5

### What's Missing (from encyclopedia)
1. **No P2G/G2P coupling**: Particles don't influence each other or the grid
2. **No inter-particle forces**: No pressure, viscosity, or cohesion between particles
3. **No heightfield feedback**: Particles don't push back on the water surface when they land
4. **No recapture logic**: Dead particles don't return mass to the reservoir M
5. **No deformation gradient**: Can't track local fluid strain or support sheet structures
6. **No regime transitions**: Particles don't evolve from "coherent packet" → "spray" based on local conditions

---

## Particle Data Layout

Each particle occupies 2 × vec4f = 8 floats = 32 bytes:

| Offset | Value | Meaning |
|--------|-------|---------|
| 0 | posX | World X position |
| 1 | posY | World Y position |
| 2 | posZ | World Z position |
| 3 | mass | 1.0 = active, 0.0 = dead |
| 4 | velX | Velocity X |
| 5 | velY | Velocity Y |
| 6 | velZ | Velocity Z |
| 7 | age | Time since birth (seconds) |

Total buffer: `MAX_PARTICLES * 2 * 16 bytes = 8192 * 32 = 262,144 bytes`

---

## Particle Rendering (ParticleRenderer.tsx)

### Current Approach: Gaussian Density Splatting

Particles are rendered as `THREE.Points` with custom shaders. The key insight is that particles should NOT look like individual spheres — they should accumulate into a continuous fluid density.

**Vertex shader**:
- Billboard sizing with camera-distance attenuation: `size * (30.0 / -mvPosition.z)`
- Size varies with age (smaller as they age) and speed (slightly larger when fast)
- Dead particles (mass ≤ 0) are moved off-screen

**Fragment shader**:
- Gaussian kernel: `weight = exp(-r² * 4.0)` — soft falloff, not hard circles
- Very low alpha: `baseAlpha = 0.12 → 0.04` as particles age
- Premultiplied alpha output: `gl_FragColor = vec4(color * alpha, alpha)`

**Blending**:
- Custom additive blending: `ONE, ONE_MINUS_SRC_ALPHA`
- This means overlapping particles accumulate color and opacity
- Dense particle regions become opaque; sparse regions are translucent

### What This Should Look Like
- Dense splash zones: cohesive, fluid-like, translucent blue mass
- Edges: soft, wispy, gradually fading
- Individual droplets: visible only when far from others
- NOT: a cloud of large circles, or opaque blobs

### Current Problem
The `uPointSize = 4.0` value and `30.0` attenuation factor need to be calibrated relative to the pool's world-space size (2 units across). At a typical camera distance of ~4 units, a particle renders at roughly `4 * 30/4 = 30` pixels. This may still be too large.

### What the Splash Reference Does Differently
The splash-mls-mpm.html reference uses full screen-space fluid rendering:
1. Render particle depths to a depth buffer
2. Smooth the depth buffer (bilateral filter)
3. Reconstruct normals from smoothed depth
4. Composite with refraction/reflection

This is significantly more complex but produces much smoother fluid surfaces. Our Gaussian splatting is an approximation of step 1-2 without the normal reconstruction.
