'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ArrowRight, Calculator } from 'lucide-react';

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
      x: -y * 8,
      y: x * 10,
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
        minHeight: 'calc(100vh - 40px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '32px 48px',
        overflow: 'hidden',
      }}
    >
      {/* Background ambient lighting */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          right: '20%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(93, 84, 230, 0.22) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(124, 102, 220, 0.16) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      {/* Main Split Hero Grid */}
      <div
        style={{
          maxWidth: '1360px',
          width: '100%',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(420px, 1.1fr) minmax(440px, 1.2fr)',
          alignItems: 'center',
          gap: '60px',
          zIndex: 10,
        }}
      >
        {/* Left Side Content */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          {/* Eyebrow */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '9999px',
              background: 'rgba(139, 142, 222, 0.12)',
              border: '1px solid rgba(139, 142, 222, 0.25)',
              color: '#c5c7e8',
              fontSize: '0.82rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '24px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#00e5a3',
                boxShadow: '0 0 8px #00e5a3',
              }}
            />
            Restaurant Tip Pooling Engine
          </div>

          {/* Headline (Matching COLORCODE typography) */}
          <h1
            style={{
              fontSize: 'clamp(2.8rem, 5vw, 4.2rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#ffffff',
              lineHeight: 1.08,
              marginBottom: '16px',
            }}
          >
            The new <br />
            Tip Calculator
          </h1>

          {/* Subheading / Tag */}
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#9ca3ff',
              marginBottom: '18px',
            }}
          >
            PRECISION POOLING ENGINE
          </div>

          {/* Body Description */}
          <p
            style={{
              fontSize: '1.05rem',
              color: '#c5c7e8',
              lineHeight: 1.6,
              maxWidth: '480px',
              marginBottom: '36px',
            }}
          >
            Configurable role weights, multi-channel tip pooling, and instant client-ready reporting engineered for flawless hospitality operations.
          </p>

          {/* Single Prominent Call-to-Action Button */}
          <button
            id="run-abacus-btn"
            onClick={onStart}
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '14px',
              padding: '16px 42px',
              background: '#0e0c24',
              color: '#ffffff',
              fontSize: '1.15rem',
              fontWeight: 600,
              borderRadius: '9999px',
              border: '1.5px solid rgba(156, 163, 255, 0.45)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5), 0 0 25px rgba(93, 84, 230, 0.4)',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.borderColor = '#9ca3ff';
              e.currentTarget.style.boxShadow = '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 35px rgba(108, 99, 255, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.borderColor = 'rgba(156, 163, 255, 0.45)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.5), 0 0 25px rgba(93, 84, 230, 0.4)';
            }}
          >
            <span>Run Abacus</span>
            <ArrowRight size={20} color="#9ca3ff" />
          </button>
        </div>

        {/* Right Side: 3D Art Composition & Calculator */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            perspective: '1200px',
            minHeight: '520px',
          }}
        >
          {/* Main 3D Card with interactive tilt */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '560px',
              height: '480px',
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              transition: 'transform 0.15s ease-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Background 3D Theme Reference Art Canvas */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 24px 60px rgba(9, 8, 22, 0.7), 0 0 40px rgba(93, 84, 230, 0.25)',
                border: '1px solid rgba(139, 142, 222, 0.25)',
                background: 'linear-gradient(135deg, #1d1b4a 0%, #151336 100%)',
              }}
            >
              <Image
                src="/images/colorcode_theme.jpg"
                alt="Colorcode Theme Geometry"
                fill
                priority
                style={{
                  objectFit: 'cover',
                  opacity: 0.65,
                  mixBlendMode: 'luminosity',
                }}
              />
            </div>

            {/* Floating 3D Calculator Asset with Gold Coins */}
            <div
              className="animate-float"
              style={{
                position: 'relative',
                zIndex: 20,
                width: '320px',
                height: '320px',
                filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 30px rgba(0, 229, 163, 0.25))',
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
              }}
              onClick={onStart}
            >
              <Image
                src="/images/calculator_3d.jpg"
                alt="3D Abacus Tip Calculator"
                width={320}
                height={320}
                priority
                style={{
                  borderRadius: '24px',
                  objectFit: 'contain',
                }}
              />

              {/* Floating Real-time Pill Badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '-12px',
                  right: '-12px',
                  background: 'rgba(18, 17, 42, 0.92)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(0, 229, 163, 0.4)',
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.5)',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#00e5a3',
                    boxShadow: '0 0 10px #00e5a3',
                  }}
                />
                Instant Calculation Engine
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
