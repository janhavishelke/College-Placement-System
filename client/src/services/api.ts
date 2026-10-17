import {
  DocumentItem,
  PageItem,
  ConceptItem,
  ChatItem,
  DoubtItem,
  VerificationTask,
  VerificationResult,
  InterruptionItem,
  VoiceSession,
  FingerprintItem,
  CostDashboardData,
  OrgSummaryData,
  ClassroomIntelligenceData,
  CorporateModeData,
  ConfusionProfileData,
  ConceptStatusType,
  RescueStateData,
  ProofTask,
  ProofEvaluationResult,
  DocumentCollectionItem,
  DocumentComparisonResult,
  StudyAlarmItem
} from '../types';


const BASE_URL = '/api';

export const api = {
  // Health
  async getHealth() {
    const res = await fetch(`${BASE_URL}/health`);
    return res.json();
  },

  // Documents & Universal Fingerprints (Feature 8 & 9)
  async getDocuments(): Promise<DocumentItem[]> {
    const res = await fetch(`${BASE_URL}/documents`);
    return res.json();
  },

  async getDocumentPages(docId: number): Promise<{ document: DocumentItem; pages: PageItem[] }> {
    const res = await fetch(`${BASE_URL}/documents/${docId}/pages`);
    return res.json();
  },

  async getDocumentFingerprints(): Promise<FingerprintItem[]> {
    const res = await fetch(`${BASE_URL}/documents/fingerprints`);
    return res.json();
  },

  async getDocumentCollections(): Promise<DocumentCollectionItem[]> {
    const res = await fetch(`${BASE_URL}/documents/collections`);
    return res.json();
  },

  async compareDocuments(conceptName: string, docIds?: number[]): Promise<DocumentComparisonResult> {
    const res = await fetch(`${BASE_URL}/documents/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conceptName, docIds })
    });
    return res.json();
  },

  async uploadDocument(file: File, title?: string): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    const res = await fetch(`${BASE_URL}/documents/upload`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },

  async uploadTextDocument(title: string, content: string): Promise<DocumentItem> {
    const res = await fetch(`${BASE_URL}/documents/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    });
    return res.json();
  },

  // Concepts
  async getConcepts(): Promise<ConceptItem[]> {
    const res = await fetch(`${BASE_URL}/concepts`);
    return res.json();
  },

  async getConcept(name: string): Promise<ConceptItem> {
    const res = await fetch(`${BASE_URL}/concepts/${encodeURIComponent(name)}`);
    return res.json();
  },

  // Chat & Adaptive Teaching Modes (Feature 5 & 10)
  async sendChat(question: string, docId?: number, teachingMode: string = 'standard'): Promise<ChatItem> {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, docId, teachingMode })
    });
    return res.json();
  },

  async getChats(): Promise<ChatItem[]> {
    const res = await fetch(`${BASE_URL}/chats`);
    return res.json();
  },

  async getCacheStatus() {
    const res = await fetch(`${BASE_URL}/chat/cache-status`);
    return res.json();
  },

  async toggleCache(enabled?: boolean) {
    const res = await fetch(`${BASE_URL}/chat/cache-toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
    return res.json();
  },

  // Cost Intelligence Dashboard (Feature 11 & 12)
  async getCostDashboard(orgId: number = 1): Promise<CostDashboardData> {
    const res = await fetch(`${BASE_URL}/cost/dashboard?orgId=${orgId}`);
    return res.json();
  },

  async updateBudget(orgId: number, monthlyBudgetUsd: number) {
    const res = await fetch(`${BASE_URL}/cost/budget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId, monthlyBudgetUsd })
    });
    return res.json();
  },

  // Organization & Classroom Intelligence (Feature 13, 14, 15)
  async getOrgSummary(orgId: number = 1): Promise<OrgSummaryData> {
    const res = await fetch(`${BASE_URL}/org/summary?orgId=${orgId}`);
    return res.json();
  },

  async getClassroomIntelligence(courseId: number = 1): Promise<ClassroomIntelligenceData> {
    const res = await fetch(`${BASE_URL}/org/classroom-intelligence?courseId=${courseId}`);
    return res.json();
  },

  async getCorporateMode(): Promise<CorporateModeData> {
    const res = await fetch(`${BASE_URL}/org/corporate-mode`);
    return res.json();
  },

  // Confusion Fingerprint & Learning Profile (Feature 3)
  async getConfusionProfile(userId: number = 1): Promise<ConfusionProfileData> {
    const res = await fetch(`${BASE_URL}/profile/confusion-fingerprint?userId=${userId}`);
    return res.json();
  },

  async updateConceptStatus(conceptName: string, newStatus: ConceptStatusType, studentNote?: string) {
    const res = await fetch(`${BASE_URL}/profile/concept-status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conceptName, newStatus, studentNote })
    });
    return res.json();
  },

  async resetLearningProfile(conceptName?: string) {
    const res = await fetch(`${BASE_URL}/profile/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conceptName })
    });
    return res.json();
  },

  // Learning Rescue Engine (Feature 4)
  async getRescueState(conceptName: string = 'Recursion'): Promise<RescueStateData> {
    const res = await fetch(`${BASE_URL}/rescue/state?conceptName=${encodeURIComponent(conceptName)}`);
    return res.json();
  },

  async submitRescueDiagnostic(conceptName: string, responseText: string) {
    const res = await fetch(`${BASE_URL}/rescue/submit-diagnostic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conceptName, responseText })
    });
    return res.json();
  },

  async submitRescuePractice(conceptName: string, practiceResponse: string) {
    const res = await fetch(`${BASE_URL}/rescue/submit-practice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conceptName, practiceResponse })
    });
    return res.json();
  },

  // Proof of Understanding (Feature 7)
  async getProofTasks(conceptName: string = 'Recursion'): Promise<ProofTask[]> {
    const res = await fetch(`${BASE_URL}/proof-of-understanding/tasks?conceptName=${encodeURIComponent(conceptName)}`);
    return res.json();
  },

  async evaluateProof(taskId: number, studentAnswer: string, conceptName?: string): Promise<ProofEvaluationResult> {
    const res = await fetch(`${BASE_URL}/proof-of-understanding/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, studentAnswer, conceptName })
    });
    return res.json();
  },

  // Doubts
  async getDoubts(status?: string): Promise<DoubtItem[]> {
    const url = status ? `${BASE_URL}/doubts?status=${status}` : `${BASE_URL}/doubts`;
    const res = await fetch(url);
    return res.json();
  },

  async createDoubt(conceptName: string): Promise<DoubtItem> {
    const res = await fetch(`${BASE_URL}/doubts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conceptName })
    });
    return res.json();
  },

  async updateDoubtStep(id: number, step: 'simpler' | 'visual' | 'practice'): Promise<DoubtItem> {
    const res = await fetch(`${BASE_URL}/doubts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step })
    });
    return res.json();
  },

  async resolveDoubt(id: number): Promise<DoubtItem> {
    const res = await fetch(`${BASE_URL}/doubts/${id}/resolve`, {
      method: 'PATCH'
    });
    return res.json();
  },

  // Verification Engine
  async getVerificationTasks(): Promise<VerificationTask[]> {
    const res = await fetch(`${BASE_URL}/verify/tasks`);
    return res.json();
  },

  async getVerificationTask(conceptName: string): Promise<VerificationTask> {
    const res = await fetch(`${BASE_URL}/verify/task/${encodeURIComponent(conceptName)}`);
    return res.json();
  },

  async verifyAnswer(conceptName: string, studentAnswer: string): Promise<VerificationResult> {
    const res = await fetch(`${BASE_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conceptName, studentAnswer })
    });
    return res.json();
  },

  async getVerificationHistory(): Promise<VerificationResult[]> {
    const res = await fetch(`${BASE_URL}/verify/history`);
    return res.json();
  },

  // Context-Aware Interruptions
  async checkInterruptions(conceptName?: string): Promise<InterruptionItem | null> {
    const res = await fetch(`${BASE_URL}/interruptions/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conceptName })
    });
    return res.json();
  },

  async acceptInterruption(id: number): Promise<InterruptionItem> {
    const res = await fetch(`${BASE_URL}/interruptions/${id}/accept`, {
      method: 'POST'
    });
    return res.json();
  },

  async dismissInterruption(id: number): Promise<InterruptionItem> {
    const res = await fetch(`${BASE_URL}/interruptions/${id}/dismiss`, {
      method: 'POST'
    });
    return res.json();
  },

  // Voice Sessions
  async startVoice(conceptName?: string): Promise<VoiceSession> {
    const res = await fetch(`${BASE_URL}/voice/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conceptName })
    });
    return res.json();
  },

  async pauseVoice(sessionId: number, chunkIndex: number, interruption?: string): Promise<VoiceSession> {
    const res = await fetch(`${BASE_URL}/voice/pause`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, chunkIndex, interruption })
    });
    return res.json();
  },

  async resumeVoice(sessionId: number): Promise<VoiceSession> {
    const res = await fetch(`${BASE_URL}/voice/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
    return res.json();
  },

  // Study Artifacts
  async getArtifacts(): Promise<{ flashcards: any[]; keyPoints: any[] }> {
    const res = await fetch(`${BASE_URL}/artifacts`);
    return res.json();
  },

  // Study Alarms & Scheduled Reminders
  async getAlarms(): Promise<StudyAlarmItem[]> {
    const res = await fetch(`${BASE_URL}/alarms`);
    return res.json();
  },

  async createAlarm(title: string, scheduledTime: string, conceptName?: string, soundEnabled: boolean = true): Promise<StudyAlarmItem> {
    const res = await fetch(`${BASE_URL}/alarms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, scheduledTime, conceptName, soundEnabled })
    });
    return res.json();
  },

  async updateAlarm(
    id: number,
    statusOrOpts?: string | { status?: string; snoozeMinutes?: number },
    snoozeMinutes?: number
  ): Promise<any> {
    const payload =
      typeof statusOrOpts === 'object' && statusOrOpts !== null
        ? statusOrOpts
        : { status: statusOrOpts, snoozeMinutes };

    const res = await fetch(`${BASE_URL}/alarms/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async deleteAlarm(id: number): Promise<any> {
    const res = await fetch(`${BASE_URL}/alarms/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Peer-to-Peer Learning Network & Study Circle
  async getPeerProfile(): Promise<any> {
    const res = await fetch(`${BASE_URL}/peers/profile`);
    return res.json();
  },

  async getPeerNetwork(domain?: string): Promise<{ domain: string; peers: any[] }> {
    const url = domain ? `${BASE_URL}/peers/network?domain=${encodeURIComponent(domain)}` : `${BASE_URL}/peers/network`;
    const res = await fetch(url);
    return res.json();
  },

  async getPeerDiscussions(topic?: string): Promise<{ domain: string; discussions: any[] }> {
    const url = topic && topic !== 'All' ? `${BASE_URL}/peers/discussions?topic=${encodeURIComponent(topic)}` : `${BASE_URL}/peers/discussions`;
    const res = await fetch(url);
    return res.json();
  },

  async createPeerDiscussion(data: {
    userName?: string;
    userRole?: string;
    domain?: string;
    topic: string;
    problemTitle: string;
    problemDesc: string;
    futurePitfallWarning?: string;
  }): Promise<any> {
    const res = await fetch(`${BASE_URL}/peers/discussions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async replyToPeerDiscussion(discussionId: number, data: {
    authorName?: string;
    authorRole?: string;
    isExperiencedMentor?: boolean;
    replyText: string;
    noteReference?: string;
  }): Promise<any> {
    const res = await fetch(`${BASE_URL}/peers/discussions/${discussionId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async upvotePeerDiscussion(discussionId: number): Promise<any> {
    const res = await fetch(`${BASE_URL}/peers/discussions/${discussionId}/upvote`, {
      method: 'POST'
    });
    return res.json();
  },

  async getStudyCircles(domain?: string): Promise<{ domain: string; circles: any[] }> {
    const url = domain ? `${BASE_URL}/peers/circles?domain=${encodeURIComponent(domain)}` : `${BASE_URL}/peers/circles`;
    const res = await fetch(url);
    return res.json();
  },

  async getCircleMessages(circleId: number): Promise<{ circleId: number; messages: any[] }> {
    const res = await fetch(`${BASE_URL}/peers/circles/${circleId}/messages`);
    return res.json();
  },

  async sendCircleMessage(circleId: number, data: { senderName?: string; senderRole?: string; message: string }): Promise<any> {
    const res = await fetch(`${BASE_URL}/peers/circles/${circleId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  }
};


