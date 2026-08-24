import React, { useState } from 'react';
import { FacilityRoom } from '../../types';

interface RoomMarkerProps {
  room: FacilityRoom;
  isSelected: boolean;
  isMatchingSearch: boolean;
  hasActiveSearchOrFilter: boolean;
  zoom: number;
  onSelect: (roomId: string) => void;
}

export const RoomMarker: React.FC<RoomMarkerProps> = ({
  room,
  isSelected,
  isMatchingSearch,
  hasActiveSearchOrFilter,
  zoom,
  onSelect,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { x, y, width, height } = room.position;

  // Dimming logic
  const opacity = hasActiveSearchOrFilter ? (isMatchingSearch ? 1 : 0.2) : 1;

  // Status colors & styling
  const getStatusColor = (status: FacilityRoom['status']) => {
    switch (status) {
      case 'critical':
        return {
          stroke: '#ef4444',
          fill: 'rgba(239, 68, 68, 0.25)',
          ping: '#f87171',
          text: '#fca5a5',
          bgPill: '#7f1d1d',
          borderPill: '#ef4444',
          nodeColor: '#ef4444',
        };
      case 'warning':
        return {
          stroke: '#f59e0b',
          fill: 'rgba(245, 158, 11, 0.2)',
          ping: '#fbbf24',
          text: '#fde68a',
          bgPill: '#78350f',
          borderPill: '#f59e0b',
          nodeColor: '#f59e0b',
        };
      case 'responding':
        return {
          stroke: '#3b82f6',
          fill: 'rgba(59, 130, 246, 0.22)',
          ping: '#60a5fa',
          text: '#93c5fd',
          bgPill: '#1e3a8a',
          borderPill: '#3b82f6',
          nodeColor: '#38bdf8',
        };
      case 'normal':
      default:
        return {
          stroke: '#10b981',
          fill: 'rgba(16, 185, 129, 0.1)',
          ping: '#34d399',
          text: '#a7f3d0',
          bgPill: '#064e3b',
          borderPill: '#10b981',
          nodeColor: '#10b981',
        };
    }
  };

  const colors = getStatusColor(room.status);
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  // Wi-Fi CSI Sensor Nodes mapped within the room (Ceiling Transceiver Grid)
  const csiSensorNodes = [
    { id: 'node-nw', cx: x + 18, cy: y + 18 },
    { id: 'node-ne', cx: x + width - 18, cy: y + 18 },
    { id: 'node-sw', cx: x + 18, cy: y + height - 18 },
    { id: 'node-se', cx: x + width - 18, cy: y + height - 18 },
  ];

  // Patient Initials helper
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`;
    return name.slice(0, 2).toUpperCase();
  };

  const emphasis = isSelected ? 1.04 : isHovered ? 1.025 : 1;

  return (
    <g
      id={`spatial-room-node-${room.roomNumber}`}
      className="room-marker cursor-pointer select-none"
      style={{
        opacity,
        transform: `translate(${centerX}px, ${centerY}px) scale(${emphasis}) translate(${-centerX}px, ${-centerY}px)`,
        transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease',
      }}
      onClick={() => onSelect(room.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
      role="button"
      aria-label={`Room ${room.roomNumber}, Patient ${room.patient.name}, Status ${room.status}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(room.id);
        }
      }}
    >
      {/* Selected Room Glow Box */}
      {isSelected && (
        <rect
          x={x - 4}
          y={y - 4}
          width={width + 8}
          height={height + 8}
          fill="none"
          stroke="#c084fc"
          strokeWidth="3"
          rx="12"
          className="animate-pulse"
          filter="drop-shadow(0 0 16px rgba(168, 85, 247, 0.9))"
        />
      )}

      {/* Room Spatial Boundary Base Box */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={isSelected ? 'rgba(147, 51, 234, 0.28)' : colors.fill}
        stroke={isSelected ? '#c084fc' : isHovered ? '#38bdf8' : colors.stroke}
        strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.5}
        rx="10"
        style={{ transition: 'fill 200ms ease, stroke 200ms ease, stroke-width 200ms ease' }}
      />

      {/* Inner Hospital Bed CAD Outline */}
      {room.bedPosition && (
        <g>
          <rect
            x={room.bedPosition.x}
            y={room.bedPosition.y}
            width="32"
            height="46"
            fill="rgba(15, 23, 42, 0.85)"
            stroke={isSelected ? '#c084fc' : 'rgba(255, 255, 255, 0.2)'}
            strokeWidth="1.2"
            rx="4"
          />
          {/* Pillow */}
          <rect
            x={room.bedPosition.x + 4}
            y={room.bedPosition.y + 4}
            width="24"
            height="10"
            fill="rgba(255, 255, 255, 0.15)"
            rx="2"
          />
        </g>
      )}

      {/* Door Arc Cutout Indicator */}
      {room.doorPosition && (
        <circle
          cx={room.doorPosition.x}
          cy={room.doorPosition.y}
          r="4.5"
          fill="none"
          stroke="rgba(56, 189, 248, 0.5)"
          strokeWidth="1.5"
        />
      )}

      {/* ========================================================= */}
      {/* LIVE WI-FI CSI SENSOR NODES MAPPED IN ROOM */}
      {/* ========================================================= */}
      {csiSensorNodes.map((node) => (
        <g key={node.id}>
          {/* Node Transceiver Outer Dot */}
          <circle
            cx={node.cx}
            cy={node.cy}
            r="3.5"
            fill="#0b0f19"
            stroke={colors.nodeColor}
            strokeWidth="1"
          />
          {/* Node Active RF Core */}
          <circle
            cx={node.cx}
            cy={node.cy}
            r="1.8"
            fill={colors.nodeColor}
            className={room.status === 'critical' ? 'animate-ping' : ''}
          />
        </g>
      ))}

      {/* Transceiver RF Baseline Cross-Beams */}
      <line
        x1={x + 18}
        y1={y + 18}
        x2={x + width - 18}
        y2={y + height - 18}
        stroke={colors.nodeColor}
        strokeWidth="0.75"
        strokeDasharray="3 3"
        opacity="0.25"
      />
      <line
        x1={x + width - 18}
        y1={y + 18}
        x2={x + 18}
        y2={y + height - 18}
        stroke={colors.nodeColor}
        strokeWidth="0.75"
        strokeDasharray="3 3"
        opacity="0.25"
      />

      {/* Radar Ping & Central Doppler Wave Effect */}
      <g transform={`translate(${centerX}, ${y + 24})`}>
        {/* Outer expanding ping ring */}
        <circle
          cx="0"
          cy="0"
          r={room.status === 'critical' ? '18' : '11'}
          fill="none"
          stroke={colors.ping}
          strokeWidth="1.5"
          opacity="0.6"
          className="animate-ping"
        />
        {/* Core Doppler status beacon */}
        <circle
          cx="0"
          cy="0"
          r={room.status === 'critical' ? '6.5' : '4.5'}
          fill={colors.ping}
          className={room.status === 'critical' ? 'animate-pulse' : ''}
        />
      </g>

      {/* Level of Detail Rendering Based on Zoom */}
      {/* Zoom Level 1: Low Zoom (< 1.2) - Room Number & Status */}
      {zoom < 1.2 && (
        <g>
          <text
            x={centerX}
            y={y + height - 14}
            textAnchor="middle"
            fill={isSelected ? '#ffffff' : colors.text}
            fontSize="12"
            fontFamily="Sora, sans-serif"
            fontWeight="800"
            letterSpacing="0.05em"
          >
            {room.roomNumber}
          </text>
        </g>
      )}

      {/* Zoom Level 2: Medium Zoom (1.2 to 2.2) - Room Number, Initials & Status Pill */}
      {zoom >= 1.2 && zoom <= 2.2 && (
        <g>
          <text
            x={centerX}
            y={y + 44}
            textAnchor="middle"
            fill={isSelected ? '#ffffff' : '#f8fafc'}
            fontSize="13"
            fontFamily="Sora, sans-serif"
            fontWeight="800"
          >
            {room.roomNumber}
          </text>
          <text
            x={centerX}
            y={y + 60}
            textAnchor="middle"
            fill={colors.text}
            fontSize="10.5"
            fontFamily="Sora, sans-serif"
            fontWeight="600"
          >
            {getInitials(room.patient.name)}
          </text>

          {/* Status Badge Pill */}
          <rect
            x={centerX - 34}
            y={y + height - 22}
            width="68"
            height="15"
            fill={colors.bgPill}
            stroke={colors.borderPill}
            strokeWidth="1"
            rx="7.5"
          />
          <text
            x={centerX}
            y={y + height - 11}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="8.5"
            fontFamily="Sora, sans-serif"
            fontWeight="800"
            letterSpacing="0.06em"
          >
            {room.status.toUpperCase()}
          </text>
        </g>
      )}

      {/* Zoom Level 3: High Zoom (> 2.2) - Full Telemetry & Vitals */}
      {zoom > 2.2 && (
        <g>
          <text
            x={centerX}
            y={y + 38}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="13"
            fontFamily="Sora, sans-serif"
            fontWeight="800"
          >
            RM {room.roomNumber}
          </text>
          <text
            x={centerX}
            y={y + 54}
            textAnchor="middle"
            fill="#e2e8f0"
            fontSize="10"
            fontFamily="Sora, sans-serif"
            fontWeight="600"
          >
            {room.patient.name}
          </text>

          {/* Movement Vector */}
          <rect
            x={x + 6}
            y={y + 62}
            width={width - 12}
            height="16"
            fill="rgba(15, 23, 42, 0.85)"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
            rx="4"
          />
          <text
            x={centerX}
            y={y + 73}
            textAnchor="middle"
            fill="#38bdf8"
            fontSize="8"
            fontFamily="IBM Plex Mono, monospace"
            fontWeight="600"
          >
            {room.movement}
          </text>

          {/* Edge Node & HR */}
          <text
            x={centerX}
            y={y + height - 10}
            textAnchor="middle"
            fill="#a7f3d0"
            fontSize="9"
            fontFamily="IBM Plex Mono, monospace"
            fontWeight="600"
          >
            {room.heartRate} BPM • {room.edgeNode}
          </text>
        </g>
      )}

      {/* Interactive Hover Tooltip */}
      {isHovered && (
        <g transform={`translate(${centerX}, ${y - 10})`}>
          <foreignObject x="-95" y="-90" width="190" height="85" style={{ pointerEvents: 'none' }}>
            <div className="glass-panel p-2.5 rounded-xl border border-purple-500/50 bg-slate-950/95 shadow-2xl text-[10px] font-sora text-slate-200 backdrop-blur-xl">
              <div className="flex items-center justify-between font-bold border-b border-white/10 pb-1 mb-1">
                <span className="text-white font-extrabold">ROOM {room.roomNumber}</span>
                <span className={`px-1.5 py-0.2 rounded text-[8px] font-tech font-bold uppercase ${
                  room.status === 'critical' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                  room.status === 'warning' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {room.status}
                </span>
              </div>
              <div className="truncate font-semibold text-cyan-300">{room.patient.name}</div>
              <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1 font-tech">
                <span>HR: <strong className="text-white">{room.heartRate} BPM</strong></span>
                <span>RESP: <strong className="text-white">{room.respirationRate}/min</strong></span>
              </div>
              <div className="text-[8.5px] text-purple-300 mt-1 font-tech truncate flex items-center justify-between">
                <span>{room.movement}</span>
                <span className="text-amber-400">Risk: {room.fallRiskScore}/24</span>
              </div>
            </div>
          </foreignObject>
        </g>
      )}
    </g>
  );
};
