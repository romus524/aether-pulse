import React, { useState, useEffect, useRef } from 'react';
import { PatientRecord } from '../types';
import { 
  X, 
  Play, 
  RotateCcw, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders, 
  Video, 
  Activity, 
  Zap,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { SimulatedEventVideoFeed, EventScenarioId, EVENT_SCENARIOS } from './SimulatedEventVideoFeed';

interface SimulationControlsModalProps {
  patients: PatientRecord[];
  selectedRoomId: string;
  onClose: () => void;
  onTriggerFall: (roomId: string) => void;
  onTriggerWarning: (roomId: string) => void;
  onResetAll: () => void;
}

export const SimulationControlsModal: React.FC<SimulationControlsModalProps> = ({
  patients,
  selectedRoomId,
  onClose,
  onTriggerFall,
  onTriggerWarning,
  onResetAll,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<EventScenarioId>('fall-104');
  const [activeTab, setActiveTab] = useState<'video' | 'quick'>('video');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scenarioListRef = useRef<HTMLDivElement>(null);

  const selectedScenario = EVENT_SCENARIOS[selectedScenarioId] || EVENT_SCENARIOS['fall-104'];

  // Enable keyboard shortcuts (Esc to close, Arrow keys to switch)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const keys = Object.keys(EVENT_SCENARIOS) as EventScenarioId[];
        const currentIndex = keys.indexOf(selectedScenarioId);
        if (e.key === 'ArrowDown') {
          const nextIndex = (currentIndex + 1) % keys.length;
          setSelectedScenarioId(keys[nextIndex]);
        } else {
          const prevIndex = (currentIndex - 1 + keys.length) % keys.length;
          setSelectedScenarioId(keys[prevIndex]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedScenarioId, onClose]);

  const handleExecuteSelectedScenario = () => {
    if (selectedScenario.severity === 'critical') {
      onTriggerFall(selectedScenario.roomId);
    } else {
      onTriggerWarning(selectedScenario.roomId);
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-2xl animate-fade-in overflow-y-auto"
      data-lenis-prevent="true"
    >
      <div 
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col glass-panel glass-specular rounded-3xl border border-white/15 shadow-2xl overflow-hidden"
        data-lenis-prevent="true"
      >
        {/* Fixed Header */}
        <div className="shrink-0 p-4 sm:p-5 pb-3 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-purple-950/80 border border-purple-500/50 text-purple-300 glow-purple">
              <Video className="w-5 h-5 sm:w-6 sm:h-6 text-purple-300 animate-pulse" />
            </div>
            <div>
              <div className="headline-eyebrow">WARD RADAR & CCTV INCIDENT SIMULATOR</div>
              <h3 className="headline-title text-sm sm:text-base md:text-lg font-sora font-bold text-white tracking-tight">
                LIVE EVENT RECONSTRUCTION & SIMULATION
              </h3>
              <p className="text-[11px] font-sora text-slate-400 mt-0.5">
                Simulate biometric events across 5 Monitored Ward Rooms (101–105) with synced live video replay
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Tab Selector */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-white/10 text-xs font-sora">
              <button
                onClick={() => setActiveTab('video')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'video' 
                    ? 'bg-purple-600 text-white font-bold shadow-lg shadow-purple-600/40' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5" /> LIVE VIDEO REPLAY
              </button>
              <button
                onClick={() => setActiveTab('quick')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'quick' 
                    ? 'bg-purple-600 text-white font-bold shadow-lg shadow-purple-600/40' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" /> QUICK PRESETS
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-full glass-pill text-slate-400 hover:text-white border border-white/10 cursor-pointer transition-all"
              title="Close modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body with Real Native Wheel & Touch Scroll Events */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-4 overscroll-contain"
          data-lenis-prevent="true"
        >
          {activeTab === 'video' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Left Column: Scenario Selector with smooth dedicated scroll container (5 cols) */}
              <div className="lg:col-span-5 flex flex-col space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-sora font-semibold uppercase tracking-[0.14em] text-slate-400">
                    SELECT SIMULATED INCIDENT:
                  </span>
                  <span className="text-[9px] font-mono text-purple-300">
                    USE ↑/↓ OR SCROLL
                  </span>
                </div>

                <div 
                  ref={scenarioListRef}
                  className="space-y-2 max-h-[320px] sm:max-h-[380px] lg:max-h-[440px] overflow-y-auto custom-scrollbar pr-1.5 overscroll-contain"
                  data-lenis-prevent="true"
                >
                  {(Object.keys(EVENT_SCENARIOS) as EventScenarioId[]).map((key) => {
                    const sc = EVENT_SCENARIOS[key];
                    const isSelected = selectedScenarioId === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedScenarioId(key)}
                        className={`w-full p-3 rounded-2xl text-left transition-all border cursor-pointer flex items-start justify-between gap-2.5 ${
                          isSelected
                            ? sc.severity === 'critical'
                              ? 'bg-red-950/85 border-red-500/90 glow-red ring-1 ring-red-400 shadow-xl'
                              : 'bg-amber-950/85 border-amber-500/90 glow-amber ring-1 ring-amber-400 shadow-xl'
                            : 'glass-card border-white/5 hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                            sc.severity === 'critical' ? 'bg-red-900/60 text-red-300' : 'bg-amber-900/60 text-amber-300'
                          }`}>
                            {sc.severity === 'critical' ? <ShieldAlert className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-sora font-bold text-white tracking-wide">
                                ROOM {sc.roomNumber} • {sc.patientName}
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-tech font-bold uppercase ${
                                sc.severity === 'critical' 
                                  ? 'bg-red-500/20 text-red-300 border border-red-500/40' 
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}>
                                {sc.severity}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-300 font-sora block mt-0.5 leading-snug">
                              {sc.title}
                            </span>
                            <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-slate-400">
                              <span>Peak: <strong className="text-red-400">{sc.peakGForce}</strong></span>
                              <span>Vel: <strong className="text-cyan-300">{sc.descentVelocity}</strong></span>
                              <span>T+{sc.impactTime}s</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {/* Reset to stable button */}
                  <button
                    onClick={() => {
                      onResetAll();
                      onClose();
                    }}
                    className="w-full p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/60 hover:bg-emerald-900/60 text-left flex items-center justify-between transition-all cursor-pointer glow-emerald mt-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-xs font-sora font-bold text-emerald-200 block">
                          RESET ALL 5 ROOMS TO STABLE
                        </span>
                        <span className="text-[10px] text-slate-300 font-sora block">
                          Normalize Doppler scatter and restore baseline telemetry
                        </span>
                      </div>
                    </div>
                    <RotateCcw className="w-4 h-4 text-emerald-400 opacity-80 shrink-0" />
                  </button>
                </div>
              </div>

              {/* Right Column: Interactive Live Video Feed (7 cols) */}
              <div className="lg:col-span-7 flex flex-col space-y-3">
                <SimulatedEventVideoFeed
                  scenarioId={selectedScenarioId}
                  autoPlay={true}
                />

                {/* Incident Narrative Box */}
                <div className="glass-card p-3 rounded-2xl border border-white/10 space-y-2">
                  <div className="text-[11px] font-sora text-slate-300 leading-relaxed">
                    <strong className="text-white">Clinical Breakdown:</strong> {selectedScenario.description}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1.5 border-t border-white/5">
                    <div className="text-[10px] font-tech text-purple-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>AI KINEMATIC MODEL MATCH: 99.4% CONFIDENCE</span>
                    </div>

                    <button
                      onClick={handleExecuteSelectedScenario}
                      className={`w-full sm:w-auto px-5 py-2.5 rounded-full font-sora text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl ${
                        selectedScenario.severity === 'critical'
                          ? 'bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white glow-red animate-pulse'
                          : 'bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white glow-amber'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>DEPLOY THIS EVENT TO WARD</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Quick Presets View */
            <div className="space-y-3 max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
              <button
                onClick={() => {
                  onTriggerFall('room-104');
                  onClose();
                }}
                className="w-full p-4 rounded-2xl bg-red-950/60 border border-red-500/80 hover:bg-red-900/80 text-left flex items-center justify-between transition-all group cursor-pointer glow-red"
              >
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-6 h-6 text-red-400 animate-pulse shrink-0" />
                  <div>
                    <span className="text-sm font-sora font-semibold text-red-200 block tracking-wide">
                      SCENARIO 1: P1 FALL EVENT (ROOM 104)
                    </span>
                    <span className="text-xs text-slate-300 font-sora leading-normal block mt-0.5">
                      Marcus Thorne - Rapid descent (3.82 m/s), 4.65g impact shock & floor immobility.
                    </span>
                  </div>
                </div>
                <Play className="w-4 h-4 text-red-400 fill-current opacity-60 group-hover:opacity-100 shrink-0" />
              </button>

              <button
                onClick={() => {
                  onTriggerWarning('room-102');
                  onClose();
                }}
                className="w-full p-4 rounded-2xl bg-amber-950/60 border border-amber-500/80 hover:bg-amber-900/80 text-left flex items-center justify-between transition-all group cursor-pointer glow-amber"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-sm font-sora font-semibold text-amber-200 block tracking-wide">
                      SCENARIO 2: PRE-EXIT BED WARNING (ROOM 102)
                    </span>
                    <span className="text-xs text-slate-300 font-sora leading-normal block mt-0.5">
                      Arthur Pendelton - Bed edge micro-movement delta & sitting posture shift.
                    </span>
                  </div>
                </div>
                <Play className="w-4 h-4 text-amber-400 fill-current opacity-60 group-hover:opacity-100 shrink-0" />
              </button>

              <button
                onClick={() => {
                  onTriggerWarning('room-105');
                  onClose();
                }}
                className="w-full p-4 rounded-2xl bg-purple-950/60 border border-purple-500/80 hover:bg-purple-900/80 text-left flex items-center justify-between transition-all group cursor-pointer glow-purple"
              >
                <div className="flex items-center gap-3">
                  <Activity className="w-6 h-6 text-purple-400 shrink-0" />
                  <div>
                    <span className="text-sm font-sora font-semibold text-purple-200 block tracking-wide">
                      SCENARIO 3: NOCTURNAL WANDERING (ROOM 105)
                    </span>
                    <span className="text-xs text-slate-300 font-sora leading-normal block mt-0.5">
                      Florence Chen - Dementia bed exit and disorientation wandering path.
                    </span>
                  </div>
                </div>
                <Play className="w-4 h-4 text-purple-400 fill-current opacity-60 group-hover:opacity-100 shrink-0" />
              </button>

              <button
                onClick={() => {
                  onResetAll();
                  onClose();
                }}
                className="w-full p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/60 hover:bg-emerald-900/60 text-left flex items-center justify-between transition-all group cursor-pointer glow-emerald"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-sm font-sora font-semibold text-emerald-200 block tracking-wide">
                      SCENARIO 4: RESET ALL 5 WARDS TO STABLE
                    </span>
                    <span className="text-xs text-slate-300 font-sora leading-normal block mt-0.5">
                      Clear all alarms, normalize Doppler radar scatter, and restore baseline vitals.
                    </span>
                  </div>
                </div>
                <RotateCcw className="w-4 h-4 text-emerald-400 opacity-60 group-hover:opacity-100 shrink-0" />
              </button>
            </div>
          )}
        </div>

        {/* Fixed Footer Bar */}
        <div className="shrink-0 px-4 sm:px-5 py-3 border-t border-white/10 bg-slate-950/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-[10px] font-mono text-slate-400">
            5 MONITORED ROOMS • AMBIENT 5.8GHZ CSI MESH • ZERO-PII ARCHITECTURE
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-5 py-1.5 rounded-full glass-pill text-slate-300 font-sora text-xs font-semibold cursor-pointer tracking-wide hover:text-white"
            >
              CLOSE (ESC)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
