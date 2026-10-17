const {hashEmbed,cosine}=require('./embedding.service');
const DocumentChunk=require('../models/DocumentChunk');
function chunkText(text, size=500, overlap=100){ const out=[]; const t=String(text||''); if(!t) return out; for(let i=0;i<t.length;i+=size-overlap){ const chunk=t.slice(i,i+size); if(chunk.trim()) out.push({text:chunk,start:i}); if(i+size>=t.length) break; } return out; }
async function indexDocument(doc, userId){
  const chunks=chunkText(doc.extractedText||'');
  const docs=chunks.map((c,idx)=>({documentId:doc._id,userId,text:c.text,embedding:hashEmbed(c.text),sourceReference:{page:Math.floor(idx/3)+1,slide:idx+1,section:'chunk '+(idx+1)}}));
  if(docs.length) await DocumentChunk.insertMany(docs); return docs.length;
}
async function retrieve(userId, query, documentIds=[], topK=5){
  const q=hashEmbed(query); const filter={userId}; if(documentIds.length) filter.documentId={$in:documentIds};
  const all=await DocumentChunk.find(filter).lean();
  const scored=all.map(c=>({chunk:c,score:cosine(q,c.embedding||[])}));
  // Fallback: keyword overlap boost
  const qw=String(query).toLowerCase().split(/\s+/).filter(w=>w.length>3);
  for(const s of scored){ const txt=s.chunk.text.toLowerCase(); const hits=qw.filter(w=>txt.includes(w)).length; s.score+=hits*0.15; }
  scored.sort((a,b)=>b.score-a.score); return scored.slice(0,topK);
}
module.exports={chunkText,indexDocument,retrieve};
