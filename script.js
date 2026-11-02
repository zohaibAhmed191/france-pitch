// =========================================================
// Fondéo — scripts de la page d'accueil (JavaScript natif, sans bibliothèque)
// =========================================================
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

  // Stockage sécurisé (peut être indisponible en navigation privée)
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignoré */ } }
  };

  const fmtNum = new Intl.NumberFormat('fr-FR');
  const fmtEUR = (n) => fmtNum.format(n) + ' €';

  // ---------- Année dynamique ----------
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  // ---------- Thème clair / sombre ----------
  const themeBtn = $('#theme');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const dark = document.documentElement.getAttribute('data-theme') === 'dark';
      const next = dark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      store.set('fondeo-theme', next);
    });
  }

  // ---------- Défilement : progression, en-tête, bouton retour, barre mobile ----------
  const header = $('#header');
  const progress = $('#progress');
  const toTop = $('#toTop');
  const mobileBar = $('#mobileBar');
  let contactVisible = false;
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.setProperty('--scroll', max > 0 ? (y / max).toFixed(4) : 0);
    header.classList.toggle('scrolled', y > 10);
    toTop.classList.toggle('show', y > 900);
    mobileBar.classList.toggle('show', y > 640 && !contactVisible);
    updateTimeline();
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  const contactSection = $('#contact');
  if (contactSection && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { contactVisible = e.isIntersecting; onScroll(); }, { threshold: 0.15 })
      .observe(contactSection);
  }

  // ---------- Menu mobile ----------
  const burger = $('#burger');
  const menu = $('#menu');
  const closeMenu = () => {
    menu.classList.remove('open');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  };
  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
  });
  $$('#menu a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  // ---------- Lien actif dans le menu ----------
  const navLinks = $$('#menu a');
  const sections = navLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => spy.observe(s));
  }

  // ---------- Apparition progressive ----------
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el, i) => {
      el.style.transitionDelay = (i % 4) * 90 + 'ms';
      io.observe(el);
    });
  } else {
    reveals.forEach(el => el.classList.add('in'));
  }

  // ---------- Compteurs animés ----------
  function animateCount(el) {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = fmtNum.format(target) + suffix; return; }
    const duration = 1500, start = performance.now();
    const tick = (now) => {
      const p = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmtNum.format(Math.round(target * eased)) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { animateCount(e.target); co.unobserve(e.target); } });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach(el => co.observe(el));
  } else {
    $$('[data-count]').forEach(animateCount);
  }

  // ---------- Mot qui change dans le titre ----------
  const rot = $('#rot');
  if (rot && !reduceMotion) {
    const words = rot.dataset.words.split('|');
    let idx = 0;
    setInterval(() => {
      rot.classList.add('out');
      setTimeout(() => {
        idx = (idx + 1) % words.length;
        rot.textContent = words[idx];
        rot.classList.remove('out');
      }, 360);
    }, 2800);
  }

  // ---------- Effet 3D léger sur le visuel du hero ----------
  const tilt = $('#tilt');
  if (tilt && finePointer && !reduceMotion) {
    const host = tilt.parentElement;
    host.addEventListener('pointermove', (e) => {
      const r = host.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = `rotateY(${(x * 8).toFixed(2)}deg) rotateX(${(-y * 8).toFixed(2)}deg)`;
    });
    host.addEventListener('pointerleave', () => { tilt.style.transform = ''; });
  }

  // ---------- Effet projecteur sous la souris ----------
  if (finePointer) {
    $$('.spot').forEach(el => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  // ---------- Boutons magnétiques ----------
  if (finePointer && !reduceMotion) {
    $$('.magnetic').forEach(btn => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.18;
        const y = (e.clientY - r.top - r.height / 2) * 0.28;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  // ---------- Filtre des services ----------
  const tabs = $$('.tab');
  const cards = $$('#services-grid .service');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.toggle('active', t === tab));
      const f = tab.dataset.filter;
      cards.forEach(c => {
        const show = f === 'all' || c.dataset.cat === f;
        c.classList.toggle('hide', !show);
        c.classList.remove('pop');
        if (show) { void c.offsetWidth; c.classList.add('pop'); }
      });
    });
  });

  // ---------- Timeline du processus ----------
  const timeline = $('#timeline');
  const steps = $$('.step', timeline);
  function updateTimeline() {
    if (!timeline) return;
    const r = timeline.getBoundingClientRect();
    const vh = window.innerHeight;
    const line = vh * 0.6;
    const p = clamp((line - r.top) / r.height, 0, 1);
    timeline.style.setProperty('--p', p.toFixed(3));
    steps.forEach(s => {
      const top = s.getBoundingClientRect().top;
      s.classList.toggle('on', top < line);
    });
  }

  // ---------- Estimateur de budget ----------
  const BASE = {
    vitrine: { label: 'Site vitrine',       min: 1800, max: 3500,  weeks: 3 },
    web:     { label: 'Application web',    min: 6000, max: 15000, weeks: 10 },
    ecom:    { label: 'E-commerce',         min: 4500, max: 12000, weeks: 8 },
    mobile:  { label: 'Application mobile', min: 8000, max: 20000, weeks: 12 },
    design:  { label: 'Design UI/UX',       min: 1500, max: 4000,  weeks: 3 }
  };
  const pagesInput = $('#est-pages');
  const pagesOut = $('#est-pages-out');
  const minEl = $('#est-min');
  const maxEl = $('#est-max');
  const delayEl = $('#est-delay');
  const urgent = $('#est-urgent');
  let shown = { min: 0, max: 0 };
  let current = null;
  let raf;

  function compute() {
    const type = ($('input[name="type"]:checked') || {}).value || 'vitrine';
    const base = BASE[type];
    const pages = +pagesInput.value;
    const factor = 0.75 + pages * 0.05;
    const optSum = $$('.opt input:checked').reduce((s, i) => s + parseFloat(i.value), 0);
    const round = (n) => Math.round(n / 100) * 100;
    const min = round(base.min * factor * (1 + optSum));
    const max = round(base.max * factor * (1 + optSum));
    let weeks = base.weeks * (0.7 + 0.06 * pages);
    if (urgent.checked) weeks *= 0.7;
    const w1 = Math.max(1, Math.round(weeks * 0.85));
    const w2 = Math.max(w1 + 1, Math.round(weeks * 1.2));
    return { type, base, pages, min, max, delay: `${w1} à ${w2} semaines`,
             options: $$('.opt input:checked').map(i => i.dataset.label) };
  }

  function tween(target) {
    cancelAnimationFrame(raf);
    const from = { ...shown };
    const start = performance.now();
    const dur = reduceMotion ? 0 : 550;
    const step = (now) => {
      const p = dur ? clamp((now - start) / dur, 0, 1) : 1;
      const e = 1 - Math.pow(1 - p, 3);
      shown.min = Math.round(from.min + (target.min - from.min) * e);
      shown.max = Math.round(from.max + (target.max - from.max) * e);
      minEl.textContent = fmtEUR(shown.min);
      maxEl.textContent = fmtEUR(shown.max);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  function updateEstimate() {
    current = compute();
    const fill = ((current.pages - 1) / 29) * 100;
    pagesInput.style.setProperty('--fill', fill + '%');
    pagesOut.textContent = current.pages + (current.pages > 1 ? ' pages / écrans' : ' page / écran');
    delayEl.textContent = current.delay;
    tween(current);
  }
  $$('#estimateur input').forEach(i => i.addEventListener('input', updateEstimate));
  updateEstimate();

  // Pré-remplit le formulaire de contact depuis l'estimation
  const SERVICE_MAP = {
    vitrine: 'Site vitrine', web: 'Application web', ecom: 'E-commerce',
    mobile: 'Application mobile', design: 'Design UI/UX'
  };
  $('#est-cta').addEventListener('click', () => {
    const c = current || compute();
    const service = $('#f-service');
    const budget = $('#f-budget');
    const message = $('#f-message');
    service.value = SERVICE_MAP[c.type];
    const mid = (c.min + c.max) / 2;
    const bands = ['Moins de 3 000 €', '3 000 – 8 000 €', '8 000 – 20 000 €', '20 000 – 50 000 €', 'Plus de 50 000 €'];
    budget.value = mid < 3000 ? bands[0] : mid < 8000 ? bands[1] : mid < 20000 ? bands[2] : mid < 50000 ? bands[3] : bands[4];
    message.value = `Projet : ${c.base.label} (${c.pages} pages / écrans).` +
      (c.options.length ? `\nOptions : ${c.options.join(', ')}.` : '') +
      `\nEstimation : ${fmtEUR(c.min)} à ${fmtEUR(c.max)} HT, délai ${c.delay}.`;
  });

  // ---------- Carrousel d'avis ----------
  const slides = $$('#slider .slide');
  const dotsBox = $('#dots');
  const slidesBox = $('#slider .slides');
  let sIdx = 0, sTimer;
  slides.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Avis ' + (i + 1));
    b.addEventListener('click', () => { show(i); restart(); });
    dotsBox.appendChild(b);
  });
  const dots = $$('button', dotsBox);
  function show(i) {
    sIdx = (i + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('active', k === sIdx));
    dots.forEach((d, k) => d.classList.toggle('active', k === sIdx));
  }
  function restart() {
    clearInterval(sTimer);
    if (!reduceMotion) sTimer = setInterval(() => show(sIdx + 1), 6500);
  }
  $('#prev').addEventListener('click', () => { show(sIdx - 1); restart(); });
  $('#next').addEventListener('click', () => { show(sIdx + 1); restart(); });
  $('#slider').addEventListener('mouseenter', () => clearInterval(sTimer));
  $('#slider').addEventListener('mouseleave', restart);
  // Balayage tactile
  let sx = null;
  slidesBox.addEventListener('pointerdown', (e) => { sx = e.clientX; });
  slidesBox.addEventListener('pointerup', (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx;
    if (Math.abs(dx) > 40) { show(sIdx + (dx < 0 ? 1 : -1)); restart(); }
    sx = null;
  });
  show(0);
  restart();

  // ---------- FAQ : une seule réponse ouverte à la fois ----------
  const details = $$('.faq details');
  details.forEach(d => d.addEventListener('toggle', () => {
    if (d.open) details.forEach(o => { if (o !== d) o.open = false; });
  }));

  // ---------- Formulaire de contact ----------
  const form = $('#form');
  const msg = $('#formMsg');
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true, first = null;
    $$('[required]', form).forEach(f => {
      let valid;
      if (f.type === 'checkbox') valid = f.checked;
      else if (f.type === 'email') valid = emailRe.test(f.value.trim());
      else valid = f.value.trim() !== '';
      f.classList.toggle('invalid', !valid);
      if (!valid) { ok = false; first = first || f; }
    });
    msg.classList.toggle('error', !ok);
    if (!ok) {
      msg.textContent = 'Merci de compléter les champs obligatoires (*).';
      if (first) first.focus();
      return;
    }
    // TODO : envoyer les données (Formspree, EmailJS, votre API…) avant d'afficher le succès.
    msg.textContent = '✓ Merci ! Votre demande a bien été envoyée. Nous vous répondons sous 24 heures.';
    form.classList.add('sent');
    form.reset();
    setTimeout(() => form.classList.remove('sent'), 600);
  });
  $$('[required]', form).forEach(f => {
    const clear = () => f.classList.remove('invalid');
    f.addEventListener('input', clear);
    f.addEventListener('change', clear);
  });

  // ---------- Newsletter ----------
  const news = $('#news');
  const newsMsg = $('#newsMsg');
  news.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('input', news);
    if (emailRe.test(input.value.trim())) {
      // TODO : brancher votre service d'e-mailing.
      newsMsg.style.color = '#2ee59d';
      newsMsg.textContent = 'Merci, vous êtes inscrit·e !';
      input.value = '';
    } else {
      newsMsg.style.color = '#ff8a7a';
      newsMsg.textContent = 'Merci de saisir une adresse e-mail valide.';
    }
  });

  // ---------- Bandeau cookies (RGPD) ----------
  const cookie = $('#cookie');
  function closeCookie(choice) { store.set('fondeo-cookies', choice); cookie.hidden = true; }
  if (!store.get('fondeo-cookies')) setTimeout(() => { cookie.hidden = false; }, 1400);
  $('#cookie-yes').addEventListener('click', () => closeCookie('accepted'));
  $('#cookie-no').addEventListener('click', () => closeCookie('refused'));
  $('#cookie-settings').addEventListener('click', (e) => { e.preventDefault(); cookie.hidden = false; });

  onScroll();
})();
