import * as XLSX from 'xlsx';
import { TipPoolSettings, ProcessedShift, ParseTimecardResult } from '../types/tips';

/**
 * Format a Date object to YYYY-MM-DD in local time
 */
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format date for friendly display (e.g., "Sep 07, 2026")
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format day of week (e.g., "Monday")
 */
export function getDayOfWeek(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return '';
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Parse time string (e.g., "10:00 PM", "7:26 AM", "22:00") or Excel fraction into hour in 24-hr format (0-23)
 */
export function parseHourFromTime(timeVal: any): number {
  if (timeVal === undefined || timeVal === null || timeVal === '') return 0;

  // If numeric or float string representing Excel fraction of day (e.g. 0.916666667 = 10:00 PM)
  const num = typeof timeVal === 'number' ? timeVal : parseFloat(String(timeVal));
  if (!isNaN(num) && num > 0 && num < 1 && !String(timeVal).includes(':')) {
    return Math.floor(num * 24);
  }

  const str = String(timeVal).trim().toUpperCase();
  const match = str.match(/(\d+)(?::(\d+))?\s*(AM|PM)?/i);
  if (!match) return 0;

  let hour = parseInt(match[1], 10);
  const ampm = match[3];

  if (ampm === 'PM' && hour < 12) {
    hour += 12;
  } else if (ampm === 'AM' && hour === 12) {
    hour = 0;
  }
  return hour;
}

/**
 * Format fraction or time string to standard 12-hour AM/PM format
 */
export function formatTimeDisplay(timeVal: any): string {
  if (timeVal === undefined || timeVal === null || timeVal === '') return '--';
  const num = typeof timeVal === 'number' ? timeVal : parseFloat(String(timeVal));
  if (!isNaN(num) && num >= 0 && num <= 1 && !String(timeVal).includes(':')) {
    const totalMinutes = Math.round(num * 24 * 60);
    const hours24 = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    const ampm = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    return `${hours12}:${String(minutes).padStart(2, '0')} ${ampm}`;
  }
  return String(timeVal);
}

/**
 * Parse raw date string (e.g. "07-Sep", "2026-09-07", Excel serial 46272) into YYYY-MM-DD
 */
export function normalizeDate(dateVal: any, referenceYear = 2026): string {
  if (!dateVal) return '';

  // If number (Excel serial date)
  if (typeof dateVal === 'number' || (!isNaN(Number(dateVal)) && Number(dateVal) > 40000)) {
    const num = Number(dateVal);
    // Excel 1900 date system
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + num * 86400000);
    return formatDateISO(date);
  }

  const str = String(dateVal).trim();

  // If standard YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Format like "07-Sep" or "7-Sep"
  const mmmMatch = str.match(/^(\d{1,2})-([A-Za-z]{3})$/);
  if (mmmMatch) {
    const day = parseInt(mmmMatch[1], 10);
    const monthStr = mmmMatch[2].toLowerCase();
    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    const month = months[monthStr] ?? 8;
    const date = new Date(referenceYear, month, day);
    return formatDateISO(date);
  }

  // Fallback Date parser
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return formatDateISO(parsed);
  }

  return str;
}

/**
 * Calculate the business date for a shift.
 * If shift begins before the cutoff hour (default 12:00 PM noon),
 * it belongs to the previous calendar day's business day.
 */
export function calculateBusinessDate(calendarDateStr: string, timeIn: string, cutoffHour = 12): string {
  const hour = parseHourFromTime(timeIn);
  const [y, m, d] = calendarDateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);

  if (hour < cutoffHour) {
    date.setDate(date.getDate() - 1);
  }

  return formatDateISO(date);
}

/**
 * Parse an Excel file buffer into shifts and daily tips
 */
