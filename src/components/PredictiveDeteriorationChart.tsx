import React, { useState, useEffect } from 'react';
import { DeteriorationDataPoint } from '../types';
import { TrendingUp, Cpu, Activity, ShieldAlert, AlertTriangle, CheckCircle2, ArrowUpRight, Sparkles } from 'lucide-react';

interface PredictiveDeteriorationChartProps {
  data: DeteriorationDataPoint[];
}

export const PredictiveDeteriorationChart: React.FC<PredictiveDeteriorationChartProps> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isAnimated, setIsAnimated] = useState(false);

  // Smooth entry animation on mount / data change
  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 60);
    return () => clearTimeout(timer);
  }, []);

  // Semantic Risk Classification Helper
  const getRiskClassification = (score: number) => {
    if (score >= 85) {
      return {
        level: 'CRITICAL',
        badgeColor: 'text-red-400 bg-red-950/80 border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.35)]',
        barGradient: 'from-rose-500 via-red-600 to-red-950/90',
        topCapColor: 'bg-red-300 shadow-[0_0_8px_rgba(252,165,165,0.8)]',
        glowStyle: 'shadow-[0_0_20px_rgba(239,68,68,0.3)] ring-1 ring-red-500/50',
        textColor: 'text-red-400',
        borderColor: 'border-red-500/50',
        isSevere: true,
        factors: ['Severe Gait Instability', 'Ground Immobility Detected', 'High Micro-Doppler Variance'],
      };
    }
    if (score >= 45) {
      return {
        level: 'ELEVATED',
        badgeColor: 'text-amber-300 bg-amber-950/70 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
        barGradient: 'from-amber-400 via-amber-500 to-orange-950/90',
        topCapColor: 'bg-amber-200 shadow-[0_0_8px_rgba(253,230,138,0.8)]',
        glowStyle: 'shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/40',
        textColor: 'text-amber-400',
        borderColor: 'border-amber-500/40',
        isSevere: false,
        factors: ['Pre-Exit Motion Vector', 'Orthostatic Posture Shift', 'Elevated Respiration Variability'],
      };
    }
    return {
      level: 'LOW',
      badgeColor: 'text-purple-300 bg-purple-950/60 border-purple-500/40',
      barGradient: 'from-purple-400 via-indigo-500 to-purple-950/90',
      topCapColor: 'bg-purple-200 shadow-[0_0_6px_rgba(233,213,255,0.6)]',
      glowStyle: 'shadow-[0_0_12px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/30',
      textColor: 'text-purple-300',
      borderColor: 'border-purple-500/30',
      isSevere: false,
      factors: ['Resting Supine Profile', 'Nominal Vitals Baseline', 'Zero In-Bed Agitation'],
    };
  };

  const yTicks = [100, 80, 60, 40, 20, 0];

  return (
    <div
      id="predictive-risk-chart-panel"
      className="glass-panel glass-specular p-4 sm:p-5 rounded-3xl border border-white/10 flex flex-col h-full shadow-2xl relative overflow-hidden backdrop-blur-xl transition-all duration-300"
    >
      {/* Subtle Ambient Radial Illumination */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-cyan-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* 1. Header Zone: Refined Typographic Hierarchy & Precision Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/5 relative z-10">
        <div>
          <div className="headline-eyebrow text-[10px] text-purple-300/80 font-tech uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-purple-400" />
            AI-ASSISTED FORECAST
          </div>
          <h3 className="headline-title text-sm sm:text-base font-sora font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            48-HOUR PREDICTIVE RISK PROJECTION
          </h3>
          <p className="text-[11px] font-sora text-slate-400 mt-0.5">
            Peak probability of critical fall or instability within the next 48 hours.
          </p>
        </div>

        {/* Compact Premium Glass Badges */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <span className="text-[10px] font-tech font-semibold px-2.5 py-1 rounded-full bg-purple-950/60 hover:bg-purple-950/80 text-purple-200 border border-purple-500/30 flex items-center gap-1.5 backdrop-blur-md transition-all shadow-inner">
            <Cpu className="w-3 h-3 text-purple-400" />
            <span>ML MODEL (98.4% CONFIDENCE)</span>
          </span>
          <span className="text-[10px] font-tech font-semibold px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-slate-900 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 backdrop-blur-md transition-all shadow-inner">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>ACUTE NEURO</span>
          </span>
        </div>
      </div>

      {/* 2. Chart Surface: Precision Instrument Canvas */}
      <div className="flex-1 w-full min-h-[220px] bg-[#070b14]/80 rounded-2xl p-4 sm:p-5 border border-white/5 relative flex flex-col justify-between overflow-hidden shadow-inner z-10">
        
        {/* Subtle Horizontal Reference Gridlines */}
        <div className="absolute inset-x-4 sm:inset-x-5 top-5 bottom-12 flex flex-col justify-between pointer-events-none">
          {yTicks.map((tick) => (
            <div key={tick} className="w-full flex items-center gap-2">
              <span className="text-[9px] font-tech text-slate-600 w-5 text-right shrink-0 select-none">
                {tick}
              </span>
              <div className={`flex-1 h-[1px] ${tick === 0 ? 'bg-white/15' : 'border-b border-dashed border-white/[0.04]'}`} />
            </div>
          ))}
        </div>

        {/* 3. Interactive Risk Bars Plotting Stage */}
        <div className="relative flex-1 flex items-end pl-8 pr-1 pt-4 pb-0 z-10">
          <div className="w-full h-full flex items-end justify-around gap-2 sm:gap-4">
            {data.map((d, index) => {
              const classification = getRiskClassification(d.riskScore);
              const isHovered = hoveredIndex === index;
              const hasHover = hoveredIndex !== null;
              const isDimmed = hasHover && !isHovered;
              const barHeightPercent = isAnimated ? Math.max(d.riskScore, 6) : 0;
              const isTall = d.riskScore >= 45;

              return (
                <div
                  key={d.roomNumber}
                  className="relative flex-1 h-full flex flex-col justify-end items-center group cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => setHoveredIndex(index)}
                >
                  {/* Floating Clinical Tooltip for Hovered Bar */}
                  {isHovered && (
                    <div className="absolute -top-20 sm:-top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                      <div className="bg-slate-950/95 border border-white/20 rounded-xl p-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.85)] backdrop-blur-xl text-left whitespace-nowrap min-w-[190px] ring-1 ring-white/10">
                        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-1 mb-1.5">
                          <span className="font-sora font-bold text-xs text-white">
                            RM {d.roomNumber} · {d.patientName}
                          </span>
                          <span className={`text-[9px] font-tech font-bold px-1.5 py-0.2 rounded ${classification.badgeColor}`}>
                            {d.riskScore}% {classification.level}
                          </span>
                        </div>
                        <div className="text-[10px] font-tech text-slate-400 flex items-center justify-between mb-1">
                          <span>Trend: <strong className="text-slate-200 capitalize">{d.trend}</strong></span>
                          <span>Severity: <strong className={classification.textColor}>{d.severity.toUpperCase()}</strong></span>
                        </div>
                        <div className="text-[9px] font-sora text-slate-400 space-y-0.5 pt-0.5 border-t border-white/5">
                          {classification.factors.slice(0, 2).map((factor, i) => (
                            <div key={i} className="flex items-center gap-1 text-slate-300">
                              <span className="w-1 h-1 rounded-full bg-purple-400 shrink-0" />
                              <span className="truncate">{factor}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Tooltip Downward Beak */}
                      <div className="w-2.5 h-2.5 bg-slate-950 border-r border-b border-white/20 rotate-45 mx-auto -mt-1.5" />
                    </div>
                  )}

                  {/* Micro-Indicator & Percentage Label (Above Short Bars) */}
                  {!isTall && (
                    <div
                      className={`mb-1.5 flex flex-col items-center transition-all duration-300 ${
                        isDimmed ? 'opacity-30' : 'opacity-100'
                      }`}
                    >
                      <span className={`text-xs font-tech font-bold tracking-tight ${classification.textColor}`}>
                        {d.riskScore}%
                      </span>
                      <span className="text-[8px] font-tech text-slate-400 font-semibold tracking-wider uppercase">
                        {classification.level}
                      </span>
                    </div>
                  )}

                  {/* The Physical Bar Column */}
                  <div className="w-full max-w-[48px] sm:max-w-[64px] h-full flex items-end justify-center relative">
                    <div
                      style={{ height: `${barHeightPercent}%` }}
                      className={`w-full rounded-t-xl bg-gradient-to-t ${classification.barGradient} border-t border-x ${classification.borderColor} transition-all duration-700 ease-out relative flex flex-col justify-between items-center overflow-hidden ${
                        isHovered
                          ? `${classification.glowStyle} scale-y-[1.02] translate-y-[-2px] brightness-110`
                          : isDimmed
                          ? 'opacity-35 brightness-75'
                          : classification.isSevere
                          ? 'shadow-[0_0_18px_rgba(239,68,68,0.35)] ring-1 ring-red-500/40'
                          : 'shadow-md'
                      }`}
                    >
                      {/* Top Specular Glow Cap */}
                      <div className={`w-full h-[3px] rounded-t-xl ${classification.topCapColor}`} />

                      {/* Inside Label for Tall Bars */}
                      {isTall && (
                        <div
                          className={`pt-2 flex flex-col items-center transition-all duration-300 ${
                            isDimmed ? 'opacity-30' : 'opacity-100'
                          }`}
                        >
                          <span className="text-xs sm:text-sm font-tech font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] tracking-tight">
                            {d.riskScore}%
                          </span>
                          <span className="text-[8px] sm:text-[9px] font-tech font-bold text-white/90 uppercase tracking-wider drop-shadow-sm">
                            {classification.level}
                          </span>
                        </div>
                      )}

                      {/* Bottom Subtle Bar Shading */}
                      <div className="w-full h-4 bg-gradient-to-t from-black/40 to-transparent pointer-events-none mt-auto" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. X-Axis Room Identifier Labels with Hover Sync */}
        <div className="pl-8 pr-1 pt-2.5 border-t border-white/10 flex items-center justify-around gap-2 sm:gap-4 relative z-10">
          {data.map((d, index) => {
            const isHovered = hoveredIndex === index;
            const hasHover = hoveredIndex !== null;
            const isDimmed = hasHover && !isHovered;
            const classification = getRiskClassification(d.riskScore);

            return (
              <div
                key={d.roomNumber}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex-1 text-center cursor-pointer transition-all duration-200 ${
                  isDimmed ? 'opacity-40' : 'opacity-100'
                }`}
              >
                <div
                  className={`text-xs font-tech font-bold tracking-wider transition-colors ${
                    isHovered ? classification.textColor : 'text-slate-300'
                  }`}
                >
                  RM {d.roomNumber}
                </div>
                <div className="text-[9px] font-sora text-slate-500 truncate max-w-[70px] sm:max-w-none mx-auto">
                  {d.patientName.split(' ')[0]}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

