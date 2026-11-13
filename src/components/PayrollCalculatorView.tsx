import React, { useState, useMemo } from 'react';
import {
  Labour,
  AttendanceRecord,
  AdvanceTransaction,
  AppSettings,
  LabourWageSummary,
} from '../types';
import { calculateLabourWage, getDateRanges } from '../utils/calculations';
import { triggerHaptic } from '../utils/haptics';
import { LabourAvatar } from './LabourAvatar';
import { Search, Printer, TrendingDown, Users, X } from 'lucide-react';

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
}) => {
  const [periodPreset, setPeriodPreset] = useState<
    'this_month' | 'all_time' | 'last_month' | 'this_week' | 'custom'
  >('this_month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const dateRange = useMemo(() => {
    return getDateRanges(periodPreset, customStart, customEnd);
  }, [periodPreset, customStart, customEnd]);

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

  const filteredSummaries = useMemo(() => {
    if (!searchTerm.trim()) return summaries;
    const term = searchTerm.toLowerCase();
    return summaries.filter(
      (s) =>
        s.labour.name.toLowerCase().includes(term) ||
        s.labour.role.toLowerCase().includes(term)
    );
  }, [summaries, searchTerm]);

  const totals = useMemo(() => {
    return summaries.reduce(
      (acc, s) => ({
        grossWages: acc.grossWages + s.grossWages,
        advances: acc.advances + s.totalAdvances,
        netPayable: acc.netPayable + s.netPayable,
      }),
      { grossWages: 0, advances: 0, netPayable: 0 }
    );
  }, [summaries]);

  return (
    <div className="space-y-3.5 pb-4 select-none">
      {/* 1. Financial Summary Hero Card */}
      <div className="bg-gradient-to-br from-[#5C2D91] via-[#4D227E] to-[#381461] rounded-3xl p-4 text-white shadow-sm">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/15">
          <div>
            <span className="text-[11px] font-semibold text-purple-200 block">
              Remaining Balance (Net Payable)
            </span>
            <div className="text-2xl font-black font-mono tabular-nums tracking-tight text-white mt-0.5">
              {settings.currencySymbol}
              {totals.netPayable.toLocaleString()}
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs text-purple-200 font-semibold block">
              {summaries.length} Active
            </span>
            <span className="text-[11px] text-white/90 font-medium block mt-0.5">
              {dateRange.label}
            </span>
          </div>
        </div>

        {/* 3 Metrics: Total, Advance, Remaining */}
        <div className="grid grid-cols-3 gap-2 pt-3 text-center">
          <div className="bg-white/10 rounded-2xl p-2.5 border border-white/10">
            <span className="text-[11px] font-bold text-purple-200 block">Total</span>
            <span className="text-xs font-black font-mono tabular-nums text-white block mt-0.5 truncate">
              {settings.currencySymbol}
              {totals.grossWages.toLocaleString()}
            </span>
          </div>

          <div className="bg-rose-500/20 rounded-2xl p-2.5 border border-rose-400/25">
            <span className="text-[11px] font-bold text-rose-200 flex items-center justify-center gap-0.5">
              <TrendingDown className="w-3 h-3" />
              <span>Advance</span>
            </span>
            <span className="text-xs font-black font-mono tabular-nums text-rose-200 block mt-0.5 truncate">
              -{settings.currencySymbol}
              {totals.advances.toLocaleString()}
            </span>
          </div>

          <div className="bg-emerald-500/20 rounded-2xl p-2.5 border border-emerald-400/25">
            <span className="text-[11px] font-bold text-emerald-200 block">Remaining</span>
            <span className="text-xs font-black font-mono tabular-nums text-emerald-100 block mt-0.5 truncate">
              {settings.currencySymbol}
              {totals.netPayable.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Scrollable Android Period Chips */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'this_month', label: 'This Month' },
            { id: 'all_time', label: 'All Time' },
            { id: 'this_week', label: 'This Week' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'custom', label: 'Custom Range' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                triggerHaptic();
                setPeriodPreset(tab.id as typeof periodPreset);
              }}
              className={`min-h-[40px] px-3.5 text-xs font-bold rounded-full whitespace-nowrap shrink-0 transition-all cursor-pointer border ${
                periodPreset === tab.id
                  ? 'bg-[#5C2D91] text-white border-[#5C2D91] shadow-xs'
                  : 'bg-white text-neutral-700 border-purple-100 hover:bg-purple-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {periodPreset === 'custom' && (
          <div className="bg-white p-3 rounded-2xl border border-purple-100 grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-neutral-500 block mb-1">From</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full min-h-[40px] px-2.5 py-1.5 rounded-xl border border-neutral-200 text-xs font-mono bg-neutral-50"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-neutral-500 block mb-1">To</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full min-h-[40px] px-2.5 py-1.5 rounded-xl border border-neutral-200 text-xs font-mono bg-neutral-50"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search worker by name or trade..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full min-h-[44px] pl-10 pr-10 py-2.5 bg-white rounded-2xl border border-purple-100 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]/25 font-medium"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            aria-label="Clear search"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-neutral-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 4. Worker Wage Cards */}
      <div className="space-y-3">
        {filteredSummaries.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-purple-100 text-neutral-500 text-xs space-y-2">
            <Users className="w-8 h-8 text-neutral-300 mx-auto" />
            <p className="font-semibold text-neutral-700">No labourers matching search</p>
          </div>
        ) : (
          filteredSummaries.map((s) => (
            <div
              key={s.labour.id}
              className="bg-white rounded-3xl p-4 shadow-2xs border border-purple-100 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <LabourAvatar
                    name={s.labour.name}
                    photoUrl={s.labour.photoUrl}
                    className="w-11 h-11 rounded-2xl"
                    fallbackClassName="bg-[#5C2D91] text-white font-extrabold text-sm"
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-neutral-900 truncate">
                      {s.labour.name}
                    </h4>
                    <p className="text-xs text-neutral-500 truncate">
                      {s.labour.role} &middot;{' '}
                      <span className="font-mono text-neutral-700">
                        {settings.currencySymbol}
                        {s.labour.dailyWage}/day
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    onOpenPayslip(s, dateRange.label);
                  }}
                  className="min-h-[42px] px-3.5 py-2 bg-[#5C2D91] hover:bg-[#4E247D] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer shrink-0"
                  title="Generate Wage Slip"
                >
                  <Printer className="w-4 h-4" />
                  <span>Slip</span>
                </button>
              </div>

              {/* Attendance Breakdown Strip */}
              <div className="grid grid-cols-4 gap-1 py-2 px-1 text-center bg-neutral-50 rounded-2xl">
                <div>
                  <span className="text-[11px] font-medium text-neutral-500 block">Present</span>
                  <span className="text-xs font-bold text-emerald-700 font-mono tabular-nums">
                    {s.presentDays}d
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-neutral-500 block">Half</span>
                  <span className="text-xs font-bold text-amber-700 font-mono tabular-nums">
                    {s.halfDays}d
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-neutral-500 block">Absent</span>
                  <span className="text-xs font-bold text-rose-700 font-mono tabular-nums">
                    {s.absentDays}d
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-neutral-500 block">OT</span>
                  <span className="text-xs font-bold text-[#5C2D91] font-mono tabular-nums">
                    {s.totalOvertimeHours}h
                  </span>
                </div>
              </div>

              {/* 3 Financial Columns: Total, Advance, Remaining */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 bg-purple-50/50 rounded-2xl border border-purple-100">
                  <span className="text-[11px] font-bold text-neutral-600 block">
                    Total
                  </span>
                  <span className="font-mono tabular-nums font-black text-xs text-neutral-900 mt-0.5 block truncate">
                    {settings.currencySymbol}
                    {s.grossWages.toLocaleString()}
                  </span>
                </div>

                <div className="p-2.5 bg-rose-50/70 rounded-2xl border border-rose-100">
                  <span className="text-[11px] font-bold text-rose-700 block">
                    Advance
                  </span>
                  <span className="font-mono tabular-nums font-black text-xs text-rose-600 mt-0.5 block truncate">
                    {s.totalAdvances > 0
                      ? `-${settings.currencySymbol}${s.totalAdvances.toLocaleString()}`
                      : '-'}
                  </span>
                </div>

                <div
                  className={`p-2.5 rounded-2xl border ${
                    s.netPayable >= 0
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-rose-50 border-rose-200'
                  }`}
                >
                  <span
                    className={`text-[11px] font-bold block ${
                      s.netPayable >= 0 ? 'text-emerald-800' : 'text-rose-800'
                    }`}
                  >
                    Remaining
                  </span>
                  <span
                    className={`font-mono tabular-nums font-black text-xs mt-0.5 block truncate ${
                      s.netPayable >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {settings.currencySymbol}
                    {s.netPayable.toLocaleString()}
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
