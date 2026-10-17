import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface StudyArtifactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpToPage?: (docId: number, pageNo: number) => void;
}

export const StudyArtifactsModal: React.FC<StudyArtifactsModalProps> = ({
  isOpen,
  onClose,
  onJumpToPage
}) => {
  const [activeTab, setActiveTab] = useState<'flashcards' | 'guide'>('flashcards');
  const [data, setData] = useState<{ flashcards: any[]; keyPoints: any[] }>({ flashcards: [], keyPoints: [] });
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      loadArtifacts();
    }
  }, [isOpen]);

  const loadArtifacts = async () => {
    try {
      const res = await api.getArtifacts();
      setData(res);
    } catch (err) {
      console.error('Failed to load artifacts:', err);
    }
  };

  if (!isOpen) return null;

  const toggleFlip = (id: number) => {
    setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[#FFFFFF] w-full max-w-4xl max-h-[90vh] rounded-[28px] border border-[#F2ECE4] shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-[#F2ECE4] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#10B981]" />
            <div>
              <h2 className="text-lg font-bold text-[#27211E]">
                Study Artifacts Generator
              </h2>
              <p className="text-xs text-[#6B625E]">
                Source-grounded flashcards and revision study guides.
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

        {/* Tab switch */}
        <div className="flex items-center gap-3 px-6 pt-4 border-b border-[#F2ECE4] bg-[#FFFFFF]">
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`pb-3 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'flashcards'
                ? 'border-[#FF5E4D] text-[#FF5E4D]'
                : 'border-transparent text-[#6B625E] hover:text-[#27211E]'
            }`}
          >
            Source Flashcards ({data.flashcards.length})
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-3 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'guide'
                ? 'border-[#FF5E4D] text-[#FF5E4D]'
                : 'border-transparent text-[#6B625E] hover:text-[#27211E]'
            }`}
          >
            Revision Guide ({data.keyPoints.length} Pages)
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#FAF7F2]">
          {activeTab === 'flashcards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.flashcards.map(card => {
                const isFlipped = flippedCards[card.id];
                return (
                  <div
                    key={card.id}
                    onClick={() => toggleFlip(card.id)}
                    className="p-5 rounded-2xl bg-white border border-[#F2ECE4] shadow-sm hover:shadow-md cursor-pointer transition-all min-h-[160px] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C827A]">
                          {isFlipped ? 'Answer & Notes Reference' : 'Question Prompt'}
                        </span>
                        {card.pageNo && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FCF4E3] text-[#B45309]">
                            Page {card.pageNo}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-[#27211E] font-medium leading-relaxed">
                        {isFlipped ? card.back : card.front}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#8C827A] pt-3 border-t border-[#F2ECE4] mt-2">
                      <span>Click card to {isFlipped ? 'see question' : 'reveal definition'}</span>
                      {card.pageNo && onJumpToPage && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onJumpToPage(card.docId || 1, card.pageNo);
                            onClose();
                          }}
                          className="text-[#FF5E4D] font-semibold hover:underline"
                        >
                          Jump to Source [p.{card.pageNo}]
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {data.keyPoints.map(point => (
                <div key={point.pageNo} className="p-4 rounded-xl bg-white border border-[#F2ECE4]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-[#27211E]">{point.title}</span>
                    <button
                      onClick={() => {
                        if (onJumpToPage) onJumpToPage(1, point.pageNo);
                        onClose();
                      }}
                      className="text-[10px] font-mono text-[#FF5E4D] hover:underline"
                    >
                      [p.{point.pageNo}]
                    </button>
                  </div>
                  <p className="text-xs text-[#6B625E] leading-relaxed">
                    {point.summary}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
