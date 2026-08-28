// V2 chrome compartido: nav + footer idénticos a la home (index.html).
// Lo usan los builders (articles). La home lo lleva inline por ser HTML estático escrito a mano.

export function v2Nav(active) {
  const on = (key) => (active === key ? ' aria-current="page"' : '');
  return `<header class="v2-nav">
    <div class="v2-shell v2-nav-in">
      <a href="/" class="v2-brand">RafaelMarcos<em>_</em></a>
      <nav class="v2-links" aria-label="Primary navigation">
        <a href="/#systems"${on('systems')}>Systems</a>
        <a href="/articles/"${on('writing')}>Writing</a>
        <a href="/labs/">Lab</a>
        <a href="/#contact">Contact</a>
      </nav>
      <div class="v2-nav-cta">
        <a href="mailto:rafaelmarcos2604@gmail.com?subject=Project%20enquiry" class="btn btn-primary">Start a project <span class="arrow">↗</span></a>
        <button class="v2-menu-toggle" type="button" data-nav-toggle data-label-open="Open menu" data-label-close="Close menu" aria-expanded="false" aria-controls="v2-mobile-nav" aria-label="Open menu">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>
    <div id="v2-mobile-nav" class="v2-mobile" hidden>
      <a href="/#systems">Systems</a>
      <a href="/articles/">Writing</a>
      <a href="/labs/">Lab</a>
      <a href="/#contact">Contact</a>
      <div class="sep" role="presentation"></div>
      <a href="/articles/">Articles</a>
      <a href="/news/">AI Signal</a>
      <a href="/copywriting/">Copywriting</a>
    </div>
  </header>`;
}

export function v2Footer() {
  return `<footer class="v2-shell v2-footer">
    <span>© 2026 Rafael Marcos Serrano</span>
    <nav aria-label="Footer links">
      <a href="https://linkedin.com/in/rafael-marcos-serrano" target="_blank" rel="noopener">LinkedIn</a>
      <a href="https://github.com/rafamarcoss" target="_blank" rel="noopener">GitHub</a>
      <a href="/articles/">Articles</a>
      <a href="/news/">News</a>
      <a href="/copywriting/">Copywriting</a>
      <a href="/rafaops/">RafaOps</a>
      <a href="/labs/">Lab</a>
      <a href="/upwork-match/">Opportunity Match</a>
    </nav>
  </footer>`;
}

export const V2_FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400..800&display=swap" rel="stylesheet">`;
