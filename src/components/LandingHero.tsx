'use client';

import React from 'react';
import { ArrowRight, Calculator, CheckCircle2, ShieldCheck, Sparkles, FileSpreadsheet, FileText, Layers, Award } from 'lucide-react';

interface LandingHeroProps {
  onStart: () => void;
  onQuickDemo: () => void;
}

export function LandingHero({ onStart, onQuickDemo }: LandingHeroProps) {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px 100px' }}>
      {/* Top Banner Badge */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <div
          className="badge badge-emerald floating-element"
          style={{
            padding: '8px 16px',
            fontSize: '0.8rem',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)',
          }}
        >
          <Sparkles size={14} style={{ marginRight: '6px' }} />
          ABACUS ENGINE 2.0 • MISSION HILL RESTAURANT READY
        </div>
      </div>

      {/* Main Hero Header */}
      <div style={{ textAlign: 'center', maxWidth: '840px', margin: '0 auto 40px' }}>
        <h1
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 4.2rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '20px',
            background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 50%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Precision Restaurant Tip Calculations, Simplified.
        </h1>
        <p
          style={{
            fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            fontWeight: 400,
            maxWidth: '680px',
            margin: '0 auto 36px',
          }}
        >
          Transform raw time cards and daily tip collections into audited, payroll-ready employee payouts in seconds. Built for Mission Hill, engineered to scale across 40+ restaurant tip pool structures.
        </p>

        {/* Central CTA - Run Abacus */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={onStart}
            className="btn-primary pulse-glow"
            style={{
              padding: '18px 42px',
              fontSize: '1.15rem',
              letterSpacing: '0.02em',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Calculator size={22} />
            <span>Run Abacus</span>
            <ArrowRight size={20} />
          </button>

          <button
            onClick={onQuickDemo}
            className="btn-secondary"
            style={{
              padding: '18px 28px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Sparkles size={18} color="#34d399" />
            <span>1-Click Verified Demo (Sep 7–20)</span>
          </button>
        </div>
      </div>

      {/* 3D Visual Cards Showcase */}
      <div
        className="perspective-container"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginTop: '60px',
        }}
      >
        {/* Feature 1 */}
        <div className="glass-panel card-3d glass-panel-hover" style={{ padding: '32px 28px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              color: '#34d399',
            }}
          >
            <CheckCircle2 size={26} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px' }}>
            Mathematical Precision ($0.00 Differ)
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Every cent is accounted for. Daily hours and tips match the source Excel formulas down to the exact decimal with automated reconciliation checks.
          </p>
        </div>

        {/* Feature 2 */}
        <div className="glass-panel card-3d glass-panel-hover" style={{ padding: '32px 28px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              color: '#60a5fa',
            }}
          >
            <Layers size={26} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px' }}>
            Total Hours Integrity
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Strict adherence to restaurant policy: tips are calculated strictly on total hours from time cards, without splitting regular or overtime hours.
          </p>
        </div>

        {/* Feature 3 */}
        <div className="glass-panel card-3d glass-panel-hover" style={{ padding: '32px 28px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(139, 92, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              color: '#c084fc',
            }}
          >
            <ShieldCheck size={26} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px' }}>
            Toast POS Pool Governance
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Direct replication of your POS tip pool rules: 100% contributors (Server, Cashier, Owner, Kiosk, Online, QR, 3PO) and equal distribution recipients.
          </p>
        </div>

        {/* Feature 4 */}
        <div className="glass-panel card-3d glass-panel-hover" style={{ padding: '32px 28px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              color: '#fbbf24',
            }}
          >
            <FileText size={26} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px' }}>
            Client-Ready PDF Statement
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Instant download of a beautiful, clean, non-cluttered PDF report suitable for restaurant owners, general managers, and payroll processing.
          </p>
        </div>
      </div>
    </div>
  );
}
