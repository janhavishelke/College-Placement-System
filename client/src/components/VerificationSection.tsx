import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { VerificationTask, VerificationResult } from '../types';

interface VerificationSectionProps {
  conceptName?: string;
  onVerificationComplete?: (result: VerificationResult) => void;
  onReexplainMissingPart?: (gapText: string) => void;
  onClose?: () => void;
}

export const VerificationSection: React.FC<VerificationSectionProps> = ({
  conceptName = 'Recursion',
  onVerificationComplete,
  onReexplainMissingPart,
  onClose
}) => {
  const [task, setTask] = useState<VerificationTask | null>(null);
  const [answerInput, setAnswerInput] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    loadTask();
  }, [conceptName]);

  const loadTask = async () => {
    try {
      const t = await api.getVerificationTask(conceptName);
      setTask(t);
      setResult(null);
      setRevealedCount(0);
    } catch (err) {
      console.error('Failed to load task:', err);
    }
  };

  const handleVerify = async (customAnswer?: string) => {
    const textToSubmit = customAnswer !== undefined ? customAnswer : answerInput;
    if (!textToSubmit.trim()) return;

    setIsEvaluating(true);
    setResult(null);
    setRevealedCount(0);

    try {
      const res = await api.verifyAnswer(conceptName, textToSubmit);
      setIsEvaluating(false);
      setResult(res);

      // Reveal key ideas one by one, 300ms apart
      // 300ms -> item 1, 600ms -> item 2, 900ms -> item 3
      setTimeout(() => setRevealedCount(1), 300);
      setTimeout(() => setRevealedCount(2), 600);
      setTimeout(() => {
        setRevealedCount(3);
        if (onVerificationComplete) {
          onVerificationComplete(res);
        }
      }, 900);
    } catch (err) {
      setIsEvaluating(false);
      console.error('Failed to verify answer:', err);
    }
  };

  return (
    <div className="w-full bg-[#FFFFFF] rounded-2xl border border-[#F2ECE4] p-4 shadow-sm mb-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F2ECE4] pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
          <h3 className="font-bold text-sm text-[#27211E]">
            Understanding Verification Engine
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#EAF3FB] text-[#1E3A8A] font-semibold">
            {conceptName}
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-xs text-[#6B625E] hover:text-[#27211E]">
            Close
          </button>
        )}
      </div>

      {/* Task Prompt */}
      <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#F2ECE4] mb-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#B45309] block mb-1">
          Active Recall Challenge
        </span>
        <p className="text-xs sm:text-sm font-medium text-[#27211E]">
          {task?.prompt || `Explain ${conceptName} in your own words.`}
        </p>
      </div>

      {/* Answer Input */}
      {!result ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={answerInput}
            onChange={e => setAnswerInput(e.target.value)}
            placeholder="Type your explanation here (e.g. A function that calls itself with a base case to terminate)..."
            rows={3}
            className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-[#D8CEBE] focus:outline-none focus:border-[#FF5E4D] bg-[#FAF7F2]"
          />

          {/* Quick Demo Pre-fills for Testing */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#6B625E]">
            <span>Quick fill:</span>
            <button
              onClick={() => {
                const weak = 'A function that calls itself to break down problems into smaller parts.';
                setAnswerInput(weak);
                handleVerify(weak);
              }}
              className="px-2.5 py-0.5 rounded-full bg-[#FCF4E3] text-[#92400E] border border-[#FDE68A] hover:bg-[#FDE68A]"
            >
              Weak Answer (Missing Base Case)
            </button>
            <button
              onClick={() => {
                const complete = 'A function that calls itself on smaller inputs until reaching a base case that stops execution.';
                setAnswerInput(complete);
                handleVerify(complete);
              }}
              className="px-2.5 py-0.5 rounded-full bg-[#E9F7F0] text-[#065F46] border border-[#A7F3D0] hover:bg-[#A7F3D0]"
            >
              Complete Answer (All 3 Ticks)
            </button>
          </div>

          <div className="flex justify-end mt-1">
            <button
              onClick={() => handleVerify()}
              disabled={isEvaluating || !answerInput.trim()}
              className="px-4 py-1.5 rounded-full bg-[#FF5E4D] text-white text-xs font-semibold hover:bg-[#E84D3C] disabled:opacity-50 transition-colors shadow-sm"
            >
              {isEvaluating ? 'Evaluating...' : 'Submit Explanation'}
            </button>
          </div>
        </div>
      ) : (
        /* Results Section - 3 Ticks 300ms Apart */
        <div className="flex flex-col gap-3">
          <div className="text-xs text-[#6B625E] italic">
            Student Answer: "{result.studentAnswer}"
          </div>

          <div className="flex flex-col gap-2">
            {result.keyIdeas.map((idea, idx) => {
              const isRevealed = idx < revealedCount;
              const hasTick = result.ticks[idx];

              if (!isRevealed) {
                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-dashed border-[#D8CEBE] text-xs text-[#8C827A] flex items-center justify-between opacity-50"
                  >
                    <span>Checking key idea {idx + 1}...</span>
                    <span className="w-4 h-4 rounded-full border-2 border-t-[#FF5E4D] border-gray-200 animate-spin" />
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border tick-pop transition-all flex items-start justify-between gap-3 ${
                    hasTick
                      ? 'bg-[#E9F7F0] border-[#A7F3D0] text-[#065F46]'
                      : 'bg-[#FEE2E2] border-[#FCA5A5] text-[#991B1B]'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      hasTick ? 'bg-[#10B981] text-white' : 'bg-[#EF4444] text-white'
                    }`}>
                      {hasTick ? '✓' : '✗'}
                    </span>
                    <div>
                      <span className="font-semibold text-xs block">
                        {idea}
                      </span>
                      {!hasTick && result.gaps[idx] && (
                        <span className="text-[11px] font-medium text-[#B91C1C] block mt-0.5">
                          {result.gaps[idx]}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] uppercase font-bold tracking-wider shrink-0 mt-0.5">
                    {hasTick ? 'Identified' : 'Gap Note'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Action offerings when finished */}
          {revealedCount === 3 && (
            <div className="pt-2 border-t border-[#F2ECE4] flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-[#6B625E]">
                {result.gaps.length === 0 ? (
                  <span className="text-[#065F46] font-semibold">
                    All core concepts verified. Concept moved to Demonstrated.
                  </span>
                ) : (
                  <span className="text-[#991B1B] font-medium">
                    {result.gaps.length} concept gap identified.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {result.gaps.length > 0 && onReexplainMissingPart && (
                  <button
                    onClick={() => onReexplainMissingPart(result.gaps[0])}
                    className="px-3 py-1 text-xs font-semibold rounded-full bg-[#FF5E4D] text-white hover:bg-[#E84D3C] transition-colors"
                  >
                    Re-explain missing part
                  </button>
                )}
                <button
                  onClick={() => {
                    setResult(null);
                    setRevealedCount(0);
                    setAnswerInput('');
                  }}
                  className="px-3 py-1 text-xs font-medium rounded-full border border-[#D8CEBE] text-[#27211E] hover:bg-[#FAF7F2] transition-colors"
                >
                  Practice again
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
