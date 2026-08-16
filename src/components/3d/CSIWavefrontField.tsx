import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CSISpatialState } from './CSIAdapter';

interface CSIWavefrontFieldProps {
  csiState: CSISpatialState;
  enabled?: boolean;
  quality?: 'high' | 'balanced' | 'performance';
}

export const CSIWavefrontField: React.FC<CSIWavefrontFieldProps> = ({
  csiState,
  enabled = true,
  quality = 'high',
}) => {
  const wavefrontGroupRef = useRef<THREE.Group>(null);
  const beamLinesRef = useRef<THREE.LineSegments>(null);

  const ringCount = quality === 'high' ? 8 : quality === 'balanced' ? 5 : 3;

  // Wave colors: Cyan (#06b6d4), Electric Blue (#38bdf8), Violet (#a855f7), Red alert on critical
  const waveColors = useMemo(() => {
    if (csiState.isCritical) {
      return ['#ef4444', '#f87171', '#dc2626', '#fca5a5'];
    }
    return ['#06b6d4', '#38bdf8', '#818cf8', '#c084fc'];
  }, [csiState.isCritical]);

  // Beam line geometries connecting each sensing node to the patient's coordinates
  const beamGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(csiState.nodes.length * 6);
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, [csiState.nodes.length]);

  // Frame update: propagate wavefronts and bend/deflect near patient
  useFrame(({ clock }) => {
    if (!enabled) return;
    const t = clock.getElapsedTime() * 1.8;

    // 1. Animate Wavefront Rings for each sensing node
    if (wavefrontGroupRef.current) {
      let childIndex = 0;
      csiState.nodes.forEach((node) => {
        for (let r = 0; r < ringCount; r++) {
          const child = wavefrontGroupRef.current?.children[childIndex] as THREE.Mesh;
          if (child) {
            const phaseOffset = r * (2.2 / ringCount);
            const cycleProgress = ((t + phaseOffset) % 2.2) / 2.2; // 0 to 1
            const radius = 0.2 + cycleProgress * 2.8;

            child.scale.set(radius, radius, radius);

            // Deflection/perturbation near patient
            const distToPatient = new THREE.Vector3(node.position[0], 0, node.position[2])
              .distanceTo(new THREE.Vector3(csiState.coordinates.x, 0, csiState.coordinates.z));

            const material = child.material as THREE.MeshBasicMaterial;
            if (material) {
              const baseOpacity = Math.sin(cycleProgress * Math.PI) * 0.32;
              const perturbation = Math.max(0, 1 - Math.abs(radius - distToPatient) * 1.2) * 0.25;
              material.opacity = Math.min(0.7, baseOpacity + perturbation);
            }
          }
          childIndex++;
        }
      });
    }

    // 2. Animate Sensing Beams to Patient Coordinate
    if (beamLinesRef.current) {
      const posAttr = beamLinesRef.current.geometry.attributes.position;
      csiState.nodes.forEach((node, i) => {
        // Node ceiling position
        posAttr.setXYZ(i * 2, node.position[0], node.position[1], node.position[2]);
        // Patient chest center with subtle micro-Doppler wobble
        const wobble = Math.sin(t * 4 + i) * (csiState.isCritical ? 0.04 : 0.012);
        posAttr.setXYZ(
          i * 2 + 1,
          csiState.coordinates.x + wobble,
          csiState.coordinates.y + 0.35,
          csiState.coordinates.z + wobble
        );
      });
      posAttr.needsUpdate = true;
    }
  });

  if (!enabled) return null;

  return (
    <group>
      {/* 1. Multi-Node Wavefront Rings */}
      <group ref={wavefrontGroupRef}>
        {csiState.nodes.map((node) =>
          Array.from({ length: ringCount }).map((_, r) => {
            const color = waveColors[r % waveColors.length];
            return (
              <mesh
                key={`${node.id}-ring-${r}`}
                position={[node.position[0], 0.05, node.position[2]]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <ringGeometry args={[0.96, 1.0, 48]} />
                <meshBasicMaterial
                  color={color}
                  transparent
                  opacity={0.3}
                  side={THREE.DoubleSide}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            );
          })
        )}
      </group>

      {/* 2. Direct CSI Multi-Static Sensing Beams */}
      <lineSegments ref={beamLinesRef} geometry={beamGeometry}>
        <lineBasicMaterial
          color={csiState.isCritical ? '#ef4444' : '#38bdf8'}
          transparent
          opacity={csiState.isCritical ? 0.45 : 0.22}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* 3. Patient CSI Body Scattering / Perturbation Bubble */}
      <mesh position={[csiState.coordinates.x, csiState.coordinates.y + 0.35, csiState.coordinates.z]}>
        <sphereGeometry args={[0.65, 24, 24]} />
        <meshBasicMaterial
          color={csiState.isCritical ? '#ef4444' : '#06b6d4'}
          wireframe
          transparent
          opacity={csiState.isCritical ? 0.22 : 0.1}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};
