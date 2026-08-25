import React, { useEffect, useState } from 'react';
import { FacilityRoom } from '../../types';
import { X, Heart, Wind, ShieldAlert, Activity, Wifi, Send, CheckCircle2, User, FileText, AlertTriangle, Video, Maximize2 } from 'lucide-react';
import { SimulatedEventVideoFeed, EventScenarioId } from '../SimulatedEventVideoFeed';
import { useAccess } from '../../platform/AccessContext';

interface PatientInspectorDrawerProps {
  room: FacilityRoom | null;
  onClose: () => void;
  onDispatchModal: (room: FacilityRoom) => void;
  onClearRoomStatus: (roomId: string) => void;
}

export const PatientInspectorDrawer: React.FC<PatientInspectorDrawerProps> = ({
  room,
  onClose,
  onDispatchModal,
  onClearRoomStatus,
}) => {
  const access = useAccess();
  const [showVideoModal, setShowVideoModal] = useState(false);

  if (!room) return null;

  let scenarioId: EventScenarioId = 'fall-104';
  if (room.roomNumber === '102') scenarioId = 'pre-exit-102';
  else if (room.roomNumber === '105') scenarioId = 'wandering-105';
  else if (room.roomNumber === '103') scenarioId = 'apnea-103';
  else if (room.roomNumber === '101') scenarioId = 'syncope-101';

  // Keyboard shortcut: Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showVideoModal) setShowVideoModal(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showVideoModal]);

  return (
    <div 
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-slate-950/95 backdrop-blur-2xl border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col font-sora animate-in slide-in-from-right duration-300"
      data-lenis-prevent="true"
    >
      {/* Drawer Header */}
      <div className="shrink-0 p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/70 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-300 font-extrabold text-base sm:text-lg">
            RM {room.roomNumber}
          </div>
          <div>
            <span className="status-label text-[10px] text-purple-300 font-bold tracking-wider">PATIENT INSPECTOR</span>
            <h2 className="font-extrabold text-lg sm:text-xl text-white">{room.patient.name}</h2>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full glass-pill hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          aria-label="Close patient inspector"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Body with Smooth Scroll */}
      <div 
        className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-4 overscroll-contain"
        data-lenis-prevent="true"
      >
        {/* Patient Demographic Card */}
        <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-2 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
              <User className="w-3.5 h-3.5 text-cyan-400" /> MRN ID:
            </span>
            <span className="font-tech font-bold text-cyan-300">{room.patient.mrn}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">Age / Gender:</span>
            <span className="text-slate-200 font-semibold">{room.patient.age} Yrs / {room.patient.gender}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">Attending Physician:</span>
            <span className="text-purple-300 font-bold">{room.patient.physician}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">Admission Date:</span>
            <span className="text-slate-300 font-tech">{room.patient.admissionDate}</span>
          </div>

          <div className="pt-2 border-t border-white/10 text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1 mb-1">
              <FileText className="w-3.5 h-3.5 text-purple-400" /> Primary Clinical Diagnosis:
            </span>
            <p className="text-white font-medium bg-white/[0.04] p-2.5 rounded-xl border border-white/5 leading-relaxed">
              {room.patient.diagnosis}
            </p>
          </div>
        </div>

        {/* Spatial Radar Telemetry */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-purple-300 status-label flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-cyan-400" /> AMBIENT RADAR SPATIAL VECTORS
          </h3>

          <div className="grid grid-cols-2 gap-2 text-xs font-tech">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10">
              <span className="text-[10px] text-slate-400 block font-bold">EDGE NODE MESH</span>
              <span className="text-sm font-bold text-cyan-300">{room.edgeNode}</span>
              <span className="text-[9px] text-emerald-400 block mt-0.5">● 60GHz Millimeter Wave</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10">
              <span className="text-[10px] text-slate-400 block font-bold">CONFIDENCE RATING</span>
              <span className="text-sm font-bold text-purple-300">{room.confidence}%</span>
              <span className="text-[9px] text-cyan-400 block mt-0.5">SNR: 28.4 dB (Optimal)</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">CURRENT MOVEMENT STATE</span>
              <span className="font-extrabold text-sm text-white tracking-wide">{room.movement}</span>
            </div>
            <Activity className="w-5 h-5 text-purple-400 animate-pulse" />
          </div>
        </div>

        {/* Live Biometric Telemetry */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-cyan-300 status-label">REAL-TIME BIOMETRICS</h3>

          <div className="grid grid-cols-3 gap-2 font-tech text-center">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10">
              <Heart className="w-4 h-4 text-red-400 mx-auto mb-1 animate-pulse" />
              <span className="text-[9px] text-slate-400 block font-bold">HEART RATE</span>
              <span className="text-base font-extrabold text-white">{room.heartRate}</span>
              <span className="text-[8px] text-slate-500">BPM</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10">
              <Wind className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
              <span className="text-[9px] text-slate-400 block font-bold">RESP RATE</span>
              <span className="text-base font-extrabold text-white">{room.respirationRate}</span>
              <span className="text-[8px] text-slate-500">/MIN</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10">
              <ShieldAlert className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <span className="text-[9px] text-slate-400 block font-bold">FALL RISK</span>
              <span className={`text-base font-extrabold ${room.fallRiskScore >= 18 ? 'text-red-400' : 'text-emerald-400'}`}>
                {room.fallRiskScore}
              </span>
              <span className="text-[8px] text-slate-500">MORSE</span>
            </div>
          </div>
        </div>

        {/* Simulated Radar Point-Cloud Graphic Frame with Replay Trigger */}
        <div className="p-3.5 rounded-2xl glass-panel border border-white/10 bg-slate-950 relative overflow-hidden flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-[10px] font-tech text-slate-400 z-10">
            <span className="text-purple-300 font-bold">SPATIAL RADAR POINT-CLOUD TWIN</span>
            <span className="text-emerald-400">FPS: 60 • 100Hz</span>
          </div>

          <div className="z-10 text-center py-1">
            <span className="text-xs font-tech font-bold text-slate-200">
              PATIENT POSITION: {room.movement}
            </span>
            <p className="text-[9px] text-slate-400 mt-0.5">
              Privacy-Preserving Ambient Wi-Fi Doppler Sensing
            </p>
          </div>

          {access.can('twinPlayback') && (
          <button
            onClick={() => setShowVideoModal(true)}
            className="w-full py-2 px-3 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-purple-200 hover:text-white font-sora font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg"
          >
            <Video className="w-3.5 h-3.5 text-cyan-400" />
            <span>VIEW 3D MOTION & INCIDENT REPLAY</span>
          </button>
          )}
        </div>
      </div>

      {/* Drawer Action Bar */}
      <div className="shrink-0 p-4 sm:p-5 border-t border-white/10 bg-slate-950/80 backdrop-blur-md space-y-2">
        {access.can('dispatch') && (
        <button
          onClick={() => onDispatchModal(room)}
          className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white font-sora font-extrabold text-xs shadow-xl shadow-red-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <Send className="w-4 h-4" />
          DISPATCH EMERGENCY PERSONNEL TO ROOM {room.roomNumber}
        </button>
        )}

        {room.status !== 'normal' && access.can('acknowledge') && (
          <button
            onClick={() => onClearRoomStatus(room.id)}
            className="w-full py-2.5 px-4 rounded-full bg-slate-900 hover:bg-emerald-950/60 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 font-sora font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ACKNOWLEDGE & RESET TO NORMAL
          </button>
        )}
      </div>

      {/* Synchronized 3D CSI Motion Replay Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md p-4 sm:p-8 flex items-center justify-center animate-fade-in">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-3xl bg-slate-950 border border-purple-500/40 shadow-2xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="font-sora font-extrabold text-white text-base">
                    Room {room.roomNumber} · 3D Spatial CSI Kinematic Replay
                  </h3>
                  <p className="text-[11px] text-slate-400 font-tech">
                    Patient: {room.patient.name} ({room.patient.mrn}) · Real-Time Incident Simulation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowVideoModal(false)}
                className="p-2 rounded-full glass-pill hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <SimulatedEventVideoFeed
              scenarioId={scenarioId}
              autoPlay={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};
