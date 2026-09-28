// Test MHTML generation with embedded logo & stamp
const { generateInvoiceDoc } = require('./word-invoice');
const inv = {
  invoice_number: 'A11477', customer_id: 1, customer_name: 'NEW PURKAIT SWEETS',
  customer_address: 'Village-Canning Bazar,Para-Canning Bazar,\nP.S-Canning, P.O-Canning Town, South 24 Parganaas,\nWest Bengal- 743329.',
  customer_phone: '9732897777', customer_gstin: '19BDHPP8153N1ZQ', contact_person: 'Bholanath Purkait',
  title: 'GENERAL PEST CONTROL SERVICE', invoice_type: 'annual',
  items: JSON.stringify([{ name: 'GENERAL PEST CONTROL SERVICE', qty: 1, rate: 12700 }]),
  subtotal: 12700, tax_rate: 18, tax_amount: 2286, total: 14986, sgst: 1143, cgst: 1143, igst: 0,
  sac_code: '998531', service_period: '22.07.2026-21.07.2027', service_count: 12,
  status: 'paid', booking_id: '', created_at: '2026-07-22 12:00:00', technician_name: 'Puja Dey Halder'
};
const settings = {
  company_name: 'ADHUNIK PEST CONTROL PVT. LTD.',
  company_address: 'PROMODGARH, P.O.-GOURANGA NAGAR, P.S.-New TOWN, PIN-700162',
  company_phone: '8609387288', company_phone2: '9134153884',
  company_cin: 'u74999wb2019ptc230500', company_tan: 'CALA24665E',
  company_iso: '20eqbb82', company_website: 'www.adhunikpestcontrol.com',
  company_email: 'info@adhunikpestcontrol.com', company_email2: 'rdinfotech2016@gmail.com',
  company_msme: 'WB14E0020935', company_license: 'P19685',
  company_gstin: '19AARCA9483H1ZV',
  company_bank_name: 'Indian Overseas Bank', company_bank_account: '212202000006246',
  company_bank_ifsc: 'IOBA0002122', company_bank_branch: 'BAGUHATI', company_upi: '+91 8609387288'
};
const { filename, html } = generateInvoiceDoc(inv, settings);
console.log('filename:', filename, '| bytes:', html.length);
console.log('is MHTML:', html.startsWith('MIME-Version: 1.0'));
for (const m of ['multipart/related', 'image/png', 'logo.png', 'stamp.png', '<img src="file:///C:/invoice/logo.png"', '<img src="file:///C:/invoice/stamp.png"', 'M/s. NEW PURKAIT SWEETS', '14986.00']) {
  console.log(html.includes(m) ? 'OK ' : 'MISSING', m);
}
require('fs').writeFileSync('sample.mht', html);
console.log('written sample.mht');
