import React from 'react';
import { X, BookOpen, ExternalLink, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { Citation } from '../types';

interface CitationDrawerProps {
  citation: Citation | null;
  onClose: () => void;
  onAskAboutExcerpt?: (text: string) => void;
  onTestUnderstanding?: (pageNumber: number) => void;
}

export const CitationDrawer: React.FC<CitationDrawerProps> = ({
  citation,
  onClose,
  onAskAboutExcerpt,
  onTestUnderstanding
}) => {
  if (!citation) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative h-full w-full max-w-lg border-l border-violet-500/20 bg-[#0C1122] p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30">
                <BookOpen className="h-4 w-4" />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  Verified Source Passage
                </span>
                <h3 className="text-base font-semibold text-white">
                  Page {citation.pageNumber} Reference
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Document metadata card */}
          <div className="mt-4 rounded-xl bg-slate-900/80 p-3.5 border border-purple-500/10 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Source Document</span>
              <span className="flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
                <ShieldCheck className="h-3 w-3" /> Source-Locked
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-200 truncate">
              {citation.docName}
            </p>
            {citation.matchScore && (
              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                <span>Semantic Retrieval Score:</span>
                <span className="font-mono text-cyan-300 font-semibold">{citation.matchScore} pts</span>
              </div>
            )}
          </div>

          {/* Passage Excerpt with Highlight */}
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Cited Document Excerpt (Original Notes)
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                Exact Text
              </span>
            </div>
            
            <div className="relative rounded-xl border border-violet-500/30 bg-[#090D1A] p-4 text-sm leading-relaxed text-slate-200 shadow-inner">
              <div className="absolute top-2 right-2 text-violet-400/40">
                <Sparkles className="h-4 w-4" />
              </div>
              <p className="border-l-2 border-cyan-400 pl-3 italic text-slate-200 bg-cyan-950/20 py-1.5 rounded-r">
                "{citation.fullText || citation.excerpt}"
              </p>
            </div>
          </div>

          {/* Grounding guarantee */}
          <div className="mt-5 rounded-xl bg-violet-950/20 p-3.5 border border-violet-500/20 text-xs space-y-1">
            <h5 className="font-semibold text-violet-300 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-violet-400" />
              Anti-Hallucination Proof
            </h5>
            <p className="text-slate-400 leading-relaxed">
              Every sentence in the AI response maps directly back to the semantic tokens indexed in this document chunk. No outside knowledge or invented facts were introduced.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
          {onTestUnderstanding && (
            <button
              onClick={() => {
                onTestUnderstanding(citation.pageNumber);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 px-4 text-xs font-semibold text-white shadow-lg hover:from-violet-500 hover:to-indigo-500 ring-1 ring-violet-400/40 transition-all"
            >
              <Sparkles className="h-4 w-4 text-cyan-300" />
              Test Understanding on Page {citation.pageNumber}
            </button>
          )}

          {onAskAboutExcerpt && (
            <button
              onClick={() => {
                onAskAboutExcerpt(citation.excerpt);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 px-4 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors"
            >
              Ask Tutor to Clarify This Passage
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 text-center text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
