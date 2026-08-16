import React, { useEffect, useState } from 'react';
import { PatientRecord } from '../types';
import { ShieldAlert, BellRing, UserCheck, X, Video, ChevronDown, ChevronUp } from 'lucide-react';
import { SimulatedEventVideoFeed, EventScenarioId } from './SimulatedEventVideoFeed';

interface EmergencyModalProps {
  patient: PatientRecord;
  onClose: () => void;
  onDispatchNurse: () => void;
  onAcknowledgeAlert: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  patient,
  onClose,
  onDispatchNurse,
  onAcknowledgeAlert,
}) => {
  const [countdown, setCountdown] = useState(30);
  const [showVideoFeed, setShowVideoFeed] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Map patient room to appropriate scenario
  let scenarioId: EventScenarioId = 'fall-104';
  if (patient.id === 'room-102') scenarioId = 'pre-exit-102';
  else if (patient.id === 'room-105') scenarioId = 'wandering-105';
  else if (patient.id === 'room-103') scenarioId = 'apnea-103';
  else if (patient.id === 'room-101') scenarioId = 'syncope-101';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-2xl animate-fade-in overflow-y-auto"
      data-lenis-prevent="true"
    >
      <div 
        className="relative w-full max-w-2xl glass-panel glass-specular p-5 sm:p-6 rounded-3xl border-2 border-red-500/80 glow-red shadow-2xl my-auto max-h-[92vh] overflow-y-auto custom-scrollbar"
        data-lenis-prevent="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full glass-pill text-slate-400 hover:text-white border border-white/10 cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-r from-red-600 to-pink-600 text-white animate-bounce shadow-xl glow-red shrink-0">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-sora status-label font-bold bg-red-600 text-white animate-pulse">
                P1 CRITICAL FALL EVENT
              </span>
              <span className="text-xs font-tech text-red-300 font-bold">AUTO-DISPATCH IN {countdown}s</span>
            </div>
            <h3 className="text-lg sm:text-xl font-sora font-bold text-white tracking-tight mt-0.5">
              ROOM {patient.roomNumber} • {patient.name}
            </h3>
          </div>
        </div>

        {/* Live Incident Video Replay Feed */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] font-sora font-semibold uppercase tracking-[0.14em] text-red-300 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              LIVE CCTV & RADAR INCIDENT REPLAY
            </span>
            <button
              onClick={() => setShowVideoFeed(!showVideoFeed)}
              className="text-[10px] font-sora text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              {showVideoFeed ? (
                <>Hide Video <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>Show Video <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          </div>

          {showVideoFeed && (
            <div className="rounded-2xl overflow-hidden border border-red-500/40 shadow-xl">
              <SimulatedEventVideoFeed
                scenarioId={scenarioId}
                patient={patient}
                autoPlay={true}
              />
            </div>
          )}
        </div>

        {/* Event Summary Box */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 mb-4 font-sora text-xs shadow-inner">
          <div className="grid grid-cols-2 gap-3 mb-2.5">
            <div>
              <span className="text-slate-400 text-[9px] block font-semibold uppercase tracking-[0.12em]">PATIENT AGE / MRN</span>
              <span className="font-tech font-bold text-white text-xs">{patient.age} YRS • {patient.mrn}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[9px] block font-semibold uppercase tracking-[0.12em]">DIAGNOSIS</span>
              <span className="font-semibold text-white truncate block text-xs">{patient.diagnosis}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-white/5 text-center font-tech">
            <div>
              <span className="text-slate-400 text-[9px] block font-sora font-medium uppercase tracking-[0.12em]">DESCENT VELOCITY</span>
              <span className="font-bold text-red-400 text-sm">3.82 M/S</span>
            </div>
            <div>
              <span className="text-slate-400 text-[9px] block font-sora font-medium uppercase tracking-[0.12em]">IMPACT FORCE</span>
              <span className="font-bold text-red-400 text-sm">4.65G</span>
            </div>
            <div>
              <span className="text-slate-400 text-[9px] block font-sora font-medium uppercase tracking-[0.12em]">IMMOBILITY</span>
              <span className="font-bold text-red-400 text-sm">5.2S</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onDispatchNurse}
            className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white font-sora text-xs font-semibold tracking-wider flex items-center justify-center gap-2 glow-red animate-pulse transition-all cursor-pointer shadow-xl"
          >
            <BellRing className="w-4 h-4" />
            <span>DISPATCH ACUTE NEURO TEAM NOW</span>
          </button>

          <button
            onClick={onAcknowledgeAlert}
            className="w-full sm:w-auto py-3 px-5 rounded-full glass-pill text-slate-200 font-sora text-xs font-semibold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>ACKNOWLEDGE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
