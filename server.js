const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const { initializeDatabase, getDb, saveDb, persistDb, refreshDbFromCloud } = require('./db');

const app = express();

// ---------- TECHNICIAN AUTH HELPERS ----------
function hashPw(pw) {
  return crypto.createHash('sha256').update(String(pw)).digest('hex');
}
function makeTechToken(id, passwordHash) {
  return `t${id}.${crypto.createHash('sha256').update(`${id}:${passwordHash}`).digest('hex')}`;
}
function publicTech(t) {
  return { id: t.id, name: t.name, phone: t.phone, specialization: t.specialization, status: t.status, username: t.username };
}
// Resolve technician from x-tech-token header or ?token= query
function techFromToken(req) {
  const tok = req.headers['x-tech-token'] || req.query.token;
  if (!tok) return null;
  const m = String(tok).match(/^t(\d+)\.(\w+)$/);
  if (!m) return null;
  const tech = getDb().prepare('SELECT * FROM technicians WHERE id = ?').get(m[1]);
  if (!tech || !tech.password || makeTechToken(tech.id, tech.password) !== tok) return null;
  return tech;
}

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ===== READY GATE =====
// DB init is async (sql.js WASM). On serverless cold starts a request can arrive
// before init/routes are ready - hold it here until startServer() has completed.
let readyPromise = null;
function ensureReady() {
  if (!readyPromise) {
    readyPromise = startServer().catch(err => { readyPromise = null; throw err; });
  }
  return readyPromise;
}
app.use((req, res, next) => {
  ensureReady().then(() => next()).catch(next);
});

// Middleware to attach db to request
app.use((req, res, next) => {
  req.db = getDb();
  next();
});

// ---------- FRESH-READ BEFORE EVERY API REQUEST ----------
// Several serverless instances can run in parallel; each one pulls the newest
// cloud copy before answering so no instance ever shows or saves stale data
// (which otherwise looks like data being deleted).
app.use(async (req, res, next) => {
  if (!req.path.startsWith('/api/')) return next();
  try { await refreshDbFromCloud(); } catch (e) { /* keep serving on error */ }
  next();
});

// ---------- AUTO-PERSIST AFTER EVERY WRITE ----------
// Any create/update/delete request saves the database before the response is
// sent (local file, plus cloud storage on Vercel where /tmp is wiped on restarts).
app.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
  const origEnd = res.end.bind(res);
  let persisted = false;
  res.end = function (...args) {
    if (persisted) return origEnd(...args);
    persisted = true;
    Promise.resolve()
      .then(() => persistDb())
      .catch(() => { try { saveDb(); } catch (e) {} })
      .then(() => origEnd(...args), () => origEnd(...args));
  };
  next();
});

