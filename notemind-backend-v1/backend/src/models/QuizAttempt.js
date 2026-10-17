const mongoose=require('mongoose');
const s=new mongoose.Schema({userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},quizId:{type:mongoose.Schema.Types.ObjectId,ref:'Quiz',required:true},answers:{type:[mongoose.Schema.Types.Mixed],default:[]},score:{type:Number,default:0},total:{type:Number,default:0},topicPerformance:{type:mongoose.Schema.Types.Mixed,default:{}},weakTopics:{type:[String],default:[]},completedAt:{type:Date,default:Date.now}});
s.index({userId:1,quizId:1}); module.exports=mongoose.model('QuizAttempt',s);
