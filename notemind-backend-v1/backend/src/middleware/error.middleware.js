module.exports=(err,req,res,next)=>{ console.error('[error]',err.message); const s=err.status||500; res.status(s).json({error:err.message||'Internal error'}); };
