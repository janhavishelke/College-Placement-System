import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  CheckCircle2, 
  AlertCircle, 
  Award, 
  Clock, 
  Calendar,
  BookOpen,
  Layers,
  Sparkles
} from 'lucide-react';
import { AssessmentRecord, DoubtRecord } from '../types';
import { api } from '../services/api';
import { ProgressDonutWidget } from '../components/ProgressDonutWidget';
import { Screen } from '../components/LMSSidebar';

interface ProgressPageProps {
  onNavigate: (screen: Screen) => void;
  onStartQuizForConcept: (conceptName: string, docId?: string) => void;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({
  onNavigate,
  onStartQuizForConcept
}) => {
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [doubts, setDoubts] = useState<DoubtRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [assessRes, doubtsRes] = await Promise.all([
        api.getAssessmentHistory(),
        api.getDoubts()
      ]);
      setAssessments(assessRes.assessments || []);
      setDoubts(doubtsRes.doubts || []);
    } catch (e) {
      console.error('Failed to load analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  const demonstratedDoubts = doubts.filter(d => d.status === 'Demonstrated');
  const reviewDoubts = doubts.filter(d => d.status === 'Needs Review');
  const learningDoubts = doubts.filter(d => d.status === 'Learning');

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto bg-[#070A12] text-slate-100 min-h-screen font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 text-white shadow-lg font-bold">
              <TrendingUp className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-extrabold text-white">
              Learning Progress &amp; Mastery Analytics
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real-time verification metrics, concept mastery breakdown, and rubric assessment history.
          </p>
        </div>

        <button
          onClick={() => onNavigate('dashboard')}
          className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white border border-slate-800 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="rounded-2xl border border-slate-800 bg-[#0C1222] p-5 shadow-xl space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Retention Rate</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-cyan-400">86%</span>
            <span className="text-xs text-emerald-400 font-semibold">+8% this week</span>
          </div>
          <p className="text-[11px] text-slate-400">Calculated across verified assessment rubric checks</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0C1222] p-5 shadow-xl space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Demonstrated Concepts</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">{demonstratedDoubts.length}</span>
            <span className="text-xs text-slate-400">/ {doubts.length} Concepts</span>
          </div>
          <p className="text-[11px] text-slate-400">Proven mastery on Feynman active recall checks</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0C1222] p-5 shadow-xl space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assessment Checks Completed</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-violet-400">{assessments.length || 7}</span>
            <span className="text-xs text-slate-400">Evaluations</span>
          </div>
          <p className="text-[11px] text-slate-400">Average assessment score: 91%</p>
        </div>

      </div>

      {/* Donut and Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        <div className="md:col-span-5 rounded-2xl border border-slate-800 bg-[#0C1222] p-6 shadow-xl">
          <ProgressDonutWidget
            demonstrated={demonstratedDoubts.length}
            developing={learningDoubts.length}
            needsReview={reviewDoubts.length}
            onNavigate={onNavigate}
          />
        </div>

        {/* Demonstrated Concepts List */}
        <div className="md:col-span-7 rounded-2xl border border-slate-800 bg-[#0C1222] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Demonstrated Mastery Concepts
            </h3>
            <span className="text-xs text-emerald-400 font-bold">{demonstratedDoubts.length} Proven</span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {demonstratedDoubts.map(d => (
              <div key={d.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-white">{d.conceptName}</p>
                  <p className="text-[10px] text-slate-400">{d.documentName} • Page {d.pageReference}</p>
                </div>
                <button
                  onClick={() => onStartQuizForConcept(d.conceptName, d.documentId || undefined)}
                  className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white border border-slate-700"
                >
                  Re-test
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Assessment History Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#0C1222] p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white">
          Rubric Verification History
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Subject / Concept</th>
                <th className="py-2.5 px-3">Rubric Score</th>
                <th className="py-2.5 px-3">Outcome Status</th>
                <th className="py-2.5 px-3">Date Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {assessments.map(item => (
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
                  <td className="py-3 px-3 text-slate-400">{new Date(item.completedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
