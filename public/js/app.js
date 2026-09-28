/* ===== Adhunik Pest Control CRM - Main Application ===== */

const API_BASE = window.CRM_API_BASE || '';

// ===== API Helper =====
async function handleResponse(r) {
  let body = null;
  try { body = await r.json(); } catch (e) { /* non-JSON error page */ }
  if (!r.ok) {
    const msg = (body && body.error) ? body.error : `Request failed (${r.status})`;
    throw new Error(msg);
  }
  return body;
}
const API = {
  async get(url) { return handleResponse(await fetch(`${API_BASE}/api${url}`)); },
  async post(url, data) { return handleResponse(await fetch(`${API_BASE}/api${url}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) })); },
  async put(url, data) { return handleResponse(await fetch(`${API_BASE}/api${url}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) })); },
  async del(url) { return handleResponse(await fetch(`${API_BASE}/api${url}`, { method:'DELETE' })); },
};

// Surface save/load failures instead of silently showing "Created"
window.addEventListener('unhandledrejection', (e) => {
  const msg = e.reason && e.reason.message ? e.reason.message : 'Something went wrong';
  showToast(msg, 'error');
  e.preventDefault();
});

// ===== Utility Functions =====
const fmt = (n) => '₹' + Number(n||0).toLocaleString('en-IN', {minimumFractionDigits:0});
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'}) : '-';
const badge = (status) => `<span class="badge-status badge-${(status||'').replace(/\s/g,'-').toLowerCase()}">${(status||'').replace(/-/g,' ')}</span>`;

function showToast(msg, type='success') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<i class="fas fa-${type==='success'?'check-circle':'exclamation-circle'}"></i> ${msg}`;
  document.getElementById('toastContainer').appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function openModal(title, body, footer='') {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = body;
  document.getElementById('modalFooter').innerHTML = footer;
  document.getElementById('modalOverlay').classList.add('show');
}
function closeModal() { document.getElementById('modalOverlay').classList.remove('show'); }
document.getElementById('modalClose').onclick = closeModal;
document.getElementById('modalOverlay').onclick = (e) => { if(e.target===e.currentTarget) closeModal(); };

// ===== SIDEBAR NAVIGATION =====
const isMobileView = () => window.innerWidth <= 768;
function openSidebar() { const sb = document.getElementById('sidebar'); sb.classList.remove('closed'); sb.classList.add('open'); document.getElementById('mainContent').classList.remove('full'); }
function closeSidebar() { const sb = document.getElementById('sidebar'); sb.classList.remove('open'); sb.classList.add('closed'); document.getElementById('mainContent').classList.add('full'); }
document.getElementById('sidebarToggle').onclick = () => {
  const sb = document.getElementById('sidebar');
  const visible = isMobileView() ? sb.classList.contains('open') : !sb.classList.contains('closed');
  visible ? closeSidebar() : openSidebar();
};
document.getElementById('sidebarClose').onclick = closeSidebar;
// Close menu when clicking outside of it (mobile / when opened as overlay)
document.addEventListener('click', (e) => {
  const sb = document.getElementById('sidebar');
  if (isMobileView() && sb.classList.contains('open') && !sb.contains(e.target) && !document.getElementById('sidebarToggle').contains(e.target)) closeSidebar();
});

document.querySelectorAll('[data-toggle="collapse"]').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(el.dataset.target);
    const parent = el.closest('.has-submenu');
    if(target) target.classList.toggle('show');
    if(parent) parent.classList.toggle('open');
  });
});

document.querySelectorAll('[data-page]').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    el.classList.add('active');
    navigateTo(el.dataset.page);
    if (isMobileView()) closeSidebar();
  });
});

// ===== PAGE TITLES =====
const pageTitles = {
  'dashboard':'CRM Dashboard','pest-dashboard':'Pest Control Dashboard','inventory-dashboard':'Inventory Dashboard',
  'calendar':'Service Calendar','smart-scheduling':'Smart Scheduling','leads':'All Leads','lead-followups':'Lead Follow-ups',
  'lead-pipeline':'Lead Pipeline','lead-reports':'Lead Reports','ai-call':'AI Call Assistant','inspections':'Inspections',
  'quotation-builder':'Quotation Builder','quotations':'All Quotations','new-contract':'New Contract',
  'manage-contracts':'Manage Contracts','recurring-billing':'Recurring Billing','expiring-contracts':'Expiring Contracts',
  'invoices':'Invoices','bill-generator':'Bill Generator (GST / Non-GST)','payment-reminders':'Payment Reminders','customer-outstandings':'Customer Outstandings','gst-reports':'GST Reports (GSTR-1)',
  'new-complaint':'New Complaint','manage-complaints':'Manage Complaints','whatsapp-marketing':'WhatsApp Marketing',
  'customers':'Customers','technicians':'Technicians','employees':'Employees','vendors':'Vendors',
  'attendance':'Attendance Reports','assign-services':'Assign Services','assigned-services':'Assigned Services',
  'tracking':'Track Technicians','geofence':'Geofence Activity','call-history':'Call History',
  'field-reports':'Field Reports','certificate':'Certificate Generator','fumigation':'Fumigation Certificate',
  'audit':'Audit Inspections','receipt-voucher':'Receipt Voucher','payment-voucher':'Payment Voucher',
  'expenses':'Expenses','general-ledger':'General Ledger','customer-ledger':'Customer Ledger',
  'payroll':'Payroll Management','settings':'Settings',
};

// ===== ROUTER =====
function navigateTo(page) {
  document.getElementById('pageTitle').textContent = pageTitles[page] || page;
  const container = document.getElementById('pageContainer');
  container.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Loading...</p></div>';
  const renderer = pageRenderers[page];
  if (renderer) renderer(container);
  else container.innerHTML = `<div class="empty-state"><i class="fas fa-tools"></i><p>${pageTitles[page] || page} module - Coming soon</p></div>`;
}

// ===== PAGE RENDERERS =====
const pageRenderers = {};

// ===== DASHBOARD =====
pageRenderers['dashboard'] = async (el) => {
  const [d, settings] = await Promise.all([API.get('/dashboard/stats'), API.get('/settings')]);
  const now = new Date();
  const hr = now.getHours();
  const greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  const owner = settings.owner_name || 'Rajesh Das';
  const company = settings.company_name || 'Adhunik Pest Control Pvt Ltd';
  const dateStr = now.toLocaleDateString('en-IN', { weekday:'long', day:'2-digit', month:'short', year:'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true });
  const tip = hr < 12 ? '🌅 Morning kickoff — review today’s service schedule!' : hr < 17 ? '📊 Midday check — how are conversions today?' : '🌙 Day wrap — check pending payments & follow-ups!';
  el.innerHTML = `
    <div class="dash-hero">
      <div>
        <h2>${greet}, ${owner} (${company})!</h2>
        <div class="dash-hero-date">${dateStr} • ${timeStr}</div>
        <div class="dash-hero-chip">${tip}</div>
      </div>
      <div class="dash-hero-art">
        <div class="sun">☀️</div><div class="cloud"></div><div class="cloud2"></div>
        <div class="bars"><span style="height:22px"></span><span style="height:38px"></span><span style="height:30px"></span><span style="height:52px"></span><span style="height:44px"></span><span style="height:58px"></span><span style="height:34px"></span></div>
        <div class="bars-base"></div>
      </div>
    </div>
    <div class="section-title">1. Business Snapshot</div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon blue">👥</div><div class="stat-info"><h3>${d.totalCustomers}</h3><p>Total Customers</p></div></div>
      <div class="stat-card"><div class="stat-icon green">👤</div><div class="stat-info"><h3>${d.totalLeads}</h3><p>Total Leads (${d.newLeads} new)</p></div></div>
      <div class="stat-card"><div class="stat-icon purple">📑</div><div class="stat-info"><h3>${d.activeContracts}</h3><p>Active Contracts</p></div></div>
      <div class="stat-card"><div class="stat-icon green">💰</div><div class="stat-info"><h3>${fmt(d.totalRevenue)}</h3><p>Total Revenue</p></div></div>
      <div class="stat-card"><div class="stat-icon red">🧾</div><div class="stat-info"><h3>${d.unpaidInvoices}</h3><p>Unpaid Invoices</p></div></div>
      <div class="stat-card"><div class="stat-icon orange">📈</div><div class="stat-info"><h3>${fmt(d.pendingAmount)}</h3><p>Pending Amount</p></div></div>
      <div class="stat-card"><div class="stat-icon blue">📋</div><div class="stat-info"><h3>${d.todayAssignments}</h3><p>Today's Services</p></div></div>
      <div class="stat-card"><div class="stat-icon orange">⚠️</div><div class="stat-info"><h3>${d.openComplaints}</h3><p>Open Complaints</p></div></div>
      <div class="stat-card"><div class="stat-icon green">👷</div><div class="stat-info"><h3>${d.availableTechs}/${d.totalTechnicians}</h3><p>Available Technicians</p></div></div>
      <div class="stat-card"><div class="stat-icon red">📦</div><div class="stat-info"><h3>${d.lowStockItems}</h3><p>Low Stock Items</p></div></div>
      <div class="stat-card"><div class="stat-icon orange">📑</div><div class="stat-info"><h3>${d.expiringContracts}</h3><p>Expiring Contracts</p></div></div>
      <div class="stat-card"><div class="stat-icon red">💸</div><div class="stat-info"><h3>${fmt(d.totalExpenses)}</h3><p>Total Expenses</p></div></div>
    </div>
    <div class="section-title">2. Recent Activity</div>
    <div class="grid-2">
      <div class="card"><div class="card-header"><h3>Recent Invoices</h3></div><div class="card-body table-container">
        <table><thead><tr><th>Invoice</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead><tbody>
        ${(d.recentInvoices||[]).map(i=>`<tr><td>${i.invoice_number}</td><td>${i.customer_name||'-'}</td><td>${fmt(i.total)}</td><td>${badge(i.status)}</td></tr>`).join('')}
        </tbody></table></div></div>
      <div class="card"><div class="card-header"><h3>Upcoming Services</h3></div><div class="card-body table-container">
        <table><thead><tr><th>Service</th><th>Customer</th><th>Technician</th><th>Date</th><th>Status</th></tr></thead><tbody>
        ${(d.upcomingServices||[]).map(s=>`<tr><td>${s.service_type}</td><td>${s.customer_name||'-'}</td><td>${s.technician_name||'-'}</td><td>${fmtDate(s.scheduled_date)}</td><td>${badge(s.status)}</td></tr>`).join('')}
        </tbody></table></div></div>
    </div>`;
};

// ===== PEST CONTROL DASHBOARD =====
pageRenderers['pest-dashboard'] = async (el) => {
  const d = await API.get('/dashboard/stats');
  el.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon blue">📋</div><div class="stat-info"><h3>${d.todayAssignments}</h3><p>Today's Services</p></div></div>
      <div class="stat-card"><div class="stat-icon green">👷</div><div class="stat-info"><h3>${d.availableTechs}</h3><p>Available Technicians</p></div></div>
      <div class="stat-card"><div class="stat-icon orange">📑</div><div class="stat-info"><h3>${d.activeContracts}</h3><p>Active Contracts</p></div></div>
      <div class="stat-card"><div class="stat-icon red">⚠️</div><div class="stat-info"><h3>${d.openComplaints}</h3><p>Open Complaints</p></div></div>
    </div>
    <div class="card"><div class="card-header"><h3>Upcoming Pest Control Services</h3><button class="btn btn-primary btn-sm" onclick="navigateTo('assign-services')">+ Assign Service</button></div>
    <div class="card-body table-container">
      <table><thead><tr><th>Assignment#</th><th>Customer</th><th>Service Type</th><th>Technician</th><th>Date</th><th>Status</th></tr></thead><tbody>
      ${(d.upcomingServices||[]).map(s=>`<tr><td>${s.assignment_number||'-'}</td><td>${s.customer_name||'-'}</td><td>${s.service_type}</td><td>${s.technician_name||'-'}</td><td>${fmtDate(s.scheduled_date)}</td><td>${badge(s.status)}</td></tr>`).join('')}
      </tbody></table></div></div>`;
};

// ===== INVENTORY DASHBOARD =====
pageRenderers['inventory-dashboard'] = async (el) => {
  const items = await API.get('/inventory');
  const lowStock = items.filter(i => i.quantity <= i.min_quantity);
  el.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon blue">📦</div><div class="stat-info"><h3>${items.length}</h3><p>Total Items</p></div></div>
      <div class="stat-card"><div class="stat-icon red">⚠️</div><div class="stat-info"><h3>${lowStock.length}</h3><p>Low Stock Items</p></div></div>
      <div class="stat-card"><div class="stat-icon green">🧪</div><div class="stat-info"><h3>${items.filter(i=>i.category==='Chemical').length}</h3><p>Chemicals</p></div></div>
      <div class="stat-card"><div class="stat-icon purple">🔧</div><div class="stat-info"><h3>${items.filter(i=>i.category==='Equipment').length}</h3><p>Equipment</p></div></div>
    </div>
    <div class="card"><div class="card-header"><h3>Inventory Overview</h3><button class="btn btn-primary btn-sm" onclick="showAddItemModal()">+ Add Item</button></div>
    <div class="card-body table-container">
      <table><thead><tr><th>SKU</th><th>Name</th><th>Category</th><th>Qty</th><th>Min Qty</th><th>Cost</th><th>Status</th></tr></thead><tbody>
      ${items.map(i=>`<tr><td>${i.sku}</td><td>${i.name}</td><td>${i.category||'-'}</td><td>${i.quantity} ${i.unit}</td><td>${i.min_quantity}</td><td>${fmt(i.cost_price)}</td><td>${i.quantity<=i.min_quantity?'<span class="badge-status badge-overdue">Low Stock</span>':'<span class="badge-status badge-active">OK</span>'}</td></tr>`).join('')}
      </tbody></table></div></div>`;
};

// ===== LEADS =====
pageRenderers['leads'] = async (el) => {
  const leads = await API.get('/leads');
  el.innerHTML = `
    <div class="toolbar">
      <div class="toolbar-filters">
        <select class="form-control" style="width:140px" onchange="filterLeads(this.value)"><option value="">All Status</option><option>new</option><option>contacted</option><option>qualified</option><option>proposal</option><option>negotiation</option><option>won</option><option>lost</option></select>
        <input type="text" class="form-control" style="width:200px" placeholder="Search leads..." id="leadSearch" onkeyup="searchLeads(this.value)">
      </div>
      <button class="btn btn-primary" onclick="showLeadModal()">+ Add Lead</button>
    </div>
    <div class="card"><div class="card-body table-container">
      <table><thead><tr><th>Name</th><th>Phone</th><th>Source</th><th>Pest Type</th><th>Priority</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody id="leadsTableBody">
      ${leads.map(l=>`<tr><td><strong>${l.name}</strong></td><td>${l.phone||'-'}</td><td>${l.source||'-'}</td><td>${l.pest_type||'-'}</td><td>${badge(l.priority)}</td><td>${badge(l.status)}</td><td><div class="btn-group"><button class="btn btn-outline btn-sm" onclick="editLead(${l.id})">Edit</button><button class="btn btn-danger btn-sm" onclick="deleteLead(${l.id})">Delete</button></div></td></tr>`).join('')}
      </tbody></table></div></div>`;
};

window.showLeadModal = (lead) => {
  const isEdit = !!lead;
  openModal(isEdit ? 'Edit Lead' : 'Add New Lead', `
    <form id="leadForm">
      <div class="form-row">
        <div class="form-group"><label>Name *</label><input class="form-control" name="name" value="${lead?.name||''}" required></div>
        <div class="form-group"><label>Phone</label><input class="form-control" name="phone" value="${lead?.phone||''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Email</label><input class="form-control" name="email" value="${lead?.email||''}"></div>
        <div class="form-group"><label>Source</label><select class="form-control" name="source"><option ${lead?.source==='Website'?'selected':''}>Website</option><option ${lead?.source==='Referral'?'selected':''}>Referral</option><option ${lead?.source==='Google Ads'?'selected':''}>Google Ads</option><option ${lead?.source==='Cold Call'?'selected':''}>Cold Call</option><option ${lead?.source==='Walk-in'?'selected':''}>Walk-in</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Pest Type</label><select class="form-control" name="pest_type"><option value="">Select</option><option ${lead?.pest_type==='Termites'?'selected':''}>Termites</option><option ${lead?.pest_type==='Cockroaches'?'selected':''}>Cockroaches</option><option ${lead?.pest_type==='Rodents'?'selected':''}>Rodents</option><option ${lead?.pest_type==='Mosquitoes'?'selected':''}>Mosquitoes</option><option ${lead?.pest_type==='Bed Bugs'?'selected':''}>Bed Bugs</option><option ${lead?.pest_type==='Ants'?'selected':''}>Ants</option><option ${lead?.pest_type==='General Pests'?'selected':''}>General Pests</option></select></div>
        <div class="form-group"><label>Priority</label><select class="form-control" name="priority"><option ${lead?.priority==='low'?'selected':''}>low</option><option ${lead?.priority==='medium'?'selected':''}>medium</option><option ${lead?.priority==='high'?'selected':''}>high</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Status</label><select class="form-control" name="status"><option>new</option><option>contacted</option><option>qualified</option><option>proposal</option><option>negotiation</option><option>won</option><option>lost</option></select></div>
        <div class="form-group"><label>Conversion Value</label><input class="form-control" name="conversion_value" type="number" value="${lead?.conversion_value||0}"></div>
      </div>
      <div class="form-group"><label>Notes</label><textarea class="form-control" name="notes">${lead?.notes||''}</textarea></div>
    </form>`,
    `<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveLead(${lead?.id||'null'})">${isEdit?'Update':'Create'} Lead</button>`
  );
};

window.saveLead = async (id) => {
  const form = document.getElementById('leadForm');
  const data = Object.fromEntries(new FormData(form));
  data.conversion_value = Number(data.conversion_value);
  if (id) await API.put(`/leads/${id}`, data);
  else await API.post('/leads', data);
  closeModal(); showToast(id?'Lead updated':'Lead created'); navigateTo('leads');
};

window.editLead = async (id) => {
  const lead = await API.get(`/leads/${id}`);
  showLeadModal(lead);
};

window.deleteLead = async (id) => {
  if(!confirm('Delete this lead?')) return;
  await API.del(`/leads/${id}`); showToast('Lead deleted','info'); navigateTo('leads');
};

// ===== LEAD FOLLOW-UPS =====
pageRenderers['lead-followups'] = async (el) => {
  const followups = await API.get('/leads/followups/all');
  el.innerHTML = `
    <div class="toolbar"><div></div><button class="btn btn-primary" onclick="showFollowupModal()">+ Schedule Follow-up</button></div>
    <div class="card"><div class="card-body table-container">
      <table><thead><tr><th>Lead</th><th>Phone</th><th>Follow-up Date</th><th>Assigned To</th><th>Notes</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      ${followups.map(f=>`<tr><td>${f.lead_name||'-'}</td><td>${f.lead_phone||'-'}</td><td>${fmtDate(f.follow_up_date)}</td><td>${f.employee_name||'-'}</td><td>${f.notes||'-'}</td><td>${badge(f.status)}</td><td><button class="btn btn-outline btn-sm" onclick="completeFollowup(${f.id})">Complete</button></td></tr>`).join('')}
      </tbody></table></div></div>`;
};

window.showFollowupModal = async () => {
  const leads = await API.get('/leads');
  openModal('Schedule Follow-up', `
    <form id="followupForm">
      <div class="form-group"><label>Lead *</label><select class="form-control" name="lead_id" required>${leads.map(l=>`<option value="${l.id}">${l.name}</option>`).join('')}</select></div>
      <div class="form-group"><label>Follow-up Date *</label><input type="date" class="form-control" name="follow_up_date" required></div>
      <div class="form-group"><label>Notes</label><textarea class="form-control" name="notes"></textarea></div>
    </form>`,
    `<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveFollowup()">Schedule</button>`
  );
};

window.saveFollowup = async () => {
  const data = Object.fromEntries(new FormData(document.getElementById('followupForm')));
  await API.post(`/leads/${data.lead_id}/followups`, data);
  closeModal(); showToast('Follow-up scheduled'); navigateTo('lead-followups');
};

