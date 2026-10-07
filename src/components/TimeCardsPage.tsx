'use client';

import React, { useState, useMemo } from 'react';
import {
  Clock,
  Search,
  Filter,
  Globe,
  Calendar,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  Layers,
  Users,
  DollarSign,
} from 'lucide-react';
import { ProcessedShift, TipPoolSettings, DailyTipInput } from '../types/tips';
import { formatDisplayDate } from '../lib/parser';

interface TimeCardsPageProps {
  shifts: ProcessedShift[];
  onUpdateShifts: (updated: ProcessedShift[]) => void;
  settings: TipPoolSettings;
  onUpdateSettings: (settings: TipPoolSettings) => void;
  dailyTipInputs?: Record<string, DailyTipInput>;
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
  dailyTipInputs = {},
}: TimeCardsPageProps) {
  const [viewMode, setViewMode] = useState<'detailed' | 'daily'>('detailed');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);

  const allRoles = useMemo(() => {
    return Array.from(new Set(shifts.map((s) => s.role))).filter(Boolean);
  }, [shifts]);

  // 1. Total Employees: Unique employees only (no duplicates)
  const totalUniqueEmployees = useMemo(() => {
    return new Set(shifts.map((s) => s.employeeName.trim().toLowerCase())).size;
  }, [shifts]);

  // 2. Total Hours: Plain total hours from time cards (no overtime split)
  const totalHoursSum = useMemo(() => {
    const sum = shifts.reduce((acc, s) => acc + s.totalHours, 0);
    return Math.round(sum * 100) / 100;
  }, [shifts]);

  // 3. Total Net Sales
  const totalNetSalesSum = useMemo(() => {
    const sum = shifts.reduce((acc, s) => acc + s.netSale, 0);
    return Math.round(sum * 100) / 100;
  }, [shifts]);

  // 4. Dynamic Tip Platform KPIs: Detect all available tip sources dynamically
  const dynamicTipPlatforms = useMemo(() => {
    const platforms: { id: string; name: string; amount: number; color: string }[] = [];

    let salesSummarySum = 0;
    let webDashSum = 0;
    let onlineSum = 0;
    let doorDashSum = 0;
    let kioskSum = 0;
    let otherSum = 0;
    const customSums: Record<string, number> = {};

    const hasDailyInputs = Object.keys(dailyTipInputs).length > 0;

    if (hasDailyInputs) {
      for (const d of Object.values(dailyTipInputs)) {
        salesSummarySum += (d.salesSummaryTips !== undefined && d.salesSummaryTips > 0)
          ? d.salesSummaryTips
          : 0;
        webDashSum += d.webDashTips || 0;
        onlineSum += d.onlineTips || 0;
        doorDashSum += d.doorDashTips || 0;
        kioskSum += d.kioskTips || 0;
        otherSum += d.otherTips || 0;
        if (d.customFields) {
          for (const [k, v] of Object.entries(d.customFields)) {
            customSums[k] = (customSums[k] || 0) + (v || 0);
          }
        }
      }
    } else {
      // Fallback: Web/Dash tips from uploaded timecards
      webDashSum = shifts.reduce((acc, s) => acc + s.collectedTips, 0);
    }

    if (salesSummarySum > 0) {
      platforms.push({ id: 'salessummary', name: 'Sales Summary Tips', amount: Math.round(salesSummarySum * 100) / 100, color: '#00e5a3' });
    }
    if (webDashSum > 0) {
      platforms.push({ id: 'webdash', name: 'Web/Dash Tips', amount: Math.round(webDashSum * 100) / 100, color: '#9ca3ff' });
    }
    if (doorDashSum > 0) {
      platforms.push({ id: 'doordash', name: 'DoorDash Tips', amount: Math.round(doorDashSum * 100) / 100, color: '#ff5f6d' });
    }
    if (onlineSum > 0) {
      platforms.push({ id: 'online', name: 'Online Tips', amount: Math.round(onlineSum * 100) / 100, color: '#00e5a3' });
    }
    if (kioskSum > 0) {
      platforms.push({ id: 'kiosk', name: 'Kiosk Tips', amount: Math.round(kioskSum * 100) / 100, color: '#f6c445' });
    }
    for (const [k, v] of Object.entries(customSums)) {
      if (v > 0) {
        platforms.push({ id: k, name: `${k} Tips`, amount: Math.round(v * 100) / 100, color: '#a78bfa' });
      }
    }
    if (otherSum > 0) {
      platforms.push({ id: 'other', name: 'Other Tips', amount: Math.round(otherSum * 100) / 100, color: '#38bdf8' });
    }

    if (platforms.length === 0) {
      const shiftTipTotal = shifts.reduce((acc, s) => acc + s.collectedTips, 0);
      if (shiftTipTotal > 0) {
        platforms.push({ id: 'webdash', name: 'Web/Dash Tips', amount: Math.round(shiftTipTotal * 100) / 100, color: '#9ca3ff' });
      }
    }

    return platforms;
  }, [dailyTipInputs, shifts]);

  // Grand Total Tips = Sum of all applicable tip platforms
  const totalTipsSum = useMemo(() => {
    const sum = dynamicTipPlatforms.reduce((acc, p) => acc + p.amount, 0);
    return Math.round(sum * 100) / 100;
  }, [dynamicTipPlatforms]);

  // Recipient role set for instant lookup
  const recipientRoleSet = useMemo(() => {
    return new Set(settings.recipients.map((r) => r.role.toLowerCase()));
  }, [settings.recipients]);

  // Memoized shift filtering
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

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (val: string) => {
    setSelectedRole(val);
    setCurrentPage(1);
  };

  // Group shifts by day for the Second View (Daily Summary View)
  const dailySummaryGroups = useMemo(() => {
    const groupMap = new Map<
      string,
      {
        dateKey: string;
        headerLabel: string;
        employees: {
          employeeName: string;
          role: string;
          hours: number;
          tip: number;
        }[];
        totalHours: number;
        totalTip: number;
      }
    >();

    shifts.forEach((s) => {
      const dKey = s.businessDate || s.calendarDate || s.rawDate;
      if (!dKey) return;

      let grp = groupMap.get(dKey);
      if (!grp) {
        // Format header like "21-Sept" matching user screenshot
        let headerLabel = s.rawDate || dKey;
        const [y, m, d] = (s.calendarDate || s.businessDate || '').split('-');
        if (y && m && d) {
          const monthShorts = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
          const mStr = monthShorts[parseInt(m, 10) - 1] || m;
          headerLabel = `${parseInt(d, 10)}-${mStr}`;
        }

        grp = {
          dateKey: dKey,
          headerLabel,
          employees: [],
          totalHours: 0,
          totalTip: 0,
        };
        groupMap.set(dKey, grp);
      }

      const existingEmp = grp.employees.find(
        (e) => e.employeeName.toLowerCase() === s.employeeName.toLowerCase() && e.role.toLowerCase() === s.role.toLowerCase()
      );

      const shiftTip = s.collectedTips;

      if (existingEmp) {
        existingEmp.hours = Math.round((existingEmp.hours + s.totalHours) * 100) / 100;
        existingEmp.tip = Math.round((existingEmp.tip + shiftTip) * 100) / 100;
      } else {
        grp.employees.push({
          employeeName: s.employeeName,
          role: s.role,
          hours: s.totalHours,
          tip: shiftTip,
        });
      }

      grp.totalHours = Math.round((grp.totalHours + s.totalHours) * 100) / 100;
      grp.totalTip = Math.round((grp.totalTip + shiftTip) * 100) / 100;
    });

    return Array.from(groupMap.values()).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  }, [shifts]);

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header & View Switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '26px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Time Cards
            </h1>
            <span className="badge badge-teal">{shifts.length} Total Shifts</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '4px' }}>
            Inspect raw employee shifts, hours, sales, tip entries, and recipient eligibility.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* View Mode Toggle: All Shifts Table vs Daily Summary View */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-input)',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              onClick={() => setViewMode('detailed')}
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '6px',
                background: viewMode === 'detailed' ? 'rgba(93, 84, 230, 0.25)' : 'transparent',
                border: viewMode === 'detailed' ? '1px solid rgba(108, 99, 255, 0.45)' : '1px solid transparent',
                color: viewMode === 'detailed' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <TableIcon size={14} />
              <span>All Shifts Table</span>
            </button>

            <button
              onClick={() => setViewMode('daily')}
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '6px',
                background: viewMode === 'daily' ? 'rgba(124, 179, 66, 0.25)' : 'transparent',
                border: viewMode === 'daily' ? '1px solid rgba(124, 179, 66, 0.5)' : '1px solid transparent',
                color: viewMode === 'daily' ? '#c5e1a5' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Calendar size={14} />
              <span>Daily Summary View</span>
            </button>
          </div>

          {/* Timezone Switcher */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--bg-input)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
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
        </div>
      </div>

      {/* Useful KPI Cards Section (No filter-style controls here) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`,
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        {/* KPI 1: Total Employees (Unique) */}
        <div className="glass-panel stat-card-hover" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Employees
          </span>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
            {totalUniqueEmployees}
          </div>
        </div>

        {/* KPI 2: Total Hours (Plain from time cards, no overtime split) */}
        <div className="glass-panel stat-card-hover" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Hours
          </span>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#9ca3ff', marginTop: '4px' }}>
            {totalHoursSum.toFixed(2)} hrs
          </div>
        </div>

        {/* KPI 3: Total Net Sales */}
        <div className="glass-panel stat-card-hover" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Net Sales
          </span>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#00e5a3', marginTop: '4px' }}>
            ${totalNetSalesSum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* KPI 4: Dynamic Platform KPIs (DoorDash, Kiosk, Online, Chaos, Other) */}
        {dynamicTipPlatforms.map((platform) => (
          <div key={platform.id} className="glass-panel stat-card-hover" style={{ padding: '18px 20px' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              {platform.name}
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: platform.color, marginTop: '4px' }}>
              ${platform.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        ))}

        {/* KPI 5: Total Tips (Sum of all platforms) */}
        <div
          className="glass-panel stat-card-hover"
          style={{
            padding: '18px 20px',
            border: '1.5px solid rgba(0, 229, 163, 0.4)',
            background: 'rgba(0, 229, 163, 0.06)',
          }}
        >
          <span style={{ fontSize: '0.76rem', color: '#00e5a3', fontWeight: 700, textTransform: 'uppercase' }}>
            Total Tips
          </span>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
            ${totalTipsSum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* VIEW 1: All Shifts Table */}
      {viewMode === 'detailed' && (
        <div>
          {/* Table Search & Filter Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              marginBottom: '16px',
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

          {/* Time Card Table with Exact Headers & Sticky Header */}
          <div className="data-table-container" style={{ maxHeight: '600px', overflowY: 'auto', overflowX: 'auto', position: 'relative' }}>
            <table className="data-table" style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%', minWidth: '1380px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 12 }}>
                <tr>
                  <th style={{ position: 'sticky', top: 0, left: 0, background: '#151336', zIndex: 14 }}>Employee Name</th>
                  <th style={{ position: 'sticky', top: 0, background: '#151336', zIndex: 12 }}>Role</th>
                  <th style={{ position: 'sticky', top: 0, background: '#151336', zIndex: 12, textAlign: 'right' }}>Pay rate</th>
                  <th style={{ position: 'sticky', top: 0, background: '#151336', zIndex: 12 }}>Date</th>
                  <th style={{ position: 'sticky', top: 0, background: '#151336', zIndex: 12 }}>Time in</th>
                  <th style={{ position: 'sticky', top: 0, background: '#151336', zIndex: 12 }}>Time out</th>
                  <th style={{ position: 'sticky', top: 0, background: '#151336', zIndex: 12, textAlign: 'right' }}>Regular Hours</th>
                  <th style={{ position: 'sticky', top: 0, background: '#151336', zIndex: 12, textAlign: 'right' }}>Overtime</th>
                  <th style={{ position: 'sticky', top: 0, background: '#151336', zIndex: 12, textAlign: 'right' }}>Double Overtime</th>
                  <th style={{ position: 'sticky', top: 0, background: '#151336', zIndex: 12, textAlign: 'right' }}>Weekly Overtime</th>
                  <th style={{ position: 'sticky', top: 0, background: '#151336', zIndex: 12, textAlign: 'right' }}>Paid Breaks hours</th>
                  <th style={{ position: 'sticky', top: 0, background: '#151336', zIndex: 12, textAlign: 'right' }}>UnPaid Breaks hours</th>
                  <th style={{ position: 'sticky', top: 0, background: '#151336', zIndex: 12, textAlign: 'right', color: '#9ca3ff' }}>
                    Total Hours (excluding unpaid breaks)
                  </th>
                  <th style={{ position: 'sticky', top: 0, background: '#151336', zIndex: 12, textAlign: 'right' }}>Net Sale</th>
                  <th style={{ position: 'sticky', top: 0, background: '#151336', zIndex: 12, textAlign: 'right', color: '#f6c445' }}>Tips</th>
                  <th style={{ position: 'sticky', top: 0, background: '#151336', zIndex: 12, textAlign: 'right' }}>Gratuity</th>
                  <th style={{ position: 'sticky', top: 0, background: '#151336', zIndex: 12, textAlign: 'center' }}>Recipient</th>
                </tr>
              </thead>
              <tbody>
                {paginatedShifts.length === 0 ? (
                  <tr>
                    <td colSpan={17} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
                        {shifts.length === 0 ? 'No Timecard Shifts Loaded' : 'No Matching Shifts Found'}
                      </div>
                      <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                        {shifts.length === 0
                          ? 'Upload a time card report in the Tip Setup tab to import shift records.'
                          : 'Try adjusting your search query or role filter.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedShifts.map((shift) => {
                    const isRecipient = recipientRoleSet.has(shift.role.toLowerCase());
                    return (
                      <tr key={shift.id}>
                        <td style={{ position: 'sticky', left: 0, background: '#17143e', zIndex: 8, fontWeight: 600, color: '#ffffff' }}>
                          {shift.employeeName}
                        </td>
                        <td>
                          <span className="badge badge-indigo">{shift.role}</span>
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                          ${shift.payRate ? shift.payRate.toFixed(2) : '—'}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatDisplayDate(shift.businessDate)}</td>
                        <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{shift.timeIn}</td>
                        <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{shift.timeOut}</td>
                        <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                          {(shift.regularHours !== undefined ? shift.regularHours : shift.totalHours).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                          {(shift.overtimeHours || 0).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                          {(shift.doubleOvertime || 0).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                          {(shift.weeklyOvertime || 0).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                          {(shift.paidBreaksHours || 0).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                          {(shift.unpaidBreaksHours || 0).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#9ca3ff' }}>
                          {shift.totalHours.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                          ${shift.netSale.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#f6c445' }}>
                          ${shift.collectedTips.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', color: (shift.gratuity || 0) > 0 ? '#00e5a3' : 'var(--text-muted)' }}>
                          ${(shift.gratuity || 0).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {isRecipient ? (
                            <span className="badge badge-teal">Yes</span>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>No</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
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
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  {currentPage} / {totalPages}
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
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Additional Time Cards View (Daily Summary View matching user reference) */}
      {viewMode === 'daily' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {dailySummaryGroups.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
                No Shift Records to Summarize
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Upload time cards in the Tip Setup tab to display daily employee summaries.
              </p>
            </div>
          ) : (
            dailySummaryGroups.map((grp) => (
              <div
                key={grp.dateKey}
                style={{
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1.5px solid rgba(124, 179, 66, 0.45)',
                  background: '#151336',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                }}
              >
                {/* Green Header Banner matching Excel screenshot */}
                <div
                  style={{
                    background: '#7cb342',
                    color: '#0e1d06',
                    padding: '10px 18px',
                    fontWeight: 800,
                    fontSize: '1.05rem',
                    letterSpacing: '-0.01em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{grp.headerLabel}</span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1b3b0c' }}>
                    {formatDisplayDate(grp.dateKey)}
                  </span>
                </div>

                {/* Table for this day */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid rgba(139, 142, 222, 0.15)' }}>
                      <th style={{ textAlign: 'left', padding: '12px 18px', color: '#ffffff', fontWeight: 700 }}>Employee</th>
                      <th style={{ textAlign: 'left', padding: '12px 18px', color: '#ffffff', fontWeight: 700 }}>Role</th>
                      <th style={{ textAlign: 'right', padding: '12px 18px', color: '#ffffff', fontWeight: 700 }}>Hours</th>
                      <th style={{ textAlign: 'right', padding: '12px 18px', color: '#ffffff', fontWeight: 700 }}>Tip</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grp.employees.map((emp, i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom: '1px solid rgba(139, 142, 222, 0.08)',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <td style={{ padding: '11px 18px', fontWeight: 600, color: '#ffffff' }}>
                          {emp.employeeName}
                        </td>
                        <td style={{ padding: '11px 18px' }}>
                          <span className="badge badge-indigo">{emp.role}</span>
                        </td>
                        <td style={{ padding: '11px 18px', textAlign: 'right', color: '#c5c7e8', fontWeight: 500 }}>
                          {emp.hours.toFixed(2)}
                        </td>
                        <td style={{ padding: '11px 18px', textAlign: 'right', color: '#f6c445', fontWeight: 600 }}>
                          ${emp.tip.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr
                      style={{
                        background: 'rgba(124, 179, 66, 0.08)',
                        borderTop: '2px solid rgba(124, 179, 66, 0.35)',
                        fontStyle: 'italic',
                      }}
                    >
                      <td style={{ padding: '12px 18px', fontWeight: 800, color: '#ffffff' }}>Total</td>
                      <td style={{ padding: '12px 18px' }}></td>
                      <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 800, color: '#c5e1a5', fontSize: '0.98rem' }}>
                        {grp.totalHours.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 800, color: '#7cb342', fontSize: '0.98rem' }}>
                        ${grp.totalTip.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
