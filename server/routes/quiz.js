const express = require('express');
const router = express.Router();
const db = require('../db');

// Seeded high-quality questions strictly from notes.json
const ALL_QUIZ_QUESTIONS = [
  {
    id: 1,
    concept: "Recursion",
    pageNo: 2,
    question: "What is the primary defining characteristic of a recursive function?",
    options: [
      "It modifies global state inside a while loop",
      "It calls itself directly or indirectly to solve smaller instances of the same problem",
      "It uses multiple threads to execute concurrently",
      "It allocates memory on the heap instead of the stack"
    ],
    correctIndex: 1,
    explanation: "According to Page 2 of your notes: Recursion is a method where the solution depends on solutions to smaller instances of the same problem by calling a copy of itself."
  },
  {
    id: 2,
    concept: "Base Case",
    pageNo: 3,
    question: "Why must the base case be placed before the recursive step?",
    options: [
      "To optimize CPU cache line alignment",
      "To prevent infinite recursive calls and immediate stack overflow",
      "To convert recursion into iteration automatically",
      "To allocate the stack frame at compile time"
    ],
    correctIndex: 1,
    explanation: "Page 3 states that without a base case placed before recursive invocation, the function will invoke itself indefinitely, causing an immediate stack overflow."
  },
  {
    id: 3,
    concept: "Call Stack",
    pageNo: 4,
    question: "What order of execution does the runtime call stack enforce?",
    options: [
      "FIFO (First-In, First-Out)",
      "LIFO (Last-In, First-Out)",
      "Priority-based heap ordering",
      "Random access round-robin"
    ],
    correctIndex: 1,
    explanation: "Page 4 notes: The call stack is a LIFO (Last-In, First-Out) data structure that tracks active function calls in a program."
  },
  {
    id: 4,
    concept: "Stack Frame",
    pageNo: 5,
    question: "What does an individual stack frame (activation record) contain?",
    options: [
      "Only the function name and pointer address",
      "Arguments, local variables, and the return address back to caller",
      "The entire source code of the program in binary",
      "Shared database connection pools"
    ],
    correctIndex: 1,
    explanation: "Page 5 notes: A stack frame stores incoming arguments, local variables, and the return address to resume the caller."
  },
  {
    id: 5,
    concept: "Stack Overflow",
    pageNo: 6,
    question: "In recursive algorithms, what is the most common cause of a stack overflow?",
    options: [
      "Running out of physical SSD drive storage",
      "A missing, unreachable, or incorrect base case condition",
      "Using const variables instead of let variables",
      "Calling a function from inside another function"
    ],
    correctIndex: 1,
    explanation: "Page 6 notes: In recursive algorithms, stack overflows are almost always caused by a missing or unreachable base case."
  },
  {
    id: 6,
    concept: "Recursion",
    pageNo: 7,
    question: "In tracing recursive factorial(3), what occurs when n = 1?",
    options: [
      "The runtime throws a memory exception",
      "The base case is reached and returns 1 without pushing more frames",
      "It calls factorial(0) to verify zero parity",
      "The call stack allocates 3 additional frames"
    ],
    correctIndex: 1,
    explanation: "Page 7 trace: factorial(1) hits the base case (1 <= 1) and returns 1, starting the stack unwinding phase."
  }
];

// GET /api/quiz?mode=5_questions|proactive|mistakes_only
router.get('/', (req, res) => {
  try {
    const mode = req.query.mode || '5_questions';
    let questions = [];

    if (mode === 'proactive') {
      // 1 single check-in question on Recursion/Base case
      questions = [ALL_QUIZ_QUESTIONS[1]];
    } else if (mode === 'mistakes_only') {
      // Find concepts where user had gaps in verifications
      const verifs = db.prepare('SELECT concept_name, gaps FROM verifications WHERE user_id = 1 ORDER BY id DESC').all();
      const failedConcepts = new Set();
      for (const v of verifs) {
        const gaps = JSON.parse(v.gaps || '[]');
        if (gaps.length > 0) failedConcepts.add(v.concept_name.toLowerCase());
      }

      questions = ALL_QUIZ_QUESTIONS.filter(q => failedConcepts.has(q.concept.toLowerCase()));
      if (questions.length === 0) {
        // Fallback to Base Case & Stack Overflow questions
        questions = [ALL_QUIZ_QUESTIONS[1], ALL_QUIZ_QUESTIONS[4]];
      }
    } else {
      // Default: 5 questions from notes
      questions = ALL_QUIZ_QUESTIONS.slice(0, 5);
    }

    res.json({
      mode,
      totalQuestions: questions.length,
      questions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quiz/submit
router.post('/submit', (req, res) => {
  try {
    const { answers } = req.body; // { [questionId]: selectedIndex }
    if (!answers) return res.status(400).json({ error: 'Answers payload required' });

    let score = 0;
    const review = [];

    for (const q of ALL_QUIZ_QUESTIONS) {
      if (answers[q.id] !== undefined) {
        const selected = parseInt(answers[q.id], 10);
        const isCorrect = selected === q.correctIndex;
        if (isCorrect) score++;

        review.push({
          questionId: q.id,
          question: q.question,
          concept: q.concept,
          pageNo: q.pageNo,
          selected,
          correctIndex: q.correctIndex,
          isCorrect,
          explanation: q.explanation
        });

        // If wrong, add to Doubt Memory automatically!
        if (!isCorrect) {
          try {
            const now = new Date().toISOString();
            db.prepare(`
              INSERT OR IGNORE INTO doubts (user_id, concept_name, status, steps_done, created_at)
              VALUES (1, ?, 'unresolved', '[]', ?)
            `).run(q.concept, now);
          } catch (e) {}
        }
      }
    }

    res.json({
      total: review.length,
      score,
      percentage: Math.round((score / (review.length || 1)) * 100),
      review
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
