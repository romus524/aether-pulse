import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PatientRecord } from '../../types';
import { getScenarioForPatient, samplePlaybackPose } from './scenarioPlayback';

interface EventPulseFieldProps {
  patient: PatientRecord;
  timeRef: React.MutableRefObject<number>;
}

export const EventPulseField: React.FC<EventPulseFieldProps> = ({ patient, timeRef }) => {
  const groupRef = useRef<THREE.Group>(null);
  const scenario = useMemo(() => getScenarioForPatient(patient), [patient.roomNumber]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const time = timeRef.current;
    groupRef.current.children.forEach((child, index) => {
      const keyframe = scenario.keyframes[index];
      if (!keyframe) return;
      const mesh = child as THREE.Mesh;
      const visible = time + 0.08 >= keyframe.time;
      mesh.visible = visible;
      if (!visible) return;
      const age = Math.max(time - keyframe.time, 0);
      const pulse = 1 + Math.sin(clock.getElapsedTime() * 3.2 + index) * 0.08;
      const scale = (keyframe.type === 'impact' || keyframe.type === 'critical' ? 1.15 : 0.85) + Math.min(age, 1.4) * 0.18;
      mesh.scale.setScalar(scale * pulse);
      const material = mesh.material as THREE.MeshBasicMaterial;
      const active = Math.abs(time - keyframe.time) < 0.55;
      material.opacity = active ? 0.55 : 0.18;
    });
  });

  return (
    <group ref={groupRef}>
      {scenario.keyframes.map((keyframe) => {
        const pose = samplePlaybackPose(patient, keyframe.time);
        const color =
          keyframe.type === 'impact' || keyframe.type === 'critical'
            ? '#ef4444'
            : keyframe.type === 'warning'
              ? '#f59e0b'
              : '#38bdf8';
        return (
          <mesh
            key={`${keyframe.time}-${keyframe.label}`}
            position={[pose.position.x, 0.03, pose.position.z]}
            rotation={[-Math.PI / 2, 0, 0]}
            visible={false}
          >
            <ringGeometry args={[0.16, 0.22, 32]} />
            <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
};
