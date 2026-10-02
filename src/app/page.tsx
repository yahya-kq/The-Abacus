'use client';

import React, { useState, useEffect } from 'react';
import {
  Calculator,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Store,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Building2,
} from 'lucide-react';
import { LandingHero } from '../components/LandingHero';
import { TipCycleSelector } from '../components/TipCycleSelector';
import { TimeCardUploader } from '../components/TimeCardUploader';
import { DailyTipEntry } from '../components/DailyTipEntry';
import { CalculationDashboard } from '../components/CalculationDashboard';
import { RESTAURANTS_DATABASE, DEFAULT_RESTAURANT } from '../config/restaurants';
import { ProcessedShift, DailyTipInput, CycleCalculationResult, RestaurantConfig } from '../types/tips';
import { generateDateRange, calculateTipCycle } from '../lib/calculator';
import { formatDisplayDate, getDayOfWeek, parseTimecardCsv } from '../lib/parser';
import { MISSION_HILL_SAMPLE_CSV, MISSION_HILL_SAMPLE_TIPS } from '../lib/sampleData';

export default function Home() {
  const [screen, setScreen] = useState<'landing' | 'setup' | 'dashboard'>('landing');
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantConfig>(DEFAULT_RESTAURANT);
  const [startDate, setStartDate] = useState('2026-09-07');
  const [endDate, setEndDate] = useState('2026-09-20');
  const [shifts, setShifts] = useState<ProcessedShift[]>([]);
  const [timeCardFileName, setTimeCardFileName] = useState<string | null>(null);
  const [dailyTipInputs, setDailyTipInputs] = useState<Record<string, DailyTipInput>>({});
  const [calculationResult, setCalculationResult] = useState<CycleCalculationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Generate cycle dates
  const cycleDates = generateDateRange(startDate, endDate);

  // Initialize or update daily tip inputs when cycle dates change
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
            chaosTips: 0,
            otherTips: 0,
            totalTips: 0,
          };
        }
      }
      return updated;
    });
  }, [startDate, endDate]);

  // Handle single field input in DailyTipEntry
  const handleDailyInputChange = (date: string, field: keyof DailyTipInput, value: number) => {
    setDailyTipInputs((prev) => {
      const day = prev[date] || {
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

      const updatedDay = {
        ...day,
        [field]: value,
      };

      updatedDay.totalTips =
        (updatedDay.webDashTips || 0) +
        (updatedDay.doorDashTips || 0) +
        (updatedDay.kioskTips || 0) +
        (updatedDay.chaosTips || 0) +
        (updatedDay.otherTips || 0);

      return {
        ...prev,
        [date]: updatedDay,
      };
    });
  };

  // Run calculation action
  const handleRunCalculation = () => {
    setValidationError(null);

    if (shifts.length === 0) {
      setValidationError('Please upload a time card file before calculating tips.');
      return;
    }

    try {
      const result = calculateTipCycle(
        selectedRestaurant,
        startDate,
        endDate,
        shifts,
        dailyTipInputs
      );

      setCalculationResult(result);
      setScreen('dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error(err);
      setValidationError(`Calculation error: ${err.message || 'Unknown error'}`);
    }
  };

  // 1-Click quick verified demo
  const handleQuickDemo = () => {
    const parseResult = parseTimecardCsv(MISSION_HILL_SAMPLE_CSV, selectedRestaurant);
    setStartDate('2026-09-07');
    setEndDate('2026-09-20');
    setShifts(parseResult.shifts);
    setTimeCardFileName('Mission_Hill_TimeCard_Sep7_Sep20.xlsx');
    setDailyTipInputs(MISSION_HILL_SAMPLE_TIPS);

    const result = calculateTipCycle(
      selectedRestaurant,
      '2026-09-07',
      '2026-09-20',
      parseResult.shifts,
      MISSION_HILL_SAMPLE_TIPS
    );

    setCalculationResult(result);
    setScreen('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset entire session
  const handleReset = () => {
    setShifts([]);
    setTimeCardFileName(null);
    setDailyTipInputs({});
    setCalculationResult(null);
    setValidationError(null);
    setScreen('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Global Navigation Bar */}
      <nav
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(7, 9, 14, 0.85)',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: '14px 24px',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo & Brand */}
          <div
            onClick={() => setScreen('landing')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
              }}
            >
              <Calculator size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                ABACUS
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '-2px' }}>
                Restaurant Tip Calculator
              </div>
            </div>
          </div>

          {/* Restaurant Selector & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={16} color="#60a5fa" />
              <select
                value={selectedRestaurant.id}
                onChange={(e) => {
                  const rest = RESTAURANTS_DATABASE.find((r) => r.id === e.target.value);
                  if (rest) setSelectedRestaurant(rest);
                }}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '6px 14px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {RESTAURANTS_DATABASE.map((r) => (
                  <option key={r.id} value={r.id} disabled={!r.active}>
                    {r.name} {r.active ? '• Active (Equal)' : '• Planned'}
                  </option>
                ))}
              </select>
            </div>

            {screen !== 'landing' && (
              <button
                onClick={handleReset}
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: '0.8rem', color: '#fb7185' }}
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Body Switcher */}
      <div style={{ flex: 1 }}>
        {screen === 'landing' && (
          <LandingHero
            onStart={() => setScreen('setup')}
            onQuickDemo={handleQuickDemo}
          />
        )}

        {screen === 'setup' && (
          <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '36px 20px 80px' }}>
            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <button
                  onClick={() => setScreen('landing')}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem', marginBottom: '10px' }}
                >
                  <ArrowLeft size={14} />
                  <span>Back to Welcome</span>
                </button>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                  Tip Calculation Setup
                </h1>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Configure cycle dates, upload time cards, and input manual tips for {selectedRestaurant.name}.
                </p>
              </div>

              <div className="badge badge-emerald" style={{ padding: '8px 14px' }}>
                <CheckCircle2 size={13} style={{ marginRight: '4px' }} />
                Equal Tip System
              </div>
            </div>

            {/* Validation alert */}
            {validationError && (
              <div
                style={{
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 18px',
                  color: '#fb7185',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '20px',
                }}
              >
                <AlertCircle size={20} />
                <span>{validationError}</span>
              </div>
            )}

            {/* Step 1: Tip Cycle Selection */}
            <TipCycleSelector
              startDate={startDate}
              endDate={endDate}
              onChange={(s, e) => {
                setStartDate(s);
                setEndDate(e);
              }}
            />

            {/* Step 2: Upload Time Cards */}
            <TimeCardUploader
              restaurant={selectedRestaurant}
              shifts={shifts}
              fileName={timeCardFileName}
              onShiftsLoaded={(loadedShifts, fname) => {
                setShifts(loadedShifts);
                setTimeCardFileName(fname);
                setValidationError(null);
              }}
              onClear={() => {
                setShifts([]);
                setTimeCardFileName(null);
              }}
            />

            {/* Step 3: Manual Daily Tip Entry */}
            <DailyTipEntry
              restaurant={selectedRestaurant}
              cycleDates={cycleDates}
              dailyTipInputs={dailyTipInputs}
              shifts={shifts}
              onInputChange={handleDailyInputChange}
              onBulkSet={(bulk) => setDailyTipInputs(bulk)}
            />

            {/* Step 4: Big Glowing Run Calculation CTA */}
            <div style={{ marginTop: '36px', textAlign: 'center' }}>
              <button
                onClick={handleRunCalculation}
                className="btn-primary pulse-glow"
                style={{
                  padding: '18px 52px',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  width: '100%',
                  maxWidth: '460px',
                  margin: '0 auto',
                }}
              >
                <Calculator size={24} />
                <span>Run Calculation</span>
                <Sparkles size={20} />
              </button>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                Reconciles shifts, calculates hourly rates, and generates client-ready results
              </div>
            </div>
          </div>
        )}

        {screen === 'dashboard' && calculationResult && (
          <CalculationDashboard
            result={calculationResult}
            onReset={handleReset}
          />
        )}
      </div>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '24px',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          background: 'rgba(7, 9, 14, 0.9)',
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <strong>Abacus Tip Intelligence</strong> • Built for Mission Hill • Scalable for 40+ Restaurant Operations
          </div>
          <div>
            Equal • Pooling • Percentage • Points Tip Distribution Engine
          </div>
        </div>
      </footer>
    </main>
  );
}
