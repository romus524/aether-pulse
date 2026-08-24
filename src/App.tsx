/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PatientRecord, TelemetryDataPoint, FSMStage, EdgeNodeStatus, DeteriorationDataPoint } from './types';

gsap.registerPlugin(ScrollTrigger);
import { INITIAL_PATIENTS, INITIAL_FSM_STAGES, MOCK_EDGE_NODES, MOCK_DETERIORATION_DATA } from './data/mockData';
import { Header } from './components/Header';
import { WardOverviewGrid } from './components/WardOverviewGrid';
import { PatientInspector } from './components/PatientInspector';
import { RoomCanvas3D } from './components/RoomCanvas3D';
import { TelemetryFeed } from './components/TelemetryFeed';
import { FallFSMSequence } from './components/FallFSMSequence';
import { PredictiveDeteriorationChart } from './components/PredictiveDeteriorationChart';
import { EdgeNodePanel } from './components/EdgeNodePanel';
import { EmergencyModal } from './components/EmergencyModal';
import { SimulationControlsModal } from './components/SimulationControlsModal';
import { LiveRoomNavigator } from './pages/LiveRoomNavigator';
import { LoadingScreen } from './components/LoadingScreen';
import ScreenShare from './components/ScreenShare';
import { AetherPulseAgent } from './components/ai/AetherPulseAgent';
import { AiActivityLog } from './components/ai/AiActivityLog';
import { AgentAuditEntry, OperatorRole, PlatformSnapshot, UiCommand } from './platform/agentProtocol';
import { fetchAgentAudit } from './lib/agentClient';

