import React, { useState } from 'react';
import { PatientRecord } from '../types';
import {
  Phone,
  BellRing,
  UserCheck,
  Sparkles,
  Video,
  MonitorUp,
  Heart,
  Wind,
  Activity,
  Radio,
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

function scenarioForPatient(patientId: string): EventScenarioId {
  if (patientId === 'room-102') return 'pre-exit-102';
  if (patientId === 'room-105') return 'wandering-105';
  if (patientId === 'room-103') return 'apnea-103';
  if (patientId === 'room-101') return 'syncope-101';
  return 'fall-104';
}

function statusLabel(status: PatientRecord['status']): string {
  if (status === 'critical') return 'Critical fall';
  if (status === 'warning') return 'Pre-exit';
  if (status === 'responding') return 'Responding';
  return 'Stable';
}

function statusPillClass(status: PatientRecord['status']): string {
  if (status === 'critical') {
    return 'bg-red-950/90 text-red-300 border-red-500/60 font-bold shadow-[0_0_8px_rgba(239,68,68,0.4)]';
  }
  if (status === 'warning') {
    return 'bg-amber-950/60 text-amber-300 border-amber-500/30 font-medium';
  }
  if (status === 'responding') {
    return 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30 font-medium';
  }
  return 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30 font-medium';
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
  const highRisk = patient.fallRiskScore >= 15;

  return (
    <section
      className={`relative z-10 mb-3 glass-panel glass-specular rounded-2xl border shadow-2xl ${
        isCritical ? 'border-red-500/80 glow-red' : 'border-white/10'
      }`}
    >
      <div className="relative z-[1] px-4 pt-3 pb-2.5 flex items-start justify-between gap-3 border-b border-white/5">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-sora font-bold shadow-lg ${
              isCritical
                ? 'bg-gradient-to-br from-red-600 to-red-900 text-red-50 ring-1 ring-red-400/50 shadow-red-900/40'
                : isWarning
                  ? 'bg-gradient-to-br from-amber-600 to-amber-900 text-amber-50 ring-1 ring-amber-400/40 shadow-amber-900/30'
                  : 'bg-gradient-to-br from-purple-600 to-violet-900 text-white ring-1 ring-purple-400/40 shadow-purple-900/40'
            }`}
          >
            {patient.roomNumber}
          </div>
          <div className="min-w-0">
            <div className="headline-eyebrow text-[10px] text-purple-300/80 font-tech uppercase tracking-wider">
              Room inspector
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h2 className="headline-title text-lg truncate">{patient.name}</h2>
              <span className="text-[11px] text-slate-400 font-sora">
                {patient.age}y · {patient.gender} · Bed {patient.bedNumber}
              </span>
            </div>
            <p className="truncate text-[11px] text-slate-500 font-sora">{patient.diagnosis}</p>
          </div>
        </div>
        <span
          className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-sora uppercase tracking-wide border ${statusPillClass(
            patient.status
          )}`}
        >
          {statusLabel(patient.status)}
        </span>
      </div>

      <div className="relative z-[1] px-4 py-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <MetaCell label="MRN" value={patient.mrn} mono />
        <MetaCell label="Physician" value={patient.physician} />
        <MetaCell label="Admitted" value={patient.admissionDate} />
        <div className="glass-card rounded-xl px-3 py-2">
          <div className="text-[9px] text-slate-400 uppercase tracking-[0.14em] font-sora font-semibold">
            Fall risk · radar
          </div>
          <div className="mt-0.5 text-sm font-sora font-semibold tabular-nums">
            <span className={highRisk ? 'text-red-300' : 'text-amber-200'}>{patient.fallRiskScore}/24</span>
            <span className="text-slate-600 mx-1.5">·</span>
            <span className="text-emerald-300 font-tech text-xs">{patient.signalQuality} dBm</span>
          </div>
        </div>
      </div>

      {!showVideoReplay && <LivePatientStatus patient={patient} />}

      <div className="relative z-[1] px-4 pb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onDispatchNurse}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-sora font-semibold text-white ${
            isCritical
              ? 'bg-red-600/90 hover:bg-red-500 border border-red-400/40 shadow-[0_0_16px_rgba(239,68,68,0.28)]'
              : 'glass-button-primary'
          }`}
        >
          <BellRing className="h-3.5 w-3.5" />
          Dispatch
        </button>
        <button
          type="button"
          onClick={onTriggerIntercom}
          className="glass-pill inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sora font-semibold text-slate-200 hover:text-white"
        >
          <Phone className="h-3.5 w-3.5 text-cyan-400" />
          Intercom
        </button>
        <button
          type="button"
          onClick={onStartScreenShare}
          className="glass-pill inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sora font-semibold text-slate-200 hover:text-white"
        >
          <MonitorUp className="h-3.5 w-3.5 text-violet-400" />
          Share
        </button>
        {isCritical && (
          <button
            type="button"
            onClick={onAcknowledgeAlert}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sora font-semibold bg-emerald-800/90 hover:bg-emerald-600 text-white border border-emerald-400/30"
          >
            <UserCheck className="h-3.5 w-3.5" />
            Acknowledge
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowVideoReplay((open) => !open)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sora font-semibold ${
              showVideoReplay
                ? 'glass-button-primary text-white'
                : 'glass-pill text-slate-200 hover:text-white'
            }`}
          >
            <Video className="h-3.5 w-3.5" />
            Replay
          </button>
          <button
            type="button"
            onClick={onTogglePointCloud}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-sora font-semibold transition-all ${
              showPointCloud
                ? 'glass-button-primary text-white'
                : 'bg-slate-800/80 text-slate-400 border border-white/10 hover:text-white hover:border-white/20'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Cloud {showPointCloud ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      {showVideoReplay && (
        <div className="relative z-[1] mx-4 mb-3 grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(220px,0.9fr)] gap-3">
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40">
            <SimulatedEventVideoFeed
              scenarioId={scenarioForPatient(patient.id)}
              patient={patient}
              autoPlay
            />
          </div>
          <aside className="glass-card rounded-2xl border border-white/10 p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-sora font-bold uppercase tracking-[0.16em] text-cyan-300">
                Live patient status
              </span>
              <span className={`rounded-full border px-2 py-0.5 text-[9px] font-sora uppercase ${statusPillClass(patient.status)}`}>
                {statusLabel(patient.status)}
              </span>
            </div>
            <p className="text-xs font-sora text-slate-200 leading-relaxed">
              {patient.postureDescription}
            </p>
            <LivePatientStatus patient={patient} stacked />
            <div className="mt-auto rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-[10px] font-tech text-slate-400">
              Playback reconstructs the incident. These vitals stay live from CSI monitoring and are not replaced by the video timeline.
            </div>
          </aside>
        </div>
      )}
    </section>
  );
};

