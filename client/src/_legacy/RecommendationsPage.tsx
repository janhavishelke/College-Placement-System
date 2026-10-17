import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Clock, 
  Sparkles, 
  Layers,
  X,
  Target,
  Play
} from 'lucide-react';
import { Intervention, DoubtRecord } from '../types';
import { api } from '../services/api';
import { Screen } from '../components/LMSSidebar';

interface RecommendationsPageProps {
  onNavigate: (screen: Screen) => void;
  onStartQuizForConcept: (conceptName: string, docId?: string) => void;
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({
  onNavigate,
  onStartQuizForConcept
}) => {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [doubts, setDoubts] = useState<DoubtRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [intRes, doubtsRes] = await Promise.all([
        api.getInterventions(),
        api.getDoubts()
      ]);
      setInterventions(intRes.interventions || []);
      setDoubts(doubtsRes.doubts || []);
    } catch (e) {
      console.error('Failed to load recommendations:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await api.respondIntervention(id, 'dismiss');
      setInterventions(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      console.error('Failed to dismiss:', e);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto bg-[#070A12] text-slate-100 min-h-screen font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 text-white shadow-lg font-bold">
              <Lightbulb className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-extrabold text-white">
              Adaptive Learning Recommendations
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Targeted pedagogical interventions generated from your active questions, doubts, and assessment weak points.
          </p>
        </div>

        <button
          onClick={() => onNavigate('dashboard')}
          className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white border border-slate-800 transition-colors"
        >
          Campus Dashboard
        </button>
      </div>

      {/* Interventions Stream */}
      <div className="space-y-4">
        {interventions.length > 0 ? (
          interventions.map(item => (
            <div 
              key={item.id}
              className="rounded-2xl border border-violet-500/25 bg-[#0C1222] p-6 shadow-xl space-y-4 relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 ring-1 ring-violet-500/30">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
                      Priority Intervention
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Reason: <strong className="text-slate-200">{item.reason}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDismiss(item.id)}
                  title="Dismiss recommendation"
                  className="rounded-lg p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-xl bg-slate-900/80 p-3.5 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                {item.recommendation}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-xs text-slate-400">
                  Concept: <strong className="text-cyan-400">{item.concept || 'General Review'}</strong>
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDismiss(item.id)}
                    className="rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Remind Later
                  </button>
                  <button
                    onClick={() => {
                      if (item.concept) {
                        onStartQuizForConcept(item.concept, item.documentId);
                      } else {
                        onNavigate('workspace');
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:from-violet-500 hover:to-cyan-500 transition-all cursor-pointer"
                  >
                    <span>{item.actionLabel || 'Apply Intervention'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-[#0C1222] p-12 text-center text-xs text-slate-400 space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <p className="font-bold text-white text-sm">No Pending Interventions</p>
            <p>Your conceptual retention is high. Ask new questions in AI Workspace to generate targeted feedback.</p>
          </div>
        )}
      </div>

    </div>
  );
};
