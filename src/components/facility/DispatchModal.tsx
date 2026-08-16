import React, { useState, useEffect } from 'react';
import { FacilityRoom } from '../../types';
import { X, Send, ShieldAlert, CheckCircle2, User, Radio, FileText, AlertTriangle } from 'lucide-react';

interface DispatchModalProps {
  room: FacilityRoom | null;
  floorName: string;
  onClose: () => void;
  onConfirmDispatch: (roomId: string, team: string, priority: string, notes: string) => void;
}

export const DispatchModal: React.FC<DispatchModalProps> = ({
  room,
  floorName,
  onClose,
  onConfirmDispatch,
}) => {
  if (!room) return null;

  const [selectedTeam, setSelectedTeam] = useState('RAPID RESPONSE TEAM 1');
  const [priority, setPriority] = useState(room.status === 'critical' ? 'P1' : 'P2');
  const [notes, setNotes] = useState('AetherPulse Wi-Fi radar detected unassisted movement / bed exit attempt.');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Keyboard shortcut: Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      onConfirmDispatch(room.id, selectedTeam, priority, notes);
      setIsSubmitted(false);
      onClose();
    }, 800);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-2xl animate-fade-in overflow-y-auto overscroll-contain"
      data-lenis-prevent="true"
    >
      <div 
        className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl glass-panel glass-specular border border-purple-500/40 bg-slate-950/95 shadow-[0_0_60px_rgba(168,85,247,0.3)] font-sora overflow-hidden my-auto"
        data-lenis-prevent="true"
      >
        {/* Fixed Header */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/70 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-400 glow-red">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div>
              <span className="status-label text-[10px] text-red-400 font-bold tracking-wider">EMERGENCY DISPATCH PROTOCOL</span>
              <h2 className="font-extrabold text-base sm:text-lg text-white">DISPATCH RESPONSE TEAM</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full glass-pill hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Smooth Scrollable Body */}
        <div 
          className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-4 overscroll-contain"
          data-lenis-prevent="true"
        >
          {/* Target Location Card */}
          <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-tech">
              <span className="text-slate-400 uppercase tracking-wider">TARGET FACILITY LOCATION:</span>
              <span className="text-purple-300 font-bold">{floorName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-extrabold text-lg text-white">ROOM {room.roomNumber} ({room.bedNumber})</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                room.status === 'critical'
                  ? 'bg-red-900/60 text-red-300 border border-red-500/40 glow-red animate-pulse'
                  : room.status === 'warning'
                  ? 'bg-amber-900/60 text-amber-300 border border-amber-500/40 glow-amber'
                  : 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
              }`}>
                {room.status}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300 pt-1.5 border-t border-white/10">
              <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Patient: <strong className="text-white">{room.patient.name}</strong> ({room.patient.mrn})</span>
            </div>
          </div>

          {/* Dispatch Form */}
          <form id="dispatch-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Dispatch Team Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-purple-400" /> SELECT RESPONSE TEAM
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-tech">
                {[
                  { id: 'RAPID RESPONSE TEAM 1', label: 'RAPID RESPONSE TEAM 1', sub: 'Alpha Floor Unit' },
                  { id: 'CODE BLUE RESUSCITATION', label: 'CODE BLUE TEAM', sub: 'Resuscitation Unit' },
                  { id: 'NEUROLOGY RESIDENT', label: 'ON-CALL NEUROLOGIST', sub: 'Stroke Resident' },
                  { id: 'NURSING SUPERVISOR', label: 'STATION LEAD NURSE', sub: 'Nurse Station Lead' },
                ].map((team) => (
                  <button
                    type="button"
                    key={team.id}
                    onClick={() => setSelectedTeam(team.id)}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                      selectedTeam === team.id
                        ? 'bg-purple-600/30 border-purple-500 text-white ring-1 ring-purple-400 shadow-lg shadow-purple-900/40'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <span className="font-bold block text-xs">{team.label}</span>
                    <span className="text-[9px] text-slate-400 block">{team.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Level */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> DISPATCH PRIORITY LEVEL
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs font-tech">
                {[
                  { id: 'P1', label: 'P1 CRITICAL', color: 'border-red-500/50 text-red-300' },
                  { id: 'P2', label: 'P2 HIGH', color: 'border-amber-500/50 text-amber-300' },
                  { id: 'P3', label: 'P3 ROUTINE', color: 'border-emerald-500/50 text-emerald-300' },
                ].map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setPriority(p.id)}
                    className={`py-2 rounded-xl font-bold border transition-all text-center cursor-pointer ${
                      priority === p.id
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/50'
                        : `bg-slate-900/60 ${p.color} hover:bg-white/10`
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" /> CLINICAL NOTES / REASON FOR DISPATCH
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500 font-medium custom-scrollbar"
              />
            </div>
          </form>
        </div>

        {/* Fixed Footer Bar with Submit Button */}
        <div className="shrink-0 p-4 sm:p-5 border-t border-white/10 bg-slate-950/80 backdrop-blur-md flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-full glass-pill text-slate-300 text-xs font-semibold cursor-pointer hover:text-white"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="dispatch-form"
            disabled={isSubmitted}
            className="flex-1 sm:flex-initial sm:px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-sora font-bold text-xs shadow-xl shadow-purple-900/50 border border-purple-400/40 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {isSubmitted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-bounce" />
                <span>DISPATCH SIGNAL TRANSMITTED...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>TRANSMIT EMERGENCY DISPATCH</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
