/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Labour, 
  AttendanceRecord, 
  AdvanceTransaction, 
  AppSettings, 
  ActiveTab,
  LabourWageSummary,
  Worksite,
  UserSession 
} from './types';
import { 
  loadLabourers, 
  saveLabourers, 
  loadAttendance, 
  saveAttendance, 
  loadAdvances, 
  saveAdvances, 
  loadSettings, 
  saveSettings, 
} from './utils/storage';
import {
  getBackendAuthStatus,
  logoutBackendSession,
  mapBackendUserToSession,
} from './utils/authApi';
import { toDateStr } from './utils/calculations';
import { AndroidHeader } from './components/AndroidHeader';
import { AndroidBottomNav } from './components/AndroidBottomNav';
import { HomeDashboardView } from './components/HomeDashboardView';
import { DailyAttendanceView } from './components/DailyAttendanceView';
import { PaymentsAdvancesView } from './components/PaymentsAdvancesView';
import { MarkTodayView } from './components/MarkTodayView';
import { PayrollCalculatorView } from './components/PayrollCalculatorView';
import { LabourDirectoryView } from './components/LabourDirectoryView';
import { AdvancesLedgerView } from './components/AdvancesLedgerView';
import { ApkStudioView } from './components/ApkStudioView';
import { LabourModal } from './components/LabourModal';
import { AdvanceModal } from './components/AdvanceModal';
import { PayslipModal } from './components/PayslipModal';
import { SettingsModal } from './components/SettingsModal';
import { WorksiteSwitcherModal } from './components/WorksiteSwitcherModal';
import { LoginAccessModal } from './components/LoginAccessModal';
import { LoginLockScreen } from './components/LoginLockScreen';
import { OfflineIndicator } from './components/OfflineIndicator';

import { INITIAL_LABOURERS, DEFAULT_SETTINGS } from './utils/seedData';

