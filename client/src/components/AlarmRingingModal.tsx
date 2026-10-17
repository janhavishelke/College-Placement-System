import React, { useEffect } from 'react';
import { StudyAlarmItem } from '../types';
import { startAlarmRinging, stopAlarmRinging } from '../utils/alarmAudio';

interface AlarmRingingModalProps {
  alarm: StudyAlarmItem | null;
  onStartStudy: (conceptName: string, title: string) => void;
  onSnooze: (alarmId: number) => void;
  onDismiss: (alarmId: number) => void;
}

export const AlarmRingingModal: React.FC<AlarmRingingModalProps> = ({
  alarm,
  onStartStudy,
  onSnooze,
  onDismiss
}) => {
  useEffect(() => {
    if (alarm && alarm.soundEnabled) {
      startAlarmRinging();
    }
    return () => {
      stopAlarmRinging();
    };
  }, [alarm]);

  if (!alarm) return null;

  const handleStart = () => {
    stopAlarmRinging();
    onStartStudy(alarm.conceptName || 'Recursion', alarm.title);
  };

  const handleSnooze = () => {
    stopAlarmRinging();
    onSnooze(alarm.id);
  };

  const handleDismiss = () => {
    stopAlarmRinging();
    onDismiss(alarm.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn select-none">
      <div className="w-full max-w-lg rounded-3xl border-2 border-[#FF5E4D] bg-[#0F172A] text-white p-6 sm:p-8 shadow-[0_0_50px_rgba(255,94,77,0.45)] flex flex-col items-center text-center space-y-6 relative overflow-hidden">
        {/* Glowing Background Radial Halo */}
        <div className="absolute top-[-50px] left-[-50px] w-48 h-48 bg-[#FF5E4D]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-50px] right-[-50px] w-48 h-48 bg-[#8B5CF6]/25 rounded-full blur-3xl pointer-events-none" />

        {/* Animated Ringing Bell / Alarm Icon */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#FF5E4D] to-[#F43F5E] text-white flex items-center justify-center text-4xl font-bold shadow-xl shadow-[#FF5E4D]/40 animate-bounce">
            ⏰
          </div>
          <div className="absolute inset-0 rounded-3xl bg-[#FF5E4D] animate-ping opacity-30 pointer-events-none" />
        </div>

        {/* Alarm Title & Message */}
        <div className="space-y-2 z-10">
          <span className="text-[11px] font-mono font-black uppercase tracking-widest text-[#FF5E4D] px-3 py-1 rounded-full bg-[#FF5E4D]/15 border border-[#FF5E4D]/30">
            Study Alarm Triggered • Live Reminder
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Time for your scheduled study session!
          </h2>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#94A3B8]">Scheduled Goal:</span>
            <p className="text-base font-extrabold text-[#38BDF8]">{alarm.title}</p>
            {alarm.conceptName && (
              <span className="text-xs text-[#A78BFA] font-medium block">
                Target Topic: <strong className="text-white">{alarm.conceptName}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5 z-10">
          <button
            onClick={handleStart}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#10B981] to-[#06B6D4] text-white font-black text-sm hover:scale-[1.02] active:scale-[0.99] transition-all shadow-lg shadow-[#10B981]/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>🚀</span>
            <span>Start Studying This Now</span>
            <span>→</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleSnooze}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-[#FCD34D] border border-white/10 transition-all flex items-center justify-center gap-1.5"
            >
              <span>⏱️</span>
              <span>Snooze 5 Mins</span>
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-[#94A3B8] hover:text-white border border-white/10 transition-all"
            >
              Dismiss / Done
            </button>
          </div>
        </div>

        <p className="text-[11px] text-[#64748B]">
          UNERA Automatic Spaced Reminder Engine • Persistent SQLite Store
        </p>
      </div>
    </div>
  );
};