function LivePatientStatus({ patient, stacked = false }: { patient: PatientRecord; stacked?: boolean }) {
  return (
    <div className={`relative z-[1] ${stacked ? '' : 'px-4 pb-2.5'}`}>
      <div className={`grid gap-2 ${stacked ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-4'}`}>
        <VitalCell
          icon={<Heart className="h-3.5 w-3.5 text-red-400" />}
          label="Heart rate"
          value={`${patient.heartRate}`}
          unit="BPM"
          alert={patient.heartRate < 50 || patient.heartRate > 110}
        />
        <VitalCell
          icon={<Wind className="h-3.5 w-3.5 text-cyan-400" />}
          label="Respiration"
          value={`${patient.respirationRate}`}
          unit="RPM"
          alert={patient.respirationRate < 8 || patient.respirationRate > 24}
        />
        <VitalCell
          icon={<Activity className="h-3.5 w-3.5 text-purple-300" />}
          label="Posture"
          value={patient.posture}
          unit={patient.lastMovement}
        />
        <VitalCell
          icon={<Radio className="h-3.5 w-3.5 text-emerald-400" />}
          label="Movement index"
          value={`${patient.movementIndex}`}
          unit={`${patient.wifiDopplerRate} Hz`}
          alert={patient.status === 'critical'}
        />
      </div>
    </div>
  );
}

function VitalCell({
  icon,
  label,
  value,
  unit,
  alert = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  alert?: boolean;
}) {
  return (
    <div className={`glass-card rounded-xl px-3 py-2 ${alert ? 'border border-red-500/40' : ''}`}>
      <div className="flex items-center gap-1.5 text-[9px] text-slate-400 uppercase tracking-[0.14em] font-sora font-semibold">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 flex items-baseline gap-1.5">
        <span className={`text-sm font-sora font-semibold capitalize ${alert ? 'text-red-300' : 'text-white'}`}>{value}</span>
        <span className="truncate text-[10px] font-tech text-slate-500">{unit}</span>
      </div>
    </div>
  );
}

function MetaCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="glass-card rounded-xl px-3 py-2">
      <div className="text-[9px] text-slate-400 uppercase tracking-[0.14em] font-sora font-semibold">{label}</div>
      <div className={`mt-0.5 text-sm text-slate-100 truncate ${mono ? 'font-tech' : 'font-sora font-medium'}`}>
        {value}
      </div>
    </div>
  );
}
