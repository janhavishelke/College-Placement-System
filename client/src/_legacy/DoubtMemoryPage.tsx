import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Search, 
  BookOpen, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Trash2, 
  X, 
  Lightbulb, 
  Plus,
  HelpCircle,
  Sparkles,
  Award,
  Play
} from 'lucide-react';
import { DoubtRecord, MasteryStatus, HelpConceptData } from '../types';
import { api } from '../services/api';
import { Screen } from '../components/LMSSidebar';

interface DoubtMemoryPageProps {
  onNavigate: (screen: Screen) => void;
  onStartQuizForConcept: (conceptName: string, docId?: string) => void;
}

export const DoubtMemoryPage: React.FC<DoubtMemoryPageProps> = ({
  onNavigate,
  onStartQuizForConcept
}) => {
  const [doubts, setDoubts] = useState<DoubtRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // "Help Me Understand" Modal State
  const [activeHelpDoubt, setActiveHelpDoubt] = useState<DoubtRecord | null>(null);
  const [helpData, setHelpData] = useState<HelpConceptData | null>(null);
  const [helpLoading, setHelpLoading] = useState(false);
  const [helpTab, setHelpTab] = useState<'analogy' | 'simplified' | 'diagram' | 'socratic'>('analogy');

  // New doubt manual creation modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newConceptName, setNewConceptName] = useState('');
  const [newFeedback, setNewFeedback] = useState('');

  useEffect(() => {
    loadDoubts();
  }, [statusFilter]);

  const loadDoubts = async () => {
    try {
      setLoading(true);
      const res = await api.getDoubts({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined
      });
      setDoubts(res.doubts || []);
    } catch (e) {
      console.error('Failed to load doubts:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenHelp = async (doubt: DoubtRecord) => {
    setActiveHelpDoubt(doubt);
    setHelpLoading(true);
    setHelpTab('analogy');
    try {
      const data = await api.getDoubtHelp(doubt.id);
      setHelpData(data);
    } catch (e) {
      console.error('Failed to fetch help breakdown:', e);
    } finally {
      setHelpLoading(false);
    }
  };

  const handleDeleteDoubt = async (id: string) => {
    if (!confirm('Remove this concept from Doubt Memory?')) return;
    try {
      await api.deleteDoubt(id);
      setDoubts(prev => prev.filter(d => d.id !== id));
    } catch (e) {
      console.error('Failed to delete doubt:', e);
    }
  };

  const handleCreateDoubt = async () => {
    if (!newConceptName.trim()) return;
    try {
      const res = await api.addDoubt({
        conceptName: newConceptName,
        studentFeedback: newFeedback || 'Manually logged for conceptual review.'
      });
      if (res.doubt) {
        setDoubts(prev => [res.doubt, ...prev]);
        setShowAddModal(false);
        setNewConceptName('');
        setNewFeedback('');
      }
    } catch (e) {
      console.error('Failed to create doubt:', e);
    }
  };

  const filteredDoubts = doubts.filter(d =>
    d.conceptName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.documentName && d.documentName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto bg-[#070A12] text-slate-100 min-h-screen font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 text-white shadow-lg font-bold">
              <BrainCircuit className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-extrabold text-white">
              Doubt Memory &amp; Retention Tracker
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Persistent tracker remembering unresolved concepts, confusion triggers, and tailored explanations between study sessions.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:from-violet-500 hover:to-cyan-500 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Record New Concept</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#0C1222] p-4 shadow-xl">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`rounded-xl px-3 py-1.5 font-medium transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-violet-600 text-white font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Concepts ({doubts.length})
          </button>
          <button
            onClick={() => setStatusFilter('Needs Review')}
            className={`rounded-xl px-3 py-1.5 font-medium transition-colors cursor-pointer ${
              statusFilter === 'Needs Review'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-amber-950/40 text-amber-300 border border-amber-800/40 hover:bg-amber-900/50'
            }`}
          >
            Needs Review ({doubts.filter(d => d.status === 'Needs Review').length})
          </button>
          <button
            onClick={() => setStatusFilter('Learning')}
            className={`rounded-xl px-3 py-1.5 font-medium transition-colors cursor-pointer ${
              statusFilter === 'Learning'
                ? 'bg-cyan-600 text-white font-bold'
                : 'bg-cyan-950/40 text-cyan-300 border border-cyan-800/40 hover:bg-cyan-900/50'
            }`}
          >
            Developing ({doubts.filter(d => d.status === 'Learning').length})
          </button>
          <button
            onClick={() => setStatusFilter('Demonstrated')}
            className={`rounded-xl px-3 py-1.5 font-medium transition-colors cursor-pointer ${
              statusFilter === 'Demonstrated'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/50'
            }`}
          >
            Demonstrated ({doubts.filter(d => d.status === 'Demonstrated').length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search concepts or notes..."
            className="w-full rounded-xl bg-slate-900 pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 border border-slate-800 focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {/* Doubts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoubts.map(doubt => (
          <div
            key={doubt.id}
            className="rounded-2xl border border-slate-800 bg-[#0C1222] p-5 flex flex-col justify-between space-y-4 shadow-xl hover:border-violet-500/30 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  doubt.status === 'Needs Review' ? 'bg-amber-950/80 text-amber-400 border border-amber-800/40' :
                  doubt.status === 'Learning' ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/40' :
                  'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                }`}>
                  {doubt.status}
                </span>

                <button
                  onClick={() => handleDeleteDoubt(doubt.id)}
                  title="Remove doubt"
                  className="text-slate-600 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <h3 className="mt-2 text-base font-bold text-white">
                {doubt.conceptName}
              </h3>
              
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                <BookOpen className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                <span className="truncate">{doubt.documentName}</span>
                <span className="text-cyan-400 font-mono">• p. {doubt.pageReference}</span>
              </div>

              <p className="mt-3 text-xs text-slate-300 leading-relaxed italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                "{doubt.studentFeedback || 'Marked for conceptual review.'}"
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Practice Attempts: <strong className="text-white">{doubt.practiceAttempts}</strong></span>
                {doubt.lastScore !== null && (
                  <span className="font-mono text-cyan-400">Score: {doubt.lastScore}%</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenHelp(doubt)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-violet-600/30 py-2 text-xs font-bold text-violet-300 border border-violet-500/30 hover:bg-violet-600 hover:text-white transition-all cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Breakdown</span>
                </button>

                <button
                  onClick={() => onStartQuizForConcept(doubt.conceptName, doubt.documentId || undefined)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 py-2 text-xs font-bold text-white hover:from-violet-500 hover:to-cyan-500 shadow-md transition-all cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Verify</span>
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* "HELP ME UNDERSTAND" MULTI-MODAL BREAKDOWN MODAL */}
      {activeHelpDoubt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-[#0B0F19] p-6 shadow-2xl space-y-5 max-h-[85vh] flex flex-col text-slate-100">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  Help Me Understand: {activeHelpDoubt.conceptName}
                </h3>
              </div>
              <button
                onClick={() => setActiveHelpDoubt(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Breakdown Tabs */}
            <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setHelpTab('analogy')}
                className={`flex-1 py-1.5 rounded-lg transition-colors ${
                  helpTab === 'analogy' ? 'bg-violet-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Real-World Analogy
              </button>
              <button
                onClick={() => setHelpTab('simplified')}
                className={`flex-1 py-1.5 rounded-lg transition-colors ${
                  helpTab === 'simplified' ? 'bg-violet-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                ELI5 Simplified
              </button>
              <button
                onClick={() => setHelpTab('diagram')}
                className={`flex-1 py-1.5 rounded-lg transition-colors ${
                  helpTab === 'diagram' ? 'bg-violet-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Visual Flow
              </button>
              <button
                onClick={() => setHelpTab('socratic')}
                className={`flex-1 py-1.5 rounded-lg transition-colors ${
                  helpTab === 'socratic' ? 'bg-violet-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Reflection
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {helpLoading ? (
                <div className="py-12 text-center text-slate-400">Synthesizing multi-modal breakdown...</div>
              ) : helpData ? (
                <>
                  {helpTab === 'analogy' && (
                    <div className="space-y-3">
                      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                          {helpData.analogy.title}
                        </span>
                        <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {helpData.analogy.story}
                        </p>
                      </div>
                    </div>
                  )}

                  {helpTab === 'simplified' && (
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                        Plain English Explanation
                      </span>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {helpData.simplifiedExplanation}
                      </p>
                    </div>
                  )}

                  {helpTab === 'diagram' && (
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        Structural Diagram
                      </span>
                      <pre className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-cyan-300 overflow-x-auto border border-slate-800">
                        {helpData.diagram.content}
                      </pre>
                    </div>
                  )}

                  {helpTab === 'socratic' && (
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        Self-Reflection Prompt
                      </span>
                      <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                        {helpData.reflectionQuestion}
                      </p>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => {
                  const cName = activeHelpDoubt.conceptName;
                  const dId = activeHelpDoubt.documentId || undefined;
                  setActiveHelpDoubt(null);
                  onStartQuizForConcept(cName, dId);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Verify Understanding Now</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ADD CONCEPT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0B0F19] p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Record Concept in Doubt Memory</h3>
              <button onClick={() => setShowAddModal(false)} className="rounded-lg p-1 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Concept Name</label>
                <input
                  type="text"
                  value={newConceptName}
                  onChange={e => setNewConceptName(e.target.value)}
                  placeholder="e.g. Backpropagation Chain Rule, Banker's Algorithm"
                  className="w-full rounded-xl bg-slate-900 p-3 text-xs text-white border border-slate-800 focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Confusion Details</label>
                <textarea
                  value={newFeedback}
                  onChange={e => setNewFeedback(e.target.value)}
                  placeholder="What specifically is difficult or confusing?"
                  rows={3}
                  className="w-full rounded-xl bg-slate-900 p-3 text-xs text-white border border-slate-800 focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-xl px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDoubt}
                disabled={!newConceptName.trim()}
                className="rounded-xl bg-violet-600 px-5 py-2 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-40"
              >
                Save Concept
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
