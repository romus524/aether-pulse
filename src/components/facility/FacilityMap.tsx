import React, { useMemo, useRef } from 'react';
import { Floor } from '../../types';
import { FloorBlueprint } from './FloorBlueprint';
import { RoomMarker } from './RoomMarker';
import { MapLegend } from './MapLegend';
import { FacilityMapHUD } from './FacilityMapHUD';
import { useMapCamera } from './useMapCamera';

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
  const viewportRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const { width, height } = floor.dimensions;
  const hasActiveSearchOrFilter = searchQuery.trim().length > 0 || statusFilter !== 'ALL';

  const selectedRoom = useMemo(
    () => floor.rooms.find((room) => room.id === selectedRoomId) ?? null,
    [floor.rooms, selectedRoomId]
  );

  const { relativeZoom, isDragging, consumeDidDrag } = useMapCamera({
    mapWidth: width,
    mapHeight: height,
    floorId: floor.id,
    viewportRef,
    layerRef,
    focusRect: selectedRoom?.position ?? null,
    focusKey: `${floor.id}:${selectedRoomId}`,
  });

  const handleSelectRoom = (roomId: string) => {
    if (consumeDidDrag()) return;
    onSelectRoom(roomId);
  };

  return (
    <div className="relative w-full h-full min-h-[520px] lg:min-h-[620px] rounded-2xl glass-panel glass-specular border border-white/10 overflow-hidden shadow-2xl select-none flex flex-col bg-[#050611]">
      <FacilityMapHUD floor={floor} />

      <div
        ref={viewportRef}
        className="hospital-map-viewport absolute inset-0 z-10 overflow-hidden outline-none"
        tabIndex={0}
        role="application"
        aria-label={`${floor.name} interactive hospital map. Scroll or pinch to zoom, drag to pan.`}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
      >
        <div
          ref={layerRef}
          className="hospital-map-layer"
          style={{
            width,
            height,
            transformOrigin: '0 0',
            willChange: 'transform',
          }}
        >
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="block select-none"
            preserveAspectRatio="xMidYMid meet"
          >
            <FloorBlueprint floor={floor} />
            <g className="room-markers-group">
              {floor.rooms.map((room) => (
                <RoomMarker
                  key={room.id}
                  room={room}
                  isSelected={room.id === selectedRoomId}
                  isMatchingSearch={matchingRoomIds.has(room.id)}
                  hasActiveSearchOrFilter={hasActiveSearchOrFilter}
                  zoom={relativeZoom}
                  onSelect={handleSelectRoom}
                />
              ))}
            </g>
          </svg>
        </div>
      </div>

      <MapLegend />

      <div
        data-map-ui="hint"
        className="absolute bottom-4 right-4 z-20 pointer-events-none hidden sm:flex items-center gap-2 glass-panel px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-tech text-slate-400"
      >
        <span>SCROLL / PINCH ZOOM</span>
        <span className="text-slate-600">·</span>
        <span>DRAG TO PAN</span>
      </div>
    </div>
  );
};
