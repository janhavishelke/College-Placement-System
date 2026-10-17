require('dotenv').config();
function req(name,def){const v=process.env[name]||def; if(!v) throw new Error('Missing env '+name); return v;}
module.exports={PORT:parseInt(process.env.PORT||'5000',10),MONGODB_URI:process.env.MONGODB_URI||'memory',JWT_SECRET:process.env.JWT_SECRET||'dev-secret-change-me',AI_API_KEY:process.env.AI_API_KEY||'',AI_MODEL:process.env.AI_MODEL||'gpt-4o-mini',EMBEDDING_MODEL:process.env.EMBEDDING_MODEL||'tfidf-hash',VECTOR_DATABASE_URL:process.env.VECTOR_DATABASE_URL||'',FRONTEND_URL:process.env.FRONTEND_URL||'http://localhost:8000'};
