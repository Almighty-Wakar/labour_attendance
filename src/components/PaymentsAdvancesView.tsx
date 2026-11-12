import React, { useState, useMemo } from 'react';
import { Labour, AdvanceTransaction, AttendanceRecord, AppSettings } from '../types';
import { formatCurrency, calculateLabourWage, getDateRanges } from '../utils/calculations';
import { triggerHaptic } from '../utils/haptics';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Trash2, 
  ArrowDownLeft, 
  Gift, 
  X, 
  Users, 
  Receipt, 
  Wallet, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  TrendingDown,
  Banknote,
  Coins
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
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>('all');
  const [expandedWorkerId, setExpandedWorkerId] = useState<string | null>(null);

  // Compute active date range
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

  // Comprehensive Worker-by-Worker Calculations:
  // 1. Total money based on attendance records
  // 2. Advance money given to him
  // 3. Remaining money (Net payable / balance)
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

  // Overall Financial Totals
  const totals = useMemo(() => {
    return workerSummaries.reduce(
      (acc, ws) => ({
        totalMoneyAttendance: acc.totalMoneyAttendance + ws.summary.grossWages,
        totalAdvancesGiven: acc.totalAdvancesGiven + ws.summary.totalAdvances,
        totalRemainingMoney: acc.totalRemainingMoney + ws.summary.netPayable,
        totalOvertimeHours: acc.totalOvertimeHours + ws.summary.totalOvertimeHours,
      }),
      { totalMoneyAttendance: 0, totalAdvancesGiven: 0, totalRemainingMoney: 0, totalOvertimeHours: 0 }
    );
  }, [workerSummaries]);

  // Filtered workers based on search
  const filteredWorkerSummaries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return workerSummaries;
    return workerSummaries.filter((ws) => {
      return (
        ws.labour.name.toLowerCase().includes(q) ||
        ws.labour.role.toLowerCase().includes(q)
      );
    });
  }, [workerSummaries, searchQuery]);

  // Filtered transactions for the ledger
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
        const matchesMode = paymentModeFilter === 'all' || t.paymentMode === paymentModeFilter;
        const matchesDate = periodPreset === 'all_time' || (t.date >= dateRange.startDate && t.date <= dateRange.endDate);

        return matchesSearch && matchesType && matchesMode && matchesDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [advances, searchQuery, typeFilter, paymentModeFilter, dateRange, periodPreset, labourMap]);

  return (
    <div className="space-y-3.5 pb-24 select-none">
      {/* 1. Advance Financial Hero Banner */}
      <div className="bg-gradient-to-br from-[#5C2D91] via-[#4D227E] to-[#381461] rounded-3xl p-4 text-white shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-200 block">
                Payments &amp; Advance Hub
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <div className="text-xl font-black text-white mt-0.5 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-purple-200" />
              <span>{formatCurrency(totals.totalRemainingMoney, settings.currencySymbol)}</span>
            </div>
            <span className="text-[11px] text-purple-200/90 font-medium">
              Total Remaining Money to Pay &middot; {dateRange.label}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onOpenAdvanceModal();
            }}
            className="min-h-[42px] px-3.5 py-2 bg-white text-[#5C2D91] hover:bg-purple-50 font-extrabold text-xs rounded-2xl flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Send Advance</span>
          </button>
        </div>

        {/* 3 Core Financial Sub-Metrics */}
        <div className="grid grid-cols-3 gap-2 pt-3 text-center">
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-2 border border-white/15">
            <span className="text-[9px] font-bold text-purple-200 uppercase block truncate">Total</span>
            <span className="text-xs font-black font-mono text-white mt-0.5 block truncate">
              {formatCurrency(totals.totalMoneyAttendance, settings.currencySymbol)}
            </span>
          </div>

          <div className="bg-rose-500/20 backdrop-blur-xs rounded-2xl p-2 border border-rose-400/30">
            <span className="text-[9px] font-bold text-rose-200 uppercase block truncate">Advance</span>
            <span className="text-xs font-black font-mono text-rose-300 mt-0.5 block truncate">
              -{formatCurrency(totals.totalAdvancesGiven, settings.currencySymbol)}
            </span>
          </div>

          <div className="bg-emerald-500/20 backdrop-blur-xs rounded-2xl p-2 border border-emerald-400/30">
            <span className="text-[9px] font-bold text-emerald-300 uppercase block truncate">Remaining</span>
            <span className="text-xs font-black font-mono text-emerald-200 mt-0.5 block truncate">
              {formatCurrency(totals.totalRemainingMoney, settings.currencySymbol)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Period Navigation Filter Card */}
      <div className="bg-white rounded-3xl p-3 shadow-xs border border-purple-100/90 space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-neutral-800">
            Calculation Period
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">
            {periodPreset === 'all_time' ? 'All records' : `${dateRange.startDate} to ${dateRange.endDate}`}
          </span>
        </div>

        {/* 4 Segmented Period Selector Tabs */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-purple-50/70 rounded-2xl border border-purple-100">
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
                setPeriodPreset(tab.id as any);
              }}
              className={`min-h-[34px] text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                periodPreset === tab.id
                  ? 'bg-[#5C2D91] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Sub-Tab Switcher: Worker Accounts vs Transactions Ledger */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-200/80 rounded-2xl">
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setActiveSubTab('accounts');
          }}
          className={`min-h-[40px] flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'accounts'
              ? 'bg-white text-[#5C2D91] shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Worker Balances ({activeLabourers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setActiveSubTab('transactions');
          }}
          className={`min-h-[40px] flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'transactions'
              ? 'bg-white text-[#5C2D91] shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Ledger History ({advances.length})</span>
        </button>
      </div>

      {/* 4. Search Bar */}
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

      {/* TAB A: Worker Advance Accounts (Showing Total Money from Attendance, Advance Given, and Remaining Money) */}
      {activeSubTab === 'accounts' && (
        <div className="space-y-3">
          {filteredWorkerSummaries.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-purple-100 text-neutral-400 text-xs">
              No labourers matching search query.
            </div>
          ) : (
            filteredWorkerSummaries.map(({ labour, summary, transactions }) => {
              const isExpanded = expandedWorkerId === labour.id;
              const hasDue = summary.netPayable < 0;

              return (
                <div
                  key={labour.id}
                  className="bg-white rounded-3xl border border-purple-100 p-4 shadow-sm transition-all space-y-3"
                >
                  {/* Worker Identity Header (Strictly NO tag numbers) */}
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

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic();
                        onOpenAdvanceModal(labour.id);
                      }}
                      className="min-h-[36px] px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#5C2D91] to-[#7B3FB7] hover:brightness-110 rounded-xl shadow-2xs transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>+ Advance</span>
                    </button>
                  </div>

                  {/* Attendance Records Summary Strip */}
                  <div className="grid grid-cols-4 gap-1 p-2 bg-neutral-50 rounded-2xl text-center text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-emerald-800 uppercase block">Present</span>
                      <span className="font-mono font-bold text-emerald-700 text-xs">{summary.presentDays}d</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-amber-800 uppercase block">Half Day</span>
                      <span className="font-mono font-bold text-amber-700 text-xs">{summary.halfDays}d</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-purple-800 uppercase block">Overtime</span>
                      <span className="font-mono font-bold text-[#5C2D91] text-xs">{summary.totalOvertimeHours}h</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-neutral-600 uppercase block">Work Days</span>
                      <span className="font-mono font-bold text-neutral-800 text-xs">{summary.effectiveDays}d</span>
                    </div>
                  </div>

                  {/* The 3 Core Financial Blocks (Total, Advance, Remaining) */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 bg-purple-50/50 rounded-2xl border border-purple-100">
                    {/* 1. Total based on Attendance Records */}
                    <div className="p-2 bg-white rounded-xl border border-purple-100 shadow-2xs">
                      <span className="text-[9px] font-bold text-neutral-500 uppercase block leading-tight">
                        Total
                      </span>
                      <span className="font-mono font-black text-xs text-neutral-900 mt-1 block truncate">
                        {formatCurrency(summary.grossWages, settings.currencySymbol)}
                      </span>
                      <span className="text-[8px] text-neutral-400 mt-0.5 block truncate">
                        Earned wages
                      </span>
                    </div>

                    {/* 2. Advance */}
                    <div className="p-2 bg-white rounded-xl border border-rose-100 shadow-2xs">
                      <span className="text-[9px] font-bold text-rose-500 uppercase block leading-tight">
                        Advance
                      </span>
                      <span className="font-mono font-black text-xs text-rose-600 mt-1 block truncate">
                        {summary.totalAdvances > 0 ? `-${formatCurrency(summary.totalAdvances, settings.currencySymbol)}` : '-'}
                      </span>
                      <span className="text-[8px] text-neutral-400 mt-0.5 block truncate">
                        Advance money
                      </span>
                    </div>

                    {/* 3. Remaining */}
                    <div className={`p-2 rounded-xl shadow-2xs ${
                      summary.netPayable >= 0
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'bg-rose-50 border border-rose-200'
                    }`}>
                      <span className={`text-[9px] font-bold uppercase block leading-tight ${
                        summary.netPayable >= 0 ? 'text-emerald-800' : 'text-rose-800'
                      }`}>
                        Remaining
                      </span>
                      <span className={`font-mono font-black text-xs mt-1 block truncate ${
                        summary.netPayable >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {formatCurrency(summary.netPayable, settings.currencySymbol)}
                      </span>
                      <span className={`text-[8px] font-bold mt-0.5 block truncate ${
                        summary.netPayable >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {summary.netPayable >= 0 ? 'To Pay' : 'Advance Due'}
                      </span>
                    </div>
                  </div>

                  {/* Transaction History Drawer for this Worker */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic();
                        setExpandedWorkerId(isExpanded ? null : labour.id);
                      }}
                      className="w-full flex items-center justify-between text-xs font-bold text-[#5C2D91] hover:text-[#4A1E7A] p-1.5 rounded-xl hover:bg-purple-50 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5" />
                        <span>{transactions.length} Advance &amp; Payment Records</span>
                      </span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 p-3 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-2 animate-in fade-in duration-150">
                        {transactions.length === 0 ? (
                          <p className="text-[11px] text-neutral-400 py-1 text-center">No transactions recorded for this period.</p>
                        ) : (
                          transactions.map((tx) => (
                            <div
                              key={tx.id}
                              className="bg-white p-2.5 rounded-xl border border-purple-100 flex items-center justify-between text-xs"
                            >
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                    tx.type === 'advance'
                                      ? 'bg-rose-100 text-rose-800'
                                      : tx.type === 'deduction'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-purple-100 text-purple-800'
                                  }`}>
                                    {tx.type}
                                  </span>
                                  <span className="font-mono text-neutral-500 text-[10px]">{tx.date}</span>
                                </div>
                                <span className="text-[11px] text-neutral-700 font-medium mt-0.5 block truncate max-w-[180px]">
                                  {tx.description || tx.paymentMode}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className={`font-mono font-bold text-xs ${
                                  tx.type === 'advance' ? 'text-rose-600' : 'text-emerald-600'
                                }`}>
                                  {tx.type === 'advance' ? '-' : '+'}
                                  {formatCurrency(tx.amount, settings.currencySymbol)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onDeleteTransaction(tx.id)}
                                  className="text-neutral-400 hover:text-rose-600 p-1 cursor-pointer"
                                  title="Delete transaction"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
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

      {/* TAB B: Complete Transactions Ledger */}
      {activeSubTab === 'transactions' && (
        <div className="space-y-3">
          {/* Quick Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all', label: `All (${advances.length})` },
              { id: 'advance', label: 'Advances' },
              { id: 'deduction', label: 'Deductions' },
              { id: 'bonus', label: 'Bonuses' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id as any)}
                className={`min-h-[32px] px-3 text-[11px] font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  typeFilter === tab.id
                    ? 'bg-[#5C2D91] text-white shadow-2xs'
                    : 'bg-white text-neutral-600 border border-purple-100/80 hover:bg-purple-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Transactions List */}
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-purple-100 text-neutral-400 text-xs">
              No transactions found matching filter.
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const labour = labourMap.get(tx.labourId);
              return (
                <div
                  key={tx.id}
                  className="bg-white rounded-2xl border border-purple-100 p-3.5 shadow-2xs flex items-center justify-between gap-3 hover:border-purple-200 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      tx.type === 'advance'
                        ? 'bg-rose-50 text-rose-600 border border-rose-200/80'
                        : tx.type === 'deduction'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/80'
                        : 'bg-purple-50 text-purple-600 border border-purple-200/80'
                    }`}>
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
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {tx.date}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 font-medium truncate mt-0.5">
                        {tx.description || tx.paymentMode} &middot; <span className="text-neutral-400 font-mono">{tx.paymentMode}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      <span className={`font-mono font-black text-sm block ${
                        tx.type === 'advance' ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {tx.type === 'advance' ? '-' : '+'}
                        {formatCurrency(tx.amount, settings.currencySymbol)}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-neutral-400 block">
                        {tx.type}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic();
                        onDeleteTransaction(tx.id);
                      }}
                      className="w-8 h-8 rounded-xl bg-neutral-100 hover:bg-rose-50 hover:text-rose-600 text-neutral-400 flex items-center justify-center transition-colors cursor-pointer"
                      title="Delete transaction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
