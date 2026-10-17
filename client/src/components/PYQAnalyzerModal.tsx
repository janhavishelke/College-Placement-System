import React, { useState, useEffect } from 'react';
import { downloadPdfFile } from '../utils/downloadHelpers';

interface PYQQuestion {
  id: number;
  question: string;
  concept: string;
  years: number[];
  frequency: number;
  marks: string;
  docId: number;
  pageNo: number;
  answer: string;
}

export const PYQAnalyzerModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const [pyqs, setPyqs] = useState<PYQQuestion[]>([]);
  const [filterYear, setFilterYear] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      loadPYQs();
    }
  }, [isOpen]);

  const loadPYQs = async () => {
    try {
      const res = await fetch('/api/pyq');
      const data = await res.json();
      setPyqs(data.questions || []);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const filtered = filterYear === 'all'
    ? pyqs
    : pyqs.filter(q => q.years.includes(parseInt(filterYear, 10)));

  const handleDownloadPdf = () => {
    const html = filtered.map((q, idx) => `
      <div class="card">
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <span class="badge">Frequency: Appeared ${q.frequency} times • ${q.marks}</span>
          <span style="font-size:11px; font-weight:700; color:#b45309;">Page ${q.pageNo}</span>
        </div>
        <div style="font-size:16px; font-weight:700; color:#27211e; margin-bottom:8px;">
          Q${idx + 1}: ${q.question}
        </div>
        <div style="font-size:11px; color:#6b625e; margin-bottom:8px;">
          <strong>Exam Years:</strong> ${q.years.join(', ')}
        </div>
        <div style="font-size:13px; line-height:1.6; color:#1e1e24; background:#fff; padding:12px; border-radius:8px; border:1px solid #e5d7c5;">
          <strong>Verified Answer from Notes:</strong><br>${q.answer}
        </div>
      </div>
    `).join('');

    downloadPdfFile("UNERA — Previous Year Exam Questions (PYQ) Analysis", html, "Unera_PYQ_Analyzer_Sheet.pdf");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#FFFFFF] w-full max-w-3xl max-h-[90vh] rounded-[28px] border border-[#F2ECE4] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#F2ECE4] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            <div>
              <h3 className="font-bold text-sm text-[#27211E]">
                PYQ Analyzer (Feature 14)
              </h3>
              <p className="text-[11px] text-[#6B625E]">
                Top repeated exam questions with years, repetition frequency, and answers from notes.
              </p>
            </div>
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

        {/* Filter Bar */}
        <div className="px-5 py-2.5 bg-[#FAF7F2] border-b border-[#F2ECE4] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#8C827A] font-semibold text-[11px]">Filter Exam Year:</span>
            <select
              value={filterYear}
              onChange={e => setFilterYear(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-full border border-[#D8CEBE] bg-white text-[#27211E]"
            >
              <option value="all">All Exam Years (2017-2024)</option>
              <option value="2024">2024 Exam</option>
              <option value="2023">2023 Exam</option>
              <option value="2022">2022 Exam</option>
              <option value="2021">2021 Exam</option>
            </select>
          </div>
          <span className="text-[11px] text-[#065F46] font-semibold">
            {filtered.length} High-Yield Questions
          </span>
        </div>

        {/* List of PYQ Questions */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#FAF7F2]">
          {filtered.map(q => (
            <div key={q.id} className="bg-white rounded-2xl p-4 border border-[#F2ECE4] shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold">
                    Repeated {q.frequency}x in Finals
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E5D7C5]">
                    {q.marks}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FCF4E3] text-[#B45309] font-bold">
                  Page {q.pageNo} in Notes
                </span>
              </div>

              <h4 className="text-sm font-bold text-[#27211E] mb-2 leading-snug">
                {q.question}
              </h4>

              <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[11px] text-[#6B625E]">
                <span className="font-semibold text-[#8C827A]">Exam Years:</span>
                {q.years.map(y => (
                  <span key={y} className="px-2 py-0.2 rounded bg-[#FAF7F2] border border-[#E5D7C5] font-mono text-[10px]">
                    {y}
                  </span>
                ))}
              </div>

              {/* Answer box */}
              <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#F2ECE4] text-xs text-[#27211E] leading-relaxed">
                <span className="font-bold text-[#FF5E4D] block mb-1">Source-Grounded Model Answer:</span>
                {q.answer}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
