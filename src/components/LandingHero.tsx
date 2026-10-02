'use client';

import React, { useState } from 'react';
import { Calculator, ArrowRight } from 'lucide-react';
import { Interactive3DAbacus } from './Interactive3DAbacus';

interface LandingHeroProps {
  onStart: () => void;
}

export function LandingHero({ onStart }: LandingHeroProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      x: -y * 12, // tilt X based on vertical mouse
      y: x * 14,  // tilt Y based on horizontal mouse
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 76px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '24px 20px',
      }}
    >
      {/* Interactive 3D Abacus Background */}
      <Interactive3DAbacus />

      {/* Central 3D Focus Card with Reactive Mouse Tilt */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          maxWidth: '520px',
          width: '100%',
          padding: '48px 36px',
          background: 'rgba(30, 41, 59, 0.72)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(16, 185, 129, 0.12)',
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: 'transform 0.15s ease-out, box-shadow 0.25s ease',
        }}
      >
        {/* Sleek Abacus Emblem */}
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.35)',
            marginBottom: '22px',
          }}
        >
          <Calculator size={34} />
        </div>

        {/* Brand Name & Purpose */}
        <h1
          style={{
            fontSize: '2.9rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#ffffff',
            lineHeight: 1.1,
            marginBottom: '8px',
          }}
        >
          ABACUS
        </h1>
        <p
          style={{
            fontSize: '1.05rem',
            color: '#94a3b8',
            fontWeight: 500,
            marginBottom: '38px',
          }}
        >
          Restaurant Tip Calculator
        </p>

        {/* Prominent Primary Action Button */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            id="run-abacus-btn"
            onClick={onStart}
            type="button"
            className="btn-primary"
            style={{
              padding: '18px 48px',
              fontSize: '1.18rem',
              fontWeight: 700,
              letterSpacing: '0.01em',
              borderRadius: '9999px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.45)',
              position: 'relative',
              zIndex: 20,
              pointerEvents: 'auto',
            }}
          >
            <Calculator size={22} />
            <span>Run Abacus</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
