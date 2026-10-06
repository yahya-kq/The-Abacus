import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CycleCalculationResult } from '../types/tips';
import { formatDisplayDate } from './parser';
import { AIO_LOGO_BASE64 } from './pdfLogo';

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

  // Header Background Banner (Deep Indigo Theme)
  doc.setFillColor(27, 25, 71); // #1b1947
  doc.rect(0, 0, pageWidth, 84, 'F');

  // Embed Aio Logo in header
  try {
    doc.addImage(AIO_LOGO_BASE64, 'JPEG', margin, 18, 48, 48);
  } catch (e) {
    console.error('Failed to embed logo into PDF:', e);
  }

  // Restaurant & Pool Name next to logo
  const titleX = margin + 60;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text((result.restaurantName || result.poolName || 'RESTAURANT').toUpperCase(), titleX, 38);

  // Period Cycle (Clean, no subtitles or descriptions)
  const cycleText = `Period: ${formatDisplayDate(result.startDate)} — ${formatDisplayDate(result.endDate)}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(184, 185, 219);
  doc.text(cycleText, titleX, 56);

  // Generation timestamp on right side
  doc.setFontSize(8.5);
  doc.setTextColor(157, 159, 196);
  const genDate = `Generated: ${new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`;
  doc.text(genDate, pageWidth - margin, 46, { align: 'right' });

  let currentY = 104;

  // Executive KPI Summary Cards
  const cardWidth = (contentWidth - 30) / 4;
  const cardHeight = 48;

  const kpis = [
    { label: 'TOTAL POOL DISTRIBUTED', value: `$${result.totalDistributed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: [108, 99, 255] },
    { label: 'RECIPIENT HOURS', value: `${result.totalRecipientHours.toFixed(2)} hrs`, color: [0, 180, 160] },
    { label: 'AVERAGE RATE / HR', value: `$${result.averagePerHourValue.toFixed(2)}/hr`, color: [124, 102, 220] },
    { label: 'TOTAL TIPS TO BE PAID', value: `$${result.totalOverallPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: [0, 229, 163] },
  ];

  kpis.forEach((kpi, idx) => {
    const cardX = margin + idx * (cardWidth + 10);
    doc.setFillColor(248, 249, 253);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 6, 6, 'F');
    doc.setDrawColor(226, 228, 240);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 6, 6, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, cardX + 10, currentY + 16);

    doc.setFontSize(11.5);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, cardX + 10, currentY + 36);
  });

  currentY += cardHeight + 22;

  // Section Header: Full Cycle Employee Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(27, 25, 71);
  doc.text('Employee Tip Distribution Summary', margin, currentY);

  currentY += 12;

  // Table 1: Employee Cycle Table
  const employeeTableBody = result.employeeSummaries.map((emp) => [
    emp.employeeName,
    emp.role,
    emp.totalHours.toFixed(2),
    `$${emp.totalNetSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `$${emp.totalPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `$${emp.averagePerHourTip.toFixed(2)}`,
  ]);

  // Totals Row
  employeeTableBody.push([
    'TOTALS',
    `${result.totalEligibleEmployees} Staff`,
    result.totalRecipientHours.toFixed(2),
    `$${result.employeeSummaries.reduce((s, e) => s + e.totalNetSales, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `$${result.totalOverallPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `$${result.averagePerHourValue.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Employee Name', 'Role', 'Hours', 'Net Sales', 'Total Tips to be Paid', 'Rate ($/hr)']],
    body: employeeTableBody,
    theme: 'grid',
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
    headStyles: {
      fillColor: [27, 25, 71],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
      cellPadding: 5.5,
    },
    styles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 150 },
      1: { cellWidth: 95 },
      2: { halign: 'right', cellWidth: 65 },
      3: { halign: 'right', cellWidth: 75 },
      4: { halign: 'right', fontStyle: 'bold', textColor: [88, 81, 223], cellWidth: 85 },
      5: { halign: 'right', cellWidth: 70 },
    },
    didParseCell: (data) => {
      if (data.row.index === employeeTableBody.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 243, 250];
        if (data.column.index === 4) {
          data.cell.styles.textColor = [88, 81, 223];
        }
      }
    },
    margin: { left: margin, right: margin },
  });

  currentY = (doc as any).lastAutoTable.finalY + 24;

  // Section 2: Employee Date-by-Date Breakdown
  // Check if enough space for Section Header, else add page
  if (currentY > pageHeight - 140) {
    doc.addPage();
    currentY = 40;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(27, 25, 71);
  doc.text('Employee Breakdown by Date', margin, currentY);

  currentY += 14;

  // Render each employee's daily breakdown table sequentially
  for (const emp of result.employeeSummaries) {
    if (!emp.dailyBreakdown || emp.dailyBreakdown.length === 0) continue;

    if (currentY > pageHeight - 120) {
      doc.addPage();
      currentY = 40;
    }

    // Employee sub-header bar
    doc.setFillColor(241, 243, 250);
    doc.roundedRect(margin, currentY, contentWidth, 22, 4, 4, 'F');
    doc.setDrawColor(226, 228, 240);
    doc.roundedRect(margin, currentY, contentWidth, 22, 4, 4, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(27, 25, 71);
    doc.text(emp.employeeName, margin + 10, currentY + 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 85, 120);
    const empMeta = `Role: ${emp.role}  |  Total Hours: ${emp.totalHours.toFixed(2)} hrs  |  Total Tips to be Paid: $${emp.totalPayout.toFixed(2)}  |  Avg Rate: $${emp.averagePerHourTip.toFixed(2)}/hr`;
    doc.text(empMeta, pageWidth - margin - 10, currentY + 15, { align: 'right' });

    currentY += 26;

    const empRows = emp.dailyBreakdown.map((d) => [
      d.displayDate || formatDisplayDate(d.date),
      d.role || emp.role,
      d.hours.toFixed(2),
      `$${(d.netSale || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `$${d.totalPayout.toFixed(2)}`,
      `$${(d.hours > 0 ? d.totalPayout / d.hours : d.dailyRate).toFixed(2)}/hr`,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Date', 'Role', 'Hours', 'Net Sales', 'Total Tips to be Paid', 'Rate ($/hr)']],
      body: empRows,
      theme: 'grid',
      pageBreak: 'auto',
      rowPageBreak: 'avoid',
      headStyles: {
        fillColor: [51, 48, 107],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left',
        cellPadding: 4,
      },
      styles: {
        fontSize: 7.5,
        textColor: [51, 65, 85],
        cellPadding: 4,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 100 },
        1: { cellWidth: 85 },
        2: { halign: 'right', cellWidth: 65 },
        3: { halign: 'right', cellWidth: 80 },
        4: { halign: 'right', fontStyle: 'bold', textColor: [88, 81, 223], cellWidth: 90 },
        5: { halign: 'right', cellWidth: 80 },
      },
      margin: { left: margin, right: margin },
    });

    currentY = (doc as any).lastAutoTable.finalY + 16;
  }

  // Footer on each page (clean, without any subtitles or extra captions)
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 142, 173);

    doc.setDrawColor(226, 228, 240);
    doc.line(margin, pageHeight - 24, pageWidth - margin, pageHeight - 24);

    // Left
    doc.text(`${result.restaurantName || 'Restaurant'} | Tip Pool Report`, margin, pageHeight - 12);

    // Right
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 12, { align: 'right' });
  }

  // File naming: strictly [Restaurant_Name]_[StartDate]_to_[EndDate].pdf
  const cleanRestName = (result.restaurantName || 'Restaurant').replace(/\s+/g, '_');
  const filename = `${cleanRestName}_${result.startDate}_to_${result.endDate}.pdf`;
  doc.save(filename);
}
