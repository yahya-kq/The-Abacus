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
    contributorMap.set(c.role.toLowerCase(), {
      percent: c.contributionPercent || 0,
      source: c.source || 'All',
    });
  });

  const recipientMap = new Map<string, { distributionPercent: number; pointsPerHour: number }>();
  settings.recipients.forEach((r) => {
    recipientMap.set(r.role.toLowerCase(), {
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
  const excludedRolesSet = new Set<string>();
  let excludedShiftsCount = 0;

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
      const roleLower = s.role.toLowerCase();
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
      }

      dayShiftContributions += contrib;
      shiftContribDetails.set(s.id, { contrib, kept });
    }

    // 2. Add external sources from daily inputs
    const kioskContrib = (dayInput.kioskTips || 0) * (settings.sources.kiosk.enabled ? settings.sources.kiosk.percent / 100 : 0);
    const onlineContrib = (dayInput.webDashTips || 0) * (settings.sources.online.enabled ? settings.sources.online.percent / 100 : 0);
    const thirdPartyContrib = (dayInput.doorDashTips || 0) * (settings.sources.thirdParty.enabled ? settings.sources.thirdParty.percent / 100 : 0);
    const otherContrib = (dayInput.otherTips || 0);

    const externalPool = kioskContrib + onlineContrib + thirdPartyContrib + otherContrib;
    const computedPool = dayShiftContributions + externalPool;
    const effectivePool = computedPool > 0 ? computedPool : (dayInput.totalTips || 0);
    const totalDayPool = Math.round(effectivePool * 100) / 100;

    cycleTotalPool += totalDayPool;

    // 3. Identify Recipient Shifts
    const recipientShifts = dayShifts.filter((s) => {
      const isRecip = recipientMap.has(s.role.toLowerCase());
      if (!isRecip) {
        excludedRolesSet.add(s.role);
        excludedShiftsCount++;
      }
      return isRecip;
    });

    // 4. Distribute pool according to selected method
    let dayTotalRecipientHours = 0;
    let dayTotalPointHours = 0;
    const shiftPoolShare = new Map<string, number>();

    recipientShifts.forEach((s) => {
      dayTotalRecipientHours += s.totalHours;
      const rRule = recipientMap.get(s.role.toLowerCase());
      const pts = rRule?.pointsPerHour || 1;
      dayTotalPointHours += s.totalHours * pts;
    });

    cycleTotalRecipientHours += dayTotalRecipientHours;

    let perHourRate = 0;
    let perPointRate = 0;

    if (totalDayPool > 0) {
      if (settings.distributionMethod === 'Equally') {
        perHourRate = dayTotalRecipientHours > 0 ? totalDayPool / dayTotalRecipientHours : 0;
        recipientShifts.forEach((s) => {
          const share = Math.round(s.totalHours * perHourRate * 100) / 100;
          shiftPoolShare.set(s.id, share);
        });
      } else if (settings.distributionMethod === 'Points') {
        perPointRate = dayTotalPointHours > 0 ? totalDayPool / dayTotalPointHours : 0;
        recipientShifts.forEach((s) => {
          const rRule = recipientMap.get(s.role.toLowerCase());
          const pts = rRule?.pointsPerHour || 1;
          const share = Math.round(s.totalHours * pts * perPointRate * 100) / 100;
          shiftPoolShare.set(s.id, share);
        });
      } else if (settings.distributionMethod === 'Percentage') {
        // Group by role
        const roleHoursMap = new Map<string, number>();
        recipientShifts.forEach((s) => {
          const rLower = s.role.toLowerCase();
          roleHoursMap.set(rLower, (roleHoursMap.get(rLower) || 0) + s.totalHours);
        });

        recipientShifts.forEach((s) => {
          const rLower = s.role.toLowerCase();
          const rRule = recipientMap.get(rLower);
          const rPct = (rRule?.distributionPercent || 0) / 100;
          const rolePool = totalDayPool * rPct;
          const rTotalHours = roleHoursMap.get(rLower) || 0;
          const roleRate = rTotalHours > 0 ? rolePool / rTotalHours : 0;
          const share = Math.round(s.totalHours * roleRate * 100) / 100;
          shiftPoolShare.set(s.id, share);
        });
      }
    }

    // 5. Aggregate by employee for this day
    const dayEmpMap = new Map<string, EmployeeDailyDetail>();

    for (const s of dayShifts) {
      const cDetail = shiftContribDetails.get(s.id) || { contrib: 0, kept: s.collectedTips };
      const poolShare = shiftPoolShare.get(s.id) || 0;
      const totalPayout = cDetail.kept + poolShare;

      const existing = dayEmpMap.get(s.employeeName);
      if (existing) {
        existing.hours += s.totalHours;
        existing.netSale += s.netSale;
        existing.collectedTips += s.collectedTips;
        existing.contributionAmount += cDetail.contrib;
        existing.keptTips += cDetail.kept;
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
          contributionAmount: cDetail.contrib,
          keptTips: cDetail.kept,
          poolShare,
          totalPayout,
          dailyRate: perHourRate,
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
      empSum.totalContribution += cDetail.contrib;
      empSum.totalKeptTips += cDetail.kept;
      empSum.totalPoolReceived += poolShare;
      empSum.totalPayout += totalPayout;
      empSum.shiftCount += 1;
    }

    const dayEmployeesList = Array.from(dayEmpMap.values()).sort((a, b) =>
      a.employeeName.localeCompare(b.employeeName)
    );

    let dayDistributed = 0;
    dayEmployeesList.forEach((e) => {
      dayDistributed += e.poolShare;
      cycleTotalKeptTips += e.keptTips;
      cycleTotalOverallPayout += e.totalPayout;
    });

    cycleTotalDistributed += dayDistributed;

    dailyCalculations.push({
      date,
      displayDate: formatDisplayDate(date),
      dayOfWeek: getDayOfWeek(date),
      tipSources: {
        webDash: onlineContrib,
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
    averagePerHourTip: emp.totalHours > 0 ? emp.totalPayout / emp.totalHours : 0,
  }));

  // Sort by Employee Name
  employeeSummaries.sort((a, b) => a.employeeName.localeCompare(b.employeeName));

  const averagePerHourValue =
    cycleTotalRecipientHours > 0 ? cycleTotalDistributed / cycleTotalRecipientHours : 0;

  return {
    poolName: settings.poolName || settings.restaurantName || 'Tip Pool',
    restaurantName: settings.restaurantName || 'Tip Pool',
    distributionMethod: settings.distributionMethod || 'Equally',
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
    totalOverallPayout: Math.round(cycleTotalOverallPayout * 100) / 100,
    dailyCalculations,
    employeeSummaries,
    excludedShiftsCount,
    excludedRoles: Array.from(excludedRolesSet),
    reconciliation: {
      totalInputPool: Math.round(cycleTotalPool * 100) / 100,
      totalDistributedPool: Math.round(cycleTotalDistributed * 100) / 100,
      difference: Math.round((cycleTotalPool - cycleTotalDistributed) * 100) / 100,
    },
  };
}
