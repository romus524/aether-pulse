import React from 'react';
import { Floor } from '../../types';

interface FloorBlueprintProps {
  floor: Floor;
}

export const FloorBlueprint: React.FC<FloorBlueprintProps> = ({ floor }) => {
  const { width, height } = floor.dimensions;

  return (
    <g className="blueprint-geometry">
      {/* CAD Blueprint Background Grid Lines */}
      <defs>
        <pattern id="cad-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(56, 189, 248, 0.04)" strokeWidth="1" />
          <circle cx="40" cy="40" r="1" fill="rgba(56, 189, 248, 0.12)" />
        </pattern>
        <pattern id="cad-grid-large" width="200" height="200" patternUnits="userSpaceOnUse">
          <rect width="200" height="200" fill="url(#cad-grid)" />
          <path d="M 200 0 L 0 0 0 200" fill="none" stroke="rgba(168, 85, 247, 0.08)" strokeWidth="1.5" />
        </pattern>
      </defs>

      {/* Blueprint Grid Background */}
      <rect width={width} height={height} fill="url(#cad-grid-large)" />

      {/* Outer Perimeter Wall */}
      <rect
        x="20"
        y="20"
        width={width - 40}
        height={height - 40}
        fill="none"
        stroke="rgba(148, 163, 184, 0.2)"
        strokeWidth="4"
        rx="12"
      />

      {/* Architectural Elements (Corridors, Nurse Stations, Elevators, Stairs) */}
      {floor.elements.map((elem) => {
        if (elem.type === 'hallway') {
          return (
            <g key={elem.id}>
              <rect
                x={elem.x}
                y={elem.y}
                width={elem.width}
                height={elem.height}
                fill="rgba(15, 23, 42, 0.4)"
                stroke="rgba(56, 189, 248, 0.15)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text
                x={elem.x + elem.width / 2}
                y={elem.y + elem.height / 2 + 4}
                textAnchor="middle"
                fill="rgba(148, 163, 184, 0.35)"
                fontSize="9"
                fontFamily="Sora, sans-serif"
                fontWeight="700"
                letterSpacing="0.15em"
              >
                {elem.label}
              </text>
            </g>
          );
        }

        if (elem.type === 'nurse_station') {
          return (
            <g key={elem.id}>
              <rect
                x={elem.x}
                y={elem.y}
                width={elem.width}
                height={elem.height}
                fill="rgba(147, 51, 234, 0.08)"
                stroke="rgba(168, 85, 247, 0.4)"
                strokeWidth="2"
                rx="8"
              />
              <rect
                x={elem.x + 8}
                y={elem.y + 8}
                width={elem.width - 16}
                height={elem.height - 16}
                fill="none"
                stroke="rgba(168, 85, 247, 0.2)"
                strokeWidth="1"
                rx="4"
              />
              <text
                x={elem.x + elem.width / 2}
                y={elem.y + elem.height / 2 + 3}
                textAnchor="middle"
                fill="#c084fc"
                fontSize="10"
                fontFamily="Sora, sans-serif"
                fontWeight="700"
                letterSpacing="0.1em"
              >
                [ {elem.label} ]
              </text>
            </g>
          );
        }

        if (elem.type === 'elevator' || elem.type === 'stair') {
          return (
            <g key={elem.id}>
              <rect
                x={elem.x}
                y={elem.y}
                width={elem.width}
                height={elem.height}
                fill="rgba(30, 41, 59, 0.6)"
                stroke="rgba(56, 189, 248, 0.3)"
                strokeWidth="1.5"
                rx="6"
              />
              {/* Hatch marks */}
              <line
                x1={elem.x}
                y1={elem.y}
                x2={elem.x + elem.width}
                y2={elem.y + elem.height}
                stroke="rgba(56, 189, 248, 0.2)"
                strokeWidth="1"
              />
              <line
                x1={elem.x + elem.width}
                y1={elem.y}
                x2={elem.x}
                y2={elem.y + elem.height}
                stroke="rgba(56, 189, 248, 0.2)"
                strokeWidth="1"
              />
              <rect
                x={elem.x + elem.width / 2 - 28}
                y={elem.y + elem.height / 2 - 9}
                width="56"
                height="18"
                fill="#0f172a"
                rx="4"
              />
              <text
                x={elem.x + elem.width / 2}
                y={elem.y + elem.height / 2 + 3}
                textAnchor="middle"
                fill="#38bdf8"
                fontSize="9"
                fontFamily="Sora, sans-serif"
                fontWeight="700"
                letterSpacing="0.08em"
              >
                {elem.label}
              </text>
            </g>
          );
        }

        return (
          <g key={elem.id}>
            <rect
              x={elem.x}
              y={elem.y}
              width={elem.width}
              height={elem.height}
              fill="rgba(15, 23, 42, 0.5)"
              stroke="rgba(148, 163, 184, 0.2)"
              strokeWidth="1"
              rx="4"
            />
            <text
              x={elem.x + elem.width / 2}
              y={elem.y + elem.height / 2 + 3}
              textAnchor="middle"
              fill="rgba(148, 163, 184, 0.6)"
              fontSize="9"
              fontFamily="Sora, sans-serif"
              fontWeight="600"
            >
              {elem.label}
            </text>
          </g>
        );
      })}
    </g>
  );
};
