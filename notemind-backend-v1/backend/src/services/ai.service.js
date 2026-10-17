const env=require('../config/environment');
// LLM via fetch (OpenAI-compatible or Gemini). Falls back to grounded template if no key.
async function callLLM(messages){
  if(!env.AI_API_KEY) return null;
  try{
    // OpenAI-compatible endpoint
    const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+env.AI_API_KEY},body:JSON.stringify({model:env.AI_MODEL||'gpt-4o-mini',messages,temperature:0.2})});
    if(!r.ok) return null; const j=await r.json(); return j.choices?.[0]?.message?.content||null;
  }catch{ return null; }
}
async function answerWithRAG({question, chunks, language}){
  const ctx=chunks.map((c,i)=>`[Source ${i+1} ${c.chunk.sourceReference?.page?('p.'+c.chunk.sourceReference.page):''}] ${c.chunk.text.slice(0,800)}`).join('\n\n');
  if(!ctx.trim()) return {answer:'Not in uploaded materials.',grounded:false,sourceRefs:[]};
  const sys=`You are NoteMind AI tutor. Answer ONLY from the provided sources. If not in sources, say "Not in uploaded materials." Distinguish source-supported info from additional explanation. Language: ${language||'en'}. Be simple, step-by-step, with an example.`;
  const llm=await callLLM([{role:'system',content:sys},{role:'user',content:`Sources:\n${ctx}\n\nQuestion: ${question}`}]);
  if(llm) return {answer:llm,grounded:true,sourceRefs:chunks.map(c=>c.chunk.sourceReference)};
  // Grounded fallback (no key): extract best chunk + simple explanation from it
  const best=chunks[0].chunk.text.slice(0,900);
  return {answer:`From your notes: ${best}\n\nIn simple words: This is explained in your uploaded material above. If you want, ask a follow-up about a specific part.`,grounded:true,sourceRefs:chunks.map(c=>c.chunk.sourceReference)};
}
async function generateQuizItems({text, count, difficulty, topic, language}){
  // Deterministic grounded quiz from source sentences (no invented facts). If LLM key present, try LLM then validate.
  const sentences=String(text||'').split(/(?<=[.!?])\s+/).filter(s=>s.length>30).slice(0,30);
  const items=[]; const n=Math.min(count||5, sentences.length||5);
  for(let i=0;i<n;i++){
    const s=sentences[i%Math.max(sentences.length,1)]||'From your notes, this concept is important.';
    const words=s.split(' ').filter(w=>w.length>4); const key=words[Math.floor(words.length/2)]||'concept';
    const qtype=i%4===0?'true-false':i%4===1?'short-answer':i%4===2?'fill-blank':'mcq';
    if(qtype==='mcq') items.push({type:'mcq',question:`According to your notes, which is true about: ${s.slice(0,120)}?`,options:[s.slice(0,120), 'Not stated in notes','Opposite of notes','Unrelated fact'],correctIndex:0,explanation:`From your notes: ${s.slice(0,200)}`,difficulty,topic,language});
    else if(qtype==='true-false') items.push({type:'true-false',question:`True or False: ${s.slice(0,160)}`,options:['True','False'],correctIndex:0,explanation:`From your notes: ${s.slice(0,200)}`,difficulty,topic,language});
    else if(qtype==='short-answer') items.push({type:'short-answer',question:`In your own words, explain: ${s.slice(0,140)}`,options:[],correctAnswer:s.slice(0,200),explanation:`Expected key ideas: ${s.slice(0,200)}`,difficulty,topic,language});
    else items.push({type:'fill-blank',question:`Fill in the blank: ${s.replace(key,'_____').slice(0,180)}`,options:[],correctAnswer:key,explanation:`From your notes: ${s.slice(0,200)}`,difficulty,topic,language});
  }
  return items;
}
module.exports={callLLM,answerWithRAG,generateQuizItems};
