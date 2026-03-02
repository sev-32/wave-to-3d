import { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { WaterScene } from '@/components/water';
import { Button } from '@/components/ui/button';
import { Droplets, RotateCcw, Layers, Cpu, Zap } from 'lucide-react';

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

function InfoPanel({ isWebGPU }: { isWebGPU: boolean | null }) {
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
      <p className="text-sm text-muted-foreground leading-relaxed">
        <strong>Click water</strong> for ripples. <strong>Drag sphere</strong> to move it.
        <strong> Toggle heatmap</strong> to see surface intent fields (R, U, C, M).
      </p>
    </div>
  );
}

function Controls({ onReset, showHeatmap, onToggleHeatmap, isWebGPU }: { 
  onReset: () => void;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  isWebGPU: boolean | null;
}) {
  return (
    <div className="absolute bottom-4 right-4 flex gap-2">
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
  );
}

function FieldLegend({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="absolute top-4 right-4 p-3 rounded-lg bg-card/80 backdrop-blur-sm border border-border">
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
}

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isWebGPU, setIsWebGPU] = useState<boolean | null>(null);

  return (
    <div className="relative w-full h-full bg-background overflow-hidden">
      <Canvas
        key={resetKey}
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
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
          />
        </Suspense>
      </Canvas>

      {isLoading && <LoadingScreen />}
      
      {!isLoading && (
        <>
          <InfoPanel isWebGPU={isWebGPU} />
          <FieldLegend visible={showHeatmap && !!isWebGPU} />
          <Controls 
            onReset={() => { setResetKey(p => p + 1); setIsLoading(true); }}
            showHeatmap={showHeatmap}
            onToggleHeatmap={() => setShowHeatmap(p => !p)}
            isWebGPU={isWebGPU}
          />
        </>
      )}
      
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/40 to-transparent" />
    </div>
  );
};

export default Index;
