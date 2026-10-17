// Minimal Unera-compat endpoints so frontend fallback still works on new backend.
// Full Unera extras (viva, debate, game, video, groups, exam, reminders, tts, sync) live in Flask backend on 5001;
// frontend api.js tries new backend first, falls back to Flask for those paths.
const r=require('express').Router(); const {auth}=require('../middleware/auth.middleware');
r.get('/health', (req,res)=>res.json({ok:true,service:'notemind-unera-compat'}));
module.exports=r;
