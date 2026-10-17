import React, { useState } from 'react';
import { ConceptItem } from '../types';

interface ConceptDNAModalProps {
  concepts: ConceptItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelectConcept: (concept: ConceptItem) => void;
}

export const ConceptDNAModal: React.FC<ConceptDNAModalProps> = ({
  concepts,
  isOpen,
  onClose,
  onSelectConcept
}) => {
  const [selectedConcept, setSelectedConcept] = useState<ConceptItem | null>(concepts[0] || null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[#FFFFFF] w-full max-w-4xl max-h-[90vh] rounded-[28px] border border-[#F2ECE4] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#F2ECE4] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#8B5CF6]" />
            <div>
              <h2 className="text-lg font-bold text-[#27211E]">
                Concept DNA & Prerequisite Graph
              </h2>
              <p className="text-xs text-[#6B625E]">
                Interactive conceptual map derived directly from your notes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#D8CEBE] text-[#6B625E] hover:text-[#27211E] flex items-center justify-center font-bold"
          >
            x
          </button>
        </div>

        {/* Content Body: Split into Concepts Grid and Details */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Concept Nodes List */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C827A] mb-1">
              Course Concepts ({concepts.length})
            </span>
            {concepts.map(c => {
              const isSelected = selectedConcept?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedConcept(c)}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    isSelected
                      ? 'bg-[#F8EDFB] border-[#D8B4FE] shadow-sm'
                      : 'bg-[#FAF7F2] border-[#F2ECE4] hover:bg-[#F3E8FF]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-[#27211E]">{c.name}</span>
                    {c.page_no && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-[#8B5CF6] border border-[#E9D5FF]">
                        p.{c.page_no}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {c.prerequisites && c.prerequisites.length > 0 ? (
                      c.prerequisites.map((p, pi) => (
                        <span key={pi} className="text-[9px] px-1.5 py-0.2 rounded-full bg-white text-[#6B7280] border border-[#E5E7EB]">
                          requires {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#E9F7F0] text-[#065F46]">
                        Foundational
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Concept Inspector */}
          {selectedConcept && (
            <div className="md:col-span-2 bg-[#FAF7F2] rounded-2xl p-5 border border-[#F2ECE4] flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8B5CF6]">
                    Concept Specification
                  </span>
                  <h3 className="text-xl font-bold text-[#27211E] mt-0.5">
                    {selectedConcept.name}
                  </h3>
                </div>
                {selectedConcept.page_no && (
                  <button
                    onClick={() => {
                      onSelectConcept(selectedConcept);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-full bg-[#FF5E4D] text-white text-xs font-semibold hover:bg-[#E84D3C] transition-colors"
                  >
                    Open Page {selectedConcept.page_no} & Chat
                  </button>
                )}
              </div>

              {/* Definition */}
              <div className="bg-white p-3.5 rounded-xl border border-[#F2ECE4]">
                <h4 className="text-xs font-bold text-[#6B625E] uppercase mb-1">
                  Verified Definition
                </h4>
                <p className="text-xs sm:text-sm text-[#27211E] leading-relaxed">
                  {selectedConcept.definition}
                </p>
              </div>

              {/* Prerequisites Chain */}
              <div className="bg-white p-3.5 rounded-xl border border-[#F2ECE4]">
                <h4 className="text-xs font-bold text-[#6B625E] uppercase mb-2">
                  Prerequisites Flow
                </h4>
                {selectedConcept.prerequisites && selectedConcept.prerequisites.length > 0 ? (
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    {selectedConcept.prerequisites.map((p, idx) => (
                      <span key={idx} className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-full bg-[#EAF3FB] text-[#1E3A8A] font-semibold">
                          {p}
                        </span>
                        <span className="text-[#8C827A]">→</span>
                      </span>
                    ))}
                    <span className="px-2.5 py-1 rounded-full bg-[#F8EDFB] text-[#6B21A8] font-bold">
                      {selectedConcept.name}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-[#065F46] font-medium">
                    This is a foundational concept. No prior prerequisites needed.
                  </p>
                )}
              </div>

              {/* Simpler Analogy */}
              {selectedConcept.simpler_explanation && (
                <div className="bg-[#FCF4E3] p-3.5 rounded-xl border border-[#FDE68A]">
                  <h4 className="text-xs font-bold text-[#92400E] uppercase mb-1">
                    Simpler Intuition & Analogy
                  </h4>
                  <p className="text-xs sm:text-sm text-[#27211E] leading-relaxed">
                    {selectedConcept.simpler_explanation}
                  </p>
                </div>
              )}

              {/* Common Pitfall / Confusion */}
              {selectedConcept.common_confusion && (
                <div className="bg-[#FEE2E2] p-3.5 rounded-xl border border-[#FCA5A5]">
                  <h4 className="text-xs font-bold text-[#991B1B] uppercase mb-1">
                    Common Student Misconception
                  </h4>
                  <p className="text-xs sm:text-sm text-[#7F1D1D] leading-relaxed">
                    {selectedConcept.common_confusion}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
