import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Sparkles, 
  Mic, 
  BrainCircuit, 
  CheckCircle2, 
  Compass, 
  TrendingUp, 
  Settings, 
  LogOut, 
  GraduationCap, 
  ChevronRight,
  ShieldCheck,
  Lightbulb,
  GitBranch,
  Home
} from 'lucide-react';

export type Screen = 
  | 'landing'
  | 'dashboard' 
  | 'documents' 
  | 'workspace' 
  | 'knowledge_graph'
  | 'study_planner'
  | 'voice_tutor' 
  | 'doubts' 
  | 'verification' 
  | 'recommendations' 
  | 'progress' 
  | 'settings';

interface LMSSidebarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  unresolvedDoubtsCount: number;
  isDemoMode: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const LMSSidebar: React.FC<LMSSidebarProps> = ({
  currentScreen,
  onNavigate,
  unresolvedDoubtsCount,
  isDemoMode,
  collapsed,
  onToggleCollapse
}) => {
  return (
    <aside 
      className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col justify-between border-r border-slate-800 bg-[#0B0F19] text-slate-200 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Top Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/80">
          <div 
            onClick={() => onNavigate('landing')}
            className="flex cursor-pointer items-center gap-3 overflow-hidden select-none"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-600/30 font-black text-base ring-1 ring-white/20">
              U
            </div>
            {!collapsed && (
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold tracking-tight text-white">UNERA</span>
                  <span className="rounded-full bg-violet-950/80 px-2 py-0.5 text-[9px] font-bold text-violet-300 border border-violet-800/60">
                    AI CAMPUS
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium truncate">Adaptive Learning Ecosystem</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-10rem)]">
          
          {/* Group 1: CAMPUS & WORKSPACE */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Workspace &amp; Campus
              </p>
            )}

            <button
              onClick={() => onNavigate('landing')}
              title="Showcase Hero"
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
                currentScreen === 'landing'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Home className={`h-4 w-4 shrink-0 ${currentScreen === 'landing' ? 'text-white' : 'text-slate-400'}`} />
              {!collapsed && <span>3D Core Showcase</span>}
            </button>

            <button
              onClick={() => onNavigate('dashboard')}
              title="Campus Dashboard"
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
                currentScreen === 'dashboard'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <LayoutDashboard className={`h-4 w-4 shrink-0 ${currentScreen === 'dashboard' ? 'text-white' : 'text-slate-400'}`} />
              {!collapsed && <span>Student Dashboard</span>}
            </button>

            <button
              onClick={() => onNavigate('workspace')}
              title="AI Learning Workspace"
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
                currentScreen === 'workspace'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Sparkles className={`h-4 w-4 shrink-0 ${currentScreen === 'workspace' ? 'text-white' : 'text-cyan-400'}`} />
              {!collapsed && <span>AI Workspace (RAG)</span>}
            </button>

            <button
              onClick={() => onNavigate('knowledge_graph')}
              title="Knowledge Graph"
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
                currentScreen === 'knowledge_graph'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <GitBranch className={`h-4 w-4 shrink-0 ${currentScreen === 'knowledge_graph' ? 'text-white' : 'text-slate-400'}`} />
              {!collapsed && <span>Knowledge Graph</span>}
            </button>

            <button
              onClick={() => onNavigate('study_planner')}
              title="AI Study Planner"
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
                currentScreen === 'study_planner'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Compass className={`h-4 w-4 shrink-0 ${currentScreen === 'study_planner' ? 'text-white' : 'text-slate-400'}`} />
              {!collapsed && <span>AI Study Planner</span>}
            </button>

            <button
              onClick={() => onNavigate('voice_tutor')}
              title="Voice Tutor"
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
                currentScreen === 'voice_tutor'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Mic className={`h-4 w-4 shrink-0 ${currentScreen === 'voice_tutor' ? 'text-white' : 'text-slate-400'}`} />
              {!collapsed && <span>Voice Classroom</span>}
            </button>
          </div>

          {/* Group 2: MASTERY & MEMORY */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Mastery &amp; Memory
              </p>
            )}

            <button
              onClick={() => onNavigate('doubts')}
              title="Doubt Memory"
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
                currentScreen === 'doubts'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <BrainCircuit className={`h-4 w-4 shrink-0 ${currentScreen === 'doubts' ? 'text-white' : 'text-slate-400'}`} />
                {!collapsed && <span>Doubt Memory</span>}
              </div>
              {!collapsed && unresolvedDoubtsCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-extrabold text-slate-950">
                  {unresolvedDoubtsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate('verification')}
              title="Smart Quiz Studio"
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
                currentScreen === 'verification'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <CheckCircle2 className={`h-4 w-4 shrink-0 ${currentScreen === 'verification' ? 'text-white' : 'text-slate-400'}`} />
              {!collapsed && <span>Smart Quiz &amp; Exams</span>}
            </button>

            <button
              onClick={() => onNavigate('documents')}
              title="My Notes & Materials"
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
                currentScreen === 'documents'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <FileText className={`h-4 w-4 shrink-0 ${currentScreen === 'documents' ? 'text-white' : 'text-slate-400'}`} />
              {!collapsed && <span>My Notes Library</span>}
            </button>

            <button
              onClick={() => onNavigate('recommendations')}
              title="Recommendations"
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
                currentScreen === 'recommendations'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Lightbulb className={`h-4 w-4 shrink-0 ${currentScreen === 'recommendations' ? 'text-white' : 'text-slate-400'}`} />
              {!collapsed && <span>Interventions</span>}
            </button>

            <button
              onClick={() => onNavigate('progress')}
              title="Learning Analytics"
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
                currentScreen === 'progress'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <TrendingUp className={`h-4 w-4 shrink-0 ${currentScreen === 'progress' ? 'text-white' : 'text-slate-400'}`} />
              {!collapsed && <span>Learning Progress</span>}
            </button>
          </div>

          {/* Group 3: SYSTEM */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                System
              </p>
            )}

            <button
              onClick={() => onNavigate('settings')}
              title="Settings"
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
                currentScreen === 'settings'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Settings className={`h-4 w-4 shrink-0 ${currentScreen === 'settings' ? 'text-white' : 'text-slate-400'}`} />
              {!collapsed && <span>Settings &amp; Tier</span>}
            </button>
          </div>

        </div>
      </div>

      {/* Bottom Profile Footer */}
      <div className="p-3 border-t border-slate-800 bg-[#070A12]">
        <div 
          onClick={() => onNavigate('dashboard')}
          className="flex cursor-pointer items-center justify-between gap-3 rounded-xl p-2 hover:bg-slate-900 transition-colors"
        >
          <div className="flex items-center gap-2.5 truncate">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-500 text-xs font-bold text-white shadow-md">
              AR
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#070A12]" />
            </div>
            {!collapsed && (
              <div className="truncate text-left">
                <p className="text-xs font-bold text-white truncate">Alex Rivera</p>
                <p className="text-[10px] text-slate-400 truncate">CS Junior • Semester 5</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('settings');
              }}
              title="Settings"
              className="text-slate-500 hover:text-slate-300"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

    </aside>
  );
};
