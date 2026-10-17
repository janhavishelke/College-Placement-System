import React, { useEffect, useRef } from 'react';

interface NeuralOrbProps {
  size?: number;
  className?: string;
  glowIntensity?: 'soft' | 'medium' | 'high';
}

export const NeuralOrb: React.FC<NeuralOrbProps> = ({
  size = 360,
  className = '',
  glowIntensity = 'medium'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;

    // Node points on concentric orbits
    const nodes = [
      { orbit: 0.32, speed: 0.012, phase: 0, size: 4.5, color: '#A78BFA' },
      { orbit: 0.45, speed: -0.009, phase: 1.2, size: 5, color: '#06B6D4' },
      { orbit: 0.58, speed: 0.007, phase: 2.8, size: 4, color: '#8B5CF6' },
      { orbit: 0.70, speed: -0.006, phase: 4.1, size: 5.5, color: '#22D3EE' },
      { orbit: 0.82, speed: 0.004, phase: 5.2, size: 4, color: '#C4B5FD' },
      { orbit: 0.48, speed: 0.015, phase: 3.4, size: 3.5, color: '#818CF8' }
    ];

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.min(centerX, centerY) * 0.88;

      // 1. Deep background ambient pulsing glow
      const pulse = Math.sin(angle * 1.5) * 0.15 + 0.85;
      const glowGrad = ctx.createRadialGradient(
        centerX, centerY, 10,
        centerX, centerY, maxRadius * 1.2
      );
      glowGrad.addColorStop(0, 'rgba(139, 92, 246, 0.35)');
      glowGrad.addColorStop(0.35, 'rgba(99, 102, 241, 0.20)');
      glowGrad.addColorStop(0.7, 'rgba(6, 182, 212, 0.10)');
      glowGrad.addColorStop(1, 'rgba(7, 10, 18, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius * 1.25 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // 2. Orbital rings (tilted ellipses)
      const ringRadii = [maxRadius * 0.35, maxRadius * 0.55, maxRadius * 0.75, maxRadius * 0.95];
      ringRadii.forEach((r, idx) => {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle * (idx % 2 === 0 ? 0.2 : -0.15) + (idx * Math.PI) / 4);
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * 0.82, 0, 0, Math.PI * 2);
        ctx.strokeStyle = idx % 2 === 0 ? 'rgba(139, 92, 246, 0.22)' : 'rgba(6, 182, 212, 0.18)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 8]);
        ctx.stroke();
        ctx.restore();
      });

      // 3. Compute and store active node positions
      const currentPositions: { x: number; y: number; color: string; size: number }[] = [];
      nodes.forEach(node => {
        const currentAngle = angle * node.speed * 20 + node.phase;
        const radius = maxRadius * node.orbit;
        const x = centerX + Math.cos(currentAngle) * radius;
        const y = centerY + Math.sin(currentAngle) * radius * 0.85;
        currentPositions.push({ x, y, color: node.color, size: node.size });
      });

      // 4. Draw interconnected neural pathways
      ctx.lineWidth = 1;
      for (let i = 0; i < currentPositions.length; i++) {
        for (let j = i + 1; j < currentPositions.length; j++) {
          const p1 = currentPositions[i];
          const p2 = currentPositions[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < maxRadius * 0.85) {
            const alpha = Math.max(0, 0.35 - dist / (maxRadius * 0.85));
            ctx.strokeStyle = `rgba(167, 139, 250, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
        // Connect to center core
        const coreDist = Math.hypot(currentPositions[i].x - centerX, currentPositions[i].y - centerY);
        const coreAlpha = Math.max(0, 0.4 - coreDist / (maxRadius * 0.9));
        ctx.strokeStyle = `rgba(34, 211, 238, ${coreAlpha})`;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(currentPositions[i].x, currentPositions[i].y);
        ctx.stroke();
      }

      // 5. Draw orbital nodes with halo
      currentPositions.forEach(p => {
        // Node halo
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = p.color + '33';
        ctx.fill();

        // Node center
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 6. Central Neural Nexus Core
      const corePulse = Math.sin(angle * 2.5) * 3 + 28;
      const coreGrad = ctx.createRadialGradient(
        centerX, centerY, 2,
        centerX, centerY, corePulse * 1.5
      );
      coreGrad.addColorStop(0, '#FFFFFF');
      coreGrad.addColorStop(0.3, '#C4B5FD');
      coreGrad.addColorStop(0.65, '#8B5CF6');
      coreGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, corePulse * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Sharp white inner star
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      angle += 0.015;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Decorative atmospheric blur background */}
      <div 
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-600/25 via-indigo-500/20 to-cyan-500/20 blur-3xl pointer-events-none animate-glow-pulse"
        style={{ width: size, height: size }}
      />
      <canvas
        ref={canvasRef}
        width={size * 1.5}
        height={size * 1.5}
        style={{ width: size, height: size }}
        className="relative z-10 transition-transform duration-700 hover:scale-105"
      />
    </div>
  );
};
