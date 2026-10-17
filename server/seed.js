const fs = require('fs');
const path = require('path');
const db = require('./db');

function seedDatabase() {
  console.log('🌱 Starting Unera SQLite Database Seeding...');

  const datasetDir = path.resolve(__dirname, '../dataset');
  if (!fs.existsSync(datasetDir)) {
    console.error('❌ dataset/ directory not found at', datasetDir);
    process.exit(1);
  }

  // 1. Seed demo user id 1
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, name, created_at)
    VALUES (1, 'Alex Rivera', datetime('now'))
  `);
  insertUser.run();
  console.log('✓ Demo user seeded');

  // 2. Seed documents and pages from notes.json
  const notesFile = path.join(datasetDir, 'notes.json');
  if (fs.existsSync(notesFile)) {
    const docs = JSON.parse(fs.readFileSync(notesFile, 'utf8'));
    const insertDoc = db.prepare(`
      INSERT OR IGNORE INTO documents (id, title, filename, page_count, uploaded_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertPage = db.prepare(`
      INSERT OR IGNORE INTO pages (doc_id, page_no, text)
      VALUES (?, ?, ?)
    `);

    for (const doc of docs) {
      insertDoc.run(doc.id, doc.title, doc.filename, doc.page_count, doc.uploaded_at || new Date().toISOString());
      if (Array.isArray(doc.pages)) {
        for (const p of doc.pages) {
          insertPage.run(doc.id, p.page_no, p.text);
        }
      }
    }
    console.log(`✓ Seeded ${docs.length} documents and all related pages`);
  }

  // 3. Seed concepts from concepts.json
  const conceptsFile = path.join(datasetDir, 'concepts.json');
  if (fs.existsSync(conceptsFile)) {
    const concepts = JSON.parse(fs.readFileSync(conceptsFile, 'utf8'));
    const insertConcept = db.prepare(`
      INSERT OR IGNORE INTO concepts (id, name, definition, doc_id, page_no, prerequisites, common_confusion, simpler_explanation, visual_example)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const c of concepts) {
      insertConcept.run(
        c.id,
        c.name,
        c.definition,
        c.doc_id,
        c.page_no,
        JSON.stringify(c.prerequisites || []),
        c.common_confusion,
        c.simpler_explanation,
        c.visual_example
      );
    }
    console.log(`✓ Seeded ${concepts.length} concepts`);
  }

  // 4. Seed qa_pairs from qa.json
  const qaFile = path.join(datasetDir, 'qa.json');
  if (fs.existsSync(qaFile)) {
    const qaList = JSON.parse(fs.readFileSync(qaFile, 'utf8'));
    const insertQA = db.prepare(`
      INSERT OR IGNORE INTO qa_pairs (id, question, answer, grounded, doc_id, page_no, excerpt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const qa of qaList) {
      insertQA.run(
        qa.id,
        qa.question,
        qa.answer,
        qa.grounded !== undefined ? qa.grounded : 1,
        qa.doc_id || null,
        qa.page_no || null,
        qa.excerpt || null
      );
    }
    console.log(`✓ Seeded ${qaList.length} QA pairs`);
  }

  // 5. Seed initial doubts from doubts.json
  const doubtsFile = path.join(datasetDir, 'doubts.json');
  if (fs.existsSync(doubtsFile)) {
    const doubts = JSON.parse(fs.readFileSync(doubtsFile, 'utf8'));
    const insertDoubt = db.prepare(`
      INSERT OR IGNORE INTO doubts (id, user_id, concept_name, concept_id, status, steps_done, created_at, resolved_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const d of doubts) {
      insertDoubt.run(
        d.id,
        d.user_id || 1,
        d.concept_name,
        d.concept_id || null,
        d.status || 'unresolved',
        JSON.stringify(d.steps_done || []),
        d.created_at || new Date().toISOString(),
        d.resolved_at || null
      );
    }
    console.log(`✓ Seeded ${doubts.length} doubts`);
  }

  // 6. Run extended seed
  try {
    const seedExtended = require('./seed_extended');
    seedExtended();
  } catch (extErr) {
    console.warn('Extended seed notice:', extErr.message);
  }

  console.log('✅ Unera SQLite Database seeding complete!');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;

