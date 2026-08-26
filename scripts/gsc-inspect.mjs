import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createGscClients } from './gsc-auth.mjs';

const SITE_URL = 'sc-domain:rafaelmarcos.tech';
const SITEMAP_PATH = resolve('sitemap.xml');
const REPORT_PATH = resolve('reports/gsc-index-status.json');
const PAUSE_MS = 350;

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

function classify(indexStatusResult = {}) {
  const coverage = String(indexStatusResult.coverageState || 'Unknown');
  const normalized = coverage.toLowerCase();
  if (normalized.includes('unknown to google')) return 'Unknown to Google';
  if (normalized.includes('not indexed') || normalized.includes('not on google')) return 'Not indexed';
  if (normalized.includes('indexed')) return 'Indexed';
  return 'Not indexed';
}

function recordFor(url, result) {
  const index = result.inspectionResult?.indexStatusResult || {};
  return {
    url,
    classification: classify(index),
    verdict: index.verdict || 'Unknown',
    coverageState: index.coverageState || 'Unknown',
    indexingState: index.indexingState || 'Unknown',
    robotsTxtState: index.robotsTxtState || 'Unknown',
    pageFetchState: index.pageFetchState || 'Unknown',
    googleCanonical: index.googleCanonical || null,
    userCanonical: index.userCanonical || null,
    lastCrawlTime: index.lastCrawlTime || null,
    referringUrls: index.referringUrls || [],
  };
}

function printRecord(record) {
  console.log(`\nURL: ${record.url}`);
  console.log(`Status: ${record.classification} (coverage: ${record.coverageState})`);
  console.log(`Verdict: ${record.verdict}`);
  console.log(`Indexing: ${record.indexingState}`);
  console.log(`Robots.txt: ${record.robotsTxtState}`);
  console.log(`Page fetch: ${record.pageFetchState}`);
  console.log(`Google canonical: ${record.googleCanonical || '—'}`);
  console.log(`User canonical: ${record.userCanonical || '—'}`);
  console.log(`Last crawl: ${record.lastCrawlTime || '—'}`);
  if (record.referringUrls.length) console.log(`Referring URLs: ${record.referringUrls.join(', ')}`);
}

function printSummary(records, errors) {
  const counts = records.reduce((all, record) => {
    all[record.classification] += 1;
    return all;
  }, { Indexed: 0, 'Not indexed': 0, 'Unknown to Google': 0 });
  console.log('\nGoogle Search Console Index Status');
  console.log(`\nIndexed: ${counts.Indexed}`);
  console.log(`Not indexed: ${counts['Not indexed']}`);
  console.log(`Unknown to Google: ${counts['Unknown to Google']}`);
  console.log(`Errors: ${errors.length}`);
}

try {
  const { json, urls: cliUrls } = parseArgs(process.argv.slice(2));
  const urls = cliUrls.length ? [...new Set(cliUrls)] : sitemapUrls();
  const { searchconsole } = createGscClients();
  const records = [];
  const errors = [];

  for (const url of urls) {
    try {
      const response = await searchconsole.urlInspection.index.inspect({
        requestBody: { inspectionUrl: url, siteUrl: SITE_URL, languageCode: 'en-US' },
      });
      const record = recordFor(url, response.data);
      records.push(record);
      printRecord(record);
    } catch (error) {
      const message = error.response?.data?.error?.message || error.message || 'Error desconocido';
      errors.push({ url, message });
      console.error(`\nURL: ${url}\nError: ${message}`);
    }
    if (url !== urls.at(-1)) await new Promise((resolvePause) => setTimeout(resolvePause, PAUSE_MS));
  }

  printSummary(records, errors);
  if (json) {
    mkdirSync(dirname(REPORT_PATH), { recursive: true });
    writeFileSync(REPORT_PATH, `${JSON.stringify({ generatedAt: new Date().toISOString(), property: SITE_URL, records, errors }, null, 2)}\n`);
    console.log(`\nJSON report: ${REPORT_PATH}`);
  }
  if (errors.length) process.exitCode = 1;
} catch (error) {
  console.error(`[GSC] Inspection failed: ${error.message}`);
  process.exitCode = 1;
}
