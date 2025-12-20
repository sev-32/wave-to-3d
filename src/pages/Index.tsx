import { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { WaterScene } from '@/components/water';
import { Button } from '@/components/ui/button';
import { Droplets, RotateCcw, Info } from 'lucide-react';

function LoadingScreen() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <Droplets className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
      </div>
      <p className="mt-6 text-muted-foreground font-medium">Initializing water simulation...</p>
    </div>
  );
}

function InfoPanel() {
  return (
    <div className="absolute top-4 left-4 p-4 rounded-lg bg-card/80 backdrop-blur-sm border border-border max-w-xs">
      <div className="flex items-center gap-2 mb-2">
        <Info className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground">Lovable Waves</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Interactive 3D water with real-time caustics. 
        <strong> Click water</strong> to add ripples. <strong>Drag sphere</strong> to move it. 
        <strong>Orbit camera</strong> to view from any angle including underwater.
      </p>
    </div>
  );
}

function Controls({ onReset }: { onReset: () => void }) {
  return (
    <div className="absolute bottom-4 right-4 flex gap-2">
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

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [resetKey, setResetKey] = useState(0);

  const handleReady = () => {
    setIsLoading(false);
  };

  const handleReset = () => {
    setResetKey(prev => prev + 1);
    setIsLoading(true);
  };

  return (
    <div className="relative w-full h-full bg-background overflow-hidden">
      {/* WebGL Canvas */}
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
          <WaterScene onReady={handleReady} />
        </Suspense>
      </Canvas>

      {/* UI Overlays */}
      {isLoading && <LoadingScreen />}
      
      {!isLoading && (
        <>
          <InfoPanel />
          <Controls onReset={handleReset} />
        </>
      )}
      
      {/* Gradient overlay for depth */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/40 to-transparent" />
    </div>
  );
};

export default Index;
