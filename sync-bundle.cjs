// Sync live site data into the local bundle BEFORE deploying, so a redeploy
// can never roll data back. Also keeps a dated backup file on this computer.
// Usage: node sync-bundle.cjs
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const PROD = 'https://crm-orpin-zeta-30.vercel.app';

(async () => {
  const SQL = await initSqlJs();
  // 1. download full data from the live site
  const ex = await (await fetch(PROD + '/api/backup/export')).json();
  if (!ex || !ex.tables) throw new Error('Live export failed: ' + JSON.stringify(ex).slice(0, 200));
  const cust = (ex.tables.customers || []).length;
  const inv = (ex.tables.invoices || []).length;
  console.log('Live data: customers=' + cust + ' invoices=' + inv);

  // 2. keep a dated backup file on this computer (permanent local copy)
  const dir = path.join(__dirname, 'backups-local');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
  const backupFile = path.join(dir, 'crm-backup-' + stamp + '.json');
  fs.writeFileSync(backupFile, JSON.stringify(ex, null, 2));
  console.log('Local backup saved:', backupFile);

  // 3. rebuild the bundled crm.db with the live data
  const dbFile = path.join(__dirname, 'crm.db');
  const db = new SQL.Database(fs.readFileSync(dbFile));
  const known = new Set(db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")[0].values.map(r => r[0]));
  for (const t of Object.keys(ex.tables)) {
    if (!known.has(t) || !Array.isArray(ex.tables[t])) continue;
    const rows = ex.tables[t];
    db.run('DELETE FROM "' + t + '"');
    if (!rows.length) continue;
    const cols = db.exec('PRAGMA table_info("' + t + '")')[0].values.map(r => r[1]);
    const stmt = db.prepare('INSERT INTO "' + t + '" (' + cols.map(c => '"' + c + '"').join(',') + ') VALUES (' + cols.map(() => '?').join(',') + ')');
    for (const row of rows) stmt.run(cols.map(c => (row[c] === undefined ? null : row[c])));
    stmt.free();
  }
  fs.writeFileSync(dbFile, Buffer.from(db.export()));
  console.log('Bundled crm.db updated with live data - safe to deploy now.');
})().catch(e => { console.error('SYNC FAILED:', e.message); process.exit(1); });
