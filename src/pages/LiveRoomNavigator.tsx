import React, { useState, useMemo, useEffect } from 'react';
import { Floor, FacilityRoom, PatientRecord } from '../types';
import { INITIAL_FLOORS } from '../data/facilityData';
import { FloorNavigator } from '../components/facility/FloorNavigator';
import { SearchFilterBar } from '../components/facility/SearchFilterBar';
import { FacilityMap } from '../components/facility/FacilityMap';
import { RoomGrid } from '../components/facility/RoomGrid';
import { PatientInspectorDrawer } from '../components/facility/PatientInspectorDrawer';
import { DispatchModal } from '../components/facility/DispatchModal';
import { Map, LayoutGrid, Columns, Radio, ShieldCheck, Activity, Send } from 'lucide-react';

interface LiveRoomNavigatorProps {
  onAddAuditLog?: (action: string, category: 'SYSTEM' | 'PATIENT' | 'HARDWARE' | 'DISPATCH', room?: string) => void;
  onOpenInspectorView?: (roomId: string) => void;
  patients?: PatientRecord[];
}

function patientToRoom(patient: PatientRecord, floorId: string): FacilityRoom {
  return {
    id: patient.id,
    floorId,
    roomNumber: patient.roomNumber,
    bedNumber: patient.bedNumber,
    patient: {
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      mrn: patient.mrn,
      diagnosis: patient.diagnosis,
      physician: patient.physician,
      admissionDate: patient.admissionDate,
    },
    status: patient.status,
    enteredStateAt: Date.now(),
    position: { x: 80, y: 340, width: 130, height: 110 },
    movement: patient.postureDescription,
    confidence: 90,
    edgeNode: `EDGE-${patient.roomNumber}`,
    fallRiskScore: patient.fallRiskScore,
    heartRate: patient.heartRate,
    respirationRate: patient.respirationRate,
    lastEvent: 'Admitted by AetherPulse AI',
  };
}

