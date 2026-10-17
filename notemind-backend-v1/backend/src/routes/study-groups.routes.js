const r=require('express').Router(); const {auth}=require('../middleware/auth.middleware'); const StudyGroup=require('../models/StudyGroup');
r.post('/',auth,async(req,res,next)=>{try{const g=await StudyGroup.create({name:req.body.name,subject:req.body.subject,memberIds:[req.user.id],createdBy:req.user.id,code:'GRP-'+Math.floor(100+Math.random()*900)});res.status(201).json({group:g});}catch(e){next(e);}});
r.get('/',auth,async(req,res,next)=>{try{const gs=await StudyGroup.find({memberIds:req.user.id});res.json({groups:gs});}catch(e){next(e);}});
r.post('/:id/join',auth,async(req,res,next)=>{try{const g=await StudyGroup.findByIdAndUpdate(req.params.id,{$addToSet:{memberIds:req.user.id}},{new:true});res.json({group:g});}catch(e){next(e);}});
module.exports=r;
