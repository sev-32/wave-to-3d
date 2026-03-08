import { useCallback, useRef } from 'react';

const FALLBACK_MAX_PARTICLES = 4096;
const MAX_AGE = 2.4;

export interface FallbackParticlesAPI {
  particleData: Float32Array;
  maxParticles: number;
  getActiveParticles: () => number;
  emitImpact: (x: number, z: number, impactSpeed: number) => void;
  step: (dt: number) => void;
  reset: () => void;
}

export function useFallbackParticles(): FallbackParticlesAPI {
  const particleDataRef = useRef(new Float32Array(FALLBACK_MAX_PARTICLES * 8));
  const scratchRef = useRef(new Float32Array(FALLBACK_MAX_PARTICLES * 8));
  const activeCountRef = useRef(0);

  const reset = useCallback(() => {
    particleDataRef.current.fill(0);
    scratchRef.current.fill(0);
    activeCountRef.current = 0;
  }, []);

  const emitImpact = useCallback((x: number, z: number, impactSpeed: number) => {
    const data = particleDataRef.current;
    let count = activeCountRef.current;

    const emitCount = Math.max(140, Math.min(520, Math.floor(impactSpeed * 160)));
    const upwardBase = Math.min(3.2, 0.8 + impactSpeed * 0.4);
    const radialBase = Math.min(2.4, 0.5 + impactSpeed * 0.22);

    for (let i = 0; i < emitCount && count < FALLBACK_MAX_PARTICLES; i++) {
      const b = count * 8;
      const t = i / Math.max(1, emitCount - 1);
      const angle = Math.random() * Math.PI * 2;
      const ring = 0.015 + Math.sqrt(Math.random()) * 0.09;

      const dirX = Math.cos(angle);
      const dirZ = Math.sin(angle);

      const burst = 0.5 + Math.random() * 0.7;
      const radialVel = radialBase * burst * (0.55 + t * 0.65);
      const lift = upwardBase * (0.45 + Math.random() * 0.75) * (1.0 - t * 0.35);

      data[b] = x + dirX * ring;
      data[b + 1] = 0.01 + Math.random() * 0.02;
      data[b + 2] = z + dirZ * ring;
      data[b + 3] = 0.45 + Math.random() * 0.55; // mass
      data[b + 4] = dirX * radialVel + (Math.random() - 0.5) * 0.25;
      data[b + 5] = lift;
      data[b + 6] = dirZ * radialVel + (Math.random() - 0.5) * 0.25;
      data[b + 7] = 0.0; // age
      count++;
    }

    activeCountRef.current = count;
  }, []);

  const step = useCallback((dt: number) => {
    if (dt <= 0) return;

    const src = particleDataRef.current;
    const dst = scratchRef.current;
    const active = activeCountRef.current;

    let write = 0;

    for (let i = 0; i < active; i++) {
      const s = i * 8;

      let px = src[s];
      let py = src[s + 1];
      let pz = src[s + 2];
      const mass = src[s + 3];
      let vx = src[s + 4];
      let vy = src[s + 5];
      let vz = src[s + 6];
      let age = src[s + 7] + dt;

      if (mass <= 0 || age > MAX_AGE) continue;

      const submerged = py < 0.0;
      const gravity = 9.8;
      const buoyancy = submerged ? 5.5 : 0.0;
      vy -= (gravity - buoyancy) * dt;

      const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
      const drag = submerged ? 0.18 : 0.025;
      if (speed > 0.0001) {
        const decel = Math.min((drag * speed * speed * dt) / speed, 0.45);
        vx *= 1 - decel;
        vy *= 1 - decel;
        vz *= 1 - decel;
      }

      px += vx * dt;
      py += vy * dt;
      pz += vz * dt;

      if (Math.abs(px) > 1.0) {
        px = Math.sign(px);
        vx = -vx * 0.28;
      }
      if (Math.abs(pz) > 1.0) {
        pz = Math.sign(pz);
        vz = -vz * 0.28;
      }

      if (py < -1.0) {
        py = -1.0;
        vy = Math.abs(vy) * 0.18;
        vx *= 0.7;
        vz *= 0.7;
      }

      const nearSurface = Math.abs(py) < 0.015;
      if (nearSurface && speed < 0.1 && age > 0.45) continue;

      const d = write * 8;
      dst[d] = px;
      dst[d + 1] = Math.min(py, 2.0);
      dst[d + 2] = pz;
      dst[d + 3] = mass;
      dst[d + 4] = vx;
      dst[d + 5] = vy;
      dst[d + 6] = vz;
      dst[d + 7] = age;
      write++;
    }

    src.fill(0);
    src.set(dst.subarray(0, write * 8));
    activeCountRef.current = write;
  }, []);

  const getActiveParticles = useCallback(() => activeCountRef.current, []);

  return {
    particleData: particleDataRef.current,
    maxParticles: FALLBACK_MAX_PARTICLES,
    getActiveParticles,
    emitImpact,
    step,
    reset,
  };
}
