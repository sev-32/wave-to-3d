# GPTWAVES R3F System Map & Index

**Date:** 2025-01-27  
**Status:** ✅ Production Ready - WORKING CAUSTICS  
**Engine:** React Three Fiber (R3F) Port of WebGL Water  
**Purpose:** Complete system architecture documentation and navigation index

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Component Hierarchy](#component-hierarchy)
4. [Data Flow](#data-flow)
5. [Rendering Pipeline](#rendering-pipeline)
6. [File Structure](#file-structure)
7. [Component Reference](#component-reference)
8. [Hook Reference](#hook-reference)
9. [Shader Reference](#shader-reference)
10. [Utility Reference](#utility-reference)
11. [Critical Implementation Details](#critical-implementation-details)
12. [Performance Considerations](#performance-considerations)
13. [Integration Guide](#integration-guide)

---

## System Overview

### What is GPTWAVES?

GPTWAVES is a React Three Fiber (R3F) port of the original WebGL Water demo with **WORKING CAUSTICS**. It represents the best R3F implementation of real-time water simulation with:

- ✅ **Working caustics** (first R3F implementation to achieve this)
- ✅ **Dual-pass water rendering** (above/below water views)
- ✅ **Interactive sphere physics** (creates wave disturbances)
- ✅ **Obstacle system** (beach rocks, breakwaters, moving boat)
- ✅ **Pool and beach modes** (switchable environments)
- ✅ **Real-time height field simulation** (ping-pong texture buffers)

### Key Achievement: Working Caustics

**Why this matters:** Previous R3F ports failed to render caustics correctly. GPTWAVES succeeded by:

1. **Explicit `UnsignedByteType` render target** - Matches original 8-bit RGBA
2. **`waterTextureGetter` function pattern** - Always uses current ping-pong buffer
3. **Proper render target state management** - Saves/restores render target and clear color
4. **Correct frame order** - Caustics generated after normals, before main render
5. **Original geometry structure** - Matches original pool geometry exactly
6. **Original vertex shader Y-remap** - Critical for correct pool depth

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    App.tsx (Unified App)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              <Canvas> (R3F Canvas)                    │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │         <SceneBackground />                     │  │  │
│  │  │         (Background system)                     │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │         <GptwavesEngine />                     │  │  │
│  │  │  ┌──────────────────────────────────────────┐  │  │  │
│  │  │  │      <GptwavesScene />                   │  │  │  │
│  │  │  │  ┌────────────────────────────────────┐  │  │  │  │
│  │  │  │  │  useWaterSimulation()              │  │  │  │  │
│  │  │  │  │  (Ping-pong height field)          │  │  │  │  │
│  │  │  │  └────────────────────────────────────┘  │  │  │  │
│  │  │  │  ┌────────────────────────────────────┐  │  │  │  │
│  │  │  │  │  useCaustics()                     │  │  │  │  │
│  │  │  │  │  (Caustics generation)             │  │  │  │  │
│  │  │  │  └────────────────────────────────────┘  │  │  │  │
│  │  │  │  ┌────────────────────────────────────┐  │  │  │  │
│  │  │  │  │  <WaterSurface />                  │  │  │  │  │
│  │  │  │  │  (Dual-pass rendering)             │  │  │  │  │
│  │  │  │  └────────────────────────────────────┘  │  │  │  │
│  │  │  │  ┌────────────────────────────────────┐  │  │  │  │
│  │  │  │  │  <Pool /> or <SandFloor />        │  │  │  │  │
│  │  │  │  │  (Environment)                    │  │  │  │  │
│  │  │  │  └────────────────────────────────────┘  │  │  │  │
│  │  │  │  ┌────────────────────────────────────┐  │  │  │  │
│  │  │  │  │  <Sphere />                       │  │  │  │  │
│  │  │  │  │  (Interactive sphere)             │  │  │  │  │
│  │  │  │  └────────────────────────────────────┘  │  │  │  │
│  │  │  │  ┌────────────────────────────────────┐  │  │  │  │
│  │  │  │  │  <Obstacles />                     │  │  │  │  │
│  │  │  │  │  (Beach obstacles)                 │  │  │  │  │
│  │  │  │  └────────────────────────────────────┘  │  │  │  │
│  │  │  └──────────────────────────────────────────┘  │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

### Entry Point: `GptwavesEngine.tsx`

**Purpose:** Wrapper component that adapts unified settings to GPTWAVES-specific props

**Props:**
- `settings: UnifiedWaterSettings` - Unified settings from app
- `onResetRef?: React.MutableRefObject<(() => void) | null>` - Reset callback ref

**Responsibilities:**
- Extract relevant settings from unified settings object
- Map settings to GPTWAVES-specific props
- Pass props to `GptwavesScene`

**Key Mappings:**
- `paused = !settings.waves.autoUpdate`
- `poolEnabled = settings.pool.enabled`
- `poolSize = settings.pool.size`
- `backgroundType = settings.scene.backgroundType`

---

### Main Scene: `GptwavesScene.tsx`

**Purpose:** Orchestrates the entire water simulation scene

**Key Responsibilities:**
1. **State Management:**
   - Camera orbit angles (angleXDegRef, angleYDegRef)
   - Sphere physics (position, velocity, gravity)
   - Light direction (lightDirRef)
   - Input mode (MODE_NONE, MODE_ADD_DROPS, MODE_MOVE_SPHERE, MODE_ORBIT_CAMERA)

2. **Hooks Integration:**
   - `useWaterSimulation()` - Height field simulation
   - `useCaustics()` - Caustics generation
   - `useWebglWaterAssets()` - Asset loading

3. **Input Handling:**
   - Pointer events (down, move, up, cancel)
   - Ray casting for sphere/water interaction
   - Camera orbit controls

4. **Frame Updates (`useFrame`):**
   - Camera positioning from orbit angles
   - Light direction updates (if following camera)
   - Sphere physics simulation
   - Water simulation steps (2x per frame)
   - Normal updates
   - Caustics updates
   - Dynamic obstacle updates (moving boat)

5. **Rendering:**
   - Conditional rendering based on pool/beach mode
   - CubeCamera for dynamic sky (nebula/volumetric clouds)
   - Static skyCubemap for other backgrounds

**Critical Frame Order:**
```typescript
useFrame((state, deltaSeconds) => {
  // 1. Update camera position
  // 2. Update light (if following camera)
  // 3. Update sphere physics
  // 4. Displace water around sphere
  // 5. Step simulation (2x)
  // 6. Update normals
  // 7. Update caustics ← CRITICAL: After normals, before render
}, -1); // Priority -1 ensures this runs before render
```

---

## Data Flow

### Settings Flow

```
UnifiedWaterSettings (Type)
  ↓
useUnifiedSettings (Hook)
  ↓ State management
GptwavesEngine (Component)
  ↓ Props extraction
GptwavesScene (Component)
  ↓ Props consumption
Individual Components
  ↓ Direct usage
```

### Texture Flow

```
useWaterSimulation
  ↓ Ping-pong buffers (textureA, textureB)
  ↓ getTexture() → current active buffer
waterTextureGetter() function
  ↓ Passed to all components
Components use in shaders
  ↓ Uniform updates
Shader rendering
```

### Caustics Flow

```
useWaterSimulation.updateNormals()
  ↓ Normal texture updated
useCaustics.updateCaustics()
  ↓ Uses current water texture
  ↓ Renders to causticsTarget (UnsignedByteType)
  ↓ Returns causticsTexture
Components receive causticsTexture
  ↓ Uniform updates
Shader rendering with caustics
```

---

## Rendering Pipeline

### Frame Execution Order

```
1. useFrame Hook (Priority -1)
   ├─ Camera positioning
   ├─ Light direction updates
   ├─ Sphere physics
   ├─ Water displacement (moveSphere)
   ├─ Simulation steps (2x)
   ├─ Normal updates
   └─ Caustics updates ← CRITICAL ORDER

2. Component Rendering
   ├─ <Pool /> or <SandFloor />
   ├─ <Obstacles />
   ├─ <WaterSurface /> (dual-pass)
   └─ <Sphere />

3. Background Rendering
   └─ <SceneBackground /> (if applicable)
```

### Water Simulation Pipeline

```
Frame Start
  ↓
moveSphere(oldCenter, newCenter)
  ↓ Displaces water around sphere
stepSimulation() (2x)
  ↓ Updates height field (ping-pong swap)
updateNormals()
  ↓ Calculates surface normals
updateCaustics(waterTexture, lightDir, sphereCenter, sphereRadius)
  ↓ Generates caustics texture
Frame Complete
```

### Dual-Pass Water Rendering

**Above Water (`materialAbove`):**
- `side: THREE.BackSide` - Renders back faces
- Uses `WATER_FRAGMENT_SHADER_ABOVE`
- Reflections and refractions
- Fresnel blending

**Underwater (`materialUnderwater`):**
- `side: THREE.FrontSide` - Renders front faces
- Uses `WATER_FRAGMENT_SHADER_UNDERWATER`
- Correct surface wave visualization
- Underwater color tinting

---

## File Structure

```
gptwaves/
├── GptwavesEngine.tsx          # Entry point wrapper
├── GptwavesScene.tsx            # Main scene orchestrator
├── components/
│   ├── WaterSurface.tsx         # Dual-pass water rendering
│   ├── Pool.tsx                 # Pool environment
│   ├── Sphere.tsx               # Interactive sphere
│   ├── SandFloor.tsx            # Beach floor
│   └── Obstacles.tsx            # Beach obstacles
├── hooks/
│   ├── useWaterSimulation.ts    # Height field simulation
│   └── useCaustics.ts           # Caustics generation
├── assets/
│   └── useWebglWaterAssets.ts   # Asset loading
├── shaders/
│   ├── simulationShaders.ts     # Wave simulation shaders
│   ├── rendererShaders.ts       # Water/pool/sphere rendering
│   ├── causticsShaders.ts       # Caustics generation
│   ├── obstacleShaders.ts       # Obstacle rendering
│   └── sandShaders.ts           # Sand floor rendering
└── utils/
    ├── rayMath.ts               # Ray-sphere intersection
    └── obstacles.ts              # Obstacle data generation
```

---

## Component Reference

### WaterSurface.tsx

**Purpose:** Dual-pass water surface rendering (above/below water)

**Props:**
- `waterTextureGetter: () => THREE.Texture` - Function to get current water texture
- `tileTexture: THREE.Texture` - Pool tile texture
- `causticsTexture: THREE.Texture` - Caustics texture
- `skyCubemap: THREE.CubeTexture` - Sky cubemap
- `lightDir: THREE.Vector3` - Light direction
- `sphereCenter: THREE.Vector3` - Sphere position
- `sphereRadius: number` - Sphere radius
- `beachMode: boolean` - Beach mode flag
- `obstacleTexture?: THREE.Texture | null` - Obstacle mask texture
- `sandScale?: number` - Sand texture scale

**Key Features:**
- Dual materials (above/underwater)
- Real-time uniform updates via `useFrame`
- Obstacle masking
- Eye position calculation for reflections

**Shaders:**
- `WATER_VERTEX_SHADER` - Displaces vertices based on height field
- `WATER_FRAGMENT_SHADER_ABOVE` - Above-water rendering
- `WATER_FRAGMENT_SHADER_UNDERWATER` - Underwater rendering

---

### Pool.tsx

**Purpose:** Pool environment rendering (walls, floor, caustics)

**Props:**
- `waterTextureGetter: () => THREE.Texture`
- `tileTexture: THREE.Texture`
- `causticsTexture: THREE.Texture`
- `lightDir: THREE.Vector3`
- `sphereCenter: THREE.Vector3`
- `sphereRadius: number`

**Key Features:**
- Custom geometry matching original pool structure
- Y-remap vertex shader (critical for correct depth)
- Caustics applied to walls and floor
- Underwater color tinting

**Geometry:**
- 5 faces (open top)
- Custom BufferGeometry matching original LightGL cube

**Shaders:**
- `CUBE_VERTEX_SHADER` - Y-remap for pool depth
- `CUBE_FRAGMENT_SHADER` - Wall/floor rendering with caustics

---

### Sphere.tsx

**Purpose:** Interactive sphere with physics

**Props:**
- `waterTextureGetter: () => THREE.Texture`
- `causticsTexture: THREE.Texture`
- `lightDir: THREE.Vector3`
- `sphereCenter: THREE.Vector3`
- `sphereRadius: number`

**Key Features:**
- Ambient occlusion with pool walls
- Caustics applied when underwater
- Real-time position updates

**Shaders:**
- `SPHERE_VERTEX_SHADER` - Positions sphere in world space
- `SPHERE_FRAGMENT_SHADER` - Sphere rendering with caustics

---

### SandFloor.tsx

**Purpose:** Beach floor rendering with procedural sand

**Props:**
- `waterTextureGetter: () => THREE.Texture`
- `causticsTexture: THREE.Texture`
- `lightDir: THREE.Vector3`
- `size?: number` - Floor size (default 20)
- `sandScale?: number` - Sand texture scale (default 3.5)
- `y?: number` - Y position (default -1)

**Key Features:**
- Procedural sand texture (FBM noise)
- Animated ripples
- Caustics applied when underwater
- Water normal influence on sand pattern

**Shaders:**
- `SAND_VERTEX_SHADER` - Simple pass-through
- `SAND_FRAGMENT_SHADER` - Procedural sand with caustics

---

### Obstacles.tsx

**Purpose:** Beach obstacles rendering (rocks, breakwaters)

**Props:**
- `obstacles: readonly GptwavesObstacle[]` - Obstacle data
- `waterTextureGetter: () => THREE.Texture`
- `causticsTexture: THREE.Texture`
- `lightDir: THREE.Vector3`
- `invScale: number` - Inverse scale for coordinate conversion

**Key Features:**
- Supports cylinder and wall obstacles
- Caustics applied when underwater
- World-to-simulation space conversion

**Shaders:**
- `OBSTACLE_VERTEX_SHADER` - World-to-simulation space conversion
- `OBSTACLE_FRAGMENT_SHADER` - Obstacle rendering with caustics

---

## Hook Reference

### useWaterSimulation

**Purpose:** Height field water simulation using ping-pong buffers

**Parameters:**
- `resolution?: number` - Simulation resolution (default 256)

**Returns:**
- `addDrop(x, z, radius, strength)` - Add wave drop
- `moveSphere(oldCenter, newCenter, radius)` - Displace water around sphere
- `stepSimulation()` - Advance simulation one step
- `updateNormals()` - Calculate surface normals
- `reset()` - Reset simulation to zero
- `getTexture()` - Get current active texture
- `setObstacleTexture(texture)` - Set obstacle mask texture

**Implementation:**
- Ping-pong buffers (textureA, textureB)
- Automatic type selection (FloatType or HalfFloatType)
- Render target state management
- Obstacle mask support

**Texture Data Layout:**
- R: Height
- G: Velocity
- B: Normal X
- A: Normal Z

---

### useCaustics

**Purpose:** Caustics texture generation

**Parameters:**
- `resolution?: number` - Caustics resolution (default 1024)
- `waterMeshDetail?: number` - Water mesh detail (default 200)

**Returns:**
- `texture: THREE.Texture` - Caustics texture
- `updateCaustics(waterTexture, lightDir, sphereCenter, sphereRadius)` - Update caustics

**Implementation:**
- **CRITICAL:** `UnsignedByteType` render target (not default FloatType)
- WebGL extension detection (`OES_standard_derivatives`)
- Fallback shader if derivatives unavailable
- Proper render target state management

**Why UnsignedByteType:**
- Matches original 8-bit RGBA format
- Prevents float texture precision issues
- Ensures correct caustics rendering

---

### useWebglWaterAssets

**Purpose:** Asset loading with fallbacks

**Returns:**
- `tileTexture: THREE.Texture | null` - Pool tile texture
- `skyCubemap: THREE.CubeTexture | null` - Sky cubemap
- `assetsLoaded: boolean` - Loading state

**Implementation:**
- Async image loading
- Procedural fallbacks for missing assets
- Cancellation support
- Error handling

**Fallbacks:**
- Tile texture: Procedural grid pattern
- Sky cubemap: Procedural sky generation

---

## Shader Reference

### Simulation Shaders

**Location:** `shaders/simulationShaders.ts`

**Shaders:**
1. **DROP** - Add wave drops
2. **UPDATE** - Advance simulation
3. **NORMAL** - Calculate normals
4. **SPHERE** - Displace water around sphere

**Key Features:**
- Obstacle mask support
- Reflective boundaries
- Velocity damping

---

### Renderer Shaders

**Location:** `shaders/rendererShaders.ts`

**Shaders:**
1. **WATER** - Water surface rendering (above/underwater)
2. **CUBE** - Pool walls/floor
3. **SPHERE** - Interactive sphere

**Key Features:**
- Dual-pass rendering
- Fresnel blending
- Ray tracing for reflections/refractions
- Caustics integration
- Beach mode support

---

### Caustics Shaders

**Location:** `shaders/causticsShaders.ts`

**Shaders:**
1. **CAUSTICS_VERTEX** - Project caustics to pool floor
2. **CAUSTICS_FRAGMENT** - Calculate caustics intensity (uses `dFdx`/`dFdy`)
3. **CAUSTICS_FRAGMENT_FALLBACK** - Fallback without derivatives

**Key Features:**
- Uses `OES_standard_derivatives` extension
- Area-based caustics calculation
- Sphere shadow support
- Pool rim shadow

**Critical:**
- Requires `UnsignedByteType` render target
- Uses `dFdx`/`dFdy` for area calculation (derivatives extension)

---

### Obstacle Shaders

**Location:** `shaders/obstacleShaders.ts`

**Shaders:**
1. **OBSTACLE_VERTEX** - World-to-simulation space conversion
2. **OBSTACLE_FRAGMENT** - Obstacle rendering with caustics

**Key Features:**
- Coordinate space conversion
- Caustics when underwater
- Simple diffuse lighting

---

### Sand Shaders

**Location:** `shaders/sandShaders.ts`

**Shaders:**
1. **SAND_VERTEX** - Simple pass-through
2. **SAND_FRAGMENT** - Procedural sand with caustics

**Key Features:**
- FBM noise for sand texture
- Animated ripples
- Water normal influence
- Caustics integration

---

## Utility Reference

### rayMath.ts

**Functions:**
- `hitTestSphere(origin, ray, center, radius)` - Ray-sphere intersection

**Purpose:** Input handling for sphere interaction

---

### obstacles.ts

**Types:**
- `GptwavesObstacle` - Obstacle data type (cylinder or wall)

**Functions:**
- `createObstacleMaskData()` - Generate obstacle mask data
- `createObstacleMaskTextureFromData()` - Create texture from data
- `stampCapsuleObstacleMaskData()` - Add capsule obstacle to mask
- `createReefLineObstacles()` - Generate reef line obstacles
- `createRingObstacles()` - Generate ring obstacles
- `createBreakwaterObstacles()` - Generate breakwater obstacles

**Default Obstacles:**
- `DEFAULT_BEACH_OBSTACLES` - Pre-configured beach obstacles

---

## Critical Implementation Details

### Why Caustics Work

1. **Explicit `UnsignedByteType` render target:**
   ```typescript
   const causticsTarget = new THREE.WebGLRenderTarget(resolution, resolution, {
     type: THREE.UnsignedByteType, // ← CRITICAL
     format: THREE.RGBAFormat,
     // ...
   });
   ```

2. **`waterTextureGetter` function pattern:**
   ```typescript
   const waterTextureGetter = () => getTexture(); // Always current buffer
   ```

3. **Proper render target state management:**
   ```typescript
   const previousTarget = gl.getRenderTarget();
   const prevClearColor = gl.getClearColor(new THREE.Color());
   const prevClearAlpha = gl.getClearAlpha();
   // ... render ...
   gl.setRenderTarget(previousTarget);
   gl.setClearColor(prevClearColor, prevClearAlpha);
   ```

4. **Correct frame order:**
   ```typescript
   useFrame(() => {
     updateNormals(); // First
     updateCaustics(...); // Second (after normals)
   }, -1); // Priority ensures order
   ```

5. **Original geometry structure:**
   - Pool geometry matches original exactly
   - Y-remap vertex shader critical for depth

6. **Original vertex shader Y-remap:**
   ```glsl
   vPosition.y = ((1.0 - vPosition.y) * (7.0 / 12.0) - 1.0) * poolHeight;
   ```

### Ping-Pong Buffer Pattern

```typescript
const currentRef = useRef<'A' | 'B'>('A');

const getTargets = () => {
  const current = currentRef.current === 'A' ? textureA : textureB;
  const next = currentRef.current === 'A' ? textureB : textureA;
  return { current, next };
};

const swap = () => {
  currentRef.current = currentRef.current === 'A' ? 'B' : 'A';
};

const renderPass = (scene, material) => {
  const { current, next } = getTargets();
  material.uniforms.uTexture.value = current.texture;
  gl.setRenderTarget(next);
  gl.render(scene, quadCamera);
  swap(); // Swap after render
};
```

---

## Performance Considerations

### Render Target Sizes

- **Water Simulation:** 256x256 (configurable)
- **Caustics:** 1024x1024 (configurable)
- **Cube Camera:** 256/512/1024 (configurable via settings)

### Optimization Strategies

1. **Conditional Rendering:**
   - Only render active components
   - Skip updates when paused

2. **Texture Reuse:**
   - Ping-pong buffers for simulation
   - Shared caustics texture

3. **Render Order:**
   - Backgrounds first
   - Scene elements second
   - UI overlays last

4. **Frame Rate:**
   - 2x simulation steps per frame (for stability)
   - Caustics update every frame (after normals)

---

## Integration Guide

### Adding to Unified App

1. **Import:**
   ```typescript
   import { GptwavesEngine } from './engines/gptwaves/GptwavesEngine';
   ```

2. **Add to engine switch:**
   ```typescript
   case 'gptwaves':
     return <GptwavesEngine settings={settings} onResetRef={onResetRef} />;
   ```

3. **Add to settings type:**
   ```typescript
   activeEngine: 'gptwaves' | ...;
   ```

4. **Add to UI dropdown:**
   ```typescript
   { value: 'gptwaves', label: 'Gptwaves (Working Caustics!)' }
   ```

### Customization

**Changing Simulation Resolution:**
```typescript
const { ... } = useWaterSimulation({ resolution: 512 }); // Default 256
```

**Changing Caustics Resolution:**
```typescript
const { ... } = useCaustics({ resolution: 2048 }); // Default 1024
```

**Adding Custom Obstacles:**
```typescript
const customObstacles = [
  { kind: 'cylinder', center: { x: 0, z: 0 }, radius: 0.1, height: 1.0 }
];
```

---

## Quick Reference

### File Locations

| Component | File |
|-----------|------|
| Entry Point | `GptwavesEngine.tsx` |
| Main Scene | `GptwavesScene.tsx` |
| Water Surface | `components/WaterSurface.tsx` |
| Pool | `components/Pool.tsx` |
| Sphere | `components/Sphere.tsx` |
| Sand Floor | `components/SandFloor.tsx` |
| Obstacles | `components/Obstacles.tsx` |
| Water Simulation | `hooks/useWaterSimulation.ts` |
| Caustics | `hooks/useCaustics.ts` |
| Assets | `assets/useWebglWaterAssets.ts` |

### Key Constants

- **Simulation Resolution:** 256 (default)
- **Caustics Resolution:** 1024 (default)
- **Water Mesh Detail:** 200 (default)
- **Sphere Radius:** 0.25
- **Pool Height:** 1.0
- **IOR Air:** 1.0
- **IOR Water:** 1.333

### Critical Functions

- `getTexture()` - Get current water texture (always current buffer)
- `updateCaustics()` - Update caustics texture (after normals)
- `waterTextureGetter()` - Function pattern for texture access

---

**END OF SYSTEM MAP**

