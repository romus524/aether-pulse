import { PatientRecord, AuditLogEntry, EdgeNodeStatus, DeteriorationDataPoint, FSMStage } from '../types';

export const INITIAL_PATIENTS: PatientRecord[] = [
  {
    id: 'room-101',
    roomNumber: '101',
    bedNumber: '101-A',
    name: 'Eleanor Vance',
    age: 78,
    gender: 'Female',
    mrn: 'MRN-884920',
    diagnosis: 'Acute Ischemic Stroke / Left Ataxia',
    physician: 'Dr. Evelyn Reed, MD',
    admissionDate: '2026-08-07',
    fallRiskScore: 18,
    status: 'normal',
    posture: 'bed',
    postureDescription: 'Resting Supine in Bed',
    heartRate: 72,
    respirationRate: 16,
    hrv: 42,
    signalQuality: -38,
    movementIndex: 12,
    lastMovement: '2 mins ago',
    wifiDopplerRate: 1.2
  },
  {
    id: 'room-102',
    roomNumber: '102',
    bedNumber: '102-A',
    name: 'Arthur Pendelton',
    age: 82,
    gender: 'Male',
    mrn: 'MRN-902114',
    diagnosis: 'Advanced Parkinson\'s / Orthostatic Hypotension',
    physician: 'Dr. Marcus Vance, MD',
    admissionDate: '2026-08-08',
    fallRiskScore: 22,
    status: 'warning',
    posture: 'sitting',
    postureDescription: 'Pre-Exit: Sitting on Edge of Bed',
    heartRate: 98,
    respirationRate: 22,
    hrv: 28,
    signalQuality: -41,
    movementIndex: 68,
    lastMovement: '10 secs ago',
    wifiDopplerRate: 4.8
  },
  {
    id: 'room-103',
    roomNumber: '103',
    bedNumber: '103-B',
    name: 'Sarah Jenkins',
    age: 64,
    gender: 'Female',
    mrn: 'MRN-773109',
    diagnosis: 'Post-Op Craniotomy / TBI Monitoring',
    physician: 'Dr. Sarah Al-Mansoor, MD',
    admissionDate: '2026-08-09',
    fallRiskScore: 12,
    status: 'normal',
    posture: 'bed',
    postureDescription: 'Resting Elevated 30°',
    heartRate: 68,
    respirationRate: 14,
    hrv: 48,
    signalQuality: -35,
    movementIndex: 8,
    lastMovement: '5 mins ago',
    wifiDopplerRate: 0.8
  },
  {
    id: 'room-104',
    roomNumber: '104',
    bedNumber: '104-A',
    name: 'Marcus Thorne',
    age: 79,
    gender: 'Male',
    mrn: 'MRN-661204',
    diagnosis: 'Normal Pressure Hydrocephalus / Gait Instability',
    physician: 'Dr. Evelyn Reed, MD',
    admissionDate: '2026-08-06',
    fallRiskScore: 24,
    status: 'critical',
    posture: 'fallen',
    postureDescription: 'CRITICAL: Rapid Fall Detected - Floor Position',
    heartRate: 114,
    respirationRate: 28,
    hrv: 18,
    signalQuality: -44,
    movementIndex: 89,
    lastMovement: 'JUST NOW (P1 ALERT)',
    wifiDopplerRate: 14.2
  },
  {
    id: 'room-105',
    roomNumber: '105',
    bedNumber: '105-A',
    name: 'Florence Chen',
    age: 85,
    gender: 'Female',
    mrn: 'MRN-559102',
    diagnosis: 'Dementia with Lewy Bodies / Nocturnal Wandering',
    physician: 'Dr. Marcus Vance, MD',
    admissionDate: '2026-08-05',
    fallRiskScore: 20,
    status: 'normal',
    posture: 'bed',
    postureDescription: 'Resting Supine in Bed',
    heartRate: 74,
    respirationRate: 17,
    hrv: 39,
    signalQuality: -36,
    movementIndex: 14,
    lastMovement: '1 min ago',
    wifiDopplerRate: 1.1
  }
];

export const INITIAL_FSM_STAGES: FSMStage[] = [
  {
    id: 1,
    name: 'RAPID DESCENT',
    code: 'FSM_NODE_01_DESCENT',
    description: 'Doppler velocity threshold exceeded (>2.4 m/s downward vector)',
    threshold: 'Velocity > 2.4 m/s | CSI Phase Delta > 3.2 rad',
    status: 'passed',
    timestamp: '12:48:42',
    value: '3.82 m/s'
  },
  {
    id: 2,
    name: 'IMPACT SHOCK',
    code: 'FSM_NODE_02_IMPACT',
    description: 'High kinetic pulse deceleration spike registered at floor elevation',
    threshold: 'Deceleration > 3.8g | Wi-Fi Signal Scatter Peak',
    status: 'passed',
    timestamp: '12:48:43',
    value: '4.65g'
  },
  {
    id: 3,
    name: 'GROUND IMMOBILITY',
    code: 'FSM_NODE_03_IMMOBILE',
    description: 'Micro-Doppler respiration-only state detected at height z < 0.3m',
    threshold: 'Zero gross motion for > 4.0s | Height < 0.3m',
    status: 'passed',
    timestamp: '12:48:47',
    value: '5.2s motionless'
  },
  {
    id: 4,
    name: 'ALERT VERIFIED',
    code: 'FSM_NODE_04_CRITICAL',
    description: 'P1 Emergency Fall Event dispatched to Neuro Acute Nursing Station',
    threshold: 'Consensus 3/3 Radar Nodes + Edge AI v4.2',
    status: 'active',
    timestamp: '12:48:48',
    value: 'VERIFIED - P1 ESCALATION'
  }
];

