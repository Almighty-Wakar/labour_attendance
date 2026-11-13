import React from 'react';
import {
  Labour,
  AttendanceRecord,
  AdvanceTransaction,
  AppSettings,
  ActiveTab,
} from '../types';
import { triggerHaptic } from '../utils/haptics';
import { LabourAvatar } from './LabourAvatar';
import {
  UserPlus,
  CreditCard,
  ChevronRight,
  Users,
  Receipt,
  Banknote,
  CheckCheck,
  Building2,
} from 'lucide-react';

interface HomeDashboardViewProps {
  labourers: Labour[];
  attendance: AttendanceRecord[];
  advances: AdvanceTransaction[];
  settings: AppSettings;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddLabour: () => void;
  onOpenAdvanceModal: (labourId?: string) => void;
  onOpenSettings: () => void;
  onOpenWorksiteSwitcher?: () => void;
  onQuickMarkAll: (status: 'present' | 'absent') => void;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  labourers,
  attendance,
  advances,
  settings,
  setActiveTab,
  onOpenAddLabour,
  onOpenAdvanceModal,
  onOpenWorksiteSwitcher,
  onQuickMarkAll,
}) => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const activeLabourers = labourers.filter((l) => l.status === 'active');

  const todayRecords = attendance.filter((r) => r.date === todayStr);
  const presentCount = todayRecords.filter((r) => r.status === 'present').length;
  const halfDayCount = todayRecords.filter((r) => r.status === 'half_day').length;
  const absentCount = todayRecords.filter((r) => r.status === 'absent').length;
  const markedIds = new Set(todayRecords.map((r) => r.labourId));
  const unmarkedCount = activeLabourers.filter((l) => !markedIds.has(l.id)).length;

  const coreServices = [
    {
      id: 'payments',
      label: 'Payments',
      icon: CreditCard,
      onClick: () => {
        triggerHaptic();
        setActiveTab('attendance');
      },
    },
    {
      id: 'payroll',
      label: 'Wages & Pay',
      icon: Banknote,
      onClick: () => {
        triggerHaptic();
        setActiveTab('payroll');
      },
    },
    {
      id: 'add_worker',
      label: 'Add Worker',
      icon: UserPlus,
      onClick: () => {
        triggerHaptic();
        onOpenAddLabour();
      },
    },
    {
      id: 'send_advance',
      label: 'Send Advance',
      icon: CreditCard,
      onClick: () => {
        triggerHaptic();
        onOpenAdvanceModal();
      },
    },
    {
      id: 'advances_ledger',
      label: 'Loans Ledger',
      icon: Receipt,
      onClick: () => {
        triggerHaptic();
        setActiveTab('advances');
      },
    },
    {
      id: 'roster',
      label: 'Labourers',
      icon: Users,
      onClick: () => {
        triggerHaptic();
        setActiveTab('labourers');
      },
    },
  ];

  const activeWorksiteLabel =
    settings.activeWorksiteId === 'all' ? 'All Worksites' : settings.worksiteName;

  return (
    <div className="space-y-3.5 pb-4 select-none">
      {/* 1. Active Worksite Quick Context Strip */}
      {onOpenWorksiteSwitcher && (
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            onOpenWorksiteSwitcher();
          }}
          className="w-full bg-white rounded-2xl px-3.5 py-2.5 border border-purple-100 shadow-2xs flex items-center justify-between gap-2 text-left active:scale-[0.99] transition-transform cursor-pointer min-h-[48px]"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-purple-50 text-[#5C2D91] flex items-center justify-center shrink-0">
              <Building2 className="w-4.5 h-4.5" />
            </span>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-neutral-500 block leading-tight">
                Active Worksite
              </span>
              <span className="text-xs font-bold text-neutral-900 truncate block">
                {activeWorksiteLabel}
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-[#5C2D91] flex items-center gap-0.5 shrink-0">
            <span>Switch</span>
            <ChevronRight className="w-4 h-4" />
          </span>
        </button>
      )}

      {/* 2. Quick Operations Grid (3x2 Material You Tiles) */}
      <section className="bg-white rounded-3xl p-4 shadow-xs border border-purple-100/80">
        <h2 className="text-sm font-extrabold text-neutral-900 tracking-tight mb-3">
          Labour Operations
        </h2>

        <div className="grid grid-cols-3 gap-y-3 gap-x-2">
          {coreServices.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className="flex flex-col items-center text-center group focus:outline-none py-2 px-1 rounded-2xl transition-all hover:bg-purple-50/70 active:scale-95 cursor-pointer min-h-[76px]"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#5C2D91] group-hover:bg-[#5C2D91] group-hover:text-white transition-colors">
                  <Icon className="w-5.5 h-5.5 stroke-[2]" />
                </div>

                <span className="text-xs font-semibold text-neutral-800 mt-2 leading-tight group-hover:text-[#5C2D91] truncate max-w-full">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Today's Attendance Snapshot & 1-Tap Roll Call */}
      <section className="bg-white rounded-3xl p-4 shadow-xs border border-purple-100/80 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 block">
              Today&apos;s Attendance
            </span>
            <h3 className="text-sm font-extrabold text-neutral-900 mt-0.5">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveTab('mark-today');
            }}
            className="min-h-[40px] px-2.5 flex items-center gap-1 text-xs font-bold text-[#5C2D91] rounded-xl hover:bg-purple-50 transition-colors cursor-pointer"
          >
            <span>Open Roll</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Status Counters */}
        <div className="grid grid-cols-4 gap-2">
          <div className="py-2.5 px-1.5 rounded-2xl bg-emerald-50 text-center">
            <span className="text-[11px] font-bold text-emerald-800 block">Present</span>
            <span className="text-lg font-black text-emerald-700 font-mono tabular-nums">
              {presentCount}
            </span>
          </div>

          <div className="py-2.5 px-1.5 rounded-2xl bg-amber-50 text-center">
            <span className="text-[11px] font-bold text-amber-800 block">Half</span>
            <span className="text-lg font-black text-amber-700 font-mono tabular-nums">
              {halfDayCount}
            </span>
          </div>

          <div className="py-2.5 px-1.5 rounded-2xl bg-rose-50 text-center">
            <span className="text-[11px] font-bold text-rose-800 block">Absent</span>
            <span className="text-lg font-black text-rose-700 font-mono tabular-nums">
              {absentCount}
            </span>
          </div>

          <div className="py-2.5 px-1.5 rounded-2xl bg-neutral-100 text-center">
            <span className="text-[11px] font-bold text-neutral-600 block">Pending</span>
            <span className="text-lg font-black text-neutral-800 font-mono tabular-nums">
              {unmarkedCount}
            </span>
          </div>
        </div>

        {/* Android Thumb-Zone Action Buttons (>= 48px height) */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onQuickMarkAll('present');
            }}
            className="min-h-[48px] py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-transform active:scale-[0.98] cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 shrink-0" />
            <span>Mark All Present</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onQuickMarkAll('absent');
            }}
            className="min-h-[48px] py-2.5 px-3 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs transition-colors border border-neutral-200 active:scale-[0.98] cursor-pointer"
          >
            Mark All Absent
          </button>
        </div>
      </section>

      {/* 4. Featured Wages & Payslips Card */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic();
          setActiveTab('payroll');
        }}
        className="w-full bg-gradient-to-r from-[#4A2079] to-[#6834A2] text-white p-4 rounded-3xl shadow-xs flex items-center justify-between text-left transition-transform active:scale-[0.99] cursor-pointer min-h-[72px]"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
            <Banknote className="w-5.5 h-5.5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-white leading-tight truncate">
              Labour Wages &amp; Payslips
            </h4>
            <p className="text-xs text-purple-200 mt-0.5 truncate">
              Net payable balances &amp; print slips
            </p>
          </div>
        </div>
        <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-white shrink-0">
          <ChevronRight className="w-4 h-4" />
        </div>
      </button>

      {/* 5. Active Labourers & Daily Rates */}
      <section className="bg-white rounded-3xl p-4 shadow-xs border border-purple-100/80 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-neutral-900">
            Active Labourers ({activeLabourers.length})
          </h3>
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveTab('labourers');
            }}
            className="min-h-[36px] px-2 text-xs font-bold text-[#5C2D91] hover:underline cursor-pointer"
          >
            View All
          </button>
        </div>

        <div className="divide-y divide-neutral-100">
          {activeLabourers.length === 0 ? (
            <p className="text-xs text-neutral-500 text-center py-5">
              No active labourers assigned to this worksite yet.
            </p>
          ) : (
            activeLabourers.slice(0, 5).map((labour) => {
              const todayRec = todayRecords.find((r) => r.labourId === labour.id);
              const status = todayRec?.status || 'not_marked';

              return (
                <div
                  key={labour.id}
                  className="py-2.5 flex items-center justify-between gap-3 min-h-[54px]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <LabourAvatar
                      name={labour.name}
                      photoUrl={labour.photoUrl}
                      className="w-10 h-10 rounded-2xl"
                      fallbackClassName="bg-purple-100 text-[#5C2D91] font-bold text-xs"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-900 truncate">
                        {labour.name}
                      </p>
                      <p className="text-[11px] text-neutral-500 truncate">
                        {labour.role}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-bold text-[#5C2D91] font-mono tabular-nums">
                        {settings.currencySymbol}
                        {labour.dailyWage.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-neutral-400">per day</div>
                    </div>

                    <span
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-lg ${
                        status === 'present'
                          ? 'bg-emerald-100 text-emerald-800'
                          : status === 'half_day'
                          ? 'bg-amber-100 text-amber-800'
                          : status === 'absent'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {status === 'present'
                        ? 'P'
                        : status === 'half_day'
                        ? 'HD'
                        : status === 'absent'
                        ? 'A'
                        : '-'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 6. Recent Cash Advances */}
      <section className="bg-white rounded-3xl p-4 shadow-xs border border-purple-100/80 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-neutral-900">
            Recent Advances &amp; Loans
          </h3>
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveTab('advances');
            }}
            className="min-h-[36px] px-2 text-xs font-bold text-[#5C2D91] hover:underline cursor-pointer"
          >
            Ledger ({advances.length})
          </button>
        </div>

        {advances.length === 0 ? (
          <p className="text-xs text-neutral-500 text-center py-4">
            No advance payments recorded yet.
          </p>
        ) : (
          <div className="divide-y divide-neutral-100">
            {advances.slice(0, 3).map((adv) => {
              const worker = labourers.find((l) => l.id === adv.labourId);
              return (
                <div
                  key={adv.id}
                  className="py-2.5 flex items-center justify-between gap-2 text-xs min-h-[48px]"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-neutral-900 block truncate">
                      {worker?.name || 'Worker'}
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      {adv.paymentMode} &middot; {adv.date}
                    </span>
                  </div>
                  <div className="font-mono font-bold text-rose-600 tabular-nums shrink-0">
                    -{settings.currencySymbol}
                    {adv.amount.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
