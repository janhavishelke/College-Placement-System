import React, { useState } from 'react';
import { DoubtItem } from '../types';
import { api } from '../services/api';

interface DoubtTrackerProps {
  doubts: DoubtItem[];
  onRefreshDoubts: () => void;
  onSelectConceptPage?: (docId: number, pageNo: number) => void;
  onOpenVisualExample?: (conceptName: string) => void;
  onOpenPractice?: (conceptName: string) => void;
}

export const DoubtTracker: React.FC<DoubtTrackerProps> = ({
  doubts,
  onRefreshDoubts,
  onSelectConceptPage,
  onOpenVisualExample,
  onOpenPractice
}) => {
  const [selectedSimpler, setSelectedSimpler] = useState<{ conceptName: string; text: string } | null>(null);

  const unresolved = doubts.filter(d => d.status === 'unresolved');
  const resolving = doubts.filter(d => d.status === 'resolving');
  const resolved = doubts.filter(d => d.status === 'resolved');

  const handleStepClick = async (doubt: DoubtItem, step: 'simpler' | 'visual' | 'practice') => {
    try {
      await api.updateDoubtStep(doubt.id, step);
      onRefreshDoubts();

      if (step === 'simpler') {
        setSelectedSimpler({
          conceptName: doubt.conceptName,
          text: doubt.simplerExplanation || 'Think of recursion like Russian nesting dolls (Matryoshka). Each doll contains a smaller one until you reach the solid tiny doll inside (the base case).'
        });
      } else if (step === 'visual') {
        if (onOpenVisualExample) {
          onOpenVisualExample(doubt.conceptName);
        }
      } else if (step === 'practice') {
        if (onOpenPractice) {
          onOpenPractice(doubt.conceptName);
        }
      }
    } catch (err) {
      console.error('Failed to update doubt step:', err);
    }
  };

  const handleManualResolve = async (doubtId: number) => {
    try {
      await api.resolveDoubt(doubtId);
      onRefreshDoubts();
    } catch (err) {
      console.error('Failed to resolve doubt:', err);
    }
  };

  return (
    <div className="w-full bg-[#FFFFFF] rounded-2xl border border-[#F2ECE4] p-4 shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F2ECE4] pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5E4D]" />
          <h3 className="font-bold text-sm text-[#27211E]">
            Doubt Memory
          </h3>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#6B625E]">
            {doubts.length} tracked
          </span>
        </div>
        <span className="text-[11px] text-[#8C827A]">
          SQLite Persistent
        </span>
      </div>

      {/* Simpler Explanation Overlay / Callout */}
      {selectedSimpler && (
        <div className="p-3 bg-[#FCF4E3] rounded-xl border border-[#FDE68A] text-xs">
          <div className="flex items-center justify-between font-bold text-[#92400E] mb-1">
            <span>Simpler Explanation: {selectedSimpler.conceptName}</span>
            <button
              onClick={() => setSelectedSimpler(null)}
              className="text-[#6B625E] hover:text-[#27211E] text-sm"
            >
              x
            </button>
          </div>
          <p className="text-[#27211E] leading-relaxed">
            {selectedSimpler.text}
          </p>
        </div>
      )}

      {/* Unresolved & Resolving List */}
      <div className="flex flex-col gap-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B625E]">
          Active Doubts ({unresolved.length + resolving.length})
        </h4>

        {unresolved.length === 0 && resolving.length === 0 ? (
          <div className="text-xs text-[#8C827A] p-3 text-center bg-[#FAF7F2] rounded-xl">
            No active unresolved doubts. Type "I still don't understand recursion" to log one.
          </div>
        ) : (
          [...unresolved, ...resolving].map(doubt => {
            const isUnresolved = doubt.status === 'unresolved';
            const steps = doubt.stepsDone || [];
            const progressRatio = steps.length / 3;

            return (
              <div
                key={doubt.id}
                className="p-3 rounded-xl border border-[#F2ECE4] bg-[#FAF7F2] doubt-card-transition hover:border-[#E5D7C5]"
              >
                {/* Doubt Card Title & Status Badge */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isUnresolved ? 'bg-[#FF5E4D]' : 'bg-[#F59E0B]'}`} />
                    <span className="font-bold text-xs text-[#27211E]">
                      {doubt.conceptName}
                    </span>
                    {doubt.pageNo && (
                      <button
                        onClick={() => onSelectConceptPage && onSelectConceptPage(doubt.docId || 1, doubt.pageNo!)}
                        className="text-[10px] text-[#FF5E4D] font-mono hover:underline"
                        title="Jump to note page"
                      >
                        [p.{doubt.pageNo}]
                      </button>
                    )}
                  </div>

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isUnresolved 
                      ? 'bg-[#FEE2E2] text-[#991B1B]' 
                      : 'bg-[#FEF3C7] text-[#92400E]'
                  }`}>
                    {isUnresolved ? 'Unresolved' : `Resolving (${steps.length}/3)`}
                  </span>
                </div>

                {/* Progress bar for Resolving */}
                <div className="w-full bg-[#E5D7C5] h-1.5 rounded-full mb-3 overflow-hidden">
                  <div
                    className="bg-[#FF5E4D] h-full transition-all duration-300"
                    style={{ width: `${Math.round(progressRatio * 100)}%` }}
                  />
                </div>

                {/* 3 Step Actions */}
                <div className="flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => handleStepClick(doubt, 'simpler')}
                    className={`flex-1 px-2 py-1 text-[11px] font-medium rounded-lg border transition-colors ${
                      steps.includes('simpler')
                        ? 'bg-[#E9F7F0] border-[#A7F3D0] text-[#065F46]'
                        : 'bg-white border-[#D8CEBE] text-[#27211E] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    {steps.includes('simpler') ? '✓ Simpler' : '1. Simpler'}
                  </button>

                  <button
                    onClick={() => handleStepClick(doubt, 'visual')}
                    className={`flex-1 px-2 py-1 text-[11px] font-medium rounded-lg border transition-colors ${
                      steps.includes('visual')
                        ? 'bg-[#E9F7F0] border-[#A7F3D0] text-[#065F46]'
                        : 'bg-white border-[#D8CEBE] text-[#27211E] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    {steps.includes('visual') ? '✓ Visual' : '2. Visual'}
                  </button>

                  <button
                    onClick={() => handleStepClick(doubt, 'practice')}
                    className={`flex-1 px-2 py-1 text-[11px] font-medium rounded-lg border transition-colors ${
                      steps.includes('practice')
                        ? 'bg-[#E9F7F0] border-[#A7F3D0] text-[#065F46]'
                        : 'bg-white border-[#D8CEBE] text-[#27211E] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    {steps.includes('practice') ? '✓ Verify' : '3. Verify'}
                  </button>

                  <button
                    onClick={() => handleManualResolve(doubt.id)}
                    className="px-2 py-1 text-[10px] text-[#6B625E] hover:text-[#10B981] transition-colors"
                    title="Mark resolved"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resolved Doubts List (Collapsed to one line per card) */}
      {resolved.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-2 border-t border-[#F2ECE4]">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#10B981]">
            Resolved Concepts ({resolved.length})
          </h4>
          {resolved.map(doubt => (
            <div
              key={doubt.id}
              className="px-2.5 py-1.5 rounded-lg bg-[#E9F7F0] border border-[#A7F3D0] flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[#10B981] font-bold">✓</span>
                <span className="font-semibold text-[#065F46]">{doubt.conceptName}</span>
              </div>
              <span className="text-[10px] text-[#047857]">
                Mastered
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
