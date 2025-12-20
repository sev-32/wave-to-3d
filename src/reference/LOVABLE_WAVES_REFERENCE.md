/**
 * ============================================================================
 * LOVABLE WAVES - REACT/TYPESCRIPT PORT (COMPLETE MONOLITH)
 * ============================================================================
 * 
 * This is a COMPLETE, self-contained version of the lovable-waves React/TypeScript port.
 * ALL code from the implementation is included in full - no summaries or placeholders.
 * 
 * Original Source: https://github.com/BlackOpsResearch/lovable-waves
 * Based on: Evan Wallace's WebGL Water demo (http://madebyevan.com/webgl-water/)
 * 
 * This file is NOT meant to run directly - it's a reference document for:
 * - Understanding the complete React/TypeScript port implementation
 * - Porting to React Three Fiber (R3F) / Three.js
 * - Comparing with original JavaScript version
 * - AI-assisted code generation and porting
 * 
 * ============================================================================
 * PORTING GOALS & RATIONALE
 * ============================================================================
 * 
 * PRIMARY GOAL: Port lovable-waves to React Three Fiber (R3F) / Three.js
 * 
 * Why Port to R3F?
 * 1. Unified Architecture: LUCID image app 3D editor uses R3F
 * 2. Ecosystem Integration: Access to R3F libraries (drei, postprocessing, etc.)
 * 3. Feature Integration: Volumetric clouds, backgrounds, effects work together
 * 4. Developer Experience: Declarative, component-based, hooks
 * 5. Type Safety: Better TypeScript support
 * 6. Scene Graph: All objects in one scene, easy to combine
 * 
 * Current Status:
 * - ✅ Working: Raw WebGL implementation with perfect caustics
 * - ❌ Missing: R3F/Three.js port (caustics not working in existing R3F ports)
 * - ⚠️  Issue: webgl-water R3F port has no caustics
 * 
 * Critical Challenge:
 * - lovable-waves has WORKING caustics (using OES_standard_derivatives)
 * - webgl-water R3F port has NO caustics
 * - Need to port caustics implementation to R3F/Three.js
 * 
 * ============================================================================
 * ISSUES ENCOUNTERED
 * ============================================================================
 * 
 * Issue #1: Caustics Not Working in R3F Ports
 * - Problem: Existing webgl-water R3F port lacks caustics implementation
 * - Root Cause: Caustics require OES_standard_derivatives extension and complex shader logic
 * - Solution Needed: Port caustics shader from lovable-waves to Three.js ShaderMaterial
 * 
 * Issue #2: Architecture Mismatch
 * - Problem: lovable-waves uses raw WebGL, volumetric clouds use R3F
 * - Root Cause: Different rendering contexts cannot share scene
 * - Solution Needed: Port lovable-waves to R3F OR port clouds to raw WebGL
 * - Decision: Port lovable-waves to R3F (better ecosystem integration)
 * 
 * Issue #3: Pool Wall Transparency ✅ FIXED
 * - Problem: Pool walls not transparent from outside view
 * - Root Cause: Incorrect culling face (FRONT vs BACK)
 * - Solution: Reverted to default BACK culling for transparency
 * - Status: ✅ FIXED
 * 
 * Issue #4: Skybox Loading ✅ FIXED
 * - Problem: Skybox images not loading, causing initialization delays
 * - Root Cause: Synchronous loading in original, async needed for React
 * - Solution: Refactored to async Promise-based loading with fallback
 * - Status: ✅ FIXED
 * 
 * Issue #5: Reset Functionality ✅ FIXED
 * - Problem: No reset button for water simulation
 * - Root Cause: Missing reset() method in Water class
 * - Solution: Added reset() method to clear water textures
 * - Status: ✅ FIXED
 * 
 * ============================================================================
 * SYSTEM ARCHITECTURE MAP
 * ============================================================================
 * 
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    LovableWavesEngine.tsx                       │
 * │  (React Component - Entry Point)                                │
 * │  - Canvas element                                                │
 * │  - Mouse/touch event handlers                                    │
 * │  - Error/loading states                                          │
 * │  - onResetRef prop for reset functionality                      │
 * └───────────────────────────┬─────────────────────────────────────┘
 *                             │
 *                             ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    useWebGLWater.ts                               │
 * │  (React Hook - WebGL Initialization & Animation)                 │
 * │  - WebGL context creation                                        │
 * │  - Water, Renderer, Cubemap initialization                       │
 * │  - Animation loop (requestAnimationFrame)                        │
 * │  - Pointer event handlers (mouse/touch)                          │
 * │  - Camera orbit controls                                         │
 * │  - Sphere physics                                                │
 * │  - Reset functionality                                           │
 * └───────────────────────────┬─────────────────────────────────────┘
 *                             │
 *                             ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    lib/webgl/ (WebGL Core Classes)               │
 * │                                                                   │
 * │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
 * │  │   Vector.ts  │  │   Matrix.ts  │  │  GLContext.ts│           │
 * │  │  - 3D math   │  │  - 4x4 math  │  │  - Matrix    │           │
 * │  │  - Operations│  │  - Transform │  │    stack     │           │
 * │  └──────────────┘  └──────────────┘  └──────────────┘           │
 * │                                                                   │
 * │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
 * │  │   Shader.ts  │  │    Mesh.ts   │  │  Texture.ts  │           │
 * │  │  - Compile   │  │  - Geometry  │  │  - Render-to │           │
 * │  │  - Uniforms  │  │  - Buffers   │  │    texture   │           │
 * │  └──────────────┘  └──────────────┘  └──────────────┘           │
 * │                                                                   │
 * │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
 * │  │  Cubemap.ts  │  │ Raytracer.ts │  │   Water.ts   │           │
 * │  │  - Skybox    │  │  - Hit test  │  │  - Simulation│           │
 * │  │  - Env map   │  │  - Ray cast  │  │  - Physics    │           │
 * │  └──────────────┘  └──────────────┘  └──────────────┘           │
 * │                                                                   │
 * │  ┌──────────────┐  ┌──────────────┐                             │
 * │  │ Renderer.ts  │  │TextureGen.ts │                             │
 * │  - Caustics     │  │  - Tile gen  │                             │
 * │  - Reflections  │  │  - Skybox gen│                             │
 * │  - Refractions  │  │              │                             │
 * │  - Water render │  │              │                             │
 * │  - Pool render  │  │              │                             │
 * │  - Sphere render│  │              │                             │
 * └─────────────────────────────────────────────────────────────────┘
 * 
 * ============================================================================
 * FILE STRUCTURE:
 * ============================================================================
 * 
 * 1. LovableWavesEngine.tsx (React Component)
 * 2. useWebGLWater.ts (React Hook)
 * 3. WebGL Core Classes (lib/webgl/):
 *    - Vector.ts
 *    - Matrix.ts
 *    - GLContext.ts
 *    - Shader.ts
 *    - Mesh.ts
 *    - Texture.ts
 *    - Cubemap.ts
 *    - Raytracer.ts
 *    - Water.ts
 *    - Renderer.ts
 *    - TextureGenerators.ts
 * 
 * ============================================================================
 * SECTION 1: LovableWavesEngine.tsx (React Component)
 * ============================================================================
 */

import { useRef, useEffect } from 'react';
import { useWebGLWater } from './useWebGLWater';
import { UnifiedWaterSettings } from '../../types/WaterSettings';
import * as THREE from 'three';

interface LovableWavesEngineProps {
  settings: UnifiedWaterSettings;
  lightDir: THREE.Vector3;
  sphereCenter: THREE.Vector3;
  onResetRef?: React.MutableRefObject<(() => void) | null>;
}

