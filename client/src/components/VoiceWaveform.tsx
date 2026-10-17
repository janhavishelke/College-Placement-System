import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { VoiceSession } from '../types';

interface VoiceWaveformProps {
  conceptName?: string;
  onInterrupted?: (interruptionText: string, bookmark: number) => void;
  onAnswerReady?: (answer: string, citations: any[]) => void;
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  conceptName = 'Recursion',
  onInterrupted,
  onAnswerReady
}) => {
  const [session, setSession] = useState<VoiceSession | null>(null);
  const [currentChunkIdx, setCurrentChunkIdx] = useState(0);
  const [status, setStatus] = useState<'idle' | 'speaking' | 'paused' | 'finished'>('idle');
  const [displayedText, setDisplayedText] = useState('');
  const [interruptionInput, setInterruptionInput] = useState('');
  const [showInterruptionBox, setShowInterruptionBox] = useState(false);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const streamingTimerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      stopSpeech();
    };
  }, []);

  const stopSpeech = () => {
    if (streamingTimerRef.current) {
      clearInterval(streamingTimerRef.current);
      streamingTimerRef.current = null;
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  };

  // Start Voice Session
  const handleStart = async () => {
    try {
      const res = await api.startVoice(conceptName);
      setSession(res);
      setCurrentChunkIdx(0);
      setStatus('speaking');
      speakChunk(res.chunks, 0, res.sessionId);
    } catch (err) {
      console.error('Failed to start voice:', err);
    }
  };

  // Speak a specific chunk with streaming text and Web Speech API
  const speakChunk = (chunks: string[], index: number, sessionId: number) => {
    if (!chunks || index >= chunks.length) {
      setStatus('finished');
      setDisplayedText('Lesson completed.');
      return;
    }

    const chunkText = chunks[index];
    setCurrentChunkIdx(index);
    setStatus('speaking');
    setDisplayedText('');

    // Stream text word-by-word
    const words = chunkText.split(' ');
    let wordIdx = 0;
    if (streamingTimerRef.current) clearInterval(streamingTimerRef.current);

    streamingTimerRef.current = setInterval(() => {
      if (wordIdx < words.length) {
        setDisplayedText(prev => (prev ? prev + ' ' : '') + words[wordIdx]);
        wordIdx++;
      } else {
        clearInterval(streamingTimerRef.current);
        streamingTimerRef.current = null;
      }
    }, 180);

    // Web Speech API
    if (synthRef.current) {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(chunkText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => {
        // Move to next chunk if still speaking
        setStatus(currentStatus => {
          if (currentStatus === 'speaking') {
            if (index + 1 < chunks.length) {
              setTimeout(() => {
                speakChunk(chunks, index + 1, sessionId);
              }, 600);
            } else {
              return 'finished';
            }
          }
          return currentStatus;
        });
      };
      utteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    }
  };

  // Interrupt spoken AI output
  const handleInterrupt = async (customText?: string) => {
    stopSpeech();
    setStatus('paused');
    const textToSubmit = customText || interruptionInput || 'Wait, explain that again';

    if (session) {
      try {
        const pauseRes = await api.pauseVoice(session.sessionId, currentChunkIdx, textToSubmit);
        setSession(prev => prev ? { ...prev, bookmark: currentChunkIdx, status: 'paused' } : null);
        if (onInterrupted) {
          onInterrupted(textToSubmit, currentChunkIdx);
        }
        if (pauseRes.interruptionAnswer && onAnswerReady) {
          onAnswerReady(pauseRes.interruptionAnswer, pauseRes.citations || []);
        }
      } catch (err) {
        console.error('Failed to record pause in backend:', err);
      }
    }
    setShowInterruptionBox(false);
    setInterruptionInput('');
  };

  // Resume from bookmarked chunk
  const handleResume = async () => {
    if (!session) return;
    try {
      const res = await api.resumeVoice(session.sessionId);
      setStatus('speaking');
      // Resume from bookmark, not from start!
      speakChunk(res.chunks, res.bookmark, res.sessionId);
    } catch (err) {
      console.error('Failed to resume voice session:', err);
    }
  };

  // Repeat last chunk
  const handleRepeat = () => {
    if (!session) return;
    stopSpeech();
    speakChunk(session.chunks, currentChunkIdx, session.sessionId);
  };

  const isSpeaking = status === 'speaking';
  const isPaused = status === 'paused';

  return (
    <div className="w-full bg-[#FFFFFF] rounded-2xl border border-[#F2ECE4] p-4 shadow-sm mb-4">
      {/* Top status bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FCF4E3] text-[#B45309]">
            AI Voice Tutor
          </span>
          <span className="text-xs font-bold text-[#27211E]">
            {conceptName}
          </span>
          {session && (
            <span className="text-xs text-[#8C827A]">
              Chunk {currentChunkIdx + 1} of {session.chunks.length}
            </span>
          )}
        </div>

        {/* Status Badge */}
        <div>
          {isSpeaking && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E9F7F0] text-[#065F46] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              Speaking
            </span>
          )}
          {isPaused && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#991B1B] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
              Paused at Chunk {currentChunkIdx + 1}
            </span>
          )}
          {status === 'idle' && (
            <span className="text-xs text-[#8C827A]">Ready</span>
          )}
        </div>
      </div>

      {/* 24-Bar CSS Waveform Visualizer */}
      <div className="flex items-center justify-center gap-1 h-10 bg-[#FAF7F2] rounded-xl p-2 mb-3 border border-[#F2ECE4]">
        {Array.from({ length: 24 }).map((_, i) => {
          // Dynamic varying height pattern
          const baseHeight = 6 + Math.sin(i * 0.4) * 12 + ((i % 3) * 4);
          return (
            <div
              key={i}
              className={`waveform-bar ${isSpeaking ? 'active' : ''} ${isPaused ? 'paused' : ''}`}
              style={{
                height: isSpeaking ? `${Math.max(6, baseHeight)}px` : isPaused ? '8px' : '4px',
                animationDelay: `${(i * 0.05).toFixed(2)}s`,
                backgroundColor: isPaused ? '#EF4444' : isSpeaking ? '#FF5E4D' : '#D8CEBE'
              }}
            />
          );
        })}
      </div>

      {/* Live Streaming Text */}
      <div className="min-h-[50px] bg-[#FAF7F2] rounded-xl p-3 border border-[#F2ECE4] mb-3">
        <p className="text-xs sm:text-sm text-[#27211E] leading-relaxed font-sans">
          {displayedText || (status === 'idle' ? 'Click "Start Voice Lesson" to begin spoken explanation.' : 'Listening...')}
        </p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {status === 'idle' ? (
          <button
            onClick={handleStart}
            className="px-4 py-1.5 rounded-full bg-[#FF5E4D] text-white text-xs font-semibold hover:bg-[#E84D3C] transition-colors shadow-sm"
          >
            Start Voice Lesson
          </button>
        ) : (
          <div className="flex items-center gap-2">
            {/* Interrupt button */}
            <button
              onClick={() => handleInterrupt()}
              disabled={!isSpeaking}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isSpeaking
                  ? 'bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-sm animate-pulse'
                  : 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed'
              }`}
            >
              Interrupt
            </button>

            {/* Repeat last chunk */}
            <button
              onClick={handleRepeat}
              className="px-3 py-1.5 rounded-full border border-[#D8CEBE] text-xs font-medium text-[#27211E] hover:bg-[#FAF7F2] transition-colors"
            >
              Repeat last chunk
            </button>

            {/* Resume button */}
            <button
              onClick={handleResume}
              disabled={isSpeaking}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                isPaused
                  ? 'bg-[#10B981] text-white hover:bg-[#059669] shadow-sm'
                  : 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed'
              }`}
            >
              Resume
            </button>
          </div>
        )}

        {/* Quick Interrupt Prompt Helper */}
        {isSpeaking && (
          <button
            onClick={() => setShowInterruptionBox(!showInterruptionBox)}
            className="text-xs text-[#FF5E4D] underline hover:text-[#E84D3C]"
          >
            Ask a doubt while speaking...
          </button>
        )}
      </div>

      {/* Typed Interruption Input (Works if mic fails / typed fallback) */}
      {showInterruptionBox && (
        <div className="mt-3 pt-3 border-t border-[#F2ECE4] flex items-center gap-2">
          <input
            type="text"
            value={interruptionInput}
            onChange={e => setInterruptionInput(e.target.value)}
            placeholder="Type your interruption (e.g., 'What is a base case?')..."
            className="flex-1 px-3 py-1.5 text-xs rounded-full border border-[#D8CEBE] focus:outline-none focus:border-[#FF5E4D]"
            onKeyDown={e => {
              if (e.key === 'Enter') handleInterrupt(interruptionInput);
            }}
          />
          <button
            onClick={() => handleInterrupt(interruptionInput)}
            className="px-3 py-1.5 text-xs rounded-full bg-[#27211E] text-white font-medium hover:bg-black"
          >
            Interrupt & Ask
          </button>
        </div>
      )}
    </div>
  );
};
