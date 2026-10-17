const multer=require('multer');
const allowed=['.pdf','.docx','.pptx','.txt','.md','.markdown','.jpg','.jpeg','.png','.mp3','.wav','.mp4','.mov','.xlsx','.csv','.html'];
const storage=multer.memoryStorage();
const upload=multer({storage,limits:{fileSize:20*1024*1024},fileFilter:(req,file,cb)=>{ const n=(file.originalname||'').toLowerCase(); const ok=allowed.some(e=>n.endsWith(e)); if(!ok) return cb(new Error('Unsupported file type')); cb(null,true); }});
module.exports={upload,allowed};
