import React from 'react';
import { Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { DoubtRecord } from '../types';
import { Screen } from './LMSSidebar';

interface RevisionScheduleWidgetProps {
  doubts: DoubtRecord[];
  onStartReview?: (conceptName: string, docId?: string) => void;
  onStartQuiz?: (conceptName: string, docId?: string) => void;
  onNavigate?: (screen: Screen) => void;
}

export const RevisionScheduleWidget: React.FC<RevisionScheduleWidgetProps> = ({
  doubts,
  onStartReview,
  onStartQuiz,
  onNavigate
}) => {
  const pendingDoubts = doubts.filter(d => d.status === 'Needs Review');

  const handleAction = (conceptName: string, docId?: string) => {
    if (onStartQuiz) {
      onStartQuiz(conceptName, docId);
    } else if (onStartReview) {
      onStartReview(conceptName, docId);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0C1222] p-4 space-y-3 shadow-xl text-slate-100">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-cyan-400" />
          <h4 className="text-xs font-bold text-white">Revision Schedule</h4>
        </div>
        <span className="text-[10px] rounded-full bg-amber-950/80 text-amber-400 px-2 py-0.5 font-bold border border-amber-800/40">
          {pendingDoubts.length} Due Today
        </span>
      </div>

      <div className="space-y-2">
        {pendingDoubts.slice(0, 3).map(d => (
          <div 
            key={d.id}
            onClick={() => handleAction(d.conceptName, d.documentId || undefined)}
            className="group cursor-pointer rounded-xl bg-slate-900/80 p-2.5 border border-slate-800 hover:border-violet-500/40 hover:bg-slate-900 transition-all flex items-center justify-between gap-2"
          >
            <div className="truncate">
              <p className="text-xs font-bold text-white group-hover:text-cyan-400 truncate">
                {d.conceptName}
              </p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                {d.documentName} • p. {d.pageReference}
              </p>
            </div>
            <button className="shrink-0 rounded p-1 text-slate-500 group-hover:text-cyan-400">
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {pendingDoubts.length === 0 && (
          <div className="py-4 text-center text-xs text-slate-500">
            All revision concepts demonstrated!
          </div>
        )}
      </div>
    </div>
  );
};
