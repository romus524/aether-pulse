import React from 'react';
import { Plus, Minus, RotateCcw, Maximize2 } from 'lucide-react';

interface MapControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFit: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  onFit,
}) => {
  return (
    <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2 glass-panel p-2 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl">
      <button
        onClick={onZoomIn}
        className="p-2.5 rounded-xl glass-pill hover:bg-purple-900/60 hover:text-purple-200 text-slate-300 transition-all cursor-pointer"
        title="Zoom In (+)"
        aria-label="Zoom in"
      >
        <Plus className="w-4 h-4" />
      </button>

      <div className="text-[10px] font-tech text-center text-cyan-300 font-bold px-1 py-0.5 border-y border-white/10">
        {Math.round(zoom * 100)}%
      </div>

      <button
        onClick={onZoomOut}
        className="p-2.5 rounded-xl glass-pill hover:bg-purple-900/60 hover:text-purple-200 text-slate-300 transition-all cursor-pointer"
        title="Zoom Out (-)"
        aria-label="Zoom out"
      >
        <Minus className="w-4 h-4" />
      </button>

      <button
        onClick={onFit}
        className="p-2.5 rounded-xl glass-pill hover:bg-purple-900/60 hover:text-purple-200 text-slate-300 transition-all cursor-pointer"
        title="Fit Floor Plan"
        aria-label="Fit floor plan"
      >
        <Maximize2 className="w-4 h-4" />
      </button>

      <button
        onClick={onReset}
        className="p-2.5 rounded-xl glass-pill hover:bg-purple-900/60 hover:text-purple-200 text-slate-300 transition-all cursor-pointer"
        title="Reset Map View"
        aria-label="Reset view"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );
};
