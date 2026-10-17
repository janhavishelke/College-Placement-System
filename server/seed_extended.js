const crypto = require('crypto');
const db = require('./db');

function seedExtended() {
  console.log('🌱 Seeding extended UNERA data (Orgs, Fingerprints, Cache, Learning Profiles, Rescues)...');

  // 1. Seed Organizations
  const insertOrg = db.prepare(`
    INSERT OR IGNORE INTO organizations (id, name, slug, domain, plan, monthly_budget_usd, current_spend_usd, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  insertOrg.run(1, 'Apex Institute of Technology', 'apex-tech', 'apex.edu', 'enterprise_edu', 150.00, 18.45);
  insertOrg.run(2, 'Global Enterprise Academy', 'global-corp', 'globalcorp.com', 'enterprise_corp', 300.00, 42.10);

  // 2. Seed Users
  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (id, name, created_at)
    VALUES (?, ?, datetime('now'))
  `);
  insertUser.run(1, 'Alex Rivera');
  insertUser.run(2, 'Priya Sharma');
  insertUser.run(3, 'Prof. Robert Vance');
  insertUser.run(4, 'Sarah Jenkins');

  // 3. Seed Courses
  const insertCourse = db.prepare(`
    INSERT OR IGNORE INTO courses (id, org_id, name, code, description, instructor_name, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  insertCourse.run(1, 1, 'Data Structures & Algorithms', 'CS201', 'Core computer science principles, recursive problem solving, memory hierarchy, call stacks.', 'Prof. Robert Vance');
  insertCourse.run(2, 1, 'Engineering Mathematics & Calculus', 'MATH301', 'Differential equations, linear algebra, Laplace transforms, and numerical computation.', 'Dr. Elena Rostova');
  insertCourse.run(3, 2, 'Software Engineering SOPs & Onboarding', 'CORP101', 'Internal microservices architecture, code review standards, and deployment pipelines.', 'Sarah Jenkins');

  // 4. Seed Document Fingerprints (Universal Document Fingerprint)
  const doc1Pages = db.prepare('SELECT text, page_no FROM pages WHERE doc_id = 1 ORDER BY page_no ASC').all();
  if (doc1Pages.length > 0) {
    const fullText = doc1Pages.map(p => p.text).join('\n---\n');
    const hash = crypto.createHash('sha256').update(fullText).digest('hex');

    const insertFp = db.prepare(`
      INSERT OR REPLACE INTO document_fingerprints (
        id, sha256_hash, title, file_type, file_size_bytes, page_count, pipeline_version,
        status, extracted_summary, metadata_json, chunk_count, embedding_model, processing_time_ms,
        reuse_count, avoided_cost_usd, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    
    insertFp.run(
      1,
      hash,
      'Functions, Call Stack + Recursion',
      'pdf',
      68420,
      10,
      'v3.2.0',
      'completed',
      'Verified academic lecture notes covering functions, memory activation frames, stack overflow limits, base cases, and recursive tree execution.',
      JSON.stringify({ author: 'Department of Computer Science', semester: 'Fall 2026', subject: 'CS201' }),
      10,
      'text-embedding-3-small',
      1820,
      14,
      2.10 // avoided 14 * 10 pages * $0.015 = $2.10
    );

    // Seed processing chunks for fingerprint 1
    const insertChunk = db.prepare(`
      INSERT OR REPLACE INTO processing_chunks (id, fingerprint_id, chunk_index, page_no, text, embedding_vector_json, token_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    doc1Pages.forEach((p, idx) => {
      insertChunk.run(
        idx + 1,
        1,
        idx,
        p.page_no,
        p.text.slice(0, 400),
        JSON.stringify([0.021, -0.043, 0.089, -0.012, 0.055]),
        Math.round(p.text.length / 4)
      );
    });

    // Seed User Documents (Shared Knowledge, Separate Users)
    const insertUserDoc = db.prepare(`
      INSERT OR IGNORE INTO user_documents (id, user_id, org_id, course_id, doc_id, fingerprint_id, display_title, access_scope, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    insertUserDoc.run(1, 1, 1, 1, 1, 1, 'My Recursion Notes (Alex)', 'course');
    insertUserDoc.run(2, 2, 1, 1, 1, 1, 'CS201 Lecture 4 - Recursion & Stack (Priya)', 'course');
  }

  // 5. Seed Document Collections & Items
  const insertCol = db.prepare(`
    INSERT OR IGNORE INTO document_collections (id, org_id, name, code, description, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);
  insertCol.run(1, 1, 'CS201 Core Course Pack', 'CS201-PACK', 'Complete semester readings on recursion, algorithms, and complexity analysis.');
  insertCol.run(2, 1, 'Engineering Mathematics Compendium', 'MATH-PACK', 'Calculus, linear algebra, and differential equations notes.');

  const insertColItem = db.prepare(`
    INSERT OR IGNORE INTO collection_items (id, collection_id, doc_id)
    VALUES (?, ?, ?)
  `);
  insertColItem.run(1, 1, 1);
  insertColItem.run(2, 1, 2);

  // 6. Seed Answer Cache (Layer A Exact & Layer B Semantic)
  const insertCache = db.prepare(`
    INSERT OR REPLACE INTO answer_cache (
      id, cache_key, layer, doc_fingerprint, org_id, question_normalized,
      answer, citations_json, teaching_mode, grounded, hit_count, last_hit_at, created_at, is_valid
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), 1)
  `);

  insertCache.run(
    1,
    'exact:e64fc358ec56e1c7f613be84c52940cf421acb4afee8de96002b4d9e8eb6acd7:what is recursion:standard',
    'A_EXACT',
    'e64fc358ec56e1c7f613be84c52940cf421acb4afee8de96002b4d9e8eb6acd7',
    1,
    'what is recursion',
    'Recursion is a programming technique where a function calls itself directly or indirectly in order to solve a problem. It solves complex tasks by breaking them down into smaller instances of the same problem until a trivial base case is reached.',
    JSON.stringify([{ docId: 1, pageNo: 2, excerpt: 'Recursion is a method where the solution to a problem depends on solutions to smaller instances of the same problem. A recursive function solves a problem by calling a copy of itself.' }]),
    'standard',
    1,
    28
  );

  insertCache.run(
    2,
    'exact:e64fc358ec56e1c7f613be84c52940cf421acb4afee8de96002b4d9e8eb6acd7:what is a base case:standard',
    'A_EXACT',
    'e64fc358ec56e1c7f613be84c52940cf421acb4afee8de96002b4d9e8eb6acd7',
    1,
    'what is a base case',
    'A base case is the terminating condition in a recursive function. When the base case is satisfied, the function returns a known result immediately without making any further recursive calls, preventing infinite recursion.',
    JSON.stringify([{ docId: 1, pageNo: 4, excerpt: 'The base case is the condition that stops the recursion. Without it, the function will call itself infinitely until the call stack runs out of memory.' }]),
    'standard',
    1,
    19
  );

  insertCache.run(
    3,
    'semantic:e64fc358ec56e1c7f613be84c52940cf421acb4afee8de96002b4d9e8eb6acd7:can you explain what recursion means:standard',
    'B_SEMANTIC',
    'e64fc358ec56e1c7f613be84c52940cf421acb4afee8de96002b4d9e8eb6acd7',
    1,
    'can you explain what recursion means',
    'Recursion is a programming technique where a function calls itself directly or indirectly in order to solve a problem. It solves complex tasks by breaking them down into smaller instances of the same problem until a trivial base case is reached.',
    JSON.stringify([{ docId: 1, pageNo: 2, excerpt: 'Recursion is a method where the solution to a problem depends on solutions to smaller instances of the same problem. A recursive function solves a problem by calling a copy of itself.' }]),
    'standard',
    1,
    11
  );

  // 7. Seed Cost Metrics (Demonstrating Real Token & Cost Savings)
  const insertCost = db.prepare(`
    INSERT OR IGNORE INTO cost_metrics (
      id, org_id, user_id, course_id, request_type, model_used,
      tokens_in, tokens_out, cost_usd, avoided_cost_usd, cache_layer_hit, latency_ms, teaching_mode, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  insertCost.run(1, 1, 1, 1, 'chat_query', 'gemini-1.5-flash', 480, 110, 0.00007, 0.0, 'NONE_MODEL_MISS', 840, 'standard', '-2 hours');
  insertCost.run(2, 1, 2, 1, 'doc_processing', 'text-embedding-3-small', 0, 0, 0.0, 0.15, 'FINGERPRINT_REUSE', 8, 'standard', '-100 minutes');
  insertCost.run(3, 1, 2, 1, 'chat_query', 'cache-engine', 0, 0, 0.0, 0.0035, 'A_EXACT', 3, 'standard', '-95 minutes');
  insertCost.run(4, 1, 1, 1, 'chat_query', 'cache-engine', 0, 0, 0.0, 0.0032, 'B_SEMANTIC', 16, 'standard', '-60 minutes');
  insertCost.run(5, 1, 1, 1, 'chat_query', 'gemini-1.5-flash', 620, 195, 0.00010, 0.0, 'C_RETRIEVAL', 420, 'analogy', '-30 minutes');
  insertCost.run(6, 1, 2, 1, 'verification', 'gemini-1.5-flash', 510, 85, 0.00008, 0.0, 'NONE_MODEL_MISS', 610, 'standard', '-15 minutes');

  // 8. Seed Learning Profiles (Confusion Fingerprint)
  const insertProf = db.prepare(`
    INSERT OR REPLACE INTO learning_profiles (
      id, user_id, concept_name, status, struggle_count, correct_count,
      reasoning_errors_json, last_assessed_at, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, datetime('now'))
  `);

  insertProf.run(
    1, 1, 'Recursion', 'needs_practice', 2, 1,
    JSON.stringify(['Omitted base case in termination reasoning', 'Struggled to identify unwind condition']),
    'Student understands recursive calls on subproblems, but frequently forgets termination base cases.'
  );

  insertProf.run(
    2, 1, 'Call Stack', 'demonstrated_understanding', 0, 3,
    JSON.stringify([]),
    'Mastered activation record frames, stack frame allocation, and push/pop sequencing.'
  );

  insertProf.run(
    3, 1, 'Base Case', 'needs_practice', 2, 0,
    JSON.stringify(['Confused base case condition with loop bounds']),
    'Needs revision on defining the trivial return value.'
  );

  insertProf.run(
    4, 1, 'Factorial', 'improving', 1, 2,
    JSON.stringify(['Initial boundary condition off-by-one']),
    'Successfully mapped factorial(3) unwind diagram.'
  );

  insertProf.run(
    5, 1, 'Recursion Tree & Complexity', 'not_assessed', 0, 0,
    JSON.stringify([]),
    'Not yet assessed in this course module.'
  );

  // 9. Seed Learning Rescue Engine
  const insertRescue = db.prepare(`
    INSERT OR REPLACE INTO learning_rescues (
      id, user_id, concept_name, missing_prerequisite, diagnostic_question,
      diagnostic_response, refinement_hypothesis, remedial_explanation,
      practice_problem, practice_response, intervention_effective, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  insertRescue.run(
    1, 1, 'Recursion', 'Call Stack & Base Case',
    'Before diving into complex recursive functions: what happens in memory each time a function is called, and what halts new calls?',
    'A function call puts a frame on the call stack, but I forgot what stops them from piling up.',
    'Hypothesis confirmed: Student understands memory allocation on the stack, but lacks the mental model for base case early exit.',
    'Think of the call stack like a stack of plates. Each recursive call places a new plate on top. Without a base case rule ("Stop adding plates when n <= 1"), the stack reaches the ceiling and crashes with StackOverflow.',
    'Write the base case for countdown(n) so that the function prints numbers from n down to 1 and terminates when n reaches 0.',
    'if (n <= 0) return;',
    1,
    'completed'
  );

  // 10. Seed Proof of Understanding Tasks
  const insertTask = db.prepare(`
    INSERT OR REPLACE INTO proof_of_understanding_tasks (
      id, concept_name, task_type, prompt, rubric_json, sample_solution
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertTask.run(
    1, 'Recursion', 'own_words',
    'Explain how recursion works in your own words without using the words "recursion", "recursive", or "loop".',
    JSON.stringify([
      { criterion: 'Describes subproblem decomposition', points: 35 },
      { criterion: 'Identifies stopping condition (base case)', points: 35 },
      { criterion: 'Mentions result combination or unwinding', points: 30 }
    ]),
    'A task is solved by asking a miniature version of the exact same question. Each helper waits for the next smaller helper, until someone receives the simplest possible question with an obvious answer. That answer is then passed backward up the chain.'
  );

  insertTask.run(
    2, 'Recursion', 'changed_scenario',
    'Predict what happens if line 4 in factorial(n) is changed from factorial(n - 1) to factorial(n). Describe both behavior and memory.',
    JSON.stringify([
      { criterion: 'Identifies infinite recursion / lack of progress', points: 40 },
      { criterion: 'Explains call stack exhaustion / RangeError / StackOverflow', points: 40 },
      { criterion: 'Notes base case will never be reached', points: 20 }
    ]),
    'Because the argument n never gets smaller, the base case (n <= 1) is never reached. Every call continuously pushes identical activation frames onto the call stack until memory is exhausted and a StackOverflowError occurs.'
  );

  insertTask.run(
    3, 'Recursion', 'find_error',
    'Spot the bug in this function:\ndef countdown(n):\n    print(n)\n    countdown(n - 1)\n    if n == 0: return',
    JSON.stringify([
      { criterion: 'Identifies base case placed after recursive call', points: 50 },
      { criterion: 'Explains why the base case code is never executed', points: 50 }
    ]),
    'The base case check (if n == 0: return) is located AFTER the recursive call countdown(n - 1). Because countdown(n - 1) is invoked before checking n == 0, the check is never reached during downward execution, leading to infinite calls.'
  );

  insertTask.run(
    4, 'Recursion', 'defend_step',
    'Defend why every recursive algorithm requires both a progress step and a base case. Why is either one alone insufficient?',
    JSON.stringify([
      { criterion: 'Defends necessity of base case (avoids infinity)', points: 50 },
      { criterion: 'Defends necessity of progress towards base case', points: 50 }
    ]),
    'A base case without progress (e.g., n never approaches 0) will never trigger. Progress without a base case will step infinitely past zero. Both are mathematically required to guarantee termination via well-founded induction.'
  );

  console.log('✅ Extended UNERA seed data applied successfully!');
}

if (require.main === module) {
  seedExtended();
}

module.exports = seedExtended;
