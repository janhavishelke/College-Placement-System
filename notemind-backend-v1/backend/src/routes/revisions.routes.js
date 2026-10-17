const r=require('express').Router(); const {auth}=require('../middleware/auth.middleware'); const c=require('../controllers/revisions.controller');
r.get('/',auth,c.list); r.post('/:id/complete',auth,c.complete); module.exports=r;
