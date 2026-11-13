import React, { useState, useMemo } from 'react';
import { Labour, AdvanceTransaction, AttendanceRecord, AppSettings } from '../types';
import { formatCurrency, calculateLabourWage, getDateRanges } from '../utils/calculations';
import { triggerHaptic } from '../utils/haptics';
import { LabourAvatar } from './LabourAvatar';
import {
  Plus,
  Search,
  Trash2,
  ArrowDownLeft,
  Gift,
  X,
  Users,
  Receipt,
  Wallet,
  ChevronDown,
  ChevronUp,
  TrendingDown,
} from 'lucide-react';

interface PaymentsAdvancesViewProps {
  advances: AdvanceTransaction[];
  labourers: Labour[];
  attendance?: AttendanceRecord[];
  onOpenAdvanceModal: (labourId?: string) => void;
  onDeleteTransaction: (id: string) => void;
  settings: AppSettings;
}

export const PaymentsAdvancesView: React.FC<PaymentsAdvancesViewProps> = ({
  advances,
  labourers,
  attendance = [],
  onOpenAdvanceModal,
  onDeleteTransaction,
  settings,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'accounts' | 'transactions'>('accounts');
  const [periodPreset, setPeriodPreset] = useState<'this_month' | 'all_time' | 'this_week' | 'last_month'>('this_month');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'advance' | 'deduction' | 'bonus'>('all');
  const [expandedWorkerId, setExpandedWorkerId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const dateRange = useMemo(() => {
    return getDateRanges(periodPreset);
  }, [periodPreset]);

  const activeLabourers = useMemo(() => {
    return labourers.filter((l) => l.status === 'active');
  }, [labourers]);

  const labourMap = useMemo(() => {
    const map = new Map<string, Labour>();
    labourers.forEach((l) => map.set(l.id, l));
    return map;
  }, [labourers]);

  const workerSummaries = useMemo(() => {
    return activeLabourers.map((labour) => {
      const summary = calculateLabourWage(
        labour,
        attendance,
        advances,
        dateRange.startDate,
        dateRange.endDate
      );

      const workerTxs = advances
        .filter((t) => {
          if (periodPreset === 'all_time') return t.labourId === labour.id;
          return t.labourId === labour.id && t.date >= dateRange.startDate && t.date <= dateRange.endDate;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return {
        labour,
        summary,
        transactions: workerTxs,
      };
    });
  }, [activeLabourers, attendance, advances, dateRange, periodPreset]);

  const totals = useMemo(() => {
    return workerSummaries.reduce(
      (acc, ws) => ({
        totalMoneyAttendance: acc.totalMoneyAttendance + ws.summary.grossWages,
        totalAdvancesGiven: acc.totalAdvancesGiven + ws.summary.totalAdvances,
        totalRemainingMoney: acc.totalRemainingMoney + ws.summary.netPayable,
      }),
      { totalMoneyAttendance: 0, totalAdvancesGiven: 0, totalRemainingMoney: 0 }
    );
  }, [workerSummaries]);

  const filteredWorkerSummaries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return workerSummaries;
    return workerSummaries.filter(
      (ws) =>
        ws.labour.name.toLowerCase().includes(q) ||
        ws.labour.role.toLowerCase().includes(q)
    );
  }, [workerSummaries, searchQuery]);

  const filteredTransactions = useMemo(() => {
    return advances
      .filter((t) => {
        const labour = labourMap.get(t.labourId);
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          (labour?.name || '').toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q) ||
          (t.receiptNo || '').toLowerCase().includes(q);

        const matchesType = typeFilter === 'all' || t.type === typeFilter;
        const matchesDate =
          periodPreset === 'all_time' ||
          (t.date >= dateRange.startDate && t.date <= dateRange.endDate);

        return matchesSearch && matchesType && matchesDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [advances, searchQuery, typeFilter, dateRange, periodPreset, labourMap]);

  return (
    <div className="space-y-3.5 pb-4 select-none">
      {/* 1. Financial Summary Hero Card */}
      <div className="bg-gradient-to-br from-[#5C2D91] via-[#4D227E] to-[#381461] rounded-3xl p-4 text-white shadow-sm">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/15">
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-purple-200 block">
              Payments &amp; Advances &middot; {dateRange.label}
            </span>
            <div className="text-xl font-black text-white mt-0.5 flex items-center gap-2 font-mono tabular-nums">
              <Wallet className="w-5 h-5 text-purple-200 shrink-0" />
              <span className="truncate">
                {formatCurrency(totals.totalRemainingMoney, settings.currencySymbol)}
              </span>
            </div>
            <span className="text-[11px] text-purple-200/90">
              Remaining balance to pay
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onOpenAdvanceModal();
            }}
            className="min-h-[44px] px-3.5 py-2 bg-white text-[#5C2D91] hover:bg-purple-50 font-extrabold text-xs rounded-2xl flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.6]" />
            <span>Send Advance</span>
          </button>
        </div>

        {/* 3 Core Metrics: Total, Advance, Remaining */}
        <div className="grid grid-cols-3 gap-2 pt-3 text-center">
          <div className="bg-white/10 rounded-2xl p-2.5 border border-white/10">
            <span className="text-[11px] font-bold text-purple-200 block">Total</span>
            <span className="text-xs font-black font-mono tabular-nums text-white mt-0.5 block truncate">
              {formatCurrency(totals.totalMoneyAttendance, settings.currencySymbol)}
            </span>
          </div>

          <div className="bg-rose-500/20 rounded-2xl p-2.5 border border-rose-400/25">
            <span className="text-[11px] font-bold text-rose-200 block">Advance</span>
            <span className="text-xs font-black font-mono tabular-nums text-rose-200 mt-0.5 block truncate">
              -{formatCurrency(totals.totalAdvancesGiven, settings.currencySymbol)}
            </span>
          </div>

          <div className="bg-emerald-500/20 rounded-2xl p-2.5 border border-emerald-400/25">
            <span className="text-[11px] font-bold text-emerald-200 block">Remaining</span>
            <span className="text-xs font-black font-mono tabular-nums text-emerald-100 mt-0.5 block truncate">
              {formatCurrency(totals.totalRemainingMoney, settings.currencySymbol)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Android Horizontal Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {[
          { id: 'this_month', label: 'This Month' },
          { id: 'all_time', label: 'All Time' },
          { id: 'this_week', label: 'This Week' },
          { id: 'last_month', label: 'Last Month' },
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

      {/* 3. Segmented View Switcher */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-purple-100/70 rounded-2xl">
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setActiveSubTab('accounts');
          }}
          className={`min-h-[44px] flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'accounts'
              ? 'bg-white text-[#5C2D91] shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span className="truncate">Balances ({activeLabourers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setActiveSubTab('transactions');
          }}
          className={`min-h-[44px] flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'transactions'
              ? 'bg-white text-[#5C2D91] shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Receipt className="w-4 h-4 shrink-0" />
          <span className="truncate">Ledger ({advances.length})</span>
        </button>
      </div>

      {/* 4. Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={
            activeSubTab === 'accounts'
              ? 'Search labourer name or trade...'
              : 'Search transaction, labourer, receipt...'
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full min-h-[44px] pl-10 pr-10 py-2.5 bg-white rounded-2xl border border-purple-100 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]/25 font-medium"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-neutral-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* TAB A: Worker Balances */}
      {activeSubTab === 'accounts' && (
        <div className="space-y-3">
          {filteredWorkerSummaries.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-purple-100 text-neutral-500 text-xs">
              No labourers matching search query.
            </div>
          ) : (
            filteredWorkerSummaries.map(({ labour, summary, transactions }) => {
              const isExpanded = expandedWorkerId === labour.id;

              return (
                <div
                  key={labour.id}
                  className="bg-white rounded-3xl border border-purple-100 p-4 shadow-2xs space-y-3"
                >
                  {/* Worker Identity + Advance CTA */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <LabourAvatar
                        name={labour.name}
                        photoUrl={labour.photoUrl}
                        className="w-11 h-11 rounded-2xl"
                        fallbackClassName="bg-[#5C2D91] text-white font-black text-sm"
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-neutral-900 truncate">
                          {labour.name}
                        </h4>
                        <p className="text-xs text-neutral-500 truncate">
                          {labour.role} &middot;{' '}
                          <span className="font-mono text-neutral-700">
                            {settings.currencySymbol}
                            {labour.dailyWage}/day
                          </span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic();
                        onOpenAdvanceModal(labour.id);
                      }}
                      className="min-h-[40px] px-3 py-1.5 text-xs font-bold text-white bg-[#5C2D91] hover:bg-[#4E247D] rounded-xl flex items-center gap-1 active:scale-95 transition-transform cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Advance</span>
                    </button>
                  </div>

                  {/* Attendance Summary Strip */}
                  <div className="grid grid-cols-4 gap-1 py-2 px-1 bg-neutral-50 rounded-2xl text-center">
                    <div>
                      <span className="text-[11px] font-medium text-neutral-500 block">Present</span>
                      <span className="font-mono tabular-nums font-bold text-emerald-700 text-xs">
                        {summary.presentDays}d
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-neutral-500 block">Half</span>
                      <span className="font-mono tabular-nums font-bold text-amber-700 text-xs">
                        {summary.halfDays}d
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-neutral-500 block">OT</span>
                      <span className="font-mono tabular-nums font-bold text-[#5C2D91] text-xs">
                        {summary.totalOvertimeHours}h
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-neutral-500 block">Days</span>
                      <span className="font-mono tabular-nums font-bold text-neutral-800 text-xs">
                        {summary.effectiveDays}d
                      </span>
                    </div>
                  </div>

                  {/* 3 Financial Columns: Total, Advance, Remaining */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="p-2.5 bg-purple-50/50 rounded-2xl border border-purple-100">
                      <span className="text-[11px] font-bold text-neutral-600 block">
                        Total
                      </span>
                      <span className="font-mono tabular-nums font-black text-xs text-neutral-900 mt-0.5 block truncate">
                        {formatCurrency(summary.grossWages, settings.currencySymbol)}
                      </span>
                    </div>

                    <div className="p-2.5 bg-rose-50/70 rounded-2xl border border-rose-100">
                      <span className="text-[11px] font-bold text-rose-700 block">
                        Advance
                      </span>
                      <span className="font-mono tabular-nums font-black text-xs text-rose-600 mt-0.5 block truncate">
                        {summary.totalAdvances > 0
                          ? `-${formatCurrency(summary.totalAdvances, settings.currencySymbol)}`
                          : '-'}
                      </span>
                    </div>

                    <div
                      className={`p-2.5 rounded-2xl border ${
                        summary.netPayable >= 0
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-rose-50 border-rose-200'
                      }`}
                    >
                      <span
                        className={`text-[11px] font-bold block ${
                          summary.netPayable >= 0 ? 'text-emerald-800' : 'text-rose-800'
                        }`}
                      >
                        Remaining
                      </span>
                      <span
                        className={`font-mono tabular-nums font-black text-xs mt-0.5 block truncate ${
                          summary.netPayable >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {formatCurrency(summary.netPayable, settings.currencySymbol)}
                      </span>
                    </div>
                  </div>

                  {/* Collapsible Worker Ledger */}
                  <div className="border-t border-neutral-100 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic();
                        setExpandedWorkerId(isExpanded ? null : labour.id);
                      }}
                      className="w-full min-h-[40px] flex items-center justify-between text-xs font-bold text-[#5C2D91] px-1 rounded-xl hover:bg-purple-50 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Receipt className="w-4 h-4" />
                        <span>{transactions.length} Payment Records</span>
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 divide-y divide-neutral-100 border-t border-neutral-100">
                        {transactions.length === 0 ? (
                          <p className="text-xs text-neutral-400 py-3 text-center">
                            No transactions recorded for this period.
                          </p>
                        ) : (
                          transactions.map((tx) => (
                            <div
                              key={tx.id}
                              className="py-2.5 flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      tx.type === 'advance'
                                        ? 'bg-rose-100 text-rose-800'
                                        : tx.type === 'deduction'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-purple-100 text-purple-800'
                                    }`}
                                  >
                                    {tx.type}
                                  </span>
                                  <span className="font-mono text-neutral-500 text-[11px]">
                                    {tx.date}
                                  </span>
                                </div>
                                <span className="text-xs text-neutral-700 mt-0.5 block truncate">
                                  {tx.description || tx.paymentMode}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className={`font-mono tabular-nums font-bold text-xs ${
                                    tx.type === 'advance' ? 'text-rose-600' : 'text-emerald-600'
                                  }`}
                                >
                                  {tx.type === 'advance' ? '-' : '+'}
                                  {formatCurrency(tx.amount, settings.currencySymbol)}
                                </span>

                                {confirmDeleteId === tx.id ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onDeleteTransaction(tx.id);
                                      setConfirmDeleteId(null);
                                    }}
                                    className="px-2 py-1 text-[11px] font-bold bg-rose-600 text-white rounded-lg cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(tx.id)}
                                    aria-label="Delete transaction"
                                    className="w-9 h-9 flex items-center justify-center rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB B: Transactions Ledger */}
      {activeSubTab === 'transactions' && (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            {[
              { id: 'all', label: `All (${advances.length})` },
              { id: 'advance', label: 'Advances' },
              { id: 'deduction', label: 'Deductions' },
              { id: 'bonus', label: 'Bonuses' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id as typeof typeFilter)}
                className={`min-h-[38px] px-3.5 text-xs font-bold rounded-full whitespace-nowrap shrink-0 transition-all cursor-pointer border ${
                  typeFilter === tab.id
                    ? 'bg-[#5C2D91] text-white border-[#5C2D91]'
                    : 'bg-white text-neutral-700 border-purple-100 hover:bg-purple-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-purple-100 text-neutral-500 text-xs">
              No transactions found matching filter.
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-purple-100 divide-y divide-neutral-100 overflow-hidden shadow-2xs">
              {filteredTransactions.map((tx) => {
                const labour = labourMap.get(tx.labourId);
                return (
                  <div
                    key={tx.id}
                    className="p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                          tx.type === 'advance'
                            ? 'bg-rose-50 text-rose-600'
                            : tx.type === 'deduction'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-purple-50 text-purple-600'
                        }`}
                      >
                        {tx.type === 'advance' ? (
                          <TrendingDown className="w-5 h-5" />
                        ) : tx.type === 'deduction' ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : (
                          <Gift className="w-5 h-5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-neutral-900 truncate">
                            {labour?.name || 'Labourer'}
                          </h4>
                          <span className="text-[11px] text-neutral-400 font-mono shrink-0">
                            {tx.date}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                          {tx.description || tx.paymentMode} &middot; {tx.paymentMode}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span
                          className={`font-mono tabular-nums font-black text-xs block ${
                            tx.type === 'advance' ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {tx.type === 'advance' ? '-' : '+'}
                          {formatCurrency(tx.amount, settings.currencySymbol)}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                          {tx.type}
                        </span>
                      </div>

                      {confirmDeleteId === tx.id ? (
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic();
                            onDeleteTransaction(tx.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2.5 py-1.5 text-[11px] font-bold bg-rose-600 text-white rounded-xl cursor-pointer"
                        >
                          Confirm
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic();
                            setConfirmDeleteId(tx.id);
                          }}
                          className="w-10 h-10 rounded-xl bg-neutral-100 hover:bg-rose-50 hover:text-rose-600 text-neutral-500 flex items-center justify-center transition-colors cursor-pointer"
                          aria-label="Delete transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
