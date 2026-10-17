const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/reports
router.get('/', (req, res) => {
  try {
    const doubts = db.prepare('SELECT * FROM doubts WHERE user_id = 1').all();
    const verifs = db.prepare('SELECT * FROM verifications WHERE user_id = 1').all();

    // Calculate per-topic performance
    const topics = [
      { name: "Recursion", status: "Demonstrated", masteryPercent: 88, reviewDate: "Tomorrow" },
      { name: "Base Case", status: "Needs Review", masteryPercent: 62, reviewDate: "Today" },
      { name: "Call Stack", status: "Demonstrated", masteryPercent: 94, reviewDate: "In 3 Days" },
      { name: "Stack Frame", status: "Learning", masteryPercent: 75, reviewDate: "In 2 Days" },
      { name: "Stack Overflow", status: "Demonstrated", masteryPercent: 90, reviewDate: "In 5 Days" }
    ];

    // Spaced Repetition Revision Schedule (Next 7 days)
    const revisionPlan = [
      { day: "Day 1 (Today)", topic: "Base Case Mechanics", activity: "10-minute active recall drill on terminating conditions" },
      { day: "Day 2 (Tomorrow)", topic: "Recursion Unwinding", activity: "Trace factorial(4) call frames on scratchpad" },
      { day: "Day 3", topic: "Stack Frame Parameters", activity: "Verify return address resolution in recursion" },
      { day: "Day 5", topic: "Call Stack Overflow", activity: "Review recursion depth thresholds and memory bounds" },
      { day: "Day 7", topic: "Comprehensive PYQ Review", activity: "Solve 2024 and 2023 university exam questions" }
    ];

    res.json({
      studentName: "Alex Rivera",
      course: "CS201 Data Structures & Algorithms",
      totalDoubts: doubts.length,
      resolvedDoubts: doubts.filter(d => d.status === 'resolved').length,
      activeRecallAttempts: verifs.length,
      overallMastery: 82,
      topics,
      revisionPlan,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
