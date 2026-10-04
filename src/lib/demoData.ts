import { TipPoolSettings, ProcessedShift, DailyTipInput } from '../types/tips';
import { MISSION_HILL_SHIFTS } from './missionHillData';
import { MISSION_HILL_SAMPLE_TIPS } from './sampleData';

export const DEMO_SETTINGS: TipPoolSettings = {
  poolName: 'Mission Hill Coffee & Creamery Tip Pool',
  restaurantName: 'Mission Hill Coffee & Creamery',
  dateMode: 'range',
  startDate: '2026-09-07',
  endDate: '2026-09-20',
  timePeriod: 'all_day',
  splitSetup: 'percentage_of_tips',
  contributors: [
    { id: 'contrib-demo-1', role: 'Server', contributionPercent: 100, source: 'All' },
    { id: 'contrib-demo-2', role: 'Cashier', contributionPercent: 100, source: 'All' },
    { id: 'contrib-demo-3', role: 'Kitchen Manager', contributionPercent: 0, source: 'All' },
  ],
  sources: {
    kiosk: { enabled: true, percent: 100 },
    online: { enabled: true, percent: 100 },
    qr: { enabled: false, percent: 100 },
    thirdParty: { enabled: true, percent: 100, source: 'All' },
  },
  customSources: [],
  distributionMethod: 'Percentage',
  recipients: [
    { id: 'recip-demo-1', role: 'Server', distributionPercent: 60, pointsPerHour: 1 },
    { id: 'recip-demo-2', role: 'Cashier', distributionPercent: 40, pointsPerHour: 1 },
  ],
  businessDayCutoffHour: 12,
  timezone: 'America/New_York',
};

export const DEMO_SHIFTS: ProcessedShift[] = MISSION_HILL_SHIFTS;
export const DEMO_DAILY_TIPS: Record<string, DailyTipInput> = MISSION_HILL_SAMPLE_TIPS;
export const DEMO_TIME_CARD_FILENAME = 'Mission_Hill_Coffee_&_Creamery_Time_Card_Report_2026-09-07_to_2026-09-20.csv';
export const DEMO_OTHER_TIP_FILENAME = 'Mission_Hill_Daily_Tip_Source_2026-09-07_to_2026-09-20.xlsx';
