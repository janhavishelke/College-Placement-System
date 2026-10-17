const mongoose=require('mongoose');
const s=new mongoose.Schema({documentId:{type:mongoose.Schema.Types.ObjectId,ref:'Document',required:true,index:true},userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},text:{type:String,required:true},embedding:{type:[Number],default:[]},sourceReference:{type:mongoose.Schema.Types.Mixed,default:{}}});
s.index({documentId:1}); s.index({userId:1}); module.exports=mongoose.model('DocumentChunk',s);