window.completeFollowup = async (id) => {
  await API.put(`/leads/followups/${id}`, {status:'completed',outcome:'Done'});
  showToast('Follow-up completed'); navigateTo('lead-followups');
};

// ===== LEAD PIPELINE =====
pageRenderers['lead-pipeline'] = async (el) => {
  const pipeline = await API.get('/leads/pipeline/data');
  const stages = ['new','contacted','qualified','proposal','negotiation','won','lost'];
  el.innerHTML = `<div class="pipeline-board">${stages.map(s=>`
    <div class="pipeline-column"><h4>${s.charAt(0).toUpperCase()+s.slice(1)} <span>${(pipeline[s]||[]).length}</span></h4>
    ${(pipeline[s]||[]).map(l=>`<div class="pipeline-card"><h5>${l.name}</h5><p>${l.phone||''}</p><p>${l.pest_type||''}</p><p>${badge(l.priority)}</p></div>`).join('')}
    </div>`).join('')}</div>`;
};

// ===== LEAD REPORTS =====
pageRenderers['lead-reports'] = async (el) => {
  const r = await API.get('/leads/reports/data');
  el.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon blue">👤</div><div class="stat-info"><h3>${r.totalLeads}</h3><p>Total Leads</p></div></div>
      <div class="stat-card"><div class="stat-icon green">✅</div><div class="stat-info"><h3>${r.conversionRate}</h3><p>Won Leads</p></div></div>
      <div class="stat-card"><div class="stat-icon orange">💰</div><div class="stat-info"><h3>${fmt(r.avgConversionValue)}</h3><p>Avg Conversion Value</p></div></div>
    </div>
    <div class="grid-2">
      <div class="card"><div class="card-header"><h3>Leads by Source</h3></div><div class="card-body">
        <table><thead><tr><th>Source</th><th>Count</th></tr></thead><tbody>${(r.bySource||[]).map(s=>`<tr><td>${s.source||'Unknown'}</td><td>${s.count}</td></tr>`).join('')}</tbody></table></div></div>
      <div class="card"><div class="card-header"><h3>Leads by Status</h3></div><div class="card-body">
        <table><thead><tr><th>Status</th><th>Count</th></tr></thead><tbody>${(r.byStatus||[]).map(s=>`<tr><td>${badge(s.status)}</td><td>${s.count}</td></tr>`).join('')}</tbody></table></div></div>
    </div>`;
};

// ===== AI CALL ASSISTANT =====
pageRenderers['ai-call'] = async (el) => {
  const calls = await API.get('/calls');
  el.innerHTML = `
    <div class="toolbar"><div></div><button class="btn btn-primary" onclick="showCallModal()">+ Log Call</button></div>
    <div class="card"><div class="card-body table-container">
      <table><thead><tr><th>Time</th><th>Customer/Lead</th><th>Employee</th><th>Direction</th><th>Duration</th><th>Notes</th></tr></thead><tbody>
      ${calls.map(c=>`<tr><td>${fmtDate(c.call_time)}</td><td>${c.customer_name||c.lead_name||'-'}</td><td>${c.employee_name||'-'}</td><td>${c.direction}</td><td>${c.duration}s</td><td>${c.notes||'-'}</td></tr>`).join('')}
      </tbody></table></div></div>`;
};

window.showCallModal = async () => {
  const customers = await API.get('/customers');
  openModal('Log Call', `
    <form id="callForm">
      <div class="form-group"><label>Customer</label><select class="form-control" name="customer_id"><option value="">Select</option>${customers.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
      <div class="form-row">
        <div class="form-group"><label>Direction</label><select class="form-control" name="direction"><option>outbound</option><option>inbound</option></select></div>
        <div class="form-group"><label>Duration (sec)</label><input type="number" class="form-control" name="duration" value="0"></div>
      </div>
      <div class="form-group"><label>Notes</label><textarea class="form-control" name="notes"></textarea></div>
    </form>`,
    `<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveCall()">Save</button>`
  );
};

window.saveCall = async () => {
  const data = Object.fromEntries(new FormData(document.getElementById('callForm')));
  data.customer_id = data.customer_id || null;
  data.duration = Number(data.duration);
  await API.post('/calls', data);
  closeModal(); showToast('Call logged'); navigateTo('ai-call');
};