export default function App() {
  const [labourers, setLabourers] = useState<Labour[]>(() => {
    try {
      return loadLabourers();
    } catch {
      return INITIAL_LABOURERS;
    }
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    try {
      return loadAttendance();
    } catch {
      return [];
    }
  });

  const [advances, setAdvances] = useState<AdvanceTransaction[]>(() => {
    try {
      return loadAdvances();
    } catch {
      return [];
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      return loadSettings();
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedDate, setSelectedDate] = useState<string>(toDateStr(new Date()));

  // Modals state
  const [isLabourModalOpen, setIsLabourModalOpen] = useState(false);
  const [editingLabour, setEditingLabour] = useState<Labour | null>(null);

  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [preselectedLabourId, setPreselectedLabourId] = useState<string | undefined>(undefined);

  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [selectedSlipSummary, setSelectedSlipSummary] = useState<LabourWageSummary | null>(null);
  const [slipPeriodLabel, setSlipPeriodLabel] = useState<string>('');

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isWorksiteSwitcherOpen, setIsWorksiteSwitcherOpen] = useState(false);
  const [isLoginAccessOpen, setIsLoginAccessOpen] = useState(false);

  const [authReady, setAuthReady] = useState<boolean>(false);
  const [hasBackendAccount, setHasBackendAccount] = useState<boolean | undefined>(undefined);
  const [isAppUnlocked, setIsAppUnlocked] = useState<boolean>(false);

  // Initial load + backend single-owner session check
  useEffect(() => {
    setLabourers(loadLabourers());
    setAttendance(loadAttendance());
    setAdvances(loadAdvances());
    setSettings(loadSettings());

    let mounted = true;
    (async () => {
      try {
        const status = await getBackendAuthStatus();
        if (!mounted) return;
        setHasBackendAccount(status.hasAccount);
        if (status.authenticated && status.user) {
          const syncedSession = mapBackendUserToSession(status.user);
          setSettings((prev) => {
            const next = { ...prev, userSession: syncedSession };
            saveSettings(next);
            return next;
          });
          setIsAppUnlocked(true);
        } else {
          setIsAppUnlocked(false);
        }
      } catch {
        if (mounted) setIsAppUnlocked(false);
      } finally {
        if (mounted) setAuthReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Optional auto-lock when app goes to background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && settings.userSession?.lockOnBackground && isAppUnlocked) {
        void logoutBackendSession();
        setIsAppUnlocked(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [settings.userSession?.lockOnBackground, isAppUnlocked]);

  const handleUnlockApp = (updatedSession?: UserSession) => {
    if (updatedSession) {
      setSettings((prev) => {
        const next = { ...prev, userSession: updatedSession };
        saveSettings(next);
        return next;
      });
    }
    setHasBackendAccount(true);
    setIsAppUnlocked(true);
  };

  const handleLockNow = () => {
    void logoutBackendSession();
    setIsAppUnlocked(false);
  };

  const handleOwnerReset = () => {
    setHasBackendAccount(false);
    setIsAppUnlocked(false);
  };

  // Multi-worksite filtering
  const isAllWorksites = settings.activeWorksiteId === 'all';

  const displayedLabourers = useMemo(() => {
    if (isAllWorksites) return labourers;
    return labourers.filter((l) => (l.worksiteId || 'site_tower4') === settings.activeWorksiteId);
  }, [labourers, settings.activeWorksiteId, isAllWorksites]);

  const displayedAttendance = useMemo(() => {
    if (isAllWorksites) return attendance;
    const siteLabourIds = new Set(displayedLabourers.map((l) => l.id));
    return attendance.filter((a) => siteLabourIds.has(a.labourId) || a.worksiteId === settings.activeWorksiteId);
  }, [attendance, displayedLabourers, settings.activeWorksiteId, isAllWorksites]);

  const displayedAdvances = useMemo(() => {
    if (isAllWorksites) return advances;
    const siteLabourIds = new Set(displayedLabourers.map((l) => l.id));
    return advances.filter((adv) => siteLabourIds.has(adv.labourId) || adv.worksiteId === settings.activeWorksiteId);
  }, [advances, displayedLabourers, settings.activeWorksiteId, isAllWorksites]);

  // Handlers for Worksites & Supervisor Session
  const handleSelectWorksite = (worksiteId: string, worksiteName: string) => {
    setSettings((prev) => {
      const next = {
        ...prev,
        activeWorksiteId: worksiteId,
        worksiteName: worksiteName,
      };
      saveSettings(next);
      return next;
    });
  };

  const handleAddWorksite = (newWorksite: Worksite) => {
    setSettings((prev) => {
      const updatedWorksites = [...(prev.worksites || []), newWorksite];
      const next = {
        ...prev,
        worksites: updatedWorksites,
        activeWorksiteId: newWorksite.id,
        worksiteName: newWorksite.name,
      };
      saveSettings(next);
      return next;
    });
  };

  const handleUpdateUserSession = (session: UserSession) => {
    setSettings((prev) => {
      const next = {
        ...prev,
        userSession: session,
      };
      saveSettings(next);
      return next;
    });
  };

  // Calculate Today's Total Wage Cost
  const todayWageTotal = useMemo(() => {
    const todayStr = toDateStr(new Date());
    let total = 0;
    const todayRecs = displayedAttendance.filter((r) => r.date === todayStr);
    todayRecs.forEach((rec) => {
      const labour = displayedLabourers.find((l) => l.id === rec.labourId);
      if (!labour) return;
      if (rec.status === 'present') total += labour.dailyWage;
      else if (rec.status === 'half_day') total += labour.dailyWage * 0.5;
      if (rec.overtimeHours > 0) {
        const otRate = labour.overtimeHourlyRate || Math.round(labour.dailyWage / 8);
        total += rec.overtimeHours * otRate;
      }
    });
    return total;
  }, [displayedLabourers, displayedAttendance]);

  // Handlers for Attendance
  const handleUpdateAttendance = (record: AttendanceRecord) => {
    setAttendance((prev) => {
      const idx = prev.findIndex(
        (r) => r.id === record.id || (r.labourId === record.labourId && r.date === record.date)
      );
      let next: AttendanceRecord[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = record;
      } else {
        next = [...prev, record];
      }
      saveAttendance(next);
      return next;
    });
  };

  const handleBulkUpdateAttendance = (records: AttendanceRecord[]) => {
    setAttendance((prev) => {
      const next = [...prev];
      records.forEach((newRec) => {
        const idx = next.findIndex(
          (r) => r.id === newRec.id || (r.labourId === newRec.labourId && r.date === newRec.date)
        );
        if (idx >= 0) {
          next[idx] = newRec;
        } else {
          next.push(newRec);
        }
      });
      saveAttendance(next);
      return next;
    });
  };

  const handleQuickMarkAll = (status: 'present' | 'absent') => {
    const todayStr = toDateStr(new Date());
    const newRecords: AttendanceRecord[] = displayedLabourers
      .filter((l) => l.status === 'active')
      .map((l) => ({
        id: `${l.id}_${todayStr}`,
        labourId: l.id,
        date: todayStr,
        status,
        overtimeHours: 0,
        worksiteId: l.worksiteId || settings.activeWorksiteId,
        siteLocation: settings.worksiteName,
        notes: '',
        updatedAt: new Date().toISOString(),
      }));

    handleBulkUpdateAttendance(newRecords);
  };

  // Handlers for Labourers
  const handleSaveLabour = (labour: Labour) => {
    const assignedWorksiteId = labour.worksiteId || (isAllWorksites ? (settings.worksites[0]?.id || 'site_tower4') : settings.activeWorksiteId);
    const enrichedLabour: Labour = {
      ...labour,
      worksiteId: assignedWorksiteId,
    };

    setLabourers((prev) => {
      const idx = prev.findIndex((l) => l.id === enrichedLabour.id);
      let next: Labour[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = enrichedLabour;
      } else {
        next = [enrichedLabour, ...prev];
      }
      saveLabourers(next);
      return next;
    });
  };

  const handleDeleteLabour = (labourId: string) => {
    setLabourers((prev) => {
      const next = prev.filter((l) => l.id !== labourId);
      saveLabourers(next);
      return next;
    });
  };

  const handleQuickUpdateWage = (labourId: string, dailyWage: number, otRate: number) => {
    setLabourers((prev) => {
      const next = prev.map((l) => {
        if (l.id === labourId) {
          return {
            ...l,
            dailyWage,
            overtimeHourlyRate: otRate,
          };
        }
        return l;
      });
      saveLabourers(next);
      return next;
    });
  };

  // Handlers for Advances & Deductions
  const handleSaveAdvance = (tx: AdvanceTransaction) => {
    const enrichedTx: AdvanceTransaction = {
      ...tx,
      worksiteId: tx.worksiteId || settings.activeWorksiteId,
    };
    setAdvances((prev) => {
      const next = [enrichedTx, ...prev];
      saveAdvances(next);
      return next;
    });
  };

  const handleDeleteAdvance = (id: string) => {
    setAdvances((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveAdvances(next);
      return next;
    });
  };

  // Handlers for Settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Modal openers
  const handleOpenAddLabour = () => {
    setEditingLabour(null);
    setIsLabourModalOpen(true);
  };

  const handleEditLabour = (labour: Labour) => {
    setEditingLabour(labour);
    setIsLabourModalOpen(true);
  };

  const handleOpenAdvanceModal = (labourId?: string) => {
    setPreselectedLabourId(labourId);
    setIsAdvanceModalOpen(true);
  };

  const handleOpenPayslip = (summary: LabourWageSummary, periodLabel: string) => {
    setSelectedSlipSummary(summary);
    setSlipPeriodLabel(periodLabel);
    setIsPayslipModalOpen(true);
  };

  const activeWorkersCount = displayedLabourers.filter((l) => l.status === 'active').length;

  if (!authReady || !isAppUnlocked) {
    return (
      <LoginLockScreen
        settings={settings}
        onUnlock={handleUnlockApp}
        initialHasAccount={hasBackendAccount}
      />
    );
  }

  return (
    <div className="fixed inset-0 w-full bg-[#EAEBF2] text-neutral-900 flex justify-center font-sans transition-colors antialiased select-none overflow-hidden">
      {/* Main Mobile Screen Container */}
      <div className="w-full max-w-md h-full min-h-0 flex flex-col bg-[#F3F4F8] shadow-2xl relative overflow-hidden">
        {/* Fixed Top App Header */}
        <AndroidHeader
          settings={settings}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenWorksiteSwitcher={() => setIsWorksiteSwitcherOpen(true)}
          onOpenLoginAccess={() => setIsLoginAccessOpen(true)}
          onLockNow={handleLockNow}
        />

        {/* Scrollable Inbetween Content Area */}
        <main className="flex-1 min-h-0 w-full overflow-y-auto px-3 py-3 pb-4 overscroll-y-contain touch-scroll">
          {activeTab === 'home' && (
            <HomeDashboardView
              labourers={displayedLabourers}
              attendance={displayedAttendance}
              advances={displayedAdvances}
              settings={settings}
              setActiveTab={setActiveTab}
              onOpenAddLabour={handleOpenAddLabour}
              onOpenAdvanceModal={handleOpenAdvanceModal}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
              onOpenWorksiteSwitcher={() => setIsWorksiteSwitcherOpen(true)}
              onQuickMarkAll={handleQuickMarkAll}
            />
          )}

          {activeTab === 'attendance' && (
            <PaymentsAdvancesView
              advances={displayedAdvances}
              labourers={displayedLabourers}
              attendance={displayedAttendance}
              onOpenAdvanceModal={handleOpenAdvanceModal}
              onDeleteTransaction={handleDeleteAdvance}
              settings={settings}
            />
          )}

          {activeTab === 'mark-today' && (
            <MarkTodayView
              labourers={displayedLabourers}
              attendance={displayedAttendance}
              onUpdateAttendance={handleUpdateAttendance}
              onBulkUpdateAttendance={handleBulkUpdateAttendance}
              onOpenAdvanceModal={handleOpenAdvanceModal}
              settings={settings}
            />
          )}

          {activeTab === 'payroll' && (
            <PayrollCalculatorView
              labourers={displayedLabourers}
              attendance={displayedAttendance}
              advances={displayedAdvances}
              settings={settings}
              onOpenPayslip={handleOpenPayslip}
              onOpenAdvanceModal={handleOpenAdvanceModal}
            />
          )}

          {activeTab === 'labourers' && (
            <LabourDirectoryView
              labourers={displayedLabourers}
              onOpenAddLabour={handleOpenAddLabour}
              onEditLabour={handleEditLabour}
              onDeleteLabour={handleDeleteLabour}
              onQuickUpdateWage={handleQuickUpdateWage}
              settings={settings}
            />
          )}

          {activeTab === 'advances' && (
            <PaymentsAdvancesView
              advances={displayedAdvances}
              labourers={displayedLabourers}
              attendance={displayedAttendance}
              onOpenAdvanceModal={handleOpenAdvanceModal}
              onDeleteTransaction={handleDeleteAdvance}
              settings={settings}
            />
          )}

          {activeTab === 'apk-studio' && (
            <ApkStudioView onBackToHome={() => setActiveTab('home')} />
          )}
        </main>

        {/* Android Bottom Navigation Bar */}
        <AndroidBottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onQuickRollCall={() => handleQuickMarkAll('present')}
          activeLabourCount={activeWorkersCount}
        />
      </div>

      {/* Modals */}
      <LabourModal
        isOpen={isLabourModalOpen}
        onClose={() => setIsLabourModalOpen(false)}
        onSave={handleSaveLabour}
        initialLabour={editingLabour}
        settings={settings}
      />

      <AdvanceModal
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        onSave={handleSaveAdvance}
        labourers={displayedLabourers.length > 0 ? displayedLabourers : labourers}
        preselectedLabourId={preselectedLabourId}
        settings={settings}
      />

      <PayslipModal
        isOpen={isPayslipModalOpen}
        onClose={() => setIsPayslipModalOpen(false)}
        summary={selectedSlipSummary}
        settings={settings}
        periodLabel={slipPeriodLabel}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        labourers={labourers}
        onOpenLoginAccess={() => setIsLoginAccessOpen(true)}
        onOpenApkStudio={() => setActiveTab('apk-studio')}
      />

      <WorksiteSwitcherModal
        isOpen={isWorksiteSwitcherOpen}
        onClose={() => setIsWorksiteSwitcherOpen(false)}
        settings={settings}
        labourers={labourers}
        onSelectWorksite={handleSelectWorksite}
        onAddWorksite={handleAddWorksite}
      />

      <LoginAccessModal
        isOpen={isLoginAccessOpen}
        onClose={() => setIsLoginAccessOpen(false)}
        settings={settings}
        onUpdateSession={handleUpdateUserSession}
        onLockNow={handleLockNow}
        onOwnerReset={handleOwnerReset}
      />

      {/* Offline Connectivity Notification */}
      <OfflineIndicator />
    </div>
  );
}
