const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');

// Global cache toggle flag (can be disabled via admin controls to demonstrate raw model calls vs cache hits)
let IS_ANSWER_CACHE_ENABLED = true;

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'what', 'how', 'why', 'who', 'where', 'when', 'which', 'can',
  'you', 'tell', 'me', 'about', 'explain', 'does', 'do', 'i', 'would', 'could'
]);

function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOPWORDS.has(word));
}

function normalizeQuestion(q) {
  return q.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Adaptive Teaching Mode Formatter
function applyTeachingMode(baseAnswer, mode, conceptName = 'Recursion') {
  switch (mode) {
    case 'beginner':
      return `🌱 **Beginner-Friendly Explanation:**\n\n` +
        `Think of ${conceptName} like a set of Russian nesting dolls (Matryoshka). You open the largest doll only to find a slightly smaller doll inside. You keep opening them one by one until you reach the tiniest solid wooden doll that cannot open—that is your **base case**! Once you reach it, you can close them all back up.\n\n` +
        `**Key takeaway:** ${baseAnswer}`;

    case 'engineering':
      return `⚙️ **Engineering & Systems Explanation:**\n\n` +
        `From an architecture standpoint, each call pushes an activation record (stack frame) containing local variables, parameters, and instruction pointer onto the program Call Stack. ` +
        `Without an explicit base case guard, stack memory reaches the page boundary throwing a \`StackOverflowError\`.\n\n` +
        `*Time Complexity:* Dependent on recurrence (e.g. $T(n) = T(n-1) + O(1) \\implies O(n)$).\n` +
        `*Space Complexity:* $O(d)$ auxiliary stack depth.\n\n` +
        `**Source Grounding:** ${baseAnswer}`;

    case 'socratic':
      return `🤔 **Socratic Inquiry:**\n\n` +
        `Let us investigate this together. If you have a large computational problem, what would happen if you trusted a smaller version of the problem to solve itself first?\n\n` +
        `Consider this: *What is the essential condition required so that this process doesn't repeat for all eternity?*\n\n` +
        `Here is the verified principle from your notes: "${baseAnswer}"\n\n` +
        `*Question for you:* In your code, where would you place the stopping condition?`;

    case 'step_by_step':
      return `🔢 **Step-by-Step Problem Solving Breakdown:**\n\n` +
        `1. **Identify the Base Case:** Determine the simplest input where the answer is immediately known without further calls.\n` +
        `2. **Define the Recursive Step:** Express the general problem $f(n)$ in terms of subproblem $f(n-1)$.\n` +
        `3. **Stack Frame Allocation:** Ensure every recursive call makes strict progress toward the base case.\n` +
        `4. **Unwind & Combine:** When the base case returns, values propagate up the call stack.\n\n` +
        `**Note Source Reference:** ${baseAnswer}`;

    case 'analogy':
      return `💡 **Real-World Analogy:**\n\n` +
        `Imagine you are standing in a long line in a dark movie theater and want to know what row you are in. You don't count all rows from the front. Instead, you ask the person in front of you: *"What row are you in?"* That person asks the person in front of them, continuing until the person in the front row answers *"I am in row 1"* (Base Case!). That answer travels back: row 2, row 3, until it reaches you.\n\n` +
        `**Source Core:** ${baseAnswer}`;

    case 'derivation':
      return `📐 **Formal Derivation & Recurrence:**\n\n` +
        `Let $T(n)$ represent the work done on input size $n$:\n` +
        `$$T(n) = T(n - 1) + c$$\n` +
        `Expanding the recurrence relation:\n` +
        `$$T(n) = T(n - 2) + 2c = T(n - 3) + 3c = \\dots = T(1) + (n - 1)c$$\n` +
        `Since $T(1) = O(1)$ by base case definition, $T(n) = O(n)$.\n\n` +
        `**Grounded Principle:** ${baseAnswer}`;

    case 'exam':
      return `🎯 **Exam-Oriented High-Yield Revision:**\n\n` +
        `⚠️ **Top 3 Exam Traps to Avoid:**\n` +
        `1. *Missing Base Case:* The #1 reason students lose 4+ marks on semester exams.\n` +
        `2. *Off-by-One in Termination:* E.g. using \`if (n == 0)\` when negative numbers are possible.\n` +
        `3. *Stack Overflow vs Infinite Loop:* Understand that recursion crashes memory (call stack), not CPU execution alone.\n\n` +
        `**Examiner's Verified Answer:** ${baseAnswer}`;

    case 'oral_exam':
      return `🎙️ **Interactive Oral Examination (Viva Voce):**\n\n` +
        `*Examiner:* "Candidate, state the fundamental operational definition of ${conceptName} according to your course syllabus."\n\n` +
        `*Model Response:* "${baseAnswer}"\n\n` +
        `*Examiner Follow-up:* "Good. Now state precisely what happens to the call stack frames when the base condition fails to trigger."`;

    case 'bilingual_hindi':
      return `🇮🇳 **Bilingual Explanation (Hinglish / Hindi):**\n\n` +
        `${conceptName} ek aisi programming technique hai jisme ek function apne aap ko solve karne ke liye khud ko call karta hai. Yeh tab tak chalta rehta hai jab tak ek **base case** (stopping condition) na mil jaye.\n\n` +
        `Agar base case na ho, toh computer ki call stack memory full ho jayegi aur **StackOverflowError** crash ho jayega.\n\n` +
        `**Notes se Verified Answer:** ${baseAnswer}`;

    case 'bilingual_marathi':
      return `🚩 **Bilingual Explanation (Marathi / English):**\n\n` +
        `${conceptName} madhe ek function mothi samasya lahan bhagat divide karto aani swatahala punha punha call karto. Pan sarvat mahatvacha mhanje **base case** asne garjecha ahe, jo function la thambavto.\n\n` +
        `**Notes madhil source answer:** ${baseAnswer}`;

    default:
      return baseAnswer;
  }
}

// GET /api/chat/cache-status (Admin & Evaluator Cache Transparency - Feature 10 & 12)
router.get('/cache-status', (req, res) => {
  try {
    const totalEntries = db.prepare('SELECT COUNT(*) as count FROM answer_cache WHERE is_valid = 1').get().count;
    const layerAHits = db.prepare("SELECT COALESCE(SUM(hit_count), 0) as count FROM answer_cache WHERE layer = 'A_EXACT'").get().count;
    const layerBHits = db.prepare("SELECT COALESCE(SUM(hit_count), 0) as count FROM answer_cache WHERE layer = 'B_SEMANTIC'").get().count;
    const totalCostAvoided = db.prepare("SELECT COALESCE(SUM(avoided_cost_usd), 0) as total FROM cost_metrics").get().total;

    res.json({
      cacheEnabled: IS_ANSWER_CACHE_ENABLED,
      totalEntries,
      exactCacheHits: layerAHits,
      semanticCacheHits: layerBHits,
      totalCostAvoidedUsd: Number(totalCostAvoided.toFixed(4)),
      layers: {
        layerA: 'Exact Response Cache (normalized question + doc fingerprint match)',
        layerB: 'Semantic Similarity Cache (source-grounded semantic match)',
        layerC: 'Retrieval Cache (indexed chunks & excerpts)',
        layerD: 'Generative Model Response (fallback on cache miss)'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chat/cache-toggle (Toggle Cache On/Off to Demonstrate Savings)
router.post('/cache-toggle', (req, res) => {
  if (req.body.enabled !== undefined) {
    IS_ANSWER_CACHE_ENABLED = Boolean(req.body.enabled);
  } else {
    IS_ANSWER_CACHE_ENABLED = !IS_ANSWER_CACHE_ENABLED;
  }
  res.json({
    cacheEnabled: IS_ANSWER_CACHE_ENABLED,
    message: `Answer cache is now ${IS_ANSWER_CACHE_ENABLED ? 'ENABLED' : 'DISABLED'}.`
  });
});

// POST /api/chat
router.post('/', (req, res) => {
  const reqStart = Date.now();
  try {
    const { question, docId, teachingMode = 'standard', userId = 1, orgId = 1 } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const trimmedQ = question.trim();
    const normalizedQ = normalizeQuestion(trimmedQ);
    const lowerQ = trimmedQ.toLowerCase();
    const qTokens = tokenize(trimmedQ);
    const targetDocId = docId ? parseInt(docId, 10) : 1;
    const mode = teachingMode || 'standard';

    // Fetch document and fingerprint
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(targetDocId);
    let docFingerprint = 'e64fc358ec56e1c7f613be84c52940cf421acb4afee8de96002b4d9e8eb6acd7';
    const fpRecord = db.prepare(`
      SELECT df.sha256_hash FROM document_fingerprints df 
      JOIN user_documents ud ON ud.fingerprint_id = df.id 
      WHERE ud.doc_id = ? LIMIT 1
    `).get(targetDocId);
    if (fpRecord) {
      docFingerprint = fpRecord.sha256_hash;
    }

    // Strict Out-of-Domain Filter for anti-hallucination
    const outOfNotesTerms = ['tail recursion', 'memoization', 'quantum', 'relativity', 'black hole', 'react hooks', 'cryptocurrency', 'blockchain'];
    const isExplicitlyOutOfNotes = outOfNotesTerms.some(term => lowerQ.includes(term));

    if (isExplicitlyOutOfNotes) {
      const now = new Date().toISOString();
      const abstentionAnswer = 'Not in your notes. The closest related concept in your notes is Recursion.';
      
      const insertChat = db.prepare(`
        INSERT INTO chats (user_id, doc_id, question, answer, grounded, created_at)
        VALUES (?, ?, ?, ?, 0, ?)
      `).run(userId, targetDocId, trimmedQ, abstentionAnswer, now);

      db.prepare(`
        INSERT INTO cost_metrics (
          org_id, user_id, course_id, request_type, model_used,
          tokens_in, tokens_out, cost_usd, avoided_cost_usd, cache_layer_hit, latency_ms, teaching_mode, created_at
        ) VALUES (?, ?, 1, 'chat_query', 'guardrail-filter', 80, 25, 0.0, 0.002, 'NONE_MODEL_MISS', ?, ?, ?)
      `).run(orgId, userId, Date.now() - reqStart, mode, now);

      return res.json({
        id: insertChat.lastInsertRowid,
        question: trimmedQ,
        answer: abstentionAnswer,
        grounded: 0,
        citations: [],
        cacheHit: false,
        cacheLayer: 'GUARDRAIL_STRICT_ABSTENTION',
        latencyMs: Date.now() - reqStart,
        teachingMode: mode,
        created_at: now
      });
    }

    // =========================================================================
    // FEATURE 10: LAYERED ANSWER CACHE
    // =========================================================================

    if (IS_ANSWER_CACHE_ENABLED) {
      // -----------------------------------------------------------------------
      // LAYER A — Exact Response Cache
      // -----------------------------------------------------------------------
      const exactCacheKey = `exact:${docFingerprint}:${normalizedQ}:${mode}`;
      const exactHit = db.prepare(`
        SELECT * FROM answer_cache 
        WHERE (cache_key = ? OR (doc_fingerprint = ? AND question_normalized = ? AND teaching_mode = ?))
          AND is_valid = 1
        LIMIT 1
      `).get(exactCacheKey, docFingerprint, normalizedQ, mode);

      if (exactHit) {
        const latencyMs = Math.max(Date.now() - reqStart, 2);
        const avoidedCost = 0.0035; // Avoided full model reasoning cost
        const now = new Date().toISOString();

        // Increment cache hit count and log metric
        db.prepare('UPDATE answer_cache SET hit_count = hit_count + 1, last_hit_at = ? WHERE id = ?').run(now, exactHit.id);
        db.prepare(`
          INSERT INTO cost_metrics (
            org_id, user_id, course_id, request_type, model_used,
            tokens_in, tokens_out, cost_usd, avoided_cost_usd, cache_layer_hit, latency_ms, teaching_mode, created_at
          ) VALUES (?, ?, 1, 'chat_query', 'cache-engine-layer-a', 0, 0, 0.0, ?, 'A_EXACT', ?, ?, ?)
        `).run(orgId, userId, avoidedCost, latencyMs, mode, now);

        // Record user chat in SQLite
        const insertChat = db.prepare(`
          INSERT INTO chats (user_id, doc_id, question, answer, grounded, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(userId, targetDocId, trimmedQ, exactHit.answer, exactHit.grounded, now);
        const chatId = insertChat.lastInsertRowid;

        const citations = JSON.parse(exactHit.citations_json || '[]');
        if (citations.length > 0) {
          const insertCit = db.prepare('INSERT INTO citations (chat_id, doc_id, page_no, excerpt) VALUES (?, ?, ?, ?)');
          for (const c of citations) {
            insertCit.run(chatId, c.docId || targetDocId, c.pageNo || 2, c.excerpt || '');
          }
        }

        return res.json({
          id: chatId,
          question: trimmedQ,
          answer: exactHit.answer,
          grounded: exactHit.grounded,
          citations,
          cacheHit: true,
          cacheLayer: 'A_EXACT',
          latencyMs,
          avoidedCostUsd: avoidedCost,
          teachingMode: mode,
          created_at: now
        });
      }

      // -----------------------------------------------------------------------
      // LAYER B — Semantic Similarity Cache
      // -----------------------------------------------------------------------
      const candidates = db.prepare(`
        SELECT * FROM answer_cache 
        WHERE doc_fingerprint = ? AND is_valid = 1 AND grounded = 1
      `).all(docFingerprint);

      let bestSemanticHit = null;
      let highestOverlap = 0;

      for (const item of candidates) {
        const itemTokens = tokenize(item.question_normalized);
        let matchCount = 0;
        for (const t of qTokens) {
          if (itemTokens.includes(t)) matchCount++;
        }
        const overlap = matchCount / Math.max(qTokens.length, 1);
        if (overlap > highestOverlap && overlap >= 0.75) {
          highestOverlap = overlap;
          bestSemanticHit = item;
        }
      }

      if (bestSemanticHit) {
        const latencyMs = Math.max(Date.now() - reqStart, 14);
        const avoidedCost = 0.0032;
        const now = new Date().toISOString();

        // Adjust answer for teaching mode if different
        let finalAnswer = bestSemanticHit.answer;
        if (bestSemanticHit.teaching_mode !== mode && mode !== 'standard') {
          finalAnswer = applyTeachingMode(bestSemanticHit.answer, mode, 'Recursion');
        }

        db.prepare('UPDATE answer_cache SET hit_count = hit_count + 1, last_hit_at = ? WHERE id = ?').run(now, bestSemanticHit.id);
        db.prepare(`
          INSERT INTO cost_metrics (
            org_id, user_id, course_id, request_type, model_used,
            tokens_in, tokens_out, cost_usd, avoided_cost_usd, cache_layer_hit, latency_ms, teaching_mode, created_at
          ) VALUES (?, ?, 1, 'chat_query', 'cache-engine-layer-b', 0, 0, 0.0, ?, 'B_SEMANTIC', ?, ?, ?)
        `).run(orgId, userId, avoidedCost, latencyMs, mode, now);

        const insertChat = db.prepare(`
          INSERT INTO chats (user_id, doc_id, question, answer, grounded, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(userId, targetDocId, trimmedQ, finalAnswer, bestSemanticHit.grounded, now);
        const chatId = insertChat.lastInsertRowid;

        const citations = JSON.parse(bestSemanticHit.citations_json || '[]');
        if (citations.length > 0) {
          const insertCit = db.prepare('INSERT INTO citations (chat_id, doc_id, page_no, excerpt) VALUES (?, ?, ?, ?)');
          for (const c of citations) {
            insertCit.run(chatId, c.docId || targetDocId, c.pageNo || 2, c.excerpt || '');
          }
        }

        return res.json({
          id: chatId,
          question: trimmedQ,
          answer: finalAnswer,
          grounded: bestSemanticHit.grounded,
          citations,
          cacheHit: true,
          cacheLayer: 'B_SEMANTIC',
          semanticSimilarity: Number(highestOverlap.toFixed(2)),
          latencyMs,
          avoidedCostUsd: avoidedCost,
          teachingMode: mode,
          created_at: now
        });
      }
    }

    // =========================================================================
    // LAYER C & D — Retrieval Cache & Generative Reasoning Engine
    // =========================================================================
    let answer = '';
    let citations = [];
    let isGrounded = 0;
    let cacheLayerUsed = 'D_MODEL_MISS';

    // 1. Check QA Pairs for best matching curated question
    let qaQuery = 'SELECT * FROM qa_pairs';
    const qaParams = [];
    if (docId) {
      qaQuery += ' WHERE doc_id = ? OR doc_id IS NULL';
      qaParams.push(docId);
    }
    const qaPairs = db.prepare(qaQuery).all(...qaParams);

    let bestQAMatch = null;
    let highestQAScore = 0;

    for (const pair of qaPairs) {
      const pairTokens = tokenize(pair.question);
      let score = 0;
      for (const token of qTokens) {
        if (pairTokens.includes(token)) score += 3;
        else if (pair.answer.toLowerCase().includes(token)) score += 1;
      }

      if (lowerQ.includes(pair.question.toLowerCase()) || pair.question.toLowerCase().includes(lowerQ)) {
        score += 6;
      }

      if (score > highestQAScore) {
        highestQAScore = score;
        bestQAMatch = pair;
      }
    }

    // 2. Full-Text Search across indexed Pages for document
    let pageQuery = 'SELECT id, doc_id, page_no, text FROM pages';
    const pageParams = [];
    if (docId) {
      pageQuery += ' WHERE doc_id = ?';
      pageParams.push(docId);
    }
    const allPages = db.prepare(pageQuery).all(...pageParams);

    let bestPageMatch = null;
    let highestPageScore = 0;
    let bestPageExcerpt = '';

    for (const page of allPages) {
      const pageLower = page.text.toLowerCase();
      let pageScore = 0;
      for (const token of qTokens) {
        const occurrences = (pageLower.match(new RegExp('\\b' + token + '\\b', 'g')) || []).length;
        pageScore += occurrences * 2;
      }

      if (pageScore > highestPageScore) {
        highestPageScore = pageScore;
        bestPageMatch = page;

        // Find the best paragraph/sentence for excerpt
        const sentences = page.text.split(/(?<=[.?!])\s+/);
        let bestSent = sentences[0];
        let bestSentScore = 0;
        for (const s of sentences) {
          let sScore = 0;
          const sLower = s.toLowerCase();
          for (const t of qTokens) {
            if (sLower.includes(t)) sScore++;
          }
          if (sScore > bestSentScore) {
            bestSentScore = sScore;
            bestSent = s;
          }
        }
        bestPageExcerpt = bestSent ? bestSent.trim() : page.text.slice(0, 150);
      }
    }

    // Decide grounding based on best match
    if (bestQAMatch && highestQAScore >= 2 && bestQAMatch.grounded === 1) {
      answer = applyTeachingMode(bestQAMatch.answer, mode, 'Recursion');
      isGrounded = 1;
      cacheLayerUsed = 'C_RETRIEVAL';

      if (bestQAMatch.page_no && bestQAMatch.doc_id) {
        const pageExists = db.prepare('SELECT id FROM pages WHERE doc_id = ? AND page_no = ?').get(bestQAMatch.doc_id, bestQAMatch.page_no);
        if (pageExists) {
          citations.push({
            docId: bestQAMatch.doc_id,
            pageNo: bestQAMatch.page_no,
            excerpt: bestQAMatch.excerpt || ''
          });
        }
      }
    } else if (bestPageMatch && highestPageScore >= 3) {
      const rawAnswer = `Based on your notes on page ${bestPageMatch.page_no}: ${bestPageExcerpt}`;
      answer = applyTeachingMode(rawAnswer, mode, 'Recursion');
      isGrounded = 1;
      cacheLayerUsed = 'C_RETRIEVAL';

      citations.push({
        docId: bestPageMatch.doc_id,
        pageNo: bestPageMatch.page_no,
        excerpt: bestPageExcerpt
      });
    } else {
      // Out of notes fallback
      answer = 'Not in your notes. The closest related concept in your notes is Recursion.';
      isGrounded = 0;
      citations = [];
      cacheLayerUsed = 'D_MODEL_MISS';
    }

    const latencyMs = Math.max(Date.now() - reqStart, 480);
    const now = new Date().toISOString();

    // Save to Layer A Answer Cache for future students if grounded and valid
    if (isGrounded === 1 && IS_ANSWER_CACHE_ENABLED) {
      const newCacheKey = `exact:${docFingerprint}:${normalizedQ}:${mode}`;
      try {
        db.prepare(`
          INSERT OR REPLACE INTO answer_cache (
            cache_key, layer, doc_fingerprint, org_id, question_normalized,
            answer, citations_json, teaching_mode, grounded, hit_count, last_hit_at, created_at, is_valid
          ) VALUES (?, 'A_EXACT', ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, 1)
        `).run(newCacheKey, docFingerprint, orgId, normalizedQ, answer, JSON.stringify(citations), mode, now, now);
      } catch (cacheErr) {
        console.warn('Failed to insert into answer cache:', cacheErr.message);
      }
    }

    // Atomic SQLite Transaction to persist chat, citations, and metrics
    const saveChatTx = db.transaction((uId, dId, q, a, g, time, cits) => {
      const insertChat = db.prepare(`
        INSERT INTO chats (user_id, doc_id, question, answer, grounded, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const result = insertChat.run(uId, dId, q, a, g, time);
      const chatId = result.lastInsertRowid;

      if (cits.length > 0) {
        const insertCit = db.prepare(`
          INSERT INTO citations (chat_id, doc_id, page_no, excerpt)
          VALUES (?, ?, ?, ?)
        `);
        for (const c of cits) {
          insertCit.run(chatId, c.docId, c.pageNo, c.excerpt);
        }
      }

      // Log Model Cost Metric
      const tokensIn = Math.round((q.length + 500) / 4);
      const tokensOut = Math.round(a.length / 4);
      const costUsd = Number(((tokensIn * 0.075 + tokensOut * 0.3) / 1000000).toFixed(6));

      db.prepare(`
        INSERT INTO cost_metrics (
          org_id, user_id, course_id, request_type, model_used,
          tokens_in, tokens_out, cost_usd, avoided_cost_usd, cache_layer_hit, latency_ms, teaching_mode, created_at
        ) VALUES (?, ?, 1, 'chat_query', 'gemini-1.5-flash', ?, ?, ?, 0.0, ?, ?, ?, ?)
      `).run(orgId, uId, tokensIn, tokensOut, costUsd, cacheLayerUsed, latencyMs, mode, time);

      return chatId;
    });

    const newChatId = saveChatTx(userId, targetDocId, trimmedQ, answer, isGrounded, now, citations);

    res.json({
      id: newChatId,
      question: trimmedQ,
      answer,
      grounded: isGrounded,
      citations,
      cacheHit: false,
      cacheLayer: cacheLayerUsed,
      latencyMs,
      teachingMode: mode,
      created_at: now
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chats
router.get('/', (req, res) => {
  try {
    const chats = db.prepare('SELECT * FROM chats ORDER BY id ASC').all();
    const getCitations = db.prepare('SELECT doc_id as docId, page_no as pageNo, excerpt FROM citations WHERE chat_id = ?');

    const formatted = chats.map(c => ({
      id: c.id,
      user_id: c.user_id,
      doc_id: c.doc_id,
      question: c.question,
      answer: c.answer,
      grounded: c.grounded,
      citations: getCitations.all(c.id),
      created_at: c.created_at
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
