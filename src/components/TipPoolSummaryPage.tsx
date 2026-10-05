'use client';

import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Users,
  Clock,
  Download,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Layers,
  Calendar,
} from 'lucide-react';
import {
  CycleCalculationResult,
  DailyCalculationResult,
  EmployeeDailyDetail,
  TipPoolSettings,
} from '../types/tips';
import { formatDisplayDate, getDayOfWeek } from '../lib/parser';

interface TipPoolSummaryPageProps {
  result: CycleCalculationResult;
  settings: TipPoolSettings;
  onHardRefresh: () => void;
}

export function TipPoolSummaryPage({
  result,
  settings,
  onHardRefresh,
}: TipPoolSummaryPageProps) {
  // Set of expanded dates
  const [expandedDates, setExpandedDates] = useState<Set<string>>(
    () => new Set(result.dailyCalculations.slice(0, 3).map((d) => d.date))
  );

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedDates(new Set(result.dailyCalculations.map((d) => d.date)));
  };

  const collapseAll = () => {
    setExpandedDates(new Set());
  };

  // Critical Calculation Rule: Total Tips = Total Tips Paid + Total Tips to Be Paid
  // Total Payouts to be distributed from the pool
  const totalTipsToBePaid = result.totalDistributed;
  // Tips already retained / directly paid out to staff
  const totalTipsPaid = result.totalKeptTips;
  // Grand total tips from all sources
  const totalTipsOverall = Math.round((totalTipsToBePaid + totalTipsPaid) * 100) / 100;

  // Average tips per hour (Every Shift Per Hour)
  const averageTipsPerHour =
    result.totalRecipientHours > 0
      ? Math.round((result.totalDistributed / result.totalRecipientHours) * 100) / 100
      : 0;

  // Active tip pools count (at least 1 if pool is configured)
  const activeTipPoolsCount = settings.distributionMethod ? 1 : 0;

  // Export Daily Summary CSV
  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Day',
      'Role / Employee',
      'Hours Worked',
      'Employees In Pool',
      'Sales',
      'Contributed',
      'Tip Pool Collected',
      'Total Tips Paid',
      'Average Tips Per Hour',
    ];

    const rows: string[][] = [];

    result.dailyCalculations.forEach((d) => {
      const dateSales = d.employees.reduce((acc, e) => acc + e.netSale, 0);
      const dateContributed = d.employees.reduce((acc, e) => acc + e.contributionAmount, 0);
      const datePaid = d.employees.reduce((acc, e) => acc + e.poolShare, 0);

      // Date Header Row
      rows.push([
        formatDisplayDate(d.date),
        d.dayOfWeek,
        'DAILY TOTAL',
        d.totalRecipientHours.toFixed(2),
        d.employees.length.toString(),
        dateSales.toFixed(2),
        dateContributed.toFixed(2),
        d.totalPool.toFixed(2),
        datePaid.toFixed(2),
        d.perHourValue.toFixed(2),
      ]);

      // Employee Breakdown
      d.employees.forEach((emp) => {
        rows.push([
          formatDisplayDate(d.date),
          d.dayOfWeek,
          `${emp.employeeName} (${emp.role})`,
          emp.hours.toFixed(2),
          '1',
          emp.netSale.toFixed(2),
          emp.contributionAmount.toFixed(2),
          d.totalPool.toFixed(2),
          emp.poolShare.toFixed(2),
          emp.hours > 0 ? (emp.poolShare / emp.hours).toFixed(2) : '0.00',
        ]);
      });
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Tip_Pool_Summary_${result.restaurantName || 'Report'}_${result.startDate || 'start'}_to_${result.endDate || 'end'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '26px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Tip Pool Summary
            </h1>
            <span className="badge badge-indigo">
              {result.distributionMethod || 'Standard'} Pooling
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '4px' }}>
            {result.restaurantName || 'Active Tip Pool'}
            {result.startDate && result.endDate
              ? ` | ${formatDisplayDate(result.startDate)} — ${formatDisplayDate(result.endDate)}`
              : ''}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={onHardRefresh}
            type="button"
            className="btn-secondary"
            style={{ color: '#ff5f6d', borderColor: 'rgba(255, 95, 109, 0.3)' }}
          >
            <RotateCcw size={16} />
            <span>Hard Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            type="button"
            className="btn-primary"
            style={{ padding: '10px 20px' }}
          >
            <Download size={16} />
            <span>Export Report (CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row Matching Toast/AIO Reference */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        {/* KPI 1: Total Tips */}
        <div className="glass-panel stat-card-hover" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Tips
            </span>
            <DollarSign size={18} color="#9ca3ff" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>
            ${totalTipsOverall.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* KPI 2: Active Tip Pools */}
        <div className="glass-panel stat-card-hover" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Active Tip Pools
            </span>
            <Layers size={18} color="#00e5a3" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>
            {activeTipPoolsCount}
          </div>
        </div>

        {/* KPI 3: Employees in Pool */}
        <div className="glass-panel stat-card-hover" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Employees In Pool
            </span>
            <Users size={18} color="#f6c445" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>
            {result.totalEligibleEmployees}
          </div>
        </div>

        {/* KPI 4: Every Shift Per Hour (Average Tips Per Hour) */}
        <div className="glass-panel stat-card-hover" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Every Shift Tips / Hr
            </span>
            <Clock size={18} color="#00e5a3" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#00e5a3', marginTop: '6px' }}>
            ${averageTipsPerHour.toFixed(2)}
          </div>
        </div>

        {/* KPI 5: Total Tips Paid */}
        <div className="glass-panel stat-card-hover" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Tips Paid
            </span>
            <DollarSign size={18} color="#c5c7e8" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#c5c7e8', marginTop: '6px' }}>
            ${totalTipsPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* KPI 6: Total Tips to Be Paid */}
        <div
          className="glass-panel stat-card-hover"
          style={{
            padding: '20px 22px',
            border: '1.5px solid rgba(108, 99, 255, 0.45)',
            background: 'rgba(93, 84, 230, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', color: '#9ca3ff', fontWeight: 700, textTransform: 'uppercase' }}>
              Total Tips to Be Paid
            </span>
            <DollarSign size={18} color="#9ca3ff" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>
            ${totalTipsToBePaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Main Section: Tips Pooling Summary (By Pool) */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              Tips Pooling Summary (By Pool)
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Clean daily breakdown of pool contributions, distributed payouts, and average tips per hour.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={expandAll}
              type="button"
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              type="button"
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Daily Summary Table Matching Toast POS Layout */}
        <div className="data-table-container" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ borderCollapse: 'collapse', width: '100%', minWidth: '980px' }}>
            <thead>
              <tr style={{ background: '#151336', borderBottom: '1px solid rgba(139, 142, 222, 0.18)' }}>
                <th style={{ textAlign: 'left', width: '220px' }}>Date</th>
                <th style={{ textAlign: 'right' }}>Hours worked</th>
                <th style={{ textAlign: 'right' }}>Employees in pool</th>
                <th style={{ textAlign: 'right' }}>Sales</th>
                <th style={{ textAlign: 'right' }}>Contributed</th>
                <th style={{ textAlign: 'right' }}>Tip pool collected</th>
                <th style={{ textAlign: 'right' }}>Total tips paid</th>
                <th style={{ textAlign: 'right' }}>Average tips per hour</th>
              </tr>
            </thead>
            <tbody>
              {result.dailyCalculations.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                    No tip pool calculation data available. Run Tip Distribution from Tip Setup to generate summary report.
                  </td>
                </tr>
              ) : (
                result.dailyCalculations.map((day) => {
                  const isExpanded = expandedDates.has(day.date);
                  const daySales = day.employees.reduce((acc, e) => acc + e.netSale, 0);
                  const dayContributed = day.employees.reduce((acc, e) => acc + e.contributionAmount, 0);
                  const dayPaid = day.employees.reduce((acc, e) => acc + e.poolShare, 0);

                  // Group employees by role for clean sub-accordion
                  const roleGroups = new Map<
                    string,
                    {
                      role: string;
                      hours: number;
                      sales: number;
                      contributed: number;
                      poolShare: number;
                      staff: EmployeeDailyDetail[];
                    }
                  >();

                  day.employees.forEach((emp) => {
                    let rGrp = roleGroups.get(emp.role);
                    if (!rGrp) {
                      rGrp = {
                        role: emp.role,
                        hours: 0,
                        sales: 0,
                        contributed: 0,
                        poolShare: 0,
                        staff: [],
                      };
                      roleGroups.set(emp.role, rGrp);
                    }
                    rGrp.hours += emp.hours;
                    rGrp.sales += emp.netSale;
                    rGrp.contributed += emp.contributionAmount;
                    rGrp.poolShare += emp.poolShare;
                    rGrp.staff.push(emp);
                  });

                  return (
                    <React.Fragment key={day.date}>
                      {/* Daily Main Row (Highlight tint matching screenshot) */}
                      <tr
                        onClick={() => toggleDate(day.date)}
                        style={{
                          background: 'rgba(255, 95, 109, 0.08)',
                          borderTop: '1px solid rgba(255, 95, 109, 0.25)',
                          cursor: 'pointer',
                          fontWeight: 700,
                        }}
                      >
                        <td style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isExpanded ? (
                            <ChevronDown size={16} color="#ff7b89" />
                          ) : (
                            <ChevronRight size={16} color="#ff7b89" />
                          )}
                          <span>
                            {day.dayOfWeek}, {day.date}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', color: '#ffffff' }}>
                          {day.totalRecipientHours.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', color: '#ffffff' }}>
                          {day.employees.length}
                        </td>
                        <td style={{ textAlign: 'right', color: '#c5c7e8' }}>
                          ${daySales.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', color: '#ff7b89' }}>
                          ${dayContributed.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', color: '#ffffff' }}>
                          ${day.totalPool.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', color: '#00e5a3' }}>
                          ${dayPaid.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', color: '#ffffff' }}>
                          ${day.perHourValue.toFixed(2)}
                        </td>
                      </tr>

                      {/* Expanded Role and Staff Breakdown */}
                      {isExpanded &&
                        Array.from(roleGroups.values()).map((rGroup) => {
                          const roleRate = rGroup.hours > 0 ? rGroup.poolShare / rGroup.hours : 0;
                          return (
                            <React.Fragment key={`${day.date}-${rGroup.role}`}>
                              {/* Role Sub-Header Row */}
                              <tr
                                style={{
                                  background: 'rgba(21, 19, 54, 0.75)',
                                  borderBottom: '1px solid rgba(139, 142, 222, 0.08)',
                                  fontSize: '0.88rem',
                                }}
                              >
                                <td style={{ paddingLeft: '36px', color: '#9ca3ff', fontWeight: 600 }}>
                                  {rGroup.role}
                                </td>
                                <td style={{ textAlign: 'right', color: '#c5c7e8' }}>
                                  {rGroup.hours.toFixed(2)}
                                </td>
                                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                                  {rGroup.staff.length}
                                </td>
                                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                                  ${rGroup.sales.toFixed(2)}
                                </td>
                                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                                  ${rGroup.contributed.toFixed(2)}
                                </td>
                                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                                  ${day.totalPool.toFixed(2)}
                                </td>
                                <td style={{ textAlign: 'right', color: '#00e5a3', fontWeight: 600 }}>
                                  ${rGroup.poolShare.toFixed(2)}
                                </td>
                                <td style={{ textAlign: 'right', color: '#c5c7e8' }}>
                                  ${roleRate.toFixed(2)}
                                </td>
                              </tr>

                              {/* Individual Employee Rows under Role */}
                              {rGroup.staff.map((emp) => {
                                const empRate = emp.hours > 0 ? emp.poolShare / emp.hours : 0;
                                return (
                                  <tr
                                    key={`${day.date}-${emp.employeeName}`}
                                    style={{
                                      background: 'rgba(15, 13, 38, 0.65)',
                                      borderBottom: '1px solid rgba(139, 142, 222, 0.05)',
                                      fontSize: '0.84rem',
                                      color: 'var(--text-secondary)',
                                    }}
                                  >
                                    <td style={{ paddingLeft: '56px', color: '#ffffff' }}>
                                      {emp.employeeName}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>{emp.hours.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right', color: 'var(--text-dim)' }}>1</td>
                                    <td style={{ textAlign: 'right' }}>${emp.netSale.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right' }}>${emp.contributionAmount.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right' }}>${day.totalPool.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right', color: '#00e5a3' }}>
                                      ${emp.poolShare.toFixed(2)}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>${empRate.toFixed(2)}</td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
            {result.dailyCalculations.length > 0 && (
              <tfoot style={{ background: '#1c194a', fontWeight: 800, borderTop: '2px solid rgba(108, 99, 255, 0.45)' }}>
                <tr>
                  <td style={{ padding: '14px 18px', color: '#ffffff' }}>Grand Total</td>
                  <td style={{ textAlign: 'right', color: '#c5c7e8' }}>
                    {result.totalRecipientHours.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', color: '#c5c7e8' }}>
                    {result.totalEligibleEmployees}
                  </td>
                  <td style={{ textAlign: 'right', color: '#c5c7e8' }}>
                    $
                    {result.dailyCalculations
                      .reduce((acc, d) => acc + d.employees.reduce((sa, e) => sa + e.netSale, 0), 0)
                      .toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', color: '#ff7b89' }}>
                    $
                    {result.dailyCalculations
                      .reduce((acc, d) => acc + d.employees.reduce((sa, e) => sa + e.contributionAmount, 0), 0)
                      .toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', color: '#ffffff' }}>
                    ${result.totalPool.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', color: '#00e5a3', fontSize: '0.98rem' }}>
                    ${result.totalDistributed.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', color: '#ffffff', fontSize: '0.98rem' }}>
                    ${result.averagePerHourValue.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
