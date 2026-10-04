'use client';

import React, { useState, useMemo } from 'react';
import {
  Download,
  Calendar,
  DollarSign,
  Clock,
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { CycleCalculationResult, EmployeeCycleSummary } from '../types/tips';
import { generateTipCyclePDF } from '../lib/pdfGenerator';
import { EmployeeDetailModal } from './EmployeeDetailModal';
import { formatDisplayDate } from '../lib/parser';

interface CalculationDashboardProps {
  result: CycleCalculationResult;
  onHardRefresh: () => void;
}

export function CalculationDashboard({ result, onHardRefresh }: CalculationDashboardProps) {
  const [activeTab, setActiveTab] = useState<'cycle' | 'daily'>('cycle');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeCycleSummary | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(result.dailyCalculations[0]?.date || null);
  const [isExporting, setIsExporting] = useState(false);

  const allRoles = Array.from(new Set(result.employeeSummaries.map((e) => e.role))).filter(Boolean);

  const filteredEmployees = useMemo(() => {
    return result.employeeSummaries.filter((emp) => {
      const matchesSearch = emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || emp.role.toLowerCase() === roleFilter.toLowerCase();
      return matchesSearch && matchesRole;
    });
  }, [result.employeeSummaries, searchTerm, roleFilter]);

  const totalPages = Math.ceil(filteredEmployees.length / pageSize) || 1;
  const paginatedEmployees = useMemo(() => {
    if (pageSize >= 1000) return filteredEmployees;
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (val: string) => {
    setRoleFilter(val);
    setCurrentPage(1);
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      generateTipCyclePDF(result);
    } catch (e) {
      console.error('Error generating PDF:', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Top Banner / Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Calculation Dashboard
            </h1>
            {result.distributionMethod ? (
              <span className="badge badge-indigo">
                {result.distributionMethod} Distribution
              </span>
            ) : (
              <span className="badge badge-gold">
                No Method Selected
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '4px' }}>
            {result.restaurantName || 'Active Tip Pool'}{result.startDate && result.endDate ? ` | ${formatDisplayDate(result.startDate)} — ${formatDisplayDate(result.endDate)}` : ''}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Hard Refresh Button */}
          <button
            onClick={onHardRefresh}
            type="button"
            className="btn-secondary"
            style={{ color: '#ff5f6d', borderColor: 'rgba(255, 95, 109, 0.3)' }}
          >
            <RotateCcw size={16} />
            <span>Hard Refresh</span>
          </button>

          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            type="button"
            disabled={isExporting}
            className="btn-primary"
            style={{ padding: '10px 22px' }}
          >
            <Download size={17} />
            <span>{isExporting ? 'Generating PDF...' : 'Export Client PDF'}</span>
          </button>
        </div>
      </div>

      {/* Executive KPI Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div className="glass-panel stat-card-hover" style={{ padding: '20px 22px' }}>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Pool Distributed
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#9ca3ff', marginTop: '4px' }}>
            ${result.totalDistributed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
            Pool Collected: ${result.totalPool.toFixed(2)}
          </span>
        </div>

        <div className="glass-panel stat-card-hover" style={{ padding: '20px 22px' }}>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Recipient Hours
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#00e5a3', marginTop: '4px' }}>
            {result.totalRecipientHours.toFixed(2)} hrs
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
            Across {result.totalEligibleEmployees} active employees
          </span>
        </div>

        <div className="glass-panel stat-card-hover" style={{ padding: '20px 22px' }}>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Average Rate / Hr
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#c5c7e8', marginTop: '4px' }}>
            ${result.averagePerHourValue.toFixed(2)}/hr
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
            Uniform distribution rate
          </span>
        </div>

        <div className="glass-panel stat-card-hover" style={{ padding: '20px 22px' }}>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Kept Tips
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f6c445', marginTop: '4px' }}>
            ${result.totalKeptTips.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
            Retained direct shift tips
          </span>
        </div>

        {(result.totalGratuity || 0) > 0 && (
          <div className="glass-panel stat-card-hover" style={{ padding: '20px 22px' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Auto Gratuity
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#00e5a3', marginTop: '4px' }}>
              ${result.totalGratuity?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Included in collected tips
            </span>
          </div>
        )}

        <div className="glass-panel stat-card-hover" style={{ padding: '20px 22px', border: '1.5px solid rgba(108, 99, 255, 0.45)' }}>
          <span style={{ fontSize: '0.76rem', color: '#9ca3ff', fontWeight: 700, textTransform: 'uppercase' }}>
            Total Overall Payout
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
            ${result.totalOverallPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
            Kept Tips + Pool Share
          </span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('cycle')}
          type="button"
          style={{
            padding: '10px 20px',
            borderRadius: 'var(--radius-sm)',
            border: activeTab === 'cycle' ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
            background: activeTab === 'cycle' ? 'rgba(93, 84, 230, 0.2)' : 'var(--bg-input)',
            color: activeTab === 'cycle' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.92rem',
            cursor: 'pointer',
          }}
        >
          Whole-Cycle Summary ({result.employeeSummaries.length} Employees)
        </button>

        <button
          onClick={() => setActiveTab('daily')}
          type="button"
          style={{
            padding: '10px 20px',
            borderRadius: 'var(--radius-sm)',
            border: activeTab === 'daily' ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
            background: activeTab === 'daily' ? 'rgba(93, 84, 230, 0.2)' : 'var(--bg-input)',
            color: activeTab === 'daily' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.92rem',
            cursor: 'pointer',
          }}
        >
          Date-by-Date Breakdown ({result.dailyCalculations.length} Days)
        </button>
      </div>

      {/* TAB 1: WHOLE-CYCLE SUMMARY */}
      {activeTab === 'cycle' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          {/* Search & Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                className="input-clean"
                placeholder="Search employee by name..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                style={{ paddingLeft: '38px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={16} color="var(--text-muted)" />
              <select
                className="input-clean"
                value={roleFilter}
                onChange={(e) => handleRoleFilterChange(e.target.value)}
                style={{ minWidth: '150px' }}
              >
                <option value="ALL" style={{ background: '#151336' }}>All Roles</option>
                {allRoles.map((r) => (
                  <option key={r} value={r} style={{ background: '#151336' }}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Employee Name</th>
                  <th>Role</th>
                  <th style={{ textAlign: 'right' }}>Total Hours</th>
                  <th style={{ textAlign: 'right' }}>Total Net Sales</th>
                  <th style={{ textAlign: 'right' }}>Kept Tips</th>
                  <th style={{ textAlign: 'right' }}>Pool Share</th>
                  <th style={{ textAlign: 'right' }}>Total Payout</th>
                  <th style={{ textAlign: 'right' }}>Rate ($/hr)</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
                        No Calculation Data Available
                      </div>
                      <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                        Configure your Tip Pool Setup and upload timecards to generate client-ready allocation results.
                      </p>
                    </td>
                  </tr>
                )}
                {paginatedEmployees.map((emp, idx) => (
                  <tr
                    key={emp.employeeName}
                    onClick={() => setSelectedEmployee(emp)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    <td style={{ fontWeight: 600, color: '#ffffff' }}>{emp.employeeName}</td>
                    <td>
                      <span className="badge badge-indigo">{emp.role}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{emp.totalHours.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                      ${emp.totalNetSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right', color: '#f6c445' }}>
                      ${emp.totalKeptTips.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right', color: '#00e5a3', fontWeight: 600 }}>
                      ${emp.totalPoolReceived.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right', color: '#ffffff', fontWeight: 800 }}>
                      ${emp.totalPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right', color: '#c5c7e8' }}>
                      ${emp.averagePerHourTip.toFixed(2)}/hr
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#19173f', fontWeight: 800 }}>
                  <td colSpan={3} style={{ color: '#ffffff' }}>TOTALS</td>
                  <td style={{ textAlign: 'right' }}>{result.totalRecipientHours.toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>
                    ${result.employeeSummaries.reduce((s, e) => s + e.totalNetSales, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right', color: '#f6c445' }}>
                    ${result.totalKeptTips.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', color: '#00e5a3' }}>
                    ${result.totalDistributed.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', color: '#ffffff' }}>
                    ${result.totalOverallPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    ${result.averagePerHourValue.toFixed(2)}/hr
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Pagination Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'rgba(21, 19, 54, 0.6)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              marginTop: '12px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing{' '}
              <strong style={{ color: '#ffffff' }}>
                {filteredEmployees.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
              </strong>{' '}
              to{' '}
              <strong style={{ color: '#ffffff' }}>
                {Math.min(currentPage * pageSize, filteredEmployees.length)}
              </strong>{' '}
              of <strong style={{ color: '#00e5a3' }}>{filteredEmployees.length}</strong> employees
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Per Page:</span>
                <select
                  className="input-clean"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{ padding: '4px 10px', fontSize: '0.82rem' }}
                >
                  <option value={25} style={{ background: '#151336' }}>25</option>
                  <option value={50} style={{ background: '#151336' }}>50</option>
                  <option value={100} style={{ background: '#151336' }}>100</option>
                  <option value={250} style={{ background: '#151336' }}>250</option>
                  <option value={5000} style={{ background: '#151336' }}>All</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  type="button"
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: currentPage <= 1 ? 'var(--text-dim)' : '#ffffff',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.82rem',
                  }}
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>

                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', padding: '0 4px' }}>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  type="button"
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: currentPage >= totalPages ? 'var(--text-dim)' : '#ffffff',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.82rem',
                  }}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DATE-BY-DATE BREAKDOWN */}
      {activeTab === 'daily' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {result.dailyCalculations.map((day) => {
            const isExpanded = expandedDate === day.date;

            return (
              <div
                key={day.date}
                className="glass-panel"
                style={{ padding: '20px 24px', transition: 'all 0.2s ease' }}
              >
                {/* Header row */}
                <div
                  onClick={() => setExpandedDate(isExpanded ? null : day.date)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                      {day.displayDate}
                    </div>
                    <span className="badge badge-indigo">{day.dayOfWeek}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {day.employees.length} Staff Worked
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>Pool Collected</span>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#00e5a3' }}>
                        ${day.totalPool.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>Recipient Hours</span>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#9ca3ff' }}>
                        {day.totalRecipientHours.toFixed(2)} hrs
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>Hourly Rate</span>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                        ${day.perHourValue.toFixed(2)}/hr
                      </span>
                    </div>

                    {isExpanded ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                    {/* Sources breakdown badge row */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                      <span className="badge badge-indigo">Online: ${day.tipSources.webDash.toFixed(2)}</span>
                      <span className="badge badge-teal">Kiosk: ${day.tipSources.kiosk.toFixed(2)}</span>
                      <span className="badge badge-gold">3PO: ${day.tipSources.doorDash.toFixed(2)}</span>
                      {day.tipSources.other > 0 && (
                        <span className="badge badge-indigo">Other: ${day.tipSources.other.toFixed(2)}</span>
                      )}
                    </div>

                    {/* Table of employees for this day */}
                    <div className="data-table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Employee Name</th>
                            <th>Role</th>
                            <th style={{ textAlign: 'right' }}>Hours</th>
                            <th style={{ textAlign: 'right' }}>Net Sales</th>
                            <th style={{ textAlign: 'right' }}>Kept Tips</th>
                            <th style={{ textAlign: 'right' }}>Pool Share</th>
                            <th style={{ textAlign: 'right' }}>Total Payout</th>
                          </tr>
                        </thead>
                        <tbody>
                          {day.employees.map((emp) => (
                            <tr key={emp.employeeName}>
                              <td style={{ fontWeight: 600, color: '#ffffff' }}>{emp.employeeName}</td>
                              <td>{emp.role}</td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>{emp.hours.toFixed(2)}</td>
                              <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                                ${(emp.netSale || 0).toFixed(2)}
                              </td>
                              <td style={{ textAlign: 'right', color: '#f6c445' }}>
                                ${emp.keptTips.toFixed(2)}
                              </td>
                              <td style={{ textAlign: 'right', color: '#00e5a3', fontWeight: 600 }}>
                                ${emp.poolShare.toFixed(2)}
                              </td>
                              <td style={{ textAlign: 'right', color: '#ffffff', fontWeight: 700 }}>
                                ${emp.totalPayout.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  );
}
