const QuizAttempt=require('../models/QuizAttempt');
async function list(req,res,next){ try{ const atts=await QuizAttempt.find({userId:req.user.id}).sort({completedAt:-1}).limit(20); const map={}; for(const a of atts){ for(const w of (a.weakTopics||[])){ map[w]=(map[w]||0)+1; } } const revisions=Object.entries(map).map(([topic,count],i)=>({id:'rev_'+i,topic,priority:count>=2?'high':'medium',reason:`Missed ${count} time(s) in quizzes. Based on observed history, not a certain forgetting prediction.`,completed:false})); res.json({revisions}); }catch(e){next(e);} }
async function complete(req,res,next){ try{ res.json({ok:true,id:req.params.id,completed:true,message:'Revision marked complete.'}); }catch(e){next(e);} }
module.exports={list,complete};
