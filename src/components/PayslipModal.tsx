import React from 'react';
import { LabourWageSummary, AppSettings } from '../types';
import { X, Printer } from 'lucide-react';
import { LabourAvatar } from './LabourAvatar';

interface PayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: LabourWageSummary | null;
  settings: AppSettings;
  periodLabel: string;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({
  isOpen,
  onClose,
  summary,
  settings,
  periodLabel,
}) => {
  if (!isOpen || !summary) return null;

  const { labour } = summary;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md max-h-[90%] flex flex-col bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 pb-[max(8px,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar (Hidden on print) */}
        <div className="px-4 pt-2.5 pb-3 bg-[#5C2D91] text-white no-print shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/30 mx-auto mb-2.5 sm:hidden" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight">Worker Slip / रसिद</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                title="Print Slip"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close slip"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Printable Payslip Content */}
        <div className="p-4 overflow-y-auto overscroll-y-contain space-y-4 text-xs font-sans print:p-6 print:m-0 print:text-black">
          {/* Voucher Header */}
          <div className="text-center border-b pb-3 border-neutral-200">
            <h2 className="text-base font-black text-neutral-900 tracking-tight">
              {settings.companyName || 'CONSTRUCTION SITE PAYROLL'}
            </h2>
            <p className="text-[11px] text-neutral-600 mt-0.5">
              Worksite: <span className="font-semibold">{settings.worksiteName}</span>
            </p>
            <div className="mt-1.5 inline-block px-2.5 py-0.5 bg-purple-50 text-[#5C2D91] font-bold text-[10px] rounded-md border border-purple-200">
              Period: {periodLabel}
            </div>
          </div>

          {/* Worker Identity (NO TAG NUMBER) */}
          <div className="bg-purple-50/60 p-3 rounded-2xl border border-purple-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <LabourAvatar
                name={labour.name}
                photoUrl={labour.photoUrl}
                className="w-10 h-10 rounded-xl"
                fallbackClassName="bg-[#5C2D91] text-white font-black text-base"
              />
              <div>
                <h3 className="font-bold text-sm text-neutral-900 leading-tight">
                  {labour.name}
                </h3>
                <p className="text-[11px] text-neutral-600 font-medium">
                  {labour.role}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-neutral-500 block uppercase font-medium">Daily Rate</span>
              <span className="text-xs font-bold text-neutral-900 font-mono">
                {settings.currencySymbol}{labour.dailyWage.toLocaleString()}/day
              </span>
            </div>
          </div>

          {/* Attendance Breakdown Grid */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1.5">
              Attendance Summary
            </span>
            <div className="grid grid-cols-4 gap-1.5 text-center">
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[9px] uppercase font-bold text-emerald-800 block">Present</span>
                <span className="text-xs font-black text-emerald-700 font-mono">{summary.presentDays} d</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-[9px] uppercase font-bold text-amber-800 block">Half Day</span>
                <span className="text-xs font-black text-amber-700 font-mono">{summary.halfDays} d</span>
              </div>
              <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
                <span className="text-[9px] uppercase font-bold text-rose-800 block">Absent</span>
                <span className="text-xs font-black text-rose-700 font-mono">{summary.absentDays} d</span>
              </div>
              <div className="p-2 rounded-xl bg-purple-50 border border-purple-200">
                <span className="text-[9px] uppercase font-bold text-[#5C2D91] block">Overtime</span>
                <span className="text-xs font-black text-[#5C2D91] font-mono">{summary.totalOvertimeHours} hrs</span>
              </div>
            </div>
          </div>

          {/* Detailed Financial Calculation */}
          <div className="border border-neutral-200 rounded-2xl overflow-hidden divide-y divide-neutral-100">
            <div className="px-3 py-2 flex justify-between items-center bg-neutral-50 font-medium text-neutral-700">
              <span>Effective Worked Days ({summary.effectiveDays} days)</span>
              <span className="font-mono text-neutral-900 font-semibold">
                {settings.currencySymbol}{summary.baseWageEarned.toLocaleString()}
              </span>
            </div>

            {summary.overtimeWageEarned > 0 && (
              <div className="px-3 py-2 flex justify-between items-center text-neutral-700">
                <span>Overtime Pay ({summary.totalOvertimeHours} hrs)</span>
                <span className="font-mono text-emerald-700 font-semibold">
                  +{settings.currencySymbol}{summary.overtimeWageEarned.toLocaleString()}
                </span>
              </div>
            )}

            {summary.totalBonus > 0 && (
              <div className="px-3 py-2 flex justify-between items-center text-neutral-700">
                <span>Incentive / Bonus</span>
                <span className="font-mono text-emerald-700 font-semibold">
                  +{settings.currencySymbol}{summary.totalBonus.toLocaleString()}
                </span>
              </div>
            )}

            <div className="px-3 py-2 flex justify-between items-center bg-purple-50/50 font-bold text-neutral-900">
              <span>Gross Earnings</span>
              <span className="font-mono text-[#5C2D91]">
                {settings.currencySymbol}{summary.grossWages.toLocaleString()}
              </span>
            </div>

            {summary.totalAdvances > 0 && (
              <div className="px-3 py-2 flex justify-between items-center text-rose-700">
                <span>Less: Advances Taken</span>
                <span className="font-mono font-semibold">
                  -{settings.currencySymbol}{summary.totalAdvances.toLocaleString()}
                </span>
              </div>
            )}

            {summary.totalDeductions > 0 && (
              <div className="px-3 py-2 flex justify-between items-center text-rose-700">
                <span>Less: Other Deductions</span>
                <span className="font-mono font-semibold">
                  -{settings.currencySymbol}{summary.totalDeductions.toLocaleString()}
                </span>
              </div>
            )}

            {/* Total Net Payable Highlight */}
            <div className="p-3 bg-emerald-500 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-90 block">
                  Net Cash Payable / भुक्तानी रकम
                </span>
                <span className="text-lg font-black font-mono">
                  {settings.currencySymbol}{summary.netPayable.toLocaleString()}
                </span>
              </div>
              <span className="px-2 py-1 bg-white/20 rounded-md text-[10px] font-bold">
                {summary.netPayable >= 0 ? 'PAY TO WORKER' : 'RECOVERY DUE'}
              </span>
            </div>
          </div>

          {/* Acknowledgement and Signature Box */}
          <div className="pt-3 border-t border-dashed border-neutral-300 grid grid-cols-2 gap-4">
            <div className="p-2 border border-neutral-200 rounded-xl bg-neutral-50/50 flex flex-col justify-between h-20 text-center">
              <span className="text-[9px] uppercase font-bold text-neutral-500">Worker Thumb / Signature</span>
              <div className="border-b border-neutral-300 w-3/4 mx-auto mb-1"></div>
              <span className="text-[9px] text-neutral-400">{labour.name}</span>
            </div>

            <div className="p-2 border border-neutral-200 rounded-xl bg-neutral-50/50 flex flex-col justify-between h-20 text-center">
              <span className="text-[9px] uppercase font-bold text-neutral-500">Site Supervisor / Contractor</span>
              <div className="border-b border-neutral-300 w-3/4 mx-auto mb-1"></div>
              <span className="text-[9px] text-neutral-400">Date: {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls (Hidden on print) */}
        <div className="p-3 bg-neutral-50 border-t border-neutral-200 flex gap-2 no-print">
          <button
            onClick={handlePrint}
            className="flex-1 min-h-[44px] py-2.5 px-4 rounded-2xl bg-[#5C2D91] hover:bg-[#4E247D] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF Slip</span>
          </button>
          <button
            onClick={onClose}
            className="min-h-[44px] py-2.5 px-4 rounded-2xl bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
