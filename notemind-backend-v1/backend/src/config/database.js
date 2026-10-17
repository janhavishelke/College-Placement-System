const mongoose=require('mongoose'); const env=require('./environment');
let mem=null;
async function connect(){
  if(mongoose.connection.readyState===1) return mongoose.connection;
  let uri=env.MONGODB_URI;
  if(!uri||uri==='memory'){
    const {MongoMemoryServer}=require('mongodb-memory-server');
    mem=await MongoMemoryServer.create({ spawn: { startupTimeout: 60000 } }); uri=mem.getUri();
  }
  mongoose.set('strictQuery',false);
  await mongoose.connect(uri); return mongoose.connection;
}
async function disconnect(){ try{await mongoose.disconnect();}catch{} try{if(mem) await mem.stop();}catch{} }
module.exports={connect,disconnect,mongoose};
