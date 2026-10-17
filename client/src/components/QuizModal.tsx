import React, { useState, useEffect } from 'react';
import { downloadPdfFile } from '../utils/downloadHelpers';

interface QuizQuestion {
  id: number;
  concept: string;
  pageNo: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const QuizModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const [mode, setMode] = useState<'5_questions' | 'proactive' | 'mistakes_only'>('5_questions');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadQuiz(mode);
    }
  }, [isOpen, mode]);

  const loadQuiz = async (selectedMode: string) => {
    setQuizSubmitted(false);
    setSelectedAnswers({});
    setResult(null);
    try {
      const res = await fetch(`/api/quiz?mode=${selectedMode}`);
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (err) {
      console.error('Failed to load quiz:', err);
    }
  };

  if (!isOpen) return null;

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleSubmitQuiz = async () => {
    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: selectedAnswers })
      });
      const data = await res.json();
      setResult(data);
      setQuizSubmitted(true);
    } catch (err) {
      console.error('Failed to submit quiz:', err);
    }
  };

  const handleDownloadPdf = () => {
    const html = questions.map((q, idx) => `
      <div class="card">
        <span class="badge">Question ${idx + 1} • Page ${q.pageNo}</span>
        <div style="font-size:15px; font-weight:700; margin:6px 0;">${q.question}</div>
        <ol type="A" style="font-size:13px; margin-left:20px;">
          ${q.options.map((opt, i) => `<li style="${i === q.correctIndex ? 'font-weight:bold; color:#065f46;' : ''}">${opt} ${i === q.correctIndex ? '✓ (Correct)' : ''}</li>`).join('')}
        </ol>
        <div style="font-size:12px; color:#6b625e; margin-top:8px; border-top:1px dashed #e5d7c5; padding-top:6px;">
          <strong>Source Notes Reference:</strong> ${q.explanation}
        </div>
      </div>
    `).join('');

    downloadPdfFile(`UNERA Quiz — ${mode.replace('_', ' ').toUpperCase()}`, html, `Unera_Quiz_${mode}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#FFFFFF] w-full max-w-2xl max-h-[90vh] rounded-[28px] border border-[#F2ECE4] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#F2ECE4] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
            <h3 className="font-bold text-sm text-[#27211E]">
              Source-Grounded Quiz Engine (Feature 10)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="px-3 py-1 text-xs rounded-full bg-white border border-[#D8CEBE] text-[#27211E] hover:bg-[#F2ECE4] font-medium"
            >
              📄 Download PDF
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded-full border text-xs flex items-center justify-center hover:bg-gray-100">
              ✕
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-5 py-2.5 bg-[#FAF7F2] border-b border-[#F2ECE4] flex items-center gap-2 text-xs">
          <span className="text-[#8C827A] font-semibold text-[11px] mr-1">Modes:</span>
          <button
            onClick={() => setMode('5_questions')}
            className={`px-3 py-1 rounded-full font-semibold transition-all ${
              mode === '5_questions' ? 'bg-[#FF5E4D] text-white' : 'bg-white text-[#27211E] border border-[#D8CEBE]'
            }`}
          >
            5 Questions from Notes
          </button>
          <button
            onClick={() => setMode('proactive')}
            className={`px-3 py-1 rounded-full font-semibold transition-all ${
              mode === 'proactive' ? 'bg-[#FF5E4D] text-white' : 'bg-white text-[#27211E] border border-[#D8CEBE]'
            }`}
          >
            Proactive 1-Question Check
          </button>
          <button
            onClick={() => setMode('mistakes_only')}
            className={`px-3 py-1 rounded-full font-semibold transition-all ${
              mode === 'mistakes_only' ? 'bg-[#FF5E4D] text-white' : 'bg-white text-[#27211E] border border-[#D8CEBE]'
            }`}
          >
            Quiz from Mistakes Only
          </button>
        </div>

        {/* Quiz Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#FAF7F2]">
          {questions.map((q, qIndex) => {
            const selectedOpt = selectedAnswers[q.id];

            return (
              <div key={q.id} className="bg-white rounded-2xl p-4 border border-[#F2ECE4] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#FF5E4D]">
                    Question {qIndex + 1}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FCF4E3] text-[#B45309] font-bold">
                    [p.{q.pageNo}]
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-[#27211E] mb-3">
                  {q.question}
                </p>

                {/* Options */}
                <div className="space-y-1.5">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selectedOpt === optIdx;
                    let optStyle = 'bg-[#FAF7F2] border-[#E5D7C5] text-[#27211E] hover:bg-[#F2ECE4]';

                    if (quizSubmitted) {
                      if (optIdx === q.correctIndex) {
                        optStyle = 'bg-[#E9F7F0] border-[#A7F3D0] text-[#065F46] font-bold';
                      } else if (isSelected && optIdx !== q.correctIndex) {
                        optStyle = 'bg-[#FEE2E2] border-[#FCA5A5] text-[#991B1B]';
                      }
                    } else if (isSelected) {
                      optStyle = 'bg-[#FF5E4D] border-[#FF5E4D] text-white font-medium';
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${optStyle}`}
                      >
                        <span className="font-bold mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation on submit */}
                {quizSubmitted && (
                  <div className="mt-3 pt-2.5 border-t border-[#F2ECE4] text-[11px] text-[#6B625E]">
                    <span className="font-bold text-[#27211E]">Notes Citation: </span>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#F2ECE4] flex items-center justify-between">
          <div>
            {result && (
              <span className="text-xs font-bold text-[#065F46] bg-[#E9F7F0] px-3 py-1 rounded-full">
                Score: {result.score} / {result.total} ({result.percentage}%)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!quizSubmitted ? (
              <button
                onClick={handleSubmitQuiz}
                disabled={Object.keys(selectedAnswers).length === 0}
                className="px-5 py-2 rounded-full bg-[#FF5E4D] text-white text-xs font-bold hover:bg-[#E84D3C] disabled:opacity-40 transition-colors shadow-sm"
              >
                Submit & Grade Answers
              </button>
            ) : (
              <button
                onClick={() => loadQuiz(mode)}
                className="px-4 py-1.5 rounded-full border border-[#D8CEBE] text-xs font-semibold text-[#27211E] hover:bg-[#FAF7F2]"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
