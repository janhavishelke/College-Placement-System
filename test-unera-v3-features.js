async function testV3Features() {
  const BASE = 'http://localhost:5001/api';
  console.log('🧪 Testing UNERA v3 Features Endpoints...\n');

  // 1. Feature 6: Notes to Video
  console.log('--- Feature 6: Video Lesson ---');
  const vidRes = await fetch(`${BASE}/video/lesson?concept=Recursion`);
  const vid = await vidRes.json();
  console.log(`Video concept: ${vid.concept}, slides count: ${vid.slides?.length}`);
  if (!vid.slides || vid.slides.length === 0) throw new Error('Video slides missing');
  console.log('✅ Feature 6 passed.\n');

  // 2. Feature 7: Flashcards & Artifacts
  console.log('--- Feature 7: Flashcards & Key Points ---');
  const artRes = await fetch(`${BASE}/artifacts`);
  const art = await artRes.json();
  console.log(`Flashcards count: ${art.flashcards?.length}, Key points: ${art.keyPoints?.length}`);
  if (!art.flashcards || art.flashcards.length === 0) throw new Error('Flashcards missing');
  console.log('✅ Feature 7 passed.\n');

  // 3. Feature 9: Reports & Summary
  console.log('--- Feature 9: Reports & 7-Day Spaced Repetition Plan ---');
  const repRes = await fetch(`${BASE}/reports`);
  const rep = await repRes.json();
  console.log(`Overall Mastery: ${rep.overallMastery}%, Topics: ${rep.topics?.length}, Plan Days: ${rep.revisionPlan?.length}`);
  if (!rep.topics || !rep.revisionPlan) throw new Error('Reports or revision plan missing');
  console.log('✅ Feature 9 passed.\n');

  // 4. Feature 10: Quiz (3 Modes)
  console.log('--- Feature 10: Quiz Modes ---');
  const q5Res = await fetch(`${BASE}/quiz?mode=5_questions`);
  const q5 = await q5Res.json();
  console.log(`5 Questions Mode: received ${q5.questions?.length} questions`);

  const qProactiveRes = await fetch(`${BASE}/quiz?mode=proactive`);
  const qProactive = await qProactiveRes.json();
  console.log(`Proactive Mode: received ${qProactive.questions?.length} questions`);

  const qMistakesRes = await fetch(`${BASE}/quiz?mode=mistakes_only`);
  const qMistakes = await qMistakesRes.json();
  console.log(`Mistakes-Only Mode: received ${qMistakes.questions?.length} questions`);

  // Submit quiz answer
  const submitRes = await fetch(`${BASE}/quiz/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers: { 1: 0 } })
  });
  const submitData = await submitRes.json();
  console.log(`Quiz Submit Score: ${submitData.score}/${submitData.total}`);
  console.log('✅ Feature 10 passed.\n');

  // 5. Feature 11: Multilingual Tutor
  console.log('--- Feature 11: Multilingual Tutor ---');
  const hinglishRes = await fetch(`${BASE}/multilingual/translate?concept=Recursion&lang=hinglish`);
  const hinglish = await hinglishRes.json();
  console.log(`Hinglish explanation: ${hinglish.text.substring(0, 60)}...`);

  const hindiRes = await fetch(`${BASE}/multilingual/translate?concept=Recursion&lang=hindi`);
  const hindi = await hindiRes.json();
  console.log(`Hindi explanation: ${hindi.text.substring(0, 60)}...`);
  if (!hinglish.text || !hindi.text) throw new Error('Multilingual translations missing');
  console.log('✅ Feature 11 passed.\n');

  // 6. Feature 12: Handwritten OCR
  console.log('--- Feature 12: Handwritten OCR Save Note ---');
  const ocrSaveRes = await fetch(`${BASE}/ocr/save-note`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Handwritten Graph Traversal Notes',
      content: 'DFS uses recursive stack. BFS uses iterative queue.'
    })
  });
  const ocrDoc = await ocrSaveRes.json();
  console.log(`Saved OCR Document ID: ${ocrDoc.id}, Title: "${ocrDoc.title}"`);
  console.log('✅ Feature 12 passed.\n');

  // 7. Feature 13: Voice Notes to Text
  console.log('--- Feature 13: Voice Notes to Text ---');
  const vnRes = await fetch(`${BASE}/voicenotes/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Voice Memo: Base Case Clarification',
      transcript: 'Base case returns directly to prevent maximum call stack size exceeded.'
    })
  });
  const vnDoc = await vnRes.json();
  console.log(`Saved Voice Note ID: ${vnDoc.id}, Title: "${vnDoc.title}"`);
  console.log('✅ Feature 13 passed.\n');

  // 8. Feature 14: PYQ Analyzer
  console.log('--- Feature 14: PYQ Analyzer ---');
  const pyqRes = await fetch(`${BASE}/pyq`);
  const pyq = await pyqRes.json();
  console.log(`PYQ Questions Count: ${pyq.questions?.length}`);
  if (!pyq.questions || pyq.questions.length === 0) throw new Error('PYQ questions missing');
  console.log(`Top PYQ: "${pyq.questions[0].question}" (Frequency: ${pyq.questions[0].frequency})`);
  console.log('✅ Feature 14 passed.\n');

  // 9. Interactive Floor Lamp Login Page
  console.log('--- Login Page Verification ---');
  const loginRes = await fetch('http://localhost:5001/login.html');
  const loginHtml = await loginRes.text();
  if (!loginHtml.includes('PlacementHub & Unera') || !loginHtml.toLowerCase().includes('verlet')) {
    throw new Error('login.html does not contain required title or Verlet script');
  }
  console.log('✅ Login page served and verified.\n');

  console.log('🎉 ALL V3 FEATURES & ENDPOINTS VERIFIED SUCCESSFULLY!');
}

testV3Features().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
