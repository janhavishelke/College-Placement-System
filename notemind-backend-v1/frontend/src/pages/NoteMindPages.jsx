import React,{useState,useEffect} from 'react';
import {get,post,setToken,clearToken} from '../api.js';
export function AuthView({onAuth}){
  const [mode,setMode]=useState('login'); const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [msg,setMsg]=useState('');
  async function submit(){ try{ const r=await post(mode==='login'?'/api/auth/login':'/api/auth/register',{name,email,password}); setToken(r.token); setMsg('Logged in as '+r.user.email); onAuth&&onAuth(r.user); }catch(e){ setMsg('Error: '+e.message); } }
  return (<div><h2>{mode==='login'?'Login':'Register'} — NoteMind AI</h2><p className="muted">JWT auth. Passwords hashed with bcrypt, never plaintext. Token stored in localStorage.</p>
  {mode==='register'&&<input value={name} onChange={e=>setName(e.target.value)} placeholder="Name"/>}
  <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email"/>
  <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password (6+ chars)"/>
  <button onClick={submit}>{mode==='login'?'Login':'Register'}</button>
  <button className="secondary" onClick={()=>setMode(mode==='login'?'register':'login')}>Switch to {mode==='login'?'Register':'Login'}</button>
  <button className="secondary" onClick={()=>{clearToken(); setMsg('Logged out');}}>Logout</button>
  {msg&&<div className="msg">{msg}</div>}</div>);
}
export function PeersView(){
  const [recs,setRecs]=useState([]); const [reqs,setReqs]=useState([]); const [msg,setMsg]=useState('');
  useEffect(()=>{ get('/api/peers/recommendations').then(r=>setRecs(r.recommendations||[])).catch(e=>setMsg('Peers (new backend) needs login: '+e.message)); get('/api/peer-requests').then(r=>setReqs(r.requests||[])).catch(()=>{}); },[]);
  return (<div><h2>Study Partners — Peer Matching</h2><p className="muted">Matching by shared subjects + goals + availability + language + format. Privacy: no private contact by default.</p>
  {msg&&<div className="msg">{msg}</div>}
  {recs.map((r,i)=><div key={i} className="msg"><b>{r.user?.name||'Student'}</b> — Score {r.score} — {r.reasons?.join(' | ')} <button onClick={async()=>{ await post('/api/peer-requests',{recipientId:r.user.id,message:'Hi, want to study together?'}); setMsg('Request sent'); }}>Send Request</button></div>)}
  <h3>Requests</h3>{reqs.map((q,i)=><div key={i} className="msg">{q.status} — <button onClick={async()=>{ await fetch('http://localhost:5000/api/peer-requests/'+q._id,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:'Bearer '+(localStorage.getItem('notemind_token')||'')},body:JSON.stringify({status:'accepted'})}); setMsg('Accepted'); }}>Accept</button> <button onClick={async()=>{ await fetch('http://localhost:5000/api/peer-requests/'+q._id,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:'Bearer '+(localStorage.getItem('notemind_token')||'')},body:JSON.stringify({status:'declined'})}); setMsg('Declined'); }}>Decline</button></div>)}</div>);
}
export function PlannerView(){
  const [tasks,setTasks]=useState([]); const [title,setTitle]=useState(''); const [alerts,setAlerts]=useState([]);
  async function load(){ try{ const r=await get('/api/tasks'); setTasks(r.tasks||[]); setAlerts(r.analysis?.alerts||[]);}catch(e){} } useEffect(()=>{load();},[]);
  return (<div><h2>Study Planner — Procrastination Alerts</h2><p className="muted">Supportive alerts only, never shaming. Disable via reminderSettings.</p>
  {alerts.map((a,i)=><div key={i} className="msg"><b>{a.type}:</b> {a.message}</div>)}
  <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="New task title"/><button onClick={async()=>{ await post('/api/tasks',{title,subject:'CS',dueDate:new Date(Date.now()+86400000)}); setTitle(''); load(); }}>Add Task</button>
  {tasks.map(t=><div key={t._id} className="msg">{t.title} — {t.status} — Due {t.dueDate?new Date(t.dueDate).toLocaleDateString():''} <button onClick={async()=>{ await fetch('http://localhost:5000/api/tasks/'+t._id,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:'Bearer '+(localStorage.getItem('notemind_token')||'')},body:JSON.stringify({status:'done'})}); load(); }}>Done</button> <button onClick={async()=>{ await fetch('http://localhost:5000/api/tasks/'+t._id,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:'Bearer '+(localStorage.getItem('notemind_token')||'')},body:JSON.stringify({status:'postponed'})}); load(); }}>Postpone</button></div>)}</div>);
}
export function WellbeingView(){
  const [list,setList]=useState([]); const [support,setSupport]=useState(null); const [stress,setStress]=useState(3);
  async function load(){ const r=await get('/api/wellbeing/check-ins').catch(()=>({checkIns:[]})); setList(r.checkIns||[]); setSupport(r.support); const t=await get('/api/wellbeing/trends').catch(()=>null); if(t) setSupport(t.support||support); }
  useEffect(()=>{load();},[]);
  return (<div><h2>Well-being — Voluntary Check-ins</h2><p className="muted">Educational well-being only, not medical diagnosis. Private, deletable. Never used for rankings.</p>
  {support&&<div className="msg"><b>Support:</b> {support.message}</div>}
  <label>Stress 1-5 <input type="number" min="1" max="5" value={stress} onChange={e=>setStress(e.target.value)}/></label>
  <button onClick={async()=>{ await post('/api/wellbeing/check-ins',{stressLevel:Number(stress),workloadLevel:3,sleepQuality:3,energyLevel:3,motivationLevel:3,examPressure:3}); load(); }}>Save Check-in</button>
  {list.slice(0,5).map(c=><div key={c._id} className="msg">Stress {c.stressLevel} | Sleep {c.sleepQuality} | Energy {c.energyLevel} | {new Date(c.createdAt).toLocaleDateString()}</div>)}</div>);
}
export function RevisionView(){
  const [revs,setRevs]=useState([]);
  useEffect(()=>{ get('/api/revisions').then(r=>setRevs(r.revisions||[])).catch(()=>{}); },[]);
  return (<div><h2>Revision Center</h2><p className="muted">Based on observed quiz history + mistakes + time since review. We do not claim certain forgetting prediction.</p>
  {revs.length===0&&<p>No revision tasks yet — complete a quiz first.</p>}
  {revs.map((r,i)=><div key={i} className="msg"><b>{r.topic}</b> — Priority {r.priority} — {r.reason} <button onClick={async()=>{ await post('/api/revisions/'+r.id+'/complete',{}); setRevs(revs.filter(x=>x.id!==r.id)); }}>Complete</button></div>)}</div>);
}
export function LearningSessionView(){
  const [topic,setTopic]=useState('Recursion'); const [session,setSession]=useState(null); const [answer,setAnswer]=useState(''); const [ev,setEv]=useState(null);
  return (<div><h2>Interactive Learning Session</h2><p className="muted">Flow: Select Doc → Topic → AI Explains → You Answer → AI Evaluates → Feedback → Follow-up → Save.</p>
  <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Topic"/>
  <button onClick={async()=>{ const r=await post('/api/learning-sessions',{topic,documentIds:[]}); setSession(r.session); setEv(null); }}>Start Session</button>
  {session&&<div className="msg"><b>AI Explains:</b><pre style={{whiteSpace:'pre-wrap'}}>{session.explain}</pre><p>Hints: {session.hints?.join(' | ')}</p>
  <textarea value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Your answer in own words"/>
  <button onClick={async()=>{ const r=await post(`/api/learning-sessions/${session.id}/answer`,{answer,keyIdeas:['definition','example','why it matters']}); setEv(r.evaluation); }}>Submit Answer</button>
  {ev&&<div><p><b>Feedback:</b> {ev.feedback}</p><p>Follow-up: {ev.followUp}</p></div>}
  <button onClick={async()=>{ const r=await post(`/api/learning-sessions/${session.id}/complete`,{}); alert(r.summary); }}>Complete + Summary</button></div>}</div>);
}
export function DashboardView(){
  const [d,setD]=useState(null);
  useEffect(()=>{ get('/api/dashboard/summary').then(r=>setD(r.summary)).catch(()=>{}); },[]);
  if(!d) return (<div><h2>Dashboard — NoteMind</h2><p>Login to see real data. Empty states shown when no docs/activities.</p></div>);
  return (<div><h2>Dashboard — NoteMind</h2><p>Docs: {d.documents?.length||0} | Quiz attempts: {d.quizAttempts?.length||0} | Weak: {(d.weakTopics||[]).join(', ')||'none'} | Tasks: {d.tasks?.length||0} | Partner requests: {d.partnerRequests?.length||0}</p>
  <p className="muted">Empty states: {d.empty?.noDocs?'No documents yet — upload one.':''} {d.empty?.noQuizzes?'No quizzes yet.':''}</p></div>);
}
