import React, { useState } from 'react';
import { FacilityRoom, SortField, SortDirection } from '../../types';
import { RoomCard } from './RoomCard';
import { LayoutGrid, List, ArrowUpDown, SearchX } from 'lucide-react';

interface RoomGridProps {
  rooms: FacilityRoom[];
  selectedRoomId: string;
  onSelectRoom: (roomId: string) => void;
  onDispatchModal: (room: FacilityRoom) => void;
}

export const RoomGrid: React.FC<RoomGridProps> = ({
  rooms,
  selectedRoomId,
  onSelectRoom,
  onDispatchModal,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [sortField, setSortField] = useState<SortField>('roomNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Severity rank mapping
  const getStatusSeverity = (status: FacilityRoom['status']) => {
    switch (status) {
      case 'critical':
        return 4;
      case 'warning':
        return 3;
      case 'responding':
        return 2;
      case 'normal':
      default:
        return 1;
    }
  };

  // Sorted rooms array
  const sortedRooms = [...rooms].sort((a, b) => {
    let result = 0;
    if (sortField === 'roomNumber') {
      result = a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
    } else if (sortField === 'patientName') {
      result = a.patient.name.localeCompare(b.patient.name);
    } else if (sortField === 'status') {
      result = getStatusSeverity(b.status) - getStatusSeverity(a.status); // Severity desc by default
    } else if (sortField === 'timeInState') {
      result = b.enteredStateAt - a.enteredStateAt;
    }

    return sortDirection === 'asc' ? result : -result;
  });

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <div className="w-full space-y-4">
      {/* Grid Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl glass-panel border border-white/10 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-sora font-semibold text-slate-300">
            SHOWING <strong className="text-purple-300">{sortedRooms.length}</strong> ROOMS
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort Selector */}
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-white/10 text-xs font-sora">
            <span className="text-slate-400 font-medium pl-1 hidden sm:inline">SORT:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer pr-1"
            >
              <option value="roomNumber" className="bg-slate-900 text-slate-200">Room Number</option>
              <option value="patientName" className="bg-slate-900 text-slate-200">Patient Name</option>
              <option value="status" className="bg-slate-900 text-slate-200">Status Severity</option>
              <option value="timeInState" className="bg-slate-900 text-slate-200">Time in State</option>
            </select>

            <button
              onClick={toggleSortDirection}
              className="p-1 rounded-lg hover:bg-white/10 text-cyan-400 transition-colors cursor-pointer"
              title={`Sort Direction: ${sortDirection.toUpperCase()}`}
            >
              <ArrowUpDown className={`w-3.5 h-3.5 transform transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Grid vs List View Toggle */}
          <div className="flex items-center p-1 bg-slate-900/80 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'compact' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Compact List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {sortedRooms.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-panel border border-white/10 flex flex-col items-center justify-center gap-3">
          <SearchX className="w-10 h-10 text-purple-400/60 animate-bounce" />
          <h3 className="font-sora font-bold text-lg text-white">No Facility Rooms Found</h3>
          <p className="text-xs font-sora text-slate-400 max-w-sm">
            No rooms on this floor match your active search terms or status filters. Adjust your filters or search query to view rooms.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {sortedRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              isSelected={room.id === selectedRoomId}
              onSelectRoom={onSelectRoom}
              onDispatchModal={onDispatchModal}
            />
          ))}
        </div>
      ) : (
        /* Compact List View */
        <div className="space-y-2">
          {sortedRooms.map((room) => {
            const isSelected = room.id === selectedRoomId;
            return (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                className={`p-3 rounded-xl glass-panel border transition-all cursor-pointer flex items-center justify-between gap-4 font-sora ${
                  isSelected ? 'border-purple-500 bg-slate-950/90 ring-1 ring-purple-500' : 'border-white/10 hover:border-purple-500/40 bg-slate-950/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-white text-sm w-16">RM {room.roomNumber}</span>
                  <div>
                    <h4 className="font-bold text-slate-100 text-xs">{room.patient.name}</h4>
                    <span className="text-[10px] font-tech text-cyan-400">{room.patient.diagnosis}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-tech">
                  <span className="text-slate-300">HR: {room.heartRate} BPM</span>
                  <span className="text-slate-300">RESP: {room.respirationRate}/m</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border bg-slate-900 border-white/10 text-slate-200">
                    {room.status}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDispatchModal(room);
                    }}
                    className="px-3 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-200 border border-purple-500/40 text-[10px] font-bold cursor-pointer"
                  >
                    Dispatch
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
