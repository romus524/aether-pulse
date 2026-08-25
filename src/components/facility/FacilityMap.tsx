import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Floor } from '../../types';
import { FloorBlueprint } from './FloorBlueprint';
import { RoomMarker } from './RoomMarker';
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
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const dragRef = useRef({ x: 0, y: 0, lastX: 0, lastY: 0, velocityX: 0, velocityY: 0 });
  const pinchRef = useRef<{ distance: number; zoom: number; pan: { x: number; y: number } } | null>(null);
  const momentumFrameRef = useRef<number | null>(null);

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

  // Focus a room only when the selection changes, so manual navigation remains stable.
  useEffect(() => {
    if (!selectedRoomId) return;
    const selectedRoom = floor.rooms.find((r) => r.id === selectedRoomId);
    if (!selectedRoom) return;

    const focusZoom = Math.max(zoom, 1.25);
    const roomCenterX = selectedRoom.position.x + selectedRoom.position.width / 2;
    const roomCenterY = selectedRoom.position.y + selectedRoom.position.height / 2;
    setZoom(focusZoom);
    setPan(clampPan((width / 2 - roomCenterX) * 0.5, (height / 2 - roomCenterY) * 0.5, focusZoom));
  }, [selectedRoomId, floor, width, height, clampPan]);

  const stopMomentum = useCallback(() => {
    if (momentumFrameRef.current !== null) cancelAnimationFrame(momentumFrameRef.current);
    momentumFrameRef.current = null;
  }, []);

  useEffect(() => () => stopMomentum(), [stopMomentum]);

  const getMapPoint = (clientX: number, clientY: number) => {
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) return { x: width / 2, y: height / 2 };
    return {
      x: ((clientX - bounds.left) / bounds.width) * width,
      y: ((clientY - bounds.top) / bounds.height) * height,
    };
  };

  const zoomAtPoint = useCallback((nextZoom: number, clientX: number, clientY: number) => {
    setZoom((currentZoom) => {
      const boundedZoom = Math.max(0.85, Math.min(3, nextZoom));
      const point = getMapPoint(clientX, clientY);
      setPan((currentPan) => {
        const nextPan = {
          x: point.x - (point.x - (width / 2 + currentPan.x)) * (boundedZoom / currentZoom) - width / 2,
          y: point.y - (point.y - (height / 2 + currentPan.y)) * (boundedZoom / currentZoom) - height / 2,
        };
        return boundedZoom <= 1 ? { x: 0, y: 0 } : clampPan(nextPan.x, nextPan.y, boundedZoom);
      });
      return boundedZoom;
    });
  }, [clampPan, height, width]);

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    stopMomentum();
    const scale = Math.exp(-event.deltaY * 0.0015);
    zoomAtPoint(zoom * scale, event.clientX, event.clientY);
  };

  const handlePointerDown = (event: React.PointerEvent) => {
    if ((event.target as HTMLElement).closest('.room-marker')) return;
    stopMomentum();
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);

    if (pointersRef.current.size === 1) {
      dragRef.current = { x: pan.x, y: pan.y, lastX: event.clientX, lastY: event.clientY, velocityX: 0, velocityY: 0 };
      setIsDragging(true);
    } else if (pointersRef.current.size === 2) {
      const points = [...pointersRef.current.values()];
      pinchRef.current = {
        distance: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y),
        zoom,
        pan,
      };
    }
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointersRef.current.values()];

    if (points.length >= 2 && pinchRef.current) {
      const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      const midpoint = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
      zoomAtPoint(pinchRef.current.zoom * (distance / pinchRef.current.distance), midpoint.x, midpoint.y);
      return;
    }

    if (!isDragging) return;
    const deltaX = event.clientX - dragRef.current.lastX;
    const deltaY = event.clientY - dragRef.current.lastY;
    dragRef.current.lastX = event.clientX;
    dragRef.current.lastY = event.clientY;
    dragRef.current.velocityX = deltaX;
    dragRef.current.velocityY = deltaY;
    const scaleX = width / (containerRef.current?.clientWidth || width);
    const scaleY = height / (containerRef.current?.clientHeight || height);
    dragRef.current.x += deltaX * scaleX;
    dragRef.current.y += deltaY * scaleY;
    setPan(clampPan(dragRef.current.x, dragRef.current.y, zoom));
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size > 0) {
      const remainingPoint = [...pointersRef.current.values()][0];
      dragRef.current.lastX = remainingPoint.x;
      dragRef.current.lastY = remainingPoint.y;
      dragRef.current.velocityX = 0;
      dragRef.current.velocityY = 0;
      return;
    }
    setIsDragging(false);

    let velocityX = dragRef.current.velocityX * 0.7;
    let velocityY = dragRef.current.velocityY * 0.7;
    const animateMomentum = () => {
      velocityX *= 0.9;
      velocityY *= 0.9;
      if (Math.abs(velocityX) < 0.15 && Math.abs(velocityY) < 0.15) return;
      dragRef.current.x += velocityX * (width / (containerRef.current?.clientWidth || width));
      dragRef.current.y += velocityY * (height / (containerRef.current?.clientHeight || height));
      setPan(clampPan(dragRef.current.x, dragRef.current.y, zoom));
      momentumFrameRef.current = requestAnimationFrame(animateMomentum);
    };
    momentumFrameRef.current = requestAnimationFrame(animateMomentum);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[520px] lg:min-h-[620px] rounded-2xl glass-panel glass-specular border border-white/10 overflow-hidden shadow-2xl select-none flex flex-col justify-between bg-[#050611] touch-none"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
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
            className={`map-content-viewport ${isDragging ? '' : 'transition-transform duration-200 ease-out'}`}
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

    </div>
  );
};

