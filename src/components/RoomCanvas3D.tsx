import React, { useState, useEffect, useMemo, useRef, Suspense, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { PatientRecord } from '../types';
import { UiCommand } from '../platform/agentProtocol';
import {
  Radio,
  ShieldCheck,
  Compass,
  Box,
  Activity,
  Wind,
  Heart,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { DigitalTwinHuman } from './3d/DigitalTwinHuman';
import { CSIWavefrontField } from './3d/CSIWavefrontField';
import { CSIParticleField } from './3d/CSIParticleField';
import { SpatialEnvironment } from './3d/SpatialEnvironment';
import { GhostPathReplay } from './3d/GhostPathReplay';
import { EventPulseField } from './3d/EventPulseField';
import { TwinEventMarkerHint, TwinPlaybackBar } from './3d/TwinPlaybackBar';
import { useAccess } from '../platform/AccessContext';
import {
  findEventTime,
  getPlaybackSpatialState,
  getScenarioForPatient,
  samplePlaybackPose,
} from './3d/scenarioPlayback';

interface RoomCanvasProps {
  patient: PatientRecord;
  showRadarRings?: boolean;
  showPointCloud?: boolean;
  twinCommand?: UiCommand | null;
}

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

export type CameraPreset = 'iso' | 'front' | 'side' | 'top' | 'bed' | 'full';

function PlaybackCamera({
  cameraPreset,
  patient,
  timeRef,
  followRef,
  userControlRef,
  orbitRef,
}: {
  cameraPreset: CameraPreset;
  patient: PatientRecord;
  timeRef: React.MutableRefObject<number>;
  followRef: React.MutableRefObject<boolean>;
  userControlRef: React.MutableRefObject<boolean>;
  orbitRef: React.MutableRefObject<{ target: THREE.Vector3 } | null>;
}) {
  const { camera } = useThree();
  const lookAt = useMemo(() => new THREE.Vector3(), []);

  const presets: Record<CameraPreset, { pos: [number, number, number] }> = {
    iso: { pos: [3.2, 2.8, 3.8] },
    front: { pos: [0, 1.4, 4.2] },
    side: { pos: [4.2, 1.4, 0] },
    top: { pos: [0.01, 5.4, 0.01] },
    bed: { pos: [1.6, 1.3, 1.7] },
    full: { pos: [4.9, 3.9, 5.3] },
  };

  useFrame((_, delta) => {
    if (userControlRef.current || !followRef.current) return;
    const pose = samplePlaybackPose(patient, timeRef.current);
    const target = presets[cameraPreset];
    lookAt.set(pose.position.x, pose.position.y, pose.position.z);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, target.pos[0] + pose.position.x * 0.18, 3.2, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, target.pos[1], 3.2, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, target.pos[2] + pose.position.z * 0.18, 3.2, delta);
    if (orbitRef.current) {
      orbitRef.current.target.x = THREE.MathUtils.damp(orbitRef.current.target.x, lookAt.x, 3.4, delta);
      orbitRef.current.target.y = THREE.MathUtils.damp(orbitRef.current.target.y, lookAt.y, 3.4, delta);
      orbitRef.current.target.z = THREE.MathUtils.damp(orbitRef.current.target.z, lookAt.z, 3.4, delta);
    }
  });

  return null;
}

export const RoomCanvas3D: React.FC<RoomCanvasProps> = ({
  patient,
  showPointCloud: initialShowPointCloud = true,
  twinCommand = null,
}) => {
  const access = useAccess();
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('iso');
  const [playbackNotice, setPlaybackNotice] = useState<string | null>(null);
  const [showWavefronts, setShowWavefronts] = useState(true);
  const [showParticles, setShowParticles] = useState(initialShowPointCloud);
  const [showGhostPath, setShowGhostPath] = useState(true);
  const [showInspectorCard, setShowInspectorCard] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [seekVersion, setSeekVersion] = useState(0);

  const timeRef = useRef(0);
  const followRef = useRef(true);
  const userControlRef = useRef(false);
  const orbitRef = useRef<{ target: THREE.Vector3 } | null>(null);
  const quality = 'balanced' as const;

  const scenario = useMemo(() => getScenarioForPatient(patient), [patient.roomNumber]);
  const duration = scenario.durationSeconds;

  useEffect(() => {
    timeRef.current = 0;
    setCurrentTime(0);
    setIsPlaying(true);
    setIsLive(true);
    followRef.current = true;
    setSeekVersion((value) => value + 1);
  }, [patient.id]);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    let hudAt = 0;

    const tick = (now: number) => {
      const delta = (now - last) / 1000;
      last = now;
      if (isPlaying) {
        let next = timeRef.current + delta * playbackSpeed;
        if (next >= duration) {
          next = isLive ? next % duration : duration;
          if (!isLive) setIsPlaying(false);
        }
        timeRef.current = next;
      }
      if (now - hudAt > 80) {
        hudAt = now;
        setCurrentTime(timeRef.current);
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, isLive, playbackSpeed, duration]);

  const csiState = useMemo(() => getPlaybackSpatialState(patient, currentTime), [patient, currentTime]);
  const activeEvent = samplePlaybackPose(patient, currentTime).activeEvent;

  const seekTo = (time: number) => {
    timeRef.current = Math.min(Math.max(time, 0), duration);
    setCurrentTime(timeRef.current);
    setIsLive(false);
    followRef.current = true;
    setSeekVersion((value) => value + 1);
  };

  useEffect(() => {
    if (!twinCommand) return;
    if (twinCommand.cameraPreset) {
      setCameraPreset(twinCommand.cameraPreset);
      followRef.current = true;
    }
    if (twinCommand.showPointCloud !== undefined) setShowParticles(twinCommand.showPointCloud);
    if (twinCommand.showWavefronts !== undefined) setShowWavefronts(twinCommand.showWavefronts);
    if (twinCommand.showTrajectory !== undefined) setShowGhostPath(twinCommand.showTrajectory);

    if (twinCommand.playback) {
      const eventTime = findEventTime(patient, twinCommand.seekEvent);
      if (twinCommand.playbackSpeed) setPlaybackSpeed(twinCommand.playbackSpeed);

      if (twinCommand.playback === 'pause') {
        setIsPlaying(false);
        setIsLive(false);
        setPlaybackNotice('Twin playback paused');
      } else if (twinCommand.playback === 'live') {
        setIsLive(true);
        setIsPlaying(true);
        setPlaybackSpeed(1);
        followRef.current = true;
        setPlaybackNotice('Twin returned to live CSI');
      } else if (twinCommand.playback === 'play') {
        setIsPlaying(true);
        setIsLive(false);
        if (eventTime !== null) seekTo(eventTime);
        setPlaybackNotice(twinCommand.seekEvent ? `Playing around ${twinCommand.seekEvent}` : 'Twin playback playing');
      } else {
        seekTo(eventTime ?? 0);
        setIsPlaying(true);
        const eventLabel = twinCommand.seekEvent ? ` around ${twinCommand.seekEvent}` : '';
        const speed = twinCommand.playbackSpeed ? ` · ${twinCommand.playbackSpeed}x` : '';
        setPlaybackNotice(`Replaying recent movement${eventLabel}${speed}`);
      }
    }
    // seekTo is stable enough for command application; include twinCommand as the trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [twinCommand]);

  return (
    <div className="relative flex h-[580px] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#030712] shadow-2xl glass-panel glass-specular">
      <div className="pointer-events-none absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2">
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-white/10 px-3.5 py-1.5 shadow-lg glass-panel backdrop-blur-xl">
            <Radio className={`h-4 w-4 ${csiState.isCritical ? 'animate-pulse text-red-400' : 'animate-pulse text-cyan-400'}`} />
            <span className="font-sora text-xs font-bold tracking-wider text-white">
              CSI DIGITAL TWIN: RM {patient.roomNumber}
            </span>
            <span className="flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-950/80 px-2 py-0.5 font-tech text-[10px] font-bold text-purple-300">
              <Box className="h-3 w-3 text-cyan-400" />
              LIVE PLAYBACK
            </span>
          </div>
          {playbackNotice && (
            <div className="rounded-full border border-purple-400/30 px-3 py-1.5 font-sora text-[10px] text-purple-100 glass-panel backdrop-blur-xl">
              {playbackNotice}
            </div>
          )}
        </div>

        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1 rounded-full border border-white/10 p-1 shadow-lg glass-panel backdrop-blur-xl">
            <button
              onClick={() => setShowWavefronts(!showWavefronts)}
              title="Toggle CSI Wavefronts"
              className={`cursor-pointer rounded-full p-1.5 text-[10px] transition-all ${
                showWavefronts ? 'border border-cyan-500/40 bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setShowParticles(!showParticles)}
              title="Toggle CSI Particle Field"
              className={`cursor-pointer rounded-full p-1.5 text-[10px] transition-all ${
                showParticles ? 'border border-purple-500/40 bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setShowGhostPath(!showGhostPath)}
              title="Toggle ghost path replay"
              className={`cursor-pointer rounded-full p-1.5 text-[10px] transition-all ${
                showGhostPath ? 'border border-indigo-500/40 bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1 rounded-full border border-white/10 p-1 shadow-lg glass-panel backdrop-blur-xl">
            {(
              [
                { id: 'iso', label: '3D' },
                { id: 'bed', label: 'BED' },
                { id: 'top', label: 'TOP' },
              ] as const
            ).map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setCameraPreset(preset.id);
                  followRef.current = true;
                }}
                className={`cursor-pointer rounded-full px-2.5 py-1 font-sora text-[10px] font-bold uppercase transition-all ${
                  cameraPreset === preset.id
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40 ring-1 ring-purple-400'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
            <button
              onClick={() => {
                setCameraPreset('iso');
                followRef.current = true;
              }}
              title="Reset camera follow"
              className="ml-0.5 cursor-pointer rounded-full p-1 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {showInspectorCard && (
        <div className="absolute top-16 right-3 z-10 hidden w-52 flex-col gap-1.5 rounded-2xl border border-white/10 p-3.5 font-tech text-[10px] text-slate-300 shadow-2xl glass-card backdrop-blur-xl pointer-events-auto sm:flex">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5 font-bold tracking-wider text-cyan-300">
            <span className="flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-cyan-400" />
              CSI SPATIAL MATRIX
            </span>
            <button onClick={() => setShowInspectorCard(false)} className="cursor-pointer text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">PATIENT:</span>
            <span className="font-bold text-white">{patient.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">POSTURE:</span>
            <span className="font-bold uppercase text-purple-300">{csiState.posture}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">RESPIRATION:</span>
            <span className="flex items-center gap-1 font-bold text-emerald-400">
              <Wind className="h-3 w-3" /> {patient.respirationRate} RPM
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">HEART RATE:</span>
            <span className="flex items-center gap-1 font-bold text-red-400">
              <Heart className="h-3 w-3" /> {patient.heartRate} BPM
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">DOPPLER:</span>
            <span className="font-mono text-amber-300">{csiState.dopplerVelocity.toFixed(3)} m/s</span>
          </div>
        </div>
      )}

      {!showInspectorCard && (
        <button
          onClick={() => setShowInspectorCard(true)}
          className="absolute top-16 right-3 z-10 flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 font-tech text-xs text-cyan-300 shadow-xl glass-panel transition-all hover:bg-white/10"
        >
          <Compass className="h-3.5 w-3.5" /> SHOW CSI HUD
        </button>
      )}

      <TwinEventMarkerHint event={activeEvent} />

      <div className="h-full w-full bg-gradient-to-b from-[#020617] via-[#050814] to-[#020617]">
        <ThreeErrorBoundary
          fallback={
            <div className="flex h-full w-full flex-col items-center justify-center bg-slate-950 p-6 text-center">
              <ShieldCheck className="mb-2 h-12 w-12 animate-bounce text-purple-400" />
              <h4 className="font-mono text-sm text-purple-300">CSI DIGITAL TWIN ACTIVE</h4>
              <p className="mt-1 max-w-md text-xs text-slate-400">
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
            <hemisphereLight args={['#dbe7ff', '#141826', 0.55]} />
            <Environment preset="apartment" environmentIntensity={0.28} />
            <ambientLight intensity={0.32} color="#c7d2fe" />
            <directionalLight
              position={[4.2, 7.2, 3.4]}
              intensity={1.55}
              color="#fff7ed"
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
              shadow-bias={-0.0002}
            />
            <directionalLight position={[-3.5, 2.8, -3.2]} intensity={0.45} color="#93c5fd" />
            <pointLight
              position={[0, 2.2, 0]}
              intensity={csiState.isCritical ? 2.1 : 0.7}
              color={csiState.isCritical ? '#ef4444' : '#67e8f9'}
              distance={6}
            />

            <PlaybackCamera
              cameraPreset={cameraPreset}
              patient={patient}
              timeRef={timeRef}
              followRef={followRef}
              userControlRef={userControlRef}
              orbitRef={orbitRef}
            />

            <Suspense fallback={null}>
              <SpatialEnvironment csiState={csiState} />
              <DigitalTwinHuman
                patient={patient}
                simulationTimeRef={timeRef}
                seekVersion={seekVersion}
                quality={quality}
              />
              <CSIWavefrontField csiState={csiState} enabled={showWavefronts} quality={quality} />
              <CSIParticleField csiState={csiState} enabled={showParticles} quality={quality} />
              <GhostPathReplay
                patient={patient}
                timeRef={timeRef}
                enabled={showGhostPath}
                critical={csiState.isCritical}
              />
              <EventPulseField patient={patient} timeRef={timeRef} />
              <ContactShadows position={[0, 0.001, 0]} opacity={0.42} scale={6} blur={2.4} far={2.8} color="#020617" />
            </Suspense>

            <OrbitControls
              enablePan
              enableZoom
              enableDamping
              dampingFactor={0.08}
              maxPolarAngle={Math.PI / 2.02}
              minDistance={1.4}
              maxDistance={9.5}
              onStart={() => {
                userControlRef.current = true;
                followRef.current = false;
              }}
              onEnd={() => {
                userControlRef.current = false;
              }}
              ref={(controls) => {
                orbitRef.current = controls;
              }}
            />
          </Canvas>
        </ThreeErrorBoundary>
      </div>

      <div className="absolute bottom-2 left-2 right-2 z-20 flex flex-col gap-2">
        <div
          className={`pointer-events-auto flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-3 py-2 shadow-2xl backdrop-blur-xl ${
            csiState.isCritical
              ? 'border-red-500/70 bg-red-950/80 text-red-100'
              : csiState.isWarning
                ? 'border-amber-500/60 bg-amber-950/80 text-amber-100'
                : 'border-emerald-500/40 bg-slate-950/80 text-emerald-100'
          }`}
        >
          <div className="flex min-w-0 items-center gap-2">
            <Activity className="h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-sora font-bold uppercase tracking-[0.14em]">
                {patient.posture} · live status
              </div>
              <div className="truncate text-[11px] font-tech text-slate-200">{patient.postureDescription}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 font-tech text-[11px]">
            <span className="flex items-center gap-1 text-red-300">
              <Heart className="h-3.5 w-3.5" /> {patient.heartRate} BPM
            </span>
            <span className="flex items-center gap-1 text-cyan-300">
              <Wind className="h-3.5 w-3.5" /> {patient.respirationRate} RPM
            </span>
            <span className="hidden sm:inline text-slate-400">HRV {patient.hrv} ms</span>
          </div>
        </div>
        {access.can('twinPlayback') && (
        <TwinPlaybackBar
          scenario={scenario}
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          isLive={isLive}
          playbackSpeed={playbackSpeed}
          activeEvent={activeEvent}
          onTogglePlay={() => {
            setIsPlaying((value) => !value);
            if (!isPlaying) setIsLive(false);
          }}
          onGoLive={() => {
            setIsLive(true);
            setIsPlaying(true);
            setPlaybackSpeed(1);
            followRef.current = true;
          }}
          onReplay={() => {
            seekTo(0);
            setIsPlaying(true);
          }}
          onSeek={seekTo}
          onSpeed={(speed) => {
            setPlaybackSpeed(speed);
            setIsLive(false);
          }}
        />
        )}
      </div>
    </div>
  );
};
