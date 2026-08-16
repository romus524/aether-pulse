import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CSISpatialState } from './CSIAdapter';

interface SpatialEnvironmentProps {
  csiState: CSISpatialState;
  showRadarRings?: boolean;
}

export const SpatialEnvironment: React.FC<SpatialEnvironmentProps> = ({
  csiState,
}) => {
  const pulseRingRef = useRef<THREE.Group>(null);
  const monitorGlowRef = useRef<THREE.PointLight>(null);

  const isCritical = csiState.isCritical;
  const statusColor = isCritical ? '#ef4444' : '#38bdf8';

  const nodeLineObjects = useMemo(() => {
    return csiState.nodes.map((node) => {
      const geom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -node.position[1], 0),
      ]);
      const mat = new THREE.LineBasicMaterial({
        color: isCritical ? 0xef4444 : 0x0284c7,
        transparent: true,
        opacity: 0.16,
      });
      return new THREE.Line(geom, mat);
    });
  }, [csiState.nodes, isCritical]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Pulse node indicators
    if (pulseRingRef.current) {
      pulseRingRef.current.children.forEach((child, idx) => {
        const mesh = child as THREE.Mesh;
        const scale = 1 + ((t * 1.5 + idx * 0.4) % 2) * 0.8;
        mesh.scale.set(scale, scale, scale);
        const mat = mesh.material as THREE.MeshBasicMaterial;
        if (mat) {
          mat.opacity = Math.max(0, 0.4 - (scale - 1) * 0.35);
        }
      });
    }

    // Monitor screen subtle telemetry flicker
    if (monitorGlowRef.current) {
      monitorGlowRef.current.intensity = 0.8 + Math.sin(t * 8) * 0.15;
    }
  });

  return (
    <group>
      {/* ========================================================= */}
      {/* 1. ROOM FLOOR & SPATIAL METRIC GRID */}
      {/* ========================================================= */}
      {/* Dark Floor Plane */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4.6, 4.6]} />
        <meshStandardMaterial color="#060913" roughness={0.3} metalness={0.15} />
      </mesh>

      {/* Spatial Metric Grid */}
      <gridHelper
        args={[4.6, 20, isCritical ? '#ef4444' : '#38bdf8', '#1e293b']}
        position={[0, 0, 0]}
      />

      {/* Outer Spatial Room Bounding Cage */}
      <mesh position={[0, 1.15, 0]}>
        <boxGeometry args={[4.6, 2.3, 4.6]} />
        <meshBasicMaterial
          color={isCritical ? '#ef4444' : '#334155'}
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* ========================================================= */}
      {/* 2. 4X CEILING FMCW WIRELESS SENSING NODES */}
      {/* ========================================================= */}
      {csiState.nodes.map((node, i) => (
        <group key={node.id} position={node.position}>
          {/* Node Transceiver Enclosure */}
          <mesh castShadow>
            <cylinderGeometry args={[0.09, 0.11, 0.08, 20]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
          </mesh>

          {/* Node Active RF Lens */}
          <mesh position={[0, -0.042, 0]}>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshBasicMaterial color={isCritical ? '#ef4444' : '#06b6d4'} />
          </mesh>

          {/* Localized RF Node Point Light */}
          <pointLight
            distance={3.2}
            intensity={isCritical ? 2.2 : 1.1}
            color={isCritical ? '#ef4444' : '#38bdf8'}
          />

          {/* Sensing Vector Line down to Floor */}
          {nodeLineObjects[i] && <primitive object={nodeLineObjects[i]} />}
        </group>
      ))}

      {/* Node A Ceiling Pulse Rings */}
      <group ref={pulseRingRef} position={[0, 2.25, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.3, 0.36, 32]} />
            <meshBasicMaterial
              color={statusColor}
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>

      {/* ========================================================= */}
      {/* 3. HOSPITAL BED & MEDICAL FURNISHINGS */}
      {/* ========================================================= */}
      <group position={[0, 0, 0]}>
        {/* Bed Castors / Legs */}
        {[
          [-0.5, 0.04, -0.9],
          [0.5, 0.04, -0.9],
          [-0.5, 0.04, 0.9],
          [0.5, 0.04, 0.9],
        ].map((pos, idx) => (
          <mesh key={idx} position={pos as [number, number, number]}>
            <cylinderGeometry args={[0.035, 0.035, 0.08, 16]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
          </mesh>
        ))}

        {/* Lower Bed Base Chassis */}
        <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.16, 0.12, 2.06]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.25} />
        </mesh>

        {/* Safety Side Rails */}
        <mesh position={[-0.57, 0.34, -0.15]} castShadow>
          <boxGeometry args={[0.028, 0.22, 1.15]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0.57, 0.34, -0.15]} castShadow>
          <boxGeometry args={[0.028, 0.22, 1.15]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Hospital Mattress */}
        <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.08, 0.22, 1.98]} />
          <meshStandardMaterial color="#1e1b4b" roughness={0.7} metalness={0.1} />
        </mesh>

        {/* Fitted Sheet Top Surface */}
        <mesh position={[0, 0.435, 0.08]} receiveShadow>
          <boxGeometry args={[1.06, 0.02, 1.76]} />
          <meshStandardMaterial color="#312e81" roughness={0.85} />
        </mesh>

        {/* Headboard */}
        <mesh position={[0, 0.48, -1.0]} castShadow receiveShadow>
          <boxGeometry args={[1.16, 0.56, 0.06]} />
          <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Footboard */}
        <mesh position={[0, 0.32, 1.0]} castShadow receiveShadow>
          <boxGeometry args={[1.16, 0.36, 0.06]} />
          <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Medical Pillow */}
        <mesh position={[0, 0.48, -0.74]} castShadow receiveShadow>
          <boxGeometry args={[0.66, 0.08, 0.38]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.9} />
        </mesh>

        {/* ========================================================= */}
        {/* 4. BEDSIDE CLINICAL TELEMETRY MONITOR & IV POLE */}
        {/* ========================================================= */}
        <group position={[-0.92, 0, -0.7]}>
          {/* Bedside Cabinet */}
          <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.46, 0.5, 0.46]} />
            <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.4} />
          </mesh>

          {/* Medical Monitor Unit */}
          <group position={[0, 0.66, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.36, 0.26, 0.1]} />
              <meshStandardMaterial color="#020617" metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Glowing Telemetry Screen */}
            <mesh position={[0, 0, 0.052]}>
              <planeGeometry args={[0.32, 0.22]} />
              <meshBasicMaterial color={isCritical ? '#ef4444' : '#0284c7'} />
            </mesh>

            {/* Screen Emission Light */}
            <pointLight
              ref={monitorGlowRef}
              position={[0, 0, 0.12]}
              distance={1.5}
              intensity={0.9}
              color={isCritical ? '#ef4444' : '#38bdf8'}
            />
          </group>

          {/* Stainless IV Stand Pole */}
          <mesh position={[0.22, 0.8, -0.1]} castShadow>
            <cylinderGeometry args={[0.012, 0.012, 1.6, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
          </mesh>

          {/* IV Saline Infusion Bag */}
          <mesh position={[0.22, 1.48, -0.1]} castShadow>
            <boxGeometry args={[0.08, 0.18, 0.04]} />
            <meshStandardMaterial color="#e0f2fe" transparent opacity={0.7} roughness={0.2} />
          </mesh>
        </group>
      </group>
    </group>
  );
};
