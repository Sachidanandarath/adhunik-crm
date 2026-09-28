// One-off: clear ALL business data from crm.db (fresh start).
// Keeps: technicians, employees, vendors, inventory items, settings.
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const dbPath = path.join(__dirname, 'crm.db');
const TABLES_TO_CLEAR = [
  'customers', 'leads', 'lead_followups', 'inspections', 'quotations', 'contracts',
  'invoices', 'payments', 'payment_reminders', 'complaints', 'service_assignments',
  'geofence_activity', 'technician_locations', 'call_history', 'field_reports',
  'certificates', 'inventory_transactions', 'expenses', 'receipt_vouchers',
  'payment_vouchers', 'attendance', 'payroll', 'whatsapp_campaigns', 'audit_inspections'
];

(async () => {
  const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm');
  const SQL = await initSqlJs({ wasmBinary: fs.readFileSync(wasmPath) });
  const db = new SQL.Database(fs.readFileSync(dbPath));
  const existing = db.exec("SELECT name FROM sqlite_master WHERE type='table'")[0].values.map(r => r[0]);
  TABLES_TO_CLEAR.forEach(t => {
    if (existing.includes(t)) { db.run(`DELETE FROM ${t}`); console.log('cleared:', t); }
    else console.log('skip (not found):', t);
  });
  // Reset last known positions on technicians (keep their app logins)
  if (existing.includes('technicians')) {
    db.run('UPDATE technicians SET current_lat = NULL, current_lng = NULL');
    console.log('technician positions reset (logins kept)');
  }
  fs.writeFileSync(dbPath, Buffer.from(db.export()));
  console.log('crm.db saved - all data cleared.');
  process.exit(0);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
