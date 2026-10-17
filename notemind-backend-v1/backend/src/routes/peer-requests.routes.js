const r=require('express').Router(); const {auth}=require('../middleware/auth.middleware'); const c=require('../controllers/study-partners.controller');
r.post('/',auth,c.createRequest); r.get('/',auth,c.listRequests); r.patch('/:id',auth,c.patchRequest); module.exports=r;