export function parseTimecardFile(
  fileData: ArrayBuffer | Uint8Array,
  settings: TipPoolSettings,
  referenceYear = 2026
): ParseTimecardResult {
  const workbook = XLSX.read(fileData, { type: 'array' });
  
  // Prefer 'Time Card Data' or sheet with shifts
  let bestSheetName = workbook.SheetNames[0];
  for (const sName of workbook.SheetNames) {
    if (sName.toLowerCase().includes('time card') || sName.toLowerCase().includes('shifts')) {
      bestSheetName = sName;
      break;
    }
  }

  const worksheet = workbook.Sheets[bestSheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  return parseTimecardRows(rows, settings, referenceYear);
}

/**
 * Parse CSV text into shifts and daily tips
 */
export function parseTimecardCsv(
  csvText: string,
  settings: TipPoolSettings,
  referenceYear = 2026
): ParseTimecardResult {
  const workbook = XLSX.read(csvText, { type: 'string' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  return parseTimecardRows(rows, settings, referenceYear);
}

/**
 * Parse 2D array of rows from timecard
 */
export function parseTimecardRows(
  rows: any[][],
  settings: TipPoolSettings,
  referenceYear = 2026
): ParseTimecardResult {
  const shifts: ProcessedShift[] = [];
  const errors: string[] = [];
  const extractedDailyTips: Record<string, number> = {};

  if (rows.length < 2) {
    return { shifts: [], rawRowCount: 0, errors: ['File contains no shift records.'], extractedDailyTips: {} };
  }

  // Find header row (looks for "Name", "Role", "Date", "Total Hours")
  let headerIndex = -1;
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const rowStr = rows[i].map((c) => String(c).toLowerCase()).join(' ');
    if (rowStr.includes('name') && (rowStr.includes('role') || rowStr.includes('hours') || rowStr.includes('date'))) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    headerIndex = 0;
  }

  const header = rows[headerIndex].map((c) => String(c).trim().toLowerCase());

  // Find column indices
  const colIndex = {
    name: header.findIndex((h) => h === 'name' || h.includes('employee')),
    role: header.findIndex((h) => h === 'role' || h.includes('job') || h.includes('position')),
    payRate: header.findIndex((h) => h.includes('pay rate') || h.includes('rate')),
    date: header.findIndex((h) => h === 'date' || h.includes('shift date')),
    timeIn: header.findIndex((h) => h.includes('time in') || h.includes('in')),
    timeOut: header.findIndex((h) => h.includes('time out') || h.includes('out')),
    totalHours: header.findIndex(
      (h) =>
        h.includes('total hours (excluding unpaid breaks)') ||
        h.includes('total hours') ||
        h === 'hours' ||
        h.includes('total paid')
    ),
    netSale: header.findIndex((h) => h.includes('net sale') || h.includes('sales')),
    tips: header.findIndex((h) => h === 'tips' || h.includes('collected tips') || h.includes('credit card tips')),
    gratuity: header.findIndex((h) => h.includes('gratuity')),
  };

  // Defaults
  if (colIndex.name === -1) colIndex.name = 0;
  if (colIndex.role === -1) colIndex.role = 1;
  if (colIndex.date === -1) colIndex.date = 3;
  if (colIndex.timeIn === -1) colIndex.timeIn = 4;
  if (colIndex.timeOut === -1) colIndex.timeOut = 6 >= rows[headerIndex].length ? 5 : 6;
  if (colIndex.totalHours === -1) colIndex.totalHours = 13 >= rows[headerIndex].length ? 7 : 13;

  let currentEmployeeName = '';
  const recipientRoles = new Set(settings.recipients.map((r) => r.role.toLowerCase()));
  const contributorRoles = new Set(settings.contributors.map((c) => c.role.toLowerCase()));

  for (let r = headerIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    // Check name
    const rawName = String(row[colIndex.name] || '').trim();
    if (rawName && rawName.toLowerCase() !== 'total') {
      currentEmployeeName = rawName;
    }

    const role = String(row[colIndex.role] || '').trim();

    // Skip empty lines or summary rows
    if (!role || role.toLowerCase() === 'total' || !currentEmployeeName) {
      continue;
    }

    const rawDate = row[colIndex.date];
    const timeIn = formatTimeDisplay(row[colIndex.timeIn]);
    const timeOut = formatTimeDisplay(row[colIndex.timeOut]);
    const rawHours = row[colIndex.totalHours];

    const hours = typeof rawHours === 'number' ? rawHours : parseFloat(String(rawHours).replace(/[^\d.-]/g, '')) || 0;

    // Skip 0 hour shifts
    if (hours <= 0) continue;

    const calendarDate = normalizeDate(rawDate, referenceYear);
    if (!calendarDate) {
      errors.push(`Row ${r + 1}: Could not parse date "${rawDate}" for ${currentEmployeeName}.`);
      continue;
    }

    const businessDate = calculateBusinessDate(calendarDate, timeIn, settings.businessDayCutoffHour);
    const isEligibleRecipient = recipientRoles.has(role.toLowerCase());
    const isContributor = contributorRoles.has(role.toLowerCase());

    const payRate = parseFloat(String(row[colIndex.payRate] || '0').replace(/[^\d.-]/g, '')) || 0;
    const netSale = parseFloat(String(row[colIndex.netSale] || '0').replace(/[^\d.-]/g, '')) || 0;
    const collectedTips = colIndex.tips !== -1 ? (parseFloat(String(row[colIndex.tips] || '0').replace(/[^\d.-]/g, '')) || 0) : 0;
    const gratuity = colIndex.gratuity !== -1 ? (parseFloat(String(row[colIndex.gratuity] || '0').replace(/[^\d.-]/g, '')) || 0) : 0;

    // If role is Summary or Kiosk, accumulate directly into extracted tips
    if (role.toLowerCase() === 'summary' || role.toLowerCase() === 'kiosk') {
      extractedDailyTips[businessDate] = (extractedDailyTips[businessDate] || 0) + collectedTips;
    }

    shifts.push({
      id: `shift-${shifts.length + 1}`,
      employeeName: currentEmployeeName,
      role,
      payRate,
      rawDate: String(rawDate),
      timeIn,
      timeOut,
      totalHours: hours,
      netSale,
      collectedTips,
      gratuity,
      calendarDate,
      businessDate,
      isEligibleRecipient,
      isContributor,
    });
  }

  // Detect min and max business dates
  const dates = shifts.map((s) => s.businessDate).filter(Boolean).sort();
  const detectedStartDate = dates[0] || undefined;
  const detectedEndDate = dates[dates.length - 1] || undefined;

  return {
    shifts,
    rawRowCount: rows.length,
    errors,
    detectedStartDate,
    detectedEndDate,
    extractedDailyTips,
  };
}
