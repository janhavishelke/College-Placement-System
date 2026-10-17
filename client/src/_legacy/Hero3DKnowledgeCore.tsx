import React, { useEffect, useRef, useState } from 'react';
import { Screen } from './LMSSidebar';

interface Hero3DKnowledgeCoreProps {
  size?: number;
  className?: string;
  onSelectAction?: (action: Screen) => void;
}

export const Hero3DKnowledgeCore: React.FC<Hero3DKnowledgeCoreProps> = ({
  size = 460,
  className = '',
  onSelectAction
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angleY = 0;
    let angleX = 0.2;

    // 1. Generate 3D sphere points (Knowledge Nodes)
    const sphereNodes: { x: number; y: number; z: number; baseColor: string; size: number }[] = [];
    const numPoints = 48;
    const sphereRadius = size * 0.36;

    for (let i = 0; i < numPoints; i++) {
      // Golden spiral distribution on sphere
      const phi = Math.acos(1 - (2 * (i + 0.5)) / numPoints);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

      const x = sphereRadius * Math.sin(phi) * Math.cos(theta);
      const y = sphereRadius * Math.sin(phi) * Math.sin(theta);
      const z = sphereRadius * Math.cos(phi);

      const isCyan = i % 3 === 0;
      sphereNodes.push({
        x,
        y,
        z,
        baseColor: isCyan ? '#22D3EE' : '#A78BFA',
        size: isCyan ? 3.8 : 3.0
      });
    }

    // 2. Orbiting Academic Formula Elements (3D Orbit Coordinates)
    const academicSymbols = [
      { text: '∇ × E = -∂B/∂t', radius: sphereRadius * 1.35, speed: 0.008, phase: 0.2, color: '#38BDF8' },
      { text: 'E = mc²', radius: sphereRadius * 1.48, speed: -0.006, phase: 1.8, color: '#C084FC' },
      { text: 'O(n log n)', radius: sphereRadius * 1.25, speed: 0.011, phase: 3.2, color: '#818CF8' },
      { text: '∫ e^{-x²} dx = √π', radius: sphereRadius * 1.55, speed: -0.007, phase: 4.5, color: '#22D3EE' },
      { text: 'C₆H₁₂O₆ + 6O₂', radius: sphereRadius * 1.40, speed: 0.009, phase: 5.6, color: '#E879F9' },
      { text: 'mutex_lock(&mtx)', radius: sphereRadius * 1.30, speed: -0.012, phase: 2.7, color: '#34D399' }
    ];

    // 3. Floating Knowledge Particles
    const particles: { x: number; y: number; z: number; vx: number; vy: number; vz: number; color: string }[] = [];
    for (let i = 0; i < 35; i++) {
      particles.push({
        x: (Math.random() - 0.5) * size * 1.2,
        y: (Math.random() - 0.5) * size * 1.2,
        z: (Math.random() - 0.5) * size,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        vz: (Math.random() - 0.5) * 0.4,
        color: i % 2 === 0 ? '#8B5CF6' : '#06B6D4'
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const fov = 450; // Camera perspective distance

      // Smooth camera tilt from mouse parallax
      const targetAngleX = 0.15 + mousePos.y * 0.2;
      const targetAngleY = angleY + mousePos.x * 0.25;

      // Draw Atmospheric Background Ambient Glow
      const ambientPulse = Math.sin(angleY * 2) * 15;
      const ambientGlow = ctx.createRadialGradient(
        centerX, centerY, 10,
        centerX, centerY, (size * 0.55) + ambientPulse
      );
      ambientGlow.addColorStop(0, 'rgba(124, 58, 237, 0.22)');
      ambientGlow.addColorStop(0.4, 'rgba(14, 165, 233, 0.12)');
      ambientGlow.addColorStop(0.8, 'rgba(15, 23, 42, 0.04)');
      ambientGlow.addColorStop(1, 'rgba(7, 10, 18, 0)');

      ctx.fillStyle = ambientGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Matrix rotation math
      const cosY = Math.cos(targetAngleY);
      const sinY = Math.sin(targetAngleY);
      const cosX = Math.cos(targetAngleX);
      const sinX = Math.sin(targetAngleX);

      // Project 3D Point to 2D Screen Space
      const project = (x3d: number, y3d: number, z3d: number) => {
        // Rotate Y
        const x1 = x3d * cosY - z3d * sinY;
        const z1 = z3d * cosY + x3d * sinY;
        // Rotate X
        const y2 = y3d * cosX - z1 * sinX;
        const z2 = z1 * cosX + y3d * sinX;

        const scale = fov / (fov + z2);
        return {
          x: centerX + x1 * scale,
          y: centerY + y2 * scale,
          z: z2,
          scale,
          alpha: Math.max(0.12, Math.min(1, (z2 + sphereRadius * 1.5) / (sphereRadius * 3)))
        };
      };

      // 4. Render and update floating particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        if (Math.abs(p.x) > size * 0.6) p.vx *= -1;
        if (Math.abs(p.y) > size * 0.6) p.vy *= -1;
        if (Math.abs(p.z) > size * 0.5) p.vz *= -1;

        const proj = project(p.x, p.y, p.z);
        if (proj.scale > 0) {
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, 1.2 * proj.scale, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = proj.alpha * 0.45;
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
      });

      // 5. Project all sphere nodes
      const projectedNodes = sphereNodes.map(node => {
        const proj = project(node.x, node.y, node.z);
        return {
          ...node,
          screenX: proj.x,
          screenY: proj.y,
          z: proj.z,
          scale: proj.scale,
          alpha: proj.alpha
        };
      });

      // Sort by Z for realistic depth
      projectedNodes.sort((a, b) => a.z - b.z);

      // 6. Draw Interconnected Synaptic Neural Arcs
      for (let i = 0; i < projectedNodes.length; i++) {
        for (let j = i + 1; j < projectedNodes.length; j++) {
          const n1 = projectedNodes[i];
          const n2 = projectedNodes[j];
          const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y, n1.z - n2.z);

          if (dist < sphereRadius * 0.62) {
            const edgeAlpha = Math.max(0, (0.35 - dist / (sphereRadius * 0.62)) * ((n1.alpha + n2.alpha) / 2));
            ctx.beginPath();
            ctx.moveTo(n1.screenX, n1.screenY);
            ctx.lineTo(n2.screenX, n2.screenY);
            ctx.strokeStyle = `rgba(167, 139, 250, ${edgeAlpha})`;
            ctx.lineWidth = 0.8 * ((n1.scale + n2.scale) / 2);
            ctx.stroke();
          }
        }
      }

      // 7. Draw Nodes with depth-scaled glowing halos
      projectedNodes.forEach(node => {
        const r = node.size * node.scale;
        if (r <= 0) return;

        // Outer glow
        ctx.beginPath();
        ctx.arc(node.screenX, node.screenY, r * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = node.baseColor;
        ctx.globalAlpha = node.alpha * 0.25;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(node.screenX, node.screenY, r, 0, Math.PI * 2);
        ctx.fillStyle = node.z > 0 ? '#FFFFFF' : node.baseColor;
        ctx.globalAlpha = node.alpha;
        ctx.shadowColor = node.baseColor;
        ctx.shadowBlur = node.z > 0 ? 8 : 0;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
      });

      // 8. Render Orbiting Academic Formulas & Scientific Equations
      academicSymbols.forEach(sym => {
        const orbAngle = targetAngleY * sym.speed * 30 + sym.phase;
        const x3 = Math.cos(orbAngle) * sym.radius;
        const z3 = Math.sin(orbAngle) * sym.radius;
        const y3 = Math.sin(orbAngle * 1.5) * (sym.radius * 0.35);

        const proj = project(x3, y3, z3);

        if (proj.scale > 0) {
          ctx.save();
          ctx.font = `${Math.round(10 * proj.scale)}px "JetBrains Mono", "Fira Code", monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = sym.color;
          ctx.globalAlpha = Math.max(0.2, proj.alpha * 0.95);

          // Subtle background pill for readability
          const textMetrics = ctx.measureText(sym.text);
          const bgWidth = textMetrics.width + 12;
          const bgHeight = 16 * proj.scale;

          ctx.fillStyle = 'rgba(11, 15, 25, 0.75)';
          ctx.fillRect(proj.x - bgWidth / 2, proj.y - bgHeight / 2, bgWidth, bgHeight);
          ctx.strokeStyle = sym.color + '44';
          ctx.lineWidth = 0.8;
          ctx.strokeRect(proj.x - bgWidth / 2, proj.y - bgHeight / 2, bgWidth, bgHeight);

          // Formula text
          ctx.fillStyle = sym.color;
          ctx.fillText(sym.text, proj.x, proj.y);
          ctx.restore();
        }
      });

      // 9. Central Radiant Intelligence Core
      const corePulse = Math.sin(angleY * 3) * 4 + 22;
      const coreGrad = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, corePulse * 1.6
      );
      coreGrad.addColorStop(0, '#FFFFFF');
      coreGrad.addColorStop(0.25, '#C4B5FD');
      coreGrad.addColorStop(0.55, '#8B5CF6');
      coreGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

      ctx.beginPath();
      ctx.arc(centerX, centerY, corePulse * 1.4, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Inner singularity sparkle
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#38BDF8';
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;

      angleY += 0.007;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [mousePos, size]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Dynamic atmospheric radial backdrop */}
      <div
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-600/20 via-indigo-600/15 to-cyan-500/15 blur-3xl pointer-events-none animate-pulse"
        style={{ width: size, height: size }}
      />

      {/* Main 3D Interactive Canvas */}
      <canvas
        ref={canvasRef}
        width={size * 1.3}
        height={size * 1.3}
        style={{ width: size, height: size }}
        className="relative z-10 cursor-grab active:cursor-grabbing"
      />

      {/* Five Cinematic Surrounding Glass Preview Panels (Requirement 3) */}
      
      {/* 1. Notes Glass Panel */}
      <div 
        onClick={() => onSelectAction && onSelectAction('workspace')}
        className="absolute -top-3 left-4 z-20 cursor-pointer rounded-xl border border-violet-500/25 bg-[#0B0F19]/80 px-3 py-2 shadow-xl backdrop-blur-md hover:border-violet-400 hover:bg-[#111827] transition-all hover:scale-105"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-violet-600/30 text-[10px] text-violet-300 font-bold">
            01
          </span>
          <div>
            <p className="text-[11px] font-bold text-white leading-none">Notes Grounding</p>
            <p className="text-[9px] text-cyan-400 font-mono mt-0.5">CS301 p.3 • Verified</p>
          </div>
        </div>
      </div>

      {/* 2. Live AI Interruption Panel */}
      <div 
        onClick={() => onSelectAction && onSelectAction('workspace')}
        className="absolute top-1/4 -right-8 z-20 cursor-pointer rounded-xl border border-cyan-500/30 bg-[#0B0F19]/85 px-3.5 py-2 shadow-xl backdrop-blur-md hover:border-cyan-400 hover:bg-[#111827] transition-all hover:scale-105 animate-pulse"
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <div>
            <p className="text-[11px] font-bold text-cyan-300 leading-none">Interrupt & Explore</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Click to query in real-time</p>
          </div>
        </div>
      </div>

      {/* 3. Quiz / Mastery Verification Panel */}
      <div 
        onClick={() => onSelectAction && onSelectAction('verification')}
        className="absolute bottom-16 -left-6 z-20 cursor-pointer rounded-xl border border-emerald-500/25 bg-[#0B0F19]/80 px-3.5 py-2 shadow-xl backdrop-blur-md hover:border-emerald-400 hover:bg-[#111827] transition-all hover:scale-105"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-600/30 text-[10px] text-emerald-300 font-bold">
            94%
          </span>
          <div>
            <p className="text-[11px] font-bold text-emerald-400 leading-none">Rubric Verification</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Active Recall &amp; Feynman</p>
          </div>
        </div>
      </div>

      {/* 4. Research Citations Panel */}
      <div 
        onClick={() => onSelectAction && onSelectAction('workspace')}
        className="absolute -bottom-4 right-10 z-20 cursor-pointer rounded-xl border border-purple-500/25 bg-[#0B0F19]/80 px-3 py-2 shadow-xl backdrop-blur-md hover:border-purple-400 hover:bg-[#111827] transition-all hover:scale-105"
      >
        <div className="flex items-center gap-2">
          <span className="text-violet-400 font-mono text-xs">§</span>
          <div>
            <p className="text-[11px] font-bold text-white leading-none">Zero Hallucinations</p>
            <p className="text-[9px] text-violet-300 mt-0.5">Strict Source Abstention</p>
          </div>
        </div>
      </div>

      {/* 5. Progress Knowledge Metric */}
      <div 
        onClick={() => onSelectAction && onSelectAction('progress')}
        className="absolute top-1/2 -left-10 z-20 cursor-pointer rounded-xl border border-blue-500/25 bg-[#0B0F19]/80 px-3 py-1.5 shadow-xl backdrop-blur-md hover:border-blue-400 hover:bg-[#111827] transition-all hover:scale-105 hidden sm:block"
      >
        <p className="text-[10px] font-bold text-blue-400 leading-none">Mastery Graph</p>
        <p className="text-[9px] text-slate-400 mt-0.5">11 Connected Concepts</p>
      </div>

    </div>
  );
};
