'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, RotateCcw, Sparkles } from 'lucide-react';
import { Sidebar, NavScreen } from '../components/Sidebar';
import { LandingHero } from '../components/LandingHero';
import { SetupPage } from '../components/SetupPage';
import { TimeCardsPage } from '../components/TimeCardsPage';
import { CalculationDashboard } from '../components/CalculationDashboard';
import {
  TipPoolSettings,
  ProcessedShift,
  DailyTipInput,
  CycleCalculationResult,
} from '../types/tips';
import { calculateTipCycle, generateDateRange } from '../lib/calculator';
import { formatDisplayDate, getDayOfWeek, parseFileNameMetadata } from '../lib/parser';
import {
  DEMO_SETTINGS,
  DEMO_SHIFTS,
  DEMO_DAILY_TIPS,
  DEMO_TIME_CARD_FILENAME,
  DEMO_OTHER_TIP_FILENAME,
} from '../lib/demoData';

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<NavScreen>('hero');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isHardRefreshModalOpen, setIsHardRefreshModalOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Pool Settings state (Clean slate: user sets up restaurant, cycle dates, and rules)
  const [settings, setSettings] = useState<TipPoolSettings>({
    poolName: '',
    restaurantName: '',
    dateMode: 'range',
    startDate: '',
    endDate: '',
    timePeriod: 'all_day',
    splitSetup: '',
    contributors: [],
    sources: {
      kiosk: { enabled: false, percent: 100 },
      online: { enabled: false, percent: 100 },
      qr: { enabled: false, percent: 100 },
      thirdParty: { enabled: false, percent: 100, source: 'All' },
    },
    customSources: [],
    distributionMethod: '',
    recipients: [],
    businessDayCutoffHour: 12,
    timezone: 'America/New_York',
  });

  // Shifts & Tip Source state
  const [shifts, setShifts] = useState<ProcessedShift[]>([]);
  const [timeCardFileName, setTimeCardFileName] = useState<string | null>(null);
  const [otherTipFileName, setOtherTipFileName] = useState<string | null>(null);
  const [dailyTipInputs, setDailyTipInputs] = useState<Record<string, DailyTipInput>>({});

  // Show temporary toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync dailyTipInputs when date range changes
  const cycleDates = useMemo(
    () => generateDateRange(settings.startDate, settings.endDate),
    [settings.startDate, settings.endDate]
  );

  useEffect(() => {
    setDailyTipInputs((prev) => {
      const updated = { ...prev };
      for (const d of cycleDates) {
        if (!updated[d]) {
          updated[d] = {
            date: d,
            displayDate: formatDisplayDate(d),
            dayOfWeek: getDayOfWeek(d),
            webDashTips: 0,
            onlineTips: 0,
            doorDashTips: 0,
            kioskTips: 0,
            otherTips: 0,
            totalTips: 0,
          };
        }
      }
      return updated;
    });
  }, [cycleDates]);

  // Handle shifts loaded from file
  const handleShiftsLoaded = (
    loadedShifts: ProcessedShift[],
    fname: string,
    extractedTips?: Record<string, number>,
    detectedStart?: string,
    detectedEnd?: string,
    detectedRestaurant?: string
  ) => {
    setShifts(loadedShifts);
    setTimeCardFileName(fname);

    // Auto-extract metadata from file name (e.g. Mission_Hill_Coffee_&_Creamery_Time_Card_Report_2026-09-07_to_2026-09-20.csv)
    const fileMeta = parseFileNameMetadata(fname);

    const updatedSettings = { ...settings };
    const finalRestaurant = detectedRestaurant || fileMeta.restaurantName;
    const finalStart = detectedStart || fileMeta.startDate;
    const finalEnd = detectedEnd || fileMeta.endDate;

    if (finalRestaurant) {
      updatedSettings.restaurantName = finalRestaurant;
      if (!updatedSettings.poolName) {
        updatedSettings.poolName = `${finalRestaurant} Tip Pool`;
      }
    }
    if (finalStart) updatedSettings.startDate = finalStart;
    if (finalEnd) updatedSettings.endDate = finalEnd;
    setSettings(updatedSettings);

    if (extractedTips && Object.keys(extractedTips).length > 0) {
      setDailyTipInputs((prev) => {
        const next = { ...prev };
        for (const [date, amount] of Object.entries(extractedTips)) {
          const roundedAmount = Math.round(amount * 100) / 100;
          const existing = next[date] || {
            date,
            displayDate: formatDisplayDate(date),
            dayOfWeek: getDayOfWeek(date),
            webDashTips: 0,
            onlineTips: 0,
            doorDashTips: 0,
            kioskTips: 0,
            otherTips: 0,
            totalTips: 0,
          };
          next[date] = {
            ...existing,
            webDashTips: roundedAmount,
            totalTips: Math.round((roundedAmount + (existing.onlineTips || 0) + (existing.doorDashTips || 0) + (existing.kioskTips || 0) + (existing.otherTips || 0)) * 100) / 100,
          };
        }
        return next;
      });
    }

    showToast(`Loaded ${loadedShifts.length} shifts from ${fname}`);
  };

  // Handle daily tip input field change
  const handleDailyInputChange = (date: string, field: keyof DailyTipInput, value: number) => {
    setDailyTipInputs((prev) => {
      const current = prev[date] || {
        date,
        displayDate: formatDisplayDate(date),
        dayOfWeek: getDayOfWeek(date),
        webDashTips: 0,
        onlineTips: 0,
        doorDashTips: 0,
        kioskTips: 0,
        otherTips: 0,
        totalTips: 0,
      };

      const updated = { ...current, [field]: value };
      updated.totalTips = Math.round((
        (updated.webDashTips || 0) +
        (updated.onlineTips || 0) +
        (updated.doorDashTips || 0) +
        (updated.kioskTips || 0) +
        (updated.otherTips || 0)
      ) * 100) / 100;

      return { ...prev, [date]: updated };
    });
  };

  // Hard Refresh (Irreversible Permanent Purge of state, browser storage, and file inputs)
  const handleHardRefresh = () => {
    setIsDemoMode(false);
    setShifts([]);
    setTimeCardFileName(null);
    setOtherTipFileName(null);
    setDailyTipInputs({});
    setSettings({
      poolName: '',
      restaurantName: '',
      dateMode: 'range',
      startDate: '',
      endDate: '',
      timePeriod: 'all_day',
      splitSetup: '',
      contributors: [],
      sources: {
        kiosk: { enabled: false, percent: 100 },
        online: { enabled: false, percent: 100 },
        qr: { enabled: false, percent: 100 },
        thirdParty: { enabled: false, percent: 100, source: 'All' },
      },
      customSources: [],
      distributionMethod: '',
      recipients: [],
      businessDayCutoffHour: 12,
      timezone: 'America/New_York',
    });

    // Clear browser storage
    if (typeof window !== 'undefined') {
      try {
        window.localStorage?.clear();
        window.sessionStorage?.clear();
      } catch (e) {
        console.error('Error clearing storage:', e);
      }
    }

    // Clear all DOM file inputs so selecting the same file triggers a fresh upload
    if (typeof document !== 'undefined') {
      try {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach((input) => {
          (input as HTMLInputElement).value = '';
        });
      } catch (e) {
        console.error('Error resetting file inputs:', e);
      }
    }

    showToast('System Cleared: All files, shifts, and data have been permanently deleted.');
  };

  // Launch Client Demo Mode with clean, fully empty workspace
  const handleStartDemoMode = () => {
    setIsDemoMode(true);
    setShifts([]);
    setDailyTipInputs({});
    setTimeCardFileName(null);
    setOtherTipFileName(null);
    setSettings({
      poolName: '',
      restaurantName: '',
      dateMode: 'range',
      startDate: '',
      endDate: '',
      timePeriod: 'all_day',
      splitSetup: '',
      contributors: [],
      sources: {
        kiosk: { enabled: false, percent: 100 },
        online: { enabled: false, percent: 100 },
        qr: { enabled: false, percent: 100 },
        thirdParty: { enabled: false, percent: 100, source: 'All' },
      },
      customSources: [],
      distributionMethod: '',
      recipients: [],
      businessDayCutoffHour: 12,
      timezone: 'America/New_York',
    });
    setCurrentScreen('setup');
    showToast('Demo Mode Activated: Workspace initialized with a clean, empty state.');
  };

  // Exit Client Demo Mode and return to clean landing page
  const handleExitDemoMode = () => {
    handleHardRefresh();
    setCurrentScreen('hero');
    showToast('Exited Demo Mode.');
  };

  const requestHardRefresh = () => {
    setIsHardRefreshModalOpen(true);
  };

  // Handle other tip source loaded from file (.xlsx, .csv)
  const handleOtherTipsLoaded = (
    loadedDailyTips: Record<string, DailyTipInput>,
    fname: string,
    detectedStart?: string,
    detectedEnd?: string,
    detectedRestaurant?: string
  ) => {
    setOtherTipFileName(fname);

    const fileMeta = parseFileNameMetadata(fname);
    const updatedSettings = { ...settings };
    const finalStart = detectedStart || fileMeta.startDate;
    const finalEnd = detectedEnd || fileMeta.endDate;
    const finalRestaurant = detectedRestaurant || fileMeta.restaurantName;

    if (!updatedSettings.startDate && finalStart) updatedSettings.startDate = finalStart;
    if (!updatedSettings.endDate && finalEnd) updatedSettings.endDate = finalEnd;
    if (!updatedSettings.restaurantName && finalRestaurant) {
      updatedSettings.restaurantName = finalRestaurant;
      if (!updatedSettings.poolName) updatedSettings.poolName = `${finalRestaurant} Tip Pool`;
    }

    // Auto-enable tip source toggles if uploaded data has non-zero amounts
    let hasKiosk = false;
    let hasOnline = false;
    let hasThirdParty = false;
    for (const val of Object.values(loadedDailyTips)) {
      if ((val.kioskTips || 0) > 0) hasKiosk = true;
      if ((val.webDashTips || 0) > 0) hasOnline = true;
      if ((val.doorDashTips || 0) > 0) hasThirdParty = true;
    }

    if (hasKiosk || hasOnline || hasThirdParty) {
      updatedSettings.sources = {
        ...updatedSettings.sources,
        kiosk: {
          ...updatedSettings.sources?.kiosk,
          enabled: hasKiosk || Boolean(updatedSettings.sources?.kiosk?.enabled),
          percent: updatedSettings.sources?.kiosk?.percent ?? 100,
        },
        online: {
          ...updatedSettings.sources?.online,
          enabled: hasOnline || Boolean(updatedSettings.sources?.online?.enabled),
          percent: updatedSettings.sources?.online?.percent ?? 100,
        },
        thirdParty: {
          ...updatedSettings.sources?.thirdParty,
          enabled: hasThirdParty || Boolean(updatedSettings.sources?.thirdParty?.enabled),
          percent: updatedSettings.sources?.thirdParty?.percent ?? 100,
        },
      };
    }

    setSettings(updatedSettings);

    setDailyTipInputs((prev) => {
      const merged = { ...prev };
      for (const [date, val] of Object.entries(loadedDailyTips)) {
        const existing = merged[date] || {
          date,
          displayDate: val.displayDate || formatDisplayDate(date),
          dayOfWeek: val.dayOfWeek || getDayOfWeek(date),
          webDashTips: 0,
          onlineTips: 0,
          doorDashTips: 0,
          kioskTips: 0,
          otherTips: 0,
          totalTips: 0,
        };
        const webDash = (val.webDashTips !== undefined && val.webDashTips > 0) ? val.webDashTips : (existing.webDashTips || 0);
        const online = val.onlineTips !== undefined ? val.onlineTips : 0;
        const doorDash = val.doorDashTips !== undefined ? val.doorDashTips : 0;
        const kiosk = val.kioskTips !== undefined ? val.kioskTips : 0;
        const other = val.otherTips !== undefined ? val.otherTips : 0;
        merged[date] = {
          ...existing,
          webDashTips: webDash,
          onlineTips: online,
          doorDashTips: doorDash,
          kioskTips: kiosk,
          otherTips: other,
          totalTips: Math.round((webDash + online + doorDash + kiosk + other) * 100) / 100,
        };
      }
      return merged;
    });

    showToast(`Loaded other tip source from ${fname}`);
  };

  // Remove Time Cards file
  const handleRemoveTimeCards = () => {
    setTimeCardFileName(null);
    setShifts([]);
    if (typeof document !== 'undefined') {
      const inputs = document.querySelectorAll('input[type="file"]');
      inputs.forEach((inp) => {
        (inp as HTMLInputElement).value = '';
      });
    }
    setDailyTipInputs((prev) => {
      const updated = { ...prev };
      for (const [date, val] of Object.entries(updated)) {
        updated[date] = {
          ...val,
          webDashTips: 0,
          totalTips: Math.round((
            (val.onlineTips || 0) +
            (val.doorDashTips || 0) +
            (val.kioskTips || 0) +
            (val.otherTips || 0)
          ) * 100) / 100,
        };
      }
      return updated;
    });
    showToast('Time cards file removed.');
  };

  // Remove Other Tip Source file
  const handleRemoveOtherTips = () => {
    setOtherTipFileName(null);
    if (typeof document !== 'undefined') {
      const inputs = document.querySelectorAll('input[type="file"]');
      inputs.forEach((inp) => {
        (inp as HTMLInputElement).value = '';
      });
    }
    setDailyTipInputs((prev) => {
      const updated = { ...prev };
      for (const [date, val] of Object.entries(updated)) {
        updated[date] = {
          ...val,
          onlineTips: 0,
          doorDashTips: 0,
          kioskTips: 0,
          otherTips: 0,
          totalTips: val.webDashTips || 0,
        };
      }
      return updated;
    });
    showToast('Other tip source file removed.');
  };

  // Instant Memoized Calculation Result
  const calculationResult: CycleCalculationResult = useMemo(() => {
    return calculateTipCycle(settings, shifts, dailyTipInputs);
  }, [settings, shifts, dailyTipInputs]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Collapsible Sidebar: Only rendered in workspace views */}
      {currentScreen !== 'hero' && (
        <Sidebar
          currentScreen={currentScreen}
          onNavigate={(screen) => setCurrentScreen(screen)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onHardRefresh={requestHardRefresh}
        />
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}>
        {/* Clean Top Navigation Bar: Only rendered in workspace views */}
        {currentScreen !== 'hero' && (
          <header
            style={{
              height: '60px',
              borderBottom: '1px solid rgba(139, 142, 222, 0.14)',
              background: 'rgba(21, 19, 54, 0.75)',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 28px',
              position: 'sticky',
              top: 0,
              zIndex: 40,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => setCurrentScreen('hero')}
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Return to Landing Page"
              >
                ABACUS
              </button>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>|</span>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                {currentScreen === 'setup' && 'Tip Pool Configuration'}
                {currentScreen === 'timecards' && 'Time Cards Ledger'}
                {currentScreen === 'dashboard' && 'Calculation Dashboard'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isDemoMode && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'rgba(0, 229, 163, 0.12)',
                    border: '1px solid rgba(0, 229, 163, 0.4)',
                    color: '#00e5a3',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  <Sparkles size={13} />
                  <span>Client Demo Mode</span>
                  <button
                    onClick={handleExitDemoMode}
                    type="button"
                    style={{
                      background: 'rgba(255, 95, 109, 0.2)',
                      border: '1px solid rgba(255, 95, 109, 0.4)',
                      color: '#ff9c9c',
                      borderRadius: 'var(--radius-pill)',
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      marginLeft: '4px',
                    }}
                    title="Exit demo mode and start fresh"
                  >
                    Exit Demo
                  </button>
                </div>
              )}
            </div>
          </header>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 9999,
              background: '#19173f',
              border: '1px solid rgba(108, 99, 255, 0.4)',
              color: '#ffffff',
              padding: '12px 20px',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#00e5a3',
                boxShadow: '0 0 8px #00e5a3',
              }}
            />
            {toastMessage}
          </div>
        )}

        {/* Dynamic Screen Rendering */}
        <main style={{ flex: 1, minHeight: currentScreen === 'hero' ? '100vh' : 'calc(100vh - 60px)' }}>
          {currentScreen === 'hero' && (
            <LandingHero
              onStart={() => setCurrentScreen('setup')}
              onViewDemo={handleStartDemoMode}
            />
          )}

          {currentScreen === 'setup' && (
            <SetupPage
              settings={settings}
              onUpdateSettings={setSettings}
              shifts={shifts}
              onShiftsLoaded={handleShiftsLoaded}
              dailyTipInputs={dailyTipInputs}
              onDailyInputChange={handleDailyInputChange}
              onHardRefresh={requestHardRefresh}
              onRunCalculation={() => setCurrentScreen('dashboard')}
              timeCardFileName={timeCardFileName}
              otherTipFileName={otherTipFileName}
              onOtherTipsLoaded={handleOtherTipsLoaded}
              onRemoveTimeCards={handleRemoveTimeCards}
              onRemoveOtherTips={handleRemoveOtherTips}
            />
          )}

          {currentScreen === 'timecards' && (
            <TimeCardsPage
              shifts={shifts}
              onUpdateShifts={setShifts}
              settings={settings}
              onUpdateSettings={setSettings}
            />
          )}

          {currentScreen === 'dashboard' && (
            <CalculationDashboard
              result={calculationResult}
              onHardRefresh={requestHardRefresh}
            />
          )}
        </main>
      </div>

      {/* Confirmation Warning Modal for Hard Refresh */}
      {isHardRefreshModalOpen && (
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
              maxWidth: '480px',
              width: '100%',
              padding: '28px',
              borderRadius: '16px',
              border: '1.5px solid rgba(255, 95, 109, 0.45)',
              background: '#151233',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(255, 95, 109, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
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
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                  Permanent System Reset
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#c5c7e8', marginTop: '6px', lineHeight: 1.5 }}>
                  Performing a hard refresh will permanently delete all imported timecards, shift records, tip data, and browser cache, resetting the system back to clean defaults.
                </p>
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 95, 109, 0.1)',
                border: '1px solid rgba(255, 95, 109, 0.25)',
                color: '#ff9da7',
                fontSize: '0.84rem',
                fontWeight: 500,
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>⚠️ This action is irreversible. All files, shifts, and data will be permanently wiped.</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsHardRefreshModalOpen(false)}
                style={{ padding: '9px 18px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  setIsHardRefreshModalOpen(false);
                  handleHardRefresh();
                }}
                style={{
                  padding: '9px 20px',
                  fontWeight: 600,
                  background: '#ff5f6d',
                  color: '#ffffff',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(255, 95, 109, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <RotateCcw size={15} />
                <span>Permanently Delete All</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
