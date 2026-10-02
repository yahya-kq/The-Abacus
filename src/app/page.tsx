'use client';

import React, { useState, useEffect } from 'react';
import {
  Calculator,
  RotateCcw,
  ArrowLeft,
  Building2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
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
        (updatedDay.otherTips || 0);

      return {
        ...prev,
        [date]: updatedDay,
      };
    });
  };

  // Called when time card is uploaded or sample is loaded
  const handleShiftsLoaded = (
    loadedShifts: ProcessedShift[],
    fname: string,
    extractedTips?: Record<string, number>,
    detectedStart?: string,
    detectedEnd?: string
  ) => {
    setShifts(loadedShifts);
    setTimeCardFileName(fname);
    setValidationError(null);

    // Auto-update cycle dates if detected from file
    if (detectedStart && detectedEnd) {
      setStartDate(detectedStart);
      setEndDate(detectedEnd);
    }

    // Auto-populate daily WebDash tips from time card
    if (extractedTips && Object.keys(extractedTips).length > 0) {
      setDailyTipInputs((prev) => {
        const updated = { ...prev };
        const newCycleDates = detectedStart && detectedEnd ? generateDateRange(detectedStart, detectedEnd) : cycleDates;
        for (const d of newCycleDates) {
          const extractedVal = extractedTips[d] !== undefined ? extractedTips[d] : updated[d]?.webDashTips || 0;
          const doorDash = updated[d]?.doorDashTips || 0;
          const kiosk = updated[d]?.kioskTips || 0;
          const other = updated[d]?.otherTips || 0;

          updated[d] = {
            date: d,
            displayDate: formatDisplayDate(d),
            dayOfWeek: getDayOfWeek(d),
            webDashTips: extractedVal,
            doorDashTips: doorDash,
            kioskTips: kiosk,
            otherTips: other,
            totalTips: extractedVal + doorDash + kiosk + other,
          };
        }
        return updated;
      });
    }
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
      {/* Sleek Frosted Glass Top Bar (No harsh black) */}
      <nav
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
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
                background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 15px rgba(79, 70, 229, 0.35)',
              }}
            >
              <Calculator size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                ABACUS
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '-2px' }}>
                Tip Calculator
              </div>
            </div>
          </div>

          {/* Restaurant Display (Only Mission Hill, no dummy restaurants) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(30, 41, 59, 0.85)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-pill)',
                padding: '6px 14px',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <Building2 size={15} color="#60a5fa" />
              <span>{selectedRestaurant.name}</span>
              <span style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: 700 }}>• Active</span>
            </div>

            {screen !== 'landing' && (
              <button
                onClick={handleReset}
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: '0.82rem', color: '#fb7185' }}
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div style={{ flex: 1 }}>
        {screen === 'landing' && (
          <LandingHero
            onStart={() => {
              setScreen('setup');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {screen === 'setup' && (
          <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '32px 20px 80px' }}>
            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <button
                  onClick={() => setScreen('landing')}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem', marginBottom: '10px' }}
                >
                  <ArrowLeft size={14} />
                  <span>Back to Start</span>
                </button>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                  Tip Calculation Setup
                </h1>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Manage payroll tip distribution for {selectedRestaurant.name}.
                </p>
              </div>

              <div className="badge badge-indigo" style={{ padding: '8px 14px' }}>
                <CheckCircle2 size={13} style={{ marginRight: '4px' }} />
                Equal Tip System
              </div>
            </div>

            {/* Quick Step-by-Step Instructions Banner */}
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.45)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                marginBottom: '22px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                flexWrap: 'wrap',
              }}
            >
              <HelpCircle size={18} color="#818cf8" style={{ flexShrink: 0 }} />
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span><strong>1. Upload Time Card:</strong> Dates and WebDash tips automatically populate.</span>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <span><strong>2. Review & Add Tips:</strong> Input DoorDash, Kiosk, or Other manual collections.</span>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <span><strong>3. Calculate:</strong> View payouts and export client PDF.</span>
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

            {/* Top Grid: Cycle Dates + Time Card Import side-by-side */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '18px',
                marginBottom: '22px',
              }}
            >
              <TipCycleSelector
                startDate={startDate}
                endDate={endDate}
                onChange={(s, e) => {
                  setStartDate(s);
                  setEndDate(e);
                }}
              />

              <TimeCardUploader
                restaurant={selectedRestaurant}
                shifts={shifts}
                fileName={timeCardFileName}
                onShiftsLoaded={handleShiftsLoaded}
                onClear={() => {
                  setShifts([]);
                  setTimeCardFileName(null);
                }}
              />
            </div>

            {/* Daily Tip Entry (Full Width Table with Top Sticky Action) */}
            <DailyTipEntry
              restaurant={selectedRestaurant}
              cycleDates={cycleDates}
              dailyTipInputs={dailyTipInputs}
              shifts={shifts}
              onInputChange={handleDailyInputChange}
              onBulkSet={(bulk) => setDailyTipInputs(bulk)}
              onCalculate={handleRunCalculation}
            />

            {/* Bottom Calculate Action */}
            <div style={{ marginTop: '28px', textAlign: 'center' }}>
              <button
                onClick={handleRunCalculation}
                className="btn-primary"
                style={{
                  padding: '16px 54px',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  width: '100%',
                  maxWidth: '440px',
                  margin: '0 auto',
                }}
              >
                <Calculator size={22} />
                <span>Calculate Tips & Open Dashboard</span>
              </button>
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

      {/* Clean, Discreet Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '18px 24px',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          background: 'rgba(15, 23, 42, 0.6)',
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <strong>Abacus</strong> • Restaurant Tip Calculator
          </div>
          <div>
            Internal Organizational Tool
          </div>
        </div>
      </footer>
    </main>
  );
}
