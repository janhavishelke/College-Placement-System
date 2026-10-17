const mongoose=require('mongoose');
const s=new mongoose.Schema({userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},documentIds:{type:[mongoose.Schema.Types.ObjectId],default:[]},title:{type:String,default:'New conversation'},language:{type:String,default:'en'},createdAt:{type:Date,default:Date.now}});
s.index({userId:1}); module.exports=mongoose.model('Conversation',s);
