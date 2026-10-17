const mongoose=require('mongoose');
const s=new mongoose.Schema({userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},documentId:{type:mongoose.Schema.Types.ObjectId,ref:'Document'},documentIds:{type:[mongoose.Schema.Types.ObjectId],default:[]},questions:{type:[mongoose.Schema.Types.Mixed],default:[]},difficulty:{type:String,enum:['Easy','Medium','Hard'],default:'Medium'},language:{type:String,default:'en'},topic:{type:String,default:''},createdAt:{type:Date,default:Date.now}});
s.index({userId:1}); module.exports=mongoose.model('Quiz',s);
