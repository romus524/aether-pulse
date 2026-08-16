import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Eye, 
  Radio, 
  Flame, 
  ShieldAlert, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  Gauge,
  Video,
  Clock,
  Sparkles,
  Zap,
  Wifi,
  User,
  Heart,
  Wind,
  Compass,
  ArrowDownRight,
  Maximize2
} from 'lucide-react';
import { PatientRecord } from '../types';

export type EventScenarioId = 'fall-104' | 'pre-exit-102' | 'wandering-105' | 'apnea-103' | 'syncope-101';

export interface KeyframeEvent {
  time: number;
  label: string;
  type: 'baseline' | 'warning' | 'critical' | 'impact' | 'immobility';
  description: string;
  riskValue: string;
}

export interface EventScenario {
  id: EventScenarioId;
  roomId: string;
  roomNumber: string;
  patientName: string;
  age: number;
  gender: string;
  mrn: string;
  diagnosis: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  durationSeconds: number;
  impactTime: number; // in seconds
  peakGForce: string;
  descentVelocity: string;
  description: string;
  clinicalNote: string;
  keyframes: KeyframeEvent[];
  factors: string[];
}

export const EVENT_SCENARIOS: Record<EventScenarioId, EventScenario> = {
  'fall-104': {
    id: 'fall-104',
    roomId: 'room-104',
    roomNumber: '104',
    patientName: 'Marcus Thorne',
    age: 82,
    gender: 'Male',
    mrn: 'MRN-991204',
    diagnosis: 'Post-Op Hip Arthroplasty · Severe Delirium',
    title: 'P1 Rapid Descent & Floor Impact Fall',
    severity: 'critical',
    durationSeconds: 8,
    impactTime: 3.8,
    peakGForce: '4.65g',
    descentVelocity: '3.82 m/s',
    description: 'Patient attempts unassisted bedside standing, loses balance at T+3.2s, experiences rapid downward kinetic plunge to the left bedside floor, impact at T+3.8s, followed by ground immobility.',
    clinicalNote: 'Immediate neuro team dispatch recommended. Risk of subdural hematoma or hip contusion.',
    factors: ['Severe Gait Instability', 'Ground Immobility Detected', 'High Micro-Doppler Shock', 'Unassisted Weight-Bearing'],
    keyframes: [
      { time: 0.0, label: 'Supine Baseline', type: 'baseline', description: 'Patient resting supine in bed, nominal vital telemetry', riskValue: '18%' },
      { time: 2.5, label: 'Pre-Exit Bed Edge', type: 'warning', description: 'Legs swing over mattress boundary, posture angle 88°', riskValue: '62%' },
      { time: 3.4, label: 'Kinetic Plunge', type: 'critical', description: 'Center-of-gravity collapse, rapid descent vector', riskValue: '89%' },
      { time: 3.8, label: 'Floor Impact (4.65g)', type: 'impact', description: 'High G-force kinetic shock registered on bedside floor', riskValue: '99.4%' },
      { time: 5.0, label: 'Ground Immobility', type: 'immobility', description: 'Zero upright recovery motion, persistent prone posture', riskValue: '99.4%' },
    ],
  },
  'pre-exit-102': {
    id: 'pre-exit-102',
    roomId: 'room-102',
    roomNumber: '102',
    patientName: 'Arthur Pendelton',
    age: 79,
    gender: 'Male',
    mrn: 'MRN-773412',
    diagnosis: 'Parkinsonian Gait · Fall Hazard High',
    title: 'Pre-Exit Bed Edge Sit & Posture Shift',
    severity: 'warning',
    durationSeconds: 7,
    impactTime: 2.5,
    peakGForce: '0.82g',
    descentVelocity: '0.94 m/s',
    description: 'Patient shifts from resting supine to 90° bed edge sit, swinging lower limbs over mattress boundary into unassisted fall hazard zone.',
    clinicalNote: 'Nurse intervention requested before patient attempts unassisted weight-bearing.',
    factors: ['Pre-Exit Motion Vector', 'Orthostatic Posture Shift', 'Bed Boundary Egress'],
    keyframes: [
      { time: 0.0, label: 'Supine Rest', type: 'baseline', description: 'Resting in bed, steady breathing', riskValue: '22%' },
      { time: 1.8, label: 'Torso Elevation', type: 'warning', description: 'Rapid trunk rotation towards bed egress rail', riskValue: '54%' },
      { time: 3.2, label: 'Edge Sit 90°', type: 'warning', description: 'Lower extremities over edge, ready for stand attempt', riskValue: '68%' },
      { time: 5.5, label: 'Pre-Exit Watch', type: 'warning', description: 'Stationary on bed perimeter awaiting nurse', riskValue: '70%' },
    ],
  },
  'wandering-105': {
    id: 'wandering-105',
    roomId: 'room-105',
    roomNumber: '105',
    patientName: 'Florence Chen',
    age: 84,
    gender: 'Female',
    mrn: 'MRN-552910',
    diagnosis: 'Advanced Vascular Dementia',
    title: 'Nocturnal Bed Exit & Disorientation Wandering',
    severity: 'warning',
    durationSeconds: 9,
    impactTime: 4.0,
    peakGForce: '0.45g',
    descentVelocity: '0.62 m/s',
    description: 'Patient exits bed quietly, moves in wandering zigzag trajectory towards room door with irregular gait posture.',
    clinicalNote: 'Dementia protocol: staff to redirect patient back to bed safely.',
    factors: ['Nocturnal Room Egress', 'Irregular Gait Velocity', 'Disoriented Trajectory'],
    keyframes: [
      { time: 0.0, label: 'Bed Resting', type: 'baseline', description: 'In-bed resting state', riskValue: '15%' },
      { time: 2.0, label: 'Bed Egress', type: 'warning', description: 'Silent unassisted standing', riskValue: '48%' },
      { time: 4.2, label: 'Zigzag Ambulation', type: 'warning', description: 'Erratic pacing towards room doorway', riskValue: '64%' },
      { time: 7.0, label: 'Doorway Perimeter', type: 'warning', description: 'Approaching room exit portal', riskValue: '68%' },
    ],
  },
  'apnea-103': {
    id: 'apnea-103',
    roomId: 'room-103',
    roomNumber: '103',
    patientName: 'Sarah Jenkins',
    age: 71,
    gender: 'Female',
    mrn: 'MRN-338192',
    diagnosis: 'Severe CHF · Central Sleep Apnea',
    title: 'Central Apnea / Respiration Cessation',
    severity: 'critical',
    durationSeconds: 8,
    impactTime: 2.8,
    peakGForce: '0.02g',
    descentVelocity: '0.05 m/s',
    description: 'Wi-Fi micro-Doppler registers sudden cessation of diaphragmatic chest displacements (<2 breaths/min) in supine position.',
    clinicalNote: 'Immediate airway assessment required. Check SpO2 and ventilator sync.',
    factors: ['Chest Displacement Cessation', 'Micro-Doppler Flatline', 'Bradycardia Correlation'],
    keyframes: [
      { time: 0.0, label: 'Normal Breathing', type: 'baseline', description: 'RPM 16, normal chest excursions', riskValue: '12%' },
      { time: 2.5, label: 'Diaphragm Slowdown', type: 'warning', description: 'Chest displacement rate drops by 75%', riskValue: '58%' },
      { time: 4.0, label: 'Apneic Flatline', type: 'critical', description: 'Zero respiratory micro-Doppler detected for >10s', riskValue: '96%' },
      { time: 6.5, label: 'Critical Airway Alert', type: 'critical', description: 'P1 Respiratory arrest protocol triggered', riskValue: '98%' },
    ],
  },
  'syncope-101': {
    id: 'syncope-101',
    roomId: 'room-101',
    roomNumber: '101',
    patientName: 'Eleanor Vance',
    age: 78,
    gender: 'Female',
    mrn: 'MRN-884920',
    diagnosis: 'Acute Ischemic Stroke · Orthostatic Syncope',
    title: 'Orthostatic Syncope / Collapse near Recliner',
    severity: 'critical',
    durationSeconds: 8,
    impactTime: 4.2,
    peakGForce: '3.90g',
    descentVelocity: '3.10 m/s',
    description: 'Patient experiences transient loss of consciousness while transferring from chair to bed, crumpling downwards at T+4.0s.',
    clinicalNote: 'Check blood pressure, EKG telemetry, and cranial status.',
    factors: ['Sudden Tone Loss', 'Plunge Trajectory', 'Post-Collapse Immobility'],
    keyframes: [
      { time: 0.0, label: 'Chair Seated', type: 'baseline', description: 'Stable chair sitting posture', riskValue: '14%' },
      { time: 2.2, label: 'Transfer Stand', type: 'warning', description: 'Weight-bearing transfer attempt', riskValue: '45%' },
      { time: 3.8, label: 'Syncopal Collapse', type: 'critical', description: 'Sudden loss of postural muscle tone', riskValue: '88%' },
      { time: 4.2, label: 'Floor Impact (3.90g)', type: 'impact', description: 'Impact on floor adjacent to recliner', riskValue: '97%' },
    ],
  }
};

