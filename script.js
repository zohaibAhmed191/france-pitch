// ===== Fondéo — scripts de la page d'accueil (JavaScript natif, sans bibliothèque) =====
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  // Année dynamique dans le pied de page
  $('#year').textContent = new Date().getFullYear();

  // En-tête : ombre au défilement
  const header = $('#header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Menu mobile
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

  // Apparition progressive des blocs
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach((el, i) => {
    el.style.transitionDelay = (i % 3) * 90 + 'ms';
    revealObserver.observe(el);
  });

  // Compteurs animés
  const fmt = new Intl.NumberFormat('fr-FR');
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = +el.dataset.count;
      const suffix = el.dataset.suffix || '';
      const duration = 1400;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt.format(Math.round(target * eased)) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countObserver.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => countObserver.observe(el));

  // Carrousel d'avis clients
  const slides = $$('#slider .slide');
  const dotsBox = $('#dots');
  let current = 0, timer;
  slides.forEach((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', 'Avis ' + (i + 1));
    b.addEventListener('click', () => { show(i); restart(); });
    dotsBox.appendChild(b);
  });
  const dots = $$('button', dotsBox);
  function show(i) {
    current = (i + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('active', k === current));
    dots.forEach((d, k) => d.classList.toggle('active', k === current));
  }
  function restart() { clearInterval(timer); timer = setInterval(() => show(current + 1), 6000); }
  show(0);
  restart();

  // Formulaire de contact (validation côté client)
  const form = $('#form');
  const msg = $('#formMsg');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    $$('[required]', form).forEach(f => {
      const valid = f.type === 'email'
        ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim())
        : f.value.trim() !== '';
      f.classList.toggle('invalid', !valid);
      if (!valid) ok = false;
    });
    msg.classList.toggle('error', !ok);
    if (!ok) {
      msg.textContent = 'Merci de remplir les champs obligatoires (*).';
      return;
    }
    // TODO : envoyer les données à votre backend, à Formspree, EmailJS, etc.
    msg.textContent = 'Merci ! Votre demande a bien été envoyée. Nous vous répondons sous 24 heures.';
    form.reset();
  });
  $$('[required]', form).forEach(f =>
    f.addEventListener('input', () => f.classList.remove('invalid'))
  );
})();
