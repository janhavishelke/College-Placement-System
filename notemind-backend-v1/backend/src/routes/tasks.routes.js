const r=require('express').Router(); const {auth}=require('../middleware/auth.middleware'); const c=require('../controllers/tasks.controller');
r.post('/',auth,c.create); r.get('/',auth,c.list); r.patch('/:id',auth,c.patch); r.delete('/:id',auth,c.remove); module.exports=r;
