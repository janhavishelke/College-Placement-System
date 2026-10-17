const express = require('express');
const router = express.Router();
const db = require('../db');

// Ensure tables exist
db.exec(`
  CREATE TABLE IF NOT EXISTS peer_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    domain TEXT NOT NULL DEFAULT 'Computer Science & Placement',
    role TEXT NOT NULL DEFAULT 'Student',
    avatar TEXT,
    bio TEXT,
    rating REAL DEFAULT 4.9,
    problems_solved INTEGER DEFAULT 42,
    status TEXT DEFAULT 'Online Studying',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS peer_discussions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    domain TEXT NOT NULL DEFAULT 'Computer Science & Placement',
    topic TEXT NOT NULL,
    problem_title TEXT NOT NULL,
    problem_desc TEXT NOT NULL,
    future_pitfall_warning TEXT,
    upvotes INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS peer_replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discussion_id INTEGER NOT NULL,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL,
    is_experienced_mentor INTEGER DEFAULT 0,
    reply_text TEXT NOT NULL,
    note_reference TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(discussion_id) REFERENCES peer_discussions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS study_circles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    domain TEXT NOT NULL DEFAULT 'Computer Science & Placement',
    active_members INTEGER DEFAULT 5,
    topic TEXT NOT NULL,
    lead_mentor TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS circle_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    circle_id INTEGER NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(circle_id) REFERENCES study_circles(id) ON DELETE CASCADE
  );
`);

