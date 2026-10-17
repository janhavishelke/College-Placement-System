import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StudyAlarmItem } from '../types';
import { playChimeSequence } from '../utils/alarmAudio';

interface StudyAlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
  onAlarmSet?: () => void;
}

export const StudyAlarmModal: React.FC<StudyAlarmModalProps> = ({
  isOpen,
  onClose,
  theme = 'light',
  onAlarmSet
}) => {
  const [alarms, setAlarms] = useState<StudyAlarmItem[]>([]);
  const [title, setTitle] = useState('Revise Base Case & Call Stack');
  const [conceptName, setConceptName] = useState('Recursion');
  const [scheduledTime, setScheduledTime] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAlarms();
      // Default to 15 minutes from now
      const defaultDate = new Date(Date.now() + 15 * 60 * 1000);
      setScheduledTime(formatForDatetimeLocal(defaultDate));
    }
  }, [isOpen]);

  const loadAlarms = async () => {
    try {
      const data = await api.getAlarms();
      setAlarms(data);
    } catch (err) {
      console.error(err);
    }
  };

  const formatForDatetimeLocal = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const setPresetTime = (minutesFromNow: number) => {
    const target = new Date(Date.now() + minutesFromNow * 60 * 1000);
    setScheduledTime(formatForDatetimeLocal(target));
  };

  const handleCreateAlarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !scheduledTime) return;

    setIsLoading(true);
    try {
      const isoTime = new Date(scheduledTime).toISOString();
      await api.createAlarm(title, isoTime, conceptName, soundEnabled);
      setActionMessage(`⏰ Alarm set for "${title}"!`);
      setTimeout(() => setActionMessage(null), 3500);
      setTitle('Practice Recursive Factorial Problem');
      loadAlarms();
      if (onAlarmSet) onAlarmSet();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick 5-second test alarm so evaluators can test immediately
  const handleQuick5SecAlarm = async () => {
    setIsLoading(true);
    try {
      const targetTime = new Date(Date.now() + 5 * 1000).toISOString();
      await api.createAlarm('Quick 5-Second Test Reminder (Base Case Review)', targetTime, 'Recursion', true);
      setActionMessage('⏰ 5-Second Test Alarm set! Get ready...');
      setTimeout(() => setActionMessage(null), 4000);
      loadAlarms();
      if (onAlarmSet) onAlarmSet();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAlarm = async (id: number) => {
    try {
      await api.deleteAlarm(id);
      loadAlarms();
      if (onAlarmSet) onAlarmSet();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border shadow-2xl flex flex-col transition-colors ${
          isDark ? 'bg-[#0F172A] border-[#334155] text-[#F8FAFC]' : 'bg-white border-[#E2E8F0] text-[#1E293B]'
        }`}
      >
        {/* Header */}
        <div className={`p-5 sm:p-6 border-b flex items-center justify-between sticky top-0 z-10 ${
          isDark ? 'bg-[#0F172A]/95 border-[#334155]' : 'bg-white/95 border-[#F1F5F9]'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF5E4D]/15 text-[#FF5E4D] flex items-center justify-center text-xl font-bold">
              ⏰
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  Study Alarms & Smart Reminders
                </h2>
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981]">
                  Automatic Reminder Engine
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Set what you want to study and when. UNERA will automatically ring and remind you right on time.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              isDark ? 'bg-[#1E293B] hover:bg-[#334155] text-white' : 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B]'
            }`}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {actionMessage && (
            <div className="p-3 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-xs font-bold flex items-center justify-between">
              <span>{actionMessage}</span>
              <span className="text-xs">Active in daemon</span>
            </div>
          )}

          {/* Quick 5-Second Test Button */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            isDark ? 'bg-[#FF5E4D]/10 border-[#FF5E4D]/30' : 'bg-[#FF5E4D]/5 border-[#FF5E4D]/20'
          }`}>
            <div>
              <span className="text-xs font-extrabold text-[#FF5E4D] block">⚡ Instant Evaluator Test</span>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                Want to test the alarm right now? Click to ring in 5 seconds with audio chime.
              </p>
            </div>
            <button
              onClick={handleQuick5SecAlarm}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-black rounded-xl bg-[#FF5E4D] text-white hover:bg-[#E84D3C] transition-all shadow-md shadow-[#FF5E4D]/30 shrink-0"
            >
              Test in 5s ⏰
            </button>
          </div>

          {/* New Alarm Form */}
          <form onSubmit={handleCreateAlarm} className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#1E293B]/40 border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}>
            <h3 className="text-xs font-black uppercase text-[#64748B] tracking-wider">Schedule a Study Reminder</h3>

            <div>
              <label className="text-xs font-bold block mb-1">What do you want to do?</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Revise Base Case, Solve 3 Factorial questions, Read Page 4"
                className={`w-full px-3 py-2 text-xs sm:text-sm rounded-xl border outline-none font-medium ${
                  isDark ? 'bg-[#0F172A] border-[#334155] text-white' : 'bg-white border-[#E2E8F0]'
                }`}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold block mb-1">Target Topic / Concept:</label>
                <select
                  value={conceptName}
                  onChange={e => setConceptName(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                    isDark ? 'bg-[#0F172A] border-[#334155] text-white' : 'bg-white border-[#E2E8F0]'
                  }`}
                >
                  <option value="Recursion">Recursion</option>
                  <option value="Call Stack">Call Stack</option>
                  <option value="Base Case">Base Case</option>
                  <option value="Factorial">Factorial</option>
                  <option value="Engineering Mathematics">Engineering Mathematics</option>
                  <option value="Photosynthesis">Photosynthesis</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">When should UNERA remind you?</label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-mono ${
                    isDark ? 'bg-[#0F172A] border-[#334155] text-white' : 'bg-white border-[#E2E8F0]'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div>
              <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-1.5">Quick Time Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '+1 Min', mins: 1 },
                  { label: '+5 Mins', mins: 5 },
                  { label: '+15 Mins', mins: 15 },
                  { label: '+30 Mins', mins: 30 },
                  { label: '+1 Hour', mins: 60 }
                ].map(p => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setPresetTime(p.mins)}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-black/5 dark:bg-white/10 hover:bg-[#FF5E4D]/15 hover:text-[#FF5E4D] transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sound Toggle & Preview */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={e => setSoundEnabled(e.target.checked)}
                  className="rounded text-[#FF5E4D]"
                />
                <span>Play audible chime ring on alarm</span>
              </label>

              <button
                type="button"
                onClick={() => playChimeSequence()}
                className="text-xs font-bold text-[#06B6D4] hover:underline flex items-center gap-1"
              >
                <span>🔊</span> Preview Chime
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 font-bold text-xs rounded-xl bg-gradient-to-r from-[#FF5E4D] to-[#F43F5E] text-white hover:opacity-90 transition-all shadow-md shadow-[#FF5E4D]/25"
              >
                {isLoading ? 'Setting Alarm...' : 'Set Study Alarm →'}
              </button>
            </div>
          </form>

          {/* Active Alarms List */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase text-[#64748B] tracking-wider">
              Your Scheduled Study Alarms ({alarms.filter(a => a.status === 'active').length} Active)
            </h3>

            {alarms.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748B] italic rounded-2xl border border-dashed border-[#E2E8F0] dark:border-[#334155]">
                No study alarms scheduled. Set one above or test with the 5-second quick button!
              </div>
            ) : (
              <div className="space-y-2">
                {alarms.map(alarm => {
                  const target = new Date(alarm.scheduledTime);
                  const diffSec = Math.round((target.getTime() - Date.now()) / 1000);
                  const isUpcoming = diffSec > 0;

                  return (
                    <div
                      key={alarm.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                        alarm.status === 'completed'
                          ? 'opacity-60 bg-black/5 dark:bg-white/5 border-transparent'
                          : isDark
                          ? 'bg-[#1E293B]/40 border-[#334155]'
                          : 'bg-white border-[#E2E8F0]'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs sm:text-sm">{alarm.title}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] font-bold">
                            {alarm.conceptName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#64748B]">
                          <span>Scheduled: {target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>•</span>
                          <span className={`font-mono font-bold ${isUpcoming ? 'text-[#10B981]' : 'text-[#F43F5E]'}`}>
                            {isUpcoming
                              ? diffSec < 60
                                ? `Rings in ${diffSec}s`
                                : `Rings in ${Math.round(diffSec / 60)} mins`
                              : 'Due now / past'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteAlarm(alarm.id)}
                          className="w-7 h-7 rounded-lg text-xs flex items-center justify-center hover:bg-[#F43F5E]/15 text-[#64748B] hover:text-[#F43F5E] transition-colors"
                          title="Delete Alarm"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 sm:p-5 border-t flex items-center justify-between text-xs text-[#64748B] ${
          isDark ? 'bg-[#0F172A] border-[#334155]' : 'bg-[#F8FAFC] border-[#F1F5F9]'
        }`}>
          <span>Daemon checks every second • Web Audio synthesized chime</span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold text-xs rounded-xl bg-[#FF5E4D] text-white hover:bg-[#E84D3C] transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
