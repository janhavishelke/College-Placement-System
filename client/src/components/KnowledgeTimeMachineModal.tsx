import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { VerificationResult, DoubtItem, InterruptionItem, ChatItem } from '../types';

interface KnowledgeTimeMachineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KnowledgeTimeMachineModal: React.FC<KnowledgeTimeMachineModalProps> = ({
  isOpen,
  onClose
}) => {
  const [verifications, setVerifications] = useState<VerificationResult[]>([]);
  const [doubts, setDoubts] = useState<DoubtItem[]>([]);
  const [interruptions, setInterruptions] = useState<InterruptionItem[]>([]);
  const [chats, setChats] = useState<ChatItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    try {
      const [v, d, i, c] = await Promise.all([
        api.getVerificationHistory(),
        api.getDoubts(),
        api.checkInterruptions(),
        api.getChats()
      ]);
      setVerifications(v || []);
      setDoubts(d || []);
      setChats(c || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[#FFFFFF] w-full max-w-4xl max-h-[90vh] rounded-[28px] border border-[#F2ECE4] shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-[#F2ECE4] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#3B82F6]" />
            <div>
              <h2 className="text-lg font-bold text-[#27211E]">
                Knowledge Time Machine
              </h2>
              <p className="text-xs text-[#6B625E]">
                Chronological log of learning sessions, doubt resolutions, and verified assessments.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#D8CEBE] text-[#6B625E] hover:text-[#27211E] flex items-center justify-center font-bold"
          >
            x
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#FAF7F2] space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-[#F2ECE4]">
              <span className="text-[10px] uppercase font-bold text-[#8C827A] block">
                Tracked Doubts
              </span>
              <span className="text-2xl font-bold text-[#27211E] mt-1 block">
                {doubts.length}
              </span>
              <span className="text-xs text-[#065F46] font-medium">
                {doubts.filter(d => d.status === 'resolved').length} Resolved
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#F2ECE4]">
              <span className="text-[10px] uppercase font-bold text-[#8C827A] block">
                Understanding Verifications
              </span>
              <span className="text-2xl font-bold text-[#27211E] mt-1 block">
                {verifications.length}
              </span>
              <span className="text-xs text-[#1E3A8A] font-medium">
                Active recall submissions
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#F2ECE4]">
              <span className="text-[10px] uppercase font-bold text-[#8C827A] block">
                Total Queries Answered
              </span>
              <span className="text-2xl font-bold text-[#27211E] mt-1 block">
                {chats.length}
              </span>
              <span className="text-xs text-[#B45309] font-medium">
                100% grounded in notes
              </span>
            </div>
          </div>

          {/* Timeline of Verification Attempts */}
          <div className="bg-white rounded-2xl p-5 border border-[#F2ECE4]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B625E] mb-3">
              Assessment Logs (No Claimed Mastery Without Evidence)
            </h3>

            {verifications.length === 0 ? (
              <p className="text-xs text-[#8C827A] italic py-3">
                No verifications attempted yet. Try answering a verification challenge in the study workspace.
              </p>
            ) : (
              <div className="space-y-3">
                {verifications.map((v, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-[#F2ECE4] bg-[#FAF7F2] text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-[#27211E]">{v.conceptName}</span>
                      <span className="text-[10px] text-[#8C827A]">
                        {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[#6B625E] mb-2">
                      Answer: "{v.studentAnswer}"
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {v.keyIdeas.map((idea, i) => (
                        <span
                          key={i}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            v.ticks[i]
                              ? 'bg-[#E9F7F0] text-[#065F46] border border-[#A7F3D0]'
                              : 'bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]'
                          }`}
                        >
                          {v.ticks[i] ? '✓ ' : '✗ '} {idea}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
