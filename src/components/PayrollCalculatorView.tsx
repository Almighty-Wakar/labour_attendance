import React, { useState, useMemo } from 'react';
import { 
  Labour, 
  AttendanceRecord, 
  AdvanceTransaction, 
  AppSettings, 
  LabourWageSummary 
} from '../types';
import { 
  calculateLabourWage, 
  getDateRanges 
} from '../utils/calculations';
import { 
  Search, 
  Printer, 
  Clock,
  TrendingDown,
  Users,
  X
} from 'lucide-react';

interface PayrollCalculatorViewProps {
  labourers: Labour[];
  attendance: AttendanceRecord[];
  advances: AdvanceTransaction[];
  settings: AppSettings;
  onOpenPayslip: (summary: LabourWageSummary, periodLabel: string) => void;
  onOpenAdvanceModal: (labourId?: string) => void;
}

export const PayrollCalculatorView: React.FC<PayrollCalculatorViewProps> = ({
  labourers,
  attendance,
  advances,
  settings,
  onOpenPayslip,
  onOpenAdvanceModal: _onOpenAdvanceModal,
}) => {
  const [periodPreset, setPeriodPreset] = useState<'this_month' | 'all_time' | 'last_month' | 'this_week' | 'custom'>('this_month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Compute active date range
  const dateRange = useMemo(() => {
    return getDateRanges(periodPreset, customStart, customEnd);
  }, [periodPreset, customStart, customEnd]);

  // Calculate summaries for all active labourers
  const summaries = useMemo(() => {
    return labourers
      .filter((l) => l.status === 'active')
      .map((labour) =>
        calculateLabourWage(
          labour,
          attendance,
          advances,
          dateRange.startDate,
          dateRange.endDate
        )
      );
  }, [labourers, attendance, advances, dateRange]);

  // Filtered list
  const filteredSummaries = useMemo(() => {
    if (!searchTerm.trim()) return summaries;
    const term = searchTerm.toLowerCase();
    return summaries.filter(
      (s) =>
        s.labour.name.toLowerCase().includes(term) ||
        s.labour.role.toLowerCase().includes(term)
    );
  }, [summaries, searchTerm]);

  // Overall Totals
  const totals = useMemo(() => {
    return summaries.reduce(
      (acc, s) => ({
        grossWages: acc.grossWages + s.grossWages,
        advances: acc.advances + s.totalAdvances,
        netPayable: acc.netPayable + s.netPayable,
        otHours: acc.otHours + s.totalOvertimeHours,
      }),
      { grossWages: 0, advances: 0, netPayable: 0, otHours: 0 }
    );
  }, [summaries]);

  return (
    <div className="space-y-3.5 pb-16 select-none">
      {/* 1. Main Hero Financial Summary Banner */}
      <div className="bg-gradient-to-br from-[#5C2D91] via-[#4D227E] to-[#381461] rounded-3xl p-4 text-white shadow-md relative overflow-hidden">
        {/* Subtle decorative background circle */}
        <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />

        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-200 block">
              Total Remaining Money (Net Payable)
            </span>
            <div className="text-2xl font-black font-mono tracking-tight text-white mt-0.5">
              {settings.currencySymbol}{totals.netPayable.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-purple-200 font-medium block">
              {summaries.length} Active Workers
            </span>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-bold text-white tracking-tight">
              {dateRange.label}
            </span>
          </div>
        </div>

        {/* 3 Secondary Financial Sub-Metrics */}
        <div className="grid grid-cols-3 gap-2 pt-3 text-center">
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-2">
            <span className="text-[9px] font-bold text-purple-200 uppercase block truncate">Total</span>
            <span className="text-xs font-black font-mono text-white block mt-0.5 truncate">
              {settings.currencySymbol}{totals.grossWages.toLocaleString()}
            </span>
          </div>

          <div className="bg-rose-500/20 backdrop-blur-xs rounded-2xl p-2 border border-rose-400/30">
            <span className="text-[9px] font-bold text-rose-200 uppercase flex items-center justify-center gap-0.5 truncate">
              <TrendingDown className="w-2.5 h-2.5" />
              <span>Advance</span>
            </span>
            <span className="text-xs font-black font-mono text-rose-300 block mt-0.5 truncate">
              -{settings.currencySymbol}{totals.advances.toLocaleString()}
            </span>
          </div>

          <div className="bg-emerald-500/20 backdrop-blur-xs rounded-2xl p-2 border border-emerald-400/30">
            <span className="text-[9px] font-bold text-emerald-300 uppercase block truncate">Remaining</span>
            <span className="text-xs font-black font-mono text-emerald-200 block mt-0.5 truncate">
              {settings.currencySymbol}{totals.netPayable.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Period Navigation Filter Card */}
      <div className="bg-white rounded-3xl p-3 shadow-xs border border-purple-100/90 space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-neutral-800">
            Payment Period
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">
            {periodPreset === 'all_time' ? 'All records' : `${dateRange.startDate} to ${dateRange.endDate}`}
          </span>
        </div>

        {/* Segmented Period Selector Tabs */}
        <div className="grid grid-cols-5 gap-1 p-1 bg-purple-50/70 rounded-2xl border border-purple-100">
          {[
            { id: 'this_month', label: 'This Month' },
            { id: 'all_time', label: 'All Time' },
            { id: 'this_week', label: 'This Week' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'custom', label: 'Custom' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriodPreset(tab.id as any)}
              className={`min-h-[34px] text-[10px] font-bold rounded-xl transition-all cursor-pointer truncate px-1 ${
                periodPreset === tab.id
                  ? 'bg-[#5C2D91] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers */}
        {periodPreset === 'custom' && (
          <div className="pt-1 flex gap-2 items-center text-xs">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="flex-1 p-2 rounded-xl border border-neutral-200 text-xs font-mono bg-neutral-50 focus:bg-white"
            />
            <span className="text-neutral-400 font-medium">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="flex-1 p-2 rounded-xl border border-neutral-200 text-xs font-mono bg-neutral-50 focus:bg-white"
            />
          </div>
        )}
      </div>

      {/* 3. Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search worker by name or trade role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-8 py-2.5 bg-white rounded-2xl border border-purple-100 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]/25 font-medium shadow-2xs"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 4. Labourer Wage Cards List */}
      <div className="space-y-3">
        {filteredSummaries.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-purple-100 text-neutral-400 text-xs space-y-2">
            <Users className="w-8 h-8 text-neutral-300 mx-auto" />
            <p className="font-semibold text-neutral-600">No labourers matching search</p>
            <p className="text-[11px] text-neutral-400">Try searching a different name or role.</p>
          </div>
        ) : (
          filteredSummaries.map((s) => (
            <div
              key={s.labour.id}
              className="bg-white rounded-3xl p-3.5 shadow-sm border border-purple-100/90 space-y-2.5 transition-shadow hover:shadow-md"
            >
              {/* Card Header: Worker Avatar + Name + Trade & Daily Rate + Slip Action Button */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#5C2D91] to-[#7B3FB7] text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                    {s.labour.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-neutral-900 leading-snug truncate">
                      {s.labour.name}
                    </h4>
                    <p className="text-[11px] text-neutral-500 font-medium truncate">
                      {s.labour.role} &middot; <span className="font-mono text-neutral-700">{settings.currencySymbol}{s.labour.dailyWage}/day</span>
                    </p>
                  </div>
                </div>

                {/* Slip Button (Renamed from "Wage Slip") */}
                <button
                  type="button"
                  onClick={() => onOpenPayslip(s, dateRange.label)}
                  className="min-h-[38px] px-3.5 py-1.5 bg-[#5C2D91] hover:bg-[#4E247D] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer shrink-0"
                  title="Generate Wage Slip Voucher"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Slip</span>
                </button>
              </div>

              {/* Attendance Mini Badges Strip */}
              <div className="grid grid-cols-4 gap-1 text-center bg-purple-50/40 p-1.5 rounded-2xl border border-purple-100/70">
                <div className="py-0.5">
                  <span className="text-[9px] font-bold text-emerald-800 uppercase block">Present</span>
                  <span className="text-xs font-black text-emerald-700 font-mono">{s.presentDays}d</span>
                </div>
                <div className="py-0.5">
                  <span className="text-[9px] font-bold text-amber-800 uppercase block">Half</span>
                  <span className="text-xs font-black text-amber-700 font-mono">{s.halfDays}d</span>
                </div>
                <div className="py-0.5">
                  <span className="text-[9px] font-bold text-rose-800 uppercase block">Absent</span>
                  <span className="text-xs font-black text-rose-700 font-mono">{s.absentDays}d</span>
                </div>
                <div className="py-0.5">
                  <span className="text-[9px] font-bold text-[#5C2D91] uppercase block">OT (hrs)</span>
                  <span className="text-xs font-black text-[#5C2D91] font-mono">{s.totalOvertimeHours}h</span>
                </div>
              </div>

              {/* The 3 Core Financial Blocks (Total, Advance, Remaining) */}
              <div className="grid grid-cols-3 gap-2 p-2 bg-purple-50/50 rounded-2xl border border-purple-100">
                <div className="p-2 bg-white rounded-xl border border-purple-100 shadow-2xs">
                  <span className="text-[9px] font-bold text-neutral-500 uppercase block leading-tight">
                    Total
                  </span>
                  <span className="font-mono font-black text-xs text-neutral-900 mt-1 block truncate">
                    {settings.currencySymbol}{s.grossWages.toLocaleString()}
                  </span>
                  <span className="text-[8px] text-neutral-400 mt-0.5 block truncate">
                    Earned wages
                  </span>
                </div>

                <div className="p-2 bg-white rounded-xl border border-rose-100 shadow-2xs">
                  <span className="text-[9px] font-bold text-rose-500 uppercase block leading-tight">
                    Advance
                  </span>
                  <span className="font-mono font-black text-xs text-rose-600 mt-1 block truncate">
                    {s.totalAdvances > 0 ? `-${settings.currencySymbol}${s.totalAdvances.toLocaleString()}` : '-'}
                  </span>
                  <span className="text-[8px] text-neutral-400 mt-0.5 block truncate">
                    Advance money
                  </span>
                </div>

                <div className={`p-2 rounded-xl shadow-2xs ${
                  s.netPayable >= 0
                    ? 'bg-emerald-50 border border-emerald-200'
                    : 'bg-rose-50 border border-rose-200'
                }`}>
                  <span className={`text-[9px] font-bold uppercase block leading-tight ${
                    s.netPayable >= 0 ? 'text-emerald-800' : 'text-rose-800'
                  }`}>
                    Remaining
                  </span>
                  <span className={`font-mono font-black text-xs mt-1 block truncate ${
                    s.netPayable >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {settings.currencySymbol}{s.netPayable.toLocaleString()}
                  </span>
                  <span className={`text-[8px] font-bold mt-0.5 block truncate ${
                    s.netPayable >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {s.netPayable >= 0 ? 'To Pay' : 'Advance Due'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
