import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import {
  DocumentItem,
  ChatItem,
  DoubtItem,
  CitationItem,
  ConceptItem,
  InterruptionItem,
  VerificationResult
} from '../types';
import { VoiceWaveform } from '../components/VoiceWaveform';
import { SourceReader } from '../components/SourceReader';
import { DoubtTracker } from '../components/DoubtTracker';
import { VerificationSection } from '../components/VerificationSection';
import { InterruptionBar } from '../components/InterruptionBar';
import { CitationChip } from '../components/CitationChip';
import { StackVisualizer } from '../components/StackVisualizer';
import { TodayChecklist } from '../components/TodayChecklist';
import { Rotating3DLogo } from '../components/Rotating3DLogo';

// Core Master Architecture Modals & Tabs
import { InstitutionHubModal } from '../components/InstitutionHubModal';
import { EvaluatorDemoTourModal } from '../components/EvaluatorDemoTourModal';
import { DocumentComparatorModal } from '../components/DocumentComparatorModal';
import { LearningRescueModal } from '../components/LearningRescueModal';
import { ConfusionFingerprintTab } from '../components/ConfusionFingerprintTab';
import { ProofOfUnderstandingTab } from '../components/ProofOfUnderstandingTab';

// Additional Learning Tools
import { NotesToVideoModal } from '../components/NotesToVideoModal';
import { FlashcardsModal } from '../components/FlashcardsModal';
import { MemoryMapModal } from '../components/MemoryMapModal';
import { ReportsModal } from '../components/ReportsModal';
import { QuizModal } from '../components/QuizModal';
import { MultilingualModal } from '../components/MultilingualModal';
import { HandwrittenOCRModal } from '../components/HandwrittenOCRModal';
import { VoiceNotesModal } from '../components/VoiceNotesModal';
import { PYQAnalyzerModal } from '../components/PYQAnalyzerModal';
import { LaunchChecklistModal } from '../components/LaunchChecklistModal';
import { ConceptDNAModal } from '../components/ConceptDNAModal';
import { StudyArtifactsModal } from '../components/StudyArtifactsModal';
import { KnowledgeTimeMachineModal } from '../components/KnowledgeTimeMachineModal';
import { PeerLearningModal } from '../components/PeerLearningModal';

import { LanguageCode, LANGUAGES, getTranslation } from '../utils/i18n';

