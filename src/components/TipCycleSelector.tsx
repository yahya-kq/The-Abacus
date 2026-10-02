'use client';

import React from 'react';
import { Calendar, ChevronRight, Clock } from 'lucide-react';
import { formatDisplayDate } from '../lib/parser';

interface TipCycleSelectorProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

export function TipCycleSelector({ startDate, endDate, onChange }: TipCycleSelectorProps) {
  const presets = [
    { label: 'Sep 07 – Sep 20, 2026 (Active Sample)', start: '2026-09-07', end: '2026-09-20' },
    { label: 'Jul 13 – Jul 26, 2026 (July Cycle)', start: '2026-07-13', end: '2026-07-26' },
  ];

  // Calculate days in cycle
  const getCycleDays = () => {
    if (!startDate || !endDate) return 0;
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);
    const s = new Date(sy, sm - 1, sd);
    const e = new Date(ey, em - 1, ed);
    const diffTime = e.getTime() - s.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const daysCount = getCycleDays();

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa',
            }}
          >
            <Calendar size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>1. Tip Cycle Selection</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Select the start and end dates for this payroll tip calculation
            </p>
          </div>
        </div>

        <div className="badge badge-blue">
          <Clock size={12} style={{ marginRight: '4px' }} />
          {daysCount > 0 ? `${daysCount} Days in Cycle` : 'Select dates'}
        </div>
      </div>

      {/* Preset pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '4px' }}>
          Presets:
        </span>
        {presets.map((p) => {
          const isSelected = startDate === p.start && endDate === p.end;
          return (
            <button
              key={p.label}
              onClick={() => onChange(p.start, p.end)}
              type="button"
              style={{
                background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: isSelected ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid var(--border-subtle)',
                color: isSelected ? '#34d399' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: 'var(--radius-pill)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Date Input Pickers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          background: 'rgba(15, 23, 42, 0.4)',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onChange(e.target.value, endDate)}
            className="input-field"
            style={{ colorScheme: 'dark' }}
          />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {formatDisplayDate(startDate)}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onChange(startDate, e.target.value)}
            className="input-field"
            style={{ colorScheme: 'dark' }}
          />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {formatDisplayDate(endDate)}
          </div>
        </div>
      </div>
    </div>
  );
}
