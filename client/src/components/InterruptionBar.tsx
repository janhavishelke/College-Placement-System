import React, { useState } from 'react';
import { InterruptionItem } from '../types';

interface InterruptionBarProps {
  interruption: InterruptionItem | null;
  onAccept: (id: number) => void;
  onDismiss: (id: number) => void;
}

export const InterruptionBar: React.FC<InterruptionBarProps> = ({
  interruption,
  onAccept,
  onDismiss
}) => {
  const [isSlidingOut, setIsSlidingOut] = useState(false);

  if (!interruption || interruption.status !== 'shown') {
    return null;
  }

  const handleDismiss = () => {
    setIsSlidingOut(true);
    setTimeout(() => {
      onDismiss(interruption.id);
      setIsSlidingOut(false);
    }, 200); // 200ms duration for slide out
  };

  const handleAccept = () => {
    setIsSlidingOut(true);
    setTimeout(() => {
      onAccept(interruption.id);
      setIsSlidingOut(false);
    }, 200);
  };

  return (
    <div
      className={`w-full mb-3 p-3 rounded-2xl bg-[#FCF4E3] border border-[#FDE68A] text-[#27211E] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        isSlidingOut ? 'slide-out-left' : 'slide-in-left'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span className="w-2.5 h-2.5 rounded-full bg-[#FF5E4D] mt-1 shrink-0" />
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B45309]">
              Learning Intervention Checkpoint
            </span>
            <span className="text-[10px] text-[#8C827A] font-mono">
              ({interruption.rule})
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-[#27211E]">
            {interruption.suggestionText}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <button
          onClick={handleAccept}
          className="px-3.5 py-1 text-xs font-semibold rounded-full bg-[#FF5E4D] text-white hover:bg-[#E84D3C] transition-colors shadow-sm"
        >
          Accept Review
        </button>
        <button
          onClick={handleDismiss}
          className="px-3 py-1 text-xs font-medium rounded-full border border-[#D8CEBE] text-[#6B625E] hover:text-[#27211E] hover:bg-[#F2ECE4] transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
