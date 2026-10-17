import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ProofTask, ProofEvaluationResult } from '../types';

interface ProofOfUnderstandingTabProps {
  conceptName?: string;
  theme?: 'light' | 'dark';
}

export const ProofOfUnderstandingTab: React.FC<ProofOfUnderstandingTabProps> = ({
  conceptName = 'Recursion',
  theme = 'light'
}) => {
  const [tasks, setTasks] = useState<ProofTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<ProofTask | null>(null);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<ProofEvaluationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [conceptName]);

  const loadTasks = async () => {
    try {
      const data = await api.getProofTasks(conceptName);
      setTasks(data);
      if (data.length > 0) {
        setSelectedTask(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEvaluate = async () => {
    if (!selectedTask || !studentAnswer.trim()) return;
    setIsLoading(true);
    try {
      const res = await api.evaluateProof(selectedTask.id, studentAnswer, conceptName);
      setEvaluation(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between ${
        isDark ? 'bg-[#1E293B]/60 border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base">🎯</span>
            <h3 className="text-sm font-extrabold">Proof of Understanding (Beyond MCQs)</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] font-bold">
              Feature 7
            </span>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
            Demonstrate real comprehension through own-words explanation, changed scenarios, and defending reasoning steps.
          </p>
        </div>
      </div>

      {/* Task Type Selector */}
      <div className="flex flex-wrap gap-2">
        {tasks.map(t => (
          <button
            key={t.id}
            onClick={() => {
              setSelectedTask(t);
              setEvaluation(null);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
              selectedTask?.id === t.id
                ? 'bg-[#10B981] text-white border-[#10B981] shadow-sm'
                : 'bg-white dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:text-[#1E293B] dark:hover:text-white'
            }`}
          >
            {t.taskType === 'own_words' && '📝 Own Words'}
            {t.taskType === 'changed_scenario' && '🔀 Changed Scenario'}
            {t.taskType === 'find_error' && '🔍 Find the Bug'}
            {t.taskType === 'defend_step' && '⚖️ Defend Reasoning'}
          </button>
        ))}
      </div>

      {selectedTask && (
        <div className={`p-4 rounded-2xl border space-y-3 ${
          isDark ? 'bg-[#1E293B]/40 border-[#334155]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#10B981] tracking-wider">Challenge Prompt</span>
            <h4 className="text-sm font-extrabold mt-0.5 whitespace-pre-wrap">{selectedTask.prompt}</h4>
          </div>

          {/* Rubric Preview */}
          <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-[#64748B]">Explicit Evaluation Rubric:</span>
            {selectedTask.rubric.map((r, i) => (
              <div key={i} className="flex justify-between text-xs text-[#64748B] dark:text-[#94A3B8]">
                <span>• {r.criterion}</span>
                <span className="font-mono font-bold">{r.points} pts</span>
              </div>
            ))}
          </div>

          {/* Answer Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold">Your Response:</label>
            <textarea
              rows={3}
              placeholder="Type your explanation or analysis..."
              value={studentAnswer}
              onChange={e => setStudentAnswer(e.target.value)}
              className={`w-full p-3 text-xs sm:text-sm rounded-xl border outline-none ${
                isDark ? 'bg-[#0F172A] border-[#334155] text-white' : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}
            />
            <div className="flex justify-between items-center pt-1">
              <button
                type="button"
                onClick={() => setStudentAnswer(selectedTask.sampleSolution)}
                className="text-[11px] text-[#06B6D4] hover:underline"
              >
                Fill sample strong answer
              </button>
              <button
                onClick={handleEvaluate}
                disabled={isLoading || !studentAnswer.trim()}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#10B981] text-white hover:bg-[#059669] disabled:opacity-50 transition-all shadow-sm"
              >
                {isLoading ? 'Evaluating against Rubric...' : 'Evaluate Understanding →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evaluation Results Card */}
      {evaluation && (
        <div className={`p-5 rounded-2xl border space-y-4 animate-fadeIn ${
          isDark ? 'bg-[#1E293B]/60 border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#10B981]">Rubric Score</span>
              <div className="text-2xl font-black font-mono mt-0.5 text-[#10B981]">
                {evaluation.masteryPercent}% <span className="text-xs font-sans text-inherit font-bold">({evaluation.masteryLevel})</span>
              </div>
            </div>
            <span className="text-xs text-[#64748B] font-mono">Status saved to learning profile</span>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-[#64748B]">Criterion Breakdown:</span>
            {evaluation.criteriaEvaluations.map((c, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                  c.passed
                    ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
                    : 'bg-[#F43F5E]/10 border-[#F43F5E]/30 text-[#F43F5E]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{c.passed ? '✓' : '✗'}</span>
                  <span>{c.criterion}</span>
                </div>
                <span className="font-mono font-bold">
                  {c.awardedPoints} / {c.maxPoints} pts
                </span>
              </div>
            ))}
          </div>

          {evaluation.sampleSolution && (
            <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-xs text-[#64748B] dark:text-[#94A3B8]">
              <span className="font-bold text-inherit block mb-1">Target Model Solution:</span>
              <p className="italic">{evaluation.sampleSolution}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
