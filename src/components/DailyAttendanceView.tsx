import React, { useState, useMemo } from 'react';
import { Labour, AttendanceRecord, AttendanceStatus, AppSettings } from '../types';
import { formatCurrency, toDateStr } from '../utils/calculations';
import { triggerHaptic } from '../utils/haptics';
import { LabourAvatar } from './LabourAvatar';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Search, 
  CheckCheck, 
  XCircle, 
  Plus, 
  Minus, 
  MapPin, 
  Users,
  X,
  ListCheck
} from 'lucide-react';

interface DailyAttendanceViewProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  labourers: Labour[];
  attendance: AttendanceRecord[];
  onUpdateAttendance: (record: AttendanceRecord) => void;
  onBulkUpdateAttendance: (records: AttendanceRecord[]) => void;
  onOpenAdvanceModal: (labourId: string) => void;
  onOpenAddLabour: () => void;
  settings: AppSettings;
}

export const DailyAttendanceView: React.FC<DailyAttendanceViewProps> = ({
  selectedDate,
  setSelectedDate,
  labourers,
  attendance,
  onUpdateAttendance,
  onBulkUpdateAttendance,
  onOpenAdvanceModal,
  onOpenAddLabour,
  settings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  // Floating speed dial state
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeLabourers = useMemo(() => {
    return labourers.filter((l) => l.status === 'active');
  }, [labourers]);

  const roles = useMemo(() => {
    const set = new Set(activeLabourers.map((l) => l.role));
    return ['all', ...Array.from(set)];
  }, [activeLabourers]);

  const displayedLabourers = useMemo(() => {
    return activeLabourers.filter((l) => {
      const matchesSearch =
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.role.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = selectedRole === 'all' || l.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [activeLabourers, searchQuery, selectedRole]);

  const todayRecordsMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    attendance
      .filter((r) => r.date === selectedDate)
      .forEach((r) => {
        map.set(r.labourId, r);
      });
    return map;
  }, [attendance, selectedDate]);

  const dayStats = useMemo(() => {
    let present = 0;
    let halfDay = 0;
    let absent = 0;
    let totalWageLiability = 0;
    let totalOtHours = 0;

    activeLabourers.forEach((labour) => {
      const record = todayRecordsMap.get(labour.id);
      const status = record?.status;
      const ot = record?.overtimeHours || 0;
      const otRate = labour.overtimeHourlyRate || Math.round(labour.dailyWage / 8);

      if (status === 'present') {
        present += 1;
        totalWageLiability += labour.dailyWage + ot * otRate;
      } else if (status === 'half_day') {
        halfDay += 1;
        totalWageLiability += labour.dailyWage * 0.5 + ot * otRate;
      } else if (status === 'absent') {
        absent += 1;
      }

      totalOtHours += ot;
    });

    const notMarked = activeLabourers.length - (present + halfDay + absent);

    return {
      present,
      halfDay,
      absent,
      notMarked,
      totalWageLiability,
      totalOtHours,
    };
  }, [activeLabourers, todayRecordsMap]);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(toDateStr(d));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(toDateStr(d));
  };

  const handleTodayJump = () => {
    setSelectedDate(toDateStr(new Date()));
  };

  const handleStatusChange = (labourId: string, newStatus: AttendanceStatus) => {
    triggerHaptic();
    const existing = todayRecordsMap.get(labourId);
    const updated: AttendanceRecord = {
      id: existing ? existing.id : `${labourId}_${selectedDate}`,
      labourId,
      date: selectedDate,
      status: newStatus,
      overtimeHours: existing?.overtimeHours || 0,
      siteLocation: existing?.siteLocation || '',
      notes: existing?.notes || '',
      updatedAt: new Date().toISOString(),
    };
    onUpdateAttendance(updated);
  };

  const handleOvertimeChange = (labourId: string, delta: number) => {
    triggerHaptic();
    const existing = todayRecordsMap.get(labourId);
    const currentOt = existing?.overtimeHours || 0;
    const newOt = Math.max(0, Math.min(12, currentOt + delta));

    const updated: AttendanceRecord = {
      id: existing ? existing.id : `${labourId}_${selectedDate}`,
      labourId,
      date: selectedDate,
      status: existing?.status || 'present',
      overtimeHours: newOt,
      siteLocation: existing?.siteLocation || '',
      notes: existing?.notes || '',
      updatedAt: new Date().toISOString(),
    };
    onUpdateAttendance(updated);
  };

  const handleNotesChange = (labourId: string, notes: string) => {
    const existing = todayRecordsMap.get(labourId);
    const updated: AttendanceRecord = {
      id: existing ? existing.id : `${labourId}_${selectedDate}`,
      labourId,
      date: selectedDate,
      status: existing?.status || 'not_marked',
      overtimeHours: existing?.overtimeHours || 0,
      siteLocation: existing?.siteLocation || '',
      notes,
      updatedAt: new Date().toISOString(),
    };
    onUpdateAttendance(updated);
  };

  const handleBulkMark = (status: AttendanceStatus) => {
    triggerHaptic();
    const updates: AttendanceRecord[] = displayedLabourers.map((l) => {
      const existing = todayRecordsMap.get(l.id);
      return {
        id: existing ? existing.id : `${l.id}_${selectedDate}`,
        labourId: l.id,
        date: selectedDate,
        status,
        overtimeHours: existing?.overtimeHours || 0,
        siteLocation: existing?.siteLocation || '',
        notes: (existing?.notes && !existing.notes.includes('via Android Home') && !existing.notes.includes('Quick 1-tap')) ? existing.notes : '',
        updatedAt: new Date().toISOString(),
      };
    });
    onBulkUpdateAttendance(updates);

    const label = status === 'present' ? 'Present (P)' : status === 'half_day' ? 'Half Day (HD)' : 'Absent (A)';
    setToastMessage(`Marked all ${displayedLabourers.length} labourers as ${label}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const isToday = selectedDate === toDateStr(new Date());

  const formattedDateHeader = useMemo(() => {
    const d = new Date(selectedDate);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [selectedDate]);

  return (
    <div className="space-y-3.5 pb-24 select-none relative">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-18 left-4 right-4 z-50 max-w-sm mx-auto p-3 bg-neutral-900 text-white text-xs font-bold rounded-2xl shadow-xl flex items-center justify-between border border-neutral-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="p-1 hover:text-neutral-300">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Date Navigator & Roll Call Control Card */}
      <div className="bg-white border border-purple-100 rounded-3xl p-3.5 shadow-sm space-y-3">
        {/* Date Row with Previous/Next Arrows and Today shortcut */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <button
              onClick={handlePrevDay}
              className="w-10 h-10 flex items-center justify-center text-neutral-700 hover:text-neutral-900 rounded-2xl hover:bg-purple-50 transition-colors border border-purple-100 cursor-pointer shrink-0"
              title="Previous Day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 px-3 py-2 bg-purple-50/80 border border-purple-100/90 rounded-2xl flex-1 min-w-0">
              <CalendarIcon className="w-4 h-4 text-[#5C2D91] shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs sm:text-sm font-extrabold bg-transparent text-neutral-900 focus:outline-none cursor-pointer truncate"
              />
              <span className="hidden sm:inline text-xs font-bold text-neutral-500 border-l border-purple-200 pl-2 shrink-0">
                {formattedDateHeader}
              </span>
            </div>

            <button
              onClick={handleNextDay}
              className="w-10 h-10 flex items-center justify-center text-neutral-700 hover:text-neutral-900 rounded-2xl hover:bg-purple-50 transition-colors border border-purple-100 cursor-pointer shrink-0"
              title="Next Day"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {!isToday && (
            <button
              onClick={handleTodayJump}
              className="px-3 py-2 text-xs font-bold text-white bg-[#5C2D91] hover:bg-[#4E247D] rounded-2xl transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              Today
            </button>
          )}
        </div>

        {/* Quick Bulk Marking Actions */}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            onClick={() => handleBulkMark('present')}
            className="flex-1 flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-2xl transition-all border border-emerald-200 cursor-pointer active:scale-98 shadow-2xs"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>Mark All Present</span>
          </button>
          <button
            onClick={() => handleBulkMark('absent')}
            className="flex-1 flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-2xl transition-all border border-rose-200 cursor-pointer active:scale-98 shadow-2xs"
          >
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>Mark All Absent</span>
          </button>
        </div>

        {/* 2. Redesigned Day KPI Stats: Present | Half Day | Absent | Day Cost */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-purple-50">
          <div className="p-2.5 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-center">
            <span className="text-[10px] font-extrabold text-emerald-800 uppercase block leading-none">
              Present
            </span>
            <span className="text-base font-black text-emerald-700 tabular-nums font-mono block mt-1">
              {dayStats.present}
            </span>
          </div>

          <div className="p-2.5 bg-amber-50/80 rounded-2xl border border-amber-200 text-center">
            <span className="text-[10px] font-extrabold text-amber-800 uppercase block leading-none">
              Half Day
            </span>
            <span className="text-base font-black text-amber-700 tabular-nums font-mono block mt-1">
              {dayStats.halfDay}
            </span>
          </div>

          <div className="p-2.5 bg-rose-50/80 rounded-2xl border border-rose-200 text-center">
            <span className="text-[10px] font-extrabold text-rose-800 uppercase block leading-none">
              Absent
            </span>
            <span className="text-base font-black text-rose-700 tabular-nums font-mono block mt-1">
              {dayStats.absent}
            </span>
          </div>

          <div className="p-2.5 bg-purple-50/90 rounded-2xl border border-purple-200 text-center">
            <span className="text-[10px] font-extrabold text-[#5C2D91] uppercase block leading-none">
              Day Pay
            </span>
            <span className="text-xs font-black text-[#5C2D91] tabular-nums font-mono block mt-1.5 truncate">
              {formatCurrency(dayStats.totalWageLiability, settings.currencySymbol)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Search and Trade Filter Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search labourer name or trade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 text-xs bg-white border border-purple-100 rounded-2xl text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]/25 shadow-2xs font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="px-3 py-2.5 text-xs bg-white border border-purple-100 rounded-2xl text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#5C2D91] cursor-pointer shadow-2xs font-medium shrink-0"
        >
          {roles.map((r) => (
            <option key={r} value={r}>
              {r === 'all' ? 'All Trades' : r}
            </option>
          ))}
        </select>
      </div>

      {/* 4. Labour Attendance Cards */}
      {displayedLabourers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-purple-100 p-6 space-y-3">
          <Users className="w-10 h-10 text-neutral-300 mx-auto" />
          <h3 className="text-sm font-bold text-neutral-900">
            No labourers match your search
          </h3>
          <p className="text-xs text-neutral-500">
            Try adjusting your search query or add a new worker.
          </p>
          <button
            onClick={onOpenAddLabour}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#5C2D91] hover:bg-[#4E247D] rounded-2xl transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Labour</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedLabourers.map((labour) => {
            const record = todayRecordsMap.get(labour.id);
            const status: AttendanceStatus = record?.status || 'not_marked';
            const ot = record?.overtimeHours || 0;
            const otRate = labour.overtimeHourlyRate || Math.round(labour.dailyWage / 8);

            let todayWage = 0;
            if (status === 'present') todayWage += labour.dailyWage;
            else if (status === 'half_day') todayWage += labour.dailyWage * 0.5;
            const todayOt = ot * otRate;
            const totalEarnedToday = todayWage + todayOt;

            return (
              <div
                key={labour.id}
                className={`bg-white rounded-3xl border transition-all p-3.5 shadow-sm space-y-3 ${
                  status === 'present'
                    ? 'border-emerald-300 ring-1 ring-emerald-200/50'
                    : status === 'half_day'
                    ? 'border-amber-300 ring-1 ring-amber-200/50'
                    : status === 'absent'
                    ? 'border-rose-300 ring-1 ring-rose-200/50'
                    : 'border-purple-100'
                }`}
              >
                {/* Block 1: Worker Identity Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <LabourAvatar name={labour.name} photoUrl={labour.photoUrl} className="w-10 h-10 rounded-2xl" />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-neutral-900 truncate leading-snug">
                        {labour.name}
                      </h4>
                      <p className="text-[11px] text-neutral-500 font-medium truncate">
                        {labour.role}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-sm text-[#5C2D91] block">
                      {formatCurrency(labour.dailyWage, settings.currencySymbol)}
                    </span>
                    <span className="text-[10px] text-neutral-400 block font-mono">
                      OT: {formatCurrency(otRate, settings.currencySymbol)}/h
                    </span>
                  </div>
                </div>

                {/* Block 2: 3-Way Segmented Touch Attendance Selector */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(labour.id, 'present')}
                    className={`min-h-[44px] flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      status === 'present'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-neutral-700 hover:bg-neutral-200/70'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${status === 'present' ? 'bg-white' : 'bg-emerald-500'}`} />
                    <span>Present</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(labour.id, 'half_day')}
                    className={`min-h-[44px] flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      status === 'half_day'
                        ? 'bg-amber-500 text-neutral-950 shadow-sm'
                        : 'text-neutral-700 hover:bg-neutral-200/70'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${status === 'half_day' ? 'bg-neutral-950' : 'bg-amber-500'}`} />
                    <span>Half Day</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(labour.id, 'absent')}
                    className={`min-h-[44px] flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      status === 'absent'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-neutral-700 hover:bg-neutral-200/70'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${status === 'absent' ? 'bg-white' : 'bg-rose-500'}`} />
                    <span>Absent</span>
                  </button>
                </div>

                {/* Block 3: Overtime Stepper + Today Earnings + Advance Button */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-purple-50">
                  <div className="flex items-center gap-1.5 bg-purple-50/80 px-2.5 py-1 rounded-xl border border-purple-100">
                    <span className="text-[10px] font-bold text-[#5C2D91] uppercase">OT:</span>
                    <button
                      type="button"
                      disabled={ot <= 0}
                      onClick={() => handleOvertimeChange(labour.id, -0.5)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs cursor-pointer active:scale-95"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono font-bold text-xs tabular-nums text-neutral-900 min-w-[28px] text-center">
                      {ot}h
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOvertimeChange(labour.id, 0.5)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-neutral-700 shadow-2xs cursor-pointer active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-neutral-400 uppercase block">Day Pay</span>
                      <span className="font-mono font-black text-xs text-[#5C2D91]">
                        {status === 'not_marked' ? '-' : formatCurrency(totalEarnedToday, settings.currencySymbol)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenAdvanceModal(labour.id)}
                      className="px-2.5 py-1.5 text-[11px] font-bold text-[#5C2D91] bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-colors cursor-pointer shrink-0"
                    >
                      + Advance
                    </button>
                  </div>
                </div>

                {/* Optional Task Note */}
                <div className="pt-1 flex items-center gap-2 text-xs text-neutral-500">
                  <MapPin className="w-3 h-3 text-[#5C2D91] shrink-0" />
                  <input
                    type="text"
                    placeholder="Worksite task note (e.g. 4th floor concrete)..."
                    value={(record?.notes && (record.notes.includes('Quick 1-tap') || record.notes.includes('via Android Home'))) ? '' : (record?.notes || '')}
                    onChange={(e) => handleNotesChange(labour.id, e.target.value)}
                    className="text-xs text-neutral-800 placeholder-neutral-400 bg-transparent w-full focus:outline-none"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Speed-Dial Menu Backdrop */}
      {isFabOpen && (
        <div 
          onClick={() => setIsFabOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs animate-in fade-in duration-150"
        />
      )}

      {/* Floating Speed-Dial Options for Quick Bulk Marking */}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2.5">
        {isFabOpen && (
          <div className="flex flex-col items-end gap-2 animate-in slide-in-from-bottom-4 duration-200">
            {/* Option 1: Mark All Present */}
            <button
              onClick={() => {
                handleBulkMark('present');
                setIsFabOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xl font-bold text-xs transition-transform active:scale-95 cursor-pointer border border-emerald-500/50"
            >
              <span>Mark All as Present (P)</span>
              <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center font-black text-xs">P</span>
            </button>

            {/* Option 2: Mark All Half Day */}
            <button
              onClick={() => {
                handleBulkMark('half_day');
                setIsFabOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded-2xl shadow-xl font-bold text-xs transition-transform active:scale-95 cursor-pointer border border-amber-400/50"
            >
              <span>Mark All as Half Day (HD)</span>
              <span className="w-6 h-6 rounded-lg bg-black/10 flex items-center justify-center font-black text-xs">HD</span>
            </button>

            {/* Option 3: Mark All Absent */}
            <button
              onClick={() => {
                handleBulkMark('absent');
                setIsFabOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl shadow-xl font-bold text-xs transition-transform active:scale-95 cursor-pointer border border-rose-500/50"
            >
              <span>Mark All as Absent (A)</span>
              <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center font-black text-xs">A</span>
            </button>
          </div>
        )}

        {/* Primary Floating Trigger Button */}
        <button
          onClick={() => {
            triggerHaptic();
            setIsFabOpen(!isFabOpen);
          }}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl ring-4 ring-white transition-all cursor-pointer active:scale-95 ${
            isFabOpen
              ? 'bg-neutral-900 text-white rotate-90'
              : 'bg-[#5C2D91] hover:bg-[#4E247D] text-white shadow-purple-900/40'
          }`}
          title="Floating Quick Mark Attendance for All Labourers"
        >
          {isFabOpen ? (
            <X className="w-6 h-6 stroke-[2.5]" />
          ) : (
            <ListCheck className="w-6 h-6 stroke-[2.5]" />
          )}
        </button>
      </div>
    </div>
  );
};
