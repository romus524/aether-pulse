import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { PatientRecord, TelemetryDataPoint } from '../types';
import { Heart, Activity, Radio, RadioReceiver, ShieldCheck } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TelemetryFeedProps {
  patient: PatientRecord;
  telemetryHistory: TelemetryDataPoint[];
}

export const TelemetryFeed: React.FC<TelemetryFeedProps> = ({ patient, telemetryHistory }) => {
  const isCritical = patient.status === 'critical';

  const labels = telemetryHistory.map((d) => d.time);
  const respirationData = telemetryHistory.map((d) => d.respiration);
  const heartRateData = telemetryHistory.map((d) => d.heartRate);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Respiration Rate (BPM)',
        data: respirationData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 1,
        pointHoverRadius: 4,
        yAxisID: 'yResp',
      },
      {
        label: 'Heart Rate (BPM)',
        data: heartRateData,
        borderColor: isCritical ? '#ef4444' : '#22d3ee',
        backgroundColor: isCritical ? 'rgba(239, 68, 68, 0.18)' : 'rgba(34, 211, 238, 0.12)',
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 1,
        pointHoverRadius: 4,
        yAxisID: 'yHR',
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#cbd5e1',
          font: {
            family: 'monospace',
            size: 10,
          },
          boxWidth: 12,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(10, 12, 26, 0.95)',
        titleColor: '#c084fc',
        bodyColor: '#f8fafc',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        padding: 8,
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.04)',
        },
        ticks: {
          color: '#64748b',
          font: {
            family: 'monospace',
            size: 9,
          },
          maxRotation: 0,
        },
      },
      yResp: {
        type: 'linear',
        position: 'left',
        min: 5,
        max: 40,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#10b981',
          font: {
            family: 'monospace',
            size: 9,
          },
        },
        title: {
          display: true,
          text: 'RESP (BPM)',
          color: '#10b981',
          font: { family: 'monospace', size: 9 },
        },
      },
      yHR: {
        type: 'linear',
        position: 'right',
        min: 40,
        max: 160,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: isCritical ? '#ef4444' : '#22d3ee',
          font: {
            family: 'monospace',
            size: 9,
          },
        },
        title: {
          display: true,
          text: 'HR (BPM)',
          color: isCritical ? '#ef4444' : '#22d3ee',
          font: { family: 'monospace', size: 9 },
        },
      },
    },
  };

  return (
    <div className="glass-panel glass-specular p-4 rounded-2xl border border-white/10 flex flex-col mb-4 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
        <div>
          <div className="headline-eyebrow">REAL-TIME TELEMETRY</div>
          <h3 className="headline-title text-base font-sora font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400 animate-pulse" />
            LIVE WAVEFORM FEED
          </h3>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-sora">
          <span className="text-slate-400 font-medium">SAMPLING: <strong className="text-cyan-300 font-tech">100Hz RADAR</strong></span>
          <span className="text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 status-label">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> STREAM ACTIVE
          </span>
        </div>
      </div>

      {/* Vital Metrics Summary Cards */}
      <div className="grid grid-cols-3 gap-2.5 mb-3">
        {/* Heart Rate Block */}
        <div className={`p-3 rounded-2xl border transition-all glass-specular ${
          isCritical ? 'bg-red-950/60 border-red-500/80 animate-pulse glow-red' : 'glass-card border-white/5'
        }`}>
          <span className="text-slate-400 text-[9px] font-sora font-semibold tracking-[0.14em] uppercase flex items-center justify-between">
            <span>HEART RATE</span>
            <Heart className="w-3 h-3 text-red-400 fill-current animate-pulse" />
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-2xl font-sora font-extrabold tracking-tight ${isCritical ? 'text-red-300' : 'text-cyan-300'}`}>
              {patient.heartRate}
            </span>
            <span className="telemetry-unit text-[10px] text-slate-400">BPM</span>
          </div>
          <span className="text-[9px] font-sora text-slate-400 mt-0.5 block">
            HRV: <strong className="text-purple-300 font-tech">{patient.hrv} ms</strong>
          </span>
        </div>

        {/* Respiration Block */}
        <div className="p-3 rounded-2xl border border-white/5 glass-card glass-specular">
          <span className="text-slate-400 text-[9px] font-sora font-semibold tracking-[0.14em] uppercase flex items-center justify-between">
            <span>RESPIRATION</span>
            <Activity className="w-3 h-3 text-emerald-400" />
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-sora font-extrabold text-emerald-400 tracking-tight">
              {patient.respirationRate}
            </span>
            <span className="telemetry-unit text-[10px] text-slate-400">BPM</span>
          </div>
          <span className="text-[9px] font-sora text-slate-400 mt-0.5 block">
            Depth: <strong className="text-slate-300">Sine Normal</strong>
          </span>
        </div>

        {/* Doppler Signal Block */}
        <div className="p-3 rounded-2xl border border-white/5 glass-card glass-specular">
          <span className="text-slate-400 text-[9px] font-sora font-semibold tracking-[0.14em] uppercase flex items-center justify-between">
            <span>DOPPLER FREQ</span>
            <Radio className="w-3 h-3 text-purple-400 animate-pulse" />
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-sora font-extrabold text-white tracking-tight">
              {patient.wifiDopplerRate}
            </span>
            <span className="telemetry-unit text-[10px] text-slate-400">HZ</span>
          </div>
          <span className="text-[9px] font-sora text-slate-400 mt-0.5 block truncate">
            Shift: <strong className="text-purple-300 font-tech">{patient.movementIndex}%</strong>
          </span>
        </div>
      </div>

      {/* Chart.js Live Waveform Container */}
      <div className="w-full h-[190px] bg-slate-950/40 rounded-2xl p-2.5 border border-white/10 relative shadow-inner backdrop-blur-md">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};
