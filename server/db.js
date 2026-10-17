const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../unera.db');
const db = new Database(dbPath);

// Enable WAL mode and foreign keys for performance and data integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema if not present
const schemaCandidates = [
  path.resolve(__dirname, '../backend/schema.sql'),
  path.resolve(__dirname, 'schema.sql')
];

for (const sc of schemaCandidates) {
  if (fs.existsSync(sc)) {
    const schemaSql = fs.readFileSync(sc, 'utf8');
    db.exec(schemaSql);
    break;
  }
}

module.exports = db;
