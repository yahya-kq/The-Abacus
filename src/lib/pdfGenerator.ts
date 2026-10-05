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

  // Header Background Banner (Deep Indigo Theme matching COLORCODE)
  doc.setFillColor(27, 25, 71); // #1b1947
  doc.rect(0, 0, pageWidth, 84, 'F');

  // Embed Aio Logo in header (top-left or top-right)
  try {
    // Add Aio logo image
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

  // Period Cycle Subheader
  const cycleText = `Period: ${formatDisplayDate(result.startDate)} — ${formatDisplayDate(result.endDate)}  |  Distribution: ${result.distributionMethod}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(184, 185, 219); // Periwinkle slate
  doc.text(cycleText, titleX, 56);

  // Generation timestamp on right side
  doc.setFontSize(8.5);
  doc.setTextColor(157, 159, 196);
  const genDate = `Report Generated: ${new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`;
  doc.text(genDate, pageWidth - margin, 46, { align: 'right' });

  let currentY = 104;

  // Executive KPI Summary Cards
  const cardWidth = (contentWidth - 30) / 4;
  const cardHeight = 48;

  const kpis = [
    { label: 'TOTAL POOL DISTRIBUTED', value: `$${result.totalDistributed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: [108, 99, 255] },
    { label: 'RECIPIENT HOURS', value: `${result.totalRecipientHours.toFixed(2)} hrs`, color: [0, 180, 160] },
    { label: 'AVERAGE RATE / HR', value: `$${result.averagePerHourValue.toFixed(2)}/hr`, color: [124, 102, 220] },
    { label: 'TOTAL PAYOUT', value: `$${result.totalOverallPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: [246, 196, 69] },
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

  // Section Header: Employee Summary
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
    head: [['Employee Name', 'Role', 'Hours', 'Net Sales', 'Total Payout', 'Rate ($/hr)']],
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

  // Check if enough space for Daily Breakdown, else add page
  if (currentY > pageHeight - 180) {
    doc.addPage();
    currentY = 40;
  }

  // Section Header: Daily Breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(27, 25, 71);
  doc.text('Daily Tip Summary & Pool Reconciliation', margin, currentY);

  currentY += 12;

  const dailyTableBody = result.dailyCalculations.map((d) => [
    d.displayDate,
    d.dayOfWeek,
    `$${d.totalPool.toFixed(2)}`,
    `${d.totalRecipientHours.toFixed(2)} hrs`,
    `$${d.perHourValue.toFixed(2)}/hr`,
    `${d.employees.length} Staff`,
    `$${d.employees.reduce((s, e) => s + e.poolShare, 0).toFixed(2)}`,
  ]);

  dailyTableBody.push([
    'TOTALS',
    `${result.dailyCalculations.length} Days`,
    `$${result.totalPool.toFixed(2)}`,
    `${result.totalRecipientHours.toFixed(2)} hrs`,
    `$${result.averagePerHourValue.toFixed(2)}/hr`,
    `${result.totalEligibleEmployees} Staff`,
    `$${result.totalDistributed.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Business Date', 'Day', 'Pool Collected', 'Recipient Hours', 'Pool Rate', 'Active Staff', 'Pool Distributed']],
    body: dailyTableBody,
    theme: 'grid',
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
    headStyles: {
      fillColor: [51, 48, 107],
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
      0: { fontStyle: 'bold', cellWidth: 90 },
      1: { cellWidth: 70 },
      2: { halign: 'right', cellWidth: 75 },
      3: { halign: 'right', cellWidth: 80 },
      4: { halign: 'right', fontStyle: 'bold', cellWidth: 75 },
      5: { halign: 'right', cellWidth: 70 },
      6: { halign: 'right', fontStyle: 'bold', textColor: [88, 81, 223], cellWidth: 80 },
    },
    didParseCell: (data) => {
      if (data.row.index === dailyTableBody.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 243, 250];
      }
    },
    margin: { left: margin, right: margin },
  });

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 142, 173);

    doc.setDrawColor(226, 228, 240);
    doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);

    // Left
    doc.text(`${result.restaurantName || 'Restaurant'} | Tip Pool Report`, margin, pageHeight - 16);

    // Center Caption: STRICTLY as demanded by user:
    // "These tips are calculated using the Tip Calculator."
    doc.setFont('helvetica', 'italic');
    doc.text('These tips are calculated using the Tip Calculator.', pageWidth / 2, pageHeight - 16, { align: 'center' });
  }

  // File naming: strictly [Restaurant_Name]_[StartDate]_to_[EndDate].pdf
  const cleanRestName = (result.restaurantName || 'Restaurant').replace(/\s+/g, '_');
  const filename = `${cleanRestName}_${result.startDate}_to_${result.endDate}.pdf`;
  doc.save(filename);
}
