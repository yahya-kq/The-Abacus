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
    const directTips = colIndex.tips !== -1 ? (parseFloat(String(row[colIndex.tips] || '0').replace(/[^\d.-]/g, '')) || 0) : 0;
    const gratuity = colIndex.gratuity !== -1 ? (parseFloat(String(row[colIndex.gratuity] || '0').replace(/[^\d.-]/g, '')) || 0) : 0;
    const collectedTips = directTips + gratuity;

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
      directTips,
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

function parseOtherTipSourceWorkbook(
  workbook: XLSX.WorkBook,
  referenceYear = 2026
): ParseOtherTipSourceResult {
  const dailyTips: Record<string, DailyTipInput> = {};
  const errors: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (!rows || rows.length === 0) continue;

    // Check if columnar format (Header row with Date, Tips, etc.)
    let dateCol = -1;
    let onlineCol = -1;
    let doordashCol = -1;
    let kioskCol = -1;
    let otherCol = -1;
    let totalCol = -1;
    let headerRow = -1;

    for (let r = 0; r < Math.min(15, rows.length); r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;
      const lowerRow = row.map((c) => String(c).toLowerCase().trim());
      const dIdx = lowerRow.findIndex((c) => c === 'date' || c.includes('cycle date') || c.includes('shift date'));
      if (dIdx !== -1) {
        dateCol = dIdx;
        headerRow = r;
        onlineCol = lowerRow.findIndex((c) => c.includes('dash') || c.includes('online') || c.includes('web'));
        doordashCol = lowerRow.findIndex((c) => c.includes('door') || c.includes('3po') || c.includes('delivery'));
        kioskCol = lowerRow.findIndex((c) => c.includes('kiosk'));
        otherCol = lowerRow.findIndex((c) => c.includes('other'));
        totalCol = lowerRow.findIndex((c) => c.includes('total tip') || c === 'total');
        break;
      }
    }

    if (dateCol !== -1) {
      for (let r = headerRow + 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || !row[dateCol]) continue;
        const dVal = row[dateCol];
        const dateStr = normalizeDate(dVal, referenceYear);
        if (!dateStr) continue;

        const webDashTips = onlineCol !== -1 ? (parseFloat(String(row[onlineCol]).replace(/[^\d.-]/g, '')) || 0) : 0;
        const doorDashTips = doordashCol !== -1 ? (parseFloat(String(row[doordashCol]).replace(/[^\d.-]/g, '')) || 0) : 0;
        const kioskTips = kioskCol !== -1 ? (parseFloat(String(row[kioskCol]).replace(/[^\d.-]/g, '')) || 0) : 0;
        const otherTips = otherCol !== -1 ? (parseFloat(String(row[otherCol]).replace(/[^\d.-]/g, '')) || 0) : 0;
        let totalTips = totalCol !== -1 ? (parseFloat(String(row[totalCol]).replace(/[^\d.-]/g, '')) || 0) : 0;
        if (!totalTips) totalTips = webDashTips + doorDashTips + kioskTips + otherTips;

        dailyTips[dateStr] = {
          date: dateStr,
          displayDate: formatDisplayDate(dateStr),
          dayOfWeek: getDayOfWeek(dateStr),
          webDashTips,
          doorDashTips,
          kioskTips,
          otherTips,
          totalTips,
        };
      }
    } else {
      // Check block-style layout (like Mission Hill Tips where dates are headers and tips are listed underneath)
      let currentDate = '';
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        if (!row || !Array.isArray(row)) continue;

        // Check for date in early columns
        for (let c = 0; c < Math.min(5, row.length); c++) {
          const val = row[c];
          if (
            (typeof val === 'number' && val > 40000 && val < 60000) ||
            (typeof val === 'string' && (/^\d{4}-\d{2}-\d{2}$/.test(val) || /^\d{1,2}-[A-Za-z]{3}$/.test(val)))
          ) {
            const parsed = normalizeDate(val, referenceYear);
            if (parsed) {
              currentDate = parsed;
              if (!dailyTips[currentDate]) {
                dailyTips[currentDate] = {
                  date: currentDate,
                  displayDate: formatDisplayDate(currentDate),
                  dayOfWeek: getDayOfWeek(currentDate),
                  webDashTips: 0,
                  doorDashTips: 0,
                  kioskTips: 0,
                  otherTips: 0,
                  totalTips: 0,
                };
              }
            }
          }
        }

        // Check for tip line items
        const line = row.map((x) => String(x).toLowerCase().trim());
        for (let c = 0; c < line.length; c++) {
          const cell = line[c];
          const nextVal = parseFloat(String(row[c + 1] || '0').replace(/[^\d.-]/g, '')) || 0;
          if (currentDate && dailyTips[currentDate]) {
            if (cell.includes('dashboard tip') || cell.includes('webdash') || cell === 'online tips') {
              dailyTips[currentDate].webDashTips = nextVal;
            } else if (cell.includes('doordash') || cell.includes('3po') || cell.includes('delivery')) {
              dailyTips[currentDate].doorDashTips = nextVal;
            } else if (cell.includes('kiosk tip') || cell === 'kiosk') {
              dailyTips[currentDate].kioskTips = nextVal;
            } else if (cell === 'total tips' || cell === 'total tip') {
              dailyTips[currentDate].totalTips = nextVal;
            }
          }
        }
      }
    }
  }

  // Ensure totalTips is computed if missing
  for (const d of Object.values(dailyTips)) {
    if (!d.totalTips) {
      d.totalTips = (d.webDashTips || 0) + (d.doorDashTips || 0) + (d.kioskTips || 0) + (d.otherTips || 0);
    }
  }

  const sortedDates = Object.keys(dailyTips).sort();
  const detectedStartDate = sortedDates[0];
  const detectedEndDate = sortedDates[sortedDates.length - 1];

  return {
    dailyTips,
    detectedStartDate,
    detectedEndDate,
    errors,
  };
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

