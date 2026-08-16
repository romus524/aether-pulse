import React, { useState, useEffect, useMemo, Suspense, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { PatientRecord } from '../types';
import { 
  Radio, 
  ShieldCheck, 
  Compass, 
  Box, 
  Eye, 
  Activity, 
  Wind, 
  Heart, 
  Sparkles, 
  RefreshCw,
} from 'lucide-react';
import { getCSISpatialState } from './3d/CSIAdapter';
import { DigitalTwinHuman } from './3d/DigitalTwinHuman';
import { CSIWavefrontField } from './3d/CSIWavefrontField';
import { CSIParticleField } from './3d/CSIParticleField';
import { SpatialEnvironment } from './3d/SpatialEnvironment';
import { MovementTrajectory } from './3d/MovementTrajectory';

interface RoomCanvasProps {
  patient: PatientRecord;
  showRadarRings?: boolean;
  showPointCloud?: boolean;
}

// -------------------------------------------------------------
// THREE WEBGL ERROR BOUNDARY
// -------------------------------------------------------------
class ThreeErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('3D WebGL render notice:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// -------------------------------------------------------------
// CAMERA CONTROLLER WITH PRESETS & SMOOTH LERP
// -------------------------------------------------------------
export type CameraPreset = 'iso' | 'front' | 'side' | 'top' | 'bed' | 'full';

function CameraAnimator({ cameraPreset }: { cameraPreset: CameraPreset }) {
  const { camera } = useThree();

  const presets: Record<CameraPreset, { pos: [number, number, number]; target: [number, number, number] }> = {
    iso: { pos: [3.2, 2.8, 3.8], target: [0.2, 0.45, 0.1] },
    front: { pos: [0, 1.4, 4.2], target: [0, 0.5, 0] },
    side: { pos: [4.2, 1.4, 0], target: [0, 0.5, 0] },
    top: { pos: [0.01, 5.4, 0.01], target: [0, 0, 0] },
    bed: { pos: [1.6, 1.3, 1.7], target: [0.2, 0.5, 0.1] },
    full: { pos: [4.9, 3.9, 5.3], target: [0, 0.5, 0] },
  };

  useFrame(() => {
    const target = presets[cameraPreset];
    if (target) {
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, target.pos[0], 0.06);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, target.pos[1], 0.06);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, target.pos[2], 0.06);
      camera.lookAt(target.target[0], target.target[1], target.target[2]);
    }
  });

  return null;
}

