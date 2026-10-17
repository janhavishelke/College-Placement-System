// NoteMind API: tries NEW Node backend (5000) first, falls back to legacy Flask Unera backend (5001)
// for Unera-only features (viva, debate, game, video, groups, exam, reminders, tts, sync).
const NEW_BASE = (typeof window!=='undefined' && window.__NOTEMIND_API__) || 'http://localhost:5000';
const LEGACY_BASE = 'http://localhost:5001';
const UNERA_ONLY = ['/api/viva','/api/debate','/api/game','/api/video','/api/groups','/api/exam','/api/reminders','/api/tts','/api/sync','/api/offline-data','/api/voice','/api/translate','/api/ocr','/api/voice-notes','/api/pyq','/api/mindmap','/api/flashcards','/api/report','/api/download','/api/analytics','/api/error','/api/concepts','/api/notes','/api/docs','/api/documents','/api/doubts','/api/verify','/api/interruptions'];
function token(){ try{ return localStorage.getItem('unera_token')||localStorage.getItem('notemind_token')||''; }catch{ return ''; } }
export function setToken(t){ try{ localStorage.setItem('notemind_token',t); localStorage.setItem('unera_token',t);}catch{} }
export function clearToken(){ try{ localStorage.removeItem('notemind_token'); localStorage.removeItem('unera_token');}catch{} }
export function isUneraOnly(path){ return UNERA_ONLY.some(p=>path.startsWith(p)); }
async function fetchOnce(base,path,opts){
  const headers={'Content-Type':'application/json',...(opts.headers||{})};
  const tk=token(); if(tk) headers.Authorization='Bearer '+tk;
  const r=await fetch(base+path,{...opts,headers});
  const t=await r.text(); let j; try{ j=JSON.parse(t);}catch{ j={raw:t}; }
  if(!r.ok){ const e=new Error(j.error||('API '+r.status)); e.status=r.status; e.body=j; throw e; }
  return j;
}
export async function api(path, opts={}){
  // New backend first for spec endpoints; legacy first for Unera-only
  const order = isUneraOnly(path) ? [LEGACY_BASE, NEW_BASE] : [NEW_BASE, LEGACY_BASE];
  let lastErr=null;
  for(const base of order){
    try{ return await fetchOnce(base,path,opts); }catch(e){ lastErr=e; if(e.status===401||e.status===400||e.status===404||e.status===409) { /* don't fallback on auth/validation for new-backend spec paths */ if(!isUneraOnly(path) && base===NEW_BASE) throw e; if(isUneraOnly(path) && base===LEGACY_BASE) { /* try new backend next */ continue; } } }
  }
  throw lastErr||new Error('API failed');
}
export const get=(p)=>api(p);
export const post=(p,b)=>api(p,{method:'POST',body:JSON.stringify(b||{})});
export async function uploadFiles(files, extra={}){
  // Try new backend /api/documents/upload (multer, field 'files'), fallback to legacy /api/upload (field 'file')
  const tk=token();
  for(const [base, field] of [[NEW_BASE,'files'],[LEGACY_BASE,'file']]){
    try{
      const fd=new FormData(); for(const f of files) fd.append(field,f); for(const [k,v] of Object.entries(extra)) fd.append(k,v);
      const headers={}; if(tk) headers.Authorization='Bearer '+tk;
      const r=await fetch(base+'/api/documents/upload', {method:'POST',headers,body:fd});
      // legacy expects /api/upload, try it if new returns 404
      if(r.status===404 && base===LEGACY_BASE){ const fd2=new FormData(); fd2.append('file',files[0]); const r2=await fetch(base+'/api/upload',{method:'POST',body:fd2}); if(!r2.ok) throw new Error('Upload '+r2.status); return await r2.json(); }
      if(!r.ok) throw new Error('Upload '+r.status);
      return await r.json();
    }catch(e){ if(base===LEGACY_BASE) throw e; }
  }
}
