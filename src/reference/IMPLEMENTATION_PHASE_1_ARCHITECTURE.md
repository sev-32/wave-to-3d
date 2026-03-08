# Phase 1 — System Architecture & Pipeline Overview

## What This Project Actually Is

This is a **hybrid water simulation** running in the browser using **WebGPU compute shaders** for physics and **React Three Fiber** for rendering. It combines two fundamentally different water representations:

1. **Heightfield** (grid-based): A 256×256 grid where each cell stores `(height, velocity, normalX, normalZ)`. This is the "water surface" — great for ripples, waves, reflections, refractions, and caustics. It's a 2.5D representation (single height value per XZ position).

2. **MLS-MPM Particles** (particle-based): Up to 8192 particles that carry mass and momentum through 3D space. These represent water that has *left* the heightfield — splashes, droplets, spray, jets. They exist because the heightfield **cannot** represent overturning, multi-valued surfaces, or detached water.

The core insight from the reference documents: **No single representation is sufficient for convincing water.** The heightfield owns continuity; the particles own detached momentum.

---

## The Compute Pipeline (What Runs Each Frame)

All physics runs on the GPU via WGSL compute shaders. The pipeline executes in this order:

### Step 1: Water Drop (optional)
- **Shader**: `waterDropShader`
- **Purpose**: Adds ripples from user clicks
- **Inputs**: Current water grid + drop position/radius/strength
- **Outputs**: Updated water grid with cosine-shaped drop added to height channel

### Step 2: Sphere Displacement
- **Shader**: `sphereDisplacementShader`  
- **Purpose**: Displaces water when the sphere moves
- **How**: Calculates volume difference between old and new sphere positions (SDF-based). Also generates bow waves and Kelvin wake patterns from sphere velocity.
- **Key constraints**: Displacement is clamped to 0.02 max, velocity additions clamped to ±0.03 to prevent energy blowup.

### Step 3: Wave Propagation
- **Shader**: `waterUpdateShader`
- **Purpose**: Core wave simulation — propagates ripples across the grid
- **Algorithm**: Standard 2D wave equation: 
  - `velocity += (neighbor_average - height) * 2.0`
  - `velocity *= damping (0.995)`
  - `height += velocity`
- **This is the heart of the heightfield simulation.**

### Step 4: Normal Calculation
- **Shader**: `waterNormalsShader`
- **Purpose**: Computes surface normals from the heightfield gradient
- **Stores**: normalX in `.z` channel, normalZ in `.w` channel of each water cell

### Step 5: Surface Intent Fields
- **Shader**: `surfaceFieldsShader`
- **Purpose**: The "brain" — analyzes the water surface to determine where it wants to break apart
- **Computes 5 fields** (stored in two vec4 buffers):
  - **R (Rupture)**: How strongly this surface patch wants to become 3D/volumetric
  - **U (Momentum)**: Horizontal transport direction — which way surface energy is moving
  - **C (Coherence)**: Whether the local feature is organized enough for a sheet vs spray
  - **M (Reservoir)**: How much detachable water is available (prevents infinite emission)
  - **A (Adhesion)**: How strongly nearby detached water should return to the surface
- **Buffer layout**: `fieldOut = vec4f(R, C, M, A)`, `field2 = vec4f(Ux, Uz, divU, slope)`

### Step 6: Particle Emission
- **Shader**: `emitParticlesShader`
- **Purpose**: Spawns new particles from high-energy surface regions
- **Conditions for emission**:
  1. R (rupture) > 0.15
  2. M (reservoir) > 0.05
  3. velocity > 0.0005 (upward energy)
  4. Stochastic probability scaled by R
- **Velocity composition**: `v = momentum_throw + normal_lift + stochastic_spread`
- **Particle data layout**: Each particle = 2 vec4f:
  - `[posX, posY, posZ, mass]`
  - `[velX, velY, velZ, age]`

### Step 7: Particle Physics Update
- **Shader**: `updateParticlesShader`
- **Physics**: Gravity, buoyancy (Archimedes), water drag, air drag, surface tension pull-back, wall/floor bouncing
- **Deactivation**: Particles die when age > maxAge or when submerged + slow + old

### Step 8: Particle Compaction
- **Shader**: `resetParticlesShader`
- **Purpose**: Removes dead particles by compacting the array and updating the counter

### Step 9: Async Readback
- GPU data is copied to staging buffers, then `mapAsync` reads it back to CPU Float32Arrays for Three.js rendering.

---

## The Rendering Pipeline (Three.js / R3F)

### Water Surface
- Two meshes: one for above-water view (FrontSide), one for below-water view (BackSide)
- 200×200 subdivided plane, displaced by heightfield data in vertex shader
- Fragment shader: refraction, reflection, Fresnel, caustics, sphere shadow

### Pool Walls
- BoxGeometry rendered from inside (BackSide)
- Receives caustics and tile pattern

### Sphere
- IcosahedronGeometry with underwater caustics lighting

### Caustics
- Separate render-to-texture pass that projects water surface distortion onto pool floor
- Uses `useCaustics` hook with its own shader pipeline

### Particles (ParticleRenderer)
- THREE.Points with custom shader material
- Gaussian density splatting (not discrete spheres!)
- Additive blending for fluid-like accumulation
- Very low alpha per particle — overlapping particles build up density

### Heatmap Overlay (debug)
- Shows surface intent fields as color overlay on water surface
- R=red, C=green, M=blue channels

---

## Data Flow Summary

```
User Input (click/drag)
    ↓
WebGPU Compute Pipeline (Steps 1-8)
    ↓
Staging Buffer → mapAsync → CPU Float32Arrays
    ↓
DataTexture.needsUpdate = true
    ↓
Three.js shader uniforms read DataTextures
    ↓
R3F renders water surface, pool, sphere, particles, caustics
```

---

## Key Constants

| Constant | Value | Meaning |
|----------|-------|---------|
| GRID_SIZE | 256 | Water heightfield resolution |
| MAX_PARTICLES | 8192 | Maximum MLS-MPM particles |
| Workgroup size (2D) | 16×16 | For grid shaders |
| Workgroup size (1D) | 256 | For particle update |
| Pool bounds | [-1, 1] XZ | World-space pool extent |
| Water surface Y | 0 | Rest height of water |
| Sphere radius | 0.25 | Default sphere size |
