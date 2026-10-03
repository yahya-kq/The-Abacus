'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import { formatDisplayDate, getDayOfWeek } from '../lib/parser';
import { TEST_1_SHIFTS, TEST_1_EXTRACTED_TIPS } from '../lib/testSampleData';
import { MISSION_HILL_SHIFTS, MISSION_HILL_DAILY_TIPS } from '../lib/missionHillData';

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<NavScreen>('hero');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    distributionMethod: 'Equally',
    recipients: [],
    businessDayCutoffHour: 12,
    timezone: 'America/New_York',
  });

  // Shifts state
  const [shifts, setShifts] = useState<ProcessedShift[]>([]);
  const [timeCardFileName, setTimeCardFileName] = useState<string | null>(null);
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
    detectedEnd?: string
  ) => {
    setShifts(loadedShifts);
    setTimeCardFileName(fname);

    const updatedSettings = { ...settings };
    if (detectedStart) updatedSettings.startDate = detectedStart;
    if (detectedEnd) updatedSettings.endDate = detectedEnd;
    setSettings(updatedSettings);

    if (extractedTips && Object.keys(extractedTips).length > 0) {
      setDailyTipInputs((prev) => {
        const next = { ...prev };
        for (const [date, amount] of Object.entries(extractedTips)) {
          next[date] = {
            date,
            displayDate: formatDisplayDate(date),
            dayOfWeek: getDayOfWeek(date),
            webDashTips: Math.round(amount * 0.7 * 100) / 100,
            doorDashTips: 0,
            kioskTips: Math.round(amount * 0.3 * 100) / 100,
            otherTips: 0,
            totalTips: amount,
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
        doorDashTips: 0,
        kioskTips: 0,
        otherTips: 0,
        totalTips: 0,
      };

      const updated = { ...current, [field]: value };
      updated.totalTips =
        (updated.webDashTips || 0) +
        (updated.doorDashTips || 0) +
        (updated.kioskTips || 0) +
        (updated.otherTips || 0);

      return { ...prev, [date]: updated };
    });
  };

  // Hard Refresh (Clear all in-memory data back to clean state as requested in Audio 2)
  const handleHardRefresh = () => {
    setShifts([]);
    setTimeCardFileName(null);
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
      distributionMethod: 'Equally',
      recipients: [],
      businessDayCutoffHour: 12,
      timezone: 'America/New_York',
    });
    showToast('Hard Refresh Complete: All shifts and temporary inputs cleared.');
  };

  // Load Mission Hill Dataset
  const handleLoadMissionHillData = () => {
    setShifts(MISSION_HILL_SHIFTS);
    setTimeCardFileName('Mission_Hill_Coffee_&_Creamery_Time_Card_Report_2026-09-07_to_2026-09-20.csv');
    setSettings({
      poolName: 'Mission Hill Coffee & Creamery',
      restaurantName: 'Mission Hill',
      dateMode: 'range',
      startDate: '2026-09-07',
      endDate: '2026-09-20',
      timePeriod: 'all_day',
      splitSetup: 'percentage_of_tips',
      contributors: [],
      sources: {
        kiosk: { enabled: true, percent: 100 },
        online: { enabled: true, percent: 100 },
        qr: { enabled: false, percent: 100 },
        thirdParty: { enabled: true, percent: 100, source: 'All' },
      },
      distributionMethod: 'Equally',
      recipients: [
        { id: 'r-cashier', role: 'Cashier', distributionPercent: 50, pointsPerHour: 1 },
        { id: 'r-server', role: 'Server', distributionPercent: 50, pointsPerHour: 1 },
      ],
      businessDayCutoffHour: 12,
      timezone: 'America/New_York',
    });

    const nextInputs: Record<string, DailyTipInput> = {};
    for (const [date, val] of Object.entries(MISSION_HILL_DAILY_TIPS)) {
      nextInputs[date] = {
        date,
        displayDate: formatDisplayDate(date),
        dayOfWeek: getDayOfWeek(date),
        webDashTips: val.webDashTips || 0,
        doorDashTips: val.doorDashTips || 0,
        kioskTips: val.kioskTips || 0,
        otherTips: 0,
        totalTips: val.totalTips || 0,
      };
    }
    setDailyTipInputs(nextInputs);
    showToast('Mission Hill dataset loaded (51 shifts, 275.65 hrs, $2,118.87 tips).');
  };

  // Quick reload Test-1 Sample Dataset
  const handleLoadTestData = () => {
    setShifts(TEST_1_SHIFTS);
    setTimeCardFileName('tip_pool_calculator_Test-1 1.xlsx');
    setSettings({
      poolName: 'Test-1 Tip Pool',
      restaurantName: 'Test-1 Restaurant',
      dateMode: 'range',
      startDate: '2026-09-07',
      endDate: '2026-09-20',
      timePeriod: 'all_day',
      splitSetup: 'percentage_of_tips',
      contributors: [
        { id: 'c1', role: 'Summary', contributionPercent: 100, source: 'All' },
        { id: 'c2', role: 'Kiosk', contributionPercent: 100, source: 'All' },
      ],
      sources: {
        kiosk: { enabled: true, percent: 100 },
        online: { enabled: true, percent: 100 },
        qr: { enabled: false, percent: 100 },
        thirdParty: { enabled: true, percent: 100, source: 'All' },
      },
      distributionMethod: 'Equally',
      recipients: [
        { id: 'r1', role: 'Barista', distributionPercent: 100, pointsPerHour: 1 },
      ],
      businessDayCutoffHour: 12,
      timezone: 'America/New_York',
    });

    const nextInputs: Record<string, DailyTipInput> = {};
    for (const [date, amount] of Object.entries(TEST_1_EXTRACTED_TIPS)) {
      nextInputs[date] = {
        date,
        displayDate: formatDisplayDate(date),
        dayOfWeek: getDayOfWeek(date),
        webDashTips: Math.round(amount * 0.7 * 100) / 100,
        doorDashTips: 0,
        kioskTips: Math.round(amount * 0.3 * 100) / 100,
        otherTips: 0,
        totalTips: amount,
      };
    }
    setDailyTipInputs(nextInputs);
    showToast('Test-1 Sample Dataset loaded successfully (82 active shifts).');
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
          onHardRefresh={handleHardRefresh}
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {timeCardFileName && (
                <span
                  style={{
                    fontSize: '0.8rem',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'rgba(108, 99, 255, 0.15)',
                    border: '1px solid rgba(108, 99, 255, 0.3)',
                    color: '#9ca3ff',
                  }}
                >
                  {timeCardFileName}
                </span>
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
            <LandingHero onStart={() => setCurrentScreen('setup')} />
          )}

          {currentScreen === 'setup' && (
            <SetupPage
              settings={settings}
              onUpdateSettings={setSettings}
              shifts={shifts}
              onShiftsLoaded={handleShiftsLoaded}
              dailyTipInputs={dailyTipInputs}
              onDailyInputChange={handleDailyInputChange}
              onHardRefresh={handleHardRefresh}
              onRunCalculation={() => setCurrentScreen('dashboard')}
              timeCardFileName={timeCardFileName}
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
              onHardRefresh={handleHardRefresh}
            />
          )}
        </main>
      </div>
    </div>
  );
}
