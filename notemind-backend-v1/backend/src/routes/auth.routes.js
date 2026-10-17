const r=require('express').Router(); const c=require('../controllers/auth.controller'); const {auth}=require('../middleware/auth.middleware');
r.post('/register',c.register); r.post('/login',c.login); r.post('/logout',c.logout); r.get('/me',auth,c.me); module.exports=r;
