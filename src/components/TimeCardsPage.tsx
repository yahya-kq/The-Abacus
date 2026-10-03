'use client';

import React, { useState } from 'react';
import {
  Clock,
  Search,
  Filter,
  Plus,
  Trash2,
  Globe,
  RotateCcw,
  UserPlus,
  X,
  CheckCircle2,
} from 'lucide-react';
import { ProcessedShift, TipPoolSettings } from '../types/tips';
import { formatDisplayDate } from '../lib/parser';

interface TimeCardsPageProps {
  shifts: ProcessedShift[];
  onUpdateShifts: (updated: ProcessedShift[]) => void;
  settings: TipPoolSettings;
  onUpdateSettings: (settings: TipPoolSettings) => void;
}

const TIMEZONES = [
  { id: 'America/New_York', label: 'Eastern Time (ET)', offset: -4 },
  { id: 'America/Chicago', label: 'Central Time (CT)', offset: -5 },
  { id: 'America/Denver', label: 'Mountain Time (MT)', offset: -6 },
  { id: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: -7 },
  { id: 'America/Anchorage', label: 'Alaska Time (AKT)', offset: -8 },
  { id: 'Pacific/Honolulu', label: 'Hawaii Time (HT)', offset: -10 },
  { id: 'America/Halifax', label: 'Atlantic Time (AT)', offset: -3 },
];

