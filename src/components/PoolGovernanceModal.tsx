'use client';

import React from 'react';
import { X, ShieldCheck, ArrowRight, CheckCircle, Percent, Users, Sparkles } from 'lucide-react';
import { RestaurantConfig } from '../types/tips';

interface PoolGovernanceModalProps {
  restaurant: RestaurantConfig;
  isOpen: boolean;
  onClose: () => void;
}

export function PoolGovernanceModal({ restaurant, isOpen, onClose }: PoolGovernanceModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa',
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Server / Cashier Tip Pool Structure
                </h2>
                <span className="badge badge-emerald">Toast POS Configuration</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {restaurant.name} • Active Effective Tip Distribution Model
              </div>
            </div>
          </div>

          <button onClick={onClose} className="btn-secondary" style={{ padding: '6px 10px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content body */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          {/* Dual Panel: Contributors vs Recipients */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px',
              marginBottom: '24px',
            }}
          >
            {/* Contributors */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Contributors (100% Contribution)
                </h4>
                <span className="badge badge-blue">Split: % of Tips</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {restaurant.contributors.map((c) => (
                  <div
                    key={c.role}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={15} color="#34d399" />
                      <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{c.role}</span>
                      {c.isManualSource && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          (Collection Channel)
                        </span>
                      )}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#34d399' }}>
                      {c.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recipients */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Recipients (Equal Payout / Hour)
                </h4>
                <span className="badge badge-emerald">Distribution: Equal</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {restaurant.recipients.map((r) => (
                  <div
                    key={r.role}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: 'rgba(16, 185, 129, 0.06)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={16} color="#34d399" />
                      <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                        {r.role}
                      </span>
                    </div>
                    <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                      Equal Distribution
                    </span>
                  </div>
                ))}

                {/* Excluded roles info */}
                <div
                  style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: 'rgba(245, 158, 11, 0.06)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    fontSize: '0.78rem',
                    color: '#fbbf24',
                  }}
                >
                  <strong>Excluded Roles:</strong> Management roles such as Kitchen Manager, Chef, General Manager do not receive tip pool distributions per labor policy and pool configuration.
                </div>
              </div>
            </div>
          </div>

          {/* Mathematical Proof & Example from POS */}
          <div
            style={{
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '18px 20px',
            }}
          >
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#93c5fd', marginBottom: '8px' }}>
              Standard Equal Distribution Formula Example (From Toast POS Reference)
            </h4>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              In an equal distribution system, every eligible recipient receives an equal hourly portion of the tip pool based on the exact total hours they worked:
              <ul style={{ margin: '8px 0 8px 24px', listStyleType: 'disc' }}>
                <li><code>Tip Pool: $500.00</code></li>
                <li><code>Total Hours Worked: 25.00 hrs</code></li>
                <li><code>Calculation of Tip Per Hour: $500.00 ÷ 25.00 hrs = $20.00 / hr</code></li>
                <li><code>Server A (10 hrs): 10 × $20.00/hr = $200.00</code></li>
                <li><code>Server B (7 hrs): 7 × $20.00/hr = $140.00</code></li>
                <li><code>Cashier (8 hrs): 8 × $20.00/hr = $160.00</code></li>
              </ul>
              Total distributed: <code>$200 + $140 + $160 = $500.00 (Differ: $0.00)</code>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-primary" style={{ padding: '8px 22px' }}>
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
