import React, { useState } from 'react';
import { PatientRecord } from '../types';
import {
  Phone,
  BellRing,
  UserCheck,
  Sparkles,
  Video,
  MonitorUp,
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
    <section className="mb-3 rounded-2xl border border-white/10 bg-[#0b0f19]/80 px-3.5 py-3 shadow-xl backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
            isCritical
              ? 'bg-red-950 text-red-100 ring-1 ring-red-500/70'
              : isWarning
                ? 'bg-amber-950 text-amber-100 ring-1 ring-amber-500/60'
                : 'bg-purple-950 text-purple-100 ring-1 ring-purple-500/40'
          }`}
        >
          {patient.roomNumber}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h2 className="truncate text-base font-semibold tracking-tight text-white">{patient.name}</h2>
            <span className="text-[11px] text-slate-400">
              {patient.age}y · {patient.gender} · Bed {patient.bedNumber}
            </span>
          </div>
          <p className="truncate text-[11px] text-slate-400">{patient.diagnosis}</p>
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
            isCritical
              ? 'bg-red-950/90 text-red-200 ring-1 ring-red-500/60'
              : isWarning
                ? 'bg-amber-950/90 text-amber-200 ring-1 ring-amber-500/50'
                : 'bg-emerald-950/80 text-emerald-200 ring-1 ring-emerald-500/40'
          }`}
        >
          {statusLabel(patient.status)}
        </span>
      </div>

      <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] sm:grid-cols-4">
        <div>
          <dt className="text-slate-500">MRN</dt>
          <dd className="font-medium text-slate-200">{patient.mrn}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Physician</dt>
          <dd className="truncate font-medium text-slate-200">{patient.physician}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Admitted</dt>
          <dd className="font-medium text-slate-200">{patient.admissionDate}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Fall risk · Radar</dt>
          <dd className="font-medium">
            <span className={highRisk ? 'text-red-300' : 'text-amber-200'}>{patient.fallRiskScore}/24</span>
            <span className="text-slate-500"> · </span>
            <span className="text-emerald-300">{patient.signalQuality} dBm</span>
          </dd>
        </div>
      </dl>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-2.5">
        <button
          type="button"
          onClick={onDispatchNurse}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold ${
            isCritical
              ? 'bg-red-600 text-white hover:bg-red-500'
              : 'bg-purple-600 text-white hover:bg-purple-500'
          }`}
        >
          <BellRing className="h-3.5 w-3.5" />
          Dispatch
        </button>
        <button
          type="button"
          onClick={onTriggerIntercom}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[11px] font-medium text-slate-200 hover:border-white/20 hover:bg-white/5"
        >
          <Phone className="h-3.5 w-3.5 text-cyan-400" />
          Intercom
        </button>
        <button
          type="button"
          onClick={onStartScreenShare}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[11px] font-medium text-slate-200 hover:border-white/20 hover:bg-white/5"
        >
          <MonitorUp className="h-3.5 w-3.5 text-violet-400" />
          Share
        </button>
        {isCritical && (
          <button
            type="button"
            onClick={onAcknowledgeAlert}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-600"
          >
            <UserCheck className="h-3.5 w-3.5" />
            Acknowledge
          </button>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowVideoReplay((open) => !open)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${
              showVideoReplay
                ? 'bg-purple-700 text-white'
                : 'border border-white/10 text-slate-300 hover:bg-white/5'
            }`}
          >
            <Video className="h-3.5 w-3.5" />
            Replay
          </button>
          <button
            type="button"
            onClick={onTogglePointCloud}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${
              showPointCloud
                ? 'bg-purple-950 text-purple-100 ring-1 ring-purple-500/50'
                : 'border border-white/10 text-slate-400 hover:bg-white/5'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Cloud {showPointCloud ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      {showVideoReplay && (
        <div className="mt-2.5 rounded-xl border border-white/10 bg-slate-950/70 p-2">
          <SimulatedEventVideoFeed
            scenarioId={scenarioForPatient(patient.id)}
            patient={patient}
            autoPlay
          />
        </div>
      )}
    </section>
  );
};
