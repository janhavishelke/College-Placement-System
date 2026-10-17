const r=require('express').Router(); const {auth}=require('../middleware/auth.middleware'); const c=require('../controllers/quizzes.controller');
r.post('/generate',auth,c.generate); r.get('/',auth,c.list); r.get('/:id',auth,c.getOne); r.post('/:id/attempts',auth,c.attempt); r.get('/:id/attempts',auth,c.attempts); module.exports=r;
