import React from 'react';
import { AppSettings } from '../types';
import { Settings, ShieldCheck, Building2, ChevronDown, Lock } from 'lucide-react';

interface AndroidHeaderProps {
  settings: AppSettings;
  onOpenSettings: () => void;
  onOpenWorksiteSwitcher: () => void;
  onOpenLoginAccess: () => void;
  onLockNow?: () => void;
}

export const AndroidHeader: React.FC<AndroidHeaderProps> = ({
  settings,
  onOpenSettings,
  onOpenWorksiteSwitcher,
  onOpenLoginAccess,
  onLockNow,
}) => {
  const userInitials = (settings.userSession?.userName || 'RS')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const activeWorksiteLabel =
    settings.activeWorksiteId === 'all' ? 'All Worksites' : settings.worksiteName;

  return (
    <header className="shrink-0 z-30 w-full bg-gradient-to-r from-[#5C2D91] via-[#512283] to-[#3E166A] text-white pt-[max(10px,env(safe-area-inset-top))] pb-2.5 px-3.5 shadow-md select-none">
      <div className="flex items-center justify-between gap-2 min-h-[48px]">
        {/* User Avatar + Company Title + Worksite Switcher */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            type="button"
            onClick={onOpenLoginAccess}
            className="relative shrink-0 w-11 h-11 rounded-full bg-white/15 border border-white/30 flex items-center justify-center font-bold text-xs tracking-wide text-white hover:bg-white/25 active:scale-95 transition-all cursor-pointer"
            title="Supervisor Access & Profile"
            aria-label="Supervisor Access & Profile"
          >
            {userInitials}
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#5C2D91] flex items-center justify-center">
              <ShieldCheck className="w-2.5 h-2.5 text-[#3E166A]" />
            </span>
          </button>

          <div className="min-w-0 flex-1 leading-tight">
            <span className="text-[13px] font-extrabold text-white tracking-tight truncate block">
              {settings.companyName}
            </span>

            <button
              type="button"
              onClick={onOpenWorksiteSwitcher}
              className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-lg bg-white/15 hover:bg-white/25 active:scale-[0.98] text-white text-[11px] font-semibold transition-all cursor-pointer max-w-full border border-white/10"
              title="Tap to change worksite"
            >
              <Building2 className="w-3 h-3 text-purple-200 shrink-0" />
              <span className="truncate">{activeWorksiteLabel}</span>
              <ChevronDown className="w-3 h-3 text-white/80 shrink-0" />
            </button>
          </div>
        </div>

        {/* Android Top Bar Action Icons (>= 44px touch targets) */}
        <div className="flex items-center gap-1 shrink-0">
          {onLockNow && (
            <button
              type="button"
              onClick={onLockNow}
              className="w-11 h-11 rounded-full hover:bg-white/15 active:bg-white/25 flex items-center justify-center text-white/90 transition-colors cursor-pointer"
              title="Lock App"
              aria-label="Lock App"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onOpenSettings}
            className="w-11 h-11 rounded-full hover:bg-white/15 active:bg-white/25 flex items-center justify-center text-white/90 transition-colors cursor-pointer"
            title="Worksite & App Settings"
            aria-label="Worksite & App Settings"
          >
            <Settings className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
