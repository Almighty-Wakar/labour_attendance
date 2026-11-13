import React, { useEffect, useState } from 'react';
import { AppSettings, Labour, Worksite } from '../types';
import {
  X,
  Save,
  Building2,
  Plus,
  MapPin,
  Check,
  ShieldCheck,
  Sliders,
  Briefcase,
  ChevronRight,
  Smartphone,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  labourers: Labour[];
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
  labourers,
  onOpenLoginAccess,
  onOpenApkStudio,
}) => {
  const [activeTab, setActiveTab] = useState<'worksites' | 'company' | 'access'>('worksites');
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [savedNotice, setSavedNotice] = useState('');

  // Inline new worksite state
  const [showAddSite, setShowAddSite] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteLocation, setNewSiteLocation] = useState('');
  const [newSiteClient, setNewSiteClient] = useState('');
  const [newSiteSupervisor, setNewSiteSupervisor] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...settings });
      setSavedNotice('');
      setShowAddSite(false);
    }
  }, [isOpen, settings]);

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

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    onClose();
  };

  const handleSwitchWorksite = (siteId: string, siteName: string) => {
    const updated = {
      ...formData,
      activeWorksiteId: siteId,
      worksiteName: siteName,
    };
    setFormData(updated);
    onSaveSettings(updated);
    setSavedNotice(`Active site switched to ${siteName}`);
    setTimeout(() => setSavedNotice(''), 2200);
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
    setSavedNotice(`Created and switched to ${newSite.name}`);
    setTimeout(() => setSavedNotice(''), 2500);
  };

  const getWorkerCountForSite = (siteId: string) =>
    labourers.filter((l) => l.worksiteId === siteId && l.status === 'active').length;

  const totalActiveWorkers = labourers.filter((l) => l.status === 'active').length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92%] pb-[max(8px,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Bottom Sheet Handle & Purple Header */}
        <div className="px-5 pt-2.5 pb-4 bg-gradient-to-br from-[#5C2D91] via-[#4D227E] to-[#381461] text-white shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/30 mx-auto mb-3 sm:hidden" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center text-white shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-extrabold text-white leading-tight truncate">
                  Worksite &amp; App Settings
                </h2>
                <p className="text-xs text-purple-200/90 mt-0.5 truncate">
                  {formData.worksiteName} &middot; {formData.currency}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-11 h-11 rounded-2xl hover:bg-white/15 active:bg-white/20 flex items-center justify-center text-white/85 hover:text-white transition-colors cursor-pointer shrink-0"
              aria-label="Close settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Clean 3-Tab Segmented Control (No Backup Tab) */}
        <div className="p-2 bg-[#F3F4F8] border-b border-neutral-200/80 shrink-0">
          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('worksites')}
              className={`min-h-[44px] px-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
                activeTab === 'worksites'
                  ? 'bg-white text-[#5C2D91] shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <span>Worksites</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('company')}
              className={`min-h-[44px] px-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
                activeTab === 'company'
                  ? 'bg-white text-[#5C2D91] shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Briefcase className="w-4 h-4 shrink-0" />
              <span>Company</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('access')}
              className={`min-h-[44px] px-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
                activeTab === 'access'
                  ? 'bg-white text-[#5C2D91] shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Access</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto overscroll-y-contain space-y-4">
          {savedNotice && (
            <div className="px-3.5 py-2.5 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold rounded-2xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{savedNotice}</span>
            </div>
          )}

          {/* TAB 1: WORKSITES */}
          {activeTab === 'worksites' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-neutral-900">
                    Active Project Sites
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {formData.worksites?.length || 0} registered &middot; tap to switch view
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddSite(!showAddSite)}
                  className="min-h-[44px] px-4 py-2 text-xs font-bold text-white bg-[#5C2D91] hover:bg-[#4E247D] active:scale-[0.98] rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showAddSite ? 'Close Form' : 'New Site'}</span>
                </button>
              </div>

              {showAddSite && (
                <form
                  onSubmit={handleAddNewWorksite}
                  className="p-4 bg-[#F7F5FB] border border-purple-200/80 rounded-2xl space-y-3"
                >
                  <span className="text-xs font-bold text-[#5C2D91] block">
                    Add New Worksite
                  </span>
                  <input
                    type="text"
                    placeholder="Site Name (e.g. Ring Road Tower)"
                    value={newSiteName}
                    onChange={(e) => setNewSiteName(e.target.value)}
                    required
                    className="w-full min-h-[44px] px-3.5 py-2 text-xs bg-white border border-neutral-200 focus:border-[#5C2D91] rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]/20"
                  />
                  <input
                    type="text"
                    placeholder="Location / City (e.g. Balkhu, Kathmandu)"
                    value={newSiteLocation}
                    onChange={(e) => setNewSiteLocation(e.target.value)}
                    required
                    className="w-full min-h-[44px] px-3.5 py-2 text-xs bg-white border border-neutral-200 focus:border-[#5C2D91] rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]/20"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      placeholder="Client Name (Optional)"
                      value={newSiteClient}
                      onChange={(e) => setNewSiteClient(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 text-xs bg-white border border-neutral-200 focus:border-[#5C2D91] rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]/20"
                    />
                    <input
                      type="text"
                      placeholder="Site In-Charge (Optional)"
                      value={newSiteSupervisor}
                      onChange={(e) => setNewSiteSupervisor(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 text-xs bg-white border border-neutral-200 focus:border-[#5C2D91] rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]/20"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full min-h-[46px] py-2.5 text-xs font-bold text-white bg-[#5C2D91] hover:bg-[#4E247D] rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create &amp; Set Active</span>
                  </button>
                </form>
              )}

              {/* Clean Hairline List of Worksites */}
              <div className="border border-neutral-200/80 rounded-2xl divide-y divide-neutral-100 overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => handleSwitchWorksite('all', 'All Worksites')}
                  className={`w-full min-h-[60px] flex items-center justify-between px-4 py-3 text-left transition-colors cursor-pointer ${
                    formData.activeWorksiteId === 'all'
                      ? 'bg-purple-50/75'
                      : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        formData.activeWorksiteId === 'all'
                          ? 'bg-[#5C2D91] text-white'
                          : 'bg-purple-50 text-[#5C2D91]'
                      }`}
                    >
                      <Building2 className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-neutral-900 block truncate">
                        All Worksites Combined
                      </span>
                      <span className="text-[11px] text-neutral-500 block truncate">
                        Combined roster &middot; <span className="font-mono tabular-nums">{totalActiveWorkers}</span> active workers
                      </span>
                    </div>
                  </div>
                  {formData.activeWorksiteId === 'all' && (
                    <span className="text-[11px] font-bold text-[#5C2D91] flex items-center gap-1 shrink-0 ml-2">
                      <Check className="w-4 h-4" />
                      <span>Active</span>
                    </span>
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
                      className={`w-full min-h-[60px] flex items-center justify-between px-4 py-3 text-left transition-colors cursor-pointer ${
                        isActive ? 'bg-purple-50/75' : 'hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isActive
                              ? 'bg-[#5C2D91] text-white'
                              : 'bg-purple-50 text-[#5C2D91]'
                          }`}
                        >
                          <MapPin className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-neutral-900 block truncate">
                            {site.name}
                          </span>
                          <span className="text-[11px] text-neutral-500 block truncate">
                            {site.location} &middot; <span className="font-mono tabular-nums">{count}</span> workers
                            {site.supervisorName ? ` · ${site.supervisorName}` : ''}
                          </span>
                        </div>
                      </div>

                      {isActive ? (
                        <span className="text-[11px] font-bold text-[#5C2D91] flex items-center gap-1 shrink-0">
                          <Check className="w-4 h-4" />
                          <span>Current</span>
                        </span>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-neutral-300 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: COMPANY & PAYROLL PARAMETERS */}
          {activeTab === 'company' && (
            <div className="space-y-4">
              <form noValidate onSubmit={handleSaveCompany} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Contractor / Company Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 py-2 text-xs font-medium bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-[#5C2D91] rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Worksite Header Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.worksiteName}
                    onChange={(e) => setFormData({ ...formData, worksiteName: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 py-2 text-xs font-medium bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-[#5C2D91] rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1">
                      Currency
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => handleCurrencyChange(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 text-xs font-medium bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-[#5C2D91] rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]/20 cursor-pointer"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1">
                      Standard Shift Hours
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      step="any"
                      value={formData.defaultShiftHours}
                      onChange={(e) =>
                        setFormData({ ...formData, defaultShiftHours: Number(e.target.value) || 8 })
                      }
                      className="w-full min-h-[44px] px-3.5 py-2 text-xs font-bold bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-[#5C2D91] rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]/20 font-mono tabular-nums"
                    />
                  </div>
                </div>

                <div className="px-3.5 py-3 bg-[#F7F5FB] rounded-xl flex items-center justify-between text-xs border border-purple-100">
                  <span className="text-neutral-600 font-medium">Sample Daily Wage Display</span>
                  <span className="font-bold text-[#5C2D91] font-mono tabular-nums">
                    {formData.currencySymbol} 1,400 / day
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[48px] flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-white bg-[#5C2D91] hover:bg-[#4E247D] active:scale-[0.99] rounded-2xl transition-all shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Company Settings</span>
                </button>
              </form>

              {onOpenApkStudio && (
                <div className="pt-3 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenApkStudio();
                    }}
                    className="w-full min-h-[56px] px-3.5 py-2.5 rounded-2xl border border-neutral-200 hover:bg-neutral-50 transition-colors flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#5C2D91] flex items-center justify-center shrink-0">
                        <Smartphone className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-neutral-900 block truncate">
                          Android Studio APK &amp; Bundle (.aab)
                        </span>
                        <span className="text-[11px] text-neutral-500 block truncate">
                          Export Gradle project ZIP for Android build
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACCOUNT & ACCESS CONTROL */}
          {activeTab === 'access' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#F7F5FB] rounded-2xl border border-purple-100 flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#5C2D91] text-white flex items-center justify-center font-extrabold text-sm shrink-0">
                  {(formData.userSession?.userName || 'OW').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-neutral-900 truncate">
                    {formData.userSession?.userName || 'Account Holder'}
                  </h4>
                  <p className="text-xs text-neutral-500 truncate mt-0.5">
                    {formData.userSession?.email || formData.userSession?.phone || 'Single-owner account'}
                  </p>
                  <p className="text-[11px] text-[#5C2D91] font-semibold mt-1">
                    {formData.userSession?.hasPassword ? 'Password + 4-Digit PIN enabled' : '4-Digit PIN & Biometrics enabled'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenLoginAccess) onOpenLoginAccess();
                }}
                className="w-full min-h-[56px] px-4 py-3 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-2xl flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#5C2D91] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-neutral-900 block">
                      Login &amp; Access Control
                    </span>
                    <span className="text-[11px] text-neutral-500 block truncate">
                      Update password, 4-digit PIN, Thumb &amp; Eye login
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
