import React, { useState, useMemo } from 'react';
import { Labour, AppSettings } from '../types';
import { formatCurrency } from '../utils/calculations';
import { LabourAvatar } from './LabourAvatar';
import { 
  Users, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Phone, 
  CheckCircle2, 
  XCircle,
  X,
  Coins,
  Check
} from 'lucide-react';

interface LabourDirectoryViewProps {
  labourers: Labour[];
  onOpenAddLabour: () => void;
  onEditLabour: (labour: Labour) => void;
  onDeleteLabour: (labourId: string) => void;
  onQuickUpdateWage: (labourId: string, dailyWage: number, otRate: number) => void;
  settings: AppSettings;
}

export const LabourDirectoryView: React.FC<LabourDirectoryViewProps> = ({
  labourers,
  onOpenAddLabour,
  onEditLabour,
  onDeleteLabour,
  onQuickUpdateWage,
  settings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  const [editingWageId, setEditingWageId] = useState<string | null>(null);
  const [inlineDailyWage, setInlineDailyWage] = useState<number>(0);
  const [inlineOtRate, setInlineOtRate] = useState<number>(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const roles = useMemo(() => {
    const set = new Set(labourers.map((l) => l.role));
    return ['all', ...Array.from(set)];
  }, [labourers]);

  const filteredLabourers = useMemo(() => {
    return labourers.filter((l) => {
      const matchesSearch =
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.phone.includes(searchQuery) ||
        l.role.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || l.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [labourers, searchQuery, roleFilter, statusFilter]);

  const activeCount = labourers.filter((l) => l.status === 'active').length;
  const avgWage = labourers.length > 0
    ? Math.round(labourers.reduce((acc, c) => acc + c.dailyWage, 0) / labourers.length)
    : 0;

  const handleStartInlineEdit = (labour: Labour) => {
    setEditingWageId(labour.id);
    setInlineDailyWage(labour.dailyWage);
    setInlineOtRate(labour.overtimeHourlyRate || Math.round(labour.dailyWage / 8));
  };

  const handleSaveInlineWage = (labourId: string) => {
    if (inlineDailyWage <= 0) return;
    onQuickUpdateWage(labourId, inlineDailyWage, inlineOtRate || Math.round(inlineDailyWage / 8));
    setEditingWageId(null);
  };

  return (
    <div className="space-y-3.5 pb-4 select-none">
      {/* 1. Hero Roster & Wage Header Banner */}
      <div className="bg-gradient-to-br from-[#5C2D91] via-[#4D227E] to-[#381461] rounded-3xl p-4 text-white shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div className="min-w-0">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-200 block">
              Labour Directory &amp; Rates
            </span>
            <div className="text-lg sm:text-xl font-black text-white mt-0.5 flex flex-wrap items-center gap-2">
              <span>{labourers.length} Labourers</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                {activeCount} Active
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenAddLabour}
            className="min-h-[44px] px-3.5 py-2 bg-white text-[#5C2D91] hover:bg-purple-50 font-extrabold text-xs rounded-2xl flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Labour</span>
          </button>
        </div>

        {/* Roster Metrics Strip */}
        <div className="grid grid-cols-2 gap-2 pt-3">
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-2.5">
            <span className="text-[11px] font-bold text-purple-200 block">Avg Daily Wage</span>
            <span className="text-sm font-black font-mono tabular-nums text-white mt-0.5 block">
              {formatCurrency(avgWage, settings.currencySymbol)}
              <span className="text-[11px] font-normal text-purple-200"> /day</span>
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-2.5">
            <span className="text-[11px] font-bold text-purple-200 block">Rate Range</span>
            <span className="text-xs font-black font-mono tabular-nums text-purple-100 mt-1 block truncate">
              {labourers.length > 0
                ? `${formatCurrency(Math.min(...labourers.map((l) => l.dailyWage)), settings.currencySymbol)} – ${formatCurrency(Math.max(...labourers.map((l) => l.dailyWage)), settings.currencySymbol)}`
                : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Search and Filter Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search worker by name, trade or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-[44px] pl-10 pr-10 py-2.5 bg-white rounded-2xl border border-purple-100 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]/25 font-medium shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-700 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Responsive Stacked Filters on Narrow Android Viewports */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Status Segmented Tabs */}
          <div className="flex p-1 bg-purple-50/70 rounded-2xl border border-purple-100 flex-1">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`flex-1 min-h-[40px] text-xs font-bold rounded-xl transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-[#5C2D91] shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              All ({labourers.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`flex-1 min-h-[40px] text-xs font-bold rounded-xl transition-all cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`flex-1 min-h-[40px] text-xs font-bold rounded-xl transition-all cursor-pointer ${
                statusFilter === 'inactive'
                  ? 'bg-white text-neutral-800 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Inactive
            </button>
          </div>

          {/* Trade Filter Dropdown */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="min-h-[44px] px-3 py-2 text-xs bg-white border border-purple-100 rounded-2xl text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#5C2D91] cursor-pointer shadow-2xs font-bold shrink-0"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r === 'all' ? 'All Trades' : r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Labourers Cards List */}
      {filteredLabourers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-purple-100 p-6 space-y-3">
          <Users className="w-10 h-10 text-neutral-300 mx-auto" />
          <h3 className="text-sm font-bold text-neutral-900">
            No labourers match your search
          </h3>
          <p className="text-xs text-neutral-500">
            Try adjusting your search filters or register a new worker.
          </p>
          <button
            type="button"
            onClick={onOpenAddLabour}
            className="mt-2 min-h-[44px] inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#5C2D91] hover:bg-[#4E247D] rounded-2xl transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Labour</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLabourers.map((labour) => {
            const isEditingWage = editingWageId === labour.id;
            const isConfirmingDelete = confirmDeleteId === labour.id;

            return (
              <div
                key={labour.id}
                className={`bg-white rounded-3xl border p-4 shadow-sm transition-all space-y-3 ${
                  labour.status === 'active'
                    ? 'border-purple-100 hover:border-purple-300'
                    : 'border-neutral-200 opacity-75'
                }`}
              >
                {/* Header: Avatar + Worker Name + Role + Status Badge */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <LabourAvatar
                        name={labour.name}
                        photoUrl={labour.photoUrl}
                        className="w-11 h-11 rounded-2xl"
                        fallbackClassName="bg-gradient-to-br from-[#5C2D91] to-[#7B3FB7] text-white font-black text-base"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                          labour.status === 'active' ? 'bg-emerald-500' : 'bg-neutral-400'
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-neutral-900 leading-tight truncate">
                        {labour.name}
                      </h3>
                      <p className="text-xs text-neutral-500 font-medium truncate mt-0.5">
                        {labour.role}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[11px] font-extrabold rounded-lg uppercase flex items-center gap-1 shrink-0 ${
                      labour.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                    }`}
                  >
                    {labour.status === 'active' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-neutral-400" />
                        <span>Inactive</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Wage Rates Section */}
                <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5C2D91] flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />
                      <span>Wage &amp; OT Rates</span>
                    </span>

                    {!isEditingWage ? (
                      <button
                        type="button"
                        onClick={() => handleStartInlineEdit(labour)}
                        className="min-h-[34px] px-2.5 py-1 rounded-xl bg-white border border-purple-200 text-[11px] font-bold text-[#5C2D91] flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Adjust Rates</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-purple-700">Editing Rates</span>
                    )}
                  </div>

                  {isEditingWage ? (
                    /* Inline Wage Rate Adjuster */
                    <div className="space-y-2.5 pt-1">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                            Daily Wage ({settings.currencySymbol})
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="any"
                            value={inlineDailyWage}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setInlineDailyWage(val);
                              setInlineOtRate(Math.round(val / 8));
                            }}
                            className="w-full min-h-[42px] px-2.5 py-1.5 text-sm font-black bg-white border border-purple-200 rounded-xl text-neutral-900 font-mono shadow-2xs focus:ring-2 focus:ring-[#5C2D91]/20"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                            OT / Hr ({settings.currencySymbol})
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={inlineOtRate}
                            onChange={(e) => setInlineOtRate(Number(e.target.value))}
                            className="w-full min-h-[42px] px-2.5 py-1.5 text-sm font-black bg-white border border-purple-200 rounded-xl text-neutral-900 font-mono shadow-2xs focus:ring-2 focus:ring-[#5C2D91]/20"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingWageId(null)}
                          className="min-h-[40px] px-3.5 py-1.5 text-xs font-bold text-neutral-600 hover:text-neutral-900 rounded-xl bg-white border border-neutral-200 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveInlineWage(labour.id)}
                          className="min-h-[40px] px-4 py-1.5 text-xs font-bold text-white bg-[#5C2D91] hover:bg-[#4E247D] rounded-xl flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Rates</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display Wage Values */
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/80 p-2.5 rounded-xl border border-purple-100/80">
                        <span className="text-[11px] text-neutral-500 font-medium block">Daily Wage</span>
                        <span className="text-sm font-black text-neutral-900 font-mono tabular-nums">
                          {formatCurrency(labour.dailyWage, settings.currencySymbol)}
                        </span>
                        <span className="text-[11px] text-neutral-400"> /day</span>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded-xl border border-purple-100/80">
                        <span className="text-[11px] text-neutral-500 font-medium block">Overtime Rate</span>
                        <span className="text-sm font-black text-[#5C2D91] font-mono tabular-nums">
                          {formatCurrency(labour.overtimeHourlyRate, settings.currencySymbol)}
                        </span>
                        <span className="text-[11px] text-neutral-400"> /hr</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Phone & Joining Details */}
                <div className="flex items-center justify-between text-xs text-neutral-600 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#5C2D91] shrink-0" />
                    {labour.phone ? (
                      <a
                        href={`tel:${labour.phone}`}
                        className="font-mono text-neutral-800 hover:text-[#5C2D91] hover:underline"
                      >
                        {labour.phone}
                      </a>
                    ) : (
                      <span className="text-neutral-400 italic">No phone registered</span>
                    )}
                  </div>
                  <span className="text-[11px] text-neutral-400">
                    Joined: {labour.joiningDate}
                  </span>
                </div>

                {/* Card Action Footer: Edit Profile & Inline Two-Tap Delete */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-50">
                  {isConfirmingDelete ? (
                    <div className="w-full flex items-center justify-between gap-2 bg-rose-50 border border-rose-200 p-2 rounded-2xl">
                      <span className="text-xs font-bold text-rose-700 pl-1 truncate">
                        Remove {labour.name}?
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white text-neutral-700 border border-neutral-200 font-bold text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteLabour(labour.id);
                            setConfirmDeleteId(null);
                          }}
                          className="min-h-[38px] px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onEditLabour(labour)}
                        className="min-h-[44px] flex-1 sm:flex-initial px-3.5 py-2 rounded-2xl bg-purple-50 hover:bg-purple-100 text-[#5C2D91] font-bold text-xs flex items-center justify-center gap-1.5 border border-purple-200 transition-colors cursor-pointer active:scale-95"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Profile &amp; Rates</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(labour.id)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl bg-neutral-100 hover:bg-rose-50 hover:text-rose-600 text-neutral-500 border border-neutral-200 transition-colors cursor-pointer active:scale-95"
                        aria-label={`Delete ${labour.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
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
