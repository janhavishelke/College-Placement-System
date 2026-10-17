-- Unera SQLite Schema
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  page_count INTEGER NOT NULL,
  uploaded_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doc_id INTEGER NOT NULL,
  page_no INTEGER NOT NULL,
  text TEXT NOT NULL,
  UNIQUE(doc_id, page_no),
  FOREIGN KEY(doc_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS concepts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  definition TEXT NOT NULL,
  doc_id INTEGER,
  page_no INTEGER,
  prerequisites TEXT, -- JSON array of concept names
  common_confusion TEXT,
  simpler_explanation TEXT,
  visual_example TEXT,
  FOREIGN KEY(doc_id) REFERENCES documents(id)
);

CREATE TABLE IF NOT EXISTS qa_pairs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  grounded INTEGER NOT NULL DEFAULT 1, -- 1 = grounded in notes, 0 = not in notes
  doc_id INTEGER,
  page_no INTEGER,
  excerpt TEXT,
  FOREIGN KEY(doc_id) REFERENCES documents(id)
);

CREATE TABLE IF NOT EXISTS chats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  doc_id INTEGER,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  grounded INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(doc_id) REFERENCES documents(id)
);

CREATE TABLE IF NOT EXISTS citations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id INTEGER NOT NULL,
  doc_id INTEGER NOT NULL,
  page_no INTEGER NOT NULL,
  excerpt TEXT NOT NULL,
  FOREIGN KEY(chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  FOREIGN KEY(doc_id) REFERENCES documents(id)
);

CREATE TABLE IF NOT EXISTS doubts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  concept_name TEXT NOT NULL,
  concept_id INTEGER,
  status TEXT NOT NULL DEFAULT 'unresolved', -- 'unresolved', 'resolving', 'resolved'
  steps_done TEXT NOT NULL DEFAULT '[]', -- JSON array of steps: 'simpler', 'visual', 'practice'
  created_at TEXT NOT NULL,
  resolved_at TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(concept_id) REFERENCES concepts(id)
);

CREATE TABLE IF NOT EXISTS verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  concept_name TEXT NOT NULL,
  student_answer TEXT NOT NULL,
  key_ideas TEXT NOT NULL, -- JSON array of 3 key ideas
  ticks TEXT NOT NULL, -- JSON array of booleans [t1, t2, t3]
  gaps TEXT NOT NULL, -- JSON array of gap descriptions
  created_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS interruptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  rule TEXT NOT NULL,
  trigger_evidence TEXT NOT NULL,
  suggestion_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'shown', -- 'shown', 'accepted', 'dismissed'
  created_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS voice_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  concept_name TEXT NOT NULL,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  bookmark INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'speaking', -- 'speaking', 'paused', 'resumed', 'finished'
  last_interruption TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS learning_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL DEFAULT 1,
  doc_id INTEGER DEFAULT 1,
  page_no INTEGER DEFAULT 2,
  selected_passage TEXT,
  active_concept TEXT DEFAULT 'Recursion',
  lesson_step TEXT DEFAULT 'reading',
  unresolved_question TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(doc_id) REFERENCES documents(id)
);


-- UNERA Extended Schema for Cost-Intelligent Knowledge Infrastructure, Multi-Tenancy, and Adaptive Learning

-- Organizations & Institution Mode (Feature 13, 14, 15)
CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT,
  plan TEXT NOT NULL DEFAULT 'enterprise_edu',
  monthly_budget_usd REAL NOT NULL DEFAULT 50.00,
  current_spend_usd REAL NOT NULL DEFAULT 4.12,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  instructor_name TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Universal Document Fingerprint & Content-Addressed Processing Artifacts (Feature 8, 9)
CREATE TABLE IF NOT EXISTS document_fingerprints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sha256_hash TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'pdf',
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  page_count INTEGER NOT NULL,
  pipeline_version TEXT NOT NULL DEFAULT 'v3.2.0',
  status TEXT NOT NULL DEFAULT 'completed', -- 'pending', 'processing', 'completed', 'failed'
  extracted_summary TEXT,
  metadata_json TEXT,
  chunk_count INTEGER NOT NULL DEFAULT 0,
  embedding_model TEXT NOT NULL DEFAULT 'text-embedding-3-small',
  processing_time_ms INTEGER NOT NULL DEFAULT 0,
  reuse_count INTEGER NOT NULL DEFAULT 0,
  avoided_cost_usd REAL NOT NULL DEFAULT 0.0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS processing_chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fingerprint_id INTEGER NOT NULL,
  chunk_index INTEGER NOT NULL,
  page_no INTEGER NOT NULL,
  text TEXT NOT NULL,
  embedding_vector_json TEXT,
  token_count INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(fingerprint_id) REFERENCES document_fingerprints(id) ON DELETE CASCADE
);

