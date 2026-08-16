export type RoomStatus = 'normal' | 'warning' | 'critical' | 'responding';

export interface PatientInfo {
  name: string;
  age: number;
  gender: string;
  mrn: string;
  diagnosis: string;
  physician: string;
  admissionDate: string;
}

export interface FacilityRoom {
  id: string;
  floorId: string;
  roomNumber: string;
  bedNumber: string;
  patient: PatientInfo;
  status: RoomStatus;
  enteredStateAt: number; // Date.now() timestamp when state started
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  bedPosition?: { x: number; y: number };
  doorPosition?: { x: number; y: number };
  movement: string; // e.g. "BED → DOOR", "RESTING SUPINE", "STANDING NEAR BED"
  confidence: number; // e.g. 94.8
  edgeNode: string; // e.g. "EDGE-04"
  fallRiskScore: number;
  heartRate: number;
  respirationRate: number;
  lastEvent: string; // e.g. "12 secs ago"
  dispatchedAt?: string;
  dispatchTeam?: string;
}

export interface ArchitecturalElement {
  id: string;
  type: 'hallway' | 'nurse_station' | 'elevator' | 'stair' | 'bathroom' | 'utility' | 'entrance';
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Floor {
  id: string;
  name: string;
  shortName: string;
  roomCount: number;
  criticalCount: number;
  description: string;
  dimensions: {
    width: number;
    height: number;
  };
  elements: ArchitecturalElement[];
  rooms: FacilityRoom[];
}

export interface MapTransform {
  zoom: number;
  panX: number;
  panY: number;
}

export type SortField = 'roomNumber' | 'patientName' | 'status' | 'timeInState';
export type SortDirection = 'asc' | 'desc';

export interface PatientRecord {
  id: string;
  roomNumber: string;
  bedNumber: string;
  name: string;
  age: number;
  gender: string;
  mrn: string;
  diagnosis: string;
  physician: string;
  admissionDate: string;
  fallRiskScore: number; // Johns Hopkins Fall Risk Scale (0-24)
  status: RoomStatus;
  posture: 'bed' | 'sitting' | 'standing' | 'fallen';
  postureDescription: string;
  heartRate: number;
  respirationRate: number;
  hrv: number; // Heart Rate Variability in ms
  signalQuality: number; // dBm signal quality (e.g. -42 dBm)
  movementIndex: number; // 0-100 micro-Doppler movement intensity
  lastMovement: string;
  wifiDopplerRate: number; // Hz phase shift
}

export interface TelemetryDataPoint {
  time: string;
  respiration: number;
  heartRate: number;
  dopplerPhase: number;
  kineticEnergy: number;
}

export type FSMStageId = 1 | 2 | 3 | 4;

export interface FSMStage {
  id: FSMStageId;
  name: string;
  code: string;
  description: string;
  threshold: string;
  status: 'pending' | 'active' | 'passed' | 'failed';
  timestamp?: string;
  value?: string;
}

export interface FallEventData {
  roomId: string;
  patientName: string;
  startTime: string;
  impactForceG: number;
  descentVelocityMs: number;
  groundImmobilitySec: number;
  currentStage: FSMStageId;
  fsmStages: FSMStage[];
  verified: boolean;
  overridden: boolean;
  overrideReason?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  nodeId: string;
  eventType: string;
  description: string;
  sha256Hash: string;
  privacyVerified: boolean;
}

export interface EdgeNodeStatus {
  id: string;
  name: string;
  location: string;
  type: 'Raspberry Pi Mesh' | '60GHz Radar Node' | '5.8GHz CSI Transceiver' | 'Apple Watch Sync';
  status: 'online' | 'degraded' | 'offline';
  cpuLoadPercent: number;
  tempCelsius: number;
  ramPercent: number;
  latencyMs: number;
  batteryPercent?: number;
}

export interface DeteriorationDataPoint {
  roomNumber: string;
  patientName: string;
  riskScore: number; // 0 - 100
  severity: 'low' | 'moderate' | 'high' | 'severe';
  trend: 'stable' | 'increasing' | 'critical';
}