async function startServer(portOverride) {
  // Initialize Database (async for sql.js)
  await initializeDatabase();
  console.log('Database initialized.');

  // ===== API ROUTES =====

  // ---------- DASHBOARD ----------
  app.get('/api/dashboard/stats', (req, res) => {
    const db = getDb();
    const totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;
    const totalLeads = db.prepare('SELECT COUNT(*) as count FROM leads').get().count;
    const newLeads = db.prepare("SELECT COUNT(*) as count FROM leads WHERE status='new'").get().count;
    const activeContracts = db.prepare("SELECT COUNT(*) as count FROM contracts WHERE status='active'").get().count;
    const expiringContracts = db.prepare("SELECT COUNT(*) as count FROM contracts WHERE status='expiring'").get().count;
    const totalInvoices = db.prepare('SELECT COUNT(*) as count FROM invoices').get().count;
    const unpaidInvoices = db.prepare("SELECT COUNT(*) as count FROM invoices WHERE status IN ('unpaid','overdue')").get().count;
    const totalRevenue = db.prepare("SELECT COALESCE(SUM(paid_amount),0) as total FROM invoices WHERE status='paid'").get().total;
    const pendingAmount = db.prepare("SELECT COALESCE(SUM(total - paid_amount),0) as total FROM invoices WHERE status IN ('unpaid','overdue','partial')").get().total;
    const openComplaints = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status='open'").get().count;
    const todayAssignments = db.prepare("SELECT COUNT(*) as count FROM service_assignments WHERE scheduled_date <= date('now','+7 days') AND status != 'completed'").get().count;
    const totalTechnicians = db.prepare('SELECT COUNT(*) as count FROM technicians').get().count;
    const availableTechs = db.prepare("SELECT COUNT(*) as count FROM technicians WHERE status='available'").get().count;
    const lowStockItems = db.prepare('SELECT COUNT(*) as count FROM inventory WHERE quantity <= min_quantity').get().count;
    const totalExpenses = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE status='approved'").get().total;

    const recentInvoices = db.prepare(`
      SELECT i.invoice_number, i.total, i.status, c.name as customer_name
      FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id ORDER BY i.created_at DESC LIMIT 5
    `).all();

    const upcomingServices = db.prepare(`
      SELECT sa.assignment_number, sa.service_type, sa.scheduled_date, sa.status,
      c.name as customer_name, t.name as technician_name
      FROM service_assignments sa
      LEFT JOIN customers c ON sa.customer_id = c.id
      LEFT JOIN technicians t ON sa.technician_id = t.id
      WHERE sa.status IN ('assigned','in-progress')
      ORDER BY sa.scheduled_date ASC LIMIT 5
    `).all();

    res.json({
      totalCustomers, totalLeads, newLeads, activeContracts, expiringContracts,
      totalInvoices, unpaidInvoices, totalRevenue, pendingAmount,
      openComplaints, todayAssignments, totalTechnicians, availableTechs,
      lowStockItems, totalExpenses, recentInvoices, upcomingServices
    });
  });

  // ---------- LOAD ROUTES ----------
  app.use('/api/backup', require('./routes/backup'));
  app.use('/api/leads', require('./routes/leads'));
  app.use('/api/customers', require('./routes/customers'));
  app.use('/api/technicians', require('./routes/technicians'));
  app.use('/api/employees', require('./routes/employees'));
  app.use('/api/vendors', require('./routes/vendors'));
  app.use('/api/inspections', require('./routes/inspections'));
  app.use('/api/quotations', require('./routes/quotations'));
  app.use('/api/contracts', require('./routes/contracts'));
  app.use('/api/invoices', require('./routes/invoices'));
  app.use('/api/complaints', require('./routes/complaints'));
  app.use('/api/assignments', require('./routes/assignments'));
  app.use('/api/inventory', require('./routes/inventory'));
  app.use('/api/expenses', require('./routes/expenses'));
  app.use('/api/vouchers', require('./routes/vouchers'));
  app.use('/api/field-reports', require('./routes/field-reports'));
  app.use('/api/attendance', require('./routes/attendance'));
  app.use('/api/payroll', require('./routes/payroll'));

  // ---------- CALENDAR ----------
  app.get('/api/calendar/events', (req, res) => {
    const db = getDb();
    let events = [];
    const assignments = db.prepare(`
      SELECT sa.service_type, sa.scheduled_date, sa.status,
      c.name as customer_name, t.name as technician_name
      FROM service_assignments sa
      LEFT JOIN customers c ON sa.customer_id = c.id
      LEFT JOIN technicians t ON sa.technician_id = t.id
    `).all();
    assignments.forEach(a => {
      events.push({ id: `sa-${a.id}`, title: `${a.service_type} - ${a.customer_name||''}`, date: a.scheduled_date, type: 'service', status: a.status });
    });
    const followups = db.prepare(`
      SELECT lf.id, lf.follow_up_date, lf.status, l.name as lead_name
      FROM lead_followups lf LEFT JOIN leads l ON lf.lead_id = l.id WHERE lf.status = 'pending'
    `).all();
    followups.forEach(f => {
      events.push({ id: `fu-${f.id}`, title: `Follow-up: ${f.lead_name||''}`, date: f.follow_up_date, type: 'followup', status: f.status });
    });
    const expiring = db.prepare(`
      SELECT c.id, c.end_date, c.status, cust.name as customer_name FROM contracts c
      LEFT JOIN customers cust ON c.customer_id = cust.id WHERE c.status IN ('active','expiring')
    `).all();
    expiring.forEach(c => {
      events.push({ id: `ce-${c.id}`, title: `Contract Expiry: ${c.customer_name||''}`, date: c.end_date, type: 'expiry', status: c.status });
    });
    res.json(events);
  });

  // ---------- WHATSAPP ----------
  app.get('/api/whatsapp/campaigns', (req, res) => {
    res.json(getDb().prepare('SELECT * FROM whatsapp_campaigns ORDER BY created_at DESC').all());
  });
  app.post('/api/whatsapp/campaigns', (req, res) => {
    const db = getDb();
    const { name, message, template } = req.body;
    const result = db.prepare('INSERT INTO whatsapp_campaigns (name, message, template, status) VALUES (?, ?, ?, ?)').run(name, message, template, 'draft');
    res.json({ id: result.lastInsertRowid, message: 'Campaign created' });
  });

  // ---------- CERTIFICATES ----------
  app.get('/api/certificates', (req, res) => {
    res.json(getDb().prepare(`SELECT cert.*, c.name as customer_name FROM certificates cert LEFT JOIN customers c ON cert.customer_id = c.id ORDER BY cert.created_at DESC`).all());
  });
  app.post('/api/certificates', (req, res) => {
    const db = getDb();
    const { customer_id, type, title, description, service_date, valid_from, valid_until, issued_by,
      contact_period, chemicals, method, premise_address, ref_number, customer_address } = req.body;
    const count = db.prepare('SELECT COUNT(*) as count FROM certificates').get().count;
    const certNum = `CERT-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
    db.prepare('INSERT INTO certificates (certificate_number, customer_id, type, title, description, service_date, valid_from, valid_until, issued_by, contact_period, chemicals, method, premise_address, ref_number, customer_address) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(certNum, customer_id, type, title, description, service_date, valid_from, valid_until, issued_by, contact_period, chemicals, method, premise_address, ref_number || certNum, customer_address);
    res.json({ certificate_number: certNum });
  });

  // ---------- GEOFENCE ----------
  app.get('/api/geofence', (req, res) => {
    res.json(getDb().prepare(`SELECT ga.*, t.name as technician_name FROM geofence_activity ga LEFT JOIN technicians t ON ga.technician_id = t.id ORDER BY ga.timestamp DESC LIMIT 50`).all());
  });

  // ---------- TECHNICIAN APP AUTH (ID + password) ----------
  // Login with technician username + password/PIN, returns a token for the tracking app
  app.post('/api/auth/tech/login', (req, res) => {
    const db = getDb();
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
    const tech = db.prepare('SELECT * FROM technicians WHERE lower(username) = lower(?)').get(String(username).trim());
    if (!tech || !tech.password || hashPw(password) !== tech.password) {
      return res.status(401).json({ error: 'Wrong ID or password' });
    }
    res.json({ token: makeTechToken(tech.id, tech.password), technician: publicTech(tech) });
  });

  // Validate token + return technician profile and today's jobs
  app.get('/api/auth/tech/me', (req, res) => {
    const db = getDb();
    const tech = techFromToken(req);
    if (!tech) return res.status(401).json({ error: 'Invalid or missing token - please login again' });
    const jobs = db.prepare(`SELECT sa.id, sa.assignment_number, sa.service_type, sa.status, sa.scheduled_date, sa.scheduled_time, sa.address, c.name as customer_name
      FROM service_assignments sa LEFT JOIN customers c ON sa.customer_id = c.id
      WHERE sa.technician_id = ? ORDER BY sa.scheduled_date DESC LIMIT 10`).all(tech.id);
    res.json({ technician: publicTech(tech), jobs });
  });

  // ---------- TECHNICIAN LIVE LOCATION TRACKING ----------
  // Report a technician's current GPS position (from phone / mobile app)
  app.post('/api/technicians/:id/location', (req, res) => {
    const db = getDb();
    const tech = db.prepare('SELECT * FROM technicians WHERE id = ?').get(req.params.id);
    if (!tech) return res.status(404).json({ error: 'Technician not found' });
    // If this technician has app credentials and a token was sent, it must be valid
    const tok = (req.body || {}).token || req.headers['x-tech-token'];
    if (tech.password && tok && tok !== makeTechToken(tech.id, tech.password)) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const { latitude, longitude, accuracy, speed, battery, note, action } = req.body;
    if (latitude == null || longitude == null || isNaN(Number(latitude)) || isNaN(Number(longitude))) {
      return res.status(400).json({ error: 'latitude and longitude are required' });
    }
    const lat = Number(latitude), lng = Number(longitude);
    // Update current position on the technician record
    db.prepare('UPDATE technicians SET current_lat=?, current_lng=? WHERE id=?').run(lat, lng, tech.id);
    // Store trail point
    db.prepare('INSERT INTO technician_locations (technician_id, latitude, longitude, accuracy, speed, battery, note) VALUES (?,?,?,?,?,?,?)').run(tech.id, lat, lng, accuracy || null, speed || null, battery || null, note || null);
    // Optional geofence event (check-in / check-out / custom action)
    if (action) {
      db.prepare('INSERT INTO geofence_activity (technician_id, action, latitude, longitude, address) VALUES (?,?,?,?,?)').run(tech.id, action, lat, lng, note || null);
    }
    if (typeof saveDb === 'function') saveDb();
    res.json({ message: 'Location updated', technician_id: tech.id, latitude: lat, longitude: lng });
  });

  // Live positions of all technicians (map view)
  app.get('/api/tracking/live', (req, res) => {
    const db = getDb();
    const techs = db.prepare(`
      SELECT t.id, t.name, t.phone, t.specialization, t.status, t.current_lat as latitude, t.current_lng as longitude,
        (SELECT MAX(recorded_at) FROM technician_locations tl WHERE tl.technician_id = t.id) as last_seen
      FROM technicians t ORDER BY t.name
    `).all();
    res.json(techs);
  });

  // Location trail/history of one technician
  app.get('/api/tracking/:id/history', (req, res) => {
    const db = getDb();
    const limit = Math.min(Number(req.query.limit) || 200, 1000);
    const points = db.prepare('SELECT latitude, longitude, accuracy, speed, battery, note, recorded_at FROM technician_locations WHERE technician_id = ? ORDER BY recorded_at DESC, id DESC LIMIT ?').all(req.params.id, limit);
    res.json(points);
  });

  // ---------- CALLS ----------
  app.get('/api/calls', (req, res) => {
    res.json(getDb().prepare(`SELECT ch.*, c.name as customer_name, l.name as lead_name, e.name as employee_name FROM call_history ch LEFT JOIN customers c ON ch.customer_id = c.id LEFT JOIN leads l ON ch.lead_id = l.id LEFT JOIN employees e ON ch.employee_id = e.id ORDER BY ch.call_time DESC`).all());
  });
  app.post('/api/calls', (req, res) => {
    const { customer_id, lead_id, employee_id, direction, duration, notes } = req.body;
    const result = getDb().prepare('INSERT INTO call_history (customer_id, lead_id, employee_id, direction, duration, notes) VALUES (?,?,?,?,?,?)').run(customer_id||null, lead_id||null, employee_id||null, direction||'outbound', duration||0, notes);
    res.json({ id: result.lastInsertRowid });
  });

  // ---------- AUDITS ----------
  app.get('/api/audits', (req, res) => {
    res.json(getDb().prepare(`SELECT ai.*, c.name as customer_name, t.name as auditor_name FROM audit_inspections ai LEFT JOIN customers c ON ai.customer_id = c.id LEFT JOIN technicians t ON ai.auditor_id = t.id ORDER BY ai.created_at DESC`).all());
  });
  app.post('/api/audits', (req, res) => {
    const { customer_id, auditor_id, inspection_date, location, checklist, findings } = req.body;
    const result = getDb().prepare('INSERT INTO audit_inspections (customer_id, auditor_id, inspection_date, location, checklist, findings) VALUES (?,?,?,?,?,?)').run(customer_id, auditor_id, inspection_date, location, checklist, findings);
    res.json({ id: result.lastInsertRowid });
  });

  // ---------- SETTINGS ----------
  app.get('/api/settings', (req, res) => {
    const settings = getDb().prepare('SELECT * FROM settings').all();
    const obj = {};
    settings.forEach(s => obj[s.key] = s.value);
    res.json(obj);
  });
  app.put('/api/settings', (req, res) => {
    const db = getDb();
    for (const [key, value] of Object.entries(req.body)) {
      db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)').run(key, value);
    }
    res.json({ message: 'Settings updated' });
  });

  // ---------- WHATSAPP API (Meta Cloud API — free tier) ----------
  app.post('/api/whatsapp/send', async (req, res) => {
    const { phone, message } = req.body;
    if (!phone || !message) return res.status(400).json({ error: 'Phone and message are required' });
    const cfg = {};
    getDb().prepare('SELECT * FROM settings').all().forEach(s => cfg[s.key] = s.value);
    const token = cfg.whatsapp_token, phoneId = cfg.whatsapp_phone_id;
    if (!token || !phoneId) return res.status(400).json({ error: 'WhatsApp API not configured. Add Phone Number ID and Access Token in Settings.' });
    let num = String(phone).replace(/\D/g, '');
    if (num.length === 10) num = '91' + num;
    try {
      const r = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', to: num, type: 'text', text: { body: message } })
      });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: (data.error && data.error.message) || 'WhatsApp send failed' });
      res.json({ success: true, wa_message_id: data.messages && data.messages[0] && data.messages[0].id });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  // JSON error handler - so the frontend gets a real error instead of a silent 500
  app.use((err, req, res, next) => {
    console.error('API error:', err.message);
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({ error: err.message || 'Server error' });
  });

  // Optional explicit port (Electron desktop shell)
  if (portOverride) {
    app.listen(portOverride, () => console.log(`Server running at http://localhost:${portOverride}`));
  }
}

// Vercel's Express support requires the app itself as the module export.
// (startServer/app stay accessible as named properties for other entry points.)
module.exports = app;
module.exports.app = app;
module.exports.startServer = startServer;
module.exports.ensureReady = ensureReady;

if (!process.versions.electron) {
  const PORT = process.env.PORT || process.env.CRM_PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\n  🛡️  Adhunik Pest Control CRM`);
    console.log(`  ─────────────────────────`);
    console.log(`  Server running at http://localhost:${PORT}\n`);
  });
  // Kick off DB init immediately (requests are held by the ready gate meanwhile)
  ensureReady().catch(err => console.error('Failed to initialize:', err));
}
