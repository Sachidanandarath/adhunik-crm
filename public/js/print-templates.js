// ===== PRINT TEMPLATES FOR PEST CONTROL CRM =====
// Matches real Adhunik Pest Control bill formats

// Helper: Convert number to Indian words
function numberToWords(num) {
  if (num === 0) return 'Zero';
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
    'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const scales = ['','Thousand','Lakh','Crore'];
  
  function twoDigits(n) {
    if (n < 20) return ones[n];
    return tens[Math.floor(n/10)] + (n%10 ? ' ' + ones[n%10] : '');
  }
  function threeDigits(n) {
    if (n >= 100) return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' and ' + twoDigits(n%100) : '');
    return twoDigits(n);
  }
  
  let result = '';
  let n = Math.floor(num);
  if (n >= 10000000) { result += threeDigits(Math.floor(n/10000000)) + ' Crore '; n %= 10000000; }
  if (n >= 100000) { result += twoDigits(Math.floor(n/100000)) + ' Lakh '; n %= 100000; }
  if (n >= 1000) { result += twoDigits(Math.floor(n/1000)) + ' Thousand '; n %= 1000; }
  if (n > 0) result += threeDigits(n);
  
  // Handle paise
  const paise = Math.round((num - Math.floor(num)) * 100);
  let words = result.trim();
  if (paise > 0) words += ' and ' + twoDigits(paise) + ' Paise';
  return words + ' Only';
}

