#!/usr/bin/env node
// Build script: convierte content/articles/*.md en HTML estático SEO en articles/,
// y genera sitemap.xml + robots.txt. Sin dependencias externas.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { siteNav } from './site-nav.mjs';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const CONTENT_DIR = join(ROOT, 'content', 'articles');
const ARTICLES_DIR = join(ROOT, 'articles');
const SITE = 'https://rafaelmarcos.tech';
const AUTHOR = 'Rafael Marcos';
const OG_DIR = join(ROOT, 'assets', 'og');
const NEWS_FEED = join(ROOT, 'news', 'feed.json');
const PORTFOLIO_AUTOMATION = { data: { title: 'rafaelmarcos.tech — Automated Portfolio Infrastructure', category: 'Infrastructure' } };

const CATEGORY_COLORS = {
  'AI': 'rgba(176,223,170,.48)',
  'Automation': 'rgba(36,150,155,.30)',
  'SaaS': 'rgba(8,96,167,.22)',
  'CRM': 'rgba(198,66,64,.20)',
  'Development': 'rgba(2,52,192,.22)',
  'SEO': 'rgba(36,150,155,.30)',
  'AI Regulation': 'rgba(2,52,192,.22)',
};

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

function renderTable(rows) {
  const parse = (row) => row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
  const data = rows.map(parse).filter((row) => !row.every((c) => /^:?-+:?$/.test(c)));
  if (!data.length) return '';
  const header = data[0];
  const body = data.slice(1);
  return `<div class="table-wrap"><table><thead><tr>${header.map((h) => `<th>${inline(h)}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function markdownToHtml(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*$/.test(line)) { i++; continue; }
    if (line.startsWith('### ')) { out.push(`<h3>${inline(line.slice(4))}</h3>`); i++; continue; }
    if (line.startsWith('## ')) { out.push(`<h2>${inline(line.slice(3))}</h2>`); i++; continue; }
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
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !lines[i].startsWith('## ') && !lines[i].startsWith('### ') && !lines[i].startsWith('|') && !/^\d+\.\s/.test(lines[i]) && !/^[-*]\s/.test(lines[i])) {
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
    } else {
      data[key] = value.replace(/^"|"$/g, '');
    }
  }
  return { data, body: md.slice(m[0].length) };
}

// ---------- html template ----------