// ===== GENERIC CRUD PAGE BUILDER =====
function buildCrudPage(config) {
  return async (el) => {
    const items = await API.get(config.listUrl);
    el.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-filters">${config.filters||''}</div>
        <button class="btn btn-primary" onclick="${config.addFn}">+ ${config.addLabel}</button>
      </div>
      <div class="card"><div class="card-body table-container">
        <table><thead><tr>${config.columns.map(c=>`<th>${c.label}</th>`).join('')}<th>Actions</th></tr></thead>
        <tbody>${items.map(item=>`<tr>${config.columns.map(c=>`<td>${c.render?c.render(item):item[c.key]||'-'}</td>`).join('')}<td><div class="btn-group">${config.editFn?`<button class="btn btn-outline btn-sm" onclick="${config.editFn}(${item.id})">Edit</button>`:''}${config.deleteFn?`<button class="btn btn-danger btn-sm" onclick="${config.deleteFn}(${item.id})">Delete</button>`:''}</div></td></tr>`).join('')}</tbody>
        </table></div></div>`;
  };
}

// ===== CUSTOMERS =====
pageRenderers['customers'] = async (el) => {
  const customers = await API.get('/customers');
  el.innerHTML = `
    <div class="toolbar"><div class="toolbar-filters"><input type="text" class="form-control" style="width:220px" placeholder="Search customers..." onkeyup="searchAndRender('customers',this.value)"></div><button class="btn btn-primary" onclick="showCustomerModal()">+ Add Customer</button></div>
    <div class="card"><div class="card-body table-container"><table><thead><tr><th>Name</th><th>Contact Person</th><th>Phone</th><th>Email</th><th>City</th><th>Property</th><th>GSTIN</th><th>Status</th><th>Actions</th></tr></thead><tbody>
    ${customers.map(c=>`<tr><td><strong>${c.name}</strong></td><td>${c.contact_person||'-'}</td><td>${c.phone||'-'}</td><td>${c.email||'-'}</td><td>${c.city||'-'}</td><td>${c.property_type||'-'}</td><td>${c.gstin||'-'}</td><td>${badge(c.status)}</td><td><div class="btn-group"><button class="btn btn-info btn-sm" onclick="viewCustomer(${c.id})">View</button><button class="btn btn-warning btn-sm" onclick="newQuoteFor(${c.id})">Quote</button><button class="btn btn-primary btn-sm" onclick="newAgreementFor(${c.id})">Agreement</button><button class="btn btn-success btn-sm" onclick="whatsappCustomer(${c.id})">WhatsApp</button><button class="btn btn-outline btn-sm" onclick="editCustomer(${c.id})">Edit</button><button class="btn btn-danger btn-sm" onclick="deleteCustomer(${c.id})">Delete</button></div></td></tr>`).join('')}</tbody></table></div></div>`;
};
// Best-known bill date for an invoice: explicit bill_date saved in bill_extra,
// otherwise the record's creation date.
window.billDateOf = (inv) => {
  let d = '';
  try { d = (JSON.parse(inv.bill_extra || 'null') || {}).bill_date || ''; } catch (e) { d = ''; }
  return d || String(inv.created_at || '').slice(0, 10);
};
window.showCustomerModal = async (c) => {
  const isEdit = !!c;
  const [customers, invoices] = await Promise.all([API.get('/customers'), API.get('/invoices')]);
  window._custPicker = { customers, invoices };
  // Bills grouped per customer so old customers show their bill numbers + dates
  const invByCust = {};
  (invoices || []).forEach(i => { if (i.customer_id) (invByCust[i.customer_id] = invByCust[i.customer_id] || []).push(i); });
  window._custInvByCust = invByCust;
  const rowsHtml = (customers || []).map(x => `<tr data-cust="${(x.id + ' ' + (x.name || '') + ' ' + (x.phone || '')).toLowerCase().replace(/"/g, '')}"><td><strong>${x.name}</strong></td><td>${x.phone || '-'}</td><td>${x.city || '-'}</td><td>${(invByCust[x.id] || []).map(i => { const d = billDateOf(i); return `<span style="display:inline-block;background:#e0f2fe;border:1px solid #bae6fd;border-radius:6px;padding:1px 7px;margin:1px 2px;font-size:11px;font-weight:600">${i.invoice_number}${d ? ' · ' + fmtDate(d) : ''}</span>`; }).join('') || '<span style="color:#94a3b8">no bill</span>'}</td><td><button class="btn btn-success btn-sm" onclick="custAddBill(${x.id})" title="Add an old bill / invoice number manually for this customer">+ Bill</button> <button class="btn btn-info btn-sm" onclick="closeModal();viewCustomer(${x.id})">View</button></td></tr>`).join('');
  openModal(isEdit ? 'Edit Customer' : 'Add Customer', `
    <div style="display:flex;gap:6px;margin-bottom:12px">
      <button type="button" class="btn btn-sm ${isEdit ? 'btn-outline' : 'btn-primary'}" id="custTabOld" onclick="switchCustTab('old')">Existing Customers (${(customers || []).length})</button>
      <button type="button" class="btn btn-sm ${isEdit ? 'btn-primary' : 'btn-outline'}" id="custTabNew" onclick="switchCustTab('new')">${isEdit ? 'Edit Customer' : '+ New Customer'}</button>
    </div>
    <div id="custTabOldPane" style="${isEdit ? 'display:none' : ''}">
      <input class="form-control" id="custPickSearch" placeholder="Search old customers by name / phone..." style="margin-bottom:8px" oninput="filterCustPicker(this.value)">
      <div class="table-container" style="max-height:340px;overflow:auto"><table><thead><tr><th>Name</th><th>Phone</th><th>City</th><th>Bill Numbers</th><th></th></tr></thead><tbody>${rowsHtml}</tbody></table></div>
      <p style="font-size:12px;color:#64748b;margin-top:8px">Pick an existing customer above (View shows full details & bills), or switch to the <strong>New Customer</strong> tab to add a new one.</p>
    </div>
    <div id="custTabNewPane" style="${isEdit ? '' : 'display:none'}"><form id="custForm"><div class="form-row"><div class="form-group"><label>Name *</label><input class="form-control" name="name" value="${c?.name||''}" required></div><div class="form-group"><label>Phone *</label><input class="form-control" name="phone" value="${c?.phone||''}" required></div></div><div class="form-row"><div class="form-group"><label>Email</label><input class="form-control" name="email" value="${c?.email||''}"></div><div class="form-group"><label>City</label><input class="form-control" name="city" value="${c?.city||''}"></div></div><div class="form-row"><div class="form-group"><label>Contact Person</label><input class="form-control" name="contact_person" value="${c?.contact_person||''}"></div><div class="form-group"><label>GSTIN</label><input class="form-control" name="gstin" value="${c?.gstin||''}"></div></div><div class="form-row"><div class="form-group"><label>Address</label><input class="form-control" name="address" value="${c?.address||''}"></div><div class="form-group"><label>Property Type</label><select class="form-control" name="property_type"><option>Residential</option><option>Commercial</option><option>Industrial</option></select></div></div><div class="form-group"><label>Notes</label><textarea class="form-control" name="notes">${c?.notes||''}</textarea></div>
    <p style="font-size:12px;color:#64748b">No bill number needed here - bills are created separately for the customer.</p></form></div>`,
  `<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" id="custSaveBtn" onclick="saveCustomer(${c?.id||'null'})">${isEdit?'Update':'Create'}</button>`);
};
window.switchCustTab = (tab) => {
  const old = tab === 'old';
  document.getElementById('custTabOldPane').style.display = old ? '' : 'none';
  document.getElementById('custTabNewPane').style.display = old ? 'none' : '';
  document.getElementById('custTabOld').className = 'btn btn-sm ' + (old ? 'btn-primary' : 'btn-outline');
  document.getElementById('custTabNew').className = 'btn btn-sm ' + (old ? 'btn-outline' : 'btn-primary');
  document.getElementById('custSaveBtn').style.display = old ? 'none' : '';
};
window.filterCustPicker = (q) => {
  const s = String(q || '').toLowerCase();
  document.querySelectorAll('#custTabOldPane tbody tr').forEach(tr => { tr.style.display = tr.getAttribute('data-cust').includes(s) ? '' : 'none'; });
};
// Manually register an old/previous bill (invoice number + date + amount) for
// an existing customer - it is stored in Invoices and shows everywhere.
window.custAddBill = (custId) => {
  const c = ((window._custPicker || {}).customers || []).find(x => x.id === custId);
  const today = new Date().toISOString().split('T')[0];
  openModal(`Add Bill / Invoice Number — ${c ? c.name : ''}`, `
    <p style="font-size:12px;color:#64748b;margin-bottom:10px">Type an old / previous bill number for this customer. It is saved to Invoices and will show in the Bill Generator customer list.</p>
    <div class="form-row">
      <div class="form-group"><label>Invoice / Bill Number *</label><input class="form-control" id="abNo" placeholder="e.g. A11477 / APT1282 / old book number"></div>
      <div class="form-group"><label>Bill Date</label><input type="date" class="form-control" id="abDate" value="${today}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Bill Amount (optional)</label><input type="number" min="0" step="0.01" class="form-control" id="abAmt" placeholder="e.g. 5000"></div>
      <div class="form-group" style="flex:2"><label>Note / Title (optional)</label><input class="form-control" id="abTitle" placeholder="e.g. Previous pest control service"></div>
    </div>`,
  `<button class="btn btn-outline" onclick="showCustomerModal()">Cancel</button><button class="btn btn-primary" onclick="custSaveBill(${custId})">Save Bill</button>`);
};
window.custSaveBill = async (custId) => {
  const no = (document.getElementById('abNo').value || '').trim();
  if (!no) { showToast('Enter the bill / invoice number', 'info'); return; }
  const d = document.getElementById('abDate').value;
  const amt = parseFloat(document.getElementById('abAmt').value) || 0;
  const title = (document.getElementById('abTitle').value || '').trim() || 'Previous Bill';
  try {
    await API.post('/invoices', {
      customer_id: custId, invoice_number: no, title,
      items: [], subtotal: amt, total: amt,
      tax_rate: 0, tax_amount: 0, discount: 0,
      gst_type: /^A(?!PT)/i.test(no) ? 'intra' : 'none',
      invoice_type: /^A(?!PT)/i.test(no) ? 'annual' : 'standard',
      status: 'sent',
      bill_extra: JSON.stringify({ bill_date: d })
    });
    showToast(`Bill ${no} saved to customer`);
    showCustomerModal(); // refresh the list with the new bill pill
  } catch (e) { showToast(e.message || 'Save failed', 'info'); }
};
window.saveCustomer = async (id) => { const d = Object.fromEntries(new FormData(document.getElementById('custForm'))); if(id) await API.put(`/customers/${id}`,d); else await API.post('/customers',d); closeModal(); showToast(id?'Customer updated':'Customer created'); navigateTo('customers'); };
window.editCustomer = async (id) => { const c = await API.get(`/customers/${id}`); showCustomerModal(c); };
window.viewCustomer = async (id) => {
  const c = await API.get(`/customers/${id}`);
  const q = c.quotations || [], ct = c.contracts || [], inv = c.invoices || [];
  openModal(`Customer: ${c.name}`, `
    <div style="font-size:13px;line-height:1.7;margin-bottom:10px">
      <div><strong>Phone:</strong> ${c.phone||'-'} &nbsp; <strong>Email:</strong> ${c.email||'-'}</div>
      <div><strong>Contact Person:</strong> ${c.contact_person||'-'} &nbsp; <strong>GSTIN:</strong> ${c.gstin||'-'}</div>
      <div><strong>Address:</strong> ${c.address||'-'}${c.city?', '+c.city:''} &nbsp; <strong>Property:</strong> ${c.property_type||'-'}</div>
    </div>
    <div class="section-title" style="margin:10px 0 6px">Quotations (${q.length})</div>
    ${q.length ? `<div class="table-container"><table><thead><tr><th>Quote#</th><th>Title</th><th>Total</th><th>Valid Until</th><th>Status</th><th>Send</th></tr></thead><tbody>${q.map(x=>`<tr><td>${x.quote_number}</td><td>${x.title||'-'}</td><td>${fmt(x.total)}</td><td>${fmtDate(x.valid_until)}</td><td>${badge(x.status)}</td><td><button class="btn btn-success btn-sm" onclick="closeModal();whatsappQuotation(${x.id})">WhatsApp</button></td></tr>`).join('')}</tbody></table></div>` : '<p style="color:#64748b;font-size:12px">No quotations yet.</p>'}
    <div class="section-title" style="margin:14px 0 6px">Agreements / Contracts (${ct.length})</div>
    ${ct.length ? `<div class="table-container"><table><thead><tr><th>Contract#</th><th>Title</th><th>Period</th><th>Value</th><th>Status</th><th>Send</th></tr></thead><tbody>${ct.map(x=>`<tr><td>${x.contract_number}</td><td>${x.title||'-'}</td><td>${fmtDate(x.start_date)} – ${fmtDate(x.end_date)}</td><td>${fmt(x.value)}</td><td>${badge(x.status)}</td><td><button class="btn btn-success btn-sm" onclick="closeModal();whatsappContract(${x.id})">WhatsApp</button></td></tr>`).join('')}</tbody></table></div>` : '<p style="color:#64748b;font-size:12px">No agreements yet.</p>'}
    <div class="section-title" style="margin:14px 0 6px">Invoices (${inv.length})</div>
    ${inv.length ? `<div class="table-container"><table><thead><tr><th>Invoice#</th><th>Title</th><th>Total</th><th>Paid</th><th>Status</th><th>Send</th></tr></thead><tbody>${inv.map(x=>`<tr><td>${x.invoice_number}</td><td>${x.title||'-'}</td><td>${fmt(x.total)}</td><td>${fmt(x.paid_amount)}</td><td>${badge(x.status)}</td><td><button class="btn btn-success btn-sm" onclick="closeModal();whatsappInvoice(${x.id})">WhatsApp</button></td></tr>`).join('')}</tbody></table></div>` : '<p style="color:#64748b;font-size:12px">No invoices yet.</p>'}
  `, `<button class="btn btn-outline" onclick="closeModal()">Close</button><button class="btn btn-warning" onclick="closeModal();newQuoteFor(${c.id})">+ Quotation</button><button class="btn btn-primary" onclick="closeModal();newAgreementFor(${c.id})">+ Agreement</button><button class="btn btn-success" onclick="closeModal();whatsappCustomer(${c.id})"><i class="fab fa-whatsapp"></i> WhatsApp</button><button class="btn btn-secondary" onclick="closeModal();editCustomer(${c.id})">Edit</button>`);
};
window.deleteCustomer = async (id) => { if(!confirm('Delete?')) return; await API.del(`/customers/${id}`); showToast('Deleted','info'); navigateTo('customers'); };

// ===== CUSTOMER QUICK ACTIONS: QUOTE / AGREEMENT / WHATSAPP =====
window.newQuoteFor = (cid) => { window._preQuoteCustomer = cid; navigateTo('quotation-builder'); };
window.newAgreementFor = (cid) => {
  const now = new Date(); const iso = d=>d.toISOString().split('T')[0];
  const plus1 = new Date(now); plus1.setFullYear(plus1.getFullYear()+1); plus1.setDate(plus1.getDate()-1);
  openModal('New Agreement / Contract', `<form id="agrForm"><input type="hidden" name="customer_id" value="${cid}">
    <div class="form-row"><div class="form-group"><label>Title *</label><input class="form-control" name="title" required placeholder="e.g. Annual Pest Control AMC"></div>
    <div class="form-group"><label>Service Type</label><select class="form-control" name="service_type"><option>General Pest Control</option><option>Termite Control</option><option>Rodent Control</option><option>Fumigation</option><option>Comprehensive Pest</option></select></div></div>
    <div class="form-row"><div class="form-group"><label>Start Date *</label><input type="date" class="form-control" name="start_date" required value="${iso(now)}"></div><div class="form-group"><label>End Date *</label><input type="date" class="form-control" name="end_date" required value="${iso(plus1)}"></div></div>
    <div class="form-row"><div class="form-group"><label>Frequency</label><select class="form-control" name="frequency"><option>monthly</option><option>quarterly</option><option>half-yearly</option><option>yearly</option><option>one-time</option></select></div><div class="form-group"><label>Contract Value</label><input type="number" class="form-control" name="value" value="0"></div></div>
    <div class="form-group"><label>Terms</label><textarea class="form-control" name="terms"></textarea></div></form>`,
  `<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveAgreement()">Create Agreement</button>`);
};
window.saveAgreement = async () => { const d = Object.fromEntries(new FormData(document.getElementById('agrForm'))); d.value=Number(d.value||0); d.billing_cycle=d.frequency; d.billing_amount=0; const r = await API.post('/contracts', d); closeModal(); showToast(`Agreement ${r.contract_number} created`); navigateTo('customers'); };
window.waNumber = (phone) => { let d = String(phone||'').replace(/\D/g,''); if (d.length === 10) d = '91' + d; else if (d.length === 12 && d.startsWith('0')) d = '91' + d.slice(1); return d; };
window.sendWhatsApp = (phone, message) => {
  const num = waNumber(phone);
  if (!num) { showToast('Customer has no phone number','info'); return; }
  openModal('Send WhatsApp', `<div class="form-group"><label>To: ${phone||''}</label><textarea class="form-control" id="waMsg" rows="7">${message}</textarea></div>
  <p style="font-size:12px;color:#64748b">Edit the message if needed, then press Send — WhatsApp will open with this text ready to send.</p>`,
  `<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-success" onclick="openWa('${num}')"><i class="fab fa-whatsapp"></i> Open WhatsApp</button><button class="btn btn-primary" onclick="sendWaApi('${num}')"><i class="fab fa-whatsapp"></i> Send via API</button>`);
};
window.openWa = (num) => { const t = encodeURIComponent(document.getElementById('waMsg').value); window.open(`https://wa.me/${num}?text=${t}`, '_blank'); closeModal(); };
window.sendWaApi = async (num) => {
  const msg = document.getElementById('waMsg').value;
  const btn = event && event.target;
  try {
    if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
    const r = await API.post('/whatsapp/send', { phone: num, message: msg });
    closeModal(); showToast('WhatsApp sent via API!');
  } catch (e) {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fab fa-whatsapp"></i> Send via API'; }
    showToast(e.message || 'API send failed', 'info');
  }
};
window.whatsappCustomer = async (id) => { const c = await API.get(`/customers/${id}`); sendWhatsApp(c.phone, `Dear ${c.name},\nGreetings from Adhunik Pest Control Pvt. Ltd.! Thank you for connecting with us. For any pest control service or enquiry, reply here or call us.`); };
window.whatsappQuotation = async (id) => { const q = await API.get(`/quotations/${id}`); const c = await API.get(`/customers/${q.customer_id}`); sendWhatsApp(c.phone, `Dear ${c.name},\nQuotation ${q.quote_number}: ${q.title||'Pest Control Service'}\nTotal Amount: Rs. ${q.total}\nValid Until: ${q.valid_until||'-'}\n\nThank you - Adhunik Pest Control Pvt. Ltd.`); };
window.whatsappContract = async (id) => { const ct = await API.get(`/contracts/${id}`); const c = await API.get(`/customers/${ct.customer_id}`); sendWhatsApp(c.phone, `Dear ${c.name},\nService Agreement ${ct.contract_number}: ${ct.title||''}\nPeriod: ${ct.start_date||''} to ${ct.end_date||''}\nContract Value: Rs. ${ct.value||0}\n\nThank you - Adhunik Pest Control Pvt. Ltd.`); };
window.whatsappInvoice = async (id) => { const inv = await API.get(`/invoices/${id}`); const c = await API.get(`/customers/${inv.customer_id}`); sendWhatsApp(inv.customer_id ? c.phone : '', `Dear ${c.name},\nBill ${inv.invoice_number}: ${inv.title||''}\nTotal: Rs. ${inv.total} | Paid: Rs. ${inv.paid_amount} | Due: Rs. ${inv.total-inv.paid_amount}\n\nPlease pay via UPI/Bank transfer. Thank you - Adhunik Pest Control Pvt. Ltd.`); };

// ===== TECHNICIANS =====
pageRenderers['technicians'] = async (el) => {
  const techs = await API.get('/technicians');
  el.innerHTML = `
    <div class="toolbar"><div></div><button class="btn btn-primary" onclick="showTechModal()">+ Add Technician</button></div>
    <div class="card"><div class="card-body table-container"><table><thead><tr><th>Name</th><th>Phone</th><th>Specialization</th><th>App ID</th><th>License</th><th>Status</th><th>Actions</th></tr></thead><tbody>
    ${techs.map(t=>`<tr><td><strong>${t.name}</strong></td><td>${t.phone||'-'}</td><td>${t.specialization||'-'}</td><td>${t.username?`<code>${t.username}</code>`:'-'}</td><td>${t.license_number||'-'}</td><td>${badge(t.status)}</td><td><div class="btn-group"><button class="btn btn-outline btn-sm" onclick="editTech(${t.id})">Edit</button><button class="btn btn-danger btn-sm" onclick="deleteTech(${t.id})">Delete</button></div></td></tr>`).join('')}</tbody></table></div></div>`;
};
window.showTechModal = (t) => {
  openModal(t?'Edit Technician':'Add Technician', `<form id="techForm"><div class="form-row"><div class="form-group"><label>Name *</label><input class="form-control" name="name" value="${t?.name||''}" required></div><div class="form-group"><label>Phone</label><input class="form-control" name="phone" value="${t?.phone||''}"></div></div><div class="form-row"><div class="form-group"><label>Email</label><input class="form-control" name="email" value="${t?.email||''}"></div><div class="form-group"><label>Specialization</label><select class="form-control" name="specialization"><option>General Pest Control</option><option>Termite Control</option><option>Rodent Control</option><option>Fumigation</option><option>Bird Netting</option></select></div></div><div class="form-row"><div class="form-group"><label>License Number</label><input class="form-control" name="license_number" value="${t?.license_number||''}"></div><div class="form-group"><label>Status</label><select class="form-control" name="status"><option>available</option><option>on-job</option><option>off-duty</option></select></div></div>${t?'':'<p style="font-size:12px;color:var(--text-secondary);margin-top:4px"><i class="fas fa-mobile-screen-button"></i> Tracking app login is created automatically (App ID from name, PIN: <b>1234</b>).</p>'}</form>`,
  `<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveTech(${t?.id||'null'})">${t?'Update':'Create'}</button>`);
};
window.saveTech = async (id) => { const d = Object.fromEntries(new FormData(document.getElementById('techForm'))); if(id) await API.put(`/technicians/${id}`,d); else { const r = await API.post('/technicians',d); if (r?.username) showToast(`Created • App login: ${r.username} / 1234`,'success'); } closeModal(); showToast(id?'Updated':'Created'); navigateTo('technicians'); };
window.editTech = async (id) => { showTechModal(await API.get(`/technicians/${id}`)); };
window.deleteTech = async (id) => { if(!confirm('Delete?')) return; await API.del(`/technicians/${id}`); showToast('Deleted','info'); navigateTo('technicians'); };

// ===== EMPLOYEES =====
pageRenderers['employees'] = async (el) => {
  const emps = await API.get('/employees');
  el.innerHTML = `
    <div class="toolbar"><div></div><button class="btn btn-primary" onclick="showEmpModal()">+ Add Employee</button></div>
    <div class="card"><div class="card-body table-container"><table><thead><tr><th>Name</th><th>Phone</th><th>Role</th><th>Department</th><th>Salary</th><th>Status</th><th>Actions</th></tr></thead><tbody>
    ${emps.map(e=>`<tr><td><strong>${e.name}</strong></td><td>${e.phone||'-'}</td><td>${e.role||'-'}</td><td>${e.department||'-'}</td><td>${fmt(e.salary)}</td><td>${badge(e.status)}</td><td><div class="btn-group"><button class="btn btn-outline btn-sm" onclick="editEmp(${e.id})">Edit</button><button class="btn btn-danger btn-sm" onclick="deleteEmp(${e.id})">Delete</button></div></td></tr>`).join('')}</tbody></table></div></div>`;
};
window.showEmpModal = (e) => {
  openModal(e?'Edit Employee':'Add Employee', `<form id="empForm"><div class="form-row"><div class="form-group"><label>Name *</label><input class="form-control" name="name" value="${e?.name||''}" required></div><div class="form-group"><label>Phone</label><input class="form-control" name="phone" value="${e?.phone||''}"></div></div><div class="form-row"><div class="form-group"><label>Email</label><input class="form-control" name="email" value="${e?.email||''}"></div><div class="form-group"><label>Role</label><input class="form-control" name="role" value="${e?.role||''}"></div></div><div class="form-row"><div class="form-group"><label>Department</label><select class="form-control" name="department"><option>Management</option><option>Sales</option><option>Operations</option><option>Finance</option><option>HR</option></select></div><div class="form-group"><label>Salary</label><input type="number" class="form-control" name="salary" value="${e?.salary||0}"></div></div><div class="form-group"><label>Address</label><textarea class="form-control" name="address">${e?.address||''}</textarea></div></form>`,
  `<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveEmp(${e?.id||'null'})">${e?'Update':'Create'}</button>`);
};
window.saveEmp = async (id) => { const d = Object.fromEntries(new FormData(document.getElementById('empForm'))); d.salary=Number(d.salary); if(id) await API.put(`/employees/${id}`,d); else await API.post('/employees',d); closeModal(); showToast(id?'Updated':'Created'); navigateTo('employees'); };
window.editEmp = async (id) => { showEmpModal(await API.get(`/employees/${id}`)); };
window.deleteEmp = async (id) => { if(!confirm('Delete?')) return; await API.del(`/employees/${id}`); showToast('Deleted','info'); navigateTo('employees'); };

// ===== VENDORS =====
pageRenderers['vendors'] = async (el) => {
  const vendors = await API.get('/vendors');
  el.innerHTML = `
    <div class="toolbar"><div></div><button class="btn btn-primary" onclick="showVendorModal()">+ Add Vendor</button></div>
    <div class="card"><div class="card-body table-container"><table><thead><tr><th>Name</th><th>Company</th><th>Phone</th><th>Category</th><th>GST</th><th>Status</th><th>Actions</th></tr></thead><tbody>
    ${vendors.map(v=>`<tr><td><strong>${v.name}</strong></td><td>${v.company||'-'}</td><td>${v.phone||'-'}</td><td>${v.category||'-'}</td><td>${v.gst_number||'-'}</td><td>${badge(v.status)}</td><td><div class="btn-group"><button class="btn btn-outline btn-sm" onclick="editVendor(${v.id})">Edit</button><button class="btn btn-danger btn-sm" onclick="deleteVendor(${v.id})">Delete</button></div></td></tr>`).join('')}</tbody></table></div></div>`;
};
window.showVendorModal = (v) => {
  openModal(v?'Edit Vendor':'Add Vendor', `<form id="vendorForm"><div class="form-row"><div class="form-group"><label>Name *</label><input class="form-control" name="name" value="${v?.name||''}" required></div><div class="form-group"><label>Company</label><input class="form-control" name="company" value="${v?.company||''}"></div></div><div class="form-row"><div class="form-group"><label>Phone</label><input class="form-control" name="phone" value="${v?.phone||''}"></div><div class="form-group"><label>Email</label><input class="form-control" name="email" value="${v?.email||''}"></div></div><div class="form-row"><div class="form-group"><label>Category</label><select class="form-control" name="category"><option>Chemicals</option><option>Equipment</option><option>Safety Equipment</option><option>Transport</option><option>Other</option></select></div><div class="form-group"><label>GST Number</label><input class="form-control" name="gst_number" value="${v?.gst_number||''}"></div></div></form>`,
  `<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveVendor(${v?.id||'null'})">${v?'Update':'Create'}</button>`);
};
window.saveVendor = async (id) => { const d = Object.fromEntries(new FormData(document.getElementById('vendorForm'))); if(id) await API.put(`/vendors/${id}`,d); else await API.post('/vendors',d); closeModal(); showToast(id?'Updated':'Created'); navigateTo('vendors'); };
window.editVendor = async (id) => { showVendorModal(await API.get(`/vendors/${id}`)); };
window.deleteVendor = async (id) => { if(!confirm('Delete?')) return; await API.del(`/vendors/${id}`); showToast('Deleted','info'); navigateTo('vendors'); };

// ===== INSPECTIONS =====
pageRenderers['inspections'] = async (el) => {
  const inspections = await API.get('/inspections');
  el.innerHTML = `
    <div class="toolbar"><div></div><button class="btn btn-primary" onclick="showInspectionModal()">+ New Inspection</button></div>
    <div class="card"><div class="card-body table-container"><table><thead><tr><th>Date</th><th>Customer</th><th>Inspector</th><th>Pest Type</th><th>Severity</th><th>Status</th><th>Actions</th></tr></thead><tbody>
    ${inspections.map(i=>`<tr><td>${fmtDate(i.inspection_date)}</td><td>${i.customer_name||'-'}</td><td>${i.inspector_name||'-'}</td><td>${i.pest_type||'-'}</td><td>${badge(i.severity)}</td><td>${badge(i.status)}</td><td><div class="btn-group"><button class="btn btn-outline btn-sm" onclick="editInspection(${i.id})">Edit</button><button class="btn btn-danger btn-sm" onclick="deleteInspection(${i.id})">Delete</button></div></td></tr>`).join('')}</tbody></table></div></div>`;
};
window.showInspectionModal = async (ins) => {
  const customers = await API.get('/customers'); const techs = await API.get('/technicians');
  openModal(ins?'Edit Inspection':'New Inspection', `<form id="inspForm"><div class="form-row"><div class="form-group"><label>Customer</label><select class="form-control" name="customer_id">${customers.map(c=>`<option value="${c.id}" ${ins?.customer_id==c.id?'selected':''}>${c.name}</option>`).join('')}</select></div><div class="form-group"><label>Inspector</label><select class="form-control" name="inspector_id">${techs.map(t=>`<option value="${t.id}" ${ins?.inspector_id==t.id?'selected':''}>${t.name}</option>`).join('')}</select></div></div><div class="form-row"><div class="form-group"><label>Date *</label><input type="date" class="form-control" name="inspection_date" value="${ins?.inspection_date||''}" required></div><div class="form-group"><label>Pest Type</label><select class="form-control" name="pest_type"><option>Termites</option><option>Cockroaches</option><option>Rodents</option><option>Mosquitoes</option><option>Bed Bugs</option><option>General</option></select></div></div><div class="form-row"><div class="form-group"><label>Severity</label><select class="form-control" name="severity"><option>low</option><option>medium</option><option>high</option></select></div><div class="form-group"><label>Status</label><select class="form-control" name="status"><option>scheduled</option><option>completed</option><option>cancelled</option></select></div></div><div class="form-group"><label>Findings</label><textarea class="form-control" name="findings">${ins?.findings||''}</textarea></div><div class="form-group"><label>Recommendations</label><textarea class="form-control" name="recommendations">${ins?.recommendations||''}</textarea></div></form>`,
  `<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveInspection(${ins?.id||'null'})">${ins?'Update':'Create'}</button>`);
};
window.saveInspection = async (id) => { const d = Object.fromEntries(new FormData(document.getElementById('inspForm'))); if(id) await API.put(`/inspections/${id}`,d); else await API.post('/inspections',d); closeModal(); showToast(id?'Updated':'Created'); navigateTo('inspections'); };
window.editInspection = async (id) => { showInspectionModal(await API.get(`/inspections/${id}`)); };
window.deleteInspection = async (id) => { if(!confirm('Delete?')) return; await API.del(`/inspections/${id}`); showToast('Deleted','info'); navigateTo('inspections'); };

// ===== CONTRACTS =====
pageRenderers['manage-contracts'] = async (el) => {
  const contracts = await API.get('/contracts');
  el.innerHTML = `
    <div class="toolbar"><div></div><button class="btn btn-primary" onclick="navigateTo('new-contract')">+ New Contract</button></div>
    <div class="card"><div class="card-body table-container"><table><thead><tr><th>Contract#</th><th>Customer</th><th>Service</th><th>Value</th><th>Billing</th><th>Start</th><th>End</th><th>Status</th><th>Actions</th></tr></thead><tbody>
    ${contracts.map(c=>`<tr><td>${c.contract_number}</td><td>${c.customer_name||'-'}</td><td>${c.service_type||'-'}</td><td>${fmt(c.value)}</td><td>${fmt(c.billing_amount)}/${c.billing_cycle}</td><td>${fmtDate(c.start_date)}</td><td>${fmtDate(c.end_date)}</td><td>${badge(c.status)}</td><td><div class="btn-group"><button class="btn btn-outline btn-sm" onclick="editContract(${c.id})">Edit</button><button class="btn btn-danger btn-sm" onclick="deleteContract(${c.id})">Delete</button></div></td></tr>`).join('')}</tbody></table></div></div>`;
};

pageRenderers['new-contract'] = async (el) => {
  const customers = await API.get('/customers');
  el.innerHTML = `<div class="card"><div class="card-header"><h3>New Contract</h3></div><div class="card-body"><form id="contractForm">
    <div class="form-row"><div class="form-group"><label>Customer *</label><select class="form-control" name="customer_id" required>${customers.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></div><div class="form-group"><label>Title *</label><input class="form-control" name="title" required></div></div>
    <div class="form-row"><div class="form-group"><label>Service Type</label><select class="form-control" name="service_type"><option>General Pest Control</option><option>Termite Control</option><option>Rodent Control</option><option>Fumigation</option><option>Comprehensive Pest</option></select></div><div class="form-group"><label>Frequency</label><select class="form-control" name="frequency"><option>monthly</option><option>quarterly</option><option>half-yearly</option><option>yearly</option><option>one-time</option></select></div></div>
    <div class="form-row"><div class="form-group"><label>Start Date *</label><input type="date" class="form-control" name="start_date" required></div><div class="form-group"><label>End Date *</label><input type="date" class="form-control" name="end_date" required></div></div>
    <div class="form-row"><div class="form-group"><label>Contract Value</label><input type="number" class="form-control" name="value" value="0"></div><div class="form-group"><label>Billing Cycle</label><select class="form-control" name="billing_cycle"><option>monthly</option><option>quarterly</option><option>half-yearly</option><option>yearly</option></select></div></div>
    <div class="form-row"><div class="form-group"><label>Billing Amount</label><input type="number" class="form-control" name="billing_amount" value="0"></div><div class="form-group"><label>Status</label><select class="form-control" name="status"><option>active</option><option>draft</option><option>expiring</option><option>expired</option></select></div></div>
    <div class="form-group"><label>Description</label><textarea class="form-control" name="description"></textarea></div>
    <div class="form-group"><label>Terms</label><textarea class="form-control" name="terms"></textarea></div>
    <button type="button" class="btn btn-primary" onclick="saveContract()">Create Contract</button></form></div></div>`;
};
window.saveContract = async () => { const d = Object.fromEntries(new FormData(document.getElementById('contractForm'))); d.value=Number(d.value); d.billing_amount=Number(d.billing_amount); await API.post('/contracts',d); showToast('Contract created'); navigateTo('manage-contracts'); };
window.editContract = async (id) => { const c = await API.get(`/contracts/${id}`); openModal('Edit Contract',`<form id="contractFormEdit"><div class="form-row"><div class="form-group"><label>Title</label><input class="form-control" name="title" value="${c.title||''}"></div><div class="form-group"><label>Status</label><select class="form-control" name="status"><option ${c.status==='active'?'selected':''}>active</option><option ${c.status==='draft'?'selected':''}>draft</option><option ${c.status==='expiring'?'selected':''}>expiring</option><option ${c.status==='expired'?'selected':''}>expired</option></select></div></div><div class="form-row"><div class="form-group"><label>Value</label><input type="number" class="form-control" name="value" value="${c.value||0}"></div><div class="form-group"><label>Billing Amount</label><input type="number" class="form-control" name="billing_amount" value="${c.billing_amount||0}"></div></div></form>`,`<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="updateContract(${id})">Update</button>`); };
window.updateContract = async (id) => { const d = Object.fromEntries(new FormData(document.getElementById('contractFormEdit'))); d.value=Number(d.value); d.billing_amount=Number(d.billing_amount); await API.put(`/contracts/${id}`,d); closeModal(); showToast('Contract updated'); navigateTo('manage-contracts'); };
window.deleteContract = async (id) => { if(!confirm('Delete?')) return; await API.del(`/contracts/${id}`); showToast('Deleted','info'); navigateTo('manage-contracts'); };

// Recurring Billing
pageRenderers['recurring-billing'] = async (el) => {
  const contracts = await API.get('/contracts/recurring/list');
  el.innerHTML = `<div class="card"><div class="card-header"><h3>Active Recurring Billing</h3></div><div class="card-body table-container"><table><thead><tr><th>Contract#</th><th>Customer</th><th>Phone</th><th>Billing Cycle</th><th>Amount</th><th>End Date</th></tr></thead><tbody>
  ${contracts.map(c=>`<tr><td>${c.contract_number}</td><td>${c.customer_name}</td><td>${c.customer_phone||'-'}</td><td>${c.billing_cycle}</td><td>${fmt(c.billing_amount)}</td><td>${fmtDate(c.end_date)}</td></tr>`).join('')}</tbody></table></div></div>`;
};

// Expiring Contracts
pageRenderers['expiring-contracts'] = async (el) => {
  const contracts = await API.get('/contracts/expiring/list');
  el.innerHTML = `<div class="card"><div class="card-header"><h3>Expiring Contracts (Next 30 Days)</h3></div><div class="card-body table-container"><table><thead><tr><th>Contract#</th><th>Customer</th><th>Phone</th><th>End Date</th><th>Value</th><th>Action</th></tr></thead><tbody>
  ${contracts.map(c=>`<tr><td>${c.contract_number}</td><td>${c.customer_name}</td><td>${c.customer_phone||'-'}</td><td>${fmtDate(c.end_date)}</td><td>${fmt(c.value)}</td><td><button class="btn btn-success btn-sm" onclick="renewContract(${c.id})">Renew</button></td></tr>`).join('')}</tbody></table></div></div>`;
};
window.renewContract = async (id) => { await API.put(`/contracts/${id}`,{status:'active'}); showToast('Contract renewed'); navigateTo('expiring-contracts'); };

// ===== INVOICES =====
pageRenderers['invoices'] = async (el) => {
  const invoices = await API.get('/invoices');
  el.innerHTML = `
    <div class="toolbar"><div></div>
      <div class="btn-group">
        <button class="btn btn-primary" onclick="showInvoiceModal('standard')">+ Non-GST Invoice</button>
        <button class="btn btn-primary" style="background:#d93025" onclick="showInvoiceModal('gst')">+ GST Invoice</button>
        <button class="btn btn-primary" style="background:#0d652d" onclick="showInvoiceModal('annual')">+ Annual Invoice</button>
      </div>
    </div>
    <div class="card"><div class="card-body table-container"><table><thead><tr><th>Invoice#</th><th>Customer</th><th>Type</th><th>Title</th><th>Total</th><th>Paid</th><th>Status</th><th>Actions</th></tr></thead><tbody>
    ${invoices.map(i=>`<tr><td>${i.invoice_number}</td><td>${i.customer_name||'-'}</td><td>${badge(i.invoice_type||'standard')}</td><td>${i.title||'-'}</td><td>${fmt(i.total)}</td><td>${fmt(i.paid_amount)}</td><td>${badge(i.status)}</td><td><div class="btn-group"><button class="btn btn-info btn-sm" onclick="printInvoice(${i.id})">Print</button><button class="btn btn-warning btn-sm" onclick="pdfInvoice(${i.id})">PDF</button><button class="btn btn-primary btn-sm" onclick="downloadWord(${i.id})">Word</button><button class="btn btn-success btn-sm" onclick="recordPayment(${i.id},${i.total-i.paid_amount})">Pay</button><button class="btn btn-outline btn-sm" onclick="editInvoice(${i.id})">Edit</button><button class="btn btn-danger btn-sm" onclick="deleteInvoice(${i.id})">Del</button></div></td></tr>`).join('')}</tbody></table></div></div>`;
};
window.showInvoiceModal = async (type='standard') => {
  const [customers, invoices] = await Promise.all([API.get('/customers'), API.get('/invoices')]);
  window._invCustomers = customers;
  const isGst = type === 'gst';
  const isAnnual = type === 'annual';
  const title = isGst ? 'Create GST Tax Invoice' : isAnnual ? 'Create Annual Maintenance Invoice' : 'Create Non-GST Invoice';
  // Next auto bill number preview (backend generates the same series)
  const prefix = type === 'standard' ? 'APT' : 'A';
  const base = type === 'standard' ? 1282 : 11477;
  let maxNo = base;
  (invoices||[]).forEach(i=>{ if((i.invoice_number||'').startsWith(prefix)){ const n=parseInt(i.invoice_number.slice(prefix.length),10); if(!isNaN(n)&&n>maxNo) maxNo=n; } });
  const nextBillNo = prefix + (maxNo + 1);
  // Default dates auto-filled
  const now = new Date();
  const dmy = d=>`${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
  const iso = d=>d.toISOString().split('T')[0];
  const plusY = (y,minus)=>{ const d=new Date(now); d.setFullYear(d.getFullYear()+y); if(minus) d.setDate(d.getDate()-minus); return d; };
  const defPeriod = `${dmy(now)}-${dmy(plusY(1,1))}`;
  const defTitle = type === 'standard' ? 'Termite Control Service' : 'General Pest Control Service';
  const defWarrantyTo = iso(plusY(type === 'standard' ? 5 : 1, 1));
  openModal(title,`<form id="invForm">
    <input type="hidden" name="invoice_type" value="${type}">
    <input type="hidden" name="gst_type" value="${isGst ? 'intra' : 'none'}">
    <div class="form-row"><div class="form-group"><label>Bill No (auto — type to enter manually)</label><input class="form-control" name="invoice_number" value="${nextBillNo}" style="background:#eef2ff;font-weight:700"></div>
    <div class="form-group"><label>Customer *</label><select class="form-control" name="customer_id" required onchange="invCustomerChanged()">${customers.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></div></div>
    <div class="form-row"><div class="form-group"><label>Contact Person (auto)</label><input class="form-control" name="contact_person" id="invContactPerson"></div>
    <div class="form-group"><label>Booking ID</label><input class="form-control" name="booking_id"></div></div>
    <div class="form-row"><div class="form-group"><label>Title</label><input class="form-control" name="title" value="${defTitle}"></div></div>
    <div id="invItems" style="margin:8px 0">
      <div class="form-row-3 inv-line"><div class="form-group"><label>Service</label><input class="form-control ii-name" value="${defTitle}"></div><div class="form-group"><label>Rate</label><input type="number" class="form-control ii-rate" value="6000" oninput="calcInvTotal()"></div><div class="form-group"><label>Qty</label><input type="number" class="form-control ii-qty" value="1" oninput="calcInvTotal()"></div></div>
    </div>
    <button type="button" class="btn btn-outline btn-sm" onclick="addInvLine()">+ Add Line</button>
    ${isAnnual ? `<div class="form-row" style="margin-top:8px"><div class="form-group"><label>Service Count</label><input type="number" class="form-control" name="service_count" value="12"></div><div class="form-group"><label>Service Period (auto)</label><input class="form-control" name="service_period" value="${defPeriod}"></div></div>` : ''}
    <div class="form-row" style="margin-top:8px">
      <div class="form-group"><label>Subtotal</label><input type="number" class="form-control" name="subtotal" id="invSubtotal" readonly></div>
      ${isGst ? `<div class="form-group"><label>9% SGST</label><input type="number" class="form-control" name="sgst" id="invSgst" readonly></div><div class="form-group"><label>9% CGST</label><input type="number" class="form-control" name="cgst" id="invCgst" readonly></div>` : ''}
      <div class="form-group"><label>Total</label><input type="number" class="form-control" name="total" id="invTotal" readonly></div>
    </div>
    ${isGst ? `<div class="form-row"><div class="form-group"><label>SAC Code</label><input class="form-control" name="sac_code" value="998531"></div></div>` : ''}
    <div class="form-row"><div class="form-group"><label>Warranty From (auto)</label><input type="date" class="form-control" name="warranty_from" value="${iso(now)}"></div><div class="form-group"><label>Warranty To (auto)</label><input type="date" class="form-control" name="warranty_to" value="${defWarrantyTo}"></div></div>
    <div class="form-group"><label>Due Date</label><input type="date" class="form-control" name="due_date"></div>
    <p style="font-size:12px;color:#64748b;margin:6px 0 0">All fields auto-filled — just pick the customer, check the amount and press Create. Bill number is auto-generated but you can type your own number in the Bill No box.</p>
  </form>`,`<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveInvoice()">Create</button>`);
  invCustomerChanged();
  calcInvTotal();
};
window.invCustomerChanged = () => { const f=document.getElementById('invForm'); if(!f) return; const c=(window._invCustomers||[]).find(x=>String(x.id)===String(f.customer_id.value)); if(c && f.contact_person) f.contact_person.value = c.contact_person || c.name || ''; };
window.addInvLine = () => { const d=document.createElement('div'); d.className='form-row-3 inv-line'; d.innerHTML=`<div class="form-group"><input class="form-control ii-name" placeholder="Service"></div><div class="form-group"><input type="number" class="form-control ii-rate" value="0" oninput="calcInvTotal()"></div><div class="form-group"><input type="number" class="form-control ii-qty" value="1" oninput="calcInvTotal()"></div>`; document.getElementById('invItems').appendChild(d); };
window.calcInvTotal = () => { let sub=0; document.querySelectorAll('.inv-line').forEach(l=>{sub+=(Number(l.querySelector('.ii-rate')?.value)||0)*(Number(l.querySelector('.ii-qty')?.value)||0);}); const f=document.getElementById('invForm'); const isGst=f.gst_type.value!=='none'; const sgstEl=document.getElementById('invSgst'); const cgstEl=document.getElementById('invCgst'); const sgst=isGst?sub*9/100:0; const cgst=isGst?sub*9/100:0; if(sgstEl)sgstEl.value=sgst; if(cgstEl)cgstEl.value=cgst; const total=sub+sgst+cgst; document.getElementById('invSubtotal').value=sub; document.getElementById('invTotal').value=total; };
window.saveInvoice = async () => { const f=document.getElementById('invForm'); const d=Object.fromEntries(new FormData(f)); d.subtotal=Number(d.subtotal); d.total=Number(d.total); d.sgst=Number(d.sgst||0); d.cgst=Number(d.cgst||0); d.tax_rate=d.gst_type!=='none'?18:0; d.tax_amount=d.sgst+d.cgst; d.discount=Number(d.discount||0); const items=[]; document.querySelectorAll('.inv-line').forEach(l=>{items.push({name:l.querySelector('.ii-name').value,rate:Number(l.querySelector('.ii-rate').value),qty:Number(l.querySelector('.ii-qty').value)});}); d.items=items; const r=await API.post('/invoices',d); closeModal(); showToast(`Bill ${r.invoice_number} created`); navigateTo('invoices'); };
window.invToBillData = (inv, customer) => {
  let extra = {};
  try { extra = JSON.parse(inv.bill_extra || 'null') || {}; } catch (e) {}
  let rawItems = inv.items;
  if (typeof rawItems === 'string') { try { rawItems = JSON.parse(rawItems); } catch (e) { rawItems = []; } }
  const items = (rawItems || []).map(i => {
    const price = Number(i.rate ?? i.price ?? 0); const qty = Number(i.quantity ?? i.qty ?? 1);
    return { name: i.description || i.name || '', price, qty, gst: inv.gst_type !== 'none', amount: Number(i.amount ?? price * qty) };
  });
  const subtotal = inv.subtotal || items.reduce((a, i) => a + i.amount, 0);
  const gstAmt = (Number(inv.sgst) || 0) + (Number(inv.cgst) || 0) || Number(inv.tax_amount) || 0;
  return {
    bill_type: inv.gst_type !== 'none' ? 'gst' : 'non-gst',
    bill_no: inv.invoice_number,
    bill_date: extra.bill_date || String(inv.invoice_date || inv.created_at || '').slice(0, 10),
    booking_id: inv.booking_id || '',
    period: inv.service_period || ((inv.warranty_from || '') && (inv.warranty_to || '') ? `${inv.warranty_from} - ${inv.warranty_to}` : ''),
    title: inv.title || '',
    customer_name: customer.name || inv.customer_name || '',
    customer_address: customer.address || '',
    customer_phone: customer.phone || '',
    contact_person: inv.contact_person || customer.contact_person || '',
    customer_gstin: customer.gstin || '',
    customer_email: customer.email || '',
    items, subtotal, service_charge_pct: 0, service_charge: 0,
    sgst: Number(inv.sgst) || gstAmt / 2, cgst: Number(inv.cgst) || gstAmt / 2, gst: gstAmt, net: inv.total,
    net_words: inv.amount_in_words || ((typeof numberToWords === 'function' ? numberToWords(Math.round(inv.total || 0)) : '') + ' Only'),
    payment_mode: extra.payment_mode || 'cash',
    sac_code: inv.sac_code || '998531',
    service_log_title: extra.service_log_title || '',
    logs: extra.logs || [],
    terms: inv.terms_conditions || ''
  };
};
window.printInvoice = async (id) => {
  const inv = await API.get(`/invoices/${id}`);
  const customers = await API.get('/customers');
  const customer = customers.find(c=>c.id===inv.customer_id) || {};
  const settings = await API.get('/settings');
  window.printCustomBill(window.invToBillData(inv, customer), settings);
};
window.pdfInvoice = async (id) => {
  showToast('Generating PDF...', 'info');
  const inv = await API.get(`/invoices/${id}`);
  const customers = await API.get('/customers');
  const customer = customers.find(c=>c.id===inv.customer_id) || {};
  const settings = await API.get('/settings');
  await downloadPdfFromHtml(buildCustomBillHtml(window.invToBillData(inv, customer), settings), `${inv.invoice_number}.pdf`);
  showToast('PDF downloaded');
};
window.pdfQuotation = async (id) => {
  showToast('Generating PDF...', 'info');
  const q = await API.get(`/quotations/${id}`);
  const customers = await API.get('/customers');
  const customer = customers.find(c=>c.id===q.customer_id) || {};
  const settings = await API.get('/settings');
  await downloadPdfFromHtml(buildQuotationHtml(q, customer, settings), `${q.quote_number}.pdf`);
  showToast('PDF downloaded');
};
window.editInvoice = async (id) => { const inv = await API.get(`/invoices/${id}`); openModal('Edit Invoice',`<form id="invEditForm"><div class="form-row"><div class="form-group"><label>Bill No</label><input class="form-control" name="invoice_number" value="${inv.invoice_number}"></div><div class="form-group"><label>Total</label><input type="number" class="form-control" name="total" value="${inv.total}"></div><div class="form-group"><label>Status</label><select class="form-control" name="status"><option ${inv.status==='draft'?'selected':''}>draft</option><option ${inv.status==='unpaid'?'selected':''}>unpaid</option><option ${inv.status==='partial'?'selected':''}>partial</option><option ${inv.status==='paid'?'selected':''}>paid</option><option ${inv.status==='overdue'?'selected':''}>overdue</option></select></div></div></form>`,`<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="updateInvoice(${id})">Update</button>`); };
window.updateInvoice = async (id) => { const d = Object.fromEntries(new FormData(document.getElementById('invEditForm'))); d.total=Number(d.total); await API.put(`/invoices/${id}`,d); closeModal(); showToast('Updated'); navigateTo('invoices'); };
window.recordPayment = async (id, balance) => { openModal('Record Payment',`<form id="payForm"><input type="hidden" name="invoice_id" value="${id}"><div class="form-group"><label>Amount</label><input type="number" class="form-control" name="amount" value="${balance}" required></div><div class="form-group"><label>Method</label><select class="form-control" name="payment_method"><option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Card</option><option>Cheque</option></select></div><div class="form-group"><label>Reference</label><input class="form-control" name="reference"></div></form>`,`<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="savePayment(${id})">Record</button>`); };
window.savePayment = async (id) => { const d = Object.fromEntries(new FormData(document.getElementById('payForm'))); d.amount=Number(d.amount); await API.post(`/invoices/${id}/payment`,d); closeModal(); showToast('Payment recorded'); navigateTo('invoices'); };
window.deleteInvoice = async (id) => { if(!confirm('Delete?')) return; await API.del(`/invoices/${id}`); showToast('Deleted','info'); navigateTo('invoices'); };
window.downloadWord = (id) => { window.open(`${API_BASE}/api/invoices/${id}/word`, '_blank'); };

// ===== COMPLAINTS =====
pageRenderers['new-complaint'] = async (el) => {
  const customers = await API.get('/customers'); const techs = await API.get('/technicians');
  el.innerHTML = `<div class="card"><div class="card-header"><h3>New Complaint</h3></div><div class="card-body"><form id="compForm">
    <div class="form-row"><div class="form-group"><label>Customer *</label><select class="form-control" name="customer_id" required>${customers.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></div><div class="form-group"><label>Category</label><select class="form-control" name="category"><option>Service Quality</option><option>Scheduling</option><option>Effectiveness</option><option>Billing</option><option>Staff Behavior</option><option>Other</option></select></div></div>
    <div class="form-row"><div class="form-group"><label>Priority</label><select class="form-control" name="priority"><option>low</option><option selected>medium</option><option>high</option></select></div><div class="form-group"><label>Assign To</label><select class="form-control" name="assigned_to"><option value="">Unassigned</option>${techs.map(t=>`<option value="${t.id}">${t.name}</option>`).join('')}</select></div></div>
    <div class="form-group"><label>Subject *</label><input class="form-control" name="subject" required></div>
    <div class="form-group"><label>Description</label><textarea class="form-control" name="description"></textarea></div>
    <button type="button" class="btn btn-primary" onclick="saveComplaint()">Submit Complaint</button></form></div></div>`;
};
window.saveComplaint = async () => { const d = Object.fromEntries(new FormData(document.getElementById('compForm'))); await API.post('/complaints',d); showToast('Complaint created'); navigateTo('manage-complaints'); };

pageRenderers['manage-complaints'] = async (el) => {
  const complaints = await API.get('/complaints');
  el.innerHTML = `
    <div class="toolbar"><div></div><button class="btn btn-primary" onclick="navigateTo('new-complaint')">+ New Complaint</button></div>
    <div class="card"><div class="card-body table-container"><table><thead><tr><th>Complaint#</th><th>Customer</th><th>Category</th><th>Subject</th><th>Priority</th><th>Assigned</th><th>Status</th><th>Actions</th></tr></thead><tbody>
    ${complaints.map(c=>`<tr><td>${c.complaint_number}</td><td>${c.customer_name||'-'}</td><td>${c.category||'-'}</td><td>${c.subject}</td><td>${badge(c.priority)}</td><td>${c.assigned_to_name||'Unassigned'}</td><td>${badge(c.status)}</td><td><div class="btn-group"><button class="btn btn-outline btn-sm" onclick="resolveComplaint(${c.id})">Resolve</button><button class="btn btn-danger btn-sm" onclick="deleteComplaint(${c.id})">Del</button></div></td></tr>`).join('')}</tbody></table></div></div>`;
};
window.resolveComplaint = async (id) => { openModal('Resolve Complaint',`<form id="resForm"><div class="form-group"><label>Resolution</label><textarea class="form-control" name="resolution"></textarea></div><div class="form-group"><label>Status</label><select class="form-control" name="status"><option>in-progress</option><option>resolved</option></select></div></form>`,`<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveResolution(${id})">Update</button>`); };
window.saveResolution = async (id) => { const d = Object.fromEntries(new FormData(document.getElementById('resForm'))); await API.put(`/complaints/${id}`,d); closeModal(); showToast('Updated'); navigateTo('manage-complaints'); };
window.deleteComplaint = async (id) => { if(!confirm('Delete?')) return; await API.del(`/complaints/${id}`); showToast('Deleted','info'); navigateTo('manage-complaints'); };

// ===== FIELD OPERATIONS =====
pageRenderers['assign-services'] = async (el) => {
  const customers = await API.get('/customers'); const techs = await API.get('/technicians');
  el.innerHTML = `<div class="card"><div class="card-header"><h3>Assign New Service</h3></div><div class="card-body"><form id="assignForm">
    <div class="form-row"><div class="form-group"><label>Customer *</label><select class="form-control" name="customer_id" required>${customers.map(c=>`<option value="${c.id}">${c.name} - ${c.address||''}</option>`).join('')}</select></div><div class="form-group"><label>Technician</label><select class="form-control" name="technician_id">${techs.filter(t=>t.status==='available').map(t=>`<option value="${t.id}">${t.name} (${t.specialization})</option>`).join('')}</select></div></div>
    <div class="form-row"><div class="form-group"><label>Service Type *</label><select class="form-control" name="service_type"><option>General Pest Control</option><option>Termite Treatment</option><option>Rodent Control</option><option>Fumigation</option><option>Cockroach Treatment</option><option>Mosquito Fogging</option><option>Bird Netting</option><option>Inspection</option></select></div><div class="form-group"><label>Scheduled Date *</label><input type="date" class="form-control" name="scheduled_date" required></div></div>
    <div class="form-row"><div class="form-group"><label>Time</label><input type="time" class="form-control" name="scheduled_time"></div><div class="form-group"><label>Address</label><input class="form-control" name="address"></div></div>
    <div class="form-group"><label>Instructions</label><textarea class="form-control" name="instructions"></textarea></div>
    <button type="button" class="btn btn-primary" onclick="saveAssignment()">Assign Service</button></form></div></div>`;
};
window.saveAssignment = async () => { const d = Object.fromEntries(new FormData(document.getElementById('assignForm'))); await API.post('/assignments',d); showToast('Service assigned'); navigateTo('assigned-services'); };

pageRenderers['assigned-services'] = async (el) => {
  const assignments = await API.get('/assignments');
  el.innerHTML = `
    <div class="toolbar"><div class="toolbar-filters"><select class="form-control" style="width:140px" onchange="filterAssignments(this.value)"><option value="">All Status</option><option>assigned</option><option>in-progress</option><option>completed</option><option>cancelled</option></select></div><button class="btn btn-primary" onclick="navigateTo('assign-services')">+ Assign Service</button></div>
    <div class="card"><div class="card-body table-container"><table><thead><tr><th>Assignment#</th><th>Customer</th><th>Service</th><th>Technician</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody id="assignTableBody">
    ${assignments.map(a=>`<tr><td>${a.assignment_number}</td><td>${a.customer_name||'-'}</td><td>${a.service_type}</td><td>${a.technician_name||'Unassigned'}</td><td>${fmtDate(a.scheduled_date)}</td><td>${badge(a.status)}</td><td><div class="btn-group"><button class="btn btn-info btn-sm" onclick="printJobCardFn(${a.id})">Job Card</button><button class="btn btn-warning btn-sm" onclick="pdfJobCard(${a.id})">PDF</button><button class="btn btn-success btn-sm" onclick="completeAssignment(${a.id})">Complete</button><button class="btn btn-outline btn-sm" onclick="editAssignment(${a.id})">Edit</button></div></td></tr>`).join('')}</tbody></table></div></div>`;
};
window.printJobCardFn = async (id) => {
  const a = await API.get(`/assignments/${id}`);
  const settings = await API.get('/settings');
  printJobCard(a, settings);
};
window.pdfJobCard = async (id) => {
  showToast('Generating PDF...', 'info');
  const a = await API.get(`/assignments/${id}`);
  const settings = await API.get('/settings');
  await downloadPdfFromHtml(buildJobCardHtml(a, settings), `${a.assignment_number}-jobcard.pdf`);
  showToast('PDF downloaded');
};
window.completeAssignment = async (id) => { await API.put(`/assignments/${id}`,{status:'completed',completed_at:new Date().toISOString()}); showToast('Service completed'); navigateTo('assigned-services'); };
window.editAssignment = async (id) => { const a = await API.get(`/assignments/${id}`); openModal('Edit Assignment',`<form id="editAssignForm"><div class="form-group"><label>Status</label><select class="form-control" name="status"><option ${a.status==='assigned'?'selected':''}>assigned</option><option ${a.status==='in-progress'?'selected':''}>in-progress</option><option ${a.status==='completed'?'selected':''}>completed</option><option ${a.status==='cancelled'?'selected':''}>cancelled</option></select></div><div class="form-group"><label>Notes</label><textarea class="form-control" name="notes">${a.notes||''}</textarea></div></form>`,`<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="updateAssignment(${id})">Update</button>`); };
window.updateAssignment = async (id) => { const d = Object.fromEntries(new FormData(document.getElementById('editAssignForm'))); await API.put(`/assignments/${id}`,d); closeModal(); showToast('Updated'); navigateTo('assigned-services'); };

// ===== TECHNICIAN LIVE LOCATION TRACKING =====
let trackingMap = null, trackingMarkers = {}, trackingTrailLayer = null;

pageRenderers['tracking'] = async (el) => {
  const techs = await API.get('/tracking/live');
  const located = techs.filter(t => t.latitude != null && t.longitude != null);
  el.innerHTML = `
    <div class="card" style="margin-bottom:14px;border-left:4px solid var(--primary)"><div class="card-body" style="padding:12px 16px">
      <div style="font-size:13px"><i class="fas fa-mobile-screen-button"></i> <strong>Technician Tracking App:</strong> technicians login with their App ID + PIN (managed on the Technicians page). Share this link or install the APK: <a href="${location.origin}/tech.html" target="_blank" style="color:var(--primary);font-weight:600">${location.origin}/tech.html</a></div>
    </div></div>
    <div class="toolbar">
      <div class="toolbar-filters">
        <button class="btn btn-outline" onclick="refreshTrackingMap()"><i class="fas fa-sync-alt"></i> Refresh</button>
        <select class="form-control" style="width:220px" onchange="showTechTrail(this.value)">
          <option value="">Show movement trail...</option>
          ${techs.map(t=>`<option value="${t.id}">${t.name}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-primary" onclick="showShareLocationModal()"><i class="fas fa-location-crosshairs"></i> Share My Location</button>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon blue">👷</div><div class="stat-info"><h3>${techs.length}</h3><p>Total Technicians</p></div></div>
      <div class="stat-card"><div class="stat-icon green">📍</div><div class="stat-info"><h3>${located.length}</h3><p>On Map (has location)</p></div></div>
      <div class="stat-card"><div class="stat-icon purple">🟢</div><div class="stat-info"><h3>${techs.filter(t=>t.status==='available').length}</h3><p>Available</p></div></div>
      <div class="stat-card"><div class="stat-icon orange">🔧</div><div class="stat-info"><h3>${techs.filter(t=>t.status==='on-job').length}</h3><p>On Job</p></div></div>
    </div>
    <div class="card"><div class="card-header"><h3>Live Technician Map</h3></div><div class="card-body"><div id="trackingMap"></div>
    ${located.length===0?'<p style="margin-top:12px;color:var(--text-secondary)"><i class="fas fa-info-circle"></i> No technician has shared a location yet. Technicians can tap <strong>Share My Location</strong> from their phone.</p>':''}
    </div></div>
    <div class="tracking-grid" style="margin-top:16px">${techs.map(t=>`<div class="tracking-card ${t.status}"><h4>${t.name}</h4><div class="meta"><span><i class="fas fa-phone"></i> ${t.phone||'-'}</span><span><i class="fas fa-wrench"></i> ${t.specialization||'-'}</span><span>Status: ${badge(t.status)}</span><span><i class="fas fa-map-marker-alt"></i> ${t.latitude!=null&&t.longitude!=null?`Last seen: ${fmtDate(t.last_seen)}`:'No location yet'}</span></div>${t.latitude!=null&&t.longitude!=null?`<button class="btn btn-outline btn-sm" style="margin-top:8px" onclick="focusTechOnMap(${t.id})">Show on map</button>`:''}</div>`).join('')}</div>`;
  initTrackingMap(techs);
};

function initTrackingMap(techs) {
  if (trackingMap) { trackingMap.remove(); trackingMap = null; }
  trackingMarkers = {};
  const located = techs.filter(t => t.latitude != null && t.longitude != null);
  const center = located.length ? [Number(located[0].latitude), Number(located[0].longitude)] : [22.5726, 88.3639]; // default: Kolkata
  trackingMap = L.map('trackingMap').setView(center, located.length ? 12 : 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(trackingMap);
  trackingTrailLayer = L.layerGroup().addTo(trackingMap);
  const statusColor = { 'available':'#16a34a', 'on-job':'#f59e0b', 'off-duty':'#94a3b8' };
  located.forEach(t => {
    const color = statusColor[t.status] || '#3b82f6';
    const icon = L.divIcon({ className:'', html:`<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.4)"></div>`, iconSize:[18,18], iconAnchor:[9,9] });
    const m = L.marker([Number(t.latitude), Number(t.longitude)], { icon }).addTo(trackingMap)
      .bindPopup(`<strong>${t.name}</strong><br>${t.specialization||''}<br>Status: ${t.status}<br>Last seen: ${t.last_seen?fmtDate(t.last_seen):'-'}`);
    trackingMarkers[t.id] = m;
  });
  if (located.length > 1) trackingMap.fitBounds(L.latLngBounds(located.map(t=>[Number(t.latitude),Number(t.longitude)])).pad(0.3));
}

