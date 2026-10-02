'use client';

import React, { useEffect, useRef } from 'react';

export function Interactive3DAbacus() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Smooth 3D camera rotation with spring damping
    let targetRotX = 0.12;
    let targetRotY = 0;
    let curRotX = 0.12;
    let curRotY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / width - 0.5;
      const y = (e.clientY - rect.top) / height - 0.5;
      targetRotY = x * 0.65;
      targetRotX = 0.12 - y * 0.45;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 1. 3D Rotating Golden / Platinum Currency Tokens (Restaurant Coins)
    interface Coin3D {
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      rotX: number;
      rotY: number;
      rotSpeedX: number;
      rotSpeedY: number;
      radius: number;
      type: 'gold' | 'sapphire' | 'cyan';
    }

    const coins: Coin3D[] = [];
    for (let i = 0; i < 18; i++) {
      coins.push({
        x: (Math.random() - 0.5) * 1100,
        y: (Math.random() - 0.5) * 750,
        z: (Math.random() - 0.5) * 500,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.15 - Math.random() * 0.25,
        vz: (Math.random() - 0.5) * 0.3,
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
        rotSpeedX: 0.015 + Math.random() * 0.02,
        rotSpeedY: 0.02 + Math.random() * 0.025,
        radius: 18 + Math.random() * 12,
        type: i % 3 === 0 ? 'gold' : i % 3 === 1 ? 'sapphire' : 'cyan',
      });
    }

    // 2. 3D Floating Restaurant Calculation Data Streams (Receipt amounts, hourly rates)
    interface CalcStream {
      x: number;
      y: number;
      z: number;
      text: string;
      speedY: number;
      alpha: number;
      size: number;
    }

    const tipDataTokens = [
      '$172.38', '275.65 hrs', '$7.69/hr', '$2,118.87',
      '$64.53', '$104.72', '100% Equal', '$314.82',
      '$490.91', '44.86 hrs', '$430.03', '$405.95',
      'WebDash Tips', 'DoorDash', 'Mission Hill', '$98.67',
    ];

    const streams: CalcStream[] = [];
    for (let i = 0; i < 28; i++) {
      streams.push({
        x: (Math.random() - 0.5) * 1200,
        y: (Math.random() - 0.5) * 800,
        z: (Math.random() - 0.5) * 550,
        text: tipDataTokens[i % tipDataTokens.length],
        speedY: -0.2 - Math.random() * 0.35,
        alpha: 0.18 + Math.random() * 0.28,
        size: 11 + Math.random() * 4,
      });
    }

    // 3. 3D Soroban Abacus Frame & Floating Kinetic Sapphire Beads
    const numRods = 9;
    const rodSpacing = 56;
    const rodLength = 360;
    const dividerY = -rodLength / 2 + 80;

    interface Bead {
      rodIndex: number;
      isUpper: boolean;
      deckIndex: number;
      restY: number;
      activeY: number;
      currentY: number;
      targetY: number;
      radius: number;
      hue: number;
    }

    const beads: Bead[] = [];
    for (let r = 0; r < numRods; r++) {
      // Upper deck bead
      const upperRest = -rodLength / 2 + 30;
      const upperActive = dividerY - 24;
      beads.push({
        rodIndex: r,
        isUpper: true,
        deckIndex: 0,
        restY: upperRest,
        activeY: upperActive,
        currentY: upperRest,
        targetY: upperRest,
        radius: 16,
        hue: 220 + r * 5, // Royal blue to indigo
      });

      // Lower deck 4 beads
      for (let b = 0; b < 4; b++) {
        const lowerRest = rodLength / 2 - 28 - (3 - b) * 36;
        const lowerActive = dividerY + 24 + b * 36;
        beads.push({
          rodIndex: r,
          isUpper: false,
          deckIndex: b,
          restY: lowerRest,
          activeY: lowerActive,
          currentY: lowerRest,
          targetY: lowerRest,
          radius: 16,
          hue: 230 + r * 4, // Deep sapphire to cyan
        });
      }
    }

    // 3D Projection Engine
    const fov = 500;
    const project = (x: number, y: number, z: number) => {
      const cosY = Math.cos(curRotY);
      const sinY = Math.sin(curRotY);
      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;

      const cosX = Math.cos(curRotX);
      const sinX = Math.sin(curRotX);
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      const depth = z2 + 750;
      const scale = fov / Math.max(depth, 10);
      const px = width / 2 + x1 * scale;
      const py = height / 2 + y2 * scale;

      return { px, py, scale, depth };
    };

    let tick = 0;

    const render = () => {
      tick += 0.016;
      curRotX += (targetRotX - curRotX) * 0.05;
      curRotY += (targetRotY - curRotY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Deep, luminous ambient vignette (Indigo & Sapphire glow)
      const bgGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        50,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75
      );
      bgGrad.addColorStop(0, 'rgba(79, 70, 229, 0.08)');
      bgGrad.addColorStop(0.4, 'rgba(6, 182, 212, 0.04)');
      bgGrad.addColorStop(1, 'rgba(10, 14, 23, 0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      interface RenderItem {
        depth: number;
        draw: () => void;
      }
      const renderQueue: RenderItem[] = [];

      // 1. Draw 3D Floating Restaurant & Tip Data Streams
      streams.forEach((s) => {
        s.y += s.speedY;
        if (s.y < -450) s.y = 450;

        const pr = project(s.x, s.y, s.z);
        if (pr.scale > 0) {
          renderQueue.push({
            depth: pr.depth + 150,
            draw: () => {
              ctx.save();
              ctx.fillStyle = `rgba(148, 163, 184, ${s.alpha * Math.min(pr.scale * 1.3, 0.9)})`;
              ctx.font = `600 ${Math.floor(s.size * pr.scale)}px "JetBrains Mono", monospace`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(s.text, pr.px, pr.py);
              ctx.restore();
            },
          });
        }
      });

      // 2. Draw 3D Rotating Gold & Sapphire Currency Coins
      coins.forEach((c) => {
        c.x += c.vx;
        c.y += c.vy;
        c.z += c.vz;
        c.rotX += c.rotSpeedX;
        c.rotY += c.rotSpeedY;

        if (c.y < -420) c.y = 420;
        if (c.x < -600) c.x = 600;
        if (c.x > 600) c.x = -600;

        const pr = project(c.x, c.y, c.z);
        if (pr.scale > 0) {
          renderQueue.push({
            depth: pr.depth,
            draw: () => {
              const r = c.radius * pr.scale;
              if (r <= 0) return;

              ctx.save();
              ctx.translate(pr.px, pr.py);

              // 3D coin spin squish
              const scaleX = Math.cos(c.rotY);
              const scaleY = Math.sin(c.rotX);

              ctx.scale(Math.abs(scaleX) * 0.85 + 0.15, 1);

              const coinGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.3, r * 0.05, 0, 0, r);
              if (c.type === 'gold') {
                coinGrad.addColorStop(0, '#fef08a');
                coinGrad.addColorStop(0.3, '#f59e0b');
                coinGrad.addColorStop(0.8, '#b45309');
                coinGrad.addColorStop(1, '#78350f');
              } else if (c.type === 'sapphire') {
                coinGrad.addColorStop(0, '#e0e7ff');
                coinGrad.addColorStop(0.3, '#6366f1');
                coinGrad.addColorStop(0.8, '#4338ca');
                coinGrad.addColorStop(1, '#1e1b4b');
              } else {
                coinGrad.addColorStop(0, '#cffafe');
                coinGrad.addColorStop(0.3, '#06b6d4');
                coinGrad.addColorStop(0.8, '#0e7490');
                coinGrad.addColorStop(1, '#164e63');
              }

              ctx.beginPath();
              ctx.arc(0, 0, r, 0, Math.PI * 2);
              ctx.fillStyle = coinGrad;
              ctx.shadowColor = c.type === 'gold' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(99, 102, 241, 0.3)';
              ctx.shadowBlur = 12 * pr.scale;
              ctx.fill();

              // Coin inner dollar stamp
              ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
              ctx.font = `bold ${Math.floor(r * 0.9)}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('$', 0, 0);

              ctx.restore();
            },
          });
        }
      });

      // 3. Draw 3D Soroban Abacus Chassis & Kinetic Sliding Beads
      const frameW = (numRods - 1) * rodSpacing + 70;
      const frameH = rodLength + 50;
      const beamZ = -50;
      const leftX = -frameW / 2;
      const rightX = frameW / 2;
      const topY = -frameH / 2;
      const bottomY = frameH / 2;

      // Chrome Rods
      for (let r = 0; r < numRods; r++) {
        const rodX = (r - (numRods - 1) / 2) * rodSpacing;
        const pTop = project(rodX, -rodLength / 2, beamZ);
        const pBottom = project(rodX, rodLength / 2, beamZ);

        renderQueue.push({
          depth: (pTop.depth + pBottom.depth) / 2,
          draw: () => {
            ctx.beginPath();
            ctx.moveTo(pTop.px, pTop.py);
            ctx.lineTo(pBottom.px, pBottom.py);
            ctx.strokeStyle = 'rgba(203, 213, 225, 0.25)';
            ctx.lineWidth = Math.max(2 * pTop.scale, 1);
            ctx.stroke();
          },
        });
      }

      // Titanium Chassis Beams
      const pTL = project(leftX, topY, beamZ);
      const pTR = project(rightX, topY, beamZ);
      const pBL = project(leftX, bottomY, beamZ);
      const pBR = project(rightX, bottomY, beamZ);
      const pDL = project(leftX, dividerY, beamZ);
      const pDR = project(rightX, dividerY, beamZ);

      renderQueue.push({
        depth: (pTL.depth + pBR.depth) / 2 + 10,
        draw: () => {
          // Outer Frame
          ctx.beginPath();
          ctx.moveTo(pTL.px, pTL.py);
          ctx.lineTo(pTR.px, pTR.py);
          ctx.lineTo(pBR.px, pBR.py);
          ctx.lineTo(pBL.px, pBL.py);
          ctx.closePath();
          ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
          ctx.lineWidth = Math.max(3.2 * pTL.scale, 1.5);
          ctx.stroke();

          // Divider Beam
          ctx.beginPath();
          ctx.moveTo(pDL.px, pDL.py);
          ctx.lineTo(pDR.px, pDR.py);
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
          ctx.lineWidth = Math.max(3.5 * pDL.scale, 1.8);
          ctx.stroke();
        },
      });

      // Kinetic Sapphire & Cyan Beads
      beads.forEach((bead) => {
        const rodX = (bead.rodIndex - (numRods - 1) / 2) * rodSpacing;

        // Wave kinetic slide
        const wave = Math.sin(tick * 1.6 + bead.rodIndex * 0.8);
        const shouldActivate = wave > 0.3;
        bead.targetY = shouldActivate ? bead.activeY : bead.restY;
        bead.currentY += (bead.targetY - bead.currentY) * 0.08;

        const p = project(rodX, bead.currentY, beamZ);

        renderQueue.push({
          depth: p.depth,
          draw: () => {
            const radX = bead.radius * p.scale;
            const radY = bead.radius * 0.72 * p.scale;
            if (radX <= 0 || radY <= 0) return;

            ctx.save();
            ctx.translate(p.px, p.py);

            const beadGrad = ctx.createRadialGradient(
              -radX * 0.25,
              -radY * 0.35,
              radX * 0.05,
              0,
              0,
              radX
            );
            beadGrad.addColorStop(0, '#ffffff');
            beadGrad.addColorStop(0.25, `hsl(${bead.hue}, 85%, 68%)`);
            beadGrad.addColorStop(0.75, `hsl(${bead.hue}, 80%, 45%)`);
            beadGrad.addColorStop(1, `hsl(${bead.hue}, 90%, 20%)`);

            ctx.beginPath();
            ctx.ellipse(0, 0, radX, radY, 0, 0, Math.PI * 2);
            ctx.fillStyle = beadGrad;
            ctx.shadowColor = `hsla(${bead.hue}, 85%, 60%, 0.4)`;
            ctx.shadowBlur = 12 * p.scale;
            ctx.fill();

            // Rim highlight
            ctx.beginPath();
            ctx.ellipse(0, 0, radX, radY, 0, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.restore();
          },
        });
      });

      // Painter's algorithm sort
      renderQueue.sort((a, b) => b.depth - a.depth);
      renderQueue.forEach((item) => item.draw());

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}
