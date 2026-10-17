import React, { useState, useEffect } from 'react';
import { downloadPdfFile } from '../utils/downloadHelpers';

interface TopicReport {
  name: string;
  status: string;
  masteryPercent: number;
  reviewDate: string;
}

interface RevisionDay {
  day: string;
  topic: string;
  activity: string;
}

export const ReportsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const [data, setData] = useState<{
    overallMastery: number;
    topics: TopicReport[];
    revisionPlan: RevisionDay[];
    studentName: string;
    course: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadReport();
    }
  }, [isOpen]);

  const loadReport = async () => {
    try {
      const res = await fetch('/api/reports');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const handleDownloadPdf = () => {
    if (!data) return;

    const html = `
      <div class="card">
        <h3>Student Learning Assessment & Mastery Report</h3>
        <p><strong>Student:</strong> ${data.studentName} | <strong>Course:</strong> ${data.course}</p>
        <p><strong>Overall Active Recall Mastery:</strong> <span style="font-size:18px; font-weight:800; color:#FF5E4D;">${data.overallMastery}%</span></p>
      </div>

      <div class="card">
        <h3>Per-Topic Mastery Breakdown</h3>
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <thead>
            <tr style="border-bottom:1px solid #e5d7c5; text-align:left;">
              <th style="padding:6px;">Topic</th>
              <th style="padding:6px;">Status</th>
              <th style="padding:6px;">Mastery</th>
              <th style="padding:6px;">Next Review</th>
            </tr>
          </thead>
          <tbody>
            ${data.topics.map(t => `
              <tr style="border-bottom:1px solid #f2ece4;">
                <td style="padding:8px 6px; font-weight:600;">${t.name}</td>
                <td style="padding:8px 6px;">${t.status}</td>
                <td style="padding:8px 6px; font-weight:700; color:${t.masteryPercent >= 80 ? '#065f46' : '#991b1b'};">${t.masteryPercent}%</td>
                <td style="padding:8px 6px;">${t.reviewDate}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="card">
        <h3>Spaced Repetition 7-Day Revision Roadmap</h3>
        <ul style="font-size:13px; line-height:1.7;">
          ${data.revisionPlan.map(r => `
            <li><strong>${r.day} — ${r.topic}:</strong> ${r.activity}</li>
          `).join('')}
        </ul>
      </div>
    `;

    downloadPdfFile("UNERA — Comprehensive Topic Report & Revision Plan", html, "Unera_Study_Report.pdf");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#FFFFFF] w-full max-w-3xl max-h-[90vh] rounded-[28px] border border-[#F2ECE4] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#F2ECE4] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
            <div>
              <h3 className="font-bold text-sm text-[#27211E]">
                Reports & Spaced Revision Plan (Feature 9)
              </h3>
              <p className="text-[11px] text-[#6B625E]">
                Per-topic mastery metrics grounded in active recall and doubt resolution.
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#FAF7F2]">
          {data ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-[#F2ECE4]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] block">
                    Overall Retention
                  </span>
                  <span className="text-2xl font-extrabold text-[#FF5E4D] mt-1 block">
                    {data.overallMastery}%
                  </span>
                  <span className="text-[10px] text-[#065F46] font-medium">
                    Evidence-verified score
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#F2ECE4]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] block">
                    Tracked Concepts
                  </span>
                  <span className="text-2xl font-extrabold text-[#27211E] mt-1 block">
                    {data.topics.length}
                  </span>
                  <span className="text-[10px] text-[#6B625E]">
                    In active review cycle
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#F2ECE4]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] block">
                    Upcoming Drill
                  </span>
                  <span className="text-sm font-bold text-[#B45309] mt-1 block">
                    Base Case Mechanics
                  </span>
                  <span className="text-[10px] text-[#92400E]">
                    Scheduled for Today
                  </span>
                </div>
              </div>

              {/* Per-Topic Table */}
              <div className="bg-white rounded-2xl p-4 border border-[#F2ECE4]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B625E] mb-3">
                  Per-Topic Mastery Assessment
                </h4>

                <div className="space-y-2">
                  {data.topics.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-[#F2ECE4] bg-[#FAF7F2] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#27211E] block">{t.name}</span>
                        <span className={`text-[10px] font-semibold ${
                          t.status === 'Demonstrated' ? 'text-[#065F46]' : 'text-[#991B1B]'
                        }`}>
                          {t.status}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-xs text-[#27211E]">
                          {t.masteryPercent}%
                        </span>
                        <span className="text-[10px] text-[#8C827A] block">
                          Review: {t.reviewDate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spaced Repetition Plan */}
              <div className="bg-white rounded-2xl p-4 border border-[#F2ECE4]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B625E] mb-3">
                  Next 7-Day Spaced Repetition Plan
                </h4>

                <div className="space-y-2">
                  {data.revisionPlan.map((r, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl border border-[#F2ECE4] bg-[#FAF7F2] flex items-start gap-3 text-xs"
                    >
                      <span className="font-mono font-bold text-[11px] text-[#FF5E4D] shrink-0 mt-0.5">
                        {r.day}
                      </span>
                      <div>
                        <span className="font-bold text-[#27211E] block">{r.topic}</span>
                        <span className="text-[11px] text-[#6B625E]">{r.activity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-xs text-[#8C827A]">
              Loading comprehensive learning report...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