export function LovableWavesEngine({ settings, lightDir, sphereCenter, onResetRef }: LovableWavesEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const {
    isInitialized,
    error,
    handlePointerStart,
    handlePointerMove,
    handlePointerEnd,
    reset
  } = useWebGLWater(canvasRef);

  // Expose reset function via ref
  useEffect(() => {
    if (onResetRef) {
      onResetRef.current = reset;
    }
  }, [onResetRef, reset]);

  // Handle mouse events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      handlePointerStart(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      handlePointerEnd();
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [handlePointerStart, handlePointerMove, handlePointerEnd]);

  // Handle touch events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        handlePointerStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        handlePointerEnd();
      }
    };

    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handlePointerStart, handlePointerMove, handlePointerEnd]);

  if (error) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a2e',
        color: '#ff6b6b',
        fontSize: 16,
      }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: 48, marginBottom: '16px' }}>⚠</div>
          <h2 style={{ margin: '0 0 8px 0' }}>WebGL Error</h2>
          <p style={{ margin: 0, opacity: 0.8 }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
      background: '#000',
    }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'crosshair',
        }}
      />
      
      {!isInitialized && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.8)',
          color: '#fff',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid rgba(255,255,255,0.3)',
              borderTop: '4px solid #4a9',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }} />
            <p style={{ margin: 0, opacity: 0.8 }}>Initializing water simulation...</p>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/**
 * ============================================================================
 * SECTION 2: useWebGLWater.ts (React Hook) - COMPLETE
 * ============================================================================
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  createGLContext,
  GLContextExtended,
  Water,
  Renderer,
  Cubemap,
  Vector,
  Raytracer
} from './lib/webgl';
import { createTileTexture, createSkyboxTextures } from './lib/webgl/TextureGenerators';

const MODE_ADD_DROPS = 0;
const MODE_MOVE_SPHERE = 1;
const MODE_ORBIT_CAMERA = 2;

export function useWebGLWater(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const glRef = useRef<GLContextExtended | null>(null);
  const waterRef = useRef<Water | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const cubemapRef = useRef<Cubemap | null>(null);
  const animationRef = useRef<number | null>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const angleXRef = useRef(-25);
  const angleYRef = useRef(-200.5);
  
  const centerRef = useRef(new Vector(-0.4, -0.75, 0.2));
  const oldCenterRef = useRef(new Vector(-0.4, -0.75, 0.2));
  const velocityRef = useRef(new Vector());
  const gravityRef = useRef(new Vector(0, -4, 0));
  const radiusRef = useRef(0.25);
  const useSpherePhysicsRef = useRef(false);
  
  const modeRef = useRef(-1);
  const prevHitRef = useRef<Vector | null>(null);
  const planeNormalRef = useRef<Vector | null>(null);
  const oldPosRef = useRef({ x: 0, y: 0 });
  const pausedRef = useRef(false);
  
  const draw = useCallback(() => {
    const gl = glRef.current;
    const water = waterRef.current;
    const renderer = rendererRef.current;
    const cubemap = cubemapRef.current;
    
    if (!gl || !water || !renderer || !cubemap) return;
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.loadIdentity();
    gl.translate(0, 0, -4);
    gl.rotate(-angleXRef.current, 1, 0, 0);
    gl.rotate(-angleYRef.current, 0, 1, 0);
    gl.translate(0, 0.5, 0);
    
    gl.enable(gl.DEPTH_TEST);
    renderer.sphereCenter = centerRef.current;
    renderer.sphereRadius = radiusRef.current;
    renderer.renderCube(water);
    renderer.renderWater(water, cubemap);
    renderer.renderSphere(water);
    gl.disable(gl.DEPTH_TEST);
  }, []);
  
  const update = useCallback((seconds: number) => {
    const water = waterRef.current;
    const renderer = rendererRef.current;
    if (!water || !renderer) return;
    
    if (seconds > 1) return;
    
    if (modeRef.current === MODE_MOVE_SPHERE) {
      velocityRef.current = new Vector();
    } else if (useSpherePhysicsRef.current) {
      const percentUnderWater = Math.max(0, Math.min(1, (radiusRef.current - centerRef.current.y) / (2 * radiusRef.current)));
      velocityRef.current = velocityRef.current.add(
        gravityRef.current.multiply(seconds - 1.1 * seconds * percentUnderWater)
      );
      velocityRef.current = velocityRef.current.subtract(
        velocityRef.current.unit().multiply(percentUnderWater * seconds * velocityRef.current.dot(velocityRef.current))
      );
      centerRef.current = centerRef.current.add(velocityRef.current.multiply(seconds));
      
      if (centerRef.current.y < radiusRef.current - 1) {
        centerRef.current.y = radiusRef.current - 1;
        velocityRef.current.y = Math.abs(velocityRef.current.y) * 0.7;
      }
    }
    
    water.moveSphere(oldCenterRef.current, centerRef.current, radiusRef.current);
    oldCenterRef.current = centerRef.current;
    
    water.stepSimulation();
    water.stepSimulation();
    water.updateNormals();
    renderer.updateCaustics(water);
  }, []);
  
  const resize = useCallback(() => {
    const gl = glRef.current;
    const canvas = canvasRef.current;
    if (!gl || !canvas) return;
    
    const ratio = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.matrixMode(gl.PROJECTION);
    gl.loadIdentity();
    gl.perspective(45, canvas.width / canvas.height, 0.01, 100);
    gl.matrixMode(gl.MODELVIEW);
    
    draw();
  }, [draw]);
  
  const handlePointerStart = useCallback((x: number, y: number) => {
    const gl = glRef.current;
    const water = waterRef.current;
    const renderer = rendererRef.current;
    if (!gl || !water || !renderer) return;
    
    oldPosRef.current = { x, y };
    const ratio = window.devicePixelRatio || 1;
    
    const tracer = new Raytracer(gl);
    const ray = tracer.getRayForPixel(x * ratio, y * ratio);
    const pointOnPlane = tracer.eye.add(ray.multiply(-tracer.eye.y / ray.y));
    const sphereHitTest = Raytracer.hitTestSphere(tracer.eye, ray, centerRef.current, radiusRef.current);
    
    if (sphereHitTest && sphereHitTest.hit) {
      modeRef.current = MODE_MOVE_SPHERE;
      prevHitRef.current = sphereHitTest.hit;
      planeNormalRef.current = tracer.getRayForPixel(gl.canvas.width / 2, gl.canvas.height / 2).negative();
    } else if (Math.abs(pointOnPlane.x) < 1 && Math.abs(pointOnPlane.z) < 1) {
      modeRef.current = MODE_ADD_DROPS;
      water.addDrop(pointOnPlane.x, pointOnPlane.z, 0.03, 0.01);
      if (pausedRef.current) {
        water.updateNormals();
        renderer.updateCaustics(water);
      }
    } else {
      modeRef.current = MODE_ORBIT_CAMERA;
    }
  }, []);
  
  const handlePointerMove = useCallback((x: number, y: number) => {
    const gl = glRef.current;
    const water = waterRef.current;
    const renderer = rendererRef.current;
    if (!gl || !water || !renderer) return;
    
    const ratio = window.devicePixelRatio || 1;
    
    switch (modeRef.current) {
      case MODE_ADD_DROPS: {
        const tracer = new Raytracer(gl);
        const ray = tracer.getRayForPixel(x * ratio, y * ratio);
        const pointOnPlane = tracer.eye.add(ray.multiply(-tracer.eye.y / ray.y));
        water.addDrop(pointOnPlane.x, pointOnPlane.z, 0.03, 0.01);
        if (pausedRef.current) {
          water.updateNormals();
          renderer.updateCaustics(water);
        }
        break;
      }
      case MODE_MOVE_SPHERE: {
        if (!prevHitRef.current || !planeNormalRef.current) break;
        const tracer = new Raytracer(gl);
        const ray = tracer.getRayForPixel(x * ratio, y * ratio);
        const t = -planeNormalRef.current.dot(tracer.eye.subtract(prevHitRef.current)) / planeNormalRef.current.dot(ray);
        const nextHit = tracer.eye.add(ray.multiply(t));
        centerRef.current = centerRef.current.add(nextHit.subtract(prevHitRef.current));
        centerRef.current.x = Math.max(radiusRef.current - 1, Math.min(1 - radiusRef.current, centerRef.current.x));
        centerRef.current.y = Math.max(radiusRef.current - 1, Math.min(10, centerRef.current.y));
        centerRef.current.z = Math.max(radiusRef.current - 1, Math.min(1 - radiusRef.current, centerRef.current.z));
        prevHitRef.current = nextHit;
        if (pausedRef.current) renderer.updateCaustics(water);
        break;
      }
      case MODE_ORBIT_CAMERA: {
        angleYRef.current -= x - oldPosRef.current.x;
        angleXRef.current -= y - oldPosRef.current.y;
        angleXRef.current = Math.max(-89.999, Math.min(89.999, angleXRef.current));
        break;
      }
    }
    
    oldPosRef.current = { x, y };
    if (pausedRef.current) draw();
  }, [draw]);
  
  const handlePointerEnd = useCallback(() => {
    modeRef.current = -1;
  }, []);
  
  const toggleGravity = useCallback(() => {
    useSpherePhysicsRef.current = !useSpherePhysicsRef.current;
    return useSpherePhysicsRef.current;
  }, []);
  
  const togglePause = useCallback(() => {
    pausedRef.current = !pausedRef.current;
    return pausedRef.current;
  }, []);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    try {
      const gl = createGLContext(canvas);
      if (!gl) {
        setError('WebGL not supported');
        return;
      }
      glRef.current = gl;
      
      gl.clearColor(0, 0, 0, 1);
      
      const tileCanvas = createTileTexture();
      
      const loadSkyboxImages = async (): Promise<{
        xneg: HTMLImageElement;
        xpos: HTMLImageElement;
        yneg: HTMLImageElement;
        ypos: HTMLImageElement;
        zneg: HTMLImageElement;
        zpos: HTMLImageElement;
      }> => {
        const images = {
          xneg: new Image(),
          xpos: new Image(),
          yneg: new Image(),
          ypos: new Image(),
          zneg: new Image(),
          zpos: new Image()
        };
        
        const loadPromises = [
          new Promise<void>((resolve, reject) => { 
            images.xneg.onload = () => resolve(); 
            images.xneg.onerror = () => reject(new Error('Failed to load xneg.jpg'));
            images.xneg.src = '/xneg.jpg';
            if (images.xneg.complete) resolve();
          }),
          new Promise<void>((resolve, reject) => { 
            images.xpos.onload = () => resolve(); 
            images.xpos.onerror = () => reject(new Error('Failed to load xpos.jpg'));
            images.xpos.src = '/xpos.jpg';
            if (images.xpos.complete) resolve();
          }),
          new Promise<void>((resolve, reject) => { 
            images.yneg.onload = () => resolve(); 
            images.yneg.onerror = () => reject(new Error('Failed to load ypos.jpg for yneg'));
            images.yneg.src = '/ypos.jpg';
            if (images.yneg.complete) resolve();
          }),
          new Promise<void>((resolve, reject) => { 
            images.ypos.onload = () => resolve(); 
            images.ypos.onerror = () => reject(new Error('Failed to load ypos.jpg'));
            images.ypos.src = '/ypos.jpg';
            if (images.ypos.complete) resolve();
          }),
          new Promise<void>((resolve, reject) => { 
            images.zneg.onload = () => resolve(); 
            images.zneg.onerror = () => reject(new Error('Failed to load zneg.jpg'));
            images.zneg.src = '/zneg.jpg';
            if (images.zneg.complete) resolve();
          }),
          new Promise<void>((resolve, reject) => { 
            images.zpos.onload = () => resolve(); 
            images.zpos.onerror = () => reject(new Error('Failed to load zpos.jpg'));
            images.zpos.src = '/zpos.jpg';
            if (images.zpos.complete) resolve();
          })
        ];
        
        await Promise.all(loadPromises);
        return images;
      };
      
      const water = new Water(gl);
      waterRef.current = water;
      
      if (!water.textureA.canDrawTo() || !water.textureB.canDrawTo()) {
        throw new Error('Rendering to floating-point textures is required but not supported');
      }
      
      const renderer = new Renderer(gl, tileCanvas);
      rendererRef.current = renderer;
      
      for (let i = 0; i < 20; i++) {
        water.addDrop(Math.random() * 2 - 1, Math.random() * 2 - 1, 0.03, (i & 1) ? 0.01 : -0.01);
      }
      
      window.addEventListener('resize', resize);
      
      loadSkyboxImages()
        .then((skyImages) => {
          console.log('Skybox images loaded successfully');
          const cubemap = new Cubemap(gl, skyImages);
          cubemapRef.current = cubemap;
          setIsInitialized(true);
          
          resize();
          let prevTime = Date.now();
          const animate = () => {
            const nextTime = Date.now();
            if (!pausedRef.current) {
              update((nextTime - prevTime) / 1000);
              draw();
            }
            prevTime = nextTime;
            animationRef.current = requestAnimationFrame(animate);
          };
          animationRef.current = requestAnimationFrame(animate);
        })
        .catch((err) => {
          console.warn('Failed to load skybox images, using generated skybox:', err);
          const skyTextures = createSkyboxTextures();
          const cubemap = new Cubemap(gl, skyTextures);
          cubemapRef.current = cubemap;
          setIsInitialized(true);
          
          resize();
          let prevTime = Date.now();
          const animate = () => {
            const nextTime = Date.now();
            if (!pausedRef.current) {
              update((nextTime - prevTime) / 1000);
              draw();
            }
            prevTime = nextTime;
            animationRef.current = requestAnimationFrame(animate);
          };
          animationRef.current = requestAnimationFrame(animate);
        });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resize);
    };
  }, [draw, update, resize]);
  
  const reset = useCallback(() => {
    const water = waterRef.current;
    const renderer = rendererRef.current;
    if (!water || !renderer) return;
    
    if ('reset' in water && typeof water.reset === 'function') {
      water.reset();
      renderer.updateCaustics(water);
    }
    
    centerRef.current = new Vector(-0.4, -0.75, 0.2);
    oldCenterRef.current = new Vector(-0.4, -0.75, 0.2);
    velocityRef.current = new Vector();
    angleXRef.current = -25;
    angleYRef.current = -200.5;
    draw();
  }, [draw]);

  return {
    isInitialized,
    error,
    handlePointerStart,
    handlePointerMove,
    handlePointerEnd,
    toggleGravity,
    togglePause,
    reset
  };
}

/**
 * ============================================================================
 * SECTION 3: WebGL Core Classes (lib/webgl/)
 * ============================================================================
 * 
 * ============================================================================
 * SECTION 3.1: Vector.ts - COMPLETE
 * ============================================================================
 */

export class Vector {
  x: number;
  y: number;
  z: number;

  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  negative(): Vector {
    return new Vector(-this.x, -this.y, -this.z);
  }

  add(v: Vector | number): Vector {
    if (v instanceof Vector) {
      return new Vector(this.x + v.x, this.y + v.y, this.z + v.z);
    }
    return new Vector(this.x + v, this.y + v, this.z + v);
  }

  subtract(v: Vector | number): Vector {
    if (v instanceof Vector) {
      return new Vector(this.x - v.x, this.y - v.y, this.z - v.z);
    }
    return new Vector(this.x - v, this.y - v, this.z - v);
  }

  multiply(v: Vector | number): Vector {
    if (v instanceof Vector) {
      return new Vector(this.x * v.x, this.y * v.y, this.z * v.z);
    }
    return new Vector(this.x * v, this.y * v, this.z * v);
  }

  divide(v: Vector | number): Vector {
    if (v instanceof Vector) {
      return new Vector(this.x / v.x, this.y / v.y, this.z / v.z);
    }
    return new Vector(this.x / v, this.y / v, this.z / v);
  }

  equals(v: Vector): boolean {
    return this.x === v.x && this.y === v.y && this.z === v.z;
  }

