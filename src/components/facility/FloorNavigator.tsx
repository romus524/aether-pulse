import React from 'react';
import { Floor } from '../../types';
import { ShieldAlert, Activity, Wifi, Users } from 'lucide-react';
import aetherPulseLogo from '../../assets/images/aether_pulse_logo_1786819504234.jpg';

interface FloorNavigatorProps {
  floors: Floor[];
  activeFloorId: string;
  onSelectFloor: (floorId: string) => void;
}

export const FloorNavigator: React.FC<FloorNavigatorProps> = ({
  floors,
  activeFloorId,
  onSelectFloor,
}) => {
  // Aggregate KPIs across all floors
  const totalRooms = floors.reduce((acc, f) => acc + f.rooms.length, 0);
  const totalCritical = floors.reduce((acc, f) => acc + f.rooms.filter((r) => r.status === 'critical').length, 0);
  const totalWarnings = floors.reduce((acc, f) => acc + f.rooms.filter((r) => r.status === 'warning').length, 0);

  return (
    <div className="w-full space-y-4">
      {/* Top Header & Facility KPI Strip */}
      <div className="p-4 rounded-xl glass-panel border border-white/10 shadow-lg backdrop-blur-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative w-12 h-12 rounded-xl bg-slate-950/80 border border-purple-500/30 overflow-hidden p-1 group shrink-0">
            <img 
              src={aetherPulseLogo} 
              alt="Aether Pulse Care Logo" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-110" 
            />
            <div className="absolute inset-0 rounded-xl border border-purple-400/20 pointer-events-none" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="status-label text-[10px] text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-500/30 font-bold">
                AETHER PULSE COMMAND
              </span>
              <span className="text-[10px] font-tech text-cyan-400">ST. JUDE MEDICAL CENTER • CAMPUS NORTH</span>
            </div>
            <h1 className="font-sora font-extrabold text-xl lg:text-2xl text-white tracking-tight mt-0.5">
              LIVE ROOM GRID & WARD NAVIGATOR
            </h1>
          </div>
        </div>

        {/* Global Facility KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto">
          {/* Occupancy */}
          <div className="group relative bg-white/[0.03] hover:bg-white/[0.06] p-3 rounded-2xl border border-white/[0.08] hover:border-cyan-500/30 backdrop-blur-md shadow-lg transition-all duration-300 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 shadow-[0_0_14px_rgba(6,182,212,0.15)] group-hover:scale-105 transition-transform shrink-0">
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] text-slate-400 font-sora font-semibold tracking-wider uppercase truncate">
                OCCUPANCY
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-sora font-extrabold text-base sm:text-lg text-white tracking-tight">
                  {totalRooms}
                </span>
                <span className="text-[11px] font-sora text-cyan-400/80 font-medium tracking-normal">
                  Rooms
                </span>
              </div>
            </div>
          </div>

          {/* Critical P1 */}
          <div className={`group relative p-3 rounded-2xl border backdrop-blur-md shadow-lg transition-all duration-300 flex items-center gap-3 ${
            totalCritical > 0
              ? 'bg-red-950/20 hover:bg-red-950/30 border-red-500/30 hover:border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.12)]'
              : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08] hover:border-emerald-500/30'
          }`}>
            <div className={`p-2.5 rounded-xl border group-hover:scale-105 transition-transform shrink-0 ${
              totalCritical > 0
                ? 'bg-red-500/15 text-red-300 border-red-500/40 shadow-[0_0_14px_rgba(239,68,68,0.3)] animate-pulse'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 shadow-[0_0_14px_rgba(16,185,129,0.15)]'
            }`}>
              <ShieldAlert className={`w-4 h-4 ${totalCritical > 0 ? 'text-red-400' : 'text-emerald-400'}`} />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] text-slate-400 font-sora font-semibold tracking-wider uppercase truncate">
                CRITICAL P1
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className={`font-sora font-extrabold text-base sm:text-lg tracking-tight ${
                  totalCritical > 0 ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.4)]' : 'text-emerald-400'
                }`}>
                  {totalCritical}
                </span>
                <span className={`text-[11px] font-sora font-medium tracking-normal ${
                  totalCritical > 0 ? 'text-red-300/80' : 'text-slate-400'
                }`}>
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Pre-Exit Alerts */}
          <div className="group relative bg-white/[0.03] hover:bg-white/[0.06] p-3 rounded-2xl border border-white/[0.08] hover:border-amber-500/30 backdrop-blur-md shadow-lg transition-all duration-300 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-[0_0_14px_rgba(245,158,11,0.15)] group-hover:scale-105 transition-transform shrink-0">
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] text-slate-400 font-sora font-semibold tracking-wider uppercase truncate">
                PRE-EXIT
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className={`font-sora font-extrabold text-base sm:text-lg tracking-tight ${
                  totalWarnings > 0 ? 'text-amber-400' : 'text-white'
                }`}>
                  {totalWarnings}
                </span>
                <span className="text-[11px] font-sora text-amber-300/80 font-medium tracking-normal">
                  Alerts
                </span>
              </div>
            </div>
          </div>

          {/* Mesh Health */}
          <div className="group relative bg-white/[0.03] hover:bg-white/[0.06] p-3 rounded-2xl border border-white/[0.08] hover:border-emerald-500/30 backdrop-blur-md shadow-lg transition-all duration-300 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shadow-[0_0_14px_rgba(16,185,129,0.15)] group-hover:scale-105 transition-transform shrink-0">
              <Wifi className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] text-slate-400 font-sora font-semibold tracking-wider uppercase truncate">
                MESH HEALTH
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-sora font-extrabold text-base sm:text-lg text-emerald-400 tracking-tight">
                  100%
                </span>
                <span className="text-[11px] font-sora text-emerald-300/80 font-medium tracking-normal">
                  Online
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floor Selection Tabs Strip */}
      <div className="p-2 rounded-2xl glass-panel border border-white/10 shadow-xl backdrop-blur-xl flex items-center gap-2 overflow-x-auto scrollbar-none">
        {floors.map((floor) => {
          const isActive = floor.id === activeFloorId;
          const critCount = floor.rooms.filter((r) => r.status === 'critical').length;
          const warnCount = floor.rooms.filter((r) => r.status === 'warning').length;

          return (
            <button
              key={floor.id}
              onClick={() => onSelectFloor(floor.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-sora font-bold transition-all duration-300 flex items-center gap-2.5 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-purple-700 text-white shadow-sm ring-1 ring-purple-400/60 border border-purple-400/60'
                  : 'glass-pill hover:bg-white/10 text-slate-300 hover:text-white border border-white/5'
              }`}
            >
              <span>{floor.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-tech font-bold ${
                isActive ? 'bg-purple-950/80 text-purple-200' : 'bg-slate-900 text-slate-400'
              }`}>
                {floor.rooms.length} RMs
              </span>

              {/* Critical Alert Dot */}
              {critCount > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping ring-2 ring-red-400" title={`${critCount} Critical Alert(s)`} />
              )}
              {critCount === 0 && warnCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400" title={`${warnCount} Warning Alert(s)`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
