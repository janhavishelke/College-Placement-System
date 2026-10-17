import React, { useEffect, useRef } from 'react';

export type VoiceState = 'Idle' | 'Listening' | 'Thinking' | 'Speaking' | 'Paused' | 'Error';

interface AudioWaveformVisualizerProps {
  state: VoiceState;
  height?: number;
  width?: number;
  className?: string;
}

export const AudioWaveformVisualizer: React.FC<AudioWaveformVisualizerProps> = ({
  state,
  height = 54,
  width = 240,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let step = 0;

    const barCount = 32;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerY = canvas.height / 2;
      const barWidth = canvas.width / barCount;

      const isSpeaking = state === 'Speaking';
      const isListening = state === 'Listening';
      const isThinking = state === 'Thinking';
      const isPaused = state === 'Paused';

      for (let i = 0; i < barCount; i++) {
        const x = i * barWidth + barWidth * 0.15;
        const actualWidth = barWidth * 0.7;
        let barHeight = 4; // Resting height

        if (isSpeaking) {
          // Dynamic sinusoidal harmonic bars
          const wave1 = Math.sin(step * 0.18 + i * 0.35);
          const wave2 = Math.cos(step * 0.12 + i * 0.55);
          const factor = Math.abs(wave1 * 0.6 + wave2 * 0.4);
          barHeight = 6 + factor * (canvas.height * 0.75);
        } else if (isListening) {
          // Responsive microphone pulse
          const pulse = Math.abs(Math.sin(step * 0.25 + i * 0.2));
          barHeight = 5 + pulse * (canvas.height * 0.55);
        } else if (isThinking) {
          // Traveling wave shimmer
          const travel = Math.sin(step * 0.15 - i * 0.3);
          barHeight = 5 + Math.max(0, travel) * (canvas.height * 0.45);
        } else if (isPaused) {
          // Static minimal indicators
          barHeight = (i % 4 === 0) ? 6 : 3;
        }

        // Color based on active state (Professional education palette)
        let barGrad = ctx.createLinearGradient(x, centerY - barHeight / 2, x, centerY + barHeight / 2);
        if (isSpeaking) {
          barGrad.addColorStop(0, '#3B82F6');
          barGrad.addColorStop(1, '#1D4ED8');
        } else if (isListening) {
          barGrad.addColorStop(0, '#EF4444');
          barGrad.addColorStop(1, '#DC2626');
        } else if (isThinking) {
          barGrad.addColorStop(0, '#F59E0B');
          barGrad.addColorStop(1, '#2563EB');
        } else if (isPaused) {
          barGrad.addColorStop(0, '#94A3B8');
          barGrad.addColorStop(1, '#64748B');
        } else {
          barGrad.addColorStop(0, '#CBD5E1');
          barGrad.addColorStop(1, '#94A3B8');
        }

        ctx.fillStyle = barGrad;
        ctx.beginPath();
        // Rounded bar
        const topY = centerY - barHeight / 2;
        const radius = Math.min(actualWidth / 2, barHeight / 2);
        ctx.roundRect(x, topY, actualWidth, barHeight, radius);
        ctx.fill();
      }

      if (isSpeaking || isListening || isThinking) {
        step += 1;
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [state]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-lg"
      />
    </div>
  );
};
