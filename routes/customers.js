const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

router.get('/', (req, res) => {
  const { status, search } = req.query;
  let sql = 'SELECT * FROM customers WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (search) { sql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  sql += ' ORDER BY created_at DESC';
  res.json(getDb().prepare(sql).all(...params));
});

router.get('/:id', (req, res) => {
  const customer = getDb().prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  const invoices = getDb().prepare('SELECT * FROM invoices WHERE customer_id = ? ORDER BY created_at DESC').all(req.params.id);
  const contracts = getDb().prepare('SELECT * FROM contracts WHERE customer_id = ?').all(req.params.id);
  const quotations = getDb().prepare('SELECT * FROM quotations WHERE customer_id = ? ORDER BY created_at DESC').all(req.params.id);
  const services = getDb().prepare('SELECT * FROM service_assignments WHERE customer_id = ? ORDER BY scheduled_date DESC').all(req.params.id);
  res.json({ ...customer, invoices, contracts, quotations, services });
});

router.post('/', (req, res) => {
  const { name, email, phone, address, city, state, zip, property_type, property_size, notes, status, gstin, contact_person } = req.body;
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Customer name is required' });
  const result = getDb().prepare('INSERT INTO customers (name, email, phone, address, city, state, zip, property_type, property_size, notes, status, gstin, contact_person) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(String(name).trim(), email || '', phone || '', address || '', city || '', state || '', zip || '', property_type, property_size, notes, status || 'active', gstin, contact_person);
  res.json({ id: result.lastInsertRowid, message: 'Customer created' });
});

router.put('/:id', (req, res) => {
  const { name, email, phone, address, city, state, zip, property_type, property_size, notes, status, gstin, contact_person } = req.body;
  getDb().prepare('UPDATE customers SET name=?, email=?, phone=?, address=?, city=?, state=?, zip=?, property_type=?, property_size=?, notes=?, status=?, gstin=?, contact_person=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(name, email, phone, address, city, state, zip, property_type, property_size, notes, status, gstin, contact_person, req.params.id);
  res.json({ message: 'Customer updated' });
});

router.delete('/:id', (req, res) => {
  getDb().prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  res.json({ message: 'Customer deleted' });
});

// Customer outstandings
router.get('/outstandings/list', (req, res) => {
  const outstandings = getDb().prepare(`
    SELECT c.id, c.name, c.phone, 
    COALESCE(SUM(i.total),0) as total_billed,
    COALESCE(SUM(i.paid_amount),0) as total_paid,
    COALESCE(SUM(i.total - i.paid_amount),0) as outstanding
    FROM customers c
    LEFT JOIN invoices i ON c.id = i.customer_id
    GROUP BY c.id
    HAVING outstanding > 0
    ORDER BY outstanding DESC
  `).all();
  res.json(outstandings);
});

module.exports = router;
