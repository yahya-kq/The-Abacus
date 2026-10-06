import {
  TipPoolSettings,
  ProcessedShift,
  DailyTipInput,
  DailyCalculationResult,
  EmployeeCycleSummary,
  CycleCalculationResult,
  EmployeeDailyDetail,
  PoolContributionMethod,
} from '../types/tips';
import { formatDisplayDate, getDayOfWeek } from './parser';

/**
 * Generate full list of ISO dates (YYYY-MM-DD) between start and end date inclusive
 */
export function generateDateRange(startDateStr: string, endDateStr: string): string[] {
  if (!startDateStr || !endDateStr) return [];
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

/** Normalize role names for matching (case/whitespace insensitive) */
function normRole(role: string): string {
  return (role || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Split `total` dollars across weights so every share is whole cents and
 * the shares sum EXACTLY to `total` (largest-remainder method, $0.00 variance).
 */
function allocateCents(total: number, weights: { id: string; w: number }[]): Map<string, number> {
  const result = new Map<string, number>();
  const totalCents = Math.round(total * 100);
  const sumW = weights.reduce((a, x) => a + (x.w > 0 ? x.w : 0), 0);
  if (totalCents <= 0 || sumW <= 0) return result;

  const parts = weights.map((x) => {
    const raw = (totalCents * (x.w > 0 ? x.w : 0)) / sumW;
    const floor = Math.floor(raw);
    return { id: x.id, cents: floor, rem: raw - floor };
  });
  let leftover = totalCents - parts.reduce((a, p) => a + p.cents, 0);
  const order = [...parts].sort((a, b) => b.rem - a.rem);
  for (let i = 0; leftover > 0 && order.length > 0; i = (i + 1) % order.length) {
    order[i].cents += 1;
    leftover--;
  }
  parts.forEach((p) => result.set(p.id, p.cents / 100));
  return result;
}

/**
 * The core Abacus Tip Calculation Engine
 * Supports:
 * - Contribution via % of Tips or % of Sales
 * - External sources (Kiosk, Online, QR, 3PO)
 * - 3 Distribution Methods: Equally, Percentage, Points
 * - Kept tips tracking and total payouts
 */
export function calculateTipCycle(
  settings: TipPoolSettings,
  shifts: ProcessedShift[],
  dailyTipInputs: Record<string, DailyTipInput>
): CycleCalculationResult {
  const startDate = settings.startDate;
  const endDate = settings.endDate;
  const cycleDates = generateDateRange(startDate, endDate);

  // Map settings for O(1) lookup
  const contributorMap = new Map<string, { percent: number; source: string }>();
  settings.contributors.forEach((c) => {
    if (!normRole(c.role)) return;
    contributorMap.set(normRole(c.role), {
      percent: c.contributionPercent || 0,
      source: c.source || 'All',
    });
  });

  const recipientMap = new Map<string, { distributionPercent: number; pointsPerHour: number }>();
  settings.recipients.forEach((r) => {
    if (!normRole(r.role)) return;
    recipientMap.set(normRole(r.role), {
      distributionPercent: r.distributionPercent || 0,
      pointsPerHour: r.pointsPerHour || 1,
    });
  });

  // Filter shifts to those belonging to cycle date range
  const cycleShifts = shifts.filter(
    (s) => s.businessDate >= startDate && s.businessDate <= endDate
  );

  const dailyCalculations: DailyCalculationResult[] = [];
  const employeeSummariesMap = new Map<string, EmployeeCycleSummary>();

  let cycleTotalPool = 0;
  let cycleTotalDistributed = 0;
  let cycleTotalRecipientHours = 0;
  let cycleTotalKeptTips = 0;
  let cycleTotalOverallPayout = 0;
  let cycleTotalGratuity = 0;
  let cycleTotalDirectTips = 0;
  const excludedRolesSet = new Set<string>();
  let excludedShiftsCount = 0;
  const undistributedDays: { date: string; amount: number }[] = [];

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

    const dayShifts = cycleShifts.filter((s) => s.businessDate === date);

    // 1. Calculate contributions from shifts
    let dayShiftContributions = 0;
    const shiftContribDetails = new Map<string, { contrib: number; kept: number }>();

    for (const s of dayShifts) {
      const roleLower = normRole(s.role);
      const isSummaryRole = roleLower === 'summary' || roleLower === 'kiosk';
      const contribRule = contributorMap.get(roleLower);

      let contrib = 0;
      let kept = s.collectedTips;

      if (isSummaryRole) {
        // Summary or Kiosk summary rows contribute 100% of their tips into the pool
        contrib = s.collectedTips;
        kept = 0;
      } else if (contribRule && contribRule.percent > 0) {
        if (settings.splitSetup === 'percentage_of_tips') {
          contrib = s.collectedTips * (contribRule.percent / 100);
          kept = Math.max(0, s.collectedTips - contrib);
        } else {
          // percentage of sales
          contrib = s.netSale * (contribRule.percent / 100);
          kept = Math.max(0, s.collectedTips - contrib);
        }
      } else if (contribRule && contribRule.percent === 0) {
        contrib = 0;
        kept = s.collectedTips;
      } else {
        // In Equal pooling (or when no explicit rule exists), 100% of shift tips are contributed to the pool
        contrib = s.collectedTips;
        kept = 0;
      }

      dayShiftContributions += contrib;
      shiftContribDetails.set(s.id, { contrib, kept });
    }

    // 2. Add external sources from daily inputs
    const kioskContrib = (dayInput.kioskTips || 0) * (settings.sources.kiosk?.enabled ? settings.sources.kiosk.percent / 100 : 0);
    const onlineContrib = (dayInput.onlineTips || 0) * (settings.sources.online?.enabled ? settings.sources.online.percent / 100 : 0);
    const thirdPartyContrib = (dayInput.doorDashTips || 0) * (settings.sources.thirdParty?.enabled ? settings.sources.thirdParty.percent / 100 : 0);
    const otherContrib = (dayInput.otherTips || 0);

    const externalPool = kioskContrib + onlineContrib + thirdPartyContrib + otherContrib;

    // Tips from time cards:
    // If shift records exist for today, use their exact shift contributions.
    // If no shifts were recorded for today, fall back to dayInput.webDashTips.
    // NEVER add both (avoids doubling tips).
    const dayTimecardTips = dayShifts.length > 0 ? dayShiftContributions : (dayInput.webDashTips || 0);
    const webDashContrib = Math.round(dayTimecardTips * 100) / 100;

    const totalDayPool = Math.round((dayTimecardTips + externalPool) * 100) / 100;

    cycleTotalPool += totalDayPool;

    // 3. Identify Recipient Shifts
    const recipientShifts = dayShifts.filter((s) => {
      const isRecip = recipientMap.size === 0 || recipientMap.has(normRole(s.role));
      if (!isRecip) {
        excludedRolesSet.add(s.role);
        excludedShiftsCount++;
      }
      return isRecip;
    });

    // 4. Distribute pool according to selected method
    let dayTotalRecipientHours = 0;
    let dayTotalPointHours = 0;
    let shiftPoolShare = new Map<string, number>();

    recipientShifts.forEach((s) => {
      dayTotalRecipientHours += s.totalHours;
      const rRule = recipientMap.get(normRole(s.role));
      const pts = rRule?.pointsPerHour || 1;
      dayTotalPointHours += s.totalHours * pts;
    });

    cycleTotalRecipientHours += dayTotalRecipientHours;

    const perHourRate = dayTotalRecipientHours > 0 ? totalDayPool / dayTotalRecipientHours : 0;
    const perPointRate = dayTotalPointHours > 0 ? totalDayPool / dayTotalPointHours : 0;

    if (totalDayPool > 0) {
      // Build a weight per recipient shift; payout = DayPool × weight / Σweights
      const weights: { id: string; w: number }[] = [];

      if (settings.distributionMethod === 'Points') {
        // Method 3: Shift Hours × Role Points × Point Rate
        recipientShifts.forEach((s) => {
          const pts = recipientMap.get(normRole(s.role))?.pointsPerHour || 1;
          weights.push({ id: s.id, w: s.totalHours * pts });
        });
      } else if (settings.distributionMethod === 'Percentage') {
        // Method 2: Role bucket (re-normalized to active roles) split by hours within the role
        const roleHoursMap = new Map<string, number>();
        recipientShifts.forEach((s) => {
          const r = normRole(s.role);
          roleHoursMap.set(r, (roleHoursMap.get(r) || 0) + s.totalHours);
        });
        let activePct = 0;
        roleHoursMap.forEach((hours, r) => {
          if (hours > 0) activePct += recipientMap.get(r)?.distributionPercent || 0;
        });
        recipientShifts.forEach((s) => {
          const r = normRole(s.role);
          const roleHours = roleHoursMap.get(r) || 0;
          if (activePct > 0) {
            const pct = (recipientMap.get(r)?.distributionPercent || 0) / activePct;
            weights.push({ id: s.id, w: roleHours > 0 ? pct * (s.totalHours / roleHours) : 0 });
          } else {
            // No percentages configured for working roles: fall back to hours
            weights.push({ id: s.id, w: s.totalHours });
          }
        });
      } else {
        // Method 1 (Equally): Shift Hours × Hourly Rate
        recipientShifts.forEach((s) => weights.push({ id: s.id, w: s.totalHours }));
      }

      shiftPoolShare = allocateCents(totalDayPool, weights);

      const allocated = Array.from(shiftPoolShare.values()).reduce((a, b) => a + b, 0);
      if (Math.round(allocated * 100) !== Math.round(totalDayPool * 100)) {
        undistributedDays.push({
          date,
          amount: Math.round((totalDayPool - allocated) * 100) / 100,
        });
      }
    }

    // 5. Aggregate by employee for this day
    const dayEmpMap = new Map<string, EmployeeDailyDetail>();

    // Only tip recipients appear in payout tables (non-recipients still contribute to the pool)
    for (const s of recipientShifts) {
      const cDetail = shiftContribDetails.get(s.id) || { contrib: 0, kept: 0 };
      const poolShare = shiftPoolShare.get(s.id) || 0;
      // Employee payout is their exact share from the tip pool
      const totalPayout = poolShare;

      const existing = dayEmpMap.get(s.employeeName);
      if (existing) {
        existing.hours += s.totalHours;
        existing.netSale += s.netSale;
        existing.collectedTips += s.collectedTips;
        existing.directTips = (existing.directTips || 0) + (s.directTips || 0);
        existing.gratuity = (existing.gratuity || 0) + (s.gratuity || 0);
        existing.contributionAmount += cDetail.contrib;
        existing.keptTips = 0;
        existing.poolShare += poolShare;
        existing.totalPayout += totalPayout;
      } else {
        dayEmpMap.set(s.employeeName, {
          date,
          displayDate: formatDisplayDate(date),
          employeeName: s.employeeName,
          role: s.role,
          hours: s.totalHours,
          netSale: s.netSale,
          collectedTips: s.collectedTips,
          directTips: s.directTips || 0,
          gratuity: s.gratuity || 0,
          contributionAmount: cDetail.contrib,
          keptTips: 0,
          poolShare,
          totalPayout,
          dailyRate: 0,
          percentageOfDailyPool: totalDayPool > 0 ? (poolShare / totalDayPool) * 100 : 0,
        });
      }

      // Update cycle employee summary
      let empSum = employeeSummariesMap.get(s.employeeName);
      if (!empSum) {
        empSum = {
          employeeName: s.employeeName,
          role: s.role,
          totalHours: 0,
          totalNetSales: 0,
          totalCollectedTips: 0,
          totalDirectTips: 0,
          totalGratuity: 0,
          totalContribution: 0,
          totalKeptTips: 0,
          totalPoolReceived: 0,
          totalPayout: 0,
          averagePerHourTip: 0,
          shiftCount: 0,
          dailyBreakdown: [],
        };
        employeeSummariesMap.set(s.employeeName, empSum);
      }

      empSum.totalHours += s.totalHours;
      empSum.totalNetSales += s.netSale;
      empSum.totalCollectedTips += s.collectedTips;
      empSum.totalDirectTips = (empSum.totalDirectTips || 0) + (s.directTips || 0);
      empSum.totalGratuity = (empSum.totalGratuity || 0) + (s.gratuity || 0);
      empSum.totalContribution += cDetail.contrib;
      empSum.totalKeptTips = 0;
      empSum.totalPoolReceived += poolShare;
      empSum.totalPayout += totalPayout;
      empSum.shiftCount += 1;
      cycleTotalGratuity += s.gratuity || 0;
      cycleTotalDirectTips += s.directTips || 0;
    }

    const dayEmployeesList = Array.from(dayEmpMap.values()).sort((a, b) =>
      a.employeeName.localeCompare(b.employeeName)
    );

    let dayDistributed = 0;
    dayEmployeesList.forEach((e) => {
      e.poolShare = Math.round(e.poolShare * 100) / 100;
      e.totalPayout = Math.round(e.totalPayout * 100) / 100;
      e.dailyRate = e.hours > 0 ? e.totalPayout / e.hours : 0;
      dayDistributed += e.poolShare;
      cycleTotalOverallPayout += e.totalPayout;
    });

    cycleTotalDistributed += dayDistributed;

    dailyCalculations.push({
      date,
      displayDate: formatDisplayDate(date),
      dayOfWeek: getDayOfWeek(date),
      tipSources: {
        webDash: webDashContrib,
        online: onlineContrib,
        doorDash: thirdPartyContrib,
        kiosk: kioskContrib,
        other: otherContrib,
      },
      totalPool: totalDayPool,
      totalRecipientHours: dayTotalRecipientHours,
      totalRecipientPointHours: dayTotalPointHours,
      perHourValue: perHourRate,
      perPointValue: perPointRate,
      employees: dayEmployeesList,
    });
  }

  // Populate daily breakdowns on employee summaries
  for (const day of dailyCalculations) {
    for (const empDetail of day.employees) {
      const empSum = employeeSummariesMap.get(empDetail.employeeName);
      if (empSum) {
        empSum.dailyBreakdown.push(empDetail);
      }
    }
  }

  // Compute average per-hour tip for each employee
  const employeeSummaries = Array.from(employeeSummariesMap.values()).map((emp) => ({
    ...emp,
    totalPayout: Math.round(emp.totalPayout * 100) / 100,
    totalPoolReceived: Math.round(emp.totalPoolReceived * 100) / 100,
    averagePerHourTip: emp.totalHours > 0 ? emp.totalPayout / emp.totalHours : 0,
  }));

  // Sort by Employee Name
  employeeSummaries.sort((a, b) => a.employeeName.localeCompare(b.employeeName));

  const averagePerHourValue =
    cycleTotalRecipientHours > 0 ? cycleTotalDistributed / cycleTotalRecipientHours : 0;

  return {
    poolName: settings.poolName || settings.restaurantName || 'Tip Pool',
    restaurantName: settings.restaurantName || 'Tip Pool',
    distributionMethod: settings.distributionMethod || '',
    splitSetup: (settings.splitSetup || 'percentage_of_tips') as PoolContributionMethod,
    startDate,
    endDate,
    totalPool: Math.round(cycleTotalPool * 100) / 100,
    totalDistributed: Math.round(cycleTotalDistributed * 100) / 100,
    totalRecipientHours: Math.round(cycleTotalRecipientHours * 100) / 100,
    averagePerHourValue: Math.round(averagePerHourValue * 100) / 100,
    totalEligibleEmployees: employeeSummaries.length,
    totalShiftsWorked: cycleShifts.length,
    totalKeptTips: Math.round(cycleTotalKeptTips * 100) / 100,
    totalGratuity: Math.round(cycleTotalGratuity * 100) / 100,
    totalDirectTips: Math.round(cycleTotalDirectTips * 100) / 100,
    totalOverallPayout: Math.round(cycleTotalOverallPayout * 100) / 100,
    dailyCalculations,
    employeeSummaries,
    excludedShiftsCount,
    excludedRoles: Array.from(excludedRolesSet),
    undistributedDays,
    reconciliation: {
      totalInputPool: Math.round(cycleTotalPool * 100) / 100,
      totalDistributedPool: Math.round(cycleTotalDistributed * 100) / 100,
      difference: Math.round((cycleTotalPool - cycleTotalDistributed) * 100) / 100,
    },
  };
}
