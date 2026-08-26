const items = [
  ['services', '/#services'], ['work', '/#projects'], ['articles', '/articles/'], ['news', '/news/'], ['copywriting', '/copywriting/'], ['about', '/#about'], ['contact', '/#contact'],
];

export function siteNav(active = '') {
  const links = items.map(([key, href]) => `<a href="${href}" data-site-nav-i18n="${key}"${key === active ? ' aria-current="page"' : ''}>${{ services:'Servicios',work:'Proyectos',articles:'Artículos',news:'Noticias',copywriting:'Copywriting',about:'Sobre mí',contact:'Contacto' }[key]}</a>`).join('');
  return `<nav class="site-nav" data-site-nav aria-label="Primary navigation"><a class="site-brand" href="/"><span class="site-brand-mark">RM</span><span>Rafael Marcos</span></a><div class="site-nav-links">${links}</div><div class="site-nav-controls"><div class="site-lang" role="group" aria-label="Language selector"><button type="button" data-site-nav-lang="es" aria-pressed="true">ES</button><button type="button" data-site-nav-lang="en" aria-pressed="false">EN</button></div><a class="site-nav-cta" href="/#contact" data-site-nav-i18n="cta">Hablemos ↗</a><button class="site-mobile-toggle" type="button" data-site-nav-toggle aria-expanded="false" aria-controls="site-mobile-menu" aria-label="Abrir menú">☰</button></div><div class="site-mobile-menu" id="site-mobile-menu" data-site-mobile-menu data-open="false"><div class="site-mobile-links">${links}</div><a class="site-nav-cta" href="/#contact" data-site-nav-i18n="cta">Hablemos ↗</a></div></nav>`;
}
