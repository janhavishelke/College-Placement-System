import React from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  ShieldCheck, 
  ChevronRight, 
  GraduationCap,
  Calendar,
  Sparkles,
  GitBranch,
  Compass
} from 'lucide-react';
import { Screen } from './LMSSidebar';
import { Intervention } from '../types';

interface LMSTopNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeIntervention: Intervention | null;
  onOpenIntervention: () => void;
  isDemoMode: boolean;
}

export const LMSTopNav: React.FC<LMSTopNavProps> = ({
  currentScreen,
  onNavigate,
  collapsed,
  onToggleCollapse,
  activeIntervention,
  onOpenIntervention,
  isDemoMode
}) => {
  const getBreadcrumbTitle = () => {
    switch (currentScreen) {
      case 'landing': return 'Cinematic 3D Core Showcase';
      case 'dashboard': return 'Student Campus Dashboard';
      case 'documents': return 'Knowledge Library & Course Materials';
      case 'workspace': return 'AI Learning Workspace (Split-Screen RAG)';
      case 'knowledge_graph': return 'Academic Knowledge Graph';
      case 'study_planner': return 'AI Adaptive Study Planner';
      case 'voice_tutor': return 'Interruptible Voice Classroom';
      case 'doubts': return 'Doubt Memory & Concept Retention';
      case 'verification': return 'Smart Quiz Studio & Exam Practice';
      case 'recommendations': return 'Context-Aware Interventions';
      case 'progress': return 'Mastery Progression Analytics';
      case 'settings': return 'Preferences & Academic Tier';
      default: return 'Portal';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-[#0B0F19]/90 px-4 sm:px-6 shadow-xl backdrop-blur-xl">
      
      {/* Left: Sidebar Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleCollapse}
          title="Toggle Navigation Menu"
          className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <span 
            onClick={() => onNavigate('dashboard')} 
            className="cursor-pointer hover:text-cyan-400 transition-colors font-bold text-slate-300"
          >
            UNERA Campus
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
            {getBreadcrumbTitle()}
          </span>
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="hidden md:flex items-center relative w-72 lg:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search study notes, concepts, test questions..."
          className="w-full rounded-xl bg-slate-900/90 pl-9 pr-12 py-2 text-xs text-slate-200 placeholder-slate-500 border border-slate-800 focus:bg-[#070A12] focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-700">
          ⌘K
        </kbd>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        
        {/* Semester / Academic Term Pill */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-medium text-slate-300 border border-slate-800">
          <Calendar className="h-3.5 w-3.5 text-cyan-400" />
          <span>Fall 2026 Semester</span>
        </div>

        {/* Source-Locked Badge */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-950/60 px-3 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-800/40">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Source-Locked RAG</span>
        </div>

        {/* Intervention Notification Bell */}
        <button
          onClick={onOpenIntervention}
          title="Context-Aware Interventions"
          className="relative rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          <Bell className="h-4 w-4" />
          {activeIntervention && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
            </span>
          )}
        </button>

        {/* Student Profile avatar chip */}
        <div 
          onClick={() => onNavigate('settings')}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900/80 p-1.5 border border-slate-800 hover:border-violet-500/40 transition-colors"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-500 text-xs font-bold text-white shadow-sm">
            AR
          </div>
          <div className="hidden xl:block text-left pr-1">
            <p className="text-xs font-semibold leading-none text-white">Alex Rivera</p>
            <p className="text-[10px] text-slate-400 leading-none mt-0.5">CS Junior • Sem 5</p>
          </div>
        </div>

      </div>

    </header>
  );
};
