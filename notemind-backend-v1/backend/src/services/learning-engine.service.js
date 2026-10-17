// Structured learning flow: SELECT -> TOPIC -> EXPLAIN -> ANSWER -> EVALUATE -> FEEDBACK -> FOLLOW-UP -> SAVE
function explainConcept(topic, chunks){
  const ctx=chunks?.[0]?.chunk?.text?.slice(0,600)||'';
  return {explain:`Let's learn ${topic} in small steps.\nStep 1: What it is — ${ctx||'See your notes for the definition.'}\nStep 2: Why it matters — it connects to your other topics.\nStep 3: Example — try to give one example from your notes.\nNow, your turn: explain ${topic} in your own words.`,hints:['Think of the definition in your notes.','Give one example.','What happens if it is missing?']};
}
function evaluateAnswer(userAnswer, keyIdeas){
  const a=String(userAnswer||'').toLowerCase(); const ticks=keyIdeas.map(k=>a.includes(String(k).toLowerCase().split(' ')[0])); const gaps=keyIdeas.filter((k,i)=>!ticks[i]);
  const score=ticks.filter(Boolean).length; const total=keyIdeas.length||1;
  const feedback=score===total?'Great — you covered all key ideas.':`You covered ${score}/${total} key ideas. Missing: ${gaps.join(', ')||'none'}. Hint: re-read the definition and try again.`;
  const followUp=gaps.length?`Can you explain this missing part: ${gaps[0]}?`:'Excellent. Ready for a harder question on this topic?';
  return {ticks,gaps,score,total,feedback,followUp};
}
module.exports={explainConcept,evaluateAnswer};