export function TimeCardsPage({
  shifts,
  onUpdateShifts,
  settings,
  onUpdateSettings,
}: TimeCardsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New shift form state
  const [newShift, setNewShift] = useState({
    employeeName: '',
    role: settings.recipients[0]?.role || 'Server',
    businessDate: settings.startDate || '2026-09-07',
    timeIn: '09:00 AM',
    timeOut: '05:00 PM',
    totalHours: 8,
    netSale: 0,
    collectedTips: 0,
  });

  const allRoles = Array.from(new Set(shifts.map((s) => s.role))).filter(Boolean);

  // Filter shifts
  const filteredShifts = shifts.filter((s) => {
    const matchesSearch = s.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'ALL' || s.role.toLowerCase() === selectedRole.toLowerCase();
    return matchesSearch && matchesRole;
  });

  // KPI aggregates
  const totalHours = filteredShifts.reduce((s, sh) => s + sh.totalHours, 0);
  const totalSales = filteredShifts.reduce((s, sh) => s + sh.netSale, 0);
  const totalTips = filteredShifts.reduce((s, sh) => s + sh.collectedTips, 0);

  const handleDeleteShift = (id: string) => {
    onUpdateShifts(shifts.filter((s) => s.id !== id));
  };

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShift.employeeName.trim()) return;

    const created: ProcessedShift = {
      id: `manual-shift-${Date.now()}`,
      employeeName: newShift.employeeName.trim(),
      role: newShift.role,
      payRate: 15,
      rawDate: newShift.businessDate,
      timeIn: newShift.timeIn,
      timeOut: newShift.timeOut,
      totalHours: Number(newShift.totalHours) || 0,
      netSale: Number(newShift.netSale) || 0,
      collectedTips: Number(newShift.collectedTips) || 0,
      gratuity: 0,
      calendarDate: newShift.businessDate,
      businessDate: newShift.businessDate,
      isEligibleRecipient: settings.recipients.some((r) => r.role.toLowerCase() === newShift.role.toLowerCase()),
      isContributor: settings.contributors.some((c) => c.role.toLowerCase() === newShift.role.toLowerCase()),
    };

    onUpdateShifts([...shifts, created]);
    setIsAddModalOpen(false);
    setNewShift({
      employeeName: '',
      role: settings.recipients[0]?.role || 'Server',
      businessDate: settings.startDate || '2026-09-07',
      timeIn: '09:00 AM',
      timeOut: '05:00 PM',
      totalHours: 8,
      netSale: 0,
      collectedTips: 0,
    });
  };

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
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
            <h1 style={{ fontSize: '1.9rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Time Cards Manager
            </h1>
            <span className="badge badge-teal">{shifts.length} Total Shifts</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '4px' }}>
            Inspect, search, and manage individual shifts across operational dates.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Timezone Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-input)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <Globe size={16} color="#9ca3ff" />
            <select
              value={settings.timezone}
              onChange={(e) => onUpdateSettings({ ...settings, timezone: e.target.value })}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.86rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.id} value={tz.id} style={{ background: '#151336' }}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* Add Employee Shift Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            type="button"
            className="btn-primary"
            style={{ padding: '9px 18px', fontSize: '0.88rem' }}
          >
            <UserPlus size={16} />
            <span>Add Shift</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Filtered Shifts
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
            {filteredShifts.length}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Hours
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#9ca3ff', marginTop: '4px' }}>
            {totalHours.toFixed(2)} hrs
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Net Sales
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#00e5a3', marginTop: '4px' }}>
            ${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Collected Tips
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f6c445', marginTop: '4px' }}>
            ${totalTips.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
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
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select
            className="input-clean"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            style={{ minWidth: '150px' }}
          >
            <option value="ALL" style={{ background: '#151336' }}>All Roles ({shifts.length})</option>
            {allRoles.map((r) => (
              <option key={r} value={r} style={{ background: '#151336' }}>
                {r} ({shifts.filter((s) => s.role === r).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Shifts Table */}
      <div className="data-table-container" style={{ maxHeight: '560px' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Role</th>
              <th>Date</th>
              <th>In</th>
              <th>Out</th>
              <th style={{ textAlign: 'right' }}>Hours</th>
              <th style={{ textAlign: 'right' }}>Net Sales</th>
              <th style={{ textAlign: 'right' }}>Collected Tips</th>
              <th>Recipient?</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredShifts.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No shifts found matching your filter criteria.
                </td>
              </tr>
            ) : (
              filteredShifts.map((shift) => (
                <tr key={shift.id}>
                  <td style={{ fontWeight: 600, color: '#ffffff' }}>{shift.employeeName}</td>
                  <td>
                    <span className="badge badge-indigo">{shift.role}</span>
                  </td>
                  <td>{formatDisplayDate(shift.businessDate)}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{shift.timeIn}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{shift.timeOut}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{shift.totalHours.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                    ${shift.netSale.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#f6c445' }}>
                    ${shift.collectedTips.toFixed(2)}
                  </td>
                  <td>
                    {shift.isEligibleRecipient ? (
                      <span className="badge badge-teal">Yes</span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Excluded</span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => handleDeleteShift(shift.id)}
                      type="button"
                      title="Delete shift"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#ff5f6d')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Shift Modal */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(9, 8, 22, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '480px',
              width: '100%',
              padding: '28px',
              background: '#19173f',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>Add Employee Shift</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                type="button"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateShift} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Employee Name *
                </label>
                <input
                  type="text"
                  required
                  className="input-clean"
                  placeholder="e.g. Scott Okano"
                  value={newShift.employeeName}
                  onChange={(e) => setNewShift({ ...newShift, employeeName: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Role
                  </label>
                  <select
                    className="input-clean"
                    value={newShift.role}
                    onChange={(e) => setNewShift({ ...newShift, role: e.target.value })}
                  >
                    {allRoles.length > 0 ? (
                      allRoles.map((r) => (
                        <option key={r} value={r} style={{ background: '#151336' }}>
                          {r}
                        </option>
                      ))
                    ) : (
                      <option value="Server" style={{ background: '#151336' }}>Server</option>
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    className="input-clean"
                    value={newShift.businessDate}
                    onChange={(e) => setNewShift({ ...newShift, businessDate: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Time In
                  </label>
                  <input
                    type="text"
                    className="input-clean"
                    placeholder="09:00 AM"
                    value={newShift.timeIn}
                    onChange={(e) => setNewShift({ ...newShift, timeIn: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Time Out
                  </label>
                  <input
                    type="text"
                    className="input-clean"
                    placeholder="05:00 PM"
                    value={newShift.timeOut}
                    onChange={(e) => setNewShift({ ...newShift, timeOut: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Hours
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    className="input-clean"
                    value={newShift.totalHours}
                    onChange={(e) => setNewShift({ ...newShift, totalHours: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Net Sales ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input-clean"
                    value={newShift.netSale}
                    onChange={(e) => setNewShift({ ...newShift, netSale: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Tips ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input-clean"
                    value={newShift.collectedTips}
                    onChange={(e) => setNewShift({ ...newShift, collectedTips: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
