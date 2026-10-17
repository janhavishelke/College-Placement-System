function matchScore(me, other){
  let score=0, reasons=[];
  const sharedSubjects=(me.subjects||[]).filter(s=>(other.subjects||[]).includes(s)); score+=sharedSubjects.length*30; if(sharedSubjects.length) reasons.push('Shared: '+sharedSubjects.join(', '));
  const sharedGoals=(me.studyGoals||[]).filter(g=>(other.studyGoals||[]).includes(g)); score+=sharedGoals.length*20; if(sharedGoals.length) reasons.push('Shared goals');
  const sharedLang=(me.languages||[]).filter(l=>(other.languages||[]).includes(l)); score+=sharedLang.length*15; if(sharedLang.length) reasons.push('Shared language');
  const sharedTimes=(me.availableTimes||[]).filter(t=>(other.availableTimes||[]).includes(t)); score+=sharedTimes.length*15; if(sharedTimes.length) reasons.push('Compatible time');
  if(me.studyFormat && me.studyFormat===other.studyFormat){ score+=10; reasons.push('Same format'); }
  return {score:Math.min(score,100),reasons};
}
module.exports={matchScore};
