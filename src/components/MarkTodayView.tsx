import React, { useState, useMemo, useEffect } from 'react';
import { Labour, AttendanceRecord, AttendanceStatus, AppSettings } from '../types';
import { formatCurrency, toDateStr } from '../utils/calculations';
import { triggerHaptic } from '../utils/haptics';
import { 
  Calendar, 
  Search, 
  Plus, 
  Minus, 
  History, 
  ChevronDown, 
  ChevronUp, 
  CreditCard, 
  X,
  MapPin,
  TrendingUp,
  Percent,
  CheckCheck,
  Check,
  AlertCircle
} from 'lucide-react';

interface MarkTodayViewProps {
  labourers: Labour[];
  attendance: AttendanceRecord[];
  onUpdateAttendance: (record: AttendanceRecord) => void;
  onBulkUpdateAttendance?: (records: AttendanceRecord[]) => void;
  onOpenAdvanceModal: (labourId: string) => void;
  settings: AppSettings;
}

export const MarkTodayView: React.FC<MarkTodayViewProps> = ({
  labourers,
  attendance,
  onUpdateAttendance,
  onBulkUpdateAttendance,
  onOpenAdvanceModal,
  settings,
}) => {
  const todayStr = toDateStr(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLabourId, setExpandedLabourId] = useState<string | null>(null);
  const [isJustRecorded, setIsJustRecorded] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'warning' | 'info'; text: string } | null>(null);

  const activeLabourers = useMemo(() => {
    return labourers.filter((l) => l.status === 'active');
  }, [labourers]);

  // Working staged records map for today
  const [stagedMap, setStagedMap] = useState<Map<string, AttendanceRecord>>(() => {
    const map = new Map<string, AttendanceRecord>();
    attendance
      .filter((r) => r.date === todayStr)
      .forEach((r) => {
        map.set(r.labourId, { ...r });
      });
    return map;
  });

  // Sync external attendance updates into stagedMap if new records arrive
  useEffect(() => {
    setStagedMap((prev) => {
      const next = new Map(prev);
      attendance
        .filter((r) => r.date === todayStr)
        .forEach((r) => {
          if (!next.has(r.labourId)) {
            next.set(r.labourId, { ...r });
          }
        });
      return next;
    });
  }, [attendance, todayStr]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Search filter for labourers
  const displayedLabourers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return activeLabourers;
    return activeLabourers.filter((l) => {
      return (
        l.name.toLowerCase().includes(q) ||
        l.role.toLowerCase().includes(q)
      );
    });
  }, [activeLabourers, searchQuery]);

  // Real-time summary metrics calculated from stagedMap
  const todayStats = useMemo(() => {
    let present = 0;
    let halfDay = 0;
    let absent = 0;
    let totalWageLiability = 0;

    activeLabourers.forEach((l) => {
      const rec = stagedMap.get(l.id);
      const status = rec?.status;
      const ot = rec?.overtimeHours || 0;
      const otRate = l.overtimeHourlyRate || Math.round(l.dailyWage / 8);

      if (status === 'present') {
        present += 1;
        totalWageLiability += l.dailyWage + ot * otRate;
      } else if (status === 'half_day') {
        halfDay += 1;
        totalWageLiability += l.dailyWage * 0.5 + ot * otRate;
      } else if (status === 'absent') {
        absent += 1;
      }
    });

    const markedCount = present + halfDay + absent;
    const unmarked = activeLabourers.length - markedCount;

    return {
      present,
      halfDay,
      absent,
      unmarked,
      markedCount,
      totalWageLiability,
    };
  }, [activeLabourers, stagedMap]);

  // Individual worker past attendance history log (last 15 records)
  const getLabourAttendanceHistory = (labourId: string) => {
    const workerRecords = attendance
      .filter((r) => r.labourId === labourId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 15);

    const totalDaysRecorded = workerRecords.length;
    const presentDays = workerRecords.filter((r) => r.status === 'present').length;
    const halfDays = workerRecords.filter((r) => r.status === 'half_day').length;
    const attendanceRate = totalDaysRecorded > 0
      ? Math.round(((presentDays + halfDays * 0.5) / totalDaysRecorded) * 100)
      : 100;

    return {
      records: workerRecords,
      totalDaysRecorded,
      presentDays,
      halfDays,
      attendanceRate,
    };
  };

  // Select status (Present, Half Day, Absent) in staged working state
  const handleStatusSelect = (labourId: string, newStatus: AttendanceStatus) => {
    triggerHaptic();
    setStagedMap((prev) => {
      const next = new Map(prev);
      const existing = next.get(labourId);
      next.set(labourId, {
        id: existing?.id || `${labourId}_${todayStr}`,
        labourId,
        date: todayStr,
        status: newStatus,
        overtimeHours: existing?.overtimeHours || 0,
        siteLocation: existing?.siteLocation || settings.worksiteName,
        notes: existing?.notes || '',
        updatedAt: new Date().toISOString(),
      });
      return next;
    });
    setHasUnsavedChanges(true);
  };

  // Adjust overtime hours in staged working state
  const handleOvertimeChange = (labourId: string, delta: number) => {
    triggerHaptic();
    setStagedMap((prev) => {
      const next = new Map(prev);
      const existing = next.get(labourId);
      const currentOt = existing?.overtimeHours || 0;
      const newOt = Math.max(0, Math.min(12, currentOt + delta));

      next.set(labourId, {
        id: existing?.id || `${labourId}_${todayStr}`,
        labourId,
        date: todayStr,
        status: existing?.status || 'present',
        overtimeHours: newOt,
        siteLocation: existing?.siteLocation || settings.worksiteName,
        notes: existing?.notes || '',
        updatedAt: new Date().toISOString(),
      });
      return next;
    });
    setHasUnsavedChanges(true);
  };

  // Update task note in staged working state
  const handleNotesChange = (labourId: string, notes: string) => {
    setStagedMap((prev) => {
      const next = new Map(prev);
      const existing = next.get(labourId);
      next.set(labourId, {
        id: existing?.id || `${labourId}_${todayStr}`,
        labourId,
        date: todayStr,
        status: existing?.status || 'not_marked',
        overtimeHours: existing?.overtimeHours || 0,
        siteLocation: existing?.siteLocation || settings.worksiteName,
        notes,
        updatedAt: new Date().toISOString(),
      });
      return next;
    });
    setHasUnsavedChanges(true);
  };

  // Directly record all staged attendance data via the floating icon
  const handleRecordAttendanceData = () => {
    triggerHaptic();
    const recordsToCommit: AttendanceRecord[] = [];

    activeLabourers.forEach((l) => {
      const rec = stagedMap.get(l.id);
      if (rec && rec.status !== 'not_marked') {
        recordsToCommit.push(rec);
      }
    });

    if (recordsToCommit.length === 0) {
      setToast({
        type: 'warning',
        text: 'Please select Present, Half Day, or Absent for at least one labourer first.',
      });
      return;
    }

    if (onBulkUpdateAttendance) {
      onBulkUpdateAttendance(recordsToCommit);
    } else {
      recordsToCommit.forEach((r) => onUpdateAttendance(r));
    }

    const presentCount = recordsToCommit.filter((r) => r.status === 'present').length;
    const halfDayCount = recordsToCommit.filter((r) => r.status === 'half_day').length;
    const absentCount = recordsToCommit.filter((r) => r.status === 'absent').length;

    setIsJustRecorded(true);
    setHasUnsavedChanges(false);
    setToast({
      type: 'success',
      text: `Attendance recorded: ${presentCount} Present, ${halfDayCount} Half, ${absentCount} Absent`,
    });

    setTimeout(() => {
      setIsJustRecorded(false);
    }, 2800);
  };

  return (
    <div className="space-y-3.5 pb-24 select-none relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-4 right-4 max-w-md mx-auto z-50 animate-in slide-in-from-top-3 fade-in duration-200">
          <div className={`p-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-2.5 text-white text-xs font-bold ${
            toast.type === 'success'
              ? 'bg-emerald-600 ring-2 ring-emerald-400/50'
              : toast.type === 'warning'
              ? 'bg-amber-600 ring-2 ring-amber-400/50'
              : 'bg-[#5C2D91] ring-2 ring-purple-400/50'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              {toast.type === 'success' && <Check className="w-4 h-4 stroke-[3] shrink-0" />}
              {toast.type === 'warning' && <AlertCircle className="w-4 h-4 shrink-0" />}
              <span className="truncate">{toast.text}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-white/80 hover:text-white p-1 cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 1. Today's Header Banner */}
      <div className="bg-gradient-to-br from-[#5C2D91] via-[#4D227E] to-[#381461] rounded-3xl p-4 text-white shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-200 block">
              Attendance &middot; Individual Worker Records
            </span>
            <div className="text-xl font-black text-white mt-0.5 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-200" />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-purple-200 uppercase font-bold block">Today's Wage Cost</span>
            <span className="text-base font-black font-mono text-white block mt-0.5">
              {formatCurrency(todayStats.totalWageLiability, settings.currencySymbol)}
            </span>
          </div>
        </div>

        {/* 4 Status Counters (Preserved as requested) */}
        <div className="grid grid-cols-4 gap-2 pt-3 text-center">
          <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-2xl p-2">
            <span className="text-[9px] font-bold text-emerald-300 uppercase block">Present</span>
            <span className="text-base font-black font-mono text-white mt-0.5 block">{todayStats.present}</span>
          </div>

          <div className="bg-amber-500/20 border border-amber-400/30 rounded-2xl p-2">
            <span className="text-[9px] font-bold text-amber-300 uppercase block">Half Day</span>
            <span className="text-base font-black font-mono text-white mt-0.5 block">{todayStats.halfDay}</span>
          </div>

          <div className="bg-rose-500/20 border border-rose-400/30 rounded-2xl p-2">
            <span className="text-[9px] font-bold text-rose-300 uppercase block">Absent</span>
            <span className="text-base font-black font-mono text-white mt-0.5 block">{todayStats.absent}</span>
          </div>

          <div className="bg-white/10 border border-white/15 rounded-2xl p-2">
            <span className="text-[9px] font-bold text-purple-200 uppercase block">Pending</span>
            <span className="text-base font-black font-mono text-white mt-0.5 block">{todayStats.unmarked}</span>
          </div>
        </div>
      </div>

      {/* 2. Search Bar (Filter pill icons removed as requested) */}
      <div className="relative">
        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search worker name or trade..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-8 py-2.5 bg-white rounded-2xl border border-purple-100 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]/25 font-medium shadow-2xs"
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

      {/* 3. Individual Labour Attendance Cards with History Log */}
      <div className="space-y-3">
        {displayedLabourers.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-purple-100 text-neutral-400 text-xs">
            No labourers matching search query.
          </div>
        ) : (
          displayedLabourers.map((labour) => {
            const record = stagedMap.get(labour.id);
            const status: AttendanceStatus = record?.status || 'not_marked';
            const ot = record?.overtimeHours || 0;
            const otRate = labour.overtimeHourlyRate || Math.round(labour.dailyWage / 8);

            let todayWage = 0;
            if (status === 'present') todayWage += labour.dailyWage;
            else if (status === 'half_day') todayWage += labour.dailyWage * 0.5;
            const todayOt = ot * otRate;
            const totalEarnedToday = todayWage + todayOt;

            const isExpanded = expandedLabourId === labour.id;
            const history = isExpanded ? getLabourAttendanceHistory(labour.id) : null;

            return (
              <div
                key={labour.id}
                className={`bg-white rounded-3xl border p-4 shadow-sm transition-all space-y-3 ${
                  status === 'present'
                    ? 'border-emerald-300 ring-1 ring-emerald-200/50'
                    : status === 'half_day'
                    ? 'border-amber-300 ring-1 ring-amber-200/50'
                    : status === 'absent'
                    ? 'border-rose-300 ring-1 ring-rose-200/50'
                    : 'border-purple-100'
                }`}
              >
                {/* Header: Identity + Wage Rate (Strictly NO tag numbers) */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#5C2D91] to-[#7B3FB7] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                      {labour.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-neutral-900 truncate leading-snug">
                        {labour.name}
                      </h4>
                      <p className="text-[11px] text-neutral-500 font-medium truncate">
                        {labour.role} &middot; <span className="font-mono text-neutral-700">{settings.currencySymbol}{labour.dailyWage}/day</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[9px] font-bold text-neutral-400 uppercase block">Earned Today</span>
                    <span className="font-mono font-black text-sm text-[#5C2D91] block">
                      {status === 'not_marked' ? '-' : formatCurrency(totalEarnedToday, settings.currencySymbol)}
                    </span>
                  </div>
                </div>

                {/* 3-Button Segmented Attendance Selector for Today (Preserved inside individual worker panel) */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => handleStatusSelect(labour.id, 'present')}
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
                    onClick={() => handleStatusSelect(labour.id, 'half_day')}
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
                    onClick={() => handleStatusSelect(labour.id, 'absent')}
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

                {/* Overtime Stepper + Advance Shortcut */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-purple-50">
                  <div className="flex items-center gap-1.5 bg-purple-50/80 px-2.5 py-1 rounded-xl border border-purple-100">
                    <span className="text-[10px] font-bold text-[#5C2D91] uppercase">Overtime:</span>
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

                  <button
                    type="button"
                    onClick={() => onOpenAdvanceModal(labour.id)}
                    className="min-h-[34px] px-3 py-1 text-xs font-bold text-[#5C2D91] bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>+ Advance</span>
                  </button>
                </div>

                {/* Optional Task Note */}
                <div className="pt-0.5 flex items-center gap-2 text-xs text-neutral-500">
                  <MapPin className="w-3 h-3 text-[#5C2D91] shrink-0" />
                  <input
                    type="text"
                    placeholder="Today's task note..."
                    value={record?.notes || ''}
                    onChange={(e) => handleNotesChange(labour.id, e.target.value)}
                    className="text-xs text-neutral-800 placeholder-neutral-400 bg-transparent w-full focus:outline-none"
                  />
                </div>

                {/* Individual Labour Attendance Records Drawer Toggle */}
                <div className="pt-2 border-t border-purple-50">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      setExpandedLabourId(isExpanded ? null : labour.id);
                    }}
                    className="w-full flex items-center justify-between text-xs font-bold text-[#5C2D91] hover:text-[#4A1E7A] p-1.5 rounded-xl hover:bg-purple-50 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <History className="w-4 h-4" />
                      <span>{isExpanded ? 'Hide Attendance Records' : 'View Past Attendance Records'}</span>
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {/* Expanded Individual Attendance History */}
                  {isExpanded && history && (
                    <div className="mt-2.5 p-3 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-2.5 animate-in fade-in duration-150">
                      {/* Worker Attendance Stats Badge */}
                      <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-purple-100 text-[11px]">
                        <div className="flex items-center gap-1 text-neutral-700">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Present: <b className="text-neutral-900">{history.presentDays}</b> days</span>
                        </div>
                        <div className="flex items-center gap-1 text-neutral-700">
                          <Percent className="w-3.5 h-3.5 text-[#5C2D91]" />
                          <span>Rate: <b className="text-[#5C2D91]">{history.attendanceRate}%</b></span>
                        </div>
                      </div>

                      {/* Recent Recorded Dates Log */}
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {history.records.length === 0 ? (
                          <p className="text-[11px] text-neutral-400 text-center py-2">No past records for this worker.</p>
                        ) : (
                          history.records.map((r) => (
                            <div
                              key={r.id}
                              className="bg-white p-2 rounded-xl border border-neutral-100 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-mono font-bold text-neutral-800 text-[11px] block">{r.date}</span>
                                {r.notes && (
                                  <span className="text-[10px] text-neutral-500 block truncate max-w-[180px]">{r.notes}</span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {r.overtimeHours > 0 && (
                                  <span className="text-[10px] font-mono text-[#5C2D91] font-bold">
                                    +{r.overtimeHours}h OT
                                  </span>
                                )}
                                <span
                                  className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md uppercase ${
                                    r.status === 'present'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : r.status === 'half_day'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {r.status === 'present' ? 'P' : r.status === 'half_day' ? 'HD' : 'A'}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Floating Action Button to directly record attendance data (Pure Icon Only - No Text) */}
      <div className="fixed bottom-20 right-4 sm:right-[calc(50%-13rem+1rem)] z-40">
        <button
          type="button"
          onClick={handleRecordAttendanceData}
          aria-label="Record Attendance"
          title="Record Attendance"
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_25px_rgba(92,45,145,0.45)] ring-4 ring-white active:scale-90 transition-all cursor-pointer ${
            isJustRecorded
              ? 'bg-emerald-600 text-white'
              : hasUnsavedChanges
              ? 'bg-gradient-to-br from-[#5C2D91] via-[#702F9E] to-[#9138B8] text-white animate-pulse'
              : 'bg-gradient-to-br from-[#5C2D91] to-[#7B3FB7] text-white hover:brightness-110'
          }`}
        >
          {isJustRecorded ? (
            <Check className="w-7 h-7 stroke-[2.8] text-white" />
          ) : (
            <CheckCheck className="w-7 h-7 stroke-[2.2] text-white" />
          )}
        </button>
      </div>
    </div>
  );
};
