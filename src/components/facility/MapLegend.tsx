




import React from 'react';
import { Radio } from 'lucide-react';

export const MapLegend: React.FC = () => {
  return (
    <div className="absolute bottom-4 left-4 z-20 glass-panel px-3.5 py-2 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl flex flex-wrap items-center gap-3 text-[10px] font-sora">
      <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 glow-emerald" />
        <span>NORMAL</span>
      </div>
      <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 glow-amber" />
        <span>PRE-EXIT</span>
      </div>
      <div className="flex items-center gap-1.5 text-red-300 font-semibold">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse glow-red" />
        <span>CRITICAL</span>
      </div>
      <div className="flex items-center gap-1.5 text-blue-300 font-semibold">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 glow-blue" />
        <span>RESPONDING</span>
      </div>
      <span className="text-slate-600 hidden sm:inline">|</span>
      <div className="flex items-center gap-1 text-cyan-300 font-semibold">
        <Radio className="w-3 h-3 animate-pulse" />
        <span>ACTIVE SENSOR</span>
      </div>
    </div>
  );
};
