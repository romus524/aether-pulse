import React, { useState, useMemo } from 'react';
import { PatientRecord } from '../types';
import { Search, ChevronRight, AlertTriangle, ShieldAlert, Heart, Wind, Radio, User, Activity } from 'lucide-react';

interface WardOverviewGridProps {
  patients: PatientRecord[];
  selectedRoomId: string;
  onSelectRoom: (roomId: string) => void;
}

export const WardOverviewGrid: React.FC<WardOverviewGridProps> = ({
  patients,
  selectedRoomId,
  onSelectRoom,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'high-risk'>('all');

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesSearch =
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.roomNumber.includes(searchQuery) ||
        patient.diagnosis.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'critical') return patient.status === 'critical';
      if (statusFilter === 'high-risk') return patient.fallRiskScore >= 18;

      return true;
    });
  }, [patients, searchQuery, statusFilter]);

  const criticalCount = patients.filter((p) => p.status === 'critical').length;
  const warningCount = patients.filter((p) => p.status === 'warning').length;
  const stableCount = patients.filter((p) => p.status === 'normal').length;

  return (
    <div
      id="ward-overview-panel"
      className="glass-panel p-4 rounded-xl border border-white/10 flex flex-col h-full shadow-lg overflow-hidden"
    >
      {/* Editorial Header & Quick Summary */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
        <div>
          <div className="headline-eyebrow text-[10px] text-purple-300/80 font-tech uppercase tracking-wider">
            ACUTE CARE NEUROLOGY
          </div>
          <h2 className="headline-title text-base sm:text-lg font-sora font-bold tracking-tight text-white flex items-center gap-1.5">
            WARD 4B <span className="text-xs font-tech font-normal text-slate-400">({patients.length} ROOMS)</span>
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-sora">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-medium">
            ● {stableCount} STABLE
          </span>
          {warningCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-500/30 font-medium">
              ● {warningCount} PRE-EXIT
            </span>
          )}
          {criticalCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-red-950/90 text-red-300 border border-red-500/60 font-bold animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.4)]">
              ● {criticalCount} CRITICAL
            </span>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search room, patient, diagnosis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs font-sora bg-slate-950/60 border border-white/10 rounded-full text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-400/80 focus:ring-1 focus:ring-purple-400/50 shadow-inner"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-950/50 p-1 rounded-full border border-white/10 text-[11px] font-sora shrink-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer font-sora text-xs font-semibold ${
              statusFilter === 'all' ? 'bg-purple-900/60 text-purple-200 border border-purple-400/50 glow-purple' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({patients.length})
          </button>
          <button
            onClick={() => setStatusFilter('critical')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer font-sora text-xs font-semibold ${
              statusFilter === 'critical' ? 'bg-red-950 text-red-300 border border-red-500/60 glow-red' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Alerts ({criticalCount})
          </button>
          <button
            onClick={() => setStatusFilter('high-risk')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer font-sora text-xs font-semibold ${
              statusFilter === 'high-risk' ? 'bg-amber-950 text-amber-300 border border-amber-500/60 glow-amber' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            High Risk
          </button>
        </div>
      </div>

      {/* Room Cards Grid */}
      <div 
        className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2.5 max-h-[620px] overscroll-contain"
        data-lenis-prevent="true"
      >
        {filteredPatients.map((patient) => {
          const isSelected = patient.id === selectedRoomId;
          const isCritical = patient.status === 'critical';
          const isWarning = patient.status === 'warning';

          return (
            <div
              key={patient.id}
              onClick={() => onSelectRoom(patient.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                isCritical
                  ? 'bg-red-950/35 border-red-500/60 ring-1 ring-red-500/30'
                  : isWarning
                  ? 'bg-amber-950/25 border-amber-500/50'
                  : isSelected
                  ? 'bg-slate-900/95 border-purple-400/70 ring-1 ring-purple-400/30 translate-y-[-1px]'
                  : 'bg-[#0d1322]/80 border-white/10 hover:border-white/20 hover:bg-[#11192e]/90'
              }`}
            >
              {/* Selected Ambient Glow Accent */}
              {isSelected && (
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-400 via-pink-400 to-cyan-400" />
              )}

              {/* Top Card Row: Room Number, Patient Name, Age & Status Beacon */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-tech font-bold shrink-0 border ${
                      isCritical
                        ? 'bg-red-600 text-white border-red-400'
                        : isWarning
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : isSelected
                        ? 'bg-purple-900/90 text-purple-200 border-purple-400/60'
                        : 'bg-slate-900 text-cyan-300 border-cyan-500/30'
                    }`}
                  >
                    ROOM {patient.roomNumber}
                  </span>
                  <span className="text-sm font-sora font-semibold text-white tracking-tight truncate">
                    {patient.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-tech shrink-0">
                    ({patient.age}{patient.gender[0]})
                  </span>
                </div>

                {/* Status Beacon */}
                <div className="shrink-0">
                  {isCritical ? (
                    <span className="flex items-center gap-1 text-[10px] font-tech font-bold text-red-300 bg-red-950/90 px-2 py-0.5 rounded-full border border-red-500/70 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" /> P1 FALL
                    </span>
                  ) : isWarning ? (
                    <span className="flex items-center gap-1 text-[10px] font-tech font-bold text-amber-300 bg-amber-950/90 px-2 py-0.5 rounded-full border border-amber-500/70">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> PRE-EXIT
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-tech font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> NORMAL
                    </span>
                  )}
                </div>
              </div>

              {/* Patient Diagnosis (Single clean line with ellipsis) */}
              <div className="text-[10px] font-tech text-slate-400 uppercase tracking-wider mb-2.5 truncate">
                {patient.diagnosis}
              </div>

              {/* Streamlined 3-Column Tabular Vital Sign Grid (No duplicate blob noise) */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950/70 py-2 px-3 rounded-xl border border-white/5 text-center">
                <div className="flex flex-col items-center">
                  <span className="text-slate-400 text-[9px] font-tech uppercase tracking-wider">HEART RATE</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className={`text-sm font-tech font-bold ${patient.heartRate > 100 ? 'text-red-400' : 'text-cyan-300'}`}>
                      {patient.heartRate}
                    </span>
                    <span className="text-[9px] text-slate-500 font-tech">BPM</span>
                  </div>
                </div>

                <div className="flex flex-col items-center border-x border-white/5">
                  <span className="text-slate-400 text-[9px] font-tech uppercase tracking-wider">RESPIRATION</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-sm font-tech font-bold text-emerald-400">
                      {patient.respirationRate}
                    </span>
                    <span className="text-[9px] text-slate-500 font-tech">BPM</span>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-slate-400 text-[9px] font-tech uppercase tracking-wider">RADAR SHIFT</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-sm font-tech font-bold text-purple-300">
                      {patient.wifiDopplerRate}
                    </span>
                    <span className="text-[9px] text-slate-500 font-tech">HZ</span>
                  </div>
                </div>
              </div>

              {/* Consolidated Clean Footer Bar */}
              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/5 text-[10px] font-sora">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[10px]">Risk Index:</span>
                  <span className={`font-tech font-bold text-xs ${patient.fallRiskScore >= 20 ? 'text-amber-400' : 'text-slate-300'}`}>
                    {patient.fallRiskScore}/24
                  </span>
                </div>

                <div className="flex items-center gap-1 text-purple-300 group-hover:text-purple-200 font-sora font-semibold text-[11px] transition-colors">
                  <span>INSPECT ROOM</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
          );
        })}

        {filteredPatients.length === 0 && (
          <div className="p-8 text-center text-slate-500 font-mono text-xs glass-card rounded-2xl">
            No rooms match the active filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};
