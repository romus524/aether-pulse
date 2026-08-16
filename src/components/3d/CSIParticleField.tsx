import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CSISpatialState } from './CSIAdapter';

interface CSIParticleFieldProps {
  csiState: CSISpatialState;
  enabled?: boolean;
  quality?: 'high' | 'balanced' | 'performance';
}

export const CSIParticleField: React.FC<CSIParticleFieldProps> = ({
  csiState,
  enabled = true,
  quality = 'high',
}) => {
  const pointsRef = useRef<THREE.Points>(null);

  const count = quality === 'high' ? 380 : quality === 'balanced' ? 220 : 120;

  // Precompute particle initial positions, velocities, and offsets
  const { initialPositions, speeds, offsets } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const off = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Distributed within room volume [-2.0 to 2.0]
      pos[i * 3] = (Math.random() - 0.5) * 4.2;
      pos[i * 3 + 1] = Math.random() * 2.2 + 0.05;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4.2;

      spd[i] = 0.2 + Math.random() * 0.4;
      off[i] = Math.random() * Math.PI * 2;
    }

    return { initialPositions: pos, speeds: spd, offsets: off };
  }, [count]);

  const particleColor = useMemo(() => {
    return csiState.isCritical ? '#ef4444' : '#38bdf8';
  }, [csiState.isCritical]);

  useFrame(({ clock }) => {
    if (!enabled || !pointsRef.current) return;
    const t = clock.getElapsedTime();
    const posAttr = pointsRef.current.geometry.attributes.position;
    const patientPos = new THREE.Vector3(
      csiState.coordinates.x,
      csiState.coordinates.y + 0.3,
      csiState.coordinates.z
    );

    for (let i = 0; i < count; i++) {
      let px = posAttr.getX(i);
      let py = posAttr.getY(i);
      let pz = posAttr.getZ(i);

      // Natural RF drift towards sensing nodes
      py += Math.sin(t * speeds[i] + offsets[i]) * 0.003;
      px += Math.cos(t * speeds[i] * 0.5 + offsets[i]) * 0.002;
      pz += Math.sin(t * speeds[i] * 0.5 + offsets[i]) * 0.002;

      // Wrap-around within room bounds
      if (py > 2.3) py = 0.05;
      if (py < 0.05) py = 2.3;
      if (px > 2.1) px = -2.1;
      if (px < -2.1) px = 2.1;
      if (pz > 2.1) pz = -2.1;
      if (pz < -2.1) pz = 2.1;

      // CSI Perturbation around patient body
      const pVec = new THREE.Vector3(px, py, pz);
      const dist = pVec.distanceTo(patientPos);
      if (dist < 0.85) {
        // Push particles outward along normal vector
        const pushDir = pVec.clone().sub(patientPos).normalize();
        const deflection = (0.85 - dist) * 0.04;
        px += pushDir.x * deflection;
        py += pushDir.y * deflection * 0.5;
        pz += pushDir.z * deflection;
      }

      posAttr.setXYZ(i, px, py, pz);
    }

    posAttr.needsUpdate = true;
  });

  if (!enabled) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[initialPositions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={quality === 'high' ? 0.045 : 0.06}
        color={particleColor}
        transparent
        opacity={csiState.isCritical ? 0.65 : 0.45}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
