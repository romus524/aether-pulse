import React, { useState } from 'react';
import { PatientRecord } from '../types';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Phone, 
  BellRing, 
  UserCheck, 
  Stethoscope, 
  Calendar, 
  Sparkles, 
  Activity,
  Video,
  MonitorUp,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SimulatedEventVideoFeed, EventScenarioId } from './SimulatedEventVideoFeed';

interface PatientInspectorProps {
  patient: PatientRecord;
  onDispatchNurse: () => void;
  onAcknowledgeAlert: () => void;
  onTriggerIntercom: () => void;
  onStartScreenShare: () => void;
  showPointCloud: boolean;
  onTogglePointCloud: () => void;
}

export const PatientInspector: React.FC<PatientInspectorProps> = ({
  patient,
  onDispatchNurse,
  onAcknowledgeAlert,
  onTriggerIntercom,
  onStartScreenShare,
  showPointCloud,
  onTogglePointCloud,
}) => {
  const [showVideoReplay, setShowVideoReplay] = useState(false);
  const isCritical = patient.status === 'critical';
  const isWarning = patient.status === 'warning';

  let scenarioId: EventScenarioId = 'fall-104';
  if (patient.id === 'room-102') scenarioId = 'pre-exit-102';
  else if (patient.id === 'room-105') scenarioId = 'wandering-105';
  else if (patient.id === 'room-103') scenarioId = 'apnea-103';
  else if (patient.id === 'room-101') scenarioId = 'syncope-101';

  return (
    <div className="glass-panel glass-specular p-4 rounded-2xl border border-white/10 mb-4 shadow-2xl">
      {/* Top Patient Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div className="flex items-start gap-3">
          {/* Avatar Container */}
          <div className={`relative flex items-center justify-center w-12 h-12 rounded-2xl font-mono text-base font-bold border shadow-xl ${
            isCritical
              ? 'bg-red-950/80 text-red-200 border-red-500/80 animate-pulse glow-red'
              : isWarning
              ? 'bg-amber-950/80 text-amber-200 border-amber-500/80 glow-amber'
              : 'bg-purple-950/80 text-purple-200 border-purple-500/50 glow-purple'
          }`}>
            <span>{patient.roomNumber}</span>
            <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${
              isCritical ? 'bg-red-500 animate-ping' : isWarning ? 'bg-amber-500' : 'bg-emerald-400 glow-emerald'
            }`} />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-sora font-semibold text-white tracking-[-0.025em]">{patient.name}</h2>
              <span className="text-[11px] font-tech text-slate-300 bg-slate-950/60 px-2.5 py-0.5 rounded-full border border-white/10">
                {patient.age} YRS • {patient.gender.toUpperCase()}
              </span>
              <span className="text-[11px] font-tech text-cyan-300 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                MRN: {patient.mrn}
              </span>
              <span className="text-[11px] font-tech text-purple-300 bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                BED {patient.bedNumber}
              </span>
            </div>
            <p className="text-[10px] font-sora font-medium tracking-[0.12em] text-slate-400 mt-1 uppercase flex items-center gap-2">
              <span className="text-purple-400 font-sora font-semibold">DIAGNOSIS:</span> {patient.diagnosis}
            </p>
          </div>
        </div>

        {/* Safety Status Pill & Incident Video Trigger */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowVideoReplay(!showVideoReplay)}
            className={`px-3 py-1.5 rounded-full text-xs font-sora font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-lg ${
              showVideoReplay
                ? 'bg-purple-600 text-white border-purple-400 shadow-purple-600/50'
                : 'glass-pill text-purple-300 border-purple-500/40 hover:bg-purple-950/50'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>INCIDENT VIDEO REPLAY</span>
            {showVideoReplay ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
          </button>

          <div className={`px-3.5 py-1.5 rounded-full text-xs font-sora status-label font-semibold flex items-center gap-2 border shadow-lg ${
            isCritical
              ? 'bg-red-950/90 text-red-200 border-red-500 animate-pulse glow-red'
              : isWarning
              ? 'bg-amber-950/90 text-amber-200 border-amber-500 glow-amber'
              : 'bg-emerald-950/80 text-emerald-200 border-emerald-500/50 glow-emerald'
          }`}>
            {isCritical ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span>P1 CRITICAL FALL DETECTED</span>
              </>
            ) : isWarning ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>PRE-EXIT BED WARNING</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>STABLE IN BED</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Live Incident Video Reconstruction */}
      {showVideoReplay && (
        <div className="my-3 p-3 rounded-2xl bg-slate-950/80 border border-purple-500/40 animate-fade-in shadow-2xl">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-sora font-bold text-purple-300 flex items-center gap-1.5">
              <Video className="w-4 h-4 text-cyan-400" />
              SYNCHRONIZED INCIDENT EVENT RECONSTRUCTION (ROOM {patient.roomNumber})
            </span>
            <button
              onClick={() => setShowVideoReplay(false)}
              className="text-[10px] font-sora text-slate-400 hover:text-white"
            >
              Close Video
            </button>
          </div>
          <SimulatedEventVideoFeed
            scenarioId={scenarioId}
            patient={patient}
            autoPlay={true}
          />
        </div>
      )}

      {/* Patient Clinical Metadata Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 my-3 text-xs font-sora">
        <div className="glass-card p-2.5 rounded-xl border border-white/5">
          <span className="text-slate-400 text-[9px] block mb-1 font-sora font-semibold tracking-[0.12em] uppercase flex items-center gap-1">
            <Stethoscope className="w-3 h-3 text-purple-400" /> ATTENDING PHYSICIAN
          </span>
          <span className="font-semibold text-white text-xs">{patient.physician}</span>
        </div>

        <div className="glass-card p-2.5 rounded-xl border border-white/5">
          <span className="text-slate-400 text-[9px] block mb-1 font-sora font-semibold tracking-[0.12em] uppercase flex items-center gap-1">
            <Calendar className="w-3 h-3 text-cyan-400" /> ADMISSION DATE
          </span>
          <span className="font-semibold text-white text-xs font-tech">{patient.admissionDate}</span>
        </div>

        <div className="glass-card p-2.5 rounded-xl border border-white/5">
          <span className="text-slate-400 text-[9px] block mb-1 font-sora font-semibold tracking-[0.12em] uppercase">FALL RISK (JOHNS HOPKINS)</span>
          <div className="flex items-center gap-2">
            <span className={`font-sora font-bold text-sm ${patient.fallRiskScore >= 20 ? 'text-red-400' : 'text-amber-300'}`}>
              {patient.fallRiskScore}/24
            </span>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-500/50 uppercase font-sora font-semibold status-label">
              HIGH RISK
            </span>
          </div>
        </div>

        <div className="glass-card p-2.5 rounded-xl border border-white/5">
          <span className="text-slate-400 text-[9px] block mb-1 font-sora font-semibold tracking-[0.12em] uppercase">RADAR C/N RATIO</span>
          <span className="font-tech font-semibold text-emerald-400 flex items-center gap-1 text-xs">
            <Activity className="w-3 h-3 text-emerald-400" /> {patient.signalQuality} dBm (OPTIMAL)
          </span>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onDispatchNurse}
            className={`px-4 py-2 rounded-full font-sora text-xs font-semibold tracking-wide flex items-center gap-2 transition-all cursor-pointer ${
              isCritical 
                ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white shadow-lg glow-red animate-bounce' 
                : 'glass-button-primary text-white'
            }`}
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>DISPATCH NURSE</span>
          </button>

          <button
            onClick={onTriggerIntercom}
            className="glass-pill px-4 py-2 text-slate-200 font-sora text-xs font-semibold tracking-wide flex items-center gap-2 transition-all cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5 text-cyan-400" />
            <span>BEDSIDE INTERCOM</span>
          </button>

          <button
            onClick={onStartScreenShare}
            className="glass-pill px-4 py-2 text-slate-200 font-sora text-xs font-semibold tracking-wide flex items-center gap-2 transition-all cursor-pointer"
          >
            <MonitorUp className="w-3.5 h-3.5 text-violet-400" />
            <span>START SCREEN SHARE</span>
          </button>

          {isCritical && (
            <button
              onClick={onAcknowledgeAlert}
              className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-sora text-xs font-semibold tracking-wide flex items-center gap-2 transition-all glow-emerald cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>ACKNOWLEDGE ALERT</span>
            </button>
          )}
        </div>

        {/* Toggle 3D Point Cloud Overlay */}
        <button
          onClick={onTogglePointCloud}
          className={`px-3.5 py-1.5 rounded-full border font-sora text-xs font-semibold tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
            showPointCloud
              ? 'bg-purple-950/80 border-purple-500/60 text-purple-200 glow-purple'
              : 'glass-pill text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>3D POINT CLOUD {showPointCloud ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </div>
  );
};
