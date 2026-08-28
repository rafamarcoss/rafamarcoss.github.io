import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const articleDirs = readdirSync('articles').filter((dir) => dir !== 'index.html' && existsSync(join('articles', dir, 'index.html')));
const newsDirs = readdirSync('news').filter((dir) => dir !== 'index.html' && dir !== 'archive' && existsSync(join('news', dir, 'index.html')));
const projectFiles = ['projects/portfolio-automation/index.html'];
const normalFiles = ['index.html', 'articles/index.html', 'copywriting/index.html', 'labs/index.html', 'news/index.html', 'news/archive/index.html', 'rafaops/index.html', ...projectFiles, ...articleDirs.map((dir) => `articles/${dir}/index.html`), ...newsDirs.map((dir) => `news/${dir}/index.html`)];

const hrefRegex = /href=["']([^"']+)["']/g;

export function internalHrefCandidates(href) {
  if (!href.startsWith('/') || href.startsWith('//')) return null;

  const clean = href.split('#')[0].split('?')[0];
  if (!clean || clean === '/') return ['index.html'];

  const rel = clean.replace(/^\//, '');
  if (rel.endsWith('/')) return [`${rel}index.html`];
  if (/\.[a-z0-9]+$/i.test(rel)) return [rel];
  return [`${rel}/index.html`, `${rel}.html`];
}

export function resolvesInternalHref(href, isFile = (file) => {
  const path = join(ROOT, file);
  return existsSync(path) && statSync(path).isFile();
}) {
  const candidates = internalHrefCandidates(href);
  return candidates === null || candidates.some(isFile);
}

export function validateSite(log = console.log) {
  let ok = true;

  for (const file of normalFiles) {
    const html = readFileSync(join(ROOT, file), 'utf8');
    const h1 = (html.match(/<h1[\s>]/g) || []).length;
    const canonical = html.includes('rel="canonical"');
    const jsonld = html.includes('application/ld+json');
    const og = html.includes('og:title');
    const desc = html.includes('name="description"');
    const v2Nav = html.includes('class="v2-nav"') && html.includes('Start a project') && html.includes('data-nav-toggle') && html.includes('aria-expanded="false"');
    const legacyNav = html.includes('data-site-nav') && html.includes('data-site-nav-i18n="services"') && html.includes('data-site-nav-i18n="cta"') && html.includes('data-site-nav-lang="en"') && html.includes('data-site-nav-toggle') && html.includes('aria-expanded="false"');
    const globalNav = (file === 'index.html' || file.startsWith('articles/') || file.startsWith('news/') || file === 'copywriting/index.html' || file === 'labs/index.html' || file === 'rafaops/index.html' || file.startsWith('projects/')) ? v2Nav : legacyNav;
    const good = h1 === 1 && canonical && jsonld && og && desc && globalNav;
    if (!good) ok = false;
    log(`${good ? 'OK  ' : 'FAIL'} h1=${h1} canonical=${canonical} jsonld=${jsonld} og=${og} desc=${desc} nav=${globalNav} | ${file}`);
  }

  const visualLab = readFileSync(join(ROOT, 'labs/visual-lab/index.html'), 'utf8');
  if (!/name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(visualLab)) {
    log('Visual Lab must remain noindex');
    ok = false;
  }

  for (const file of normalFiles) {
    const html = readFileSync(join(ROOT, file), 'utf8');
    for (const match of html.matchAll(hrefRegex)) {
      const href = match[1];
      if (!resolvesInternalHref(href)) {
        log(`BROKEN INTERNAL LINK: ${href} in ${file}`);
        ok = false;
      }
    }
  }

  log(ok ? 'Site validation passed.' : 'Site validation failed.');
  return ok;
}

if (import.meta.main) process.exit(validateSite() ? 0 : 1);
