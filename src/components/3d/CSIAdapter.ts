import { PatientRecord } from '../../types';

export interface SpatialCoordinates {
  x: number;
  y: number;
  z: number;
}

export interface CSISensingNode {
  id: string;
  name: string;
  position: [number, number, number];
  freqGhz: number;
  snr: number;
  active: boolean;
}

export type TwinPosture = 'bed' | 'sitting' | 'standing' | 'fallen' | 'walking';

export interface CSISpatialState {
  coordinates: SpatialCoordinates;
  rawCoordinates: SpatialCoordinates;
  rotationY: number;
  posture: TwinPosture;
  respirationPhase: number;
  heartRate: number;
  respirationRate: number;
  dopplerVelocity: number;
  phaseShiftDelta: number;
  snr: number;
  kineticEnergy: number;
  gaitSpeed: number;
  trajectory: SpatialCoordinates[];
  nodes: CSISensingNode[];
  isCritical: boolean;
  isWarning: boolean;
}

export const SENSING_NODES: CSISensingNode[] = [
  { id: 'node-a', name: 'NODE A (Ceiling Tx/Rx 1)', position: [-1.9, 2.3, -1.9], freqGhz: 60.0, snr: 32.4, active: true },
  { id: 'node-b', name: 'NODE B (Ceiling Tx/Rx 2)', position: [1.9, 2.3, -1.9], freqGhz: 60.0, snr: 30.1, active: true },
  { id: 'node-c', name: 'NODE C (Ceiling Tx/Rx 3)', position: [-1.9, 2.3, 1.9], freqGhz: 60.0, snr: 31.8, active: true },
  { id: 'node-d', name: 'NODE D (Ceiling Tx/Rx 4)', position: [1.9, 2.3, 1.9], freqGhz: 60.0, snr: 29.5, active: true },
];

const samplePath = (
  points: SpatialCoordinates[],
  u: number
): { position: SpatialCoordinates; heading: number } => {
  if (points.length === 0) {
    return { position: { x: 0, y: 0.92, z: 0 }, heading: 0 };
  }
  if (points.length === 1) {
    return { position: points[0], heading: 0 };
  }

  const clamped = Math.min(Math.max(u, 0), 0.9999);
  const scaled = clamped * (points.length - 1);
  const index = Math.floor(scaled);
  const mix = scaled - index;
  const a = points[index];
  const b = points[index + 1];
  const dx = b.x - a.x;
  const dz = b.z - a.z;

  return {
    position: {
      x: a.x + dx * mix,
      y: a.y + (b.y - a.y) * mix,
      z: a.z + dz * mix,
    },
    heading: Math.atan2(dx, dz),
  };
};

const pingPong = (value: number) => {
  const cycle = value % 2;
  return cycle < 1 ? cycle : 2 - cycle;
};

const applyCsiNoise = (
  position: SpatialCoordinates,
  time: number,
  snr: number
): SpatialCoordinates => {
  const amplitude = 0.016 * (30 / Math.max(snr, 10));
  return {
    x: position.x + Math.sin(time * 13.7) * amplitude * 0.55 + Math.sin(time * 31.2) * amplitude * 0.18,
    y: position.y + Math.sin(time * 9.4) * amplitude * 0.12,
    z: position.z + Math.cos(time * 15.1) * amplitude * 0.55 + Math.cos(time * 27.6) * amplitude * 0.14,
  };
};

/**
 * Maps raw patient telemetry into spatial CSI kinematics.
 * Coordinates are the estimated torso / pelvis tracking point.
 */
export function getCSISpatialState(patient: PatientRecord, time: number): CSISpatialState {
  const isCritical = patient.status === 'critical';
  const isWarning = patient.status === 'warning';
  const rr = patient.respirationRate || 16;
  const hr = patient.heartRate || 72;
  const snr = 28.5 + (patient.signalQuality ? Math.abs(patient.signalQuality + 70) * 0.4 : 0);

  const respFreqHz = rr / 60;
  const respirationPhase = (time * respFreqHz * Math.PI * 2) % (Math.PI * 2);

  let trajectory: SpatialCoordinates[] = [];
  let estimated: SpatialCoordinates;
  let rotationY = 0;
  let dopplerVelocity = 0.02;
  let phaseShiftDelta = 0.12;
  let gaitSpeed = 0;
  let posture: TwinPosture = patient.posture;

  switch (patient.posture) {
    case 'bed':
      trajectory = [
        { x: 0, y: 0.58, z: -0.12 },
        { x: 0.01, y: 0.58, z: -0.08 },
      ];
      estimated = { x: 0, y: 0.58, z: -0.1 };
      rotationY = 0;
      dopplerVelocity = 0.01 + Math.sin(time * 2) * 0.004;
      phaseShiftDelta = 0.08 + Math.sin(respirationPhase) * 0.04;
      break;

    case 'sitting':
      trajectory = [
        { x: 0, y: 0.58, z: -0.08 },
        { x: 0.28, y: 0.6, z: 0.06 },
        { x: 0.58, y: 0.62, z: 0.16 },
      ];
      {
        const progress = Math.min(0.35 + time * 0.08, 1);
        const sampled = samplePath(trajectory, progress);
        estimated = sampled.position;
        rotationY = sampled.heading;
      }
      dopplerVelocity = 0.04 + Math.sin(time * 1.5) * 0.016;
      phaseShiftDelta = 0.24 + Math.sin(time * 3) * 0.08;
      break;

    case 'standing':
      trajectory = [
        { x: 0.05, y: 0.92, z: 0.02 },
        { x: 0.42, y: 0.93, z: 0.18 },
        { x: 0.82, y: 0.94, z: 0.34 },
        { x: 1.12, y: 0.94, z: 0.52 },
      ];
      {
        const sampled = samplePath(trajectory, pingPong(time * 0.18));
        estimated = sampled.position;
        rotationY = sampled.heading;
        gaitSpeed = 0.85;
        posture = 'walking';
      }
      dopplerVelocity = 0.16 + Math.sin(time * 2.2) * 0.04;
      phaseShiftDelta = 0.48 + Math.sin(time * 2) * 0.12;
      break;

    case 'fallen':
    default:
      trajectory = [
        { x: 0, y: 0.58, z: 0 },
        { x: 0.55, y: 0.78, z: 0.28 },
        { x: 1.05, y: 0.9, z: 0.58 },
        { x: 1.32, y: 0.18, z: 0.82 },
      ];
      {
        const fallProgress = Math.min(Math.max(time * 0.12, 0), 1);
        const sampled = samplePath(trajectory, fallProgress);
        estimated = sampled.position;
        rotationY = sampled.heading;
        if (fallProgress < 0.78) {
          posture = 'walking';
          gaitSpeed = 0.7 * (1 - fallProgress);
        } else {
          posture = 'fallen';
          gaitSpeed = 0;
        }
      }
      dopplerVelocity = isCritical ? 0.006 : 0.08;
      phaseShiftDelta = isCritical ? 0.92 : 0.4;
      break;
  }

  const rawCoordinates = applyCsiNoise(estimated, time, snr);

  return {
    coordinates: estimated,
    rawCoordinates,
    rotationY,
    posture,
    respirationPhase,
    heartRate: hr,
    respirationRate: rr,
    dopplerVelocity,
    phaseShiftDelta,
    snr,
    kineticEnergy: patient.movementIndex ? patient.movementIndex / 100 : gaitSpeed * 0.35 + 0.08,
    gaitSpeed,
    trajectory,
    nodes: SENSING_NODES,
    isCritical,
    isWarning,
  };
}
