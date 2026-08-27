#!/usr/bin/env node
// Build script: convierte content/articles/*.md en HTML estático V2 en articles/,
// y genera sitemap.xml + robots.txt. Sin dependencias externas (salvo resvg para OG).

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { v2Nav, v2Footer, V2_NAV_I18N, V2_FONTS } from './v2-shell.mjs';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const CONTENT_DIR = join(ROOT, 'content', 'articles');
const ARTICLES_DIR = join(ROOT, 'articles');
const SITE = 'https://rafaelmarcos.tech';
const AUTHOR = 'Rafael Marcos';
const OG_DIR = join(ROOT, 'assets', 'og');
const NEWS_FEED = join(ROOT, 'news', 'feed.json');
const PORTFOLIO_AUTOMATION = { data: { title: 'rafaelmarcos.tech — Automated Portfolio Infrastructure', category: 'Infrastructure' } };

// ---------- markdown ----------

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inline(text) {
  let s = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return s;
}

function plain(text) {
  return String(text).replace(/[*`]/g, '');
}

function renderTable(rows) {
  const parse = (row) => row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
  const data = rows.map(parse).filter((row) => !row.every((c) => /^:?-+:?$/.test(c)));
  if (!data.length) return '';
  const header = data[0];
  const body = data.slice(1);
  return `<div class="table-wrap"><table><thead><tr>${header.map((h) => `<th>${inline(h)}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function markdownToHtml(md, toc) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*$/.test(line)) { i++; continue; }
    if (line.startsWith('### ')) { out.push(`<h3>${inline(line.slice(4))}</h3>`); i++; continue; }
    if (line.startsWith('## ')) {
      const id = `sec-${(toc ? toc.length : 0) + 1}`;
      if (toc) toc.push({ id, text: plain(line.slice(3)) });
      out.push(`<h2 id="${id}">${inline(line.slice(3))}</h2>`);
      i++; continue;
    }
    if (line.startsWith('> ')) {
      const quote = [];
      while (i < lines.length && lines[i].startsWith('> ')) { quote.push(lines[i].replace(/^>\s/, '')); i++; }
      out.push(`<blockquote>${quote.map(inline).join(' ')}</blockquote>`);
      continue;
    }
    if (line.startsWith('|')) {
      const table = [];
      while (i < lines.length && lines[i].startsWith('|')) { table.push(lines[i]); i++; }
      out.push(renderTable(table));
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) { items.push(inline(lines[i].replace(/^\d+\.\s/, ''))); i++; }
      out.push(`<ol>${items.map((x) => `<li>${x}</li>`).join('')}</ol>`);
      continue;
    }
    if (/^[-*]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) { items.push(inline(lines[i].replace(/^[-*]\s/, ''))); i++; }
      out.push(`<ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>`);
      continue;
    }
    const para = [];
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !lines[i].startsWith('## ') && !lines[i].startsWith('### ') && !lines[i].startsWith('> ') && !lines[i].startsWith('|') && !/^\d+\.\s/.test(lines[i]) && !/^[-*]\s/.test(lines[i])) {
      para.push(lines[i]); i++;
    }
    out.push(`<p>${para.map(inline).join(' ')}</p>`);
  }
  return out.join('\n');
}

function parseFrontmatter(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!m) return { data: {}, body: md };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      try { data[key] = JSON.parse(value); }
      catch { data[key] = value.replace(/[\[\]"]/g, '').split(',').map((s) => s.trim()); }
    } else if (value === 'true' || value === 'false') {
      data[key] = value === 'true';
    } else {
      data[key] = value.replace(/^"|"$/g, '');
    }
  }
  return { data, body: md.slice(m[0].length) };
}

// ---------- html template ----------

function readingMinutes(body) {
  return Math.max(1, Math.round(body.split(/\s+/).length / 200));
}

function articleHtml(article, all) {
  const { data, body } = article;
  const slug = data.slug;
  const url = `${SITE}/articles/${slug}/`;
  const toc = [];
  const htmlBody = `${articleDiagram(slug)}${markdownToHtml(body, toc)}`;
  const ogImage = `${SITE}/assets/og/${slug}.png`;
  const reading = readingMinutes(body);
  const date = data.date || '2026-08-24';
  const updated = data.updated || date;
  const dateHuman = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`));
  const related = (data.related || []).map((r) => all.find((a) => a.data.slug === r)).filter(Boolean);
  const tags = (data.tags || []).length
    ? `<div class="art-tags">${(data.tags || []).map((t) => `<span>${escapeHtml(t)}</span>`).join('')}</div>`
    : '';
  const hero = data.image
    ? `\n    <figure class="art-hero"><img src="${data.image}" alt="${escapeHtml(data.title)}" width="1600" height="900" loading="eager" decoding="async" fetchpriority="high"></figure>`
    : '';
  const insight = data.humanInsight
    ? `\n    <aside class="insight" aria-label="Human insight"><span class="k">Human insight</span><p>${escapeHtml(data.humanInsight)}</p></aside>`
    : '';
  const tocHtml = toc.length >= 3
    ? `<div class="rail-card"><h3>On this page</h3><nav class="toc" aria-label="Table of contents">${toc.map((s) => `<a href="#${s.id}">${escapeHtml(s.text)}</a>`).join('')}</nav></div>`
    : '';
  const relatedHtml = related.length
    ? `<div class="rail-card"><h3>Continue reading</h3><div class="rel-list">${related.map((r) => `<a href="/articles/${r.data.slug}/">${escapeHtml(r.data.title)}</a>`).join('')}</div></div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(data.title)} — Rafael Marcos</title>
<meta name="description" content="${escapeHtml(data.description)}">
<meta name="author" content="${escapeHtml(data.author || AUTHOR)}">
<meta name="theme-color" content="#F4F5EF">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(data.title)}">
<meta property="og:description" content="${escapeHtml(data.description)}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="Rafael Marcos">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="article:published_time" content="${date}">
<meta property="article:modified_time" content="${updated}">
<meta property="article:author" content="${escapeHtml(data.author || AUTHOR)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${ogImage}">
<meta name="twitter:title" content="${escapeHtml(data.title)}">
<meta name="twitter:description" content="${escapeHtml(data.description)}">
<link rel="icon" href="/favicon.svg">
${V2_FONTS}
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BlogPosting","headline":${JSON.stringify(data.title)},"description":${JSON.stringify(data.description)},"datePublished":${JSON.stringify(date)},"dateModified":${JSON.stringify(updated)},"mainEntityOfPage":{"@type":"WebPage","@id":${JSON.stringify(url)}},"author":{"@type":"Person","name":${JSON.stringify(data.author || AUTHOR)},"url":"https://rafaelmarcos.tech/"},"publisher":{"@type":"Person","name":${JSON.stringify(data.author || AUTHOR)}}}
</script>
<link rel="stylesheet" href="/assets/v2.css">
</head>
<body>
${v2Nav('writing')}

<main id="main">
  <article class="v2-shell" lang="en">
    <nav class="art-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/articles/">Articles</a><span>/</span><span>${escapeHtml(data.category)}</span></nav>
    <header class="art-head">
      <p class="cat-chip">${escapeHtml(data.category)}</p>
      <h1>${escapeHtml(data.title)}</h1>
      <p class="art-dek">${escapeHtml(data.description)}</p>
      <div class="art-meta"><time datetime="${date}">${dateHuman}</time><span>·</span><span>${reading} min read</span><span>·</span><span>${escapeHtml(data.author || AUTHOR)}</span></div>
      ${tags}
    </header>
${hero}${insight}
    <div class="art-layout">
      <div class="prose">${htmlBody}</div>
      <aside class="art-rail">${tocHtml}${relatedHtml}</aside>
    </div>
    <section class="cta-band">
      <div>
        <h2>Need technical content that actually understands the product?</h2>
        <p>I write SEO content for SaaS, AI and automation companies — grounded in how the tech actually works.</p>
      </div>
      <a class="btn" href="/copywriting/">Technical SEO content <span class="arrow">↗</span></a>
    </section>
  </article>
</main>

${v2Footer()}
${V2_NAV_I18N}
<script src="/assets/v2.js"></script>
</body>
</html>`;
}

function articleDiagram(slug) {
  const diagrams = {
    'ai-agents-for-customer-support': ['Ticket', 'Retrieve context', 'Guardrails', 'Human handoff'],
    'ai-agents-vs-traditional-automation': ['Event', 'Rules first', 'Agent only if judgement is needed', 'Logged outcome'],
    'crm-automation-7-workflows': ['Lead or event', 'CRM rule', 'Action', 'Audit trail'],
    'what-is-saas-automation': ['Source app', 'Webhook or API', 'Workflow', 'System of record'],
  };
  const steps = diagrams[slug];
  if (!steps) return '';
  return `<figure class="diagram" aria-label="${escapeHtml(steps.join(' to '))}">${steps.map((step, index) => `<div class="diagram-step"><span class="diagram-label">${index + 1}</span>${escapeHtml(step)}</div>`).join('')}</figure>`;
}

function svgTitle(text) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    if (`${line} ${word}`.trim().length > 31 && line) { lines.push(line); line = word; }
    else line = `${line} ${word}`.trim();
  }
  if (line) lines.push(line);
  return lines.slice(0, 3).map((lineText, index) => `<tspan x="70" dy="${index ? 72 : 0}">${escapeHtml(lineText)}</tspan>`).join('');
}

