export type TipSystemType = 'equal' | 'pooling' | 'percentage' | 'points';

export interface ContributorRule {
  role: string;
  percentage: number;
  isManualSource?: boolean;
}

export interface RecipientRule {
  role: string;
  distribution: TipSystemType;
  weight?: number; // for points or percentage
}

export interface ManualTipField {
  id: string;
  label: string;
  placeholder?: string;
  description?: string;
}

export interface RestaurantConfig {
  id: string;
  name: string;
  systemType: TipSystemType;
  description: string;
  active: boolean;
  businessDayCutoffHour: number; // e.g., 12 (shifts before 12 PM belong to previous calendar day's business day)
  contributors: ContributorRule[];
  recipients: RecipientRule[];
  manualTipFields: ManualTipField[];
}

export interface RawShiftRow {
  name: string;
  role: string;
  payRate?: number;
  dateStr: string;
  timeIn: string;
  timeOut: string;
  regularHours?: number;
  overtimeHours?: number;
  totalHours: number; // The decisive metric from time card
  netSale?: number;
  tips?: number;
  gratuity?: number;
}

export interface ProcessedShift {
  id: string;
  employeeName: string;
  role: string;
  payRate: number;
  rawDate: string;
  timeIn: string;
  timeOut: string;
  totalHours: number;
  netSale: number;
  posTips: number;
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
  dailyRate: number;
  tipsEarned: number;
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
  totalTips: number;
  totalHours: number;
  perHourValue: number;
  employees: EmployeeDailyDetail[];
}

export interface EmployeeCycleSummary {
  employeeName: string;
  role: string;
  totalHours: number;
  totalTips: number;
  averagePerHourTip: number;
  shiftCount: number;
  dailyBreakdown: EmployeeDailyDetail[];
}

export interface CycleCalculationResult {
  restaurant: RestaurantConfig;
  startDate: string;
  endDate: string;
  totalTips: number;
  totalHours: number;
  averagePerHourValue: number;
  totalEligibleEmployees: number;
  totalShiftsWorked: number;
  dailyCalculations: DailyCalculationResult[];
  employeeSummaries: EmployeeCycleSummary[];
  excludedShiftsCount: number;
  excludedRoles: string[];
  reconciliation: {
    totalInputTips: number;
    totalDistributedTips: number;
    difference: number;
  };
}

export interface ParseTimecardResult {
  shifts: ProcessedShift[];
  rawRowCount: number;
  errors: string[];
  detectedStartDate?: string;
  detectedEndDate?: string;
  extractedDailyTips: Record<string, number>; // date (YYYY-MM-DD) -> sum of tips from file
}
