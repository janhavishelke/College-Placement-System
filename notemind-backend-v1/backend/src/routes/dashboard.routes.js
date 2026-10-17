const r=require('express').Router(); const {auth}=require('../middleware/auth.middleware'); const c=require('../controllers/dashboard.controller');
r.get('/summary',auth,c.summary); module.exports=r;
