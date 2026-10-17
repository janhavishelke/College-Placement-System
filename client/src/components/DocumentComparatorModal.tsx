import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DocumentItem, DocumentComparisonResult } from '../types';

interface DocumentComparatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

export const DocumentComparatorModal: React.FC<DocumentComparatorModalProps> = ({
  isOpen,
  onClose,
  theme = 'light'
}) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([1, 2]);
  const [conceptInput, setConceptInput] = useState('Recursion');
  const [result, setResult] = useState<DocumentComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDocs();
    }
  }, [isOpen]);

  const loadDocs = async () => {
    try {
      const docs = await api.getDocuments();
      setDocuments(docs);
      if (docs.length >= 2) {
        setSelectedDocIds([docs[0].id, docs[1].id]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunComparison = async () => {
    if (!conceptInput.trim() || selectedDocIds.length < 2) return;
    setIsLoading(true);
    try {
      const res = await api.compareDocuments(conceptInput, selectedDocIds);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDocSelection = (id: number) => {
    setSelectedDocIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border shadow-2xl flex flex-col transition-colors ${
          isDark ? 'bg-[#0F172A] border-[#334155] text-[#F8FAFC]' : 'bg-white border-[#E2E8F0] text-[#1E293B]'
        }`}
      >
        {/* Header */}
        <div className={`p-5 sm:p-6 border-b flex items-center justify-between sticky top-0 z-10 ${
          isDark ? 'bg-[#0F172A]/95 border-[#334155]' : 'bg-white/95 border-[#F1F5F9]'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#06B6D4]/15 text-[#06B6D4] flex items-center justify-center text-xl font-bold">
              📑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  Cross-Document Multi-Source Comparator
                </h2>
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#06B6D4]/15 text-[#06B6D4]">
                  Feature 1
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Compare how different lecture notes, textbooks, and presentations explain the same topic
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

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Controls: Concept & Document Checkboxes */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isDark ? 'bg-[#1E293B]/40 border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}>
            <div>
              <label className="text-xs font-bold text-[#64748B]">Concept or Keyword to Compare:</label>
              <input
                type="text"
                value={conceptInput}
                onChange={e => setConceptInput(e.target.value)}
                placeholder="e.g. Recursion, Base Case, Stack Memory"
                className={`w-full mt-1 px-3 py-2 text-xs sm:text-sm rounded-xl border outline-none ${
                  isDark ? 'bg-[#0F172A] border-[#334155] text-white' : 'bg-white border-[#E2E8F0]'
                }`}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#64748B]">Select Documents to Cross-Reference:</label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {documents.map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDocSelection(d.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      selectedDocIds.includes(d.id)
                        ? 'bg-[#06B6D4] text-white border-[#06B6D4]'
                        : 'bg-white dark:bg-[#0F172A] border-[#E2E8F0] dark:border-[#334155] text-[#64748B]'
                    }`}
                  >
                    <span>{selectedDocIds.includes(d.id) ? '✓' : '+'}</span>
                    <span>{d.title}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleRunComparison}
                disabled={isLoading || selectedDocIds.length < 2 || !conceptInput.trim()}
                className="px-5 py-2 font-bold text-xs rounded-xl bg-[#06B6D4] text-white hover:bg-[#0891B2] disabled:opacity-50 transition-all shadow-sm"
              >
                {isLoading ? 'Comparing Sources...' : 'Synthesize Cross-Source Comparison →'}
              </button>
            </div>
          </div>

          {/* Results Comparison View */}
          {result && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {result.sources.map((s, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border flex flex-col justify-between ${
                      isDark ? 'bg-[#1E293B]/40 border-[#334155]' : 'bg-white border-[#E2E8F0]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-[#06B6D4]">Source {idx + 1}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 font-bold">
                          Page {s.pageNo}
                        </span>
                      </div>
                      <h4 className="font-black text-sm mt-1">{s.docTitle}</h4>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-2 italic bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/5">
                        "{s.excerpt}..."
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#E2E8F0] dark:border-[#334155] text-[11px] text-[#64748B]">
                      Coverage Focus: <span className="font-bold text-inherit">{s.coverageType}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Synthesis Card */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-[#06B6D4]/10 border-[#06B6D4]/30' : 'bg-[#06B6D4]/5 border-[#06B6D4]/20'
              }`}>
                <span className="text-[10px] uppercase font-black text-[#06B6D4] tracking-wider">
                  AI Cross-Document Comparative Synthesis
                </span>
                <p className="text-xs sm:text-sm font-medium mt-1 leading-relaxed whitespace-pre-wrap">
                  {result.synthesis}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 sm:p-5 border-t flex items-center justify-end ${
          isDark ? 'bg-[#0F172A] border-[#334155]' : 'bg-[#F8FAFC] border-[#F1F5F9]'
        }`}>
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold text-xs rounded-xl bg-[#06B6D4] text-white hover:bg-[#0891B2] transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
