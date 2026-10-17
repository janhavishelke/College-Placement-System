import React from 'react';
import { Screen } from './LMSSidebar';

interface ProgressDonutWidgetProps {
  demonstrated: number;
  developing?: number;
  learning?: number;
  needsReview: number;
  onNavigate?: (screen: Screen) => void;
}

export const ProgressDonutWidget: React.FC<ProgressDonutWidgetProps> = ({
  demonstrated,
  developing = 0,
  learning,
  needsReview,
  onNavigate
}) => {
  const actualLearning = learning !== undefined ? learning : developing;
  const total = demonstrated + actualLearning + needsReview || 1;
  const pctDemonstrated = Math.round((demonstrated / total) * 100);
  const pctLearning = Math.round((actualLearning / total) * 100);
  const pctNeedsReview = 100 - pctDemonstrated - pctLearning;

  // Circumference for r=36 is ~226
  const c = 226.2;
  const strokeDemonstrated = (pctDemonstrated / 100) * c;
  const strokeLearning = (pctLearning / 100) * c;
  const strokeNeedsReview = (pctNeedsReview / 100) * c;

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0C1222] p-4 space-y-3 shadow-xl text-slate-100">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <h4 className="text-xs font-bold text-white">Concept Mastery Distribution</h4>
        <span className="text-[10px] text-slate-400 font-mono">{total} Concepts</span>
      </div>

      <div className="flex items-center justify-center gap-4 py-2">
        {/* SVG Donut Chart */}
        <div className="relative h-28 w-28 shrink-0">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="36"
              fill="transparent"
              stroke="#1E293B"
              strokeWidth="12"
            />
            {/* Demonstrated segment (emerald) */}
            <circle
              cx="50"
              cy="50"
              r="36"
              fill="transparent"
              stroke="#10B981"
              strokeWidth="12"
              strokeDasharray={`${strokeDemonstrated} ${c}`}
              strokeDashoffset="0"
              className="transition-all duration-700 ease-out"
            />
            {/* Developing segment (cyan) */}
            <circle
              cx="50"
              cy="50"
              r="36"
              fill="transparent"
              stroke="#06B6D4"
              strokeWidth="12"
              strokeDasharray={`${strokeLearning} ${c}`}
              strokeDashoffset={`-${strokeDemonstrated}`}
              className="transition-all duration-700 ease-out"
            />
            {/* Needs Review segment (amber) */}
            <circle
              cx="50"
              cy="50"
              r="36"
              fill="transparent"
              stroke="#F59E0B"
              strokeWidth="12"
              strokeDasharray={`${strokeNeedsReview} ${c}`}
              strokeDashoffset={`-${strokeDemonstrated + strokeLearning}`}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-lg font-extrabold text-white leading-none">{pctDemonstrated}%</span>
            <span className="text-[9px] text-emerald-400 font-bold uppercase mt-0.5">Mastered</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-300 text-[11px]">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Demonstrated
            </span>
            <span className="font-bold text-white text-[11px]">{demonstrated} ({pctDemonstrated}%)</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-300 text-[11px]">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              Developing
            </span>
            <span className="font-bold text-white text-[11px]">{actualLearning} ({pctLearning}%)</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-300 text-[11px]">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Needs Review
            </span>
            <span className="font-bold text-white text-[11px]">{needsReview} ({pctNeedsReview}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
