import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Play, 
  Sparkles, 
  Flame,
  Award,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { StudyPlan, StudyPlanDay } from '../types';
import { Screen } from '../components/LMSSidebar';
import { api } from '../services/api';

interface StudyPlannerPageProps {
  onNavigate: (screen: Screen) => void;
  onOpenTopicInWorkspace: (topic: string) => void;
  onStartQuizForTopic: (topic: string) => void;
}

export const StudyPlannerPage: React.FC<StudyPlannerPageProps> = ({
  onNavigate,
  onOpenTopicInWorkspace,
  onStartQuizForTopic
}) => {
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [completedDays, setCompletedDays] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudyPlan();
  }, []);

  const loadStudyPlan = async () => {
    try {
      setLoading(true);
      const res = await api.getStudyPlan();
      setStudyPlan(res);
    } catch (e) {
      console.error('Failed to load study plan:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleDayCompletion = (idx: number) => {
    setCompletedDays(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const completedCount = Object.values(completedDays).filter(Boolean).length;
  const totalDays = studyPlan?.dailySchedule.length || 4;
  const progressPercent = Math.round((completedCount / totalDays) * 100);

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-[#070A12] text-slate-100 min-h-screen font-sans">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-violet-500/25 bg-gradient-to-r from-[#0E1528] via-[#131D38] to-[#0D182E] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-300 ring-1 ring-cyan-500/30">
              <Compass className="h-3.5 w-3.5 text-cyan-400" />
              <span>Adaptive AI Study Schedule</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Target: {studyPlan?.targetExam || 'CS301 Operating Systems Mid-Term'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Examination Date: <strong className="text-white">{studyPlan?.examDate || 'Nov 4, 2026'}</strong> ({studyPlan?.daysRemaining || 4} days remaining). 
              Recommended focus: <span className="text-cyan-400 font-bold">{studyPlan?.recommendedDailyHours || 2.5} hrs/day</span> to boost readiness by {studyPlan?.estimatedMasteryGain || '+18%'}.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-extrabold text-cyan-400">{progressPercent}%</span>
              <p className="text-[11px] text-slate-400">Plan Completed</p>
            </div>
            <div className="w-36 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Daily Study Schedule Blocks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="h-4 w-4 text-violet-400" />
            <span>4-Day Focused Study Roadmap</span>
          </h2>
          <span className="text-xs text-slate-400">
            {completedCount} of {totalDays} study blocks checked off
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {(studyPlan?.dailySchedule || []).map((day, idx) => {
            const isDone = Boolean(completedDays[idx]);
            return (
              <div
                key={idx}
                className={`rounded-2xl border p-5 transition-all space-y-4 ${
                  isDone
                    ? 'border-emerald-500/30 bg-[#0A161E]/80 shadow-lg'
                    : 'border-slate-800 bg-[#0C1222]/90 hover:border-violet-500/40 shadow-xl'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
                      {day.day}
                    </span>
                    <h3 className={`text-sm sm:text-base font-bold mt-1 ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                      {day.topic}
                    </h3>
                  </div>

                  <button
                    onClick={() => toggleDayCompletion(idx)}
                    className={`flex h-6 w-6 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                      isDone
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'border-slate-700 bg-slate-900 text-transparent hover:border-slate-500'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-cyan-400" />
                    <span>{day.focusTime}</span>
                  </span>
                  <span>•</span>
                  <span className={`font-semibold ${
                    day.priority === 'Critical' ? 'text-red-400' :
                    day.priority === 'High' ? 'text-amber-400' :
                    'text-cyan-400'
                  }`}>
                    {day.priority} Priority
                  </span>
                </div>

                {/* Suggested Actions Checklist */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Recommended Actions:
                  </span>
                  {day.suggestedActions.map((action, aIdx) => (
                    <div key={aIdx} className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="text-violet-400 font-bold">•</span>
                      <span>{action}</span>
                    </div>
                  ))}
                </div>

                {/* Direct Action Buttons */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                  <button
                    onClick={() => onOpenTopicInWorkspace(day.topic)}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>Launch in Workspace</span>
                  </button>

                  <button
                    onClick={() => onStartQuizForTopic(day.topic)}
                    className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Award className="h-3 w-3" />
                    <span>Practice Quiz</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