  dot(v: Vector): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v: Vector): Vector {
    return new Vector(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  length(): number {
    return Math.sqrt(this.dot(this));
  }

  unit(): Vector {
    return this.divide(this.length());
  }

  min(): number {
    return Math.min(Math.min(this.x, this.y), this.z);
  }

  max(): number {
    return Math.max(Math.max(this.x, this.y), this.z);
  }

  toAngles(): { theta: number; phi: number } {
    return {
      theta: Math.atan2(this.z, this.x),
      phi: Math.asin(this.y / this.length()),
    };
  }

  angleTo(a: Vector): number {
    return Math.acos(this.dot(a) / (this.length() * a.length()));
  }

  toArray(n = 3): number[] {
    return [this.x, this.y, this.z].slice(0, n);
  }

  clone(): Vector {
    return new Vector(this.x, this.y, this.z);
  }

  init(x: number, y: number, z: number): Vector {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  // Static methods (for performance-critical operations)
  static negative(a: Vector, b: Vector): Vector {
    b.x = -a.x;
    b.y = -a.y;
    b.z = -a.z;
    return b;
  }

  static add(a: Vector, b: Vector | number, c: Vector): Vector {
    if (b instanceof Vector) {
      c.x = a.x + b.x;
      c.y = a.y + b.y;
      c.z = a.z + b.z;
    } else {
      c.x = a.x + b;
      c.y = a.y + b;
      c.z = a.z + b;
    }
    return c;
  }

  static subtract(a: Vector, b: Vector | number, c: Vector): Vector {
    if (b instanceof Vector) {
      c.x = a.x - b.x;
      c.y = a.y - b.y;
      c.z = a.z - b.z;
    } else {
      c.x = a.x - b;
      c.y = a.y - b;
      c.z = a.z - b;
    }
    return c;
  }

  static multiply(a: Vector, b: Vector | number, c: Vector): Vector {
    if (b instanceof Vector) {
      c.x = a.x * b.x;
      c.y = a.y * b.y;
      c.z = a.z * b.z;
    } else {
      c.x = a.x * b;
      c.y = a.y * b;
      c.z = a.z * b;
    }
    return c;
  }

  static divide(a: Vector, b: Vector | number, c: Vector): Vector {
    if (b instanceof Vector) {
      c.x = a.x / b.x;
      c.y = a.y / b.y;
      c.z = a.z / b.z;
    } else {
      c.x = a.x / b;
      c.y = a.y / b;
      c.z = a.z / b;
    }
    return c;
  }

  static cross(a: Vector, b: Vector, c: Vector): Vector {
    c.x = a.y * b.z - a.z * b.y;
    c.y = a.z * b.x - a.x * b.z;
    c.z = a.x * b.y - a.y * b.x;
    return c;
  }

  static unit(a: Vector, b: Vector): Vector {
    const length = a.length();
    b.x = a.x / length;
    b.y = a.y / length;
    b.z = a.z / length;
    return b;
  }

  static fromAngles(theta: number, phi: number): Vector {
    return new Vector(
      Math.cos(theta) * Math.cos(phi),
      Math.sin(phi),
      Math.sin(theta) * Math.cos(phi)
    );
  }

  static randomDirection(): Vector {
    return Vector.fromAngles(
      Math.random() * Math.PI * 2,
      Math.asin(Math.random() * 2 - 1)
    );
  }

  static min(a: Vector, b: Vector): Vector {
    return new Vector(
      Math.min(a.x, b.x),
      Math.min(a.y, b.y),
      Math.min(a.z, b.z)
    );
  }

  static max(a: Vector, b: Vector): Vector {
    return new Vector(
      Math.max(a.x, b.x),
      Math.max(a.y, b.y),
      Math.max(a.z, b.z)
    );
  }

  static lerp(a: Vector, b: Vector, fraction: number): Vector {
    return b.subtract(a).multiply(fraction).add(a);
  }

  static fromArray(a: number[]): Vector {
    return new Vector(a[0], a[1], a[2]);
  }

  static angleBetween(a: Vector, b: Vector): number {
    return a.angleTo(b);
  }
}

/**
 * ============================================================================
 * SECTION 3.2: Matrix.ts - COMPLETE
 * ============================================================================
 */

import { Vector } from './Vector';

export class Matrix {
  m: Float32Array;

  constructor(...args: number[] | number[][]) {
    let elements = args.flat();
    if (elements.length === 0) {
      elements = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    }
    this.m = new Float32Array(elements);
  }

  inverse(): Matrix {
    return Matrix.inverse(this, new Matrix());
  }

  transpose(): Matrix {
    return Matrix.transpose(this, new Matrix());
  }

  multiply(matrix: Matrix): Matrix {
    return Matrix.multiply(this, matrix, new Matrix());
  }

  transformPoint(v: Vector): Vector {
    const m = this.m;
    return new Vector(
      m[0] * v.x + m[1] * v.y + m[2] * v.z + m[3],
      m[4] * v.x + m[5] * v.y + m[6] * v.z + m[7],
      m[8] * v.x + m[9] * v.y + m[10] * v.z + m[11]
    ).divide(m[12] * v.x + m[13] * v.y + m[14] * v.z + m[15]);
  }

  transformVector(v: Vector): Vector {
    const m = this.m;
    return new Vector(
      m[0] * v.x + m[1] * v.y + m[2] * v.z,
      m[4] * v.x + m[5] * v.y + m[6] * v.z,
      m[8] * v.x + m[9] * v.y + m[10] * v.z
    );
  }

  static inverse(matrix: Matrix, result: Matrix): Matrix {
    result = result || new Matrix();
    const m = matrix.m;
    const r = result.m;

    r[0] = m[5] * m[10] * m[15] - m[5] * m[14] * m[11] - m[6] * m[9] * m[15] + m[6] * m[13] * m[11] + m[7] * m[9] * m[14] - m[7] * m[13] * m[10];
    r[1] = -m[1] * m[10] * m[15] + m[1] * m[14] * m[11] + m[2] * m[9] * m[15] - m[2] * m[13] * m[11] - m[3] * m[9] * m[14] + m[3] * m[13] * m[10];
    r[2] = m[1] * m[6] * m[15] - m[1] * m[14] * m[7] - m[2] * m[5] * m[15] + m[2] * m[13] * m[7] + m[3] * m[5] * m[14] - m[3] * m[13] * m[6];
    r[3] = -m[1] * m[6] * m[11] + m[1] * m[10] * m[7] + m[2] * m[5] * m[11] - m[2] * m[9] * m[7] - m[3] * m[5] * m[10] + m[3] * m[9] * m[6];

    r[4] = -m[4] * m[10] * m[15] + m[4] * m[14] * m[11] + m[6] * m[8] * m[15] - m[6] * m[12] * m[11] - m[7] * m[8] * m[14] + m[7] * m[12] * m[10];
    r[5] = m[0] * m[10] * m[15] - m[0] * m[14] * m[11] - m[2] * m[8] * m[15] + m[2] * m[12] * m[11] + m[3] * m[8] * m[14] - m[3] * m[12] * m[10];
    r[6] = -m[0] * m[6] * m[15] + m[0] * m[14] * m[7] + m[2] * m[4] * m[15] - m[2] * m[12] * m[7] - m[3] * m[4] * m[14] + m[3] * m[12] * m[6];
    r[7] = m[0] * m[6] * m[11] - m[0] * m[10] * m[7] - m[2] * m[4] * m[11] + m[2] * m[8] * m[7] + m[3] * m[4] * m[10] - m[3] * m[8] * m[6];

    r[8] = m[4] * m[9] * m[15] - m[4] * m[13] * m[11] - m[5] * m[8] * m[15] + m[5] * m[12] * m[11] + m[7] * m[8] * m[13] - m[7] * m[12] * m[9];
    r[9] = -m[0] * m[9] * m[15] + m[0] * m[13] * m[11] + m[1] * m[8] * m[15] - m[1] * m[12] * m[11] - m[3] * m[8] * m[13] + m[3] * m[12] * m[9];
    r[10] = m[0] * m[5] * m[15] - m[0] * m[13] * m[7] - m[1] * m[4] * m[15] + m[1] * m[12] * m[7] + m[3] * m[4] * m[13] - m[3] * m[12] * m[5];
    r[11] = -m[0] * m[5] * m[11] + m[0] * m[9] * m[7] + m[1] * m[4] * m[11] - m[1] * m[8] * m[7] - m[3] * m[4] * m[9] + m[3] * m[8] * m[5];

    r[12] = -m[4] * m[9] * m[14] + m[4] * m[13] * m[10] + m[5] * m[8] * m[14] - m[5] * m[12] * m[10] - m[6] * m[8] * m[13] + m[6] * m[12] * m[9];
    r[13] = m[0] * m[9] * m[14] - m[0] * m[13] * m[10] - m[1] * m[8] * m[14] + m[1] * m[12] * m[10] + m[2] * m[8] * m[13] - m[2] * m[12] * m[9];
    r[14] = -m[0] * m[5] * m[14] + m[0] * m[13] * m[6] + m[1] * m[4] * m[14] - m[1] * m[12] * m[6] - m[2] * m[4] * m[13] + m[2] * m[12] * m[5];
    r[15] = m[0] * m[5] * m[10] - m[0] * m[9] * m[6] - m[1] * m[4] * m[10] + m[1] * m[8] * m[6] + m[2] * m[4] * m[9] - m[2] * m[8] * m[5];

    const det = m[0] * r[0] + m[1] * r[4] + m[2] * r[8] + m[3] * r[12];
    for (let i = 0; i < 16; i++) r[i] /= det;
    return result;
  }

  static transpose(matrix: Matrix, result: Matrix): Matrix {
    result = result || new Matrix();
    const m = matrix.m;
    const r = result.m;
    r[0] = m[0]; r[1] = m[4]; r[2] = m[8]; r[3] = m[12];
    r[4] = m[1]; r[5] = m[5]; r[6] = m[9]; r[7] = m[13];
    r[8] = m[2]; r[9] = m[6]; r[10] = m[10]; r[11] = m[14];
    r[12] = m[3]; r[13] = m[7]; r[14] = m[11]; r[15] = m[15];
    return result;
  }

  static multiply(left: Matrix, right: Matrix, result: Matrix): Matrix {
    result = result || new Matrix();
    const a = left.m;
    const b = right.m;
    const r = result.m;

    r[0] = a[0] * b[0] + a[1] * b[4] + a[2] * b[8] + a[3] * b[12];
    r[1] = a[0] * b[1] + a[1] * b[5] + a[2] * b[9] + a[3] * b[13];
    r[2] = a[0] * b[2] + a[1] * b[6] + a[2] * b[10] + a[3] * b[14];
    r[3] = a[0] * b[3] + a[1] * b[7] + a[2] * b[11] + a[3] * b[15];

    r[4] = a[4] * b[0] + a[5] * b[4] + a[6] * b[8] + a[7] * b[12];
    r[5] = a[4] * b[1] + a[5] * b[5] + a[6] * b[9] + a[7] * b[13];
    r[6] = a[4] * b[2] + a[5] * b[6] + a[6] * b[10] + a[7] * b[14];
    r[7] = a[4] * b[3] + a[5] * b[7] + a[6] * b[11] + a[7] * b[15];

    r[8] = a[8] * b[0] + a[9] * b[4] + a[10] * b[8] + a[11] * b[12];
    r[9] = a[8] * b[1] + a[9] * b[5] + a[10] * b[9] + a[11] * b[13];
    r[10] = a[8] * b[2] + a[9] * b[6] + a[10] * b[10] + a[11] * b[14];
    r[11] = a[8] * b[3] + a[9] * b[7] + a[10] * b[11] + a[11] * b[15];

    r[12] = a[12] * b[0] + a[13] * b[4] + a[14] * b[8] + a[15] * b[12];
    r[13] = a[12] * b[1] + a[13] * b[5] + a[14] * b[9] + a[15] * b[13];
    r[14] = a[12] * b[2] + a[13] * b[6] + a[14] * b[10] + a[15] * b[14];
    r[15] = a[12] * b[3] + a[13] * b[7] + a[14] * b[11] + a[15] * b[15];

    return result;
  }

  static identity(result?: Matrix): Matrix {
    result = result || new Matrix();
    const m = result.m;
    m[0] = m[5] = m[10] = m[15] = 1;
    m[1] = m[2] = m[3] = m[4] = m[6] = m[7] = m[8] = m[9] = m[11] = m[12] = m[13] = m[14] = 0;
    return result;
  }

  static perspective(fov: number, aspect: number, near: number, far: number, result?: Matrix): Matrix {
    const y = Math.tan((fov * Math.PI) / 360) * near;
    const x = y * aspect;
    return Matrix.frustum(-x, x, -y, y, near, far, result);
  }

  static frustum(l: number, r: number, b: number, t: number, n: number, f: number, result?: Matrix): Matrix {
    result = result || new Matrix();
    const m = result.m;

    m[0] = (2 * n) / (r - l);
    m[1] = 0;
    m[2] = (r + l) / (r - l);
    m[3] = 0;

    m[4] = 0;
    m[5] = (2 * n) / (t - b);
    m[6] = (t + b) / (t - b);
    m[7] = 0;

    m[8] = 0;
    m[9] = 0;
    m[10] = -(f + n) / (f - n);
    m[11] = (-2 * f * n) / (f - n);

    m[12] = 0;
    m[13] = 0;
    m[14] = -1;
    m[15] = 0;

    return result;
  }

  static ortho(l: number, r: number, b: number, t: number, n: number, f: number, result?: Matrix): Matrix {
    result = result || new Matrix();
    const m = result.m;

    m[0] = 2 / (r - l);
    m[1] = 0;
    m[2] = 0;
    m[3] = -(r + l) / (r - l);

    m[4] = 0;
    m[5] = 2 / (t - b);
    m[6] = 0;
    m[7] = -(t + b) / (t - b);

    m[8] = 0;
    m[9] = 0;
    m[10] = -2 / (f - n);
    m[11] = -(f + n) / (f - n);

    m[12] = 0;
    m[13] = 0;
    m[14] = 0;
    m[15] = 1;

    return result;
  }

  static scale(x: number, y: number, z: number, result?: Matrix): Matrix {
    result = result || new Matrix();
    const m = result.m;

    m[0] = x; m[1] = 0; m[2] = 0; m[3] = 0;
    m[4] = 0; m[5] = y; m[6] = 0; m[7] = 0;
    m[8] = 0; m[9] = 0; m[10] = z; m[11] = 0;
    m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;

    return result;
  }

  static translate(x: number, y: number, z: number, result?: Matrix): Matrix {
    result = result || new Matrix();
    const m = result.m;

    m[0] = 1; m[1] = 0; m[2] = 0; m[3] = x;
    m[4] = 0; m[5] = 1; m[6] = 0; m[7] = y;
    m[8] = 0; m[9] = 0; m[10] = 1; m[11] = z;
    m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;

    return result;
  }

  static rotate(a: number, x: number, y: number, z: number, result?: Matrix): Matrix {
    if (!a || (!x && !y && !z)) {
      return Matrix.identity(result);
    }

    result = result || new Matrix();
    const m = result.m;

    const d = Math.sqrt(x * x + y * y + z * z);
    a *= Math.PI / 180;
    x /= d;
    y /= d;
    z /= d;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const t = 1 - c;

    m[0] = x * x * t + c;
    m[1] = x * y * t - z * s;
    m[2] = x * z * t + y * s;
    m[3] = 0;

    m[4] = y * x * t + z * s;
    m[5] = y * y * t + c;
    m[6] = y * z * t - x * s;
    m[7] = 0;

    m[8] = z * x * t - y * s;
    m[9] = z * y * t + x * s;
    m[10] = z * z * t + c;
    m[11] = 0;

    m[12] = 0;
    m[13] = 0;
    m[14] = 0;
    m[15] = 1;

    return result;
  }

  static lookAt(
    ex: number, ey: number, ez: number,
    cx: number, cy: number, cz: number,
    ux: number, uy: number, uz: number,
    result?: Matrix
  ): Matrix {
    result = result || new Matrix();
    const m = result.m;

    const e = new Vector(ex, ey, ez);
    const c = new Vector(cx, cy, cz);
    const u = new Vector(ux, uy, uz);
    const f = e.subtract(c).unit();
    const s = u.cross(f).unit();
    const t = f.cross(s).unit();

    m[0] = s.x; m[1] = s.y; m[2] = s.z; m[3] = -s.dot(e);
    m[4] = t.x; m[5] = t.y; m[6] = t.z; m[7] = -t.dot(e);
    m[8] = f.x; m[9] = f.y; m[10] = f.z; m[11] = -f.dot(e);
    m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;

    return result;
  }
}

/**
 * ============================================================================
 * SECTION 3.3: GLContext.ts - COMPLETE
 * ============================================================================
 */

import { Matrix } from './Matrix';
import { Vector } from './Vector';

const ENUM = 0x12340000;

export interface GLContextExtended extends WebGLRenderingContext {
  MODELVIEW: number;
  PROJECTION: number;
  HALF_FLOAT_OES: number;
  modelviewMatrix: Matrix;
  projectionMatrix: Matrix;
  matrixMode: (mode: number) => void;
  loadIdentity: () => void;
  loadMatrix: (m: Matrix) => void;
  multMatrix: (m: Matrix) => void;
  perspective: (fov: number, aspect: number, near: number, far: number) => void;
  frustum: (l: number, r: number, b: number, t: number, n: number, f: number) => void;
  ortho: (l: number, r: number, b: number, t: number, n: number, f: number) => void;
  scale: (x: number, y: number, z: number) => void;
  translate: (x: number, y: number, z: number) => void;
  rotate: (a: number, x: number, y: number, z: number) => void;
  lookAt: (ex: number, ey: number, ez: number, cx: number, cy: number, cz: number, ux: number, uy: number, uz: number) => void;
  pushMatrix: () => void;
  popMatrix: () => void;
  project: (objX: number, objY: number, objZ: number, modelview?: Matrix, projection?: Matrix, viewport?: number[]) => Vector;
  unProject: (winX: number, winY: number, winZ: number, modelview?: Matrix, projection?: Matrix, viewport?: number[]) => Vector;
}

export function createGLContext(canvas: HTMLCanvasElement, options: WebGLContextAttributes = {}): GLContextExtended | null {
  if (!('alpha' in options)) options.alpha = false;
  
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = canvas.getContext('webgl', options);
  } catch (e) {
    // Ignore
  }
  try {
    gl = gl || canvas.getContext('experimental-webgl', options) as WebGLRenderingContext;
  } catch (e) {
    // Ignore
  }
  
  if (!gl) return null;

  const glExt = gl as GLContextExtended;
  glExt.HALF_FLOAT_OES = 0x8d61;
  
  addMatrixStack(glExt);
  
  return glExt;
}

function addMatrixStack(gl: GLContextExtended) {
  gl.MODELVIEW = ENUM | 1;
  gl.PROJECTION = ENUM | 2;
  
  const tempMatrix = new Matrix();
  const resultMatrix = new Matrix();
  gl.modelviewMatrix = new Matrix();
  gl.projectionMatrix = new Matrix();
  const modelviewStack: number[][] = [];
  const projectionStack: number[][] = [];
  let matrix: 'modelviewMatrix' | 'projectionMatrix' = 'modelviewMatrix';
  let stack = modelviewStack;

  gl.matrixMode = function (mode: number) {
    switch (mode) {
      case gl.MODELVIEW:
        matrix = 'modelviewMatrix';
        stack = modelviewStack;
        break;
      case gl.PROJECTION:
        matrix = 'projectionMatrix';
        stack = projectionStack;
        break;
      default:
        throw new Error('invalid matrix mode ' + mode);
    }
  };

  gl.loadIdentity = function () {
    Matrix.identity(gl[matrix]);
  };

  gl.loadMatrix = function (m: Matrix) {
    const from = m.m;
    const to = gl[matrix].m;
    for (let i = 0; i < 16; i++) {
      to[i] = from[i];
    }
  };

  gl.multMatrix = function (m: Matrix) {
    gl.loadMatrix(Matrix.multiply(gl[matrix], m, resultMatrix));
  };

  gl.perspective = function (fov: number, aspect: number, near: number, far: number) {
    gl.multMatrix(Matrix.perspective(fov, aspect, near, far, tempMatrix));
  };

  gl.frustum = function (l: number, r: number, b: number, t: number, n: number, f: number) {
    gl.multMatrix(Matrix.frustum(l, r, b, t, n, f, tempMatrix));
  };

  gl.ortho = function (l: number, r: number, b: number, t: number, n: number, f: number) {
    gl.multMatrix(Matrix.ortho(l, r, b, t, n, f, tempMatrix));
  };

  gl.scale = function (x: number, y: number, z: number) {
    gl.multMatrix(Matrix.scale(x, y, z, tempMatrix));
  };

  gl.translate = function (x: number, y: number, z: number) {
    gl.multMatrix(Matrix.translate(x, y, z, tempMatrix));
  };

  gl.rotate = function (a: number, x: number, y: number, z: number) {
    gl.multMatrix(Matrix.rotate(a, x, y, z, tempMatrix));
  };

  gl.lookAt = function (ex: number, ey: number, ez: number, cx: number, cy: number, cz: number, ux: number, uy: number, uz: number) {
    gl.multMatrix(Matrix.lookAt(ex, ey, ez, cx, cy, cz, ux, uy, uz, tempMatrix));
  };

  gl.pushMatrix = function () {
    stack.push(Array.prototype.slice.call(gl[matrix].m));
  };

  gl.popMatrix = function () {
    const m = stack.pop();
    if (m) {
      gl[matrix].m = new Float32Array(m);
    }
  };

  gl.project = function (objX: number, objY: number, objZ: number, modelview?: Matrix, projection?: Matrix, viewport?: number[]): Vector {
    modelview = modelview || gl.modelviewMatrix;
    projection = projection || gl.projectionMatrix;
    viewport = viewport || (gl.getParameter(gl.VIEWPORT) as number[]);
    const point = projection.transformPoint(modelview.transformPoint(new Vector(objX, objY, objZ)));
    return new Vector(
      viewport[0] + viewport[2] * (point.x * 0.5 + 0.5),
      viewport[1] + viewport[3] * (point.y * 0.5 + 0.5),
      point.z * 0.5 + 0.5
    );
  };

  gl.unProject = function (winX: number, winY: number, winZ: number, modelview?: Matrix, projection?: Matrix, viewport?: number[]): Vector {
    modelview = modelview || gl.modelviewMatrix;
    projection = projection || gl.projectionMatrix;
    viewport = viewport || (gl.getParameter(gl.VIEWPORT) as number[]);
    const point = new Vector(
      ((winX - viewport[0]) / viewport[2]) * 2 - 1,
      ((winY - viewport[1]) / viewport[3]) * 2 - 1,
      winZ * 2 - 1
    );
    return Matrix.inverse(Matrix.multiply(projection, modelview, tempMatrix), resultMatrix).transformPoint(point);
  };

  gl.matrixMode(gl.MODELVIEW);
}

/**
 * ============================================================================
 * SECTION 3.4: Shader.ts - COMPLETE
 * ============================================================================
 */

import { GLContextExtended } from './GLContext';
import { Matrix } from './Matrix';
import { Vector } from './Vector';
import { Mesh } from './Mesh';

const LIGHTGL_PREFIX = 'LIGHTGL';

function regexMap(regex: RegExp, text: string, callback: (groups: RegExpExecArray) => void) {
  let result;
  while ((result = regex.exec(text)) !== null) {
    callback(result);
  }
}

function isArray(obj: unknown): obj is number[] | Float32Array {
  const str = Object.prototype.toString.call(obj);
  return str === '[object Array]' || str === '[object Float32Array]';
}

function isNumber(obj: unknown): obj is number | boolean {
  const str = Object.prototype.toString.call(obj);
  return str === '[object Number]' || str === '[object Boolean]';
}

export class Shader {
  gl: GLContextExtended;
  program: WebGLProgram;
  attributes: { [key: string]: number } = {};
  uniformLocations: { [key: string]: WebGLUniformLocation | null } = {};
  isSampler: { [key: string]: number } = {};
  usedMatrices: { [key: string]: string } = {};

  constructor(gl: GLContextExtended, vertexSource: string, fragmentSource: string) {
    this.gl = gl;

    const header = `
      uniform mat3 gl_NormalMatrix;
      uniform mat4 gl_ModelViewMatrix;
      uniform mat4 gl_ProjectionMatrix;
      uniform mat4 gl_ModelViewProjectionMatrix;
      uniform mat4 gl_ModelViewMatrixInverse;
      uniform mat4 gl_ProjectionMatrixInverse;
      uniform mat4 gl_ModelViewProjectionMatrixInverse;
    `;
    
    const vertexHeader = header + `
      attribute vec4 gl_Vertex;
      attribute vec4 gl_TexCoord;
      attribute vec3 gl_Normal;
      attribute vec4 gl_Color;
      vec4 ftransform() {
        return gl_ModelViewProjectionMatrix * gl_Vertex;
      }
    `;
    
    const fragmentHeader = `
      precision highp float;
    ` + header;

    const source = vertexSource + fragmentSource;
    const usedMatrices: { [key: string]: string } = {};
    regexMap(/\b(gl_[^;]*)\b;/g, header, (groups) => {
      const name = groups[1];
      if (source.indexOf(name) !== -1) {
        const capitalLetters = name.replace(/[a-z_]/g, '');
        usedMatrices[capitalLetters] = LIGHTGL_PREFIX + name;
      }
    });
    if (source.indexOf('ftransform') !== -1) {
      usedMatrices['MVPM'] = LIGHTGL_PREFIX + 'gl_ModelViewProjectionMatrix';
    }
    this.usedMatrices = usedMatrices;

    function fix(header: string, source: string): string {
      const replaced: { [key: string]: boolean } = {};
      const match = /^((\s*\/\/.*\n|\s*#extension.*\n)+)[^]*$/.exec(source);
      source = match ? match[1] + header + source.substr(match[1].length) : header + source;
      regexMap(/\bgl_\w+\b/g, header, (result) => {
        if (!(result[0] in replaced)) {
          source = source.replace(new RegExp('\\b' + result[0] + '\\b', 'g'), LIGHTGL_PREFIX + result[0]);
          replaced[result[0]] = true;
        }
      });
      return source;
    }

    vertexSource = fix(vertexHeader, vertexSource);
    fragmentSource = fix(fragmentHeader, fragmentSource);

    const compileSource = (type: number, source: string): WebGLShader => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error('Failed to create shader');
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error('compile error: ' + gl.getShaderInfoLog(shader));
      }
      return shader;
    };

    const program = gl.createProgram();
    if (!program) throw new Error('Failed to create program');
    
    this.program = program;
    gl.attachShader(program, compileSource(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compileSource(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error('link error: ' + gl.getProgramInfoLog(program));
    }

    const samplerRegex = /uniform\s+sampler(1D|2D|3D|Cube)\s+(\w+)\s*;/g;
    regexMap(samplerRegex, vertexSource + fragmentSource, (groups) => {
      this.isSampler[groups[2]] = 1;
    });
  }

  uniforms(uniforms: { [key: string]: unknown }): this {
    const gl = this.gl;
    gl.useProgram(this.program);

    for (const name in uniforms) {
      const location = this.uniformLocations[name] || gl.getUniformLocation(this.program, name);
      if (!location) continue;
      this.uniformLocations[name] = location;
      let value = uniforms[name];
      
      if (value instanceof Vector) {
        value = [value.x, value.y, value.z];
      } else if (value instanceof Matrix) {
        value = value.m;
      }
      
      if (isArray(value)) {
        switch (value.length) {
          case 1: gl.uniform1fv(location, new Float32Array(value as number[])); break;
          case 2: gl.uniform2fv(location, new Float32Array(value as number[])); break;
          case 3: gl.uniform3fv(location, new Float32Array(value as number[])); break;
          case 4: gl.uniform4fv(location, new Float32Array(value as number[])); break;
          case 9: gl.uniformMatrix3fv(location, false, new Float32Array([
            value[0], value[3], value[6],
            value[1], value[4], value[7],
            value[2], value[5], value[8]
          ])); break;
          case 16: gl.uniformMatrix4fv(location, false, new Float32Array([
            value[0], value[4], value[8], value[12],
            value[1], value[5], value[9], value[13],
            value[2], value[6], value[10], value[14],
            value[3], value[7], value[11], value[15]
          ])); break;
          default: throw new Error(`don't know how to load uniform "${name}" of length ${value.length}`);
        }
      } else if (isNumber(value)) {
        (this.isSampler[name] ? gl.uniform1i : gl.uniform1f).call(gl, location, value as number);
      } else {
        throw new Error(`attempted to set uniform "${name}" to invalid value ${value}`);
      }
    }

    return this;
  }

  draw(mesh: Mesh, mode?: number): this {
    return this.drawBuffers(
      mesh.vertexBuffers,
      mesh.indexBuffers[mode === this.gl.LINES ? 'lines' : 'triangles'],
      mode === undefined ? this.gl.TRIANGLES : mode
    );
  }

  drawBuffers(
    vertexBuffers: Mesh['vertexBuffers'],
    indexBuffer: { buffer: WebGLBuffer | null; length: number } | undefined,
    mode: number
  ): this {
    const gl = this.gl;
    const used = this.usedMatrices;
    const MVM = gl.modelviewMatrix;
    const PM = gl.projectionMatrix;
    const MVMI = (used['MVMI'] || used['NM']) ? MVM.inverse() : null;
    const PMI = used['PMI'] ? PM.inverse() : null;
    const MVPM = (used['MVPM'] || used['MVPMI']) ? PM.multiply(MVM) : null;
    
    const matrices: { [key: string]: Matrix | number[] } = {};
    if (used['MVM']) matrices[used['MVM']] = MVM;
    if (used['MVMI'] && MVMI) matrices[used['MVMI']] = MVMI;
    if (used['PM']) matrices[used['PM']] = PM;
    if (used['PMI'] && PMI) matrices[used['PMI']] = PMI;
    if (used['MVPM'] && MVPM) matrices[used['MVPM']] = MVPM;
    if (used['MVPMI'] && MVPM) matrices[used['MVPMI']] = MVPM.inverse();
    if (used['NM'] && MVMI) {
      const m = MVMI.m;
      matrices[used['NM']] = [m[0], m[4], m[8], m[1], m[5], m[9], m[2], m[6], m[10]];
    }
    this.uniforms(matrices);

    let length = 0;
    for (const attribute in vertexBuffers) {
      const buffer = vertexBuffers[attribute];
      const location = this.attributes[attribute] ??
        gl.getAttribLocation(this.program, attribute.replace(/^(gl_.*)$/, LIGHTGL_PREFIX + '$1'));
      if (location === -1 || !buffer.buffer) continue;
      this.attributes[attribute] = location;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, buffer.spacing, gl.FLOAT, false, 0, 0);
      length = buffer.length / buffer.spacing;
    }

    for (const attribute in this.attributes) {
      if (!(attribute in vertexBuffers)) {
        gl.disableVertexAttribArray(this.attributes[attribute]);
      }
    }

    if (length && (!indexBuffer || indexBuffer.buffer)) {
      if (indexBuffer) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer.buffer);
        gl.drawElements(mode, indexBuffer.length, gl.UNSIGNED_SHORT, 0);
      } else {
        gl.drawArrays(mode, 0, length);
      }
    }

    return this;
  }
}

