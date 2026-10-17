const r=require('express').Router(); const {auth}=require('../middleware/auth.middleware'); const User=require('../models/User');
r.get('/me',auth,async(req,res,next)=>{try{const u=await User.findById(req.user.id).select('-passwordHash');res.json({user:u});}catch(e){next(e);}});
r.patch('/me',auth,async(req,res,next)=>{try{const u=await User.findByIdAndUpdate(req.user.id,{$set:{name:req.body.name,preferredLanguage:req.body.preferredLanguage,subjects:req.body.subjects,studyGoals:req.body.studyGoals,languages:req.body.languages,availableTimes:req.body.availableTimes,studyFormat:req.body.studyFormat,profileVisible:req.body.profileVisible}},{new:true}).select('-passwordHash');res.json({user:u});}catch(e){next(e);}});
module.exports=r;
