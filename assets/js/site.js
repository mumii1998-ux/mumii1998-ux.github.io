/* Technikhilfe Bern – Interaktionen (Vanilla JS, ohne Abhängigkeiten) */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Theme-Umschalter (Hell/Dunkel), Auswahl wird gemerkt */
  var toggle = d.querySelector('.theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      toggle.setAttribute('aria-pressed', next === 'dark');
    });
    toggle.setAttribute('aria-pressed', root.getAttribute('data-theme') === 'dark');
  }

  /* Mobile Navigation */
  var menuBtn = d.querySelector('.menu-toggle'), nav = d.getElementById('nav');
  function closeMenu() {
    if (!nav) return;
    nav.classList.remove('is-open');
    if (menuBtn) { menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.querySelector('use').setAttribute('href', '#i-menu'); }
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', open);
      menuBtn.querySelector('use').setAttribute('href', open ? '#i-x' : '#i-menu');
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  var links = [].slice.call(d.querySelectorAll('.nav a[href^="#"]'));

  /* Header-Schatten + Lesefortschritt */
  var header = d.querySelector('.site-header'), bar = d.querySelector('.progress'), ticking = false;
  function onScroll() {
    var y = window.scrollY || 0;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (y < 200) links.forEach(function (l) { l.classList.remove('is-active'); });
    if (bar) {
      var h = root.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0) + ')';
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* Einblend-Animationen */
  var reveals = [].slice.call(d.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* Aktiver Menüpunkt beim Scrollen */
  if (links.length && 'IntersectionObserver' in window) {
    var map = {};
    links.forEach(function (a) { var s = d.querySelector(a.getAttribute('href')); if (s) map[s.id] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          links.forEach(function (l) { l.classList.remove('is-active'); });
          map[en.target.id].classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { spy.observe(d.getElementById(id)); });
  }

  /* Lichteffekt auf Karten (folgt der Maus) */
  d.querySelectorAll('.card').forEach(function (c) {
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* Preisrechner: CHF 70.–/Std., Mindestverrechnung 30 Min., Anfahrt CHF 10.– */
  var calc = d.getElementById('calc');
  if (calc) {
    var HOURLY = 70, TRAVEL = 10;
    var range = calc.querySelector('#hours'), visit = calc.querySelector('#visit');
    var outTime = calc.querySelector('#out-time'), outWork = calc.querySelector('#out-work');
    var outTravel = calc.querySelector('#out-travel'), outTotal = calc.querySelector('#out-total');
    var fmt = function (n) { return 'CHF ' + n.toFixed(2).replace(/\.00$/, '.–').replace(/(\.\d)0$/, '$1'); };
    var label = function (h) {
      var min = Math.round(h * 60), hh = Math.floor(min / 60), mm = min % 60, parts = [];
      if (hh) parts.push(hh + ' Std.');
      if (mm) parts.push(mm + ' Min.');
      return parts.join(' ');
    };
    var update = function () {
      var h = parseFloat(range.value), work = h * HOURLY, travel = visit.checked ? TRAVEL : 0;
      range.style.setProperty('--fill', ((h - range.min) / (range.max - range.min) * 100) + '%');
      outTime.textContent = label(h);
      outWork.textContent = fmt(work);
      outTravel.textContent = fmt(travel);
      outTotal.textContent = fmt(work + travel);
    };
    range.addEventListener('input', update);
    visit.addEventListener('change', update);
    update();
  }

  /* FAQ: immer nur ein Eintrag offen */
  var faq = [].slice.call(d.querySelectorAll('.faq details'));
  faq.forEach(function (el) {
    el.addEventListener('toggle', function () {
      if (el.open) faq.forEach(function (o) { if (o !== el) o.open = false; });
    });
  });

  /* Kontaktformular: Absenden ohne Seitenwechsel (Formspree AJAX) */
  var form = d.getElementById('contact-form');
  if (form && window.fetch) {
    var status = form.querySelector('.form-status'), btn = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var label = btn.innerHTML;
      btn.disabled = true; btn.textContent = 'Wird gesendet …';
      status.className = 'form-status'; status.textContent = '';
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error('http');
          form.reset();
          status.className = 'form-status ok';
          status.textContent = 'Vielen Dank! Ihre Nachricht ist angekommen. Ich melde mich so rasch wie möglich bei Ihnen.';
        })
        .catch(function () {
          status.className = 'form-status err';
          status.textContent = 'Das hat leider nicht geklappt. Bitte rufen Sie mich direkt an: 076 834 02 24.';
        })
        .then(function () { btn.disabled = false; btn.innerHTML = label; });
    });
  }

  /* Jahr im Footer */
  d.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
