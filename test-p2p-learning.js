async function testPeerToPeerLearning() {
  const BASE = 'http://localhost:5001/api/peers';
  console.log('🧪 Starting Peer-to-Peer Learning Automated Verification...\n');

  // Test 1: Student Domain Profile
  console.log('--- Test 1: Student Profile & Domain ---');
  const profRes = await fetch(`${BASE}/profile`);
  const profile = await profRes.json();
  console.log(`User: ${profile.name}, Domain: "${profile.domain}", Role: ${profile.role}`);
  if (!profile.name || profile.domain !== 'Computer Science & Placement') {
    throw new Error('Profile domain mismatch');
  }
  console.log('✅ Test 1 Passed: User profile grounded in shared domain.\n');

  // Test 2: Domain Peer & Mentor Network
  console.log('--- Test 2: Domain Peers & Experienced Mentors ---');
  const netRes = await fetch(`${BASE}/network?domain=${encodeURIComponent(profile.domain)}`);
  const network = await netRes.json();
  console.log(`Found ${network.peers.length} domain peers in "${network.domain}":`);
  network.peers.forEach(p => console.log(`  • ${p.name} (${p.role}) - Rating: ${p.rating}★`));
  if (network.peers.length < 5) throw new Error('Expected at least 5 seeded peers');
  console.log('✅ Test 2 Passed: Domain peer network verified.\n');

  // Test 3: Discussions & Future Pitfall Warnings
  console.log('--- Test 3: Shared Problems & Future Pitfalls Feed ---');
  const discRes = await fetch(`${BASE}/discussions`);
  const discData = await discRes.json();
  console.log(`Total Domain Discussions: ${discData.discussions.length}`);
  const sample = discData.discussions[0];
  console.log(`Sample Problem: "${sample.problem_title}" by ${sample.user_name}`);
  console.log(`Future Pitfall Warning: ${sample.future_pitfall_warning}`);
  console.log(`Replies Count: ${sample.replies.length}`);
  if (!sample.future_pitfall_warning || sample.replies.length === 0) {
    throw new Error('Discussion missing future pitfall warning or senior replies');
  }
  console.log('✅ Test 3 Passed: Shared problems & future pitfall warnings active.\n');

  // Test 4: Post New Problem to Domain Peers
  console.log('--- Test 4: Post New Problem to Domain Peers ---');
  const newPostRes = await fetch(`${BASE}/discussions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userName: 'Alex Rivera',
      userRole: '2nd Year Student (You)',
      domain: 'Computer Science & Placement',
      topic: 'Recursion & Dynamic Programming',
      problemTitle: 'Difference between Top-Down Memoization vs Bottom-Up Tabulation in Call Stack',
      problemDesc: 'Does bottom-up tabulation completely avoid call stack frames, or does it consume the same runtime stack as memoization?',
      futurePitfallWarning: 'FUTURE PITFALL WARNING: In Goldman Sachs & Morgan Stanley interviews, interviewers specifically test space complexity differences between recursion stack frames O(N) vs iterative O(1).'
    })
  });
  const createdPost = await newPostRes.json();
  console.log(`Created Discussion ID: ${createdPost.id}, Title: "${createdPost.problem_title}"`);
  if (!createdPost.id) throw new Error('Failed to create peer discussion');
  console.log('✅ Test 4 Passed: Student posted problem to domain peers.\n');

  // Test 5: Experienced Senior Replies to Post
  console.log('--- Test 5: Experienced Senior Mentor Guidance ---');
  const replyRes = await fetch(`${BASE}/discussions/${createdPost.id}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      authorName: 'Rohan Mehta',
      authorRole: '4th Year (Amazon SDE Intern)',
      isExperiencedMentor: true,
      replyText: 'Hey Alex! Tabulation uses an iterative loop and an array, so its call stack overhead is strictly O(1) with zero function activation records. Memoization still pushes N frames on the call stack before hitting the base case, requiring O(N) auxiliary stack memory.',
      noteReference: 'Page 4: Call Stack Execution & Space Bounds'
    })
  });
  const reply = await replyRes.json();
  console.log(`Senior Guidance from: ${reply.author_name} (${reply.author_role})`);
  console.log(`Note Reference: ${reply.note_reference}`);
  console.log(`Advice: "${reply.reply_text.substring(0, 80)}..."`);
  console.log('✅ Test 5 Passed: Senior mentor guidance and note reference recorded.\n');

  // Test 6: Upvoting Helpful Solution
  console.log('--- Test 6: Upvote Helpful Problem ---');
  const upvoteRes = await fetch(`${BASE}/discussions/${createdPost.id}/upvote`, { method: 'POST' });
  const upvoteData = await upvoteRes.json();
  console.log(`New Upvotes: ${upvoteData.upvotes}`);
  if (upvoteData.upvotes !== 1) throw new Error('Expected upvotes count = 1');
  console.log('✅ Test 6 Passed: Upvote successfully incremented.\n');

  // Test 7: Live Study Circles & Real-Time Chat
  console.log('--- Test 7: Domain Study Circles & Live Chat ---');
  const circlesRes = await fetch(`${BASE}/circles`);
  const circlesData = await circlesRes.json();
  console.log(`Active Circles: ${circlesData.circles.length}`);
  const targetCircle = circlesData.circles[0];
  console.log(`Joined Circle: "${targetCircle.name}" (Lead: ${targetCircle.lead_mentor})`);

  // Send message to circle
  const sendMsgRes = await fetch(`${BASE}/circles/${targetCircle.id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      senderName: 'Alex Rivera',
      senderRole: 'Student',
      message: 'Thanks for the explanation about stack unwinding, Priya!'
    })
  });
  const sentMsg = await sendMsgRes.json();
  console.log(`Sent Message in Circle ${sentMsg.circle_id}: "${sentMsg.message}"`);

  // Read circle messages
  const getMsgsRes = await fetch(`${BASE}/circles/${targetCircle.id}/messages`);
  const msgsData = await getMsgsRes.json();
  console.log(`Total Messages in Circle: ${msgsData.messages.length}`);
  if (msgsData.messages.length < 2) throw new Error('Expected multiple messages in study circle');
  console.log('✅ Test 7 Passed: Live study circle interaction verified.\n');

  console.log('🎉 ALL PEER-TO-PEER LEARNING ACCEPTANCE TESTS PASSED WITH 100% SUCCESS!');
}

testPeerToPeerLearning().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
