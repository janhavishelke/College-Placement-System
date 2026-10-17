const request=require('supertest'); const {connect,disconnect}=require('../src/config/database'); const app=require('../src/app');
beforeAll(async()=>{await connect();}); afterAll(async()=>{await disconnect();});
test('health', async()=>{ const r=await request(app).get('/api/health'); expect(r.status).toBe(200); expect(r.body.ok).toBe(true); });
