import React from 'react';
import { HelpCircle, ArrowRight, Clock, X, Lightbulb, Sparkles } from 'lucide-react';
import { Intervention } from '../types';

interface InterventionToastProps {
  intervention: Intervention | null;
  onAccept: (intervention: Intervention) => void;
  onRemindLater: (intervention: Intervention) => void;
  onDismiss: (intervention: Intervention) => void;
}

export const InterventionToast: React.FC<InterventionToastProps> = ({
  intervention,
  onAccept,
  onRemindLater,
  onDismiss
}) => {
  if (!intervention) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-[#0B0F19]/95 p-5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 text-slate-100">
        
        {/* Violet gradient top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-cyan-400 to-indigo-600" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600/20 text-cyan-400 border border-violet-500/30">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
                Context-Aware Intervention
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-white">
                {intervention.title}
              </h4>
            </div>
          </div>
          <button
            onClick={() => onDismiss(intervention)}
            title="Dismiss suggestion"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-3 space-y-2 text-xs">
          <div className="rounded-xl bg-slate-900/80 p-2.5 border border-slate-800">
            <p className="text-slate-300 flex items-start gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span><strong className="text-white">Trigger:</strong> {intervention.reason}</span>
            </p>
          </div>
          <p className="text-slate-200 leading-relaxed text-xs">
            {intervention.recommendation}
          </p>
        </div>

        {/* Action Controls */}
        <div className="mt-4 flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onRemindLater(intervention)}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Clock className="h-3 w-3" />
              Remind Later
            </button>
            <button
              onClick={() => onDismiss(intervention)}
              className="rounded-lg px-2 py-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>

          <button
            onClick={() => onAccept(intervention)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:from-violet-500 hover:to-cyan-500 transition-all cursor-pointer"
          >
            <span>{intervention.actionLabel || 'Try This'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
