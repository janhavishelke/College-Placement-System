import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Square, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Sparkles, 
  ShieldCheck, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { AudioWaveformVisualizer, VoiceState } from '../components/AudioWaveformVisualizer';
import { api } from '../services/api';
import { Screen } from '../components/LMSSidebar';

interface VoiceTutorPageProps {
  onNavigate: (screen: Screen) => void;
  onStartQuizForConcept: (conceptName: string, docId?: string) => void;
}

export const VoiceTutorPage: React.FC<VoiceTutorPageProps> = ({
  onNavigate,
  onStartQuizForConcept
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('Idle');
  const [transcript, setTranscript] = useState('');
  const [spokenResponse, setSpokenResponse] = useState('');
  const [activeTopic, setActiveTopic] = useState('Operating Systems: Concurrency & Deadlocks');
  const [lastInterruptedText, setLastInterruptedText] = useState<string | null>(null);
  const [isMicSupported, setIsMicSupported] = useState(true);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    initSpeech();
    // Default greeting from tutor
    setSpokenResponse(
      "Hello Alex! I am your UNERA Academic Voice Tutor. You can speak your questions naturally, and interrupt me at any second by pressing the Interrupt button or asking a clarifying question."
    );

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const initSpeech = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsMicSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setVoiceState('Listening');
    };

    recognition.onresult = (e: any) => {
      const current = Array.from(e.results)
        .map((r: any) => r[0])
        .map((r: any) => r.transcript)
        .join('');
      setTranscript(current);
    };

    recognition.onerror = (e: any) => {
      console.warn('Speech recognition warning:', e.error);
      setVoiceState('Idle');
    };

    recognition.onend = () => {
      if (voiceState === 'Listening') {
        setVoiceState('Idle');
        if (transcript) {
          handleProcessVoiceQuery(transcript);
        }
      }
    };

    recognitionRef.current = recognition;
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (voiceState === 'Listening') {
      recognitionRef.current.stop();
      setVoiceState('Idle');
    } else {
      stopSpeaking();
      setTranscript('');
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Microphone start error:', err);
      }
    }
  };

  const handleProcessVoiceQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    setVoiceState('Thinking');

    try {
      const res = await api.askQuestion({
        question: queryText,
        documentId: 'doc-os-concurrency-301'
      });

      const responseText = res.speechSummary || res.answer;
      setSpokenResponse(responseText);

      if (res.detectedConcepts && res.detectedConcepts.length > 0) {
        setActiveTopic(res.detectedConcepts[0]);
      }

      speakTutorResponse(responseText);
    } catch (e) {
      console.error('Voice query error:', e);
      setSpokenResponse('I encountered an error retrieving source passages. Please try again.');
      setVoiceState('Idle');
    }
  };

  const speakTutorResponse = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const clean = text.replace(/\[Doc:[^\]]+\]/g, '').replace(/[#*`_~]/g, '').trim();
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setVoiceState('Speaking');
    };

    utterance.onend = () => {
      setVoiceState('Idle');
    };

    utterance.onerror = () => {
      setVoiceState('Idle');
    };

    window.speechSynthesis.speak(utterance);
  };

  // INSTANT INTERRUPT (Core Feature 2)
  const interruptTutor = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setLastInterruptedText(spokenResponse);
    setVoiceState('Paused');
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setVoiceState('Idle');
  };

  const handleClarification = (cmd: string) => {
    let p = '';
    if (cmd === 'explain_again') p = 'Wait, explain that again with a simpler breakdown.';
    if (cmd === 'simpler_example') p = 'Give me a simpler real-world example from my notes.';
    if (cmd === 'what_means') p = 'What does this term mean in my notes?';
    if (cmd === 'continue') p = 'Continue from where you stopped.';
    setTranscript(p);
    handleProcessVoiceQuery(p);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto bg-[#070A12] text-slate-100 min-h-screen font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 text-white shadow-lg font-bold">
              <Mic className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-extrabold text-white">
              Interruptible Voice Classroom
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Natural spoken tutoring grounded in your uploaded lecture notes with live interruption support.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/60 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-800/40">
            <ShieldCheck className="h-3.5 w-3.5" /> Source-Locked Voice Mode
          </span>
        </div>
      </div>

      {/* Active Context Banner */}
      <div className="rounded-2xl border border-slate-800 bg-[#0C1222] p-4 flex items-center justify-between gap-3 text-xs shadow-xl">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-violet-400 shrink-0" />
          <span className="font-semibold text-slate-400">Active Topic Context:</span>
          <span className="font-bold text-white">{activeTopic}</span>
        </div>
        <button
          onClick={() => onStartQuizForConcept(activeTopic)}
          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 shrink-0 cursor-pointer"
        >
          Verify Understanding →
        </button>
      </div>

      {/* Main Voice Interaction Card */}
      <div className="rounded-3xl border border-slate-800 bg-[#0C1222] p-8 sm:p-12 text-center space-y-8 shadow-2xl relative overflow-hidden">
        
        {/* Background ambient radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

        {/* Status Indicator */}
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider border shadow-md transition-all relative z-10"
             style={{
               backgroundColor: voiceState === 'Speaking' ? '#1E1B4B' : voiceState === 'Listening' ? '#450A0A' : '#0B0F19',
               borderColor: voiceState === 'Speaking' ? '#818CF8' : voiceState === 'Listening' ? '#F87171' : '#334155',
               color: voiceState === 'Speaking' ? '#A5B4FC' : voiceState === 'Listening' ? '#FCA5A5' : '#94A3B8',
             }}>
          <span className={`h-2.5 w-2.5 rounded-full ${
            voiceState === 'Speaking' ? 'bg-cyan-400 animate-ping' :
            voiceState === 'Listening' ? 'bg-red-500 animate-pulse' :
            voiceState === 'Thinking' ? 'bg-amber-400 animate-pulse' :
            'bg-slate-500'
          }`} />
          <span>Voice State: {voiceState}</span>
        </div>

        {/* Audio Waveform Visualizer */}
        <div className="flex justify-center py-2 relative z-10">
          <div className="bg-[#080C16] p-5 rounded-2xl border border-slate-800 shadow-inner">
            <AudioWaveformVisualizer state={voiceState} width={340} height={70} />
          </div>
        </div>

        {/* Microphone Controller Button */}
        <div className="flex flex-col items-center justify-center gap-3 relative z-10">
          <button
            onClick={toggleListening}
            className={`flex h-22 w-22 items-center justify-center rounded-full shadow-2xl transition-all transform hover:scale-105 cursor-pointer ${
              voiceState === 'Listening'
                ? 'bg-red-600 text-white ring-4 ring-red-400/50 animate-pulse'
                : 'bg-gradient-to-tr from-violet-600 to-cyan-500 text-white shadow-violet-600/30'
            }`}
          >
            {voiceState === 'Listening' ? (
              <MicOff className="h-9 w-9" />
            ) : (
              <Mic className="h-9 w-9" />
            )}
          </button>
          <span className="text-xs font-semibold text-slate-400">
            {voiceState === 'Listening' ? 'Listening to your question (Click to finish)...' : 'Click to Speak Question'}
          </span>
        </div>

        {/* Interrupt & Playback Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 relative z-10">
          {voiceState === 'Speaking' ? (
            <button
              onClick={interruptTutor}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-red-600/30 hover:from-red-500 hover:to-rose-500 transition-all animate-pulse cursor-pointer"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              <span>Interrupt &amp; Clarify</span>
            </button>
          ) : voiceState === 'Paused' ? (
            <button
              onClick={() => speakTutorResponse(spokenResponse)}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-violet-500 shadow-lg cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Resume Spoken Explanation</span>
            </button>
          ) : (
            <button
              onClick={() => spokenResponse && speakTutorResponse(spokenResponse)}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 border border-slate-800 hover:bg-slate-800 cursor-pointer"
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>Replay Spoken Summary</span>
            </button>
          )}

          <button
            onClick={stopSpeaking}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-400 border border-slate-800 hover:text-white cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Audio</span>
          </button>
        </div>

        {/* Clarification Shortcuts */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2 relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Instant Clarification Prompts:
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => handleClarification('explain_again')}
              className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-violet-900/40 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            >
              “Wait, explain that again”
            </button>
            <button
              onClick={() => handleClarification('simpler_example')}
              className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-violet-900/40 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            >
              “Give me a concrete real-world example”
            </button>
            <button
              onClick={() => handleClarification('what_means')}
              className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-violet-900/40 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            >
              “What does this specific term mean?”
            </button>
            <button
              onClick={() => handleClarification('continue')}
              className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-violet-900/40 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            >
              “Continue where you stopped”
            </button>
          </div>
        </div>

      </div>

      {/* Spoken Response & Transcript Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Student Speech Transcript */}
        <div className="rounded-2xl border border-slate-800 bg-[#0C1222] p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Mic className="h-3.5 w-3.5 text-cyan-400" />
              Student Speech Transcript
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Web Speech API</span>
          </div>
          <div className="min-h-[100px] text-xs text-slate-200 leading-relaxed font-mono p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
            {transcript || <span className="text-slate-500 italic">No speech detected yet. Click the mic button above and speak.</span>}
          </div>
        </div>

        {/* Spoken AI Response */}
        <div className="rounded-2xl border border-slate-800 bg-[#0C1222] p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Volume2 className="h-3.5 w-3.5 text-violet-400" />
              Tutor Spoken Explanation
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold">Source-Grounded</span>
          </div>
          <div className="min-h-[100px] text-xs text-slate-200 leading-relaxed p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
            {spokenResponse || <span className="text-slate-500 italic">Awaiting question...</span>}
          </div>
        </div>

      </div>

    </div>
  );
};
