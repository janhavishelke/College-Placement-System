const mongoose=require('mongoose');
const s=new mongoose.Schema({senderId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},recipientId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},status:{type:String,enum:['pending','accepted','declined'],default:'pending'},message:{type:String,default:''},createdAt:{type:Date,default:Date.now}});
s.index({recipientId:1,senderId:1}); module.exports=mongoose.model('StudyPartnerRequest',s);
