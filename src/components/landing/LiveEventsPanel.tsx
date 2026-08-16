import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface LiveEventsPanelProps {
  onOpenDashboard?: () => void;
}

export const LiveEventsPanel: React.FC<LiveEventsPanelProps> = ({ onOpenDashboard }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <div
      className={`fixed bottom-0 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-[360px] md:max-w-[400px] transition-all duration-500 ease-out ${
        isExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-3.2rem)]'
      }`}
    >
      <div
        className="organic-blob-bottom py-3 px-5 text-center cursor-pointer select-none group"
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        {/* Subtle Indicator bar */}
        <div className="flex items-center justify-center mb-1.5">
          <div className="w-8 h-0.5 rounded-full bg-purple-400/30 group-hover:bg-cyan-400/60 transition-colors" />
        </div>

        {/* Header Title strictly matching reference image: "LIVE EVENTS" */}
        <div className="flex items-center justify-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
          <h3 className="font-manrope text-xs md:text-sm font-bold tracking-[0.25em] text-slate-300 group-hover:text-white uppercase transition-colors">
            LIVE EVENTS
          </h3>
          <span className="text-purple-400/50 group-hover:text-cyan-300 transition-colors">
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </span>
        </div>

        {/* Live Event status preview */}
        <div className="mt-1 flex items-center justify-center gap-2 text-[11px] font-manrope text-purple-200/70">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>Motion detected</span>
          <span className="text-purple-400/50">•</span>
          <span className="text-white/80 font-medium">Room 12A</span>
          <span className="text-purple-400/50">•</span>
          <span className="text-emerald-400 font-semibold">Stable</span>
        </div>

        {/* Expanded Drawer Details */}
        {isExpanded && (
          <div className="mt-4 pt-3 border-t border-purple-500/20 text-left space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-[10px] font-tech text-purple-300/70 pb-0.5">
              <span>8 SENSORS ONLINE</span>
              <span>5.8 GHz DOPPLER ARRAY</span>
            </div>

            <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-500/20 text-xs flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-200 mr-2">Room 12A</span>
                <span className="text-slate-400 text-[11px]">Kinetic presence active</span>
              </div>
              <span className="text-[10px] font-tech text-cyan-300">0.42 m/s</span>
            </div>

            <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-500/20 text-xs flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-200 mr-2">Room 04B</span>
                <span className="text-slate-400 text-[11px]">Micro-respiration stable</span>
              </div>
              <span className="text-[10px] font-tech text-emerald-400">16 bpm</span>
            </div>

            {onOpenDashboard && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDashboard();
                  }}
                  className="w-full py-1.5 text-[11px] font-bold tracking-wider uppercase rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white transition-all cursor-pointer"
                >
                  Open Ward Systems →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