window.refreshTrackingMap = () => navigateTo('tracking');

window.focusTechOnMap = (id) => {
  const m = trackingMarkers[id];
  if (m && trackingMap) { trackingMap.setView(m.getLatLng(), 15); m.openPopup(); document.getElementById('trackingMap').scrollIntoView({behavior:'smooth'}); }
};

window.showTechTrail = async (id) => {
  if (!id || !trackingMap) return;
  const points = await API.get(`/tracking/${id}/history`);
  trackingTrailLayer.clearLayers();
  if (!points.length) { showToast('No location history for this technician yet', 'info'); return; }
  const path = points.slice().reverse().map(p => [Number(p.latitude), Number(p.longitude)]);
  L.polyline(path, { color:'#3b82f6', weight:3, opacity:.8 }).addTo(trackingTrailLayer);
  path.forEach((ll, i) => {
    const p = points.slice().reverse()[i];
    L.circleMarker(ll, { radius:4, color:'#3b82f6', fillColor:'#fff', fillOpacity:1 })
      .bindPopup(`${i===path.length-1?'Start':'Point'} ${fmtDate(p.recorded_at)}<br>${p.note||''}`).addTo(trackingTrailLayer);
  });
  trackingMap.fitBounds(L.latLngBounds(path).pad(0.2));
};

