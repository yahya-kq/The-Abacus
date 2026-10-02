import { parseTimecardCsv } from './lib/parser';
import { calculateTipCycle } from './lib/calculator';
import { DEFAULT_RESTAURANT } from './config/restaurants';
import { MISSION_HILL_SAMPLE_CSV, MISSION_HILL_SAMPLE_TIPS } from './lib/sampleData';

console.log('====================================================');
console.log('RUNNING FULL ABACUS TIP CALCULATION VERIFICATION');
console.log('====================================================');

// 1. Parse time card
const { shifts, rawRowCount, errors } = parseTimecardCsv(MISSION_HILL_SAMPLE_CSV, DEFAULT_RESTAURANT);
console.log(`[1] Parsed ${shifts.length} shifts from ${rawRowCount} CSV rows. Errors: ${errors.length}`);

// 2. Run calculation
const result = calculateTipCycle(
  DEFAULT_RESTAURANT,
  '2026-09-07',
  '2026-09-20',
  shifts,
  MISSION_HILL_SAMPLE_TIPS
);

console.log(`\n[2] Cycle Calculation Results:`);
console.log(`- Start Date: ${result.startDate} | End Date: ${result.endDate}`);
console.log(`- Total Tips Distributed: $${result.totalTips.toFixed(2)} (Expected: $2118.87)`);
console.log(`- Total Eligible Hours: ${result.totalHours.toFixed(2)} hrs (Expected: 275.65 hrs)`);
console.log(`- Effective Average $/Hr: $${result.averagePerHourValue.toFixed(2)} / hr (Expected: $7.69/hr)`);
console.log(`- Total Recipient Staff: ${result.totalEligibleEmployees} (Expected: 8)`);
console.log(`- Excluded Shifts: ${result.excludedShiftsCount} (Kitchen Manager)`);
console.log(`- Reconciliation Differ: $${result.reconciliation.difference.toFixed(4)} (Expected: $0.0000)`);

// Expected employee payouts from Sheet 3:
const expectedPayouts: Record<string, { tips: number; hours: number; shifts: number }> = {
  'Sally Rodriguez': { tips: 490.91, hours: 57.85, shifts: 10 },
  'Meckenzie Anderson': { tips: 430.03, hours: 55.69, shifts: 9 },
  'Micaela Hartley': { tips: 405.95, hours: 43.78, shifts: 7 },
  'Lauren Sanders': { tips: 314.82, hours: 44.86, shifts: 9 },
  'Michelle Osnovikov': { tips: 215.48, hours: 37.22, shifts: 6 },
  'Cynthia Rosales Perez': { tips: 183.16, hours: 23.66, shifts: 5 },
  'Natalie Dreyer': { tips: 63.89, hours: 7.78, shifts: 2 },
  'Mikaela Sosa Fuentes': { tips: 14.62, hours: 4.81, shifts: 1 },
};

console.log(`\n[3] Employee Payout Verification:`);
let allMatch = true;
for (const emp of result.employeeSummaries) {
  const exp = expectedPayouts[emp.employeeName];
  if (!exp) {
    console.error(`Unexpected employee in results: ${emp.employeeName}`);
    allMatch = false;
    continue;
  }
  const tipsDiff = Math.abs(emp.totalTips - exp.tips);
  const hoursDiff = Math.abs(emp.totalHours - exp.hours);
  const shiftsMatch = emp.shiftCount === exp.shifts;
  const passed = tipsDiff < 0.02 && hoursDiff < 0.02 && shiftsMatch;
  console.log(
    `  ${emp.employeeName.padEnd(23)} | Tips: $${emp.totalTips.toFixed(2).padStart(7)} (Exp: $${exp.tips.toFixed(2).padStart(7)}) | Hours: ${emp.totalHours.toFixed(2).padStart(5)} (Exp: ${exp.hours.toFixed(2).padStart(5)}) | Shifts: ${emp.shiftCount} | ${passed ? '✓ MATCH' : '✗ MISMATCH'}`
  );
  if (!passed) allMatch = false;
}

if (allMatch && Math.abs(result.totalTips - 2118.87) < 0.02 && Math.abs(result.totalHours - 275.65) < 0.02) {
  console.log('\n====================================================');
  console.log('✓ 100% MATHEMATICAL AUDIT PASSED WITH ZERO DISCREPANCIES!');
  console.log('====================================================\n');
} else {
  console.error('\nFAIL: Verification had discrepancies.\n');
  process.exit(1);
}
