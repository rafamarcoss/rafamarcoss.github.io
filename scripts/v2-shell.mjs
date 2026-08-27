// V2 chrome compartido: nav + footer idénticos a la home (index.html).
// Lo usan los builders (articles). La home lo lleva inline por ser HTML estático escrito a mano.

export function v2Nav(active) {
  const on = (key) => (active === key ? ' aria-current="page"' : '');
  return `<header class="v2-nav">
    <div class="v2-shell v2-nav-in">
      <a href="/" class="v2-brand">RafaelMarcos<em>_</em></a>
      <nav class="v2-links" aria-label="Navegación principal">
        <a href="/#systems"${on('systems')} data-i18n="navSystems">Systems</a>
        <a href="/articles/"${on('writing')} data-i18n="navWriting">Writing</a>
        <a href="/labs/" data-i18n="navLab">Lab</a>
        <a href="/#contact" data-i18n="navContact">Contact</a>
      </nav>
      <div class="v2-nav-cta">
        <div class="lang-switch" role="group" aria-label="Selector de idioma">
          <button type="button" data-lang="es" aria-pressed="true">ES</button>
          <button type="button" data-lang="en" aria-pressed="false">EN</button>
        </div>
        <a href="mailto:rafaelmarcos2604@gmail.com?subject=Consulta%20de%20proyecto" class="btn btn-primary" data-i18n="navCta">Start a project <span class="arrow">↗</span></a>
        <button class="v2-menu-toggle" type="button" data-nav-toggle data-label-open="Abrir menú" data-label-close="Cerrar menú" aria-expanded="false" aria-controls="v2-mobile-nav" aria-label="Abrir menú">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>
    <div id="v2-mobile-nav" class="v2-mobile" hidden>
      <a href="/#systems" data-i18n="navSystems">Systems</a>
      <a href="/articles/" data-i18n="navWriting">Writing</a>
      <a href="/labs/" data-i18n="navLab">Lab</a>
      <a href="/#contact" data-i18n="navContact">Contact</a>
      <div class="sep" role="presentation"></div>
      <a href="/articles/" data-i18n="navArticles">Artículos</a>
      <a href="/news/" data-i18n="navNews">AI Signal · Noticias</a>
      <a href="/copywriting/" data-i18n="navCopywriting">Copywriting</a>
    </div>
  </header>`;
}

export function v2Footer() {
  return `<footer class="v2-shell v2-footer">
    <span>© 2026 Rafael Marcos Serrano</span>
    <nav aria-label="Enlaces de pie">
      <a href="https://linkedin.com/in/rafael-marcos-serrano" target="_blank" rel="noopener">LinkedIn</a>
      <a href="https://github.com/rafamarcoss" target="_blank" rel="noopener">GitHub</a>
      <a href="/articles/" data-i18n="fArticles">Artículos</a>
      <a href="/news/" data-i18n="fNews">News</a>
      <a href="/copywriting/">Copywriting</a>
      <a href="/rafaops/">RafaOps</a>
      <a href="/labs/" data-i18n="fLab">Lab</a>
      <a href="/upwork-match/" data-i18n="fMatch">Opportunity Match</a>
    </nav>
  </footer>`;
}

// Diccionario EN mínimo para páginas sin traducción propia (solo chrome de nav).
// El contenido de los artículos permanece en inglés; el selector no simula traducciones.
export const V2_NAV_I18N = `<script>
window.V2_I18N = {
  en: {
    navSystems: 'Systems', navWriting: 'Writing', navLab: 'Lab', navContact: 'Contact',
    navCta: 'Start a project <span class="arrow">↗</span>',
    navArticles: 'Articles', navNews: 'AI Signal · News', navCopywriting: 'Copywriting',
    fArticles: 'Articles', fNews: 'News', fLab: 'Lab', fMatch: 'Opportunity Match'
  }
};
</script>`;

export const V2_FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400..800&display=swap" rel="stylesheet">`;
