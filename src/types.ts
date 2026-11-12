export type AttendanceStatus = 'present' | 'half_day' | 'absent' | 'not_marked';

export type TransactionType = 'advance' | 'deduction' | 'bonus';

export type ActiveTab = 'home' | 'attendance' | 'mark-today' | 'payroll' | 'labourers' | 'advances' | 'apk-studio';

export interface Worksite {
  id: string;
  name: string;
  location: string;
  clientName?: string;
  supervisorName?: string;
  status: 'active' | 'completed' | 'on_hold';
  createdAt: string;
  notes?: string;
}

export interface UserSession {
  isLoggedIn: boolean;
  userName: string;
  userRole: 'admin' | 'supervisor' | 'accountant' | 'viewer';
  phone?: string;
  pinCode?: string;
  lastLogin?: string;
}

export interface Labour {
  id: string;
  name: string;
  phone: string;
  role: string;
  dailyWage: number;
  overtimeHourlyRate: number;
  joiningDate: string;
  status: 'active' | 'inactive';
  worksiteId?: string;
  notes?: string;
  workerCode?: string;
}

export interface AttendanceRecord {
  id: string;
  labourId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  overtimeHours: number;
  worksiteId?: string;
  siteLocation?: string;
  notes?: string;
  updatedAt: string;
}

export interface AdvanceTransaction {
  id: string;
  labourId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  paymentMode: 'Cash' | 'Bank Transfer' | 'UPI / Mobile Pay' | 'Cheque';
  description: string;
  worksiteId?: string;
  receiptNo?: string;
}

export interface AppSettings {
  companyName: string;
  worksiteName: string;
  activeWorksiteId: string;
  worksites: Worksite[];
  currency: string;
  currencySymbol: string;
  defaultShiftHours: number;
  userSession?: UserSession;
}

export interface LabourWageSummary {
  labour: Labour;
  presentDays: number;
  halfDays: number;
  absentDays: number;
  effectiveDays: number;
  baseWageEarned: number;
  totalOvertimeHours: number;
  overtimeWageEarned: number;
  totalBonus: number;
  grossWages: number;
  totalAdvances: number;
  totalDeductions: number;
  totalDeducted: number;
  netPayable: number;
}
