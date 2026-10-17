import React, { useState, useEffect } from 'react';

interface MultilingualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (text: string) => void;
}

export const MultilingualModal: React.FC<MultilingualModalProps> = ({
  isOpen,
  onClose,
  onSendToChat
}) => {
  const [selectedConcept, setSelectedConcept] = useState('Recursion');
  const [selectedLang, setSelectedLang] = useState<'english' | 'hinglish' | 'hindi'>('hinglish');
  const [explanation, setExplanation] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchTranslation(selectedConcept, selectedLang);
    }
  }, [isOpen, selectedConcept, selectedLang]);

  const fetchTranslation = async (concept: string, lang: string) => {
    try {
      const res = await fetch(`/api/multilingual/translate?concept=${encodeURIComponent(concept)}&lang=${lang}`);
      const data = await res.json();
      setExplanation(data.text || '');
    } catch (err) {
      console.error('Failed to fetch multilingual translation:', err);
    }
  };

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on your browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(explanation);
    utterance.rate = 0.95;

    if (selectedLang === 'hindi') {
      utterance.lang = 'hi-IN';
    } else if (selectedLang === 'hinglish') {
      utterance.lang = 'en-IN';
    } else {
      utterance.lang = 'en-US';
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(explanation);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-[28px] border border-[#F2ECE4] shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#F2ECE4] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#27211E]">
                Multilingual Tutor (Feature 11)
              </h3>
              <p className="text-[11px] text-[#6B625E]">
                Learn notes in English, Hinglish, or Hindi with native voice output.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (window.speechSynthesis) window.speechSynthesis.cancel();
              setIsSpeaking(false);
              onClose();
            }}
            className="w-7 h-7 rounded-full border text-xs flex items-center justify-center hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Concept Selectors */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#8C827A] block mb-2">
              Select Note Concept:
            </label>
            <div className="flex flex-wrap gap-2">
              {['Recursion', 'Base Case', 'Call Stack'].map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedConcept(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedConcept === c
                      ? 'bg-[#FF5E4D] text-white shadow-sm'
                      : 'bg-[#FAF7F2] text-[#27211E] border border-[#D8CEBE] hover:bg-[#F2ECE4]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Language Tabs */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#8C827A] block mb-2">
              Select Language:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSelectedLang('english')}
                className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all border ${
                  selectedLang === 'english'
                    ? 'bg-[#EAF3FB] border-[#3B82F6] text-[#1E3A8A] shadow-sm'
                    : 'bg-[#FAF7F2] border-[#F2ECE4] text-[#6B625E] hover:border-[#D8CEBE]'
                }`}
              >
                🇬🇧 English
              </button>
              <button
                onClick={() => setSelectedLang('hinglish')}
                className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all border ${
                  selectedLang === 'hinglish'
                    ? 'bg-[#FCF4E3] border-[#F59E0B] text-[#92400E] shadow-sm'
                    : 'bg-[#FAF7F2] border-[#F2ECE4] text-[#6B625E] hover:border-[#D8CEBE]'
                }`}
              >
                🇮🇳 Hinglish
              </button>
              <button
                onClick={() => setSelectedLang('hindi')}
                className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all border ${
                  selectedLang === 'hindi'
                    ? 'bg-[#E9F7F0] border-[#10B981] text-[#065F46] shadow-sm'
                    : 'bg-[#FAF7F2] border-[#F2ECE4] text-[#6B625E] hover:border-[#D8CEBE]'
                }`}
              >
                🇮🇳 हिन्दी (Hindi)
              </button>
            </div>
          </div>

          {/* Explanation Card */}
          <div className="bg-[#FAF7F2] rounded-2xl p-5 border border-[#F2ECE4] shadow-inner relative">
            <div className="flex items-center justify-between mb-3 text-xs text-[#8C827A]">
              <span className="font-bold text-[#27211E]">
                {selectedConcept} ({selectedLang.toUpperCase()})
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white border">
                Verified Notes Citation: p. 2-4
              </span>
            </div>

            <p className="text-sm sm:text-base text-[#27211E] leading-relaxed font-serif sm:font-sans">
              {explanation || 'Loading translation from notes...'}
            </p>

            {/* Audio Wave / Voice Indicator */}
            <div className="mt-4 pt-3 border-t border-[#E5D7C5] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSpeak}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                    isSpeaking
                      ? 'bg-[#EF4444] text-white animate-pulse'
                      : 'bg-[#27211E] text-white hover:bg-black'
                  }`}
                >
                  {isSpeaking ? '⏹ Stop Voice' : '🔊 Listen Voice'}
                </button>
                {isSpeaking && (
                  <span className="text-xs text-[#EF4444] font-medium animate-pulse">
                    Speaking in {selectedLang}...
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-full border border-[#D8CEBE] text-xs font-medium text-[#6B625E] hover:text-[#27211E] hover:bg-white"
                >
                  {copySuccess ? '✓ Copied' : 'Copy'}
                </button>
                {onSendToChat && (
                  <button
                    onClick={() => {
                      onSendToChat(explanation);
                      if (window.speechSynthesis) window.speechSynthesis.cancel();
                      setIsSpeaking(false);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-full bg-[#FF5E4D] text-white text-xs font-bold hover:bg-[#E84D3C]"
                  >
                    Send to Chat →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
