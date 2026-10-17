const {stripPromptInjection}=require('../utils/validators');
async function extractText(file){
  const name=(file.originalname||'').toLowerCase(); const buf=file.buffer||Buffer.from('');
  let text='', meta={};
  try{
    if(name.endsWith('.pdf')){ const pdf=require('pdf-parse'); const r=await pdf(buf); text=r.text||''; meta.pages=r.numpages; }
    else if(name.endsWith('.docx')){ const mammoth=require('mammoth'); const r=await mammoth.extractRawText({buffer:buf}); text=r.value||''; }
    else if(name.endsWith('.pptx')){ text='[PPTX] Binary PPTX — text extraction via fallback. Upload TXT/MD for full extraction in demo. '+buf.toString('utf8').slice(0,2000); meta.note='pptx-fallback'; }
    else if(/\.(txt|md|markdown|csv|html)$/.test(name)){ text=buf.toString('utf8'); }
    else if(/\.(jpg|jpeg|png)$/.test(name)){ text='[Demo OCR] Image uploaded. OCR placeholder — replace with tesseract.js for production. Filename: '+file.originalname; meta.ocr='demo'; }
    else if(/\.(mp3|wav|mp4|mov)$/.test(name)){ text='[Transcription placeholder] Audio/video uploaded. Transcribe with Whisper in production. Filename: '+file.originalname; meta.transcription='placeholder'; }
    else if(name.endsWith('.xlsx')){ text=buf.toString('utf8').slice(0,5000); }
    else text=buf.toString('utf8').slice(0,5000);
  }catch(e){ text=''; meta.error=e.message; }
  text=stripPromptInjection(text);
  return {text,meta};
}
module.exports={extractText};
