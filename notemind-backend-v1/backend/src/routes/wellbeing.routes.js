const r=require('express').Router(); const {auth}=require('../middleware/auth.middleware'); const c=require('../controllers/wellbeing.controller');
r.post('/check-ins',auth,c.create); r.get('/check-ins',auth,c.list); r.get('/trends',auth,c.trends); r.delete('/check-ins/:id',auth,c.remove); module.exports=r;
