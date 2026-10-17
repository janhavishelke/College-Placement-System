const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/rescue/state (Feature 4: Learning Rescue Engine)
router.get('/state', (req, res) => {
  try {
    const userId = parseInt(req.query.userId || '1', 10);
    const conceptName = (req.query.conceptName || 'Recursion').toLowerCase();

    let rescue = db.prepare(`
      SELECT * FROM learning_rescues 
      WHERE user_id = ? AND LOWER(concept_name) = ? 
      ORDER BY id DESC LIMIT 1
    `).get(userId, conceptName);

    if (!rescue) {
      // Return default active rescue if none exist yet
      rescue = {
        id: 1,
        user_id: userId,
        concept_name: 'Recursion',
        missing_prerequisite: 'Call Stack & Base Case',
        diagnostic_question: 'Before continuing: In recursive countdown(n), what stops new frames from being added to the call stack indefinitely?',
        diagnostic_response: null,
        refinement_hypothesis: null,
        remedial_explanation: null,
        practice_problem: null,
        practice_response: null,
        status: 'active'
      };
    }

    res.json(rescue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rescue/submit-diagnostic (Step 2 & 3: Diagnostic evaluation & Hypothesis refinement)
router.post('/submit-diagnostic', (req, res) => {
  try {
    const { userId = 1, conceptName = 'Recursion', responseText } = req.body;
    if (!responseText || !responseText.trim()) {
      return res.status(400).json({ error: 'Response text is required' });
    }

    const lower = responseText.toLowerCase();
    const hasBaseCase = lower.includes('base case') || lower.includes('stop') || lower.includes('return') || lower.includes('condition');

    let hypothesis = '';
    let remedial = '';
    let practice = '';

    if (hasBaseCase) {
      hypothesis = 'Confirmed Knowledge Gap: Student understands that a base case exists, but lacks clarity on how activation frames unwind in memory.';
      remedial = `📚 **Alternative Method (Stack Trace Analogy):**\n\n` +
        `Imagine a deck of cards. Each time your function calls itself, you place a card on top. ` +
        `The function *cannot finish* until all cards on top of it are picked up and thrown away. ` +
        `The base case is the card that says "STOP - no more cards!" Once hit, cards are removed from top to bottom, handing values back downward.`;
      practice = 'What would happen if the base case condition returned a string instead of an integer in a mathematical recursion like factorial(n)?';
    } else {
      hypothesis = 'Confirmed Knowledge Gap: Student is confusing recursive iteration with while-loops, completely missing the base case concept.';
      remedial = `📚 **Alternative Method (Visual Boundary Refresher):**\n\n` +
        `In a loop, the CPU tests a condition at the top of every cycle. In recursion, every call creates a brand new function instance in memory! ` +
        `Without an \`if (n <= 1) return 1;\` check at the very top, the computer creates millions of instances until memory crashes (\`StackOverflowError\`).`;
      practice = 'Write a one-line \`if\` statement that stops recursive countdown(n) when n reaches 0.';
    }

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO learning_rescues (
        user_id, concept_name, missing_prerequisite, diagnostic_question,
        diagnostic_response, refinement_hypothesis, remedial_explanation, practice_problem, status, created_at
      ) VALUES (?, ?, 'Call Stack & Base Case', 'What stops new frames from being added to the call stack indefinitely?', ?, ?, ?, ?, 'active', ?)
    `).run(userId, conceptName, responseText, hypothesis, remedial, practice, now);

    res.json({
      success: true,
      hypothesis,
      remedialExplanation: remedial,
      practiceProblem: practice
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rescue/submit-practice (Step 6, 7 & 8: Practice evaluation & Learning outcome update)
router.post('/submit-practice', (req, res) => {
  try {
    const { userId = 1, conceptName = 'Recursion', practiceResponse } = req.body;
    if (!practiceResponse || !practiceResponse.trim()) {
      return res.status(400).json({ error: 'Practice response is required' });
    }

    const lower = practiceResponse.toLowerCase();
    const isGood = lower.includes('return') || lower.includes('n <= 0') || lower.includes('n == 0') || lower.includes('type') || lower.includes('nan');

    const feedback = isGood
      ? '🎉 Excellent! You correctly identified the termination guard. Your mental model of recursive memory is now reinforced.'
      : 'Good attempt. Remember that the base case must explicitly return a valid value before any recursive calls take place.';

    // Update learning profile to 'improving' or 'demonstrated_understanding'
    const newStatus = isGood ? 'demonstrated_understanding' : 'improving';
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE learning_profiles 
      SET status = ?, correct_count = correct_count + 1, notes = 'Learning Rescue completed successfully', last_assessed_at = ?
      WHERE user_id = ? AND LOWER(concept_name) = ?
    `).run(newStatus, now, userId, conceptName.toLowerCase());

    res.json({
      success: true,
      isEffective: isGood,
      feedback,
      newConceptStatus: newStatus,
      message: 'Rescue intervention completed. Learning profile updated in persistent SQLite store.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
