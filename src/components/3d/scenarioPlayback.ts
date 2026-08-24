import { PatientRecord } from '../../types';
import { EVENT_SCENARIOS, EventScenario, EventScenarioId, KeyframeEvent } from '../SimulatedEventVideoFeed';
import {
  CSISpatialState,
  SENSING_NODES,
  SpatialCoordinates,
  TwinPosture,
} from './CSIAdapter';

export interface SpatialKeyframe {
  time: number;
  position: SpatialCoordinates;
  heading: number;
  posture: TwinPosture;
}

export interface PlaybackPose {
  position: SpatialCoordinates;
  heading: number;
  posture: TwinPosture;
  progress: number;
  activeEvent: KeyframeEvent | null;
}

const ROOM_SCENARIO: Record<string, EventScenarioId> = {
  '101': 'syncope-101',
  '102': 'pre-exit-102',
  '103': 'apnea-103',
  '104': 'fall-104',
  '105': 'wandering-105',
};

const SCENARIO_TRACKS: Record<EventScenarioId, SpatialKeyframe[]> = {
  'fall-104': [
    { time: 0.0, position: { x: 0.0, y: 0.58, z: -0.1 }, heading: 0, posture: 'bed' },
    { time: 1.4, position: { x: 0.06, y: 0.58, z: -0.04 }, heading: 0.15, posture: 'bed' },
    { time: 2.5, position: { x: 0.42, y: 0.62, z: 0.14 }, heading: 1.15, posture: 'sitting' },
    { time: 3.25, position: { x: 0.78, y: 0.9, z: 0.34 }, heading: 0.55, posture: 'walking' },
    { time: 3.55, position: { x: 1.08, y: 0.52, z: 0.58 }, heading: 0.62, posture: 'walking' },
    { time: 3.8, position: { x: 1.32, y: 0.18, z: 0.82 }, heading: 0.95, posture: 'fallen' },
    { time: 8.0, position: { x: 1.33, y: 0.16, z: 0.83 }, heading: 0.98, posture: 'fallen' },
  ],
  'pre-exit-102': [
    { time: 0.0, position: { x: 0.0, y: 0.58, z: -0.1 }, heading: 0, posture: 'bed' },
    { time: 1.8, position: { x: 0.22, y: 0.6, z: 0.04 }, heading: 0.7, posture: 'sitting' },
    { time: 3.2, position: { x: 0.58, y: 0.62, z: 0.16 }, heading: 1.45, posture: 'sitting' },
    { time: 7.0, position: { x: 0.6, y: 0.62, z: 0.18 }, heading: 1.5, posture: 'sitting' },
  ],
  'wandering-105': [
    { time: 0.0, position: { x: 0.0, y: 0.58, z: -0.08 }, heading: 0, posture: 'bed' },
    { time: 2.0, position: { x: 0.18, y: 0.93, z: 0.08 }, heading: 0.4, posture: 'walking' },
    { time: 3.2, position: { x: 0.55, y: 0.94, z: 0.22 }, heading: 0.85, posture: 'walking' },
    { time: 4.2, position: { x: 0.22, y: 0.94, z: 0.55 }, heading: 2.4, posture: 'walking' },
    { time: 5.6, position: { x: 0.78, y: 0.94, z: 0.82 }, heading: 0.55, posture: 'walking' },
    { time: 7.0, position: { x: 1.28, y: 0.94, z: 1.18 }, heading: 0.35, posture: 'walking' },
    { time: 9.0, position: { x: 1.42, y: 0.94, z: 1.28 }, heading: 0.2, posture: 'standing' },
  ],
  'apnea-103': [
    { time: 0.0, position: { x: 0.0, y: 0.58, z: -0.1 }, heading: 0, posture: 'bed' },
    { time: 2.5, position: { x: 0.01, y: 0.58, z: -0.09 }, heading: 0.04, posture: 'bed' },
    { time: 4.0, position: { x: 0.0, y: 0.575, z: -0.1 }, heading: 0, posture: 'bed' },
    { time: 8.0, position: { x: 0.0, y: 0.575, z: -0.1 }, heading: 0, posture: 'bed' },
  ],
  'syncope-101': [
    { time: 0.0, position: { x: -0.72, y: 0.62, z: -0.42 }, heading: 1.2, posture: 'sitting' },
    { time: 2.2, position: { x: -0.28, y: 0.93, z: -0.12 }, heading: 0.45, posture: 'walking' },
    { time: 3.6, position: { x: 0.08, y: 0.78, z: 0.08 }, heading: 0.55, posture: 'walking' },
    { time: 4.2, position: { x: 0.38, y: 0.17, z: 0.22 }, heading: 0.9, posture: 'fallen' },
    { time: 8.0, position: { x: 0.4, y: 0.16, z: 0.24 }, heading: 0.95, posture: 'fallen' },
  ],
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const lerpAngle = (a: number, b: number, t: number) => {
  const delta = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + delta * t;
};

const easeInOut = (t: number) => t * t * (3 - 2 * t);

export const getScenarioIdForPatient = (patient: PatientRecord): EventScenarioId => {
  return ROOM_SCENARIO[patient.roomNumber] || 'fall-104';
};

export const getScenarioForPatient = (patient: PatientRecord): EventScenario => {
  return EVENT_SCENARIOS[getScenarioIdForPatient(patient)];
};

export const getTrackForPatient = (patient: PatientRecord): SpatialKeyframe[] => {
  return SCENARIO_TRACKS[getScenarioIdForPatient(patient)];
};

export const samplePlaybackPose = (patient: PatientRecord, time: number): PlaybackPose => {
  const scenario = getScenarioForPatient(patient);
  const track = getTrackForPatient(patient);
  const duration = scenario.durationSeconds;
  const clamped = Math.min(Math.max(time, 0), duration);

  let index = 0;
  while (index < track.length - 2 && track[index + 1].time <= clamped) {
    index += 1;
  }

  const a = track[index];
  const b = track[Math.min(index + 1, track.length - 1)];
  const span = Math.max(b.time - a.time, 0.0001);
  const mix = easeInOut(Math.min(Math.max((clamped - a.time) / span, 0), 1));

  const position: SpatialCoordinates = {
    x: lerp(a.position.x, b.position.x, mix),
    y: lerp(a.position.y, b.position.y, mix),
    z: lerp(a.position.z, b.position.z, mix),
  };

  let activeEvent: KeyframeEvent | null = null;
  let nearest = 0.55;
  for (const keyframe of scenario.keyframes) {
    const distance = Math.abs(keyframe.time - clamped);
    if (distance < nearest) {
      nearest = distance;
      activeEvent = keyframe;
    }
  }

  return {
    position,
    heading: lerpAngle(a.heading, b.heading, mix),
    posture: mix < 0.5 ? a.posture : b.posture,
    progress: duration > 0 ? clamped / duration : 0,
    activeEvent,
  };
};

export const sampleGhostPath = (patient: PatientRecord, time: number, samples = 48): SpatialCoordinates[] => {
  const points: SpatialCoordinates[] = [];
  const clamped = Math.max(time, 0.05);
  const count = Math.max(8, Math.floor(samples * Math.min(clamped / 2, 1) + 8));
  for (let i = 0; i <= count; i += 1) {
    const t = (i / count) * clamped;
    points.push(samplePlaybackPose(patient, t).position);
  }
  return points;
};

export const getPlaybackSpatialState = (
  patient: PatientRecord,
  time: number
): CSISpatialState => {
  const scenario = getScenarioForPatient(patient);
  const pose = samplePlaybackPose(patient, time);
  const ghost = sampleGhostPath(patient, time, 32);
  const rr = patient.respirationRate || 16;
  const hr = patient.heartRate || 72;
  const snr = 28.5 + (patient.signalQuality ? Math.abs(patient.signalQuality + 70) * 0.4 : 0);
  const respFreqHz = (pose.activeEvent?.type === 'critical' && scenario.id === 'apnea-103' ? 2 : rr) / 60;
  const respirationPhase = (time * respFreqHz * Math.PI * 2) % (Math.PI * 2);
  const isCritical =
    patient.status === 'critical' ||
    pose.activeEvent?.type === 'critical' ||
    pose.activeEvent?.type === 'impact' ||
    pose.posture === 'fallen';
  const isWarning =
    patient.status === 'warning' || pose.activeEvent?.type === 'warning' || pose.posture === 'sitting';

  const noise = 0.01 * (30 / Math.max(snr, 10));
  const rawCoordinates = {
    x: pose.position.x + Math.sin(time * 11.4) * noise,
    y: pose.position.y + Math.sin(time * 7.1) * noise * 0.2,
    z: pose.position.z + Math.cos(time * 13.2) * noise,
  };

  return {
    coordinates: pose.position,
    rawCoordinates,
    rotationY: pose.heading,
    posture: pose.posture,
    respirationPhase,
    heartRate: hr,
    respirationRate: rr,
    dopplerVelocity: pose.posture === 'walking' ? 0.18 : pose.posture === 'fallen' ? 0.006 : 0.03,
    phaseShiftDelta: isCritical ? 0.86 : isWarning ? 0.32 : 0.12,
    snr,
    kineticEnergy: pose.posture === 'walking' ? 0.42 : pose.posture === 'fallen' ? 0.04 : 0.12,
    gaitSpeed: pose.posture === 'walking' ? 0.82 : 0,
    trajectory: ghost,
    nodes: SENSING_NODES,
    isCritical,
    isWarning,
  };
};