/**
 * ============================================================================
 * SECTION 3.5: Mesh.ts - COMPLETE
 * ============================================================================
 */

import { GLContextExtended } from './GLContext';
import { Vector } from './Vector';

interface BufferInfo {
  buffer: WebGLBuffer | null;
  length: number;
  spacing: number;
  name: string;
}

interface IndexBufferInfo {
  buffer: WebGLBuffer | null;
  length: number;
}

export interface MeshOptions {
  coords?: boolean;
  normals?: boolean;
  colors?: boolean;
  triangles?: boolean;
  lines?: boolean;
  detail?: number;
  detailX?: number;
  detailY?: number;
}

export class Mesh {
  gl: GLContextExtended;
  vertexBuffers: { [key: string]: BufferInfo } = {};
  indexBuffers: { [key: string]: IndexBufferInfo } = {};
  vertices: number[][] = [];
  coords?: number[][];
  normals?: number[][];
  colors?: number[][];
  triangles?: number[][];
  lines?: number[][];

  constructor(gl: GLContextExtended, options: MeshOptions = {}) {
    this.gl = gl;
    this.addVertexBuffer('vertices', 'gl_Vertex');
    if (options.coords) this.addVertexBuffer('coords', 'gl_TexCoord');
    if (options.normals) this.addVertexBuffer('normals', 'gl_Normal');
    if (options.colors) this.addVertexBuffer('colors', 'gl_Color');
    if (!('triangles' in options) || options.triangles) this.addIndexBuffer('triangles');
    if (options.lines) this.addIndexBuffer('lines');
  }

