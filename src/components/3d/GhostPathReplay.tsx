import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PatientRecord } from '../../types';
import { sampleGhostPath, samplePlaybackPose } from './scenarioPlayback';

interface GhostPathReplayProps {
  patient: PatientRecord;
  timeRef: React.MutableRefObject<number>;
  enabled?: boolean;
  critical?: boolean;
}

export const GhostPathReplay: React.FC<GhostPathReplayProps> = ({
  patient,
  timeRef,
  enabled = true,
  critical = false,
}) => {
  const headRef = useRef<THREE.Mesh>(null);
  const sampleCount = 56;

  const line = useMemo(() => {
    const positions = new Float32Array(sampleCount * 3);
    const colors = new Float32Array(sampleCount * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setDrawRange(0, 2);
    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
    });
    return new THREE.Line(geometry, material);
  }, []);

  useEffect(() => {
    return () => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    };
  }, [line]);

  useFrame(() => {
    if (!enabled) return;
    const time = timeRef.current;
    const points = sampleGhostPath(patient, time, sampleCount - 1);
    const position = line.geometry.getAttribute('position') as THREE.BufferAttribute;
    const color = line.geometry.getAttribute('color') as THREE.BufferAttribute;
    const head = samplePlaybackPose(patient, time).position;
    const tint = critical ? new THREE.Color('#ef4444') : new THREE.Color('#67e8f9');
    const fade = new THREE.Color('#312e81');

    const count = Math.min(points.length, sampleCount);
    for (let i = 0; i < count; i += 1) {
      const point = points[i];
      position.setXYZ(i, point.x, 0.04, point.z);
      const mix = i / Math.max(count - 1, 1);
      const shade = fade.clone().lerp(tint, 0.25 + mix * 0.75);
      color.setXYZ(i, shade.r, shade.g, shade.b);
    }
    position.needsUpdate = true;
    color.needsUpdate = true;
    line.geometry.setDrawRange(0, count);

    if (headRef.current) {
      headRef.current.position.set(head.x, 0.045, head.z);
    }
  });

  if (!enabled) return null;

  return (
    <group>
      <primitive object={line} />
      <mesh ref={headRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.09, 0.14, 28]} />
        <meshBasicMaterial
          color={critical ? '#ef4444' : '#22d3ee'}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};
