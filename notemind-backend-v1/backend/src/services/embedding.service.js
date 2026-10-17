// Hash/TF-IDF style deterministic embeddings (no external key needed). If EMBEDDING_MODEL set to openai and key present, caller may replace.
const crypto=require('crypto');
function hashEmbed(text,dim=128){ const v=new Array(dim).fill(0); const words=String(text||'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(Boolean); for(const w of words){ const h=parseInt(crypto.createHash('md5').update(w).digest('hex').slice(0,8),16)%dim; v[h]+=1; } const n=Math.sqrt(v.reduce((a,b)=>a+b*b,0))||1; return v.map(x=>x/n); }
function cosine(a,b){ let d=0,na=0,nb=0; for(let i=0;i<a.length;i++){d+=a[i]*b[i];na+=a[i]*a[i];nb+=b[i]*b[i];} return d/((Math.sqrt(na)*Math.sqrt(nb))||1); }
module.exports={hashEmbed,cosine};
