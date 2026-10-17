const {connect}=require('./config/database'); const env=require('./config/environment'); const app=require('./app');
(async()=>{ await connect(); console.log('Mongo connected'); app.listen(env.PORT,()=>console.log('NoteMind backend on '+env.PORT)); })().catch(e=>{console.error(e);process.exit(1);});
