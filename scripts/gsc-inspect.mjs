import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createGscClients } from './gsc-auth.mjs';

const SITE_URL = 'sc-domain:rafaelmarcos.tech';
const SITEMAP_PATH = resolve('sitemap.xml');
const REPORT_PATH = resolve('reports/gsc-index-status.json');
const PAUSE_MS = 350;
const ATTENTION_DAYS = 5;

const FETCH_ERRORS = new Set([
  'ACCESS_DENIED',
  'BLOCKED_TOO_MANY_REDIRECTS',
  'INVALID_URL',
  'PAGE_LOAD_FAILURE',
]);

function parseArgs(args) {
  const json = args.includes('--json');
  const invalid = args.filter((arg) => arg.startsWith('--') && arg !== '--json');
  if (invalid.length) throw new Error(`Argumentos no reconocidos: ${invalid.join(', ')}`);
  const urls = args.filter((arg) => !arg.startsWith('--'));
  if (urls.some((url) => !/^https:\/\//.test(url))) throw new Error('Las URLs deben empezar por https://');
  return { json, urls };
}

function sitemapUrls() {
  const xml = readFileSync(SITEMAP_PATH, 'utf8');
  const urls = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((match) => match[1]);
  if (!urls.length) throw new Error('sitemap.xml no contiene URLs <loc>.');
  return [...new Set(urls)];
}

// Fecha de publicación fiable: frontmatter de artículos o fecha en la URL de news.
function buildPublishDates() {
  const dates = {};
  const base = resolve('content/articles');
  if (existsSync(base)) {
    for (const file of readdirSync(base).filter((f) => f.endsWith('.md'))) {
      const text = readFileSync(resolve(base, file), 'utf8');
      const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!fm) continue;
      const date = fm[1].match(/^date:\s*["']?([\d-]+)/m)?.[1];
      const slug = fm[1].match(/^slug:\s*["']?([^"'\s]+)/m)?.[1];
      if (date && slug) dates[`${SITE_URL.replace('sc-domain:', 'https://')}articles/${slug}/`] = date;
    }
  }
  return dates;
}

function publishDateFromUrl(url) {
  const match = url.match(/\/news\/ai-signal-(\d{4}-\d{2}-\d{2})\//);
  return match ? match[1] : null;
}

function loadPreviousReport() {
  const fromEnv = process.env.GSC_PREVIOUS_REPORT;
  const path = fromEnv && existsSync(fromEnv) ? fromEnv : REPORT_PATH;
  if (!existsSync(path)) return {};
  try {
    const data = JSON.parse(readFileSync(path, 'utf8'));
    const map = {};
    for (const record of Array.isArray(data.records) ? data.records : []) {
      map[record.url] = record;
    }
    return map;
  } catch {
    return {};
  }
}

function daysSince(isoDate) {
  if (!isoDate) return 0;
  const start = new Date(`${isoDate}T12:00:00Z`);
  const now = new Date();
  return Math.max(0, Math.floor((now - start) / 86400000));
}

function resolveFirstSeen(url, previous, publishDates) {
  if (previous[url]?.firstSeenAt) return previous[url].firstSeenAt;
  if (publishDates[url]) return publishDates[url];
  if (publishDateFromUrl(url)) return publishDateFromUrl(url);
  return new Date().toISOString().slice(0, 10);
}

function classify(indexStatusResult = {}) {
  const coverage = String(indexStatusResult.coverageState || 'Unknown');
  const robots = String(indexStatusResult.robotsTxtState || 'UNSPECIFIED');
  const fetch = String(indexStatusResult.pageFetchState || 'UNSPECIFIED');
  const googleCanonical = indexStatusResult.googleCanonical;
  const userCanonical = indexStatusResult.userCanonical;
  const normalized = coverage.toLowerCase();

  if (robots === 'DISALLOWED') return 'ERROR';
  if (FETCH_ERRORS.has(fetch)) return 'ERROR';
  if (normalized.includes('excluded by noindex') || normalized.includes('excluded by page removal') || normalized.includes('soft 404')) return 'ERROR';
  if (googleCanonical && userCanonical && googleCanonical !== userCanonical) return 'ERROR';
  if (normalized.includes('unknown to google')) return 'NOT_INDEXED';
  if (normalized.includes('indexed') && !normalized.includes('not indexed')) return 'INDEXED';
  return 'NOT_INDEXED';
}

function bucketFor(classification, daysWaiting) {
  if (classification === 'INDEXED') return 'INDEXED';
  if (classification === 'ERROR') return 'ERROR';
  return daysWaiting >= ATTENTION_DAYS ? 'ATTENTION' : 'WAITING';
}

function recordFor(url, result, classification, firstSeenAt) {
  const index = result.inspectionResult?.indexStatusResult || {};
  const daysWaiting = daysSince(firstSeenAt);
  return {
    url,
    classification,
    bucket: bucketFor(classification, daysWaiting),
    coverageState: index.coverageState || 'Unknown',
    verdict: index.verdict || 'Unknown',
    indexingState: index.indexingState || 'Unknown',
    robotsTxtState: index.robotsTxtState || 'Unknown',
    pageFetchState: index.pageFetchState || 'Unknown',
    googleCanonical: index.googleCanonical || null,
    userCanonical: index.userCanonical || null,
    lastCrawlTime: index.lastCrawlTime || null,
    referringUrls: index.referringUrls || [],
    firstSeenAt,
    daysWaiting,
  };
}

function printRecord(record) {
  console.log(`\nURL: ${record.url}`);
  console.log(`Bucket: ${record.bucket} (${record.classification}) — ${record.daysWaiting} days`);
  console.log(`Coverage: ${record.coverageState}`);
  console.log(`Verdict: ${record.verdict}`);
  console.log(`Indexing: ${record.indexingState}`);
  console.log(`Robots.txt: ${record.robotsTxtState}`);
  console.log(`Page fetch: ${record.pageFetchState}`);
  console.log(`Google canonical: ${record.googleCanonical || '—'}`);
  console.log(`User canonical: ${record.userCanonical || '—'}`);
  console.log(`Last crawl: ${record.lastCrawlTime || '—'}`);
  if (record.referringUrls.length) console.log(`Referring URLs: ${record.referringUrls.join(', ')}`);
}

function bucketOf(previousRecord) {
  if (!previousRecord) return null;
  if (previousRecord.bucket) return previousRecord.bucket;
  if (previousRecord.classification === 'Indexed') return 'INDEXED';
  return null;
}

function printSummary(records, errors, previous) {
  const counts = { INDEXED: 0, WAITING: 0, ATTENTION: 0, ERROR: 0 };
  for (const record of records) counts[record.bucket] += 1;
  counts.ERROR += errors.length;

  console.log('\nGoogle Search Console Index Report');
  console.log(`Total URLs: ${records.length + errors.length}`);
  console.log(`Indexed: ${counts.INDEXED}`);
  console.log(`Waiting: ${counts.WAITING}`);
  console.log(`Attention: ${counts.ATTENTION}`);
  console.log(`Errors: ${counts.ERROR}`);

  const hasPrevious = Object.keys(previous).some((url) => bucketOf(previous[url]) !== null);
  if (!hasPrevious) {
    console.log('\nNo previous comparison data yet (baseline report created).');
    return;
  }

  const prevCounts = { INDEXED: 0, WAITING: 0, ATTENTION: 0, ERROR: 0 };
  for (const url in previous) {
    const bucket = bucketOf(previous[url]);
    if (bucket) prevCounts[bucket] += 1;
  }

  console.log('\nChanges since previous run:');
  for (const bucket of ['INDEXED', 'WAITING', 'ATTENTION', 'ERROR']) {
    const delta = counts[bucket] - prevCounts[bucket];
    console.log(delta !== 0 ? `${delta > 0 ? '+' : ''}${delta} ${bucket}` : `0 ${bucket}`);
  }

  const newlyIndexed = records.filter(
    (record) => record.bucket === 'INDEXED' && bucketOf(previous[record.url]) !== null && bucketOf(previous[record.url]) !== 'INDEXED'
  );
  if (newlyIndexed.length) {
    console.log('\nNewly indexed:');
    for (const record of newlyIndexed) console.log(`- ${record.url}`);
  }

  const attention = records.filter((record) => record.bucket === 'ATTENTION');
  if (attention.length) {
    console.log('\nNeeds attention:');
    for (const record of attention) console.log(`- ${record.url} — ${record.coverageState} for ${record.daysWaiting} days`);
  }
}

try {
  const { json, urls: cliUrls } = parseArgs(process.argv.slice(2));
  const urls = cliUrls.length ? [...new Set(cliUrls)] : sitemapUrls();
  const { searchconsole } = createGscClients();
  const previous = loadPreviousReport();
  const publishDates = buildPublishDates();
  const records = [];
  const errors = [];

  for (const url of urls) {
    try {
      const response = await searchconsole.urlInspection.index.inspect({
        requestBody: { inspectionUrl: url, siteUrl: SITE_URL, languageCode: 'en-US' },
      });
      const indexStatus = response.data.inspectionResult?.indexStatusResult || {};
      const classification = classify(indexStatus);
      const firstSeenAt = resolveFirstSeen(url, previous, publishDates);
      const record = recordFor(url, response.data, classification, firstSeenAt);
      record.previousClassification = bucketOf(previous[url]);
      records.push(record);
      printRecord(record);
    } catch (error) {
      const message = error.response?.data?.error?.message || error.message || 'Error desconocido';
      errors.push({ url, message });
      console.error(`\nURL: ${url}\nError: ${message}`);
    }
    if (url !== urls.at(-1)) await new Promise((resolvePause) => setTimeout(resolvePause, PAUSE_MS));
  }

  printSummary(records, errors, previous);

  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(
    REPORT_PATH,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), property: SITE_URL, records, errors }, null, 2)}\n`
  );
  console.log(`\nJSON report: ${REPORT_PATH}`);

  if (errors.length) process.exitCode = 1;
} catch (error) {
  console.error(`[GSC] Inspection failed: ${error.message}`);
  process.exitCode = 1;
}