#!/usr/bin/env node
// Builds the AI Signal archive from news/feed.json. Generated pages stay static and indexable.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { v2Footer, v2Nav, V2_FONTS } from './v2-shell.mjs';

const SITE = 'https://rafaelmarcos.tech';
const FEED = new URL('../news/feed.json', import.meta.url);

const categoryLabels = {
  'IA General': 'AI',
  'Trabajo y Negocio': 'Work & business',
  'Finanzas e Inversiones': 'Finance & investment',
  'Legal IA': 'AI & law',
  'Educación IA': 'AI & education',
};

function escapeHtml(value = '') {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function safeUrl(value = '') {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

function dateHuman(date) {
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'Europe/Madrid' }).format(new Date(`${date}T12:00:00`));
}

function contentFor(article) {
  return article.content?.en || article.content?.es || null;
}

function categoryLabel(category) {
  return categoryLabels[category] || category;
}

function prose(value) {
  return String(value || '').split(/\n{2,}/).filter(Boolean).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('');
}

function layout({ title, description, canonical, schema, type = 'website', body }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} | Rafael Marcos</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="${type}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta name="twitter:card" content="summary">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  ${V2_FONTS}
  <link rel="stylesheet" href="/assets/v2.css">
</head>
<body>
  <a class="skip-link" href="#main-content">Skip to content</a>
  ${v2Nav('news')}
  <main id="main-content">${body}</main>
  ${v2Footer()}
  <script src="/assets/v2.js"></script>
</body>
</html>`;
}

function articlePage(article) {
  const content = contentFor(article);
  if (!content) throw new Error(`Missing readable content for ${article.slug}`);
  const url = `${SITE}/news/${article.slug}/`;
  const sections = content.sections.map((section) => `<section><h2>${escapeHtml(section.heading)}</h2>${prose(section.body)}</section>`).join('');
  const takeaways = content.takeaways.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  const sources = article.sources.map((source) => {
    const sourceUrl = safeUrl(source.url);
    const title = escapeHtml(source.title);
    const label = escapeHtml(categoryLabel(source.category));
    return `<li>${sourceUrl ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">${title}</a>` : title}<span>${label}</span></li>`;
  }).join('');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: content.title,
    description: content.dek,
    datePublished: article.date,
    dateModified: article.generatedAt || article.date,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: { '@type': 'Person', name: 'Rafael Marcos' },
    publisher: { '@type': 'Person', name: 'Rafael Marcos' },
  };

  return layout({
    title: content.title,
    description: content.dek,
    canonical: url,
    type: 'article',
    schema,
    body: `<article class="v2-shell signal-edition">
      <nav class="art-crumbs" aria-label="Breadcrumb"><a href="/news/">AI Signal</a><span aria-hidden="true">/</span><span>${escapeHtml(article.date)}</span></nav>
      <header class="art-head signal-edition-head">
        <p class="cat-chip">AI Signal / daily briefing</p>
        <h1>${escapeHtml(content.title)}</h1>
        <p class="art-dek">${escapeHtml(content.dek)}</p>
        <div class="art-meta"><time datetime="${escapeHtml(article.date)}">${dateHuman(article.date)}</time><span>${Number(article.readingMinutes) || 4} min read</span></div>
      </header>
      <div class="signal-reading">
        <div class="prose">${prose(content.intro)}${sections}<section class="signal-takeaways"><h2>What matters</h2><ol>${takeaways}</ol></section>${prose(content.closing)}</div>
        <aside class="signal-sources" aria-labelledby="sources-title"><p class="cat-chip">Reported sources</p><h2 id="sources-title">Read the original reporting</h2><ol>${sources}</ol></aside>
      </div>
      <nav class="signal-edition-links" aria-label="AI Signal navigation"><a href="/news/">Latest briefing <span aria-hidden="true">→</span></a><a href="/news/archive/">Browse the archive <span aria-hidden="true">→</span></a></nav>
    </article>`,
  });
}

