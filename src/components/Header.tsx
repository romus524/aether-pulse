import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Play, 
  Radio, 
  Clock, 
  ShieldCheck, 
  Layers, 
  Box, 
  ChevronDown, 
  Check,
  Activity,
  ScrollText
} from 'lucide-react';
import aetherPulseLogo from '../assets/images/aether_pulse_logo_1786819504234.jpg';
import { OperatorRole } from '../platform/agentProtocol';
import { ROLE_LABELS } from '../platform/rbac';

interface HeaderProps {
  criticalCount: number;
  warningCount: number;
  totalRooms: number;
  audioMuted: boolean;
  activeView: 'navigator' | 'inspector';
  onSelectView: (view: 'navigator' | 'inspector') => void;
  onToggleAudio: () => void;
  onOpenSimModal: () => void;
  radarSensitivity: string;
  onChangeRadarSensitivity: (val: string) => void;
  operatorRole: OperatorRole;
  onChangeRole: (role: OperatorRole) => void;
  onOpenActivityLog: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  criticalCount,
  warningCount,
  activeView,
  onSelectView,
  audioMuted,
  onToggleAudio,
  onOpenSimModal,
  radarSensitivity,
  onChangeRadarSensitivity,
  operatorRole,
  onChangeRole,
  onOpenActivityLog,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [samplingDropdownOpen, setSamplingDropdownOpen] = useState<boolean>(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  // Live synchronized high-precision clinical clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        })
      );
      setDateStr(
        now.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handlePointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setSamplingDropdownOpen(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(target)) {
        setRoleDropdownOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSamplingDropdownOpen(false);
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  const samplingOptions = [
    { label: 'Ultra High (0.1m/s)', desc: '100Hz FMCW Doppler • Acute ICU / Fall' },
    { label: 'Standard Neuro (0.3m/s)', desc: '50Hz Subcarrier • Ward Monitoring' },
    { label: 'Filtered (0.5m/s)', desc: '20Hz Low Latency • Ambient Walk' },
  ];

  return (
    <header 
      id="global-command-header"
      className="sticky top-2 z-40 w-[calc(100%-1rem)] max-w-[1920px] mx-auto px-4 lg:px-6 py-2.5 my-2 rounded-2xl bg-[#0b0f19]/90 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col md:flex-row items-center justify-between gap-3 transition-all duration-200 select-none"
    >
      {/* ========================================================= */}
      {/* 1. LEFT ZONE: BRAND & CORE ARCHITECTURE */}
      {/* ========================================================= */}
      <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-3">
          {/* Logo with Specular Ring & Online Radar Beacon */}
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-purple-950/90 border border-purple-500/40 shadow-lg shadow-purple-950/60 overflow-hidden p-1 shrink-0 group">
            <img 
              src={aetherPulseLogo} 
              alt="AetherPulse Care Logo" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-105" 
            />
            <div className="absolute inset-0 rounded-xl border border-purple-400/30 animate-pulse pointer-events-none" />
            <div 
              className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0b0f19] animate-pulse shadow-[0_0_8px_#10b981] z-10" 
              title="RF Transceiver Grid Online"
            />
          </div>

          {/* Typography & Technology Badges */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 font-sora font-extrabold tracking-tight text-white text-base lg:text-lg">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
                  AetherPulse
                </span>
                <span className="text-xs font-bold text-purple-300 px-1.5 py-0.5 rounded-md bg-purple-950/80 border border-purple-500/40 tracking-wider">
                  CARE
                </span>
              </div>

              {/* Version & Tech Badge */}
              <span className="font-tech text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 tracking-wider shadow-inner">
                v4.8 RADAR
              </span>
            </div>

            {/* Privacy Subtext & Sensor Specifications */}
            <div className="flex items-center gap-2 mt-0.5 text-[11px] font-sora font-medium text-slate-400">
              <span className="flex items-center gap-1 text-slate-300">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>5.8GHz Ambient Wi-Fi Radar</span>
              </span>

              <span className="text-purple-500/60 font-bold">•</span>

              {/* Zero-Camera Privacy Indicator Pill */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 text-[10px] font-semibold shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>ZERO-CAMERA PRIVACY</span>
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Critical Fall Alert Pill */}
        {criticalCount > 0 && (
          <div className="md:hidden flex items-center">
            <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-red-950/90 text-red-200 border border-red-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.6)] flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-red-400" />
              <span>P1 FALL ({criticalCount})</span>
            </span>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. CENTER ZONE: PRIMARY MODE SWITCHER */}
      {/* ========================================================= */}
      <div 
        id="mode-switcher-tabs"
        className="flex items-center p-1 bg-[#050814]/80 backdrop-blur-2xl rounded-xl border border-white/10 text-xs font-sora shadow-inner"
      >
        {/* Live Room Navigator (Macro-ward surveillance) */}
        <button
          id="btn-nav-view"
          onClick={() => onSelectView('navigator')}
          className={`px-4 py-1.5 rounded-lg font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer relative ${
            activeView === 'navigator'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_18px_rgba(147,51,234,0.5)] ring-1 ring-purple-300/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
          title="Macro-ward overview and multi-room spatial radar monitoring"
        >
          <span 
            className={`w-2 h-2 rounded-full ${
              activeView === 'navigator' 
                ? 'bg-cyan-300 animate-pulse shadow-[0_0_8px_#38bdf8]' 
                : 'bg-slate-500'
            }`} 
          />
          <Layers className="w-3.5 h-3.5" />
          <span className="tracking-wide">Live Room Navigator</span>
        </button>

        {/* Room Inspector & 3D (Micro-room diagnostics) */}
        <button
          id="btn-inspector-view"
          onClick={() => onSelectView('inspector')}
          className={`px-4 py-1.5 rounded-lg font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer relative ${
            activeView === 'inspector'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_18px_rgba(147,51,234,0.5)] ring-1 ring-purple-300/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
          title="Micro-room diagnostics, digital twin kinematics and CSI spatial matrix"
        >
          <Box className="w-3.5 h-3.5 text-cyan-300" />
          <span className="tracking-wide">Room Inspector & 3D</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 3. RIGHT ZONE: SYSTEM TELEMETRY & CONTROLS */}
      {/* ========================================================= */}
      <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end flex-wrap sm:flex-nowrap">
        {/* Live Synchronized Clock & Active Shift Badge */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-white/10 shadow-sm">
          <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <div className="flex flex-col text-right">
            <div className="text-xs font-tech font-bold text-cyan-300 tracking-wider">
              {timeStr || '12:00:00'}
            </div>
            <div className="text-[9px] font-tech text-slate-400 leading-none">
              {dateStr || 'Sun, Aug 16, 2026'}
            </div>
          </div>

          {/* Active Shift Identifier */}
          <div className="pl-2 border-l border-white/10">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-950/70 border border-purple-500/30 text-purple-200 font-tech font-bold text-[10px] tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SHIFT: ALPHA-02
            </span>
          </div>
        </div>

        {/* Action Controls Cluster */}
        <div className="flex items-center gap-2">
          {/* Radar Sampling Frequency Dropdown Selector */}
          <div className="relative" ref={dropdownRef}>
            <button 
              id="sampling-rate-btn"
              onClick={() => {
                setRoleDropdownOpen(false);
                setSamplingDropdownOpen((open) => !open);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950/60 border border-white/10 hover:border-purple-400/40 text-slate-300 flex items-center gap-1.5 text-xs font-sora font-semibold transition-all cursor-pointer shadow-sm group"
              title="Change Radar Sampling Frequency"
            >
              <Sliders className="w-3.5 h-3.5 text-purple-400 group-hover:text-purple-300" />
              <span className="hidden xl:inline text-[11px]">{radarSensitivity}</span>
              <span className="xl:hidden text-[11px]">SAMPLING</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${samplingDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {samplingDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 rounded-xl bg-[#0b0f19] border border-purple-500/30 p-1.5 shadow-2xl z-50 text-xs font-sora backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-bold text-purple-300/80 uppercase tracking-wider border-b border-white/10 flex items-center justify-between">
                  <span>Radar Sampling Frequency</span>
                  <Activity className="w-3 h-3 text-cyan-400" />
                </div>
                <div className="py-1 flex flex-col gap-0.5">
                  {samplingOptions.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => {
                        onChangeRadarSensitivity(opt.label);
                        setSamplingDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-2 text-left rounded-lg transition-all flex items-start justify-between cursor-pointer ${
                        radarSensitivity === opt.label
                          ? 'bg-purple-950/80 text-white border border-purple-500/40'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold">{opt.label}</span>
                        <span className="text-[9px] text-slate-400 font-tech">{opt.desc}</span>
                      </div>
                      {radarSensitivity === opt.label && (
                        <Check className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sound Mute/Unmute Alert Toggle */}
          <button
            id="audio-toggle-btn"
            onClick={onToggleAudio}
            className={`p-2 rounded-xl border transition-all cursor-pointer shadow-sm ${
              audioMuted 
                ? 'bg-slate-950/60 text-slate-400 border-white/10 hover:text-slate-200 hover:border-white/20' 
                : 'bg-purple-950/80 text-purple-300 border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.35)]'
            }`}
            title={audioMuted ? "Audio siren muted (Click to unmute)" : "Audio siren active (Click to mute)"}
          >
            {audioMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4 animate-pulse text-cyan-300" />
            )}
          </button>

          {/* AI activity + operator role */}
          <button
            type="button"
            onClick={onOpenActivityLog}
            className="p-2 rounded-xl border border-white/10 bg-slate-950/60 text-purple-200 hover:border-purple-400/40"
            title="AI Activity Log"
          >
            <ScrollText className="w-4 h-4" />
          </button>
          <div className="relative" ref={roleDropdownRef}>
            <button
              type="button"
              aria-label="Operator role"
              aria-haspopup="listbox"
              aria-expanded={roleDropdownOpen}
              onClick={() => {
                setSamplingDropdownOpen(false);
                setRoleDropdownOpen((open) => !open);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950/60 border border-white/10 hover:border-purple-400/40 text-slate-200 flex items-center gap-1.5 text-xs font-sora font-semibold transition-all cursor-pointer shadow-sm group"
              title="Operator role — agent inherits these permissions"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400 group-hover:text-purple-300" />
              <span className="text-[11px]">{ROLE_LABELS[operatorRole]}</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {roleDropdownOpen && (
              <div
                role="listbox"
                aria-label="Operator role"
                className="absolute right-0 top-full mt-2 w-56 rounded-2xl glass-panel glass-specular border border-purple-500/30 p-1.5 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="relative z-[1] px-2.5 py-1.5 text-[10px] font-sora font-bold text-purple-300/80 uppercase tracking-wider border-b border-white/5">
                  Operator role
                </div>
                <div className="relative z-[1] py-1 flex flex-col gap-0.5">
                  {(Object.keys(ROLE_LABELS) as OperatorRole[]).map((role) => {
                    const selected = operatorRole === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          onChangeRole(role);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full px-2.5 py-2 text-left rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                          selected
                            ? 'bg-purple-950/80 text-white border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                        }`}
                      >
                        <span className="text-[11px] font-sora font-semibold">{ROLE_LABELS[role]}</span>
                        {selected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Simulate Event Trigger Button */}
          <button
            id="simulate-event-btn"
            onClick={onOpenSimModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-sora text-xs font-bold text-white tracking-wider cursor-pointer bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-400/40 shadow-[0_0_20px_rgba(147,51,234,0.45)] hover:shadow-[0_0_25px_rgba(147,51,234,0.65)] active:scale-98 transition-all duration-200"
          >
            <Play className="w-3.5 h-3.5 fill-current text-cyan-300" />
            <span className="font-extrabold uppercase">SIMULATE EVENT</span>
          </button>
        </div>
      </div>
    </header>
  );
};
