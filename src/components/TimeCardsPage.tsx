'use client';

import React, { useState, useMemo } from 'react';
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
  ChevronLeft,
  ChevronRight,
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // New shift form state (clean slate: dates default to settings or empty)
  const [newShift, setNewShift] = useState({
    employeeName: '',
    role: settings.recipients[0]?.role || 'Server',
    businessDate: settings.startDate || '',
    timeIn: '09:00 AM',
    timeOut: '05:00 PM',
    totalHours: 8,
    netSale: 0,
    directTips: 0,
    gratuity: 0,
  });

  const allRoles = Array.from(new Set(shifts.map((s) => s.role))).filter(Boolean);

  // Fast memoized shift filtering for high capacity (thousands of shifts)
  const filteredShifts = useMemo(() => {
    return shifts.filter((s) => {
      const matchesSearch = s.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = selectedRole === 'ALL' || s.role.toLowerCase() === selectedRole.toLowerCase();
      return matchesSearch && matchesRole;
    });
  }, [shifts, searchTerm, selectedRole]);

  const totalPages = Math.ceil(filteredShifts.length / pageSize) || 1;
  const paginatedShifts = useMemo(() => {
    if (pageSize >= 1000) return filteredShifts;
    const start = (currentPage - 1) * pageSize;
    return filteredShifts.slice(start, start + pageSize);
  }, [filteredShifts, currentPage, pageSize]);

  // Reset to page 1 on filter/search change
  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (val: string) => {
    setSelectedRole(val);
    setCurrentPage(1);
  };

  // KPI aggregates (calculated across all matching shifts)
  const totalHours = useMemo(() => filteredShifts.reduce((s, sh) => s + sh.totalHours, 0), [filteredShifts]);
  const totalSales = useMemo(() => filteredShifts.reduce((s, sh) => s + sh.netSale, 0), [filteredShifts]);
  const totalTips = useMemo(() => filteredShifts.reduce((s, sh) => s + sh.collectedTips, 0), [filteredShifts]);
  const totalGratuity = useMemo(() => filteredShifts.reduce((s, sh) => s + (sh.gratuity || 0), 0), [filteredShifts]);

  const handleDeleteShift = (id: string) => {
    onUpdateShifts(shifts.filter((s) => s.id !== id));
  };

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShift.employeeName.trim()) return;

    const direct = Number(newShift.directTips) || 0;
    const grat = Number(newShift.gratuity) || 0;
    const collected = direct + grat;

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
      directTips: direct,
      gratuity: grat,
      collectedTips: collected,
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
      businessDate: settings.startDate || '',
      timeIn: '09:00 AM',
      timeOut: '05:00 PM',
      totalHours: 8,
      netSale: 0,
      directTips: 0,
      gratuity: 0,
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
        <div className="glass-panel stat-card-hover" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Filtered Shifts
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
            {filteredShifts.length}
          </div>
        </div>

        <div className="glass-panel stat-card-hover" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Hours
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#9ca3ff', marginTop: '4px' }}>
            {totalHours.toFixed(2)} hrs
          </div>
        </div>

        <div className="glass-panel stat-card-hover" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Net Sales
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#00e5a3', marginTop: '4px' }}>
            ${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="glass-panel stat-card-hover" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Collected Tips
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f6c445', marginTop: '4px' }}>
            ${totalTips.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {totalGratuity > 0 && (
          <div className="glass-panel stat-card-hover" style={{ padding: '18px 20px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Auto Gratuity
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#00e5a3', marginTop: '4px' }}>
              ${totalGratuity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        )}
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
            className="input-clean filter-input-hover"
            placeholder="Search employee by name..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select
            className="input-clean filter-input-hover"
            value={selectedRole}
            onChange={(e) => handleRoleFilterChange(e.target.value)}
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
              <th style={{ textAlign: 'right' }}>Direct Tips</th>
              <th style={{ textAlign: 'right' }}>Gratuity</th>
              <th style={{ textAlign: 'right' }}>Total Tips</th>
              <th>Recipient?</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedShifts.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
                    {shifts.length === 0 ? 'No Timecard Shifts Loaded' : 'No Matching Shifts Found'}
                  </div>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                    {shifts.length === 0
                      ? 'Upload a 7shifts Time Card report in the Setup tab or add manual shifts using the button above.'
                      : 'Try adjusting your search term or role filter.'}
                  </p>
                </td>
              </tr>
            ) : (
              paginatedShifts.map((shift) => (
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
                  <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                    ${(shift.directTips !== undefined ? shift.directTips : shift.collectedTips).toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', color: (shift.gratuity || 0) > 0 ? '#00e5a3' : 'var(--text-muted)' }}>
                    ${(shift.gratuity || 0).toFixed(2)}
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
            {filteredShifts.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
          </strong>{' '}
          to{' '}
          <strong style={{ color: '#ffffff' }}>
            {Math.min(currentPage * pageSize, filteredShifts.length)}
          </strong>{' '}
          of <strong style={{ color: '#00e5a3' }}>{filteredShifts.length}</strong> shifts
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Direct Tips ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input-clean"
                    value={newShift.directTips}
                    onChange={(e) => setNewShift({ ...newShift, directTips: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Auto Gratuity ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input-clean"
                    value={newShift.gratuity}
                    onChange={(e) => setNewShift({ ...newShift, gratuity: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(93, 84, 230, 0.1)', border: '1px solid rgba(108, 99, 255, 0.25)' }}>
                <span style={{ fontSize: '0.82rem', color: '#c5c7e8' }}>Total Shift Tips:</span>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f6c445' }}>
                  ${((Number(newShift.directTips) || 0) + (Number(newShift.gratuity) || 0)).toFixed(2)}
                </span>
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
