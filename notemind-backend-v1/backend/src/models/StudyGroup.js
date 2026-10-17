const mongoose=require('mongoose');
const s=new mongoose.Schema({name:{type:String,required:true},subject:{type:String,default:''},memberIds:{type:[mongoose.Schema.Types.ObjectId],default:[]},createdBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'},code:{type:String},createdAt:{type:Date,default:Date.now}});
s.index({createdBy:1}); module.exports=mongoose.model('StudyGroup',s);