  addVertexBuffer(name: string, attribute: string) {
    this.vertexBuffers[attribute] = {
      buffer: null,
      length: 0,
      spacing: 0,
      name
    };
    (this as Record<string, unknown>)[name] = [];
  }

  addIndexBuffer(name: string) {
    this.indexBuffers[name] = {
      buffer: null,
      length: 0
    };
    (this as Record<string, unknown>)[name] = [];
  }

  compile(type?: number) {
    const gl = this.gl;

    for (const attribute in this.vertexBuffers) {
      const bufferInfo = this.vertexBuffers[attribute];
      const data = (this as Record<string, unknown>)[bufferInfo.name] as number[][];
      
      if (!data || data.length === 0) continue;

      const flattened: number[] = [];
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (Array.isArray(item)) {
          flattened.push(...item);
        } else {
          flattened.push(item as number);
        }
      }

      const spacing = data.length ? flattened.length / data.length : 0;
      
      if (!bufferInfo.buffer) {
        bufferInfo.buffer = gl.createBuffer();
      }
      bufferInfo.length = flattened.length;
      bufferInfo.spacing = spacing;
      
      gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flattened), type || gl.STATIC_DRAW);
    }

    for (const name in this.indexBuffers) {
      const bufferInfo = this.indexBuffers[name];
      const data = (this as Record<string, unknown>)[name] as number[][];
      
      if (!data || data.length === 0) continue;

      const flattened: number[] = [];
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (Array.isArray(item)) {
          flattened.push(...item);
        } else {
          flattened.push(item as number);
        }
      }

      if (!bufferInfo.buffer) {
        bufferInfo.buffer = gl.createBuffer();
      }
      bufferInfo.length = flattened.length;
      
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferInfo.buffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flattened), type || gl.STATIC_DRAW);
    }
  }

  transform(matrix: { transformPoint: (v: Vector) => Vector; inverse: () => { transpose: () => { transformVector: (v: Vector) => Vector } } }) {
    this.vertices = this.vertices.map((v) => {
      return matrix.transformPoint(Vector.fromArray(v)).toArray();
    });
    if (this.normals) {
      const invTrans = matrix.inverse().transpose();
      this.normals = this.normals.map((n) => {
        return invTrans.transformVector(Vector.fromArray(n)).unit().toArray();
      });
    }
    this.compile();
    return this;
  }

  computeNormals() {
    if (!this.normals) this.addVertexBuffer('normals', 'gl_Normal');
    this.normals = [];
    for (let i = 0; i < this.vertices.length; i++) {
      this.normals[i] = [0, 0, 0];
    }
    if (this.triangles) {
      for (let i = 0; i < this.triangles.length; i++) {
        const t = this.triangles[i];
        const a = Vector.fromArray(this.vertices[t[0]]);
        const b = Vector.fromArray(this.vertices[t[1]]);
        const c = Vector.fromArray(this.vertices[t[2]]);
        const normal = b.subtract(a).cross(c.subtract(a)).unit();
        this.normals[t[0]] = Vector.fromArray(this.normals[t[0]]).add(normal).toArray();
        this.normals[t[1]] = Vector.fromArray(this.normals[t[1]]).add(normal).toArray();
        this.normals[t[2]] = Vector.fromArray(this.normals[t[2]]).add(normal).toArray();
      }
    }
    for (let i = 0; i < this.vertices.length; i++) {
      this.normals[i] = Vector.fromArray(this.normals[i]).unit().toArray();
    }
    this.compile();
    return this;
  }

  static plane(gl: GLContextExtended, options: MeshOptions = {}): Mesh {
    const mesh = new Mesh(gl, options);
    const detailX = options.detailX || options.detail || 1;
    const detailY = options.detailY || options.detail || 1;

    for (let y = 0; y <= detailY; y++) {
      const t = y / detailY;
      for (let x = 0; x <= detailX; x++) {
        const s = x / detailX;
        mesh.vertices.push([2 * s - 1, 2 * t - 1, 0]);
        if (mesh.coords) mesh.coords.push([s, t]);
        if (mesh.normals) mesh.normals.push([0, 0, 1]);
        if (x < detailX && y < detailY) {
          const i = x + y * (detailX + 1);
          if (mesh.triangles) {
            mesh.triangles.push([i, i + 1, i + detailX + 1]);
            mesh.triangles.push([i + detailX + 1, i + 1, i + detailX + 2]);
          }
        }
      }
    }

    mesh.compile();
    return mesh;
  }

  static cube(gl: GLContextExtended, options: MeshOptions = {}): Mesh {
    const mesh = new Mesh(gl, options);
    const cubeData = [
      [0, 4, 2, 6, -1, 0, 0], // -x
      [1, 3, 5, 7, +1, 0, 0], // +x
      [0, 1, 4, 5, 0, -1, 0], // -y
      [2, 6, 3, 7, 0, +1, 0], // +y
      [0, 2, 1, 3, 0, 0, -1], // -z
      [4, 5, 6, 7, 0, 0, +1]  // +z
    ];

    function pickOctant(i: number): Vector {
      return new Vector((i & 1) * 2 - 1, (i & 2) - 1, (i & 4) / 2 - 1);
    }

    for (let i = 0; i < cubeData.length; i++) {
      const data = cubeData[i];
      const v = i * 4;
      for (let j = 0; j < 4; j++) {
        const d = data[j];
        mesh.vertices.push(pickOctant(d).toArray());
        if (mesh.coords) mesh.coords.push([j & 1, (j & 2) / 2]);
        if (mesh.normals) mesh.normals.push(data.slice(4, 7));
      }
      if (mesh.triangles) {
        mesh.triangles.push([v, v + 1, v + 2]);
        mesh.triangles.push([v + 2, v + 1, v + 3]);
      }
    }

    mesh.compile();
    return mesh;
  }

  static sphere(gl: GLContextExtended, options: MeshOptions = {}): Mesh {
    const mesh = new Mesh(gl, options);
    const detail = options.detail || 6;

    function pickOctant(i: number): Vector {
      return new Vector((i & 1) * 2 - 1, (i & 2) - 1, (i & 4) / 2 - 1);
    }

    function fix(x: number): number {
      return x + (x - x * x) / 2;
    }

    interface VertexData {
      vertex: number[];
      coord?: number[];
    }

    const unique: VertexData[] = [];
    const map: { [key: string]: number } = {};

    function addVertex(obj: VertexData): number {
      const key = JSON.stringify(obj);
      if (!(key in map)) {
        map[key] = unique.length;
        unique.push(obj);
      }
      return map[key];
    }

    for (let octant = 0; octant < 8; octant++) {
      const scale = pickOctant(octant);
      const flip = scale.x * scale.y * scale.z > 0;
      const data: number[] = [];

      for (let i = 0; i <= detail; i++) {
        for (let j = 0; i + j <= detail; j++) {
          const a = i / detail;
          const b = j / detail;
          const c = (detail - i - j) / detail;
          const vertexData: VertexData = {
            vertex: new Vector(fix(a), fix(b), fix(c)).unit().multiply(scale).toArray()
          };
          if (mesh.coords) {
            vertexData.coord = scale.y > 0 ? [1 - a, c] : [c, 1 - a];
          }
          data.push(addVertex(vertexData));
        }

        if (i > 0) {
          for (let j = 0; i + j <= detail; j++) {
            const a = (i - 1) * (detail + 1) + ((i - 1) - (i - 1) * (i - 1)) / 2 + j;
            const b = i * (detail + 1) + (i - i * i) / 2 + j;
            const tri = flip ? [data[a], data[b], data[a + 1]] : [data[a], data[a + 1], data[b]];
            if (mesh.triangles) mesh.triangles.push(tri);
            if (i + j < detail) {
              const tri2 = flip ? [data[b], data[b + 1], data[a + 1]] : [data[b], data[a + 1], data[b + 1]];
              if (mesh.triangles) mesh.triangles.push(tri2);
            }
          }
        }
      }
    }

    mesh.vertices = unique.map((v) => v.vertex);
    if (mesh.coords) mesh.coords = unique.map((v) => v.coord!);
    if (mesh.normals) mesh.normals = mesh.vertices;

    mesh.compile();
    return mesh;
  }
}

