# NoteMind AI — Full Stack (Spec-Compliant) + Unera Extras
## What is this?
- `backend/` = NEW Node + Express + MongoDB + Mongoose backend per NoteMind spec (Port 5000). Auth (JWT+bcrypt), Documents (PDF/DOCX/PPTX/TXT/MD/Image/Audio/Video), Tutor RAG (chunking 500/100 + hash embeddings + cosine + source refs, "Not in uploaded materials"), Quizzes (MCQ/TF/Short/Fill-in, difficulty, topic, language, attempts, weak topics), Learning Sessions (SELECT→TOPIC→EXPLAIN→ANSWER→EVALUATE→FEEDBACK→FOLLOW-UP→SAVE), Peer Matching (subjects+goals+availability+language+format scoring), Tasks + Procrastination alerts (supportive, no shaming), Wellbeing (voluntary check-ins, trends, never diagnoses), Revisions (observed history, no certain forgetting claim), Dashboard, Users, Study Groups.
- `frontend/` = React + Vite frontend (Port 8000) copied from Unera v6 + patched: api.js tries new backend (5000) first, falls back to legacy Flask Unera backend (5001) for Unera-only features (Viva, Debate, Game, Video, Groups, Exam, Reminders, TTS, Sync). New pages: Auth (Login/Register), Peers, Planner, Wellbeing, Revision, Learning, Dashboard. Existing Unera features kept: Chat, Quiz, Viva, Video, Groups, Exam, Debate, Game, Offline, TTS, Light/Dark, Split + 3D logo, Clay.
## Run
1. New backend: `cd backend && npm install && cp .env.example .env` — set MONGODB_URI (use `memory` for in-memory dev, or `mongodb://localhost:27017/notemind`, or Atlas). Set JWT_SECRET. Optional AI_API_KEY (without key, tutor uses grounded fallback, no invented facts). `npm start` → http://localhost:5000
2. Legacy Flask Unera backend (for Viva/Debate/Game/Video/etc.): `cd ~/workspace/unera-app-v6/backend/server && pip install flask flask-cors gtts && python seed.py && python app.py` → http://localhost:5001
3. Frontend: `cd frontend && npm install && npm run dev -- --port 8000` → http://localhost:8000 (Vite proxies /api to 5000; api.js also falls back to 5001)
## Tests
`cd backend && npm test` — 6 tests pass (auth, docs+tutor+quiz, tasks/wellbeing/revisions/dashboard/peers, privacy, upload rejection, health).
## Notes / Gaps (honest)
- Embeddings are deterministic hash/TF-IDF, not OpenAI embeddings. Set EMBEDDING_MODEL + key to swap in external embeddings.
- LLM: without AI_API_KEY, grounded template fallback. With key, OpenAI-compatible chat.
- PPTX extraction is fallback (use TXT/MD for full text in demo). Image OCR is Demo placeholder (use tesseract.js in prod). Audio/video transcription is placeholder (use Whisper in prod).
- Learning sessions are in-memory (not persisted to Mongo) — summary returned, but restart loses session.
- Quiz generator is grounded sentence-based, not LLM-generated.
- Real Mongo needed for prod; `memory` uses mongodb-memory-server (downloads binary on first run).
