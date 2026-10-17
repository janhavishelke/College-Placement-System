const WellbeingCheckIn=require('../models/WellbeingCheckIn'); const {wellbeingMessage}=require('../services/reminder.service');
async function create(req,res,next){ try{ const c=await WellbeingCheckIn.create({userId:req.user.id,...req.body}); res.status(201).json({checkIn:c}); }catch(e){next(e);} }
async function list(req,res,next){ try{ const cs=await WellbeingCheckIn.find({userId:req.user.id}).sort({createdAt:-1}).limit(30); res.json({checkIns:cs,support:wellbeingMessage(cs)}); }catch(e){next(e);} }
async function trends(req,res,next){ try{ const cs=await WellbeingCheckIn.find({userId:req.user.id}).sort({createdAt:1}); const avg=(k)=>cs.length?(cs.reduce((a,c)=>a+(c[k]||0),0)/cs.length).toFixed(2):0; res.json({trends:{count:cs.length,avgStress:avg('stressLevel'),avgSleep:avg('sleepQuality'),avgEnergy:avg('energyLevel'),avgMotivation:avg('motivationLevel')},support:wellbeingMessage(cs),checkIns:cs.slice(-10)}); }catch(e){next(e);} }
async function remove(req,res,next){ try{ await WellbeingCheckIn.findOneAndDelete({_id:req.params.id,userId:req.user.id}); res.json({ok:true}); }catch(e){next(e);} }
module.exports={create,list,trends,remove};
