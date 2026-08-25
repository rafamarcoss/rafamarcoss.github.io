#!/usr/bin/env node
// Convierte news/feed.json en páginas estáticas indexables. Sin dependencias.

import { mkdir, readFile, writeFile } from 'node:fs/promises';

const SITE = 'https://rafaelmarcos.tech';
const FEED = new URL('../news/feed.json', import.meta.url);
const NEWS = new URL('../news/', import.meta.url);

function escapeHtml(value = '') {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function dateHuman(date) {
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeZone: 'Europe/Madrid' }).format(new Date(`${date}T12:00:00`));
}

function layout({ title, description, canonical, body, schema }) {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)} — AI Signal</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta name="twitter:card" content="summary">
  <script type="application/ld+json">${schema}</script>
  <style>body{max-width:760px;margin:0 auto;padding:32px 20px;background:#f2f4ee;color:#0b0e0f;font:18px/1.65 Inter,system-ui,sans-serif}a{color:#0860a7}nav{display:flex;gap:16px;font-weight:700;font-size:14px}h1{font-size:clamp(2.2rem,7vw,4.4rem);line-height:1.02;letter-spacing:-.05em;margin:48px 0 16px}h2{margin-top:42px;line-height:1.15}.dek,.meta{color:#52606a}.dek{font-size:1.25rem}.meta{font-size:.9rem}.takeaways, .sources{padding:20px 24px;background:#fff;border-radius:18px}.sources li{margin:.6rem 0}footer{margin-top:50px;padding-top:24px;border-top:1px solid #cbd5d0;color:#52606a;font-size:.9rem}</style>
</head>
<body>
  <nav><a href="/">Rafael Marcos</a><a href="/news/">AI Signal</a><a href="/news/archive/">Archivo</a></nav>
  ${body}
  <footer>AI Signal · briefing editorial generado a partir de fuentes enlazadas.</footer>
</body>
</html>`;
}

function articlePage(article) {
  const content = article.content.es;
  const url = `${SITE}/news/${article.slug}/`;
  const sections = content.sections.map((section) => `<section><h2>${escapeHtml(section.heading)}</h2><p>${escapeHtml(section.body)}</p></section>`).join('');
  const takeaways = content.takeaways.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  const sources = article.sources.map((source) => `<li><a href="${escapeHtml(source.url)}" rel="nofollow noopener">${escapeHtml(source.title)}</a> <small>(${escapeHtml(source.category)})</small></li>`).join('');
  const schema = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'NewsArticle', headline: content.title,
    description: content.dek, datePublished: article.date, dateModified: article.generatedAt || article.date,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url }, author: { '@type': 'Person', name: 'Rafael Marcos' },
    publisher: { '@type': 'Person', name: 'Rafael Marcos' },
  });
  return layout({ title: content.title, description: content.dek, canonical: url, schema, body: `<article><header><p class="meta">${dateHuman(article.date)} · ${article.readingMinutes} min de lectura</p><h1>${escapeHtml(content.title)}</h1><p class="dek">${escapeHtml(content.dek)}</p></header><p>${escapeHtml(content.intro)}</p>${sections}<section class="takeaways"><h2>Ideas clave</h2><ol>${takeaways}</ol></section><p>${escapeHtml(content.closing)}</p><section class="sources"><h2>Fuentes</h2><ul>${sources}</ul></section></article>` });
}

function archivePage(articles) {
  const cards = articles.map((article) => `<article><p class="meta">${dateHuman(article.date)} · ${article.readingMinutes} min</p><h2><a href="/news/${article.slug}/">${escapeHtml(article.content.es.title)}</a></h2><p>${escapeHtml(article.content.es.dek)}</p></article>`).join('');
  const url = `${SITE}/news/archive/`;
  return layout({ title: 'Archivo AI Signal', description: 'Ediciones de AI Signal sobre inteligencia artificial, negocio, regulación y trabajo.', canonical: url, schema: JSON.stringify({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Archivo AI Signal', url }), body: `<header><h1>Archivo AI Signal</h1><p class="dek">Ediciones estáticas y enlazables del briefing.</p></header>${cards}` });
}

export async function buildAiSignalPages() {
  const feed = JSON.parse(await readFile(FEED, 'utf8'));
  const articles = feed.articles || [];
  for (const article of articles) {
    const dir = new URL(`../news/${article.slug}/`, import.meta.url);
    await mkdir(dir, { recursive: true });
    await writeFile(new URL('index.html', dir), articlePage(article), 'utf8');
  }
  const archive = new URL('../news/archive/', import.meta.url);
  await mkdir(archive, { recursive: true });
  await writeFile(new URL('index.html', archive), archivePage(articles), 'utf8');
  return articles.length;
}

if (import.meta.main) {
  const count = await buildAiSignalPages();
  console.log(`Generadas ${count} ediciones estáticas de AI Signal + archivo`);
}
