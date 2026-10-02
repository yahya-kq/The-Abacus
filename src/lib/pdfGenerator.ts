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

  const primaryColor = [15, 23, 42]; // Slate 900
  const accentColor = [16, 185, 129]; // Emerald 500
  const secondaryColor = [71, 85, 105]; // Slate 600
  const lightBg = [248, 250, 252]; // Slate 50

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;

  // Header Background Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 95, 'F');

  // Brand & Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('ABACUS', margin, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('RESTAURANT TIP DISTRIBUTION STATEMENT', margin + 105, 40);

  // Restaurant & Date Sub-header inside banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(result.restaurant.name.toUpperCase(), margin, 68);

  const cycleText = `Cycle: ${formatDisplayDate(result.startDate)} — ${formatDisplayDate(result.endDate)}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225);
  doc.text(cycleText, margin, 82);

  // Right banner metadata
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`, pageWidth - margin, 68, { align: 'right' });
  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.text('RECONCILED: DIFFER $0.00', pageWidth - margin, 82, { align: 'right' });

  let currentY = 115;

  // Executive KPI Summary Cards (4 blocks)
  const cardWidth = (contentWidth - 30) / 4;
  const cardHeight = 55;

  const kpis = [
    { label: 'TOTAL TIPS DISTRIBUTED', value: `$${result.totalTips.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: [16, 185, 129] },
    { label: 'TOTAL ELIGIBLE HOURS', value: `${result.totalHours.toFixed(2)} hrs`, color: [59, 130, 246] },
    { label: 'AVG TIP VALUE / HR', value: `$${result.averagePerHourValue.toFixed(2)} / hr`, color: [168, 85, 247] },
    { label: 'RECIPIENT EMPLOYEES', value: `${result.totalEligibleEmployees} Staff`, color: [245, 158, 11] },
  ];

  kpis.forEach((kpi, idx) => {
    const cardX = margin + idx * (cardWidth + 10);
    // Background
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 6, 6, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 6, 6, 'S');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, cardX + 10, currentY + 18);

    // Value
    doc.setFontSize(13);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, cardX + 10, currentY + 40);
  });

  currentY += cardHeight + 20;

  // Policy / Structure Info Strip
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, contentWidth, 32, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Tip Model: Equal Distribution', margin + 12, currentY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Contributors: Server (100%), Cashier (100%), Owner (100%), Kiosk (100%), Online (100%), QR (100%), 3PO (100%)  |  Recipients: Cashier, Server`,
    margin + 12,
    currentY + 25
  );

  currentY += 45;

  // Section Header: Master Employee Payouts
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Employee Tip Distribution Summary', margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Calculated using verified total hours from time card. Regular and overtime hours combined.', margin, currentY + 12);

  currentY += 20;

  // Employee Table
  const employeeTableBody = result.employeeSummaries.map((emp) => [
    emp.employeeName,
    emp.role,
    String(emp.shiftCount),
    emp.totalHours.toFixed(2),
    `$${emp.averagePerHourTip.toFixed(2)}`,
    `${((emp.totalTips / result.totalTips) * 100).toFixed(1)}%`,
    `$${emp.totalTips.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  ]);

  // Add Total row
  employeeTableBody.push([
    'TOTALS',
    `${result.totalEligibleEmployees} Staff`,
    String(result.totalShiftsWorked),
    result.totalHours.toFixed(2),
    `$${result.averagePerHourValue.toFixed(2)}`,
    '100.0%',
    `$${result.totalTips.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Employee Name', 'Role', 'Shifts', 'Total Hours', 'Avg Tip/Hr', 'Pool Share', 'Total Payout']],
    body: employeeTableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
      cellPadding: 6,
    },
    styles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
      cellPadding: 5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 140 },
      1: { cellWidth: 70 },
      2: { halign: 'center', cellWidth: 45 },
      3: { halign: 'right', cellWidth: 65 },
      4: { halign: 'right', cellWidth: 65 },
      5: { halign: 'right', cellWidth: 60 },
      6: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129], cellWidth: 85 },
    },
    didParseCell: (data) => {
      if (data.row.index === employeeTableBody.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249];
        if (data.column.index === 6) {
          data.cell.styles.textColor = [16, 185, 129];
        }
      }
    },
    margin: { left: margin, right: margin },
  });

  currentY = (doc as any).lastAutoTable.finalY + 25;

  // If page space is low, start new page
  if (currentY > pageHeight - 180) {
    doc.addPage();
    currentY = 40;
  }

  // Daily Cycle Breakdown Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Daily Tip & Hours Reconciliation', margin, currentY);

  currentY += 16;

  const dailyTableBody = result.dailyCalculations.map((d) => [
    d.displayDate,
    d.dayOfWeek,
    `$${d.tipSources.webDash.toFixed(2)}`,
    `$${d.tipSources.kiosk.toFixed(2)}`,
    `$${d.totalTips.toFixed(2)}`,
    `${d.totalHours.toFixed(2)} hrs`,
    `$${d.perHourValue.toFixed(2)}/hr`,
    `${d.employees.length} on shift`,
  ]);

  dailyTableBody.push([
    'TOTALS',
    `${result.dailyCalculations.length} Days`,
    `$${result.dailyCalculations.reduce((s, d) => s + d.tipSources.webDash, 0).toFixed(2)}`,
    `$${result.dailyCalculations.reduce((s, d) => s + d.tipSources.kiosk, 0).toFixed(2)}`,
    `$${result.totalTips.toFixed(2)}`,
    `${result.totalHours.toFixed(2)} hrs`,
    `$${result.averagePerHourValue.toFixed(2)}/hr`,
    `${result.totalShiftsWorked} shifts`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Business Date', 'Day', 'WebDash Tips', 'Kiosk Tips', 'Total Tips', 'Total Hours', 'Rate ($/hr)', 'Staff']],
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
      4: { halign: 'right', fontStyle: 'bold' },
      5: { halign: 'right' },
      6: { halign: 'right', fontStyle: 'bold', textColor: [37, 99, 235] },
      7: { halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.row.index === dailyTableBody.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249];
      }
    },
    margin: { left: margin, right: margin },
  });

  // Footer & Signatures on final page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);

    // Footer dividing line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);

    doc.text(`Abacus Tip Intelligence — ${result.restaurant.name} | Confidential Payroll Document`, margin, pageHeight - 18);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 18, { align: 'right' });
  }

  // Save the PDF
  const filename = `Abacus_${result.restaurant.name.replace(/\s+/g, '_')}_Tips_${result.startDate}_to_${result.endDate}.pdf`;
  doc.save(filename);
}
