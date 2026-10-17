function isEmail(s){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s||''));}
function reqStr(v,name){if(!v||typeof v!=='string'||!v.trim()){const e=new Error(name+' is required');e.status=400;throw e;}return v.trim();}
function cleanText(s){return String(s||'').replace(/\u0000/g,'');}
function stripPromptInjection(text){
  // Remove instruction-like lines that could hijack LLM (e.g. "Ignore previous instructions")
  return String(text||'').split('\n').filter(l=>!/ignore (previous|all|above) instructions|you are now|system prompt|disregard/i.test(l)).join('\n');
}
module.exports={isEmail,reqStr,cleanText,stripPromptInjection};
