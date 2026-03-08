import { useState, useRef, Suspense, useCallback, useEffect, forwardRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { WaterScene } from '@/components/water';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Droplets, RotateCcw, Layers, Cpu, Zap, Lock, Camera, Play, Pause, ArrowDown } from 'lucide-react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

type SimPhase = 'ready' | 'dropping' | 'splashing' | 'frozen' | 'free';

function LoadingScreen() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <Droplets className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
      </div>
      <p className="mt-6 text-muted-foreground font-medium">Initializing WebGPU water simulation...</p>
    </div>
  );
}

function DropPrompt({ onClick }: { onClick: () => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <button
        onClick={onClick}
        className="pointer-events-auto flex flex-col items-center gap-3 px-8 py-6 rounded-2xl bg-card/90 backdrop-blur-md border border-border shadow-2xl hover:scale-105 transition-transform cursor-pointer group"
      >
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <ArrowDown className="w-7 h-7 text-primary animate-bounce" />
        </div>
        <span className="text-lg font-semibold text-foreground">Drop the Sphere</span>
        <span className="text-sm text-muted-foreground">Click to release — splash will auto-capture</span>
      </button>
    </div>
  );
}

const FrozenOverlay = forwardRef<HTMLDivElement, {
  onResume: () => void;
  onReset: () => void;
  onCapture: () => void;
  capturedImage: string | null;
}>(({ onResume, onReset, onCapture, capturedImage }, ref) => {
  return (
    <div ref={ref} className="absolute inset-0 z-20">
      {/* Frozen border indicator */}
      <div className="absolute inset-0 pointer-events-none border-4 border-primary/60 rounded-sm" />
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-primary/90 text-primary-foreground text-sm font-semibold shadow-lg">
        <Pause className="w-4 h-4" />
        FROZEN — Splash Captured
      </div>
      
      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
        <Button onClick={onResume} size="lg" className="gap-2 shadow-lg">
          <Play className="w-5 h-5" />
          Resume
        </Button>
        <Button onClick={onCapture} variant="secondary" size="lg" className="gap-2 shadow-lg">
          <Camera className="w-5 h-5" />
          Save Screenshot
        </Button>
        <Button onClick={onReset} variant="outline" size="lg" className="gap-2 shadow-lg">
          <RotateCcw className="w-5 h-5" />
          Reset & Retry
        </Button>
      </div>

      {/* Captured image thumbnail */}
      {capturedImage && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 p-1 rounded-lg bg-card/80 backdrop-blur border border-border shadow-xl">
          <img src={capturedImage} alt="Captured splash" className="w-64 h-auto rounded" />
          <a href={capturedImage} download="splash-capture.png" className="absolute top-2 right-2 p-1 rounded bg-background/80 hover:bg-background text-xs text-foreground">
            ↓ Save
          </a>
        </div>
      )}
    </div>
  );
});

function InfoPanel({ isWebGPU, phase }: { isWebGPU: boolean | null; phase: SimPhase }) {
  return (
    <div className="absolute top-4 left-4 p-4 rounded-lg bg-card/80 backdrop-blur-sm border border-border max-w-xs">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground">Hybrid Water System</h3>
      </div>
      <div className="flex items-center gap-1.5 mb-2">
        <div className={`w-2 h-2 rounded-full ${isWebGPU ? 'bg-green-400' : 'bg-yellow-400'}`} />
        <span className="text-xs text-muted-foreground">
          {isWebGPU === null ? 'Initializing...' : isWebGPU ? 'WebGPU Compute Active' : 'WebGL Fallback'}
        </span>
      </div>
      <div className="flex items-center gap-1.5 mb-2">
        <div className={`w-2 h-2 rounded-full ${
          phase === 'ready' ? 'bg-blue-400' : 
          phase === 'dropping' ? 'bg-yellow-400 animate-pulse' :
          phase === 'splashing' ? 'bg-orange-400 animate-pulse' :
          phase === 'frozen' ? 'bg-red-400' : 'bg-green-400'
        }`} />
        <span className="text-xs text-muted-foreground capitalize">{phase}</span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {phase === 'ready' && 'Click the button to drop the sphere into the water.'}
        {phase === 'dropping' && 'Sphere falling...'}
        {phase === 'splashing' && 'Impact! Capturing splash...'}
        {phase === 'frozen' && 'Frame frozen for inspection. Resume or reset.'}
        {phase === 'free' && 'Free mode — click water for ripples, drag sphere to move.'}
      </p>
    </div>
  );
}

