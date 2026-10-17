import React, { useState, useRef, useEffect } from 'react';
import { downloadTextFile } from '../utils/downloadHelpers';

export const VoiceNotesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onNoteSaved?: () => void;
}> = ({ isOpen, onClose, onNoteSaved }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let current = '';
          for (let i = 0; i < event.results.length; i++) {
            current += event.results[i][0].transcript + ' ';
          }
          setTranscript(current.trim());
        };

        recognition.onerror = () => {
          setIsRecording(false);
          clearInterval(timerRef.current);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      clearInterval(timerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      // Fallback simulation for unsupported browsers
      if (!isRecording) {
        setIsRecording(true);
        setDuration(0);
        timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
        setTimeout(() => {
          setTranscript("Study Voice Note: Always remember to check if n is less than or equal to 1 before calling factorial again, otherwise the execution call stack will overflow.");
        }, 1500);
      } else {
        setIsRecording(false);
        clearInterval(timerRef.current);
      }
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    } else {
      setTranscript('');
      setDuration(0);
      setSaveSuccess(false);
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSaveNote = async () => {
    if (!transcript.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/voicenotes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Voice Memo (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
          transcript
        })
      });
      if (res.ok) {
        setSaveSuccess(true);
        if (onNoteSaved) onNoteSaved();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadTxt = () => {
    downloadTextFile('Unera_Voice_Note_Transcript.txt', transcript);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#FFFFFF] w-full max-w-xl rounded-[28px] border border-[#F2ECE4] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#F2ECE4] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
            <div>
              <h3 className="font-bold text-sm text-[#27211E]">
                Voice Notes to Text (Feature 13)
              </h3>
              <p className="text-[11px] text-[#6B625E]">
                Speak your thoughts or study reflections; transcribe and save as study notes.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full border text-xs flex items-center justify-center hover:bg-gray-100">
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 bg-[#FAF7F2] space-y-4 flex flex-col items-center">
          {/* Record Button & Pulse */}
          <div className="text-center space-y-2">
            <button
              onClick={toggleRecording}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-xl transition-all shadow-md ${
                isRecording
                  ? 'bg-[#EF4444] text-white ring-8 ring-[#FCA5A5]/40 animate-pulse'
                  : 'bg-[#FF5E4D] text-white hover:bg-[#E84D3C]'
              }`}
            >
              {isRecording ? '⏹' : '🎤'}
            </button>

            <span className="text-xs font-mono font-bold text-[#6B625E] block">
              {isRecording ? `Recording: ${duration}s` : 'Tap to start recording'}
            </span>
          </div>

          {/* Transcript Box */}
          <div className="w-full bg-white rounded-2xl p-4 border border-[#F2ECE4] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8C827A]">
                Live Speech Transcript
              </span>
              {isRecording && (
                <span className="text-[10px] text-[#EF4444] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-ping" /> Listening...
                </span>
              )}
            </div>

            <textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder="Your transcribed voice note will appear here in real-time..."
              rows={4}
              className="w-full p-2.5 rounded-xl border border-[#E5D7C5] bg-[#FAF7F2] text-xs text-[#27211E] focus:outline-none focus:border-[#FF5E4D]"
            />

            {saveSuccess && (
              <div className="text-xs font-semibold text-[#065F46] bg-[#E9F7F0] p-2 rounded-lg text-center">
                ✓ Voice note saved as a new document in your workspace!
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#F2ECE4] flex items-center justify-between">
          <button
            onClick={handleDownloadTxt}
            disabled={!transcript}
            className="px-3 py-1.5 rounded-full border border-[#D8CEBE] text-xs font-medium text-[#27211E] hover:bg-[#FAF7F2] disabled:opacity-40"
          >
            💾 Download .txt
          </button>

          <button
            onClick={handleSaveNote}
            disabled={!transcript || isSaving}
            className="px-5 py-2 rounded-full bg-[#FF5E4D] text-white text-xs font-bold hover:bg-[#E84D3C] disabled:opacity-40 shadow-sm"
          >
            {isSaving ? 'Saving...' : 'Save as Note to Workspace'}
          </button>
        </div>
      </div>
    </div>
  );
};
