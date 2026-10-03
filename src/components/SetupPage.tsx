'use client';

import React, { useState, useRef } from 'react';
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  Upload,
  FileSpreadsheet,
  Lock,
  Unlock,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  TipPoolSettings,
  ProcessedShift,
  DailyTipInput,
  PoolDistributionMethod,
  PoolContributionMethod,
} from '../types/tips';
import { parseTimecardFile, parseTimecardCsv, formatDisplayDate, getDayOfWeek } from '../lib/parser';

interface SetupPageProps {
  settings: TipPoolSettings;
  onUpdateSettings: (newSettings: TipPoolSettings) => void;
  shifts: ProcessedShift[];
  onShiftsLoaded: (shifts: ProcessedShift[], filename: string, extractedTips?: Record<string, number>, startDate?: string, endDate?: string) => void;
  dailyTipInputs: Record<string, DailyTipInput>;
  onDailyInputChange: (date: string, field: keyof DailyTipInput, value: number) => void;
  onHardRefresh: () => void;
  onRunCalculation: () => void;
  timeCardFileName: string | null;
}

export function SetupPage({
  settings,
  onUpdateSettings,
  shifts,
  onShiftsLoaded,
  dailyTipInputs,
  onDailyInputChange,
  onHardRefresh,
  onRunCalculation,
  timeCardFileName,
}: SetupPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isManualLocked, setIsManualLocked] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Available roles detected from shifts or defaults
  const detectedRoles = Array.from(new Set(shifts.map((s) => s.role))).filter(Boolean);
  const defaultRolesList = ['Server', 'Bartender', 'Barista', 'Cashier', 'Host', 'Busser', 'Cook', 'Dishwasher', 'Owner'];
  const allAvailableRoles = Array.from(new Set([...detectedRoles, ...defaultRolesList]));

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const fname = file.name;
    const reader = new FileReader();

    if (fname.endsWith('.csv')) {
      reader.onload = (evt) => {
        try {
          const text = evt.target?.result as string;
          const parsed = parseTimecardCsv(text, settings);
          if (parsed.errors.length > 0 && parsed.shifts.length === 0) {
            setUploadError(parsed.errors.join(', '));
            return;
          }
          onShiftsLoaded(
            parsed.shifts,
            fname,
            parsed.extractedDailyTips,
            parsed.detectedStartDate,
            parsed.detectedEndDate
          );
        } catch (err: any) {
          setUploadError(`Failed to parse CSV: ${err.message}`);
        }
      };
      reader.readAsText(file);
    } else {
      reader.onload = (evt) => {
        try {
          const buffer = evt.target?.result as ArrayBuffer;
          const parsed = parseTimecardFile(buffer, settings);
          if (parsed.errors.length > 0 && parsed.shifts.length === 0) {
            setUploadError(parsed.errors.join(', '));
            return;
          }
          onShiftsLoaded(
            parsed.shifts,
            fname,
            parsed.extractedDailyTips,
            parsed.detectedStartDate,
            parsed.detectedEndDate
          );
        } catch (err: any) {
          setUploadError(`Failed to parse Excel file: ${err.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Contributors management (clean slate: user can type or choose any role)
  const addContributor = () => {
    const updated = [
      ...settings.contributors,
      {
        id: `contrib-${Date.now()}`,
        role: '',
        contributionPercent: 100,
        source: 'All',
      },
    ];
    onUpdateSettings({ ...settings, contributors: updated });
  };

  const removeContributor = (index: number) => {
    const updated = settings.contributors.filter((_, i) => i !== index);
    onUpdateSettings({ ...settings, contributors: updated });
  };

  const updateContributor = (index: number, field: string, value: any) => {
    const updated = [...settings.contributors];
    updated[index] = { ...updated[index], [field]: value };
    onUpdateSettings({ ...settings, contributors: updated });
  };

  // Custom contribution sources management
  const addCustomSource = () => {
    const custom = settings.customSources || [];
    const updated = [
      ...custom,
      {
        id: `csrc-${Date.now()}`,
        name: 'Custom Channel',
        enabled: true,
        percent: 100,
      },
    ];
    onUpdateSettings({ ...settings, customSources: updated });
  };

  const removeCustomSource = (index: number) => {
    const custom = (settings.customSources || []).filter((_, i) => i !== index);
    onUpdateSettings({ ...settings, customSources: custom });
  };

  const updateCustomSource = (index: number, field: string, value: any) => {
    const custom = [...(settings.customSources || [])];
    custom[index] = { ...custom[index], [field]: value };
    onUpdateSettings({ ...settings, customSources: custom });
  };

  // Recipients management (clean slate: user can type or choose any role)
  const addRecipient = () => {
    const updated = [
      ...settings.recipients,
      {
        id: `recip-${Date.now()}`,
        role: '',
        distributionPercent: 0,
        pointsPerHour: 1,
      },
    ];
    onUpdateSettings({ ...settings, recipients: updated });
  };

  const removeRecipient = (index: number) => {
    const updated = settings.recipients.filter((_, i) => i !== index);
    onUpdateSettings({ ...settings, recipients: updated });
  };

  const updateRecipient = (index: number, field: string, value: any) => {
    const updated = [...settings.recipients];
    updated[index] = { ...updated[index], [field]: value };
    onUpdateSettings({ ...settings, recipients: updated });
  };

  const addRoleAsContributor = (role: string) => {
    if (settings.contributors.some((c) => c.role.toLowerCase() === role.toLowerCase())) return;
    const updated = [
      ...settings.contributors,
      {
        id: `contrib-${Date.now()}-${Math.random()}`,
        role,
        contributionPercent: 0,
        source: 'All',
      },
    ];
    onUpdateSettings({ ...settings, contributors: updated });
  };

  const addRoleAsRecipient = (role: string) => {
    if (settings.recipients.some((r) => r.role.toLowerCase() === role.toLowerCase())) return;
    const updated = [
      ...settings.recipients,
      {
        id: `recip-${Date.now()}-${Math.random()}`,
        role,
        distributionPercent: 0,
        pointsPerHour: 1,
      },
    ];
    onUpdateSettings({ ...settings, recipients: updated });
  };

  // Calculate total percentage for recipients if method is Percentage
  const totalRecipientPercentage = settings.recipients.reduce(
    (sum, r) => sum + (r.distributionPercent || 0),
    0
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1
              style={{
                fontSize: '1.9rem',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.02em',
              }}
            >
              Create Tip Pool
            </h1>
            <span className="badge badge-indigo">Aio Config Engine</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '4px' }}>
            Configure contributions, distribution models, and recipient rules.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Hard Refresh Button */}
          <button
            onClick={onHardRefresh}
            type="button"
            className="btn-secondary"
            style={{ color: '#ff5f6d', borderColor: 'rgba(255, 95, 109, 0.3)' }}
          >
            <RotateCcw size={16} />
            <span>Hard Refresh</span>
          </button>

          {/* Run Calculation CTA */}
          <button
            onClick={onRunCalculation}
            type="button"
            className="btn-primary"
            style={{ padding: '10px 24px' }}
          >
            <span>Run Dashboard</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* SECTION 1: General Info */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff', marginBottom: '16px' }}>
            General Info
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Pool Name
              </label>
              <input
                type="text"
                className="input-clean"
                value={settings.poolName}
                placeholder="e.g. Mission Hill Tip Pool"
                onChange={(e) => onUpdateSettings({ ...settings, poolName: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Restaurant Name
              </label>
              <input
                type="text"
                className="input-clean"
                value={settings.restaurantName}
                placeholder="e.g. Mission Hill"
                onChange={(e) => onUpdateSettings({ ...settings, restaurantName: e.target.value })}
              />
            </div>
          </div>

          {/* Dates Selection */}
          <div style={{ marginTop: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Dates
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {/* Single Effective Date */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-sm)',
                  border: settings.dateMode === 'single' ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  background: settings.dateMode === 'single' ? 'rgba(93, 84, 230, 0.08)' : 'var(--bg-input)',
                  cursor: 'pointer',
                }}
                onClick={() => onUpdateSettings({ ...settings, dateMode: 'single' })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <input
                    type="radio"
                    checked={settings.dateMode === 'single'}
                    onChange={() => onUpdateSettings({ ...settings, dateMode: 'single' })}
                  />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#ffffff' }}>Single Effective Date</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  Starts on chosen date and runs until changed.
                </p>
                <input
                  type="date"
                  className="input-clean"
                  value={settings.startDate}
                  onChange={(e) => onUpdateSettings({ ...settings, startDate: e.target.value, endDate: e.target.value })}
                  disabled={settings.dateMode !== 'single'}
                />
              </div>

              {/* Date Range */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-sm)',
                  border: settings.dateMode === 'range' ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  background: settings.dateMode === 'range' ? 'rgba(93, 84, 230, 0.08)' : 'var(--bg-input)',
                  cursor: 'pointer',
                }}
                onClick={() => onUpdateSettings({ ...settings, dateMode: 'range' })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <input
                    type="radio"
                    checked={settings.dateMode === 'range'}
                    onChange={() => onUpdateSettings({ ...settings, dateMode: 'range' })}
                  />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#ffffff' }}>Date Range</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  Active between start and end date.
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="date"
                    className="input-clean"
                    value={settings.startDate}
                    onChange={(e) => onUpdateSettings({ ...settings, startDate: e.target.value })}
                    disabled={settings.dateMode !== 'range'}
                  />
                  <input
                    type="date"
                    className="input-clean"
                    value={settings.endDate}
                    onChange={(e) => onUpdateSettings({ ...settings, endDate: e.target.value })}
                    disabled={settings.dateMode !== 'range'}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Time period */}
          <div style={{ marginTop: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Time period
            </label>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="radio"
                  name="timePeriod"
                  checked={settings.timePeriod === 'all_day'}
                  onChange={() => onUpdateSettings({ ...settings, timePeriod: 'all_day' })}
                />
                <span>All day</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="radio"
                  name="timePeriod"
                  checked={settings.timePeriod === 'specific'}
                  onChange={() => onUpdateSettings({ ...settings, timePeriod: 'specific' })}
                />
                <span>Specific Day & Time</span>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 2: Contributor info */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
            Contributor info
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Choose contribution method and specify which roles and channels feed the daily pool.
          </p>

          {/* Split setup */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Split setup
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <div
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  border: settings.splitSetup === 'percentage_of_sales' ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  background: settings.splitSetup === 'percentage_of_sales' ? 'rgba(93, 84, 230, 0.1)' : 'var(--bg-input)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
                onClick={() => onUpdateSettings({ ...settings, splitSetup: 'percentage_of_sales' })}
              >
                <input
                  type="radio"
                  checked={settings.splitSetup === 'percentage_of_sales'}
                  onChange={() => onUpdateSettings({ ...settings, splitSetup: 'percentage_of_sales' })}
                />
                <span style={{ fontSize: '0.92rem', color: '#ffffff', fontWeight: 500 }}>Percentage of Sales</span>
              </div>

              <div
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  border: settings.splitSetup === 'percentage_of_tips' ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  background: settings.splitSetup === 'percentage_of_tips' ? 'rgba(93, 84, 230, 0.1)' : 'var(--bg-input)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
                onClick={() => onUpdateSettings({ ...settings, splitSetup: 'percentage_of_tips' })}
              >
                <input
                  type="radio"
                  checked={settings.splitSetup === 'percentage_of_tips'}
                  onChange={() => onUpdateSettings({ ...settings, splitSetup: 'percentage_of_tips' })}
                />
                <span style={{ fontSize: '0.92rem', color: '#ffffff', fontWeight: 500 }}>Percentage of Tips</span>
              </div>
            </div>
          </div>

          {/* Contributor details */}
          <div>
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff' }}>Contributor details</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Set percentages for each role based on the selected method.
              </p>
            </div>

            {/* Detected roles helper banner */}
            {detectedRoles.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', padding: '10px 14px', borderRadius: '8px', background: 'rgba(93, 84, 230, 0.1)', border: '1px solid rgba(108, 99, 255, 0.25)', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.8rem', color: '#9ca3ff', fontWeight: 600 }}>Detected Roles in Shift Data:</span>
                {detectedRoles.map((role) => (
                  <div key={role} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--bg-input)', padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
                    <span style={{ color: '#ffffff', fontWeight: 500 }}>{role}</span>
                    <button
                      type="button"
                      onClick={() => addRoleAsContributor(role)}
                      style={{ background: 'transparent', border: 'none', color: '#ff5f6d', cursor: 'pointer', padding: '0 2px', fontWeight: 700 }}
                    >
                      + Contrib
                    </button>
                    <button
                      type="button"
                      onClick={() => addRoleAsRecipient(role)}
                      style={{ background: 'transparent', border: 'none', color: '#00e5a3', cursor: 'pointer', padding: '0 2px', fontWeight: 700 }}
                    >
                      + Recipient
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Table of Role Contributors */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {settings.contributors.length === 0 && (
                <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(139, 142, 222, 0.06)', border: '1px dashed var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No role contributors added yet. Click &quot;+ Add contributor&quot; below to configure role splits, or use the automated channel toggles (KIOSK, Online, QR, 3PO).
                </div>
              )}
              {settings.contributors.map((contrib, idx) => (
                <div
                  key={contrib.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(160px, 1.5fr) minmax(120px, 1fr) minmax(140px, 1.2fr) 40px',
                    gap: '12px',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      list="all-available-roles"
                      className="input-clean"
                      value={contrib.role}
                      placeholder="Role (e.g. Server, Cashier)..."
                      onChange={(e) => updateContributor(idx, 'role', e.target.value)}
                    />
                  </div>

                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      className="input-clean"
                      value={contrib.contributionPercent}
                      placeholder="0"
                      onChange={(e) => updateContributor(idx, 'contributionPercent', parseFloat(e.target.value) || 0)}
                      style={{ paddingRight: '28px' }}
                    />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      %
                    </span>
                  </div>

                  <select
                    className="input-clean"
                    value={contrib.source}
                    onChange={(e) => updateContributor(idx, 'source', e.target.value)}
                  >
                    <option value="All" style={{ background: '#151336' }}>All Sales / Tips</option>
                    <option value="Food" style={{ background: '#151336' }}>Food Only</option>
                    <option value="Beverage" style={{ background: '#151336' }}>Beverage Only</option>
                  </select>

                  <button
                    onClick={() => removeContributor(idx)}
                    type="button"
                    title="Remove contributor"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ff5f6d')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Built-in Sources: KIOSK, Online, QR, 3PO */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginBottom: '16px' }}>
              {/* KIOSK */}
              <div style={{ display: 'grid', gridTemplateColumns: '160px minmax(120px, 1fr) minmax(140px, 1.2fr) 40px', gap: '12px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', color: '#ffffff' }}>
                  <input
                    type="checkbox"
                    checked={settings.sources.kiosk.enabled}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        sources: {
                          ...settings.sources,
                          kiosk: { ...settings.sources.kiosk, enabled: e.target.checked },
                        },
                      })
                    }
                  />
                  <span>KIOSK</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    className="input-clean"
                    value={settings.sources.kiosk.percent}
                    disabled={!settings.sources.kiosk.enabled}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        sources: {
                          ...settings.sources,
                          kiosk: { ...settings.sources.kiosk, percent: parseFloat(e.target.value) || 0 },
                        },
                      })
                    }
                    style={{ paddingRight: '28px', opacity: settings.sources.kiosk.enabled ? 1 : 0.5 }}
                  />
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    %
                  </span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Automated Kiosk Pool</span>
              </div>

              {/* Online */}
              <div style={{ display: 'grid', gridTemplateColumns: '160px minmax(120px, 1fr) minmax(140px, 1.2fr) 40px', gap: '12px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', color: '#ffffff' }}>
                  <input
                    type="checkbox"
                    checked={settings.sources.online.enabled}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        sources: {
                          ...settings.sources,
                          online: { ...settings.sources.online, enabled: e.target.checked },
                        },
                      })
                    }
                  />
                  <span>Online</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    className="input-clean"
                    value={settings.sources.online.percent}
                    disabled={!settings.sources.online.enabled}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        sources: {
                          ...settings.sources,
                          online: { ...settings.sources.online, percent: parseFloat(e.target.value) || 0 },
                        },
                      })
                    }
                    style={{ paddingRight: '28px', opacity: settings.sources.online.enabled ? 1 : 0.5 }}
                  />
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    %
                  </span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Online / Web Orders</span>
              </div>

              {/* QR */}
              <div style={{ display: 'grid', gridTemplateColumns: '160px minmax(120px, 1fr) minmax(140px, 1.2fr) 40px', gap: '12px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', color: '#ffffff' }}>
                  <input
                    type="checkbox"
                    checked={settings.sources.qr.enabled}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        sources: {
                          ...settings.sources,
                          qr: { ...settings.sources.qr, enabled: e.target.checked },
                        },
                      })
                    }
                  />
                  <span>QR</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    className="input-clean"
                    value={settings.sources.qr.percent}
                    disabled={!settings.sources.qr.enabled}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        sources: {
                          ...settings.sources,
                          qr: { ...settings.sources.qr, percent: parseFloat(e.target.value) || 0 },
                        },
                      })
                    }
                    style={{ paddingRight: '28px', opacity: settings.sources.qr.enabled ? 1 : 0.5 }}
                  />
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    %
                  </span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Table QR Code Orders</span>
              </div>

              {/* 3PO */}
              <div style={{ display: 'grid', gridTemplateColumns: '160px minmax(120px, 1fr) minmax(140px, 1.2fr) 40px', gap: '12px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', color: '#ffffff' }}>
                  <input
                    type="checkbox"
                    checked={settings.sources.thirdParty.enabled}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        sources: {
                          ...settings.sources,
                          thirdParty: { ...settings.sources.thirdParty, enabled: e.target.checked },
                        },
                      })
                    }
                  />
                  <span>3PO</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    className="input-clean"
                    value={settings.sources.thirdParty.percent}
                    disabled={!settings.sources.thirdParty.enabled}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        sources: {
                          ...settings.sources,
                          thirdParty: { ...settings.sources.thirdParty, percent: parseFloat(e.target.value) || 0 },
                        },
                      })
                    }
                    style={{ paddingRight: '28px', opacity: settings.sources.thirdParty.enabled ? 1 : 0.5 }}
                  />
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    %
                  </span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Third-Party (DoorDash / UberEats)</span>
              </div>

              {/* Custom Sources */}
              {settings.customSources && settings.customSources.map((cSrc, cIdx) => (
                <div key={cSrc.id} style={{ display: 'grid', gridTemplateColumns: '160px minmax(120px, 1fr) minmax(140px, 1.2fr) 40px', gap: '12px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', color: '#ffffff' }}>
                    <input
                      type="checkbox"
                      checked={cSrc.enabled}
                      onChange={(e) => updateCustomSource(cIdx, 'enabled', e.target.checked)}
                    />
                    <input
                      type="text"
                      className="input-clean"
                      value={cSrc.name}
                      placeholder="Source name..."
                      onChange={(e) => updateCustomSource(cIdx, 'name', e.target.value)}
                      style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                    />
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      className="input-clean"
                      value={cSrc.percent}
                      disabled={!cSrc.enabled}
                      onChange={(e) => updateCustomSource(cIdx, 'percent', parseFloat(e.target.value) || 0)}
                      style={{ paddingRight: '28px', opacity: cSrc.enabled ? 1 : 0.5 }}
                    />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      %
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Custom Source Contribution</span>
                  <button
                    onClick={() => removeCustomSource(cIdx)}
                    type="button"
                    title="Remove custom source"
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ff5f6d')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={addContributor}
                type="button"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: '#ff5f6d',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 0',
                }}
              >
                <Plus size={16} />
                <span>Add role contributor</span>
              </button>

              <button
                onClick={addCustomSource}
                type="button"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: '#9ca3ff',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 0',
                }}
              >
                <Plus size={16} />
                <span>Add custom contribution source</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 3: Tips distribution */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
            Tips distribution
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Set how tips will be distributed.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {(['Percentage', 'Points', 'Equally'] as PoolDistributionMethod[]).map((method) => {
              const isSelected = settings.distributionMethod === method;
              return (
                <div
                  key={method}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-sm)',
                    border: isSelected ? '1.5px solid #ff5f6d' : '1px solid var(--border-subtle)',
                    background: isSelected ? 'rgba(255, 95, 109, 0.08)' : 'var(--bg-input)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    justifyContent: 'center',
                  }}
                  onClick={() => onUpdateSettings({ ...settings, distributionMethod: method })}
                >
                  <input
                    type="radio"
                    checked={isSelected}
                    onChange={() => onUpdateSettings({ ...settings, distributionMethod: method })}
                  />
                  <span style={{ fontSize: '0.92rem', color: '#ffffff', fontWeight: 600 }}>{method}</span>
                </div>
              );
            })}
          </div>

          {/* Dynamic Information Box (Faithful to Aio screenshots) */}
          <div
            style={{
              padding: '18px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(21, 19, 54, 0.7)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.85rem',
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
              <Info size={16} color="#9ca3ff" />
              <span>Information</span>
            </div>

            {settings.distributionMethod === 'Equally' && (
              <div>
                <p style={{ marginBottom: '6px' }}>
                  In this scenario, each person receives an equal portion of the tips based on the hours they worked.
                </p>
                <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Tip Pool: $500</li>
                  <li>Total Hours Worked: 25</li>
                  <li>Calculation of Tip per Hour: $500 / 25 hours = $20 in tips per hour worked</li>
                  <li>Server A worked 10 hours and receives $200 (10 hours * $20/hour)</li>
                  <li>Server B worked 7 hours and receives $140 (7 hours * $20/hour)</li>
                  <li>Food Runner worked 8 hours and receives $160 (8 hours * $20/hour)</li>
                </ul>
              </div>
            )}

            {settings.distributionMethod === 'Percentage' && (
              <div>
                <p style={{ marginBottom: '6px' }}>
                  The tip pool is $1000, with a distribution of 60% allocated to Servers ($600) and 40% allocated to Bartenders ($400).
                </p>
                <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Server A worked 8 hours and receives $240</li>
                  <li>Server B worked 12 hours and receives $360</li>
                  <li>The Bartender worked 5 hours and receives the full $400 allocated to Bartenders</li>
                  <li style={{ fontStyle: 'italic', marginTop: '4px' }}>
                    Note: Bartenders receive their designated share regardless of the number of hours worked due to only one bartender being on duty.
                  </li>
                </ul>
              </div>
            )}

            {settings.distributionMethod === 'Points' && (
              <div>
                <p style={{ marginBottom: '6px' }}>
                  In this scenario, each person receives a portion of the tips based on the hours they worked, weighted by a point multiplier.
                </p>
                <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Tip Pool: $1200 | Total Hours Worked: 50</li>
                  <li>Point Multipliers: Servers: 2 points per hour | Bartenders: 1 point per hour</li>
                  <li>All Servers worked 30 hours, resulting in 60 point-hours (30 hours * 2 points)</li>
                  <li>All Bartenders worked 20 hours, resulting in 20 point-hours (20 hours * 1 point)</li>
                  <li>Total point-weighted hours: 80 | Each point-hour is worth $15 in tips ($1200 / 80)</li>
                  <li>Server A worked 10 hours for 20 point-hours and receives $300</li>
                  <li>Server B worked 20 hours for 40 point-hours and receives $600</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 4: Recipients info */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff' }}>Recipients info</h2>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                Set how much of the pool each role receives.
              </p>
            </div>

            {settings.distributionMethod === 'Percentage' && (
              <div
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: totalRecipientPercentage === 100 ? '#00e5a3' : '#ff5f6d',
                }}
              >
                Total Percentage: {totalRecipientPercentage.toFixed(1)} / 100%
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px', marginBottom: '16px' }}>
            {settings.recipients.length === 0 && (
              <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(139, 142, 222, 0.06)', border: '1px dashed var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No recipient roles configured yet. Click &quot;+ Add recipient&quot; below or click a detected role above to receive tip pool allocations.
              </div>
            )}
            {settings.recipients.map((recip, idx) => (
              <div
                key={recip.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(180px, 1.5fr) minmax(140px, 1.5fr) 40px',
                  gap: '12px',
                  alignItems: 'center',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    list="all-available-roles"
                    className="input-clean"
                    value={recip.role}
                    placeholder="Role (e.g. Server, Cashier)..."
                    onChange={(e) => updateRecipient(idx, 'role', e.target.value)}
                  />
                </div>

                {settings.distributionMethod === 'Equally' && (
                  <div
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.9rem',
                    }}
                  >
                    Equal Share
                  </div>
                )}

                {settings.distributionMethod === 'Percentage' && (
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      className="input-clean"
                      value={recip.distributionPercent || 0}
                      onChange={(e) => updateRecipient(idx, 'distributionPercent', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      style={{ paddingRight: '28px' }}
                    />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      %
                    </span>
                  </div>
                )}

                {settings.distributionMethod === 'Points' && (
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      step="0.5"
                      min="0.1"
                      className="input-clean"
                      value={recip.pointsPerHour || 1}
                      onChange={(e) => updateRecipient(idx, 'pointsPerHour', parseFloat(e.target.value) || 1)}
                      placeholder="1"
                    />
                  </div>
                )}

                <button
                  onClick={() => removeRecipient(idx)}
                  type="button"
                  title="Remove recipient"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ff5f6d')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addRecipient}
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: 'none',
              color: '#ff5f6d',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '4px 0',
            }}
          >
            <Plus size={16} />
            <span>Add recipient</span>
          </button>
        </div>

        {/* SECTION 5: Data Sources & Time Card Ingestion */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff' }}>
                Time Card & Secondary Tip Sources
              </h2>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                Import primary shifts (.xlsx or .csv) and customize external channel tip amounts.
              </p>
            </div>

            {/* Manual Override Lock/Unlock Switch */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                background: isManualLocked ? 'rgba(139, 142, 222, 0.1)' : 'rgba(0, 229, 163, 0.14)',
                border: isManualLocked ? '1px solid var(--border-subtle)' : '1px solid rgba(0, 229, 163, 0.4)',
                cursor: 'pointer',
                userSelect: 'none',
              }}
              onClick={() => setIsManualLocked(!isManualLocked)}
            >
              {isManualLocked ? <Lock size={15} color="#8e91be" /> : <Unlock size={15} color="#00e5a3" />}
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: isManualLocked ? '#c5c7e8' : '#00e5a3' }}>
                {isManualLocked ? 'Inputs Locked' : 'Manual Override Active'}
              </span>
            </div>
          </div>

          {/* Primary Time Card Uploader */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '28px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'rgba(21, 19, 54, 0.5)',
              transition: 'all 0.2s ease',
              marginBottom: '20px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
              e.currentTarget.style.background = 'rgba(93, 84, 230, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-medium)';
              e.currentTarget.style.background = 'rgba(21, 19, 54, 0.5)';
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(93, 84, 230, 0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9ca3ff',
                marginBottom: '10px',
              }}
            >
              <Upload size={22} />
            </div>
            <p style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.98rem' }}>
              {timeCardFileName ? `Loaded: ${timeCardFileName}` : 'Click to Upload Time Card (.xlsx, .csv)'}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
              {shifts.length > 0 ? `${shifts.length} shifts active across date range` : 'Compatible with standard restaurant shift exports'}
            </p>
          </div>

          {uploadError && (
            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 95, 109, 0.15)', color: '#ff5f6d', fontSize: '0.85rem', marginBottom: '16px' }}>
              {uploadError}
            </div>
          )}

          {/* Daily Tip Source Table (Interactive when unlocked) */}
          <div style={{ marginTop: '16px' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
              External Daily Tip Pool Entries
            </h3>
            <div className="data-table-container" style={{ maxHeight: '300px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Day</th>
                    <th>Online ($)</th>
                    <th>3PO ($)</th>
                    <th>Kiosk ($)</th>
                    <th>Other ($)</th>
                    <th style={{ textAlign: 'right' }}>Total Input Tips</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(dailyTipInputs).map((d) => (
                    <tr key={d.date}>
                      <td style={{ fontWeight: 600 }}>{formatDisplayDate(d.date)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{d.dayOfWeek}</td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          disabled={isManualLocked}
                          className="input-clean"
                          style={{ padding: '4px 8px', width: '100px', fontSize: '0.85rem' }}
                          value={d.webDashTips || 0}
                          onChange={(e) => onDailyInputChange(d.date, 'webDashTips', parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          disabled={isManualLocked}
                          className="input-clean"
                          style={{ padding: '4px 8px', width: '100px', fontSize: '0.85rem' }}
                          value={d.doorDashTips || 0}
                          onChange={(e) => onDailyInputChange(d.date, 'doorDashTips', parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          disabled={isManualLocked}
                          className="input-clean"
                          style={{ padding: '4px 8px', width: '100px', fontSize: '0.85rem' }}
                          value={d.kioskTips || 0}
                          onChange={(e) => onDailyInputChange(d.date, 'kioskTips', parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          disabled={isManualLocked}
                          className="input-clean"
                          style={{ padding: '4px 8px', width: '100px', fontSize: '0.85rem' }}
                          value={d.otherTips || 0}
                          onChange={(e) => onDailyInputChange(d.date, 'otherTips', parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#00e5a3' }}>
                        ${((d.webDashTips || 0) + (d.doorDashTips || 0) + (d.kioskTips || 0) + (d.otherTips || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      {/* Datalist for fast role auto-complete while preserving free text typing */}
      <datalist id="all-available-roles">
        {allAvailableRoles.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>
    </div>
  </div>
  );
}
