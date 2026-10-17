const db = require('./server/db');

const ins = db.prepare(`
  INSERT INTO circle_messages (circle_id, sender_name, sender_role, message, created_at)
  VALUES (?, ?, ?, ?, datetime('now', '-30 minutes'))
`);

ins.run(1, 'Priya Sharma', 'Final Year (Placed @ Microsoft)', 'Welcome everyone! Today we are discussing dry-running factorial(3) and Fibonacci memoization.');
ins.run(1, 'Alex Rivera', '2nd Year Student (You)', 'Hey Priya! Quick question about the base case returning directly.');
ins.run(1, 'Priya Sharma', 'Final Year (Placed @ Microsoft)', 'Sure Alex! Always make sure the base case has a direct return without self-invoking.');

console.log('Seeded circle messages successfully');
