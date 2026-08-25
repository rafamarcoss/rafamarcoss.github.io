import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

const articleDirs = readdirSync('articles').filter((d) => d !== 'index.html' && existsSync(join('articles', d, 'index.html')));
const newsDirs = readdirSync('news').filter((d) => d !== 'index.html' && d !== 'archive' && existsSync(join('news', d, 'index.html')));
const projectFiles = ['projects/portfolio-automation/index.html'];
const normalFiles = ['index.html', 'articles/index.html', 'copywriting/index.html', 'news/index.html', 'news/archive/index.html', 'rafaops/index.html', ...projectFiles, ...articleDirs.map((d) => `articles/${d}/index.html`), ...newsDirs.map((d) => `news/${d}/index.html`)];
const files = normalFiles;

let ok = true;
for (const f of files) {
  const html = readFileSync(f, 'utf8');
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  const canonical = html.includes('rel="canonical"');
  const jsonld = html.includes('application/ld+json');
  const og = html.includes('og:title');
  const desc = html.includes('name="description"');
  const globalNav = f === 'index.html'
    ? html.includes('navServices') && html.includes('navCta') && html.includes('data-lang="en"') && html.includes('mobile-menu-toggle') && html.includes('aria-expanded="false"')
    : html.includes('data-site-nav') && html.includes('data-site-nav-i18n="services"') && html.includes('data-site-nav-i18n="cta"') && html.includes('data-site-nav-lang="en"') && html.includes('data-site-nav-toggle') && html.includes('aria-expanded="false"');
  const good = h1 === 1 && canonical && jsonld && og && desc && globalNav;
  if (!good) ok = false;
  console.log(`${good ? 'OK  ' : 'FAIL'} h1=${h1} canonical=${canonical} jsonld=${jsonld} og=${og} desc=${desc} nav=${globalNav} | ${f}`);
}

const lab = readFileSync('labs/visual-lab/index.html', 'utf8');
if (!lab.includes('noindex, nofollow')) { ok = false; console.log('FAIL Visual Lab must remain noindex, nofollow'); }

// check internal links resolve
console.log('\n=== enlaces internos rotos ===');
const targetDirs = new Set(['articles', 'copywriting', 'news', 'rafaops', 'upwork-match', 'fpconnect', 'serranomotor', 'assets']);
function checkHref(href, from) {
  if (!href.startsWith('/') || href.startsWith('//')) return;
  const clean = href.split('#')[0].split('?')[0];
  if (!clean || clean === '/') return;
  const rel = clean.replace(/^\//, '');
  const parts = rel.split('/');
  const first = parts[0];
  const candidates = [rel, rel.endsWith('/') ? rel + 'index.html' : rel + '/index.html', rel + '.html'];
  const found = candidates.some((c) => existsSync(join(ROOT, c)));
  if (!found) console.log(`  BROKEN ${href}  (from ${from})`);
}

for (const f of normalFiles) {
  const html = readFileSync(f, 'utf8');
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  for (const h of hrefs) checkHref(h, f);
}

console.log(ok ? '\nTODAS LAS PÁGINAS OK' : '\nHAY PÁGINAS CON PROBLEMAS');
process.exit(ok ? 0 : 1);