function archiveRows(articles) {
  return articles.map((article) => {
    const content = contentFor(article);
    if (!content) return '';
    return `<article class="signal-row"><time datetime="${escapeHtml(article.date)}">${dateHuman(article.date)}</time><div><h2><a href="/news/${article.slug}/">${escapeHtml(content.title)}</a></h2><p>${escapeHtml(content.dek)}</p></div><span>${Number(article.readingMinutes) || 4} min</span></article>`;
  }).join('');
}

function indexPage(articles) {
  const latest = articles[0];
  if (!latest || !contentFor(latest)) throw new Error('AI Signal needs at least one readable edition');
  const latestContent = contentFor(latest);
  const url = `${SITE}/news/`;
  const archive = articles.slice(1, 6);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'AI Signal',
    description: 'A daily English briefing on AI, software and business, built from linked source reporting.',
    url,
  };
  return layout({
    title: 'AI Signal | Daily AI briefing',
    description: schema.description,
    canonical: url,
    schema,
    body: `<section class="v2-shell signal-index-hero">
      <p class="eyebrow">AI Signal</p>
      <h1>A daily briefing on AI, software and business.</h1>
      <p>Selected reporting, a concise editorial thread and direct links to every source. Published as a static archive, one edition at a time.</p>
    </section>
    <section class="v2-shell v2-section signal-latest" aria-labelledby="latest-title">
      <p class="cat-chip">Latest edition</p>
      <article>
        <div class="signal-latest-meta"><time datetime="${escapeHtml(latest.date)}">${dateHuman(latest.date)}</time><span>${Number(latest.readingMinutes) || 4} min read</span></div>
        <h2 id="latest-title"><a href="/news/${latest.slug}/">${escapeHtml(latestContent.title)}</a></h2>
        <p>${escapeHtml(latestContent.dek)}</p>
        <a class="signal-read" href="/news/${latest.slug}/">Read this briefing <span aria-hidden="true">→</span></a>
      </article>
    </section>
    <section class="v2-shell v2-section signal-archive-preview" aria-labelledby="archive-title">
      <div class="signal-section-head"><div><p class="eyebrow">Archive</p><h2 class="v2-h2" id="archive-title">Recent editions</h2></div><a href="/news/archive/">View all editions <span aria-hidden="true">→</span></a></div>
      <div class="signal-rows">${archiveRows(archive)}</div>
    </section>
    <aside class="v2-shell v2-section signal-automation" aria-labelledby="automation-title"><div><p class="cat-chip">Publishing system</p><h2 id="automation-title">An automated editorial workflow, with sources kept in view.</h2></div><p>AI Signal collects source reporting, selects a daily set, validates the edition and writes static pages. The archive is part of <a href="/rafaops/">RafaOps</a>, the system that monitors and publishes it.</p></aside>`,
  });
}

function archivePage(articles) {
  const url = `${SITE}/news/archive/`;
  const schema = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'AI Signal archive', url };
  return layout({
    title: 'AI Signal archive',
    description: 'Every AI Signal edition: linked-source daily briefings on AI, software and business.',
    canonical: url,
    schema,
    body: `<section class="v2-shell idx-head signal-archive-head"><p class="eyebrow">AI Signal</p><h1>Every daily briefing, in one archive.</h1><p class="section-copy">Static editions with their original source links. New editions are added by the same publishing workflow.</p><a class="signal-back" href="/news/">← Back to the latest edition</a></section><section class="v2-shell v2-section"><div class="signal-rows signal-rows-full">${archiveRows(articles)}</div></section>`,
  });
}

export async function buildAiSignalPages() {
  const feed = JSON.parse(await readFile(FEED, 'utf8'));
  const articles = (feed.articles || []).filter(contentFor);
  for (const article of articles) {
    const dir = new URL(`../news/${article.slug}/`, import.meta.url);
    await mkdir(dir, { recursive: true });
    await writeFile(new URL('index.html', dir), articlePage(article), 'utf8');
  }
  const archive = new URL('../news/archive/', import.meta.url);
  await mkdir(archive, { recursive: true });
  await writeFile(new URL('index.html', archive), archivePage(articles), 'utf8');
  await writeFile(new URL('../news/index.html', import.meta.url), indexPage(articles), 'utf8');
  return articles.length;
}

if (import.meta.main) {
  const count = await buildAiSignalPages();
  console.log(`Generated ${count} AI Signal editions, index and archive`);
}