function ogSvg(article) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#F2F4EE"/><circle cx="1060" cy="70" r="300" fill="#B0DFAA" opacity=".8"/><circle cx="1030" cy="560" r="290" fill="#24969B" opacity=".2"/><rect x="70" y="64" width="142" height="42" rx="21" fill="#0B0E0F"/><text x="94" y="91" fill="#F2F4EE" font-family="Arial, sans-serif" font-size="19" font-weight="700">RAFAEL MARCOS</text><text x="70" y="190" fill="#24969B" font-family="Arial, sans-serif" font-size="22" font-weight="700">${escapeHtml(article.data.category).toUpperCase()}</text><text x="70" y="275" fill="#0B0E0F" font-family="Arial, sans-serif" font-size="62" font-weight="700">${svgTitle(article.data.title)}</text></svg>`;
}

function writeOgPng(svg, filename) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  writeFileSync(filename, png);
}

function indexHtml(articles) {
  const featured = articles.find((a) => a.data.featured) || articles[0];
  const rest = articles.filter((a) => a !== featured);
  const dateFmt = (d) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${d}T12:00:00`));

  const insight = featured.data.humanInsight
    ? `<div class="feat-insight"><span class="k">Human insight</span><q>${escapeHtml(featured.data.humanInsight)}</q></div>`
    : '';

  const featCard = `<article class="feat-article">
        <div class="feat-meta"><span class="cat">${escapeHtml(featured.data.category)}</span><span>·</span><time datetime="${featured.data.date}">${dateFmt(featured.data.date)}</time><span>·</span><span>${readingMinutes(featured.body)} min read</span></div>
        <h3><a href="/articles/${featured.data.slug}/">${escapeHtml(featured.data.title)}</a></h3>
        <p class="feat-sub">${escapeHtml(featured.data.description)}</p>
        ${insight}
        <div class="feat-foot"><a class="read" href="/articles/${featured.data.slug}/">Read →</a></div>
      </article>`;

  const rows = rest.map((a) => `<div class="article-row">
          <h4><a href="/articles/${a.data.slug}/">${escapeHtml(a.data.title)}</a></h4>
          <span class="cat">${escapeHtml(a.data.category)}</span>
          <a class="go" href="/articles/${a.data.slug}/" aria-label="Read: ${escapeHtml(a.data.title)}">Read →</a>
        </div>`).join('\n');

  const itemList = articles.map((a, i) => `{"@type":"ListItem","position":${i + 1},"url":"${SITE}/articles/${a.data.slug}/"}`).join(',');
  const collectionJson = `{"@context":"https://schema.org","@type":"CollectionPage","name":"Articles — Rafael Marcos","description":"Evergreen SEO articles on AI, automation, SaaS and CRM.","url":"${SITE}/articles/","mainEntity":{"@type":"ItemList","itemListElement":[${itemList}]}}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Articles — Rafael Marcos</title>
<meta name="description" content="Evergreen SEO articles on AI, automation, SaaS, CRM and software development — written by a developer who works with these systems.">
<meta name="author" content="${AUTHOR}">
<meta name="theme-color" content="#F4F5EF">
<link rel="canonical" href="https://rafaelmarcos.tech/articles/">
<meta property="og:type" content="website">
<meta property="og:title" content="Articles — Rafael Marcos">
<meta property="og:description" content="Evergreen SEO articles on AI, automation, SaaS and CRM.">
<meta property="og:url" content="https://rafaelmarcos.tech/articles/">
<meta name="twitter:card" content="summary">
<link rel="icon" href="/favicon.svg">
${V2_FONTS}
<script type="application/ld+json">${collectionJson}</script>
<link rel="stylesheet" href="/assets/v2.css">
</head>
<body>
${v2Nav('writing')}

<main id="main">
  <div class="v2-shell">
    <header class="idx-head">
      <p class="eyebrow">Writing</p>
      <h1>Technical writing, built from real systems.</h1>
      <p class="section-copy">AI agents, automation and software engineering — the decisions behind production systems, written from the builder's side of the table.</p>
    </header>

    <section class="feat-block" aria-label="Featured article">${featCard}</section>

    <div class="article-list" style="margin-top: 2.6rem;">
${rows}
    </div>
  </div>
</main>

${v2Footer()}
${V2_NAV_I18N}
<script src="/assets/v2.js"></script>
</body>
</html>`;
}

function sitemapXml(articles) {
  const news = existsSync(NEWS_FEED) ? JSON.parse(readFileSync(NEWS_FEED, 'utf8')).articles || [] : [];
  const urls = [
    ['', '1.0', '2026-08-25'],
    ['copywriting/', '0.9', '2026-08-25'],
    ['articles/', '0.9', '2026-08-25'],
    ['news/', '0.6', '2026-08-25'],
    ['news/archive/', '0.6', '2026-08-25'],
    ['rafaops/', '0.7', '2026-08-25'],
    ['projects/portfolio-automation/', '0.8', '2026-08-25'],
    ...articles.map((a) => [`articles/${a.data.slug}/`, '0.8', a.data.updated || a.data.date]),
    ...news.map((item) => [`news/${item.slug}/`, '0.6', item.date || item.generatedAt?.slice(0, 10)]),
  ];
  const entries = urls.map(([path, prio, lastmod]) => `  <url><loc>${SITE}/${path}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>${prio}</priority></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

function robotsTxt() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`;
}

// ---------- run ----------

function main() {
  if (!existsSync(CONTENT_DIR)) {
    console.error(`No existe ${CONTENT_DIR}`);
    process.exit(1);
  }
  const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md')).sort();
  const articles = files.map((f) => {
    const raw = readFileSync(join(CONTENT_DIR, f), 'utf8');
    const { data, body } = parseFrontmatter(raw);
    const slug = data.slug || f.replace(/\.md$/, '');
    data.slug = slug;
    return { data, body };
  });

  mkdirSync(ARTICLES_DIR, { recursive: true });
  mkdirSync(OG_DIR, { recursive: true });
  const projectOg = ogSvg(PORTFOLIO_AUTOMATION);
  writeFileSync(join(OG_DIR, 'portfolio-automation.svg'), projectOg, 'utf8');
  writeOgPng(projectOg, join(OG_DIR, 'portfolio-automation.png'));
  for (const a of articles) {
    const dir = join(ARTICLES_DIR, a.data.slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), articleHtml(a, articles), 'utf8');
    const svg = ogSvg(a);
    writeFileSync(join(OG_DIR, `${a.data.slug}.svg`), svg, 'utf8');
    writeOgPng(svg, join(OG_DIR, `${a.data.slug}.png`));
  }
  writeFileSync(join(ARTICLES_DIR, 'index.html'), indexHtml(articles), 'utf8');
  writeFileSync(join(ROOT, 'sitemap.xml'), sitemapXml(articles), 'utf8');
  writeFileSync(join(ROOT, 'robots.txt'), robotsTxt(), 'utf8');

  console.log(`Generados ${articles.length} artículos + índice + sitemap.xml + robots.txt`);
  for (const a of articles) console.log(`  - /articles/${a.data.slug}/`);
}

main();
