const mongoose=require('mongoose');
const s=new mongoose.Schema({userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},subject:{type:String,default:''},startedAt:{type:Date,default:Date.now},completedAt:{type:Date},plannedDuration:{type:Number,default:30},actualDuration:{type:Number,default:0},status:{type:String,enum:['started','completed','abandoned'],default:'started'}});
s.index({userId:1}); module.exports=mongoose.model('StudySession',s);
