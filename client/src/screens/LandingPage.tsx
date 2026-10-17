import React, { useState } from 'react';
import { api } from '../services/api';
import { ChatItem } from '../types';
import { StackVisualizer } from '../components/StackVisualizer';
import { Rotating3DLogo } from '../components/Rotating3DLogo';
import { LanguageCode, LANGUAGES, getTranslation } from '../utils/i18n';
import {
  SparkleDoodle,
  StarDoodle,
  PencilDoodle,
  SunDoodle
} from '../components/Doodles';

interface LandingPageProps {
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  lang?: LanguageCode;
  onLanguageChange?: (lang: LanguageCode) => void;
  onOpenWorkspace: () => void;
  onUploadNotes: () => void;
  onOpen3DView?: () => void;
  onOpenAlarms?: () => void;
  onOpenLogin?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  theme = 'light',
  onToggleTheme,
  lang = 'en',
  onLanguageChange,
  onOpenWorkspace,
  onUploadNotes,
  onOpen3DView,
  onOpenAlarms,
  onOpenLogin
}) => {
  const t = getTranslation(lang);

  // Demo strip mini chat state
  const [demoQuestion, setDemoQuestion] = useState('What is recursion?');
  const [demoResponse, setDemoResponse] = useState<ChatItem | null>({
    id: 1,
    question: 'What is recursion?',
    answer: 'Recursion is a programming technique where a function calls itself directly or indirectly in order to solve a problem. It solves complex tasks by breaking them down into smaller instances of the same problem until a trivial base case is reached.',
    grounded: 1,
    citations: [{ docId: 1, pageNo: 2, excerpt: 'Recursion is a method where the solution to a problem depends on solutions to smaller instances of the same problem.' }]
  });
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleAskDemo = async (questionToAsk?: string) => {
    const q = questionToAsk || demoQuestion;
    if (!q.trim()) return;
    setIsDemoLoading(true);
    try {
      const res = await api.sendChat(q, 1);
      setDemoResponse(res);
    } catch (err) {
      console.error('Demo chat failed:', err);
    } finally {
      setIsDemoLoading(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen font-sans selection:bg-amber-500/20 transition-colors duration-200 ${
      isDark ? 'bg-[#0B0E17] text-[#F8FAFC]' : 'bg-[#FAF7F2] text-[#1E1B18]'
    }`}>
      {/* Top Nav: Slim bar */}
      <nav className={`w-full max-w-6xl mx-auto px-6 py-4 flex items-center justify-between border-b ${
        isDark ? 'border-amber-500/15' : 'border-amber-200/50'
      }`}>
        {/* Brand with 3D Mini Logo */}
        <div className="flex items-center gap-3">
          <Rotating3DLogo size={28} />
          <span className="font-extrabold text-xl tracking-tight text-inherit">
            Unera
          </span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
            isDark ? 'bg-[#1E293B] text-[#38BDF8]' : 'bg-[#EAF3FB] text-[#1E3A8A]'
          }`}>
            v3.0
          </span>
        </div>

        {/* Middle Nav Links */}
        <div className={`hidden md:flex items-center gap-6 text-sm font-medium ${
          isDark ? 'text-[#94A3B8]' : 'text-[#6B625E]'
        }`}>
          <a href="#features" className="hover:text-inherit transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-inherit transition-colors">How it works</a>
          <a href="#demo" className="hover:text-inherit transition-colors">Demo</a>
          <button onClick={onOpenWorkspace} className="hover:text-[#FF5E4D] transition-colors font-semibold">
            Study Workspace
          </button>
        </div>

        {/* Right Controls: Language + Login + Alarms + 3D View + Theme + CTA */}
        <div className="flex items-center gap-2">
          {/* Language Switcher Pill */}
          {onLanguageChange && (
            <div className={`hidden sm:flex items-center rounded-full p-0.5 text-xs border ${
              isDark ? 'bg-black/40 border-white/10' : 'bg-white border-zinc-200'
            }`}>
              <span className="text-amber-500 px-1 text-[11px]">🌐</span>
              {LANGUAGES.map(item => (
                <button
                  key={item.code}
                  onClick={() => onLanguageChange(item.code)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                    lang === item.code
                      ? 'bg-amber-500 text-black shadow-sm'
                      : isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-black'
                  }`}
                  title={item.label}
                >
                  {item.nativeName}
                </button>
              ))}
            </div>
          )}

          {/* Lamp Login Page Link */}
          {onOpenLogin && (
            <button
              onClick={onOpenLogin}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all shadow-sm ${
                isDark
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                  : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
              }`}
              title="Interactive Lamp Login Page"
            >
              <span>💡</span>
              <span className="hidden sm:inline">{t.login}</span>
            </button>
          )}

          {onOpenAlarms && (
            <button
              onClick={onOpenAlarms}
              className={`px-2.5 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1 transition-all shadow-sm ${
                isDark
                  ? 'bg-[#1E293B] border-[#EC4899]/40 text-[#F472B6] hover:bg-[#EC4899]/20 hover:border-[#EC4899]'
                  : 'bg-white border-[#EC4899]/30 text-[#DB2777] hover:bg-[#FDF2F8]'
              }`}
              title="Set Study Alarms & Reminders"
            >
              <span>⏰</span>
              <span className="hidden md:inline">{t.alarms}</span>
            </button>
          )}

          {onOpen3DView && (
            <button
              onClick={onOpen3DView}
              className={`px-2.5 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1 transition-all shadow-sm ${
                isDark
                  ? 'bg-[#1E293B] border-[#06B6D4]/40 text-[#22D3EE] hover:bg-[#06B6D4]/20 hover:border-[#06B6D4]'
                  : 'bg-white border-[#06B6D4]/30 text-[#0891B2] hover:bg-[#ECFEFF]'
              }`}
              title="Interactive 3D Knowledge Core View"
            >
              <span>🌀</span>
              <span className="hidden md:inline">{t.view3D}</span>
            </button>
          )}

          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-full border transition-all text-xs flex items-center justify-center ${
                isDark
                  ? 'bg-[#1E293B] border-[#334155] text-[#FCD34D] hover:bg-[#334155]'
                  : 'bg-white border-[#D8CEBE] text-[#27211E] hover:bg-[#F2ECE4]'
              }`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          )}

          <button
            onClick={onOpenWorkspace}
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-[#FF5E4D] to-[#F43F5E] text-white text-xs sm:text-sm font-bold hover:opacity-95 transition-all shadow-md hover:shadow-lg"
          >
            {t.openStudy}
          </button>
        </div>
      </nav>

      {/* Feature 16: 3D Live Logo centered above the Split Window */}
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-4 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Rotating3DLogo size={72} />
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
            <span className={isDark ? 'text-[#94A3B8]' : 'text-[#8C827A]'}>
              Unera v3 — Interactive AI Learning Workspace
            </span>
          </div>
        </div>
      </div>

      {/* Feature 15: Split Window at Start (Left headline + Open Study, Right live workspace preview) */}
      <header className="max-w-6xl mx-auto px-6 pt-4 pb-20 relative">
        {/* Floating background study doodles */}
        <div className="absolute top-8 left-4 doodle-float hidden lg:block opacity-80">
          <SparkleDoodle className="w-7 h-7" color="#FF5E4D" />
        </div>
        <div className="absolute top-24 right-12 doodle-float-delay hidden lg:block opacity-80">
          <StarDoodle className="w-6 h-6" color="#F59E0B" />
        </div>
        <div className="absolute bottom-16 left-1/3 doodle-float hidden lg:block opacity-70">
          <PencilDoodle className="w-7 h-7" color="#3B82F6" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headline + Open Study CTA */}
          <div className="lg:col-span-6 flex flex-col items-start">
            <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold uppercase tracking-wider mb-4 border border-amber-500/20">
              {t.tagline}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.12] tracking-tight text-inherit mb-6">
              {t.heroHeadlinePart1}<span className="gradient-text-vibrant">{t.heroHeadlinePart2}</span>
            </h1>

            <p className={`text-base sm:text-lg leading-relaxed mb-8 max-w-lg ${
              isDark ? 'text-[#94A3B8]' : 'text-[#6B625E]'
            }`}>
              {t.heroSubtext}
            </p>

            {/* Split Window Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <button
                onClick={onOpenWorkspace}
                className="px-7 py-3.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black font-extrabold text-sm sm:text-base hover:opacity-95 transition-all shadow-xl shadow-amber-500/25 hover:-translate-y-0.5 active:translate-y-0"
              >
                {t.openStudy} →
              </button>
              {onOpenAlarms && (
                <button
                  onClick={onOpenAlarms}
                  className={`px-5 py-3.5 rounded-full font-bold text-sm transition-all border-2 flex items-center gap-2 shadow-sm hover:-translate-y-0.5 active:translate-y-0 ${
                    isDark
                      ? 'border-amber-500/50 text-amber-300 hover:bg-amber-500/20'
                      : 'border-amber-400 text-amber-800 hover:bg-amber-50'
                  }`}
                  title={t.alarmScheduler}
                >
                  <span>⏰</span>
                  <span>{t.alarmScheduler}</span>
                </button>
              )}
              {onOpen3DView && (
                <button
                  onClick={onOpen3DView}
                  className={`px-5 py-3.5 rounded-full font-bold text-sm transition-all border-2 flex items-center gap-2 shadow-sm hover:-translate-y-0.5 active:translate-y-0 ${
                    isDark
                      ? 'border-amber-400/50 text-amber-300 hover:bg-amber-500/20'
                      : 'border-amber-400 text-amber-800 hover:bg-amber-50'
                  }`}
                  title={t.view3D}
                >
                  <span>🌀</span>
                  <span>{t.view3D}</span>
                </button>
              )}
              <button
                onClick={onUploadNotes}
                className={`px-6 py-3.5 rounded-full font-semibold text-sm transition-all border-2 ${
                  isDark
                    ? 'border-zinc-700 text-white hover:bg-zinc-800'
                    : 'border-zinc-300 text-zinc-800 hover:bg-zinc-100'
                }`}
              >
                {t.uploadNotes}
              </button>
            </div>

            <p className={`text-xs ${isDark ? 'text-[#64748B]' : 'text-[#8C827A]'}`}>
              {t.zeroSetup}
            </p>
          </div>

          {/* Right Column: Live Study Workspace Mockup Preview Card */}
          <div className="lg:col-span-6 relative">
            <div className={`rounded-[32px] p-6 shadow-2xl border relative z-10 transition-colors ${
              isDark
                ? 'bg-[#0F172A]/90 border-amber-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_35px_rgba(245,158,11,0.15)]'
                : 'bg-white border-amber-300/60 shadow-[0_20px_40px_rgba(217,119,6,0.12)]'
            }`}>
              {/* Mini Top bar */}
              <div className={`flex items-center justify-between pb-3 mb-4 border-b ${
                isDark ? 'border-amber-500/25' : 'border-amber-200/50'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs font-bold text-inherit">
                    Recursion & Call Stack (Demo Notes)
                  </span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  isDark ? 'bg-black/50 text-amber-300 border border-amber-500/20' : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  Page 2 of 10
                </span>
              </div>

              {/* Mini Chat Message with citation chip */}
              <div className="space-y-3 mb-4">
                <div className={`p-3 rounded-2xl text-xs w-5/6 ${
                  isDark ? 'bg-black/40 text-[#E2E8F0]' : 'bg-[#FAF7F2] text-[#27211E]'
                }`}>
                  <span className={`text-[10px] uppercase font-bold block mb-1 ${
                    isDark ? 'text-amber-400/80' : 'text-amber-800'
                  }`}>Student Question</span>
                  What is recursion?
                </div>

                <div className={`p-3 rounded-2xl text-xs border-l-2 border-amber-400 ${
                  isDark ? 'bg-amber-500/10 text-[#E2E8F0]' : 'bg-amber-50/70 text-[#27211E]'
                }`}>
                  <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">Source-Grounded Answer</span>
                  A function that calls itself to solve smaller subproblems until a base case is reached.
                  <span className="inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-400/25 text-amber-300 border border-amber-400/40 ml-1.5">
                    [p.2, para 1]
                  </span>
                </div>
              </div>

              {/* Mini Source Excerpt */}
              <div className={`p-3 rounded-xl border text-[11px] ${
                isDark
                  ? 'bg-[#1E3A8A]/30 border-[#1E3A8A] text-[#93C5FD]'
                  : 'bg-[#EAF3FB] border-[#C6E2F7] text-[#1E3A8A]'
              }`}>
                <span className="font-bold block mb-0.5">Note Excerpt (Page 2):</span>
                "Recursion is a method where the solution to a problem depends on solutions to smaller instances of the same problem."
              </div>

              {/* Mini Doubt Row */}
              <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${
                isDark ? 'border-[#334155]' : 'border-[#F2ECE4]'
              }`}>
                <span className={`font-medium ${isDark ? 'text-[#94A3B8]' : 'text-[#6B625E]'}`}>
                  Doubt Memory:
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FEE2E2] text-[#991B1B] text-[10px] font-bold">
                  Recursion — Unresolved
                </span>
              </div>
            </div>

            {/* Overlapping Floating White Card: Doubt Card */}
            <div className={`absolute -bottom-6 -left-6 z-20 rounded-2xl p-4 shadow-2xl border max-w-[260px] hidden sm:block ${
              isDark
                ? 'bg-[#1E293B] border-[#334155]'
                : 'bg-white border-[#F2ECE4]'
            }`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF5E4D]" />
                <span className="text-[11px] font-bold text-inherit">
                  I still don't understand recursion
                </span>
              </div>
              <div className={`flex items-center justify-between text-[10px] ${
                isDark ? 'text-[#94A3B8]' : 'text-[#8C827A]'
              }`}>
                <span>Status: Unresolved</span>
                <span className="text-[#FF5E4D] font-semibold">3 steps available</span>
              </div>
            </div>

            {/* Decorative doodles around card */}
            <div className="absolute -top-4 -right-4 z-20">
              <SunDoodle className="w-8 h-8" />
            </div>
          </div>
        </div>
      </header>

      {/* How It Works Section */}
      <section id="how-it-works" className={`max-w-6xl mx-auto px-6 py-20 border-t ${
        isDark ? 'border-[#1E293B]' : 'border-[#F2ECE4]'
      }`}>
        <div className="text-left mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF5E4D] block mb-2">
            HOW IT WORKS
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-inherit">
            Learn with continuous understanding.
          </h2>
          <p className={`text-sm mt-2 ${isDark ? 'text-[#94A3B8]' : 'text-[#6B625E]'}`}>
            A disciplined, closed-loop study workflow that turns passive notes into deep retention.
          </p>
        </div>

        {/* Numbered List with thin divider lines */}
        <div className={`divide-y ${isDark ? 'divide-[#1E293B]' : 'divide-[#E5D7C5]'}`}>
          <div className="py-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <span className="md:col-span-2 font-mono text-3xl font-extrabold text-[#FF5E4D]">
              01
            </span>
            <div className="md:col-span-5">
              <h3 className="text-xl font-bold text-inherit">
                Upload notes
              </h3>
            </div>
            <div className={`md:col-span-5 text-sm leading-relaxed ${isDark ? 'text-[#94A3B8]' : 'text-[#6B625E]'}`}>
              Upload course notes, slides, or transcripts. UNERA parses every page, indexing passages so citations are always precise.
            </div>
          </div>

          <div className="py-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <span className="md:col-span-2 font-mono text-3xl font-extrabold text-[#FF5E4D]">
              02
            </span>
            <div className="md:col-span-5">
              <h3 className="text-xl font-bold text-inherit">
                Ask and interrupt
              </h3>
            </div>
            <div className={`md:col-span-5 text-sm leading-relaxed ${isDark ? 'text-[#94A3B8]' : 'text-[#6B625E]'}`}>
              Ask any question to receive answers locked strictly to your notes. If listening by voice, interrupt at any word; UNERA answers and resumes.
            </div>
          </div>

          <div className="py-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <span className="md:col-span-2 font-mono text-3xl font-extrabold text-[#FF5E4D]">
              03
            </span>
            <div className="md:col-span-5">
              <h3 className="text-xl font-bold text-inherit">
                Verify and resolve doubts
              </h3>
            </div>
            <div className={`md:col-span-5 text-sm leading-relaxed ${isDark ? 'text-[#94A3B8]' : 'text-[#6B625E]'}`}>
              Active recall checks your understanding against the 3 key ideas of each concept. Missing ideas get highlighted, unresolved doubts stay tracked in memory.
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid: 6 cards */}
      <section id="features" className={`max-w-6xl mx-auto px-6 py-20 border-t ${
        isDark ? 'border-[#1E293B]' : 'border-[#F2ECE4]'
      }`}>
        <div className="text-left mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF5E4D] block mb-2">
            BASE 5 CORE + FINAL 9 INNOVATIONS
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-inherit">
            Built for how students actually study.
          </h2>
          <p className={`text-sm mt-2 ${isDark ? 'text-[#94A3B8]' : 'text-[#6B625E]'}`}>
            No generic chatbots. Every capability is grounded directly in your uploaded notes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1: Source-Locked Chat */}
          <div className={`rounded-[28px] p-6 shadow-sm border transform hover:-translate-y-1 transition-all md:-rotate-1 flex flex-col justify-between ${
            isDark ? 'bg-[#1E293B] border-[#334155]' : 'bg-[#EAF3FB] border-[#C6E2F7]'
          }`}>
            <div>
              <div className={`rounded-2xl p-4 shadow-sm mb-4 text-xs ${
                isDark ? 'bg-[#0B132B] border border-[#334155]' : 'bg-white border border-[#E0EDF8]'
              }`}>
                <span className="font-bold text-[#1E3A8A] dark:text-[#38BDF8] block mb-1">Answer with Citations:</span>
                <p className="text-inherit text-[11px] leading-relaxed">
                  Recursion breaks problems into smaller instances until reaching a base case.
                  <span className="inline-block px-1.5 py-0.2 rounded bg-[#FCF4E3] text-[#B45309] font-mono font-bold ml-1">
                    [p.2, para 1]
                  </span>
                </p>
              </div>

              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white dark:bg-[#0B132B] text-[#1E3A8A] dark:text-[#38BDF8] text-[10px] font-bold uppercase tracking-wider mb-2">
                1. Chat
              </span>
              <h3 className="text-lg font-bold text-inherit mb-2">
                Source-Locked Chat
              </h3>
              <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-[#94A3B8]' : 'text-[#6B625E]'}`}>
                Every tutor answer shows clickable citation chips. Out-of-notes questions return strict abstention with zero hallucination.
              </p>
            </div>
            <button onClick={onOpenWorkspace} className="text-xs font-semibold text-[#1E3A8A] dark:text-[#38BDF8] hover:underline flex items-center gap-1">
              Explore feature →
            </button>
          </div>

          {/* Card 2: Interruptible Voice Tutor */}
          <div className={`rounded-[28px] p-6 shadow-sm border transform hover:-translate-y-1 transition-all md:rotate-1 flex flex-col justify-between ${
            isDark ? 'bg-[#1E293B] border-[#334155]' : 'bg-[#FCF4E3] border-[#FCE2BF]'
          }`}>
            <div>
              <div className={`rounded-2xl p-4 shadow-sm mb-4 ${
                isDark ? 'bg-[#0B132B] border border-[#334155]' : 'bg-white border border-[#F8E7CD]'
              }`}>
                <div className="flex items-center justify-between mb-2 text-[10px]">
                  <span className="font-bold text-[#92400E] dark:text-[#FBBF24]">Waveform Visualizer</span>
                  <span className="text-red-500 font-semibold">Barge-in Ready</span>
                </div>
                <div className="flex items-center justify-center gap-1 h-6">
                  {Array.from({ length: 18 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-[#FF5E4D] rounded-full active"
                      style={{ height: `${6 + (i % 5) * 4}px` }}
                    />
                  ))}
                </div>
              </div>

              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white dark:bg-[#0B132B] text-[#92400E] dark:text-[#FBBF24] text-[10px] font-bold uppercase tracking-wider mb-2">
                2. Voice
              </span>
              <h3 className="text-lg font-bold text-inherit mb-2">
                Interruptible Voice Tutor
              </h3>
              <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-[#94A3B8]' : 'text-[#6B625E]'}`}>
                Interrupt the tutor mid-sentence. It pauses audio instantly, resolves your interruption, and resumes from the exact bookmarked chunk.
              </p>
            </div>
            <button onClick={onOpenWorkspace} className="text-xs font-semibold text-[#92400E] dark:text-[#FBBF24] hover:underline flex items-center gap-1">
              Explore feature →
            </button>
          </div>

          {/* Card 3: Doubt Memory */}
          <div className={`rounded-[28px] p-6 shadow-sm border transform hover:-translate-y-1 transition-all md:-rotate-1 flex flex-col justify-between ${
            isDark ? 'bg-[#1E293B] border-[#334155]' : 'bg-[#F8EDFB] border-[#EADBFC]'
          }`}>
            <div>
              <div className={`rounded-2xl p-4 shadow-sm mb-4 text-xs ${
                isDark ? 'bg-[#0B132B] border border-[#334155]' : 'bg-white border border-[#EBD7F8]'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-[#6B21A8] dark:text-[#C084FC]">Recursion</span>
                  <span className="text-[10px] bg-[#FEE2E2] text-[#991B1B] px-2 py-0.5 rounded-full font-bold">
                    Unresolved
                  </span>
                </div>
                <div className="flex gap-1 text-[9px]">
                  <span className="px-1.5 py-0.5 rounded bg-[#FAF7F2] dark:bg-[#1E293B] border">1. Simpler</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#FAF7F2] dark:bg-[#1E293B] border">2. Visual</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#FAF7F2] dark:bg-[#1E293B] border">3. Practice</span>
                </div>
              </div>

              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white dark:bg-[#0B132B] text-[#6B21A8] dark:text-[#C084FC] text-[10px] font-bold uppercase tracking-wider mb-2">
                3. Doubts
              </span>
              <h3 className="text-lg font-bold text-inherit mb-2">
                Doubt Memory
              </h3>
              <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-[#94A3B8]' : 'text-[#6B625E]'}`}>
                Tracks unresolved concepts persistently in SQLite. Complete simpler explanations, visual examples, and practice tasks to resolve.
              </p>
            </div>
            <button onClick={onOpenWorkspace} className="text-xs font-semibold text-[#6B21A8] dark:text-[#C084FC] hover:underline flex items-center gap-1">
              Explore feature →
            </button>
          </div>

          {/* Card 4: Verification Engine */}
          <div className={`rounded-[28px] p-6 shadow-sm border transform hover:-translate-y-1 transition-all md:rotate-1 flex flex-col justify-between ${
            isDark ? 'bg-[#1E293B] border-[#334155]' : 'bg-[#E9F7F0] border-[#C5F0D9]'
          }`}>
            <div>
              <div className={`rounded-2xl p-4 shadow-sm mb-4 text-xs ${
                isDark ? 'bg-[#0B132B] border border-[#334155]' : 'bg-white border border-[#D1F4E2]'
              }`}>
                <span className="font-bold text-[#065F46] dark:text-[#34D399] block mb-1">Key Ideas Checklist:</span>
                <div className="space-y-1 text-[11px]">
                  <div className="text-[#065F46] dark:text-[#34D399]">✓ Function calls itself</div>
                  <div className="text-[#EF4444]">✗ Missing: base case stops calls</div>
                </div>
              </div>

              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white dark:bg-[#0B132B] text-[#065F46] dark:text-[#34D399] text-[10px] font-bold uppercase tracking-wider mb-2">
                4. Check
              </span>
              <h3 className="text-lg font-bold text-inherit mb-2">
                Verification Engine
              </h3>
              <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-[#94A3B8]' : 'text-[#6B625E]'}`}>
                Active recall tests against 3 key ideas, revealing ticks 300ms apart. Gaps trigger targeted explanations rather than generic scores.
              </p>
            </div>
            <button onClick={onOpenWorkspace} className="text-xs font-semibold text-[#065F46] dark:text-[#34D399] hover:underline flex items-center gap-1">
              Explore feature →
            </button>
          </div>

          {/* Card 5: Context-Aware Interruptions */}
          <div className={`rounded-[28px] p-6 shadow-sm border transform hover:-translate-y-1 transition-all md:-rotate-1 flex flex-col justify-between ${
            isDark ? 'bg-[#1E293B] border-[#334155]' : 'bg-[#FCF4E3] border-[#FCE2BF]'
          }`}>
            <div>
              <div className={`rounded-2xl p-3.5 shadow-sm mb-4 text-xs ${
                isDark ? 'bg-[#0B132B] border border-[#334155]' : 'bg-white border border-[#F8E7CD]'
              }`}>
                <span className="text-[10px] uppercase font-bold text-[#B45309] dark:text-[#FBBF24] block mb-0.5">Context Suggestion:</span>
                <p className="text-[11px] text-inherit mb-2">
                  "You missed the base case twice. Review call stack first?"
                </p>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-[#FF5E4D] text-white text-[9px] font-bold">Accept</span>
                  <span className="px-2 py-0.5 rounded-full border text-[9px]">Dismiss</span>
                </div>
              </div>

              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white dark:bg-[#0B132B] text-[#B45309] dark:text-[#FBBF24] text-[10px] font-bold uppercase tracking-wider mb-2">
                5. Nudge
              </span>
              <h3 className="text-lg font-bold text-inherit mb-2">
                Context-Aware Interventions
              </h3>
              <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-[#94A3B8]' : 'text-[#6B625E]'}`}>
                Triggers exclusively on learning evidence (repeated errors, prerequisite gaps). Never uses popups or timers. Dismissed suggestions never reappear.
              </p>
            </div>
            <button onClick={onOpenWorkspace} className="text-xs font-semibold text-[#B45309] dark:text-[#FBBF24] hover:underline flex items-center gap-1">
              Explore feature →
            </button>
          </div>

          {/* Card 6: Interactive Stack Diagram */}
          <div className={`rounded-[28px] p-6 shadow-sm border transform hover:-translate-y-1 transition-all md:rotate-1 flex flex-col justify-between ${
            isDark ? 'bg-[#1E293B] border-[#334155]' : 'bg-[#EAF3FB] border-[#C6E2F7]'
          }`}>
            <div>
              <div className="mb-4">
                <StackVisualizer compact={true} />
              </div>

              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white dark:bg-[#0B132B] text-[#1E3A8A] dark:text-[#38BDF8] text-[10px] font-bold uppercase tracking-wider mb-2">
                Visual Trace
              </span>
              <h3 className="text-lg font-bold text-inherit mb-2">
                Interactive Stack Diagram
              </h3>
              <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-[#94A3B8]' : 'text-[#6B625E]'}`}>
                Step-by-step trace of factorial(3). Frames push down one by one, then pop up as values return during stack unwinding.
              </p>
            </div>
            <button onClick={onOpenWorkspace} className="text-xs font-semibold text-[#1E3A8A] dark:text-[#38BDF8] hover:underline flex items-center gap-1">
              Open interactive workspace →
            </button>
          </div>
        </div>
      </section>

      {/* Demo Strip: Working mini chat box for instant test */}
      <section id="demo" className={`max-w-4xl mx-auto px-6 py-20 border-t ${
        isDark ? 'border-[#1E293B]' : 'border-[#F2ECE4]'
      }`}>
        <div className={`rounded-[32px] p-8 shadow-md border ${
          isDark ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#F2ECE4]'
        }`}>
          <div className="text-center mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF5E4D] block mb-1">
              TRY IT RIGHT NOW
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-inherit">
              Test the Source-Locked Tutor
            </h2>
            <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#6B625E]'}`}>
              Ask a question answered in your notes or try an out-of-notes question.
            </p>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            <button
              onClick={() => {
                setDemoQuestion('What is recursion?');
                handleAskDemo('What is recursion?');
              }}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                isDark
                  ? 'bg-[#0B132B] border-[#334155] text-white hover:bg-[#334155]'
                  : 'bg-[#FAF7F2] border-[#D8CEBE] text-[#27211E] hover:bg-[#F2ECE4]'
              }`}
            >
              "What is recursion?"
            </button>
            <button
              onClick={() => {
                setDemoQuestion('What is a base case?');
                handleAskDemo('What is a base case?');
              }}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                isDark
                  ? 'bg-[#0B132B] border-[#334155] text-white hover:bg-[#334155]'
                  : 'bg-[#FAF7F2] border-[#D8CEBE] text-[#27211E] hover:bg-[#F2ECE4]'
              }`}
            >
              "What is a base case?"
            </button>
            <button
              onClick={() => {
                setDemoQuestion('What is tail recursion?');
                handleAskDemo('What is tail recursion?');
              }}
              className="px-3 py-1 text-xs font-medium rounded-full bg-[#FCF4E3] text-[#B45309] border border-[#FDE68A] hover:bg-[#FDE68A] transition-colors"
            >
              "What is tail recursion?" (Out of notes)
            </button>
          </div>

          {/* Chat input box */}
          <div className="flex items-center gap-2 mb-6">
            <input
              type="text"
              value={demoQuestion}
              onChange={e => setDemoQuestion(e.target.value)}
              placeholder="Ask anything about your recursion notes..."
              className={`flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-full border focus:outline-none focus:border-[#FF5E4D] ${
                isDark
                  ? 'bg-[#0B132B] border-[#334155] text-white'
                  : 'bg-[#FAF7F2] border-[#D8CEBE] text-[#27211E]'
              }`}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAskDemo();
              }}
            />
            <button
              onClick={() => handleAskDemo()}
              disabled={isDemoLoading}
              className="px-5 py-2.5 rounded-full bg-[#FF5E4D] text-white font-semibold text-xs sm:text-sm hover:bg-[#E84D3C] transition-all shadow-sm"
            >
              {isDemoLoading ? 'Searching Notes...' : 'Ask Tutor'}
            </button>
          </div>

          {/* Response Display */}
          {demoResponse && (
            <div className={`rounded-2xl p-4 border ${
              isDark ? 'bg-[#0B132B] border-[#334155]' : 'bg-[#FAF7F2] border-[#F2ECE4]'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  isDark ? 'text-[#94A3B8]' : 'text-[#6B625E]'
                }`}>
                  Question: "{demoResponse.question}"
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  demoResponse.grounded === 1
                    ? 'bg-[#E9F7F0] text-[#065F46]'
                    : 'bg-[#FEE2E2] text-[#991B1B]'
                }`}>
                  {demoResponse.grounded === 1 ? 'Source-Grounded' : 'Not In Notes'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-inherit leading-relaxed mb-3">
                {demoResponse.answer}
              </p>

              {demoResponse.citations && demoResponse.citations.length > 0 && (
                <div className={`pt-2 border-t flex items-center justify-between ${
                  isDark ? 'border-[#334155]' : 'border-[#F2ECE4]'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] ${isDark ? 'text-[#94A3B8]' : 'text-[#6B625E]'}`}>
                      Source Citation:
                    </span>
                    {demoResponse.citations.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-[#FCF4E3] text-[#B45309] font-mono font-bold text-xs border border-[#FDE68A]">
                        [p.{c.pageNo}]
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={onOpenWorkspace}
                    className="text-xs font-semibold text-[#FF5E4D] hover:underline"
                  >
                    Open in Full 3-Panel Workspace →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className={`w-full border-t py-8 text-xs ${
        isDark ? 'border-[#1E293B] text-[#64748B]' : 'border-[#F2ECE4] text-[#8C827A]'
      }`}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF5E4D]" />
            <span>Unera — Learn from your own notes.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-inherit transition-colors">Features</a>
            <a href="#demo" className="hover:text-inherit transition-colors">Demo</a>
            <button onClick={onUploadNotes} className="hover:text-inherit transition-colors">Upload</button>
            <button onClick={onOpenWorkspace} className="text-[#FF5E4D] font-semibold hover:underline">Study Workspace</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
