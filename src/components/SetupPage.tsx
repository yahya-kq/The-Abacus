'use client';

import React, { useState, useRef, useMemo } from 'react';
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
  X,
  AlertCircle,
} from 'lucide-react';
import {
  TipPoolSettings,
  ProcessedShift,
  DailyTipInput,
  PoolDistributionMethod,
  PoolContributionMethod,
} from '../types/tips';
import {
  parseTimecardFile,
  parseTimecardCsv,
  parseOtherTipSourceFile,
  parseOtherTipSourceCsv,
  parseOtherTipSourceText,
  parseOtherTipSourceImage,
  formatDisplayDate,
  getDayOfWeek,
  parseFileNameMetadata,
} from '../lib/parser';
import { generateDateRange } from '../lib/calculator';

interface SetupPageProps {
  settings: TipPoolSettings;
  onUpdateSettings: (newSettings: TipPoolSettings) => void;
  shifts: ProcessedShift[];
  onShiftsLoaded: (shifts: ProcessedShift[], filename: string, extractedTips?: Record<string, number>, startDate?: string, endDate?: string, restaurantName?: string) => void;
  dailyTipInputs: Record<string, DailyTipInput>;
  onDailyInputChange: (date: string, field: keyof DailyTipInput, value: number) => void;
  onHardRefresh: () => void;
  onRunCalculation: () => void;
  timeCardFileName: string | null;
  otherTipFileName?: string | null;
  onOtherTipsLoaded?: (dailyTips: Record<string, DailyTipInput>, filename: string, startDate?: string, endDate?: string, restaurantName?: string) => void;
  onRemoveTimeCards?: () => void;
  onRemoveOtherTips?: () => void;
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
  otherTipFileName,
  onOtherTipsLoaded,
  onRemoveTimeCards,
  onRemoveOtherTips,
}: SetupPageProps) {
  const timeCardInputRef = useRef<HTMLInputElement>(null);
  const otherTipInputRef = useRef<HTMLInputElement>(null);
  const [isManualLocked, setIsManualLocked] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Available roles detected dynamically ONLY from uploaded time cards
  const detectedRoles = useMemo(() => {
    return Array.from(new Set(shifts.map((s) => s.role))).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [shifts]);

  const [isOcrLoading, setIsOcrLoading] = useState(false);

  // Sorted daily entries in strict chronological order (e.g. Sep 07, Sep 08, Sep 09...)
  const sortedDailyEntries = useMemo(() => {
    const dateSet = new Set<string>();
    if (settings.startDate && settings.endDate) {
      const range = generateDateRange(settings.startDate, settings.endDate);
      range.forEach((d) => dateSet.add(d));
    }
    Object.keys(dailyTipInputs).forEach((d) => dateSet.add(d));
    shifts.forEach((s) => {
      if (s.businessDate) dateSet.add(s.businessDate);
    });

    const sortedList = Array.from(dateSet).sort((a, b) => a.localeCompare(b));
    return sortedList.map((dt) => {
      const existing = dailyTipInputs[dt];
      if (existing) return existing;
      return {
        date: dt,
        displayDate: formatDisplayDate(dt),
        dayOfWeek: getDayOfWeek(dt),
        webDashTips: 0,
        onlineTips: 0,
        doorDashTips: 0,
        kioskTips: 0,
        otherTips: 0,
        totalTips: 0,
      };
    });
  }, [settings.startDate, settings.endDate, dailyTipInputs, shifts]);

  // Aggregate totals for the external tip pool table columns and grand total
  const dailyTipTotals = useMemo(() => {
    let webDash = 0;
    let online = 0;
    let doorDash = 0;
    let kiosk = 0;
    let other = 0;
    let grandTotal = 0;

    for (const d of sortedDailyEntries) {
      webDash += d.webDashTips || 0;
      online += d.onlineTips || 0;
      doorDash += d.doorDashTips || 0;
      kiosk += d.kioskTips || 0;
      other += d.otherTips || 0;
      grandTotal += (d.webDashTips || 0) + (d.onlineTips || 0) + (d.doorDashTips || 0) + (d.kioskTips || 0) + (d.otherTips || 0);
    }

    return {
      webDash: Math.round(webDash * 100) / 100,
      online: Math.round(online * 100) / 100,
      doorDash: Math.round(doorDash * 100) / 100,
      kiosk: Math.round(kiosk * 100) / 100,
      other: Math.round(other * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
    };
  }, [sortedDailyEntries]);

  // Strict Validation: Cannot run tip distribution until contributor, recipient, and distribution rules are configured
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (shifts.length === 0) {
      errors.push('Upload time cards above to import shift records and employee roles.');
    }
    if (settings.contributors.length === 0) {
      errors.push('Contributor information is required. Add at least one contributor role.');
    }
    if (settings.recipients.length === 0) {
      errors.push('Recipient information is required. Add at least one recipient role.');
    }
    if (!settings.distributionMethod) {
      errors.push('Tip distribution method is required. Select Equally, Percentage, or Points.');
    }
    if (settings.distributionMethod === 'Percentage' && settings.recipients.length > 0) {
      const sumPct = settings.recipients.reduce((acc, r) => acc + (r.distributionPercent || 0), 0);
      if (Math.abs(sumPct - 100) > 0.1) {
        errors.push(`Recipient percentages must equal 100% (currently ${sumPct.toFixed(1)}%).`);
      }
    }
    return errors;
  }, [shifts.length, settings.contributors, settings.recipients, settings.distributionMethod]);

  const [showValidationModal, setShowValidationModal] = useState(false);

  const handleRunTipDistribution = () => {
    if (validationErrors.length > 0) {
      setShowValidationModal(true);
      return;
    }
    onRunCalculation();
  };

  // Handle other tip source file upload (Excel, CSV, Text, or Screenshot Images)
  const handleOtherTipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const fname = file.name;
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp|tiff?)$/i.test(fname);
    const isText = fname.endsWith('.txt') || fname.endsWith('.tsv');

    // Handle Image / Screenshot OCR upload
    if (isImage) {
      setIsOcrLoading(true);
      parseOtherTipSourceImage(file)
        .then((parsed) => {
          if (parsed.errors.length > 0 && Object.keys(parsed.dailyTips).length === 0) {
            setUploadError(parsed.errors.join(', '));
            return;
          }
          const fileMeta = parseFileNameMetadata(fname);
          if (onOtherTipsLoaded) {
            onOtherTipsLoaded(
              parsed.dailyTips,
              fname,
              fileMeta.startDate || parsed.detectedStartDate,
              fileMeta.endDate || parsed.detectedEndDate,
              fileMeta.restaurantName
            );
          }
        })
        .catch((err: any) => {
          setUploadError(`Failed to process screenshot with OCR: ${err.message}`);
        })
        .finally(() => {
          setIsOcrLoading(false);
        });
      return;
    }

    const reader = new FileReader();

    if (isText) {
      reader.onload = (evt) => {
        try {
          const text = evt.target?.result as string;
          const parsed = parseOtherTipSourceText(text);
          if (parsed.errors.length > 0 && Object.keys(parsed.dailyTips).length === 0) {
            setUploadError(parsed.errors.join(', '));
            return;
          }
          const fileMeta = parseFileNameMetadata(fname);
          if (onOtherTipsLoaded) {
            onOtherTipsLoaded(
              parsed.dailyTips,
              fname,
              fileMeta.startDate || parsed.detectedStartDate,
              fileMeta.endDate || parsed.detectedEndDate,
              fileMeta.restaurantName
            );
          }
        } catch (err: any) {
          setUploadError(`Failed to parse text file: ${err.message}`);
        }
      };
      reader.readAsText(file);
      return;
    }

    if (fname.endsWith('.csv')) {
      reader.onload = (evt) => {
        try {
          const text = evt.target?.result as string;
          const parsed = parseOtherTipSourceCsv(text);
          if (parsed.errors.length > 0 && Object.keys(parsed.dailyTips).length === 0) {
            setUploadError(parsed.errors.join(', '));
            return;
          }
          const fileMeta = parseFileNameMetadata(fname);
          if (onOtherTipsLoaded) {
            onOtherTipsLoaded(
              parsed.dailyTips,
              fname,
              fileMeta.startDate || parsed.detectedStartDate,
              fileMeta.endDate || parsed.detectedEndDate,
              fileMeta.restaurantName
            );
          }
        } catch (err: any) {
          setUploadError(`Failed to parse CSV: ${err.message}`);
        }
      };
      reader.readAsText(file);
    } else {
      reader.onload = (evt) => {
        try {
          const buffer = evt.target?.result as ArrayBuffer;
          const parsed = parseOtherTipSourceFile(buffer);
          if (parsed.errors.length > 0 && Object.keys(parsed.dailyTips).length === 0) {
            setUploadError(parsed.errors.join(', '));
            return;
          }
          const fileMeta = parseFileNameMetadata(fname);
          if (onOtherTipsLoaded) {
            onOtherTipsLoaded(
              parsed.dailyTips,
              fname,
              fileMeta.startDate || parsed.detectedStartDate,
              fileMeta.endDate || parsed.detectedEndDate,
              fileMeta.restaurantName
            );
          }
        } catch (err: any) {
          setUploadError(`Failed to parse Excel file: ${err.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const fname = file.name;
    const fileMeta = parseFileNameMetadata(fname);
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
          const detectedStart = fileMeta.startDate || parsed.detectedStartDate;
          const detectedEnd = fileMeta.endDate || parsed.detectedEndDate;
          const detectedRestaurant = fileMeta.restaurantName;

          onShiftsLoaded(
            parsed.shifts,
            fname,
            parsed.extractedDailyTips,
            detectedStart,
            detectedEnd,
            detectedRestaurant
          );

          const updatedSettings = { ...settings };
          let changed = false;

          if (detectedRestaurant) {
            updatedSettings.restaurantName = detectedRestaurant;
            if (!updatedSettings.poolName) updatedSettings.poolName = `${detectedRestaurant} Tip Pool`;
            changed = true;
          }
          if (detectedStart) {
            updatedSettings.startDate = detectedStart;
            changed = true;
          }
          if (detectedEnd) {
            updatedSettings.endDate = detectedEnd;
            changed = true;
          }

          if (changed) {
            onUpdateSettings(updatedSettings);
          }
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
          const detectedStart = fileMeta.startDate || parsed.detectedStartDate;
          const detectedEnd = fileMeta.endDate || parsed.detectedEndDate;
          const detectedRestaurant = fileMeta.restaurantName;

          onShiftsLoaded(
            parsed.shifts,
            fname,
            parsed.extractedDailyTips,
            detectedStart,
            detectedEnd,
            detectedRestaurant
          );

          const updatedSettings = { ...settings };
          let changed = false;

          if (detectedRestaurant) {
            updatedSettings.restaurantName = detectedRestaurant;
            if (!updatedSettings.poolName) updatedSettings.poolName = `${detectedRestaurant} Tip Pool`;
            changed = true;
          }
          if (detectedStart) {
            updatedSettings.startDate = detectedStart;
            changed = true;
          }
          if (detectedEnd) {
            updatedSettings.endDate = detectedEnd;
            changed = true;
          }

          if (changed) {
            onUpdateSettings(updatedSettings);
          }
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

  const handleSelectSplitSetup = (method: 'percentage_of_tips' | 'percentage_of_sales') => {
    onUpdateSettings({ ...settings, splitSetup: method });
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
              Tip Setup
            </h1>
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

          {/* Run Tip Distribution CTA */}
          <button
            onClick={handleRunTipDistribution}
            type="button"
            className="btn-primary"
            style={{
              padding: '10px 24px',
              opacity: validationErrors.length > 0 ? 0.75 : 1,
            }}
            title={validationErrors.length > 0 ? 'Click to view setup requirements before calculation' : 'Run Tip Distribution'}
          >
            <span>Run Tip Distribution</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* SECTION 1: Tip Cycle & Restaurant Info */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff' }}>
              Tip Cycle Setup
            </h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Configure restaurant identity and tip cycle calculation period dates.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '18px',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                }}
              >
                Restaurant Name
              </label>
              <input
                type="text"
                className="input-clean"
                value={settings.restaurantName}
                placeholder="Enter restaurant name..."
                onChange={(e) => onUpdateSettings({ ...settings, restaurantName: e.target.value })}
                style={{ height: '42px' }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                }}
              >
                Start Date
              </label>
              <input
                type="date"
                className="input-clean"
                value={settings.startDate}
                onChange={(e) => onUpdateSettings({ ...settings, startDate: e.target.value })}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker?.();
                  } catch {}
                }}
                style={{ height: '42px', cursor: 'pointer' }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                }}
              >
                End Date
              </label>
              <input
                type="date"
                className="input-clean"
                value={settings.endDate}
                onChange={(e) => onUpdateSettings({ ...settings, endDate: e.target.value })}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker?.();
                  } catch {}
                }}
                style={{ height: '42px', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Data Sources & Time Card Ingestion */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff' }}>
                Time Cards & Other Tip Source
              </h2>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                Import primary shifts and external tip source files (.xlsx, .xls, .csv).
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

          {/* Two Upload Boxes: 1. Time Cards, 2. Other Tip Source */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            {/* Box 1: Upload Time Cards */}
            <div
              onClick={() => timeCardInputRef.current?.click()}
              style={{
                border: timeCardFileName ? '1.5px solid rgba(108, 99, 255, 0.5)' : '2px dashed var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '24px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: timeCardFileName ? 'rgba(93, 84, 230, 0.1)' : 'rgba(21, 19, 54, 0.5)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.background = 'rgba(93, 84, 230, 0.14)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = timeCardFileName ? 'rgba(108, 99, 255, 0.5)' : 'var(--border-medium)';
                e.currentTarget.style.background = timeCardFileName ? 'rgba(93, 84, 230, 0.1)' : 'rgba(21, 19, 54, 0.5)';
              }}
            >
              <input
                ref={timeCardInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'rgba(93, 84, 230, 0.2)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3ff',
                  marginBottom: '10px',
                }}
              >
                <FileSpreadsheet size={22} />
              </div>
              <p style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.98rem' }}>
                Upload Time Cards
              </p>
              {timeCardFileName ? (
                <div style={{ marginTop: '8px' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      maxWidth: '92%',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'rgba(108, 99, 255, 0.25)',
                      color: '#c5c7e8',
                    }}
                  >
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '0.82rem',
                        fontWeight: 500,
                      }}
                    >
                      {timeCardFileName}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (timeCardInputRef.current) timeCardInputRef.current.value = '';
                        onRemoveTimeCards?.();
                      }}
                      title="Remove time cards file"
                      style={{
                        background: 'rgba(255, 95, 109, 0.25)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#ff5f6d',
                        padding: 0,
                        flexShrink: 0,
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 95, 109, 0.45)';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 95, 109, 0.25)';
                        e.currentTarget.style.color = '#ff5f6d';
                      }}
                    >
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  </div>
                  <p style={{ color: '#00e5a3', fontSize: '0.8rem', marginTop: '6px', fontWeight: 500 }}>
                    ✓ {shifts.length} shifts active
                  </p>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '6px' }}>
                  Import shifts, hours, sales, tips & gratuity (.xlsx, .csv)
                </p>
              )}
            </div>

            {/* Box 2: Upload Other Tip Source */}
            <div
              onClick={() => otherTipInputRef.current?.click()}
              style={{
                border: otherTipFileName ? '1.5px solid rgba(0, 229, 163, 0.5)' : '2px dashed var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '24px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: otherTipFileName ? 'rgba(0, 229, 163, 0.08)' : 'rgba(21, 19, 54, 0.5)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00e5a3';
                e.currentTarget.style.background = 'rgba(0, 229, 163, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = otherTipFileName ? 'rgba(0, 229, 163, 0.5)' : 'var(--border-medium)';
                e.currentTarget.style.background = otherTipFileName ? 'rgba(0, 229, 163, 0.08)' : 'rgba(21, 19, 54, 0.5)';
              }}
            >
              <input
                ref={otherTipInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.tsv,.txt,.png,.jpg,.jpeg,.webp,image/*"
                style={{ display: 'none' }}
                onChange={handleOtherTipUpload}
              />
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'rgba(0, 229, 163, 0.18)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00e5a3',
                  marginBottom: '10px',
                }}
              >
                <Upload size={22} />
              </div>
              <p style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.98rem' }}>
                Upload Other Tip Source
              </p>
              {isOcrLoading ? (
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ color: '#00e5a3', fontSize: '0.85rem', fontWeight: 600 }}>
                    ⚡ Scanning & transcribing screenshot via OCR...
                  </span>
                </div>
              ) : otherTipFileName ? (
                <div style={{ marginTop: '8px' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      maxWidth: '92%',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'rgba(0, 229, 163, 0.2)',
                      color: '#00e5a3',
                    }}
                  >
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '0.82rem',
                        fontWeight: 500,
                      }}
                    >
                      {otherTipFileName}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (otherTipInputRef.current) otherTipInputRef.current.value = '';
                        onRemoveOtherTips?.();
                      }}
                      title="Remove other tips file"
                      style={{
                        background: 'rgba(255, 95, 109, 0.25)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#ff5f6d',
                        padding: 0,
                        flexShrink: 0,
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 95, 109, 0.45)';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 95, 109, 0.25)';
                        e.currentTarget.style.color = '#ff5f6d';
                      }}
                    >
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  </div>
                  <p style={{ color: '#00e5a3', fontSize: '0.8rem', marginTop: '6px', fontWeight: 500 }}>
                    ✓ {sortedDailyEntries.length} daily records updated
                  </p>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '6px' }}>
                  Import external channel tips (Excel, CSV, Text, or Screenshot)
                </p>
              )}
            </div>
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
            <div className="data-table-container" style={{ maxHeight: '380px', overflowY: 'auto', position: 'relative' }}>
              <table className="data-table" style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 12 }}>
                  <tr>
                    <th style={{ position: 'sticky', top: 0, background: '#151336', zIndex: 12 }}>Date</th>
                    <th style={{ position: 'sticky', top: 0, background: '#151336', zIndex: 12 }}>Day</th>
                    <th style={{ position: 'sticky', top: 0, background: '#151336', zIndex: 12 }}>WebDash ($)</th>
                    <th style={{ position: 'sticky', top: 0, background: '#151336', zIndex: 12 }}>Online ($)</th>
                    <th style={{ position: 'sticky', top: 0, background: '#151336', zIndex: 12 }}>DoorDash ($)</th>
                    <th style={{ position: 'sticky', top: 0, background: '#151336', zIndex: 12 }}>Kiosk ($)</th>
                    <th style={{ position: 'sticky', top: 0, background: '#151336', zIndex: 12 }}>Other ($)</th>
                    <th style={{ position: 'sticky', top: 0, background: '#151336', zIndex: 12, textAlign: 'right' }}>Tips</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDailyEntries.map((d) => (
                    <tr key={d.date}>
                      <td style={{ fontWeight: 600 }}>{formatDisplayDate(d.date)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{d.dayOfWeek}</td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          disabled={isManualLocked}
                          className="input-clean"
                          style={{ padding: '4px 8px', width: '85px', fontSize: '0.85rem' }}
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
                          style={{ padding: '4px 8px', width: '85px', fontSize: '0.85rem' }}
                          value={d.onlineTips || 0}
                          onChange={(e) => onDailyInputChange(d.date, 'onlineTips', parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          disabled={isManualLocked}
                          className="input-clean"
                          style={{ padding: '4px 8px', width: '85px', fontSize: '0.85rem' }}
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
                          style={{ padding: '4px 8px', width: '85px', fontSize: '0.85rem' }}
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
                          style={{ padding: '4px 8px', width: '85px', fontSize: '0.85rem' }}
                          value={d.otherTips || 0}
                          onChange={(e) => onDailyInputChange(d.date, 'otherTips', parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#00e5a3' }}>
                        ${((d.webDashTips || 0) + (d.onlineTips || 0) + (d.doorDashTips || 0) + (d.kioskTips || 0) + (d.otherTips || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 12 }}>
                  <tr style={{ background: '#1c194a', borderTop: '2px solid rgba(108, 99, 255, 0.45)' }}>
                    <td style={{ position: 'sticky', bottom: 0, background: '#1c194a', fontWeight: 700, color: '#ffffff', zIndex: 12 }}>Total</td>
                    <td style={{ position: 'sticky', bottom: 0, background: '#1c194a', color: 'var(--text-muted)', zIndex: 12 }}>—</td>
                    <td style={{ position: 'sticky', bottom: 0, background: '#1c194a', fontWeight: 700, color: '#c5c7e8', zIndex: 12 }}>${dailyTipTotals.webDash.toFixed(2)}</td>
                    <td style={{ position: 'sticky', bottom: 0, background: '#1c194a', fontWeight: 700, color: '#c5c7e8', zIndex: 12 }}>${dailyTipTotals.online.toFixed(2)}</td>
                    <td style={{ position: 'sticky', bottom: 0, background: '#1c194a', fontWeight: 700, color: '#c5c7e8', zIndex: 12 }}>${dailyTipTotals.doorDash.toFixed(2)}</td>
                    <td style={{ position: 'sticky', bottom: 0, background: '#1c194a', fontWeight: 700, color: '#c5c7e8', zIndex: 12 }}>${dailyTipTotals.kiosk.toFixed(2)}</td>
                    <td style={{ position: 'sticky', bottom: 0, background: '#1c194a', fontWeight: 700, color: '#c5c7e8', zIndex: 12 }}>${dailyTipTotals.other.toFixed(2)}</td>
                    <td style={{ position: 'sticky', bottom: 0, background: '#1c194a', textAlign: 'right', fontWeight: 800, color: '#00e5a3', fontSize: '0.98rem', zIndex: 12 }}>
                      ${dailyTipTotals.grandTotal.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* SECTION 3: Contributor info */}
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
                className="method-card-hover"
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
                onClick={() => handleSelectSplitSetup('percentage_of_sales')}
              >
                <input
                  type="radio"
                  checked={settings.splitSetup === 'percentage_of_sales'}
                  onChange={() => handleSelectSplitSetup('percentage_of_sales')}
                />
                <span style={{ fontSize: '0.92rem', color: '#ffffff', fontWeight: 500 }}>Percentage of Sales</span>
              </div>

              <div
                className="method-card-hover"
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
                onClick={() => handleSelectSplitSetup('percentage_of_tips')}
              >
                <input
                  type="radio"
                  checked={settings.splitSetup === 'percentage_of_tips'}
                  onChange={() => handleSelectSplitSetup('percentage_of_tips')}
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

            {/* Table of Role Contributors */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {shifts.length === 0 ? (
                <div style={{ padding: '20px', borderRadius: '8px', background: 'rgba(139, 142, 222, 0.06)', border: '1px dashed var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                  <span>⚠️ No time cards uploaded. Upload a time card report above to select available contributor roles.</span>
                </div>
              ) : settings.contributors.length === 0 ? (
                <div style={{ padding: '20px', borderRadius: '8px', background: 'rgba(139, 142, 222, 0.06)', border: '1px dashed var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                  No contributor roles added yet. Click &quot;+ Add role contributor&quot; to configure role splits.
                </div>
              ) : null}
              {settings.contributors.map((contrib, idx) => (
                <div
                  key={contrib.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(180px, 2fr) minmax(130px, 1fr) 40px',
                    gap: '12px',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <select
                      className="input-clean"
                      value={contrib.role}
                      onChange={(e) => updateContributor(idx, 'role', e.target.value)}
                      style={{ cursor: 'pointer', appearance: 'auto' }}
                    >
                      <option value="">Select a role...</option>
                      {contrib.role && !detectedRoles.includes(contrib.role) && (
                        <option value={contrib.role}>{contrib.role}</option>
                      )}
                      {detectedRoles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
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
                  <span>DoorDash</span>
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

        {/* SECTION 4: Tips distribution */}
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
                  className="method-card-hover"
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

          {!settings.distributionMethod && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'rgba(246, 196, 69, 0.08)',
                border: '1px dashed rgba(246, 196, 69, 0.3)',
                color: '#f6c445',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <span>⚠️ No default distribution method selected. Please click Percentage, Points, or Equally above to define distribution rules.</span>
            </div>
          )}
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
            {shifts.length === 0 ? (
              <div style={{ padding: '20px', borderRadius: '8px', background: 'rgba(139, 142, 222, 0.06)', border: '1px dashed var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                <span>⚠️ No time cards uploaded. Upload a time card report above to select available recipient roles.</span>
              </div>
            ) : settings.recipients.length === 0 ? (
              <div style={{ padding: '20px', borderRadius: '8px', background: 'rgba(139, 142, 222, 0.06)', border: '1px dashed var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                No recipient roles added yet. Click &quot;+ Add recipient&quot; to configure distribution shares.
              </div>
            ) : null}
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
                  <select
                    className="input-clean"
                    value={recip.role}
                    onChange={(e) => updateRecipient(idx, 'role', e.target.value)}
                    style={{ cursor: 'pointer', appearance: 'auto' }}
                  >
                    <option value="">Select a role...</option>
                    {recip.role && !detectedRoles.includes(recip.role) && (
                      <option value={recip.role}>{recip.role}</option>
                    )}
                    {detectedRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
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
        </div>

      {/* Setup Validation Error Modal */}
      {showValidationModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 4, 18, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            className="glass-panel modal-scale-in"
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '28px',
              borderRadius: '16px',
              border: '1.5px solid rgba(255, 95, 109, 0.45)',
              background: '#151233',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(255, 95, 109, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '18px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'rgba(255, 95, 109, 0.16)',
                  border: '1px solid rgba(255, 95, 109, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ff5f6d',
                  flexShrink: 0,
                }}
              >
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                  Tip Distribution Incomplete
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#c5c7e8', marginTop: '6px', lineHeight: 1.5 }}>
                  The tip distribution calculation cannot run until the required setup is completed:
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
              {validationErrors.map((err, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255, 95, 109, 0.1)',
                    border: '1px solid rgba(255, 95, 109, 0.25)',
                    color: '#ff9da7',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span style={{ color: '#ff5f6d', fontWeight: 700 }}>•</span>
                  <span>{err}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowValidationModal(false)}
                style={{ padding: '9px 24px' }}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
