import React from 'react';
import { 
  Sparkles, 
  LayoutDashboard, 
  Compass, 
  BrainCircuit, 
  CheckCircle2, 
  FolderGit2, 
  Settings as SettingsIcon,
  ShieldCheck,
  Flame
} from 'lucide-react';

export type Screen = 'landing' | 'dashboard' | 'workspace' | 'doubts' | 'verification' | 'documents' | 'settings';

interface HeaderProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  unresolvedDoubtsCount: number;
  isDemoMode: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  unresolvedDoubtsCount,
  isDemoMode
}) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-purple-500/10 bg-[#070A12]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo and Brand */}
        <div 
          onClick={() => onNavigate('landing')}
          className="flex cursor-pointer items-center gap-3 transition-opacity hover:opacity-90"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600/30 to-cyan-500/20 p-1.5 ring-1 ring-violet-500/30">
            <img src="/unera-logo.svg" alt="UNERA Logo" className="h-full w-full" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-white">UNERA</span>
              <span className="hidden rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-semibold text-purple-300 ring-1 ring-inset ring-purple-500/25 sm:inline-block">
                AI WORKSPACE
              </span>
            </div>
            <p className="hidden text-[10px] font-medium tracking-wide text-slate-400 md:block">
              Don't just study. Understand.
            </p>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="hidden md:flex items-center gap-1 rounded-xl bg-slate-900/60 p-1 ring-1 ring-white/5">
          <button
            onClick={() => onNavigate('landing')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              currentScreen === 'landing'
                ? 'bg-violet-600/25 text-violet-200 ring-1 ring-violet-500/40 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Compass className="h-3.5 w-3.5 text-violet-400" />
            Home
          </button>

          <button
            onClick={() => onNavigate('dashboard')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              currentScreen === 'dashboard'
                ? 'bg-violet-600/25 text-violet-200 ring-1 ring-violet-500/40 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5 text-violet-400" />
            Dashboard
          </button>

          <button
            onClick={() => onNavigate('workspace')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              currentScreen === 'workspace'
                ? 'bg-gradient-to-r from-violet-600/40 to-cyan-600/30 text-white ring-1 ring-violet-400/50 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            Workspace
          </button>

          <button
            onClick={() => onNavigate('doubts')}
            className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              currentScreen === 'doubts'
                ? 'bg-violet-600/25 text-violet-200 ring-1 ring-violet-500/40 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <BrainCircuit className="h-3.5 w-3.5 text-purple-400" />
            Doubt Memory
            {unresolvedDoubtsCount > 0 && (
              <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500/80 px-1 text-[9px] font-bold text-white">
                {unresolvedDoubtsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigate('verification')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              currentScreen === 'verification'
                ? 'bg-violet-600/25 text-violet-200 ring-1 ring-violet-500/40 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Verification
          </button>

          <button
            onClick={() => onNavigate('documents')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              currentScreen === 'documents'
                ? 'bg-violet-600/25 text-violet-200 ring-1 ring-violet-500/40 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <FolderGit2 className="h-3.5 w-3.5 text-cyan-400" />
            Library
          </button>
        </nav>

        {/* Right Status Controls & Profile */}
        <div className="flex items-center gap-2.5">
          {/* Source-Locked Badge */}
          <div className="hidden lg:flex items-center gap-1.5 rounded-full bg-cyan-950/40 px-2.5 py-1 text-[11px] font-medium text-cyan-300 ring-1 ring-cyan-500/30">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
            Source-Locked RAG
          </div>

          {/* Demo Mode Badge */}
          {isDemoMode && (
            <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300 ring-1 ring-amber-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              Demo Mode
            </div>
          )}

          {/* Settings Button */}
          <button
            onClick={() => onNavigate('settings')}
            title="Workspace Settings"
            className={`rounded-lg p-2 transition-colors ${
              currentScreen === 'settings'
                ? 'bg-violet-600/30 text-white ring-1 ring-violet-500/40'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <SettingsIcon className="h-4 w-4" />
          </button>

          {/* Student Profile avatar */}
          <div 
            onClick={() => onNavigate('dashboard')}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900/80 px-2.5 py-1.5 ring-1 ring-white/10 hover:ring-purple-500/40"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 text-xs font-bold text-white shadow-sm">
              AR
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-semibold leading-none text-slate-200">Alex Rivera</p>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">CS Junior</p>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};
