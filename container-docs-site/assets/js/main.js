function setActiveNav() {
  const here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navlinks a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href.endsWith(here)) a.classList.add('active');
  });
}

function toggleNav(open) {
  const body = document.body;
  if (typeof open === 'boolean') {
    body.classList.toggle('nav-open', open);
  } else {
    body.classList.toggle('nav-open');
  }
  const btn = document.querySelector('.nav-toggle');
  if (btn) btn.setAttribute('aria-expanded', body.classList.contains('nav-open'));
}

function bindNav() {
  const btn = document.querySelector('.nav-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => toggleNav());
  // Close on link click (mobile)
  document.querySelectorAll('.navlinks a').forEach(a => a.addEventListener('click', () => toggleNav(false)));
}

function formatCurrencyGel(num) {
  const f = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
  return `₾${f.format(Math.round(num))}`;
}

function recalc() {
  const q = id => document.getElementById(id);
  const units = parseFloat(q('units')?.value) || 0;
  const adr = parseFloat(q('adr')?.value) || 0;
  const occ = (parseFloat(q('occ')?.value) || 0) / 100;
  const opex = (parseFloat(q('opex')?.value) || 0) / 100;
  const mgmt = (parseFloat(q('mgmt')?.value) || 0) / 100;
  const capexLow = parseFloat(q('capexLow')?.value) || 0;
  const capexHigh = parseFloat(q('capexHigh')?.value) || 0;
  const ownership = (parseFloat(q('ownership')?.value) || 0) / 100;

  const nights = 365;
  const gross = units * adr * nights * occ;
  const opexAmt = gross * opex;
  const mgmtAmt = gross * mgmt;
  const net = gross - opexAmt - mgmtAmt;
  const capexMid = (capexLow + capexHigh) / 2;
  const roi = capexMid > 0 ? (net / capexMid) : 0;
  const monthlyNet = net / 12;
  const monthlyPayout = monthlyNet * ownership;

  const put = (id, txt) => { const el = q(id); if (el) el.textContent = txt; };
  put('out-gross', formatCurrencyGel(gross));
  put('out-opex', formatCurrencyGel(opexAmt));
  put('out-mgmt', formatCurrencyGel(mgmtAmt));
  put('out-net', formatCurrencyGel(net));
  put('out-roi', `${(roi * 100).toFixed(1)}%`);
  put('out-monthly', formatCurrencyGel(monthlyNet));
  put('out-own-monthly', formatCurrencyGel(monthlyPayout));
}

function bindCalc() {
  const ids = ['units','adr','occ','opex','mgmt','capexLow','capexHigh','ownership'];
  ids.forEach(id => document.getElementById(id)?.addEventListener('input', recalc));
  recalc();
}

window.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  bindNav();
  if (document.getElementById('calc-form')) bindCalc();
});