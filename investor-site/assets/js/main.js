function setActiveNav() {
  const here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navlinks a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href.endsWith(here)) a.classList.add('active');
  });
}
function toggleNav(open){ const b=document.body; if(typeof open==='boolean') b.classList.toggle('nav-open',open); else b.classList.toggle('nav-open'); const btn=document.querySelector('.nav-toggle'); if(btn) btn.setAttribute('aria-expanded', b.classList.contains('nav-open')); }
function bindNav(){ const btn=document.querySelector('.nav-toggle'); if(!btn) return; btn.addEventListener('click',()=>toggleNav()); document.querySelectorAll('.navlinks a').forEach(a=>a.addEventListener('click',()=>toggleNav(false))); }
window.addEventListener('DOMContentLoaded', ()=>{ setActiveNav(); bindNav(); });