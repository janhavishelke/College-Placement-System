export interface DocumentItem {
  id: number;
  title: string;
  filename: string;
  page_count: number;
  uploaded_at: string;
  reused?: boolean;
  fingerprint?: {
    sha256: string;
    reused: boolean;
    reuseCount: number;
    avoidedCostUsd: number;
    processingTimeMs: number;
    pipelineVersion: string;
    message: string;
  };
}

export interface PageItem {
  id: number;
  doc_id: number;
  page_no: number;
  text: string;
}

export interface ConceptItem {
  id: number;
  name: string;
  definition: string;
  doc_id: number | null;
  page_no: number | null;
  prerequisites: string[];
  common_confusion?: string;
  simpler_explanation?: string;
  visual_example?: string;
}

export interface CitationItem {
  docId: number;
  pageNo: number;
  excerpt: string;
}

export interface ChatItem {
  id: number;
  user_id?: number;
  doc_id?: number;
  question: string;
  answer: string;
  grounded: number; // 1 = grounded, 0 = not in notes
  citations: CitationItem[];
  cacheHit?: boolean;
  cacheLayer?: string;
  latencyMs?: number;
  avoidedCostUsd?: number;
  teachingMode?: string;
  created_at?: string;
}

export type DoubtStatus = 'unresolved' | 'resolving' | 'resolved';

export interface DoubtItem {
  id: number;
  userId: number;
  conceptName: string;
  conceptId?: number | null;
  status: DoubtStatus;
  stepsDone: string[]; // ['simpler', 'visual', 'practice']
  createdAt: string;
  resolvedAt?: string | null;
  docId?: number;
  pageNo?: number;
  simplerExplanation?: string;
  visualExample?: string;
}

export interface KeyIdea {
  id: number;
  text: string;
  keywords: string[];
  gap: string;
}

export interface VerificationTask {
  id: number;
  concept_name: string;
  prompt: string;
  key_ideas: KeyIdea[];
}

export interface VerificationResult {
  id: number;
  conceptName: string;
  prompt?: string;
  studentAnswer: string;
  keyIdeas: string[];
  ticks: boolean[];
  gaps: string[];
  createdAt: string;
}

export interface InterruptionItem {
  id: number;
  userId: number;
  rule: string;
  triggerEvidence: string;
  suggestionText: string;
  status: 'shown' | 'accepted' | 'dismissed';
  createdAt: string;
}

export interface VoiceSession {
  sessionId: number;
  conceptName: string;
  chunks: string[];
  chunkIndex: number;
  bookmark: number;
  status: 'speaking' | 'paused' | 'resumed' | 'finished';
  interruption?: string | null;
  interruptionAnswer?: string | null;
  citations?: CitationItem[];
}

// Universal Document Fingerprint (Feature 8)
export interface FingerprintItem {
  id: number;
  sha256_hash: string;
  title: string;
  file_type: string;
  file_size_bytes: number;
  page_count: number;
  pipeline_version: string;
  status: string;
  extracted_summary?: string;
  chunk_count: number;
  embedding_model: string;
  processing_time_ms: number;
  reuse_count: number;
  avoided_cost_usd: number;
  user_associations?: number;
  created_at: string;
}

// Cost Intelligence Dashboard Data (Feature 12)
export interface CostDashboardData {
  organization: {
    id: number;
    name: string;
    plan: string;
    monthlyBudgetUsd: number;
    currentSpendUsd: number;
    remainingBudgetUsd: number;
    budgetUtilizationPercent: number;
    activeLearners: number;
  };
  kpis: {
    totalRequests: number;
    totalTokensIn: number;
    totalTokensOut: number;
    modelExpenditureUsd: number;
    avoidedExpenditureUsd: number;
    netSavingsPercent: number;
    costPerActiveLearnerUsd: number;
    avgCachedLatencyMs: number;
    avgModelLatencyMs: number;
  };
  cachePerformance: {
    overallCacheHitRatePercent: number;
    exactCacheHitRatePercent: number;
    semanticCacheHitRatePercent: number;
    retrievalCacheCount: number;
    fingerprintReuses: number;
    modelMissesCount: number;
  };
  fingerprintReuseStats: {
    uniqueDocumentsIndexed: number;
    artifactReuseEvents: number;
    avoidedProcessingUsd: number;
    baselineDocumentCost: string;
  };
  recentLogs: Array<{
    id: number;
    request_type: string;
    model_used: string;
    cost_usd: number;
    avoided_cost_usd: number;
    cache_layer_hit: string;
    latency_ms: number;
    teaching_mode?: string;
    created_at: string;
  }>;
  pricingBaseline: Record<string, number>;
}

