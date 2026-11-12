import React from 'react';
import { ActiveTab } from '../types';
import { 
  Home, 
  CreditCard, 
  CheckCheck,
  Banknote,
  Users
} from 'lucide-react';

interface AndroidBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onQuickRollCall: () => void;
  activeLabourCount: number;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onQuickRollCall,
  activeLabourCount,
}) => {
  return (
    <footer className="shrink-0 z-40 w-full bg-white border-t border-purple-100/90 shadow-[0_-4px_20px_rgba(92,45,145,0.06)] select-none no-print overflow-visible">
      <div className="w-full px-4 h-16 flex items-center justify-between relative">
        {/* Tab 1: Home */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors cursor-pointer min-h-[44px] ${
            activeTab === 'home'
              ? 'text-[#5C2D91]'
              : 'text-neutral-400 hover:text-neutral-700'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className={`text-[10px] mt-0.5 ${activeTab === 'home' ? 'font-bold' : 'font-medium'}`}>
            Home
          </span>
          {activeTab === 'home' && (
            <span className="w-1.5 h-1 rounded-full bg-[#5C2D91] mt-0.5" />
          )}
        </button>

        {/* Tab 2: Payments & Advances */}
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors cursor-pointer min-h-[44px] ${
            activeTab === 'attendance'
              ? 'text-[#5C2D91]'
              : 'text-neutral-400 hover:text-neutral-700'
          }`}
        >
          <CreditCard className={`w-5 h-5 ${activeTab === 'attendance' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className={`text-[10px] mt-0.5 ${activeTab === 'attendance' ? 'font-bold' : 'font-medium'}`}>
            Payments
          </span>
          {activeTab === 'attendance' && (
            <span className="w-1.5 h-1 rounded-full bg-[#5C2D91] mt-0.5" />
          )}
        </button>

        {/* Center Floating Action Button (Android Khalti Style) */}
        <div className="flex-1 flex flex-col items-center justify-center relative -top-4">
          <button
            onClick={() => setActiveTab('mark-today')}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl ring-4 ring-white active:scale-95 transition-all group cursor-pointer ${
              activeTab === 'mark-today'
                ? 'bg-[#3E1A66] text-white ring-purple-300'
                : 'bg-[#5C2D91] hover:bg-[#4E247D] text-white'
            }`}
            title="Attendance & Individual Labour Records"
          >
            <CheckCheck className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          </button>
          <span className={`text-[10px] mt-1 tracking-tight ${activeTab === 'mark-today' ? 'font-black text-[#5C2D91]' : 'font-bold text-neutral-600'}`}>
            Attendance
          </span>
          {activeTab === 'mark-today' && (
            <span className="w-1.5 h-1 rounded-full bg-[#5C2D91] mt-0.5" />
          )}
        </div>

        {/* Tab 4: Wages & Payroll Cards */}
        <button
          onClick={() => setActiveTab('payroll')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors cursor-pointer min-h-[44px] ${
            activeTab === 'payroll'
              ? 'text-[#5C2D91]'
              : 'text-neutral-400 hover:text-neutral-700'
          }`}
        >
          <Banknote className={`w-5 h-5 ${activeTab === 'payroll' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className={`text-[10px] mt-0.5 ${activeTab === 'payroll' ? 'font-bold' : 'font-medium'}`}>
            Wages
          </span>
          {activeTab === 'payroll' && (
            <span className="w-1.5 h-1 rounded-full bg-[#5C2D91] mt-0.5" />
          )}
        </button>

        {/* Tab 5: Labour Roster */}
        <button
          onClick={() => setActiveTab('labourers')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors relative cursor-pointer min-h-[44px] ${
            activeTab === 'labourers'
              ? 'text-[#5C2D91]'
              : 'text-neutral-400 hover:text-neutral-700'
          }`}
        >
          <Users className={`w-5 h-5 ${activeTab === 'labourers' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className={`text-[10px] mt-0.5 ${activeTab === 'labourers' ? 'font-bold' : 'font-medium'}`}>
            Labourers
          </span>
          {activeTab === 'labourers' && (
            <span className="w-1.5 h-1 rounded-full bg-[#5C2D91] mt-0.5" />
          )}
          <span className="absolute top-1 right-3 px-1 min-w-[14px] h-[14px] bg-pink-600 text-white font-bold text-[8px] rounded-full flex items-center justify-center">
            {activeLabourCount}
          </span>
        </button>
      </div>
    </footer>
  );
};
