'use client';

import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { formatDisplayDate } from '../lib/parser';

interface TipCycleSelectorProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

export function TipCycleSelector({ startDate, endDate, onChange }: TipCycleSelectorProps) {
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
    <div className="glass-panel" style={{ padding: '22px 24px', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
            }}
          >
            <Calendar size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>Tip Cycle Dates</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Auto-detected from time card or manually adjusted
            </p>
          </div>
        </div>

        <div className="badge badge-indigo">
          <Clock size={12} style={{ marginRight: '4px' }} />
          {daysCount > 0 ? `${daysCount} Operating Days` : 'Select range'}
        </div>
      </div>

      {/* Date Pickers Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          background: 'rgba(15, 23, 42, 0.45)',
          padding: '14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
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
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
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
