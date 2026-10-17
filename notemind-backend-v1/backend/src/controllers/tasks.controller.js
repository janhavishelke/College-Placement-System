const StudyTask=require('../models/StudyTask'); const StudySession=require('../models/StudySession'); const {analyzeTasks}=require('../services/reminder.service');
async function create(req,res,next){ try{ const t=await StudyTask.create({userId:req.user.id,...req.body}); res.status(201).json({task:t}); }catch(e){next(e);} }
async function list(req,res,next){ try{ const tasks=await StudyTask.find({userId:req.user.id}).sort({dueDate:1}); const sessions=await StudySession.find({userId:req.user.id}); const analysis=analyzeTasks(tasks,sessions); res.json({tasks,analysis}); }catch(e){next(e);} }
async function patch(req,res,next){ try{ const upd={...req.body}; if(req.body.status==='postponed') upd.$inc={postponeCount:1}; const t=await StudyTask.findOneAndUpdate({_id:req.params.id,userId:req.user.id},upd,{new:true}); if(!t) return res.status(404).json({error:'Task not found'}); res.json({task:t}); }catch(e){next(e);} }
async function remove(req,res,next){ try{ const t=await StudyTask.findOneAndDelete({_id:req.params.id,userId:req.user.id}); if(!t) return res.status(404).json({error:'Task not found'}); res.json({ok:true}); }catch(e){next(e);} }
module.exports={create,list,patch,remove};
