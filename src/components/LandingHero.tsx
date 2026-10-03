'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface LandingHeroProps {
  onStart: () => void;
}

export function LandingHero({ onStart }: LandingHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // 3D Geometric Canvas Animation Engine
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

    // 3D Geometry Vertices (Icosahedron / Diamond Polyhedron)
    const phi = (1 + Math.sqrt(5)) / 2;
    const baseVertices = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1],
    ].map(([x, y, z]) => {
      const len = Math.sqrt(x * x + y * y + z * z);
      return [x / len, y / len, z / len];
    });

    // Edges connecting vertices
    const edges: [number, number][] = [];
    for (let i = 0; i < baseVertices.length; i++) {
      for (let j = i + 1; j < baseVertices.length; j++) {
        const dx = baseVertices[i][0] - baseVertices[j][0];
        const dy = baseVertices[i][1] - baseVertices[j][1];
        const dz = baseVertices[i][2] - baseVertices[j][2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 1.1) {
          edges.push([i, j]);
        }
      }
    }

    // Floating orbital math particles
    interface Particle {
      x: number;
      y: number;
      z: number;
      radius: number;
      speed: number;
      orbitRadius: number;
      angle: number;
      color: string;
      label?: string;
    }

    const particles: Particle[] = [];
    const glyphs = ['%', '$', '∑', '÷', '×', '0.00', '100%'];
    for (let i = 0; i < 36; i++) {
      const angle = (i / 36) * Math.PI * 2;
      const orbitRadius = 140 + Math.random() * 110;
      particles.push({
        x: Math.cos(angle) * orbitRadius,
        y: (Math.random() - 0.5) * 160,
        z: Math.sin(angle) * orbitRadius,
        radius: Math.random() * 2.5 + 1.5,
        speed: 0.005 + Math.random() * 0.008,
        orbitRadius,
        angle,
        color: i % 3 === 0 ? '#00e5a3' : i % 3 === 1 ? '#6c63ff' : '#9ca3ff',
        label: i < glyphs.length ? glyphs[i] : undefined,
      });
    }

    let rotX = 0.3;
    let rotY = 0;
    let targetRotX = 0.3;
    let targetRotY = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Smooth inertia rotation
      rotX += (targetRotX - rotX) * 0.05 + 0.002;
      rotY += (targetRotY - rotY) * 0.05 + 0.003;

      const scale = Math.min(width, height) * 0.28;

      // Rotate function for 3D point
      const rotatePoint = (x: number, y: number, z: number): [number, number, number] => {
        // Rotate around Y
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;

        // Rotate around X
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        return [x1, y2, z2];
      };

      // Project 3D to 2D screen
      const project = (x: number, y: number, z: number): [number, number, number] => {
        const distance = 4;
        const fov = distance / (distance + z / 300);
        return [centerX + x * fov, centerY + y * fov, fov];
      };

      // 1. Draw glowing ambient background radial
      const bgGlow = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, scale * 1.8);
      bgGlow.addColorStop(0, 'rgba(108, 99, 255, 0.15)');
      bgGlow.addColorStop(0.5, 'rgba(0, 229, 163, 0.05)');
      bgGlow.addColorStop(1, 'rgba(18, 17, 42, 0)');
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw outer orbital rings
      ctx.save();
      ctx.strokeStyle = 'rgba(139, 142, 222, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, scale * 1.5, scale * 0.7, rotY * 0.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 229, 163, 0.1)';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, scale * 1.3, scale * 0.5, -rotX * 0.8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 3. Project Polyhedron Vertices
      const projectedVertices = baseVertices.map(([vx, vy, vz]) => {
        const [rx, ry, rz] = rotatePoint(vx * scale, vy * scale, vz * scale);
        return project(rx, ry, rz);
      });

      // 4. Draw Polyhedron Edges with depth gradient
      edges.forEach(([i, j]) => {
        const [x1, y1, fov1] = projectedVertices[i];
        const [x2, y2, fov2] = projectedVertices[j];
        const avgFov = (fov1 + fov2) / 2;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);

        const edgeGrad = ctx.createLinearGradient(x1, y1, x2, y2);
        edgeGrad.addColorStop(0, `rgba(108, 99, 255, ${Math.min(1, avgFov * 0.65)})`);
        edgeGrad.addColorStop(0.5, `rgba(0, 229, 163, ${Math.min(1, avgFov * 0.8)})`);
        edgeGrad.addColorStop(1, `rgba(156, 163, 255, ${Math.min(1, avgFov * 0.65)})`);

        ctx.strokeStyle = edgeGrad;
        ctx.lineWidth = Math.max(0.8, avgFov * 1.8);
        ctx.stroke();
      });

      // 5. Draw Vertices (glowing nodes)
      projectedVertices.forEach(([x, y, fov]) => {
        ctx.beginPath();
        const r = Math.max(2, 4 * fov);
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = '#00e5a3';
        ctx.shadowColor = '#00e5a3';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 6. Update and Draw Orbiting Particles & Glyphs
      particles.forEach((p) => {
        p.angle += p.speed;
        p.x = Math.cos(p.angle) * p.orbitRadius;
        p.z = Math.sin(p.angle) * p.orbitRadius;

        const [rx, ry, rz] = rotatePoint(p.x, p.y, p.z);
        const [px, py, fov] = project(rx, ry, rz);

        if (p.label) {
          ctx.save();
          ctx.font = `600 ${Math.max(10, 13 * fov)}px Inter, sans-serif`;
          ctx.fillStyle = `rgba(197, 199, 232, ${Math.min(0.9, fov * 0.85)})`;
          ctx.fillText(p.label, px, py);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(px, py, p.radius * fov, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.min(0.8, fov * 0.7);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Mouse movement interaction
    const handleCanvasMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY = nx * 1.5;
      targetRotX = -ny * 1.2;
      setMousePos({ x: nx, y: ny });
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#00e5a3',
              boxShadow: '0 0 10px #00e5a3',
            }}
          />
          <span style={{ fontSize: '0.82rem', color: '#c5c7e8', fontWeight: 500 }}>
            Ready
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

        {/* Right Column: Code-Driven 3D Interactive Animation */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '520px',
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
              filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.6))',
            }}
          />
        </div>
      </div>

      {/* Bottom Subtle Indicator */}
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
        <span>Version 1.0</span>
      </div>
    </div>
  );
}