/**
 * ============================================================================
 * SECTION 3.6: Texture.ts - COMPLETE
 * ============================================================================
 */

import { GLContextExtended } from './GLContext';

export interface TextureOptions {
  format?: number;
  type?: number;
  filter?: number;
  magFilter?: number;
  minFilter?: number;
  wrap?: number;
  wrapS?: number;
  wrapT?: number;
}

let framebuffer: WebGLFramebuffer | null = null;
let renderbuffer: WebGLRenderbuffer | null = null;

export class Texture {
  gl: GLContextExtended;
  id: WebGLTexture;
  width: number;
  height: number;
  format: number;
  type: number;

  constructor(gl: GLContextExtended, width: number, height: number, options: TextureOptions = {}) {
    this.gl = gl;
    this.width = width;
    this.height = height;
    this.format = options.format || gl.RGBA;
    this.type = options.type || gl.UNSIGNED_BYTE;

    const magFilter = options.filter || options.magFilter || gl.LINEAR;
    const minFilter = options.filter || options.minFilter || gl.LINEAR;

    if (this.type === gl.FLOAT) {
      if (!Texture.canUseFloatingPointTextures(gl)) {
        throw new Error('OES_texture_float is required but not supported');
      }
      if ((minFilter !== gl.NEAREST || magFilter !== gl.NEAREST) &&
          !Texture.canUseFloatingPointLinearFiltering(gl)) {
        throw new Error('OES_texture_float_linear is required but not supported');
      }
    } else if (this.type === gl.HALF_FLOAT_OES) {
      if (!Texture.canUseHalfFloatingPointTextures(gl)) {
        throw new Error('OES_texture_half_float is required but not supported');
      }
      if ((minFilter !== gl.NEAREST || magFilter !== gl.NEAREST) &&
          !Texture.canUseHalfFloatingPointLinearFiltering(gl)) {
        throw new Error('OES_texture_half_float_linear is required but not supported');
      }
    }

    const texture = gl.createTexture();
    if (!texture) throw new Error('Failed to create texture');
    this.id = texture;

    gl.bindTexture(gl.TEXTURE_2D, this.id);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, options.wrap || options.wrapS || gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, options.wrap || options.wrapT || gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, this.format, width, height, 0, this.format, this.type, null);
  }

  bind(unit = 0) {
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.id);
  }

  unbind(unit = 0) {
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
  }

  canDrawTo(): boolean {
    const gl = this.gl;
    framebuffer = framebuffer || gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.id, 0);
    const result = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return result;
  }

  drawTo(callback: () => void) {
    const gl = this.gl;
    const v = gl.getParameter(gl.VIEWPORT);

    framebuffer = framebuffer || gl.createFramebuffer();
    renderbuffer = renderbuffer || gl.createRenderbuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);

    if (this.width !== (renderbuffer as unknown as { width?: number }).width ||
        this.height !== (renderbuffer as unknown as { height?: number }).height) {
      (renderbuffer as unknown as { width: number }).width = this.width;
      (renderbuffer as unknown as { height: number }).height = this.height;
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
    }

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.id, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
    gl.viewport(0, 0, this.width, this.height);

    callback();

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.viewport(v[0], v[1], v[2], v[3]);
  }

  swapWith(other: Texture) {
    let temp: WebGLTexture;
    temp = other.id; other.id = this.id; this.id = temp;
    
    let tempNum: number;
    tempNum = other.width; other.width = this.width; this.width = tempNum;
    tempNum = other.height; other.height = this.height; this.height = tempNum;
  }

  static fromImage(gl: GLContextExtended, image: HTMLImageElement | HTMLCanvasElement, options: TextureOptions = {}): Texture {
    const texture = new Texture(gl, image.width, image.height, options);
    gl.texImage2D(gl.TEXTURE_2D, 0, texture.format, texture.format, texture.type, image);
    if (options.minFilter && options.minFilter !== gl.NEAREST && options.minFilter !== gl.LINEAR) {
      gl.generateMipmap(gl.TEXTURE_2D);
    }
    return texture;
  }

  static canUseFloatingPointTextures(gl: GLContextExtended): boolean {
    return !!gl.getExtension('OES_texture_float');
  }

  static canUseFloatingPointLinearFiltering(gl: GLContextExtended): boolean {
    return !!gl.getExtension('OES_texture_float_linear');
  }

  static canUseHalfFloatingPointTextures(gl: GLContextExtended): boolean {
    return !!gl.getExtension('OES_texture_half_float');
  }

  static canUseHalfFloatingPointLinearFiltering(gl: GLContextExtended): boolean {
    return !!gl.getExtension('OES_texture_half_float_linear');
  }
}

/**
 * ============================================================================
 * SECTION 3.7: Cubemap.ts - COMPLETE
 * ============================================================================
 */

import { GLContextExtended } from './GLContext';

export interface CubemapImages {
  xneg: HTMLImageElement | HTMLCanvasElement;
  xpos: HTMLImageElement | HTMLCanvasElement;
  yneg: HTMLImageElement | HTMLCanvasElement;
  ypos: HTMLImageElement | HTMLCanvasElement;
  zneg: HTMLImageElement | HTMLCanvasElement;
  zpos: HTMLImageElement | HTMLCanvasElement;
}

export class Cubemap {
  gl: GLContextExtended;
  id: WebGLTexture;

  constructor(gl: GLContextExtended, images: CubemapImages) {
    this.gl = gl;
    
    const texture = gl.createTexture();
    if (!texture) throw new Error('Failed to create cubemap texture');
    this.id = texture;

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.id);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images.xneg);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images.xpos);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images.yneg);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images.ypos);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images.zneg);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images.zpos);
  }

  bind(unit = 0) {
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.id);
  }

  unbind(unit = 0) {
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, null);
  }
}

/**
 * ============================================================================
 * SECTION 3.8: Raytracer.ts - COMPLETE
 * ============================================================================
 */

import { GLContextExtended } from './GLContext';
import { Vector } from './Vector';

export class HitTest {
  t: number;
  hit: Vector | undefined;
  normal: Vector | undefined;

  constructor(t?: number, hit?: Vector, normal?: Vector) {
    this.t = t !== undefined ? t : Number.MAX_VALUE;
    this.hit = hit;
    this.normal = normal;
  }

  mergeWith(other: HitTest) {
    if (other.t > 0 && other.t < this.t) {
      this.t = other.t;
      this.hit = other.hit;
      this.normal = other.normal;
    }
  }
}

export class Raytracer {
  eye: Vector;
  ray00: Vector;
  ray10: Vector;
  ray01: Vector;
  ray11: Vector;
  viewport: number[];

  constructor(gl: GLContextExtended) {
    const v = gl.getParameter(gl.VIEWPORT) as number[];
    const m = gl.modelviewMatrix.m;

    const axisX = new Vector(m[0], m[4], m[8]);
    const axisY = new Vector(m[1], m[5], m[9]);
    const axisZ = new Vector(m[2], m[6], m[10]);
    const offset = new Vector(m[3], m[7], m[11]);
    this.eye = new Vector(-offset.dot(axisX), -offset.dot(axisY), -offset.dot(axisZ));

    const minX = v[0];
    const maxX = minX + v[2];
    const minY = v[1];
    const maxY = minY + v[3];
    this.ray00 = gl.unProject(minX, minY, 1).subtract(this.eye);
    this.ray10 = gl.unProject(maxX, minY, 1).subtract(this.eye);
    this.ray01 = gl.unProject(minX, maxY, 1).subtract(this.eye);
    this.ray11 = gl.unProject(maxX, maxY, 1).subtract(this.eye);
    this.viewport = v;
  }

  getRayForPixel(x: number, y: number): Vector {
    x = (x - this.viewport[0]) / this.viewport[2];
    y = 1 - (y - this.viewport[1]) / this.viewport[3];
    const ray0 = Vector.lerp(this.ray00, this.ray10, x);
    const ray1 = Vector.lerp(this.ray01, this.ray11, x);
    return Vector.lerp(ray0, ray1, y).unit();
  }

  static hitTestBox(origin: Vector, ray: Vector, min: Vector, max: Vector): HitTest | null {
    const tMin = min.subtract(origin).divide(ray);
    const tMax = max.subtract(origin).divide(ray);
    const t1 = Vector.min(tMin, tMax);
    const t2 = Vector.max(tMin, tMax);
    const tNear = t1.max();
    const tFar = t2.min();

    if (tNear > 0 && tNear < tFar) {
      const epsilon = 1.0e-6;
      const hit = origin.add(ray.multiply(tNear));
      const minE = min.add(epsilon);
      const maxE = max.subtract(epsilon);
      return new HitTest(tNear, hit, new Vector(
        Number(hit.x > maxE.x) - Number(hit.x < minE.x),
        Number(hit.y > maxE.y) - Number(hit.y < minE.y),
        Number(hit.z > maxE.z) - Number(hit.z < minE.z)
      ));
    }

    return null;
  }

  static hitTestSphere(origin: Vector, ray: Vector, center: Vector, radius: number): HitTest | null {
    const offset = origin.subtract(center);
    const a = ray.dot(ray);
    const b = 2 * ray.dot(offset);
    const c = offset.dot(offset) - radius * radius;
    const discriminant = b * b - 4 * a * c;

    if (discriminant > 0) {
      const t = (-b - Math.sqrt(discriminant)) / (2 * a);
      const hit = origin.add(ray.multiply(t));
      return new HitTest(t, hit, hit.subtract(center).divide(radius));
    }

    return null;
  }

  static hitTestTriangle(origin: Vector, ray: Vector, a: Vector, b: Vector, c: Vector): HitTest | null {
    const ab = b.subtract(a);
    const ac = c.subtract(a);
    const normal = ab.cross(ac).unit();
    const t = normal.dot(a.subtract(origin)) / normal.dot(ray);

    if (t > 0) {
      const hit = origin.add(ray.multiply(t));
      const toHit = hit.subtract(a);
      const dot00 = ac.dot(ac);
      const dot01 = ac.dot(ab);
      const dot02 = ac.dot(toHit);
      const dot11 = ab.dot(ab);
      const dot12 = ab.dot(toHit);
      const divide = dot00 * dot11 - dot01 * dot01;
      const u = (dot11 * dot02 - dot01 * dot12) / divide;
      const v = (dot00 * dot12 - dot01 * dot02) / divide;
      if (u >= 0 && v >= 0 && u + v <= 1) {
        return new HitTest(t, hit, normal);
      }
    }

    return null;
  }
}

/**
 * ============================================================================
 * SECTION 3.9: Water.ts - COMPLETE
 * ============================================================================
 */

import { GLContextExtended } from './GLContext';
import { Mesh } from './Mesh';
import { Shader } from './Shader';
import { Texture } from './Texture';
import { Vector } from './Vector';

export class Water {
  gl: GLContextExtended;
  plane: Mesh;
  textureA: Texture;
  textureB: Texture;
  dropShader: Shader;
  updateShader: Shader;
  normalShader: Shader;
  sphereShader: Shader;

