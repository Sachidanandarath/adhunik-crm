const B = 'https://crm-orpin-zeta-30.vercel.app/api';
(async () => {
  const post = async (p, body) => {
    const r = await fetch(B + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return r.json();
  };
  const c = await post('/customers', { name: 'PDF Verify Customer', phone: '9123456780' });
  console.log('customer id:', c.id);
  const q = await post('/quotations', { customer_id: c.id, title: 'PDF Verify Quote', subtotal: 5000, tax_rate: 18, tax_amount: 900, discount: 0, total: 5900, gst_type: 'none', items: [{ name: 'General Pest Control', rate: 5000, qty: 1 }] });
  console.log('quote number:', q.quote_number, 'id:', q.id);
  const inv = await post('/invoices', { customer_id: c.id, title: 'Termite Control Service', subtotal: 6000, total: 6000, gst_type: 'none', invoice_type: 'standard', items: [{ name: 'Termite Control Service', rate: 6000, qty: 1 }] });
  console.log('invoice number:', inv.invoice_number, 'id:', inv.id);
  console.log('CUSTOMER_ID=' + c.id, 'QUOTE_ID=' + q.id, 'INV_ID=' + inv.id);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
