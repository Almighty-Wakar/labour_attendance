import React from 'react';
import { ActiveTab } from '../types';
import {
  Home,
  CreditCard,
  CheckCheck,
  Banknote,
  Users,
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface AndroidBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onQuickRollCall: () => void;
  activeLabourCount: number;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({
  activeTab,
  setActiveTab,
  activeLabourCount,
}) => {
  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'attendance', label: 'Payments', icon: CreditCard },
    { id: 'mark-today', label: 'Attendance', icon: CheckCheck },
    { id: 'payroll', label: 'Wages', icon: Banknote },
    { id: 'labourers', label: 'Labourers', icon: Users, badge: activeLabourCount },
  ];

  return (
    <footer className="shrink-0 z-40 w-full bg-white/95 backdrop-blur-md border-t border-purple-100 shadow-[0_-4px_18px_rgba(92,45,145,0.06)] select-none no-print pb-[max(8px,env(safe-area-inset-bottom))]">
      <nav
        aria-label="Android Bottom Navigation"
        className="w-full px-1 pt-1.5 pb-1 grid grid-cols-5 items-center"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeTab === item.id ||
            (item.id === 'attendance' && activeTab === 'advances');
          const isCenterAction = item.id === 'mark-today';

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                triggerHaptic();
                setActiveTab(item.id);
              }}
              className="flex flex-col items-center justify-center min-h-[52px] min-w-0 px-0.5 cursor-pointer group active:scale-95 transition-transform"
            >
              {/* Material 3 Active Pill Indicator */}
              <span
                className={`relative flex items-center justify-center rounded-full transition-all duration-150 ${
                  isCenterAction
                    ? isActive
                      ? 'w-14 h-8 bg-[#5C2D91] text-white shadow-sm'
                      : 'w-14 h-8 bg-[#5C2D91]/12 text-[#5C2D91] group-hover:bg-[#5C2D91]/20'
                    : isActive
                    ? 'w-14 h-8 bg-[#5C2D91]/14 text-[#5C2D91]'
                    : 'w-12 h-8 text-neutral-500 group-hover:text-neutral-800'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? 'stroke-[2.4]' : 'stroke-[1.9]'
                  }`}
                />

                {typeof item.badge === 'number' && (
                  <span className="absolute -top-0.5 right-1.5 px-1 min-w-[16px] h-[16px] bg-pink-600 text-white font-bold text-[9px] rounded-full flex items-center justify-center tabular-nums leading-none ring-2 ring-white">
                    {item.badge}
                  </span>
                )}
              </span>

              <span
                className={`text-[11px] leading-tight mt-1 truncate max-w-full ${
                  isActive
                    ? 'font-extrabold text-[#5C2D91]'
                    : isCenterAction
                    ? 'font-bold text-neutral-700'
                    : 'font-medium text-neutral-600'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </footer>
  );
};
