'use client';

import React, { useState } from 'react';
import { DollarSign, Sparkles, Trash2, Calendar, ChevronDown, ChevronUp, Clock, Users } from 'lucide-react';
import { DailyTipInput, ProcessedShift, RestaurantConfig } from '../types/tips';
import { MISSION_HILL_SAMPLE_TIPS } from '../lib/sampleData';
import { formatDisplayDate, getDayOfWeek } from '../lib/parser';

interface DailyTipEntryProps {
  restaurant: RestaurantConfig;
  cycleDates: string[];
  dailyTipInputs: Record<string, DailyTipInput>;
  shifts: ProcessedShift[];
  onInputChange: (date: string, field: keyof DailyTipInput, value: number) => void;
  onBulkSet: (data: Record<string, DailyTipInput>) => void;
}

export function DailyTipEntry({
  restaurant,
  cycleDates,
  dailyTipInputs,
  shifts,
  onInputChange,
  onBulkSet,
}: DailyTipEntryProps) {
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({});

  // Compute total tips entered across all dates
  let totalEnteredTips = 0;
  for (const date of cycleDates) {
    const d = dailyTipInputs[date];
    if (d) {
      totalEnteredTips +=
        (d.webDashTips || 0) +
        (d.doorDashTips || 0) +
        (d.kioskTips || 0) +
        (d.chaosTips || 0) +
        (d.otherTips || 0);
    }
  }

  // Pre-fill with sample verified values
  const handlePreFillSample = () => {
    const updated = { ...dailyTipInputs };
    for (const date of cycleDates) {
      if (MISSION_HILL_SAMPLE_TIPS[date]) {
        updated[date] = { ...MISSION_HILL_SAMPLE_TIPS[date] };
      } else {
        updated[date] = {
          date,
          displayDate: formatDisplayDate(date),
          dayOfWeek: getDayOfWeek(date),
          webDashTips: 100.0,
          doorDashTips: 0,
          kioskTips: 0,
          chaosTips: 0,
          otherTips: 0,
          totalTips: 100.0,
        };
      }
    }
    onBulkSet(updated);
  };

  const handleClearAll = () => {
    const updated: Record<string, DailyTipInput> = {};
    for (const date of cycleDates) {
      updated[date] = {
        date,
        displayDate: formatDisplayDate(date),
        dayOfWeek: getDayOfWeek(date),
        webDashTips: 0,
        doorDashTips: 0,
        kioskTips: 0,
        chaosTips: 0,
        otherTips: 0,
        totalTips: 0,
      };
    }
    onBulkSet(updated);
  };

  // Get shifts info for a specific date
  const getDateStaffStats = (date: string) => {
    const dateShifts = shifts.filter((s) => s.businessDate === date && s.isEligibleRecipient);
    const emps = Array.from(new Set(dateShifts.map((s) => s.employeeName)));
    const hours = dateShifts.reduce((sum, s) => sum + s.totalHours, 0);
    return { staffCount: emps.length, totalHours: hours };
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fbbf24',
            }}
          >
            <DollarSign size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>3. Manual Daily Tip Entry</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Enter WebDash, DoorDash, Kiosk, or other collected tips for each date in this cycle
            </p>
          </div>
        </div>

        {/* Running total pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="badge badge-emerald" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
            <span>Total Entered:</span>
            <strong style={{ marginLeft: '4px' }}>
              ${totalEnteredTips.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>
        </div>
      </div>

      {/* Action helpers */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <button
          onClick={handlePreFillSample}
          type="button"
          className="btn-secondary"
          style={{
            fontSize: '0.8rem',
            padding: '6px 14px',
            color: '#34d399',
            borderColor: 'rgba(16, 185, 129, 0.3)',
          }}
        >
          <Sparkles size={14} />
          <span>⚡ Auto-fill Mission Hill Excel Tips ($2,118.87)</span>
        </button>

        <button
          onClick={handleClearAll}
          type="button"
          className="btn-secondary"
          style={{ fontSize: '0.8rem', padding: '6px 14px', color: '#fb7185' }}
        >
          <Trash2 size={13} />
          <span>Clear All Dates</span>
        </button>
      </div>

      {/* Daily Rows Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '550px', overflowY: 'auto', paddingRight: '4px' }}>
        {cycleDates.map((date) => {
          const entry = dailyTipInputs[date] || {
            date,
            displayDate: formatDisplayDate(date),
            dayOfWeek: getDayOfWeek(date),
            webDashTips: 0,
            doorDashTips: 0,
            kioskTips: 0,
            chaosTips: 0,
            otherTips: 0,
            totalTips: 0,
          };

          const stats = getDateStaffStats(date);
          const dayTotal =
            (entry.webDashTips || 0) +
            (entry.doorDashTips || 0) +
            (entry.kioskTips || 0) +
            (entry.chaosTips || 0) +
            (entry.otherTips || 0);

          return (
            <div
              key={date}
              style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: dayTotal > 0 ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: dayTotal > 0 ? '#10b981' : '#64748b',
                    }}
                  />
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                      {entry.displayDate || formatDisplayDate(date)}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                      ({entry.dayOfWeek || getDayOfWeek(date)})
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* Contextual shifts stats */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={12} color="#60a5fa" />
                      {stats.staffCount} staff on shift
                    </span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} color="#34d399" />
                      {stats.totalHours.toFixed(2)} hrs
                    </span>
                  </div>

                  {/* Day total pill */}
                  <div
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: dayTotal > 0 ? '#34d399' : 'var(--text-muted)',
                      background: dayTotal > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-pill)',
                    }}
                  >
                    Day Total: ${dayTotal.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Input Columns */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '12px',
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    WebDash Tips
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={entry.webDashTips || ''}
                      onChange={(e) => onInputChange(date, 'webDashTips', parseFloat(e.target.value) || 0)}
                      className="input-field"
                      style={{ paddingLeft: '24px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    DoorDash Tips
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={entry.doorDashTips || ''}
                      onChange={(e) => onInputChange(date, 'doorDashTips', parseFloat(e.target.value) || 0)}
                      className="input-field"
                      style={{ paddingLeft: '24px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Kiosk Tips
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={entry.kioskTips || ''}
                      onChange={(e) => onInputChange(date, 'kioskTips', parseFloat(e.target.value) || 0)}
                      className="input-field"
                      style={{ paddingLeft: '24px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Chaos / Other Tips
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={entry.chaosTips || ''}
                      onChange={(e) => onInputChange(date, 'chaosTips', parseFloat(e.target.value) || 0)}
                      className="input-field"
                      style={{ paddingLeft: '24px' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
