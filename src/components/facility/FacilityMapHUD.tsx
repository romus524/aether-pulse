import React from 'react';
import { Floor } from '../../types';
import { Radio, Layers } from 'lucide-react';

interface FacilityMapHUDProps {
  floor: Floor;
}

export const FacilityMapHUD: React.FC<FacilityMapHUDProps> = ({ floor }) => {
  const normalCount = floor.rooms.filter((r) => r.status === 'normal').length;
  const warningCount = floor.rooms.filter((r) => r.status === 'warning').length;
  const criticalCount = floor.rooms.filter((r) => r.status === 'critical').length;
  const respondingCount = floor.rooms.filter((r) => r.status === 'responding').length;

  return (
    <div className="absolute top-4 left-4 z-20 glass-panel p-3.5 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col gap-1.5 text-xs font-sora pointer-events-none max-w-xs">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-1.5">
        <div className="flex items-center gap-1.5 text-purple-300 font-bold status-label text-[11px]">
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          <span>LIVE SPATIAL INDEX</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-tech font-bold">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> SCANNING
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-white font-bold text-sm tracking-tight">{floor.name}</span>
        <span className="font-tech text-[10px] px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/30">
          {floor.rooms.length} ROOMS
        </span>
      </div>

      <p className="text-[10px] text-slate-400 leading-tight font-medium">{floor.description}</p>

      {/* Stats summary strip */}
      <div className="grid grid-cols-4 gap-1 pt-1.5 border-t border-white/10 text-center text-[10px] font-tech font-bold">
        <div className="bg-emerald-950/40 p-1 rounded-lg border border-emerald-500/20 text-emerald-300">
          <span className="block text-[8px] text-slate-400">NORM</span>
          {normalCount}
        </div>
        <div className="bg-amber-950/40 p-1 rounded-lg border border-amber-500/20 text-amber-300">
          <span className="block text-[8px] text-slate-400">PRE</span>
          {warningCount}
        </div>
        <div className="bg-red-950/40 p-1 rounded-lg border border-red-500/20 text-red-300">
          <span className="block text-[8px] text-slate-400">CRIT</span>
          {criticalCount}
        </div>
        <div className="bg-blue-950/40 p-1 rounded-lg border border-blue-500/20 text-blue-300">
          <span className="block text-[8px] text-slate-400">EN RT</span>
          {respondingCount}
        </div>
      </div>
    </div>
  );
};
