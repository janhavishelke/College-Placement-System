import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { RescueStateData } from '../types';

interface LearningRescueModalProps {
  isOpen: boolean;
  onClose: () => void;
  conceptName?: string;
  theme?: 'light' | 'dark';
  onCompleted?: () => void;
}

export const LearningRescueModal: React.FC<LearningRescueModalProps> = ({
  isOpen,
  onClose,
  conceptName = 'Recursion',
  theme = 'light',
  onCompleted
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [rescueState, setRescueState] = useState<RescueStateData | null>(null);
  const [diagnosticInput, setDiagnosticInput] = useState('');
  const [hypothesis, setHypothesis] = useState<string | null>(null);
  const [remedialExplanation, setRemedialExplanation] = useState<string | null>(null);
  const [practiceProblem, setPracticeProblem] = useState<string | null>(null);
  const [practiceInput, setPracticeInput] = useState('');
  const [practiceFeedback, setPracticeFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadRescue();
      setStep(1);
      setHypothesis(null);
      setRemedialExplanation(null);
      setPracticeProblem(null);
      setPracticeFeedback(null);
    }
  }, [isOpen, conceptName]);

  const loadRescue = async () => {
    try {
      const data = await api.getRescueState(conceptName);
      setRescueState(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitDiagnostic = async () => {
    if (!diagnosticInput.trim()) return;
    setIsLoading(true);
    try {
      const res = await api.submitRescueDiagnostic(conceptName, diagnosticInput);
      setHypothesis(res.hypothesis);
      setRemedialExplanation(res.remedialExplanation);
      setPracticeProblem(res.practiceProblem);
      setStep(2);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitPractice = async () => {
    if (!practiceInput.trim()) return;
    setIsLoading(true);
    try {
      const res = await api.submitRescuePractice(conceptName, practiceInput);
      setPracticeFeedback(res.feedback);
      setStep(4);
      if (onCompleted) onCompleted();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border shadow-2xl flex flex-col transition-colors ${
          isDark ? 'bg-[#0F172A] border-[#334155] text-[#F8FAFC]' : 'bg-white border-[#E2E8F0] text-[#1E293B]'
        }`}
      >
        {/* Header */}
        <div className={`p-5 sm:p-6 border-b flex items-center justify-between sticky top-0 z-10 ${
          isDark ? 'bg-[#0F172A]/95 border-[#334155]' : 'bg-white/95 border-[#F1F5F9]'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F43F5E]/15 text-[#F43F5E] flex items-center justify-center text-xl font-bold">
              🚑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  Learning Rescue Engine
                </h2>
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#F43F5E]/15 text-[#F43F5E]">
                  Feature 4
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                8-Step Diagnostic & Prerequisite Remediation for <span className="font-extrabold text-[#06B6D4]">{conceptName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              isDark ? 'bg-[#1E293B] hover:bg-[#334155] text-white' : 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B]'
            }`}
          >
            ✕
          </button>
        </div>

        {/* Step Progression Bar */}
        <div className="px-6 pt-4 flex items-center justify-between text-xs font-bold text-[#64748B] border-b border-[#E2E8F0] dark:border-[#334155] pb-3">
          <span className={step >= 1 ? 'text-[#F43F5E]' : ''}>1. Diagnostic</span>
          <span>→</span>
          <span className={step >= 2 ? 'text-[#8B5CF6]' : ''}>2. Hypothesis & Remedial</span>
          <span>→</span>
          <span className={step >= 3 ? 'text-[#06B6D4]' : ''}>3. New Practice</span>
          <span>→</span>
          <span className={step >= 4 ? 'text-[#10B981]' : ''}>4. Resolved</span>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* STEP 1: Diagnostic Question */}
          {step === 1 && rescueState && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-[#1E293B]/40 border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                <span className="text-[10px] uppercase font-bold text-[#F43F5E] tracking-wider">
                  Suspected Missing Prerequisite: {rescueState.missing_prerequisite}
                </span>
                <h3 className="text-sm sm:text-base font-extrabold mt-1">
                  {rescueState.diagnostic_question}
                </h3>
                <p className="text-xs text-[#64748B] mt-1">
                  Answer this short diagnostic check. UNERA uses your exact answer to distinguish a suspected gap from a confirmed one.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold">Your Response:</label>
                <textarea
                  rows={3}
                  placeholder="e.g., A function call puts frames on the stack, but I forgot what stops them from piling up forever."
                  value={diagnosticInput}
                  onChange={e => setDiagnosticInput(e.target.value)}
                  className={`w-full p-3 text-xs sm:text-sm rounded-2xl border outline-none ${
                    isDark ? 'bg-[#1E293B] border-[#334155] text-white' : 'bg-white border-[#E2E8F0]'
                  }`}
                />
                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setDiagnosticInput('A function call puts frames on the call stack, but I get confused about how the base case halts new calls.')}
                    className="text-[11px] text-[#06B6D4] hover:underline"
                  >
                    Use sample learner response
                  </button>
                  <button
                    onClick={handleSubmitDiagnostic}
                    disabled={isLoading || !diagnosticInput.trim()}
                    className="px-5 py-2 font-bold text-xs rounded-xl bg-[#F43F5E] text-white hover:bg-[#E11D48] disabled:opacity-50 transition-all shadow-sm"
                  >
                    {isLoading ? 'Diagnosing...' : 'Submit Diagnostic Check →'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Hypothesis & Remedial Explanation */}
          {step === 2 && hypothesis && remedialExplanation && (
            <div className="space-y-5">
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-[#8B5CF6]/15 border-[#8B5CF6]/30 text-white' : 'bg-[#F3E8FF] border-[#D8B4FE] text-[#581C87]'
              }`}>
                <span className="text-[10px] uppercase font-black tracking-wider">
                  Diagnostic Evaluation Result
                </span>
                <p className="text-xs sm:text-sm font-semibold mt-1">
                  {hypothesis}
                </p>
              </div>

              <div className={`p-5 rounded-2xl border ${
                isDark ? 'bg-[#1E293B]/40 border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                <div className="prose dark:prose-invert text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                  {remedialExplanation}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(3)}
                  className="px-5 py-2 font-bold text-xs rounded-xl bg-[#06B6D4] text-white hover:bg-[#0891B2] transition-all shadow-sm"
                >
                  Proceed to Practice Problem →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Practice Problem */}
          {step === 3 && practiceProblem && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-[#06B6D4]/10 border-[#06B6D4]/30' : 'bg-[#06B6D4]/5 border-[#06B6D4]/20'
              }`}>
                <span className="text-[10px] uppercase font-black text-[#06B6D4] tracking-wider">
                  Targeted Practice Challenge
                </span>
                <h3 className="text-sm sm:text-base font-extrabold mt-1">
                  {practiceProblem}
                </h3>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold">Your Solution:</label>
                <textarea
                  rows={3}
                  placeholder="Write your code or explanation here..."
                  value={practiceInput}
                  onChange={e => setPracticeInput(e.target.value)}
                  className={`w-full p-3 text-xs sm:text-sm rounded-2xl border outline-none ${
                    isDark ? 'bg-[#1E293B] border-[#334155] text-white' : 'bg-white border-[#E2E8F0]'
                  }`}
                />
                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setPracticeInput('if (n <= 0) return;')}
                    className="text-[11px] text-[#06B6D4] hover:underline"
                  >
                    Quick fill: if (n &lt;= 0) return;
                  </button>
                  <button
                    onClick={handleSubmitPractice}
                    disabled={isLoading || !practiceInput.trim()}
                    className="px-5 py-2 font-bold text-xs rounded-xl bg-[#10B981] text-white hover:bg-[#059669] disabled:opacity-50 transition-all shadow-sm"
                  >
                    {isLoading ? 'Evaluating...' : 'Verify Practice Solution →'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Success & Profile Update */}
          {step === 4 && practiceFeedback && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-[#10B981]/15 text-[#10B981] flex items-center justify-center text-3xl font-bold">
                ✓
              </div>
              <h3 className="text-lg font-black text-inherit">Learning Rescue Successfully Completed!</h3>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] max-w-md">
                {practiceFeedback}
              </p>
              <div className="p-3 rounded-xl bg-[#10B981]/10 text-[#10B981] text-xs font-bold font-mono">
                Persistent Profile: Status elevated to Demonstrated Understanding
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 font-bold text-xs rounded-xl bg-[#10B981] text-white hover:bg-[#059669] transition-all shadow-md"
              >
                Return to Workspace
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
