function setActiveNav() {
  const here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navlinks a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href.endsWith(here)) a.classList.add('active');
  });
}

function toggleNav(open) {
  const body = document.body;
  if (typeof open === 'boolean') body.classList.toggle('nav-open', open);
  else body.classList.toggle('nav-open');
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

// Investment availability canvas (no rental)
const siteData = {
  rows: 2,
  cols: 6,
  drivewayWidthRatio: 0.12,
  units: Array.from({ length: 12 }, (_, i) => {
    const num = i + 1;
    const availMap = {1: 100,2: 40,3: 0,4: 60,5: 25,6: 0,7: 80,8: 50,9: 10,10: 0,11: 35,12: 100};
    const p = availMap[num] ?? 0;
    return {
      id: num,
      title: `ერთეული ${num}`,
      availablePercent: p,
      desc: 'ორი სართული, ავტოფარეხი, კერძო ეზო და სახურავის ვერანდა. ფრაქციული მფლობელობა SPV-ის მეშვეობით.'
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
    const heightCss = Math.max(340, Math.round(widthCss * (19 / 58)));
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
      const topIdx = c * 2 + 1;
      const bottomIdx = c * 2 + 2;
      rects.push({ id: topIdx, x: c * colW + pad, y: 0 + pad, w: colW - pad * 2, h: rowH - pad * 2 });
      rects.push({ id: bottomIdx, x: c * colW + pad, y: rowH + drivewayH + pad, w: colW - pad * 2, h: rowH - pad * 2 });
    }
    return rects.sort((a,b) => a.id - b.id);
  }

  let rectCache = [];
  let selected = null;

  function colorForPercent(pct) {
    if (pct <= 0) return '#64748b'; // sold out
    if (pct < 25) return '#f97316'; // low
    if (pct < 60) return '#f59e0b'; // medium
    return '#22c55e'; // high
  }

  function draw() {
    rectCache = unitRects();
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);

    // Background and border
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

    // Units with availability bar
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.max(10*dpr, W*0.012)}px sans-serif`;
    for (const r of rectCache) {
      const u = siteData.units.find(x => x.id === r.id);
      const col = colorForPercent(u.availablePercent);
      ctx.fillStyle = col + '33';
      ctx.strokeStyle = col;
      ctx.lineWidth = selected?.id === u.id ? 4 : 2;
      roundRect(ctx, r.x, r.y, r.w, r.h, 10 * dpr, true, true);
      // ID label
      ctx.fillStyle = '#e5e7eb';
      ctx.fillText(String(u.id), r.x + r.w/2, r.y + r.h/2);
      // Availability bar at bottom
      const barPad = 6 * dpr;
      const barH = 10 * dpr;
      const barW = r.w - barPad * 2;
      ctx.fillStyle = '#0b1222';
      roundRect(ctx, r.x + barPad, r.y + r.h - barH - barPad, barW, barH, 4*dpr, true, false);
      ctx.fillStyle = col;
      roundRect(ctx, r.x + barPad, r.y + r.h - barH - barPad, barW * (u.availablePercent/100), barH, 4*dpr, true, false);
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
      const b = document.createElement('span'); b.className = 'badge'; b.textContent = u.availablePercent > 0 ? `ხელმისაწვდომია ${u.availablePercent}%` : 'გაყიდულია'; tagsEl.appendChild(b);
      descEl.textContent = u.desc;
      actEl.innerHTML = '';
      if (u.availablePercent > 0) {
        const a = document.createElement('a'); a.className = 'btn'; a.href = 'mailto:invest@example.com?subject=ინვესტიცია — ერთეული ' + encodeURIComponent(u.id); a.textContent = 'ინვესტიციის განაცხადი'; actEl.appendChild(a);
        const b2 = document.createElement('a'); b2.className = 'btn secondary'; b2.href = '/assets/downloads/pitch_deck.pptx'; b2.textContent = 'ინვესტორის პაკეტი'; actEl.appendChild(b2);
      }
    } else {
      descEl.textContent = 'დააკლიკეთ სქემაზე ერთეულზე დეტალებისთვის.';
      actEl.innerHTML = '';
    }
    draw();
  }

  function applyFilters() {
    const onlyAvail = document.getElementById('filter-available')?.checked ?? false;
    const W = canvas.width, H = canvas.height;
    // Redraw with dimming
    draw();
    if (onlyAvail) {
      const rects = rectCache;
      for (const r of rects) {
        const u = siteData.units.find(x => x.id === r.id);
        if (!u || u.availablePercent <= 0) {
          ctx.fillStyle = 'rgba(0,0,0,0.45)';
          roundRect(ctx, r.x, r.y, r.w, r.h, 10 * dpr, true, false);
        }
      }
    }
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
  document.getElementById('filter-available')?.addEventListener('change', applyFilters);

  resize();
  updateSelected(null);
}

window.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  bindNav();
  if (document.getElementById('calc-form')) bindCalc();
  if (document.getElementById('site-canvas')) initSiteCanvas();
});