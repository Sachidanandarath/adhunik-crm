const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getDb } = require('../db');

const hashPw = pw => crypto.createHash('sha256').update(String(pw)).digest('hex');
const stripPw = t => { if (t && !Array.isArray(t)) { delete t.password; } return t; };

router.get('/', (req, res) => {
  const { status, search } = req.query;
  let sql = 'SELECT * FROM technicians WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (search) { sql += ' AND (name LIKE ? OR phone LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  sql += ' ORDER BY created_at DESC';
  res.json(getDb().prepare(sql).all(...params).map(stripPw));
});

router.get('/:id', (req, res) => {
  const tech = getDb().prepare('SELECT * FROM technicians WHERE id = ?').get(req.params.id);
  if (!tech) return res.status(404).json({ error: 'Technician not found' });
  const assignments = getDb().prepare(`SELECT sa.*, c.name as customer_name FROM service_assignments sa LEFT JOIN customers c ON sa.customer_id = c.id WHERE sa.technician_id = ? ORDER BY sa.scheduled_date DESC`).all(req.params.id);
  res.json({ ...stripPw(tech), assignments });
});

router.post('/', (req, res) => {
  const { name, email, phone, specialization, license_number, license_expiry, status, username, password } = req.body;
  // Auto-generate app username from name if not provided
  const db = getDb();
  let uname = (username || '').trim();
  if (!uname) {
    const base = String(name || 'tech').toLowerCase().replace(/[^a-z0-9]/g, '') || 'tech';
    uname = base;
    let n = 1;
    while (db.prepare('SELECT id FROM technicians WHERE username = ?').get(uname)) { uname = base + (++n); }
  }
  const pwHash = password ? hashPw(password) : hashPw('1234'); // default PIN 1234
  const result = db.prepare('INSERT INTO technicians (name, email, phone, specialization, license_number, license_expiry, status, username, password) VALUES (?,?,?,?,?,?,?,?,?)').run(name, email, phone, specialization, license_number, license_expiry, status || 'available', uname, pwHash);
  res.json({ id: result.lastInsertRowid, username: uname, message: 'Technician created' });
});

router.put('/:id', (req, res) => {
  const { name, email, phone, specialization, license_number, license_expiry, status, current_lat, current_lng, username, password } = req.body;
  const db = getDb();
  db.prepare('UPDATE technicians SET name=?, email=?, phone=?, specialization=?, license_number=?, license_expiry=?, status=?, current_lat=?, current_lng=? WHERE id=?').run(name, email, phone, specialization, license_number, license_expiry, status, current_lat, current_lng, req.params.id);
  if (username !== undefined && username !== null && username !== '') {
    db.prepare('UPDATE technicians SET username=? WHERE id=?').run(String(username).trim(), req.params.id);
  }
  if (password) { // reset app PIN (stored hashed)
    db.prepare('UPDATE technicians SET password=? WHERE id=?').run(hashPw(password), req.params.id);
  }
  res.json({ message: 'Technician updated' });
});

router.delete('/:id', (req, res) => {
  getDb().prepare('DELETE FROM technicians WHERE id = ?').run(req.params.id);
  res.json({ message: 'Technician deleted' });
});

module.exports = router;
