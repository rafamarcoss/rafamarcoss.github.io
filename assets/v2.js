/* rafaelmarcos.tech — V2 foundation interactions. No dependencies. */
(() => {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---- i18n (page provides window.V2_I18N = { meta: {title, description}, en: {key: html} }) ---- */
  const dict = window.V2_I18N && window.V2_I18N.en ? window.V2_I18N.en : null;
  const nodes = Array.from(document.querySelectorAll('[data-i18n]'));
  nodes.forEach(el => { el.dataset.es = el.innerHTML; });

  /* ES metadata captured once from the document — no duplicated strings */
  const descMeta = document.querySelector('meta[name="description"]');
  const metaEs = { title: document.title, description: descMeta ? descMeta.content : '' };
  const metaEn = window.V2_I18N && window.V2_I18N.meta ? window.V2_I18N.meta : null;

  const applyLanguage = (lang) => {
    const target = lang === 'en' ? 'en' : 'es';
    document.documentElement.lang = target;
    nodes.forEach(el => {
      const key = el.dataset.i18n;
      el.innerHTML = (target === 'en' && dict && dict[key]) ? dict[key] : el.dataset.es;
    });
    document.querySelectorAll('[data-lang]').forEach(btn =>
      btn.setAttribute('aria-pressed', String(btn.dataset.lang === target)));
    const m = target === 'en' ? metaEn : metaEs;
    if (m && m.title) document.title = m.title;
    if (descMeta && m && m.description) descMeta.setAttribute('content', m.description);
    try { localStorage.setItem('site-language', target); } catch (e) { /* private mode */ }
  };

  document.querySelectorAll('[data-lang]').forEach(btn =>
    btn.addEventListener('click', () => applyLanguage(btn.dataset.lang)));
  let initialLang = 'es';
  try { initialLang = localStorage.getItem('site-language') || 'es'; } catch (e) { /* private mode */ }
  applyLanguage(initialLang);

  /* ---- reveal on scroll ---- */
  const revealEls = Array.from(document.querySelectorAll('.reveal'));
  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('in-view'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(el => io.observe(el));
  }

  /* ---- mobile nav (focus-aware) ---- */
  const toggle = document.querySelector('[data-nav-toggle]');
  const panel = document.getElementById('v2-mobile-nav');
  let lastTrigger = null;

  const closeNav = ({ restoreFocus = false } = {}) => {
    if (!toggle || !panel) return;
    if (panel.hidden && !panel.classList.contains('open')) return;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', toggle.dataset.labelOpen || 'Abrir menú');
    panel.classList.remove('open');
    window.setTimeout(() => { if (!panel.classList.contains('open')) panel.hidden = true; }, 160);
    if (restoreFocus && lastTrigger instanceof HTMLElement) lastTrigger.focus({ preventScroll: true });
  };
  const openNav = () => {
    if (!toggle || !panel) return;
    lastTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add('open'));
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', toggle.dataset.labelClose || 'Cerrar menú');
  };

  if (toggle && panel) {
    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      isOpen ? closeNav({ restoreFocus: true }) : openNav();
    });
    panel.querySelectorAll('a').forEach(a => a.addEventListener('click', () => closeNav()));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav({ restoreFocus: true }); });
    document.addEventListener('pointerdown', (e) => {
      if (panel.hidden) return;
      if (panel.contains(e.target) || toggle.contains(e.target)) return;
      closeNav();
    });
    window.matchMedia('(min-width: 821px)').addEventListener('change', (e) => {
      if (e.matches) closeNav();
    });
  }

  /* ---- expandable system cards ---- */
  document.querySelectorAll('.sys-head').forEach(head => {
    head.addEventListener('click', () => {
      const card = head.closest('.sys-card');
      const open = head.getAttribute('aria-expanded') === 'true';
      head.setAttribute('aria-expanded', String(!open));
      card.classList.toggle('open', !open);
    });
  });

  /* ---- RafaOps current status (only used when the page requests it) ---- */
  const rafaopsStatus = document.querySelector('[data-rafaops-status]');
  if (rafaopsStatus) {
    fetch('/rafaops/status.json')
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => {
        rafaopsStatus.textContent = data.health === 'healthy' ? 'Estado actual: healthy' : 'Estado actual: requiere atención';
      })
      .catch(() => { rafaopsStatus.textContent = 'Estado actual no disponible'; });
  }
})();