// Technician shares GPS position from phone (also usable as check-in / check-out)
window.showShareLocationModal = () => {
  openModal('Share My Location', `
    <form id="shareLocForm">
      <div class="form-group"><label>I am (Technician) *</label><select class="form-control" name="technician_id" id="shareLocTech" required></select></div>
      <div class="form-row">
        <div class="form-group"><label>Latitude *</label><input class="form-control" name="latitude" id="shareLocLat" required readonly placeholder="Tap Get GPS"></div>
        <div class="form-group"><label>Longitude *</label><input class="form-control" name="longitude" id="shareLocLng" required readonly placeholder="Tap Get GPS"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Action</label><select class="form-control" name="action"><option value="">Just update position</option><option value="check-in">Check-in at site</option><option value="check-out">Check-out from site</option></select></div>
        <div class="form-group"><label>Note / Site name</label><input class="form-control" name="note" placeholder="e.g. Hotel Grand Palace"></div>
      </div>
      <button type="button" class="btn btn-outline" onclick="getMyGPS()"><i class="fas fa-satellite-dish"></i> Get My GPS Location</button>
      <p id="gpsStatus" style="margin-top:8px;color:var(--text-secondary)"></p>
    </form>`,
    `<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="submitMyLocation()">Send Location</button>`
  );
  API.get('/technicians').then(techs => {
    document.getElementById('shareLocTech').innerHTML = techs.map(t=>`<option value="${t.id}">${t.name}</option>`).join('');
  });
};

window.getMyGPS = () => {
  const status = document.getElementById('gpsStatus');
  if (!navigator.geolocation) { status.textContent = 'Geolocation is not supported by this browser.'; return; }
  status.textContent = 'Getting GPS position...';
  navigator.geolocation.getCurrentPosition((pos) => {
    document.getElementById('shareLocLat').value = pos.coords.latitude.toFixed(6);
    document.getElementById('shareLocLng').value = pos.coords.longitude.toFixed(6);
    status.textContent = `GPS locked (±${Math.round(pos.coords.accuracy)}m). You can send now.`;
  }, (err) => { status.textContent = 'GPS error: ' + err.message; }, { enableHighAccuracy:true, timeout:15000 });
};

window.submitMyLocation = async () => {
  const d = Object.fromEntries(new FormData(document.getElementById('shareLocForm')));
  if (!d.latitude || !d.longitude) { showToast('Tap "Get My GPS Location" first', 'error'); return; }
  await API.post(`/technicians/${d.technician_id}/location`, {
    latitude: Number(d.latitude), longitude: Number(d.longitude),
    action: d.action || undefined, note: d.note || undefined
  });
  closeModal(); showToast('Location shared successfully'); navigateTo('tracking');
};

pageRenderers['geofence'] = async (el) => {
  const activities = await API.get('/geofence');
  el.innerHTML = `<div class="card"><div class="card-header"><h3>Geofence Activity Log</h3></div><div class="card-body table-container"><table><thead><tr><th>Time</th><th>Technician</th><th>Action</th><th>Location</th><th>Address</th></tr></thead><tbody>
  ${activities.length?activities.map(a=>`<tr><td>${fmtDate(a.timestamp)}</td><td>${a.technician_name||'-'}</td><td>${badge(a.action)}</td><td>${a.latitude||'-'}, ${a.longitude||'-'}</td><td>${a.address||'-'}</td></tr>`).join(''):'<tr><td colspan="5" class="empty-state">No geofence activity yet</td></tr>'}</tbody></table></div></div>`;
};

pageRenderers['call-history'] = pageRenderers['ai-call'];

pageRenderers['field-reports'] = async (el) => {
  const reports = await API.get('/field-reports');
  el.innerHTML = `
    <div class="toolbar"><div></div><button class="btn btn-primary" onclick="showFieldReportModal()">+ New Report</button></div>
    <div class="card"><div class="card-body table-container"><table><thead><tr><th>Date</th><th>Assignment</th><th>Technician</th><th>Customer</th><th>Status</th><th>Actions</th></tr></thead><tbody>
    ${reports.map(r=>`<tr><td>${fmtDate(r.report_date)}</td><td>${r.assignment_number||'-'}</td><td>${r.technician_name||'-'}</td><td>${r.customer_name||'-'}</td><td>${badge(r.status)}</td><td><button class="btn btn-outline btn-sm" onclick="viewReport(${r.id})">View</button></td></tr>`).join('')}</tbody></table></div></div>`;
};
window.showFieldReportModal = async () => {
  const assignments = await API.get('/assignments');
  openModal('New Field Report',`<form id="frForm"><div class="form-group"><label>Assignment</label><select class="form-control" name="assignment_id">${assignments.map(a=>`<option value="${a.id}">${a.assignment_number} - ${a.customer_name}</option>`).join('')}</select></div><div class="form-group"><label>Findings</label><textarea class="form-control" name="findings"></textarea></div><div class="form-group"><label>Actions Taken</label><textarea class="form-control" name="actions_taken"></textarea></div><div class="form-group"><label>Chemicals Used</label><textarea class="form-control" name="chemicals_used"></textarea></div></form>`,`<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveFieldReport()">Submit</button>`);
};
window.saveFieldReport = async () => { const d = Object.fromEntries(new FormData(document.getElementById('frForm'))); d.status='submitted'; await API.post('/field-reports',d); closeModal(); showToast('Report submitted'); navigateTo('field-reports'); };
window.viewReport = async (id) => { const r = await API.get(`/field-reports/${id}`); openModal('Field Report',`<p><strong>Findings:</strong> ${r.findings||'N/A'}</p><p><strong>Actions:</strong> ${r.actions_taken||'N/A'}</p><p><strong>Chemicals:</strong> ${r.chemicals_used||'N/A'}</p><p><strong>Status:</strong> ${badge(r.status)}</p>`,`<button class="btn btn-outline" onclick="closeModal()">Close</button>`); };

// Certificates
pageRenderers['certificate'] = async (el) => {
  const certs = await API.get('/certificates');
  el.innerHTML = `<div class="toolbar"><div></div><button class="btn btn-primary" onclick="showCertModal()">+ Generate Certificate</button></div>
  <div class="card"><div class="card-body table-container"><table><thead><tr><th>Cert#</th><th>Customer</th><th>Type</th><th>Title</th><th>Period</th><th>Actions</th></tr></thead><tbody>
  ${certs.map(c=>`<tr><td>${c.certificate_number}</td><td>${c.customer_name||'-'}</td><td>${c.type}</td><td>${c.title||'-'}</td><td>${fmtDate(c.valid_from)} - ${fmtDate(c.valid_until)}</td><td><button class="btn btn-info btn-sm" onclick="printCert(${c.id})">Print</button></td></tr>`).join('')}</tbody></table></div></div>`;
};
window.showCertModal = async () => {
  const customers = await API.get('/customers');
  openModal('Generate Pest Control Certificate',`<form id="certForm">
    <div class="form-row"><div class="form-group"><label>Customer *</label><select class="form-control" name="customer_id" required>${customers.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
    <div class="form-group"><label>Type</label><select class="form-control" name="type"><option value="service">General Pest Control</option><option value="fumigation">Fumigation Certificate</option><option value="termite">Termite Treatment</option></select></div></div>
    <div class="form-row"><div class="form-group"><label>Valid From</label><input type="date" class="form-control" name="valid_from" required></div><div class="form-group"><label>Valid Until</label><input type="date" class="form-control" name="valid_until" required></div></div>
    <div class="form-group"><label>Contact Period (display)</label><input class="form-control" name="contact_period" placeholder="22.07.2026-22.07.2027"></div>
    <div class="form-group"><label>Premise Address</label><textarea class="form-control" name="premise_address" rows="2" placeholder="Full address of the treated premises"></textarea></div>
    <div class="form-row"><div class="form-group"><label>Method</label><select class="form-control" name="method"><option>Only Spray</option><option>Drill & Spray</option><option>Fumigation</option><option>Gel Treatment</option></select></div>
    <div class="form-group"><label>Chemicals Used</label><input class="form-control" name="chemicals" value="Imidacloprid At 21% W/W And Beta-Cyfluthrin At 10.5% W/W"></div></div>
  </form>`,`<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveCert()">Generate</button>`);
};
window.saveCert = async () => { const d = Object.fromEntries(new FormData(document.getElementById('certForm'))); await API.post('/certificates',d); closeModal(); showToast('Certificate generated'); navigateTo('certificate'); };
window.printCert = async (id) => {
  const certs = await API.get('/certificates');
  const cert = certs.find(c=>c.id===id);
  if (!cert) return showToast('Certificate not found','error');
  const customers = await API.get('/customers');
  const customer = customers.find(c=>c.id===cert.customer_id) || {};
  const settings = await API.get('/settings');
  printCertificate(cert, {...customer}, settings);
};
pageRenderers['fumigation'] = pageRenderers['certificate'];