// Helper: Format date as DD-MM-YY
function fmtDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getFullYear()).slice(-2)}`;
}

// Helper: Format date as DD.MM.YYYY
function fmtDateDot(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
}

// ===== COMPANY HEADER =====
function companyHeader(s) {
  s = s || {};
  const lk = 'color:#1155cc;text-decoration:underline;';
  const ph1 = (s.company_phone || '').replace('+91 ', ''), ph2 = (s.company_phone2 || '').replace('+91 ', '');
  return `
    <div style="text-align:right;margin-bottom:2px;">
      <span style="background:#ffe600;color:#dd0000;font-weight:bold;font-size:12px;padding:1px 5px;font-family:'Times New Roman',Times,serif;">MOB-${ph1}, ${ph2}</span>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="width:76px;vertical-align:middle;"><img src="/logo.png" alt="${s.company_name || ''}" style="width:66px;height:66px;object-fit:contain;display:block;"></td>
        <td style="text-align:center;vertical-align:middle;font-family:'Times New Roman',Times,serif;">
          <div style="font-size:24px;font-weight:bold;letter-spacing:.5px;">${s.company_name || ''}</div>
          <div style="font-size:11px;font-weight:bold;line-height:1.65;">${s.company_address || ''}</div>
          <div style="font-size:11px;font-weight:bold;line-height:1.65;">SIN NO-${s.company_cin || ''}, <span style="${lk}">TAN</span> NO- ${s.company_tan || ''}, MSME TG-</div>
          <div style="font-size:11px;font-weight:bold;line-height:1.65;">ISO-9001:2015 NO-${s.company_iso || ''} <span style="${lk}">${s.company_website || ''}</span>,</div>
          <div style="font-size:11px;font-weight:bold;line-height:1.65;"><span style="${lk}">Email-${s.company_email || ''}, ${s.company_email2 || ''}</span></div>
          <div style="font-size:11px;font-weight:bold;line-height:1.65;">MSMEUAM NO-${s.company_msme || ''}, <span style="${lk}">License</span> No-${s.company_license || ''}</div>
          ${s.company_gem ? `<div style="font-size:11px;font-weight:bold;line-height:1.65;">Gem Seller Id: ${s.company_gem}</div>` : ''}
        </td>
        <td style="width:76px;"></td>
      </tr>
    </table>`;
}

// ===== BANK DETAILS =====
function bankDetails(s) {
  return `
    <div style="margin-top:12px;border-top:1px solid #ccc;padding-top:8px;">
      <div style="font-weight:bold;font-size:11px;">Company's Bank Details</div>
      <div style="display:flex;justify-content:space-between;margin-top:4px;">
        <div style="font-size:10px;">
          <div>${s.company_name || ''}</div>
          <div>Bank Name: ${s.company_bank_name || ''}</div>
          <div>A/C No: ${s.company_bank_account || ''}</div>
          <div>IFSC Code: ${s.company_bank_ifsc || ''}</div>
          <div>Branch: ${s.company_bank_branch || ''}</div>
        </div>
        <div style="font-size:10px;text-align:right;">
          <div>GooglePay / PhonePay / Paytm</div>
          <div style="font-size:14px;font-weight:bold;">${s.company_upi || ''}</div>
        </div>
      </div>
    </div>`;
}

// ===== SIGNATURE SECTION =====
function signatureSection() {
  return `
    <div style="display:flex;justify-content:space-between;margin-top:30px;padding-top:10px;">
      <div style="font-size:10px;">
        <div style="font-weight:bold;">${document.querySelector('#companyNameHeader')?.textContent || 'ADHUNIK PEST CONTROL PVT.LTD'}</div>
        <div style="margin-top:4px;">Customer Acceptance / Approval for Bill</div>
        <div style="margin-top:20px;">Approve by: ________________</div>
        <div style="margin-top:4px;">Contact No: ________________</div>
        <div style="margin-top:4px;">Employee Signature: ________________</div>
      </div>
      <div style="text-align:center;margin-top:20px;">
        <div style="font-weight:bold;">Thanking You</div>
        <div style="margin-top:30px;border-top:1px solid #333;padding-top:4px;font-size:10px;">
          Authorised Signatory
        </div>
      </div>
    </div>`;
}

// ===== PRINT / PDF ENGINE =====
// Shows a generated document. Tries a popup first; if the browser blocks it
// (common after async calls), falls back to a hidden iframe + auto print.
function openPrintWindow(html) {
  const win = window.open('', '_blank', 'width=800,height=1000');
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
    return;
  }
  let frame = document.getElementById('printFallbackFrame');
  if (frame) frame.remove();
  frame = document.createElement('iframe');
  frame.id = 'printFallbackFrame';
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(frame);
  const doc = frame.contentWindow.document;
  doc.open(); doc.write(html); doc.close();
  setTimeout(() => { try { frame.contentWindow.focus(); frame.contentWindow.print(); } catch (e) { /* ignore */ } }, 600);
}

// Renders a generated document to a real PDF file (A4, multi-page) and downloads it
window.downloadPdfFromHtml = async (html, filename) => {
  const styleMatch = html.match(/<style>[\s\S]*?<\/style>/) || [''];
  const bodyMatch = html.match(/<body>([\s\S]*)<\/body>/);
  let bodyHtml = bodyMatch ? bodyMatch[1] : html;
  bodyHtml = bodyHtml.replace(/<div class="no-print"[\s\S]*?<\/div>\s*$/, '');
  const holder = document.createElement('div');
  holder.style.cssText = 'position:absolute;left:-10000px;top:0;width:794px;background:#fff;color:#222;';
  holder.innerHTML = styleMatch[0] + bodyHtml;
  document.body.appendChild(holder);
  try {
    await new Promise(r => setTimeout(r, 500)); // let the logo image load
    const canvas = await html2canvas(holder, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
    const pageW = 210, pageH = 297;
    const imgH = canvas.height * pageW / canvas.width;
    const img = canvas.toDataURL('image/jpeg', 0.95);
    let heightLeft = imgH, position = 0;
    pdf.addImage(img, 'JPEG', 0, position, pageW, imgH);
    heightLeft -= pageH;
    while (heightLeft > 0) {
      position -= pageH;
      pdf.addPage();
      pdf.addImage(img, 'JPEG', 0, position, pageW, imgH);
      heightLeft -= pageH;
    }
    pdf.save(filename);
  } finally {
    holder.remove();
  }
};

// =========================================================
// 1. NON-GST INVOICE (Termite / One-time Service Bill)
// =========================================================
window.buildNonGstInvoiceHtml = function(inv, customer, settings) {
  const s = settings || {};
  const items = typeof inv.items === 'string' ? JSON.parse(inv.items) : (inv.items || []);
  const fmt = n => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const ph1 = (s.company_phone || '').replace('+91 ', ''), ph2 = (s.company_phone2 || '').replace('+91 ', '');
  const billDate = inv.bill_date_display || fmtDateShort(inv.created_at);
  const warranty = inv.warranty_display || (inv.warranty_from && inv.warranty_to ? fmtDateDot(inv.warranty_from) + ' to ' + fmtDateDot(inv.warranty_to) : '');
  const cp = inv.contact_person || customer.contact_person || customer.name;
  const rows = items.map(it => {
    const rate = Number(it.rate || 0), qty = Number(it.qty || 1);
    const amt = (it.amount !== undefined && it.amount !== null && it.amount !== '') ? Number(it.amount) : rate * qty;
    return `<tr><td colspan="3">${it.name || it.description || ''}</td><td style="text-align:right;">${fmt(rate)}</td><td style="text-align:center;">${qty}</td><td style="text-align:right;">${fmt(amt)}</td><td>NO</td><td style="text-align:right;">${fmt(amt)}</td></tr>`;
  });
  const empty = Math.max(2, 7 - rows.length);
  for (let i = 0; i < empty; i++) {
    rows.push(`<tr><td colspan="3" style="height:14px;"></td><td></td><td></td><td></td><td></td><td style="text-align:right;">${i >= empty - 2 ? '-' : ''}</td></tr>`);
  }
  const words = inv.amount_in_words || numberToWords(inv.subtotal || inv.total);
  const termsBody = (inv.terms_conditions || '').split(/Customer's Signature/)[0].trim();
  return `<!DOCTYPE html><html><head><title>Invoice - ${inv.invoice_number}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    @page { size:A4; margin:10mm; }
    body { font-family:Arial,Helvetica,sans-serif; font-size:10px; color:#111; padding:12px; }
    table.g { width:100%; border-collapse:collapse; }
    table.g td, table.g th { border:1px solid #000; padding:3px 5px; font-size:10px; vertical-align:top; }
    table.g th { text-align:center; font-weight:bold; }
    .nb { border:none !important; }
    .lk { color:#0000ee; text-decoration:underline; }
    .up { text-transform:uppercase; }
    @media print { body { padding:0; } .no-print { display:none; } }
  </style></head><body>
  <table class="g">
    <tr><td colspan="8" style="text-align:center;font-weight:bold;font-size:12px;">Invoice/Bill</td></tr>
    <tr><td colspan="8" class="nb" style="padding:4px 0 8px;">${companyHeader(s)}</td></tr>
    <tr>
      <td style="width:7%;font-weight:bold;">To :</td>
      <td colspan="3" style="text-align:center;">${customer.name}</td>
      <td colspan="2" style="font-weight:bold;">Bill No :</td>
      <td colspan="2" style="text-align:center;">${inv.invoice_number}</td>
    </tr>
    <tr>
      <td colspan="4" rowspan="3" style="line-height:1.55;">${customer.address || ''}${customer.city ? ', ' + customer.city : ''}${customer.zip ? '- ' + customer.zip : ''}<br>Contract person-${cp}<br>Mobile no…${customer.phone || ''}</td>
      <td colspan="2" style="font-weight:bold;">Booking I'd.</td>
      <td colspan="2">${inv.booking_id || ''}</td>
    </tr>
    <tr><td colspan="4" style="height:16px;"></td></tr>
    <tr>
      <td colspan="2" style="font-weight:bold;">Bill Date :</td>
      <td colspan="2" style="text-align:right;">${billDate}</td>
    </tr>
    <tr><td colspan="8"><span style="background:#ffe600;padding:1px 5px;font-weight:bold;">Warranty Period.. ${warranty}</span></td></tr>
    <tr><td colspan="8" style="font-size:9.5px;">We thank you for your valuable enquiry and have pleasure in submitting our offer as below :</td></tr>
    <tr>
      <th colspan="3" style="width:38%;">Service/Items Details</th>
      <th style="width:10%;">Basic Price</th>
      <th style="width:8%;">Qty</th>
      <th style="width:14%;">Total Basic Price</th>
      <th style="width:12%;">GST Value @18%</th>
      <th style="width:14%;">Total Value</th>
    </tr>
    ${rows.join('')}
    <tr><td colspan="7" style="text-align:right;font-weight:bold;">Total</td><td>${fmt(inv.subtotal || inv.total)}</td></tr>
    <tr><td colspan="7" style="text-align:right;font-weight:bold;">Service charge(10%)</td><td>…………………………….</td></tr>
    <tr><td colspan="7" style="text-align:right;font-weight:bold;">GST (18%)</td><td>…………………………….</td></tr>
    <tr><td style="font-weight:bold;font-size:11px;">Net Payable</td><td colspan="6">${words} ${'-'.repeat(55)}</td><td>${fmt(inv.subtotal || inv.total)}</td></tr>
    <tr><td colspan="3" style="font-weight:bold;">Company's Bank Details</td><td colspan="5"></td></tr>
    <tr>
      <td colspan="3" style="text-align:center;">${s.company_name || ''}</td>
      <td colspan="2" style="text-align:center;font-weight:bold;font-size:11px;">GooglePay</td>
      <td colspan="2" style="text-align:center;font-weight:bold;font-size:11px;">PhonePay</td>
      <td style="text-align:center;font-weight:bold;font-size:11px;">Paytm</td>
    </tr>
    <tr>
      <td style="font-weight:bold;width:15%;">Bank Name :</td>
      <td colspan="2" style="font-weight:bold;">${s.company_bank_name || ''}</td>
      <td colspan="5" rowspan="4" style="text-align:center;vertical-align:middle;font-size:17px;font-weight:bold;">+91 ${ph1}</td>
    </tr>
    <tr><td style="font-weight:bold;">A/C No :</td><td colspan="2" style="font-weight:bold;">${s.company_bank_account || ''}</td></tr>
    <tr><td style="font-weight:bold;">IFCS Code :</td><td colspan="2" style="font-weight:bold;">${(s.company_bank_ifsc || '').toUpperCase()}</td></tr>
    <tr><td style="font-weight:bold;">Branch :</td><td colspan="2" style="font-weight:bold;">${(s.company_bank_branch || '').toUpperCase()}</td></tr>
    <tr><td colspan="8">Thanking You ,</td></tr>
    <tr>
      <td colspan="4" style="height:78px;">
        <div style="font-size:9.5px;">${(s.company_name || '').toUpperCase()}</div>
        <img src="/stamp.png" alt="" style="width:88%;max-width:270px;margin-top:2px;">
      </td>
      <td colspan="4">
        <div style="text-align:center;font-weight:bold;font-size:9.5px;">Customer Acceptance / Approval for Bill</div>
        <div style="margin-top:12px;">Approve by</div>
        <div style="margin-top:16px;">Contact No</div>
      </td>
    </tr>
    <tr><td colspan="4" style="text-align:center;">Employee Signature</td><td colspan="4"></td></tr>
  </table>
  ${termsBody ? `
  <div style="page-break-before:always;font-size:10px;line-height:1.65;margin-top:36px;white-space:pre-wrap;">${termsBody}</div>
  <div style="display:flex;justify-content:space-between;margin-top:44px;font-size:10px;">
    <div>
      <div>Customer's Signature</div>
      <div style="margin-top:30px;">.......................................</div>
      <div style="margin-top:16px;">Date:</div>
    </div>
    <div style="text-align:center;">
      <div>Company's Signature</div>
      <img src="/stamp.png" alt="" style="width:240px;margin-top:6px;">
      <div style="margin-top:2px;">Date:</div>
    </div>
  </div>` : ''}
  <div class="no-print" style="text-align:center;margin-top:20px;">
    <button onclick="window.print()" style="padding:10px 30px;font-size:14px;cursor:pointer;background:#1a73e8;color:#fff;border:none;border-radius:4px;">Print Invoice</button>
    <button onclick="window.close()" style="padding:10px 30px;font-size:14px;cursor:pointer;background:#666;color:#fff;border:none;border-radius:4px;margin-left:10px;">Close</button>
  </div>
  </body></html>`;
};
window.printNonGstInvoice = (inv, customer, settings) => openPrintWindow(window.buildNonGstInvoiceHtml(inv, customer, settings));

// =========================================================
// 2. GST TAX INVOICE (With SGST/CGST breakdown)
// =========================================================
window.buildGstInvoiceHtml = function(inv, customer, settings) {
  const s = settings;
  const items = typeof inv.items === 'string' ? JSON.parse(inv.items) : (inv.items || []);
  const subtotal = inv.subtotal || 0;
  const sgstRate = 9;
  const cgstRate = 9;
  const sgstAmt = inv.sgst || (subtotal * sgstRate / 100);
  const cgstAmt = inv.cgst || (subtotal * cgstRate / 100);
  const totalGst = sgstAmt + cgstAmt;
  const grandTotal = inv.total || (subtotal + totalGst);
  
  return `<!DOCTYPE html><html><head><title>Tax Invoice - ${inv.invoice_number}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; padding:15px; font-size:11px; color:#222; }
    table { width:100%; border-collapse:collapse; }
    th, td { border:1px solid #555; padding:5px 8px; font-size:10px; }
    th { background:#e8e8e8; text-align:left; font-weight:bold; }
    .right { text-align:right; } .center { text-align:center; }
    .header-line { border-top:2px solid #333; border-bottom:2px solid #333; padding:4px 0; text-align:center; font-size:14px; font-weight:bold; margin:8px 0; }
    @media print { body { padding:0; } .no-print { display:none; } }
  </style></head><body>
    ${companyHeader(s)}
    
    <div class="header-line">Tax - Invoice</div>
    
    <div style="display:flex;justify-content:space-between;">
      <div style="font-size:10px;">
        <div><b>Bill No:</b> ${inv.invoice_number}</div>
        <div><b>Date:</b> ${fmtDateDot(inv.created_at)}</div>
      </div>
    </div>
    
    <div style="margin:10px 0;border:1px solid #555;padding:8px;font-size:10px;">
      <div><b>To,</b></div>
      <div style="font-weight:bold;margin:4px 0;">${customer.name}</div>
      <div>${customer.address || ''}</div>
      ${customer.city ? `<div>${customer.city} - ${customer.zip || ''}</div>` : ''}
      <div>Contact Person: ${inv.contact_person || customer.contact_person || customer.name}</div>
      <div>Contact No: ${customer.phone || ''}</div>
      ${customer.email ? `<div>Email: ${customer.email}</div>` : ''}
      ${customer.gstin ? `<div><b>GSTN: ${customer.gstin}</b></div>` : ''}
    </div>
    
    <table>
      <thead>
        <tr>
          <th style="width:5%">S.No</th>
          <th style="width:35%">Type of Service</th>
          <th class="center">Service Count</th>
          <th class="right">Per Service (Rs.)</th>
          <th class="right">Amount (Rs.)</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item, idx) => `
          <tr>
            <td class="center">${idx + 1}.</td>
            <td>
              ${item.name || ''}<br>
              ${item.description || ''}
              ${inv.service_period ? `<br><i>${inv.service_period}</i>` : ''}
            </td>
            <td class="center">${inv.service_count || item.qty || 1}</td>
            <td class="right">${Number(item.rate || inv.per_service_rate || 0).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
            <td class="right">${Number((item.rate || 0) * (item.qty || 1)).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <table style="margin-top:8px;">
      <tr>
        <td style="width:50%;border:none;vertical-align:top;">
          <div style="font-size:10px;">
            <div><b>GSTIN: ${s.company_gstin || ''}</b></div>
            <div>SAC Code: ${inv.sac_code || s.sac_code || '998531'}</div>
          </div>
        </td>
        <td style="border:none;">
          <table style="width:100%;">
            <tr>
              <td class="right" style="border:none;font-size:10px;">9% SGST</td>
              <td class="right" style="border:none;font-size:10px;width:80px;">${Number(sgstAmt).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
            </tr>
            <tr>
              <td class="right" style="border:none;font-size:10px;">9% CGST</td>
              <td class="right" style="border:none;font-size:10px;width:80px;">${Number(cgstAmt).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
            </tr>
            <tr style="border-top:1px solid #333;">
              <td class="right" style="border:none;font-size:10px;"><b>18% GST (Total)</b></td>
              <td class="right" style="border:none;font-size:10px;width:80px;"><b>${Number(totalGst).toLocaleString('en-IN', {minimumFractionDigits:2})}</b></td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <div style="margin-top:10px;border:2px solid #333;padding:8px;display:flex;justify-content:space-between;">
      <div style="font-size:10px;">
        <div>A/c: ${s.company_bank_account || ''}</div>
        <div>Name: ${s.company_name || ''}</div>
        <div>Bank: ${s.company_bank_name || ''}</div>
        <div>Branch: ${s.company_bank_branch || ''}</div>
        <div>IFSC: ${s.company_bank_ifsc || ''}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:14px;font-weight:bold;">Total Amount</div>
        <div style="font-size:10px;margin:4px 0;">In Words: ${inv.amount_in_words || numberToWords(grandTotal)}</div>
        <div style="font-size:18px;font-weight:bold;border-top:2px solid #333;padding-top:4px;">
          ${Number(grandTotal).toLocaleString('en-IN', {minimumFractionDigits:2})}
        </div>
      </div>
    </div>
    
    <div style="display:flex;justify-content:space-between;margin-top:40px;font-size:10px;">
      <div>
        <div style="border-top:1px solid #333;padding-top:4px;width:200px;text-align:center;">Customer's Signature</div>
        <div style="margin-top:4px;">Date:</div>
      </div>
      <div style="text-align:right;">
        <div style="border-top:1px solid #333;padding-top:4px;width:200px;text-align:center;">Company's Signature</div>
        <div style="margin-top:4px;">Date:</div>
      </div>
    </div>
    
    <div class="no-print" style="text-align:center;margin-top:20px;">
      <button onclick="window.print()" style="padding:10px 30px;font-size:14px;cursor:pointer;background:#1a73e8;color:#fff;border:none;border-radius:4px;">Print Invoice</button>
      <button onclick="window.close()" style="padding:10px 30px;font-size:14px;cursor:pointer;background:#666;color:#fff;border:none;border-radius:4px;margin-left:10px;">Close</button>
    </div>
  </body></html>`;
};
window.printGstInvoice = (inv, customer, settings) => openPrintWindow(window.buildGstInvoiceHtml(inv, customer, settings));

// =========================================================
// 3. ANNUAL MAINTENANCE INVOICE (with Service Schedule)
// =========================================================
window.buildAnnualInvoiceHtml = function(inv, customer, settings) {
  const s = settings;
  const items = typeof inv.items === 'string' ? JSON.parse(inv.items) : (inv.items || []);
  const serviceCount = inv.service_count || 4;
  
  return `<!DOCTYPE html><html><head><title>Annual Invoice - ${inv.invoice_number}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; padding:15px; font-size:11px; color:#222; }
    table { width:100%; border-collapse:collapse; }
    th, td { border:1px solid #555; padding:5px 8px; font-size:10px; }
    th { background:#e8e8e8; text-align:left; font-weight:bold; }
    .right { text-align:right; } .center { text-align:center; }
    .header-line { border-top:2px solid #333; border-bottom:2px solid #333; padding:2px 0; text-align:center; font-size:10px; margin:6px 0; }
    .service-log { margin-top:8px; }
    .service-log th { background:#f0f0f0; font-size:9px; }
    .service-log td { min-height:30px; height:35px; }
    @media print { body { padding:0; } .no-print { display:none; } }
  </style></head><body>
    ${companyHeader(s)}
    
    <div class="header-line"><b>Invoice / Bill</b></div>
    
    <div style="display:flex;justify-content:space-between;">
      <div style="font-size:10px;">
        <div><b>To:</b> ${customer.name}</div>
        <div>${customer.address || ''}</div>
        ${customer.city ? `<div>${customer.city}${customer.state ? ', '+customer.state : ''}${customer.zip ? '-'+customer.zip : ''}</div>` : ''}
        <div>Contact Person: ${inv.contact_person || customer.contact_person || customer.name}</div>
        <div>Contact No: ${customer.phone || ''}</div>
      </div>
      <div style="text-align:right;font-size:10px;">
        <div><b>Bill No:</b> ${inv.invoice_number}</div>
        ${inv.booking_id ? `<div>Booking ID: ${inv.booking_id}</div>` : ''}
        <div>Bill Date: ${fmtDateShort(inv.created_at)}</div>
        ${inv.service_period ? `<div>Contact Period: ${inv.service_period}</div>` : ''}
      </div>
    </div>
    
    <div style="margin:8px 0;font-size:10px;">
      <b>- Annual Maintenance Service (${serviceCount} Services) & Bill</b>
    </div>
    
    <table>
      <thead>
        <tr>
          <th style="width:40%">Service/Items Details</th>
          <th class="right">Basic Price</th>
          <th class="center">Qty</th>
          <th class="right">Total Basic Price</th>
          <th class="center">GST Value @18%</th>
          <th class="right">Total Value</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td><b>${item.name || ''}</b>${item.description ? '<br>'+item.description : ''}</td>
            <td class="right">${Number(item.rate || 0).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
            <td class="center">${item.qty || 1}</td>
            <td class="right">${Number((item.rate || 0) * (item.qty || 1)).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
            <td class="center">${inv.gst_type === 'none' ? 'No' : 'Yes'}</td>
            <td class="right">${Number((item.rate || 0) * (item.qty || 1)).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
          </tr>
        `).join('')}
        <tr><td colspan="3"></td><td colspan="3" style="border:none;"></td></tr>
      </tbody>
    </table>
    
    <div style="text-align:right;margin-top:4px;font-size:10px;">
      <b>Net Payable: ${inv.amount_in_words || numberToWords(inv.subtotal || inv.total)}
      <span style="float:right;">${Number(inv.subtotal || inv.total).toLocaleString('en-IN', {minimumFractionDigits:2})}</span></b>
    </div>
    
    ${bankDetails(s)}
    ${signatureSection()}
    
    <!-- PAGE 2: Service Log -->
    <div style="page-break-before:always;">
      <div style="text-align:center;font-size:14px;font-weight:bold;margin-bottom:10px;">Annual Maintenance Service - Service Log</div>
      <table class="service-log">
        <thead>
          <tr>
            <th style="width:5%">#</th>
            <th style="width:25%">Type of Service</th>
            <th>Date</th>
            <th>In Time</th>
            <th>Out Time</th>
            <th>Technical Expert</th>
            <th>Company Sign</th>
            <th>Customer Sign</th>
          </tr>
        </thead>
        <tbody>
          ${Array.from({length: serviceCount}, (_, i) => `
            <tr>
              <td class="center">${i + 1}</td>
              <td>${items[0]?.name || 'GENERAL PEST CONTROL SERVICE'}</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <div class="no-print" style="text-align:center;margin-top:20px;">
      <button onclick="window.print()" style="padding:10px 30px;font-size:14px;cursor:pointer;background:#1a73e8;color:#fff;border:none;border-radius:4px;">Print Invoice</button>
      <button onclick="window.close()" style="padding:10px 30px;font-size:14px;cursor:pointer;background:#666;color:#fff;border:none;border-radius:4px;margin-left:10px;">Close</button>
    </div>
  </body></html>`;
};
window.printAnnualInvoice = (inv, customer, settings) => openPrintWindow(window.buildAnnualInvoiceHtml(inv, customer, settings));

// =========================================================
// 4. CERTIFICATE OF GENERAL PEST CONTROL
// =========================================================
window.buildCertificateHtml = function(cert, customer, settings) {
  const s = settings || {};
  const coName = (s.company_name || 'ADHUNIK PEST CONTROL PVT. LTD.').toUpperCase();
  const web = s.company_website || 'adhunikpestcontrol.com';
  const em1 = s.company_email || 'info@adhunikpestcontrol.com';
  const em2 = s.company_email2 || 'rdinfotech2016@gmail.com';
  const ph = [(s.company_phone || '').replace('+91 ', ''), (s.company_phone2 || '').replace('+91 ', '')].filter(Boolean).join(' / ') || '8609387288 / 9134153884';
  const lic = s.company_license || 'P19685';
  const reg = s.company_reg_office || s.company_address || 'C/O BARUN DAS, UCHILDAHA, HAROA, North 24 PARGANAS, West Bengal-743425';
  const ref = cert.ref_number || cert.certificate_number || '';
  const period = cert.contact_period || (cert.valid_from && cert.valid_until ? fmtDateDot(cert.valid_from) + '-' + fmtDateDot(cert.valid_until) : '');
  const premise = cert.premise_address || customer.address || '';
  const method = cert.method || 'Only Spray';
  const chemicals = cert.chemicals || 'Imidacloprid At 21% W/W And Beta-Cyfluthrin At 10.5% W/W';
  return `<!DOCTYPE html><html><head><title>Certificate - ${cert.certificate_number}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    @page { size: A4 landscape; margin: 0; }
    body { font-family:'Calibri','Segoe UI',Arial,sans-serif; background:#e9e9e9; display:flex; flex-direction:column; align-items:center; padding:16px; color:#111; }
    .page { position:relative; width:297mm; height:209mm; background:#fff; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,.35); }
    .frame { position:absolute; inset:7mm 9mm; border:1.1mm double #c8a02c; z-index:1; }
    .corner { position:absolute; pointer-events:none; z-index:2; }
    .c-tl { top:0; left:0; width:92mm; height:92mm; clip-path:polygon(0 0,100% 0,0 100%);
      background:linear-gradient(135deg,#f6dfa0 0mm,#dcb44c 10mm,#b98a1e 21mm,#fff 21mm 25mm,#2b2724 25mm 40mm,#fff 40mm 46mm,#2b2724 46mm 58mm,#fff 58mm); }
    .c-bl { bottom:0; left:0; width:58mm; height:58mm; clip-path:polygon(0 0,0 100%,100% 100%);
      background:linear-gradient(45deg,#f6dfa0 0mm,#dcb44c 7mm,#b98a1e 15mm,#fff 15mm 18mm,#2b2724 18mm 29mm,#fff 29mm); }
    .c-br { bottom:0; right:0; width:92mm; height:92mm; clip-path:polygon(100% 100%,100% 0,0 100%);
      background:linear-gradient(315deg,#f6dfa0 0mm,#dcb44c 10mm,#b98a1e 21mm,#fff 21mm 25mm,#2b2724 25mm 40mm,#fff 40mm 46mm,#2b2724 46mm 58mm,#fff 58mm); }
    .content { position:absolute; inset:7mm 9mm; z-index:3; padding:5mm 12mm 12mm; text-align:center; }
    .head { display:flex; justify-content:center; align-items:center; gap:9mm; margin-top:1mm; }
    .head img { width:30mm; height:30mm; border-radius:50%; object-fit:cover; }
    .co-name { font-family:'Times New Roman',Georgia,serif; font-weight:bold; font-size:32px; line-height:1.15; letter-spacing:2px; max-width:130mm; text-align:left;
      background:linear-gradient(180deg,#f3d78c 0%,#d4a437 48%,#96700f 100%); -webkit-background-clip:text; background-clip:text; color:#c9962b; -webkit-text-fill-color:transparent; }
    .contact { text-align:right; font-size:9.5px; line-height:1.55; margin-top:2mm; }
    .contact .lk { color:#0000ee; text-decoration:underline; }
    .ref { position:absolute; left:24mm; top:64mm; font-size:10.5px; z-index:3; }
    .title { margin-top:16mm; font-size:16.5px; font-weight:bold; letter-spacing:.6px; }
    .certify { margin-top:8mm; font-size:11.5px; }
    .cname { margin-top:6mm; font-size:12.5px; }
    .para { margin:7mm auto 0; max-width:210mm; font-size:11.5px; line-height:1.55; }
    .sign { position:absolute; right:14mm; bottom:18mm; text-align:center; font-size:10.5px; line-height:1.4; }
    .sign img { width:64mm; margin-top:1mm; }
    .regoffice { position:absolute; left:50%; transform:translateX(-50%); bottom:4.5mm; background:#fff; padding:0.5mm 5mm; text-align:center; font-size:9.5px; line-height:1.45; z-index:4; }
    @media print {
      body { background:#fff; padding:0; }
      .page { box-shadow:none; }
      .no-print { display:none; }
    }
  </style></head><body>
    <div class="page">
      <div class="frame"></div>
      <div class="corner c-tl"></div>
      <div class="corner c-bl"></div>
      <div class="corner c-br"></div>
      <div class="content">
        <div class="head">
          <img src="/logo.png" alt="logo">
          <div class="co-name">${coName}</div>
        </div>
        <div class="contact">
          <span class="lk">${web}</span> | <span class="lk">${em1}</span><br>
          <span class="lk">${em2}</span> | ${ph}<br>
          license no- ${lic}
        </div>
        <div class="title">CERTIFICATE OF GENARAL PEST CONTROL</div>
        <div class="certify">THIS IS to Certify</div>
        <div class="cname">${customer.name}</div>
        <div class="para">Has Undergone Pest Control Contact Period -${period} With Premise Address, ${premise}</div>
        <div class="para">${customer.name} Has Properly Pests Free And To The Best Of Our Knowledge In Accordance To Government Of India Rendered Free From Injurious Disease.&nbsp; <b>Method-</b> ${method}, <b>Chemicals Us-</b> ${chemicals}</div>
        <div class="sign">Signature and Seal of Authorized Signatory<br><img src="/stamp.png" alt="stamp"></div>
      </div>
      <div class="ref">Ref-${ref}</div>
      <div class="regoffice"><b>Registered Office</b><br>${reg}</div>
    </div>
    <div class="no-print" style="margin-top:14px;">
      <button onclick="window.print()" style="padding:10px 30px;font-size:14px;cursor:pointer;background:#1a73e8;color:#fff;border:none;border-radius:4px;">Print Certificate</button>
      <button onclick="window.close()" style="padding:10px 30px;font-size:14px;cursor:pointer;background:#666;color:#fff;border:none;border-radius:4px;margin-left:10px;">Close</button>
    </div>
  </body></html>`;
};
window.printCertificate = (cert, customer, settings) => openPrintWindow(window.buildCertificateHtml(cert, customer, settings));

// =========================================================
// 5. QUOTATION FORMAT
// =========================================================
window.buildQuotationHtml = function(quote, customer, settings) {
  const s = settings;
  const items = typeof quote.items === 'string' ? JSON.parse(quote.items) : (quote.items || []);
  const subtotal = quote.subtotal || 0;
  const isGst = quote.gst_type !== 'none';
  const sgstAmt = isGst ? (quote.sgst || subtotal * 9 / 100) : 0;
  const cgstAmt = isGst ? (quote.cgst || subtotal * 9 / 100) : 0;
  const grandTotal = quote.total || subtotal;
  
  return `<!DOCTYPE html><html><head><title>Quotation - ${quote.quote_number}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; padding:15px; font-size:11px; color:#222; }
    table { width:100%; border-collapse:collapse; }
    th, td { border:1px solid #555; padding:5px 8px; font-size:10px; }
    th { background:#1a73e8; color:#fff; text-align:left; font-weight:bold; }
    .right { text-align:right; } .center { text-align:center; }
    .header-line { border-top:2px solid #1a73e8; border-bottom:2px solid #1a73e8; padding:4px 0; text-align:center; font-size:16px; font-weight:bold; color:#1a73e8; margin:8px 0; }
    .terms { margin-top:15px; font-size:9px; line-height:1.5; }
    @media print { body { padding:0; } .no-print { display:none; } }
  </style></head><body>
    ${companyHeader(s)}
    
    <div class="header-line">QUOTATION</div>
    
    <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
      <div style="font-size:10px;">
        <div><b>To:</b></div>
        <div style="font-weight:bold;font-size:12px;">${customer.name}</div>
        <div>${customer.address || ''}</div>
        ${customer.city ? `<div>${customer.city}${customer.state ? ', '+customer.state : ''}</div>` : ''}
        <div>Contact Person: ${quote.contact_person || customer.contact_person || customer.name}</div>
        <div>Mobile: ${customer.phone || ''}</div>
      </div>
      <div style="text-align:right;font-size:10px;">
        <div><b>Quote No:</b> ${quote.quote_number}</div>
        <div><b>Date:</b> ${fmtDateDot(quote.created_at)}</div>
        <div><b>Valid Until:</b> ${fmtDateDot(quote.valid_until)}</div>
        ${quote.warranty_note ? `<div>Warranty: ${quote.warranty_note}</div>` : ''}
      </div>
    </div>
    
    <div style="margin:6px 0;font-size:10px;font-style:italic;">
      Dear Sir/Madam,<br>
      We thank you for your valuable enquiry and have pleasure in submitting our offer as below:
    </div>
    
    ${quote.title ? `<div style="font-weight:bold;margin:6px 0;">${quote.title}</div>` : ''}
    
    <table>
      <thead>
        <tr>
          <th style="width:5%">S.No</th>
          <th style="width:40%">Service / Item Description</th>
          <th class="right">Rate (Rs.)</th>
          <th class="center">Qty</th>
          <th class="right">Amount (Rs.)</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item, idx) => `
          <tr>
            <td class="center">${idx + 1}</td>
            <td>${item.name || ''}${item.description ? '<br><i>'+item.description+'</i>' : ''}</td>
            <td class="right">${Number(item.rate || 0).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
            <td class="center">${item.qty || 1}</td>
            <td class="right">${Number((item.rate || 0) * (item.qty || 1)).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <table style="margin-top:4px;">
      <tr>
        <td style="width:60%;border:none;"></td>
        <td class="right" style="border:none;"><b>Subtotal:</b></td>
        <td class="right" style="border:none;width:120px;"><b>${Number(subtotal).toLocaleString('en-IN', {minimumFractionDigits:2})}</b></td>
      </tr>
      ${isGst ? `
      <tr>
        <td style="border:none;"></td>
        <td class="right" style="border:none;">9% SGST:</td>
        <td class="right" style="border:none;width:120px;">${Number(sgstAmt).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
      </tr>
      <tr>
        <td style="border:none;"></td>
        <td class="right" style="border:none;">9% CGST:</td>
        <td class="right" style="border:none;width:120px;">${Number(cgstAmt).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
      </tr>
      ` : ''}
      <tr style="border-top:2px solid #333;">
        <td style="border:none;"></td>
        <td class="right" style="border:none;font-size:12px;"><b>Grand Total:</b></td>
        <td class="right" style="border:none;font-size:12px;width:120px;"><b>${Number(grandTotal).toLocaleString('en-IN', {minimumFractionDigits:2})}</b></td>
      </tr>
    </table>
    
    <div style="margin-top:8px;padding:6px;background:#f5f5f5;border:1px solid #ddd;font-size:10px;">
      <b>Amount in Words:</b> ${numberToWords(grandTotal)}
    </div>
    
    ${bankDetails(s)}
    
    ${quote.terms_conditions ? `
    <div class="terms">
      <div style="font-weight:bold;font-size:10px;margin-bottom:4px;">Terms & Conditions:</div>
      <div style="white-space:pre-wrap;">${quote.terms_conditions}</div>
    </div>` : ''}
    
    <div style="display:flex;justify-content:space-between;margin-top:30px;font-size:10px;">
      <div>
        <div style="border-top:1px solid #333;padding-top:4px;width:200px;text-align:center;">Customer's Signature</div>
      </div>
      <div style="text-align:right;">
        <div>For <b>${s.company_name || ''}</b></div>
        <div style="margin-top:30px;border-top:1px solid #333;padding-top:4px;width:200px;text-align:center;">Authorised Signatory</div>
      </div>
    </div>
    
    <div class="no-print" style="text-align:center;margin-top:20px;">
      <button onclick="window.print()" style="padding:10px 30px;font-size:14px;cursor:pointer;background:#1a73e8;color:#fff;border:none;border-radius:4px;">Print Quotation</button>
      <button onclick="window.close()" style="padding:10px 30px;font-size:14px;cursor:pointer;background:#666;color:#fff;border:none;border-radius:4px;margin-left:10px;">Close</button>
    </div>
  </body></html>`;
};
window.printQuotation = (quote, customer, settings) => openPrintWindow(window.buildQuotationHtml(quote, customer, settings));

// ===== DIGITAL JOB CARD =====
window.buildJobCardHtml = function(a, settings) {
  const s = settings || {};
  const cell = 'border:1px solid #333;padding:6px 8px;font-size:11px;';
  const lbl = 'font-weight:bold;font-size:10px;color:#444;';
  return `<!DOCTYPE html><html><head><title>Job Card ${a.assignment_number||''}</title><style>
    @page { size: A4; margin: 10mm; }
    body { font-family: Arial, sans-serif; color:#222; margin:0; padding:12px; }
    table { border-collapse: collapse; width:100%; }
    @media print { .no-print { display:none; } }
  </style></head><body>
    <span id="companyNameHeader" style="display:none">${s.company_name || 'ADHUNIK PEST CONTROL PVT.LTD'}</span>
    ${companyHeader(s)}
    <div style="text-align:center;font-size:15px;font-weight:bold;text-decoration:underline;margin:6px 0;">SERVICE JOB CARD</div>
    <table>
      <tr>
        <td style="${cell}"><span style="${lbl}">Job Card No:</span> <strong>${a.assignment_number||'-'}</strong></td>
        <td style="${cell}"><span style="${lbl}">Date:</span> ${fmtDateDot(a.scheduled_date)}</td>
        <td style="${cell}"><span style="${lbl}">Time:</span> ${a.scheduled_time||'-'}</td>
        <td style="${cell}"><span style="${lbl}">Status:</span> ${String(a.status||'').toUpperCase()}</td>
      </tr>
    </table>
    <div style="font-size:12px;font-weight:bold;margin:10px 0 4px;text-decoration:underline;">Customer Details</div>
    <table>
      <tr>
        <td style="${cell}"><span style="${lbl}">Customer:</span> ${a.customer_name||'-'}</td>
        <td style="${cell}"><span style="${lbl}">Phone:</span> ${a.customer_phone||'-'}</td>
      </tr>
      <tr>
        <td style="${cell}" colspan="2"><span style="${lbl}">Service Address:</span> ${a.address||'-'}</td>
      </tr>
    </table>
    <div style="font-size:12px;font-weight:bold;margin:10px 0 4px;text-decoration:underline;">Service Details</div>
    <table>
      <tr>
        <td style="${cell}"><span style="${lbl}">Service Type:</span> ${a.service_type||'-'}</td>
        <td style="${cell}"><span style="${lbl}">Technician:</span> ${a.technician_name||'Unassigned'}${a.technician_phone ? ' ('+a.technician_phone+')' : ''}</td>
      </tr>
      <tr>
        <td style="${cell}" colspan="2"><span style="${lbl}">Instructions:</span> ${a.instructions||'-'}</td>
      </tr>
    </table>
    <div style="font-size:12px;font-weight:bold;margin:10px 0 4px;text-decoration:underline;">Technician Checklist</div>
    <table>
      ${['Site inspection & pest sighting noted','Safety precautions & PPE followed','Chemical mixed as per dosage chart','Treatment completed as per SOP','Customer briefed on post-service care','Photos & service proof captured'].map(t=>`<tr><td style="${cell}">&#9744; ${t}</td></tr>`).join('')}
    </table>
    <div style="font-size:12px;font-weight:bold;margin:10px 0 4px;text-decoration:underline;">Service Report (filled after service)</div>
    <table>
      <tr><td style="${cell}height:34px;"><span style="${lbl}">Pests Observed:</span></td></tr>
      <tr><td style="${cell}height:34px;"><span style="${lbl}">Chemicals / Materials Used:</span></td></tr>
      <tr><td style="${cell}height:34px;"><span style="${lbl}">Remarks / Recommendations:</span></td></tr>
    </table>
    ${a.notes ? `<div style="margin-top:8px;font-size:11px;"><strong>Notes:</strong> ${a.notes}</div>` : ''}
    <div style="display:flex;justify-content:space-between;margin-top:40px;">
      <div style="text-align:center;font-size:11px;"><div style="border-top:1px solid #333;padding-top:4px;width:160px;">Technician Signature</div></div>
      <div style="text-align:center;font-size:11px;"><div style="border-top:1px solid #333;padding-top:4px;width:160px;">Customer Signature</div></div>
    </div>
    <div style="text-align:center;font-size:10px;margin-top:16px;">For any complaint regarding this service, contact: ${s.company_phone||''} | ${s.company_email||''}</div>
    <div class="no-print" style="text-align:center;margin-top:20px;">
      <button onclick="window.print()" style="padding:10px 30px;font-size:14px;cursor:pointer;background:#1a73e8;color:#fff;border:none;border-radius:4px;">Print Job Card</button>
      <button onclick="window.close()" style="padding:10px 30px;font-size:14px;cursor:pointer;background:#666;color:#fff;border:none;border-radius:4px;margin-left:10px;">Close</button>
    </div>
  </body></html>`;
};
window.printJobCard = (a, settings) => openPrintWindow(window.buildJobCardHtml(a, settings));

// ===== BILL GENERATOR (replicates the GST & Non-GST bill formats) =====
window.buildCustomBillHtml = function(d, s) {
  s = s || {};
  const isGst = d.bill_type === 'gst';
  // Non-GST bills use the exact termite-bill grid design (same as invoice print)
  if (!isGst) {
    return window.buildNonGstInvoiceHtml({
      invoice_number: d.bill_no, booking_id: d.booking_id,
      bill_date_display: d.bill_date, warranty_display: d.period,
      items: (d.items || []).map(it => ({ name: it.name, rate: it.price, qty: it.qty, amount: it.amount })),
      subtotal: d.subtotal, total: d.net, amount_in_words: d.net_words,
      terms_conditions: d.terms, gst_type: 'none', contact_person: d.contact_person
    }, { name: d.customer_name, address: d.customer_address, phone: d.customer_phone, contact_person: d.contact_person }, s);
  }
  // GST bills use the exact Ambuja Neotia tax-invoice design (serif, bordered 4-col grid)
  const fmtN = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const bd = String(d.bill_date || '').slice(0, 10);
  const billDate = /^\d{4}-\d{2}-\d{2}$/.test(bd) ? fmtDateDot(bd) : (d.bill_date || '');
  const B = 'border:1px solid #000;';
  const tc = B + 'padding:8px 6px;text-align:center;vertical-align:middle;';
  const items = (d.items || []);
  const nameList = items.map((x, j) => `${j + 1}.&nbsp; ${x.name || ''}`).join('\n\n');
  let itemRows = '';
  items.forEach((it, i) => {
    itemRows += '<tr>';
    if (i === 0) itemRows += `<td rowspan="${items.length + 2}" style="${B}padding:10px 12px;vertical-align:top;line-height:1.8;white-space:pre-wrap;">${nameList}</td>`;
    itemRows += `<td style="${tc}">${it.qty || 1}</td><td style="${tc}">${fmtN(it.price)}</td><td style="${tc}">${fmtN(it.amount)}</td></tr>`;
  });
  if (!items.length) itemRows = `<tr><td rowspan="2" style="${B}padding:10px 12px;"></td><td style="${tc}"></td><td style="${tc}"></td><td style="${tc}"></td></tr>`;
  itemRows += `<tr><td colspan="2" style="${B}padding:8px 10px;text-align:right;">9%SGST</td><td style="${tc}">${fmtN(d.sgst)}</td></tr>`;
  itemRows += `<tr><td colspan="2" style="${B}padding:8px 10px;text-align:right;">9%CGST</td><td style="${tc}">${fmtN(d.cgst)}</td></tr>`;

  const logRows = (d.logs || []).map(l => `<tr>
    <td style="${B}padding:4px 6px;font-size:10px;">${l.pest || ''}</td><td style="${B}padding:4px 6px;font-size:10px;">${l.date || ''}</td>
    <td style="${B}padding:4px 6px;font-size:10px;">${l.in_time || ''}</td><td style="${B}padding:4px 6px;font-size:10px;">${l.out_time || ''}</td>
    <td style="${B}padding:4px 6px;font-size:10px;">${l.tech || ''}</td><td style="${B}width:70px;"></td><td style="${B}width:70px;"></td></tr>`).join('');

  return `<!DOCTYPE html><html><head><title>${d.bill_no || 'Bill'}</title>
  <style>@page{size:A4;margin:10mm;} body{font-family:'Times New Roman',Times,serif;color:#111;font-size:11px;margin:0;padding:14px 20px;}
  table{border-collapse:collapse;} .no-print{display:none;} @media print{.no-print{display:none;}}</style></head><body>
  ${companyHeader(s)}
  <div style="width:88%;margin:8px auto 12px;border-top:1.5px solid #000;border-bottom:1.5px solid #000;height:2.5px;"></div>
  <div style="width:86%;margin:0 auto;">
  <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:11px;"><span>Bill No- ${d.bill_no || ''}</span><span>Date:-${billDate}</span></div>
  <div style="margin-top:16px;line-height:1.6;white-space:pre-wrap;">To,
${d.customer_name || ''}
${d.customer_address || ''}
Contact Person- ${d.contact_person || ''}
Contact No - ${d.customer_phone || ''}${d.customer_email ? '\nEmail Id-' + d.customer_email : ''}${d.customer_gstin ? '\nGSTN-' + d.customer_gstin : ''}</div>
  <div style="text-align:center;font-weight:bold;font-size:13px;margin:16px 0 10px;">Tax - Invoice</div>
  <table style="width:100%;margin:0 auto;font-size:10.5px;">
    <tr><th style="${B}width:44%;padding:10px 6px;text-align:center;font-weight:normal;vertical-align:middle;">Type of Service</th><th style="${B}width:16%;padding:10px 6px;text-align:center;font-weight:normal;vertical-align:middle;">service</th><th style="${B}width:20%;padding:10px 6px;text-align:center;font-weight:normal;vertical-align:middle;">Per Sq Ft service (Rs.)</th><th style="${B}width:20%;padding:10px 6px;text-align:center;font-weight:normal;vertical-align:middle;">Amount (Rs.)</th></tr>
    ${itemRows}
    <tr><td colspan="2" style="${B}padding:8px 6px;text-align:center;line-height:1.7;">GSTIN -${s.company_gstin || ''}<br>Sac Code-${d.sac_code || '998531'}</td><td style="${tc}">18% IGST(Total)</td><td style="${tc}">${fmtN(d.gst)}</td></tr>
    <tr><td style="${B}padding:6px 8px;line-height:1.65;vertical-align:top;">A/c-${s.company_bank_account || ''}<br>Name-${s.company_name || ''}<br>Bank-${s.company_bank_name || ''}<br>Branch-${s.company_bank_branch || ''}<br>IFSC-${s.company_bank_ifsc || ''}</td><td style="${B}padding:6px 8px;font-weight:bold;vertical-align:middle;">In Word- ${d.net_words || ''}</td><td style="${B}padding:6px 8px;font-weight:bold;vertical-align:middle;">Total Amount</td><td style="${B}padding:6px 8px;font-weight:bold;text-align:center;vertical-align:middle;">${fmtN(d.net)}</td></tr>
  </table>
  ${logRows ? `
  <div style="font-weight:bold;margin:14px 0 4px;">${d.service_log_title || 'Annual Maintenance Service Record'}</div>
  <table style="width:100%;">
    <tr><th style="${B}padding:4px 6px;font-size:10px;background:#eee;text-align:center;">Type of pest</th><th style="${B}padding:4px 6px;font-size:10px;background:#eee;text-align:center;">Date</th><th style="${B}padding:4px 6px;font-size:10px;background:#eee;text-align:center;">In Time</th><th style="${B}padding:4px 6px;font-size:10px;background:#eee;text-align:center;">Out Time</th><th style="${B}padding:4px 6px;font-size:10px;background:#eee;text-align:center;">Technical Expert</th><th style="${B}padding:4px 6px;font-size:10px;background:#eee;text-align:center;">Company Sign</th><th style="${B}padding:4px 6px;font-size:10px;background:#eee;text-align:center;">Customer Sign</th></tr>
    ${logRows}
  </table>` : ''}
  ${d.terms ? `<div style="margin-top:14px;font-size:10px;white-space:pre-wrap;line-height:1.6;">${d.terms}</div>` : ''}
  <div style="display:flex;justify-content:space-between;margin-top:40px;font-size:11px;">
    <div style="text-align:center;width:40%;"><div>Customer's Signature</div><div style="margin-top:30px;">………………………………….</div><div style="margin-top:16px;">Date:</div></div>
    <div style="text-align:center;width:40%;"><div>Company's Signature</div><div style="margin-top:30px;">………………………………….</div><div style="margin-top:16px;">Date:</div></div>
  </div>
  </div>
  <div class="no-print" style="text-align:center;margin-top:20px;">
    <button onclick="window.print()" style="padding:10px 30px;font-size:14px;cursor:pointer;background:#1a73e8;color:#fff;border:none;border-radius:4px;">Print Bill</button>
    <button onclick="window.close()" style="padding:10px 30px;font-size:14px;cursor:pointer;background:#666;color:#fff;border:none;border-radius:4px;margin-left:10px;">Close</button>
  </div>
  </body></html>`;
};
window.printCustomBill = (d, settings) => openPrintWindow(window.buildCustomBillHtml(d, settings));

console.log('Print templates loaded.');
if (typeof window !== 'undefined') window.numberToWords = numberToWords;
