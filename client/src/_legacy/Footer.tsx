import React from 'react';
import { ShieldCheck, Sparkles, BookOpen, Mic, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-purple-500/10 bg-[#06080F] py-12 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:gap-12">
          
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/30 p-1 ring-1 ring-violet-500/30">
                <img src="/unera-logo.svg" alt="UNERA" className="h-full w-full" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">UNERA</span>
              <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 ring-1 ring-cyan-500/20">
                Hackathon Prototype
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400 max-w-md">
              An interruptible, adaptive AI learning workspace that helps students understand their own study materials through source-grounded answers, interruptible voice tutoring, persistent doubt memory, and mastery verification.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" /> Source-Locked Engine
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-cyan-400">
                <Mic className="h-3.5 w-3.5" /> Interruptible Speech
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-violet-400">
                <Cpu className="h-3.5 w-3.5" /> Concept Persistence
              </span>
            </div>
          </div>

          {/* Core Capabilities */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">The 5 Core Features</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors">
                <BookOpen className="h-3 w-3 text-violet-400" />
                Source-Locked AI Chat
              </li>
              <li className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors">
                <Mic className="h-3 w-3 text-cyan-400" />
                Interruptible Voice Tutor
              </li>
              <li className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors">
                <Cpu className="h-3 w-3 text-purple-400" />
                Doubt Memory Tracker
              </li>
              <li className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                Verification Engine
              </li>
              <li className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors">
                <Sparkles className="h-3 w-3 text-amber-400" />
                Context-Aware Interventions
              </li>
            </ul>
          </div>

          {/* Academic Integrity */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Academic Rigor</h4>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              UNERA treats uploaded documents as untrusted source material and guarantees zero-hallucination source-locked citations. If a concept is not present in your notes, UNERA explicitly abstains.
            </p>
            <div className="mt-4 rounded-lg bg-slate-900/60 p-2.5 border border-purple-500/10 text-[11px] text-slate-400">
              “Don't just study. Understand.”
            </div>
          </div>

        </div>

        <div className="mt-8 border-t border-slate-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 UNERA AI. All source-grounded learning sessions protected.</p>
          <p className="mt-2 sm:mt-0">Built for high-performance collegiate learning.</p>
        </div>
      </div>
    </footer>
  );
};
