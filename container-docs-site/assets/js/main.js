function setActiveNav() {
  const here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navlinks a').forEach(a => {
    const href = a.getAttribute('href');
    if ((here === '' && href.endsWith('index.html')) || href.endsWith(here)) {
      a.classList.add('active');
    }
  });
}

function formatCurrencyGel(num) {
  const f = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
  return `₾${f.format(Math.round(num))}`;
}

function recalc() {
  const units = parseFloat(document.getElementById('units').value) || 0;
  const adr = parseFloat(document.getElementById('adr').value) || 0;
  const occ = (parseFloat(document.getElementById('occ').value) || 0) / 100;
  const opex = (parseFloat(document.getElementById('opex').value) || 0) / 100;
  const mgmt = (parseFloat(document.getElementById('mgmt').value) || 0) / 100;
  const capexLow = parseFloat(document.getElementById('capexLow').value) || 0;
  const capexHigh = parseFloat(document.getElementById('capexHigh').value) || 0;
  const ownership = (parseFloat(document.getElementById('ownership').value) || 0) / 100;

  const nights = 365;
  const gross = units * adr * nights * occ;
  const opexAmt = gross * opex;
  const mgmtAmt = gross * mgmt;
  const net = gross - opexAmt - mgmtAmt;
  const capexMid = (capexLow + capexHigh) / 2;
  const roi = capexMid > 0 ? (net / capexMid) : 0;
  const monthlyNet = net / 12;
  const monthlyPayout = monthlyNet * ownership;

  document.getElementById('out-gross').textContent = formatCurrencyGel(gross);
  document.getElementById('out-opex').textContent = formatCurrencyGel(opexAmt);
  document.getElementById('out-mgmt').textContent = formatCurrencyGel(mgmtAmt);
  document.getElementById('out-net').textContent = formatCurrencyGel(net);
  document.getElementById('out-roi').textContent = `${(roi * 100).toFixed(1)}%`;
  document.getElementById('out-monthly').textContent = formatCurrencyGel(monthlyNet);
  document.getElementById('out-own-monthly').textContent = formatCurrencyGel(monthlyPayout);
}

function bindCalc() {
  const ids = ['units','adr','occ','opex','mgmt','capexLow','capexHigh','ownership'];
  ids.forEach(id => document.getElementById(id)?.addEventListener('input', recalc));
  recalc();
}

window.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  if (document.getElementById('calc-form')) bindCalc();
});