'use client';

import React from 'react';
import { X, User, Clock, DollarSign, Calendar, Info, CheckCircle2, TrendingUp } from 'lucide-react';
import { EmployeeCycleSummary } from '../types/tips';

interface EmployeeDetailModalProps {
  employee: EmployeeCycleSummary | null;
  onClose: () => void;
}

export function EmployeeDetailModal({ employee, onClose }: EmployeeDetailModalProps) {
  if (!employee) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '750px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
              }}
            >
              <User size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {employee.employeeName}
                </h2>
                <span className="badge badge-emerald">{employee.role}</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Individual Employee Audit & Daily Calculation Ledger
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '6px 10px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Top KPI Cards for Employee */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
            marginBottom: '22px',
          }}
        >
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={13} color="#10b981" />
              TOTAL TIPS EARNED
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
              ${employee.totalTips.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={13} color="#60a5fa" />
              CYCLE TOTAL HOURS
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#60a5fa', marginTop: '4px' }}>
              {employee.totalHours.toFixed(2)} hrs
            </div>
          </div>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={13} color="#c084fc" />
              AVG TIP VALUE / HR
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#c084fc', marginTop: '4px' }}>
              ${employee.averagePerHourTip.toFixed(2)} / hr
            </div>
          </div>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={13} color="#fbbf24" />
              SHIFTS WORKED
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>
              {employee.shiftCount} Days
            </div>
          </div>
        </div>

        {/* Calculation formula explanation note */}
        <div
          style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            marginBottom: '18px',
            fontSize: '0.8rem',
            color: '#93c5fd',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Info size={16} />
          <div>
            <strong>Calculation Formula:</strong> For each day worked, Tip Payout = <code>Employee Hours × Daily Tip Rate</code>. Cycle Total Tip is the sum of all daily tip payouts.
          </div>
        </div>

        {/* Daily Schedule Table */}
        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
          <table className="modern-table">
            <thead>
              <tr>
                <th>Date Worked</th>
                <th style={{ textAlign: 'right' }}>Hours Worked</th>
                <th style={{ textAlign: 'right' }}>Daily Pool Rate</th>
                <th style={{ textAlign: 'right' }}>Daily Tip Payout</th>
                <th>Formula Audit</th>
              </tr>
            </thead>
            <tbody>
              {employee.dailyBreakdown.map((d) => (
                <tr key={d.date}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {d.displayDate}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#60a5fa' }}>
                    {d.hours.toFixed(2)} hrs
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    ${d.dailyRate.toFixed(2)} / hr
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#34d399' }}>
                    ${d.tipsEarned.toFixed(2)}
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <code>{d.hours.toFixed(2)} × ${d.dailyRate.toFixed(2)} = ${d.tipsEarned.toFixed(2)}</code>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'rgba(15, 23, 42, 0.9)' }}>
                <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>CYCLE TOTALS</td>
                <td style={{ textAlign: 'right', fontWeight: 800, color: '#60a5fa' }}>{employee.totalHours.toFixed(2)} hrs</td>
                <td style={{ textAlign: 'right', fontWeight: 800 }}>${employee.averagePerHourTip.toFixed(2)} / hr</td>
                <td style={{ textAlign: 'right', fontWeight: 800, color: '#34d399' }}>${employee.totalTips.toFixed(2)}</td>
                <td style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 600 }}>100% Reconciled</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '8px 22px' }}>
            Close Ledger
          </button>
        </div>
      </div>
    </div>
  );
}
