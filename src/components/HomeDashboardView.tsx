import React from 'react';
import { 
  Labour, 
  AttendanceRecord, 
  AdvanceTransaction, 
  AppSettings, 
  ActiveTab 
} from '../types';
import { 
  CalendarCheck, 
  UserPlus, 
  CreditCard, 
  ChevronRight,
  Users,
  Receipt,
  Banknote,
  CheckCheck
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
  onOpenSettings: _onOpenSettings,
  onQuickMarkAll,
}) => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const activeLabourers = labourers.filter((l) => l.status === 'active');

  // Today's attendance stats
  const todayRecords = attendance.filter((r) => r.date === todayStr);
  const presentCount = todayRecords.filter((r) => r.status === 'present').length;
  const halfDayCount = todayRecords.filter((r) => r.status === 'half_day').length;
  const absentCount = todayRecords.filter((r) => r.status === 'absent').length;
  const markedIds = new Set(todayRecords.map((r) => r.labourId));
  const unmarkedCount = activeLabourers.filter((l) => !markedIds.has(l.id)).length;

  // Clean Services Grid (No 1-Tap Present, No Build APK, No sub-text badges)
  const coreServices = [
    {
      id: 'payments',
      label: 'Payments',
      icon: CreditCard,
      onClick: () => setActiveTab('attendance'),
    },
    {
      id: 'payroll',
      label: 'Wages & Pay',
      icon: Banknote,
      onClick: () => setActiveTab('payroll'),
    },
    {
      id: 'add_worker',
      label: 'Add Worker',
      icon: UserPlus,
      onClick: onOpenAddLabour,
    },
    {
      id: 'send_advance',
      label: 'Send Advance',
      icon: CreditCard,
      onClick: () => onOpenAdvanceModal(),
    },
    {
      id: 'advances_ledger',
      label: 'Loans Ledger',
      icon: Receipt,
      onClick: () => setActiveTab('advances'),
    },
    {
      id: 'roster',
      label: 'Labourers',
      icon: Users,
      onClick: () => setActiveTab('labourers'),
    },
  ];

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* Services Grid Section (Clean Khalti-style grid with NO subtext badges) */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-purple-100">
        <div className="flex items-center justify-between mb-3.5 px-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-neutral-900 tracking-tight">
              Labour Operations
            </h2>
            <span className="w-1.5 h-1.5 rounded-full bg-[#5C2D91]" />
          </div>
        </div>

        {/* 3 Columns x 2 Rows Grid - Clean Icons & Single-line Labels Only */}
        <div className="grid grid-cols-3 gap-y-4 gap-x-2">
          {coreServices.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className="flex flex-col items-center text-center group focus:outline-none p-2 rounded-2xl transition-all hover:bg-purple-50/70 active:scale-95 cursor-pointer"
              >
                <div className="w-13 h-13 rounded-2xl bg-purple-50/80 border border-purple-200/90 flex items-center justify-center text-[#5C2D91] group-hover:bg-[#5C2D91] group-hover:text-white transition-all shadow-2xs">
                  <Icon className="w-6 h-6 stroke-[2]" />
                </div>

                <span className="text-xs font-bold text-neutral-800 mt-2 leading-tight group-hover:text-[#5C2D91] truncate max-w-full">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Today's Live Attendance Snapshot Card */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-purple-100 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Today's Attendance Snapshot
            </h3>
            <p className="text-sm font-bold text-neutral-900 mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('mark-today')}
            className="flex items-center gap-1 text-xs font-bold text-[#5C2D91] hover:underline cursor-pointer"
          >
            <span>Attendance</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Status Counters */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-center">
            <span className="text-[10px] font-bold uppercase text-emerald-800 block">Present (P)</span>
            <span className="text-lg font-black text-emerald-700 font-mono tabular-nums">{presentCount}</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-center">
            <span className="text-[10px] font-bold uppercase text-amber-800 block">Half (HD)</span>
            <span className="text-lg font-black text-amber-700 font-mono tabular-nums">{halfDayCount}</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-center">
            <span className="text-[10px] font-bold uppercase text-rose-800 block">Absent (A)</span>
            <span className="text-lg font-black text-rose-700 font-mono tabular-nums">{absentCount}</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-neutral-100 border border-neutral-200 text-center">
            <span className="text-[10px] font-bold uppercase text-neutral-600 block">Unmarked</span>
            <span className="text-lg font-black text-neutral-800 font-mono tabular-nums">{unmarkedCount}</span>
          </div>
        </div>

        {/* Quick action buttons for roll call */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onQuickMarkAll('present')}
            className="flex-1 min-h-[44px] py-2 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-[0.98] cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All Present</span>
          </button>
          <button
            onClick={() => onQuickMarkAll('absent')}
            className="min-h-[44px] py-2 px-3.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs transition-colors border border-neutral-200 cursor-pointer"
          >
            Mark All Absent
          </button>
        </div>
      </div>

      {/* Featured Wages & Payslips Card */}
      <button
        onClick={() => setActiveTab('payroll')}
        className="w-full bg-gradient-to-r from-purple-900 to-[#5C2D91] text-white p-4 rounded-3xl shadow-sm flex items-center justify-between text-left transition-transform active:scale-[0.99] cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white">
            <Banknote className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white leading-tight">
              Labour Wages &amp; Payslips
            </h4>
            <p className="text-xs text-purple-200 mt-0.5">
              Net payable cards &amp; print slips
            </p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
          <ChevronRight className="w-4 h-4" />
        </div>
      </button>

      {/* Quick Workers Roster with Daily Rates (NO TAG NUMBERS) */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-purple-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#5C2D91]" />
            <h3 className="text-sm font-bold text-neutral-900">
              Active Labourers &amp; Rates ({activeLabourers.length})
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('labourers')}
            className="text-xs font-bold text-[#5C2D91] hover:underline cursor-pointer"
          >
            View All
          </button>
        </div>

        <div className="divide-y divide-purple-50">
          {activeLabourers.slice(0, 5).map((labour) => {
            const todayRec = todayRecords.find((r) => r.labourId === labour.id);
            const status = todayRec?.status || 'not_marked';

            return (
              <div
                key={labour.id}
                className="py-2.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-2xl bg-purple-100 text-[#5C2D91] font-bold text-xs flex items-center justify-center shrink-0">
                    {labour.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-neutral-900 truncate">
                      {labour.name}
                    </p>
                    <p className="text-[11px] text-neutral-500 truncate">
                      {labour.role}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-bold text-[#5C2D91] font-mono">
                      {settings.currencySymbol}{labour.dailyWage.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      per day
                    </div>
                  </div>

                  {/* Status chip */}
                  <span
                    className={`px-2 py-0.5 text-[10px] font-extrabold rounded-lg uppercase ${
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
                      : 'None'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Advances & Deductions Card (NO TAG NUMBERS) */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-purple-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#5C2D91]" />
            <h3 className="text-sm font-bold text-neutral-900">
              Recent Cash Advances &amp; Loans
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('advances')}
            className="text-xs font-bold text-[#5C2D91] hover:underline cursor-pointer"
          >
            Ledger ({advances.length})
          </button>
        </div>

        {advances.length === 0 ? (
          <p className="text-xs text-neutral-500 text-center py-4">No advance payments recorded yet.</p>
        ) : (
          <div className="divide-y divide-purple-50">
            {advances.slice(0, 3).map((adv) => {
              const worker = labourers.find((l) => l.id === adv.labourId);
              return (
                <div key={adv.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-neutral-900 block">{worker?.name || 'Worker'}</span>
                    <span className="text-[11px] text-neutral-500">{adv.paymentMode} &middot; {adv.date}</span>
                  </div>
                  <div className="font-mono font-bold text-rose-600">
                    -{settings.currencySymbol}{adv.amount.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
