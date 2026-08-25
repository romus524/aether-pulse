import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { PatientRecord } from '../../types';
import { getPlaybackSpatialState } from './scenarioPlayback';
import { TwinMotionFilter } from './twinMotion';

interface DigitalTwinHumanProps {
  patient: PatientRecord;
  simulationTimeRef: React.MutableRefObject<number>;
  seekVersion?: number;
  showDebugSkeleton?: boolean;
  quality?: 'high' | 'balanced' | 'performance';
}

const MODEL_URL = '/models/csi-digital-twin.glb';
const TARGET_HEIGHT = 1.72;
const PELVIS_Y = 0.92;
const TRAIL_LENGTH = 14;

export const DigitalTwinHuman: React.FC<DigitalTwinHumanProps> = ({
  patient,
  simulationTimeRef,
  seekVersion = 0,
  showDebugSkeleton = false,
  quality = 'high',
}) => {
  const { scene } = useGLTF(MODEL_URL);
  const rootRef = useRef<THREE.Group>(null);
  const meshPivotRef = useRef<THREE.Group>(null);
  const breathRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Group>(null);
  const filterRef = useRef(new TwinMotionFilter());
  const trailCursor = useRef(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    filterRef.current.reset(getPlaybackSpatialState(patient, simulationTimeRef.current));
  }, [patient.id, seekVersion, simulationTimeRef]);

  const statusColor = useMemo(() => {
    if (patient.status === 'critical') return '#ef4444';
    if (patient.status === 'warning') return '#f59e0b';
    if (patient.status === 'responding') return '#38bdf8';
    return '#10b981';
  }, [patient.status]);

  const { twin, hologram, scale } = useMemo(() => {
    const cloned = scene.clone(true);
    const bounds = new THREE.Box3().setFromObject(cloned);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const nextScale = TARGET_HEIGHT / Math.max(size.y, 0.001);

    cloned.position.set(-center.x, -bounds.min.y, -center.z);
    cloned.scale.setScalar(1);

    const skin = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#c99470'),
      roughness: 0.44,
      metalness: 0.02,
      sheen: 0.55,
      sheenRoughness: 0.32,
      sheenColor: new THREE.Color('#f3d2b5'),
      clearcoat: 0.12,
      clearcoatRoughness: 0.5,
      envMapIntensity: 0.85,
      emissive: new THREE.Color('#3b2418'),
      emissiveIntensity: 0.045,
    });

    cloned.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.material = skin;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = true;
    });

    const hologramMesh = cloned.clone(true);
    const holoMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#38bdf8'),
      wireframe: true,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    });
    hologramMesh.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.material = holoMaterial;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
    });

    return { twin: cloned, hologram: hologramMesh, scale: nextScale };
  }, [scene]);

  useFrame((_, delta) => {
    const time = simulationTimeRef.current;
    if (Math.abs(time - lastTimeRef.current) > 0.45) {
      filterRef.current.reset(getPlaybackSpatialState(patient, time));
    }
    lastTimeRef.current = time;

    const state = getPlaybackSpatialState(patient, time);
    const filter = filterRef.current;
    filter.update(state, delta);

    if (rootRef.current) {
      rootRef.current.position.copy(filter.position);
      rootRef.current.quaternion.copy(filter.quaternion);
    }

    if (meshPivotRef.current) {
      const gait =
        state.posture === 'walking'
          ? Math.abs(Math.sin(time * 7.2 * Math.max(state.gaitSpeed, 0.35))) * 0.028
          : 0;
      const sway =
        state.posture === 'walking'
          ? Math.sin(time * 7.2 * Math.max(state.gaitSpeed, 0.35)) * 0.035
          : 0;

      meshPivotRef.current.position.y = gait;
      meshPivotRef.current.rotation.z = sway;
    }

    if (breathRef.current) {
      const breath = Math.sin(state.respirationPhase) * 0.012;
      breathRef.current.scale.set(1 + breath, 1 + breath * 0.35, 1 + breath * 1.15);
    }

    if (haloRef.current) {
      const pulse = 1 + Math.sin(time * 2.4) * 0.06;
      haloRef.current.scale.setScalar(pulse * (state.isCritical ? 1.12 : 1));
      const material = haloRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = state.isCritical ? 0.58 : 0.28;
      material.color.set(statusColor);
    }

    if (trailRef.current && quality !== 'performance') {
      const marker = trailRef.current.children[trailCursor.current] as THREE.Mesh | undefined;
      if (marker) {
        marker.position.set(filter.position.x, 0.03, filter.position.z);
        marker.scale.setScalar(0.7);
      }
      trailCursor.current = (trailCursor.current + 1) % TRAIL_LENGTH;
      trailRef.current.children.forEach((child, index) => {
        const age = (TRAIL_LENGTH + trailCursor.current - index) % TRAIL_LENGTH;
        const fade = 1 - age / TRAIL_LENGTH;
        child.scale.setScalar(0.25 + fade * 0.7);
        const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        material.opacity = fade * (state.isCritical ? 0.45 : 0.22);
      });
    }
  });

  return (
    <group>
      <group ref={rootRef}>
        <group ref={meshPivotRef}>
          <group position={[0, -PELVIS_Y, 0]} scale={scale}>
            <group ref={breathRef}>
              <primitive object={twin} />
              {showDebugSkeleton && <primitive object={hologram} scale={1.015} />}
            </group>
          </group>
        </group>

        <mesh ref={haloRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -PELVIS_Y + 0.025, 0]}>
          <ringGeometry args={[0.18, 0.26, 48]} />
          <meshBasicMaterial
            color={statusColor}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      {quality !== 'performance' && (
        <group ref={trailRef}>
          {Array.from({ length: TRAIL_LENGTH }).map((_, index) => (
            <mesh key={index} position={[0, -2, 0]}>
              <sphereGeometry args={[0.045, 8, 8]} />
              <meshBasicMaterial
                color={statusColor}
                transparent
                opacity={0}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};

useGLTF.preload(MODEL_URL);