  constructor(gl: GLContextExtended) {
    this.gl = gl;

    const vertexShader = `
      varying vec2 coord;
      void main() {
        coord = gl_Vertex.xy * 0.5 + 0.5;
        gl_Position = vec4(gl_Vertex.xyz, 1.0);
      }
    `;

    this.plane = Mesh.plane(gl);

    if (!Texture.canUseFloatingPointTextures(gl)) {
      throw new Error('This demo requires the OES_texture_float extension');
    }

    let filter = Texture.canUseFloatingPointLinearFiltering(gl) ? gl.LINEAR : gl.NEAREST;
    this.textureA = new Texture(gl, 256, 256, { type: gl.FLOAT, filter });
    this.textureB = new Texture(gl, 256, 256, { type: gl.FLOAT, filter });

    if ((!this.textureA.canDrawTo() || !this.textureB.canDrawTo()) && Texture.canUseHalfFloatingPointTextures(gl)) {
      filter = Texture.canUseHalfFloatingPointLinearFiltering(gl) ? gl.LINEAR : gl.NEAREST;
      this.textureA = new Texture(gl, 256, 256, { type: gl.HALF_FLOAT_OES, filter });
      this.textureB = new Texture(gl, 256, 256, { type: gl.HALF_FLOAT_OES, filter });
    }

    this.dropShader = new Shader(gl, vertexShader, `
      const float PI = 3.141592653589793;
      uniform sampler2D texture;
      uniform vec2 center;
      uniform float radius;
      uniform float strength;
      varying vec2 coord;
      void main() {
        vec4 info = texture2D(texture, coord);
        float drop = max(0.0, 1.0 - length(center * 0.5 + 0.5 - coord) / radius);
        drop = 0.5 - cos(drop * PI) * 0.5;
        info.r += drop * strength;
        gl_FragColor = info;
      }
    `);

    this.updateShader = new Shader(gl, vertexShader, `
      uniform sampler2D texture;
      uniform vec2 delta;
      varying vec2 coord;
      void main() {
        vec4 info = texture2D(texture, coord);
        vec2 dx = vec2(delta.x, 0.0);
        vec2 dy = vec2(0.0, delta.y);
        float average = (
          texture2D(texture, coord - dx).r +
          texture2D(texture, coord - dy).r +
          texture2D(texture, coord + dx).r +
          texture2D(texture, coord + dy).r
        ) * 0.25;
        info.g += (average - info.r) * 2.0;
        info.g *= 0.995;
        info.r += info.g;
        gl_FragColor = info;
      }
    `);

    this.normalShader = new Shader(gl, vertexShader, `
      uniform sampler2D texture;
      uniform vec2 delta;
      varying vec2 coord;
      void main() {
        vec4 info = texture2D(texture, coord);
        vec3 dx = vec3(delta.x, texture2D(texture, vec2(coord.x + delta.x, coord.y)).r - info.r, 0.0);
        vec3 dy = vec3(0.0, texture2D(texture, vec2(coord.x, coord.y + delta.y)).r - info.r, delta.y);
        info.ba = normalize(cross(dy, dx)).xz;
        gl_FragColor = info;
      }
    `);

    this.sphereShader = new Shader(gl, vertexShader, `
      uniform sampler2D texture;
      uniform vec3 oldCenter;
      uniform vec3 newCenter;
      uniform float radius;
      varying vec2 coord;
      
      float volumeInSphere(vec3 center) {
        vec3 toCenter = vec3(coord.x * 2.0 - 1.0, 0.0, coord.y * 2.0 - 1.0) - center;
        float t = length(toCenter) / radius;
        float dy = exp(-pow(t * 1.5, 6.0));
        float ymin = min(0.0, center.y - dy);
        float ymax = min(max(0.0, center.y + dy), ymin + 2.0 * dy);
        return (ymax - ymin) * 0.1;
      }
      
      void main() {
        vec4 info = texture2D(texture, coord);
        info.r += volumeInSphere(oldCenter);
        info.r -= volumeInSphere(newCenter);
        gl_FragColor = info;
      }
    `);
  }

  addDrop(x: number, y: number, radius: number, strength: number) {
    const self = this;
    this.textureB.drawTo(() => {
      self.textureA.bind();
      self.dropShader.uniforms({
        center: [x, y],
        radius,
        strength
      }).draw(self.plane);
    });
    this.textureB.swapWith(this.textureA);
  }

  moveSphere(oldCenter: Vector, newCenter: Vector, radius: number) {
    const self = this;
    this.textureB.drawTo(() => {
      self.textureA.bind();
      self.sphereShader.uniforms({
        oldCenter,
        newCenter,
        radius
      }).draw(self.plane);
    });
    this.textureB.swapWith(this.textureA);
  }

  stepSimulation() {
    const self = this;
    this.textureB.drawTo(() => {
      self.textureA.bind();
      self.updateShader.uniforms({
        delta: [1 / self.textureA.width, 1 / self.textureA.height]
      }).draw(self.plane);
    });
    this.textureB.swapWith(this.textureA);
  }

  updateNormals() {
    const self = this;
    this.textureB.drawTo(() => {
      self.textureA.bind();
      self.normalShader.uniforms({
        delta: [1 / self.textureA.width, 1 / self.textureA.height]
      }).draw(self.plane);
    });
    this.textureB.swapWith(this.textureA);
  }

  reset() {
    const vertexShader = `
      varying vec2 coord;
      void main() {
        coord = gl_Vertex.xy * 0.5 + 0.5;
        gl_Position = vec4(gl_Vertex.xyz, 1.0);
      }
    `;
    const clearShader = new Shader(this.gl, vertexShader, `
      varying vec2 coord;
      void main() {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0); // r=height, g=velocity, ba=normals
      }
    `);

    this.textureB.drawTo(() => {
      clearShader.draw(this.plane);
    });
    this.textureB.swapWith(this.textureA);
    this.textureB.drawTo(() => {
      clearShader.draw(this.plane);
    });
    this.textureB.swapWith(this.textureA);

    this.updateNormals();
  }
}

/**
 * ============================================================================
 * SECTION 3.10: Renderer.ts - COMPLETE
 * ============================================================================
 * 
 * NOTE: Renderer.ts is the most complex file with caustics implementation.
 * The complete code is included below with all shader code inline.
 */

import { GLContextExtended } from './GLContext';
import { Cubemap } from './Cubemap';
import { Mesh } from './Mesh';
import { Raytracer } from './Raytracer';
import { Shader } from './Shader';
import { Texture } from './Texture';
import { Vector } from './Vector';
import { Water } from './Water';

const helperFunctions = `
  const float IOR_AIR = 1.0;
  const float IOR_WATER = 1.333;
  const vec3 abovewaterColor = vec3(0.25, 1.0, 1.25);
  const vec3 underwaterColor = vec3(0.4, 0.9, 1.0);
  const float poolHeight = 1.0;
  uniform vec3 light;
  uniform vec3 sphereCenter;
  uniform float sphereRadius;
  uniform sampler2D tiles;
  uniform sampler2D causticTex;
  uniform sampler2D water;
  
  vec2 intersectCube(vec3 origin, vec3 ray, vec3 cubeMin, vec3 cubeMax) {
    vec3 tMin = (cubeMin - origin) / ray;
    vec3 tMax = (cubeMax - origin) / ray;
    vec3 t1 = min(tMin, tMax);
    vec3 t2 = max(tMin, tMax);
    float tNear = max(max(t1.x, t1.y), t1.z);
    float tFar = min(min(t2.x, t2.y), t2.z);
    return vec2(tNear, tFar);
  }
  
  float intersectSphere(vec3 origin, vec3 ray, vec3 sphereCenter, float sphereRadius) {
    vec3 toSphere = origin - sphereCenter;
    float a = dot(ray, ray);
    float b = 2.0 * dot(toSphere, ray);
    float c = dot(toSphere, toSphere) - sphereRadius * sphereRadius;
    float discriminant = b*b - 4.0*a*c;
    if (discriminant > 0.0) {
      float t = (-b - sqrt(discriminant)) / (2.0 * a);
      if (t > 0.0) return t;
    }
    return 1.0e6;
  }
  
  vec3 getSphereColor(vec3 point) {
    vec3 color = vec3(0.5);
    
    color *= 1.0 - 0.9 / pow((1.0 + sphereRadius - abs(point.x)) / sphereRadius, 3.0);
    color *= 1.0 - 0.9 / pow((1.0 + sphereRadius - abs(point.z)) / sphereRadius, 3.0);
    color *= 1.0 - 0.9 / pow((point.y + 1.0 + sphereRadius) / sphereRadius, 3.0);
    
    vec3 sphereNormal = (point - sphereCenter) / sphereRadius;
    vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    float diffuse = max(0.0, dot(-refractedLight, sphereNormal)) * 0.5;
    vec4 info = texture2D(water, point.xz * 0.5 + 0.5);
    if (point.y < info.r) {
      vec4 caustic = texture2D(causticTex, 0.75 * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5);
      diffuse *= caustic.r * 4.0;
    }
    color += diffuse;
    
    return color;
  }
  
  vec3 getWallColor(vec3 point) {
    float scale = 0.5;
    
    vec3 wallColor;
    vec3 normal;
    if (abs(point.x) > 0.999) {
      wallColor = texture2D(tiles, point.yz * 0.5 + vec2(1.0, 0.5)).rgb;
      normal = vec3(-point.x, 0.0, 0.0);
    } else if (abs(point.z) > 0.999) {
      wallColor = texture2D(tiles, point.yx * 0.5 + vec2(1.0, 0.5)).rgb;
      normal = vec3(0.0, 0.0, -point.z);
    } else {
      wallColor = texture2D(tiles, point.xz * 0.5 + 0.5).rgb;
      normal = vec3(0.0, 1.0, 0.0);
    }
    
    scale /= length(point);
    scale *= 1.0 - 0.9 / pow(length(point - sphereCenter) / sphereRadius, 4.0);
    
    vec3 refractedLight = -refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    float diffuse = max(0.0, dot(refractedLight, normal));
    vec4 info = texture2D(water, point.xz * 0.5 + 0.5);
    if (point.y < info.r) {
      vec4 caustic = texture2D(causticTex, 0.75 * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5);
      scale += diffuse * caustic.r * 2.0 * caustic.g;
    } else {
      vec2 t = intersectCube(point, refractedLight, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
      diffuse *= 1.0 / (1.0 + exp(-200.0 / (1.0 + 10.0 * (t.y - t.x)) * (point.y + refractedLight.y * t.y - 2.0 / 12.0)));
      scale += diffuse * 0.5;
    }
    
    return wallColor * scale;
  }
`;

export class Renderer {
  gl: GLContextExtended;
  tileTexture: Texture;
  lightDir: Vector;
  causticTex: Texture;
  waterMesh: Mesh;
  waterShaders: Shader[];
  sphereCenter: Vector;
  sphereRadius: number;
  sphereMesh: Mesh;
  sphereShader: Shader;
  cubeMesh: Mesh;
  cubeShader: Shader;
  causticsShader: Shader;

