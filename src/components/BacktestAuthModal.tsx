'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Lock, X, AlertCircle, ArrowRight } from 'lucide-react';

interface BacktestAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BacktestAuthModal({
  isOpen,
  onClose,
  onSuccess,
}: BacktestAuthModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus input whenever modal opens & reset state
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle escape key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Required password: "Go Berserk"
    if (password === 'Go Berserk' || password.trim() === 'Go Berserk') {
      setError(null);
      setPassword('');
      onSuccess();
    } else {
      setError('Incorrect password. Please try again.');
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  };

  return (
    <div
      id="backtest-auth-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(9, 8, 22, 0.76)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        id="backtest-auth-modal"
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(21, 18, 51, 0.88)',
          border: '1px solid rgba(139, 142, 222, 0.28)',
          borderRadius: '18px',
          padding: '32px 28px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65), 0 0 35px rgba(108, 99, 255, 0.22)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Close Button */}
        <button
          id="close-backtest-auth-btn"
          type="button"
          onClick={onClose}
          aria-label="Close authentication popup"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(139, 142, 222, 0.1)',
            border: '1px solid rgba(139, 142, 222, 0.2)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#c5c7e8',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(139, 142, 222, 0.22)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(139, 142, 222, 0.1)';
            e.currentTarget.style.color = '#c5c7e8';
          }}
        >
          <X size={16} />
        </button>

        {/* Lock Icon */}
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'rgba(108, 99, 255, 0.18)',
            border: '1px solid rgba(108, 99, 255, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3ff',
            marginBottom: '18px',
            boxShadow: '0 0 20px rgba(108, 99, 255, 0.25)',
          }}
        >
          <Lock size={26} />
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            margin: '0 0 6px 0',
          }}
        >
          Run a Backtest
        </h2>

        {/* Description */}
        <p
          style={{
            fontSize: '0.88rem',
            color: '#c5c7e8',
            margin: '0 0 24px 0',
            lineHeight: 1.45,
          }}
        >
          Enter the access password to run the backtest engine.
        </p>

        {/* Password Form */}
        <form
          onSubmit={handleSubmit}
          style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
            <input
              ref={inputRef}
              id="backtest-password-input"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter password"
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '13px 16px',
                borderRadius: '12px',
                background: 'rgba(14, 12, 36, 0.8)',
                border: error
                  ? '1.5px solid #ff5f6d'
                  : '1.5px solid rgba(139, 142, 222, 0.28)',
                color: '#ffffff',
                fontSize: '0.98rem',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxShadow: error
                  ? '0 0 12px rgba(255, 95, 109, 0.3)'
                  : 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
              }}
              onFocus={(e) => {
                if (!error) {
                  e.currentTarget.style.borderColor = 'var(--accent-primary, #6c63ff)';
                  e.currentTarget.style.boxShadow = '0 0 16px rgba(108, 99, 255, 0.35)';
                }
              }}
              onBlur={(e) => {
                if (!error) {
                  e.currentTarget.style.borderColor = 'rgba(139, 142, 222, 0.28)';
                  e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.3)';
                }
              }}
            />

            {/* Error Message */}
            {error && (
              <div
                id="backtest-auth-error-msg"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#ff5f6d',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  marginTop: '4px',
                  paddingLeft: '2px',
                }}
              >
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Continue / Run Button */}
          <button
            id="backtest-auth-submit-btn"
            type="submit"
            style={{
              width: '100%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '13px 24px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6c63ff 0%, #4f46e5 100%)',
              color: '#ffffff',
              fontSize: '0.98rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(108, 99, 255, 0.4)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(108, 99, 255, 0.55)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(108, 99, 255, 0.4)';
            }}
          >
            <span>Continue/Run</span>
            <ArrowRight size={17} />
          </button>
        </form>
      </div>
    </div>
  );
}
