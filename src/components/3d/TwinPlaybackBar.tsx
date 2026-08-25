import React from 'react';
import { CircleDot, Pause, Play, Radio, RotateCcw } from 'lucide-react';
import { EventScenario, KeyframeEvent } from '../SimulatedEventVideoFeed';

interface TwinPlaybackBarProps {
  scenario: EventScenario;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isLive: boolean;
  playbackSpeed: number;
  activeEvent: KeyframeEvent | null;
  onTogglePlay: () => void;
  onGoLive: () => void;
  onReplay: () => void;
  onSeek: (time: number) => void;
  onSpeed: (speed: number) => void;
}

const formatClock = (time: number) => {
  const clamped = Math.max(time, 0);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toFixed(1).padStart(4, '0')}`;
};

const markerColor = (type: KeyframeEvent['type']) => {
  if (type === 'impact' || type === 'critical') return 'bg-red-500 border-red-200';
  if (type === 'warning') return 'bg-amber-400 border-amber-100';
  return 'bg-cyan-400 border-cyan-100';
};

export const TwinPlaybackBar: React.FC<TwinPlaybackBarProps> = ({
  scenario,
  currentTime,
  duration,
  isPlaying,
  isLive,
  playbackSpeed,
  activeEvent,
  onTogglePlay,
  onGoLive,
  onReplay,
  onSeek,
  onSpeed,
}) => {
  return (
    <div className="pointer-events-auto w-full rounded-2xl border border-white/10 bg-[#070b14]/88 px-3 py-2 shadow-2xl backdrop-blur-xl">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-[10px] font-sora font-bold uppercase tracking-[0.14em] text-slate-400">
            Scenario
          </span>
          <span className="truncate text-[11px] font-sora font-semibold text-white">
            {scenario.title}
          </span>
        </div>
        {activeEvent && (
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-tech font-bold uppercase ${
              activeEvent.type === 'impact' || activeEvent.type === 'critical'
                ? 'border-red-500/40 bg-red-950/80 text-red-200'
                : activeEvent.type === 'warning'
                  ? 'border-amber-500/40 bg-amber-950/80 text-amber-200'
                  : 'border-cyan-500/40 bg-cyan-950/80 text-cyan-200'
            }`}
          >
            {activeEvent.label}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onGoLive}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-sora font-bold uppercase tracking-wide transition-colors ${
            isLive
              ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/50'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Radio className={`h-3 w-3 ${isLive ? 'animate-pulse' : ''}`} />
          Live
        </button>

        <button
          type="button"
          onClick={onTogglePlay}
          className="rounded-full bg-white/10 p-1.5 text-white transition-colors hover:bg-white/20"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
        </button>

        <button
          type="button"
          onClick={onReplay}
          className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          title="Replay from start"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>

        <span className="w-12 shrink-0 text-right font-tech text-[10px] text-cyan-300">
          {formatClock(currentTime)}
        </span>

        <div className="relative min-w-0 flex-1 py-1">
          {scenario.keyframes.map((keyframe) => (
            <button
              key={`${keyframe.time}-${keyframe.label}`}
              type="button"
              title={`${keyframe.label} · T+${keyframe.time.toFixed(1)}s`}
              onClick={() => onSeek(keyframe.time)}
              style={{ left: `${(keyframe.time / duration) * 100}%` }}
              className={`absolute top-1/2 z-20 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border ${markerColor(keyframe.type)}`}
            />
          ))}
          <input
            type="range"
            min={0}
            max={duration}
            step={0.05}
            value={Math.min(currentTime, duration)}
            onChange={(event) => onSeek(Number(event.target.value))}
            className="relative z-10 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-cyan-400"
          />
        </div>

        <span className="w-12 shrink-0 font-tech text-[10px] text-slate-500">
          {formatClock(duration)}
        </span>

        <div className="hidden items-center gap-0.5 rounded-full border border-white/10 bg-slate-950/70 p-0.5 sm:flex">
          {[0.5, 1, 1.5, 2].map((speed) => (
            <button
              key={speed}
              type="button"
              onClick={() => onSpeed(speed)}
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-tech font-bold ${
                playbackSpeed === speed ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-500 hover:text-white'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const TwinEventMarkerHint: React.FC<{ event: KeyframeEvent | null }> = ({ event }) => {
  if (!event) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-16 z-20 hidden -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/80 px-3 py-1 text-[10px] font-sora text-slate-200 backdrop-blur-xl sm:flex">
      <CircleDot className="h-3 w-3 text-cyan-300" />
      <span className="font-bold text-white">T+{event.time.toFixed(1)}s</span>
      <span className="text-slate-400">{event.description}</span>
    </div>
  );
};
