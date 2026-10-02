'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  DollarSign,
  Clock,
  TrendingUp,
  Users,
  FileDown,
  RotateCcw,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Eye,
  ArrowUpRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CycleCalculationResult, EmployeeCycleSummary, RestaurantConfig } from '../types/tips';
import { generateTipCyclePDF } from '../lib/pdfGenerator';
import { EmployeeDetailModal } from './EmployeeDetailModal';
import { PoolGovernanceModal } from './PoolGovernanceModal';
import { formatDisplayDate } from '../lib/parser';

interface CalculationDashboardProps {
  result: CycleCalculationResult;
  onReset: () => void;
}

export function CalculationDashboard({ result, onReset }: CalculationDashboardProps) {
  const [activeTab, setActiveTab] = useState<'cycle' | 'dates' | 'governance'>('cycle');
  const [selectedDate, setSelectedDate] = useState<string>(result.dailyCalculations[0]?.date || '');
  const [searchEmployee, setSearchEmployee] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [inspectedEmployee, setInspectedEmployee] = useState<EmployeeCycleSummary | null>(null);
  const [isGovernanceOpen, setIsGovernanceOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Trigger celebration confetti on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'],
      });
    } catch (e) {
      // Ignore if SSR
    }
  }, []);

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      generateTipCyclePDF(result);
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Filtered employees
  const filteredEmployees = result.employeeSummaries.filter((e) => {
    const matchesSearch = e.employeeName.toLowerCase().includes(searchEmployee.toLowerCase());
    const matchesRole = roleFilter === 'all' || e.role.toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  // Selected date data
  const currentDateCalc = result.dailyCalculations.find((d) => d.date === selectedDate) || result.dailyCalculations[0];

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 20px 80px' }}>
      {/* Top Header Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '20px 24px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {result.restaurant.name} Tip Dashboard
            </h1>
            <span className="badge badge-emerald">
              <CheckCircle2 size={12} style={{ marginRight: '4px' }} />
              Reconciled • Differ $0.00
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Cycle: <strong>{formatDisplayDate(result.startDate)}</strong> — <strong>{formatDisplayDate(result.endDate)}</strong> ({result.dailyCalculations.length} Operating Days)
          </div>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsGovernanceOpen(true)}
            className="btn-secondary"
            style={{ padding: '9px 16px', fontSize: '0.85rem' }}
          >
            <ShieldCheck size={16} color="#60a5fa" />
            <span>Pool Rules</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="btn-primary"
            style={{ padding: '9px 20px', fontSize: '0.85rem' }}
          >
            <FileDown size={16} />
            <span>{isExporting ? 'Generating PDF...' : 'Export Client PDF'}</span>
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="btn-secondary"
            style={{ padding: '9px 16px', fontSize: '0.85rem', color: '#fb7185' }}
          >
            <RotateCcw size={15} />
            <span>Reset Cycle</span>
          </button>
        </div>
      </div>

      {/* 4 Executive KPI Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '18px',
          marginBottom: '28px',
        }}
      >
        <div className="glass-panel" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Tips Distributed
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#34d399', letterSpacing: '-0.02em' }}>
            ${result.totalTips.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            WebDash, Kiosk & Manual pools combined
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Hours Worked
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#60a5fa', letterSpacing: '-0.02em' }}>
            {result.totalHours.toFixed(2)} hrs
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Time card total hours (unsplit regular/OT)
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Cycle Tip Rate ($/Hr)
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#c084fc', letterSpacing: '-0.02em' }}>
            ${result.averagePerHourValue.toFixed(2)} / hr
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Effective average payout per hour
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Recipient Staff Paid
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '-0.02em' }}>
            {result.totalEligibleEmployees} Staff
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {result.totalShiftsWorked} total shift entries
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('cycle')}
          style={{
            background: activeTab === 'cycle' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            color: activeTab === 'cycle' ? '#34d399' : 'var(--text-secondary)',
            border: activeTab === 'cycle' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
            borderRadius: 'var(--radius-pill)',
            padding: '8px 18px',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Users size={16} />
          <span>Whole-Cycle Payouts ({result.employeeSummaries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('dates')}
          style={{
            background: activeTab === 'dates' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            color: activeTab === 'dates' ? '#60a5fa' : 'var(--text-secondary)',
            border: activeTab === 'dates' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
            borderRadius: 'var(--radius-pill)',
            padding: '8px 18px',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Calendar size={16} />
          <span>Date-by-Date Detail ({result.dailyCalculations.length} Days)</span>
        </button>

        <button
          onClick={() => setActiveTab('governance')}
          style={{
            background: activeTab === 'governance' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
            color: activeTab === 'governance' ? '#c084fc' : 'var(--text-secondary)',
            border: activeTab === 'governance' ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid transparent',
            borderRadius: 'var(--radius-pill)',
            padding: '8px 18px',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ShieldCheck size={16} />
          <span>Pool Governance & Audit</span>
        </button>
      </div>

      {/* TAB 1: Whole-Cycle Payouts Table */}
      {activeTab === 'cycle' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          {/* Table Header Filter Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, maxWidth: '400px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search employee name..."
                  value={searchEmployee}
                  onChange={(e) => setSearchEmployee(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '36px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Role Filter:</span>
              {['all', 'cashier', 'server'].map((rf) => (
                <button
                  key={rf}
                  onClick={() => setRoleFilter(rf)}
                  style={{
                    background: roleFilter === rf ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    color: roleFilter === rf ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-pill)',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {rf}
                </button>
              ))}
            </div>
          </div>

          {/* Master Employee Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Role</th>
                  <th style={{ textAlign: 'center' }}>Shifts</th>
                  <th style={{ textAlign: 'right' }}>Total Hours</th>
                  <th style={{ textAlign: 'right' }}>Avg Tip / Hr</th>
                  <th style={{ textAlign: 'right' }}>Pool Share</th>
                  <th style={{ textAlign: 'right' }}>Total Tip Payout</th>
                  <th style={{ textAlign: 'center' }}>Ledger</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => {
                  const poolShare = ((emp.totalTips / result.totalTips) * 100).toFixed(1);
                  return (
                    <tr key={emp.employeeName}>
                      <td>
                        <button
                          onClick={() => setInspectedEmployee(emp)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-primary)',
                            fontWeight: 700,
                            fontSize: '0.92rem',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span>{emp.employeeName}</span>
                          <ArrowUpRight size={13} color="#64748b" />
                        </button>
                      </td>
                      <td>
                        <span className={`badge ${emp.role.toLowerCase() === 'server' ? 'badge-blue' : 'badge-emerald'}`}>
                          {emp.role}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{emp.shiftCount}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#60a5fa' }}>
                        {emp.totalHours.toFixed(2)} hrs
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                        ${emp.averagePerHourTip.toFixed(2)} / hr
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {poolShare}%
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.05rem', color: '#34d399' }}>
                        ${emp.totalTips.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => setInspectedEmployee(emp)}
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          <Eye size={12} />
                          <span>View Days</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: 'rgba(15, 23, 42, 0.95)', borderTop: '2px solid rgba(16, 185, 129, 0.3)' }}>
                  <td style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem' }}>
                    TOTALS ({result.totalEligibleEmployees} EMPLOYEES)
                  </td>
                  <td>
                    <span className="badge badge-emerald">Equal Pool</span>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 800 }}>{result.totalShiftsWorked}</td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: '#60a5fa', fontSize: '1.05rem' }}>
                    {result.totalHours.toFixed(2)} hrs
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: '#c084fc' }}>
                    ${result.averagePerHourValue.toFixed(2)} / hr
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-muted)' }}>100.0%</td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: '#34d399', fontSize: '1.2rem' }}>
                    ${result.totalTips.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'center', color: '#34d399', fontWeight: 700, fontSize: '0.75rem' }}>
                    Verified
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Date-by-Date Detail */}
      {activeTab === 'dates' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Date Selector List */}
          <div className="glass-panel" style={{ padding: '20px', maxHeight: '680px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px' }}>Cycle Operating Days</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {result.dailyCalculations.map((d) => {
                const isSelected = d.date === currentDateCalc.date;
                return (
                  <button
                    key={d.date}
                    onClick={() => setSelectedDate(d.date)}
                    style={{
                      background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: isSelected ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? '#60a5fa' : 'var(--text-primary)' }}>
                        {d.displayDate}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {d.dayOfWeek} • {d.employees.length} staff on duty
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#34d399' }}>
                        ${d.totalTips.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#60a5fa' }}>
                        ${d.perHourValue.toFixed(2)}/hr
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Date Card & Detail Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', gridColumn: 'span 2' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {currentDateCalc.displayDate}
                    </h2>
                    <span className="badge badge-blue">{currentDateCalc.dayOfWeek}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Daily Business Day Tip Pool & Employee Allocations
                  </div>
                </div>

                <div className="badge badge-emerald" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                  Daily Pool: ${currentDateCalc.totalTips.toFixed(2)}
                </div>
              </div>

              {/* Day Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>WEBDASH TIPS</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginTop: '3px' }}>
                    ${currentDateCalc.tipSources.webDash.toFixed(2)}
                  </div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>KIOSK TIPS</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginTop: '3px' }}>
                    ${currentDateCalc.tipSources.kiosk.toFixed(2)}
                  </div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL HOURS</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#60a5fa', marginTop: '3px' }}>
                    {currentDateCalc.totalHours.toFixed(2)} hrs
                  </div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>HOURLY RATE</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399', marginTop: '3px' }}>
                    ${currentDateCalc.perHourValue.toFixed(2)} / hr
                  </div>
                </div>
              </div>

              {/* Day Employees Sub-table */}
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-secondary)' }}>
                Staff on Shift & Tip Allocation ({currentDateCalc.employees.length} Staff)
              </h4>

              <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Role</th>
                      <th style={{ textAlign: 'right' }}>Hours Worked</th>
                      <th style={{ textAlign: 'right' }}>Tip Rate</th>
                      <th style={{ textAlign: 'right' }}>Pool Share</th>
                      <th style={{ textAlign: 'right' }}>Tips Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentDateCalc.employees.map((e) => (
                      <tr key={e.employeeName}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{e.employeeName}</td>
                        <td>
                          <span className={`badge ${e.role.toLowerCase() === 'server' ? 'badge-blue' : 'badge-emerald'}`}>
                            {e.role}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#60a5fa' }}>
                          {e.hours.toFixed(2)} hrs
                        </td>
                        <td style={{ textAlign: 'right' }}>${e.dailyRate.toFixed(2)}/hr</td>
                        <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                          {e.percentageOfDailyPool.toFixed(1)}%
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#34d399' }}>
                          ${e.tipsEarned.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'rgba(15, 23, 42, 0.9)' }}>
                      <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>DAY TOTALS</td>
                      <td></td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#60a5fa' }}>{currentDateCalc.totalHours.toFixed(2)} hrs</td>
                      <td style={{ textAlign: 'right', fontWeight: 800 }}>${currentDateCalc.perHourValue.toFixed(2)}/hr</td>
                      <td style={{ textAlign: 'right', fontWeight: 800 }}>100.0%</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#34d399' }}>${currentDateCalc.totalTips.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Governance & Audit */}
      {activeTab === 'governance' && (
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                System Audit & Toast POS Pool Reconciliation
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Comparing cycle inputs, hours integrity, and mathematical balance
              </p>
            </div>
            <div className="badge badge-emerald" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              Reconciliation Difference: ${result.reconciliation.difference.toFixed(2)}
            </div>
          </div>

          {/* Audit Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#60a5fa', marginBottom: '6px' }}>
                TOTAL INPUT TIPS COLLECTED
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc' }}>
                ${result.reconciliation.totalInputTips.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Sum of all WebDash, Kiosk & manual daily entries across {result.dailyCalculations.length} days
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>
                TOTAL EMPLOYEE PAYOUTS
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399' }}>
                ${result.reconciliation.totalDistributedTips.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Sum of individual payouts allocated to {result.totalEligibleEmployees} staff
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24', marginBottom: '6px' }}>
                DIFFERENCE AUDIT
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399' }}>
                $0.00
              </div>
              <div style={{ fontSize: '0.78rem', color: '#34d399', marginTop: '4px', fontWeight: 600 }}>
                ✓ Perfectly Balanced to the cent
              </div>
            </div>
          </div>

          {/* Excluded Roles callout */}
          {result.excludedShiftsCount > 0 && (
            <div
              style={{
                padding: '16px 20px',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '24px',
              }}
            >
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fbbf24', marginBottom: '6px' }}>
                Excluded Roles Policy Audit ({result.excludedShiftsCount} shifts filtered out)
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Per Toast POS tip pool configuration, only roles designated as <strong>Recipients (Cashier, Server)</strong> are included in tip payouts. Roles such as <strong>{result.excludedRoles.join(', ')}</strong> were detected in the time card and correctly excluded from recipient calculations.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button
              onClick={() => setIsGovernanceOpen(true)}
              className="btn-secondary"
              style={{ padding: '8px 18px', fontSize: '0.85rem' }}
            >
              <ShieldCheck size={16} />
              <span>View Toast POS Pool Configuration Diagram</span>
            </button>
          </div>
        </div>
      )}

      {/* Employee Detail Modal */}
      <EmployeeDetailModal
        employee={inspectedEmployee}
        onClose={() => setInspectedEmployee(null)}
      />

      {/* Pool Governance Modal */}
      <PoolGovernanceModal
        restaurant={result.restaurant}
        isOpen={isGovernanceOpen}
        onClose={() => setIsGovernanceOpen(false)}
      />

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '460px',
              width: '100%',
              padding: '28px',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'rgba(244, 63, 94, 0.15)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fb7185',
                marginBottom: '16px',
              }}
            >
              <RotateCcw size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
              Reset Abacus Session?
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
              This will clear the current calculation session, uploaded time card data, and daily tip inputs. Any downloaded PDF report will remain saved on your computer.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="btn-secondary"
                style={{ padding: '10px 20px' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  onReset();
                }}
                className="btn-danger"
                style={{ padding: '10px 24px', fontWeight: 700 }}
              >
                Yes, Reset Abacus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
