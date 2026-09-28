const express = require('express');
const router = express.Router();
const { getDb, saveDb } = require('../db');

// ---------- DATA BACKUP ----------
// Full JSON export of every table so the user can keep a permanent copy on
// their own computer and restore it at any time (survives any server problem).

function allTables(db) {
  return db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all().map(r => r.name);
}

// GET /api/backup/export - download complete database as JSON
router.get('/export', (req, res) => {
  try {
    const db = getDb();
    const tables = {};
    for (const t of allTables(db)) {
      tables[t] = db.prepare(`SELECT * FROM "${t}"`).all();
    }
    res.json({ app: 'adhunik-crm-backup', version: 1, exported_at: new Date().toISOString(), tables });
  } catch (e) {
    console.error('Backup export failed:', e.message);
    res.status(500).json({ error: 'Export failed: ' + e.message });
  }
});

// POST /api/backup/import - restore from a previously exported JSON backup.
// Replaces the contents of every table found in the backup file.
router.post('/import', (req, res) => {
  try {
    const { tables } = req.body || {};
    if (!tables || typeof tables !== 'object' || Array.isArray(tables)) {
      return res.status(400).json({ error: 'Invalid backup file (no tables found)' });
    }
    const db = getDb();
    const known = new Set(allTables(db));
    const importTables = Object.keys(tables).filter(t => known.has(t) && Array.isArray(tables[t]));
    if (!importTables.length) return res.status(400).json({ error: 'Backup contains no known tables' });

    const runImport = db.transaction(() => {
      for (const t of importTables) {
        const rows = tables[t];
        db.prepare(`DELETE FROM "${t}"`).run();
        if (!rows.length) continue;
        // Only insert columns that actually exist on the current schema
        const cols = db.prepare(`PRAGMA table_info("${t}")`).all().map(c => c.name);
        const stmt = db.prepare(`INSERT INTO "${t}" (${cols.map(c => `"${c}"`).join(',')}) VALUES (${cols.map(() => '?').join(',')})`);
        for (const row of rows) {
          stmt.run(...cols.map(c => (row[c] === undefined ? null : row[c])));
        }
      }
    });
    runImport();
    saveDb();
    const counts = importTables.map(t => `${t}:${tables[t].length}`).join(', ');
    console.log('Backup restored from file:', counts);
    res.json({ ok: true, restored_tables: importTables.length, counts });
  } catch (e) {
    console.error('Backup import failed:', e.message);
    res.status(500).json({ error: 'Import failed: ' + e.message });
  }
});

module.exports = router;
