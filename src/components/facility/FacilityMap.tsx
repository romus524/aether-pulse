import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Floor } from '../../types';
import { FloorBlueprint } from './FloorBlueprint';
import { RoomMarker } from './RoomMarker';
import { MapControls } from './MapControls';
import { MapLegend } from './MapLegend';
import { FacilityMapHUD } from './FacilityMapHUD';

interface FacilityMapProps {
  floor: Floor;
  selectedRoomId: string;
  searchQuery: string;
  statusFilter: string;
  matchingRoomIds: Set<string>;
  onSelectRoom: (roomId: string) => void;
}

export const FacilityMap: React.FC<FacilityMapProps> = ({
  floor,
  selectedRoomId,
  searchQuery,
  statusFilter,
  matchingRoomIds,
  onSelectRoom,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const { width, height } = floor.dimensions;
  const hasActiveSearchOrFilter = searchQuery.trim().length > 0 || statusFilter !== 'ALL';

  // Clamp pan so map geometry stays within visible canvas
  const clampPan = useCallback(
    (x: number, y: number, currentZoom: number) => {
      if (currentZoom <= 1.0) return { x: 0, y: 0 };
      const maxPanX = (width / 2) * (currentZoom - 0.7);
      const maxPanY = (height / 2) * (currentZoom - 0.7);
      return {
        x: Math.max(-maxPanX, Math.min(maxPanX, x)),
        y: Math.max(-maxPanY, Math.min(maxPanY, y)),
      };
    },
    [width, height]
  );

  // Reset view on floor change
  useEffect(() => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  }, [floor.id]);

  // Gentle auto-centering on selected room when zoomed in
  useEffect(() => {
    if (!selectedRoomId) return;
    const selectedRoom = floor.rooms.find((r) => r.id === selectedRoomId);
    if (!selectedRoom) return;

    if (zoom > 1.1) {
      const roomCenterX = selectedRoom.position.x + selectedRoom.position.width / 2;
      const roomCenterY = selectedRoom.position.y + selectedRoom.position.height / 2;

      const targetPanX = (width / 2 - roomCenterX) * 0.5;
      const targetPanY = (height / 2 - roomCenterY) * 0.5;

      setPan(clampPan(targetPanX, targetPanY, zoom));
    }
  }, [selectedRoomId, floor, width, height, zoom, clampPan]);

  // Zoom handlers clamped 0.8 -> 3.0
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => {
      const next = Math.min(3.0, Number((prev + 0.25).toFixed(2)));
      return next;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const next = Math.max(0.8, Number((prev - 0.25).toFixed(2)));
      if (next <= 1.0) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleFit = useCallback(() => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  }, []);

  // Mouse Wheel Zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoom((prev) => {
      const next = Math.max(0.8, Math.min(3.0, Number((prev + delta).toFixed(2))));
      if (next <= 1.0) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  // Click & Drag Panning Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.room-marker')) return;
    if (zoom <= 1.0) return; // Only pan when zoomed in
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setPan(clampPan(newX, newY, zoom));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[520px] lg:min-h-[620px] rounded-2xl glass-panel glass-specular border border-white/10 overflow-hidden shadow-2xl select-none flex flex-col justify-between bg-[#050611]"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? 'grabbing' : zoom > 1.0 ? 'grab' : 'default' }}
    >
      {/* Upper Map HUD */}
      <FacilityMapHUD floor={floor} />

      {/* Main Interactive SVG Canvas */}
      <div className="w-full h-full flex-1 flex items-center justify-center p-3 overflow-hidden relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full max-h-[680px] select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <g
            className="map-content-viewport transition-transform duration-200 ease-out"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: `${width / 2}px ${height / 2}px`,
            }}
          >
            {/* Floor CAD Blueprint Base */}
            <FloorBlueprint floor={floor} />

            {/* Interactive Room Markers */}
            <g className="room-markers-group">
              {floor.rooms.map((room) => {
                const isSelected = room.id === selectedRoomId;
                const isMatchingSearch = matchingRoomIds.has(room.id);

                return (
                  <RoomMarker
                    key={room.id}
                    room={room}
                    isSelected={isSelected}
                    isMatchingSearch={isMatchingSearch}
                    hasActiveSearchOrFilter={hasActiveSearchOrFilter}
                    zoom={zoom}
                    onSelect={onSelectRoom}
                  />
                );
              })}
            </g>
          </g>
        </svg>
      </div>

      {/* Floating Map Legend */}
      <MapLegend />

      {/* Floating Map Pan/Zoom Controls */}
      <MapControls
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        onFit={handleFit}
      />
    </div>
  );
};

