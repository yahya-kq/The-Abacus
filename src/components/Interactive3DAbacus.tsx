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

    // Mouse coordinates for 3D camera tilt
    let targetRotX = 0.15;
    let targetRotY = 0;
    let curRotX = 0.15;
    let curRotY = 0;
    let mouseCanvasX = width / 2;
    let mouseCanvasY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / width - 0.5;
      const y = (e.clientY - rect.top) / height - 0.5;
      mouseCanvasX = e.clientX - rect.left;
      mouseCanvasY = e.clientY - rect.top;
      targetRotY = x * 0.7;
      targetRotX = 0.15 - y * 0.5;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Abacus Structural Configuration (Soroban: 7 rods, 1 upper deck bead, 4 lower deck beads)
    const numRods = 9;
    const rodSpacing = 54;
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
      // Upper deck bead (value = 5)
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
        hue: 160 + r * 6,
      });

      // Lower deck 4 beads (value = 1 each)
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
          hue: 160 + r * 6,
        });
      }
    }

    // 3D Ambient Math Particles (floating calculation nodes)
    interface MathParticle {
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      size: number;
      symbol?: string;
      alpha: number;
    }

    const symbols = ['$', '%', '+', '=', '•', '0', '1', '7', '9'];
    const particles: MathParticle[] = [];
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 1200,
        y: (Math.random() - 0.5) * 800,
        z: (Math.random() - 0.5) * 600,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.3,
        vz: (Math.random() - 0.5) * 0.4,
        size: 10 + Math.random() * 8,
        symbol: symbols[i % symbols.length],
        alpha: 0.15 + Math.random() * 0.25,
      });
    }

    // 3D Perspective Projection Function
    const fov = 480;
    const project = (x: number, y: number, z: number) => {
      // Rotation around Y
      const cosY = Math.cos(curRotY);
      const sinY = Math.sin(curRotY);
      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;

      // Rotation around X
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
      curRotX += (targetRotX - curRotX) * 0.04;
      curRotY += (targetRotY - curRotY) * 0.04;

      ctx.clearRect(0, 0, width, height);

      // Deep, luminous ambient vignette
      const bgGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        40,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.7
      );
      bgGrad.addColorStop(0, 'rgba(16, 185, 129, 0.06)');
      bgGrad.addColorStop(0.4, 'rgba(30, 41, 59, 0.04)');
      bgGrad.addColorStop(1, 'rgba(11, 15, 25, 0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Render Queue for Painter's Algorithm (Depth Sort)
      interface Renderable {
        depth: number;
        draw: () => void;
      }
      const renderQueue: Renderable[] = [];

      // 1. Render Floating Ambient Particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        if (p.y < -450) p.y = 450;
        if (p.y > 450) p.y = -450;
        if (p.x < -650) p.x = 650;
        if (p.x > 650) p.x = -650;

        const pr = project(p.x, p.y, p.z);
        if (pr.scale > 0) {
          renderQueue.push({
            depth: pr.depth + 100,
            draw: () => {
              ctx.save();
              ctx.fillStyle = `rgba(148, 163, 184, ${p.alpha * Math.min(pr.scale * 1.2, 1)})`;
              ctx.font = `${Math.floor(p.size * pr.scale)}px "JetBrains Mono", monospace`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(p.symbol || '•', pr.px, pr.py);
              ctx.restore();
            },
          });
        }
      });

      // 2. Abacus Frame Geometry
      const frameW = (numRods - 1) * rodSpacing + 70;
      const frameH = rodLength + 50;
      const beamZ = 0;
      const leftX = -frameW / 2;
      const rightX = frameW / 2;
      const topY = -frameH / 2;
      const bottomY = frameH / 2;

      // Draw Rods
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
            ctx.strokeStyle = 'rgba(203, 213, 225, 0.22)';
            ctx.lineWidth = Math.max(1.8 * pTop.scale, 1);
            ctx.stroke();
          },
        });
      }

      // Draw Outer Frame Beams & Divider
      const pTL = project(leftX, topY, beamZ);
      const pTR = project(rightX, topY, beamZ);
      const pBL = project(leftX, bottomY, beamZ);
      const pBR = project(rightX, bottomY, beamZ);
      const pDL = project(leftX, dividerY, beamZ);
      const pDR = project(rightX, dividerY, beamZ);

      renderQueue.push({
        depth: (pTL.depth + pBR.depth) / 2 + 10,
        draw: () => {
          // Outer Chassis
          ctx.beginPath();
          ctx.moveTo(pTL.px, pTL.py);
          ctx.lineTo(pTR.px, pTR.py);
          ctx.lineTo(pBR.px, pBR.py);
          ctx.lineTo(pBL.px, pBL.py);
          ctx.closePath();
          ctx.strokeStyle = 'rgba(96, 165, 250, 0.28)';
          ctx.lineWidth = Math.max(3 * pTL.scale, 1.5);
          ctx.stroke();

          // Horizontal Divider Beam (Beam of Separation)
          ctx.beginPath();
          ctx.moveTo(pDL.px, pDL.py);
          ctx.lineTo(pDR.px, pDR.py);
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
          ctx.lineWidth = Math.max(3.2 * pDL.scale, 1.8);
          ctx.stroke();
        },
      });

      // 3. Dynamic Interactive Beads with Kinetic Sliding
      beads.forEach((bead) => {
        const rodX = (bead.rodIndex - (numRods - 1) / 2) * rodSpacing;

        // Wave-like kinetic slide + mouse distance trigger
        const wave = Math.sin(tick * 1.5 + bead.rodIndex * 0.7);
        const shouldActivate = wave > 0.35;
        bead.targetY = shouldActivate ? bead.activeY : bead.restY;

        // Smooth spring interpolation
        bead.currentY += (bead.targetY - bead.currentY) * 0.08;

        const p = project(rodX, bead.currentY, beamZ);

        renderQueue.push({
          depth: p.depth,
          draw: () => {
            const radX = bead.radius * p.scale;
            const radY = bead.radius * 0.75 * p.scale;
            if (radX <= 0 || radY <= 0) return;

            ctx.save();
            ctx.translate(p.px, p.py);

            // 3D Ellipsoidal Bead Shading
            const beadGrad = ctx.createRadialGradient(
              -radX * 0.25,
              -radY * 0.35,
              radX * 0.05,
              0,
              0,
              radX
            );
            beadGrad.addColorStop(0, '#ffffff');
            beadGrad.addColorStop(0.25, `hsl(${bead.hue}, 80%, 65%)`);
            beadGrad.addColorStop(0.75, `hsl(${bead.hue}, 70%, 42%)`);
            beadGrad.addColorStop(1, `hsl(${bead.hue}, 80%, 20%)`);

            ctx.beginPath();
            ctx.ellipse(0, 0, radX, radY, 0, 0, Math.PI * 2);
            ctx.fillStyle = beadGrad;
            ctx.shadowColor = `hsla(${bead.hue}, 80%, 50%, 0.35)`;
            ctx.shadowBlur = 10 * p.scale;
            ctx.fill();

            // Specular Rim Highlight
            ctx.beginPath();
            ctx.ellipse(0, 0, radX, radY, 0, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.restore();
          },
        });
      });

      // Sort back-to-front for proper depth occlusion
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