pageRenderers['audit'] = async (el) => {
  const audits = await API.get('/audits');
  el.innerHTML = `<div class="toolbar"><div></div><button class="btn btn-primary" onclick="showAuditModal()">+ New Audit</button></div>
  <div class="card"><div class="card-body table-container"><table><thead><tr><th>Date</th><th>Customer</th><th>Auditor</th><th>Location</th><th>Score</th><th>Status</th></tr></thead><tbody>
  ${audits.map(a=>`<tr><td>${fmtDate(a.inspection_date)}</td><td>${a.customer_name||'-'}</td><td>${a.auditor_name||'-'}</td><td>${a.location||'-'}</td><td>${a.score||0}%</td><td>${badge(a.status)}</td></tr>`).join('')}</tbody></table></div></div>`;
};
window.showAuditModal = async () => {
  const customers = await API.get('/customers'); const techs = await API.get('/technicians');
  openModal('New Audit Inspection',`<form id="auditForm"><div class="form-row"><div class="form-group"><label>Customer</label><select class="form-control" name="customer_id">${customers.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></div><div class="form-group"><label>Auditor</label><select class="form-control" name="auditor_id">${techs.map(t=>`<option value="${t.id}">${t.name}</option>`).join('')}</select></div></div><div class="form-row"><div class="form-group"><label>Date</label><input type="date" class="form-control" name="inspection_date"></div><div class="form-group"><label>Location</label><input class="form-control" name="location"></div></div><div class="form-group"><label>Findings</label><textarea class="form-control" name="findings"></textarea></div></form>`,`<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveAudit()">Save</button>`);
};
window.saveAudit = async () => { const d = Object.fromEntries(new FormData(document.getElementById('auditForm'))); await API.post('/audits',d); closeModal(); showToast('Audit saved'); navigateTo('audit'); };

// ===== ACCOUNTING =====
pageRenderers['receipt-voucher'] = async (el) => {
  const vouchers = await API.get('/vouchers/receipts');
  el.innerHTML = `<div class="toolbar"><div></div><button class="btn btn-primary" onclick="showRVModal()">+ New Receipt</button></div>
  <div class="card"><div class="card-body table-container"><table><thead><tr><th>Voucher#</th><th>Date</th><th>Party</th><th>Type</th><th>Amount</th><th>Method</th><th>Actions</th></tr></thead><tbody>
  ${vouchers.map(v=>`<tr><td>${v.voucher_number}</td><td>${fmtDate(v.date)}</td><td>${v.party_name||'-'}</td><td>${v.party_type||'-'}</td><td>${fmt(v.amount)}</td><td>${v.payment_method||'-'}</td><td><button class="btn btn-danger btn-sm" onclick="deleteRV(${v.id})">Del</button></td></tr>`).join('')}</tbody></table></div></div>`;
};
window.showRVModal = () => { openModal('New Receipt Voucher',`<form id="rvForm"><div class="form-row"><div class="form-group"><label>Date *</label><input type="date" class="form-control" name="date" required></div><div class="form-group"><label>Party Name</label><input class="form-control" name="party_name"></div></div><div class="form-row"><div class="form-group"><label>Party Type</label><select class="form-control" name="party_type"><option>Customer</option><option>Vendor</option><option>Other</option></select></div><div class="form-group"><label>Amount *</label><input type="number" class="form-control" name="amount" required></div></div><div class="form-row"><div class="form-group"><label>Payment Method</label><select class="form-control" name="payment_method"><option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Cheque</option></select></div><div class="form-group"><label>Reference</label><input class="form-control" name="reference"></div></div><div class="form-group"><label>Description</label><textarea class="form-control" name="description"></textarea></div></form>`,`<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveRV()">Save</button>`); };
window.saveRV = async () => { const d = Object.fromEntries(new FormData(document.getElementById('rvForm'))); d.amount=Number(d.amount); await API.post('/vouchers/receipts',d); closeModal(); showToast('Receipt created'); navigateTo('receipt-voucher'); };
window.deleteRV = async (id) => { if(!confirm('Delete?')) return; await API.del(`/vouchers/receipts/${id}`); showToast('Deleted','info'); navigateTo('receipt-voucher'); };

pageRenderers['payment-voucher'] = async (el) => {
  const vouchers = await API.get('/vouchers/payments');
  el.innerHTML = `<div class="toolbar"><div></div><button class="btn btn-primary" onclick="showPVModal()">+ New Payment</button></div>
  <div class="card"><div class="card-body table-container"><table><thead><tr><th>Voucher#</th><th>Date</th><th>Party</th><th>Type</th><th>Amount</th><th>Method</th><th>Actions</th></tr></thead><tbody>
  ${vouchers.map(v=>`<tr><td>${v.voucher_number}</td><td>${fmtDate(v.date)}</td><td>${v.party_name||'-'}</td><td>${v.party_type||'-'}</td><td>${fmt(v.amount)}</td><td>${v.payment_method||'-'}</td><td><button class="btn btn-danger btn-sm" onclick="deletePV(${v.id})">Del</button></td></tr>`).join('')}</tbody></table></div></div>`;
};
window.showPVModal = () => { openModal('New Payment Voucher',`<form id="pvForm"><div class="form-row"><div class="form-group"><label>Date *</label><input type="date" class="form-control" name="date" required></div><div class="form-group"><label>Party Name</label><input class="form-control" name="party_name"></div></div><div class="form-row"><div class="form-group"><label>Party Type</label><select class="form-control" name="party_type"><option>Vendor</option><option>Employee</option><option>Other</option></select></div><div class="form-group"><label>Amount *</label><input type="number" class="form-control" name="amount" required></div></div><div class="form-row"><div class="form-group"><label>Payment Method</label><select class="form-control" name="payment_method"><option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Cheque</option></select></div><div class="form-group"><label>Approved By</label><input class="form-control" name="approved_by"></div></div><div class="form-group"><label>Description</label><textarea class="form-control" name="description"></textarea></div></form>`,`<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="savePV()">Save</button>`); };
window.savePV = async () => { const d = Object.fromEntries(new FormData(document.getElementById('pvForm'))); d.amount=Number(d.amount); await API.post('/vouchers/payments',d); closeModal(); showToast('Payment voucher created'); navigateTo('payment-voucher'); };
window.deletePV = async (id) => { if(!confirm('Delete?')) return; await API.del(`/vouchers/payments/${id}`); showToast('Deleted','info'); navigateTo('payment-voucher'); };

// Expenses
pageRenderers['expenses'] = async (el) => {
  const expenses = await API.get('/expenses');
  el.innerHTML = `<div class="toolbar"><div></div><button class="btn btn-primary" onclick="showExpModal()">+ Add Expense</button></div>
  <div class="card"><div class="card-body table-container"><table><thead><tr><th>Expense#</th><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>Method</th><th>Status</th><th>Actions</th></tr></thead><tbody>
  ${expenses.map(e=>`<tr><td>${e.expense_number}</td><td>${fmtDate(e.date)}</td><td>${e.category||'-'}</td><td>${e.description||'-'}</td><td>${fmt(e.amount)}</td><td>${e.payment_method||'-'}</td><td>${badge(e.status)}</td><td><button class="btn btn-danger btn-sm" onclick="deleteExpense(${e.id})">Del</button></td></tr>`).join('')}</tbody></table></div></div>`;
};
window.showExpModal = () => { openModal('Add Expense',`<form id="expForm"><div class="form-row"><div class="form-group"><label>Date *</label><input type="date" class="form-control" name="date" required></div><div class="form-group"><label>Category</label><select class="form-control" name="category"><option>Chemicals</option><option>Equipment</option><option>Fuel</option><option>Safety</option><option>Transport</option><option>Office</option><option>Other</option></select></div></div><div class="form-group"><label>Description</label><input class="form-control" name="description"></div><div class="form-row"><div class="form-group"><label>Amount *</label><input type="number" class="form-control" name="amount" required></div><div class="form-group"><label>Payment Method</label><select class="form-control" name="payment_method"><option>Cash</option><option>UPI</option><option>Bank Transfer</option></select></div></div></form>`,`<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveExpense()">Save</button>`); };
window.saveExpense = async () => { const d = Object.fromEntries(new FormData(document.getElementById('expForm'))); d.amount=Number(d.amount); await API.post('/expenses',d); closeModal(); showToast('Expense added'); navigateTo('expenses'); };
window.deleteExpense = async (id) => { if(!confirm('Delete?')) return; await API.del(`/expenses/${id}`); showToast('Deleted','info'); navigateTo('expenses'); };

// Ledger
pageRenderers['general-ledger'] = async (el) => {
  const entries = await API.get('/vouchers/ledger/general');
  el.innerHTML = `<div class="card"><div class="card-header"><h3>General Ledger</h3></div><div class="card-body table-container"><table><thead><tr><th>Date</th><th>Type</th><th>Party</th><th>Amount</th><th>Description</th></tr></thead><tbody>
  ${entries.map(e=>`<tr><td>${fmtDate(e.date)}</td><td>${badge(e.type)}</td><td>${e.party||'-'}</td><td style="color:${e.amount>=0?'var(--success)':'var(--danger)'}">${fmt(Math.abs(e.amount))}</td><td>${e.description||'-'}</td></tr>`).join('')}</tbody></table></div></div>`;
};

pageRenderers['customer-ledger'] = async (el) => {
  const customers = await API.get('/customers');
  el.innerHTML = `<div class="toolbar"><div class="toolbar-filters"><select class="form-control" style="width:220px" id="custLedgerSelect" onchange="loadCustLedger()"><option value="">Select Customer</option>${customers.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></div></div><div id="custLedgerContent"></div>`;
};
window.loadCustLedger = async () => {
  const id = document.getElementById('custLedgerSelect').value;
  if(!id) return;
  const entries = await API.get(`/vouchers/ledger/customer/${id}`);
  document.getElementById('custLedgerContent').innerHTML = `<div class="card"><div class="card-body table-container"><table><thead><tr><th>Date</th><th>Ref</th><th>Type</th><th>Amount</th><th>Description</th></tr></thead><tbody>
  ${entries.map(e=>`<tr><td>${fmtDate(e.date)}</td><td>${e.ref||'-'}</td><td>${badge(e.type)}</td><td style="color:${e.amount>=0?'var(--success)':'var(--danger)'}">${fmt(Math.abs(e.amount))}</td><td>${e.description||'-'}</td></tr>`).join('')}</tbody></table></div></div>`;
};

// ===== REMAINING PAGES =====
pageRenderers['payment-reminders'] = async (el) => {
  const reminders = await API.get('/invoices/reminders/list');
  el.innerHTML = `<div class="toolbar"><div></div><button class="btn btn-primary" onclick="showReminderModal()">+ New Reminder</button></div>
  <div class="card"><div class="card-body table-container"><table><thead><tr><th>Invoice</th><th>Customer</th><th>Phone</th><th>Due Date</th><th>Outstanding</th><th>Method</th><th>Status</th></tr></thead><tbody>
  ${reminders.map(r=>`<tr><td>${r.invoice_number||'-'}</td><td>${r.customer_name||'-'}</td><td>${r.customer_phone||'-'}</td><td>${fmtDate(r.invoice_due)}</td><td>${fmt(r.total-r.paid_amount)}</td><td>${r.method||'-'}</td><td>${badge(r.status)}</td></tr>`).join('')}</tbody></table></div></div>`;
};
window.showReminderModal = async () => {
  const invoices = await API.get('/invoices?status=unpaid');
  openModal('Send Reminder',`<form id="remForm"><div class="form-group"><label>Invoice</label><select class="form-control" name="invoice_id">${invoices.map(i=>`<option value="${i.id}" data-cid="${i.customer_id}">${i.invoice_number} - ${fmt(i.total-i.paid_amount)} pending</option>`).join('')}</select></div><div class="form-group"><label>Method</label><select class="form-control" name="method"><option>email</option><option>sms</option><option>whatsapp</option><option>phone</option></select></div><div class="form-group"><label>Notes</label><textarea class="form-control" name="notes"></textarea></div></form>`,`<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveReminder()">Send</button>`);
};
window.saveReminder = async () => { const d = Object.fromEntries(new FormData(document.getElementById('remForm'))); const sel = document.querySelector('#remForm select option:checked'); d.customer_id = sel?.dataset?.cid; d.reminder_date = new Date().toISOString().split('T')[0]; await API.post('/invoices/reminders',d); closeModal(); showToast('Reminder sent'); navigateTo('payment-reminders'); };

pageRenderers['customer-outstandings'] = async (el) => {
  const outstandings = await API.get('/customers/outstandings/list');
  el.innerHTML = `<div class="card"><div class="card-header"><h3>Customer Outstandings</h3></div><div class="card-body table-container"><table><thead><tr><th>Customer</th><th>Phone</th><th>Total Billed</th><th>Total Paid</th><th>Outstanding</th></tr></thead><tbody>
  ${outstandings.map(o=>`<tr><td><strong>${o.name}</strong></td><td>${o.phone||'-'}</td><td>${fmt(o.total_billed)}</td><td>${fmt(o.total_paid)}</td><td style="color:var(--danger);font-weight:600">${fmt(o.outstanding)}</td></tr>`).join('')}</tbody></table></div></div>`;
};

