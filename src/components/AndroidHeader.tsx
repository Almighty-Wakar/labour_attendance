import React from 'react';
import { AppSettings } from '../types';
import { Settings, ShieldCheck, Building2, ChevronDown, UserCheck } from 'lucide-react';

interface AndroidHeaderProps {
  settings: AppSettings;
  onOpenSettings: () => void;
  onOpenWorksiteSwitcher: () => void;
  onOpenLoginAccess: () => void;
}

export const AndroidHeader: React.FC<AndroidHeaderProps> = ({
  settings,
  onOpenSettings,
  onOpenWorksiteSwitcher,
  onOpenLoginAccess,
}) => {
  const userInitials = (settings.userSession?.userName || 'RS')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const activeWorksiteLabel = settings.activeWorksiteId === 'all' 
    ? 'All Worksites' 
    : settings.worksiteName;

  return (
    <header className="shrink-0 z-30 w-full bg-gradient-to-r from-[#5C2D91] via-[#522482] to-[#42176E] text-white py-2.5 px-3.5 rounded-b-2xl shadow-md select-none">
      <div className="flex items-center justify-between gap-2">
        {/* Company & Interactive Worksite Switcher */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={onOpenLoginAccess}
              className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center font-bold text-xs tracking-wide text-white shadow-xs hover:bg-white/30 transition-all cursor-pointer"
              title="Supervisor Access & Profile"
              aria-label="Supervisor Access"
            >
              {userInitials}
            </button>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#5C2D91] flex items-center justify-center shadow-2xs">
              <ShieldCheck className="w-2.5 h-2.5 text-[#5C2D91]" />
            </span>
          </div>

          <div className="min-w-0 leading-tight">
            <span className="text-xs sm:text-sm font-extrabold text-white tracking-tight truncate block">
              {settings.companyName}
            </span>

            {/* Interactive Worksite Pill Switcher */}
            <button
              type="button"
              onClick={onOpenWorksiteSwitcher}
              className="inline-flex items-center gap-1.5 mt-0.5 px-2 py-0.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-medium transition-colors cursor-pointer max-w-[190px] sm:max-w-xs border border-white/10"
              title="Click to switch worksite"
            >
              <Building2 className="w-3 h-3 text-purple-200 shrink-0" />
              <span className="truncate">{activeWorksiteLabel}</span>
              <ChevronDown className="w-3 h-3 text-white/70 shrink-0" />
            </button>
          </div>
        </div>

        {/* Right Action Icons: Supervisor / Security & Settings */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onOpenLoginAccess}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/90 transition-colors cursor-pointer"
            title="Supervisor & Role Access"
            aria-label="Supervisor Access"
          >
            <UserCheck className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/90 transition-colors cursor-pointer"
            title="Settings & Worksites"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