-- User Document Association & Scope (Feature 9: Shared Knowledge, Separate Users)
CREATE TABLE IF NOT EXISTS user_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  org_id INTEGER DEFAULT 1,
  course_id INTEGER,
  doc_id INTEGER NOT NULL,
  fingerprint_id INTEGER,
  display_title TEXT NOT NULL,
  access_scope TEXT NOT NULL DEFAULT 'private', -- 'global', 'org', 'course', 'private'
  created_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(org_id) REFERENCES organizations(id),
  FOREIGN KEY(course_id) REFERENCES courses(id),
  FOREIGN KEY(doc_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY(fingerprint_id) REFERENCES document_fingerprints(id)
);

-- Layered Answer Cache (Feature 10: Layer A Exact, Layer B Semantic, Layer C Retrieval)
CREATE TABLE IF NOT EXISTS answer_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cache_key TEXT UNIQUE NOT NULL,
  layer TEXT NOT NULL, -- 'A_EXACT', 'B_SEMANTIC', 'C_RETRIEVAL'
  doc_fingerprint TEXT NOT NULL,
  org_id INTEGER DEFAULT 1,
  question_normalized TEXT NOT NULL,
  question_embedding_json TEXT,
  answer TEXT NOT NULL,
  citations_json TEXT NOT NULL DEFAULT '[]',
  teaching_mode TEXT NOT NULL DEFAULT 'standard',
  grounded INTEGER NOT NULL DEFAULT 1,
  hit_count INTEGER NOT NULL DEFAULT 0,
  last_hit_at TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT,
  is_valid INTEGER NOT NULL DEFAULT 1
);

-- Cost Intelligence, Model Gateway & Avoided Expenditure Tracking (Feature 11, 12)
CREATE TABLE IF NOT EXISTS cost_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER DEFAULT 1,
  user_id INTEGER DEFAULT 1,
  course_id INTEGER,
  request_type TEXT NOT NULL, -- 'chat_query', 'doc_processing', 'voice_chunk', 'verification', 'rescue_diagnostic'
  model_used TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
  tokens_in INTEGER NOT NULL DEFAULT 0,
  tokens_out INTEGER NOT NULL DEFAULT 0,
  cost_usd REAL NOT NULL DEFAULT 0.0,
  avoided_cost_usd REAL NOT NULL DEFAULT 0.0,
  cache_layer_hit TEXT, -- 'A_EXACT', 'B_SEMANTIC', 'C_RETRIEVAL', 'NONE_MODEL_MISS', 'FINGERPRINT_REUSE'
  latency_ms INTEGER NOT NULL DEFAULT 0,
  teaching_mode TEXT DEFAULT 'standard',
  created_at TEXT NOT NULL
);

-- Confusion Fingerprint / Persistent Learning Profile (Feature 3)
CREATE TABLE IF NOT EXISTS learning_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  concept_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_assessed', -- 'not_assessed', 'needs_practice', 'improving', 'demonstrated_understanding', 'needs_reassessment'
  struggle_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  reasoning_errors_json TEXT NOT NULL DEFAULT '[]',
  last_assessed_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, concept_name),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Learning Rescue Engine Interventions (Feature 4)
CREATE TABLE IF NOT EXISTS learning_rescues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  concept_name TEXT NOT NULL,
  missing_prerequisite TEXT NOT NULL,
  diagnostic_question TEXT NOT NULL,
  diagnostic_response TEXT,
  refinement_hypothesis TEXT,
  remedial_explanation TEXT,
  practice_problem TEXT,
  practice_response TEXT,
  intervention_effective INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed'
  created_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Proof of Understanding Tasks (Feature 7)
CREATE TABLE IF NOT EXISTS proof_of_understanding_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  concept_name TEXT NOT NULL,
  task_type TEXT NOT NULL, -- 'own_words', 'changed_scenario', 'find_error', 'defend_step'
  prompt TEXT NOT NULL,
  rubric_json TEXT NOT NULL,
  sample_solution TEXT NOT NULL
);

-- Document Collections & Cross-Document Comparator (Feature 1)
CREATE TABLE IF NOT EXISTS document_collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER DEFAULT 1,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS collection_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  collection_id INTEGER NOT NULL,
  doc_id INTEGER NOT NULL,
  UNIQUE(collection_id, doc_id),
  FOREIGN KEY(collection_id) REFERENCES document_collections(id) ON DELETE CASCADE,
  FOREIGN KEY(doc_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS document_comparisons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  concept_name TEXT NOT NULL,
  doc_ids_json TEXT NOT NULL,
  comparison_text TEXT NOT NULL,
  created_at TEXT NOT NULL
);
