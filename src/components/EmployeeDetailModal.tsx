'use client';

import React from 'react';
import { X, User, Clock, DollarSign, Calendar, TrendingUp } from 'lucide-react';
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
        background: 'rgba(9, 8, 22, 0.75)',
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
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px',
          background: '#19173f',
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
                background: 'rgba(93, 84, 230, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9ca3ff',
              }}
            >
              <User size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
                  {employee.employeeName}
                </h2>
                <span className="badge badge-indigo">{employee.role}</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Employee Shift Breakdown & Tip Distribution Ledger
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
              background: 'rgba(21, 19, 54, 0.7)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              TOTAL PAYOUT
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
              ${employee.totalPayout.toFixed(2)}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(21, 19, 54, 0.7)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              TOTAL HOURS
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#9ca3ff', marginTop: '4px' }}>
              {employee.totalHours.toFixed(2)} hrs
            </div>
          </div>

          <div
            style={{
              background: 'rgba(21, 19, 54, 0.7)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              KEPT TIPS
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f6c445', marginTop: '4px' }}>
              ${employee.totalKeptTips.toFixed(2)}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(21, 19, 54, 0.7)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              POOL SHARE
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00e5a3', marginTop: '4px' }}>
              ${employee.totalPoolReceived.toFixed(2)}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(21, 19, 54, 0.7)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              AVG RATE / HR
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#c5c7e8', marginTop: '4px' }}>
              ${employee.averagePerHourTip.toFixed(2)}/hr
            </div>
          </div>
        </div>

        {/* Daily Shifts Ledger */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Business Date</th>
                  <th>Role</th>
                  <th style={{ textAlign: 'right' }}>Hours</th>
                  <th style={{ textAlign: 'right' }}>Net Sales</th>
                  <th style={{ textAlign: 'right' }}>Kept Tips</th>
                  <th style={{ textAlign: 'right' }}>Pool Share</th>
                  <th style={{ textAlign: 'right' }}>Total Payout</th>
                </tr>
              </thead>
              <tbody>
                {employee.dailyBreakdown.map((shift, idx) => (
                  <tr key={`${shift.date}-${idx}`}>
                    <td style={{ fontWeight: 600 }}>{shift.displayDate || shift.date}</td>
                    <td>{shift.role}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{shift.hours.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                      ${(shift.netSale || 0).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right', color: '#f6c445' }}>
                      ${shift.keptTips.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right', color: '#00e5a3', fontWeight: 600 }}>
                      ${shift.poolShare.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right', color: '#ffffff', fontWeight: 700 }}>
                      ${shift.totalPayout.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
