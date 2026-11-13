import React, { useState } from 'react';
import { AppSettings, Labour, AttendanceRecord, AdvanceTransaction, Worksite } from '../types';
import { exportBackupJSON } from '../utils/storage';
import { 
  X, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  Building2, 
  Plus, 
  MapPin, 
  Users, 
  Check, 
  ShieldCheck, 
  Sliders, 
  Database, 
  Briefcase,
  ChevronRight,
  Smartphone
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onResetData: () => void;
  onImportData: (data: {
    labourers: Labour[];
    attendance: AttendanceRecord[];
    advances: AdvanceTransaction[];
    settings?: AppSettings;
  }) => void;
  labourers: Labour[];
  attendance: AttendanceRecord[];
  advances: AdvanceTransaction[];
  onOpenLoginAccess?: () => void;
  onOpenApkStudio?: () => void;
}

const CURRENCIES = [
  { code: 'NPR', symbol: 'रू', label: 'NPR (रू) - Nepalese Rupee' },
  { code: 'INR', symbol: '₹', label: 'INR (₹) - Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'USD ($) - US Dollar' },
  { code: 'EUR', symbol: '€', label: 'EUR (€) - Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP (£) - British Pound' },
  { code: 'AED', symbol: 'AED', label: 'AED - UAE Dirham' },
  { code: 'SAR', symbol: 'SAR', label: 'SAR - Saudi Riyal' },
  { code: 'QAR', symbol: 'QR', label: 'QAR - Qatari Riyal' },
  { code: 'MYR', symbol: 'RM', label: 'MYR - Malaysian Ringgit' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetData,
  onImportData,
  labourers,
  attendance,
  advances,
  onOpenLoginAccess,
  onOpenApkStudio,
}) => {
  const [activeTab, setActiveTab] = useState<'worksites' | 'general' | 'access' | 'backup'>('worksites');
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [importStatus, setImportStatus] = useState<string>('');
  const [confirmReset, setConfirmReset] = useState(false);

  // Inline new worksite state
  const [showAddSite, setShowAddSite] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteLocation, setNewSiteLocation] = useState('');
  const [newSiteClient, setNewSiteClient] = useState('');
  const [newSiteSupervisor, setNewSiteSupervisor] = useState('');

  if (!isOpen) return null;

  const handleCurrencyChange = (code: string) => {
    const selected = CURRENCIES.find((c) => c.code === code);
    if (selected) {
      setFormData({
        ...formData,
        currency: selected.code,
        currencySymbol: selected.symbol,
      });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    onClose();
  };

  const handleExport = () => {
    exportBackupJSON(labourers, attendance, advances, formData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.labourers && parsed.attendance && parsed.advances) {
          onImportData({
            labourers: parsed.labourers,
            attendance: parsed.attendance,
            advances: parsed.advances,
            settings: parsed.settings,
          });
          setImportStatus('Backup restored successfully!');
          setTimeout(() => setImportStatus(''), 3000);
        } else {
          setImportStatus('Invalid backup file format');
        }
      } catch {
        setImportStatus('Failed to read backup file');
      }
    };
    reader.readAsText(file);
  };

  const handleSwitchWorksite = (siteId: string, siteName: string) => {
    const updated = {
      ...formData,
      activeWorksiteId: siteId,
      worksiteName: siteName,
    };
    setFormData(updated);
    onSaveSettings(updated);
  };

  const handleAddNewWorksite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteName.trim() || !newSiteLocation.trim()) return;

    const newSite: Worksite = {
      id: `site_${Date.now()}`,
      name: newSiteName.trim(),
      location: newSiteLocation.trim(),
      clientName: newSiteClient.trim() || undefined,
      supervisorName: newSiteSupervisor.trim() || formData.userSession?.userName || undefined,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updatedWorksites = [...(formData.worksites || []), newSite];
    const updated = {
      ...formData,
      worksites: updatedWorksites,
      activeWorksiteId: newSite.id,
      worksiteName: newSite.name,
    };

    setFormData(updated);
    onSaveSettings(updated);
    setShowAddSite(false);
    setNewSiteName('');
    setNewSiteLocation('');
    setNewSiteClient('');
    setNewSiteSupervisor('');
  };

  const getWorkerCountForSite = (siteId: string) => {
    return labourers.filter((l) => l.worksiteId === siteId && l.status === 'active').length;
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
        {/* Header with Android Bottom Sheet Handle + Purple Theme */}
        <div className="px-5 pt-3 pb-4 bg-gradient-to-r from-[#5C2D91] via-[#4D227E] to-[#381461] text-white shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/30 mx-auto mb-3 sm:hidden" />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-xs">
                <Sliders className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-extrabold text-white leading-tight truncate">
                  Worksite &amp; App Settings
                </h2>
                <p className="text-[11px] text-purple-200 mt-0.5 truncate">
                  Multi-site projects, access &amp; parameters
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl hover:bg-white/15 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
              aria-label="Close settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 Navigation Tabs */}
        <div className="flex border-b border-purple-100 bg-purple-50/50 p-1.5 shrink-0 gap-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('worksites')}
            className={`flex-1 min-h-[40px] py-1.5 px-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
              activeTab === 'worksites'
                ? 'bg-white text-[#5C2D91] shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Worksites</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex-1 min-h-[40px] py-1.5 px-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
              activeTab === 'general'
                ? 'bg-white text-[#5C2D91] shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Company</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('access')}
            className={`flex-1 min-h-[40px] py-1.5 px-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
              activeTab === 'access'
                ? 'bg-white text-[#5C2D91] shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Access &amp; PIN</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`flex-1 min-h-[40px] py-1.5 px-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
              activeTab === 'backup'
                ? 'bg-white text-[#5C2D91] shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Backup</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto overscroll-y-contain space-y-4">
          {importStatus && (
            <div className="p-3 text-xs bg-purple-50 border border-purple-200 text-[#5C2D91] font-semibold rounded-2xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{importStatus}</span>
            </div>
          )}

          {/* TAB 1: WORKSITES HUB */}
          {activeTab === 'worksites' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Registered Worksites ({formData.worksites?.length || 0})
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Switch active site to filter all records
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddSite(!showAddSite)}
                  className="min-h-[40px] px-3 py-1.5 text-xs font-bold text-white bg-[#5C2D91] hover:bg-[#4E247D] rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddSite ? 'Cancel' : 'Add Site'}</span>
                </button>
              </div>

              {/* Add New Site Inline Form */}
              {showAddSite && (
                <form onSubmit={handleAddNewWorksite} className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2.5">
                  <span className="text-xs font-bold text-[#5C2D91] block">
                    Register New Worksite
                  </span>
                  <input
                    type="text"
                    placeholder="Worksite Name (e.g. Ring Road Site)"
                    value={newSiteName}
                    onChange={(e) => setNewSiteName(e.target.value)}
                    required
                    className="w-full min-h-[42px] px-3 py-2 text-xs bg-white border border-purple-100 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]"
                  />
                  <input
                    type="text"
                    placeholder="Location / City (e.g. Balkhu, Kathmandu)"
                    value={newSiteLocation}
                    onChange={(e) => setNewSiteLocation(e.target.value)}
                    required
                    className="w-full min-h-[42px] px-3 py-2 text-xs bg-white border border-purple-100 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Client Name (Optional)"
                      value={newSiteClient}
                      onChange={(e) => setNewSiteClient(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 text-xs bg-white border border-purple-100 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]"
                    />
                    <input
                      type="text"
                      placeholder="Site Supervisor"
                      value={newSiteSupervisor}
                      onChange={(e) => setNewSiteSupervisor(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 text-xs bg-white border border-purple-100 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full min-h-[44px] py-2 text-xs font-bold text-white bg-[#5C2D91] hover:bg-[#4E247D] rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create &amp; Make Active</span>
                  </button>
                </form>
              )}

              {/* Worksites List */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleSwitchWorksite('all', 'All Worksites')}
                  className={`w-full min-h-[58px] flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                    formData.activeWorksiteId === 'all'
                      ? 'bg-purple-50 border-[#5C2D91] ring-1 ring-[#5C2D91]/20 shadow-xs'
                      : 'bg-white hover:bg-purple-50/30 border-purple-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                      formData.activeWorksiteId === 'all'
                        ? 'bg-[#5C2D91] text-white shadow-xs'
                        : 'bg-purple-100 text-[#5C2D91]'
                    }`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-neutral-900">
                          All Worksites
                        </span>
                        {formData.activeWorksiteId === 'all' && (
                          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-[#5C2D91] text-white">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        All sites combined ({labourers.filter((l) => l.status === 'active').length} active)
                      </p>
                    </div>
                  </div>

                  {formData.activeWorksiteId === 'all' && (
                    <div className="w-6 h-6 rounded-full bg-[#5C2D91] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>

                {(formData.worksites || []).map((site) => {
                  const isActive = formData.activeWorksiteId === site.id;
                  const count = getWorkerCountForSite(site.id);

                  return (
                    <button
                      key={site.id}
                      type="button"
                      onClick={() => handleSwitchWorksite(site.id, site.name)}
                      className={`w-full min-h-[58px] flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-purple-50/90 border-[#5C2D91] ring-1 ring-[#5C2D91]/20 shadow-xs'
                          : 'bg-white hover:bg-purple-50/30 border-purple-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isActive
                            ? 'bg-[#5C2D91] text-white shadow-xs'
                            : 'bg-purple-100 text-[#5C2D91]'
                        }`}>
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-neutral-900 truncate">
                              {site.name}
                            </span>
                            {isActive && (
                              <span className="shrink-0 text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-[#5C2D91] text-white">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-500 truncate mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                            <span className="truncate">{site.location}</span>
                            {site.supervisorName && (
                              <>
                                <span className="text-neutral-300">&middot;</span>
                                <span className="truncate">{site.supervisorName}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-bold text-neutral-600 bg-neutral-100 px-2 py-1 rounded-full flex items-center gap-1">
                          <Users className="w-3 h-3 text-neutral-500" />
                          <span>{count}</span>
                        </span>
                        {isActive && (
                          <div className="w-6 h-6 rounded-full bg-[#5C2D91] text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: GENERAL COMPANY & CURRENCY SETTINGS */}
          {activeTab === 'general' && (
            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Contractor / Company Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full min-h-[44px] px-3 py-2 text-xs bg-purple-50/40 border border-purple-100 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Active Worksite Display Label
                </label>
                <input
                  type="text"
                  required
                  value={formData.worksiteName}
                  onChange={(e) => setFormData({ ...formData, worksiteName: e.target.value })}
                  className="w-full min-h-[44px] px-3 py-2 text-xs bg-purple-50/40 border border-purple-100 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Currency Symbol &amp; Code
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 text-xs bg-purple-50/40 border border-purple-100 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91] cursor-pointer"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Standard Shift Hours
                  </label>
                  <input
                    type="number"
                    min="4"
                    max="12"
                    value={formData.defaultShiftHours}
                    onChange={(e) => setFormData({ ...formData, defaultShiftHours: Number(e.target.value) })}
                    className="w-full min-h-[44px] px-3 py-2 text-xs bg-purple-50/40 border border-purple-100 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91] tabular-nums"
                  />
                </div>
              </div>

              <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 flex items-center justify-between text-xs">
                <span className="text-neutral-600 font-medium">Currency Preview Sample:</span>
                <span className="font-bold text-[#5C2D91] bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-2xs">
                  {formData.currencySymbol} 1,400 / day
                </span>
              </div>

              <button
                type="submit"
                className="w-full min-h-[46px] flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-white bg-[#5C2D91] hover:bg-[#4E247D] rounded-2xl transition-colors shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Company Settings</span>
              </button>
            </form>
          )}

          {/* TAB 3: SUPERVISOR ACCESS & PIN */}
          {activeTab === 'access' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-purple-100 shadow-xs space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#5C2D91] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                      {(formData.userSession?.userName || 'RS').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-neutral-900 truncate block">
                        {formData.userSession?.userName || 'Account Holder'}
                      </span>
                      <p className="text-[11px] text-neutral-500 mt-0.5 truncate">
                        {formData.userSession?.email || formData.userSession?.phone || 'Single-person access'}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                    Active
                  </span>
                </div>

                <div className="pt-2 border-t border-purple-100 flex items-center justify-between text-xs text-neutral-600">
                  <span>Backend Security:</span>
                  <span className="font-mono font-bold text-[#5C2D91]">
                    •••• (Verified)
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-2.5">
                <span className="text-xs font-bold text-[#5C2D91] block">
                  Access &amp; Security Controls
                </span>
                <p className="text-[11px] text-neutral-600">
                  Change password, update 4-digit PIN, or configure Thumb Touch &amp; Eye login.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenLoginAccess) onOpenLoginAccess();
                  }}
                  className="w-full min-h-[46px] py-2.5 text-xs font-bold text-white bg-[#5C2D91] hover:bg-[#4E247D] rounded-2xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>Open Login &amp; Access Control</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: BACKUP & DATA MANAGEMENT */}
          {activeTab === 'backup' && (
            <div className="space-y-3.5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Data Backup &amp; Offline Portability
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Download or restore the muster roll and advance records.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleExport}
                  className="min-h-[48px] flex items-center justify-center gap-1.5 p-3 bg-purple-50 hover:bg-purple-100 text-[#5C2D91] rounded-2xl text-xs font-bold transition-colors border border-purple-200 cursor-pointer shadow-2xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Export JSON</span>
                </button>

                <label className="min-h-[48px] flex items-center justify-center gap-1.5 p-3 bg-purple-50 hover:bg-purple-100 text-[#5C2D91] rounded-2xl text-xs font-bold transition-colors border border-purple-200 cursor-pointer shadow-2xs">
                  <Upload className="w-4 h-4" />
                  <span>Import JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {onOpenApkStudio && (
                <div className="p-3.5 bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-purple-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#5C2D91]" />
                    <span className="text-xs font-bold text-[#5C2D91]">
                      Android Studio APK &amp; App Bundle (.aab)
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600">
                    Download the ready-to-build Gradle &amp; Kotlin Android Studio project ZIP for APK or Play Store .aab bundles.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenApkStudio();
                    }}
                    className="w-full min-h-[44px] py-2 text-xs font-bold text-white bg-[#5C2D91] hover:bg-[#4E247D] rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Open Android Studio Builder</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="pt-2">
                {confirmReset ? (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-2.5">
                    <p className="text-xs font-bold text-rose-800">
                      Reset all labourers, attendance, and advances to default demo data?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmReset(false)}
                        className="flex-1 min-h-[42px] py-2 rounded-xl bg-white border border-neutral-200 text-xs font-bold text-neutral-700 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onResetData();
                          setConfirmReset(false);
                          onClose();
                        }}
                        className="flex-1 min-h-[42px] py-2 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
                      >
                        Confirm Reset
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="w-full min-h-[46px] flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors border border-rose-200 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset to Default Demo Data</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
