const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const fs = require('fs');
const path = require('path');

// Load the shared bill templates (same as the browser uses) for Word export
let _tpl;
function billTemplates() {
  if (!_tpl) {
    const code = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'print-templates.js'), 'utf8');
    _tpl = {};
    new Function('window', 'document', code)(_tpl, {});
  }
  return _tpl;
}
function invToBillData(inv) {
  let extra = {};
  try { extra = JSON.parse(inv.bill_extra || 'null') || {}; } catch (e) {}
  let raw = inv.items;
  if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch (e) { raw = []; } }
  const items = (raw || []).map(i => {
    const price = Number(i.rate ?? i.price ?? 0); const qty = Number(i.quantity ?? i.qty ?? 1);
    return { name: i.description || i.name || '', price, qty, gst: inv.gst_type !== 'none', amount: Number(i.amount ?? price * qty) };
  });
  const subtotal = inv.subtotal || items.reduce((a, i) => a + i.amount, 0);
  const gstAmt = (Number(inv.sgst) || 0) + (Number(inv.cgst) || 0) || Number(inv.tax_amount) || 0;
  const T = billTemplates();
  return {
    bill_type: inv.gst_type !== 'none' ? 'gst' : 'non-gst',
    bill_no: inv.invoice_number,
    bill_date: extra.bill_date || String(inv.invoice_date || inv.created_at || '').slice(0, 10),
    booking_id: inv.booking_id || '',
    period: inv.service_period || ((inv.warranty_from || '') && (inv.warranty_to || '') ? `${inv.warranty_from} - ${inv.warranty_to}` : ''),
    title: inv.title || '',
    customer_name: inv.customer_name || '', customer_address: inv.customer_address || '', customer_phone: inv.customer_phone || '',
    contact_person: inv.contact_person || inv.customer_contact_person || '', customer_gstin: inv.customer_gstin || '',
    items, subtotal, service_charge_pct: 0, service_charge: 0,
    sgst: Number(inv.sgst) || gstAmt / 2, cgst: Number(inv.cgst) || gstAmt / 2, gst: gstAmt, net: inv.total,
    net_words: inv.amount_in_words || (T.numberToWords ? T.numberToWords(Math.round(Number(inv.total) || 0)) + ' Only' : ''),
    payment_mode: extra.payment_mode || 'cash', sac_code: inv.sac_code || '998531',
    service_log_title: extra.service_log_title || '', logs: extra.logs || [], terms: inv.terms_conditions || ''
  };
}

// Download invoice/bill as a Word (.doc) file - same layout as Print/PDF
router.get('/:id/word', (req, res) => {
  const db = getDb();
  const inv = db.prepare(`SELECT i.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
    c.address as customer_address, c.gstin as customer_gstin, c.contact_person as customer_contact_person
    FROM invoices i LEFT JOIN customers c ON c.id = i.customer_id WHERE i.id = ?`).get(req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });
  const settings = {};
  db.prepare('SELECT * FROM settings').all().forEach(s => settings[s.key] = s.value);
  try {
    let html = billTemplates().buildCustomBillHtml(invToBillData(inv), settings);
    html = html.replace(/<div class="no-print"[\s\S]*?<\/div>/, '').replace(/\.no-print[\s\S]*?\}/, '');
    res.setHeader('Content-Type', 'application/msword');
    res.setHeader('Content-Disposition', `attachment; filename="${String(inv.invoice_number || 'bill').replace(/[\\/:*?"<>|]/g, '')}.doc"`);
    res.send(html);
  } catch (e) {
    res.status(500).json({ error: 'Could not generate Word file: ' + e.message });
  }
});

