import React, { useState, useEffect } from 'react';
import { FacilityRoom } from '../../types';
import { User, Send, Clock, Eye } from 'lucide-react';

interface RoomCardProps {
  room: FacilityRoom;
  isSelected: boolean;
  onSelectRoom: (roomId: string) => void;
  onDispatchModal: (room: FacilityRoom) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  isSelected,
  onSelectRoom,
  onDispatchModal,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live elapsed counter since entered state
  useEffect(() => {
    const calcElapsed = () => {
      const diff = Math.max(0, Math.floor((Date.now() - room.enteredStateAt) / 1000));
      setElapsedSeconds(diff);
    };
    calcElapsed();
    const timer = setInterval(calcElapsed, 1000);
    return () => clearInterval(timer);
  }, [room.enteredStateAt]);

  const formatElapsedTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      return `${hrs}h ${mins % 60}m`;
    }
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // State text and dot style config
  const getStateConfig = () => {
    switch (room.status) {
      case 'critical':
        return {
          label: 'CRITICAL FALL',
          dot: 'bg-red-400 animate-ping',
          textColor: 'text-red-400 font-bold',
          border: 'border-red-500/70 shadow-[0_8px_25px_rgba(239,68,68,0.25)] bg-gradient-to-b from-red-950/30 via-slate-950/90 to-slate-950 ring-1 ring-red-500/40',
        };
      case 'warning':
        return {
          label: 'PRE-EXIT WATCH',
          dot: 'bg-amber-400 animate-pulse',
          textColor: 'text-amber-400 font-bold',
          border: 'border-amber-500/60 shadow-[0_8px_20px_rgba(245,158,11,0.15)] bg-gradient-to-b from-amber-950/25 via-slate-950/90 to-slate-950 ring-1 ring-amber-500/30',
        };
      case 'responding':
        return {
          label: 'TEAM RESPONDING',
          dot: 'bg-blue-400 animate-pulse',
          textColor: 'text-blue-400 font-bold',
          border: 'border-blue-500/60 shadow-[0_8px_20px_rgba(59,130,246,0.2)] bg-gradient-to-b from-blue-950/25 via-slate-950/90 to-slate-950',
        };
      case 'normal':
      default: {
        const movementUpper = (room.movement || '').toUpperCase();
        let displayLabel = 'RESTING';
        if (movementUpper.includes('BED') && movementUpper.includes('DOOR')) {
          displayLabel = 'BED → DOOR';
        } else if (movementUpper.includes('STANDING')) {
          displayLabel = 'STANDING';
        } else if (movementUpper.includes('SUPINE') || movementUpper.includes('RESTING')) {
          displayLabel = 'RESTING';
        } else if (room.movement) {
          displayLabel = room.movement;
        }

        return {
          label: displayLabel,
          dot: 'bg-emerald-400',
          textColor: 'text-slate-300 font-medium',
          border: 'border-white/10 hover:border-purple-400/40 bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-[#0b0f19]',
        };
      }
    }
  };

  const stateConfig = getStateConfig();
  const bedClean = room.bedNumber.replace(/^[0-9]+-/, '');

  return (
    <div
      id={`room-card-${room.roomNumber}`}
      onClick={() => onSelectRoom(room.id)}
      className={`relative group rounded-2xl glass-card transition-all duration-300 cursor-pointer overflow-hidden p-3.5 border flex flex-col justify-between backdrop-blur-xl ${
        isSelected
          ? 'border-purple-400/70 ring-1 ring-purple-400/35 bg-slate-900/95'
          : stateConfig.border
      }`}
    >
      {/* 1. Header Zone (Room & Sensor Status) */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/5">
        <div className="flex items-baseline gap-1.5">
          <span className="font-sora font-extrabold text-base sm:text-lg text-white tracking-tight">
            RM {room.roomNumber}
          </span>
        </div>

        {/* Clean Pill Sub-ID / Sensor Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-white/10 text-[10px] font-tech text-slate-300 shadow-inner">
          <span className="font-semibold text-slate-200">
            Bed {bedClean}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-cyan-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            5.8GHz CSI
          </span>
        </div>
      </div>

      {/* 2. Patient Identity & Clinical Metadata */}
      <div className="pt-2.5 pb-1">
        {/* Name & Demographics on a single clear line */}
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <User className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="font-sora font-bold text-white text-xs sm:text-sm tracking-tight truncate group-hover:text-purple-300 transition-colors">
              {room.patient.name}
            </span>
          </div>
          <span className="font-tech text-xs text-slate-400 font-semibold shrink-0">
            · {room.patient.age}{room.patient.gender[0]}
          </span>
        </div>

        {/* Compact Meta Row: MRN and Diagnosis on one clean truncated line */}
        <div className="flex items-center gap-1.5 text-[11px] font-tech text-slate-400 truncate mt-1">
          <span className="text-cyan-400/90 font-medium shrink-0">
            MRN-{room.patient.mrn.replace('MRN-', '')}
          </span>
          <span className="text-slate-600 shrink-0">|</span>
          <span className="text-slate-300 truncate" title={`Dx: ${room.patient.diagnosis}`}>
            Dx: {room.patient.diagnosis}
          </span>
        </div>
      </div>

      {/* 3. Vital Signs Grid (The Core Metrics) */}
      <div className="grid grid-cols-3 gap-1.5 my-2">
        {/* Heart Rate */}
        <div className="bg-slate-950/80 py-2 px-1 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
          <span className={`text-base sm:text-lg font-tech font-bold leading-none ${room.heartRate > 105 || room.heartRate < 55 ? 'text-red-400' : 'text-white'}`}>
            {room.heartRate}
          </span>
          <span className="text-[9px] font-tech font-semibold text-slate-400 uppercase tracking-wider mt-1">
            BPM
          </span>
        </div>

        {/* Respiration */}
        <div className="bg-slate-950/80 py-2 px-1 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
          <span className={`text-base sm:text-lg font-tech font-bold leading-none ${room.respirationRate < 10 || room.respirationRate > 22 ? 'text-amber-400' : 'text-white'}`}>
            {room.respirationRate}
          </span>
          <span className="text-[9px] font-tech font-semibold text-slate-400 uppercase tracking-wider mt-1">
            RPM
          </span>
        </div>

        {/* Fall Risk Index */}
        <div className="bg-slate-950/80 py-2 px-1 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
          <span className={`text-base sm:text-lg font-tech font-bold leading-none ${room.fallRiskScore >= 18 ? 'text-red-400 font-extrabold' : room.fallRiskScore >= 15 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {room.fallRiskScore}/24
          </span>
          <span className="text-[9px] font-tech font-semibold text-slate-400 uppercase tracking-wider mt-1">
            RISK
          </span>
        </div>
      </div>

      {/* 4. Footer & Action Bar */}
      <div className="pt-1">
        {/* Status Pill with Timer */}
        <div className="flex items-center justify-between text-[11px] font-tech px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-white/5 mb-2.5">
          <span className="flex items-center gap-1.5 tracking-wide">
            <span className={`w-2 h-2 rounded-full ${stateConfig.dot}`} />
            <span className={stateConfig.textColor}>{stateConfig.label}</span>
          </span>
          <span className="flex items-center gap-1 text-slate-400 font-medium shrink-0">
            <Clock className="w-3 h-3 text-cyan-400" />
            {formatElapsedTime(elapsedSeconds)}
          </span>
        </div>

        {/* Primary Action Buttons: Dominant full-width INSPECT + minimal dispatch icon */}
        <div className="flex items-center gap-2">
          <button
            id={`btn-inspect-${room.roomNumber}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectRoom(room.id);
            }}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 active:scale-[0.98] text-white hover:text-cyan-200 border border-white/10 hover:border-cyan-500/40 text-xs font-sora font-bold tracking-wide transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            title="Open Room Inspector and 3D Clinical Twin"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>INSPECT</span>
          </button>

          <button
            id={`btn-dispatch-${room.roomNumber}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDispatchModal(room);
            }}
            className={`p-2 rounded-xl transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-sm active:scale-[0.96] border ${
              room.status === 'critical'
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/40 animate-pulse border-red-400/60'
                : room.status === 'responding'
                ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400/50'
                : 'bg-purple-600/80 hover:bg-purple-500 text-white border-purple-400/40'
            }`}
            title="Quick Dispatch / Alert Rapid Response"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
