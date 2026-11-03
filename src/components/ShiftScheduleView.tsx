import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Banknote,
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { toast } from '../store/useToastStore';

interface ShiftRosterItem {
  id: string;
  staffName: string;
  role: 'Supervisor' | 'Head Cashier' | 'Cashier' | 'Barista';
  avatar: string;
  shiftName: 'Morning Shift' | 'Afternoon Shift' | 'Night Shift';
  timeSlot: string;
  terminal: string;
  floatAmount: number;
  status: 'ON_DUTY' | 'UPCOMING' | 'COMPLETED';
}

export const ShiftScheduleView: React.FC = () => {
  const { currency } = useCartStore();
  const [selectedDayIndex, setSelectedDayIndex] = useState(2); // Tuesday (Today)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'Cashier' | 'Head Cashier'>('Cashier');
  const [newShiftSlot, setNewShiftSlot] = useState<'Morning Shift' | 'Afternoon Shift' | 'Night Shift'>('Morning Shift');

  const DAYS_OF_WEEK = [
    { label: 'Sun', date: 'Nov 1' },
    { label: 'Mon', date: 'Nov 2' },
    { label: 'Tue', date: 'Nov 3', isToday: true },
    { label: 'Wed', date: 'Nov 4' },
    { label: 'Thu', date: 'Nov 5' },
    { label: 'Fri', date: 'Nov 6' },
    { label: 'Sat', date: 'Nov 7' },
  ];

  const [roster, setRoster] = useState<ShiftRosterItem[]>([
    {
      id: 'sch-1',
      staffName: 'Courtney Henry',
      role: 'Head Cashier',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      shiftName: 'Morning Shift',
      timeSlot: '06:00 AM – 02:00 PM',
      terminal: 'Terminal 01 (Main Counter)',
      floatAmount: 2000,
      status: 'ON_DUTY',
    },
    {
      id: 'sch-2',
      staffName: 'Juan Dela Cruz',
      role: 'Cashier',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      shiftName: 'Morning Shift',
      timeSlot: '06:00 AM – 02:00 PM',
      terminal: 'Terminal 02 (Takeout & Online)',
      floatAmount: 2000,
      status: 'ON_DUTY',
    },
    {
      id: 'sch-3',
      staffName: 'Maria Santos',
      role: 'Supervisor',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      shiftName: 'Afternoon Shift',
      timeSlot: '02:00 PM – 10:00 PM',
      terminal: 'Terminal 01 (Main Counter)',
      floatAmount: 2000,
      status: 'UPCOMING',
    },
    {
      id: 'sch-4',
      staffName: 'Carlo Mendoza',
      role: 'Cashier',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      shiftName: 'Afternoon Shift',
      timeSlot: '02:00 PM – 10:00 PM',
      terminal: 'Terminal 02 (Takeout & Online)',
      floatAmount: 2000,
      status: 'UPCOMING',
    },
    {
      id: 'sch-5',
      staffName: 'Angelo Reyes',
      role: 'Cashier',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
      shiftName: 'Night Shift',
      timeSlot: '10:00 PM – 06:00 AM',
      terminal: 'Terminal 01 (Night Window)',
      floatAmount: 1500,
      status: 'UPCOMING',
    },
  ]);

  const handleAddStaffToRoster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    const newItem: ShiftRosterItem = {
      id: `sch-${Date.now()}`,
      staffName: newStaffName.trim(),
      role: newStaffRole,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      shiftName: newShiftSlot,
      timeSlot:
        newShiftSlot === 'Morning Shift'
          ? '06:00 AM – 02:00 PM'
          : newShiftSlot === 'Afternoon Shift'
          ? '02:00 PM – 10:00 PM'
          : '10:00 PM – 06:00 AM',
      terminal: 'Terminal 01 (Main Counter)',
      floatAmount: 2000,
      status: 'UPCOMING',
    };

    setRoster((prev) => [...prev, newItem]);
    setIsAssignModalOpen(false);
    setNewStaffName('');
    toast.success('Roster Updated', `Assigned ${newItem.staffName} to ${newItem.shiftName}.`);
  };

  const handleToggleStatus = (id: string) => {
    setRoster((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.status === 'ON_DUTY' ? 'COMPLETED' : 'ON_DUTY';
          toast.info(
            item.staffName,
            nextStatus === 'ON_DUTY' ? 'Clocked in on duty.' : 'Shift completed and handed over.'
          );
          return { ...item, status: nextStatus };
        }
        return item;
      })
    );
  };

  // Group roster by shift
  const morningStaff = roster.filter((r) => r.shiftName === 'Morning Shift');
  const afternoonStaff = roster.filter((r) => r.shiftName === 'Afternoon Shift');
  const nightStaff = roster.filter((r) => r.shiftName === 'Night Shift');

  const onDutyCount = roster.filter((r) => r.status === 'ON_DUTY').length;
  const totalFloatAllocated = roster.reduce((sum, r) => sum + r.floatAmount, 0);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-6 py-5 select-none bg-slate-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            <span>Staff & Cashier Shift Schedule</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Manage cashier rosters, assign register terminals, and allocate cash floats
          </p>
        </div>

        <button
          onClick={() => setIsAssignModalOpen(true)}
          className="self-start sm:self-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
          <span>Assign Staff to Shift</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5 shrink-0">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Scheduled Staff Today
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
            {roster.length} Personnel
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>3 Daily Shifts</span>
            <span className="text-blue-600 font-bold">Full Coverage</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Currently On Duty
          </span>
          <p className="text-2xl font-black text-emerald-600 mt-1 tracking-tight flex items-center gap-2">
            <span>{onDutyCount} Active</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Terminal 01 & 02</span>
            <span className="text-emerald-600 font-bold">Ringing Orders</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Starting Floats Allocated
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
            {currency}{totalFloatAllocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Cash in Register</span>
            <span className="text-slate-600 font-medium">Float Verified</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Next Handover Shift
          </span>
          <p className="text-2xl font-black text-indigo-600 mt-1 tracking-tight">
            02:00 PM
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Afternoon Peak Rush</span>
            <span className="text-indigo-600 font-bold">2 Cashiers Ready</span>
          </div>
        </div>
      </div>

      {/* Week Day Navigator Pills */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-5 shrink-0 flex items-center justify-between gap-2 overflow-x-auto">
        <button
          onClick={() => setSelectedDayIndex((prev) => Math.max(0, prev - 1))}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 flex-1 justify-center min-w-max">
          {DAYS_OF_WEEK.map((day, idx) => {
            const isSelected = selectedDayIndex === idx;
            return (
              <button
                key={day.label}
                onClick={() => setSelectedDayIndex(idx)}
                className={`flex flex-col items-center py-1.5 px-4 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 font-semibold'
                }`}
              >
                <span className="text-[11px] uppercase tracking-wider">{day.label}</span>
                <span className="text-xs mt-0.5">{day.date}</span>
                {day.isToday && (
                  <span
                    className={`w-1 h-1 rounded-full mt-1 ${
                      isSelected ? 'bg-white' : 'bg-blue-600'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setSelectedDayIndex((prev) => Math.min(DAYS_OF_WEEK.length - 1, prev + 1))}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3 Shifts Roster Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 min-h-0">
        {/* SHIFT 1: MORNING SHIFT */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h3 className="font-bold text-sm text-slate-900">Morning Shift</h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" /> 06:00 AM – 02:00 PM
              </p>
            </div>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full">
              {morningStaff.length} Staff
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {morningStaff.map((staff) => (
              <div
                key={staff.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={staff.avatar}
                      alt={staff.staffName}
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{staff.staffName}</h4>
                      <span className="inline-block px-1.5 py-0.2 bg-blue-50 text-blue-600 font-bold text-[10px] rounded mt-0.5">
                        {staff.role}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      staff.status === 'ON_DUTY'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {staff.status === 'ON_DUTY' ? 'On Duty' : 'Completed'}
                  </span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Monitor className="w-3 h-3 text-slate-400" />
                      {staff.terminal}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-medium">
                    <span className="flex items-center gap-1">
                      <Banknote className="w-3 h-3 text-slate-400" />
                      Float: {currency}{staff.floatAmount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(staff.id)}
                      className="text-blue-600 hover:text-blue-800 font-bold text-[11px]"
                    >
                      {staff.status === 'ON_DUTY' ? 'End Shift' : 'Clock In'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SHIFT 2: AFTERNOON SHIFT */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <h3 className="font-bold text-sm text-slate-900">Afternoon Shift</h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" /> 02:00 PM – 10:00 PM
              </p>
            </div>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] rounded-full">
              {afternoonStaff.length} Staff
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {afternoonStaff.map((staff) => (
              <div
                key={staff.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={staff.avatar}
                      alt={staff.staffName}
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{staff.staffName}</h4>
                      <span className="inline-block px-1.5 py-0.2 bg-blue-50 text-blue-600 font-bold text-[10px] rounded mt-0.5">
                        {staff.role}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Upcoming
                  </span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Monitor className="w-3 h-3 text-slate-400" />
                      {staff.terminal}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-medium">
                    <span className="flex items-center gap-1">
                      <Banknote className="w-3 h-3 text-slate-400" />
                      Float: {currency}{staff.floatAmount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(staff.id)}
                      className="text-blue-600 hover:text-blue-800 font-bold text-[11px]"
                    >
                      {staff.status === 'ON_DUTY' ? 'End Shift' : 'Clock In'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SHIFT 3: NIGHT SHIFT */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <h3 className="font-bold text-sm text-slate-900">Night / Closing Shift</h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" /> 10:00 PM – 06:00 AM
              </p>
            </div>
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[10px] rounded-full">
              {nightStaff.length} Staff
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {nightStaff.map((staff) => (
              <div
                key={staff.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={staff.avatar}
                      alt={staff.staffName}
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{staff.staffName}</h4>
                      <span className="inline-block px-1.5 py-0.2 bg-blue-50 text-blue-600 font-bold text-[10px] rounded mt-0.5">
                        {staff.role}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    Scheduled
                  </span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Monitor className="w-3 h-3 text-slate-400" />
                      {staff.terminal}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-medium">
                    <span className="flex items-center gap-1">
                      <Banknote className="w-3 h-3 text-slate-400" />
                      Float: {currency}{staff.floatAmount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(staff.id)}
                      className="text-blue-600 hover:text-blue-800 font-bold text-[11px]"
                    >
                      {staff.status === 'ON_DUTY' ? 'End Shift' : 'Clock In'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assign Staff Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Assign Staff to Shift</h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStaffToRoster} className="py-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Cashier / Staff Name
                </label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Assigned Role
                </label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="Cashier">Cashier</option>
                  <option value="Head Cashier">Head Cashier</option>
                  <option value="Supervisor">Shift Supervisor</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Shift Timing
                </label>
                <select
                  value={newShiftSlot}
                  onChange={(e) => setNewShiftSlot(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="Morning Shift">Morning Shift (06:00 AM – 02:00 PM)</option>
                  <option value="Afternoon Shift">Afternoon Shift (02:00 PM – 10:00 PM)</option>
                  <option value="Night Shift">Night Shift (10:00 PM – 06:00 AM)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
                >
                  Confirm Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