router.get('/', (req, res) => {
  const { status, customer_id, search } = req.query;
  let sql = `SELECT i.*, c.name as customer_name FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id WHERE 1=1`;
  const params = [];
  if (status) { sql += ' AND i.status = ?'; params.push(status); }
  if (customer_id) { sql += ' AND i.customer_id = ?'; params.push(customer_id); }
  if (search) { sql += ' AND (i.invoice_number LIKE ? OR c.name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  sql += ' ORDER BY i.created_at DESC';
  res.json(getDb().prepare(sql).all(...params));
});

router.get('/:id', (req, res) => {
  const inv = getDb().prepare(`SELECT i.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email, c.address as customer_address FROM invoices i LEFT JOIN customers c ON c.id = i.customer_id WHERE i.id = ?`).get(req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });
  const payments = getDb().prepare('SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date DESC').all(req.params.id);
  res.json({ ...inv, payments });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { customer_id, contract_id, quotation_id, title, items, subtotal, tax_rate, tax_amount, discount, total, due_date, status,
    gst_type, sgst, cgst, igst, sac_code, warranty_from, warranty_to, warranty_note,
    contact_person, booking_id, service_period, service_count, per_service_rate,
    amount_in_words, terms_conditions, invoice_type, bill_extra } = req.body;
  const type = invoice_type || 'standard';
  // Auto bill number (no manual entry): continues the manual bill series
  // A11477... for GST/annual bills, APT1282... for non-GST bills
  const prefix = type === 'standard' ? 'APT' : 'A';
  const base = type === 'standard' ? 1282 : 11477;
  let max = base;
  db.prepare('SELECT invoice_number FROM invoices').all().forEach(r => {
    if (r.invoice_number && String(r.invoice_number).startsWith(prefix)) {
      const n = parseInt(String(r.invoice_number).slice(prefix.length), 10);
      if (!isNaN(n) && n > max) max = n;
    }
  });
  const invNum = prefix + (max + 1);
  // Manual bill number entry: use the typed number if provided, else auto series
  const manualNo = String(req.body.invoice_number || '').trim();
  const finalNum = manualNo || invNum;
  // Auto-fill dates when left blank
  const now = new Date();
  const dmy = d => `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  const iso = d => d.toISOString().split('T')[0];
  const plusYears = (y, minusDay) => { const d = new Date(now); d.setFullYear(d.getFullYear() + y); if (minusDay) d.setDate(d.getDate() - minusDay); return d; };
  const sp = service_period || (type === 'annual' ? `${dmy(now)}-${dmy(plusYears(1, 1))}` : service_period);
  const wf = warranty_from || iso(now);
  const wt = warranty_to || iso(plusYears(/termite/i.test(title || '') ? 5 : 1, 1));
  const result = db.prepare('INSERT INTO invoices (invoice_number, customer_id, contract_id, quotation_id, title, items, subtotal, tax_rate, tax_amount, discount, total, paid_amount, due_date, status, gst_type, sgst, cgst, igst, sac_code, warranty_from, warranty_to, warranty_note, contact_person, booking_id, service_period, service_count, per_service_rate, amount_in_words, terms_conditions, invoice_type, bill_extra) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(
    finalNum, customer_id, contract_id, quotation_id, title, JSON.stringify(items || []), subtotal || 0, tax_rate || 0, tax_amount || 0, discount || 0, total || 0, 0, due_date, status || 'draft',
    gst_type || 'none', sgst || 0, cgst || 0, igst || 0, sac_code, wf, wt, warranty_note,
    contact_person, booking_id, sp, service_count, per_service_rate, amount_in_words, terms_conditions, type, bill_extra || null);
  res.json({ id: result.lastInsertRowid, invoice_number: finalNum });
});

router.put('/:id', (req, res) => {
  const { title, items, subtotal, tax_rate, tax_amount, discount, total, paid_amount, due_date, status,
    gst_type, sgst, cgst, igst, sac_code, warranty_from, warranty_to, warranty_note,
    contact_person, booking_id, service_period, service_count, per_service_rate,
    amount_in_words, terms_conditions, invoice_type, invoice_number, bill_extra } = req.body;
  getDb().prepare('UPDATE invoices SET invoice_number=COALESCE(?, invoice_number), title=?, items=?, subtotal=?, tax_rate=?, tax_amount=?, discount=?, total=?, paid_amount=?, due_date=?, status=?, gst_type=?, sgst=?, cgst=?, igst=?, sac_code=?, warranty_from=?, warranty_to=?, warranty_note=?, contact_person=?, booking_id=?, service_period=?, service_count=?, per_service_rate=?, amount_in_words=?, terms_conditions=?, invoice_type=?, bill_extra=COALESCE(?, bill_extra) WHERE id=?').run(
    String(invoice_number || '').trim() || null, title, JSON.stringify(items || []), subtotal, tax_rate, tax_amount, discount, total, paid_amount, due_date, status,
    gst_type, sgst, cgst, igst, sac_code, warranty_from, warranty_to, warranty_note,
    contact_person, booking_id, service_period, service_count, per_service_rate, amount_in_words, terms_conditions, invoice_type, bill_extra || null, req.params.id);
  res.json({ message: 'Invoice updated' });
});

// Record payment
router.post('/:id/payment', (req, res) => {
  const { amount, payment_method, payment_date, reference, notes } = req.body;
  const invoice = getDb().prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  const result = getDb().prepare('INSERT INTO payments (invoice_id, customer_id, amount, payment_method, payment_date, reference, notes) VALUES (?,?,?,?,?,?,?)').run(req.params.id, invoice.customer_id, amount, payment_method, payment_date || new Date().toISOString().split('T')[0], reference, notes);

  const newPaid = (invoice.paid_amount || 0) + amount;
  const newStatus = newPaid >= invoice.total ? 'paid' : 'partial';
  getDb().prepare('UPDATE invoices SET paid_amount=?, status=? WHERE id=?').run(newPaid, newStatus, req.params.id);

  res.json({ id: result.lastInsertRowid, message: 'Payment recorded', new_paid: newPaid, new_status: newStatus });
});

router.delete('/:id', (req, res) => {
  getDb().prepare('DELETE FROM payments WHERE invoice_id = ?').run(req.params.id);
  getDb().prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
  res.json({ message: 'Invoice deleted' });
});

// Payment reminders
router.get('/reminders/list', (req, res) => {
  const reminders = getDb().prepare(`
    SELECT pr.*, i.invoice_number, i.total, i.paid_amount, i.due_date as invoice_due, c.name as customer_name, c.phone as customer_phone
    FROM payment_reminders pr
    LEFT JOIN invoices i ON pr.invoice_id = i.id
    LEFT JOIN customers c ON pr.customer_id = c.id
    ORDER BY pr.reminder_date DESC
  `).all();
  res.json(reminders);
});

router.post('/reminders', (req, res) => {
  const { invoice_id, customer_id, reminder_date, method, notes } = req.body;
  const result = getDb().prepare('INSERT INTO payment_reminders (invoice_id, customer_id, reminder_date, method, notes) VALUES (?,?,?,?,?)').run(invoice_id, customer_id, reminder_date, method || 'email', notes);
  res.json({ id: result.lastInsertRowid, message: 'Reminder created' });
});

module.exports = router;
