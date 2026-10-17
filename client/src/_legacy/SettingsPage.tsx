import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Volume2, 
  Sparkles, 
  ShieldCheck, 
  RotateCcw, 
  CheckCircle2, 
  User, 
  LogOut, 
  Sliders, 
  Bell,
  GraduationCap
} from 'lucide-react';
import { Settings } from '../types';
import { api } from '../services/api';
import { Screen } from '../components/LMSSidebar';

interface SettingsPageProps {
  onNavigate: (screen: Screen) => void;
  onResetComplete?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onNavigate,
  onResetComplete
}) => {
  const [settings, setSettings] = useState<Settings>({
    interventionSensitivity: 'balanced',
    voiceRate: 1.0,
    voicePitch: 1.0,
    autoReadResponses: true,
    preferredVoice: 'default',
    reducedMotion: false,
    demoModeActive: true
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    loadSettings();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const v = window.speechSynthesis.getVoices();
        setAvailableVoices(v);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.getSettings();
      if (res.settings) setSettings(res.settings);
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await api.updateSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      console.error('Failed to save settings:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDemoData = async () => {
    if (!confirm('Reset all demo courses, doubts, and verification assessments to initial state?')) return;
    setResetting(true);
    try {
      const res = await api.resetDemo();
      setResetMessage(res.message);
      await loadSettings();
      if (onResetComplete) onResetComplete();
      setTimeout(() => setResetMessage(null), 3500);
    } catch (e) {
      console.error('Failed to reset demo data:', e);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto bg-[#070A12] text-slate-100 min-h-screen font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 text-white shadow-lg font-bold">
              <SettingsIcon className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-extrabold text-white">
              System Settings &amp; Profile
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Configure voice synthesis parameters, intervention trigger thresholds, and demo environment state.
          </p>
        </div>

        {saveSuccess && (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-950/60 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-800/40 animate-pulse">
            <CheckCircle2 className="h-3.5 w-3.5" /> Settings Saved!
          </span>
        )}
      </div>

      {/* Student Profile Overview Card */}
      <div className="rounded-2xl border border-slate-800 bg-[#0C1222] p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
          <User className="h-4 w-4 text-violet-400" />
          Active Student Profile
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Student Name</span>
            <p className="font-bold text-white text-sm">Alex Rivera</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">University Email</span>
            <p className="text-slate-300 font-mono">alex.rivera@university.edu</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Degree &amp; Major</span>
            <p className="text-slate-200">B.Tech in Computer Science &amp; Engineering</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Academic Standing</span>
            <p className="text-emerald-400 font-bold">Junior Year • Semester 5 (GPA 3.88)</p>
          </div>
        </div>
      </div>

      {/* Voice Tutor Synthesis Controls */}
      <div className="rounded-2xl border border-slate-800 bg-[#0C1222] p-6 shadow-xl space-y-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
          <Volume2 className="h-4 w-4 text-cyan-400" />
          Speech &amp; Voice Synthesis Controls
        </h3>

        <div className="space-y-4 text-xs">
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-300">Speech Rate (Speed)</label>
              <span className="font-mono text-cyan-400">{settings.voiceRate.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.75"
              max="1.5"
              step="0.05"
              value={settings.voiceRate}
              onChange={e => setSettings(prev => ({ ...prev, voiceRate: parseFloat(e.target.value) }))}
              className="w-full accent-violet-600"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-300">Voice Pitch</label>
              <span className="font-mono text-violet-400">{settings.voicePitch.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.05"
              value={settings.voicePitch}
              onChange={e => setSettings(prev => ({ ...prev, voicePitch: parseFloat(e.target.value) }))}
              className="w-full accent-cyan-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="font-bold text-slate-200">Auto-Read AI Workspace Answers</p>
              <p className="text-[11px] text-slate-400">Play spoken speech automatically when a new grounded response is received.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoReadResponses}
              onChange={e => setSettings(prev => ({ ...prev, autoReadResponses: e.target.checked }))}
              className="rounded border-slate-700 text-violet-600 focus:ring-0 cursor-pointer"
            />
          </div>

        </div>
      </div>

      {/* Intervention Sensitivity Controls */}
      <div className="rounded-2xl border border-slate-800 bg-[#0C1222] p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
          <Bell className="h-4 w-4 text-amber-400" />
          Context-Aware Learning Interventions
        </h3>

        <div className="space-y-3 text-xs">
          <span className="font-bold text-slate-300">Intervention Trigger Sensitivity:</span>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['proactive', 'balanced', 'minimal', 'off'] as const).map(sens => (
              <button
                key={sens}
                onClick={() => setSettings(prev => ({ ...prev, interventionSensitivity: sens }))}
                className={`p-3 rounded-xl border text-center capitalize transition-all cursor-pointer ${
                  settings.interventionSensitivity === sens
                    ? 'border-violet-500 bg-violet-950/40 text-white font-bold'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {sens}
              </button>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            {settings.interventionSensitivity === 'proactive' && 'Proactive: Triggers interventions quickly upon any confusion cues, prerequisite gaps, or repetitive questioning.'}
            {settings.interventionSensitivity === 'balanced' && 'Balanced (Default): Triggers interventions only when significant doubt or consecutive assessment misses occur.'}
            {settings.interventionSensitivity === 'minimal' && 'Minimal: Interventions appear only when a concept is explicitly failed on an examination.'}
            {settings.interventionSensitivity === 'off' && 'Off: Interventions disabled. Pure manual control over study sessions.'}
          </p>
        </div>
      </div>

      {/* Action Buttons: Save & Reset Demo */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button
          onClick={handleResetDemoData}
          disabled={resetting}
          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-semibold text-red-400 border border-red-900/40 hover:bg-red-950/30 transition-colors cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>{resetting ? 'Resetting Demo State...' : 'Reset Demo Courses & State'}</span>
        </button>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-7 py-3 text-xs font-bold text-white shadow-xl hover:from-violet-500 hover:to-cyan-500 transition-all cursor-pointer"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
        </button>
      </div>

      {resetMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-xs text-emerald-300 flex items-center gap-2 animate-pulse">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{resetMessage}</span>
        </div>
      )}

    </div>
  );
};
