import React, { useState, useEffect, useRef } from 'react';
import { Labour, AppSettings } from '../types';
import { 
  X, 
  Calculator, 
  UserCheck, 
  AlertCircle, 
  User, 
  Briefcase, 
  Coins, 
  CheckCircle2, 
  XCircle,
  FileText,
  Building2,
  Camera,
  ImagePlus,
  Trash2
} from 'lucide-react';
import { COMMON_ROLES } from '../utils/seedData';
import { compressLabourPhoto } from '../utils/imageCompress';
import { LabourAvatar } from './LabourAvatar';

interface LabourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (labour: Labour) => void;
  initialLabour?: Labour | null;
  settings: AppSettings;
}

export const LabourModal: React.FC<LabourModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialLabour,
  settings,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState(COMMON_ROLES[0]);
  const [worksiteId, setWorksiteId] = useState<string>('');
  const [dailyWage, setDailyWage] = useState<number>(1200);
  const [overtimeHourlyRate, setOvertimeHourlyRate] = useState<number>(170);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [error, setError] = useState('');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const defaultSiteId = settings.activeWorksiteId !== 'all' 
      ? settings.activeWorksiteId 
      : (settings.worksites?.[0]?.id || 'site_tower4');

    if (initialLabour) {
      setName(initialLabour.name);
      setPhone(initialLabour.phone);
      setRole(initialLabour.role);
      setWorksiteId(initialLabour.worksiteId || defaultSiteId);
      setDailyWage(initialLabour.dailyWage);
      setOvertimeHourlyRate(initialLabour.overtimeHourlyRate || Math.round(initialLabour.dailyWage / 8));
      setStatus(initialLabour.status);
      setNotes(initialLabour.notes || '');
      setPhotoUrl(initialLabour.photoUrl);
      setError('');
    } else {
      setName('');
      setPhone('');
      setRole(COMMON_ROLES[0]);
      setWorksiteId(defaultSiteId);
      setDailyWage(1200);
      setOvertimeHourlyRate(150);
      setStatus('active');
      setNotes('');
      setPhotoUrl(undefined);
      setError('');
    }
  }, [initialLabour, isOpen, settings]);

  if (!isOpen) return null;

  const handleWageChange = (val: number) => {
    setDailyWage(val);
    if (!initialLabour || overtimeHourlyRate === Math.round(dailyWage / 8)) {
      setOvertimeHourlyRate(Math.round(val / 8));
    }
  };

  const handleAutoCalcOT = () => {
    setOvertimeHourlyRate(Math.max(1, Math.round(dailyWage / 8)));
  };

  const adjustDailyWage = (delta: number) => {
    const next = Math.max(100, dailyWage + delta);
    setDailyWage(next);
    setOvertimeHourlyRate(Math.round(next / 8));
  };

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setProcessingPhoto(true);
    setError('');
    try {
      const compressed = await compressLabourPhoto(file, 256);
      setPhotoUrl(compressed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process worker photo.');
    } finally {
      setProcessingPhoto(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide labourer name');
      return;
    }
    if (dailyWage <= 0) {
      setError('Daily wage rate must be greater than 0');
      return;
    }

    const labourData: Labour = {
      id: initialLabour ? initialLabour.id : `lbr_${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      role: role.trim(),
      worksiteId: worksiteId || settings.activeWorksiteId,
      dailyWage: Number(dailyWage),
      overtimeHourlyRate: Number(overtimeHourlyRate) || Math.round(dailyWage / 8),
      joiningDate: initialLabour ? initialLabour.joiningDate : new Date().toISOString().split('T')[0],
      status,
      notes: notes.trim(),
      photoUrl,
    };

    onSave(labourData);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white rounded-t-[28px] sm:rounded-3xl border border-purple-100 shadow-2xl overflow-hidden flex flex-col max-h-[90%] pb-[max(8px,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Android Bottom Sheet Handle & Purple Branding */}
        <div className="px-5 pt-3 pb-4 bg-gradient-to-r from-[#5C2D91] via-[#4D227E] to-[#381461] text-white shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/30 mx-auto mb-3 sm:hidden" />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              {photoUrl ? (
                <LabourAvatar name={name} photoUrl={photoUrl} className="w-10 h-10 rounded-2xl" />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center font-black text-sm text-white shrink-0">
                  {name.trim() ? name.trim().slice(0, 1).toUpperCase() : <User className="w-5 h-5" />}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-extrabold text-white leading-tight truncate">
                  {initialLabour ? 'Edit Labour & Wage Rates' : 'Register New Labourer'}
                </h2>
                <p className="text-[11px] text-purple-200 mt-0.5 truncate">
                  Set profile, daily wage rate &amp; overtime pay
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

        {/* Scrollable Form Body */}
        <form noValidate onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto overscroll-y-contain space-y-4 text-xs font-sans">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 rounded-2xl border border-rose-200 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SECTION 1: Personal Details */}
          <div className="space-y-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block px-1">
              Personal &amp; Trade Details
            </span>

            {/* Worker Photo Upload / Camera */}
            <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-2xl flex items-center gap-3">
              <LabourAvatar
                name={name}
                photoUrl={photoUrl}
                className="w-14 h-14 rounded-2xl"
                fallbackClassName="bg-[#5C2D91] text-white font-black text-lg"
              />
              <div className="flex-1 min-w-0 space-y-1.5">
                <span className="text-[11px] font-bold text-neutral-800 block">
                  Worker Photo (Optional)
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    disabled={processingPhoto}
                    onClick={() => cameraInputRef.current?.click()}
                    className="min-h-[34px] px-2.5 py-1.5 rounded-xl bg-[#5C2D91] hover:bg-[#4E247D] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-60"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Take Photo</span>
                  </button>
                  <button
                    type="button"
                    disabled={processingPhoto}
                    onClick={() => galleryInputRef.current?.click()}
                    className="min-h-[34px] px-2.5 py-1.5 rounded-xl bg-white border border-purple-200 hover:bg-purple-50 text-[#5C2D91] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-60"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    <span>{processingPhoto ? 'Processing...' : 'Gallery'}</span>
                  </button>
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl(undefined)}
                      className="min-h-[34px] px-2 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      aria-label="Remove worker photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelected}
                className="hidden"
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelected}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Thapa"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-[#5C2D91] rounded-2xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]/20 transition-all"
                  />
                </div>
              </div>

              {/* Trade Role */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Trade / Skill Role *
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-[#5C2D91] rounded-2xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]/20 cursor-pointer transition-all"
                  >
                    {COMMON_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Worksite Assignment */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Assigned Worksite / Project
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={worksiteId}
                  onChange={(e) => setWorksiteId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-[#5C2D91] rounded-2xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]/20 transition-all cursor-pointer"
                >
                  {(settings.worksites || []).map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name} ({site.location})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: Highlighted Wage & Overtime Rates Card */}
          <div className="p-4 bg-purple-50/80 border border-purple-200/90 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#5C2D91] flex items-center gap-1.5">
                <Coins className="w-4 h-4" />
                <span>Wage &amp; Overtime Rates</span>
              </span>

              <button
                type="button"
                onClick={handleAutoCalcOT}
                className="flex items-center gap-1 text-[11px] font-bold text-[#5C2D91] hover:underline cursor-pointer bg-white px-2 py-1 rounded-lg border border-purple-200 shadow-2xs"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Auto OT (Wage &divide; 8h)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Daily Wage Rate */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-neutral-800">
                    Daily Wage Rate *
                  </label>
                  {/* Quick increment buttons */}
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => adjustDailyWage(-100)}
                      className="px-1.5 py-0.5 text-[10px] font-bold bg-white text-neutral-600 rounded border border-purple-200 hover:bg-purple-100 cursor-pointer"
                    >
                      -100
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustDailyWage(+100)}
                      className="px-1.5 py-0.5 text-[10px] font-bold bg-white text-neutral-600 rounded border border-purple-200 hover:bg-purple-100 cursor-pointer"
                    >
                      +100
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
                    value={dailyWage}
                    onChange={(e) => handleWageChange(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 text-sm font-black bg-white border border-purple-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91] tabular-nums font-mono shadow-2xs"
                  />
                </div>
              </div>

              {/* Overtime Hourly Rate */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Overtime Rate / Hour
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5C2D91] font-black font-mono">
                    {settings.currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={overtimeHourlyRate}
                    onChange={(e) => setOvertimeHourlyRate(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 text-sm font-black bg-white border border-purple-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91] tabular-nums font-mono shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Live Wage Preview Calculator */}
            <div className="bg-white p-2.5 rounded-2xl border border-purple-100 grid grid-cols-3 gap-2 text-center text-[11px]">
              <div>
                <span className="text-[9px] text-neutral-400 font-bold uppercase block">Full Day</span>
                <span className="font-mono font-bold text-neutral-900">
                  {settings.currencySymbol}{dailyWage.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-neutral-400 font-bold uppercase block">Half Day</span>
                <span className="font-mono font-bold text-amber-700">
                  {settings.currencySymbol}{Math.round(dailyWage * 0.5).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-neutral-400 font-bold uppercase block">2h Overtime</span>
                <span className="font-mono font-bold text-[#5C2D91]">
                  +{settings.currencySymbol}{Math.round(overtimeHourlyRate * 2).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: Employment Status & Notes */}
          <div className="space-y-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block px-1">
              Roster Status &amp; Notes
            </span>

            {/* Status Segmented Buttons */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                Roster Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`min-h-[44px] px-3 py-2 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer border ${
                    status === 'active'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-200'
                      : 'bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  <CheckCircle2 className={`w-4 h-4 ${status === 'active' ? 'text-emerald-600' : 'text-neutral-400'}`} />
                  <span>Active (On Site)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('inactive')}
                  className={`min-h-[44px] px-3 py-2 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer border ${
                    status === 'inactive'
                      ? 'bg-neutral-200 text-neutral-900 border-neutral-400 ring-2 ring-neutral-300'
                      : 'bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  <XCircle className={`w-4 h-4 ${status === 'inactive' ? 'text-neutral-700' : 'text-neutral-400'}`} />
                  <span>Inactive (On Leave)</span>
                </button>
              </div>
            </div>

            {/* Site Notes */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Worksite Skill Note (Optional)
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Master plasterer, verified citizenship ID"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-[#5C2D91] rounded-2xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]/20 transition-all font-medium"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons Footer */}
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
              <UserCheck className="w-4 h-4" />
              <span>{initialLabour ? 'Update Worker & Rates' : 'Save Labourer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
