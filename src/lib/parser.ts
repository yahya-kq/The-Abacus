import * as XLSX from 'xlsx';
import {
  TipPoolSettings,
  ProcessedShift,
  ParseTimecardResult,
  ParseOtherTipSourceResult,
  DailyTipInput,
} from '../types/tips';

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
 * Parse raw date string or number into YYYY-MM-DD in local time
 * Supports:
 * - Excel serial dates (e.g. 46272 or 46272.5)
 * - ISO formats (YYYY-MM-DD, YYYY/MM/DD)
 * - US formats (MM/DD/YYYY, M/D/YYYY, MM-DD-YYYY, MM/DD/YY)
 * - Textual formats (07-Sep, 7-Sep, 07-Sep-2026, Sep 07 2026, September 7)
 * - Dates with timestamps (e.g. "2026-09-07 10:30:00")
 */
export function normalizeDate(dateVal: any, referenceYear = 2026): string {
  if (dateVal === undefined || dateVal === null || dateVal === '') return '';

  // If number or numeric string (Excel serial date e.g. 46272 or 46272.5)
  if (typeof dateVal === 'number' || (!isNaN(Number(dateVal)) && Number(dateVal) > 35000 && Number(dateVal) < 65000)) {
    const num = Number(dateVal);
    // Excel 1900 date system
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + num * 86400000);
    return formatDateISO(date);
  }

  // Clean string and strip any trailing time portion (e.g. " 12:00:00 AM", " 00:00:00", " 14:30")
  let str = String(dateVal).trim().replace(/\s+(?:12:00:00\s*AM|00:00:00|\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)$/i, '');

  // Strip day of week prefix if present (e.g. "Friday, September 11, 2026", "Mon, 07-Sep")
  str = str.replace(/^(?:mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)[,\s]+/i, '').trim();

  // 1. ISO format: YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = String(parseInt(isoMatch[2], 10)).padStart(2, '0');
    const d = String(parseInt(isoMatch[3], 10)).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 2. US Numeric: MM/DD/YYYY, M/D/YYYY, MM-DD-YYYY, M-D-YYYY, or with 2-digit year MM/DD/YY
  const usMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (usMatch) {
    let year = parseInt(usMatch[3], 10);
    if (year < 100) year += year < 50 ? 2000 : 1900;
    const m = String(parseInt(usMatch[1], 10)).padStart(2, '0');
    const d = String(parseInt(usMatch[2], 10)).padStart(2, '0');
    return `${year}-${m}-${d}`;
  }

  const months: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };

  // 3. DD-MMM or DD-MMM-YYYY (e.g. "07-Sep", "7-Sep", "07-Sep-2026", "7-Sep-26")
  const dMmmMatch = str.match(/^(\d{1,2})[-_\s]([A-Za-z]{3,9})(?:[-_\s](\d{2,4}))?$/);
  if (dMmmMatch) {
    const day = parseInt(dMmmMatch[1], 10);
    const mStr = dMmmMatch[2].substring(0, 3).toLowerCase();
    const month = months[mStr];
    if (month !== undefined) {
      let year = dMmmMatch[3] ? parseInt(dMmmMatch[3], 10) : referenceYear;
      if (year < 100) year += 2000;
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // 4. MMM DD or MMM DD, YYYY (e.g. "Sep 7", "September 11, 2026", "Sep-07-2026")
  const mmmDMatch = str.match(/^([A-Za-z]{3,9})[-_\s](\d{1,2})(?:,?\s*(\d{2,4}))?$/);
  if (mmmDMatch) {
    const mStr = mmmDMatch[1].substring(0, 3).toLowerCase();
    const day = parseInt(mmmDMatch[2], 10);
    const month = months[mStr];
    if (month !== undefined) {
      let year = mmmDMatch[3] ? parseInt(mmmDMatch[3], 10) : referenceYear;
      if (year < 100) year += 2000;
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // 5. Fallback Date parser for other browser-parseable formats (using local date components to avoid timezone offset drift)
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2000 && parsed.getFullYear() <= 2099) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return '';
}

/**
 * Clean and parse arbitrary monetary numbers (e.g. "$45.50", "1,250.00", "(15.00)", " - ")
 */
export function parseCleanNumber(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim();
  if (str === '-' || str.toLowerCase() === 'n/a' || str.toLowerCase() === 'null') return 0;
  // Handle accounting parentheses negative e.g. (45.50) -> -45.50
  const isParenNeg = /^\(.*\)$/.test(str);
  const clean = str.replace(/[^\d.-]/g, '');
  const num = parseFloat(clean);
  if (isNaN(num)) return 0;
  return isParenNeg ? -Math.abs(num) : num;
}

export type DetectedTipCategory = 'webdash' | 'kiosk' | 'online' | 'doordash' | 'gratuity' | 'other' | 'total';

/**
 * Classify generic column or label names into appropriate tip categories
 */
export function classifyTipSource(sourceName: string): DetectedTipCategory {
  const s = String(sourceName || '').toLowerCase().trim();
  if (s.includes('total') || s === 'sum' || s.includes('grand total') || s.includes('total tip') || s.includes('total pool')) {
    return 'total';
  }
  if (s.includes('kiosk') || s.includes('self-service') || s.includes('self service') || s.includes('tablet')) {
    return 'kiosk';
  }
  if (s.includes('webdash') || s.includes('web dash') || s.includes('timecard tip') || s.includes('shift tip')) {
    return 'webdash';
  }
  if (s.includes('doordash') || s.includes('door dash') || s.includes('3po') || s.includes('third party') || s.includes('delivery') || s.includes('ubereats') || s.includes('uber') || s.includes('grubhub')) {
    return 'doordash';
  }
  if (s.includes('online') || s.includes('mobile') || s.includes('toast online') || s.includes('toast') || s.includes('qr') || s.includes('digital') || s.includes('web tip') || s.includes('dashboard')) {
    return 'online';
  }
  if (s.includes('grat') || s.includes('service charge') || s.includes('auto-grat') || s.includes('autograt') || s.includes('direct') || s.includes('catering')) {
    return 'gratuity';
  }
  return 'other';
}

/**
 * Extract category and numeric amount directly from a cell string, even when merged
 * (e.g. "Kiosk Tips 6.21", "Online $120.50", "DoorDash 45.00")
 */
export function extractCategoryAndAmount(cellVal: any): { category: DetectedTipCategory | null; amount: number } {
  if (cellVal === undefined || cellVal === null) return { category: null, amount: 0 };
  const str = String(cellVal).trim();
  if (!str) return { category: null, amount: 0 };

  const lower = str.toLowerCase();
  let category: DetectedTipCategory | null = null;
  if (lower.includes('kiosk') || lower.includes('tablet')) category = 'kiosk';
  else if (lower.includes('webdash') || lower.includes('web dash')) category = 'webdash';
  else if (lower.includes('doordash') || lower.includes('door dash') || lower.includes('3po') || lower.includes('delivery') || lower.includes('uber') || lower.includes('grubhub')) category = 'doordash';
  else if (lower.includes('online') || lower.includes('dashboard') || lower.includes('web tip') || lower.includes('mobile') || lower.includes('toast')) category = 'online';
  else if (lower.includes('grat') || lower.includes('service charge') || lower.includes('catering')) category = 'gratuity';
  else if (lower.includes('total tip') || lower === 'total' || lower.includes('total pool')) category = 'total';
  else if (lower.includes('tip') || lower.includes('cash') || lower.includes('other')) category = 'other';

  if (!category) return { category: null, amount: 0 };

  const numMatch = str.match(/[\$]?\s*(\d+(?:\.\d{1,2})?)(?:\s*[\$\/a-zA-Z]*)?$/) || str.match(/[\$]\s*(\d+(?:\.\d{1,2})?)/) || str.match(/(\d+\.\d{1,2})/);
  const amount = numMatch ? parseFloat(numMatch[1]) : 0;

  return { category, amount };
}

/**
 * Calculate the business date for a shift.
 * If shift begins before the cutoff hour (default 12:00 PM noon),
 * it belongs to the previous calendar day's business day.
 */
export function calculateBusinessDate(calendarDateStr: string, timeIn: string, cutoffHour = 4): string {
  // By default, a shift's business date is its recorded calendar date
  // Only late-night overnight graveyard shifts starting between 0:00 and 4:00 AM
  // are shifted to previous business day if cutoffHour is explicitly configured.
  const hour = parseHourFromTime(timeIn);
  if (cutoffHour > 0 && cutoffHour <= 6 && hour >= 0 && hour < cutoffHour) {
    const [y, m, d] = calendarDateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 1);
    return formatDateISO(date);
  }
  return calendarDateStr;
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
/**
 * Parse 2D array of rows from timecard
 * Handles generic ordering, irregular headers, and unstructured shift formats
 */
export function parseTimecardRows(
  rows: any[][],
  settings: TipPoolSettings,
  referenceYear = 2026
): ParseTimecardResult {
  const shifts: ProcessedShift[] = [];
  const errors: string[] = [];
  const extractedDailyTips: Record<string, number> = {};

  if (!rows || rows.length < 2) {
    return { shifts: [], rawRowCount: 0, errors: ['File contains no shift records.'], extractedDailyTips: {} };
  }

  // Helper to check if a header string contains any alias
  const hasAlias = (text: string, aliases: string[]) => {
    const lower = text.toLowerCase().trim();
    return aliases.some((a) => lower === a || lower.includes(a));
  };

  // Find header row (searches up to row 20)
  let headerIndex = -1;
  for (let i = 0; i < Math.min(20, rows.length); i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    const rowStr = row.map((c) => String(c).toLowerCase()).join(' ');
    if (
      (rowStr.includes('name') || rowStr.includes('employee')) &&
      (rowStr.includes('role') || rowStr.includes('hours') || rowStr.includes('date') || rowStr.includes('time'))
    ) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    headerIndex = 0;
  }

  const header = rows[headerIndex].map((c) => String(c).trim().toLowerCase());

  // Match columns by comprehensive aliases
  const findCol = (aliases: string[]) => {
    return header.findIndex((h) => hasAlias(h, aliases));
  };

  const colIndex = {
    name: findCol(['name', 'employee', 'worker', 'staff', 'team member', 'full name', 'first name']),
    role: findCol(['role', 'job', 'position', 'department', 'title']),
    payRate: findCol(['pay rate', 'hourly rate', 'wage', 'rate']),
    date: findCol(['date', 'shift date', 'business date', 'work date', 'day']),
    timeIn: findCol(['time in', 'clock in', 'start time', 'start', 'punch in', 'in']),
    timeOut: findCol(['time out', 'clock out', 'end time', 'end', 'punch out', 'out']),
    totalHours: findCol([
      'total hours (excluding unpaid breaks)',
      'total hours',
      'worked hours',
      'regular hours',
      'total paid',
      'duration',
      'hours',
    ]),
    netSale: findCol(['net sale', 'sales', 'gross sale', 'total sale']),
    tips: findCol(['collected tips', 'credit card tips', 'cc tips', 'direct tips', 'tips']),
    gratuity: findCol(['gratuity', 'auto gratuity', 'service charge', 'grat']),
    regularHours: findCol(['regular hours', 'reg hours', 'regular']),
    overtime: findCol(['overtime', 'ot hours', 'ot']),
    doubleOvertime: findCol(['double overtime', 'double ot']),
    weeklyOvertime: findCol(['weekly overtime', 'weekly ot']),
    paidBreaksHours: findCol(['paid breaks hours', 'paid breaks', 'paid break']),
    unpaidBreaksHours: findCol(['unpaid breaks hours', 'unpaid breaks', 'unpaid break']),
  };

  // Dynamic Fallback: sample data rows if critical columns were not identified by header names
  const sampleRows = rows.slice(headerIndex + 1, Math.min(headerIndex + 25, rows.length));
  const maxCols = Math.max(...sampleRows.map((r) => r.length), header.length);

  if (colIndex.date === -1) {
    for (let c = 0; c < maxCols; c++) {
      let validDateCount = 0;
      for (const sr of sampleRows) {
        if (sr[c] && normalizeDate(sr[c], referenceYear)) validDateCount++;
      }
      if (validDateCount >= Math.min(3, sampleRows.length)) {
        colIndex.date = c;
        break;
      }
    }
  }

  if (colIndex.totalHours === -1) {
    for (let c = 0; c < maxCols; c++) {
      if (c === colIndex.date) continue;
      let validHoursCount = 0;
      for (const sr of sampleRows) {
        const num = parseCleanNumber(sr[c]);
        if (num > 0 && num <= 24) validHoursCount++;
      }
      if (validHoursCount >= Math.min(3, sampleRows.length)) {
        colIndex.totalHours = c;
        break;
      }
    }
  }

  if (colIndex.name === -1) colIndex.name = 0;
  if (colIndex.role === -1) colIndex.role = colIndex.name === 0 ? 1 : 0;
  if (colIndex.date === -1) colIndex.date = 3;
  if (colIndex.timeIn === -1) colIndex.timeIn = 4;
  if (colIndex.timeOut === -1) colIndex.timeOut = 5 >= header.length ? 5 : 6;
  if (colIndex.totalHours === -1) colIndex.totalHours = 13 >= header.length ? 7 : 13;

  let currentEmployeeName = '';
  const recipientRoles = new Set(settings.recipients.map((r) => r.role.toLowerCase()));
  const contributorRoles = new Set(settings.contributors.map((c) => c.role.toLowerCase()));

  for (let r = headerIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    // Check name
    const rawName = String(row[colIndex.name] || '').trim();
    if (rawName && rawName.toLowerCase() !== 'total' && !rawName.toLowerCase().startsWith('summary')) {
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
    const hours = parseCleanNumber(row[colIndex.totalHours]);

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

    const payRate = parseCleanNumber(row[colIndex.payRate]);
    const netSale = parseCleanNumber(row[colIndex.netSale]);
    const directTips = colIndex.tips !== -1 ? parseCleanNumber(row[colIndex.tips]) : 0;
    const gratuity = colIndex.gratuity !== -1 ? parseCleanNumber(row[colIndex.gratuity]) : 0;
    const collectedTips = directTips + gratuity;

    // Accumulate shift collected tips (from WebDash / POS) by business date
    if (collectedTips > 0) {
      extractedDailyTips[businessDate] = Math.round(((extractedDailyTips[businessDate] || 0) + collectedTips) * 100) / 100;
    }

    const regularHours = colIndex.regularHours !== -1 ? parseCleanNumber(row[colIndex.regularHours]) : hours;
    const overtimeHours = colIndex.overtime !== -1 ? parseCleanNumber(row[colIndex.overtime]) : 0;
    const doubleOvertime = colIndex.doubleOvertime !== -1 ? parseCleanNumber(row[colIndex.doubleOvertime]) : 0;
    const weeklyOvertime = colIndex.weeklyOvertime !== -1 ? parseCleanNumber(row[colIndex.weeklyOvertime]) : 0;
    const paidBreaksHours = colIndex.paidBreaksHours !== -1 ? parseCleanNumber(row[colIndex.paidBreaksHours]) : 0;
    const unpaidBreaksHours = colIndex.unpaidBreaksHours !== -1 ? parseCleanNumber(row[colIndex.unpaidBreaksHours]) : 0;

    shifts.push({
      id: `shift-${shifts.length + 1}`,
      employeeName: currentEmployeeName,
      role,
      payRate,
      rawDate: String(rawDate),
      timeIn,
      timeOut,
      regularHours,
      overtimeHours,
      doubleOvertime,
      weeklyOvertime,
      paidBreaksHours,
      unpaidBreaksHours,
      totalHours: hours,
      netSale,
      collectedTips,
      directTips,
      gratuity,
      calendarDate,
      businessDate,
      isEligibleRecipient,
      isContributor,
    });
  }

  // Ensure shifts are sorted chronologically: businessDate -> timeIn -> employeeName
  shifts.sort((a, b) => {
    if (a.businessDate !== b.businessDate) return a.businessDate.localeCompare(b.businessDate);
    if (a.timeIn !== b.timeIn) return a.timeIn.localeCompare(b.timeIn);
    return a.employeeName.localeCompare(b.employeeName);
  });

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

/**
 * Parse an "Other Tip Source" file (.xlsx, .xls, .csv) into daily tip entries
 */
export function parseOtherTipSourceFile(
  fileData: ArrayBuffer | Uint8Array,
  referenceYear = 2026
): ParseOtherTipSourceResult {
  const workbook = XLSX.read(fileData, { type: 'array' });
  return parseOtherTipSourceWorkbook(workbook, referenceYear);
}

export function parseOtherTipSourceCsv(
  csvText: string,
  referenceYear = 2026
): ParseOtherTipSourceResult {
  const workbook = XLSX.read(csvText, { type: 'string' });
  return parseOtherTipSourceWorkbook(workbook, referenceYear);
}

/**
 * Universal Multi-Strategy Other Tip Source Parser
 * Capable of automatically extracting dates and tip amounts from:
 * 1. Horizontal Matrix Tables (dates across column headers)
 * 2. Transactional Log Tables (date, category/source, amount columns)
 * 3. Generic Columnar Tables (date column + source columns in ANY order)
 * 4. Unstructured / Key-Value Blocks (dates as block headers with tip items below)
 */
function parseOtherTipSourceWorkbook(
  workbook: XLSX.WorkBook,
  referenceYear = 2026
): ParseOtherTipSourceResult {
  const dailyTips: Record<string, DailyTipInput> = {};
  const errors: string[] = [];

  const ensureDate = (d: string) => {
    if (!dailyTips[d]) {
      dailyTips[d] = {
        date: d,
        displayDate: formatDisplayDate(d),
        dayOfWeek: getDayOfWeek(d),
        webDashTips: 0,
        onlineTips: 0,
        doorDashTips: 0,
        kioskTips: 0,
        otherTips: 0,
        totalTips: 0,
      };
    }
    return dailyTips[d];
  };

  const addTip = (dateStr: string, category: DetectedTipCategory, amount: number) => {
    if (!dateStr || !amount) return;
    const entry = ensureDate(dateStr);
    if (category === 'kiosk') entry.kioskTips += amount;
    else if (category === 'online') entry.onlineTips = (entry.onlineTips || 0) + amount;
    else if (category === 'webdash') entry.webDashTips = (entry.webDashTips || 0) + amount;
    else if (category === 'doordash') entry.doorDashTips += amount;
    else if (category === 'gratuity' || category === 'other') entry.otherTips += amount;
    else if (category === 'total') entry.totalTips = amount;
  };

  const isDateHeader = (text: string) => {
    const s = String(text || '').toLowerCase().trim();
    return s === 'date' || s.includes('date') || s === 'day' || s.includes('shift date') || s.includes('business date');
  };

  // Iterate over all sheets in the workbook
  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    if (!ws) continue;
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (!rows || rows.length === 0) continue;

    let parsedSheet = false;

    // --- STRATEGY 1: Horizontal Matrix Table (Dates in column headers across a row) ---
    for (let r = 0; r < Math.min(15, rows.length); r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;
      const dateCols: { col: number; date: string }[] = [];
      for (let c = 0; c < row.length; c++) {
        const d = normalizeDate(row[c], referenceYear);
        if (d) dateCols.push({ col: c, date: d });
      }
      if (dateCols.length >= 2) {
        parsedSheet = true;
        for (let subR = r + 1; subR < rows.length; subR++) {
          const subRow = rows[subR];
          if (!subRow || !Array.isArray(subRow)) continue;
          const label = String(subRow[0] || subRow[1] || '').trim();
          const cat = classifyTipSource(label);
          for (const dc of dateCols) {
            const val = parseCleanNumber(subRow[dc.col]);
            if (val > 0) addTip(dc.date, cat, val);
          }
        }
        break;
      }
    }
    if (parsedSheet) continue;

    // --- STRATEGY 2: Transactional Log Table (Date col, Category/Source col, Amount col) ---
    for (let r = 0; r < Math.min(15, rows.length); r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;
      const lower = row.map((c) => String(c).toLowerCase().trim());
      const dateIdx = lower.findIndex(isDateHeader);
      const catIdx = lower.findIndex(
        (c) =>
          c.includes('source') ||
          c.includes('category') ||
          c.includes('type') ||
          c.includes('channel') ||
          c.includes('description') ||
          c.includes('tip name')
      );
      const amtIdx = lower.findIndex(
        (c) =>
          c.includes('amount') ||
          c === 'tips' ||
          c.includes('tip amount') ||
          c.includes('total') ||
          c.includes('value')
      );

      if (dateIdx !== -1 && catIdx !== -1 && amtIdx !== -1) {
        parsedSheet = true;
        for (let subR = r + 1; subR < rows.length; subR++) {
          const subRow = rows[subR];
          if (!subRow || !Array.isArray(subRow)) continue;
          const d = normalizeDate(subRow[dateIdx], referenceYear);
          if (!d) continue;
          const cat = classifyTipSource(subRow[catIdx]);
          const amt = parseCleanNumber(subRow[amtIdx]);
          if (amt > 0) addTip(d, cat, amt);
        }
        break;
      }
    }
    if (parsedSheet) continue;

    // --- STRATEGY 3: Generic Columnar Table (Date col + source columns in ANY order) ---
    for (let r = 0; r < Math.min(20, rows.length); r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;
      const lower = row.map((c) => String(c).toLowerCase().trim());
      const dateIdx = lower.findIndex(isDateHeader);

      if (dateIdx !== -1) {
        const colMap: { col: number; category: DetectedTipCategory }[] = [];
        for (let c = 0; c < row.length; c++) {
          if (c === dateIdx) continue;
          const cat = classifyTipSource(lower[c]);
          colMap.push({ col: c, category: cat });
        }

        // Verify if at least one column is a recognized tip source or total
        const hasRecognizedTipCol = colMap.some((cm) => cm.category !== 'other');
        if (hasRecognizedTipCol) {
          parsedSheet = true;
          for (let subR = r + 1; subR < rows.length; subR++) {
            const subRow = rows[subR];
            if (!subRow || !Array.isArray(subRow)) continue;
            const d = normalizeDate(subRow[dateIdx], referenceYear);
            if (!d) continue;
            for (const cm of colMap) {
              const val = parseCleanNumber(subRow[cm.col]);
              if (val > 0) addTip(d, cm.category, val);
            }
          }
          break;
        }
      }
    }
    if (parsedSheet) continue;

    // --- STRATEGY 4: Format-Agnostic Blocks & Single-Cell Merged Entries ---
    let activeDate: string | null = null;
    let inSummaryHeader = false;

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !Array.isArray(row)) continue;

      // Check if any cell in early columns contains a valid date header
      for (let c = 0; c < Math.min(5, row.length); c++) {
        const d = normalizeDate(row[c], referenceYear);
        if (d && d !== activeDate) {
          activeDate = d;
          inSummaryHeader = true;
          ensureDate(activeDate);
          break;
        }
      }

      if (!activeDate) continue;

      // Detect end of summary header (e.g. employee shift table starts)
      for (let c = 0; c < Math.min(5, row.length); c++) {
        const s = String(row[c] || '').toLowerCase().trim();
        if (s === 'employees' || s.includes('per hour value') || s.includes('total hours')) {
          inSummaryHeader = false;
          break;
        }
      }

      if (!inSummaryHeader) continue;

      // Scan row for tip channel entries (both merged text+amount and separate columns)
      for (let c = 0; c < row.length; c++) {
        const cell = row[c];
        if (!cell) continue;

        const extracted = extractCategoryAndAmount(cell);
        if (extracted.category && extracted.amount > 0) {
          addTip(activeDate, extracted.category, extracted.amount);
          continue;
        }

        if (extracted.category) {
          let num = 0;
          if (c + 1 < row.length) {
            num = parseCleanNumber(row[c + 1]);
          }
          if (!num && c + 2 < row.length) {
            num = parseCleanNumber(row[c + 2]);
          }
          if (num > 0) {
            addTip(activeDate, extracted.category, num);
          }
        }
      }
    }
  }

  // Ensure totalTips is computed if missing or if component sum is greater
  for (const d of Object.values(dailyTips)) {
    const componentSum = (d.webDashTips || 0) + (d.onlineTips || 0) + (d.doorDashTips || 0) + (d.kioskTips || 0) + (d.otherTips || 0);
    if (!d.totalTips || d.totalTips < componentSum) {
      d.totalTips = Math.round(componentSum * 100) / 100;
    }
  }

  // Ensure dates are sorted chronologically
  const sortedDates = Object.keys(dailyTips).sort();
  const sortedDailyTips: Record<string, DailyTipInput> = {};
  for (const dt of sortedDates) {
    sortedDailyTips[dt] = dailyTips[dt];
  }

  const detectedStartDate = sortedDates[0];
  const detectedEndDate = sortedDates[sortedDates.length - 1];

  return {
    dailyTips: sortedDailyTips,
    detectedStartDate,
    detectedEndDate,
    errors,
  };
}

/**
 * Parse plain text, raw tab-delimited, or OCR transcribed lines into daily tip entries
 */
export function parseOtherTipSourceText(text: string, referenceYear = 2026): ParseOtherTipSourceResult {
  const lines = text.split(/\r?\n/);
  const rows: any[][] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.includes('\t')) {
      rows.push(trimmed.split('\t').map((c) => c.trim()));
    } else if (trimmed.includes('|')) {
      rows.push(trimmed.split('|').map((c) => c.trim()));
    } else if (trimmed.includes(',') && !trimmed.includes(', ')) {
      rows.push(trimmed.split(',').map((c) => c.trim()));
    } else {
      const parts = trimmed.split(/\s{2,}/);
      if (parts.length > 1) {
        rows.push(parts);
      } else {
        rows.push([trimmed]);
      }
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  return parseOtherTipSourceWorkbook(wb, referenceYear);
}

/**
 * Perform client-side OCR on image/screenshot of tip sheets (PNG, JPG, WEBP)
 */
export async function parseOtherTipSourceImage(
  imageFile: File | Blob,
  referenceYear = 2026
): Promise<ParseOtherTipSourceResult> {
  const Tesseract = await import('tesseract.js');
  const result = await Tesseract.recognize(imageFile, 'eng');
  const text = result?.data?.text || '';
  return parseOtherTipSourceText(text, referenceYear);
}

/**
 * Extract restaurant name and cycle date range (startDate, endDate) from the file name.
 * e.g. "Mission_Hill_Coffee_&_Creamery_Time_Card_Report_2026-09-07_to_2026-09-20.csv"
 * -> restaurantName: "Mission Hill Coffee & Creamery"
 * -> startDate: "2026-09-07"
 * -> endDate: "2026-09-20"
 */
export function parseFileNameMetadata(fileName: string): {
  restaurantName?: string;
  startDate?: string;
  endDate?: string;
} {
  if (!fileName) return {};

  const baseName = fileName.replace(/\.[^/.]+$/, '');
  let startDate: string | undefined;
  let endDate: string | undefined;
  let namePart = baseName;

  // Match ISO YYYY-MM-DD to YYYY-MM-DD (e.g. 2026-09-07_to_2026-09-20 or 2026-09-07 to 2026-09-20)
  const isoMatch = baseName.match(/(\d{4}-\d{2}-\d{2})[_\s]+(?:to|-)[_\s]+(\d{4}-\d{2}-\d{2})/i);
  if (isoMatch) {
    startDate = isoMatch[1];
    endDate = isoMatch[2];
    namePart = baseName.substring(0, isoMatch.index);
  } else {
    // Match US formats: MM-DD-YYYY or MM.DD.YYYY
    const usMatch = baseName.match(/(\d{2})[-_.](\d{2})[-_.](\d{4})[_\s]+(?:to|-)[_\s]+(\d{2})[-_.](\d{2})[-_.](\d{4})/i);
    if (usMatch) {
      startDate = `${usMatch[3]}-${usMatch[1]}-${usMatch[2]}`;
      endDate = `${usMatch[6]}-${usMatch[4]}-${usMatch[5]}`;
      namePart = baseName.substring(0, usMatch.index);
    }
  }

  // Clean name part: remove common descriptors like Time_Card_Report, Time_Cards, Timecard, Report, etc.
  namePart = namePart
    .replace(/[_\s]*(?:time[_\s]*card(?:s)?[_\s]*report|time[_\s]*cards?|timecard(?:s)?|report|shift(?:s)?)[_\s]*/gi, ' ')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const restaurantName = namePart.length > 1 ? namePart : undefined;

  return { restaurantName, startDate, endDate };
}

