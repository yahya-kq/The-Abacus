import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CycleCalculationResult } from '../types/tips';
import { formatDisplayDate } from './parser';

export function generateTipCyclePDF(result: CycleCalculationResult): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;

  // Header Background Banner (Modern Indigo/Slate Theme, no marketing text)
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, pageWidth, 80, 'F');

  // Restaurant Name (Only Restaurant Name, no Abacus)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text(result.restaurant.name.toUpperCase(), margin, 38);

  // Period Cycle Subheader
  const cycleText = `Period: ${formatDisplayDate(result.startDate)} — ${formatDisplayDate(result.endDate)}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text(cycleText, margin, 58);

  // Generated Date on right side
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // Slate 400
  const genDate = `Generated: ${new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`;
  doc.text(genDate, pageWidth - margin, 50, { align: 'right' });

  let currentY = 102;

  // Executive KPI Summary Cards (3 clean cards: Total Tips, Total Hours, Rate / Hr)
  const cardWidth = (contentWidth - 20) / 3;
  const cardHeight = 52;

  const kpis = [
    { label: 'TOTAL TIPS DISTRIBUTED', value: `$${result.totalTips.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: [37, 99, 235] },
    { label: 'TOTAL HOURS WORKED', value: `${result.totalHours.toFixed(2)} hrs`, color: [14, 116, 144] },
    { label: 'AVERAGE RATE / HR', value: `$${result.averagePerHourValue.toFixed(2)} / hr`, color: [79, 70, 229] },
  ];

  kpis.forEach((kpi, idx) => {
    const cardX = margin + idx * (cardWidth + 10);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 6, 6, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 6, 6, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, cardX + 12, currentY + 18);

    doc.setFontSize(13);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, cardX + 12, currentY + 38);
  });

  currentY += cardHeight + 24;

  // Section Header: Employee Tip Distribution (Clean, no disclaimers)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Employee Tip Distribution', margin, currentY);

  currentY += 14;

  // Employee Table (No "Shifts" column per user request)
  const employeeTableBody = result.employeeSummaries.map((emp) => [
    emp.employeeName,
    emp.role,
    emp.totalHours.toFixed(2),
    `$${emp.averagePerHourTip.toFixed(2)}`,
    `${((emp.totalTips / result.totalTips) * 100).toFixed(1)}%`,
    `$${emp.totalTips.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  ]);

  // Totals Row
  employeeTableBody.push([
    'TOTALS',
    `${result.totalEligibleEmployees} Staff`,
    result.totalHours.toFixed(2),
    `$${result.averagePerHourValue.toFixed(2)}`,
    '100.0%',
    `$${result.totalTips.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Employee Name', 'Role', 'Total Hours', 'Rate ($/hr)', 'Share (%)', 'Total Payout']],
    body: employeeTableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
      cellPadding: 6,
    },
    styles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
      cellPadding: 5.5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 160 },
      1: { cellWidth: 90 },
      2: { halign: 'right', cellWidth: 85 },
      3: { halign: 'right', cellWidth: 80 },
      4: { halign: 'right', cellWidth: 70 },
      5: { halign: 'right', fontStyle: 'bold', textColor: [37, 99, 235], cellWidth: 95 },
    },
    didParseCell: (data) => {
      if (data.row.index === employeeTableBody.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249];
        if (data.column.index === 5) {
          data.cell.styles.textColor = [37, 99, 235];
        }
      }
    },
    margin: { left: margin, right: margin },
  });

  currentY = (doc as any).lastAutoTable.finalY + 26;

  // Check if enough space for Daily Breakdown on page 1, else add page
  if (currentY > pageHeight - 200) {
    doc.addPage();
    currentY = 40;
  }

  // Section Header: Daily Breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Daily Tip Summary', margin, currentY);

  currentY += 14;

  const dailyTableBody = result.dailyCalculations.map((d) => [
    d.displayDate,
    d.dayOfWeek,
    `$${d.tipSources.webDash.toFixed(2)}`,
    `$${d.tipSources.doorDash.toFixed(2)}`,
    `$${d.tipSources.kiosk.toFixed(2)}`,
    `$${d.tipSources.other.toFixed(2)}`,
    `$${d.totalTips.toFixed(2)}`,
    `${d.totalHours.toFixed(2)} hrs`,
    `$${d.perHourValue.toFixed(2)}/hr`,
  ]);

  dailyTableBody.push([
    'TOTALS',
    `${result.dailyCalculations.length} Days`,
    `$${result.dailyCalculations.reduce((s, d) => s + d.tipSources.webDash, 0).toFixed(2)}`,
    `$${result.dailyCalculations.reduce((s, d) => s + d.tipSources.doorDash, 0).toFixed(2)}`,
    `$${result.dailyCalculations.reduce((s, d) => s + d.tipSources.kiosk, 0).toFixed(2)}`,
    `$${result.dailyCalculations.reduce((s, d) => s + d.tipSources.other, 0).toFixed(2)}`,
    `$${result.totalTips.toFixed(2)}`,
    `${result.totalHours.toFixed(2)} hrs`,
    `$${result.averagePerHourValue.toFixed(2)}/hr`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Business Date', 'Day', 'WebDash', 'DoorDash', 'Kiosk', 'Other', 'Total Tips', 'Total Hours', 'Rate ($/hr)']],
    body: dailyTableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
      cellPadding: 5,
    },
    styles: {
      fontSize: 8,
      textColor: [51, 65, 85],
      cellPadding: 4.5,
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right', fontStyle: 'bold', textColor: [37, 99, 235] },
      7: { halign: 'right' },
      8: { halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.row.index === dailyTableBody.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249];
      }
    },
    margin: { left: margin, right: margin },
  });

  // Footer on each page (clean, no Abacus branding)
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 28, pageWidth - margin, pageHeight - 28);

    doc.text(`${result.restaurant.name} | Tip Distribution Summary`, margin, pageHeight - 16);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 16, { align: 'right' });
  }

  // File naming: strictly Mission_Hill and period cycle
  const cleanRestName = result.restaurant.name.replace(/\s+/g, '_');
  const filename = `${cleanRestName}_${result.startDate}_to_${result.endDate}.pdf`;
  doc.save(filename);
}
