const r=require('express').Router(); const {auth}=require('../middleware/auth.middleware'); const c=require('../controllers/study-partners.controller');
r.get('/recommendations',auth,c.recommendations); module.exports=r;
