import React from 'react';
import { Search, Send, X, AlertTriangle, Radio } from 'lucide-react';
import { FacilityRoom } from '../../types';

interface SearchFilterBarProps {
  rooms: FacilityRoom[];
  searchQuery: string;
  statusFilter: string;
  highRiskOnly: boolean;
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (status: string) => void;
  onHighRiskToggle: (active: boolean) => void;
  onOpenDispatchModal: () => void;
  onClearFilters: () => void;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  rooms,
  searchQuery,
  statusFilter,
  highRiskOnly,
  onSearchChange,
  onStatusFilterChange,
  onHighRiskToggle,
  onOpenDispatchModal,
  onClearFilters,
}) => {
  const totalCount = rooms.length;
  const normalCount = rooms.filter((r) => r.status === 'normal').length;
  const warningCount = rooms.filter((r) => r.status === 'warning').length;
  const criticalCount = rooms.filter((r) => r.status === 'critical').length;
  const highRiskCount = rooms.filter((r) => r.fallRiskScore >= 15).length;

  const hasActiveFilters = searchQuery.length > 0 || statusFilter !== 'ALL' || highRiskOnly;

  return (
    <div 
      id="ward-top-control-bar"
      className="w-full p-4 rounded-2xl glass-panel border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 font-sora select-none"
    >
      {/* 1. Global Search Input */}
      <div className="relative flex-1 min-w-[280px]">
        <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          id="ward-global-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search room (e.g. 104), patient name, MRN, diagnosis, physician..."
          className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 2. Quick-Filter Badges Strip */}
      <div className="flex flex-wrap items-center gap-2">
        {/* ALL */}
        <button
          id="filter-all"
          onClick={() => onStatusFilterChange('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            statusFilter === 'ALL' && !highRiskOnly
              ? 'bg-purple-700 text-white shadow-sm ring-1 ring-purple-400/60'
              : 'bg-slate-950/70 hover:bg-white/10 text-slate-300 border border-white/10'
          }`}
        >
          <span>All</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-900/90 text-purple-300 font-tech font-bold border border-white/5">
            {totalCount}
          </span>
        </button>

        {/* NORMAL */}
        <button
          id="filter-normal"
          onClick={() => {
            onStatusFilterChange('normal');
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            statusFilter === 'normal'
              ? 'bg-emerald-700 text-white shadow-sm ring-1 ring-emerald-400/60'
              : 'bg-slate-950/70 hover:bg-emerald-950/40 text-emerald-300 border border-emerald-500/20'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Normal</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-900/90 text-emerald-300 font-tech font-bold border border-emerald-500/20">
            {normalCount}
          </span>
        </button>

        {/* PRE-EXIT (Warning) */}
        <button
          id="filter-pre-exit"
          onClick={() => {
            onStatusFilterChange('warning');
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            statusFilter === 'warning'
              ? 'bg-amber-700 text-white shadow-sm ring-1 ring-amber-400/60'
              : 'bg-slate-950/70 hover:bg-amber-950/40 text-amber-300 border border-amber-500/20'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>Pre-Exit</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-900/90 text-amber-300 font-tech font-bold border border-amber-500/20">
            {warningCount}
          </span>
        </button>

        {/* CRITICAL */}
        <button
          id="filter-critical"
          onClick={() => {
            onStatusFilterChange('critical');
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            statusFilter === 'critical'
              ? 'bg-red-700 text-white shadow-sm ring-1 ring-red-400/60 animate-pulse'
              : 'bg-slate-950/70 hover:bg-red-950/40 text-red-300 border border-red-500/20'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
          <span>Critical</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-900/90 text-red-300 font-tech font-bold border border-red-500/20">
            {criticalCount}
          </span>
        </button>

        {/* HIGH RISK (>15) */}
        <button
          id="filter-high-risk"
          onClick={() => onHighRiskToggle(!highRiskOnly)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            highRiskOnly
              ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)] font-extrabold ring-1 ring-amber-300'
              : 'bg-slate-950/70 hover:bg-white/10 text-amber-300 border border-amber-500/30'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>High Risk</span>
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-tech font-bold ${highRiskOnly ? 'bg-slate-900 text-amber-300' : 'bg-slate-900/90 text-amber-300 border border-amber-500/20'}`}>
            {highRiskCount}
          </span>
        </button>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-red-950/40 text-slate-400 hover:text-red-300 border border-white/10 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Reset active filters"
          >
            <X className="w-3.5 h-3.5" /> Reset
          </button>
        )}
      </div>

      {/* 3. Action Button: DISPATCH STAFF */}
      <button
        id="btn-dispatch-staff-primary"
        onClick={onOpenDispatchModal}
        className="px-5 py-2.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs font-sora font-extrabold shadow-sm border border-purple-400/40 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 shrink-0 tracking-wider"
      >
        <Send className="w-3.5 h-3.5 fill-current text-cyan-300" />
        <span>DISPATCH STAFF</span>
      </button>
    </div>
  );
};