// Web Audio API Audio Synthesizer for High-Tech Medical Telemetry Alarms
function playTelemetryBeep(type: 'critical' | 'warning' | 'ack') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'critical') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc2.frequency.setValueAtTime(1760, ctx.currentTime); // A6

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.5);
      osc2.stop(ctx.currentTime + 0.5);
    } else if (type === 'warning') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (err) {
    // Audio context policy catch
  }
}

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<'navigator' | 'inspector'>('navigator');
  const [patients, setPatients] = useState<PatientRecord[]>(INITIAL_PATIENTS);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('room-104');
  const [fsmStages, setFsmStages] = useState<FSMStage[]>(INITIAL_FSM_STAGES);
  const [edgeNodes, setEdgeNodes] = useState<EdgeNodeStatus[]>(MOCK_EDGE_NODES);
  const [deteriorationData, setDeteriorationData] = useState<DeteriorationDataPoint[]>(MOCK_DETERIORATION_DATA);

  const [audioMuted, setAudioMuted] = useState<boolean>(false);
  const [radarSensitivity, setRadarSensitivity] = useState<string>('Ultra High (0.1m/s)');
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);
  const [showSimModal, setShowSimModal] = useState<boolean>(false);
  const [showPointCloud, setShowPointCloud] = useState<boolean>(true);
  const [shareStatus, setShareStatus] = useState<string>('');
  const [roomName, setRoomName] = useState<string | null>(null);
  const [operatorRole, setOperatorRole] = useState<OperatorRole>('administrator');
  const [twinCommand, setTwinCommand] = useState<UiCommand | null>(null);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [activityLog, setActivityLog] = useState<AgentAuditEntry[]>([]);

  const apiBaseUrl = import.meta.env.VITE_API_URL || '';

  const handleCloseScreenShare = useCallback(() => {
    setRoomName(null);
  }, []);

  // Initialize Lenis Smooth Scrolling engine
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Initialize Telemetry Waveform sliding buffer
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryDataPoint[]>(() => {
    const history: TelemetryDataPoint[] = [];
    const now = new Date();
    for (let i = 20; i >= 0; i--) {
      const t = new Date(now.getTime() - i * 1000);
      const timeStr = t.toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' });
      history.push({
        time: timeStr,
        respiration: 16 + Math.floor(Math.random() * 3),
        heartRate: 72 + Math.floor(Math.random() * 5),
        dopplerPhase: 1.2,
        kineticEnergy: 0.1,
      });
    }
    return history;
  });

  const selectedPatient = patients.find((p) => p.id === selectedRoomId) || patients[0];
  const criticalCount = patients.filter((p) => p.status === 'critical').length;
  const warningCount = patients.filter((p) => p.status === 'warning').length;

  // Sound chime trigger on critical alerts
  useEffect(() => {
    if (criticalCount > 0 && !audioMuted) {
      playTelemetryBeep('critical');
    }
  }, [criticalCount, audioMuted]);

  // Real-time Telemetry Generator Ticker
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' });

      // Generate realistic dynamic micro-variations
      setTelemetryHistory((prev) => {
        const baseResp = selectedPatient.respirationRate;
        const baseHR = selectedPatient.heartRate;

        const newResp = Math.max(8, Math.min(38, baseResp + Math.floor((Math.random() - 0.5) * 3)));
        const newHR = Math.max(50, Math.min(150, baseHR + Math.floor((Math.random() - 0.5) * 4)));

        const nextPoint: TelemetryDataPoint = {
          time: timeStr,
          respiration: newResp,
          heartRate: newHR,
          dopplerPhase: selectedPatient.wifiDopplerRate,
          kineticEnergy: selectedPatient.movementIndex / 100,
        };

        const updated = [...prev.slice(1), nextPoint];
        return updated;
      });

      // Update patient telemetry state slightly for live organic feel
      setPatients((prevPatients) =>
        prevPatients.map((p) => {
          if (p.status === 'critical') return p;
          const hrDelta = Math.floor((Math.random() - 0.5) * 2);
          const respDelta = Math.floor((Math.random() - 0.5) * 1);
          return {
            ...p,
            heartRate: Math.max(55, Math.min(130, p.heartRate + hrDelta)),
            respirationRate: Math.max(10, Math.min(32, p.respirationRate + respDelta)),
          };
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedPatient]);

  // Handler: Select Room
  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    if (!audioMuted) playTelemetryBeep('ack');
  };

  // Handler: Dispatch Nurse
  const handleDispatchNurse = useCallback(() => {
    if (!audioMuted) playTelemetryBeep('ack');
    setShowEmergencyModal(false);
  }, [audioMuted]);

  // Handler: Acknowledge Alert
  const handleAcknowledgeAlert = useCallback(() => {
    if (!audioMuted) playTelemetryBeep('ack');
    setPatients((prev) =>
      prev.map((p) =>
        p.id === selectedPatient.id
          ? {
              ...p,
              status: 'normal',
              posture: 'bed',
              postureDescription: 'Resting Supine in Bed (Acknowledged)',
              heartRate: 78,
              respirationRate: 18,
            }
          : p
      )
    );
    setShowEmergencyModal(false);
  }, [selectedPatient, audioMuted]);

  const handleStartScreenShare = useCallback(async () => {
    if (!selectedPatient) return;

    const endpoint = `${apiBaseUrl}/api/screen-share/sessions`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedPatient.id,
          patientName: selectedPatient.name,
          requestedBy: 'Clinical Operator',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.roomName) {
        const message = data?.message || 'Unable to create the live screen-share session.';
        setShareStatus(message);
        console.error('Screen-share creation failed', data);
        return;
      }

      setShareStatus(`Live share started for ${selectedPatient.name}`);
      setRoomName(data.roomName);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to connect to the share service.';
      setShareStatus(message);
      console.error('Unable to start screen share', error);
    }
  }, [apiBaseUrl, selectedPatient]);

  const handleOverrideAlert = useCallback(async () => {
    try {
      await fetch(`${apiBaseUrl}/api/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedPatient.id,
          patientName: selectedPatient.name,
          incidentType: 'false-positive',
          severity: 'low',
          description: 'Alert reviewed and marked as a false positive by the operator.',
        }),
      });
    } catch (error) {
      console.error('Unable to record false-positive review', error);
    }

    handleAcknowledgeAlert();
  }, [handleAcknowledgeAlert, selectedPatient]);

  // Handler: Trigger Fall Event in Room
  const handleTriggerFall = useCallback((roomId: string) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === roomId
          ? {
              ...p,
              status: 'critical',
              posture: 'fallen',
              postureDescription: 'CRITICAL: Rapid Fall Detected - Floor Position',
              heartRate: 118,
              respirationRate: 28,
              movementIndex: 92,
              wifiDopplerRate: 15.4,
            }
          : p
      )
    );
    setSelectedRoomId(roomId);
    setShowEmergencyModal(true);
  }, []);

  // Handler: Trigger Pre-Exit Warning
  const handleTriggerWarning = useCallback((roomId: string) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === roomId
          ? {
              ...p,
              status: 'warning',
              posture: 'sitting',
              postureDescription: 'Pre-Exit: Sitting on Edge of Bed',
              heartRate: 96,
              respirationRate: 22,
              movementIndex: 65,
              wifiDopplerRate: 5.2,
            }
          : p
      )
    );
    setSelectedRoomId(roomId);
    if (!audioMuted) playTelemetryBeep('warning');
  }, [audioMuted]);

  // Handler: Reset All
  const handleResetAll = useCallback(() => {
    setPatients(INITIAL_PATIENTS);
    setSelectedRoomId('room-101');
    setShowEmergencyModal(false);
  }, []);

  const applySnapshot = useCallback((snapshot: PlatformSnapshot) => {
    setPatients(snapshot.patients);
    setRadarSensitivity(snapshot.settings.radarSensitivity);
    setActivityLog(snapshot.audit);
  }, []);

  const applyUiCommands = useCallback((commands: UiCommand[]) => {
    commands.forEach((command) => {
      if (command.view) setActiveView(command.view);
      if (command.selectRoomId) setSelectedRoomId(command.selectRoomId);
      if (command.showPointCloud !== undefined) setShowPointCloud(command.showPointCloud);
      if (command.openEmergency) setShowEmergencyModal(true);
      if (command.radarSensitivity) setRadarSensitivity(command.radarSensitivity);
      setTwinCommand({ ...command });
    });
  }, []);

  const refreshActivityLog = useCallback(async () => {
    const entries = await fetchAgentAudit();
    setActivityLog(entries);
    setShowActivityLog(true);
  }, []);

  return (
    <div className="min-h-screen ethereal-bg text-slate-100 font-sans grid-pattern flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Command Header */}
      <Header
        criticalCount={criticalCount}
        warningCount={warningCount}
        totalRooms={patients.length}
        audioMuted={audioMuted}
        activeView={activeView}
        onSelectView={setActiveView}
        onToggleAudio={() => setAudioMuted((prev) => !prev)}
        onOpenSimModal={() => setShowSimModal(true)}
        radarSensitivity={radarSensitivity}
        onChangeRadarSensitivity={(val) => setRadarSensitivity(val)}
        operatorRole={operatorRole}
        onChangeRole={setOperatorRole}
        onOpenActivityLog={() => void refreshActivityLog()}
      />

      {/* Main Container View Switcher */}
      {activeView === 'navigator' ? (
        <main className="flex-1 max-w-[1920px] mx-auto w-full">
          <LiveRoomNavigator patients={patients} />
        </main>
      ) : (
        <main className="flex-1 px-4 lg:px-6 pb-6 space-y-4 max-w-[1920px] mx-auto w-full">
          {/* 3-Column Responsive Grid Architecture */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left Column: Ward Overview Grid (Rooms 101 to 108) */}
            <div className="lg:col-span-3 h-full">
              <WardOverviewGrid
                patients={patients}
                selectedRoomId={selectedRoomId}
                onSelectRoom={handleSelectRoom}
              />
            </div>

            {/* Center Column: Room Inspector & 3D Spatial Digital Twin */}
            <div className="lg:col-span-5 h-full flex flex-col">
              <PatientInspector
                patient={selectedPatient}
                onDispatchNurse={handleDispatchNurse}
                onAcknowledgeAlert={handleAcknowledgeAlert}
                onTriggerIntercom={() => playTelemetryBeep('ack')}
                onStartScreenShare={handleStartScreenShare}
                showPointCloud={showPointCloud}
                onTogglePointCloud={() => setShowPointCloud((prev) => !prev)}
              />

              {/* 3D WebGL Digital Twin Viewport */}
              <RoomCanvas3D
                patient={selectedPatient}
                showPointCloud={showPointCloud}
                twinCommand={twinCommand}
              />
            </div>

            {/* Right Column: Real-Time Telemetry & Fall Verification */}
            <div className="lg:col-span-4 h-full flex flex-col gap-4">
              <TelemetryFeed
                patient={selectedPatient}
                telemetryHistory={telemetryHistory}
              />

              <FallFSMSequence
                stages={fsmStages}
                patient={selectedPatient}
                onVerifyAlert={handleDispatchNurse}
                onOverrideAlert={handleOverrideAlert}
              />
            </div>
          </div>

          {/* Bottom Monitoring Row: Predictive AI Forecast & Edge Hardware Mesh */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
            {/* Predictive Deterioration Bar Chart */}
            <PredictiveDeteriorationChart data={deteriorationData} />

            {/* Edge Node & Wearable Hardware Status Panel */}
            <EdgeNodePanel nodes={edgeNodes} />
          </div>
        </main>
      )}

      {/* Initial Boot & Holographic Radar Loading Screen */}
      {isLoading && (
        <LoadingScreen onComplete={() => setIsLoading(false)} />
      )}

      {/* Emergency Modal Overlay */}
      {showEmergencyModal && (
        <EmergencyModal
          patient={selectedPatient}
          onClose={() => setShowEmergencyModal(false)}
          onDispatchNurse={handleDispatchNurse}
          onAcknowledgeAlert={handleAcknowledgeAlert}
        />
      )}

      {shareStatus && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-cyan-500/40 bg-slate-950/90 px-3 py-2 text-xs text-cyan-100 shadow-2xl backdrop-blur">
          {shareStatus}
        </div>
      )}

      {roomName && (
        <div className="fixed inset-4 z-40 rounded-2xl border border-cyan-500/40 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-xl lg:inset-8">
          <div className="flex items-center justify-between pb-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-cyan-300">LIVE SCREEN SHARE</p>
              <p className="mt-1 text-xs text-slate-400">{selectedPatient.name} · Room {selectedPatient.roomNumber}</p>
            </div>
            <button
              onClick={handleCloseScreenShare}
              className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-white"
            >
              Close
            </button>
          </div>
          <ScreenShare roomName={roomName} onClose={handleCloseScreenShare} />
        </div>
      )}

      {/* Simulation Drawer Modal */}
      {showSimModal && (
        <SimulationControlsModal
          patients={patients}
          selectedRoomId={selectedRoomId}
          onClose={() => setShowSimModal(false)}
          onTriggerFall={handleTriggerFall}
          onTriggerWarning={handleTriggerWarning}
          onResetAll={handleResetAll}
        />
      )}

      {showActivityLog && (
        <AiActivityLog entries={activityLog} onClose={() => setShowActivityLog(false)} />
      )}

      {!isLoading && (
        <AetherPulseAgent
          role={operatorRole}
          userId={`op-${operatorRole}`}
          userName="Clinical Operator"
          selectedRoomId={selectedRoomId}
          onSnapshot={applySnapshot}
          onUiCommands={applyUiCommands}
        />
      )}
    </div>
  );
}
