const mongoose=require('mongoose');
const s=new mongoose.Schema({conversationId:{type:mongoose.Schema.Types.ObjectId,ref:'Conversation',required:true,index:true},role:{type:String,enum:['user','assistant','system'],required:true},content:{type:String,required:true},sourceReferences:{type:[mongoose.Schema.Types.Mixed],default:[]},createdAt:{type:Date,default:Date.now}});
s.index({conversationId:1,createdAt:1}); module.exports=mongoose.model('Message',s);