const CSS = `
*,*::before,*::after{box-sizing:border-box}*{margin:0;padding:0}
:root{--paper:#F2F4EE;--card:rgba(255,255,249,.76);--ink:#0B0E0F;--muted:rgba(11,14,15,.64);--line:rgba(11,14,15,.13);--mint:#B0DFAA;--teal:#24969B;--blue:#0860A7;--royal:#0234C0;--coral:#C64240;--display:'Plus Jakarta Sans',sans-serif;--body:'Inter',sans-serif}
html{scroll-behavior:smooth;background:var(--paper);overflow-x:hidden}
body{min-height:100vh;overflow-x:hidden;color:var(--ink);font-family:var(--body);line-height:1.75;background:radial-gradient(circle at 12% 2%,rgba(176,223,170,.7),transparent 28rem),radial-gradient(circle at 90% 22%,rgba(36,150,155,.2),transparent 32rem),var(--paper)}
a{color:inherit;text-decoration:none}.shell{width:min(1120px,calc(100% - 2rem));margin-inline:auto}
nav{position:sticky;top:.7rem;z-index:10;display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-top:.7rem;padding:.55rem .7rem;border:1px solid var(--line);border-radius:999px;background:rgba(255,255,249,.82);backdrop-filter:blur(18px);box-shadow:0 16px 54px rgba(8,96,167,.09)}
.brand{display:flex;align-items:center;gap:.65rem;font-family:var(--display);font-weight:800;letter-spacing:-.04em}.mark{width:42px;height:42px;display:grid;place-items:center;border-radius:50%;color:#fff;background:linear-gradient(135deg,var(--ink),var(--blue),var(--teal))}
.nav-links{display:flex;align-items:center;gap:.4rem;list-style:none}.nav-links a{display:inline-flex;align-items:center;min-height:38px;padding:0 .8rem;border-radius:999px;color:rgba(11,14,15,.62);font:700 .72rem 'JetBrains Mono',monospace;letter-spacing:.09em;text-transform:uppercase}.nav-links a:hover,.nav-links a.on{color:var(--ink);background:rgba(255,255,249,.72)}
.back{display:inline-flex;align-items:center;padding:0 1rem;min-height:38px;border:1px solid var(--line);border-radius:999px;font:700 .72rem 'JetBrains Mono',monospace}
main{padding:2.5rem 0 6rem}.crumbs{display:flex;flex-wrap:wrap;gap:.4rem;align-items:center;color:var(--muted);font:700 .72rem 'JetBrains Mono',monospace}.crumbs a{color:var(--teal)}.crumbs span{opacity:.5}
.article-head{max-width:820px;padding:3rem 0 2rem}.chip{display:inline-flex;padding:.35rem .7rem;border:1px solid var(--line);border-radius:999px;font:700 .68rem 'JetBrains Mono',monospace;text-transform:uppercase}.chip.cat{background:var(--cat,rgba(176,223,170,.48));border-color:transparent}.article-head h1{margin-top:1.1rem;font:800 clamp(2.4rem,6vw,4.2rem)/1.02 var(--display);letter-spacing:-.05em}.dek{margin-top:1.2rem;color:var(--muted);font-size:clamp(1.1rem,2vw,1.3rem);line-height:1.6}.meta{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:1.5rem;color:var(--muted);font:700 .72rem 'JetBrains Mono',monospace}
.article-hero{margin:2rem 0 1rem;border-radius:24px;overflow:hidden;border:1px solid var(--line)}
.article-hero img{display:block;width:100%;height:auto}
.article-layout{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:3rem;align-items:start}.body{max-width:760px;font-size:1.06rem}.body h2{margin:3rem 0 1rem;font:700 clamp(1.7rem,3.5vw,2.5rem)/1.05 var(--display);letter-spacing:-.04em}.body h3{margin:2.2rem 0 .7rem;font:700 1.25rem var(--display);letter-spacing:-.02em}.body p{margin:1rem 0;color:rgba(11,14,15,.86)}.body ul,.body ol{margin:1rem 0 1rem 1.4rem;display:grid;gap:.5rem}.body li{color:rgba(11,14,15,.86)}.body li::marker{color:var(--teal);font-weight:700}.body code{font:600 .9em 'JetBrains Mono',monospace;background:rgba(11,14,15,.06);padding:.1rem .4rem;border-radius:6px}.body a{color:var(--blue);text-decoration:underline;text-underline-offset:2px}.body a:hover{color:var(--teal)}.body strong{font-weight:700}
.table-wrap{margin:1.5rem 0;overflow-x:auto;border:1px solid var(--line);border-radius:16px}.table-wrap table{width:100%;border-collapse:collapse;font-size:.92rem}.table-wrap th{text-align:left;padding:.8rem 1rem;font:700 .72rem 'JetBrains Mono',monospace;text-transform:uppercase;background:rgba(11,14,15,.04)}.table-wrap td{padding:.8rem 1rem;border-top:1px solid var(--line);vertical-align:top;color:rgba(11,14,15,.86)}
.diagram{display:grid;grid-template-columns:repeat(3,1fr);gap:.6rem;margin:1.6rem 0;padding:1rem;border:1px solid var(--line);border-radius:20px;background:rgba(255,255,249,.62)}.diagram-step{position:relative;min-height:92px;padding:1rem;border-radius:14px;background:rgba(11,14,15,.045);font:700 .8rem/1.35 'JetBrains Mono',monospace}.diagram-step:not(:last-child)::after{content:'→';position:absolute;right:-.55rem;top:50%;z-index:1;color:var(--teal);font:800 1.1rem var(--display)}.diagram-label{display:block;margin-bottom:.4rem;color:var(--teal);font-size:.62rem;letter-spacing:.08em;text-transform:uppercase}@media(max-width:640px){.diagram{grid-template-columns:1fr}.diagram-step:not(:last-child)::after{content:'↓';right:50%;top:auto;bottom:-.85rem}}
aside{position:sticky;top:6rem;display:grid;gap:1rem}.aside-card{padding:1.3rem;border:1px solid var(--line);border-radius:22px;background:var(--card)}.aside-card h3{font:700 .9rem 'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--teal)}.aside-card ul{list-style:none;display:grid;gap:.7rem;margin-top:1rem}.aside-card a{font-weight:650;line-height:1.35}.aside-card a:hover{color:var(--blue)}
.cta{margin-top:3rem;padding:2rem;border-radius:28px;color:#fff;background:linear-gradient(145deg,var(--ink),#0D3140,var(--blue))}.cta h2{font:700 1.6rem var(--display);letter-spacing:-.02em}.cta p{margin-top:.6rem;color:rgba(255,255,255,.72)}.cta a{display:inline-block;margin-top:1rem;padding:.7rem 1.2rem;border-radius:999px;background:var(--paper);color:var(--ink);font:700 .8rem 'JetBrains Mono',monospace}
footer{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;padding:2rem 0;color:var(--muted);border-top:1px solid var(--line)}
@media(max-width:900px){.article-layout{grid-template-columns:1fr}aside{position:static}}
@media(max-width:640px){.nav-links{display:none}.shell{width:min(100% - 1rem,1120px)}.body{font-size:1rem}.article-head h1{font-size:2.3rem}}
`;

