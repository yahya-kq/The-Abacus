'use client';

import React from 'react';
import { DollarSign, Sparkles, Trash2, Clock, Users, ArrowRight, RefreshCw, Calculator } from 'lucide-react';
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
  onCalculate?: () => void;
}

export function DailyTipEntry({
  restaurant,
  cycleDates,
  dailyTipInputs,
  shifts,
  onInputChange,
  onBulkSet,
  onCalculate,
}: DailyTipEntryProps) {
  // Compute total tips entered across all dates
  let totalEnteredTips = 0;
  for (const date of cycleDates) {
    const d = dailyTipInputs[date];
    if (d) {
      totalEnteredTips +=
        (d.webDashTips || 0) +
        (d.doorDashTips || 0) +
        (d.kioskTips || 0) +
        (d.otherTips || 0);
    }
  }

  // Pre-fill with sample verified values from Mission Hill sheet
  const handlePreFillSample = () => {
    const updated = { ...dailyTipInputs };
    for (const date of cycleDates) {
      if (MISSION_HILL_SAMPLE_TIPS[date]) {
        updated[date] = { ...MISSION_HILL_SAMPLE_TIPS[date] };
      }
    }
    onBulkSet(updated);
  };

  // Sync WebDash tips directly from loaded shift records
  const handleSyncFromShifts = () => {
    const shiftTipsByDate: Record<string, number> = {};
    for (const s of shifts) {
      if (s.posTips > 0) {
        shiftTipsByDate[s.businessDate] = (shiftTipsByDate[s.businessDate] || 0) + s.posTips;
      }
    }

    const updated = { ...dailyTipInputs };
    for (const date of cycleDates) {
      const existing = updated[date] || {
        date,
        displayDate: formatDisplayDate(date),
        dayOfWeek: getDayOfWeek(date),
        webDashTips: 0,
        doorDashTips: 0,
        kioskTips: 0,
        otherTips: 0,
        totalTips: 0,
      };

      const extractedTip = shiftTipsByDate[date] !== undefined ? Math.round(shiftTipsByDate[date] * 100) / 100 : existing.webDashTips || 0;

      const newDay = {
        ...existing,
        webDashTips: extractedTip,
      };

      newDay.totalTips =
        (newDay.webDashTips || 0) +
        (newDay.doorDashTips || 0) +
        (newDay.kioskTips || 0) +
        (newDay.otherTips || 0);

      updated[date] = newDay;
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

  const totalCycleHours = shifts
    .filter((s) => s.isEligibleRecipient && cycleDates.includes(s.businessDate))
    .reduce((sum, s) => sum + s.totalHours, 0);

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      {/* Action Header & Live Summary Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '14px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
            }}
          >
            <DollarSign size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
              Daily Tip Entries ({cycleDates.length} Days)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              WebDash tips auto-populate from time cards. Enter DoorDash, Kiosk, or Other tips if collected.
            </p>
          </div>
        </div>

        {/* Live Total & Quick Calculate CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Total Tips Entered
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#818cf8' }}>
              ${totalEnteredTips.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {onCalculate && (
            <button
              onClick={onCalculate}
              type="button"
              className="btn-primary"
              style={{ padding: '10px 24px', fontSize: '0.92rem' }}
            >
              <Calculator size={17} />
              <span>Calculate Tips</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Helper Action Toolbar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {shifts.length > 0 && (
          <button
            onClick={handleSyncFromShifts}
            type="button"
            className="btn-secondary"
            style={{
              fontSize: '0.8rem',
              padding: '6px 14px',
              color: '#818cf8',
              borderColor: 'rgba(99, 102, 241, 0.35)',
            }}
          >
            <RefreshCw size={13} />
            <span>Sync WebDash Tips from Time Card</span>
          </button>
        )}

        <button
          onClick={handlePreFillSample}
          type="button"
          className="btn-secondary"
          style={{
            fontSize: '0.8rem',
            padding: '6px 14px',
            color: '#60a5fa',
            borderColor: 'rgba(59, 130, 246, 0.35)',
          }}
        >
          <Sparkles size={13} />
          <span>Auto-fill Sample Sheet Tips ($2,118.87)</span>
        </button>

        <button
          onClick={handleClearAll}
          type="button"
          className="btn-secondary"
          style={{ fontSize: '0.8rem', padding: '6px 14px', color: '#fb7185' }}
        >
          <Trash2 size={13} />
          <span>Clear All</span>
        </button>
      </div>

      {/* Modern Compact Daily Input Table */}
      <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
        <table className="modern-table">
          <thead>
            <tr>
              <th style={{ width: '190px' }}>Date</th>
              <th style={{ width: '130px' }}>Staff on Duty</th>
              <th>WebDash Tips ($)</th>
              <th>DoorDash Tips ($)</th>
              <th>Kiosk Tips ($)</th>
              <th>Other Tips ($)</th>
              <th style={{ textAlign: 'right', width: '120px' }}>Day Total</th>
            </tr>
          </thead>
          <tbody>
            {cycleDates.map((date) => {
              const entry = dailyTipInputs[date] || {
                date,
                displayDate: formatDisplayDate(date),
                dayOfWeek: getDayOfWeek(date),
                webDashTips: 0,
                doorDashTips: 0,
                kioskTips: 0,
                otherTips: 0,
                totalTips: 0,
              };

              const stats = getDateStaffStats(date);
              const dayTotal =
                (entry.webDashTips || 0) +
                (entry.doorDashTips || 0) +
                (entry.kioskTips || 0) +
                (entry.otherTips || 0);

              return (
                <tr key={date}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                      {entry.displayDate || formatDisplayDate(date)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {entry.dayOfWeek || getDayOfWeek(date)}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <span style={{ fontWeight: 600 }}>{stats.staffCount} staff</span> • {stats.totalHours.toFixed(1)}h
                    </div>
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={entry.webDashTips || ''}
                      onChange={(e) => onInputChange(date, 'webDashTips', parseFloat(e.target.value) || 0)}
                      className="input-field"
                      style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={entry.doorDashTips || ''}
                      onChange={(e) => onInputChange(date, 'doorDashTips', parseFloat(e.target.value) || 0)}
                      className="input-field"
                      style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={entry.kioskTips || ''}
                      onChange={(e) => onInputChange(date, 'kioskTips', parseFloat(e.target.value) || 0)}
                      className="input-field"
                      style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={entry.otherTips || ''}
                      onChange={(e) => onInputChange(date, 'otherTips', parseFloat(e.target.value) || 0)}
                      className="input-field"
                      style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                    />
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.92rem', color: dayTotal > 0 ? '#818cf8' : 'var(--text-muted)' }}>
                    ${dayTotal.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: 'rgba(15, 23, 42, 0.95)', borderTop: '2px solid rgba(99, 102, 241, 0.3)' }}>
              <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>TOTALS</td>
              <td style={{ fontWeight: 700, color: '#60a5fa' }}>{totalCycleHours.toFixed(2)} hrs</td>
              <td style={{ fontWeight: 700 }}>
                ${cycleDates.reduce((s, d) => s + (dailyTipInputs[d]?.webDashTips || 0), 0).toFixed(2)}
              </td>
              <td style={{ fontWeight: 700 }}>
                ${cycleDates.reduce((s, d) => s + (dailyTipInputs[d]?.doorDashTips || 0), 0).toFixed(2)}
              </td>
              <td style={{ fontWeight: 700 }}>
                ${cycleDates.reduce((s, d) => s + (dailyTipInputs[d]?.kioskTips || 0), 0).toFixed(2)}
              </td>
              <td style={{ fontWeight: 700 }}>
                ${cycleDates.reduce((s, d) => s + (dailyTipInputs[d]?.otherTips || 0), 0).toFixed(2)}
              </td>
              <td style={{ textAlign: 'right', fontWeight: 800, color: '#818cf8', fontSize: '1.05rem' }}>
                ${totalEnteredTips.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
