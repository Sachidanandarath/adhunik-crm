// Restore the merged DB to cloud storage using @vercel/blob directly.
const fs = require('fs');
const path = require('path');
const { put } = require('@vercel/blob');

const env = Object.fromEntries(
  fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8')
    .split(/\r?\n/).filter(l => l.includes('='))
    .map(l => {
      let v = l.slice(l.indexOf('=') + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      return [l.slice(0, l.indexOf('=')).trim(), v];
    })
);
const token = env.BLOB_READ_WRITE_TOKEN;
console.log('token loaded:', token ? 'yes' : 'NO');

(async () => {
  await put('backups/crm-pre-restore.db', fs.readFileSync('bk-live3.db'), {
    token, access: 'private', addRandomSuffix: false, allowOverwrite: true
  });
  console.log('pre-restore safety backup uploaded');
  await put('crm.db', fs.readFileSync('merged-restore.db'), {
    token, access: 'private', addRandomSuffix: false, allowOverwrite: true
  });
  console.log('RESTORED merged database to cloud storage (crm.db)');
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