export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-001',
    timestamp: '12:49:12',
    nodeId: 'NODE-RM104-PI5',
    eventType: 'RADAR_EVENT_P1_FALL',
    description: 'P1 Fall triggered in Room 104. Wi-Fi CSI phase shift 14.2Hz.',
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    privacyVerified: true
  },
  {
    id: 'log-002',
    timestamp: '12:48:58',
    nodeId: 'NODE-RM102-PI5',
    eventType: 'PRE_EXIT_WARNING',
    description: 'Bed edge proximity threshold reached. Micro-Doppler kinetic delta +42%.',
    sha256Hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    privacyVerified: true
  },
  {
    id: 'log-003',
    timestamp: '12:48:30',
    nodeId: 'NODE-CORE-MESH',
    eventType: 'CRYPT_PRIVACY_AUDIT',
    description: 'Zero optical camera verification pass. Non-PII RF doppler frame validated.',
    sha256Hash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
    privacyVerified: true
  },
  {
    id: 'log-004',
    timestamp: '12:47:15',
    nodeId: 'NODE-RM107-PI5',
    eventType: 'POSTURE_TRANSITION',
    description: 'Patient posture changed Bed -> Standing. Respiration elevated to 24 BPM.',
    sha256Hash: '7c222fb2927d828af22f592134e8932480637c0d6288b8529272338a08c3d312',
    privacyVerified: true
  },
  {
    id: 'log-005',
    timestamp: '12:45:02',
    nodeId: 'NODE-GATEWAY-ALPHA',
    eventType: 'BLE_WEARABLE_SYNC',
    description: 'Apple Watch Ultra #8841 biometric sync confirmed. HR delta < 1.2 BPM.',
    sha256Hash: '4355a46b19d348dc2f57c046f8eb63d4538beb274d30ad70aa97e5b6436528d4',
    privacyVerified: true
  }
];

export const MOCK_EDGE_NODES: EdgeNodeStatus[] = [
  {
    id: 'edge-01',
    name: 'RM-101-104 Radar Mesh Core',
    location: 'North Ward Corridor',
    type: 'Raspberry Pi Mesh',
    status: 'online',
    cpuLoadPercent: 32,
    tempCelsius: 41,
    ramPercent: 44,
    latencyMs: 12
  },
  {
    id: 'edge-02',
    name: 'RM-105-108 Radar Mesh Hub',
    location: 'South Ward Corridor',
    type: 'Raspberry Pi Mesh',
    status: 'online',
    cpuLoadPercent: 28,
    tempCelsius: 39,
    ramPercent: 41,
    latencyMs: 11
  },
  {
    id: 'edge-03',
    name: '60GHz mmWave Array #04',
    location: 'Room 104 Ceiling Grid',
    type: '60GHz Radar Node',
    status: 'online',
    cpuLoadPercent: 54,
    tempCelsius: 46,
    ramPercent: 62,
    latencyMs: 8
  },
  {
    id: 'edge-04',
    name: '5.8GHz CSI Wi-Fi Engine',
    location: 'Acute Neuro Gateway',
    type: '5.8GHz CSI Transceiver',
    status: 'online',
    cpuLoadPercent: 42,
    tempCelsius: 43,
    ramPercent: 50,
    latencyMs: 14
  },
  {
    id: 'edge-05',
    name: 'Apple Watch Bio-Bridge',
    location: 'Ward Bluetooth Receiver',
    type: 'Apple Watch Sync',
    status: 'online',
    cpuLoadPercent: 18,
    tempCelsius: 36,
    ramPercent: 28,
    latencyMs: 19,
    batteryPercent: 94
  }
];

export const MOCK_DETERIORATION_DATA: DeteriorationDataPoint[] = [
  { roomNumber: '101', patientName: 'Eleanor Vance', riskScore: 18, severity: 'low', trend: 'stable' },
  { roomNumber: '102', patientName: 'Arthur Pendelton', riskScore: 68, severity: 'high', trend: 'increasing' },
  { roomNumber: '103', patientName: 'Sarah Jenkins', riskScore: 12, severity: 'low', trend: 'stable' },
  { roomNumber: '104', patientName: 'Marcus Thorne', riskScore: 94, severity: 'severe', trend: 'critical' },
  { roomNumber: '105', patientName: 'Florence Chen', riskScore: 24, severity: 'low', trend: 'stable' }
];