interface SimulatedEventVideoFeedProps {
  scenarioId?: EventScenarioId;
  patient?: PatientRecord;
  compact?: boolean;
  autoPlay?: boolean;
  onEventTriggered?: (scenario: EventScenario) => void;
}

// Helper for safe cross-browser rounded rectangle drawing (prevents crash on browsers without CanvasRenderingContext2D.roundRect)
const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    const radius = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.lineTo(x + radius, y + h);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }
};

export const SimulatedEventVideoFeed: React.FC<SimulatedEventVideoFeedProps> = ({
  scenarioId = 'fall-104',
  patient,
  compact = false,
  autoPlay = true,
  onEventTriggered,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<EventScenarioId>(scenarioId);
  
  // Sync if prop changes
  useEffect(() => {
    if (scenarioId) setSelectedScenarioId(scenarioId);
  }, [scenarioId]);

  const scenario = EVENT_SCENARIOS[selectedScenarioId] || EVENT_SCENARIOS['fall-104'];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'optical' | 'thermal' | 'doppler'>('optical');
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showBoundingBox, setShowBoundingBox] = useState(true);
  const [showCSIWaves, setShowCSIWaves] = useState(true);
  const [showMotionTrail, setShowMotionTrail] = useState(true);
  const [hoveredKeyframe, setHoveredKeyframe] = useState<KeyframeEvent | null>(null);

  // History buffer for motion trail rendering
  const motionHistoryRef = useRef<Array<{ x: number; y: number; time: number; alpha: number }>>([]);

  // Animation frame loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp = performance.now();

    const updatePlayhead = (now: number) => {
      const delta = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + delta * playbackSpeed;
          if (next >= scenario.durationSeconds) {
            return 0; // Loop seamlessly
          }
          return next;
        });
      }

      animationFrameId = requestAnimationFrame(updatePlayhead);
    };

    animationFrameId = requestAnimationFrame(updatePlayhead);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, playbackSpeed, scenario.durationSeconds]);

  // Render video / 3D spatial motion frame on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const t = currentTime;
    const duration = scenario.durationSeconds;
    const progress = t / duration; // 0 to 1

    // -------------------------------------------------------------
    // 1. HOSPITAL ROOM ENVIRONMENT & ARCHITECTURE
    // -------------------------------------------------------------
    if (viewMode === 'thermal') {
      // Thermal false-color clinical room
      ctx.fillStyle = '#050314';
      ctx.fillRect(0, 0, width, height);

      // Thermal floor grid with subtle depth
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.12)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, height * 0.42);
        ctx.lineTo(x * 1.5 - width * 0.25, height);
        ctx.stroke();
      }
    } else if (viewMode === 'doppler') {
      // Doppler Radar Space
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Concentric Radar Range Rings
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.lineWidth = 1;
      for (let r = 40; r < width; r += 45) {
        ctx.beginPath();
        ctx.arc(width * 0.5, height * 0.1, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      // Optical Hospital Room (Cinematic Clinical Lighting)
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#060913');
      grad.addColorStop(0.42, '#0c1322');
      grad.addColorStop(1, '#05070f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Soft Overhead Spotlight Cone
      const spotGrad = ctx.createRadialGradient(width * 0.48, height * 0.25, 20, width * 0.48, height * 0.45, width * 0.55);
      spotGrad.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
      spotGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.04)');
      spotGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = spotGrad;
      ctx.fillRect(0, 0, width, height);

      // Wall / Floor Horizon Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.42);
      ctx.lineTo(width, height * 0.42);
      ctx.stroke();

      // Clinical Floor Tiles with 3D Depth
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      for (let x = -width * 0.2; x < width * 1.4; x += 45) {
        ctx.beginPath();
        ctx.moveTo(x, height * 0.42);
        ctx.lineTo(x * 2.1 - width * 0.55, height);
        ctx.stroke();
      }
      for (let y = height * 0.42; y < height; y += (height - y) * 0.28 + 12) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // -------------------------------------------------------------
    // 2. DETAILED HOSPITAL BED & CLINICAL HARDWARE
    // -------------------------------------------------------------
    try {
      const bedX = width * 0.26;
      const bedY = height * 0.36;
      const bedW = width * 0.46;
      const bedH = height * 0.28;

      // Bed Soft Drop Shadow on Floor
      const shadowGrad = ctx.createRadialGradient(bedX + bedW * 0.5, bedY + bedH + 10, 20, bedX + bedW * 0.5, bedY + bedH + 10, bedW * 0.6);
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
      shadowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(bedX - 20, bedY + bedH - 10, bedW + 40, 40);

      // Bed Frame Base
      ctx.fillStyle = viewMode === 'thermal' ? '#1c1538' : '#141d2e';
      ctx.strokeStyle = viewMode === 'thermal' ? '#3b2d70' : '#2a3a55';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      drawRoundedRect(ctx, bedX, bedY, bedW, bedH, 8);
      ctx.fill();
      ctx.stroke();

      // Mattress Surface with Clinical Bevel
      ctx.fillStyle = viewMode === 'thermal' ? '#291d4e' : '#1e2c42';
      ctx.beginPath();
      drawRoundedRect(ctx, bedX + 8, bedY + 8, bedW - 16, bedH - 16, 6);
      ctx.fill();

      // Pillow with Specular Highlight
      ctx.fillStyle = viewMode === 'thermal' ? '#3d2b70' : '#334766';
      ctx.beginPath();
      drawRoundedRect(ctx, bedX + 16, bedY + 14, 44, bedH - 28, 4);
      ctx.fill();

    // Bed Safety Rails (Subtle Stainless Geometry)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(bedX + 10, bedY - 6, bedW - 20, 6);

    // Bedside Table & Telemetry Monitor
    const tableX = bedX - 42;
    const tableY = bedY + 12;
    ctx.fillStyle = '#182234';
    ctx.fillRect(tableX, tableY, 28, 48);
    ctx.strokeStyle = '#2d3f5e';
    ctx.strokeRect(tableX, tableY, 28, 48);

    // Small glowing bedside monitor screen
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(tableX + 4, tableY + 6, 20, 16);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(tableX + 6, tableY + 12, 16, 2);

    // Stainless IV Stand & Infusion Bag
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bedX - 28, bedY + 12);
    ctx.lineTo(bedX - 28, bedY - 55);
    ctx.moveTo(bedX - 38, bedY - 50);
    ctx.lineTo(bedX - 18, bedY - 50);
    ctx.stroke();
    // IV Bag
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.fillRect(bedX - 36, bedY - 48, 8, 14);

    // -------------------------------------------------------------
    // 3. CSI RF SENSING NODE & PROPAGATION WAVES
    // -------------------------------------------------------------
    const csiNodeX = width * 0.85;
    const csiNodeY = height * 0.15;

    // CSI Node Hardware
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(csiNodeX, csiNodeY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (showCSIWaves) {
      for (let i = 0; i < 3; i++) {
        const waveR = ((t * 60 + i * 50) % 180);
        const waveAlpha = Math.max(0, 0.25 - waveR / 180 * 0.25);
        ctx.strokeStyle = `rgba(6, 182, 212, ${waveAlpha})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(csiNodeX, csiNodeY, waveR, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // -------------------------------------------------------------
    // 4. KINEMATIC TRAJECTORY COMPUTATION
    // -------------------------------------------------------------
    let headX = 0, headY = 0;
    let chestX = 0, chestY = 0;
    let hipsX = 0, hipsY = 0;
    let leftKneeX = 0, leftKneeY = 0;
    let rightKneeX = 0, rightKneeY = 0;
    let leftFootX = 0, leftFootY = 0;
    let rightFootX = 0, rightFootY = 0;
    let leftHandX = 0, leftHandY = 0;
    let rightHandX = 0, rightHandY = 0;

    let isFallen = false;
    let isWarning = false;
    let kineticShock = 0;

    if (scenario.id === 'fall-104') {
      // MARCUS THORNE P1 FALL
      if (t < 2.5) {
        // In bed resting supine
        headX = bedX + 50; headY = bedY + bedH * 0.45;
        chestX = bedX + 95; chestY = bedY + bedH * 0.45;
        hipsX = bedX + 145; hipsY = bedY + bedH * 0.45;
        leftKneeX = bedX + 180; leftKneeY = bedY + bedH * 0.40;
        rightKneeX = bedX + 180; rightKneeY = bedY + bedH * 0.50;
        leftFootX = bedX + 215; leftFootY = bedY + bedH * 0.40;
        rightFootX = bedX + 215; rightFootY = bedY + bedH * 0.50;
        leftHandX = bedX + 90; leftHandY = bedY + bedH * 0.30;
        rightHandX = bedX + 90; rightHandY = bedY + bedH * 0.60;
      } else if (t < 3.4) {
        // Pre-exit edge sit
        isWarning = true;
        const sub = (t - 2.5) / 0.9;
        headX = bedX + 105; headY = bedY + bedH * 0.25 - sub * 25;
        chestX = bedX + 105; chestY = bedY + bedH * 0.45;
        hipsX = bedX + 105; hipsY = bedY + bedH * 0.70;
        leftKneeX = bedX + 95; leftKneeY = bedY + bedH * 0.95;
        rightKneeX = bedX + 115; rightKneeY = bedY + bedH * 0.95;
        leftFootX = bedX + 95; leftFootY = bedY + bedH * 1.15;
        rightFootX = bedX + 115; rightFootY = bedY + bedH * 1.15;
        leftHandX = bedX + 80; leftHandY = bedY + bedH * 0.60;
        rightHandX = bedX + 130; rightHandY = bedY + bedH * 0.60;
      } else if (t < 3.9) {
        // Rapid fall plunge
        isFallen = true;
        const sub = (t - 3.4) / 0.5;
        kineticShock = Math.sin(sub * Math.PI) * 1.5;
        headX = bedX + 105 - sub * 45; headY = bedY + bedH * 0.25 + sub * 125;
        chestX = bedX + 105 - sub * 25; chestY = bedY + bedH * 0.50 + sub * 105;
        hipsX = bedX + 105 + sub * 10; hipsY = bedY + bedH * 0.70 + sub * 80;
        leftKneeX = bedX + 85; leftKneeY = bedY + bedH * 1.0 + sub * 45;
        rightKneeX = bedX + 125; rightKneeY = bedY + bedH * 1.0 + sub * 35;
        leftFootX = bedX + 75; leftFootY = bedY + bedH * 1.2 + sub * 25;
        rightFootX = bedX + 135; rightFootY = bedY + bedH * 1.2 + sub * 25;
        leftHandX = bedX + 55 - sub * 20; leftHandY = bedY + bedH * 0.8 + sub * 65;
        rightHandX = bedX + 145; rightHandY = bedY + bedH * 0.8 + sub * 45;
      } else {
        // Motionless on floor
        isFallen = true;
        headX = bedX + 55; headY = bedY + bedH + 85;
        chestX = bedX + 95; chestY = bedY + bedH + 75;
        hipsX = bedX + 145; hipsY = bedY + bedH + 65;
        leftKneeX = bedX + 175; leftKneeY = bedY + bedH + 75;
        rightKneeX = bedX + 180; rightKneeY = bedY + bedH + 60;
        leftFootX = bedX + 215; leftFootY = bedY + bedH + 80;
        rightFootX = bedX + 220; rightFootY = bedY + bedH + 65;
        leftHandX = bedX + 45; leftHandY = bedY + bedH + 70;
        rightHandX = bedX + 100; rightHandY = bedY + bedH + 95;
      }
    } else if (scenario.id === 'pre-exit-102') {
      const sub = Math.min(1, t / 4);
      isWarning = t > 2;
      headX = bedX + 60 + sub * 35; headY = bedY + bedH * 0.45 - sub * 40;
      chestX = bedX + 90 + sub * 15; chestY = bedY + bedH * 0.45 - sub * 10;
      hipsX = bedX + 130; hipsY = bedY + bedH * 0.50 + sub * 25;
      leftKneeX = bedX + 120; leftKneeY = bedY + bedH * 0.65 + sub * 40;
      rightKneeX = bedX + 140; rightKneeY = bedY + bedH * 0.65 + sub * 40;
      leftFootX = bedX + 120; leftFootY = bedY + bedH * 0.80 + sub * 50;
      rightFootX = bedX + 140; rightFootY = bedY + bedH * 0.80 + sub * 50;
      leftHandX = bedX + 75 + sub * 20; leftHandY = bedY + bedH * 0.60;
      rightHandX = bedX + 145; rightHandY = bedY + bedH * 0.60;
    } else {
      const breath = Math.sin(t * 2) * 2;
      headX = bedX + 50; headY = bedY + bedH * 0.45;
      chestX = bedX + 95; chestY = bedY + bedH * 0.45 + breath;
      hipsX = bedX + 145; hipsY = bedY + bedH * 0.45;
      leftKneeX = bedX + 180; leftKneeY = bedY + bedH * 0.40;
      rightKneeX = bedX + 180; rightKneeY = bedY + bedH * 0.50;
      leftFootX = bedX + 215; leftFootY = bedY + bedH * 0.40;
      rightFootX = bedX + 215; rightFootY = bedY + bedH * 0.50;
      leftHandX = bedX + 90; leftHandY = bedY + bedH * 0.30;
      rightHandX = bedX + 90; rightHandY = bedY + bedH * 0.60;
    }

    // -------------------------------------------------------------
    // 5. MOTION HISTORY TRAIL WITH TEMPORAL FADING
    // -------------------------------------------------------------
    if (showMotionTrail) {
      // Append current center-of-gravity to trail
      motionHistoryRef.current.push({ x: chestX, y: chestY, time: t, alpha: 1.0 });
      if (motionHistoryRef.current.length > 25) {
        motionHistoryRef.current.shift();
      }

      if (motionHistoryRef.current.length > 2) {
        ctx.beginPath();
        ctx.moveTo(motionHistoryRef.current[0].x, motionHistoryRef.current[0].y);
        for (let i = 1; i < motionHistoryRef.current.length; i++) {
          const pt = motionHistoryRef.current[i];
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = isFallen
          ? 'rgba(239, 68, 68, 0.4)'
          : isWarning
          ? 'rgba(245, 158, 11, 0.4)'
          : 'rgba(168, 85, 247, 0.35)';
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // -------------------------------------------------------------
    // 6. PATIENT SILHOUETTE & ANATOMICAL BODY
    // -------------------------------------------------------------
    if (viewMode === 'thermal') {
      const drawThermalLimb = (x1: number, y1: number, x2: number, y2: number, radius: number, tempColor: string) => {
        const grad = ctx.createRadialGradient(x1, y1, 2, x1, y1, radius * 2.5);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, tempColor);
        grad.addColorStop(0.7, '#a855f7');
        grad.addColorStop(1, 'transparent');

        ctx.strokeStyle = tempColor;
        ctx.lineWidth = radius * 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      };

      drawThermalLimb(headX, headY, chestX, chestY, 18, '#ff2255');
      drawThermalLimb(chestX, chestY, hipsX, hipsY, 22, '#ff6600');
      drawThermalLimb(hipsX, hipsY, leftKneeX, leftKneeY, 12, '#eab308');
      drawThermalLimb(leftKneeX, leftKneeY, leftFootX, leftFootY, 10, '#38bdf8');
      drawThermalLimb(hipsX, hipsY, rightKneeX, rightKneeY, 12, '#eab308');
      drawThermalLimb(rightKneeX, rightKneeY, rightFootX, rightFootY, 10, '#38bdf8');
      drawThermalLimb(chestX, chestY, leftHandX, leftHandY, 9, '#eab308');
      drawThermalLimb(chestX, chestY, rightHandX, rightHandY, 9, '#eab308');

      ctx.fillStyle = '#ff0055';
      ctx.beginPath();
      ctx.arc(headX, headY, 14, 0, Math.PI * 2);
      ctx.fill();
    } else if (viewMode === 'doppler') {
      const points = [
        { x: headX, y: headY },
        { x: chestX, y: chestY },
        { x: hipsX, y: hipsY },
        { x: leftKneeX, y: leftKneeY },
        { x: rightKneeX, y: rightKneeY },
        { x: leftFootX, y: leftFootY },
        { x: rightFootX, y: rightFootY },
        { x: leftHandX, y: leftHandY },
        { x: rightHandX, y: rightHandY }
      ];

      points.forEach((pt) => {
        for (let i = 0; i < 8; i++) {
          const rx = pt.x + (Math.random() - 0.5) * 26;
          const ry = pt.y + (Math.random() - 0.5) * 26;
          ctx.fillStyle = isFallen ? '#ef4444' : isWarning ? '#f59e0b' : '#38bdf8';
          ctx.beginPath();
          ctx.arc(rx, ry, Math.random() * 3 + 1, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    } else {
      // Optical Patient Silhouette
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(headX, headY);
      ctx.lineTo(chestX, chestY);
      ctx.lineTo(hipsX, hipsY);
      ctx.stroke();

      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(hipsX, hipsY);
      ctx.lineTo(leftKneeX, leftKneeY);
      ctx.lineTo(leftFootX, leftFootY);
      ctx.moveTo(hipsX, hipsY);
      ctx.lineTo(rightKneeX, rightKneeY);
      ctx.lineTo(rightFootX, rightFootY);
      ctx.stroke();

      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(chestX, chestY);
      ctx.lineTo(leftHandX, leftHandY);
      ctx.moveTo(chestX, chestY);
      ctx.lineTo(rightHandX, rightHandY);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(headX, headY, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // -------------------------------------------------------------
    // 7. AI SKELETON RECONSTRUCTION & KEYPOINT NODES
    // -------------------------------------------------------------
    if (showSkeleton) {
      const joints = [
        { x: headX, y: headY, name: 'NOSE' },
        { x: chestX, y: chestY, name: 'THORAX' },
        { x: hipsX, y: hipsY, name: 'PELVIS' },
        { x: leftHandX, y: leftHandY, name: 'L_WRIST' },
        { x: rightHandX, y: rightHandY, name: 'R_WRIST' },
        { x: leftKneeX, y: leftKneeY, name: 'L_KNEE' },
        { x: rightKneeX, y: rightKneeY, name: 'R_KNEE' },
        { x: leftFootX, y: leftFootY, name: 'L_ANKLE' },
        { x: rightFootX, y: rightFootY, name: 'R_ANKLE' }
      ];

      ctx.strokeStyle = isFallen ? '#ef4444' : isWarning ? '#f59e0b' : '#38bdf8';
      ctx.lineWidth = 2.5;

      const links = [
        [0, 1], [1, 2],
        [1, 3], [1, 4],
        [2, 5], [5, 7],
        [2, 6], [6, 8]
      ];

      links.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(joints[a].x, joints[a].y);
        ctx.lineTo(joints[b].x, joints[b].y);
        ctx.stroke();
      });

      joints.forEach((j) => {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(j.x, j.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isFallen ? '#ef4444' : isWarning ? '#f59e0b' : '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }

    // -------------------------------------------------------------
    // 8. REFINED SPATIAL DETECTION VOLUME (REPLACING HARSH RED BOX)
    // -------------------------------------------------------------
    if (showBoundingBox) {
      const allX = [headX, chestX, hipsX, leftFootX, rightFootX, leftHandX, rightHandX];
      const allY = [headY, chestY, hipsY, leftFootY, rightFootY, leftHandY, rightHandY];
      const minX = Math.min(...allX) - 18;
      const maxX = Math.max(...allX) + 18;
      const minY = Math.min(...allY) - 18;
      const maxY = Math.max(...allY) + 18;
      const boxW = maxX - minX;
      const boxH = maxY - minY;

      // Volumetric translucent surface
      ctx.fillStyle = isFallen
        ? 'rgba(239, 68, 68, 0.08)'
        : isWarning
        ? 'rgba(245, 158, 11, 0.06)'
        : 'rgba(56, 189, 248, 0.05)';
      ctx.beginPath();
      drawRoundedRect(ctx, minX, minY, boxW, Math.max(10, boxH), 8);
      ctx.fill();

      // Subtle Glowing Perimeter
      ctx.strokeStyle = isFallen
        ? 'rgba(239, 68, 68, 0.6)'
        : isWarning
        ? 'rgba(245, 158, 11, 0.5)'
        : 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Precision Corner Bracket Marks (L-shapes)
      const cornerSize = 10;
      ctx.strokeStyle = isFallen ? '#ef4444' : isWarning ? '#f59e0b' : '#38bdf8';
      ctx.lineWidth = 2;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(minX, minY + cornerSize);
      ctx.lineTo(minX, minY);
      ctx.lineTo(minX + cornerSize, minY);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(maxX - cornerSize, minY);
      ctx.lineTo(maxX, minY);
      ctx.lineTo(maxX, minY + cornerSize);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(minX, maxY - cornerSize);
      ctx.lineTo(minX, maxY);
      ctx.lineTo(minX + cornerSize, maxY);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(maxX - cornerSize, maxY);
      ctx.lineTo(maxX, maxY);
      ctx.lineTo(maxX, maxY - cornerSize);
      ctx.stroke();

      // Animated Vertical Scan Line inside detection volume
      const scanY = minY + ((t * 40) % Math.max(1, boxH));
      ctx.strokeStyle = isFallen
        ? 'rgba(239, 68, 68, 0.35)'
        : isWarning
        ? 'rgba(245, 158, 11, 0.3)'
        : 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(minX + 4, scanY);
      ctx.lineTo(maxX - 4, scanY);
      ctx.stroke();

      // Refined Glass Alert Badge directly above detection volume
      const badgeW = isFallen ? 165 : isWarning ? 155 : 140;
      const badgeH = 20;
      const badgeX = minX;
      const badgeY = minY - 24;

      ctx.fillStyle = isFallen
        ? 'rgba(153, 27, 27, 0.85)'
        : isWarning
        ? 'rgba(120, 53, 15, 0.85)'
        : 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 6);
      ctx.fill();
      ctx.strokeStyle = isFallen ? '#ef4444' : isWarning ? '#f59e0b' : '#38bdf8';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Alert Dot Indicator inside badge
      ctx.fillStyle = isFallen ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';
      ctx.beginPath();
      ctx.arc(badgeX + 10, badgeY + badgeH * 0.5, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Badge Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px "Space Grotesk", sans-serif';
      const labelText = isFallen
        ? 'CRITICAL FALL · 99.4% P1'
        : isWarning
        ? 'PRE-EXIT WATCH · 94.2%'
        : 'RESTING SUPINE · 98.9%';
      ctx.fillText(labelText, badgeX + 20, badgeY + 13.5);
    }

    // -------------------------------------------------------------
    // 9. KINETIC IMPACT SHOCKWAVE FLASH
    // -------------------------------------------------------------
    if (kineticShock > 0) {
      ctx.fillStyle = `rgba(239, 68, 68, ${kineticShock * 0.25})`;
      ctx.fillRect(0, 0, width, height);

      // Floor radial shockwave
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(headX + 35, headY, 50 * kineticShock, 0, Math.PI * 2);
      ctx.stroke();
    }

    // -------------------------------------------------------------
    // 10. CLEAN CLINICAL HUD WATERMARKS & TIMECODE
    // -------------------------------------------------------------
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '10px "Space Mono", monospace';
    const timestampStr = `REC 2026-08-15 ${new Date().toISOString().slice(11, 19)}.${Math.floor((t % 1) * 100)}`;
    ctx.fillText(timestampStr, 14, 22);

    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`CSI_RADAR_NODE: RM-${scenario.roomNumber}-A`, 14, 36);

    // Live Indicator Beacon
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(width - 55, 18, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px "Space Grotesk", sans-serif';
    ctx.fillText('LIVE REPLAY', width - 46, 21);
    } catch (err) {
      console.warn('SimulatedEventVideoFeed canvas rendering error:', err);
    }
  }, [currentTime, viewMode, showSkeleton, showBoundingBox, showCSIWaves, showMotionTrail, scenario]);

  return (
    <div
      id="clinical-motion-visualization-container"
      className="flex flex-col bg-slate-950/95 rounded-3xl overflow-hidden border border-white/10 shadow-2xl backdrop-blur-2xl transition-all duration-300"
    >
      {/* 1. Header Toolbar: Room Details & Mode Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-slate-900/90 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border flex items-center justify-center ${
            scenario.severity === 'critical'
              ? 'bg-red-950/80 border-red-500/60 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
              : 'bg-amber-950/80 border-amber-500/60 text-amber-300'
          }`}>
            <Video className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-sora font-extrabold text-white tracking-wide">
                ROOM {scenario.roomNumber} • SPATIAL INCIDENT RECONSTRUCTION
              </span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-tech font-bold uppercase ${
                scenario.severity === 'critical'
                  ? 'bg-red-950 text-red-300 border border-red-500/60 animate-pulse'
                  : 'bg-amber-950 text-amber-300 border border-amber-500/60'
              }`}>
                {scenario.severity.toUpperCase()}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-sora flex items-center gap-2 mt-0.5">
              <span>Patient: <strong className="text-slate-200">{scenario.patientName}</strong></span>
              <span>•</span>
              <span className="text-purple-300">{scenario.title}</span>
            </div>
          </div>
        </div>

        {/* View Mode & Multi-Spectral Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-2xl border border-white/10 text-[10px] font-sora">
          <button
            onClick={() => setViewMode('optical')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'optical' ? 'bg-purple-600 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>OPTICAL</span>
          </button>
          <button
            onClick={() => setViewMode('thermal')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'thermal' ? 'bg-pink-600 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span>THERMAL</span>
          </button>
          <button
            onClick={() => setViewMode('doppler')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'doppler' ? 'bg-cyan-600 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-cyan-200" />
            <span>DOPPLER</span>
          </button>
        </div>
      </div>

      {/* 2. Main 70/30 Composition: Left 3D Viewport + Right Clinical Intelligence Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-b border-white/10">
        {/* LEFT COLUMN: 3D Spatial Canvas (72% on lg screens) */}
        <div className="lg:col-span-8 xl:col-span-8 flex flex-col justify-center bg-black relative border-b lg:border-b-0 lg:border-r border-white/10">
          <div
            className="relative w-full aspect-video min-h-[260px] sm:min-h-[320px] max-h-[420px] flex items-center justify-center overflow-hidden cursor-ew-resize group"
            data-lenis-prevent="true"
            onWheel={(e) => {
              const delta = e.deltaY * 0.005;
              setCurrentTime((prev) => Math.max(0, Math.min(scenario.durationSeconds, prev + delta)));
            }}
            title="Scroll wheel horizontally or vertically to scrub playhead"
          >
            <canvas
              ref={canvasRef}
              width={720}
              height={405}
              className="w-full h-full object-contain"
            />

            {/* Subtle Wheel Scroll Scrub Hint */}
            <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[9px] font-tech text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10">
              WHEEL: SCRUB PLAYHEAD
            </div>

            {/* Impact Banner on Floor Contact */}
            {currentTime >= scenario.impactTime && scenario.severity === 'critical' && (
              <div className="absolute bottom-4 inset-x-4 glass-panel bg-red-950/85 border border-red-500/80 px-4 py-2 rounded-xl flex items-center justify-between animate-fade-in shadow-2xl backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs font-sora font-bold text-red-200">
                  <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse shrink-0" />
                  <span>KINETIC IMPACT REGISTERED • PERSISTENT GROUND IMMOBILITY</span>
                </div>
                <span className="text-[10px] font-tech text-red-300 bg-red-900/60 px-2 py-0.5 rounded border border-red-500/40 shrink-0">
                  P1 ACTIVE
                </span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Clinical Intelligence Panel (28% on lg screens, perfectly contained) */}
        <div className="lg:col-span-4 xl:col-span-4 p-4 sm:p-5 flex flex-col justify-between bg-slate-950/90 font-sora space-y-4">
          {/* SECTION A: PATIENT STATUS */}
          <div className="space-y-2">
            <div className="text-[10px] font-tech text-purple-300 font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-white/10 pb-1">
              <User className="w-3.5 h-3.5 text-purple-400" />
              PATIENT CLINICAL STATUS
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Location Zone:</span>
                <span className="text-slate-200 font-semibold font-tech">Bedside Floor Left</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Posture State:</span>
                <span className={`font-semibold font-tech ${currentTime >= scenario.impactTime ? 'text-red-400 font-bold' : 'text-amber-300'}`}>
                  {currentTime >= scenario.impactTime ? 'Supine Ground Immobility' : 'Pre-Exit Seated'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Motion Vector:</span>
                <span className="text-cyan-300 font-tech">
                  {currentTime >= scenario.impactTime ? '0.04 m/s (Stationary)' : scenario.descentVelocity}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION B: RISK & KINEMATIC ANALYSIS */}
          <div className="space-y-2">
            <div className="text-[10px] font-tech text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-white/10 pb-1">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              KINEMATIC & IMPACT METRICS
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/80 p-2 rounded-xl border border-white/5">
                <span className="text-[9px] font-tech text-slate-400 block uppercase">PEAK IMPACT G</span>
                <span className="text-sm font-tech font-bold text-red-400">{scenario.peakGForce}</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-xl border border-white/5">
                <span className="text-[9px] font-tech text-slate-400 block uppercase">DESCENT VELOCITY</span>
                <span className="text-sm font-tech font-bold text-amber-400">{scenario.descentVelocity}</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-xl border border-white/5">
                <span className="text-[9px] font-tech text-slate-400 block uppercase">IMPACT TIMECODE</span>
                <span className="text-sm font-tech font-bold text-cyan-300">T+{scenario.impactTime.toFixed(1)}s</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-xl border border-white/5">
                <span className="text-[9px] font-tech text-slate-400 block uppercase">CONFIDENCE</span>
                <span className="text-sm font-tech font-bold text-purple-300">99.4%</span>
              </div>
            </div>
          </div>

          {/* SECTION C: SPATIAL WIRELESS CSI SIGNAL */}
          <div className="space-y-2">
            <div className="text-[10px] font-tech text-emerald-300 font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-white/10 pb-1">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              AMBIENT CSI SENSING FIELD
            </div>
            <div className="space-y-1 text-xs font-tech">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Micro-Doppler Rate:</span>
                <span className="text-emerald-400 font-bold">15.4 Hz</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Subcarrier Phase SNR:</span>
                <span className="text-cyan-300 font-bold">-48 dBm (Optimal)</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Hardware Sensor Band:</span>
                <span className="text-slate-200">5.8 GHz FMCW</span>
              </div>
            </div>
          </div>

          {/* SECTION D: 48-HOUR PREDICTIVE SIGNALS */}
          <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-tech text-purple-300 font-bold">48H PREDICTED RISK:</span>
              <span className="font-tech text-red-400 font-bold">94% · CRITICAL</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-red-500 w-[94%]" />
            </div>
            <div className="text-[9px] font-sora text-slate-400 pt-1 space-y-0.5">
              {scenario.factors.slice(0, 2).map((factor, idx) => (
                <div key={idx} className="flex items-center gap-1 text-slate-300">
                  <span className="w-1 h-1 rounded-full bg-purple-400 shrink-0" />
                  <span className="truncate">{factor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Clinical Motion Replay Timeline & Scrubber Controls */}
      <div className="p-4 sm:p-5 bg-slate-900/90 border-t border-white/10 space-y-3">
        {/* Timeline Keyframe Event Preview Tooltip (if hovered) */}
        {hoveredKeyframe && (
          <div className="text-xs font-sora p-2 rounded-xl bg-slate-950/95 border border-purple-500/40 shadow-xl flex items-center justify-between text-white animate-in fade-in">
            <span className="flex items-center gap-1.5 font-bold text-purple-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              T+{hoveredKeyframe.time.toFixed(1)}s • {hoveredKeyframe.label}
            </span>
            <span className="text-[11px] text-slate-400">{hoveredKeyframe.description}</span>
            <span className="text-[10px] font-tech px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/40">
              Risk: {hoveredKeyframe.riskValue}
            </span>
          </div>
        )}

        {/* Timeline Slider with Luminous Track & Keyframe Markers */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-cyan-300 w-12 text-right shrink-0">
            00:0{currentTime.toFixed(1)}
          </span>

          <div className="relative flex-1 group py-2">
            {/* Keyframe Markers along timeline */}
            {scenario.keyframes.map((kf, i) => {
              const posPercent = (kf.time / scenario.durationSeconds) * 100;
              const isPassed = currentTime >= kf.time;
              return (
                <div
                  key={i}
                  onMouseEnter={() => setHoveredKeyframe(kf)}
                  onMouseLeave={() => setHoveredKeyframe(null)}
                  onClick={() => setCurrentTime(kf.time)}
                  style={{ left: `${posPercent}%` }}
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-3 h-3 rounded-full border cursor-pointer transition-transform hover:scale-150 ${
                    kf.type === 'impact'
                      ? 'bg-red-500 border-red-300 shadow-[0_0_8px_#ef4444]'
                      : kf.type === 'critical'
                      ? 'bg-orange-500 border-orange-300'
                      : kf.type === 'warning'
                      ? 'bg-amber-400 border-amber-200'
                      : 'bg-purple-400 border-purple-200'
                  }`}
                  title={`${kf.label} (T+${kf.time}s)`}
                />
              );
            })}

            {/* Impact indicator vertical bar on timeline */}
            <div 
              className="absolute top-1 bottom-1 w-1 bg-red-500 z-10 pointer-events-none rounded-full shadow-[0_0_8px_#ef4444]"
              style={{ left: `${(scenario.impactTime / scenario.durationSeconds) * 100}%` }}
            />

            <input
              type="range"
              min={0}
              max={scenario.durationSeconds}
              step={0.05}
              value={currentTime}
              onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-slate-800/90 rounded-lg appearance-none cursor-pointer accent-purple-500 relative z-10"
            />
          </div>

          <span className="text-xs font-mono font-bold text-slate-400 w-12 shrink-0">
            00:0{scenario.durationSeconds}.0
          </span>
        </div>

        {/* Action Controls Bar: Playback Speed, Scrubber Buttons, AI Layer Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer shadow-lg active:scale-95"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <button
              onClick={() => setCurrentTime(0)}
              className="p-2.5 rounded-xl glass-pill text-slate-300 hover:text-white border border-white/10 cursor-pointer active:scale-95"
              title="Replay from start"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Playback speed selector */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/10 text-[10px] font-sora">
              {[0.25, 0.5, 1, 2].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                    playbackSpeed === spd ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* AI Layer Toggle Buttons */}
          <div className="flex items-center gap-1.5 text-[10px] font-sora flex-wrap">
            <button
              onClick={() => setShowSkeleton(!showSkeleton)}
              className={`px-3 py-1.5 rounded-xl border cursor-pointer transition-all ${
                showSkeleton 
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold' 
                  : 'glass-pill border-white/10 text-slate-400'
              }`}
            >
              AI SKELETON: {showSkeleton ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={() => setShowBoundingBox(!showBoundingBox)}
              className={`px-3 py-1.5 rounded-xl border cursor-pointer transition-all ${
                showBoundingBox 
                  ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 font-bold' 
                  : 'glass-pill border-white/10 text-slate-400'
              }`}
            >
              DETECTION ZONE: {showBoundingBox ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={() => setShowCSIWaves(!showCSIWaves)}
              className={`px-3 py-1.5 rounded-xl border cursor-pointer transition-all ${
                showCSIWaves 
                  ? 'bg-purple-950/80 border-purple-500 text-purple-300 font-bold' 
                  : 'glass-pill border-white/10 text-slate-400'
              }`}
            >
              CSI FIELD: {showCSIWaves ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={() => setShowMotionTrail(!showMotionTrail)}
              className={`px-3 py-1.5 rounded-xl border cursor-pointer transition-all ${
                showMotionTrail 
                  ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300 font-bold' 
                  : 'glass-pill border-white/10 text-slate-400'
              }`}
            >
              TRAIL: {showMotionTrail ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