// Seed default peers & discussions if empty
const countProfiles = db.prepare('SELECT COUNT(*) as c FROM peer_profiles').get().c;
if (countProfiles === 0) {
  const insertProfile = db.prepare(`
    INSERT INTO peer_profiles (name, domain, role, avatar, bio, rating, problems_solved, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  insertProfile.run('Alex Rivera', 'Computer Science & Placement', '2nd Year Student (You)', 'AR', 'Focusing on Core DSA, Recursion, and Call Stack mechanics.', 4.8, 24, 'Online Studying');
  insertProfile.run('Priya Sharma', 'Computer Science & Placement', 'Final Year (Placed @ Microsoft)', 'PS', 'Specialized in Tree Algorithms, Backtracking, and System Design interview prep.', 5.0, 186, 'Available to Guide');
  insertProfile.run('Rohan Mehta', 'Computer Science & Placement', '4th Year (Amazon SDE Intern)', 'RM', 'Deep interest in Call Stack execution, Memory profiling, and Dynamic Programming.', 4.9, 142, 'In Study Session');
  insertProfile.run('Ananya Roy', 'Computer Science & Placement', 'Alumni Mentor (Ex-Flipkart SDE 2)', 'AR', 'Campus placement interviewer. Happy to guide on recurring technical pitfalls.', 5.0, 310, 'Available to Guide');
  insertProfile.run('Devendra Patel', 'Computer Science & Placement', '3rd Year Lead (Competitive Programmer)', 'DP', 'Solved 600+ problems on LeetCode/Codeforces. Reach out for recursion vs iteration.', 4.9, 215, 'Online Studying');
  insertProfile.run('Kavya Iyer', 'Computer Science & Placement', '2nd Year Peer', 'KI', 'Studying operating systems, stack limits, and recursion memory models.', 4.7, 31, 'Online Studying');

  const insertDisc = db.prepare(`
    INSERT INTO peer_discussions (user_name, user_role, domain, topic, problem_title, problem_desc, future_pitfall_warning, upvotes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-2 hours'))
  `);

  const d1 = insertDisc.run(
    'Kavya Iyer',
    '2nd Year Peer',
    'Computer Science & Placement',
    'Recursion & Stack Memory',
    'Maximum call stack size exceeded when calculating Fibonacci for N > 35',
    'My recursive code works fine for n = 5 and n = 10, but in n = 40 my browser freezes and throws RangeError. How can I detect when recursion becomes too deep?',
    'FUTURE PITFALL WARNING: In upcoming placement coding rounds, naive 2^N recursion will fail with TLE. You must recognize overlapping subproblems and memoize!',
    14
  ).lastInsertRowid;

  const d2 = insertDisc.run(
    'Devendra Patel',
    '3rd Year Lead',
    'Computer Science & Placement',
    'Call Stack & Frames',
    'Difference between Return Address in Stack Frame vs Local Variables during Backtracking',
    'When recursion unwinds, how does the CPU restore registers and return to the exact line after the recursive call? Is it stored inside each stack frame?',
    'FUTURE PITFALL WARNING: In Microsoft and Google technical interviews, interviewers frequently ask you to dry-run stack frames line-by-line on a whiteboard.',
    22
  ).lastInsertRowid;

  const d3 = insertDisc.run(
    'Alex Rivera',
    '2nd Year Student (You)',
    'Computer Science & Placement',
    'Base Case & Guard Clauses',
    'Handling Base Case in Recursive Tree Traversal when nodes can be NULL',
    'Should I check if node.left != null before calling traverse(node.left), or check if node == null at the start of the function?',
    'FUTURE PITFALL WARNING: Checking children before calling causes NullPointerException on empty trees and clutters code. Always put guard clause at top.',
    9
  ).lastInsertRowid;

  const insertReply = db.prepare(`
    INSERT INTO peer_replies (discussion_id, author_name, author_role, is_experienced_mentor, reply_text, note_reference, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now', '-1 hour'))
  `);

  insertReply.run(
    d1,
    'Rohan Mehta',
    '4th Year (Amazon SDE Intern)',
    1,
    'Hey Kavya! The issue is branch duplication: fib(40) makes 2^40 = over 1 trillion calls! Check Page 6 of our Recursion Notes on Stack Limits. To fix it, use memoization with a hash table or dp array: if (dp[n] != -1) return dp[n]. This reduces time from exponential to linear O(N).',
    'Page 6: Stack Memory Boundaries & Maximum Call Stack Limits'
  );

  insertReply.run(
    d2,
    'Priya Sharma',
    'Final Year (Placed @ Microsoft)',
    1,
    'Great question Devendra! Every stack frame (Page 5 in our notes) contains: 1. Incoming arguments, 2. Local variables, 3. The Return Address (Program Counter PC). When the deeper function returns, the CPU pops the frame, restores caller variables, and jumps to the Return Address instruction.',
    'Page 5: Anatomy of an Activation Record & Stack Frame'
  );

  insertReply.run(
    d3,
    'Ananya Roy',
    'Alumni Mentor (Ex-Flipkart SDE 2)',
    1,
    'Always use the Universal Guard Clause: "if (node == null) return;". It handles empty trees gracefully, reduces 3 nested if-statements to 1, and is what interviewers look for in clean code standards.',
    'Page 3: The Base Case Guard Clause'
  );

  // Seed study circles
  const insertCircle = db.prepare(`
    INSERT INTO study_circles (name, domain, active_members, topic, lead_mentor, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);

  const c1 = insertCircle.run('Recursion & DP Placement Sprint', 'Computer Science & Placement', 14, 'Recursion, Call Stack & Memoization', 'Priya Sharma (Placed @ Microsoft)').lastInsertRowid;
  const c2 = insertCircle.run('Core CS: OS Memory & Stack Overflow', 'Computer Science & Placement', 8, 'Virtual Memory & Stack vs Heap', 'Rohan Mehta (Amazon SDE Intern)').lastInsertRowid;
  const c3 = insertCircle.run('FAANG Technical Interview Preparation', 'Computer Science & Placement', 27, 'Data Structures & Algorithms', 'Ananya Roy (Ex-Flipkart SDE 2)').lastInsertRowid;

  const insertMsg = db.prepare(`
    INSERT INTO circle_messages (circle_id, sender_name, sender_role, message, created_at)
    VALUES (?, ?, ?, ?, datetime('now', '-30 minutes'))
  `);

  insertMsg.run(c1, 'Priya Sharma', 'Final Year (Placed @ Microsoft)', 'Welcome everyone! Today we are discussing dry-running factorial(3) and Fibonacci memoization.');
  insertMsg.run(c1, 'Alex Rivera', '2nd Year Student (You)', 'Hey Priya! Quick question about the base case returning directly.');
  insertMsg.run(c1, 'Priya Sharma', 'Final Year (Placed @ Microsoft)', 'Sure Alex! Always make sure the base case has a direct return without self-invoking.');
}

// GET /api/peers/profile
router.get('/profile', (req, res) => {
  try {
    const profile = db.prepare('SELECT * FROM peer_profiles WHERE id = 1').get();
    res.json(profile || {
      id: 1,
      name: 'Alex Rivera',
      domain: 'Computer Science & Placement',
      role: '2nd Year Student (You)',
      avatar: 'AR',
      status: 'Online Studying'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/peers/network?domain=...
router.get('/network', (req, res) => {
  try {
    const domain = req.query.domain || 'Computer Science & Placement';
    const peers = db.prepare('SELECT * FROM peer_profiles WHERE domain = ? ORDER BY id ASC').all(domain);
    res.json({ domain, peers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/peers/discussions?domain=...&topic=...
router.get('/discussions', (req, res) => {
  try {
    const domain = req.query.domain || 'Computer Science & Placement';
    const topic = req.query.topic;

    let query = 'SELECT * FROM peer_discussions WHERE domain = ?';
    const params = [domain];

    if (topic && topic !== 'All') {
      query += ' AND topic LIKE ?';
      params.push(`%${topic}%`);
    }

    query += ' ORDER BY id DESC';

    const discussions = db.prepare(query).all(...params);

    // Attach replies to each discussion
    const getReplies = db.prepare('SELECT * FROM peer_replies WHERE discussion_id = ? ORDER BY id ASC');
    const enriched = discussions.map(d => ({
      ...d,
      replies: getReplies.all(d.id)
    }));

    res.json({ domain, discussions: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/peers/discussions
router.post('/discussions', (req, res) => {
  try {
    const { userName, userRole, domain, topic, problemTitle, problemDesc, futurePitfallWarning } = req.body;

    if (!problemTitle || !problemDesc) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO peer_discussions (user_name, user_role, domain, topic, problem_title, problem_desc, future_pitfall_warning, upvotes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))
    `);

    const result = stmt.run(
      userName || 'Alex Rivera',
      userRole || '2nd Year Student',
      domain || 'Computer Science & Placement',
      topic || 'Recursion & Algorithms',
      problemTitle,
      problemDesc,
      futurePitfallWarning || 'Be prepared for this edge case during campus placement coding rounds.'
    );

    const created = db.prepare('SELECT * FROM peer_discussions WHERE id = ?').get(result.lastInsertRowid);
    created.replies = [];

    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/peers/discussions/:id/reply
router.post('/discussions/:id/reply', (req, res) => {
  try {
    const discussionId = parseInt(req.params.id, 10);
    const { authorName, authorRole, isExperiencedMentor, replyText, noteReference } = req.body;

    if (!replyText) {
      return res.status(400).json({ error: 'Reply text is required' });
    }

    const stmt = db.prepare(`
      INSERT INTO peer_replies (discussion_id, author_name, author_role, is_experienced_mentor, reply_text, note_reference, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    const result = stmt.run(
      discussionId,
      authorName || 'Alex Rivera',
      authorRole || 'Student',
      isExperiencedMentor ? 1 : 0,
      replyText,
      noteReference || null
    );

    const reply = db.prepare('SELECT * FROM peer_replies WHERE id = ?').get(result.lastInsertRowid);
    res.json(reply);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/peers/discussions/:id/upvote
router.post('/discussions/:id/upvote', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    db.prepare('UPDATE peer_discussions SET upvotes = upvotes + 1 WHERE id = ?').run(id);
    const updated = db.prepare('SELECT upvotes FROM peer_discussions WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/peers/circles
router.get('/circles', (req, res) => {
  try {
    const domain = req.query.domain || 'Computer Science & Placement';
    const circles = db.prepare('SELECT * FROM study_circles WHERE domain = ? ORDER BY id ASC').all(domain);
    res.json({ domain, circles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/peers/circles/:id/messages
router.get('/circles/:id/messages', (req, res) => {
  try {
    const circleId = parseInt(req.params.id, 10);
    const messages = db.prepare('SELECT * FROM circle_messages WHERE circle_id = ? ORDER BY id ASC').all(circleId);
    res.json({ circleId, messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/peers/circles/:id/messages
router.post('/circles/:id/messages', (req, res) => {
  try {
    const circleId = parseInt(req.params.id, 10);
    const { senderName, senderRole, message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const stmt = db.prepare(`
      INSERT INTO circle_messages (circle_id, sender_name, sender_role, message, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `);

    const result = stmt.run(
      circleId,
      senderName || 'Alex Rivera',
      senderRole || 'Student',
      message
    );

    const created = db.prepare('SELECT * FROM circle_messages WHERE id = ?').get(result.lastInsertRowid);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
