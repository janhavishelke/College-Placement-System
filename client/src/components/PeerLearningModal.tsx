import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface PeerProfile {
  id: number;
  name: string;
  domain: string;
  role: string;
  avatar: string;
  bio: string;
  rating: number;
  problems_solved: number;
  status: string;
}

interface PeerReply {
  id: number;
  discussion_id: number;
  author_name: string;
  author_role: string;
  is_experienced_mentor: number;
  reply_text: string;
  note_reference?: string;
  created_at: string;
}

interface PeerDiscussion {
  id: number;
  user_name: string;
  user_role: string;
  domain: string;
  topic: string;
  problem_title: string;
  problem_desc: string;
  future_pitfall_warning: string;
  upvotes: number;
  created_at: string;
  replies?: PeerReply[];
}

interface StudyCircle {
  id: number;
  name: string;
  domain: string;
  active_members: number;
  topic: string;
  lead_mentor: string;
  created_at: string;
}

interface CircleMessage {
  id: number;
  circle_id: number;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
}

interface PeerLearningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAskTutorAboutDoubt?: (doubtText: string) => void;
}

export const PeerLearningModal: React.FC<PeerLearningModalProps> = ({
  isOpen,
  onClose,
  onAskTutorAboutDoubt
}) => {
  const [activeTab, setActiveTab] = useState<'discussions' | 'mentors' | 'circles' | 'ask'>('discussions');
  const [domain] = useState<string>('Computer Science & Placement');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');

  // Data state
  const [discussions, setDiscussions] = useState<PeerDiscussion[]>([]);
  const [peers, setPeers] = useState<PeerProfile[]>([]);
  const [circles, setCircles] = useState<StudyCircle[]>([]);
  const [selectedCircleId, setSelectedCircleId] = useState<number | null>(null);
  const [circleMessages, setCircleMessages] = useState<CircleMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');

  // New post state
  const [newTitle, setNewTitle] = useState('');
  const [newTopic, setNewTopic] = useState('Recursion & Stack Memory');
  const [newDesc, setNewDesc] = useState('');
  const [newPitfall, setNewPitfall] = useState('');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  // Reply state
  const [replyInputs, setReplyInputs] = useState<Record<number, string>>({});
  const [isReplying, setIsReplying] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      loadDiscussions();
      loadPeers();
      loadCircles();
    }
  }, [isOpen, selectedTopic]);

  useEffect(() => {
    if (selectedCircleId) {
      loadCircleMessages(selectedCircleId);
    }
  }, [selectedCircleId]);

  const loadDiscussions = async () => {
    try {
      const data = await api.getPeerDiscussions(selectedTopic);
      setDiscussions(data.discussions || []);
    } catch (err) {
      console.error('Failed to load discussions:', err);
    }
  };

  const loadPeers = async () => {
    try {
      const data = await api.getPeerNetwork(domain);
      setPeers(data.peers || []);
    } catch (err) {
      console.error('Failed to load peers:', err);
    }
  };

  const loadCircles = async () => {
    try {
      const data = await api.getStudyCircles(domain);
      setCircles(data.circles || []);
      if (data.circles && data.circles.length > 0 && !selectedCircleId) {
        setSelectedCircleId(data.circles[0].id);
      }
    } catch (err) {
      console.error('Failed to load circles:', err);
    }
  };

  const loadCircleMessages = async (cId: number) => {
    try {
      const data = await api.getCircleMessages(cId);
      setCircleMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to load circle messages:', err);
    }
  };

  const handleUpvote = async (dId: number) => {
    try {
      const res = await api.upvotePeerDiscussion(dId);
      setDiscussions(prev =>
        prev.map(d => (d.id === dId ? { ...d, upvotes: res.upvotes } : d))
      );
    } catch (err) {
      console.error('Upvote failed:', err);
    }
  };

  const handleSendReply = async (dId: number) => {
    const text = replyInputs[dId];
    if (!text || !text.trim()) return;

    setIsReplying(prev => ({ ...prev, [dId]: true }));
    try {
      const reply = await api.replyToPeerDiscussion(dId, {
        authorName: 'Alex Rivera',
        authorRole: '2nd Year Student (You)',
        replyText: text.trim(),
        noteReference: 'Verified in shared course notes'
      });

      setDiscussions(prev =>
        prev.map(d => {
          if (d.id === dId) {
            return {
              ...d,
              replies: [...(d.replies || []), reply]
            };
          }
          return d;
        })
      );

      setReplyInputs(prev => ({ ...prev, [dId]: '' }));
    } catch (err) {
      console.error('Reply failed:', err);
    } finally {
      setIsReplying(prev => ({ ...prev, [dId]: false }));
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    setIsSubmittingPost(true);
    try {
      await api.createPeerDiscussion({
        userName: 'Alex Rivera',
        userRole: '2nd Year Student (You)',
        domain,
        topic: newTopic,
        problemTitle: newTitle,
        problemDesc: newDesc,
        futurePitfallWarning: newPitfall || 'Be mindful of memory bounds during placement technical interviews.'
      });

      setNewTitle('');
      setNewDesc('');
      setNewPitfall('');
      setActiveTab('discussions');
      loadDiscussions();
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleSendMessageToCircle = async () => {
    if (!selectedCircleId || !newMessageText.trim()) return;
    try {
      const msg = await api.sendCircleMessage(selectedCircleId, {
        senderName: 'Alex Rivera',
        senderRole: '2nd Year Student (You)',
        message: newMessageText.trim()
      });
      setCircleMessages(prev => [...prev, msg]);
      setNewMessageText('');
    } catch (err) {
      console.error('Failed to send circle message:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-5">
      <div className="bg-white w-full max-w-5xl h-[88vh] rounded-[28px] border border-[#F2ECE4] shadow-2xl flex flex-col overflow-hidden">
        {/* Header with Domain Value */}
        <div className="p-4 sm:p-5 border-b border-[#F2ECE4] bg-[#FAF7F2] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] text-white flex items-center justify-center text-xl shadow-md">
              👥
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-[#27211E]">
                  Peer-to-Peer Learning & Study Circle
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EAF3FB] border border-[#3B82F6]/30 text-[#1E3A8A] text-[11px] font-bold">
                  Shared Domain: {domain}
                </span>
              </div>
              <p className="text-xs text-[#6B625E] mt-0.5">
                Connect with domain peers, learn from seniors who cracked placements, and discover future pitfalls.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[#065F46] bg-[#E9F7F0] px-3 py-1 rounded-full border border-[#A7F3D0]">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
              6 Peers in Domain Active
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-[#D8CEBE] text-xs flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 border-b border-[#F2ECE4] bg-white shrink-0">
          <div className="flex items-center gap-1 sm:gap-4">
            <button
              onClick={() => setActiveTab('discussions')}
              className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'discussions'
                  ? 'border-[#FF5E4D] text-[#FF5E4D]'
                  : 'border-transparent text-[#6B625E] hover:text-[#27211E]'
              }`}
            >
              <span>📋</span>
              <span>Problems & Future Pitfalls</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#FAF7F2] text-[10px] border">
                {discussions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('mentors')}
              className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'mentors'
                  ? 'border-[#FF5E4D] text-[#FF5E4D]'
                  : 'border-transparent text-[#6B625E] hover:text-[#27211E]'
              }`}
            >
              <span>🎓</span>
              <span>Experienced Seniors & Alumni</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#FAF7F2] text-[10px] border">
                {peers.filter(p => p.role.includes('Placed') || p.role.includes('Mentor') || p.role.includes('Lead')).length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('circles')}
              className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'circles'
                  ? 'border-[#FF5E4D] text-[#FF5E4D]'
                  : 'border-transparent text-[#6B625E] hover:text-[#27211E]'
              }`}
            >
              <span>💬</span>
              <span>Live Study Circles</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#FAF7F2] text-[10px] border">
                {circles.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ask')}
              className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'ask'
                  ? 'border-[#FF5E4D] text-[#FF5E4D]'
                  : 'border-transparent text-[#6B625E] hover:text-[#27211E]'
              }`}
            >
              <span>✍️</span>
              <span>Ask Domain Peers</span>
            </button>
          </div>

          <button
            onClick={() => setActiveTab('ask')}
            className="hidden md:inline-flex px-3.5 py-1.5 rounded-full bg-[#FF5E4D] text-white text-xs font-bold hover:bg-[#E84D3C] transition-all shadow-sm"
          >
            + Post Problem
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FAF7F2]/50">
          {/* TAB 1: DISCUSSIONS & FUTURE PITFALLS */}
          {activeTab === 'discussions' && (
            <div className="space-y-5 max-w-4xl mx-auto">
              {/* Topic Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#8C827A] font-medium mr-1">Filter Topic:</span>
                {['All', 'Recursion & Stack Memory', 'Call Stack & Frames', 'Base Case & Guard Clauses'].map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedTopic(t)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      selectedTopic === t
                        ? 'bg-[#27211E] text-white shadow-sm'
                        : 'bg-white text-[#6B625E] border border-[#D8CEBE] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Discussion Cards */}
              <div className="space-y-4">
                {discussions.map(disc => (
                  <div
                    key={disc.id}
                    className="bg-white rounded-2xl border border-[#F2ECE4] p-5 shadow-sm space-y-4 hover:border-[#D8CEBE] transition-all"
                  >
                    {/* Top Row: User & Role + Topic */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-[#EAF3FB] text-[#1E3A8A] font-bold text-xs flex items-center justify-center border border-[#C6E2F7]">
                          {disc.user_name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#27211E]">
                              {disc.user_name}
                            </span>
                            <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#FAF7F2] border text-[#6B625E]">
                              {disc.user_role}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#8C827A]">
                            Domain: {disc.domain} • Topic: {disc.topic}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleUpvote(disc.id)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#D8CEBE] text-xs font-bold text-[#6B625E] hover:text-[#FF5E4D] hover:border-[#FF5E4D] transition-all"
                        title="Upvote helpful problem"
                      >
                        <span>▲</span>
                        <span>{disc.upvotes}</span>
                      </button>
                    </div>

                    {/* Problem Title & Body */}
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-[#27211E] mb-1.5">
                        {disc.problem_title}
                      </h4>
                      <p className="text-xs sm:text-sm text-[#4A423E] leading-relaxed">
                        {disc.problem_desc}
                      </p>
                    </div>

                    {/* Future Pitfall Warning Banner (What you will face in future) */}
                    {disc.future_pitfall_warning && (
                      <div className="bg-[#FCF4E3] border border-[#FDE68A] rounded-xl p-3 text-xs text-[#92400E] space-y-1">
                        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-[#B45309]">
                          <span>🚨</span>
                          <span>What You Will Face in Future (Placement & Interview Alert)</span>
                        </div>
                        <p className="leading-relaxed font-medium">
                          {disc.future_pitfall_warning}
                        </p>
                      </div>
                    )}

                    {/* Replies & Senior Guidance */}
                    <div className="pt-3 border-t border-[#F2ECE4] space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#8C827A]">
                        <span>Guidance from Domain Peers & Seniors ({disc.replies?.length || 0})</span>
                        {onAskTutorAboutDoubt && (
                          <button
                            onClick={() => {
                              onAskTutorAboutDoubt(`Help me understand this peer doubt: "${disc.problem_title}". ${disc.problem_desc}`);
                              onClose();
                            }}
                            className="text-[#FF5E4D] hover:underline font-semibold"
                          >
                            Ask AI Tutor grounded in your notes →
                          </button>
                        )}
                      </div>

                      {disc.replies && disc.replies.map(r => (
                        <div
                          key={r.id}
                          className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                            r.is_experienced_mentor === 1
                              ? 'bg-[#EAF3FB]/60 border-[#BFDBFE]'
                              : 'bg-[#FAF7F2] border-[#F2ECE4]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#1E3A8A]">
                                {r.author_name}
                              </span>
                              <span className={`text-[9px] px-2 py-0.2 rounded-full font-bold ${
                                r.is_experienced_mentor === 1
                                  ? 'bg-[#1E3A8A] text-white'
                                  : 'bg-[#E2E8F0] text-[#475569]'
                              }`}>
                                {r.author_role}
                              </span>
                            </div>
                            {r.note_reference && (
                              <span className="text-[10px] font-mono font-bold text-[#B45309] bg-[#FCF4E3] px-2 py-0.5 rounded border border-[#FDE68A]">
                                📖 {r.note_reference}
                              </span>
                            )}
                          </div>
                          <p className="text-[#27211E]">
                            {r.reply_text}
                          </p>
                        </div>
                      ))}

                      {/* Add Reply Input */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={replyInputs[disc.id] || ''}
                          onChange={e => setReplyInputs(prev => ({ ...prev, [disc.id]: e.target.value }))}
                          placeholder="Write a solution or share your experience..."
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-[#D8CEBE] focus:outline-none focus:border-[#FF5E4D] bg-[#FAF7F2]"
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSendReply(disc.id);
                          }}
                        />
                        <button
                          onClick={() => handleSendReply(disc.id)}
                          disabled={isReplying[disc.id] || !replyInputs[disc.id]?.trim()}
                          className="px-3 py-1.5 rounded-xl bg-[#27211E] text-white text-xs font-semibold hover:bg-black disabled:opacity-50 transition-all"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: EXPERIENCED SENIORS & ALUMNI */}
          {activeTab === 'mentors' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="bg-[#EAF3FB] border border-[#BFDBFE] rounded-2xl p-4 text-xs text-[#1E3A8A]">
                <h4 className="font-bold text-sm mb-1">
                  🎓 Connect with Experienced Peers & Mentors in Your Domain
                </h4>
                <p>
                  These seniors and alumni belong to your domain (Computer Science & Placement). They have faced identical technical rounds, solved recurrent doubts, and are here to guide you.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {peers.map(peer => (
                  <div
                    key={peer.id}
                    className="bg-white rounded-2xl border border-[#F2ECE4] p-5 shadow-sm space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#FF5E4D] to-[#F59E0B] text-white font-extrabold text-sm flex items-center justify-center shadow-md">
                            {peer.avatar}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-[#27211E]">
                              {peer.name}
                            </h4>
                            <span className="inline-block text-[10px] font-semibold text-[#1E3A8A] bg-[#EAF3FB] px-2 py-0.5 rounded-full mt-0.5 border border-[#BFDBFE]">
                              {peer.role}
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-bold text-[#F59E0B] flex items-center gap-1 bg-[#FCF4E3] px-2 py-0.5 rounded-full border border-[#FDE68A]">
                          ★ {peer.rating.toFixed(1)}
                        </span>
                      </div>

                      <p className="text-xs text-[#6B625E] mt-3 leading-relaxed">
                        {peer.bio}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#F2ECE4] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-[#8C827A]">
                        <span>✓ {peer.problems_solved} Solved</span>
                        <span>•</span>
                        <span className={peer.status.includes('Available') ? 'text-[#065F46] font-semibold' : ''}>
                          {peer.status}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setActiveTab('circles');
                        }}
                        className="px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#D8CEBE] font-bold text-xs text-[#27211E] hover:bg-[#FF5E4D] hover:text-white hover:border-[#FF5E4D] transition-all"
                      >
                        Join Study Circle →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LIVE STUDY CIRCLES */}
          {activeTab === 'circles' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-full max-w-5xl mx-auto">
              {/* Left Column: Circles List */}
              <div className="md:col-span-5 space-y-3">
                <h4 className="font-bold text-xs text-[#8C827A] uppercase tracking-wider">
                  Active Domain Circles
                </h4>
                {circles.map(c => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCircleId(c.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedCircleId === c.id
                        ? 'bg-white border-[#FF5E4D] shadow-md ring-1 ring-[#FF5E4D]'
                        : 'bg-white border-[#F2ECE4] hover:border-[#D8CEBE]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="font-bold text-xs sm:text-sm text-[#27211E]">
                        {c.name}
                      </h5>
                      <span className="text-[10px] bg-[#E9F7F0] text-[#065F46] px-2 py-0.5 rounded-full font-bold">
                        {c.active_members} online
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B625E] mb-2">
                      Topic: {c.topic}
                    </p>
                    <div className="text-[10px] text-[#8C827A] flex items-center gap-1">
                      <span>Lead Mentor:</span>
                      <span className="font-semibold text-[#1E3A8A]">{c.lead_mentor}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column: Live Chat Room */}
              <div className="md:col-span-7 bg-white rounded-2xl border border-[#F2ECE4] p-4 flex flex-col h-[520px] shadow-sm">
                <div className="border-b border-[#F2ECE4] pb-2.5 mb-3 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-sm text-[#27211E]">
                      {circles.find(c => c.id === selectedCircleId)?.name || 'Study Circle Chat'}
                    </h5>
                    <span className="text-[11px] text-[#8C827A]">
                      Live peer-to-peer discussion • Grounded in domain curriculum
                    </span>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {circleMessages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-[#8C827A]">
                      No messages yet in this study circle. Say hello to peers!
                    </div>
                  ) : (
                    circleMessages.map(m => (
                      <div
                        key={m.id}
                        className={`p-3 rounded-2xl text-xs max-w-[85%] ${
                          m.sender_name.includes('Alex')
                            ? 'ml-auto bg-[#FF5E4D] text-white'
                            : 'mr-auto bg-[#FAF7F2] border border-[#F2ECE4] text-[#27211E]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <span className={`font-bold text-[10px] ${
                            m.sender_name.includes('Alex') ? 'text-white/90' : 'text-[#1E3A8A]'
                          }`}>
                            {m.sender_name}
                          </span>
                          <span className={`text-[9px] ${
                            m.sender_name.includes('Alex') ? 'text-white/75' : 'text-[#8C827A]'
                          }`}>
                            {m.sender_role}
                          </span>
                        </div>
                        <p className="leading-relaxed">
                          {m.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Chat Composer */}
                <div className="pt-3 border-t border-[#F2ECE4] flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessageText}
                    onChange={e => setNewMessageText(e.target.value)}
                    placeholder="Share a doubt or question with domain peers..."
                    className="flex-1 px-4 py-2 text-xs rounded-full border border-[#D8CEBE] bg-[#FAF7F2] focus:outline-none focus:border-[#FF5E4D]"
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSendMessageToCircle();
                    }}
                  />
                  <button
                    onClick={handleSendMessageToCircle}
                    disabled={!newMessageText.trim()}
                    className="px-4 py-2 rounded-full bg-[#FF5E4D] text-white text-xs font-bold hover:bg-[#E84D3C] disabled:opacity-50 transition-all shadow-sm"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ASK DOMAIN PEERS */}
          {activeTab === 'ask' && (
            <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-[#F2ECE4] p-6 shadow-sm">
              <div className="mb-5 pb-3 border-b border-[#F2ECE4]">
                <h4 className="font-extrabold text-base text-[#27211E]">
                  Ask Domain Peers & Experienced Mentors
                </h4>
                <p className="text-xs text-[#6B625E] mt-1">
                  Post what challenge you are currently facing so domain peers and seniors can guide you and share future pitfalls.
                </p>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#27211E] block mb-1">
                    Problem Title *
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Stack Overflow in Recursive Fibonacci vs Memoization"
                    className="w-full px-4 py-2 text-xs rounded-xl border border-[#D8CEBE] bg-[#FAF7F2] focus:outline-none focus:border-[#FF5E4D]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#27211E] block mb-1">
                      Topic Area
                    </label>
                    <select
                      value={newTopic}
                      onChange={e => setNewTopic(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#D8CEBE] bg-[#FAF7F2] focus:outline-none focus:border-[#FF5E4D]"
                    >
                      <option value="Recursion & Stack Memory">Recursion & Stack Memory</option>
                      <option value="Call Stack & Frames">Call Stack & Frames</option>
                      <option value="Base Case & Guard Clauses">Base Case & Guard Clauses</option>
                      <option value="Dynamic Programming & Memoization">Dynamic Programming & Memoization</option>
                      <option value="Placement Interview Preparation">Placement Interview Preparation</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#27211E] block mb-1">
                      Domain
                    </label>
                    <input
                      type="text"
                      value={domain}
                      disabled
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] bg-[#F1F5F9] text-[#64748B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#27211E] block mb-1">
                    What problem are you facing right now? *
                  </label>
                  <textarea
                    rows={4}
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="Describe your doubt, what you tried in code, and what error you encountered..."
                    className="w-full p-3 text-xs rounded-xl border border-[#D8CEBE] bg-[#FAF7F2] focus:outline-none focus:border-[#FF5E4D]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#B45309] block mb-1">
                    🚨 Future Pitfall Warning (Optional advice for peers)
                  </label>
                  <input
                    type="text"
                    value={newPitfall}
                    onChange={e => setNewPitfall(e.target.value)}
                    placeholder="e.g. Warning: Naive 2^N recursion will fail with TLE in online assessment rounds."
                    className="w-full px-4 py-2 text-xs rounded-xl border border-[#FDE68A] bg-[#FCF4E3] text-[#92400E] focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('discussions')}
                    className="px-4 py-2 rounded-full border border-[#D8CEBE] text-xs font-semibold text-[#6B625E] hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPost || !newTitle.trim() || !newDesc.trim()}
                    className="px-6 py-2 rounded-full bg-[#FF5E4D] text-white text-xs font-bold hover:bg-[#E84D3C] disabled:opacity-50 transition-all shadow-md"
                  >
                    {isSubmittingPost ? 'Posting...' : 'Post to Domain Peers'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
