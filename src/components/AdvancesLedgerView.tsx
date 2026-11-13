import React, { useState, useMemo } from 'react';
import { Labour, AdvanceTransaction, AppSettings } from '../types';
import { formatCurrency } from '../utils/calculations';
import { LabourAvatar } from './LabourAvatar';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Trash2, 
  ArrowDownLeft, 
  Gift,
  X,
  Receipt,
  MinusCircle
} from 'lucide-react';

interface AdvancesLedgerViewProps {
  advances: AdvanceTransaction[];
  labourers: Labour[];
  onOpenAdvanceModal: (labourId?: string) => void;
  onDeleteTransaction: (id: string) => void;
  settings: AppSettings;
}

export const AdvancesLedgerView: React.FC<AdvancesLedgerViewProps> = ({
  advances,
  labourers,
  onOpenAdvanceModal,
  onDeleteTransaction,
  settings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabourId, setSelectedLabourId] = useState('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const labourMap = useMemo(() => {
    const map = new Map<string, Labour>();
    labourers.forEach((l) => map.set(l.id, l));
    return map;
  }, [labourers]);

  const filteredTransactions = useMemo(() => {
    return advances
      .filter((t) => {
        const labour = labourMap.get(t.labourId);
        const matchesSearch =
          (labour?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.receiptNo || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLabour = selectedLabourId === 'all' || t.labourId === selectedLabourId;
        const matchesType = selectedType === 'all' || t.type === selectedType;
        return matchesSearch && matchesLabour && matchesType;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [advances, searchQuery, selectedLabourId, selectedType, labourMap]);

  const totals = useMemo(() => {
    let advancesSum = 0;
    let deductionsSum = 0;
    let bonusSum = 0;

    advances.forEach((t) => {
      if (t.type === 'advance') advancesSum += t.amount;
      else if (t.type === 'deduction') deductionsSum += t.amount;
      else if (t.type === 'bonus') bonusSum += t.amount;
    });

    return {
      advancesSum,
      deductionsSum,
      bonusSum,
      netDeductions: advancesSum + deductionsSum - bonusSum,
    };
  }, [advances]);

  return (
    <div className="space-y-3.5 pb-20 select-none">
      {/* 1. Hero Summary Banner */}
      <div className="bg-gradient-to-br from-[#5C2D91] via-[#4D227E] to-[#381461] rounded-3xl p-4 text-white shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-200 block">
              Advances &amp; Loans Ledger
            </span>
            <div className="text-xl font-black text-white mt-0.5 flex items-center gap-2">
              <span>{advances.length} Transactions</span>
            </div>
          </div>

          <button
            onClick={() => onOpenAdvanceModal()}
            className="min-h-[40px] px-3.5 py-2 bg-white text-[#5C2D91] hover:bg-purple-50 font-extrabold text-xs rounded-2xl flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Send Advance</span>
          </button>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-2 pt-3 text-center">
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-2.5">
            <span className="text-[9px] font-bold text-rose-200 uppercase block">Total Advances</span>
            <span className="text-sm font-black font-mono text-rose-300 mt-0.5 block truncate">
              -{formatCurrency(totals.advancesSum, settings.currencySymbol)}
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-2.5">
            <span className="text-[9px] font-bold text-emerald-200 uppercase block">Bonuses Paid</span>
            <span className="text-sm font-black font-mono text-emerald-300 mt-0.5 block truncate">
              +{formatCurrency(totals.bonusSum, settings.currencySymbol)}
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-2.5">
            <span className="text-[9px] font-bold text-purple-200 uppercase block">Other Deductions</span>
            <span className="text-sm font-black font-mono text-white mt-0.5 block truncate">
              {formatCurrency(totals.deductionsSum, settings.currencySymbol)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by worker name, note or receipt #..."
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

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-purple-50/70 rounded-2xl border border-purple-100 flex-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: `All (${advances.length})` },
              { id: 'advance', label: 'Advances' },
              { id: 'bonus', label: 'Bonuses' },
              { id: 'deduction', label: 'Deductions' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`flex-1 min-h-[30px] px-2 text-[11px] font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  selectedType === tab.id
                    ? 'bg-white text-[#5C2D91] shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            value={selectedLabourId}
            onChange={(e) => setSelectedLabourId(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-purple-100 rounded-2xl text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#5C2D91] cursor-pointer shadow-2xs font-medium shrink-0 max-w-[130px]"
          >
            <option value="all">All Workers</option>
            {labourers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Mobile Transaction Cards List */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-purple-100 p-6 space-y-3">
          <CreditCard className="w-10 h-10 text-neutral-300 mx-auto" />
          <h3 className="text-sm font-bold text-neutral-900">
            No transactions found
          </h3>
          <p className="text-xs text-neutral-500">
            Record a mid-month loan or advance payment.
          </p>
          <button
            onClick={() => onOpenAdvanceModal()}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#5C2D91] hover:bg-[#4E247D] rounded-2xl transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Advance</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((tx) => {
            const labour = labourMap.get(tx.labourId);

            return (
              <div
                key={tx.id}
                className="bg-white rounded-3xl border border-purple-100 p-4 shadow-sm hover:border-purple-300 transition-all space-y-2.5"
              >
                {/* Top Row: Worker Avatar + Name + Amount */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <LabourAvatar name={labour?.name} photoUrl={labour?.photoUrl} className="w-10 h-10 rounded-2xl" />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-neutral-900 leading-snug truncate">
                        {labour?.name || 'Worker'}
                      </h4>
                      <p className="text-[11px] text-neutral-500 font-medium truncate">
                        {labour?.role || 'General Labour'}
                      </p>
                    </div>
                  </div>

                  {/* Highlighted Amount */}
                  <div className="text-right shrink-0">
                    <span
                      className={`font-mono font-black text-base tabular-nums block ${
                        tx.type === 'bonus'
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {tx.type === 'bonus' ? '+' : '-'}
                      {formatCurrency(tx.amount, settings.currencySymbol)}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400 block">
                      {tx.date}
                    </span>
                  </div>
                </div>

                {/* Purpose / Description */}
                <div className="bg-purple-50/50 p-2.5 rounded-2xl border border-purple-100/70 text-xs">
                  <p className="text-neutral-800 font-medium leading-relaxed">
                    {tx.description || 'Advance payment recorded'}
                  </p>
                </div>

                {/* Footer Metadata: Type Badge, Payment Mode, Receipt, Delete Action */}
                <div className="flex items-center justify-between pt-1 border-t border-purple-50 text-[11px]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {tx.type === 'advance' ? (
                      <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold text-[10px] flex items-center gap-0.5 border border-rose-200">
                        <ArrowDownLeft className="w-3 h-3" />
                        <span>Advance</span>
                      </span>
                    ) : tx.type === 'bonus' ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] flex items-center gap-0.5 border border-emerald-200">
                        <Gift className="w-3 h-3" />
                        <span>Bonus</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 font-bold text-[10px] flex items-center gap-0.5 border border-neutral-200">
                        <MinusCircle className="w-3 h-3" />
                        <span>Deduction</span>
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-[#5C2D91] font-semibold text-[10px]">
                      {tx.paymentMode}
                    </span>

                    {tx.receiptNo && (
                      <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-0.5">
                        <Receipt className="w-3 h-3 inline opacity-60" />
                        <span>{tx.receiptNo}</span>
                      </span>
                    )}
                  </div>

                  {confirmDeleteId === tx.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="min-h-[34px] px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 font-bold text-[11px] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteTransaction(tx.id);
                          setConfirmDeleteId(null);
                        }}
                        className="min-h-[34px] px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px] cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(tx.id)}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
