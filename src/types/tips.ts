export type TipSystemType = 'equal' | 'pooling' | 'percentage' | 'points';

export type PoolContributionMethod = 'percentage_of_tips' | 'percentage_of_sales';
export type PoolDistributionMethod = 'Equally' | 'Percentage' | 'Points';

export interface ContributorConfig {
  id: string;
  role: string;
  contributionPercent: number; // e.g. 100 for 100%, 5 for 5%
  source: string; // 'All', 'Food', 'Beverage', etc.
}

export interface SourceToggleItem {
  enabled: boolean;
  percent: number;
  source?: string;
}

export interface SourceToggles {
  kiosk: SourceToggleItem;
  online: SourceToggleItem;
  qr: SourceToggleItem;
  thirdParty: SourceToggleItem;
}

export interface RecipientConfig {
  id: string;
  role: string;
  distributionPercent?: number; // e.g. 60 for 60%
  pointsPerHour?: number; // e.g. 2 for 2 points
}

export interface TipPoolSettings {
  poolName: string;
  restaurantName: string;
  dateMode: 'single' | 'range';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  timePeriod: 'all_day' | 'specific';
  specificStartTime?: string;
  specificEndTime?: string;
  splitSetup: PoolContributionMethod; // 'percentage_of_tips' | 'percentage_of_sales'
  contributors: ContributorConfig[];
  sources: SourceToggles;
  distributionMethod: PoolDistributionMethod; // 'Equally' | 'Percentage' | 'Points'
  recipients: RecipientConfig[];
  businessDayCutoffHour: number; // e.g. 12
  timezone: string; // e.g. 'America/New_York'
}

export interface ProcessedShift {
  id: string;
  employeeName: string;
  role: string;
  payRate: number;
  rawDate: string;
  timeIn: string;
  timeOut: string;
  regularHours?: number;
  overtimeHours?: number;
  totalHours: number; // Decisive metric
  netSale: number;
  collectedTips: number; // Replaces previous posTips
  gratuity: number;
  calendarDate: string; // YYYY-MM-DD
  businessDate: string; // YYYY-MM-DD
  isEligibleRecipient: boolean;
  isContributor: boolean;
}

export interface DailyTipInput {
  date: string; // YYYY-MM-DD
  displayDate: string; // e.g. "Sep 07, 2026"
  dayOfWeek: string;
  webDashTips: number;
  doorDashTips: number;
  kioskTips: number;
  otherTips: number;
  customFields?: Record<string, number>;
  totalTips: number;
}

export interface EmployeeDailyDetail {
  date: string;
  displayDate: string;
  employeeName: string;
  role: string;
  hours: number;
  netSale: number;
  collectedTips: number;
  contributionAmount: number;
  keptTips: number;
  poolShare: number;
  totalPayout: number;
  dailyRate: number;
  percentageOfDailyPool: number;
}

export interface DailyCalculationResult {
  date: string;
  displayDate: string;
  dayOfWeek: string;
  tipSources: {
    webDash: number;
    doorDash: number;
    kiosk: number;
    other: number;
  };
  totalPool: number;
  totalRecipientHours: number;
  totalRecipientPointHours?: number;
  perHourValue: number;
  perPointValue?: number;
  employees: EmployeeDailyDetail[];
}

export interface EmployeeCycleSummary {
  employeeName: string;
  role: string;
  totalHours: number;
  totalNetSales: number;
  totalCollectedTips: number;
  totalContribution: number;
  totalKeptTips: number;
  totalPoolReceived: number;
  totalPayout: number;
  averagePerHourTip: number;
  shiftCount: number;
  dailyBreakdown: EmployeeDailyDetail[];
}

export interface CycleCalculationResult {
  poolName: string;
  restaurantName: string;
  distributionMethod: PoolDistributionMethod;
  splitSetup: PoolContributionMethod;
  startDate: string;
  endDate: string;
  totalPool: number;
  totalDistributed: number;
  totalRecipientHours: number;
  averagePerHourValue: number;
  totalEligibleEmployees: number;
  totalShiftsWorked: number;
  totalKeptTips: number;
  totalOverallPayout: number;
  dailyCalculations: DailyCalculationResult[];
  employeeSummaries: EmployeeCycleSummary[];
  excludedShiftsCount: number;
  excludedRoles: string[];
  reconciliation: {
    totalInputPool: number;
    totalDistributedPool: number;
    difference: number;
  };
}

export interface ParseTimecardResult {
  shifts: ProcessedShift[];
  rawRowCount: number;
  errors: string[];
  detectedStartDate?: string;
  detectedEndDate?: string;
  extractedDailyTips: Record<string, number>; // date -> sum of tips
}
