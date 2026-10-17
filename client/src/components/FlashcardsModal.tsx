import React, { useState } from 'react';
import { api } from '../services/api';
import { downloadPdfFile } from '../utils/downloadHelpers';

interface Flashcard {
  id: number;
  concept: string;
  front: string;
  back: string;
  pageNo: number;
  example: string;
}

const CARDS_DATA: Flashcard[] = [
  {
    id: 1,
    concept: "Recursion",
    front: "What is recursion and what two parts must every recursive algorithm contain?",
    back: "Recursion is where a function calls itself to solve smaller subproblems of the same problem. Every recursive function must contain: 1. A base case that terminates recursion without self-invoking, and 2. A recursive step moving arguments closer to that base condition.",
    pageNo: 2,
    example: "factorial(n) = n * factorial(n - 1)"
  },
  {
    id: 2,
    concept: "Base Case",
    front: "What is a base case and why does omitting it cause a stack overflow?",
    back: "A base case is the terminal condition that directly returns a value. Without it, the function keeps invoking itself infinitely until the call stack memory limit is exceeded, triggering a stack overflow.",
    pageNo: 3,
    example: "if (n <= 1) return 1;"
  },
  {
    id: 3,
    concept: "Call Stack",
    front: "What order of execution does the runtime call stack follow?",
    back: "LIFO (Last-In, First-Out). When a function is called, a stack frame is pushed on top. The active function at the top must return and pop before the caller underneath can resume.",
    pageNo: 4,
    example: "[Frame 3] -> [Frame 2] -> [Frame 1]"
  },
  {
    id: 4,
    concept: "Stack Frame",
    front: "What parameters and state does a stack frame store during recursion?",
    back: "Incoming parameters/arguments, private local variables, return address back to caller instruction, and saved frame pointer references.",
    pageNo: 5,
    example: "Frame for factorial(2): n=2, return to factorial(3)"
  },
  {
    id: 5,
    concept: "Stack Overflow",
    front: "How does the OS or runtime handle a stack overflow error?",
    back: "When call stack allocations exceed memory boundaries (typically 1MB-8MB or ~10,000 frames in V8), the runtime halts execution and throws RangeError: Maximum call stack size exceeded.",
    pageNo: 6,
    example: "RangeError: Maximum call stack size exceeded"
  }
];

export const FlashcardsModal: React.FC<{ isOpen: boolean; onClose: () => void; onDoubtAdded?: () => void }> = ({
  isOpen,
  onClose,
  onDoubtAdded
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [doubtAddedNotice, setDoubtAddedNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const card = CARDS_DATA[currentIndex];

  const handleDontKnow = async () => {
    try {
      await api.createDoubt(card.concept);
      setDoubtAddedNotice(`"${card.concept}" added to Doubt Memory!`);
      if (onDoubtAdded) onDoubtAdded();
      setTimeout(() => setDoubtAddedNotice(null), 2500);
      nextCard();
    } catch (e) {
      console.error(e);
    }
  };

  const handleKnow = () => {
    nextCard();
  };

  const nextCard = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev + 1) % CARDS_DATA.length);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev - 1 + CARDS_DATA.length) % CARDS_DATA.length);
  };

  const handleDownloadPdf = () => {
    const html = CARDS_DATA.map(c => `
      <div class="card">
        <span class="badge">Page ${c.pageNo} Reference</span>
        <div style="font-size:16px; font-weight:700; margin-bottom:8px;">Q: ${c.front}</div>
        <div style="font-size:14px; color:#27211e; margin-bottom:6px;"><strong>Ans:</strong> ${c.back}</div>
        <div style="font-size:12px; font-family:monospace; background:#fff; padding:6px; border-radius:6px; border:1px solid #e5d7c5;">
          Code: ${c.example}
        </div>
      </div>
    `).join('');

    downloadPdfFile("UNERA Source-Grounded Flashcards", html, "Unera_Flashcards_Export.pdf");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#FFFFFF] w-full max-w-xl rounded-[28px] border border-[#F2ECE4] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#F2ECE4] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5E4D]" />
            <h3 className="font-bold text-sm text-[#27211E]">
              Source Flashcards (Feature 7)
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-[#D8CEBE] font-mono text-[#6B625E]">
              {currentIndex + 1} of {CARDS_DATA.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="px-3 py-1 text-xs rounded-full bg-[#FAF7F2] border border-[#D8CEBE] text-[#27211E] hover:bg-[#F2ECE4] font-medium transition-colors"
            >
              📄 Download PDF
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded-full border text-xs flex items-center justify-center hover:bg-gray-100">
              ✕
            </button>
          </div>
        </div>

        {/* Notice for Doubt Memory */}
        {doubtAddedNotice && (
          <div className="bg-[#FEF2F2] border-b border-[#FCA5A5] px-4 py-2 text-xs font-semibold text-[#991B1B] text-center">
            ✓ {doubtAddedNotice}
          </div>
        )}

        {/* Flip Card Body */}
        <div className="p-6 bg-[#FAF7F2] flex flex-col items-center justify-center">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full min-h-[220px] bg-white rounded-2xl border border-[#F2ECE4] p-6 shadow-md cursor-pointer hover:shadow-lg transition-all flex flex-col justify-between select-none"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF5E4D]">
                  {isFlipped ? 'Answer & Explanation' : 'Question Prompt'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FCF4E3] text-[#B45309] font-bold">
                  [p.{card.pageNo}]
                </span>
              </div>

              <p className="text-sm sm:text-base font-semibold text-[#27211E] leading-relaxed">
                {isFlipped ? card.back : card.front}
              </p>
            </div>

            <div className="pt-3 border-t border-[#F2ECE4] flex items-center justify-between text-xs text-[#8C827A]">
              <span>Click card to flip</span>
              <span className="font-mono text-[11px] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E5D7C5]">
                {card.concept}
              </span>
            </div>
          </div>

          {/* Action Buttons: Know / Don't Know */}
          <div className="flex items-center gap-3 mt-5 w-full">
            <button
              onClick={handleDontKnow}
              className="flex-1 py-2.5 rounded-full bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-xs font-bold hover:bg-[#FCA5A5] transition-colors"
            >
              Don't Know (Saves to Doubt Memory)
            </button>

            <button
              onClick={handleKnow}
              className="flex-1 py-2.5 rounded-full bg-[#E9F7F0] border border-[#A7F3D0] text-[#065F46] text-xs font-bold hover:bg-[#A7F3D0] transition-colors"
            >
              Know (Mastered) ✓
            </button>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-3 mt-3 text-xs text-[#6B625E]">
            <button onClick={prevCard} className="hover:text-[#27211E]">← Previous</button>
            <span>•</span>
            <button onClick={nextCard} className="hover:text-[#27211E]">Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
};
