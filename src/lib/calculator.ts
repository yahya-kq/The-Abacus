import {
  RestaurantConfig,
  ProcessedShift,
  DailyTipInput,
  DailyCalculationResult,
  EmployeeCycleSummary,
  CycleCalculationResult,
  EmployeeDailyDetail,
} from '../types/tips';
import { formatDisplayDate, getDayOfWeek } from './parser';

/**
 * Generate full list of ISO dates (YYYY-MM-DD) between start and end date inclusive
 */
export function generateDateRange(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  const [sy, sm, sd] = startDateStr.split('-').map(Number);
  const [ey, em, ed] = endDateStr.split('-').map(Number);

  const current = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);

  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * The core Abacus Tip Calculation Engine
 */
export function calculateTipCycle(
  restaurant: RestaurantConfig,
  startDate: string,
  endDate: string,
  shifts: ProcessedShift[],
  dailyTipInputs: Record<string, DailyTipInput>
): CycleCalculationResult {
  const cycleDates = generateDateRange(startDate, endDate);

  // Filter shifts to those belonging to the cycle
  const cycleShifts = shifts.filter(
    (s) => s.businessDate >= startDate && s.businessDate <= endDate
  );

  const excludedShifts = cycleShifts.filter((s) => !s.isEligibleRecipient);
  const eligibleShifts = cycleShifts.filter((s) => s.isEligibleRecipient);

  const excludedRolesSet = new Set(excludedShifts.map((s) => s.role));

  const dailyCalculations: DailyCalculationResult[] = [];
  const employeeSummariesMap = new Map<string, EmployeeCycleSummary>();

  // Process day by day
  for (const date of cycleDates) {
    const dayInput = dailyTipInputs[date] || {
      date,
      displayDate: formatDisplayDate(date),
      dayOfWeek: getDayOfWeek(date),
      webDashTips: 0,
      doorDashTips: 0,
      kioskTips: 0,
      otherTips: 0,
      totalTips: 0,
    };

    const dayTotalTips =
      (dayInput.webDashTips || 0) +
      (dayInput.doorDashTips || 0) +
      (dayInput.kioskTips || 0) +
      (dayInput.otherTips || 0);

    // Shifts for this business day
    const dayEligibleShifts = eligibleShifts.filter((s) => s.businessDate === date);

    // Aggregate by employee for this day (in case of double shifts)
    const dayEmpMap = new Map<string, { role: string; hours: number }>();
    for (const s of dayEligibleShifts) {
      const existing = dayEmpMap.get(s.employeeName);
      if (existing) {
        existing.hours += s.totalHours;
      } else {
        dayEmpMap.set(s.employeeName, { role: s.role, hours: s.totalHours });
      }
    }

    let dayTotalHours = 0;
    for (const [, val] of dayEmpMap) {
      dayTotalHours += val.hours;
    }

    // Rate per hour for this day: Total Tips / Total Hours
    const perHourValue = dayTotalHours > 0 ? dayTotalTips / dayTotalHours : 0;

    const dayEmployeeDetails: EmployeeDailyDetail[] = [];

    for (const [empName, val] of dayEmpMap) {
      const tipsEarned = val.hours * perHourValue;
      const percentageOfDailyPool = dayTotalTips > 0 ? (tipsEarned / dayTotalTips) * 100 : 0;

      dayEmployeeDetails.push({
        employeeName: empName,
        role: val.role,
        hours: val.hours,
        dailyRate: perHourValue,
        tipsEarned,
        percentageOfDailyPool,
      });

      // Update cycle employee summary
      let empSummary = employeeSummariesMap.get(empName);
      if (!empSummary) {
        empSummary = {
          employeeName: empName,
          role: val.role,
          totalHours: 0,
          totalTips: 0,
          averagePerHourTip: 0,
          shiftCount: 0,
          dailyBreakdown: [],
        };
        employeeSummariesMap.set(empName, empSummary);
      }

      empSummary.totalHours += val.hours;
      empSummary.totalTips += tipsEarned;
      empSummary.shiftCount += 1;
      empSummary.dailyBreakdown.push({
        employeeName: empName,
        role: val.role,
        hours: val.hours,
        dailyRate: perHourValue,
        tipsEarned,
        percentageOfDailyPool,
      });
    }

    // Sort employees by name
    dayEmployeeDetails.sort((a, b) => a.employeeName.localeCompare(b.employeeName));

    dailyCalculations.push({
      date,
      displayDate: formatDisplayDate(date),
      dayOfWeek: getDayOfWeek(date),
      tipSources: {
        webDash: dayInput.webDashTips || 0,
        doorDash: dayInput.doorDashTips || 0,
        kiosk: dayInput.kioskTips || 0,
        other: dayInput.otherTips || 0,
      },
      totalTips: dayTotalTips,
      totalHours: dayTotalHours,
      perHourValue,
      employees: dayEmployeeDetails,
    });
  }

  // Finalize employee cycle summaries
  const employeeSummaries: EmployeeCycleSummary[] = Array.from(employeeSummariesMap.values()).map(
    (emp) => {
      return {
        ...emp,
        averagePerHourTip: emp.totalHours > 0 ? emp.totalTips / emp.totalHours : 0,
      };
    }
  );

  // Sort employees alphabetically
  employeeSummaries.sort((a, b) => a.employeeName.localeCompare(b.employeeName));

  // Cycle totals
  let cycleTotalTips = 0;
  let cycleTotalHours = 0;
  for (const d of dailyCalculations) {
    cycleTotalTips += d.totalTips;
    cycleTotalHours += d.totalHours;
  }

  const cycleDistributedTips = employeeSummaries.reduce((sum, e) => sum + e.totalTips, 0);
  const diff = Math.round((cycleTotalTips - cycleDistributedTips) * 100) / 100;

  return {
    restaurant,
    startDate,
    endDate,
    totalTips: cycleTotalTips,
    totalHours: cycleTotalHours,
    averagePerHourValue: cycleTotalHours > 0 ? cycleTotalTips / cycleTotalHours : 0,
    totalEligibleEmployees: employeeSummaries.length,
    totalShiftsWorked: eligibleShifts.length,
    dailyCalculations,
    employeeSummaries,
    excludedShiftsCount: excludedShifts.length,
    excludedRoles: Array.from(excludedRolesSet),
    reconciliation: {
      totalInputTips: cycleTotalTips,
      totalDistributedTips: cycleDistributedTips,
      difference: diff,
    },
  };
}