  constructor(gl: GLContextExtended, tileCanvas: HTMLCanvasElement) {
    this.gl = gl;
    
    this.tileTexture = Texture.fromImage(gl, tileCanvas, {
      minFilter: gl.LINEAR_MIPMAP_LINEAR,
      wrap: gl.REPEAT,
      format: gl.RGB
    });
    
    this.lightDir = new Vector(2.0, 2.0, -1.0).unit();
    this.causticTex = new Texture(gl, 1024, 1024);
    this.waterMesh = Mesh.plane(gl, { detail: 200 });
    this.waterShaders = [];
    this.sphereCenter = new Vector();
    this.sphereRadius = 0;

    // Create water shaders for above and below water views
    for (let i = 0; i < 2; i++) {
      const underwaterCode = i ? `
        normal = -normal;
        vec3 reflectedRay = reflect(incomingRay, normal);
        vec3 refractedRay = refract(incomingRay, normal, IOR_WATER / IOR_AIR);
        float fresnel = mix(0.5, 1.0, pow(1.0 - dot(normal, -incomingRay), 3.0));
        
        vec3 reflectedColor = getSurfaceRayColor(position, reflectedRay, underwaterColor);
        vec3 refractedColor = getSurfaceRayColor(position, refractedRay, vec3(1.0)) * vec3(0.8, 1.0, 1.1);
        
        gl_FragColor = vec4(mix(reflectedColor, refractedColor, (1.0 - fresnel) * length(refractedRay)), 1.0);
      ` : `
        vec3 reflectedRay = reflect(incomingRay, normal);
        vec3 refractedRay = refract(incomingRay, normal, IOR_AIR / IOR_WATER);
        float fresnel = mix(0.25, 1.0, pow(1.0 - dot(normal, -incomingRay), 3.0));
        
        vec3 reflectedColor = getSurfaceRayColor(position, reflectedRay, abovewaterColor);
        vec3 refractedColor = getSurfaceRayColor(position, refractedRay, abovewaterColor);
        
        gl_FragColor = vec4(mix(refractedColor, reflectedColor, fresnel), 1.0);
      `;

      this.waterShaders[i] = new Shader(gl, `
        uniform sampler2D water;
        varying vec3 position;
        void main() {
          vec4 info = texture2D(water, gl_Vertex.xy * 0.5 + 0.5);
          position = gl_Vertex.xzy;
          position.y += info.r;
          gl_Position = gl_ModelViewProjectionMatrix * vec4(position, 1.0);
        }
      `, helperFunctions + `
        uniform vec3 eye;
        varying vec3 position;
        uniform samplerCube sky;
        
        vec3 getSurfaceRayColor(vec3 origin, vec3 ray, vec3 waterColor) {
          vec3 color;
          float q = intersectSphere(origin, ray, sphereCenter, sphereRadius);
          if (q < 1.0e6) {
            color = getSphereColor(origin + ray * q);
          } else if (ray.y < 0.0) {
            vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
            color = getWallColor(origin + ray * t.y);
          } else {
            vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
            vec3 hit = origin + ray * t.y;
            if (hit.y < 2.0 / 12.0) {
              color = getWallColor(hit);
            } else {
              color = textureCube(sky, ray).rgb;
              color += vec3(pow(max(0.0, dot(light, ray)), 5000.0)) * vec3(10.0, 8.0, 6.0);
            }
          }
          if (ray.y < 0.0) color *= waterColor;
          return color;
        }
        
        void main() {
          vec2 coord = position.xz * 0.5 + 0.5;
          vec4 info = texture2D(water, coord);
          
          for (int i = 0; i < 5; i++) {
            coord += info.ba * 0.005;
            info = texture2D(water, coord);
          }
          
          vec3 normal = vec3(info.b, sqrt(1.0 - dot(info.ba, info.ba)), info.a);
          vec3 incomingRay = normalize(position - eye);
          
          ${underwaterCode}
        }
      `);
    }

    // Sphere shader and mesh
    this.sphereMesh = Mesh.sphere(gl, { detail: 10 });
    this.sphereShader = new Shader(gl, `
      uniform vec3 sphereCenter;
      uniform float sphereRadius;
      varying vec3 position;
      void main() {
        position = sphereCenter + gl_Vertex.xyz * sphereRadius;
        gl_Position = gl_ModelViewProjectionMatrix * vec4(position, 1.0);
      }
    `, helperFunctions + `
      varying vec3 position;
      void main() {
        gl_FragColor = vec4(getSphereColor(position), 1.0);
      }
    `);

    // Cube shader and mesh
    this.cubeMesh = Mesh.cube(gl);
    if (this.cubeMesh.triangles && this.cubeMesh.triangles.length >= 6) {
      this.cubeMesh.triangles.splice(4, 2);
    }
    this.cubeMesh.compile();

    this.cubeShader = new Shader(gl, `
      const float poolHeight = 1.0;
      varying vec3 position;
      void main() {
        position = gl_Vertex.xyz;
        position.y = ((1.0 - gl_Vertex.y) * (7.0 / 12.0) - 1.0) * poolHeight;
        gl_Position = gl_ModelViewProjectionMatrix * vec4(position, 1.0);
      }
    `, helperFunctions + `
      varying vec3 position;
      void main() {
        gl_FragColor = vec4(getWallColor(position), 1.0);
        vec4 info = texture2D(water, position.xz * 0.5 + 0.5);
        if (position.y < info.r) {
          gl_FragColor.rgb *= underwaterColor * 1.2;
        }
      }
    `);

    // Caustics shader - CRITICAL FOR PORTING
    const hasDerivatives = !!gl.getExtension('OES_standard_derivatives');
    this.causticsShader = new Shader(gl, helperFunctions + `
      varying vec3 oldPos;
      varying vec3 newPos;
      varying vec3 ray;
      
      vec3 project(vec3 origin, vec3 ray, vec3 refractedLight) {
        vec2 tcube = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
        origin += ray * tcube.y;
        float tplane = (-origin.y - 1.0) / refractedLight.y;
        return origin + refractedLight * tplane;
      }
      
      void main() {
        vec4 info = texture2D(water, gl_Vertex.xy * 0.5 + 0.5);
        info.ba *= 0.5;
        vec3 normal = vec3(info.b, sqrt(1.0 - dot(info.ba, info.ba)), info.a);
        
        vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
        ray = refract(-light, normal, IOR_AIR / IOR_WATER);
        oldPos = project(gl_Vertex.xzy, refractedLight, refractedLight);
        newPos = project(gl_Vertex.xzy + vec3(0.0, info.r, 0.0), ray, refractedLight);
        
        gl_Position = vec4(0.75 * (newPos.xz + refractedLight.xz / refractedLight.y), 0.0, 1.0);
      }
    `, (hasDerivatives ? '#extension GL_OES_standard_derivatives : enable\n' : '') + helperFunctions + `
      varying vec3 oldPos;
      varying vec3 newPos;
      varying vec3 ray;
      
      void main() {
        ${hasDerivatives ? `
          float oldArea = length(dFdx(oldPos)) * length(dFdy(oldPos));
          float newArea = length(dFdx(newPos)) * length(dFdy(newPos));
          gl_FragColor = vec4(oldArea / newArea * 0.2, 1.0, 0.0, 0.0);
        ` : `
          gl_FragColor = vec4(0.2, 0.2, 0.0, 0.0);
        `}
        
        vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
        
        vec3 dir = (sphereCenter - newPos) / sphereRadius;
        vec3 area = cross(dir, refractedLight);
        float shadow = dot(area, area);
        float dist = dot(dir, -refractedLight);
        shadow = 1.0 + (shadow - 1.0) / (0.05 + dist * 0.025);
        shadow = clamp(1.0 / (1.0 + exp(-shadow)), 0.0, 1.0);
        shadow = mix(1.0, shadow, clamp(dist * 2.0, 0.0, 1.0));
        gl_FragColor.g = shadow;
        
        vec2 t = intersectCube(newPos, -refractedLight, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
        gl_FragColor.r *= 1.0 / (1.0 + exp(-200.0 / (1.0 + 10.0 * (t.y - t.x)) * (newPos.y - refractedLight.y * t.y - 2.0 / 12.0)));
      }
    `);
  }

  updateCaustics(water: Water) {
    if (!this.causticsShader) return;
    const self = this;
    this.causticTex.drawTo(() => {
      self.gl.clear(self.gl.COLOR_BUFFER_BIT);
      water.textureA.bind(0);
      self.causticsShader.uniforms({
        light: self.lightDir,
        water: 0,
        sphereCenter: self.sphereCenter,
        sphereRadius: self.sphereRadius
      }).draw(self.waterMesh);
    });
  }

  renderWater(water: Water, sky: Cubemap) {
    const gl = this.gl;
    const tracer = new Raytracer(gl);
    water.textureA.bind(0);
    this.tileTexture.bind(1);
    sky.bind(2);
    this.causticTex.bind(3);
    gl.enable(gl.CULL_FACE);
    
    for (let i = 0; i < 2; i++) {
      gl.cullFace(i ? gl.BACK : gl.FRONT);
      this.waterShaders[i].uniforms({
        light: this.lightDir,
        water: 0,
        tiles: 1,
        sky: 2,
        causticTex: 3,
        eye: tracer.eye,
        sphereCenter: this.sphereCenter,
        sphereRadius: this.sphereRadius
      }).draw(this.waterMesh);
    }
    gl.disable(gl.CULL_FACE);
  }

  renderSphere(water: Water) {
    water.textureA.bind(0);
    this.causticTex.bind(1);
    this.sphereShader.uniforms({
      light: this.lightDir,
      water: 0,
      causticTex: 1,
      sphereCenter: this.sphereCenter,
      sphereRadius: this.sphereRadius
    }).draw(this.sphereMesh);
  }

  renderCube(water: Water) {
    const gl = this.gl;
    gl.enable(gl.CULL_FACE);
    water.textureA.bind(0);
    this.tileTexture.bind(1);
    this.causticTex.bind(2);
    this.cubeShader.uniforms({
      light: this.lightDir,
      water: 0,
      tiles: 1,
      causticTex: 2,
      sphereCenter: this.sphereCenter,
      sphereRadius: this.sphereRadius
    }).draw(this.cubeMesh);
    gl.disable(gl.CULL_FACE);
  }
}

/**
 * ============================================================================
 * SECTION 3.11: TextureGenerators.ts - COMPLETE
 * ============================================================================
 */

export function createTileTexture(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#e8f4f8';
  ctx.fillRect(0, 0, 256, 256);

  const tileSize = 32;
  ctx.strokeStyle = '#b8d4e8';
  ctx.lineWidth = 2;

  for (let y = 0; y < 256; y += tileSize) {
    for (let x = 0; x < 256; x += tileSize) {
      ctx.strokeRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
    }
  }

  const imageData = ctx.getImageData(0, 0, 256, 256);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 10;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  return canvas;
}

export function createSkyboxTextures(): {
  xneg: HTMLCanvasElement;
  xpos: HTMLCanvasElement;
  yneg: HTMLCanvasElement;
  ypos: HTMLCanvasElement;
  zneg: HTMLCanvasElement;
  zpos: HTMLCanvasElement;
} {
  const size = 512;
  
  function createFace(topColor: string, bottomColor: string, addClouds = false): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(1, bottomColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    if (addClouds) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      for (let i = 0; i < 5; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size * 0.5;
        const w = 50 + Math.random() * 100;
        const h = 20 + Math.random() * 40;
        ctx.beginPath();
        ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    return canvas;
  }

  const skyTop = '#1e3a5f';
  const skyBottom = '#5b8bb5';
  const groundTop = '#5b8bb5';
  const groundBottom = '#7aa5c4';

  return {
    xpos: createFace(skyTop, skyBottom, true),
    xneg: createFace(skyTop, skyBottom, true),
    ypos: createFace('#0d1f33', '#1e3a5f'),
    yneg: createFace(groundTop, groundBottom),
    zpos: createFace(skyTop, skyBottom, true),
    zneg: createFace(skyTop, skyBottom, true)
  };
}

/**
 * ============================================================================
 * PORTING TO R3F PLAN
 * ============================================================================
 * 
 * Phase 1: Core Infrastructure
 * - Convert Vector/Matrix to Three.js equivalents
 * - Replace GLContext with Three.js WebGLRenderer
 * - Convert Shader to Three.js ShaderMaterial
 * - Convert Mesh to Three.js BufferGeometry
 * - Convert Texture to Three.js Texture/WebGLRenderTarget
 * 
 * Phase 2: Water Simulation
 * - Port Water.ts to use Three.js render targets
 * - Maintain ping-pong buffer pattern
 * - Preserve floating-point texture support
 * 
 * Phase 3: Rendering
 * - Port Renderer.ts to Three.js scene graph
 * - Convert caustics shader to Three.js ShaderMaterial
 * - Preserve OES_standard_derivatives extension usage
 * - Convert cubemap to Three.js CubeTexture
 * 
 * Phase 4: React Integration
 * - Convert useWebGLWater to R3F hooks (useFrame, useThree)
 * - Convert LovableWavesEngine to R3F component
 * - Integrate with unified water showcase
 * 
 * Phase 5: Testing & Validation
 * - Verify caustics work correctly
 * - Test performance
 * - Compare with original
 * 
 * ============================================================================
 * CRITICAL CAUSTICS PRESERVATION
 * ============================================================================
 * 
 * The caustics implementation is CRITICAL and must be preserved exactly:
 * 
 * 1. Uses OES_standard_derivatives extension for dFdx/dFdy
 * 2. Calculates area change from oldPos to newPos
 * 3. Uses refracted light rays through water surface
 * 4. Projects caustics onto pool bottom and walls
 * 5. Accounts for sphere shadows
 * 
 * Key Shader Code (from Renderer.ts):
 * 
 * ```glsl
 * #extension GL_OES_standard_derivatives : enable
 * 
 * varying vec3 oldPos;
 * varying vec3 newPos;
 * 
 * void main() {
 *   float oldArea = length(dFdx(oldPos)) * length(dFdy(oldPos));
 *   float newArea = length(dFdx(newPos)) * length(dFdy(newPos));
 *   gl_FragColor = vec4(oldArea / newArea * 0.2, 1.0, 0.0, 0.0);
 * }
 * ```
 * 
 * This MUST be ported correctly to Three.js ShaderMaterial with:
 * - Proper extension declaration
 * - Correct varying declarations
 * - Exact same calculation logic
 * 
 * ============================================================================
 * END OF MONOLITH
 * ============================================================================
 */