// Organization & Classroom Intelligence Data (Feature 13, 14, 15)
export interface OrgSummaryData {
  organization: {
    id: number;
    name: string;
    slug: string;
    plan: string;
    domain?: string;
  };
  courses: Array<{
    id: number;
    name: string;
    code: string;
    description: string;
    instructor_name?: string;
  }>;
  sharedDocuments: DocumentItem[];
  metrics: {
    totalCourses: number;
    enrolledStudents: number;
    activeFaculty: number;
    sharedDocumentCount: number;
  };
}

export interface ClassroomIntelligenceData {
  courseId: number;
  courseName: string;
  cohortSize: number;
  activeParticipationRatePercent: number;
  misunderstoodConcepts: Array<{
    conceptName: string;
    strugglingLearnersPercent: number;
    commonError: string;
    recommendedRemedy: string;
    revisionPriority: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  masteryDistribution: {
    demonstratedUnderstanding: number;
    improving: number;
    needsPractice: number;
  };
  privacySafeguard: {
    kAnonymityThreshold: number;
    privateConversationsExposed: boolean;
    individualStudentTrackingDisabledInClassroomView: boolean;
    message: string;
  };
}

export interface CorporateModeData {
  mode: string;
  activeEmployees: number;
  totalSOPs: number;
  averageVerificationPassingRatePercent: number;
  complianceTrainingCompletionPercent: number;
  sops: Array<{
    id: number;
    title: string;
    version: string;
    pages: number;
    completionRatePercent: number;
    avgKnowledgeCheckScore: number;
    mostQueriedSection: string;
  }>;
  aiCostAvoidance: {
    totalAvoidedThroughSOPReuseUsd: number;
    cacheHitRateOnSOPQueriesPercent: number;
  };
}

// Confusion Fingerprint (Feature 3)
export type ConceptStatusType = 'not_assessed' | 'needs_practice' | 'improving' | 'demonstrated_understanding' | 'needs_reassessment';

export interface ConfusionProfileItem {
  id: number;
  conceptName: string;
  status: ConceptStatusType;
  struggleCount: number;
  correctCount: number;
  reasoningErrors: string[];
  lastAssessedAt?: string;
  notes?: string;
}

export interface ConfusionProfileData {
  user: { id: number; name: string };
  summary: {
    totalConcepts: number;
    demonstratedUnderstanding: number;
    improving: number;
    needsPractice: number;
    needsReassessment: number;
    notAssessed: number;
  };
  concepts: ConfusionProfileItem[];
}

// Learning Rescue (Feature 4)
export interface RescueStateData {
  id: number;
  user_id: number;
  concept_name: string;
  missing_prerequisite: string;
  diagnostic_question: string;
  diagnostic_response?: string | null;
  refinement_hypothesis?: string | null;
  remedial_explanation?: string | null;
  practice_problem?: string | null;
  practice_response?: string | null;
  status: 'active' | 'completed';
}

// Proof of Understanding (Feature 7)
export interface ProofRubricCriterion {
  criterion: string;
  points: number;
}

export interface ProofTask {
  id: number;
  conceptName: string;
  taskType: 'own_words' | 'changed_scenario' | 'find_error' | 'defend_step';
  prompt: string;
  rubric: ProofRubricCriterion[];
  sampleSolution: string;
}

export interface ProofEvaluationResult {
  taskId: number;
  taskType: string;
  conceptName: string;
  studentAnswer: string;
  masteryPercent: number;
  masteryLevel: string;
  criteriaEvaluations: Array<{
    criterion: string;
    maxPoints: number;
    awardedPoints: number;
    passed: boolean;
    feedbackNote: string;
  }>;
  evidenceSummary: string;
  sampleSolution: string;
}

// Document Collections & Cross-Document Comparison (Feature 1)
export interface DocumentCollectionItem {
  id: number;
  name: string;
  code: string;
  description: string;
  documents: Array<{
    id: number;
    title: string;
    filename: string;
    page_count: number;
  }>;
}

export interface DocumentComparisonResult {
  conceptName: string;
  documentsCompared: number;
  sources: Array<{
    docId: number;
    docTitle: string;
    pageNo: number;
    excerpt: string;
    coverageType: string;
  }>;
  synthesis: string;
}

// Study Alarms & Scheduled Reminders
export interface StudyAlarmItem {
  id: number;
  userId?: number;
  title: string;
  conceptName: string;
  scheduledTime: string; // ISO timestamp
  soundEnabled: boolean;
  status: 'active' | 'scheduled' | 'ringing' | 'completed' | 'dismissed';
  createdAt?: string;
}

