const request=require('supertest'); const {connect,disconnect}=require('../src/config/database'); const app=require('../src/app');
beforeAll(async()=>{ process.env.MONGODB_URI='memory'; process.env.JWT_SECRET='test-secret'; await connect(); });
afterAll(async()=>{ await disconnect(); });
test('register + login + me + privacy', async()=>{
  const email='test'+Date.now()+'@example.com';
  const reg=await request(app).post('/api/auth/register').send({name:'Test',email,password:'password123'}); expect(reg.status).toBe(201); expect(reg.body.token).toBeTruthy();
  const login=await request(app).post('/api/auth/login').send({email,password:'password123'}); expect(login.status).toBe(200);
  const me=await request(app).get('/api/auth/me').set('Authorization','Bearer '+login.body.token); expect(me.status).toBe(200);
  const noAuth=await request(app).get('/api/documents'); expect(noAuth.status).toBe(401);
});
test('documents upload + tutor + quiz flow', async()=>{
  const email='flow'+Date.now()+'@example.com';
  const reg=await request(app).post('/api/auth/register').send({name:'Flow',email,password:'password123'}); const tok=reg.body.token; const H={Authorization:'Bearer '+tok};
  const up=await request(app).post('/api/documents/upload').set(H).attach('files',Buffer.from('Recursion means a function calls itself. Base case stops recursion. Call stack stores calls.'),'notes.txt'); expect(up.status).toBe(201);
  const docId=up.body.documents[0].id;
  const conv=await request(app).post('/api/tutor/conversations').set(H).send({documentIds:[docId],title:'T'}); expect(conv.status).toBe(201);
  const msg=await request(app).post(`/api/tutor/conversations/${conv.body.conversation._id}/messages`).set(H).send({content:'What is recursion?'}); expect(msg.status).toBe(201); expect(msg.body.grounded).toBe(true);
  const q=await request(app).post('/api/quizzes/generate').set(H).send({documentIds:[docId],count:3,difficulty:'Easy'}); expect(q.status).toBe(201); expect(q.body.quiz.questions.length).toBeGreaterThan(0);
  const att=await request(app).post(`/api/quizzes/${q.body.quiz._id}/attempts`).set(H).send({answers:[0,0,0]}); expect(att.status).toBe(201);
});
test('tasks + wellbeing + revisions + dashboard + peers', async()=>{
  const email='misc'+Date.now()+'@example.com';
  const reg=await request(app).post('/api/auth/register').send({name:'Misc',email,password:'password123'}); const tok=reg.body.token; const H={Authorization:'Bearer '+tok};
  const t=await request(app).post('/api/tasks').set(H).send({title:'Revise recursion',subject:'CS',dueDate:new Date(Date.now()+86400000)}); expect(t.status).toBe(201);
  const w=await request(app).post('/api/wellbeing/check-ins').set(H).send({stressLevel:4,workloadLevel:4,sleepQuality:2,energyLevel:2,motivationLevel:3}); expect(w.status).toBe(201);
  const tr=await request(app).get('/api/wellbeing/trends').set(H); expect(tr.status).toBe(200);
  const rv=await request(app).get('/api/revisions').set(H); expect(rv.status).toBe(200);
  const db=await request(app).get('/api/dashboard/summary').set(H); expect(db.status).toBe(200);
  const peers=await request(app).get('/api/peers/recommendations').set(H); expect(peers.status).toBe(200);
  const ls=await request(app).post('/api/learning-sessions').set(H).send({topic:'Recursion',documentIds:[]}); expect(ls.status).toBe(201);
});
test('privacy: user cannot see other user docs', async()=>{
  const a=await request(app).post('/api/auth/register').send({name:'A',email:'a'+Date.now()+'@example.com',password:'password123'});
  const b=await request(app).post('/api/auth/register').send({name:'B',email:'b'+Date.now()+'@example.com',password:'password123'});
  const up=await request(app).post('/api/documents/upload').set({Authorization:'Bearer '+a.body.token}).attach('files',Buffer.from('secret notes'),'secret.txt'); expect(up.status).toBe(201);
  const get=await request(app).get(`/api/documents/${up.body.documents[0].id}`).set({Authorization:'Bearer '+b.body.token}); expect(get.status).toBe(404);
});
test('upload rejects unsupported type', async()=>{
  const reg=await request(app).post('/api/auth/register').send({name:'U',email:'u'+Date.now()+'@example.com',password:'password123'});
  const up=await request(app).post('/api/documents/upload').set({Authorization:'Bearer '+reg.body.token}).attach('files',Buffer.from('x'),'evil.exe'); expect([400,500]).toContain(up.status);
});