// -------------------------------------------------------------
// MAIN ROOM CANVAS 3D EXPORTED COMPONENT
// -------------------------------------------------------------
export const RoomCanvas3D: React.FC<RoomCanvasProps> = ({ 
  patient, 
  showPointCloud: initialShowPointCloud = true 
}) => {
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('iso');

  // Visualization Layer Toggles
  const [showWavefronts, setShowWavefronts] = useState<boolean>(true);
  const [showParticles, setShowParticles] = useState<boolean>(initialShowPointCloud);
  const [showTrajectory, setShowTrajectory] = useState<boolean>(true);
  const [showDebugSkeleton, setShowDebugSkeleton] = useState<boolean>(false);
  const [quality, setQuality] = useState<'high' | 'balanced' | 'performance'>('high');
  const [showInspectorCard, setShowInspectorCard] = useState<boolean>(true);

  // Time state for continuous real-time CSI synthesis
  const [time, setTime] = useState<number>(0);

  useEffect(() => {
    let animId: number;
    const start = performance.now();
    const tick = (now: number) => {
      setTime((now - start) / 1000);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Compute live CSI state & spatial kinematics
  const csiState = useMemo(() => {
    return getCSISpatialState(patient, time);
  }, [patient, time]);

  const handleResetCamera = () => {
    setCameraPreset('iso');
  };

  return (
    <div className="relative w-full h-[460px] rounded-2xl overflow-hidden glass-panel glass-specular border border-white/10 flex flex-col shadow-2xl bg-[#030712]">
      {/* ========================================================= */}
      {/* 1. TOP CONTROL & STATUS HEADER */}
      {/* ========================================================= */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left Room Identification & Digital Twin Badge */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 glass-panel backdrop-blur-xl px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg">
            <Radio className={`w-4 h-4 ${csiState.isCritical ? 'text-red-400 animate-pulse' : 'text-cyan-400 animate-pulse'}`} />
            <span className="text-xs font-sora font-bold text-white tracking-wider">
              CSI DIGITAL TWIN: RM {patient.roomNumber}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-tech bg-purple-950/80 text-purple-300 border border-purple-500/30 font-bold flex items-center gap-1">
              <Box className="w-3 h-3 text-cyan-400" />
              3D CLINICAL TWIN
            </span>
          </div>
        </div>

        {/* Right Camera Presets & Layer Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto flex-wrap">
          {/* Layer Quick Toggles */}
          <div className="flex items-center gap-1 glass-panel backdrop-blur-xl p-1 rounded-full border border-white/10 shadow-lg">
            <button
              onClick={() => setShowWavefronts(!showWavefronts)}
              title="Toggle CSI Wavefronts"
              className={`p-1.5 rounded-full text-[10px] transition-all cursor-pointer ${
                showWavefronts ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setShowParticles(!showParticles)}
              title="Toggle CSI Particle Field"
              className={`p-1.5 rounded-full text-[10px] transition-all cursor-pointer ${
                showParticles ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setShowTrajectory(!showTrajectory)}
              title="Toggle Movement Path Trajectory"
              className={`p-1.5 rounded-full text-[10px] transition-all cursor-pointer ${
                showTrajectory ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setShowDebugSkeleton(!showDebugSkeleton)}
              title="Toggle Clinical Skeletal Alignment"
              className={`p-1.5 rounded-full text-[10px] transition-all cursor-pointer ${
                showDebugSkeleton ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Camera View Angle Selector */}
          <div className="flex items-center gap-1 glass-panel backdrop-blur-xl p-1 rounded-full border border-white/10 shadow-lg">
            {(
              [
                { id: 'iso', label: '3D ISO' },
                { id: 'front', label: 'FRONT' },
                { id: 'side', label: 'SIDE' },
                { id: 'bed', label: 'BED' },
                { id: 'top', label: 'TOP 2D' },
                { id: 'full', label: 'MACRO' },
              ] as const
            ).map((preset) => (
              <button
                key={preset.id}
                onClick={() => setCameraPreset(preset.id)}
                className={`px-2.5 py-1 text-[10px] font-sora font-bold rounded-full transition-all cursor-pointer uppercase ${
                  cameraPreset === preset.id
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40 ring-1 ring-purple-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {preset.label}
              </button>
            ))}

            {/* Reset Camera Button */}
            <button
              onClick={handleResetCamera}
              title="Reset 360° Camera View"
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer ml-0.5"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. FLOATING CSI CLINICAL TELEMETRY HUD (TOP RIGHT) */}
      {/* ========================================================= */}
      {showInspectorCard && (
        <div className="absolute top-16 right-3 z-10 hidden sm:flex flex-col gap-1.5 p-3.5 glass-card backdrop-blur-xl rounded-2xl border border-white/10 text-[10px] font-tech text-slate-300 pointer-events-auto w-52 shadow-2xl">
          <div className="flex items-center justify-between text-cyan-300 border-b border-white/10 pb-1.5 font-bold tracking-wider">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '12s' }} /> 
              CSI SPATIAL MATRIX
            </span>
            <button
              onClick={() => setShowInspectorCard(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">PATIENT:</span>
            <span className="text-white font-bold">{patient.name}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">COORDINATES:</span>
            <span className="text-cyan-300 font-mono font-bold">
              X:{csiState.coordinates.x.toFixed(2)} Y:{csiState.coordinates.y.toFixed(2)} Z:{csiState.coordinates.z.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">POSTURE:</span>
            <span className="text-purple-300 font-bold uppercase">{patient.posture}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">RESPIRATION:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Wind className="w-3 h-3" /> {patient.respirationRate} RPM
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">HEART RATE:</span>
            <span className="text-red-400 font-bold flex items-center gap-1">
              <Heart className="w-3 h-3" /> {patient.heartRate} BPM
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">DOPPLER VELOCITY:</span>
            <span className="text-amber-300 font-mono">{(csiState.dopplerVelocity).toFixed(3)} m/s</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">CSI PHASE (Δφ):</span>
            <span className="text-indigo-300 font-mono">{(csiState.phaseShiftDelta).toFixed(2)} rad</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">SNR / LINK:</span>
            <span className="text-cyan-400 font-mono">{csiState.snr.toFixed(1)} dB (60GHz)</span>
          </div>
        </div>
      )}

      {/* Minimized HUD Re-open Pill */}
      {!showInspectorCard && (
        <button
          onClick={() => setShowInspectorCard(true)}
          className="absolute top-16 right-3 z-10 px-3 py-1.5 rounded-full glass-panel border border-white/10 text-cyan-300 font-tech text-xs flex items-center gap-1.5 hover:bg-white/10 transition-all cursor-pointer shadow-xl"
        >
          <Compass className="w-3.5 h-3.5" /> SHOW CSI HUD
        </button>
      )}

      {/* ========================================================= */}
      {/* 3. BOTTOM CLINICAL POSTURE BADGE & QUALITY SELECTOR */}
      {/* ========================================================= */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        {/* Posture Status Badge */}
        <div className={`px-4 py-2 rounded-full border backdrop-blur-xl flex items-center gap-2 shadow-2xl pointer-events-auto ${
          csiState.isCritical
            ? 'bg-red-950/90 border-red-500/80 text-red-200 animate-pulse glow-red'
            : csiState.isWarning
            ? 'bg-amber-950/90 border-amber-500/80 text-amber-200 glow-amber'
            : 'bg-slate-950/80 border-emerald-500/50 text-emerald-300 glow-emerald'
        }`}>
          <Activity className="w-4 h-4" />
          <div className="text-xs font-mono">
            <span className="font-bold uppercase tracking-wider">{patient.posture}</span>: {patient.postureDescription}
          </div>
        </div>

        {/* Quality Controls */}
        <div className="hidden sm:flex items-center gap-1 glass-panel backdrop-blur-xl px-2.5 py-1 rounded-full border border-white/10 text-[10px] font-tech text-slate-400 pointer-events-auto">
          <span>QUALITY:</span>
          {(['high', 'balanced', 'performance'] as const).map((q) => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              className={`px-2 py-0.5 rounded uppercase font-bold transition-all cursor-pointer ${
                quality === q ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'hover:text-white'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. WEBGL 3D THREE.JS CANVAS */}
      {/* ========================================================= */}
      <div className="w-full h-full bg-gradient-to-b from-[#020617] via-[#050814] to-[#020617]">
        <ThreeErrorBoundary
          fallback={
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-950">
              <ShieldCheck className="w-12 h-12 text-purple-400 mb-2 animate-bounce" />
              <h4 className="text-sm font-mono text-purple-300">CSI DIGITAL TWIN ACTIVE</h4>
              <p className="text-xs text-slate-400 max-w-md mt-1">
                Sensing stream online for Room {patient.roomNumber}. Patient posture: {patient.postureDescription}.
              </p>
            </div>
          }
        >
          <Canvas
            camera={{ position: [3.2, 2.8, 3.8], fov: 40 }}
            gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
            shadows
          >
            <color attach="background" args={['#020617']} />

            {/* CLINICAL LIGHTING RIG */}
            <ambientLight intensity={0.85} color="#e2e8f0" />
            <directionalLight
              position={[5, 8, 4]}
              intensity={1.8}
              color="#ffffff"
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
            />
            <directionalLight position={[-4, 3, -4]} intensity={0.6} color="#94a3b8" />
            <pointLight
              position={[0, 2.2, 0]}
              intensity={csiState.isCritical ? 3.2 : 1.2}
              color={csiState.isCritical ? '#ef4444' : '#38bdf8'}
            />

            {/* CAMERA SMOOTH LERP CONTROLLER */}
            <CameraAnimator cameraPreset={cameraPreset} />

            <Suspense fallback={null}>
              {/* Spatial Hospital Room & Sensing Infrastructure */}
              <SpatialEnvironment csiState={csiState} />

              {/* Patient 3D Digital Twin Avatar */}
              <DigitalTwinHuman
                patient={patient}
                csiState={csiState}
                showDebugSkeleton={showDebugSkeleton}
                quality={quality}
              />

              {/* CSI Multi-Node Wavefront Fields */}
              <CSIWavefrontField
                csiState={csiState}
                enabled={showWavefronts}
                quality={quality}
              />

              {/* CSI 3D Perturbed Particle System */}
              <CSIParticleField
                csiState={csiState}
                enabled={showParticles}
                quality={quality}
              />

              {/* Translucent 3D Movement Trajectory */}
              <MovementTrajectory
                csiState={csiState}
                enabled={showTrajectory}
              />
            </Suspense>

            {/* Full 360° Smooth Orbit Controls */}
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableDamping={true}
              dampingFactor={0.05}
              maxPolarAngle={Math.PI / 2.02}
              minDistance={1.4}
              maxDistance={9.5}
            />
          </Canvas>
        </ThreeErrorBoundary>
      </div>
    </div>
  );
};
