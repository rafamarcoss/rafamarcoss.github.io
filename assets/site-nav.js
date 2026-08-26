(() => {
  const labels = { es: { services: 'Servicios', work: 'Proyectos', articles: 'Artículos', news: 'Noticias', copywriting: 'Copywriting', about: 'Sobre mí', contact: 'Contacto', cta: 'Hablemos ↗', menu: 'Abrir menú', close: 'Cerrar menú' }, en: { services: 'Services', work: 'Work', articles: 'Articles', news: 'News', copywriting: 'Copywriting', about: 'About', contact: 'Contact', cta: "Let's talk ↗", menu: 'Open menu', close: 'Close menu' } };
  const getLanguage = () => localStorage.getItem('site-language') === 'en' ? 'en' : 'es';
  const apply = lang => {
    const selected = lang === 'en' ? 'en' : 'es';
    document.documentElement.lang = selected;
    document.querySelectorAll('[data-site-nav-i18n]').forEach(node => { node.textContent = labels[selected][node.dataset.siteNavI18n] || node.textContent; });
    document.querySelectorAll('[data-site-nav-lang]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.siteNavLang === selected)));
    document.querySelectorAll('[data-site-nav-toggle]').forEach(button => { const open = button.getAttribute('aria-expanded') === 'true'; button.setAttribute('aria-label', labels[selected][open ? 'close' : 'menu']); });
    return selected;
  };
  const setLanguage = lang => { const selected = apply(lang); localStorage.setItem('site-language', selected); window.dispatchEvent(new CustomEvent('site-language-change', { detail: { lang: selected } })); };
  window.SiteNav = { getLanguage, setLanguage };
  apply(getLanguage());
  document.querySelectorAll('[data-site-nav-lang]').forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.siteNavLang)));
  document.querySelectorAll('[data-site-nav]').forEach(nav => {
    const toggle = nav.querySelector('[data-site-nav-toggle]'); const menu = nav.querySelector('[data-site-mobile-menu]');
    if (!toggle || !menu) return;
    const close = () => { toggle.setAttribute('aria-expanded', 'false'); menu.dataset.open = 'false'; apply(getLanguage()); };
    toggle.addEventListener('click', () => { const open = toggle.getAttribute('aria-expanded') !== 'true'; toggle.setAttribute('aria-expanded', String(open)); menu.dataset.open = String(open); apply(getLanguage()); });
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  });
})();
