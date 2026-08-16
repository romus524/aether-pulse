import { Floor } from '../types';

const NOW = Date.now();

export const INITIAL_FLOORS: Floor[] = [
  {
    id: 'ward-4b',
    name: 'WARD 4B (ACUTE NEURO)',
    shortName: 'WARD 4B',
    roomCount: 5,
    criticalCount: 1,
    description: 'Acute Neurology Unit & Continuous Non-Invasive Fall Radar Monitored Ward',
    dimensions: { width: 1000, height: 600 },
    elements: [
      { id: 'hall-4b', type: 'hallway', label: 'ACUTE NEURO CORRIDOR', x: 50, y: 260, width: 900, height: 60 },
      { id: 'ns-4b', type: 'nurse_station', label: 'CENTRAL NURSING COMMAND 4-B', x: 380, y: 180, width: 240, height: 70 },
      { id: 'elev-4b', type: 'elevator', label: 'MAIN ELEVATOR', x: 450, y: 50, width: 100, height: 70 },
      { id: 'stair-4b', type: 'stair', label: 'STAIR A', x: 60, y: 50, width: 70, height: 70 },
      { id: 'util-4b', type: 'utility', label: 'RADAR SENSING HUB', x: 870, y: 50, width: 70, height: 70 },
    ],
    rooms: [
      {
        id: 'room-101',
        floorId: 'ward-4b',
        roomNumber: '101',
        bedNumber: '101-A',
        patient: {
          name: 'Eleanor Vance',
          age: 78,
          gender: 'Female',
          mrn: 'MRN-884920',
          diagnosis: 'Acute Ischemic Stroke / Left Ataxia',
          physician: 'Dr. Evelyn Reed, MD',
          admissionDate: '2026-08-07'
        },
        status: 'normal',
        enteredStateAt: NOW - 2800000,
        position: { x: 80, y: 130, width: 130, height: 110 },
        bedPosition: { x: 100, y: 150 },
        doorPosition: { x: 140, y: 240 },
        movement: 'RESTING SUPINE IN BED',
        confidence: 98.4,
        edgeNode: 'EDGE-101',
        fallRiskScore: 18,
        heartRate: 72,
        respirationRate: 16,
        lastEvent: '15 mins ago'
      },
      {
        id: 'room-102',
        floorId: 'ward-4b',
        roomNumber: '102',
        bedNumber: '102-A',
        patient: {
          name: 'Arthur Pendelton',
          age: 82,
          gender: 'Male',
          mrn: 'MRN-902114',
          diagnosis: "Advanced Parkinson's / Orthostatic Hypotension",
          physician: 'Dr. Marcus Vance, MD',
          admissionDate: '2026-08-08'
        },
        status: 'warning',
        enteredStateAt: NOW - 210000,
        position: { x: 230, y: 130, width: 130, height: 110 },
        bedPosition: { x: 250, y: 150 },
        doorPosition: { x: 290, y: 240 },
        movement: 'PRE-EXIT: SITTING ON BED EDGE',
        confidence: 93.8,
        edgeNode: 'EDGE-102',
        fallRiskScore: 22,
        heartRate: 98,
        respirationRate: 22,
        lastEvent: '3 mins ago'
      },
      {
        id: 'room-103',
        floorId: 'ward-4b',
        roomNumber: '103',
        bedNumber: '103-B',
        patient: {
          name: 'Sarah Jenkins',
          age: 64,
          gender: 'Female',
          mrn: 'MRN-773109',
          diagnosis: 'Post-Op Craniotomy / TBI Monitoring',
          physician: 'Dr. Sarah Al-Mansoor, MD',
          admissionDate: '2026-08-09'
        },
        status: 'normal',
        enteredStateAt: NOW - 5400000,
        position: { x: 790, y: 130, width: 130, height: 110 },
        bedPosition: { x: 810, y: 150 },
        doorPosition: { x: 850, y: 240 },
        movement: 'RESTING ELEVATED 30°',
        confidence: 99.2,
        edgeNode: 'EDGE-103',
        fallRiskScore: 12,
        heartRate: 68,
        respirationRate: 14,
        lastEvent: '1 hour ago'
      },
      {
        id: 'room-104',
        floorId: 'ward-4b',
        roomNumber: '104',
        bedNumber: '104-A',
        patient: {
          name: 'Marcus Thorne',
          age: 79,
          gender: 'Male',
          mrn: 'MRN-661204',
          diagnosis: 'Normal Pressure Hydrocephalus / Gait Instability',
          physician: 'Dr. Evelyn Reed, MD',
          admissionDate: '2026-08-06'
        },
        status: 'critical',
        enteredStateAt: NOW - 38000,
        position: { x: 180, y: 350, width: 150, height: 120 },
        bedPosition: { x: 200, y: 370 },
        doorPosition: { x: 240, y: 350 },
        movement: 'CRITICAL: BED → FLOOR (RAPID FALL)',
        confidence: 98.7,
        edgeNode: 'EDGE-104',
        fallRiskScore: 24,
        heartRate: 114,
        respirationRate: 28,
        lastEvent: '38 secs ago (P1 ALERT)'
      },
      {
        id: 'room-105',
        floorId: 'ward-4b',
        roomNumber: '105',
        bedNumber: '105-A',
        patient: {
          name: 'Florence Chen',
          age: 85,
          gender: 'Female',
          mrn: 'MRN-559102',
          diagnosis: 'Dementia with Lewy Bodies / Nocturnal Wandering',
          physician: 'Dr. Marcus Vance, MD',
          admissionDate: '2026-08-05'
        },
        status: 'normal',
        enteredStateAt: NOW - 1200000,
        position: { x: 670, y: 350, width: 150, height: 120 },
        bedPosition: { x: 690, y: 370 },
        doorPosition: { x: 730, y: 350 },
        movement: 'RESTING SUPINE IN BED',
        confidence: 99.0,
        edgeNode: 'EDGE-105',
        fallRiskScore: 20,
        heartRate: 74,
        respirationRate: 17,
        lastEvent: '20 mins ago'
      }
    ]
  }
];