interface WorkspaceProps {
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  lang?: LanguageCode;
  onLanguageChange?: (lang: LanguageCode) => void;
  onBackToHome: () => void;
  onOpen3DView?: () => void;
  onOpenAlarms?: () => void;
  onOpenLogin?: () => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  theme = 'light',
  onToggleTheme,
  lang = 'en',
  onLanguageChange,
  onBackToHome,
  onOpen3DView,
  onOpenAlarms,
  onOpenLogin
}) => {
  const t = getTranslation(lang);
  // Documents & Pages state
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number>(1);
  const [currentPageNo, setCurrentPageNo] = useState<number>(2);
  const [activeHighlightExcerpt, setActiveHighlightExcerpt] = useState<string | null>(null);

  // Chat & Tutor state
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [activeCitation, setActiveCitation] = useState<CitationItem | null>(null);
  const [activeTeachingMode, setActiveTeachingMode] = useState<string>('standard');

  // Doubts state
  const [doubts, setDoubts] = useState<DoubtItem[]>([]);

  // Concepts state
  const [concepts, setConcepts] = useState<ConceptItem[]>([]);
  const [activeConceptName, setActiveConceptName] = useState('Recursion');

  // Right Studio Tab state
  const [studioTab, setStudioTab] = useState<'reader' | 'confusion' | 'proof' | 'stack'>('reader');

  // Verification state
  const [showVerification, setShowVerification] = useState(false);

  // Context-Aware Interruption state
  const [currentInterruption, setCurrentInterruption] = useState<InterruptionItem | null>(null);

  // Speech Recognition state for microphone input
  const [isListeningMic, setIsListeningMic] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Modals state for Core Architecture
  const [isInstitutionModalOpen, setIsInstitutionModalOpen] = useState(false);
  const [isEvaluatorTourOpen, setIsEvaluatorTourOpen] = useState(false);
  const [isComparatorOpen, setIsComparatorOpen] = useState(false);
  const [isRescueModalOpen, setIsRescueModalOpen] = useState(false);

  // Modals state for Extra Learning Tools
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isFlashcardsModalOpen, setIsFlashcardsModalOpen] = useState(false);
  const [isMemoryMapModalOpen, setIsMemoryMapModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isMultilingualModalOpen, setIsMultilingualModalOpen] = useState(false);
  const [isOCRModalOpen, setIsOCRModalOpen] = useState(false);
  const [isVoiceNotesModalOpen, setIsVoiceNotesModalOpen] = useState(false);
  const [isPYQModalOpen, setIsPYQModalOpen] = useState(false);
  const [isLaunchChecklistModalOpen, setIsLaunchChecklistModalOpen] = useState(false);
  const [isConceptDNAModalOpen, setIsConceptDNAModalOpen] = useState(false);
  const [isArtifactsModalOpen, setIsArtifactsModalOpen] = useState(false);
  const [isTimeMachineModalOpen, setIsTimeMachineModalOpen] = useState(false);
  const [isVisualModalOpen, setIsVisualModalOpen] = useState(false);
  const [isPeerModalOpen, setIsPeerModalOpen] = useState(false);

  // Active view in Muse-app layout
  const [activeRailTool, setActiveRailTool] = useState<string>('chat');

  // Auto-scroll chat to bottom
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    initializeWorkspace();
    setupSpeechRecognition();
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chats, showVerification]);

  const initializeWorkspace = async () => {
    try {
      const [docsData, chatsData, doubtsData, conceptsData] = await Promise.all([
        api.getDocuments(),
        api.getChats(),
        api.getDoubts(),
        api.getConcepts()
      ]);

      setDocuments(docsData || []);
      if (docsData && docsData.length > 0) {
        setSelectedDocId(docsData[0].id);
      }
      setChats(chatsData || []);
      setDoubts(doubtsData || []);
      setConcepts(conceptsData || []);

      checkProactiveInterruptions('Recursion');
    } catch (err) {
      console.error('Failed to initialize workspace data:', err);
    }
  };

  const setupSpeechRecognition = () => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setChatInput(transcript);
          setIsListeningMic(false);
          handleSendMessage(transcript);
        };

        recognition.onerror = () => {
          setIsListeningMic(false);
        };

        recognition.onend = () => {
          setIsListeningMic(false);
        };

        recognitionRef.current = recognition;
      }
    }
  };

  const toggleMicListening = () => {
    if (!recognitionRef.current) {
      alert('Web Speech Recognition is not supported by your browser. Please type your message.');
      return;
    }
    if (isListeningMic) {
      recognitionRef.current.stop();
      setIsListeningMic(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListeningMic(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const checkProactiveInterruptions = async (conceptName?: string) => {
    try {
      const result = await api.checkInterruptions(conceptName || activeConceptName);
      if (result && result.status === 'shown') {
        setCurrentInterruption(result);
      }
    } catch (err) {
      console.error('Failed to check interruptions:', err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const q = textToSend !== undefined ? textToSend : chatInput;
    if (!q.trim()) return;

    setChatInput('');
    setIsChatLoading(true);

    // If student types "I still don't understand..." handle Doubt Memory
    if (q.toLowerCase().includes("don't understand") || q.toLowerCase().includes('doubt')) {
      try {
        await api.createDoubt(q);
        const updatedDoubts = await api.getDoubts();
        setDoubts(updatedDoubts);
      } catch (err) {
        console.error('Failed to create doubt:', err);
      }
    }

    try {
      const newChat = await api.sendChat(q, selectedDocId, activeTeachingMode);
      setChats(prev => [...prev, newChat]);

      // If answer has citations, activate the first citation
      if (newChat.citations && newChat.citations.length > 0) {
        handleCitationClick(newChat.citations[0]);
      }

      checkProactiveInterruptions();
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleCitationClick = (citation: CitationItem) => {
    setActiveCitation(citation);
    setSelectedDocId(citation.docId);
    setCurrentPageNo(citation.pageNo);
    setActiveHighlightExcerpt(citation.excerpt);
    setStudioTab('reader'); // Switch to reader to view cited page
  };

  const handleAcceptInterruption = async (id: number) => {
    try {
      await api.acceptInterruption(id);
      setCurrentInterruption(null);
      handleSendMessage('What is the call stack?');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismissInterruption = async (id: number) => {
    try {
      await api.dismissInterruption(id);
      setCurrentInterruption(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerificationComplete = async (result: VerificationResult) => {
    if (result.gaps && result.gaps.length > 0) {
      checkProactiveInterruptions(result.conceptName);
    } else {
      const updatedDoubts = await api.getDoubts();
      setDoubts(updatedDoubts);
    }
  };

  const handleReexplainMissing = (gapText: string) => {
    handleSendMessage(`Please explain this missing concept part: "${gapText}"`);
    setShowVerification(false);
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-200 ${
      isDark ? 'bg-[#0B0E17] text-[#F8FAFC]' : 'bg-[#FAF7F2] text-[#1E1B18]'
    }`}>
      {/* Top Navigation Bar */}
      <nav className={`w-full border-b px-4 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-sm transition-colors ${
        isDark ? 'bg-[#0F172A] border-amber-500/20' : 'bg-white border-amber-200/50'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
              isDark
                ? 'border-[#334155] text-[#94A3B8] hover:text-white hover:bg-[#334155]'
                : 'border-[#D8CEBE] text-[#6B625E] hover:text-[#27211E] hover:bg-[#FAF7F2]'
            }`}
          >
            ← {t.home}
          </button>
          <div className="h-4 w-px bg-[#D8CEBE] dark:bg-[#334155]" />
          <div className="flex items-center gap-2">
            <Rotating3DLogo size={24} />
            <span className="font-black text-sm sm:text-base text-inherit tracking-tight">
              UNERA
            </span>
            <span className="hidden md:inline text-xs text-[#64748B] dark:text-[#94A3B8] font-medium">
              Your Notes. Smarter Learning.
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
              v3.2 Enterprise
            </span>
          </div>
        </div>

        {/* Feature Shortcuts & Core Architecture Controls */}
        <div className="flex items-center gap-2">
          {/* Part 7: Evaluator 13-Step Automated Demo Tour */}
          <button
            onClick={() => setIsEvaluatorTourOpen(true)}
            className="px-3.5 py-1.5 text-xs font-black rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black hover:opacity-95 transition-all shadow-md shadow-amber-500/25 flex items-center gap-1.5 active:scale-95"
            title="Interactive 13-Step Acceptance Scenario Tour"
          >
            <span>🎬</span>
            <span>Evaluator Demo Tour</span>
          </button>



          {/* Feature 13 & 14: Institution Hub */}
          <button
            onClick={() => setIsInstitutionModalOpen(true)}
            className="px-3 py-1.5 text-xs font-bold rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] hover:bg-[#8B5CF6]/25 transition-colors hidden md:flex items-center gap-1"
            title="Classroom Intelligence Heatmap & Corporate SOP Hub"
          >
            <span>🏫</span>
            <span>Institution Hub</span>
          </button>

          {/* Feature 1: Cross-Document Comparator */}
          <button
            onClick={() => setIsComparatorOpen(true)}
            className="px-3 py-1.5 text-xs font-bold rounded-full bg-[#10B981]/15 text-[#10B981] hover:bg-[#10B981]/25 transition-colors hidden lg:flex items-center gap-1"
            title="Cross-Document Multi-Source Comparator"
          >
            <span>📑</span>
            <span>Compare Sources</span>
          </button>

          {/* Feature: Peer-to-Peer Learning Network & Study Circle */}
          <button
            onClick={() => setIsPeerModalOpen(true)}
            className="px-3 py-1.5 text-xs font-bold rounded-full bg-[#EAF3FB] border border-[#3B82F6]/40 text-[#1E3A8A] hover:bg-[#DBEAFE] transition-all flex items-center gap-1.5 shadow-sm"
            title="Peer-to-Peer Learning Network (Shared Domain: Computer Science & Placement)"
          >
            <span>👥</span>
            <span>Domain Peers</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
          </button>

          {/* Concept DNA */}
          <button
            onClick={() => setIsConceptDNAModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-full bg-[#F8EDFB] text-[#6B21A8] hover:bg-[#F3E8FF] transition-colors hidden xl:block"
          >
            Concept DNA
          </button>

          {/* Feature: Study Alarms Scheduler */}
          {onOpenAlarms && (
            <button
              onClick={onOpenAlarms}
              className={`px-3 py-1.5 text-xs font-bold rounded-full border flex items-center gap-1.5 transition-all shadow-sm ${
                isDark
                  ? 'bg-[#1E293B] border-[#EC4899]/40 text-[#F472B6] hover:bg-[#EC4899]/20'
                  : 'bg-white border-[#EC4899]/30 text-[#DB2777] hover:bg-[#FDF2F8]'
              }`}
              title="Study Alarms, Automatic Reminders & Chime"
            >
              <span>⏰</span>
              <span>Alarms</span>
            </button>
          )}

          {/* Feature: 3D Perspective Knowledge Core */}
          {onOpen3DView && (
            <button
              onClick={onOpen3DView}
              className={`px-3 py-1.5 text-xs font-bold rounded-full border flex items-center gap-1.5 transition-all shadow-sm ${
                isDark
                  ? 'bg-[#1E293B] border-[#06B6D4]/40 text-[#22D3EE] hover:bg-[#06B6D4]/20'
                  : 'bg-white border-[#06B6D4]/30 text-[#0891B2] hover:bg-[#ECFEFF]'
              }`}
              title="Interactive 3D Knowledge Core View"
            >
              <span>🌀</span>
              <span>3D Core</span>
            </button>
          )}

          {/* Language Switcher Pill */}
          {onLanguageChange && (
            <div className={`hidden lg:flex items-center rounded-full p-0.5 text-xs border ${
              isDark ? 'bg-black/40 border-white/10' : 'bg-[#FAF7F2] border-zinc-200'
            }`}>
              <span className="text-amber-500 px-1 text-[11px]">🌐</span>
              {LANGUAGES.map(item => (
                <button
                  key={item.code}
                  onClick={() => onLanguageChange(item.code)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                    lang === item.code
                      ? 'bg-amber-500 text-black shadow-sm'
                      : isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-black'
                  }`}
                  title={item.label}
                >
                  {item.nativeName}
                </button>
              ))}
            </div>
          )}

          {/* Lamp Login Screen Link */}
          {onOpenLogin && (
            <button
              onClick={onOpenLogin}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-full border flex items-center gap-1 transition-all shadow-sm ${
                isDark
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                  : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
              }`}
              title="Interactive Lamp Login Page"
            >
              <span>💡</span>
              <span className="hidden xl:inline">{t.login}</span>
            </button>
          )}

          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`p-1.5 px-2.5 rounded-full border text-xs font-medium transition-all ${
                isDark
                  ? 'bg-[#0B132B] border-[#334155] text-[#FCD34D] hover:bg-[#334155]'
                  : 'bg-[#FAF7F2] border-[#D8CEBE] text-[#27211E] hover:bg-[#F2ECE4]'
              }`}
              title="Toggle theme"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          )}
        </div>
      </nav>

      {/* Muse-app 3-Panel Layout */}
      <div className="flex-1 flex w-full overflow-hidden">
        {/* Left Icon Rail */}
        <aside className={`w-16 sm:w-20 shrink-0 border-r flex flex-col items-center py-4 gap-3 select-none transition-colors ${
          isDark ? 'bg-[#0F172A] border-[#1E293B]' : 'bg-white border-[#F2ECE4]'
        }`}>
          <button
            onClick={() => setActiveRailTool('chat')}
            className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeRailTool === 'chat'
                ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black font-bold shadow-md shadow-amber-500/30'
                : isDark ? 'text-[#94A3B8] hover:bg-[#1E293B]' : 'text-[#6B625E] hover:bg-[#FAF7F2]'
            }`}
            title="AI Tutor Chat & Voice"
          >
            <span className="text-base">💬</span>
            <span className="text-[9px] font-bold">Chat</span>
          </button>

          {onOpenAlarms && (
            <button
              onClick={onOpenAlarms}
              className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center transition-all border border-[#EC4899]/30 ${
                isDark ? 'text-[#F472B6] hover:bg-[#EC4899]/15' : 'text-[#DB2777] hover:bg-[#FDF2F8]'
              }`}
              title="Study Alarms & Reminders"
            >
              <span className="text-base">⏰</span>
              <span className="text-[9px] font-bold">Alarm</span>
            </button>
          )}

          {onOpen3DView && (
            <button
              onClick={onOpen3DView}
              className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center transition-all border border-[#06B6D4]/30 ${
                isDark ? 'text-[#22D3EE] hover:bg-[#06B6D4]/15' : 'text-[#0891B2] hover:bg-[#ECFEFF]'
              }`}
              title="Interactive 3D Loading & Core View"
            >
              <span className="text-base">🌀</span>
              <span className="text-[9px] font-bold">3D Core</span>
            </button>
          )}

          <button
            onClick={() => setIsPeerModalOpen(true)}
            className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center transition-all ${
              isDark ? 'text-[#94A3B8] hover:bg-[#1E293B]' : 'text-[#6B625E] hover:bg-[#FAF7F2]'
            }`}
            title="Peer-to-Peer Learning Network & Study Circle"
          >
            <span className="text-base text-[#3B82F6]">👥</span>
            <span className="text-[9px] font-bold">Peers</span>
          </button>

          <button
            onClick={() => setIsInstitutionModalOpen(true)}
            className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center transition-all ${
              isDark ? 'text-[#94A3B8] hover:bg-[#1E293B]' : 'text-[#6B625E] hover:bg-[#FAF7F2]'
            }`}
            title="Feature 13 & 14: Classroom & Org Hub"
          >
            <span className="text-base text-[#8B5CF6]">🏫</span>
            <span className="text-[9px] font-bold">Hub</span>
          </button>

          <button
            onClick={() => setIsComparatorOpen(true)}
            className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center transition-all ${
              isDark ? 'text-[#94A3B8] hover:bg-[#1E293B]' : 'text-[#6B625E] hover:bg-[#FAF7F2]'
            }`}
            title="Feature 1: Compare Multi-Document Explanations"
          >
            <span className="text-base text-[#10B981]">📑</span>
            <span className="text-[9px] font-bold">Compare</span>
          </button>

          <button
            onClick={() => setIsRescueModalOpen(true)}
            className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center transition-all ${
              isDark ? 'text-[#94A3B8] hover:bg-[#1E293B]' : 'text-[#6B625E] hover:bg-[#FAF7F2]'
            }`}
            title="Feature 4: Learning Rescue Engine"
          >
            <span className="text-base text-[#F43F5E]">🚑</span>
            <span className="text-[9px] font-bold">Rescue</span>
          </button>

          <button
            onClick={() => setIsFlashcardsModalOpen(true)}
            className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center transition-all ${
              isDark ? 'text-[#94A3B8] hover:bg-[#1E293B]' : 'text-[#6B625E] hover:bg-[#FAF7F2]'
            }`}
            title="Feature 7: Flashcards"
          >
            <span className="text-base">🗂️</span>
            <span className="text-[9px] font-bold">Cards</span>
          </button>

          <button
            onClick={() => setIsMemoryMapModalOpen(true)}
            className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center transition-all ${
              isDark ? 'text-[#94A3B8] hover:bg-[#1E293B]' : 'text-[#6B625E] hover:bg-[#FAF7F2]'
            }`}
            title="Feature 8: Memory Mindmap"
          >
            <span className="text-base">🧠</span>
            <span className="text-[9px] font-bold">Map</span>
          </button>

          <button
            onClick={() => setIsQuizModalOpen(true)}
            className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center transition-all ${
              isDark ? 'text-[#94A3B8] hover:bg-[#1E293B]' : 'text-[#6B625E] hover:bg-[#FAF7F2]'
            }`}
            title="Feature 10: Quiz"
          >
            <span className="text-base">📝</span>
            <span className="text-[9px] font-bold">Quiz</span>
          </button>

          <button
            onClick={() => setIsReportsModalOpen(true)}
            className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center transition-all ${
              isDark ? 'text-[#94A3B8] hover:bg-[#1E293B]' : 'text-[#6B625E] hover:bg-[#FAF7F2]'
            }`}
            title="Feature 9: Reports & 7-Day Spaced Plan"
          >
            <span className="text-base">📊</span>
            <span className="text-[9px] font-bold">Report</span>
          </button>

          <button
            onClick={() => setIsOCRModalOpen(true)}
            className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center transition-all ${
              isDark ? 'text-[#94A3B8] hover:bg-[#1E293B]' : 'text-[#6B625E] hover:bg-[#FAF7F2]'
            }`}
            title="Feature 12: Handwritten OCR"
          >
            <span className="text-base">📷</span>
            <span className="text-[9px] font-bold">OCR</span>
          </button>

          <button
            onClick={() => setIsVoiceNotesModalOpen(true)}
            className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center transition-all ${
              isDark ? 'text-[#94A3B8] hover:bg-[#1E293B]' : 'text-[#6B625E] hover:bg-[#FAF7F2]'
            }`}
            title="Feature 13: Voice Notes"
          >
            <span className="text-base">🎙️</span>
            <span className="text-[9px] font-bold">Audio</span>
          </button>

          <div className="mt-auto pt-2 border-t border-[#F2ECE4] dark:border-[#334155] w-full flex flex-col items-center">
            <button
              onClick={() => setIsEvaluatorTourOpen(true)}
              className="w-10 h-10 rounded-xl bg-[#FF5E4D]/15 text-[#FF5E4D] flex items-center justify-center font-black text-xs hover:bg-[#FF5E4D]/25 transition-all"
              title="Run 13-Step Evaluator Tour"
            >
              🎬13
            </button>
          </div>
        </aside>

        {/* Center Panel (Chat + Voice) & Right Studio Panel */}
        <main className="flex-1 p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-hidden">
          {/* Center Column: Chat + Voice Tutor (7 Columns on Large Screens) */}
          <div className={`lg:col-span-7 flex flex-col h-[calc(100vh-80px)] rounded-[28px] border shadow-sm p-4 sm:p-5 overflow-hidden transition-colors ${
            isDark ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#F2ECE4]'
          }`}>
            {/* Top: AI Voice Tutor with genuine Barge-In and 24 waveform bars */}
            <VoiceWaveform
              conceptName={activeConceptName}
              onInterrupted={(text, bookmark) => {
                setChats(prev => [
                  ...prev,
                  {
                    id: Date.now(),
                    question: `(Interruption at chunk ${bookmark + 1}): "${text}"`,
                    answer: '',
                    grounded: 1,
                    citations: []
                  }
                ]);
              }}
              onAnswerReady={(ans, cits) => {
                setChats(prev => {
                  const last = prev[prev.length - 1];
                  if (last) {
                    return [
                      ...prev.slice(0, -1),
                      { ...last, answer: ans, citations: cits }
                    ];
                  }
                  return prev;
                });
                if (cits && cits.length > 0) {
                  handleCitationClick(cits[0]);
                }
              }}
            />

            {/* Middle: Chat Messages Stream */}
            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto space-y-4 pr-1 mb-3 scroll-smooth"
            >
              {chats.length === 0 ? (
                <div className={`h-full flex flex-col items-center justify-center text-center p-6 ${
                  isDark ? 'text-[#64748B]' : 'text-[#8C827A]'
                }`}>
                  <span className="w-10 h-10 rounded-full bg-[#FF5E4D]/10 flex items-center justify-center text-lg mb-2 text-[#FF5E4D]">
                    ?
                  </span>
                  <p className="font-bold text-sm text-inherit">
                    Your Source-Grounded AI Tutor is Ready
                  </p>
                  <p className="text-xs max-w-sm mt-1">
                    Ask any question from your notes. Answers cite verified pages with clickable chips and utilize intelligent layered caching.
                  </p>
                </div>
              ) : (
                chats.map((chat, idx) => (
                  <div key={chat.id || idx} className="space-y-2">
                    {/* Student Question */}
                    <div className="flex justify-end">
                      <div className={`px-4 py-2.5 rounded-2xl rounded-tr-sm text-xs sm:text-sm max-w-[85%] font-medium border ${
                        isDark
                          ? 'bg-[#0B132B] border-[#334155] text-[#F8FAFC]'
                          : 'bg-[#FAF7F2] border-[#F2ECE4] text-[#27211E]'
                      }`}>
                        {chat.question}
                      </div>
                    </div>

                    {/* AI Tutor Answer */}
                    {chat.answer && (
                      <div className="flex justify-start">
                        <div className={`p-4 rounded-2xl rounded-tl-sm text-xs sm:text-sm max-w-[95%] shadow-sm border ${
                          isDark
                            ? 'bg-[#0F172A] border-[#334155] text-[#F8FAFC]'
                            : 'bg-[#FFFFFF] border-[#F2ECE4] text-[#27211E]'
                        }`}>
                          {/* Answer Metadata & Cache Badge */}
                          <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                            <span className="text-[10px] uppercase font-bold text-[#FF5E4D] tracking-wider">
                              {chat.grounded === 1 ? 'Source-Grounded Tutor' : 'Out-of-Notes Abstention'}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {/* Cache Resolution Badge (Feature 10) */}
                              {chat.cacheHit ? (
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 flex items-center gap-1">
                                  <span>⚡</span>
                                  <span>{chat.cacheLayer || 'Layer A Exact'} ({chat.latencyMs || 2}ms • $0.00 spent)</span>
                                </span>
                              ) : chat.cacheLayer ? (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30">
                                  {chat.cacheLayer} ({chat.latencyMs || 480}ms)
                                </span>
                              ) : null}

                              {chat.teachingMode && chat.teachingMode !== 'standard' && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6]">
                                  Mode: {chat.teachingMode}
                                </span>
                              )}

                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                chat.grounded === 1
                                  ? 'bg-[#E9F7F0] text-[#065F46] dark:bg-[#065F46]/30 dark:text-[#34D399]'
                                  : 'bg-[#FEE2E2] text-[#991B1B] dark:bg-[#991B1B]/30 dark:text-[#F87171]'
                              }`}>
                                {chat.grounded === 1 ? 'Verified in Notes' : 'Not in Notes'}
                              </span>
                            </div>
                          </div>

                          {/* Answer body with citations */}
                          <div className="leading-relaxed mb-2 font-sans whitespace-pre-wrap">
                            {chat.answer}
                            {chat.citations && chat.citations.map((c, ci) => (
                              <CitationChip
                                key={ci}
                                citation={c}
                                onSelect={handleCitationClick}
                                isActive={activeCitation?.pageNo === c.pageNo}
                              />
                            ))}
                          </div>

                          {/* Excerpt preview if grounded */}
                          {chat.citations && chat.citations.length > 0 && chat.citations[0].excerpt && (
                            <div className={`mt-2.5 pt-2 border-t text-[11px] italic ${
                              isDark ? 'border-[#334155] text-[#94A3B8]' : 'border-[#F2ECE4] text-[#6B625E]'
                            }`}>
                              <span className="font-semibold not-italic mr-1">Excerpt:</span>
                              "{chat.citations[0].excerpt}"
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}

              {isChatLoading && (
                <div className="flex justify-start">
                  <div className={`px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 border ${
                    isDark ? 'bg-[#0B132B] border-[#334155] text-[#94A3B8]' : 'bg-[#FAF7F2] border-[#F2ECE4] text-[#8C827A]'
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-[#FF5E4D] animate-ping" />
                    Querying layered answer cache & source passages...
                  </div>
                </div>
              )}

              {/* Verification Section Component (Opens below chat) */}
              {showVerification && (
                <VerificationSection
                  conceptName={activeConceptName}
                  onVerificationComplete={handleVerificationComplete}
                  onReexplainMissingPart={handleReexplainMissing}
                  onClose={() => setShowVerification(false)}
                />
              )}
            </div>

            {/* Context-Aware Interruption Bar (slides in right above composer) */}
            <InterruptionBar
              interruption={currentInterruption}
              onAccept={handleAcceptInterruption}
              onDismiss={handleDismissInterruption}
            />

            {/* Teaching Mode Selector Bar (Feature 5) */}
            <div className="flex items-center justify-between gap-2 mb-2 pt-2 border-t border-[#F2ECE4] dark:border-[#334155]">
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-1">
                <span className="text-[10px] font-bold text-[#64748B] shrink-0 uppercase tracking-wider">
                  Teaching Mode:
                </span>
                {[
                  { key: 'standard', label: 'Standard' },
                  { key: 'beginner', label: '🌱 Beginner' },
                  { key: 'engineering', label: '⚙️ Engineering' },
                  { key: 'socratic', label: '🤔 Socratic' },
                  { key: 'step_by_step', label: '🔢 Step-by-Step' },
                  { key: 'analogy', label: '💡 Analogy' },
                  { key: 'derivation', label: '📐 Derivation' },
                  { key: 'exam', label: '🎯 Exam Prep' },
                  { key: 'oral_exam', label: '🎙️ Oral Exam' },
                  { key: 'bilingual_hindi', label: '🇮🇳 Hindi' },
                  { key: 'bilingual_marathi', label: '🚩 Marathi' }
                ].map(m => (
                  <button
                    key={m.key}
                    onClick={() => setActiveTeachingMode(m.key)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 transition-all ${
                      activeTeachingMode === m.key
                        ? 'bg-[#FF5E4D] text-white shadow-sm'
                        : isDark
                        ? 'bg-[#0B132B] text-[#94A3B8] hover:text-white border border-[#334155]'
                        : 'bg-[#FAF7F2] text-[#6B625E] hover:text-[#27211E] border border-[#D8CEBE]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowVerification(!showVerification)}
                className="px-3 py-1 rounded-full bg-[#E9F7F0] text-[#065F46] border border-[#A7F3D0] text-xs font-semibold hover:bg-[#DCFCE7] transition-colors shrink-0"
              >
                {showVerification ? 'Hide Verification' : 'Verify Understanding'}
              </button>
            </div>

            {/* Composer Input Bar */}
            <div className={`flex items-center gap-2 pt-2 border-t ${
              isDark ? 'border-[#334155]' : 'border-[#F2ECE4]'
            }`}>
              <button
                onClick={toggleMicListening}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  isListeningMic
                    ? 'bg-[#EF4444] text-white animate-pulse'
                    : isDark
                      ? 'bg-[#0B132B] border border-[#334155] text-[#94A3B8] hover:text-white'
                      : 'bg-[#FAF7F2] border border-[#D8CEBE] text-[#6B625E] hover:text-[#27211E]'
                }`}
                title={isListeningMic ? 'Listening... click to stop' : 'Speak question'}
              >
                🎤
              </button>

              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Ask questions from your notes, log a doubt, or speak..."
                className={`flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-full border focus:outline-none focus:border-[#FF5E4D] ${
                  isDark
                    ? 'bg-[#0B132B] border-[#334155] text-white'
                    : 'bg-[#FAF7F2] border-[#D8CEBE] text-[#27211E]'
                }`}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={isChatLoading || !chatInput.trim()}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black font-bold text-xs sm:text-sm hover:opacity-95 disabled:opacity-50 transition-all shadow-md shadow-amber-500/25 active:scale-95"
              >
                Send
              </button>
            </div>
          </div>

          {/* Right Studio Column: Tabbed Studio Workspace (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col gap-3 h-[calc(100vh-80px)] overflow-hidden">
            {/* Studio Navigation Tabs */}
            <div className={`p-1.5 rounded-2xl border flex items-center justify-between shrink-0 ${
              isDark ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#F2ECE4]'
            }`}>
              <button
                onClick={() => setStudioTab('reader')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  studioTab === 'reader'
                    ? 'bg-[#FF5E4D] text-white shadow-sm'
                    : 'text-[#64748B] hover:text-inherit'
                }`}
              >
                📖 Notes
              </button>
              <button
                onClick={() => setStudioTab('confusion')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  studioTab === 'confusion'
                    ? 'bg-[#8B5CF6] text-white shadow-sm'
                    : 'text-[#64748B] hover:text-inherit'
                }`}
              >
                🧬 Confusion
              </button>
              <button
                onClick={() => setStudioTab('proof')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  studioTab === 'proof'
                    ? 'bg-[#10B981] text-white shadow-sm'
                    : 'text-[#64748B] hover:text-inherit'
                }`}
              >
                🎯 Proof
              </button>
              <button
                onClick={() => setStudioTab('stack')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  studioTab === 'stack'
                    ? 'bg-[#06B6D4] text-white shadow-sm'
                    : 'text-[#64748B] hover:text-inherit'
                }`}
              >
                📊 Stack
              </button>
            </div>

            {/* Studio Body Content */}
            <div className="flex-1 overflow-y-auto pr-1">
              {studioTab === 'reader' && (
                <div className="flex flex-col gap-4">
                  <div className="shrink-0">
                    <TodayChecklist />
                  </div>
                  <div className="min-h-[380px] flex-1">
                    <SourceReader
                      documents={documents}
                      selectedDocId={selectedDocId}
                      currentPageNo={currentPageNo}
                      highlightExcerpt={activeHighlightExcerpt}
                      onPageChange={setCurrentPageNo}
                      onDocChange={setSelectedDocId}
                      onUploadSuccess={newDoc => {
                        setDocuments(prev => [...prev, newDoc]);
                      }}
                      onAskAboutSelection={text => {
                        handleSendMessage(`Explain this passage from page ${currentPageNo}: "${text}"`);
                      }}
                      theme={theme}
                    />
                  </div>
                  <div className="shrink-0">
                    <DoubtTracker
                      doubts={doubts}
                      onRefreshDoubts={async () => {
                        const updated = await api.getDoubts();
                        setDoubts(updated);
                      }}
                      onSelectConceptPage={(docId, pageNo) => {
                        setSelectedDocId(docId);
                        setCurrentPageNo(pageNo);
                      }}
                      onOpenVisualExample={() => {
                        setIsVisualModalOpen(true);
                      }}
                      onOpenPractice={cName => {
                        setActiveConceptName(cName);
                        setShowVerification(true);
                      }}
                    />
                  </div>
                </div>
              )}

              {studioTab === 'confusion' && (
                <ConfusionFingerprintTab
                  theme={theme}
                  onLaunchRescue={cName => {
                    setActiveConceptName(cName);
                    setIsRescueModalOpen(true);
                  }}
                />
              )}

              {studioTab === 'proof' && (
                <ProofOfUnderstandingTab
                  conceptName={activeConceptName}
                  theme={theme}
                />
              )}

              {studioTab === 'stack' && (
                <div className={`p-5 rounded-3xl border ${
                  isDark ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#F2ECE4]'
                }`}>
                  <h3 className="font-extrabold text-sm mb-3">Interactive Call Stack Frame Visualizer</h3>
                  <StackVisualizer />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Core Architecture Modals */}
      <InstitutionHubModal
        isOpen={isInstitutionModalOpen}
        onClose={() => setIsInstitutionModalOpen(false)}
        theme={theme}
      />

      <EvaluatorDemoTourModal
        isOpen={isEvaluatorTourOpen}
        onClose={() => setIsEvaluatorTourOpen(false)}
        theme={theme}
        onNavigateToCitation={(docId, pageNo, excerpt) => {
          setSelectedDocId(docId);
          setCurrentPageNo(pageNo);
          setActiveHighlightExcerpt(excerpt);
          setStudioTab('reader');
        }}
      />

      <DocumentComparatorModal
        isOpen={isComparatorOpen}
        onClose={() => setIsComparatorOpen(false)}
        theme={theme}
      />

      <LearningRescueModal
        isOpen={isRescueModalOpen}
        onClose={() => setIsRescueModalOpen(false)}
        conceptName={activeConceptName}
        theme={theme}
        onCompleted={async () => {
          const updated = await api.getDoubts();
          setDoubts(updated);
        }}
      />

      {/* Additional Learning Tool Modals */}
      <NotesToVideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />

      <FlashcardsModal
        isOpen={isFlashcardsModalOpen}
        onClose={() => setIsFlashcardsModalOpen(false)}
        onDoubtAdded={async () => {
          const updated = await api.getDoubts();
          setDoubts(updated);
        }}
      />

      <MemoryMapModal
        isOpen={isMemoryMapModalOpen}
        onClose={() => setIsMemoryMapModalOpen(false)}
        onJumpToPage={pNo => {
          setCurrentPageNo(pNo);
          setIsMemoryMapModalOpen(false);
          setStudioTab('reader');
        }}
      />

      <ReportsModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
      />

      <QuizModal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
      />

      <MultilingualModal
        isOpen={isMultilingualModalOpen}
        onClose={() => setIsMultilingualModalOpen(false)}
        onSendToChat={text => handleSendMessage(text)}
      />

      <HandwrittenOCRModal
        isOpen={isOCRModalOpen}
        onClose={() => setIsOCRModalOpen(false)}
        onNoteSaved={async () => {
          const updatedDocs = await api.getDocuments();
          setDocuments(updatedDocs);
        }}
      />

      <VoiceNotesModal
        isOpen={isVoiceNotesModalOpen}
        onClose={() => setIsVoiceNotesModalOpen(false)}
        onNoteSaved={async () => {
          const updatedDocs = await api.getDocuments();
          setDocuments(updatedDocs);
        }}
      />

      <PYQAnalyzerModal
        isOpen={isPYQModalOpen}
        onClose={() => setIsPYQModalOpen(false)}
      />

      {/* Peer-to-Peer Learning Network & Study Circle Modal */}
      <PeerLearningModal
        isOpen={isPeerModalOpen}
        onClose={() => setIsPeerModalOpen(false)}
        onAskTutorAboutDoubt={doubt => handleSendMessage(doubt)}
      />

      <LaunchChecklistModal
        isOpen={isLaunchChecklistModalOpen}
        onClose={() => setIsLaunchChecklistModalOpen(false)}
      />

      <ConceptDNAModal
        concepts={concepts}
        isOpen={isConceptDNAModalOpen}
        onClose={() => setIsConceptDNAModalOpen(false)}
        onSelectConcept={c => {
          if (c.doc_id && c.page_no) {
            setSelectedDocId(c.doc_id);
            setCurrentPageNo(c.page_no);
          }
          setActiveConceptName(c.name);
          handleSendMessage(`Explain ${c.name} based on my notes.`);
          setStudioTab('reader');
        }}
      />

      <StudyArtifactsModal
        isOpen={isArtifactsModalOpen}
        onClose={() => setIsArtifactsModalOpen(false)}
        onJumpToPage={(docId, pageNo) => {
          setSelectedDocId(docId);
          setCurrentPageNo(pageNo);
          setStudioTab('reader');
        }}
      />

      <KnowledgeTimeMachineModal
        isOpen={isTimeMachineModalOpen}
        onClose={() => setIsTimeMachineModalOpen(false)}
      />

      {/* Visual Stack Diagram Modal */}
      {isVisualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className={`w-full max-w-2xl rounded-[28px] border shadow-2xl p-6 ${
            isDark ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#F2ECE4]'
          }`}>
            <div className={`flex items-center justify-between pb-3 mb-3 border-b ${
              isDark ? 'border-[#334155]' : 'border-[#F2ECE4]'
            }`}>
              <span className="font-bold text-sm text-inherit">
                Visual Example: factorial(3) Call Stack
              </span>
              <button
                onClick={() => setIsVisualModalOpen(false)}
                className="w-7 h-7 rounded-full border text-xs flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                ✕
              </button>
            </div>
            <StackVisualizer />
          </div>
        </div>
      )}
    </div>
  );
};
