import { 
  Labour, 
  AttendanceRecord, 
  AdvanceTransaction, 
  LabourWageSummary 
} from '../types';

export function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatCurrency(amount: number, symbol: string = 'रू'): string {
  if (isNaN(amount)) return `${symbol}0`;
  return `${symbol}${amount.toLocaleString('en-IN')}`;
}

export interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

export function getDateRanges(
  preset: 'this_month' | 'last_month' | 'this_week' | 'all_time' | 'custom',
  customStart?: string,
  customEnd?: string
): DateRange {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (preset === 'all_time') {
    return {
      startDate: '2000-01-01',
      endDate: '2099-12-31',
      label: 'All Time',
    };
  }

  if (preset === 'this_month') {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return {
      startDate: toDateStr(start),
      endDate: toDateStr(end),
      label: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };
  }

  if (preset === 'last_month') {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return {
      startDate: toDateStr(start),
      endDate: toDateStr(end),
      label: start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };
  }

  if (preset === 'this_week') {
    const day = now.getDay(); // 0 is Sunday
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      startDate: toDateStr(monday),
      endDate: toDateStr(sunday),
      label: 'This Week',
    };
  }

  // Custom
  return {
    startDate: customStart || toDateStr(new Date(year, month, 1)),
    endDate: customEnd || toDateStr(now),
    label: 'Custom Range',
  };
}

export function getMonthDays(year: number, month: number): Array<{
  dateStr: string;
  dayNum: number;
  dayOfWeek: string;
  isSunday: boolean;
}> {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: Array<{
    dateStr: string;
    dayNum: number;
    dayOfWeek: string;
    isSunday: boolean;
  }> = [];

  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d);
    const dateStr = toDateStr(dt);
    const dayOfWeek = weekdays[dt.getDay()];
    const isSunday = dt.getDay() === 0;

    days.push({
      dateStr,
      dayNum: d,
      dayOfWeek,
      isSunday,
    });
  }

  return days;
}

export function calculateLabourWage(
  labour: Labour,
  attendance: AttendanceRecord[],
  advances: AdvanceTransaction[],
  startDate: string,
  endDate: string
): LabourWageSummary {
  // Filter attendance within range
  const filteredAttendance = attendance.filter(
    (r) => r.labourId === labour.id && r.date >= startDate && r.date <= endDate
  );

  let presentDays = 0;
  let halfDays = 0;
  let absentDays = 0;
  let totalOvertimeHours = 0;

  filteredAttendance.forEach((rec) => {
    if (rec.status === 'present') {
      presentDays += 1;
    } else if (rec.status === 'half_day') {
      halfDays += 1;
    } else if (rec.status === 'absent') {
      absentDays += 1;
    }

    if (rec.overtimeHours && rec.overtimeHours > 0) {
      totalOvertimeHours += Number(rec.overtimeHours);
    }
  });

  const effectiveDays = presentDays + halfDays * 0.5;
  const baseWageEarned = Math.round(effectiveDays * labour.dailyWage);

  const otRate = labour.overtimeHourlyRate || Math.round(labour.dailyWage / 8);
  const overtimeWageEarned = Math.round(totalOvertimeHours * otRate);

  // Filter transactions within range
  const filteredAdvances = advances.filter(
    (tx) => tx.labourId === labour.id && tx.date >= startDate && tx.date <= endDate
  );

  let totalAdvances = 0;
  let totalDeductions = 0;
  let totalBonus = 0;

  filteredAdvances.forEach((tx) => {
    if (tx.type === 'advance') {
      totalAdvances += tx.amount;
    } else if (tx.type === 'deduction') {
      totalDeductions += tx.amount;
    } else if (tx.type === 'bonus') {
      totalBonus += tx.amount;
    }
  });

  const grossWages = baseWageEarned + overtimeWageEarned + totalBonus;
  const totalDeducted = totalAdvances + totalDeductions;
  const netPayable = grossWages - totalDeducted;

  return {
    labour,
    presentDays,
    halfDays,
    absentDays,
    effectiveDays,
    baseWageEarned,
    totalOvertimeHours,
    overtimeWageEarned,
    totalBonus,
    grossWages,
    totalAdvances,
    totalDeductions,
    totalDeducted,
    netPayable,
  };
}