export const LiveRoomNavigator: React.FC<LiveRoomNavigatorProps> = ({ 
  onAddAuditLog,
  patients,
}) => {
  const [floors, setFloors] = useState<Floor[]>(INITIAL_FLOORS);
  const [activeFloorId, setActiveFloorId] = useState<string>('ward-4b'); // Default to Ward 4B (Acute Neuro)
  const [selectedRoomId, setSelectedRoomId] = useState<string>('room-104'); // Default select Room 104 (Critical Fall Event)
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [highRiskOnly, setHighRiskOnly] = useState<boolean>(false);

  // Layout View mode: 'split' | 'map' | 'grid'
  const [layoutMode, setLayoutMode] = useState<'split' | 'map' | 'grid'>('split');

  // Modal & Drawer State
  const [dispatchRoom, setDispatchRoom] = useState<FacilityRoom | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!patients?.length) return;
    setFloors((prevFloors) =>
      prevFloors.map((floor) => {
        const rooms = [...floor.rooms];
        for (const patient of patients) {
          const index = rooms.findIndex((room) => room.id === patient.id || room.roomNumber === patient.roomNumber);
          if (index >= 0) {
            rooms[index] = {
              ...rooms[index],
              status: patient.status,
              bedNumber: patient.bedNumber,
              fallRiskScore: patient.fallRiskScore,
              heartRate: patient.heartRate,
              respirationRate: patient.respirationRate,
              movement: patient.postureDescription,
              patient: {
                ...rooms[index].patient,
                name: patient.name,
                age: patient.age,
                gender: patient.gender,
                mrn: patient.mrn,
                diagnosis: patient.diagnosis,
                physician: patient.physician,
                admissionDate: patient.admissionDate,
              },
            };
          } else {
            rooms.push(patientToRoom(patient, floor.id));
          }
        }
        return { ...floor, rooms, roomCount: rooms.length };
      }),
    );
  }, [patients]);

  // Active Floor reference
  const activeFloor = useMemo(() => {
    return floors.find((f) => f.id === activeFloorId) || floors[0];
  }, [floors, activeFloorId]);

  // Selected Room reference
  const selectedRoom = useMemo(() => {
    return activeFloor.rooms.find((r) => r.id === selectedRoomId) || null;
  }, [activeFloor, selectedRoomId]);

  // Search & Filter matching logic
  const filteredRooms = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return activeFloor.rooms.filter((room) => {
      // Search Query Match (Room #, Patient Name, MRN, Diagnosis, Physician)
      const matchesSearch =
        q === '' ||
        room.roomNumber.toLowerCase().includes(q) ||
        room.patient.name.toLowerCase().includes(q) ||
        room.patient.mrn.toLowerCase().includes(q) ||
        room.patient.diagnosis.toLowerCase().includes(q) ||
        room.patient.physician.toLowerCase().includes(q);

      // Status Filter Match (ALL, normal, warning, critical, responding)
      const matchesStatus = statusFilter === 'ALL' || room.status === statusFilter;

      // High Fall Risk Match (> 15)
      const matchesHighRisk = !highRiskOnly || room.fallRiskScore >= 15;

      return matchesSearch && matchesStatus && matchesHighRisk;
    });
  }, [activeFloor.rooms, searchQuery, statusFilter, highRiskOnly]);

  // Set of matching room IDs for dimming non-matching map rooms
  const matchingRoomIds = useMemo(() => {
    return new Set(filteredRooms.map((r) => r.id));
  }, [filteredRooms]);

  // Room Selection Handler
  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    setIsInspectorOpen(true);
    const room = activeFloor.rooms.find((r) => r.id === roomId);
    if (room && onAddAuditLog) {
      onAddAuditLog(`Inspected Room ${room.roomNumber} (${room.patient.name})`, 'PATIENT', room.roomNumber);
    }
  };

  // Floor Selection Handler
  const handleSelectFloor = (floorId: string) => {
    setActiveFloorId(floorId);
    const newFloor = floors.find((f) => f.id === floorId);
    if (newFloor) {
      // Auto-select first room or critical room if available
      const crit = newFloor.rooms.find((r) => r.status === 'critical') || newFloor.rooms[0];
      if (crit) setSelectedRoomId(crit.id);

      if (onAddAuditLog) {
        onAddAuditLog(`Switched view to ${newFloor.name}`, 'SYSTEM');
      }
    }
  };

  // Clear Status Handler (Acknowledge Alert)
  const handleClearRoomStatus = (roomId: string) => {
    setFloors((prevFloors) =>
      prevFloors.map((floor) => ({
        ...floor,
        rooms: floor.rooms.map((room) =>
          room.id === roomId
            ? { ...room, status: 'normal', movement: 'RESTING SUPINE', lastEvent: 'Cleared by operator' }
            : room
        ),
      }))
    );

    if (selectedRoom && onAddAuditLog) {
      onAddAuditLog(`Cleared alert status for Room ${selectedRoom.roomNumber}`, 'SYSTEM', selectedRoom.roomNumber);
    }
  };

  // Confirm Dispatch Handler
  const handleConfirmDispatch = (roomId: string, team: string, priority: string, _notes: string) => {
    const timeStr = new Date().toLocaleTimeString();

    setFloors((prevFloors) =>
      prevFloors.map((floor) => ({
        ...floor,
        rooms: floor.rooms.map((room) =>
          room.id === roomId
            ? {
                ...room,
                status: 'responding',
                dispatchedAt: timeStr,
                dispatchTeam: team,
                lastEvent: `Dispatched ${team} (${priority})`,
              }
            : room
        ),
      }))
    );

    if (onAddAuditLog) {
      onAddAuditLog(`Dispatched ${team} [${priority}] to Room ${roomId}`, 'DISPATCH');
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setHighRiskOnly(false);
  };

  return (
    <div id="ward-4b-command-spatial-grid" className="w-full min-h-screen bg-[#0b0f19] text-slate-100 p-4 lg:p-6 space-y-6 font-sora">
      {/* Facility Header & Ward Statistics */}
      <FloorNavigator
        floors={floors}
        activeFloorId={activeFloorId}
        onSelectFloor={handleSelectFloor}
      />

      {/* ========================================================= */}
      {/* 1. TOP CONTROL BAR */}
      {/* Global Search, Quick-Filter Badges, DISPATCH STAFF */}
      {/* ========================================================= */}
      <SearchFilterBar
        rooms={activeFloor.rooms}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        highRiskOnly={highRiskOnly}
        onSearchChange={setSearchQuery}
        onStatusFilterChange={setStatusFilter}
        onHighRiskToggle={setHighRiskOnly}
        onOpenDispatchModal={() => setDispatchRoom(selectedRoom || activeFloor.rooms[0])}
        onClearFilters={handleClearFilters}
      />

      {/* ========================================================= */}
      {/* 2. LAYOUT TOGGLE BAR */}
      {/* Segmented View Controls: Split View | Map Focus | Grid Focus */}
      {/* ========================================================= */}
      <div 
        id="ward-layout-toggle-bar"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-2xl glass-panel border border-white/10 shadow-lg bg-[#070b14]/90 backdrop-blur-xl"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-purple-950/70 border border-purple-500/30">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-xs font-sora font-extrabold text-purple-200 tracking-wide">
              {activeFloor.name.toUpperCase()} • SPATIAL COMMAND MATRIX
            </span>
          </div>

          <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-slate-400 font-tech">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>FMCW WIRELESS RADAR ACTIVE</span>
          </span>
        </div>

        {/* Workspace Mode Segmented Tabs */}
        <div className="flex items-center p-1 bg-slate-950/90 rounded-xl border border-white/10 text-xs font-sora shadow-inner">
          {/* Split View */}
          <button
            id="view-mode-split"
            onClick={() => setLayoutMode('split')}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all cursor-pointer ${
              layoutMode === 'split' 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)] ring-1 ring-purple-400' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
            title="Simultaneous map and card stream layout"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Split View</span>
          </button>

          {/* Map Focus */}
          <button
            id="view-mode-map"
            onClick={() => setLayoutMode('map')}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all cursor-pointer ${
              layoutMode === 'map' 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)] ring-1 ring-purple-400' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
            title="Maximized spatial radar floor plan view"
          >
            <Map className="w-3.5 h-3.5" />
            <span>Map Focus</span>
          </button>

          {/* Grid Focus */}
          <button
            id="view-mode-grid"
            onClick={() => setLayoutMode('grid')}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all cursor-pointer ${
              layoutMode === 'grid' 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)] ring-1 ring-purple-400' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
            title="Maximized patient telemetry card stream"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Grid Focus</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. SPLIT-SCREEN CONTENT AREA */}
      {/* Left Split: Spatial Map & Index | Right Split: Card Grid Stream */}
      {/* ========================================================= */}
      <div className="w-full transition-all duration-300">
        {layoutMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Split: Spatial Map & Live CSI Nodes (7 Cols) */}
            <div className="lg:col-span-7 h-[640px]">
              <FacilityMap
                floor={activeFloor}
                selectedRoomId={selectedRoomId}
                searchQuery={searchQuery}
                statusFilter={statusFilter}
                matchingRoomIds={matchingRoomIds}
                onSelectRoom={handleSelectRoom}
              />
            </div>

            {/* Right Split: Card/Grid Stream (5 Cols) */}
            <div className="lg:col-span-5 max-h-[640px] overflow-y-auto pr-1">
              <RoomGrid
                rooms={filteredRooms}
                selectedRoomId={selectedRoomId}
                onSelectRoom={handleSelectRoom}
                onDispatchModal={(room) => setDispatchRoom(room)}
              />
            </div>
          </div>
        )}

        {layoutMode === 'map' && (
          <div className="w-full h-[720px]">
            <FacilityMap
              floor={activeFloor}
              selectedRoomId={selectedRoomId}
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              matchingRoomIds={matchingRoomIds}
              onSelectRoom={handleSelectRoom}
            />
          </div>
        )}

        {layoutMode === 'grid' && (
          <div className="w-full">
            <RoomGrid
              rooms={filteredRooms}
              selectedRoomId={selectedRoomId}
              onSelectRoom={handleSelectRoom}
              onDispatchModal={(room) => setDispatchRoom(room)}
            />
          </div>
        )}
      </div>

      {/* Patient Telemetry Inspector Drawer */}
      {isInspectorOpen && selectedRoom && (
        <PatientInspectorDrawer
          room={selectedRoom}
          onClose={() => setIsInspectorOpen(false)}
          onDispatchModal={(room) => setDispatchRoom(room)}
          onClearRoomStatus={handleClearRoomStatus}
        />
      )}

      {/* Emergency Dispatch Modal */}
      {dispatchRoom && (
        <DispatchModal
          room={dispatchRoom}
          floorName={activeFloor.name}
          onClose={() => setDispatchRoom(null)}
          onConfirmDispatch={handleConfirmDispatch}
        />
      )}
    </div>
  );
};
