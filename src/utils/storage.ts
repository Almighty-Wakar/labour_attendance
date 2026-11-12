import { Labour, AttendanceRecord, AdvanceTransaction, AppSettings } from '../types';
import { INITIAL_LABOURERS, DEFAULT_SETTINGS } from './seedData';
import { toDateStr } from './calculations';

const KEYS = {
  LABOURERS: 'labour_app_labourers_v2',
  ATTENDANCE: 'labour_app_attendance_v2',
  ADVANCES: 'labour_app_advances_v2',
  SETTINGS: 'labour_app_settings_v2',
};

// Generate realistic seed attendance for today and yesterday
function generateInitialAttendance(labourers: Labour[]): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const now = new Date();

  // For the last 3 days
  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dStr = toDateStr(d);

    labourers.forEach((l, idx) => {
      // realistic spread
      let status: 'present' | 'half_day' | 'absent' = 'present';
      let ot = 0;
      if (idx === 2 && i === 1) status = 'half_day';
      else if (idx === 5 && i === 0) status = 'absent';
      else if (idx === 0) ot = 2; // Head mason 2h overtime
      else if (idx === 4 && i === 0) ot = 1.5;

      records.push({
        id: `${l.id}_${dStr}`,
        labourId: l.id,
        date: dStr,
        status,
        overtimeHours: ot,
        worksiteId: l.worksiteId || 'site_tower4',
        siteLocation: l.worksiteId === 'site_pokhara' ? 'Pokhara Resort' : l.worksiteId === 'site_birgunj' ? 'Birgunj Port' : 'Tower 4 - Commercial Plaza',
        notes: ot > 0 ? `Late shift casting (+${ot}h)` : '',
        updatedAt: new Date().toISOString(),
      });
    });
  }

  return records;
}

function generateInitialAdvances(labourers: Labour[]): AdvanceTransaction[] {
  const now = new Date();
  const dStr = toDateStr(now);

  return [
    {
      id: 'adv_1',
      labourId: labourers[0]?.id || 'lbr_1',
      amount: 1000,
      date: dStr,
      type: 'advance',
      paymentMode: 'Cash',
      worksiteId: labourers[0]?.worksiteId || 'site_tower4',
      description: 'Mid-week cash advance for family grocery',
      receiptNo: 'REC-081',
    },
    {
      id: 'adv_2',
      labourId: labourers[2]?.id || 'lbr_3',
      amount: 500,
      date: dStr,
      type: 'advance',
      paymentMode: 'UPI / Mobile Pay',
      worksiteId: labourers[2]?.worksiteId || 'site_tower4',
      description: 'Medicine expense advance via eSewa',
      receiptNo: 'REC-082',
    },
    {
      id: 'adv_3',
      labourId: labourers[4]?.id || 'lbr_5',
      amount: 800,
      date: dStr,
      type: 'advance',
      paymentMode: 'Cash',
      worksiteId: labourers[4]?.worksiteId || 'site_pokhara',
      description: 'Tool kit purchase advance',
      receiptNo: 'REC-083',
    },
    {
      id: 'adv_4',
      labourId: labourers[1]?.id || 'lbr_2',
      amount: 400,
      date: dStr,
      type: 'bonus',
      paymentMode: 'Cash',
      worksiteId: labourers[1]?.worksiteId || 'site_tower4',
      description: 'Rapid slab shuttering performance bonus',
      receiptNo: 'BON-014',
    },
  ];
}

export function loadLabourers(): Labour[] {
  try {
    const data = localStorage.getItem(KEYS.LABOURERS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load labourers from localStorage:', e);
  }
  saveLabourers(INITIAL_LABOURERS);
  return INITIAL_LABOURERS;
}

export function saveLabourers(data: Labour[]) {
  try {
    localStorage.setItem(KEYS.LABOURERS, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save labourers:', e);
  }
}

export function loadAttendance(): AttendanceRecord[] {
  try {
    const data = localStorage.getItem(KEYS.ATTENDANCE);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.map((r: AttendanceRecord) => {
          if (r.notes && (r.notes.includes('Quick 1-tap') || r.notes.includes('via Android Home'))) {
            return { ...r, notes: '' };
          }
          return r;
        });
      }
    }
  } catch (e) {
    console.warn('Failed to load attendance:', e);
  }
  const seeded = generateInitialAttendance(INITIAL_LABOURERS);
  saveAttendance(seeded);
  return seeded;
}

export function saveAttendance(data: AttendanceRecord[]) {
  try {
    localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save attendance:', e);
  }
}

export function loadAdvances(): AdvanceTransaction[] {
  try {
    const data = localStorage.getItem(KEYS.ADVANCES);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load advances:', e);
  }
  const seeded = generateInitialAdvances(INITIAL_LABOURERS);
  saveAdvances(seeded);
  return seeded;
}

export function saveAdvances(data: AdvanceTransaction[]) {
  try {
    localStorage.setItem(KEYS.ADVANCES, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save advances:', e);
  }
}

export function loadSettings(): AppSettings {
  try {
    const data = localStorage.getItem(KEYS.SETTINGS);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed && parsed.companyName) {
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          worksites: parsed.worksites && Array.isArray(parsed.worksites) && parsed.worksites.length > 0
            ? parsed.worksites
            : DEFAULT_SETTINGS.worksites,
          activeWorksiteId: parsed.activeWorksiteId || DEFAULT_SETTINGS.activeWorksiteId,
          userSession: parsed.userSession || DEFAULT_SETTINGS.userSession,
        };
      }
    }
  } catch (e) {
    console.warn('Failed to load settings:', e);
  }
  saveSettings(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export function saveSettings(data: AppSettings) {
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function resetAllData(): {
  labourers: Labour[];
  attendance: AttendanceRecord[];
  advances: AdvanceTransaction[];
  settings: AppSettings;
} {
  saveLabourers(INITIAL_LABOURERS);
  const seededAttendance = generateInitialAttendance(INITIAL_LABOURERS);
  saveAttendance(seededAttendance);
  const seededAdvances = generateInitialAdvances(INITIAL_LABOURERS);
  saveAdvances(seededAdvances);
  saveSettings(DEFAULT_SETTINGS);

  return {
    labourers: INITIAL_LABOURERS,
    attendance: seededAttendance,
    advances: seededAdvances,
    settings: DEFAULT_SETTINGS,
  };
}

export function exportBackupJSON(
  labourers: Labour[],
  attendance: AttendanceRecord[],
  advances: AdvanceTransaction[],
  settings: AppSettings
) {
  const payload = {
    version: '2.0',
    exportDate: new Date().toISOString(),
    labourers,
    attendance,
    advances,
    settings,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `labour_attendance_backup_${toDateStr(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
