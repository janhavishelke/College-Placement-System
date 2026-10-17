import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  BookOpen, 
  AlertCircle, 
  ArrowRight, 
  RotateCcw, 
  Award, 
  FileText,
  BarChart3,
  Sparkles,
  Play
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AssessmentQuiz, AssessmentRecord, MasteryStatus } from '../types';
import { api } from '../services/api';
import { Screen } from '../components/LMSSidebar';

interface VerificationPageProps {
  initialConceptName?: string;
  initialDocumentId?: string;
  onNavigate: (screen: Screen) => void;
  onDoubtUpdated?: () => void;
}

export const VerificationPage: React.FC<VerificationPageProps> = ({
  initialConceptName,
  initialDocumentId,
  onNavigate,
  onDoubtUpdated
}) => {
  const [quiz, setQuiz] = useState<AssessmentQuiz | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [answers, setAnswers] = useState<{ q1?: number; q2?: string; q3?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  
  // Results state
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    newStatus: MasteryStatus;
    feedback: string[];
    missingConcepts: string[];
  } | null>(null);

  // Past assessment attempts
  const [history, setHistory] = useState<AssessmentRecord[]>([]);

  useEffect(() => {
    loadQuiz(initialConceptName, initialDocumentId);
    loadHistory();
  }, [initialConceptName, initialDocumentId]);

  const loadQuiz = async (cName?: string, docId?: string) => {
    setLoadingQuiz(true);
    setResult(null);
    setAnswers({});
    try {
      const res = await api.generateQuiz({
        conceptName: cName,
        documentId: docId
      });
      setQuiz(res.quiz);
    } catch (e) {
      console.error('Failed to load quiz:', e);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await api.getAssessmentHistory();
      setHistory(res.assessments || []);
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  };

  const handleSubmitAssessment = async () => {
    if (!quiz) return;
    setSubmitting(true);
    try {
      const res = await api.evaluateAssessment({
        quizId: quiz.id,
        conceptName: quiz.conceptName,
        documentId: quiz.documentId,
        answers: {
          q1_selectedOption: answers.q1,
          q2_shortAnswer: answers.q2 || '',
          q3_ownWordsExplanation: answers.q3 || ''
        }
      });

      setResult({
        score: res.score,
        passed: res.passed,
        newStatus: res.newStatus as MasteryStatus,
        feedback: res.feedback,
        missingConcepts: res.missingConcepts
      });

      if (res.passed) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      loadHistory();
      if (onDoubtUpdated) onDoubtUpdated();
    } catch (e) {
      console.error('Failed to evaluate assessment:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto bg-[#070A12] text-slate-100 min-h-screen font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 text-white shadow-lg font-bold">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-extrabold text-white">
              Smart Quiz Studio &amp; Rubric Verification
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Source-grounded rubric checks that verify active recall, conceptual explanation, and application beyond passive reading.
          </p>
        </div>

        <button
          onClick={() => loadQuiz()}
          className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>New Assessment</span>
        </button>
      </div>

      {loadingQuiz ? (
        <div className="rounded-2xl border border-slate-800 bg-[#0C1222] p-12 text-center text-xs text-slate-400 space-y-3">
          <span className="h-3 w-3 rounded-full bg-cyan-400 animate-ping inline-block" />
          <p>Synthesizing source-grounded questions from indexed lecture notes...</p>
        </div>
      ) : quiz ? (
        <div className="space-y-6">
          
          {/* Target Concept Card */}
          <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-r from-violet-950/30 via-slate-900/60 to-cyan-950/30 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                Verification Subject
              </span>
              <h2 className="text-base font-bold text-white">
                {quiz.conceptName}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <BookOpen className="h-3.5 w-3.5 text-violet-400" />
                <span>Source: {quiz.documentTitle}</span>
                <span className="font-semibold text-cyan-400">• Page {quiz.pageNumber}</span>
              </div>
            </div>

            <div className="rounded-xl bg-slate-900/80 p-3 border border-slate-800 max-w-sm text-xs text-slate-300 italic shadow-md">
              "{quiz.sourceExcerpt}"
            </div>
          </div>

          {/* Outcome Banner if Result Available */}
          {result && (
            <div className={`rounded-2xl border p-6 space-y-4 shadow-xl ${
              result.passed 
                ? 'border-emerald-500/30 bg-emerald-950/20' 
                : 'border-amber-500/30 bg-amber-950/20'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-extrabold ${
                    result.passed ? 'bg-emerald-600/20 text-emerald-400 ring-1 ring-emerald-500/30' : 'bg-amber-600/20 text-amber-400 ring-1 ring-amber-500/30'
                  }`}>
                    {result.score}%
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {result.passed ? 'Mastery Demonstrated!' : 'Needs Review & Active Recall'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Status updated to <strong className={result.passed ? 'text-emerald-400' : 'text-amber-400'}>{result.newStatus}</strong> in Doubt Memory.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate('doubts')}
                    className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 border border-slate-800 hover:bg-slate-800"
                  >
                    View Doubt Memory
                  </button>
                  <button
                    onClick={() => loadQuiz()}
                    className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500 shadow-lg"
                  >
                    Next Concept
                  </button>
                </div>
              </div>

              {/* Rubric Feedback items */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Rubric Assessment Feedback:
                </span>
                {result.feedback.map((fb, idx) => (
                  <p key={idx} className="text-slate-300 leading-relaxed">• {fb}</p>
                ))}
              </div>
            </div>
          )}

          {/* Question 1: Distractor-Explained MCQ */}
          {quiz.questions[0] && (
            <div className="rounded-2xl border border-slate-800 bg-[#0C1222] p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  Question 1 • Distractor Invariant Check
                </span>
                <span className="text-xs text-slate-400 font-mono">Weight: 40%</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {quiz.questions[0].question}
              </h3>

              <div className="space-y-2 pt-2">
                {(quiz.questions[0].options || []).map((opt, idx) => (
                  <label
                    key={idx}
                    className={`flex items-start gap-3 rounded-xl p-3 text-xs transition-all border cursor-pointer ${
                      answers.q1 === idx
                        ? 'border-violet-500 bg-violet-950/30 text-white shadow-md'
                        : 'border-slate-800/80 bg-slate-900/50 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <input
                      type="radio"
                      name="q1"
                      checked={answers.q1 === idx}
                      onChange={() => setAnswers(prev => ({ ...prev, q1: idx }))}
                      className="mt-0.5 text-violet-600 focus:ring-0 cursor-pointer"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Question 2: Short Answer / Application */}
          {quiz.questions[1] && (
            <div className="rounded-2xl border border-slate-800 bg-[#0C1222] p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                  Question 2 • Application Scenario
                </span>
                <span className="text-xs text-slate-400 font-mono">Weight: 30%</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {quiz.questions[1].question}
              </h3>

              <textarea
                value={answers.q2 || ''}
                onChange={e => setAnswers(prev => ({ ...prev, q2: e.target.value }))}
                placeholder="State the exact prevention mechanism or condition to invalidate..."
                rows={3}
                className="w-full rounded-xl bg-slate-900 p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 border border-slate-800 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          )}

          {/* Question 3: Feynman Technique */}
          {quiz.questions[2] && (
            <div className="rounded-2xl border border-slate-800 bg-[#0C1222] p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Question 3 • Feynman Technique Check
                </span>
                <span className="text-xs text-slate-400 font-mono">Weight: 30%</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {quiz.questions[2].question}
              </h3>

              <textarea
                value={answers.q3 || ''}
                onChange={e => setAnswers(prev => ({ ...prev, q3: e.target.value }))}
                placeholder="Explain this concept in your own words, using an intuitive analogy..."
                rows={4}
                className="w-full rounded-xl bg-slate-900 p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 border border-slate-800 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSubmitAssessment}
              disabled={submitting || answers.q1 === undefined}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-6 py-3 text-xs font-bold text-white shadow-xl shadow-violet-600/30 hover:from-violet-500 hover:to-cyan-500 disabled:opacity-40 transition-all cursor-pointer"
            >
              <Award className="h-4 w-4" />
              <span>{submitting ? 'Evaluating against Rubrics...' : 'Submit Verification Check'}</span>
            </button>
          </div>

        </div>
      ) : null}

      {/* History Table */}
      {history.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-[#0C1222] p-6 shadow-xl space-y-3">
          <h3 className="text-sm font-bold text-white">
            Past Verification Attempts
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Concept</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Feedback</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map(item => (
                  <tr key={item.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-3 font-bold text-white">{item.conceptName}</td>
                    <td className="py-3 px-3 font-mono font-bold text-cyan-400">{item.score}%</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.passed ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 max-w-xs truncate">{item.feedback}</td>
                    <td className="py-3 px-3 text-slate-500">{new Date(item.completedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
