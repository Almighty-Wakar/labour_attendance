import React, { useState, useEffect } from 'react';
import { Labour, AdvanceTransaction, AppSettings, TransactionType } from '../types';
import { 
  X, 
  CreditCard, 
  AlertCircle, 
  ArrowDownLeft, 
  Gift, 
  MinusCircle, 
  Check, 
  Wallet,
  Calendar as CalendarIcon
} from 'lucide-react';

interface AdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: AdvanceTransaction) => void;
  labourers: Labour[];
  preselectedLabourId?: string;
  settings: AppSettings;
}

export const AdvanceModal: React.FC<AdvanceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  labourers,
  preselectedLabourId,
  settings,
}) => {
  const [labourId, setLabourId] = useState(labourers[0]?.id || '');
  const [amount, setAmount] = useState<number>(500);
  const [type, setType] = useState<TransactionType>('advance');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Bank Transfer' | 'UPI / Mobile Pay' | 'Cheque'>('Cash');
  const [description, setDescription] = useState('');
  const [receiptNo, setReceiptNo] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (preselectedLabourId) {
      setLabourId(preselectedLabourId);
    } else if (labourers.length > 0 && !labourId) {
      setLabourId(labourers[0].id);
    }
    setDate(new Date().toISOString().split('T')[0]);
    setReceiptNo(`REC-${Date.now().toString().slice(-4)}`);
  }, [preselectedLabourId, isOpen, labourers]);

  if (!isOpen) return null;

  const quickAddAmount = (add: number) => {
    setAmount((prev) => Math.max(0, prev + add));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!labourId) {
      setError('Please select a labourer');
      return;
    }
    if (amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    const selectedLabour = labourers.find((l) => l.id === labourId);

    const tx: AdvanceTransaction = {
      id: `adv_${Date.now()}`,
      labourId,
      amount: Number(amount),
      date,
      type,
      paymentMode,
      description: description.trim() || `${type.toUpperCase()} recorded for ${date}`,
      receiptNo: receiptNo.trim(),
      worksiteId: selectedLabour?.worksiteId || settings.activeWorksiteId,
    };

    onSave(tx);
    onClose();
  };

  const selectedLabour = labourers.find((l) => l.id === labourId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-3xl border border-purple-100 shadow-2xl overflow-hidden flex flex-col max-h-[90%] pb-[max(8px,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Android Drag Handle */}
        <div className="px-5 pt-3 pb-4 bg-gradient-to-r from-[#5C2D91] via-[#4D227E] to-[#381461] text-white shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/30 mx-auto mb-3 sm:hidden" />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-extrabold text-white leading-tight truncate">
                  Record Advance or Loan
                </h2>
                <p className="text-[11px] text-purple-200 mt-0.5 truncate">
                  Automatically deducted from worker wage payout
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl hover:bg-white/15 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form noValidate onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto overscroll-y-contain space-y-3.5 text-xs font-sans">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 rounded-2xl border border-rose-200 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Select Labourer */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-1">
              Select Worker *
            </label>
            <select
              value={labourId}
              onChange={(e) => setLabourId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-[#5C2D91] rounded-2xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]/20 cursor-pointer"
            >
              {labourers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.role}) &middot; {settings.currencySymbol}{l.dailyWage}/day
                </option>
              ))}
            </select>
          </div>

          {/* Transaction Type Segmented Toggle */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-1.5">
              Transaction Type *
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-purple-50/80 rounded-2xl border border-purple-100">
              <button
                type="button"
                onClick={() => setType('advance')}
                className={`min-h-[38px] flex items-center justify-center gap-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  type === 'advance'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-neutral-700 hover:bg-white/60'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Advance (-)</span>
              </button>

              <button
                type="button"
                onClick={() => setType('bonus')}
                className={`min-h-[38px] flex items-center justify-center gap-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  type === 'bonus'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-neutral-700 hover:bg-white/60'
                }`}
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Bonus (+)</span>
              </button>

              <button
                type="button"
                onClick={() => setType('deduction')}
                className={`min-h-[38px] flex items-center justify-center gap-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  type === 'deduction'
                    ? 'bg-neutral-800 text-white shadow-xs'
                    : 'text-neutral-700 hover:bg-white/60'
                }`}
              >
                <MinusCircle className="w-3.5 h-3.5" />
                <span>Deduct (-)</span>
              </button>
            </div>
          </div>

          {/* Amount Box with Quick Increments */}
          <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-800">
                Amount ({settings.currencySymbol}) *
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => quickAddAmount(500)}
                  className="px-2 py-0.5 text-[10px] font-bold bg-white text-[#5C2D91] rounded-lg border border-purple-200 hover:bg-purple-100 cursor-pointer shadow-2xs"
                >
                  +500
                </button>
                <button
                  type="button"
                  onClick={() => quickAddAmount(1000)}
                  className="px-2 py-0.5 text-[10px] font-bold bg-white text-[#5C2D91] rounded-lg border border-purple-200 hover:bg-purple-100 cursor-pointer shadow-2xs"
                >
                  +1,000
                </button>
                <button
                  type="button"
                  onClick={() => quickAddAmount(2000)}
                  className="px-2 py-0.5 text-[10px] font-bold bg-white text-[#5C2D91] rounded-lg border border-purple-200 hover:bg-purple-100 cursor-pointer shadow-2xs"
                >
                  +2,000
                </button>
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5C2D91] font-black font-mono">
                {settings.currencySymbol}
              </span>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-8 pr-3 py-2.5 text-base font-black bg-white border border-purple-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91] tabular-nums font-mono shadow-2xs"
              />
            </div>
          </div>

          {/* Date & Payment Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Payment Date *
              </label>
              <div className="relative">
                <CalendarIcon className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-[#5C2D91] rounded-2xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Payment Channel
              </label>
              <div className="relative">
                <Wallet className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-[#5C2D91] rounded-2xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]/20 cursor-pointer"
                >
                  <option value="Cash">Cash Handout</option>
                  <option value="UPI / Mobile Pay">eSewa / Mobile Wallet</option>
                  <option value="Bank Transfer">Bank Transfer / ConnectIPS</option>
                  <option value="Cheque">Bank Cheque</option>
                </select>
              </div>
            </div>
          </div>

          {/* Description & Receipt No */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Receipt / Voucher #
              </label>
              <input
                type="text"
                placeholder="REC-101"
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-[#5C2D91] rounded-2xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Purpose / Memo
              </label>
              <input
                type="text"
                placeholder="e.g. Family emergency, tool purchase"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-[#5C2D91] rounded-2xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]/20"
              />
            </div>
          </div>

          {selectedLabour && (
            <div className="p-2.5 bg-purple-50/70 rounded-2xl border border-purple-100 flex items-center justify-between text-xs">
              <span className="text-neutral-600">Selected: <b className="text-neutral-900">{selectedLabour.name}</b></span>
              <span className="font-mono text-[#5C2D91] font-bold">{settings.currencySymbol}{selectedLabour.dailyWage}/day</span>
            </div>
          )}

          {/* Footer Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-purple-100">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 rounded-2xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-6 py-2.5 text-xs font-extrabold text-white bg-[#5C2D91] hover:bg-[#4E247D] rounded-2xl transition-all shadow-md active:scale-98 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Record Transaction</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
