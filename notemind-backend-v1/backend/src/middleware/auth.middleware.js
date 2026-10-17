const jwt=require('jsonwebtoken'); const env=require('../config/environment');
function auth(req,res,next){ try{ const h=req.headers.authorization||''; const t=h.startsWith('Bearer ')?h.slice(7):null; if(!t) return res.status(401).json({error:'Unauthorized'}); const d=jwt.verify(t,env.JWT_SECRET); req.user={id:d.id,email:d.email,role:d.role||'student'}; next(); }catch(e){ return res.status(401).json({error:'Invalid token'});} }
function optionalAuth(req,res,next){ try{ const h=req.headers.authorization||''; const t=h.startsWith('Bearer ')?h.slice(7):null; if(t){const d=jwt.verify(t,env.JWT_SECRET); req.user={id:d.id,email:d.email};} }catch{} next(); }
module.exports={auth,optionalAuth};
