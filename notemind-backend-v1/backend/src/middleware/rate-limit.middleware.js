const rateLimit=require('express-rate-limit');
module.exports={apiLimiter:rateLimit({windowMs:60*1000,max:120,standardHeaders:true,legacyHeaders:false}),chatLimiter:rateLimit({windowMs:60*1000,max:30,standardHeaders:true,legacyHeaders:false})};