function articleHtml(article, all) {
  const { data, body } = article;
  const slug = data.slug;
  const url = `${SITE}/articles/${slug}/`;
  const htmlBody = `${articleDiagram(slug)}${markdownToHtml(body)}`;
  const ogImage = `${SITE}/assets/og/${slug}.png`;
  const reading = Math.max(1, Math.round(body.split(/\s+/).length / 200));
  const catColor = CATEGORY_COLORS[data.category] || CATEGORY_COLORS.AI;
  const date = data.date || '2026-08-24';
  const updated = data.updated || date;
  const dateHuman = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`));
  const related = (data.related || []).map((r) => all.find((a) => a.data.slug === r)).filter(Boolean);
  const tags = (data.tags || []).map((t) => `<span class="chip">${escapeHtml(t)}</span>`).join('');
  const relatedHtml = related.length
    ? `<aside><div class="aside-card"><h3>Related</h3><ul>${related.map((r) => `<li><a href="/articles/${r.data.slug}/">${escapeHtml(r.data.title)}</a></li>`).join('')}</ul></div></aside>`
    : '<aside></aside>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(data.title)} — Rafael Marcos</title>
<meta name="description" content="${escapeHtml(data.description)}">
<meta name="author" content="${escapeHtml(data.author || AUTHOR)}">
<meta name="theme-color" content="#F2F4EE">
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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300..900&family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400..800&display=swap" rel="stylesheet">
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BlogPosting","headline":${JSON.stringify(data.title)},"description":${JSON.stringify(data.description)},"datePublished":${JSON.stringify(date)},"dateModified":${JSON.stringify(updated)},"mainEntityOfPage":{"@type":"WebPage","@id":${JSON.stringify(url)}},"author":{"@type":"Person","name":${JSON.stringify(data.author || AUTHOR)},"url":"https://rafaelmarcos.tech/"},"publisher":{"@type":"Person","name":${JSON.stringify(data.author || AUTHOR)}}}
</script>
<style>${CSS}</style>
<link rel="stylesheet" href="/assets/site-nav.css">
</head>
<body>
${siteNav('articles')}

<main class="shell">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/articles/">Articles</a><span>/</span><span>${escapeHtml(data.category)}</span></nav>
  <article>
    <header class="article-head">
      <span class="chip cat" style="--cat:${catColor}">${escapeHtml(data.category)}</span>
      <h1>${escapeHtml(data.title)}</h1>
      <p class="dek">${escapeHtml(data.description)}</p>
      <div class="meta"><time datetime="${date}">${dateHuman}</time><span>·</span><span>${reading} min read</span><span>·</span><span>${escapeHtml(data.author || AUTHOR)}</span></div>
      <div class="meta">${tags}</div>
    </header>
${data.image ? `    <figure class="article-hero"><img src="${data.image}" alt="${escapeHtml(data.title)}" width="1600" height="900" loading="eager" decoding="async"></figure>` : ''}
    <div class="article-layout">
      <div class="body">${htmlBody}</div>
      ${relatedHtml}
    </div>
    <section class="cta"><h2>Need this kind of content for your product?</h2><p>I write SEO articles for SaaS, AI and automation companies — grounded in how the tech actually works.</p><a href="/copywriting/">See my copywriting service →</a></section>
  </article>
</main>

<footer class="shell"><span>© 2026 Rafael Marcos Serrano</span><a href="mailto:rafaelmarcos2604@gmail.com">rafaelmarcos2604@gmail.com</a></footer>
<script src="/assets/site-nav.js"></script>
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
  const cards = articles.map((a) => {
    const { data, body } = a;
    const reading = Math.max(1, Math.round(body.split(/\s+/).length / 200));
    const catColor = CATEGORY_COLORS[data.category] || CATEGORY_COLORS.AI;
    const date = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${data.date}T12:00:00`));
    return `<a class="card" href="/articles/${data.slug}/">
      <div class="card-top"><span class="chip cat" style="--cat:${catColor}">${escapeHtml(data.category)}</span><time>${date}</time></div>
      <h2>${escapeHtml(data.title)}</h2>
      <p>${escapeHtml(data.description)}</p>
      <span class="card-meta">${reading} min read →</span>
    </a>`;
  }).join('');

  const itemList = articles.map((a, i) => `{"@type":"ListItem","position":${i + 1},"url":"${SITE}/articles/${a.data.slug}/"}`).join(',');
  const collectionJson = `{"@context":"https://schema.org","@type":"CollectionPage","name":"Articles — Rafael Marcos","description":"Evergreen SEO articles on AI, automation, SaaS and CRM.","url":"${SITE}/articles/","mainEntity":{"@type":"ItemList","itemListElement":[${itemList}]}}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Articles — Rafael Marcos</title>
<meta name="description" content="Evergreen SEO articles on AI, automation, SaaS, CRM and software development — written by a developer who works with these systems.">
<meta name="theme-color" content="#F2F4EE">
<link rel="canonical" href="https://rafaelmarcos.tech/articles/">
<meta property="og:type" content="website">
<meta property="og:title" content="Articles — Rafael Marcos">
<meta property="og:description" content="Evergreen SEO articles on AI, automation, SaaS and CRM.">
<meta property="og:url" content="https://rafaelmarcos.tech/articles/">
<meta name="twitter:card" content="summary">
<link rel="icon" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300..900&family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400..800&display=swap" rel="stylesheet">
<script type="application/ld+json">${collectionJson}</script>
<style>${CSS}
main{padding-top:4rem}.head{padding:2rem 0 3rem}.head .eyebrow{color:var(--teal);font:700 .75rem 'JetBrains Mono',monospace;letter-spacing:.11em;text-transform:uppercase}.head h1{margin-top:1rem;font:800 clamp(3rem,7vw,5rem)/.95 var(--display);letter-spacing:-.06em}.head p{max-width:60ch;margin-top:1.2rem;color:var(--muted);font-size:1.15rem}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.card{display:flex;flex-direction:column;justify-content:space-between;min-height:260px;padding:1.7rem;border:1px solid var(--line);border-radius:30px;background:var(--card);box-shadow:0 20px 62px rgba(11,14,15,.06);transition:.25s}.card:hover{transform:translateY(-5px);border-color:rgba(36,150,155,.35)}.card-top{display:flex;justify-content:space-between;align-items:center;gap:1rem;color:var(--muted);font:700 .7rem 'JetBrains Mono',monospace}.card h2{margin-top:1rem;font:700 clamp(1.4rem,2.6vw,2rem)/1.05 var(--display);letter-spacing:-.04em}.card p{margin-top:.9rem;color:var(--muted)}.card-meta{margin-top:1.4rem;color:var(--teal);font:700 .75rem 'JetBrains Mono',monospace}
@media(max-width:800px){.grid{grid-template-columns:1fr}}
</style>
<link rel="stylesheet" href="/assets/site-nav.css">
</head>
<body>
${siteNav('articles')}

<main class="shell">
  <header class="head">
    <p class="eyebrow">Rafael Marcos · Evergreen SEO</p>
    <h1>Articles</h1>
    <p>Long-form, technical content on AI, automation, SaaS and CRM — written by a developer who builds with these systems, not just writes about them.</p>
  </header>
  <section class="grid">${cards}</section>
</main>

<footer class="shell"><span>© 2026 Rafael Marcos Serrano</span><a href="mailto:rafaelmarcos2604@gmail.com">rafaelmarcos2604@gmail.com</a></footer>
<script src="/assets/site-nav.js"></script>
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
