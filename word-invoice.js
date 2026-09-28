/**
 * Word (.doc) invoice/bill generator.
 * Produces Word-compatible MHTML documents (with embedded logo & stamp images)
 * matching the company's manual bill formats:
 *  - GST / Annual maintenance bill (with SGST/CGST breakup + service schedule table)
 *  - Non-GST bill (with warranty, working process + terms & conditions)
 */
const fs = require('fs');
const path = require('path');

// ---------- Amount in words (Indian numbering system) ----------
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n) {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
}
function threeDigits(n) {
  const h = Math.floor(n / 100), r = n % 100;
  return (h ? ONES[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? twoDigits(r) : '');
}
function amountInWords(amount) {
  amount = Math.round(Number(amount) || 0);
  if (amount === 0) return 'Zero Rupees Only';
  const crore = Math.floor(amount / 10000000);
  const lakh = Math.floor((amount % 10000000) / 100000);
  const thousand = Math.floor((amount % 100000) / 1000);
  const rest = amount % 1000;
  let words = '';
  if (crore) words += threeDigits(crore) + ' Crore ';
  if (lakh) words += twoDigits(lakh) + ' Lakh ';
  if (thousand) words += twoDigits(thousand) + ' Thousand ';
  if (rest) words += threeDigits(rest);
  return words.trim() + ' Only';
}

// ---------- Formatting helpers ----------
const esc = s => s == null ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const money = n => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function ddmmyy(d) { // 22-07-26
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return `${String(dt.getDate()).padStart(2, '0')}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getFullYear()).slice(2)}`;
}
function dotDate(d) { // 22.07.2026
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return `${String(dt.getDate()).padStart(2, '0')}.${String(dt.getMonth() + 1).padStart(2, '0')}.${dt.getFullYear()}`;
}
function safeName(s) {
  return String(s || 'invoice').replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim();
}

// ---------- Embedded company logo & stamp (cropped from the manual bill) ----------
function loadB64(file) {
  try { return fs.readFileSync(path.join(__dirname, 'public', file)).toString('base64'); } catch (e) { return null; }
}
const LOGO_B64 = loadB64('logo.png');
const STAMP_B64 = loadB64('stamp.png');
const IMG_BASE = 'file:///C:/invoice/';
const wrap76 = s => s.replace(/.{76}/g, m => m + '\n');
const logoImg = w => LOGO_B64 ? `<img src="${IMG_BASE}logo.png" width="${w}" height="${w}">` : '';
const stampImg = w => STAMP_B64 ? `<img src="${IMG_BASE}stamp.png" width="${w}">` : '';

// ---------- Shared company letterhead ----------
function companyBlock(s) {
  return `
  <table cellspacing="0" cellpadding="0" width="100%"><tr>
    ${LOGO_B64 ? `<td width="20%" align="left" valign="middle">${logoImg(105)}</td>` : ''}
    <td align="center" valign="middle">
      <p align="center" style="margin:2px 0"><b><span style="font-size:18pt">${esc(s.company_name)}</span></b></p>
      <p align="center" style="margin:0">${esc(s.company_address)}</p>
      <p align="center" style="margin:0">SIN NO-${esc((s.company_cin || '').toUpperCase())}, TAN NO- ${esc((s.company_tan || '').toUpperCase())}, MSME TG-</p>
      <p align="center" style="margin:0">ISO-9001:2015 NO-${esc((s.company_iso || '').toUpperCase())} ${esc(s.company_website)},</p>
      <p align="center" style="margin:0">Email-${esc(s.company_email2)},${esc(s.company_email)}</p>
      <p align="center" style="margin:0">MSMEUAM NO-${esc(s.company_msme)} ,License No-${esc(s.company_license)}</p>
    </td>
  </tr></table>`;
}
function letterhead(s) {
  return `
  <table cellspacing="0" cellpadding="0" width="100%"><tr>
    <td width="60%"><b>Invoice/Bill</b></td>
    <td width="40%" align="right" style="color:#c00000"><b>MOB-${esc((s.company_phone || '').replace('+91 ', ''))}, ${esc((s.company_phone2 || '').replace('+91 ', ''))}</b></td>
  </tr></table>
  ${companyBlock(s)}`;
}

function bankDetails(s, extraNote) {
  return `
  <table border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse" width="55%">
    <tr><td colspan="2" bgcolor="#f2f2f2"><b>Company's Bank Details</b>${extraNote ? ' &nbsp;&nbsp;' + esc(extraNote) : ''}</td></tr>
    <tr><td colspan="2"><b>${esc(s.company_name)}</b></td></tr>
    <tr><td>GooglePay / PhonePay / Paytm</td><td rowspan="3">+91 ${esc((s.company_upi || '').replace('+91 ', ''))}</td></tr>
    <tr><td>Bank Name : <b>${esc(s.company_bank_name)}</b></td></tr>
    <tr><td>A/C No : <b>${esc(s.company_bank_account)}</b></td></tr>
    <tr><td>IFSC Code : <b>${esc(s.company_bank_ifsc)}</b></td><td>Branch : <b>${esc(s.company_bank_branch)}</b></td></tr>
  </table>`;
}

// ---------- GST / Annual maintenance bill (matches the manual bill photo) ----------
const amt = n => Number(n || 0).toFixed(2);
function gstBill(inv, s) {
  const items = JSON.parse(inv.items || '[]');
  const isAnnual = inv.invoice_type === 'annual';
  const svcCount = Number(inv.service_count) || (isAnnual ? 12 : 1);
  // Year span for caption, e.g. 2026-27
  const yr = new Date(inv.created_at).getFullYear();
  const yrSpan = `${yr}-${String(yr + 1).slice(2)}`;
  const caption = isAnnual
    ? `-Annual maintenance Service (${['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve'][svcCount] || svcCount} Service) ${yrSpan} &amp; Bill`
    : 'GST Tax Invoice &amp; Bill';
  const rows = items.length ? items : [{ name: inv.title || 'Service', rate: inv.subtotal, qty: 1 }];
  const gstYesNo = Number(inv.sgst) + Number(inv.cgst) > 0 ? 'Yes' : 'No';
  const serviceName = ((rows[0] && rows[0].name) || inv.title || 'Service').toUpperCase();
  const isCommercial = inv.customer_gstin || /pvt|ltd|m\/s|company|hotel|apartment/i.test(inv.customer_name || '');
  const totalGst = Number(inv.sgst || 0) + Number(inv.cgst || 0) + Number(inv.igst || 0);
  const blankRow = '<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td></tr>';
  const dashRow = '<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td align="right">-</td></tr>';
  // page-2 service visit schedule (first visit pre-filled, rest blank for manual entry)
  let schedule = `<tr>
    <td align="center" style="height:52px"><b>${esc(serviceName)}</b></td>
    <td><b>${dotDate(inv.created_at)}</b><br><br><b>12.00 p.m</b><br><b>01.00 p.m</b></td>
    <td><b>${esc(inv.technician_name || '')}</b></td><td></td><td></td><td></td></tr>`;
  for (let i = 1; i < svcCount; i++) {
    schedule += `<tr><td align="center" style="height:52px"><b>${esc(serviceName)}</b></td><td></td><td></td><td></td><td></td><td></td></tr>`;
  }
  return `
  <table border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse" width="100%">
    <tr><td colspan="6" align="center"><b><span style="font-size:13pt">Invoice/Bill</span></b></td></tr>
    <tr><td colspan="6">
      <p align="right" style="margin:0;color:#c00000"><b>MOB-${esc((s.company_phone || '').replace('+91 ', ''))}, ${esc((s.company_phone2 || '').replace('+91 ', ''))}</b></p>
      ${companyBlock(s)}
    </td></tr>
    <tr>
      <td width="10%"><b>To :</b></td>
      <td colspan="2" align="center"><b>${isCommercial ? 'M/s. ' : ''}${esc((inv.customer_name || '').toUpperCase())}</b></td>
      <td colspan="2" width="25%"><b>Bill No :</b></td>
      <td width="20%" align="center">${esc(inv.invoice_number)}</td>
    </tr>
    <tr>
      <td colspan="3" rowspan="3" valign="top">ADDRESS :- ${esc(inv.customer_address || '').replace(/\n/g, '<br>')}<br>
        ${inv.customer_phone ? 'Mobile No-' + esc(inv.customer_phone) + '<br>' : ''}
        ${inv.contact_person || inv.customer_contact_person ? 'Contact Person-' + esc(inv.contact_person || inv.customer_contact_person) + '<br>' : ''}
        ${inv.customer_gstin ? 'Gstin-' + esc(inv.customer_gstin) : ''}
      </td>
      <td colspan="2"><b>Booking I'd :</b></td><td>${esc(inv.booking_id || '')}</td>
    </tr>
    <tr><td colspan="2" style="height:56px">&nbsp;</td><td>&nbsp;</td></tr>
    <tr><td colspan="2"><b>Bill Date :</b></td><td align="center">${ddmmyy(inv.created_at)}</td></tr>
    ${inv.service_period ? `<tr><td>&nbsp;</td><td colspan="2">Contact Period -${esc(inv.service_period)}</td><td colspan="3">&nbsp;</td></tr>` : ''}
    <tr><td colspan="6" align="center"><b>${caption}</b></td></tr>
    <tr>
      <th align="left" colspan="2">Service/Items Details</th><th align="left">Basic Price</th><th align="left">Qty</th><th align="left">Total Basic Price</th><th align="left">GST Value<br>@18% &nbsp;&nbsp; Total Value</th>
    </tr>
    ${rows.map(it => `<tr>
      <td colspan="2">${esc(it.name.toUpperCase())}</td><td align="right">${amt(it.rate)}</td><td align="center">${esc(it.qty || 1)}</td>
      <td align="right">${amt((it.rate || 0) * (it.qty || 1))}</td><td>${gstYesNo} &nbsp;&nbsp;&nbsp; ${amt((it.rate || 0) * (it.qty || 1))}</td></tr>`).join('')}
    ${blankRow}${blankRow}${blankRow}${blankRow}${dashRow}${blankRow}${dashRow}
    <tr>
      <td colspan="2" rowspan="3"><b><span style="font-size:12pt">GSTIN-${esc(s.company_gstin)}</span></b><br><br><b><span style="font-size:12pt">&nbsp;&nbsp;&nbsp;SAC CODE-${esc(inv.sac_code || s.sac_code || '998531')}</span></b></td>
      <td colspan="3" align="right"><b><span style="font-size:12pt">9% SGST</span></b></td><td>${amt(inv.sgst)}</td>
    </tr>
    <tr><td colspan="3" align="right"><b><span style="font-size:12pt">9% CGST</span></b></td><td>${amt(inv.cgst)}</td></tr>
    <tr><td colspan="3" align="right"><b><span style="font-size:12pt">I GST (18%)</span></b></td><td>${amt(Number(inv.igst) > 0 ? inv.igst : totalGst)}</td></tr>
    <tr>
      <td><b><span style="font-size:12pt">Net Payable</span></b></td>
      <td colspan="4">${amountInWords(inv.total)}………………………………………………………………………………………</td>
      <td>${amt(inv.total)}</td>
    </tr>
    <tr><td><b>Company's Bank Details</b></td><td colspan="5">&nbsp;&nbsp;&nbsp;&nbsp;${inv.status === 'paid' ? 'Cash payment done' : '&nbsp;'}</td></tr>
    <tr>
      <td colspan="3" align="center">${esc(s.company_name.replace(' PVT. LTD.', ' PVT.LTD'))}</td>
      <td align="center"><b><span style="font-size:13pt">GooglePay</span></b></td>
      <td align="center"><b><span style="font-size:13pt">PhonePay</span></b></td>
      <td align="center"><b><span style="font-size:13pt">Paytm</span></b></td>
    </tr>
    <tr><td><b>Bank Name :</b></td><td colspan="2"><b>${esc(s.company_bank_name)}</b></td><td colspan="3" rowspan="4" align="center" valign="middle"><b><span style="font-size:18pt">+91 ${esc((s.company_upi || '').replace('+91 ', '') || (s.company_phone || '').replace('+91 ', ''))}</span></b></td></tr>
    <tr><td><b>A/C No :</b></td><td colspan="2"><b>${esc(s.company_bank_account)}</b></td></tr>
    <tr><td><b>IFCS Code :</b></td><td colspan="2"><b>${esc(s.company_bank_ifsc)}</b></td></tr>
    <tr><td><b>Branch :</b></td><td colspan="2"><b>${esc(s.company_bank_branch)}</b></td></tr>
    <tr>
      <td colspan="3" style="height:90px" valign="top">${esc(s.company_name.replace(' PVT. LTD.', ' PVT.LTD'))}<br>${stampImg(260)}<br><br></td>
      <td colspan="3" valign="top"><b>Customer Acceptance / Approval for Bill</b><br><br>Approve by<br><br>Contact No</td>
    </tr>
    <tr><td colspan="3" align="center">Employee Signature</td><td colspan="3">&nbsp;</td></tr>
  </table>
  ${isAnnual ? `<div style="page-break-before:always">
  <p align="center">Annual maintenance &nbsp;Service</p>
  <table border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse" width="100%">
    <tr><th align="left" width="30%">Type of &nbsp;pest</th><th align="left" width="12%">In Time<br>Out Time</th><th align="left" width="16%">Technical<br>Expert</th><th align="left" width="16%">Company Sign</th><th align="left" width="18%">Customer Sign</th><th align="left" width="8%">service</th></tr>
    ${schedule}
  </table>
  </div>` : ''}`;
}

// ---------- Non-GST bill (e.g. termite control) ----------
function nonGstBill(inv, s) {
  const items = JSON.parse(inv.items || '[]');
  const rows = items.length ? items : [{ name: inv.title || 'Service', rate: inv.subtotal, qty: 1 }];
  const y1 = new Date(inv.created_at).getFullYear();
  const serviceName = ((rows[0] && rows[0].name) || inv.title || 'Service');
  const isTermite = /termite/i.test(serviceName) || /termite/i.test(inv.title || '');
  const warranty = inv.warranty_from && inv.warranty_to
    ? `<p align="center" style="margin:8px 0"><b>Warranty Period…${dotDate(inv.warranty_from)} to ${dotDate(inv.warranty_to)}</b>${inv.warranty_note ? '<br>' + esc(inv.warranty_note) : ''}</p>` : '';
  const terms = inv.terms_conditions || `Section One : Scope of Services :
a) To carry out pest control services for the Property's common areas. The Contractor shall examine the Property carefully and locate areas of critical pest activity. The Contractor shall thoroughly treat areas of infestation or threatened infestation.
b) The Contractor shall perform the service items specified as follows:
i) Type of Pest : ${serviceName}, Method : Drill & Spraying water base, Frequency of Treatment : In the event of reinforcement within the service period, the Contractor shall render additional treatment as necessary at no extra cost.
1) Rate of Pest Control will be based on the area (square feet).
2) Rate of Pest Control will be fixed after visiting the area and it may be negotiable.
3) We are also providing service for Pest Control work of rats, mice, cockroaches, ants, flies, spider, bed bug, snakes, mosquitoes etc.
4) This Pest Control work is taken only for ${serviceName}.
5) Company will not be liable for any kind of damages arising during the work of Pest Control.
Section Two: Environmental, Health & Safety Clauses:
a) The Contractor shall undertake to minimize the negative impact of the pest control on the environment.
b) The Contractor shall make every endeavour to safeguard health and safety of people and animals in the Property against any perils of using pesticides.
c) The Contractor shall make every endeavour to minimize using pesticides when carrying out pest control services under this contract.`;
  return `
  ${letterhead(s)}
  <table cellspacing="0" cellpadding="2" width="100%">
    <tr>
      <td width="55%" valign="top">
        <b>To :</b><br><br>
        <b>${esc((inv.customer_name || '').toUpperCase())}</b><br>
        ${esc(inv.customer_address || '').replace(/\n/g, '<br>')}<br>
        ${inv.contact_person || inv.customer_contact_person ? 'Contact Person- ' + esc(inv.contact_person || inv.customer_contact_person) + '<br>' : ''}
        ${inv.customer_phone ? 'Contact Number- ' + esc(inv.customer_phone) : ''}
      </td>
      <td width="45%" valign="top">
        <table cellspacing="0" cellpadding="2">
          <tr><td><b>Bill No :</b></td><td>${esc(inv.invoice_number)}</td></tr>
          <tr><td><b>Bill Date :</b></td><td>${ddmmyy(inv.created_at)}</td></tr>
          <tr><td><b>Booking I'd :</b></td><td>${esc(inv.booking_id || '')}</td></tr>
        </table>
      </td>
    </tr>
  </table>
  ${warranty}
  <p align="center" style="margin:8px 0"><b>Bill-${y1}-${y1 + 1}</b></p>
  <table border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse" width="100%">
    <tr bgcolor="#f2f2f2">
      <th>Service/Items Details</th><th>Basic Price</th><th>Qty</th><th>Total Basic Price</th><th>GST Value<br>@18%</th><th>Total Value</th>
    </tr>
    ${rows.map(it => `<tr>
      <td>${esc(it.name)}</td><td align="right">${money(it.rate)}</td><td align="center">${esc(it.qty || 1)}</td>
      <td align="right">${money((it.rate || 0) * (it.qty || 1))}</td><td align="center">NO</td>
      <td align="right">${money((it.rate || 0) * (it.qty || 1))}</td></tr>`).join('')}
    <tr><td colspan="5" align="right"><b>Total</b></td><td align="right"><b>${money(inv.subtotal || inv.total)}</b></td></tr>
  </table>
  <br>
  <table cellspacing="0" cellpadding="2" width="100%"><tr>
    <td width="55%" valign="top">${bankDetails(s)}<p>Thanking You ,<br><b>${esc(s.company_name)}</b></p></td>
    <td width="45%" valign="top">
      <table border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse" width="100%">
        <tr><td><b>Total</b></td><td align="right">${money(inv.subtotal || inv.total)}</td></tr>
        <tr><td>Service charge(10%)</td><td align="right">…………………………….</td></tr>
        <tr><td>GST (18%)</td><td align="right">……………………………</td></tr>
        <tr><td><b>Net Payable</b><br>${amountInWords(inv.total)}</td><td align="right" valign="bottom"><b>${money(inv.total)}</b></td></tr>
      </table>
    </td>
  </tr></table>
  <br>
  <table border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse" width="100%">
    <tr bgcolor="#f2f2f2"><td colspan="3"><b>Customer Acceptance / Approval for Bill</b></td></tr>
    <tr><td width="34%"><b>Approve by</b></td><td width="33%"><b>Contact No</b></td><td width="33%"><b>Employee Signature</b></td></tr>
    <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
  </table>
  ${isTermite ? `<br><p><b>Working Process for termite treatment</b></p>
  <p>1. Drill in skating area (inside / outside).<br>
  2. Hole depth will be 5, 6 or 10 in. or diameter of hole will be 10mm &amp; position of hole 45-60 degree on the wall.<br>
  3. Distance of two hole will be 1 feet.<br>
  4. Chemical inject into hole 2 time &amp; seal by white cement.<br>
  5. All wooden furniture will be sprayed chemicals base.</p>` : ''}
  <p><b>TERMS &amp; CONDITIONS :</b></p>
  <p style="white-space:pre-line">${esc(terms)}</p>
  <br>
  <table cellspacing="0" cellpadding="2" width="100%"><tr>
    <td width="50%">Customer's Signature<br>………………………………….<br>Date:</td>
    <td width="50%" align="right">Company's Signature<br>${stampImg(240)}<br>………………………………….<br>Date:</td>
  </tr></table>`;
}

// ---------- Public API ----------
function generateInvoiceDoc(inv, settings) {
  const isGst = inv.invoice_type === 'annual' || (inv.gst_type && inv.gst_type !== 'none');
  const body = isGst ? gstBill(inv, settings) : nonGstBill(inv, settings);
  const prefix = inv.invoice_type === 'annual' ? 'g.p.c gst bill' : inv.invoice_type === 'gst' ? 'GST Invoice' : (inv.title || 'Service Bill');
  const filename = safeName(`${prefix} - ${inv.customer_name || 'Customer'}${inv.invoice_type === 'annual' ? '' : ' - ' + dotDate(inv.created_at)}.doc`);
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${esc(inv.invoice_number)}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>
  @page { size: A4; margin: 1.5cm 1.2cm; }
  body { font-family: 'Times New Roman', serif; font-size: 11pt; }
  table { font-size: 10.5pt; }
  th, td { padding: 3px; }
</style></head>
<body>${body}</body></html>`;
  // Wrap as MHTML so MS Word shows the embedded logo & stamp images
  if (LOGO_B64 || STAMP_B64) {
    const parts = [`--CRMBOUND
Content-Type: text/html; charset="utf-8"
Content-Location: ${IMG_BASE}bill.htm
Content-Transfer-Encoding: 8bit

${html}
`];
    if (LOGO_B64) parts.push(`--CRMBOUND
Content-Type: image/png
Content-Location: ${IMG_BASE}logo.png
Content-Transfer-Encoding: base64

${wrap76(LOGO_B64)}
`);
    if (STAMP_B64) parts.push(`--CRMBOUND
Content-Type: image/png
Content-Location: ${IMG_BASE}stamp.png
Content-Transfer-Encoding: base64

${wrap76(STAMP_B64)}
`);
    return { filename, html: `MIME-Version: 1.0
Content-Type: multipart/related; boundary="CRMBOUND"; type="text/html"

` + parts.join('') + '--CRMBOUND--\n' };
  }
  return { filename, html };
}

module.exports = { generateInvoiceDoc };
