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

export interface CSISpatialState {
  coordinates: SpatialCoordinates;
  rotationY: number;
  posture: 'bed' | 'sitting' | 'standing' | 'fallen' | 'walking';
  respirationPhase: number;
  heartRate: number;
  respirationRate: number;
  dopplerVelocity: number; // m/s
  phaseShiftDelta: number; // radians
  snr: number; // dB
  kineticEnergy: number;
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

/**
 * Maps raw patient record into spatial CSI state and kinematics
 */
export function getCSISpatialState(patient: PatientRecord, time: number): CSISpatialState {
  const isCritical = patient.status === 'critical';
  const isWarning = patient.status === 'warning';
  const rr = patient.respirationRate || 16;
  const hr = patient.heartRate || 72;

  // Real-time respiration phase: [0, 2PI]
  const respFreqHz = rr / 60;
  const respirationPhase = (time * respFreqHz * Math.PI * 2) % (Math.PI * 2);

  // Position and trajectory based on posture
  let coordinates: SpatialCoordinates;
  let rotationY = 0;
  let trajectory: SpatialCoordinates[] = [];
  let dopplerVelocity = 0.02;
  let phaseShiftDelta = 0.12;

  switch (patient.posture) {
    case 'bed':
      coordinates = { x: 0, y: 0.52, z: 0.05 };
      rotationY = 0;
      trajectory = [
        { x: 0, y: 0.52, z: -0.2 },
        { x: 0, y: 0.52, z: 0.05 },
      ];
      dopplerVelocity = 0.01 + Math.sin(time * 2) * 0.005;
      phaseShiftDelta = 0.08 + Math.sin(respirationPhase) * 0.04;
      break;

    case 'sitting':
      coordinates = { x: 0.65, y: 0.52, z: 0.18 };
      rotationY = Math.PI / 2;
      trajectory = [
        { x: 0, y: 0.52, z: 0 },
        { x: 0.4, y: 0.52, z: 0.1 },
        { x: 0.65, y: 0.52, z: 0.18 },
      ];
      dopplerVelocity = 0.04 + Math.sin(time * 1.5) * 0.02;
      phaseShiftDelta = 0.24 + Math.sin(time * 3) * 0.08;
      break;

    case 'standing':
      coordinates = { x: 1.15, y: 0.92, z: 0.4 };
      rotationY = -Math.PI / 4;
      trajectory = [
        { x: 0, y: 0.52, z: 0 },
        { x: 0.6, y: 0.65, z: 0.2 },
        { x: 1.0, y: 0.88, z: 0.35 },
        { x: 1.15, y: 0.92, z: 0.4 },
      ];
      dopplerVelocity = 0.12 + Math.sin(time * 2) * 0.05;
      phaseShiftDelta = 0.48 + Math.sin(time * 2) * 0.15;
      break;

    case 'fallen':
    default:
      coordinates = { x: 1.35, y: 0.14, z: 0.85 };
      rotationY = Math.PI / 3;
      trajectory = [
        { x: 0, y: 0.52, z: 0 },
        { x: 0.7, y: 0.65, z: 0.3 },
        { x: 1.2, y: 0.85, z: 0.6 },
        { x: 1.35, y: 0.14, z: 0.85 },
      ];
      dopplerVelocity = isCritical ? 0.005 : 0.08;
      phaseShiftDelta = isCritical ? 0.92 : 0.4;
      break;
  }

  return {
    coordinates,
    rotationY,
    posture: patient.posture,
    respirationPhase,
    heartRate: hr,
    respirationRate: rr,
    dopplerVelocity,
    phaseShiftDelta,
    snr: 28.5 + (patient.signalQuality ? Math.abs(patient.signalQuality + 70) * 0.4 : 0),
    kineticEnergy: patient.movementIndex ? patient.movementIndex / 100 : 0.15,
    trajectory,
    nodes: SENSING_NODES,
    isCritical,
    isWarning,
  };
}
