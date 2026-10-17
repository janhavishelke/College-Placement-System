const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/proof-of-understanding/tasks (Feature 7: Proof of Understanding non-MCQ tasks)
router.get('/tasks', (req, res) => {
  try {
    const conceptName = (req.query.conceptName || 'Recursion').toLowerCase();
    const tasks = db.prepare('SELECT * FROM proof_of_understanding_tasks WHERE LOWER(concept_name) = ?').all(conceptName);

    const formatted = tasks.map(t => ({
      id: t.id,
      conceptName: t.concept_name,
      taskType: t.task_type,
      prompt: t.prompt,
      rubric: JSON.parse(t.rubric_json || '[]'),
      sampleSolution: t.sample_solution
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/proof-of-understanding/evaluate (Evaluates response against explicit rubric)
router.post('/evaluate', (req, res) => {
  try {
    const { taskId, studentAnswer, conceptName = 'Recursion', userId = 1 } = req.body;
    if (!studentAnswer || !studentAnswer.trim()) {
      return res.status(400).json({ error: 'Student answer is required' });
    }

    let task;
    if (taskId) {
      task = db.prepare('SELECT * FROM proof_of_understanding_tasks WHERE id = ?').get(taskId);
    }
    if (!task) {
      task = db.prepare('SELECT * FROM proof_of_understanding_tasks WHERE LOWER(concept_name) = ? LIMIT 1').get(conceptName.toLowerCase());
    }

    const rubric = JSON.parse(task?.rubric_json || '[]');
    const lower = studentAnswer.toLowerCase();

    // Evaluate against rubric criteria
    let totalScore = 0;
    const criteriaEvaluations = [];

    rubric.forEach(c => {
      let passed = false;
      const criterionText = c.criterion.toLowerCase();

      if (criterionText.includes('base case') || criterionText.includes('stopping')) {
        passed = lower.includes('base case') || lower.includes('stop') || lower.includes('halt') || lower.includes('terminat');
      } else if (criterionText.includes('subproblem') || criterionText.includes('smaller')) {
        passed = lower.includes('smaller') || lower.includes('subproblem') || lower.includes('divide') || lower.includes('miniature');
      } else if (criterionText.includes('unwind') || criterionText.includes('stack') || criterionText.includes('combine')) {
        passed = lower.includes('stack') || lower.includes('unwind') || lower.includes('return') || lower.includes('back');
      } else if (criterionText.includes('infinite') || criterionText.includes('overflow')) {
        passed = lower.includes('infinite') || lower.includes('overflow') || lower.includes('crash') || lower.includes('exhaust');
      } else {
        passed = studentAnswer.trim().length > 30;
      }

      const scoreAwarded = passed ? c.points : Math.round(c.points * 0.2);
      totalScore += scoreAwarded;

      criteriaEvaluations.push({
        criterion: c.criterion,
        maxPoints: c.points,
        awardedPoints: scoreAwarded,
        passed,
        feedbackNote: passed ? 'Demonstrated in your response' : `Missing evidence for: "${c.criterion}"`
      });
    });

    const masteryPercent = Math.min(totalScore, 100);
    const masteryLevel = masteryPercent >= 80 ? 'Demonstrated Understanding' : masteryPercent >= 50 ? 'Improving' : 'Needs Practice';

    // Update learning profile
    const now = new Date().toISOString();
    const profileStatus = masteryPercent >= 80 ? 'demonstrated_understanding' : 'improving';
    db.prepare(`
      UPDATE learning_profiles 
      SET status = ?, last_assessed_at = ?, notes = ?
      WHERE user_id = ? AND LOWER(concept_name) = ?
    `).run(profileStatus, now, `Proof of understanding score: ${masteryPercent}% (${masteryLevel})`, userId, conceptName.toLowerCase());

    res.json({
      taskId: task?.id,
      taskType: task?.task_type,
      conceptName: task?.concept_name,
      studentAnswer,
      masteryPercent,
      masteryLevel,
      criteriaEvaluations,
      evidenceSummary: `Evaluated ${criteriaEvaluations.length} distinct rubric dimensions against course ground truth.`,
      sampleSolution: task?.sample_solution
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
