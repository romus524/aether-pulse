import React from 'react';
import { EdgeNodeStatus } from '../types';
import { Cpu, Wifi, Smartphone, Radio, Activity, ShieldCheck } from 'lucide-react';

interface EdgeNodePanelProps {
  nodes: EdgeNodeStatus[];
}

export const EdgeNodePanel: React.FC<EdgeNodePanelProps> = ({ nodes }) => {
  const onlineCount = nodes.filter((n) => n.status === 'online').length;

  return (
    <div className="glass-panel glass-specular p-5 rounded-2xl border border-white/10 flex flex-col h-full shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
        <div>
          <div className="headline-eyebrow">DISTRIBUTED MESH</div>
          <h3 className="headline-title text-sm font-sora font-bold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            EDGE HARDWARE & WEARABLE SYNC
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-tech px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1 status-label">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> {onlineCount}/{nodes.length} ONLINE
          </span>
          <span className="text-[10px] font-tech px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-cyan-400" /> AES-256
          </span>
        </div>
      </div>

      {/* Nodes Cards Grid */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs max-h-[170px] custom-scrollbar">
        {nodes.map((node) => (
          <div key={node.id} className="p-3 rounded-xl glass-card border border-white/5 hover:border-purple-400/30 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="font-sora font-semibold text-white text-xs flex items-center gap-2">
                {node.type.includes('Watch') ? <Smartphone className="w-3.5 h-3.5 text-cyan-400" /> : <Wifi className="w-3.5 h-3.5 text-purple-400 animate-pulse" />}
                {node.name}
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-tech font-bold">
                {node.latencyMs}ms LATENCY
              </span>
            </div>

            {/* Metrics & Progress Line */}
            <div className="grid grid-cols-3 gap-3 text-[10px] text-slate-300 pt-2 border-t border-white/5 font-tech">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-400">CPU</span>
                  <strong className="text-white">{node.cpuLoadPercent}%</strong>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-purple-400 h-full rounded-full transition-all duration-500" style={{ width: `${node.cpuLoadPercent}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-400">TEMP</span>
                  <strong className="text-white">{node.tempCelsius}°C</strong>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-cyan-400 h-full rounded-full transition-all duration-500" style={{ width: `${(node.tempCelsius / 80) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-400">RAM</span>
                  <strong className="text-white">{node.ramPercent}%</strong>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${node.ramPercent}%` }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
