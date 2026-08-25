import React from 'react';
import { FSMStage, PatientRecord } from '../types';
import { CheckCircle2, ShieldAlert, ShieldCheck, AlertOctagon, Zap, ArrowRight, Activity, TrendingDown, BellRing, ChevronRight } from 'lucide-react';
import { useAccess } from '../platform/AccessContext';

interface FallFSMSequenceProps {
  stages: FSMStage[];
  patient: PatientRecord;
  onVerifyAlert: () => void;
  onOverrideAlert: () => void;
}

export const FallFSMSequence: React.FC<FallFSMSequenceProps> = ({
  stages,
  patient,
  onVerifyAlert,
  onOverrideAlert,
}) => {
  const access = useAccess();
  const isCritical = patient.status === 'critical';
  const isWarning = patient.status === 'warning';

  // Streamlined, punchy step definitions with zero noise and clean alignment
  const pipelineSteps = [
    {
      step: '01',
      title: 'Descent',
      sub: 'Velocity',
      val: isCritical ? '3.82 m/s' : isWarning ? '1.45 m/s' : '0.18 m/s',
      status: isCritical ? 'passed' : 'standby',
      valColor: isCritical ? 'text-emerald-300' : 'text-slate-400',
    },
    {
      step: '02',
      title: 'Impact',
      sub: 'Decel Spike',
      val: isCritical ? '4.65g' : isWarning ? '0.85g' : '0.12g',
      status: isCritical ? 'passed' : 'standby',
      valColor: isCritical ? 'text-emerald-300' : 'text-slate-400',
    },
    {
      step: '03',
      title: 'Immobile',
      sub: 'Floor Rest',
      val: isCritical ? '5.2s Motionless' : isWarning ? 'Active' : 'Nominal',
      status: isCritical ? 'passed' : 'standby',
      valColor: isCritical ? 'text-emerald-300' : 'text-slate-400',
    },
    {
      step: '04',
      title: 'Alert',
      sub: 'Escalation',
      val: isCritical ? 'P1 Dispatched' : isWarning ? 'Pre-Exit' : 'Armed',
      status: isCritical ? 'active' : 'standby',
      valColor: isCritical ? 'text-red-300 font-bold' : isWarning ? 'text-amber-300' : 'text-slate-400',
    },
  ];

  return (
    <div
      id="fall-fsm-container"
      className={`glass-panel glass-specular p-4 sm:p-5 rounded-2xl border transition-all duration-300 shadow-2xl flex flex-col justify-between ${
        isCritical
          ? 'border-red-500/80 bg-red-950/20 glow-red ring-1 ring-red-500/40'
          : isWarning
          ? 'border-amber-500/50 bg-amber-950/20'
          : 'border-white/10'
      }`}
    >
      {/* 1. Header with Status Indicator */}
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/5">
        <div>
          <div className="headline-eyebrow text-[10px] text-purple-300/80 font-tech uppercase tracking-wider">
            RADAR-NET v4.2 • REAL-TIME PIPELINE
          </div>
          <h3 className="headline-title text-sm sm:text-base font-sora font-bold text-white tracking-tight flex items-center gap-2">
            <Zap className={`w-4 h-4 ${isCritical ? 'text-red-400 animate-pulse' : 'text-purple-400'}`} />
            FALL VERIFICATION SEQUENCE
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {isCritical ? (
            <span className="text-[10px] sm:text-[11px] font-tech font-bold px-2.5 py-1 rounded-full bg-red-950/90 text-red-300 border border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.4)] flex items-center gap-1.5 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> P1 CRITICAL EVENT
            </span>
          ) : (
            <span className="text-[10px] sm:text-[11px] font-tech font-bold px-2.5 py-1 rounded-full bg-purple-950/70 text-purple-300 border border-purple-500/30">
              STANDBY / ARMED
            </span>
          )}
        </div>
      </div>

      {/* 2. Interconnected Overlapping Pipeline Stepper (Going forward Left -> Right) */}
      <div className="my-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-0 sm:-space-x-2">
          {pipelineSteps.map((item, idx) => {
            const isLast = idx === pipelineSteps.length - 1;
            const isHighlighted = isCritical && (item.status === 'passed' || item.status === 'active');

            return (
              <div
                key={item.step}
                style={{ zIndex: 10 + idx }}
                className={`relative flex-1 rounded-xl sm:rounded-none sm:first:rounded-l-xl sm:last:rounded-r-xl p-2.5 sm:py-2.5 sm:px-3 border transition-all duration-300 shadow-md ${
                  isLast && isCritical
                    ? 'bg-gradient-to-r from-red-950/90 to-red-900/90 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.35)] ring-1 ring-red-500/60'
                    : isHighlighted
                    ? 'bg-gradient-to-r from-[#0d1d23] to-[#0a2725] border-emerald-500/50 text-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                    : 'bg-[#0e1424]/90 border-white/10 text-slate-400'
                }`}
              >
                {/* Visual Forward Chevron Arrow Divider on Desktop */}
                {!isLast && (
                  <div className="hidden sm:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-30 pointer-events-none items-center justify-center w-5 h-5 rounded-full bg-slate-950 border border-white/20 text-slate-400 shadow-lg">
                    <ChevronRight className="w-3 h-3 text-cyan-400 stroke-[2.5]" />
                  </div>
                )}

                {/* Card Interior: Clean, Perfectly Aligned Typography */}
                <div className="flex flex-col justify-between h-full space-y-1">
                  {/* Top Line: Step number & Clean Title */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`text-[9px] font-tech font-bold px-1.5 py-0.5 rounded ${
                          isLast && isCritical
                            ? 'bg-red-500 text-white shadow-sm'
                            : isHighlighted
                            ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.step}
                      </span>
                      <span className="text-xs font-sora font-bold tracking-tight text-white truncate">
                        {item.title}
                      </span>
                    </div>

                    {isLast && isCritical ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-red-400 animate-pulse shrink-0" />
                    ) : isHighlighted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
                    )}
                  </div>

                  {/* Value Line: Clearly aligned and uncluttered */}
                  <div className="pt-1 border-t border-white/5 flex items-baseline justify-between gap-1">
                    <span className="text-[9px] font-tech text-slate-400 uppercase tracking-wider shrink-0">
                      VAL
                    </span>
                    <span className={`text-[11px] font-tech font-bold tracking-tight text-right truncate ${item.valColor}`}>
                      {item.val}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Integrated Kinetic Impact Force Decay Bar */}
      <div className="mt-3 p-2.5 sm:p-3 rounded-xl bg-slate-950/60 border border-white/5">
        <div className="flex items-center justify-between text-[11px] mb-1.5 font-sora">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold tracking-wide uppercase text-[10px]">
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span>Kinetic Impact Force Decay</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-tech text-slate-400">IMPACT:</span>
            <span className={`text-xs font-tech font-bold ${isCritical ? 'text-red-400' : 'text-purple-300'}`}>
              {isCritical ? '4.65g (PEAK)' : '0.12g'}
            </span>
          </div>
        </div>
        
        {/* Dynamic Multi-Segment Decay Gauge */}
        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/10 p-[1px]">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isCritical
                ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-red-500 w-[92%] shadow-[0_0_10px_rgba(239,68,68,0.6)]'
                : 'bg-gradient-to-r from-purple-500 to-cyan-500 w-[14%]'
            }`}
          />
        </div>
        <div className="flex justify-between items-center text-[9px] font-tech text-slate-500 mt-1">
          <span>0.0g Base</span>
          <span>1.8g Drop</span>
          <span>3.2g Severe</span>
          <span className="text-red-400 font-bold">&gt;4.0g Trauma</span>
        </div>
      </div>

      {/* 4. Large Thumb-Friendly High-Contrast Action Buttons */}
      {(access.can("dispatch") || access.can("overrideAlert")) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mt-3.5 pt-1">
          {access.can("dispatch") && (
            <button
              id="btn-verify-escalate"
              type="button"
              onClick={onVerifyAlert}
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-sora text-xs sm:text-sm font-bold tracking-wide flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 stroke-[2.5]" />
              <span>VERIFY & ESCALATE</span>
            </button>
          )}
          {access.can("overrideAlert") && (
            <button
              id="btn-false-positive"
              type="button"
              onClick={onOverrideAlert}
              className="w-full py-3 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 active:scale-[0.98] text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:border-amber-500/70 font-sora text-xs sm:text-sm font-bold tracking-wide flex items-center justify-center gap-2 transition-all shadow-[0_0_14px_rgba(245,158,11,0.15)] cursor-pointer"
            >
              <AlertOctagon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 stroke-[2.2]" />
              <span>FALSE POSITIVE</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
