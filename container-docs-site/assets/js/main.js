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
  document.querySelectorAll('.navlinks a').forEach(a => a.addEventListener('click', () => toggleNav(false)));
}

function formatCurrencyGel(num) {
  const f = new Intl.NumberFormat('ka-GE', { maximumFractionDigits: 0 });
  return `${f.format(Math.round(num))} ₾`;
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

// Interactive site canvas
const siteData = {
  rows: 2,
  cols: 6,
  drivewayWidthRatio: 0.12, // relative to total height
  units: Array.from({ length: 12 }, (_, i) => {
    const num = i + 1;
    return {
      id: num,
      title: `ერთეული ${num}`,
      rentable: true,
      forSale: [2, 4, 5, 8, 9, 11].includes(num),
      desc: 'ორი სართული, ავტოფარეხი, ეზო და სახურავზე ვერანდა.'
    };
  })
};

function initSiteCanvas() {
  const canvas = document.getElementById('site-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  function resize() {
    const container = canvas.parentElement;
    const widthCss = Math.min(container.clientWidth, 1100);
    const heightCss = Math.max(320, Math.round(widthCss * (19 / 58))); // aspect from plot
    canvas.width = Math.round(widthCss * dpr);
    canvas.height = Math.round(heightCss * dpr);
    canvas.style.width = widthCss + 'px';
    canvas.style.height = heightCss + 'px';
    draw();
  }

  function unitRects() {
    const W = canvas.width, H = canvas.height;
    const drivewayH = H * siteData.drivewayWidthRatio;
    const rowH = (H - drivewayH) / 2;
    const colW = W / siteData.cols;
    const pad = Math.max(4 * dpr, Math.min(colW, rowH) * 0.06);
    const rects = [];
    for (let c = 0; c < siteData.cols; c++) {
      // top row -> odd units: 1,3,5,7,9,11
      const topIdx = c * 2 + 1; // 1-based
      const bottomIdx = c * 2 + 2;
      rects.push({ id: topIdx, x: c * colW + pad, y: 0 + pad, w: colW - pad * 2, h: rowH - pad * 2 });
      rects.push({ id: bottomIdx, x: c * colW + pad, y: rowH + drivewayH + pad, w: colW - pad * 2, h: rowH - pad * 2 });
    }
    return rects.sort((a,b) => a.id - b.id);
  }

  let rectCache = [];
  let selected = null;

  function colorFor(u) {
    if (u.forSale && u.rentable) return '#8b5cf6'; // both
    if (u.forSale) return '#f59e0b';
    if (u.rentable) return '#22c55e';
    return '#64748b';
  }

  function draw() {
    rectCache = unitRects();
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);

    // Background plot area
    ctx.fillStyle = '#0f1420';
    ctx.fillRect(0,0,W,H);
    ctx.strokeStyle = '#223049';
    ctx.lineWidth = 2;
    ctx.strokeRect(1,1,W-2,H-2);

    // Driveway
    const drivewayH = H * siteData.drivewayWidthRatio;
    const rowH = (H - drivewayH) / 2;
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, rowH, W, drivewayH);

    // Units
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.max(10*dpr, W*0.012)}px sans-serif`;
    for (const r of rectCache) {
      const u = siteData.units.find(x => x.id === r.id);
      const fill = colorFor(u);
      ctx.fillStyle = fill + '33';
      ctx.strokeStyle = fill;
      ctx.lineWidth = selected?.id === u.id ? 4 : 2;
      roundRect(ctx, r.x, r.y, r.w, r.h, 10 * dpr, true, true);
      ctx.fillStyle = '#e5e7eb';
      ctx.fillText(String(u.id), r.x + r.w/2, r.y + r.h/2);
    }
  }

  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function pick(mx, my) {
    for (const r of rectCache) {
      if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) return r.id;
    }
    return null;
  }

  function updateSelected(u) {
    selected = u;
    const nameEl = document.getElementById('unit-name');
    const tagsEl = document.getElementById('unit-tags');
    const descEl = document.getElementById('unit-desc');
    const actEl = document.getElementById('unit-actions');
    if (!nameEl || !tagsEl || !descEl || !actEl) return;
    nameEl.textContent = u ? u.title : 'აირჩიეთ ერთეული';
    tagsEl.innerHTML = '';
    if (u) {
      if (u.rentable) {
        const b = document.createElement('span'); b.className = 'badge'; b.textContent = 'ქირავდება'; tagsEl.appendChild(b);
      }
      if (u.forSale) {
        const b = document.createElement('span'); b.className = 'badge'; b.textContent = 'გაყიდვაშია'; tagsEl.appendChild(b);
      }
      descEl.textContent = u.desc;
      actEl.innerHTML = '';
      if (u.rentable) {
        const a = document.createElement('a'); a.className = 'btn'; a.href = '#'; a.textContent = 'დაჯავშნა'; actEl.appendChild(a);
      }
      if (u.forSale) {
        const a = document.createElement('a'); a.className = 'btn secondary'; a.href = '#'; a.textContent = 'ყიდვა/ინვესტიცია'; actEl.appendChild(a);
      }
    } else {
      descEl.textContent = 'დააკლიკეთ სქემაზე ერთეულზე დეტალებისთვის.';
      actEl.innerHTML = '';
    }
    draw();
  }

  function applyFilters() {
    const showRent = document.getElementById('filter-rent')?.checked ?? true;
    const showSale = document.getElementById('filter-sale')?.checked ?? true;
    for (const u of siteData.units) {
      const show = (showRent && u.rentable) || (showSale && u.forSale);
      u._hidden = !show;
    }
    // Dim hidden units by temporarily toggling rentable/forSale
    draw();
  }

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * dpr;
    const my = (e.clientY - rect.top) * dpr;
    const id = pick(mx, my);
    const u = siteData.units.find(x => x.id === id);
    updateSelected(u || null);
  });
  window.addEventListener('resize', resize);
  document.getElementById('filter-rent')?.addEventListener('change', applyFilters);
  document.getElementById('filter-sale')?.addEventListener('change', applyFilters);

  resize();
  updateSelected(null);
}

window.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  bindNav();
  if (document.getElementById('calc-form')) bindCalc();
  if (document.getElementById('site-canvas')) initSiteCanvas();
});