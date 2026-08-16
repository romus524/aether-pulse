import React, { useMemo } from 'react';
import * as THREE from 'three';
import { CSISpatialState } from './CSIAdapter';

interface MovementTrajectoryProps {
  csiState: CSISpatialState;
  enabled?: boolean;
}

export const MovementTrajectory: React.FC<MovementTrajectoryProps> = ({
  csiState,
  enabled = true,
}) => {
  const { lineObject, points, dropLineObjects } = useMemo(() => {
    const pts = csiState.trajectory.map((p) => new THREE.Vector3(p.x, p.y, p.z));
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: csiState.isCritical ? 0xef4444 : 0xa855f7,
      transparent: true,
      opacity: 0.65,
      linewidth: 2,
    });
    const line = new THREE.Line(geom, mat);

    const drops = pts.map((pt) => {
      const dGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -pt.y + 0.02, 0),
      ]);
      const dMat = new THREE.LineBasicMaterial({
        color: csiState.isCritical ? 0xef4444 : 0xa855f7,
        transparent: true,
        opacity: 0.25,
      });
      return new THREE.Line(dGeom, dMat);
    });

    return { lineObject: line, points: pts, dropLineObjects: drops };
  }, [csiState.trajectory, csiState.isCritical]);

  if (!enabled || points.length < 2) return null;

  const trajectoryColor = csiState.isCritical ? '#ef4444' : '#a855f7';

  return (
    <group>
      {/* 1. Translucent 3D Trajectory Path Ribbon */}
      <primitive object={lineObject} />
      
      {/* 2. Key Trajectory Waypoint Nodes */}
      {points.map((pt, idx) => (
        <group key={idx} position={[pt.x, pt.y, pt.z]}>
          <mesh>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshBasicMaterial color={trajectoryColor} />
          </mesh>
          {/* Ground projection drop line */}
          {dropLineObjects[idx] && <primitive object={dropLineObjects[idx]} />}
        </group>
      ))}

      {/* 3. Fall Impact Zone Indicator if Critical */}
      {csiState.isCritical && (
        <group position={[csiState.coordinates.x, 0.02, csiState.coordinates.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.45, 0.58, 32]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.2, 0.28, 32]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.3} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </group>
  );
};
