import React, { useState, useEffect, useRef } from 'react';
import { Rotating3DLogo } from '../components/Rotating3DLogo';
import { LanguageCode, LANGUAGES, getTranslation } from '../utils/i18n';

interface LampLoginPageProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  lang: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  onLoginSuccess: (userRole?: string) => void;
  onOpen3DView: () => void;
  onOpenWorkspaceDirect?: () => void;
  initialLightOn?: boolean;
}

export const LampLoginPage: React.FC<LampLoginPageProps> = ({
  theme,
  onToggleTheme,
  lang,
  onLanguageChange,
  onLoginSuccess,
  onOpen3DView,
  onOpenWorkspaceDirect,
  initialLightOn = false
}) => {
  const t = getTranslation(lang);
  const [isLightOn, setIsLightOn] = useState(initialLightOn);
  const [isPulling, setIsPulling] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [email, setEmail] = useState('alex.rivera@campus.edu');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isEntering, setIsEntering] = useState(false);
  const isDark = theme === 'dark';

  // Synthetic switch click sound using Web Audio API
  const playSwitchSound = (turnOn: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(turnOn ? 440 : 320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(turnOn ? 880 : 180, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // AudioContext policy fallback
    }
  };

  // Toggle light with pull animation
  const handleToggleLight = () => {
    setIsPulling(true);
    setPullY(34); // Cord stretch distance
    playSwitchSound(!isLightOn);

    setTimeout(() => {
      setIsLightOn(prev => !prev);
      setPullY(0); // Snap back
      setTimeout(() => {
        setIsPulling(false);
      }, 150);
    }, 180);
  };

  // Drag cord support
  const handleCordTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const handleMove = (moveEvent: TouchEvent | MouseEvent) => {
      const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      const diff = Math.max(0, Math.min(48, currentY - startY));
      setPullY(diff);
    };

    const handleEnd = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);

      if (pullY > 15) {
        handleToggleLight();
      } else {
        setPullY(0);
      }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);
  };

  const handleSignIn = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setLoginError('Please enter your email or student ID');
      return;
    }
    setLoginError(null);
    setIsEntering(true);

    setTimeout(() => {
      onLoginSuccess('student');
    }, 600);
  };

  const handleDemoLogin = (role: 'student' | 'prof' | 'evaluator') => {
    if (role === 'student') {
      setEmail('alex.rivera@campus.edu');
    } else if (role === 'prof') {
      setEmail('prof.rao@unera.edu');
    } else {
      setEmail('evaluator.hackathon@unera.ai');
    }
    setPassword('demo2026');
    if (!isLightOn) {
      handleToggleLight();
    }
    setIsEntering(true);
    setTimeout(() => {
      onLoginSuccess(role);
    }, 600);
  };

  return (
    <div
      className={`min-h-screen relative overflow-hidden select-none transition-colors duration-1000 flex flex-col justify-between font-sans ${
        isLightOn
          ? isDark
            ? 'bg-[#131726]'
            : 'bg-[#F4ECE1]'
          : isDark
            ? 'bg-[#05070E]'
            : 'bg-[#222129]'
      }`}
      style={{
        backgroundImage: isLightOn
          ? isDark
            ? 'radial-gradient(1200px 750px at 50% 180px, rgba(245, 158, 11, 0.18) 0%, rgba(15, 23, 42, 0.85) 55%, #070A12 100%)'
            : 'radial-gradient(1200px 750px at 50% 180px, rgba(254, 243, 199, 0.95) 0%, rgba(245, 236, 225, 0.9) 55%, #EDE4D8 100%)'
          : isDark
            ? 'radial-gradient(900px 600px at 50% 120px, rgba(15, 23, 42, 0.4) 0%, #030408 100%)'
            : 'radial-gradient(900px 600px at 50% 120px, rgba(40, 38, 48, 0.6) 0%, #17161D 100%)'
      }}
    >
      {/* 3D Entry Zoom Overlay */}
      {isEntering && (
        <div className="absolute inset-0 z-50 pointer-events-none bg-amber-400/20 backdrop-blur-md animate-ping duration-700" />
      )}

      {/* Top Floating Control Bar */}
      <header className="relative z-40 w-full max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Rotating3DLogo size={28} />
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-white drop-shadow-sm flex items-center gap-2">
              {t.appName}
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {t.versionBadge}
              </span>
            </span>
            <span className="text-[10px] text-amber-200/60 font-mono tracking-wider hidden sm:inline">
              {t.tagline}
            </span>
          </div>
        </div>

        {/* Language Selector + Dark/Light Toggle + 3D View Link */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher Pill */}
          <div className="flex items-center bg-black/40 backdrop-blur-md border border-white/10 rounded-full p-1 text-xs">
            <span className="text-amber-400/80 px-1 text-[11px]">🌐</span>
            {LANGUAGES.map(item => (
              <button
                key={item.code}
                onClick={() => onLanguageChange(item.code)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                  lang === item.code
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30 scale-105'
                    : 'text-zinc-300 hover:text-white hover:bg-white/10'
                }`}
                title={item.label}
              >
                {item.nativeName}
              </button>
            ))}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-full bg-black/40 border border-white/10 text-amber-300 hover:bg-white/10 transition-all text-xs"
            title={isDark ? t.lightMode : t.darkMode}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* Return to 3D Knowledge Core */}
          <button
            onClick={onOpen3DView}
            className="px-3 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
            title={t.view3D}
          >
            <span>🌀</span>
            <span className="hidden sm:inline">{t.view3D}</span>
          </button>
        </div>
      </header>

      {/* Main Lamp + Login Card Stage */}
      <main className="relative z-30 flex-1 flex flex-col items-center justify-center px-4 py-2 sm:py-6 max-w-6xl mx-auto w-full">
        {/* ==================================================== */}
        {/* HANGING LAMP WITH CORD / SWITCH */}
        {/* ==================================================== */}
        <div className="relative flex flex-col items-center -mt-6 sm:-mt-10 select-none">
          {/* Ceiling Wire */}
          <div className="w-[3px] h-14 sm:h-20 bg-gradient-to-b from-zinc-700 via-zinc-500 to-amber-700/80 shadow-md" />

          {/* Top Brass Cap */}
          <div className="w-10 h-3 rounded-t-md bg-gradient-to-r from-amber-800 via-amber-400 to-amber-900 border border-amber-600/40 shadow-sm" />

          {/* Lampshade Container */}
          <div className="relative flex flex-col items-center">
            {/* Lampshade Trapezoid */}
            <div
              onClick={handleToggleLight}
              className={`w-44 sm:w-60 h-20 sm:h-24 cursor-pointer transition-all duration-700 relative z-20 ${
                isLightOn
                  ? 'bg-gradient-to-r from-amber-700 via-amber-300 to-amber-800 shadow-[0_0_60px_rgba(251,191,36,0.85)] border-t border-amber-200'
                  : 'bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-900 shadow-lg border-t border-zinc-600'
              }`}
              style={{
                clipPath: 'polygon(22% 0%, 78% 0%, 100% 100%, 0% 100%)'
              }}
              title={isLightOn ? t.pullCordToTurnOff : t.pullCordPrompt}
            >
              {/* Lampshade Brass Rim Highlight */}
              <div
                className={`absolute inset-x-0 bottom-0 h-2.5 transition-colors duration-700 ${
                  isLightOn ? 'bg-amber-100 shadow-[0_0_20px_#fff]' : 'bg-zinc-600'
                }`}
              />
            </div>

            {/* Glowing Bulb Element (peek under shade) */}
            <div
              className={`w-14 h-6 rounded-b-full transition-all duration-700 -mt-1 ${
                isLightOn
                  ? 'bg-amber-100 shadow-[0_10px_35px_rgba(255,235,160,1)]'
                  : 'bg-zinc-700/60'
              }`}
            />

            {/* Pull Cord & Bead Element */}
            <div
              className="absolute top-16 sm:top-20 right-6 sm:right-10 z-30 flex flex-col items-center cursor-pointer group"
              onClick={handleToggleLight}
              onMouseDown={handleCordTouchStart}
              onTouchStart={handleCordTouchStart}
              style={{
                transform: `translateY(${pullY}px)`,
                transition: isPulling ? 'none' : 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              {/* Hanging string */}
              <div
                className={`w-[2px] transition-colors duration-500 ${
                  isLightOn
                    ? 'bg-amber-200 shadow-[0_0_8px_rgba(251,191,36,0.9)]'
                    : 'bg-amber-500/70 group-hover:bg-amber-300'
                }`}
                style={{ height: `${75 + pullY * 0.4}px` }}
              />

              {/* Brass Pull Bead / Bell */}
              <div
                className={`w-4 h-6 rounded-full border shadow-md transition-all duration-300 ${
                  isLightOn
                    ? 'bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 border-amber-100 shadow-[0_0_12px_rgba(251,191,36,1)] scale-105'
                    : 'bg-gradient-to-b from-amber-500 via-amber-700 to-amber-900 border-amber-400/60 group-hover:scale-110 animate-bounce'
                }`}
              />

              {/* Cord Callout Tag */}
              <div
                className={`absolute top-12 left-6 whitespace-nowrap text-[10px] font-bold px-2 py-0.5 rounded-full border pointer-events-none transition-all duration-500 flex items-center gap-1 ${
                  isLightOn
                    ? 'bg-black/60 text-amber-300 border-amber-400/40 opacity-70'
                    : 'bg-amber-500 text-black border-amber-300 opacity-100 shadow-lg scale-105 animate-pulse'
                }`}
              >
                <span>{isLightOn ? '💡' : '👇'}</span>
                <span>{isLightOn ? t.pullCordToTurnOff : t.pullCordPrompt}</span>
              </div>
            </div>
          </div>

          {/* ==================================================== */}
          {/* LUMINOUS SPOTLIGHT CONE & RADIAL GLOW */}
          {/* ==================================================== */}
          <div
            className={`pointer-events-none absolute top-20 sm:top-24 w-[340px] sm:w-[680px] h-[480px] sm:h-[580px] transition-all duration-1000 ease-out z-10 ${
              isLightOn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            style={{
              background:
                'conic-gradient(from 180deg at 50% 0%, rgba(251, 191, 36, 0.35) 0deg, rgba(245, 158, 11, 0.25) 25deg, transparent 55deg, transparent 305deg, rgba(245, 158, 11, 0.25) 335deg, rgba(251, 191, 36, 0.35) 360deg)',
              clipPath: 'polygon(38% 0%, 62% 0%, 100% 100%, 0% 100%)',
              filter: 'blur(1px)'
            }}
          />

          {/* Golden Floor Ambient Pool */}
          <div
            className={`pointer-events-none absolute -bottom-36 w-[360px] sm:w-[620px] h-32 rounded-full transition-all duration-1000 ease-out ${
              isLightOn
                ? 'opacity-100 scale-100 bg-amber-400/25 blur-3xl'
                : 'opacity-0 scale-50'
            }`}
          />
        </div>

        {/* ==================================================== */}
        {/* LOGIN CARD — ILLUMINATED BY THE LAMP */}
        {/* ==================================================== */}
        <div
          className={`relative z-30 w-full max-w-md mx-auto transition-all duration-700 ease-out mt-4 sm:mt-6 ${
            isLightOn
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-8 pointer-events-none'
          }`}
        >
          <div
            className={`rounded-3xl p-6 sm:p-8 backdrop-blur-2xl border shadow-2xl transition-all ${
              isDark
                ? 'bg-[#0F172A]/90 border-amber-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(245,158,11,0.15)] text-[#F8FAFC]'
                : 'bg-white/95 border-amber-300/60 shadow-[0_20px_50px_rgba(217,119,6,0.15)] text-[#1E1B18]'
            }`}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-amber-500/20">
              <div className="flex items-center gap-2.5">
                <Rotating3DLogo size={24} />
                <div>
                  <h2 className="font-black text-xl tracking-tight leading-tight">
                    {t.loginWelcome}
                  </h2>
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {t.loginSubtitle}
                  </p>
                </div>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </div>

            {/* Quick Demo Access Pills */}
            <div className={`p-3 rounded-2xl mb-4 text-xs border ${
              isDark ? 'bg-black/40 border-white/5' : 'bg-amber-50/80 border-amber-200/50'
            }`}>
              <div className="text-[11px] font-bold text-amber-500 mb-2 flex items-center justify-between">
                <span>{t.demoRolesTitle}</span>
                <span className="text-[10px] text-zinc-400 font-mono">Instant Fill</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('student')}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-400/40 text-amber-300 hover:bg-amber-500/30 transition-all flex items-center gap-1"
                >
                  <span>🎓</span>
                  <span>{t.roleStudent}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('prof')}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-500/15 border border-violet-400/40 text-violet-300 hover:bg-violet-500/30 transition-all flex items-center gap-1"
                >
                  <span>👨‍🏫</span>
                  <span>{t.roleProf}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('evaluator')}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 border border-rose-400/40 text-rose-300 hover:bg-rose-500/30 transition-all flex items-center gap-1"
                >
                  <span>🎬</span>
                  <span>{t.roleEvaluator}</span>
                </button>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSignIn} className="space-y-3.5">
              {loginError && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-80">
                  {t.emailOrUser}
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all ${
                    isDark
                      ? 'bg-black/50 border-zinc-700 text-white focus:border-amber-400'
                      : 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-amber-500'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-80">
                    {t.password}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="text-[11px] text-amber-500 hover:underline"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all ${
                    isDark
                      ? 'bg-black/50 border-zinc-700 text-white focus:border-amber-400'
                      : 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-amber-500'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer opacity-80">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded accent-amber-500"
                  />
                  <span>{t.rememberMe}</span>
                </label>
                <a href="#forgot" className="text-amber-500 hover:underline">
                  {t.forgotPassword}
                </a>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-black bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:opacity-95 shadow-lg shadow-amber-500/25 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span>🚀</span>
                <span>{t.signInBtn}</span>
              </button>

              {/* Guest / Direct Workspace Access */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onLoginSuccess('guest')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                    isDark
                      ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300'
                      : 'border-zinc-300 hover:bg-zinc-100 text-zinc-700'
                  }`}
                >
                  {t.continueGuest}
                </button>
                {onOpenWorkspaceDirect && (
                  <button
                    type="button"
                    onClick={onOpenWorkspaceDirect}
                    className="py-2 px-3 rounded-xl text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition-all"
                    title={t.enterWorkspaceDirect}
                  >
                    {t.enterWorkspaceDirect}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Ambient Dark State Prompt (when light is off) */}
        {!isLightOn && (
          <div className="relative z-30 mt-6 text-center animate-pulse">
            <p className="text-amber-300/80 text-sm font-semibold tracking-wide flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-ping" />
              {t.pullOrClickCord}
            </p>
            <p className="text-zinc-500 text-xs mt-1">
              Click the lampshade or drag the glowing cord bead down
            </p>
          </div>
        )}
      </main>

      {/* Footer Strip */}
      <footer className="relative z-30 w-full max-w-6xl mx-auto px-6 py-3 flex items-center justify-between text-xs text-zinc-500 border-t border-white/5">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isLightOn ? 'bg-amber-400' : 'bg-zinc-600'}`} />
          <span>{isLightOn ? t.lightStatusOn : t.lightStatusOff}</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onOpen3DView}
            className="hover:text-amber-400 transition-colors flex items-center gap-1"
          >
            <span>🌀</span>
            <span>{t.backTo3D}</span>
          </button>
          <span>•</span>
          <span>UNERA Enterprise © 2026</span>
        </div>
      </footer>
    </div>
  );
};
