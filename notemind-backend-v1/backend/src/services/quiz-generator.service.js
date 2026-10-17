const {generateQuizItems}=require('./ai.service');
async function buildQuiz({text,count,difficulty,topic,language}){ const qs=await generateQuizItems({text,count,difficulty,topic,language}); return qs.filter(q=>q.question && (q.options?.length||q.correctAnswer)); }
module.exports={buildQuiz};
