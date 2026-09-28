// One-off recovery #2: rebuild the complete database.
// Base = newest live state; then union in the older complete backups so the
// Aug-28 bills come back. Newer sources win when the same bill number exists.
const initSqlJs = require('sql.js');
const fs = require('fs');

(async () => {
  const SQL = await initSqlJs();
  // newest first - the first occurrence of a key wins
  const files = ['bk-live3.db', 'bk-crm-202608300935.db', 'bk-crm-202608300904.db'];
  const merged = new SQL.Database(fs.readFileSync(files[0]));
  const q1 = (db, sql) => db.exec(sql)[0];
  const esc = v => "'" + String(v == null ? '' : v).replace(/'/g, "''") + "'";

  for (const f of files.slice(1)) {
    const src = new SQL.Database(fs.readFileSync(f));
    const sc = q1(src, 'SELECT * FROM customers');
    sc.values.forEach(r => {
      const get = n => r[sc.columns.indexOf(n)];
      const has = sc.columns.includes.bind(sc.columns);
      const exists = q1(merged, `SELECT COUNT(*) FROM customers WHERE id=${get('id')} OR name=${esc(get('name'))}`).values[0][0];
      if (exists) return;
      const stmt = merged.prepare('INSERT INTO customers (id,name,email,phone,address,city,state,zip,property_type,property_size,notes,status,gstin,contact_person,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
      stmt.run([get('id'), get('name'), get('email'), get('phone'), get('address'), get('city'), get('state'), get('zip'),
        get('property_type'), get('property_size'), get('notes'), get('status') || 'active',
        has('gstin') ? get('gstin') : null, has('contact_person') ? get('contact_person') : null,
        get('created_at'), get('updated_at')]);
      stmt.free();
      console.log('+ customer restored:', get('name'));
    });
    const si = q1(src, 'SELECT * FROM invoices');
    si.values.forEach(r => {
      let num = r[si.columns.indexOf('invoice_number')];
      const exists = q1(merged, `SELECT COUNT(*) FROM invoices WHERE invoice_number=${esc(num)}`).values[0][0];
      if (exists) {
        // Same number but a different bill (other customer/date)? Keep it with a -B suffix.
        const cid = r[si.columns.indexOf('customer_id')];
        const same = q1(merged, `SELECT COUNT(*) FROM invoices WHERE invoice_number=${esc(num)} AND customer_id=${Number(cid) || 0}`).values[0][0];
        if (same) return;
        num = num + '-B';
        const exists2 = q1(merged, `SELECT COUNT(*) FROM invoices WHERE invoice_number=${esc(num)}`).values[0][0];
        if (exists2) return;
      }
      const qs = si.columns.map(() => '?').join(',');
      const vals = r.slice();
      vals[si.columns.indexOf('invoice_number')] = num;
      vals[si.columns.indexOf('id')] = null; // avoid id collisions across copies
      const stmt = merged.prepare(`INSERT INTO invoices (${si.columns.join(',')}) VALUES (${qs})`);
      try { stmt.run(vals); console.log('+ invoice restored:', num); }
      catch (e) { console.log('  skip invoice', num, '-', e.message); }
      stmt.free();
    });
  }

  // never keep agent test rows
  merged.run("DELETE FROM customers WHERE name IN ('Fresh Read Check','Backup Check','Storage Fix Check','Final Save Check','Bill Add Test','Bill Add Test2','Prod Bill Check','Local Id Check')");

  fs.writeFileSync('merged-restore.db', Buffer.from(merged.export()));
  const mc = q1(merged, 'SELECT id,name FROM customers ORDER BY id').values;
  const mi = q1(merged, 'SELECT invoice_number,created_at FROM invoices ORDER BY created_at').values;
  console.log('\nFINAL customers (' + mc.length + '):', mc.map(r => r[1]).join(', '));
  console.log('FINAL invoices (' + mi.length + '):', mi.map(r => r[0]).join(', '));
})();
