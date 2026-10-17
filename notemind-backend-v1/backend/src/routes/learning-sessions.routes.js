const r=require('express').Router(); const {auth}=require('../middleware/auth.middleware'); const c=require('../controllers/learning-sessions.controller');
r.post('/',auth,c.create); r.get('/:id',auth,c.getOne); r.post('/:id/answer',auth,c.answer); r.post('/:id/complete',auth,c.complete); module.exports=r;
