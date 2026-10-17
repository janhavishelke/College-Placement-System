import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ConfusionProfileData, ConceptStatusType } from '../types';

interface ConfusionFingerprintTabProps {
  theme?: 'light' | 'dark';
  onLaunchRescue?: (conceptName: string) => void;
}

export const ConfusionFingerprintTab: React.FC<ConfusionFingerprintTabProps> = ({
  theme = 'light',
  onLaunchRescue
}) => {
  const [profile, setProfile] = useState<ConfusionProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingConcept, setEditingConcept] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ConceptStatusType>('needs_practice');
  const [studentNote, setStudentNote] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const data = await api.getConfusionProfile(1);
      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveStatus = async (conceptName: string) => {
    try {
      await api.updateConceptStatus(conceptName, selectedStatus, studentNote || undefined);
      setEditingConcept(null);
      setStudentNote('');
      setStatusMessage(`Updated status for "${conceptName}".`);
      setTimeout(() => setStatusMessage(null), 3000);
      loadProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = async () => {
    if (confirm('Reset your entire Confusion Fingerprint learning profile to initial state?')) {
      await api.resetLearningProfile();
      loadProfile();
    }
  };

  const isDark = theme === 'dark';

  if (isLoading || !profile) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 border-3 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-[#64748B]">Loading your Confusion Fingerprint...</span>
      </div>
    );
  }

  const getBadgeStyle = (status: ConceptStatusType) => {
    switch (status) {
      case 'demonstrated_understanding':
        return 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30';
      case 'improving':
        return 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30';
      case 'needs_practice':
        return 'bg-[#F43F5E]/15 text-[#F43F5E] border-[#F43F5E]/30';
      case 'needs_reassessment':
        return 'bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30';
      default:
        return 'bg-[#94A3B8]/15 text-[#94A3B8] border-[#94A3B8]/30';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between ${
        isDark ? 'bg-[#1E293B]/60 border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base">🧬</span>
            <h3 className="text-sm font-extrabold">Confusion Fingerprint (Adaptive Profile)</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] font-bold">
              Feature 3
            </span>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
            You are never permanently labeled as weak or strong. Transparently inspect, correct, or adjust your profile.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="text-xs text-[#64748B] hover:text-[#F43F5E] underline transition-colors"
        >
          Reset Profile
        </button>
      </div>

      {statusMessage && (
        <div className="p-2.5 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-xs font-bold text-center">
          {statusMessage}
        </div>
      )}

      {/* Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
        <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#1E293B]/40 border-[#334155]' : 'bg-white border-[#E2E8F0]'}`}>
          <div className="font-extrabold text-[#10B981] text-lg font-mono">{profile.summary.demonstratedUnderstanding}</div>
          <div className="text-[10px] text-[#64748B]">Demonstrated</div>
        </div>
        <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#1E293B]/40 border-[#334155]' : 'bg-white border-[#E2E8F0]'}`}>
          <div className="font-extrabold text-[#F59E0B] text-lg font-mono">{profile.summary.improving}</div>
          <div className="text-[10px] text-[#64748B]">Improving</div>
        </div>
        <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#1E293B]/40 border-[#334155]' : 'bg-white border-[#E2E8F0]'}`}>
          <div className="font-extrabold text-[#F43F5E] text-lg font-mono">{profile.summary.needsPractice}</div>
          <div className="text-[10px] text-[#64748B]">Needs Practice</div>
        </div>
        <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#1E293B]/40 border-[#334155]' : 'bg-white border-[#E2E8F0]'}`}>
          <div className="font-extrabold text-[#94A3B8] text-lg font-mono">{profile.summary.notAssessed}</div>
          <div className="text-[10px] text-[#64748B]">Not Assessed</div>
        </div>
      </div>

      {/* Concept Items List */}
      <div className="space-y-3">
        {profile.concepts.map(concept => (
          <div
            key={concept.id}
            className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-[#1E293B]/40 border-[#334155]' : 'bg-white border-[#E2E8F0]'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-sm">{concept.conceptName}</h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getBadgeStyle(concept.status)}`}>
                    {concept.status.replace('_', ' ')}
                  </span>
                </div>
                {concept.notes && (
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 italic">
                    "{concept.notes}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {concept.status === 'needs_practice' && onLaunchRescue && (
                  <button
                    onClick={() => onLaunchRescue(concept.conceptName)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F43F5E]/15 text-[#F43F5E] hover:bg-[#F43F5E]/25 transition-all flex items-center gap-1"
                  >
                    <span>🚑</span> Rescue Engine
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingConcept(concept.conceptName);
                    setSelectedStatus(concept.status);
                  }}
                  className="px-2.5 py-1 rounded-xl text-xs font-medium border border-[#E2E8F0] dark:border-[#334155] hover:bg-black/5 dark:hover:bg-white/5 transition-all text-[#64748B]"
                >
                  Adjust
                </button>
              </div>
            </div>

            {/* Reasoning Errors List */}
            {concept.reasoningErrors.length > 0 && (
              <div className="mt-3 pt-2 border-t border-[#E2E8F0] dark:border-[#334155] text-xs">
                <span className="text-[10px] uppercase font-bold text-[#F43F5E]">Recorded Misconceptions:</span>
                <ul className="mt-1 list-disc list-inside space-y-0.5 text-[#64748B] dark:text-[#94A3B8]">
                  {concept.reasoningErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Inline Editing Controls */}
            {editingConcept === concept.conceptName && (
              <div className="mt-3 pt-3 border-t border-[#E2E8F0] dark:border-[#334155] space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {(['needs_practice', 'improving', 'demonstrated_understanding', 'needs_reassessment', 'not_assessed'] as ConceptStatusType[]).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSelectedStatus(st)}
                      className={`px-2.5 py-1 text-[11px] rounded-lg font-bold border transition-all ${
                        selectedStatus === st
                          ? 'bg-[#8B5CF6] text-white border-[#8B5CF6]'
                          : 'bg-black/5 dark:bg-white/5 border-transparent text-[#64748B]'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Optional note: (e.g., reviewed in lecture 5, feel confident)"
                  value={studentNote}
                  onChange={e => setStudentNote(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs rounded-xl border outline-none ${
                    isDark ? 'bg-[#0F172A] border-[#334155] text-white' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingConcept(null)}
                    className="px-3 py-1 text-xs text-[#64748B]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveStatus(concept.conceptName)}
                    className="px-3 py-1 text-xs font-bold rounded-lg bg-[#8B5CF6] text-white hover:bg-[#7C3AED]"
                  >
                    Save Status
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
