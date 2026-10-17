// Procrastination detection: postpone, missing, overdue, abandoning -> supportive alerts, no shaming
function analyzeTasks(tasks, sessions){
  const now=new Date(); const overdue=tasks.filter(t=>t.dueDate && new Date(t.dueDate)<now && t.status!=='done');
  const postponed=tasks.filter(t=>(t.postponeCount||0)>=2);
  const abandoned=(sessions||[]).filter(s=>s.status==='abandoned').length;
  const alerts=[];
  if(postponed.length) alerts.push({type:'postpone',message:`You postponed "${postponed[0].title}" twice. Would you like to break it into a smaller 15-minute study session?`,taskId:postponed[0]._id});
  if(overdue.length) alerts.push({type:'overdue',message:`You have ${overdue.length} overdue task(s). Want a lighter plan for today?`,count:overdue.length});
  if(abandoned>=2) alerts.push({type:'abandoned',message:'You started a few sessions but did not finish. Want to try a short 15-minute session?'}); 
  return {overdue:overdue.length,postponed:postponed.length,abandoned,alerts};
}
function wellbeingMessage(checkins){
  const recent=checkins.slice(-5); if(!recent.length) return null;
  const highStress=recent.filter(c=>c.stressLevel>=4).length>=3;
  const lowSleep=recent.filter(c=>c.sleepQuality<=2).length>=3;
  const lowEnergy=recent.filter(c=>c.energyLevel<=2).length>=3;
  if(highStress||lowSleep||lowEnergy) return {message:'Your recent check-ins suggest studying has felt particularly demanding. Would you like to create a lighter study plan, take a short break, or explore student support resources?',flags:{highStress,lowSleep,lowEnergy}};
  return null;
}
module.exports={analyzeTasks,wellbeingMessage};
