import React, { useEffect, useState, useRef } from 'react';
import { LanguageCode, LANGUAGES, getTranslation } from '../utils/i18n';
import { Rotating3DLogo } from './Rotating3DLogo';

interface ThreeDLoadingScreenProps {
  onComplete: () => void;
  onProceedToLogin?: () => void;
  autoTransition?: boolean;
  lang?: LanguageCode;
  onLanguageChange?: (lang: LanguageCode) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const ThreeDLoadingScreen: React.FC<ThreeDLoadingScreenProps> = ({
  onComplete,
  onProceedToLogin,
  autoTransition = true,
  lang = 'en',
  onLanguageChange,
  theme = 'dark',
  onToggleTheme
}) => {
  const t = getTranslation(lang);
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusMessage, setStatusMessage] = useState(t.loadingTitle);
  const [isWarping, setIsWarping] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const audioContextRef = useRef<any>(null);

  const isDark = theme === 'dark';

  // Soft synthetic paper rustle sound on page flip
  const playPageRustle = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const bufferSize = ctx.sampleRate * 0.05;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, ctx.currentTime);
      filter.Q.setValueAtTime(1.8, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch {
      // Audio autoplay policy fallback
    }
  };

  // Rapid page flipping & camera zoom progression loop (0 -> 100% in ~2.8s)
  useEffect(() => {
    const totalDuration = 2800; // 2.8 seconds
    const intervalTime = 70;
    const step = 100 / (totalDuration / intervalTime);

    const timer = setInterval(() => {
      setProgress(prev => {
        const next = Math.min(100, Math.round(prev + step));

        // Rapid page flip counter
        setCurrentPage(Math.min(120, Math.floor((next / 100) * 120)));
        if (Math.random() > 0.4) {
          playPageRustle();
        }

        if (next < 25) {
          setStatusMessage(lang === 'hi' ? 'चैप्टर 1: यूनेरा 3D बुक खुल रही है...' : 'Opening UNERA 3D Knowledge Book...');
        } else if (next < 55) {
          setStatusMessage(lang === 'hi' ? 'पन्ने तेजी से पलट रहे हैं: रिकर्शन और कॉल स्टैक...' : 'Rapidly flipping pages: Functions & Recursion...');
        } else if (next < 85) {
          setStatusMessage(lang === 'hi' ? '🔎 वर्कस्पेस पेज पर 3D कैमरा ज़ूम इन हो रहा है...' : '🔎 Camera Zooming into UNERA Workspace Page...');
        } else if (next >= 85 && next < 100) {
          setStatusMessage(lang === 'hi' ? 'पेज से सीधा लैंप लॉगिन रूम में प्रवेश...' : 'Expanding into Lamp Login Room...');
        } else if (next >= 100) {
          clearInterval(timer);
          setStatusMessage(t.calibrated100);

          // Direct automatic transition into Lamp Login page
          if (autoTransition) {
            setTimeout(() => {
              handleProceedToLogin();
            }, 600);
          }
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [autoTransition, lang]);

  const handleProceedToLogin = () => {
    setIsWarping(true);
    setTimeout(() => {
      if (onProceedToLogin) {
        onProceedToLogin();
      } else {
        onComplete();
      }
    }, 600);
  };

  // 3D Mouse Parallax
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMousePos({ x, y });
  };

  // Dynamic 3D rotation angles based on mouse
  const rotX = 16 - mousePos.y * 10;
  const rotY = -10 + mousePos.x * 14;

  // Book animation phases
  const coverOpenAngle = Math.min(165, (progress / 20) * 165);
  const page1Angle = progress > 15 ? Math.min(170, ((progress - 15) / 18) * 170) : 0;
  const page2Angle = progress > 30 ? Math.min(170, ((progress - 30) / 18) * 170) : 0;
  const page3Angle = progress > 45 ? Math.min(170, ((progress - 45) / 18) * 170) : 0;

  // Cinematic Zoom into the featured website page as progress advances past 55%
  const zoomScale = progress < 50
    ? 1
    : 1 + ((progress - 50) / 50) * 2.2; // Smoothly scales up to ~3.2x into the website page!

  const zoomTranslateX = progress < 50 ? 0 : ((progress - 50) / 50) * 120;
  const zoomTranslateY = progress < 50 ? 0 : ((progress - 50) / 50) * -15;

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`fixed inset-0 z-50 flex flex-col justify-between p-4 sm:p-6 select-none overflow-hidden transition-all duration-700 font-sans ${
        isWarping ? 'opacity-0 scale-125' : 'opacity-100 scale-100'
      } ${
        isDark ? 'bg-[#0B0E17] text-[#F8FAFC]' : 'bg-[#FAF7F2] text-[#1E1B18]'
      }`}
      style={{
        backgroundImage: isDark
          ? 'radial-gradient(1200px 750px at 50% 180px, rgba(245, 158, 11, 0.22) 0%, rgba(15, 23, 42, 0.85) 55%, #070A12 100%)'
          : 'radial-gradient(1200px 750px at 50% 180px, rgba(254, 243, 199, 0.95) 0%, rgba(244, 236, 225, 0.85) 55%, #ECE3D6 100%)'
      }}
    >
      {/* Background Volumetric Lamp Ambient Light Beam (Matches Lamp Page) */}
      <div
        className="pointer-events-none absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[700px] opacity-45 blur-3xl rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.45) 0%, rgba(217, 119, 6, 0.15) 50%, transparent 75%)'
        }}
      />

      {/* Floating Sparkles & Math Badges */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <span className="absolute top-1/4 left-1/5 text-amber-400/40 text-lg animate-pulse">✦</span>
        <span className="absolute top-1/3 right-1/4 text-amber-300/40 text-sm animate-bounce">✧</span>
        <span className="absolute bottom-1/3 left-1/3 text-amber-500/30 font-mono text-xs">T(n) = 2T(n/2) + O(n)</span>
        <span className="absolute top-1/2 right-1/5 text-amber-400/30 font-mono text-xs">SHA-256 [0x7f...]</span>
      </div>

      {/* ==================================================== */}
      {/* TOP CONTROL BAR: Language, Dark/Light Mode, Skip     */}
      {/* ==================================================== */}
      <header className="relative z-30 w-full max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Rotating3DLogo size={28} />
          <div>
            <h1 className="text-base font-black tracking-tight flex items-center gap-2">
              <span className={isDark ? 'text-white' : 'text-zinc-900'}>{t.appName}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                {t.versionBadge}
              </span>
            </h1>
            <p className="text-[11px] text-amber-400/80 font-mono tracking-wider hidden sm:block">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Right Controls: Languages + Theme Toggle + Skip Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher Pill */}
          {onLanguageChange && (
            <div className={`flex items-center rounded-full p-1 text-xs border backdrop-blur-md ${
              isDark ? 'bg-black/40 border-white/10' : 'bg-white/80 border-amber-300/60 shadow-sm'
            }`}>
              <span className="text-amber-500 px-1 text-[11px]">🌐</span>
              {LANGUAGES.map(item => (
                <button
                  key={item.code}
                  onClick={() => onLanguageChange(item.code)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                    lang === item.code
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30 scale-105'
                      : isDark ? 'text-zinc-300 hover:text-white' : 'text-zinc-700 hover:text-black'
                  }`}
                  title={item.label}
                >
                  {item.nativeName}
                </button>
              ))}
            </div>
          )}

          {/* Theme Toggle Button */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-full border text-xs font-bold transition-all backdrop-blur-md ${
                isDark
                  ? 'bg-black/40 border-white/15 text-amber-300 hover:bg-white/10'
                  : 'bg-white border-amber-300 text-amber-800 hover:bg-amber-50 shadow-sm'
              }`}
              title={isDark ? t.lightMode : t.darkMode}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          )}

          {/* Skip directly to Login button */}
          <button
            onClick={handleProceedToLogin}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all shadow-md bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black hover:opacity-95 shadow-amber-500/25 active:scale-95"
          >
            <span>💡</span>
            <span>{t.proceedToLogin}</span>
          </button>
        </div>
      </header>

      {/* ==================================================== */}
      {/* 3D BOOK WITH CINEMATIC WEBSITE PAGE ZOOM             */}
      {/* ==================================================== */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center my-auto perspective-scene">
        {/* Dynamic Zooming Camera Container */}
        <div
          className="relative preserve-3d transition-all duration-300 ease-out cursor-grab active:cursor-grabbing"
          style={{
            width: 'min(460px, 92vw)',
            height: '270px',
            transform: `scale(${zoomScale}) translate(${zoomTranslateX}px, ${zoomTranslateY}px) rotateX(${progress > 55 ? Math.max(0, rotX * (1 - (progress - 55) / 45)) : rotX}deg) rotateY(${progress > 55 ? Math.max(0, rotY * (1 - (progress - 55) / 45)) : rotY}deg)`
          }}
        >
          {/* Desk Surface Shadow */}
          <div
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[480px] h-20 rounded-full blur-2xl opacity-75 pointer-events-none"
            style={{
              background: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(217, 119, 6, 0.25)'
            }}
          />

          {/* Golden Radiant Light Ray from Book Center */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none transition-opacity duration-500"
            style={{
              background: 'radial-gradient(circle, rgba(251, 191, 36, 0.7) 0%, rgba(245, 158, 11, 0.25) 45%, transparent 70%)',
              opacity: progress > 15 ? 1 : 0.2
            }}
          />

          {/* ==================================================== */}
          {/* THE PARTICULAR PAGE: LIVE UNERA WEBSITE PREVIEW      */}
          {/* (Right side base page that camera zooms into)        */}
          {/* ==================================================== */}
          <div
            className="absolute inset-0 rounded-r-2xl border preserve-3d shadow-2xl transition-colors duration-500 overflow-hidden"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, #1E1B29 0%, #111422 100%)'
                : 'linear-gradient(135deg, #854D0E 0%, #582C07 100%)',
              borderColor: isDark ? 'rgba(245, 158, 11, 0.5)' : '#A16207'
            }}
          >
            {/* Embedded Live UNERA Website Interface on the Page */}
            <div
              className={`absolute top-2 bottom-2 left-2 right-2 rounded-r-xl border p-3.5 flex flex-col justify-between select-none ${
                isDark
                  ? 'bg-[#0F172A] text-[#F8FAFC] border-amber-500/40 shadow-inner'
                  : 'bg-[#FFFDF7] text-[#1E1B18] border-amber-300 shadow-inner'
              }`}
            >
              {/* Mini Website Top Bar */}
              <div className="flex items-center justify-between pb-2 border-b border-amber-500/25">
                <div className="flex items-center gap-2">
                  <Rotating3DLogo size={20} />
                  <span className="font-extrabold text-xs tracking-tight text-amber-400">
                    UNERA STUDY WORKSPACE
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    v3.2
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Recursion Notes (p.2)</span>
                </div>
              </div>

              {/* Mini Website 2-Column Split: Source Reader + AI Tutor */}
              <div className="grid grid-cols-12 gap-2 my-auto py-1">
                {/* Left Mini Source Reader */}
                <div className="col-span-6 rounded-lg p-2 text-[10px] font-mono bg-black/30 border border-white/5 space-y-1">
                  <div className="text-[9px] font-bold text-amber-400/90 flex justify-between">
                    <span>📄 Document Notes</span>
                    <span>Page 2 / 10</span>
                  </div>
                  <p className="text-[9px] leading-tight text-zinc-300">
                    A recursive function solves a problem by breaking it down into smaller subproblems...
                  </p>
                  <div className="p-1 rounded bg-amber-400/20 border-l-2 border-amber-400 text-amber-200 text-[9px]">
                    "if (n &lt;= 1) return 1; // Base case guard"
                  </div>
                </div>

                {/* Right Mini AI Tutor Chat */}
                <div className="col-span-6 rounded-lg p-2 text-[10px] font-sans bg-black/30 border border-white/5 space-y-1">
                  <div className="p-1 rounded bg-zinc-800 text-zinc-200 text-[9px]">
                    <b>Student:</b> What is recursion?
                  </div>
                  <div className="p-1 rounded bg-amber-500/15 border-l-2 border-amber-400 text-amber-200 text-[9px] space-y-0.5">
                    <p className="text-[8px] text-amber-400 font-bold uppercase">Source-Grounded Answer</p>
                    <p className="text-[9px] leading-tight">Recursion calls itself until base case is reached.</p>
                    <span className="inline-block px-1 py-0.2 rounded bg-amber-400/30 text-amber-100 text-[8px] font-mono">
                      [p.2, para 1]
                    </span>
                  </div>
                </div>
              </div>

              {/* Mini Website Bottom Status: Deduplicated & Grounded */}
              <div className="pt-1 border-t border-amber-500/20 flex items-center justify-between text-[9px] font-mono text-amber-300/90">
                <span className="flex items-center gap-1">
                  <span className="text-emerald-400">⚡</span>
                  <span>Cache: 0ms • Source Grounded</span>
                </span>
                <span className="text-amber-400 font-bold animate-pulse">
                  {progress >= 60 ? '✨ Zooming into Website...' : 'Notes Loaded'}
                </span>
              </div>
            </div>
          </div>

          {/* 3D Flipping Page 3 (Fast Turning Leaf) */}
          <div
            className="absolute top-2 bottom-2 left-0 w-[50%] page-turn-origin preserve-3d rounded-r-xl border transition-transform duration-300"
            style={{
              transform: `rotateY(-${page3Angle}deg)`,
              background: '#F8F3E4',
              borderColor: 'rgba(217, 119, 6, 0.35)',
              boxShadow: page3Angle > 0 && page3Angle < 160 ? '0 10px 25px rgba(0,0,0,0.35)' : 'none',
              zIndex: 13
            }}
          >
            <div className="p-3 text-[10px] font-mono text-zinc-900 flex flex-col justify-between h-full">
              <span className="font-bold text-amber-900">3. Layered Answer Cache</span>
              <p className="text-[9px] text-zinc-600">Layer A: Exact Hash<br />Layer B: Semantic Vector</p>
              <span className="text-[8px] text-emerald-700 font-bold">Latency: 2ms • Instant Verification</span>
            </div>
          </div>

          {/* 3D Flipping Page 2 */}
          <div
            className="absolute top-2 bottom-2 left-0 w-[50%] page-turn-origin preserve-3d rounded-r-xl border transition-transform duration-300"
            style={{
              transform: `rotateY(-${page2Angle}deg)`,
              background: '#FAF6EB',
              borderColor: 'rgba(217, 119, 6, 0.35)',
              boxShadow: page2Angle > 0 && page2Angle < 160 ? '0 10px 25px rgba(0,0,0,0.35)' : 'none',
              zIndex: 12
            }}
          >
            <div className="p-3 text-[10px] font-mono text-zinc-900 flex flex-col justify-between h-full">
              <span className="font-bold text-amber-900">2. SHA-256 Fingerprint</span>
              <p className="text-[9px] text-zinc-600">Content-addressed indexing. Universal deduplication active.</p>
              <span className="text-[8px] text-zinc-500 font-mono">Hash: b91ead333294...</span>
            </div>
          </div>

          {/* 3D Flipping Page 1 */}
          <div
            className="absolute top-2 bottom-2 left-0 w-[50%] page-turn-origin preserve-3d rounded-r-xl border transition-transform duration-300"
            style={{
              transform: `rotateY(-${page1Angle}deg)`,
              background: '#FAF6EB',
              borderColor: 'rgba(217, 119, 6, 0.35)',
              boxShadow: page1Angle > 0 && page1Angle < 160 ? '0 10px 25px rgba(0,0,0,0.35)' : 'none',
              zIndex: 11
            }}
          >
            <div className="p-3 text-[10px] font-mono text-zinc-900 flex flex-col justify-between h-full">
              <span className="font-bold text-amber-900">1. Functions & The Call Stack</span>
              <p className="text-[9px] text-zinc-600 font-mono">if (n &lt;= 1) return 1;</p>
              <div className="flex justify-between items-center text-[8px] text-amber-800">
                <span>Call Stack Guard</span>
                <span>Active</span>
              </div>
            </div>
          </div>

          {/* ==================================================== */}
          {/* 3D FRONT HARDCOVER: UNERA BOOK NAME + 3D LOGO       */}
          {/* ==================================================== */}
          <div
            className="absolute inset-0 page-turn-origin rounded-r-2xl border preserve-3d shadow-2xl transition-transform duration-500"
            style={{
              transform: `rotateY(-${coverOpenAngle}deg)`,
              background: isDark
                ? 'linear-gradient(135deg, #1C1928 0%, #0F121C 100%)'
                : 'linear-gradient(135deg, #92400E 0%, #713F12 100%)',
              borderColor: isDark ? '#F59E0B' : '#FBBF24',
              zIndex: 20
            }}
          >
            {/* Front Cover Gold Embossed Artwork with Rotating 3D Logo */}
            <div className="absolute inset-2 rounded-r-xl border-2 border-amber-400/40 p-4 flex flex-col items-center justify-between text-center bg-black/20">
              <div className="text-[10px] tracking-widest text-amber-400 font-mono font-bold uppercase">
                Interactive Learning OS
              </div>

              {/* UNERA 3D Logo + Name Front & Center */}
              <div className="flex flex-col items-center gap-2 my-auto">
                <div className="p-2 rounded-2xl bg-amber-500/10 border border-amber-400/30 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                  <Rotating3DLogo size={52} />
                </div>
                <h2 className="font-black text-2xl text-amber-200 tracking-wider drop-shadow-md">
                  UNERA
                </h2>
                <p className="text-[10px] text-amber-300/80 font-mono max-w-[200px]">
                  Your Notes. Smarter Learning.
                </p>
              </div>

              <div className="text-[9px] text-amber-400/70 font-mono flex items-center gap-1.5">
                <span>⭐</span>
                <span>v3.2 Enterprise Edition</span>
              </div>
            </div>
          </div>

          {/* Gold Embossed Spine */}
          <div
            className="absolute top-0 bottom-0 left-0 w-6 rounded-l-md border-r border-amber-500/40 spine-glow flex flex-col items-center justify-center text-[9px] font-black text-black font-mono tracking-widest"
            style={{
              transform: 'rotateY(-90deg) translateX(-12px)',
              transformOrigin: 'left center'
            }}
          >
            U • N • E • R • A
          </div>
        </div>

        {/* 3D Zoom Callout Pill */}
        <div className="mt-8 flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/50 border border-amber-500/40 backdrop-blur-md text-xs font-mono text-amber-400 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>
            {progress >= 60 ? '🔎 Zooming into UNERA Workspace Page...' : t.mouseTiltPrompt}
          </span>
        </div>
      </main>

      {/* ==================================================== */}
      {/* BOTTOM PROGRESS BAR & STATUS                         */}
      {/* ==================================================== */}
      <footer className="relative z-30 w-full max-w-xl mx-auto flex flex-col items-center gap-3 text-center pb-2">
        <div className="w-full space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold font-mono">
            <span className="text-amber-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              {statusMessage}
            </span>
            <span className={isDark ? 'text-white font-extrabold' : 'text-zinc-900 font-extrabold'}>
              Page {currentPage} / 120 ({progress}%)
            </span>
          </div>

          {/* Glowing Amber Gradient Progress Bar (Matches Lamp Page) */}
          <div className={`w-full h-2.5 rounded-full overflow-hidden p-0.5 border shadow-inner ${
            isDark ? 'bg-black/60 border-amber-500/40' : 'bg-amber-100 border-amber-300'
          }`}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-200 transition-all duration-150 shadow-[0_0_15px_rgba(251,191,36,0.9)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Proceed Action Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleProceedToLogin}
            className="px-6 py-2.5 rounded-full font-black text-xs sm:text-sm transition-all shadow-lg flex items-center gap-2 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black hover:scale-105 shadow-amber-500/30 cursor-pointer active:scale-95"
          >
            <span>💡</span>
            <span>{t.proceedToLogin}</span>
          </button>
        </div>

        <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          {t.openingBook}
        </p>
      </footer>
    </div>
  );
};