const Controls = forwardRef<HTMLDivElement, { 
  onReset: () => void;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  isWebGPU: boolean | null;
  cameraLocked: boolean;
  onToggleCameraLock: () => void;
  paused: boolean;
  onTogglePause: () => void;
}>(({ onReset, showHeatmap, onToggleHeatmap, isWebGPU, cameraLocked, onToggleCameraLock, paused, onTogglePause }, ref) => {
  return (
    <div ref={ref} className="absolute bottom-4 right-4 flex flex-col gap-2 items-end">
      <div className="flex items-center gap-2 p-2 rounded-lg bg-card/80 backdrop-blur-sm border border-border">
        <Lock className="w-3.5 h-3.5 text-muted-foreground" />
        <Label htmlFor="camera-lock" className="text-xs text-muted-foreground cursor-pointer">Lock Camera</Label>
        <Switch id="camera-lock" checked={cameraLocked} onCheckedChange={onToggleCameraLock} />
      </div>
      <div className="flex gap-2">
        <Button
          variant={paused ? "default" : "secondary"}
          size="sm"
          onClick={onTogglePause}
          className="gap-2"
        >
          {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          {paused ? 'Play' : 'Pause'}
        </Button>
        {isWebGPU && (
          <Button
            variant={showHeatmap ? "default" : "secondary"}
            size="sm"
            onClick={onToggleHeatmap}
            className="gap-2"
          >
            <Layers className="w-4 h-4" />
            {showHeatmap ? 'Hide Fields' : 'Show Fields'}
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={onReset}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
      </div>
    </div>
  );
});

const FieldLegend = forwardRef<HTMLDivElement, { visible: boolean }>(({ visible }, ref) => {
  if (!visible) return null;
  return (
    <div ref={ref} className="absolute top-4 right-4 p-3 rounded-lg bg-card/80 backdrop-blur-sm border border-border">
      <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
        <Cpu className="w-3 h-3" />
        Surface Intent Fields
      </h4>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-muted-foreground">R — Rupture Potential</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-400" />
          <span className="text-muted-foreground">C — Coherence</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <span className="text-muted-foreground">M — Reservoir Mass</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: 'linear-gradient(90deg, #ff0000, #00ff00, #0000ff)' }} />
          <span className="text-muted-foreground">U — Momentum Polarity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-300 animate-pulse" />
          <span className="text-muted-foreground">Emit Zones → Particles</span>
        </div>
      </div>
    </div>
  );
});

// Component to capture canvas screenshots
function CanvasCapture({ onCapture }: { onCapture: (dataUrl: string) => void }) {
  const { gl } = useThree();
  
  useEffect(() => {
    // Expose capture function
    (window as any).__captureCanvas = () => {
      gl.domElement.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          onCapture(url);
        }
      });
    };
    return () => { delete (window as any).__captureCanvas; };
  }, [gl, onCapture]);
  
  return null;
}

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isWebGPU, setIsWebGPU] = useState<boolean | null>(null);
  const [cameraLocked, setCameraLocked] = useState(false);
  const [sphereDragging, setSphereDragging] = useState(false);
  const [phase, setPhase] = useState<SimPhase>('ready');
  const [paused, setPaused] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const impactTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const orbitEnabled = !cameraLocked && !sphereDragging && phase !== 'frozen';

  // Sphere starts above water in 'ready' mode
  const sphereStartY = phase === 'ready' ? 1.5 : undefined;
  const sphereHeld = phase === 'ready';

  const handleDrop = useCallback(() => {
    setPhase('dropping');
  }, []);

  const handleImpact = useCallback(() => {
    if (phase !== 'dropping') return;
    setPhase('splashing');
    
    // Auto-freeze shortly after impact to capture crown onset
    impactTimerRef.current = setTimeout(() => {
      setPaused(true);
      setPhase('frozen');
      // Auto-capture screenshot
      setTimeout(() => {
        if ((window as any).__captureCanvas) {
          (window as any).__captureCanvas();
        }
      }, 40);
    }, 120);
  }, [phase]);

  const handleResume = useCallback(() => {
    setPaused(false);
    setPhase('free');
    setCapturedImage(null);
  }, []);

  const handleReset = useCallback(() => {
    if (impactTimerRef.current) clearTimeout(impactTimerRef.current);
    setCapturedImage(null);
    setPaused(false);
    setPhase('ready');
    setResetKey(p => p + 1);
    setIsLoading(true);
  }, []);

  const handleManualCapture = useCallback(() => {
    if ((window as any).__captureCanvas) {
      (window as any).__captureCanvas();
    }
  }, []);

  const handleCaptured = useCallback((dataUrl: string) => {
    setCapturedImage(dataUrl);
  }, []);

  const handleTogglePause = useCallback(() => {
    if (paused) {
      setPaused(false);
      if (phase === 'frozen') setPhase('free');
    } else {
      setPaused(true);
    }
  }, [paused, phase]);

  return (
    <div className="relative w-full h-full bg-background overflow-hidden">
      <Canvas
        key={resetKey}
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: true, // Needed for screenshot capture
        }}
        className="w-full h-full"
      >
        <PerspectiveCamera
          makeDefault
          position={[0, 2, 4]}
          fov={45}
          near={0.1}
          far={1000}
        />
        
        <OrbitControls
          ref={controlsRef}
          enabled={orbitEnabled}
          enablePan={false}
          minDistance={1.5}
          maxDistance={15}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
          target={[0, -0.3, 0]}
          enableDamping
          dampingFactor={0.05}
        />
        
        <ambientLight intensity={0.4} />
        <directionalLight position={[2, 2, -1]} intensity={1} />
        
        <Suspense fallback={null}>
          <WaterScene 
            onReady={() => setIsLoading(false)} 
            showHeatmap={showHeatmap}
            onWebGPUStatus={setIsWebGPU}
            onSphereDragChange={setSphereDragging}
            paused={paused}
            sphereStartY={sphereStartY}
            sphereHeld={sphereHeld}
            onSphereImpact={handleImpact}
          />
          <CanvasCapture onCapture={handleCaptured} />
        </Suspense>
      </Canvas>

      {isLoading && <LoadingScreen />}
      
      {!isLoading && phase === 'ready' && <DropPrompt onClick={handleDrop} />}
      
      {!isLoading && phase === 'frozen' && (
        <FrozenOverlay 
          onResume={handleResume}
          onReset={handleReset}
          onCapture={handleManualCapture}
          capturedImage={capturedImage}
        />
      )}
      
      {!isLoading && phase !== 'frozen' && (
        <>
          <InfoPanel isWebGPU={isWebGPU} phase={phase} />
          <FieldLegend visible={showHeatmap && !!isWebGPU} />
          <Controls 
            onReset={handleReset}
            showHeatmap={showHeatmap}
            onToggleHeatmap={() => setShowHeatmap(p => !p)}
            isWebGPU={isWebGPU}
            cameraLocked={cameraLocked}
            onToggleCameraLock={() => setCameraLocked(p => !p)}
            paused={paused}
            onTogglePause={handleTogglePause}
          />
        </>
      )}
      
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/40 to-transparent" />
    </div>
  );
};

export default Index;