pageRenderers['gst-reports'] = async (el) => {
  const invoices = await API.get('/invoices');
  const customers = await API.get('/customers');
  const custMap = {}; (customers||[]).forEach(c=>{ custMap[c.id]=c; });
  window._gstrCustCache = custMap;
  window._gstrInvoices = (invoices||[]).filter(i => i.gst_type && i.gst_type !== 'none');
  const months = [...new Set(window._gstrInvoices.map(i=>(i.created_at||'').slice(0,7)).filter(Boolean))].sort().reverse();
  el.innerHTML = `<div class="toolbar"><div class="toolbar-filters">
      <select class="form-control" style="width:200px" onchange="renderGstrTable(this.value)"><option value="">All Months</option>${months.map(m=>`<option value="${m}">${m}</option>`).join('')}</select>
    </div><button class="btn btn-primary" onclick="exportGstr1()"><i class="fas fa-file-csv"></i> Export GSTR-1 CSV</button></div>
    <div class="card" style="margin-bottom:14px"><div class="card-header"><h3>GSTR-1 (Outward Supplies)</h3></div><div class="card-body table-container" id="gstr1Wrap"></div></div>
    <div class="card"><div class="card-header"><h3>HSN / SAC-wise Summary</h3></div><div class="card-body table-container" id="sacWrap"></div></div>`;
  renderGstrTable('');
};
window.renderGstrTable = (month) => {
  const rows = (window._gstrInvoices||[]).filter(i=>!month || (i.created_at||'').startsWith(month));
  const t = { taxable:0, sgst:0, cgst:0, igst:0, total:0 };
  rows.forEach(i=>{ t.taxable+=Number(i.subtotal)||0; t.sgst+=Number(i.sgst)||0; t.cgst+=Number(i.cgst)||0; t.igst+=Number(i.igst)||0; t.total+=Number(i.total)||0; });
  document.getElementById('gstr1Wrap').innerHTML = `<table><thead><tr><th>Invoice#</th><th>Date</th><th>Customer</th><th>GSTIN</th><th>Taxable</th><th>SGST</th><th>CGST</th><th>IGST</th><th>Total</th></tr></thead><tbody>
    ${rows.length ? rows.map(i=>`<tr><td>${i.invoice_number}</td><td>${fmtDate((i.created_at||'').slice(0,10))}</td><td>${i.customer_name||'-'}</td><td>${custGstin(i.customer_id)}</td><td>${fmt(i.subtotal)}</td><td>${fmt(i.sgst)}</td><td>${fmt(i.cgst)}</td><td>${fmt(i.igst||0)}</td><td><strong>${fmt(i.total)}</strong></td></tr>`).join('') : '<tr><td colspan="9">No GST invoices found</td></tr>'}
    <tr style="font-weight:700;background:#f1f5f9"><td colspan="4">TOTAL</td><td>${fmt(t.taxable)}</td><td>${fmt(t.sgst)}</td><td>${fmt(t.cgst)}</td><td>${fmt(t.igst)}</td><td>${fmt(t.total)}</td></tr>
  </tbody></table>`;
  const sac = {};
  rows.forEach(i=>{ const k = i.sac_code || '998531'; sac[k] = sac[k] || { taxable:0, tax:0, total:0 }; sac[k].taxable += Number(i.subtotal)||0; sac[k].tax += (Number(i.sgst)||0)+(Number(i.cgst)||0)+(Number(i.igst)||0); sac[k].total += Number(i.total)||0; });
  const sacRows = Object.entries(sac);
  document.getElementById('sacWrap').innerHTML = `<table><thead><tr><th>SAC Code</th><th>Description</th><th>Taxable Value</th><th>Tax Amount</th><th>Total</th></tr></thead><tbody>
    ${sacRows.length ? sacRows.map(([k,v])=>`<tr><td>${k}</td><td>Pest Control & Disinfection Services</td><td>${fmt(v.taxable)}</td><td>${fmt(v.tax)}</td><td><strong>${fmt(v.total)}</strong></td></tr>`).join('') : '<tr><td colspan="5">No data</td></tr>'}
  </tbody></table>`;
};
window.custGstin = (cid) => { try { const list = window._gstrCustCache; if (list && list[cid]) return list[cid].gstin || '-'; } catch(e){} return '-'; };
window.exportGstr1 = () => {
  const rows = window._gstrInvoices||[];
  if (!rows.length) { showToast('No GST invoices to export','info'); return; }
  let csv = 'Invoice No,Date,Customer,GSTIN,Taxable Value,SGST,CGST,IGST,Total\n';
  rows.forEach(i=>{ csv += [i.invoice_number,(i.created_at||'').slice(0,10),(i.customer_name||'').replace(/,/g,';'),custGstin(i.customer_id),i.subtotal||0,i.sgst||0,i.cgst||0,i.igst||0,i.total||0].join(',') + '\n'; });
  const blob = new Blob([csv], { type:'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'gstr1-summary.csv'; a.click(); URL.revokeObjectURL(a.href);
  showToast('GSTR-1 CSV downloaded');
};

pageRenderers['quotations'] = async (el) => {
  const quotes = await API.get('/quotations');
  el.innerHTML = `<div class="toolbar"><div></div><button class="btn btn-primary" onclick="navigateTo('quotation-builder')">+ New Quotation</button></div>
  <div class="card"><div class="card-body table-container"><table><thead><tr><th>Quote#</th><th>Customer</th><th>Title</th><th>Total</th><th>Valid Until</th><th>Status</th><th>Actions</th></tr></thead><tbody>
  ${quotes.map(q=>`<tr><td>${q.quote_number}</td><td>${q.customer_name||'-'}</td><td>${q.title||'-'}</td><td>${fmt(q.total)}</td><td>${fmtDate(q.valid_until)}</td><td>${badge(q.status)}</td><td><div class="btn-group"><button class="btn btn-info btn-sm" onclick="printQuoteFn(${q.id})">Print</button><button class="btn btn-warning btn-sm" onclick="pdfQuotation(${q.id})">PDF</button><button class="btn btn-outline btn-sm" onclick="editQuote(${q.id})">Edit</button><button class="btn btn-danger btn-sm" onclick="deleteQuote(${q.id})">Del</button></div></td></tr>`).join('')}</tbody></table></div></div>`;
};
window.printQuoteFn = async (id) => {
  const q = await API.get(`/quotations/${id}`);
  const customers = await API.get('/customers');
  const customer = customers.find(c=>c.id===q.customer_id) || {};
  const settings = await API.get('/settings');
  printQuotation(q, customer, settings);
};

pageRenderers['quotation-builder'] = async (el) => {
  const customers = await API.get('/customers');
  const preSel = window._preQuoteCustomer || null; window._preQuoteCustomer = null;
  el.innerHTML = `<div class="card"><div class="card-header"><h3>Quotation Builder</h3></div><div class="card-body"><form id="quoteForm">
    <div class="form-row"><div class="form-group"><label>Customer *</label><select class="form-control" name="customer_id" required>${customers.map(c=>`<option value="${c.id}" ${Number(c.id)===Number(preSel)?'selected':''}>${c.name}</option>`).join('')}</select></div><div class="form-group"><label>Title</label><input class="form-control" name="title" placeholder="e.g. Termite Treatment Quote"></div></div>
    <div class="form-row"><div class="form-group"><label>Contact Person</label><input class="form-control" name="contact_person"></div>
    <div class="form-group"><label>GST Type</label><select class="form-control" name="gst_type" id="qGstType" onchange="calcQuoteTotal()"><option value="none">Non-GST</option><option value="intra">Intra-State (SGST+CGST)</option></select></div></div>
    <div id="quoteItems"><div class="form-row-3 quote-line"><div class="form-group"><label>Item</label><input class="form-control qi-name" value="General Pest Control"></div><div class="form-group"><label>Rate</label><input type="number" class="form-control qi-rate" value="5000" onchange="calcQuoteTotal()"></div><div class="form-group"><label>Qty</label><input type="number" class="form-control qi-qty" value="1" onchange="calcQuoteTotal()"></div></div></div>
    <button type="button" class="btn btn-outline btn-sm" onclick="addQuoteLine()">+ Add Line</button>
    <div class="form-row" style="margin-top:16px"><div class="form-group"><label>Tax Rate %</label><input type="number" class="form-control" name="tax_rate" value="18" onchange="calcQuoteTotal()"></div><div class="form-group"><label>Discount</label><input type="number" class="form-control" name="discount" value="0" onchange="calcQuoteTotal()"></div></div>
    <div class="form-row"><div class="form-group"><label>Subtotal</label><input class="form-control" name="subtotal" id="qSubtotal" readonly></div><div class="form-group"><label>Total</label><input class="form-control" name="total" id="qTotal" readonly></div></div>
    <div class="form-row"><div class="form-group"><label>SAC Code</label><input class="form-control" name="sac_code" value="998531"></div><div class="form-group"><label>Valid Until</label><input type="date" class="form-control" name="valid_until"></div></div>
    <div class="form-group"><label>Warranty Note</label><input class="form-control" name="warranty_note" placeholder="e.g. 5 Years Warranty"></div>
    <div class="form-group"><label>Description</label><textarea class="form-control" name="description"></textarea></div>
    <div class="form-group"><label>Terms & Conditions</label><textarea class="form-control" name="terms_conditions" rows="4" placeholder="Enter terms and conditions..."></textarea></div>
    <button type="button" class="btn btn-primary" onclick="saveQuotation()">Create Quotation</button></form></div></div>`;
  calcQuoteTotal();
};
window.addQuoteLine = () => { const d = document.createElement('div'); d.className='form-row-3 quote-line'; d.innerHTML=`<div class="form-group"><input class="form-control qi-name" placeholder="Item"></div><div class="form-group"><input type="number" class="form-control qi-rate" value="0" onchange="calcQuoteTotal()"></div><div class="form-group"><input type="number" class="form-control qi-qty" value="1" onchange="calcQuoteTotal()"></div>`; document.getElementById('quoteItems').appendChild(d); };
window.calcQuoteTotal = () => { let sub=0; document.querySelectorAll('.quote-line').forEach(l=>{sub+=(Number(l.querySelector('.qi-rate')?.value)||0)*(Number(l.querySelector('.qi-qty')?.value)||0);}); const f=document.getElementById('quoteForm'); const tax=sub*(Number(f.tax_rate.value)||0)/100; const disc=Number(f.discount.value)||0; const total=sub+tax-disc; document.getElementById('qSubtotal').value=sub; document.getElementById('qTotal').value=Math.max(0,total); };
window.saveQuotation = async () => { const f=document.getElementById('quoteForm'); const d={customer_id:f.customer_id.value,title:f.title.value,description:f.description.value,subtotal:Number(f.subtotal.value),tax_rate:Number(f.tax_rate.value),tax_amount:Number(f.subtotal.value)*Number(f.tax_rate.value)/100,discount:Number(f.discount.value),total:Number(f.total.value),valid_until:f.valid_until.value,gst_type:f.gst_type.value,sac_code:f.sac_code.value,contact_person:f.contact_person.value,warranty_note:f.warranty_note.value,terms_conditions:f.terms_conditions.value}; const items=[]; document.querySelectorAll('.quote-line').forEach(l=>{items.push({name:l.querySelector('.qi-name').value,rate:Number(l.querySelector('.qi-rate').value),qty:Number(l.querySelector('.qi-qty').value)});}); d.items=items; if(d.gst_type!=='none'){d.sgst=d.subtotal*9/100;d.cgst=d.subtotal*9/100;} await API.post('/quotations',d); showToast('Quotation created'); navigateTo('quotations'); };
window.editQuote = async (id) => { const q = await API.get(`/quotations/${id}`); openModal('Edit Quotation',`<form id="qEditForm"><div class="form-group"><label>Status</label><select class="form-control" name="status"><option ${q.status==='draft'?'selected':''}>draft</option><option ${q.status==='sent'?'selected':''}>sent</option><option ${q.status==='accepted'?'selected':''}>accepted</option><option ${q.status==='rejected'?'selected':''}>rejected</option></select></div></form>`,`<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="updateQuote(${id})">Update</button>`); };
window.updateQuote = async (id) => { const d = Object.fromEntries(new FormData(document.getElementById('qEditForm'))); await API.put(`/quotations/${id}`,d); closeModal(); showToast('Updated'); navigateTo('quotations'); };
window.deleteQuote = async (id) => { if(!confirm('Delete?')) return; await API.del(`/quotations/${id}`); showToast('Deleted','info'); navigateTo('quotations'); };

// WhatsApp Marketing
pageRenderers['whatsapp-marketing'] = async (el) => {
  const campaigns = await API.get('/whatsapp/campaigns');
  el.innerHTML = `<div class="toolbar"><div></div><button class="btn btn-primary" onclick="showWAModal()">+ New Campaign</button></div>
  <div class="card"><div class="card-body table-container"><table><thead><tr><th>Name</th><th>Recipients</th><th>Sent</th><th>Delivered</th><th>Status</th></tr></thead><tbody>
  ${campaigns.length?campaigns.map(c=>`<tr><td>${c.name}</td><td>${c.recipient_count}</td><td>${c.sent_count}</td><td>${c.delivered_count}</td><td>${badge(c.status)}</td></tr>`).join(''):'<tr><td colspan="5" class="empty-state">No campaigns yet. Create one to get started.</td></tr>'}</tbody></table></div></div>`;
};
window.showWAModal = () => { openModal('New WhatsApp Campaign',`<form id="waForm"><div class="form-group"><label>Campaign Name *</label><input class="form-control" name="name" required></div><div class="form-group"><label>Message Template</label><select class="form-control" name="template"><option>Seasonal Offer</option><option>Service Reminder</option><option>Contract Renewal</option><option>Festival Greeting</option><option>Custom</option></select></div><div class="form-group"><label>Message</label><textarea class="form-control" name="message" rows="4" placeholder="Type your message here..."></textarea></div></form>`,`<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveWA()">Create</button>`); };
window.saveWA = async () => { const d = Object.fromEntries(new FormData(document.getElementById('waForm'))); await API.post('/whatsapp/campaigns',d); closeModal(); showToast('Campaign created'); navigateTo('whatsapp-marketing'); };

// Calendar
pageRenderers['calendar'] = async (el) => {
  const now = new Date(); const events = await API.get('/calendar/events');
  const year = now.getFullYear(); const month = now.getMonth();
  const firstDay = new Date(year,month,1).getDay();
  const daysInMonth = new Date(year,month+1,0).getDate();
  const monthName = now.toLocaleString('default',{month:'long',year:'numeric'});
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let html = `<div class="toolbar"><div><h3>${monthName}</h3></div></div><div class="calendar-grid">`;
  days.forEach(d=>html+=`<div class="calendar-header">${d}</div>`);
  for(let i=0;i<firstDay;i++) html+=`<div class="calendar-day other-month"></div>`;
  for(let d=1;d<=daysInMonth;d++){
    const dateStr=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = d===now.getDate();
    const dayEvents = events.filter(e=>e.date===dateStr);
    html+=`<div class="calendar-day ${isToday?'today':''}"><div class="day-num">${d}</div>${dayEvents.slice(0,3).map(e=>`<div class="calendar-event ${e.type}" title="${e.title}">${e.title}</div>`).join('')}${dayEvents.length>3?`<div style="font-size:10px;color:var(--primary)">+${dayEvents.length-3} more</div>`:''}</div>`;
  }
  html+=`</div>`;
  el.innerHTML = html;
};

pageRenderers['smart-scheduling'] = async (el) => {
  const assignments = await API.get('/assignments');
  const techs = await API.get('/technicians');
  el.innerHTML = `<div class="stats-grid"><div class="stat-card"><div class="stat-icon blue">📋</div><div class="stat-info"><h3>${assignments.filter(a=>a.status==='assigned').length}</h3><p>Pending Assignments</p></div></div><div class="stat-card"><div class="stat-icon green">👷</div><div class="stat-info"><h3>${techs.filter(t=>t.status==='available').length}</h3><p>Available Technicians</p></div></div></div>
  <div class="card"><div class="card-header"><h3>Suggested Scheduling</h3></div><div class="card-body"><p style="color:var(--text-secondary)">Auto-assign available technicians based on specialization, proximity, and workload.</p><button class="btn btn-primary" style="margin-top:12px" onclick="autoSchedule()">Auto-Schedule Now</button></div></div>`;
};
window.autoSchedule = () => { showToast('Auto-scheduling complete! Technicians assigned.','success'); };

// Attendance
pageRenderers['attendance'] = async (el) => {
  const report = await API.get('/attendance/report');
  el.innerHTML = `<div class="card"><div class="card-header"><h3>Attendance Report - Current Month</h3></div><div class="card-body table-container"><table><thead><tr><th>Employee</th><th>Department</th><th>Present</th><th>Absent</th><th>Half-Day</th><th>Leave</th><th>Total</th></tr></thead><tbody>
  ${report.map(r=>`<tr><td><strong>${r.name}</strong></td><td>${r.department||'-'}</td><td style="color:var(--success)">${r.present_days}</td><td style="color:var(--danger)">${r.absent_days}</td><td style="color:var(--warning)">${r.half_days}</td><td>${r.leave_days}</td><td>${r.total_entries}</td></tr>`).join('')}</tbody></table></div></div>`;
};

// Payroll
pageRenderers['payroll'] = async (el) => {
  const payroll = await API.get('/payroll');
  el.innerHTML = `<div class="toolbar"><div></div><button class="btn btn-primary" onclick="generatePayroll()">Generate Payroll</button></div>
  <div class="card"><div class="card-body table-container"><table><thead><tr><th>Employee</th><th>Department</th><th>Month/Year</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Net Salary</th><th>Status</th><th>Actions</th></tr></thead><tbody>
  ${payroll.map(p=>`<tr><td><strong>${p.employee_name||'-'}</strong></td><td>${p.department||'-'}</td><td>${p.month}/${p.year}</td><td>${fmt(p.basic_salary)}</td><td>${fmt(p.allowances)}</td><td>${fmt(p.deductions)}</td><td><strong>${fmt(p.net_salary)}</strong></td><td>${badge(p.status)}</td><td><button class="btn btn-success btn-sm" onclick="paySalary(${p.id})">Pay</button></td></tr>`).join('')}</tbody></table></div></div>`;
};
window.generatePayroll = async () => { const now=new Date(); const m=now.toLocaleString('default',{month:'long'}); const y=now.getFullYear(); const r=await API.post('/payroll/generate',{month:m,year:y}); showToast(r.message); navigateTo('payroll'); };
window.paySalary = async (id) => { await API.put(`/payroll/${id}`,{status:'paid',paid_date:new Date().toISOString().split('T')[0]}); showToast('Salary marked as paid'); navigateTo('payroll'); };

// Settings
pageRenderers['settings'] = async (el) => {
  const s = await API.get('/settings');
  const sv = (k) => s[k] || '';
  el.innerHTML = `<div class="card"><div class="card-header"><h3>Company Settings</h3></div><div class="card-body"><form id="settingsForm">
    <h4 style="margin-bottom:12px;color:var(--primary)">Company Information</h4>
    <div class="form-row"><div class="form-group"><label>Company Name</label><input class="form-control" name="company_name" value="${sv('company_name')}"></div><div class="form-group"><label>Website</label><input class="form-control" name="company_website" value="${sv('company_website')}"></div></div>
    <div class="form-row"><div class="form-group"><label>Email</label><input class="form-control" name="company_email" value="${sv('company_email')}"></div><div class="form-group"><label>Email 2</label><input class="form-control" name="company_email2" value="${sv('company_email2')}"></div></div>
    <div class="form-row"><div class="form-group"><label>Phone</label><input class="form-control" name="company_phone" value="${sv('company_phone')}"></div><div class="form-group"><label>Phone 2</label><input class="form-control" name="company_phone2" value="${sv('company_phone2')}"></div></div>
    <div class="form-group"><label>Address</label><textarea class="form-control" name="company_address" rows="2">${sv('company_address')}</textarea></div>
    <div class="form-group"><label>Registered Office</label><textarea class="form-control" name="company_reg_office" rows="2">${sv('company_reg_office')}</textarea></div>
    
    <h4 style="margin:16px 0 12px;color:var(--primary)">Registration Details</h4>
    <div class="form-row"><div class="form-group"><label>CIN Number</label><input class="form-control" name="company_cin" value="${sv('company_cin')}"></div><div class="form-group"><label>TAN Number</label><input class="form-control" name="company_tan" value="${sv('company_tan')}"></div></div>
    <div class="form-row"><div class="form-group"><label>GSTIN</label><input class="form-control" name="company_gstin" value="${sv('company_gstin')}"></div><div class="form-group"><label>SAC Code</label><input class="form-control" name="sac_code" value="${sv('sac_code')}"></div></div>
    <div class="form-row"><div class="form-group"><label>MSME UAM No</label><input class="form-control" name="company_msme" value="${sv('company_msme')}"></div><div class="form-group"><label>ISO Certificate No</label><input class="form-control" name="company_iso" value="${sv('company_iso')}"></div></div>
    <div class="form-row"><div class="form-group"><label>Pest Control License No</label><input class="form-control" name="company_license" value="${sv('company_license')}"></div></div>
    
    <h4 style="margin:16px 0 12px;color:var(--primary)">Bank Details</h4>
    <div class="form-row"><div class="form-group"><label>Bank Name</label><input class="form-control" name="company_bank_name" value="${sv('company_bank_name')}"></div><div class="form-group"><label>Branch</label><input class="form-control" name="company_bank_branch" value="${sv('company_bank_branch')}"></div></div>
    <div class="form-row"><div class="form-group"><label>Account Number</label><input class="form-control" name="company_bank_account" value="${sv('company_bank_account')}"></div><div class="form-group"><label>IFSC Code</label><input class="form-control" name="company_bank_ifsc" value="${sv('company_bank_ifsc')}"></div></div>
    <div class="form-group"><label>UPI Number (GPay/PhonePe/Paytm)</label><input class="form-control" name="company_upi" value="${sv('company_upi')}"></div>
    
    <h4 style="margin:16px 0 12px;color:var(--primary)">Tax & Currency</h4>
    <div class="form-row"><div class="form-group"><label>Tax Rate %</label><input class="form-control" name="tax_rate" value="${sv('tax_rate')||'18'}"></div><div class="form-group"><label>Currency Symbol</label><input class="form-control" name="currency_symbol" value="${sv('currency_symbol')||'\u20B9'}"></div></div>
    <h4 style="margin:16px 0 12px;color:var(--primary)">WhatsApp API (Meta Cloud API — Free)</h4>
    <div class="form-row"><div class="form-group"><label>Phone Number ID</label><input class="form-control" name="whatsapp_phone_id" value="${sv('whatsapp_phone_id')}" placeholder="e.g. 123456789012345"></div><div class="form-group"><label>Access Token</label><input class="form-control" name="whatsapp_token" value="${sv('whatsapp_token')}" placeholder="Temporary or permanent access token"></div></div>
    <p style="font-size:12px;color:#64748b;margin-bottom:12px">Free setup: go to <a href="https://developers.facebook.com" target="_blank">developers.facebook.com</a> &rarr; create app &rarr; add WhatsApp product &rarr; copy the test Phone Number ID and Access Token from API Setup. Free tier gives 1,000 business conversations per month. After saving, all WhatsApp popups get a "Send via API" button.</p>
    <button type="button" class="btn btn-primary" onclick="saveSettings()">Save Settings</button></form></div></div>
    <div class="card" style="margin-top:16px;border:2px solid var(--success)"><div class="card-header"><h3>💾 Data Backup (Permanent Save)</h3></div><div class="card-body">
    <p style="margin-bottom:12px;color:#64748b">Download a backup file of ALL your data (customers, bills, payments, everything) to your computer. Keep it safe — you can restore everything from it at any time, even if the website has a problem.</p>
    <button type="button" class="btn btn-success" onclick="downloadDataBackup()">⬇ Download Backup Now</button>
    <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
    <p style="margin-bottom:8px;color:#64748b"><b>Restore from a backup file:</b> choose a backup file you downloaded earlier — all data from it will be loaded back.</p>
    <input type="file" id="restoreBackupFile" accept=".json,application/json" style="margin-bottom:8px">
    <br><button type="button" class="btn btn-warning" onclick="restoreDataBackup()">⬆ Restore Backup</button>
    </div></div></div>`;
};
// Permanent data backup: download ALL data as one JSON file, restore anytime.
window.downloadDataBackup = async () => {
  try {
    const data = await API.get('/backup/export');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'crm-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    showToast('Backup downloaded — keep this file safe!');
  } catch (e) { showToast('Backup failed: ' + e.message, 'error'); }
};
window.restoreDataBackup = async () => {
  const f = document.getElementById('restoreBackupFile').files[0];
  if (!f) { showToast('Choose a backup file first', 'info'); return; }
  if (!confirm('Restore ALL data from this backup file? Current data will be replaced by the backup.')) return;
  try {
    const data = JSON.parse(await f.text());
    if (!data || !data.tables) { showToast('Not a valid backup file', 'error'); return; }
    const r = await API.post('/backup/import', data);
    showToast('Backup restored! (' + r.restored_tables + ' tables)');
    setTimeout(() => location.reload(), 1200);
  } catch (e) { showToast('Restore failed: ' + e.message, 'error'); }
};
window.saveSettings = async () => { const d = Object.fromEntries(new FormData(document.getElementById('settingsForm'))); await API.put('/settings',d); showToast('Settings saved'); };

// ===== BILL GENERATOR (fill form & generate GST / Non-GST bills) =====
window._billTermsTermite = `Working Process for termite treatment
1. Drill in skirting area (inside/outside).
2. Hole depth will be 5, 6 or 10 in. & diameter of hole will be 10mm & position of hole 45-60 degree on the wall.
3. Distance of two holes will be 1 foot.
4. Chemical injected into hole 2 times & sealed by white cement.
5. All wooden furniture will be sprayed with chemical base.

TERMS & CONDITIONS:
Section One: Scope of Services:
a) To carry out pest control services for the property's common areas. The contractor shall examine the property carefully, locate areas of critical pest activity and treat them thoroughly.
b) The contractor shall perform the service items as specified:
i) Type of pest: Termite, Method: Drill & spraying water base. In the event of reinforcement within the service period, the contractor shall render additional treatment as necessary at no extra cost.
1) Rate of pest control will be based on the area (square feet).
2) Rate of pest control will be fixed after visiting the area and it may be negotiable.
3) Company will not be liable for any kind of damages arising during the work of pest control.

Section Two: Environmental, Health & Safety Clauses:
a) The contractor shall undertake to minimize the negative impact of the pest control on the environment.
b) The contractor shall make every endeavour to safeguard health and safety of people and animals in the property against any perils of using pesticides.
c) The contractor shall make every endeavour to minimize using pesticides when carrying out pest control services under this contract.`;
window.billAddItemRow = (name = 'General Pest Control Service', price = '', qty = 1, gst = 'yes') => {
  const row = document.createElement('div');
  row.className = 'form-row bill-item';
  row.innerHTML = `<div class="form-group" style="flex:2"><input class="form-control bi-name" placeholder="Service / Item name" value="${name}"></div>
    <div class="form-group"><input type="number" class="form-control bi-price" placeholder="Basic Price" value="${price}" onchange="billCalcTotal()"></div>
    <div class="form-group" style="max-width:70px"><input type="number" class="form-control bi-qty" value="${qty}" onchange="billCalcTotal()"></div>
    <div class="form-group" style="max-width:110px"><select class="form-control bi-gst" onchange="billCalcTotal()"><option value="yes" ${gst==='yes'?'selected':''}>GST Yes</option><option value="no" ${gst==='no'?'selected':''}>GST No</option></select></div>
    <div class="form-group" style="max-width:40px"><button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.bill-item').remove();billCalcTotal()">&times;</button></div>`;
  document.getElementById('bgItems').appendChild(row);
};
window.billAddLogRow = (pest = 'GENERAL PEST CONTROL SERVICE', date = '', tech = '') => {
  const row = document.createElement('div');
  row.className = 'form-row bill-log';
  row.innerHTML = `<div class="form-group" style="flex:2"><input class="form-control bl-pest" placeholder="Type of pest" value="${pest}"></div>
    <div class="form-group"><input type="date" class="form-control bl-date" value="${date}"></div>
    <div class="form-group"><input class="form-control bl-in" placeholder="In Time e.g. 12.00 p.m" value=""></div>
    <div class="form-group"><input class="form-control bl-out" placeholder="Out Time e.g. 01.00 p.m" value=""></div>
    <div class="form-group"><input class="form-control bl-tech" placeholder="Technical Expert" value="${tech}"></div>
    <div class="form-group" style="max-width:40px"><button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.bill-log').remove()">&times;</button></div>`;
  document.getElementById('bgLogs').appendChild(row);
};
window.billAdd12Rows = () => { for (let i = 0; i < 12; i++) billAddLogRow(); };
window.billFillCustomer = () => {
  const id = document.getElementById('bgCustomer').value;
  const c = (window._billCustomers || []).find(x => x.id == id);
  if (!c) return;
  document.getElementById('bgCustName').value = c.name || '';
  document.getElementById('bgCustAddress').value = [c.address, c.city].filter(Boolean).join(', ');
  document.getElementById('bgCustPhone').value = c.phone || '';
  document.getElementById('bgContactPerson').value = c.contact_person || c.name || '';
  document.getElementById('bgCustGstin').value = c.gstin || '';
};
// Dropdown options for saved customers - shows their old bill numbers so the
// right customer is easy to spot. "" option = manual entry.
window.billCustomerOptions = (selectedId) => {
  const m = window._billNoByCust || {};
  return '<option value="">-- manual entry (type details below) --</option>' + (window._billCustomers || []).map(c => {
    const bills = (m[c.id] || []).map(b => (typeof b === 'string') ? b : `${b.no}${b.date ? ' (' + fmtDate(b.date) + ')' : ''}`).join(', ');
    return `<option value="${c.id}" ${String(selectedId) === String(c.id) ? 'selected' : ''}>${c.name}${bills ? ' — bills: ' + bills : ''}</option>`;
  }).join('');
};
// Quick add of a brand-new customer from the Bill Generator (no bill number
// needed) - keeps the current bill form untouched.
window.billAddNewCustomer = () => {
  openModal('Add New Customer', `<form id="bgNewCustForm">
    <div class="form-row"><div class="form-group"><label>Name *</label><input class="form-control" name="name" required></div>
    <div class="form-group"><label>Phone</label><input class="form-control" name="phone"></div></div>
    <div class="form-group"><label>Address</label><input class="form-control" name="address"></div>
    <div class="form-row"><div class="form-group"><label>City</label><input class="form-control" name="city"></div>
    <div class="form-group"><label>Contact Person</label><input class="form-control" name="contact_person"></div></div>
    <div class="form-group"><label>GSTIN</label><input class="form-control" name="gstin"></div>
    <p style="font-size:12px;color:#64748b">No bill number needed - the customer is added to the list and selected for this bill.</p></form>`,
  `<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="billSaveNewCustomer()">Add Customer</button>`);
};
window.billSaveNewCustomer = async () => {
  const d = Object.fromEntries(new FormData(document.getElementById('bgNewCustForm')));
  const name = String(d.name || '').trim();
  if (!name) { showToast('Customer name is required', 'info'); return; }
  try {
    const c = await API.post('/customers', { name, phone: d.phone || '', address: d.address || '', city: d.city || '', contact_person: d.contact_person || '', gstin: d.gstin || '', status: 'active' });
    window._billCustomers = await API.get('/customers');
    document.getElementById('bgCustomer').innerHTML = billCustomerOptions(c.id);
    closeModal(); showToast(`Customer "${name}" added`);
    billFillCustomer();
  } catch (e) { showToast(e.message || 'Save failed', 'info'); }
};
// Pick an old/existing customer right from the manual-entry fields - opens a
// searchable list with old bill numbers + dates and fills the bill form.
window.billPickExisting = () => {
  const m = window._billNoByCust || {};
  const rows = (window._billCustomers || []).map(c => {
    const bills = (m[c.id] || []).map(b => (typeof b === 'string') ? b : `${b.no}${b.date ? ' (' + fmtDate(b.date) + ')' : ''}`).join(', ');
    return `<tr data-pick="${(c.name || '').toLowerCase()} ${(c.phone || '').toLowerCase()}"><td><strong>${c.name}</strong></td><td>${c.phone || '-'}</td><td style="font-size:11px">${bills || '<span style="color:#94a3b8">no bill</span>'}</td><td><button type="button" class="btn btn-primary btn-sm" onclick="billPickExistingSelect(${c.id})">Select</button></td></tr>`;
  }).join('');
  openModal('Pick Existing Customer', `
    <input class="form-control" id="billPickSearch" placeholder="Search by name / phone..." style="margin-bottom:8px" oninput="document.querySelectorAll('#billPickRows tr').forEach(tr=>tr.style.display=tr.getAttribute('data-pick').includes(this.value.toLowerCase())?'':'none')">
    <div class="table-container" style="max-height:340px;overflow:auto"><table><thead><tr><th>Name</th><th>Phone</th><th>Old Bills</th><th></th></tr></thead><tbody id="billPickRows">${rows || '<tr><td colspan="4" style="color:#94a3b8">No saved customers yet.</td></tr>'}</tbody></table></div>`,
  `<button class="btn btn-outline" onclick="closeModal()">Cancel</button>`);
};
window.billPickExistingSelect = (id) => {
  const sel = document.getElementById('bgCustomer');
  sel.value = id;
  billFillCustomer();
  closeModal();
  showToast('Existing customer selected - fields filled');
};
window.billCalcTotal = () => {
  const g = (id) => document.getElementById(id).value;
  let subtotal = 0, gstable = 0;
  document.querySelectorAll('#bgItems .bill-item').forEach(r => {
    const amt = Number(r.querySelector('.bi-price').value || 0) * Number(r.querySelector('.bi-qty').value || 1);
    subtotal += amt; if (r.querySelector('.bi-gst').value === 'yes') gstable += amt;
  });
  const isGst = g('bgType') === 'gst';
  const sc = isGst ? 0 : subtotal * Number(g('bgServiceCharge') || 0) / 100;
  const gstAmt = isGst ? gstable * 0.18 : 0;
  const net = subtotal + sc + gstAmt;
  document.getElementById('bgTotalBox').innerHTML = `Basic Total: <b>\u20B9${subtotal.toLocaleString('en-IN',{minimumFractionDigits:2})}</b> &nbsp;|&nbsp; ${isGst ? `SGST 9%: <b>\u20B9${(gstAmt/2).toLocaleString('en-IN',{minimumFractionDigits:2})}</b> &nbsp; CGST 9%: <b>\u20B9${(gstAmt/2).toLocaleString('en-IN',{minimumFractionDigits:2})}</b>` : `Service Charge: <b>\u20B9${sc.toLocaleString('en-IN',{minimumFractionDigits:2})}</b>`} &nbsp;|&nbsp; Net Payable: <b style="color:var(--success)">\u20B9${net.toLocaleString('en-IN',{minimumFractionDigits:2})}</b> (${typeof numberToWords === 'function' ? numberToWords(Math.round(net)) : ''} Only)`;
};
window.billCollect = () => {
  const g = (id) => document.getElementById(id).value.trim();
  const type = g('bgType');
  const items = [...document.querySelectorAll('#bgItems .bill-item')].map(r => {
    const price = Number(r.querySelector('.bi-price').value || 0);
    const qty = Number(r.querySelector('.bi-qty').value || 1);
    const gst = r.querySelector('.bi-gst').value === 'yes';
    return { name: r.querySelector('.bi-name').value.trim(), price, qty, gst, amount: price * qty };
  }).filter(i => i.name);
  const subtotal = items.reduce((a, i) => a + i.amount, 0);
  const gstable = items.filter(i => i.gst).reduce((a, i) => a + i.amount, 0);
  const scPct = type === 'gst' ? 0 : Number(g('bgServiceCharge') || 0);
  const serviceCharge = subtotal * scPct / 100;
  const gstAmt = type === 'gst' ? gstable * 0.18 : 0;
  const net = subtotal + serviceCharge + gstAmt;
  const logs = [...document.querySelectorAll('#bgLogs .bill-log')].map(r => ({
    pest: r.querySelector('.bl-pest').value.trim(), date: r.querySelector('.bl-date').value,
    in_time: r.querySelector('.bl-in').value.trim(), out_time: r.querySelector('.bl-out').value.trim(), tech: r.querySelector('.bl-tech').value.trim()
  })).filter(l => l.pest || l.date || l.tech);
  return {
    bill_type: type, bill_no: g('bgBillNo'), bill_date: g('bgBillDate'), booking_id: g('bgBookingId'),
    period: g('bgPeriod'), title: g('bgTitle'),
    customer_name: g('bgCustName'), customer_address: g('bgCustAddress'), customer_phone: g('bgCustPhone'),
    contact_person: g('bgContactPerson'), customer_gstin: g('bgCustGstin'),
    items, subtotal, service_charge_pct: scPct, service_charge: serviceCharge,
    sgst: gstAmt / 2, cgst: gstAmt / 2, gst: gstAmt, net,
    net_words: (typeof numberToWords === 'function' ? numberToWords(Math.round(net)) : '') + ' Only',
    payment_mode: g('bgPayMode'), sac_code: g('bgSac'),
    service_log_title: g('bgLogTitle'), logs, terms: g('bgTerms')
  };
};
window.billGenerate = async () => { const d = billCollect(); if (!d.customer_name) { showToast('Enter customer name first', 'info'); return; } const ok = await billPersist(d, true); if (!ok) return; window.printCustomBill(d, window._billSettings); };
window.billPdf = async () => { const d = billCollect(); if (!d.customer_name) { showToast('Enter customer name first', 'info'); return; } const ok = await billPersist(d, true); if (!ok) return; await window.downloadPdfFromHtml(window.buildCustomBillHtml(d, window._billSettings), (d.bill_no || 'bill') + '.pdf'); showToast('PDF downloaded'); };
// Shared save for the Bill Generator - used by Save Invoice AND automatically
// before Print/PDF so no bill is ever lost. First call creates the invoice,
// later calls update the same record (no duplicates).
window.billPersist = async (d, auto) => {
  try {
    let customerId = document.getElementById('bgCustomer').value;
    if (!customerId) {
      // Manual entry: first try to link an existing (old) customer with the
      // same name or phone so no duplicate is created; otherwise save the
      // typed customer into the customer list.
      const nm = String(d.customer_name || '').toLowerCase().trim();
      const ph = String(d.customer_phone || '').replace(/\D/g, '');
      const match = (window._billCustomers || []).find(x =>
        (x.name || '').toLowerCase().trim() === nm ||
        (ph.length >= 10 && String(x.phone || '').replace(/\D/g, '').slice(-10) === ph.slice(-10)));
      if (match) {
        customerId = match.id;
      } else {
        const c = await API.post('/customers', { name: d.customer_name, address: d.customer_address, phone: d.customer_phone, gstin: d.customer_gstin, contact_person: d.contact_person, status: 'active' });
        customerId = c.id;
        window._billCustomers = await API.get('/customers');
        showToast(`Customer "${d.customer_name}" saved to Customer list`);
      }
      document.getElementById('bgCustomer').innerHTML = billCustomerOptions(customerId);
    }
    const isGst = d.bill_type === 'gst';
    const payload = {
      invoice_number: d.bill_no || undefined,
      title: d.title || 'Pest Control Service',
      items: d.items.map(i => ({ description: i.name, rate: i.price, quantity: i.qty, amount: i.amount })),
      subtotal: d.subtotal, tax_rate: isGst ? 18 : 0, tax_amount: d.gst, sgst: d.sgst, cgst: d.cgst, igst: 0,
      discount: 0, total: d.net, paid_amount: 0, gst_type: isGst ? 'intra' : 'none', sac_code: d.sac_code,
      contact_person: d.contact_person, booking_id: d.booking_id, service_period: d.period,
      amount_in_words: d.net_words, terms_conditions: d.terms, status: 'sent',
      invoice_type: isGst ? 'annual' : 'standard',
      bill_extra: JSON.stringify({ logs: d.logs, payment_mode: d.payment_mode, service_log_title: d.service_log_title, bill_date: d.bill_date })
    };
    let updated = false;
    if (window._bgSavedId) {
      const cur = await API.get(`/invoices/${window._bgSavedId}`).catch(() => null);
      if (cur && cur.id) {
        payload.paid_amount = cur.paid_amount || 0; // never wipe recorded payments
        payload.status = cur.status || 'sent';
        await API.put(`/invoices/${window._bgSavedId}`, payload);
        updated = true;
      } else { window._bgSavedId = null; }
    }
    if (!updated) {
      const r = await API.post('/invoices', Object.assign({ customer_id: customerId }, payload));
      window._bgSavedId = r.id;
      // Keep the customer dropdown up to date with the new bill number + date
      const list = await API.get('/invoices');
      window._billNoByCust = {};
      (list || []).forEach(i => { if (i.customer_id) (window._billNoByCust[i.customer_id] = window._billNoByCust[i.customer_id] || []).push({ no: i.invoice_number, date: billDateOf(i) }); });
      document.getElementById('bgCustomer').innerHTML = billCustomerOptions(customerId);
    }
    const num = document.getElementById('bgBillNo').value.trim() || window._bgSavedNo || '';
    window._bgSavedNo = num;
    showToast(auto ? `Bill ${num ? num + ' ' : ''}auto-saved to Invoices` : `Invoice ${num} saved to Invoices`);
    return true;
  } catch (e) { showToast(e.message || 'Save failed', 'info'); return false; }
};
window.billSave = async () => {
  const d = billCollect();
  if (!d.customer_name) { showToast('Enter customer name first', 'info'); return; }
  await billPersist(d, false);
};
pageRenderers['bill-generator'] = async (el) => {
  const [customers, settings, invoices] = await Promise.all([API.get('/customers'), API.get('/settings'), API.get('/invoices')]);
  window._billCustomers = customers; window._billSettings = settings;
  // Old bill numbers + dates per customer (shown in the existing-customer dropdown)
  const billNoByCust = {};
  (invoices || []).forEach(i => { if (i.customer_id) (billNoByCust[i.customer_id] = billNoByCust[i.customer_id] || []).push({ no: i.invoice_number, date: billDateOf(i) }); });
  window._billNoByCust = billNoByCust;
  window._bgSavedId = null; window._bgSavedNo = ''; // fresh bill = new invoice on save
  const today = new Date().toISOString().split('T')[0];
  el.innerHTML = `
  <div class="card"><div class="card-header"><h3>Bill Details</h3></div><div class="card-body">
    <div class="form-row">
      <div class="form-group"><label>Bill Type *</label><select class="form-control" id="bgType" onchange="billCalcTotal()"><option value="gst">GST Invoice (like A11477)</option><option value="non-gst">Non-GST Bill (like APT1282)</option></select></div>
      <div class="form-group"><label>Bill No</label><input class="form-control" id="bgBillNo" placeholder="e.g. A11477 / APT1282"></div>
      <div class="form-group"><label>Bill Date</label><input type="date" class="form-control" id="bgBillDate" value="${today}"></div>
      <div class="form-group"><label>Booking Id</label><input class="form-control" id="bgBookingId" placeholder="optional"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Period (Contact / Warranty)</label><input class="form-control" id="bgPeriod" placeholder="e.g. 22.07.2026 - 21.07.2027"></div>
      <div class="form-group" style="flex:2"><label>Bill Title</label><input class="form-control" id="bgTitle" placeholder="e.g. -Annual maintenance Service (Twelve Service) 2026-27 & Bill"></div>
    </div>
  </div></div>
  <div class="card"><div class="card-header"><h3>Customer</h3></div><div class="card-body">
    <div class="form-row">
      <div class="form-group" style="flex:2"><label>Existing customer (old bill numbers shown)</label><select class="form-control" id="bgCustomer" onchange="billFillCustomer()">${billCustomerOptions()}</select></div>
      <div class="form-group" style="max-width:220px"><button type="button" class="btn btn-outline" style="margin-top:22px;width:100%" onclick="billAddNewCustomer()">+ Add New Customer</button></div>
    </div>
    <p style="font-size:12px;color:#64748b;margin-bottom:8px">Pick an existing customer to auto-fill, add a new one, or keep "manual entry" and type everything yourself below - all fields stay editable.</p>
    <div class="form-row">
      <div class="form-group"><label>Customer Name *</label><input class="form-control" id="bgCustName" placeholder="e.g. NEW PURKAIT SWEETS"></div>
      <div class="form-group"><label>Mobile No</label><input class="form-control" id="bgCustPhone"></div>
      <div class="form-group" style="max-width:230px"><label>Old customer?</label><button type="button" class="btn btn-outline btn-sm" style="width:100%" onclick="billPickExisting()">+ Add Existing Customer</button></div>
    </div>
    <div class="form-group"><label>Address</label><textarea class="form-control" id="bgCustAddress" rows="2"></textarea></div>
    <div class="form-row">
      <div class="form-group"><label>Contact Person</label><input class="form-control" id="bgContactPerson"></div>
      <div class="form-group"><label>Customer GSTIN</label><input class="form-control" id="bgCustGstin" placeholder="e.g. 19BDHPP8153N1ZQ"></div>
    </div>
  </div></div>
  <div class="card"><div class="card-header"><h3>Service / Items</h3></div><div class="card-body">
    <div id="bgItems"></div>
    <button type="button" class="btn btn-outline btn-sm" onclick="billAddItemRow()">+ Add Item</button>
    <div class="form-row" style="margin-top:12px">
      <div class="form-group" style="max-width:200px"><label>Service Charge % (non-GST only)</label><input type="number" class="form-control" id="bgServiceCharge" value="0" onchange="billCalcTotal()"></div>
      <div class="form-group" style="max-width:200px"><label>SAC Code (GST bill)</label><input class="form-control" id="bgSac" value="${settings.sac_code || '998531'}"></div>
      <div class="form-group" style="max-width:200px"><label>Payment Mode</label><select class="form-control" id="bgPayMode"><option value="cash">Cash payment done</option><option value="upi">UPI (GPay/PhonePe/Paytm)</option><option value="bank">Bank Transfer / Cheque</option></select></div>
    </div>
    <div id="bgTotalBox" style="margin-top:8px;padding:10px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;font-size:13px"></div>
    <p style="font-size:12px;color:#64748b;margin-top:6px">Bank details & company info are picked automatically from Settings.</p>
  </div></div>
  <div class="card"><div class="card-header"><h3>Service Log (optional — for annual maintenance bills)</h3></div><div class="card-body">
    <div class="form-row"><div class="form-group" style="max-width:320px"><label>Log Table Title</label><input class="form-control" id="bgLogTitle" placeholder="e.g. Annual Maintenance Service"></div>
      <div class="form-group"><button type="button" class="btn btn-outline btn-sm" style="margin-top:22px" onclick="billAddLogRow()">+ Add Service Row</button>
      <button type="button" class="btn btn-outline btn-sm" style="margin-top:22px" onclick="billAdd12Rows()">+ Add 12 Rows (AMC)</button></div></div>
    <div id="bgLogs"></div>
  </div></div>
  <div class="card"><div class="card-header"><h3>Working Process & Terms (optional — for termite bills)</h3></div><div class="card-body">
    <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('bgTerms').value=window._billTermsTermite">Insert Termite Treatment Template</button>
    <textarea class="form-control" id="bgTerms" rows="8" style="margin-top:8px" placeholder="Leave empty if not needed"></textarea>
  </div></div>
  <div style="display:flex;gap:10px;margin:16px 0">
    <button class="btn btn-primary" onclick="billGenerate()"><i class="fas fa-print"></i> Generate Print View</button>
    <button class="btn btn-success" onclick="billPdf()"><i class="fas fa-file-pdf"></i> Download PDF</button>
    <button class="btn btn-warning" onclick="billSave()"><i class="fas fa-save"></i> Save Invoice</button>
  </div>`;
  billAddItemRow();
  billCalcTotal();
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => navigateTo('dashboard'));
