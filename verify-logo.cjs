// Production check: Word download is MHTML with embedded logo + stamp
const B = 'https://crm-orpin-zeta-30.vercel.app';
const j = r => r.json();
(async () => {
  const c = await fetch(B + '/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'LOGO CHECK', phone: '999', gstin: '19X', contact_person: 'T', property_type: 'Commercial' }) }).then(j);
  const i = await fetch(B + '/api/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer_id: c.id, title: 'GENERAL PEST CONTROL SERVICE', invoice_type: 'annual', items: [{ name: 'GENERAL PEST CONTROL SERVICE', qty: 1, rate: 12700 }], subtotal: 12700, total: 14986, sgst: 1143, cgst: 1143, service_count: 12, status: 'paid' }) }).then(j);
  const r = await fetch(`${B}/api/invoices/${i.id}/word`);
  const t = await r.text();
  console.log('status:', r.status, '| MHTML:', t.startsWith('MIME-Version: 1.0'));
  for (const m of ['image/png', 'logo.png', 'stamp.png', 'Content-Transfer-Encoding: base64', 'M/s. LOGO CHECK']) {
    console.log(t.includes(m) ? 'OK ' : 'MISSING', m);
  }
  const b64count = (t.match(/Content-Type: image\/png/g) || []).length;
  console.log('embedded images:', b64count);
  await fetch(`${B}/api/invoices/${i.id}`, { method: 'DELETE' });
  await fetch(`${B}/api/customers/${c.id}`, { method: 'DELETE' });
  console.log('cleaned up');
  process.exit(0);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
