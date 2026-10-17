# NoteMind AI — Backend (NoteMind spec)
Node + Express + MongoDB + Mongoose + LLM via backend + RAG.
## Run
- `npm install`
- Copy `.env.example` to `.env`, set `MONGODB_URI` (or `memory` for in-memory dev), `JWT_SECRET`, `AI_API_KEY` (optional — falls back to grounded template).
- Real Mongo: `docker run -d -p 27017:27017 mongo:7` or use Atlas.
- `npm start` → http://localhost:5000
- Frontend (v6) on http://localhost:8000 — set `FRONTEND_URL=http://localhost:8000`. New backend on 5000, old Flask Unera extras on 5001 (frontend api.js tries 5000 first, falls back to 5001 for viva/debate/game/video/groups/exam/reminders/tts/sync).
## API
Auth: POST /api/auth/register|login|logout, GET /api/auth/me
Docs: POST /api/documents/upload (files, 20MB, PDF/DOCX/PPTX/TXT/MD/JPG/MP3/MP4/XLSX), GET /api/documents, GET /:id, GET /:id/status, PATCH /:id, DELETE /:id
Tutor: POST/GET /api/tutor/conversations, GET /:id, POST /:id/messages (RAG, citations, "Not in uploaded materials")
Quizzes: POST /api/quizzes/generate, GET /, GET /:id, POST /:id/attempts, GET /:id/attempts
Learning: POST /api/learning-sessions, GET /:id, POST /:id/answer, POST /:id/complete
Peers: GET /api/peers/recommendations, POST/GET /api/peer-requests, PATCH /:id, POST/GET /api/study-groups
Tasks: POST/GET/PATCH/DELETE /api/tasks (procrastination alerts in GET)
Wellbeing: POST/GET /api/wellbeing/check-ins, GET /api/wellbeing/trends (never diagnoses)
Revisions: GET /api/revisions, POST /:id/complete
Dashboard: GET /api/dashboard/summary
## AI
- `AI_API_KEY` optional. Without key, tutor uses grounded fallback from retrieved chunks (no invented facts). With key, calls OpenAI-compatible chat. Embeddings: deterministic hash/TF-IDF (no key). Set EMBEDDING_MODEL=openai + key to use external embeddings (not wired by default).
- Prompt injection: uploaded doc lines matching "ignore instructions" are stripped before retrieval/LLM.
## Tests
`npm test` — jest + supertest + mongodb-memory-server. Covers auth, docs+tutor+quiz flow, tasks/wellbeing/revisions/dashboard/peers, privacy, upload rejection.
## Security
JWT auth on all private routes, bcrypt hashing, ownership checks (userId on every query), multer type/size validation, rate limiting (chat 30/min), CORS, no keys to frontend.
