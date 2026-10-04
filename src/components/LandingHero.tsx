'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface LandingHeroProps {
  onStart: () => void;
}

export function LandingHero({ onStart }: LandingHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 3D Automated Calculator Canvas Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 550);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Dynamic Calculation Cycle Sequence
    const calcSteps = [
      { mode: 'HOURS INGESTION', value: '275.65 hrs', sub: '51 Active Shifts Ingested', activeKey: 'AC' },
      { mode: 'TOTAL TIP POOL', value: '$2,118.87', sub: 'Collected + Other Sources', activeKey: '+' },
      { mode: 'RATE DERIVATION', value: '÷ 275.65', sub: '$2,118.87 Pool ÷ Hours', activeKey: '÷' },
      { mode: 'HOURLY TIP RATE', value: '$7.69 / hr', sub: 'Calculated Allocation Rate', activeKey: '=' },
      { mode: 'SERVER SHARE', value: '$1,059.44', sub: '50% Pool Distributed', activeKey: '%' },
      { mode: 'BARISTA SHARE', value: '$1,059.44', sub: '50% Pool Distributed', activeKey: '%' },
      { mode: 'NET SALES CYCLE', value: '$14,820.50', sub: 'Total Hospitality Volume', activeKey: '+' },
      { mode: 'RECONCILIATION', value: '100% BALANCED', sub: '$0.00 Variance Guaranteed', activeKey: '=' },
    ];

    let currentStepIdx = 0;
    let stepTimer = 0;
    let activeKeyHighlight = 'AC';
    let keyHighlightIntensity = 1;

    // Floating Tip Badges & Coins
    interface FloatingToken {
      x: number;
      y: number;
      z: number;
      orbitRadius: number;
      angle: number;
      speed: number;
      text: string;
      color: string;
      bg: string;
      type: 'badge' | 'coin';
    }

    const tokens: FloatingToken[] = [
      { x: 0, y: -60, z: 0, orbitRadius: 210, angle: 0.2, speed: 0.008, text: '+$45.50', color: '#00e5a3', bg: 'rgba(0, 229, 163, 0.15)', type: 'badge' },
      { x: 0, y: 40, z: 0, orbitRadius: 230, angle: 1.8, speed: 0.007, text: '+$120.00', color: '#f6c445', bg: 'rgba(246, 196, 69, 0.15)', type: 'badge' },
      { x: 0, y: -100, z: 0, orbitRadius: 190, angle: 3.2, speed: 0.009, text: 'Online: $460', color: '#9ca3ff', bg: 'rgba(108, 99, 255, 0.18)', type: 'badge' },
      { x: 0, y: 70, z: 0, orbitRadius: 240, angle: 4.5, speed: 0.006, text: 'Kiosk: $184', color: '#00e5a3', bg: 'rgba(0, 229, 163, 0.15)', type: 'badge' },
      { x: 0, y: -20, z: 0, orbitRadius: 200, angle: 5.7, speed: 0.008, text: 'DoorDash: $310', color: '#ff9c9c', bg: 'rgba(255, 95, 109, 0.15)', type: 'badge' },
      { x: 0, y: -80, z: 0, orbitRadius: 180, angle: 2.4, speed: 0.01, text: '$', color: '#f6c445', bg: 'rgba(246, 196, 69, 0.3)', type: 'coin' },
      { x: 0, y: 90, z: 0, orbitRadius: 220, angle: 0.9, speed: 0.009, text: '%', color: '#00e5a3', bg: 'rgba(0, 229, 163, 0.3)', type: 'coin' },
      { x: 0, y: 10, z: 0, orbitRadius: 215, angle: 3.9, speed: 0.007, text: '∑', color: '#9ca3ff', bg: 'rgba(108, 99, 255, 0.3)', type: 'coin' },
    ];

    // Keypad layout definition (4 cols x 5 rows)
    const keys = [
      ['AC', '±', '%', '÷'],
      ['7', '8', '9', '×'],
      ['4', '5', '6', '-'],
      ['1', '2', '3', '+'],
      ['0', '.', 'AUTO', '='],
    ];

    let rotX = 0.38;
    let rotY = -0.32;
    let targetRotX = 0.38;
    let targetRotY = -0.32;
    let time = 0;

    const render = () => {
      time++;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Automated step transition every ~160 frames (~2.6s)
      stepTimer++;
      if (stepTimer > 160) {
        stepTimer = 0;
        currentStepIdx = (currentStepIdx + 1) % calcSteps.length;
        activeKeyHighlight = calcSteps[currentStepIdx].activeKey;
        keyHighlightIntensity = 1;
      }
      keyHighlightIntensity = Math.max(0.2, keyHighlightIntensity - 0.015);

      // Smooth inertia rotation & mouse tracking
      rotX += (targetRotX - rotX) * 0.05;
      rotY += (targetRotY - rotY) * 0.05;

      // Bobbing floating height
      const bobY = Math.sin(time * 0.03) * 12;

      // 3D Matrix Helpers
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const rotate3D = (x: number, y: number, z: number): [number, number, number] => {
        // Rotate Y
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;
        // Rotate X
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;
        return [x1, y2, z2];
      };

      const project = (x: number, y: number, z: number): [number, number, number] => {
        const distance = 800;
        const fov = distance / (distance + z);
        return [centerX + x * fov, centerY + (y + bobY) * fov, fov];
      };

      // 1. Draw glowing ambient background radial
      const bgGlow = ctx.createRadialGradient(centerX, centerY, 20, centerX, centerY, 320);
      bgGlow.addColorStop(0, 'rgba(108, 99, 255, 0.22)');
      bgGlow.addColorStop(0.4, 'rgba(0, 229, 163, 0.08)');
      bgGlow.addColorStop(1, 'rgba(18, 17, 42, 0)');
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw soft 3D orbital trajectory rings
      ctx.save();
      ctx.strokeStyle = 'rgba(139, 142, 222, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + bobY * 0.5, 260, 110, rotY * 0.6, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 229, 163, 0.1)';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + bobY * 0.5, 230, 85, -rotX * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 3. Render 3D Calculator Chassis
      const cw = 210; // width
      const ch = 310; // height
      const cd = 32;  // depth (thickness)
      const hw = cw / 2;
      const hh = ch / 2;
      const hd = cd / 2;

      // Calculator Chassis Vertices
      // Top face: -hd, Bottom face: +hd
      const topCorners: [number, number, number][] = [
        [-hw, -hh, -hd],
        [hw, -hh, -hd],
        [hw, hh, -hd],
        [-hw, hh, -hd],
      ];
      const botCorners: [number, number, number][] = [
        [-hw, -hh, hd],
        [hw, -hh, hd],
        [hw, hh, hd],
        [-hw, hh, hd],
      ];

      const pTop = topCorners.map(([x, y, z]) => {
        const [rx, ry, rz] = rotate3D(x, y, z);
        return project(rx, ry, rz);
      });
      const pBot = botCorners.map(([x, y, z]) => {
        const [rx, ry, rz] = rotate3D(x, y, z);
        return project(rx, ry, rz);
      });

      // Bottom Shadow
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + 160 + bobY * 0.2, 160, 48, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.filter = 'blur(16px)';
      ctx.fill();
      ctx.restore();

      // Side Wall: Right Edge (pTop[1] -> pBot[1] -> pBot[2] -> pTop[2])
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pTop[1][0], pTop[1][1]);
      ctx.lineTo(pBot[1][0], pBot[1][1]);
      ctx.lineTo(pBot[2][0], pBot[2][1]);
      ctx.lineTo(pTop[2][0], pTop[2][1]);
      ctx.closePath();
      const rightGrad = ctx.createLinearGradient(pTop[1][0], pTop[1][1], pBot[2][0], pBot[2][1]);
      rightGrad.addColorStop(0, '#100e28');
      rightGrad.addColorStop(1, '#080718');
      ctx.fillStyle = rightGrad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(108, 99, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Side Wall: Bottom Front Edge (pTop[2] -> pBot[2] -> pBot[3] -> pTop[3])
      ctx.beginPath();
      ctx.moveTo(pTop[2][0], pTop[2][1]);
      ctx.lineTo(pBot[2][0], pBot[2][1]);
      ctx.lineTo(pBot[3][0], pBot[3][1]);
      ctx.lineTo(pTop[3][0], pTop[3][1]);
      ctx.closePath();
      const frontGrad = ctx.createLinearGradient(pTop[2][0], pTop[2][1], pBot[3][0], pBot[3][1]);
      frontGrad.addColorStop(0, '#131133');
      frontGrad.addColorStop(1, '#09081a');
      ctx.fillStyle = frontGrad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 229, 163, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Top Face of Calculator Chassis (Main Surface)
      ctx.beginPath();
      ctx.moveTo(pTop[0][0], pTop[0][1]);
      ctx.lineTo(pTop[1][0], pTop[1][1]);
      ctx.lineTo(pTop[2][0], pTop[2][1]);
      ctx.lineTo(pTop[3][0], pTop[3][1]);
      ctx.closePath();
      const topGrad = ctx.createLinearGradient(pTop[0][0], pTop[0][1], pTop[2][0], pTop[2][1]);
      topGrad.addColorStop(0, '#1d194c');
      topGrad.addColorStop(0.5, '#17143e');
      topGrad.addColorStop(1, '#110f2f');
      ctx.fillStyle = topGrad;
      ctx.fill();

      // Glowing Rim around Top Face
      ctx.strokeStyle = 'rgba(108, 99, 255, 0.55)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#6c63ff';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // Helper function to project a point on top surface (local x, y on top face)
      const projectTopPoint = (lx: number, ly: number): [number, number, number] => {
        const [rx, ry, rz] = rotate3D(lx, ly, -hd - 2);
        return project(rx, ry, rz);
      };

      // 4. Render Digital LED Display Screen on Top Surface
      const scrW = 176;
      const scrH = 82;
      const scrY = -hh + 54;
      const pScrTL = projectTopPoint(-scrW / 2, scrY - scrH / 2);
      const pScrTR = projectTopPoint(scrW / 2, scrY - scrH / 2);
      const pScrBR = projectTopPoint(scrW / 2, scrY + scrH / 2);
      const pScrBL = projectTopPoint(-scrW / 2, scrY + scrH / 2);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pScrTL[0], pScrTL[1]);
      ctx.lineTo(pScrTR[0], pScrTR[1]);
      ctx.lineTo(pScrBR[0], pScrBR[1]);
      ctx.lineTo(pScrBL[0], pScrBL[1]);
      ctx.closePath();
      const scrGrad = ctx.createLinearGradient(pScrTL[0], pScrTL[1], pScrBR[0], pScrBR[1]);
      scrGrad.addColorStop(0, '#09081a');
      scrGrad.addColorStop(1, '#0e0c24');
      ctx.fillStyle = scrGrad;
      ctx.fill();

      // Neon Cyan Screen Border Glow
      ctx.strokeStyle = 'rgba(0, 229, 163, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#00e5a3';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Screen Header Text (Mode & Dot)
      const pScrHeader = projectTopPoint(-scrW / 2 + 10, scrY - scrH / 2 + 14);
      const step = calcSteps[currentStepIdx];
      const avgFov = pScrTL[2];

      ctx.font = `700 ${Math.max(8, 9 * avgFov)}px Inter, sans-serif`;
      ctx.fillStyle = '#00e5a3';
      ctx.fillText(`●  ${step.mode}`, pScrHeader[0], pScrHeader[1]);

      // Screen Main Value (Illuminated Dynamic Result)
      const pScrValue = projectTopPoint(scrW / 2 - 12, scrY + 5);
      ctx.font = `800 ${Math.max(14, 18 * avgFov)}px Inter, sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
      ctx.shadowBlur = 10;
      ctx.fillText(step.value, pScrValue[0], pScrValue[1]);
      ctx.shadowBlur = 0;

      // Screen Subtitle
      const pScrSub = projectTopPoint(scrW / 2 - 12, scrY + 24);
      ctx.font = `500 ${Math.max(8, 9.5 * avgFov)}px Inter, sans-serif`;
      ctx.fillStyle = '#9ca3ff';
      ctx.fillText(step.sub, pScrSub[0], pScrSub[1]);
      ctx.textAlign = 'left';
      ctx.restore();

      // 5. Render 3D Keypad Buttons on Top Surface
      const keyGridStartX = -scrW / 2 + 18;
      const keyGridStartY = scrY + scrH / 2 + 22;
      const keySpacingX = 46;
      const keySpacingY = 28;
      const keyBtnW = 38;
      const keyBtnH = 22;

      keys.forEach((row, rIdx) => {
        row.forEach((label, cIdx) => {
          let kx = keyGridStartX + cIdx * keySpacingX;
          let ky = keyGridStartY + rIdx * keySpacingY;
          let kw = keyBtnW;

          // Double width for 0 or special key
          if (label === '0') {
            kw = keyBtnW * 1.6;
          } else if (label === '.') {
            kx += 12;
          } else if (label === 'AUTO') {
            kx += 12;
          } else if (label === '=') {
            kx += 12;
          }

          const kTL = projectTopPoint(kx - kw / 2, ky - keyBtnH / 2);
          const kTR = projectTopPoint(kx + kw / 2, ky - keyBtnH / 2);
          const kBR = projectTopPoint(kx + kw / 2, ky + keyBtnH / 2);
          const kBL = projectTopPoint(kx - kw / 2, ky + keyBtnH / 2);

          const isAction = ['÷', '×', '-', '+', '='].includes(label);
          const isClear = label === 'AC';
          const isHighlighted = label === activeKeyHighlight;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(kTL[0], kTL[1]);
          ctx.lineTo(kTR[0], kTR[1]);
          ctx.lineTo(kBR[0], kBR[1]);
          ctx.lineTo(kBL[0], kBL[1]);
          ctx.closePath();

          if (isHighlighted) {
            ctx.fillStyle = `rgba(0, 229, 163, ${0.4 + keyHighlightIntensity * 0.45})`;
            ctx.shadowColor = '#00e5a3';
            ctx.shadowBlur = 12 * keyHighlightIntensity;
          } else if (isAction) {
            ctx.fillStyle = 'rgba(93, 84, 230, 0.4)';
          } else if (isClear) {
            ctx.fillStyle = 'rgba(255, 95, 109, 0.3)';
          } else {
            ctx.fillStyle = 'rgba(30, 27, 74, 0.8)';
          }
          ctx.fill();

          ctx.strokeStyle = isHighlighted
            ? '#00e5a3'
            : isAction
            ? 'rgba(108, 99, 255, 0.55)'
            : 'rgba(139, 142, 222, 0.25)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Button Label
          const kCenter = projectTopPoint(kx, ky + 4);
          ctx.font = `700 ${Math.max(8, 10 * kTL[2])}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillStyle = isHighlighted ? '#ffffff' : isAction ? '#9ca3ff' : '#c5c7e8';
          ctx.fillText(label, kCenter[0], kCenter[1]);
          ctx.restore();
        });
      });

      // 6. Render Floating 3D Tip Badges and Coins in Orbit
      tokens.forEach((t) => {
        t.angle += t.speed;
        const tx = Math.cos(t.angle) * t.orbitRadius;
        const tz = Math.sin(t.angle) * t.orbitRadius;

        const [rx, ry, rz] = rotate3D(tx, t.y, tz);
        const [px, py, fov] = project(rx, ry, rz);

        ctx.save();
        if (t.type === 'coin') {
          // 3D Coin
          ctx.beginPath();
          ctx.arc(px, py, 14 * fov, 0, Math.PI * 2);
          ctx.fillStyle = t.bg;
          ctx.shadowColor = t.color;
          ctx.shadowBlur = 10 * fov;
          ctx.fill();

          ctx.strokeStyle = t.color;
          ctx.lineWidth = 1.5 * fov;
          ctx.stroke();

          ctx.font = `800 ${Math.max(10, 14 * fov)}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(t.text, px, py);
        } else {
          // Floating Pill Badge
          ctx.font = `700 ${Math.max(9, 11 * fov)}px Inter, sans-serif`;
          const textMetrics = ctx.measureText(t.text);
          const bw = textMetrics.width + 16 * fov;
          const bh = 22 * fov;

          ctx.beginPath();
          ctx.roundRect(px - bw / 2, py - bh / 2, bw, bh, 9999);
          ctx.fillStyle = t.bg;
          ctx.shadowColor = t.color;
          ctx.shadowBlur = 8 * fov;
          ctx.fill();

          ctx.strokeStyle = t.color;
          ctx.lineWidth = 1.2 * fov;
          ctx.stroke();

          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(t.text, px, py);
        }
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Mouse movement interaction for 3D perspective tilt
    const handleCanvasMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY = -0.32 + nx * 0.8;
      targetRotX = 0.38 - ny * 0.6;
    };

    window.addEventListener('mousemove', handleCanvasMouseMove);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleCanvasMouseMove);
    };
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '36px 48px',
        background: 'radial-gradient(ellipse at 80% 20%, #1d1b4a 0%, #12112a 60%, #0d0c1e 100%)',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Brand Bar */}
      <div
        style={{
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontSize: '1.45rem',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              color: '#ffffff',
            }}
          >
            ABACUS
          </span>
          <span
            style={{
              fontSize: '0.72rem',
              padding: '3px 8px',
              borderRadius: '6px',
              background: 'rgba(93, 84, 230, 0.2)',
              border: '1px solid rgba(108, 99, 255, 0.35)',
              color: '#9ca3ff',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Tip Calculator
          </span>
        </div>
      </div>

      {/* Main Split Hero Grid */}
      <div
        style={{
          maxWidth: '1400px',
          width: '100%',
          margin: 'auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(400px, 1fr) minmax(420px, 1fr)',
          alignItems: 'center',
          gap: '40px',
          zIndex: 10,
          padding: '24px 0',
        }}
      >
        {/* Left Column: Headlines & CTA */}
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
              marginBottom: '20px',
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

          {/* Headline */}
          <h1
            style={{
              fontSize: 'clamp(2.8rem, 5.2vw, 4.2rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#ffffff',
              lineHeight: 1.08,
              marginBottom: '16px',
            }}
          >
            The Restaurant <br />
            Tip Calculator
          </h1>

          {/* Subheading */}
          <div
            style={{
              fontSize: '0.98rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#9ca3ff',
              marginBottom: '18px',
            }}
          >
            ABACUS POOLING ENGINE
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

          {/* Prominent Call-to-Action Button */}
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

        {/* Right Column: Automated 3D Animated Tip Calculator */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '540px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              filter: 'drop-shadow(0 24px 48px rgba(0, 0, 0, 0.7))',
            }}
          />
        </div>
      </div>

      {/* Bottom Subtle Indicator (Cleaned of Version 1.0) */}
      <div
        style={{
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.8rem',
          color: '#8e91be',
          zIndex: 20,
        }}
      >
        <span>Deterministic Multi-Unit Allocation</span>
      </div>
    </div>
  );
}
