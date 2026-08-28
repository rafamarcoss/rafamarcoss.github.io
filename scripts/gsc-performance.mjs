import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGscClients, GSC_SITE_URL } from './gsc-auth.mjs';

const DEFAULT_DAYS = 28;
const DEFAULT_LIMIT = 100;
const MIN_IMPRESSIONS = 10;

export function parseArgs(args) {
  const config = { days: DEFAULT_DAYS, dimensions: [], limit: DEFAULT_LIMIT, report: true };
  for (const arg of args) {
    if (arg === '--no-report') { config.report = false; continue; }
    const [flag, value] = arg.split('=', 2);
    if (flag === '--days' && /^\d+$/.test(value)) { config.days = Number(value); continue; }
    if (flag === '--dimension' && ['query', 'page'].includes(value)) { config.dimensions.push(value); continue; }
    if (flag === '--limit' && /^\d+$/.test(value)) { config.limit = Number(value); continue; }
    throw new Error(`Unknown argument: ${arg}`);
  }
  if (config.days < 1 || config.days > 365) throw new Error('--days must be between 1 and 365.');
  if (config.limit < 1 || config.limit > 1000) throw new Error('--limit must be between 1 and 1000.');
  config.dimensions = [...new Set(config.dimensions.length ? config.dimensions : ['query', 'page'])];
  return config;
}

export function dateRanges(days, now = new Date()) {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  const start = new Date(end); start.setUTCDate(end.getUTCDate() - days + 1);
  const previousEnd = new Date(start); previousEnd.setUTCDate(start.getUTCDate() - 1);
  const previousStart = new Date(previousEnd); previousStart.setUTCDate(previousEnd.getUTCDate() - days + 1);
  const iso = (date) => date.toISOString().slice(0, 10);
  return { current: { startDate: iso(start), endDate: iso(end) }, previous: { startDate: iso(previousStart), endDate: iso(previousEnd) } };
}

export function normalizeRows(rows = [], dimensions = []) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => ({
    key: Array.isArray(row.keys) ? row.keys.map(String) : [],
    label: Array.isArray(row.keys) ? row.keys.join(' | ') : '(unknown)',
    clicks: Number(row.clicks) || 0,
    impressions: Number(row.impressions) || 0,
    ctr: Number(row.ctr) || 0,
    position: Number(row.position) || 0,
    dimensions,
  })).filter((row) => row.key.length === dimensions.length);
}

const keyOf = (row) => row.key.join('\u001f');
const median = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

export function classifyOpportunities(currentRows, previousRows) {
  const previousByKey = new Map(previousRows.map((row) => [keyOf(row), row]));
  const comparableCtr = currentRows
    .filter((row) => row.impressions >= MIN_IMPRESSIONS && row.position > 0 && row.position <= 10)
    .map((row) => row.ctr);
  const ctrMedian = median(comparableCtr);
  const flags = [];

  for (const row of currentRows) {
    const previous = previousByKey.get(keyOf(row));
    if (row.impressions >= MIN_IMPRESSIONS && row.position >= 8 && row.position <= 20) {
      flags.push({ action: 'OPTIMIZE', reason: 'Striking distance: meaningful impressions with average position 8–20.', row });
    }
    if (ctrMedian !== null && row.impressions >= MIN_IMPRESSIONS && row.position > 0 && row.position <= 10 && row.ctr < ctrMedian) {
      flags.push({ action: 'TITLE/META REVIEW', reason: 'Below the current report median CTR among comparable top-10 rows; review the SERP and intent before changing a snippet.', row });
    }
    if (previous?.impressions >= MIN_IMPRESSIONS && row.impressions <= previous.impressions * 0.7) {
      flags.push({ action: 'REFRESH REVIEW', reason: 'Impressions declined by at least 30% against the comparable period.', row, previous });
    }
    if ((!previous || previous.impressions < MIN_IMPRESSIONS) && row.impressions >= MIN_IMPRESSIONS) {
      flags.push({ action: 'CONTENT EXPANSION', reason: 'Emerging row with meaningful current impressions and no comparable prior visibility.', row, previous });
    }
  }
  return flags.sort((a, b) => b.row.impressions - a.row.impressions || a.row.position - b.row.position);
}

export function findCannibalization(rows) {
  const groups = new Map();
  for (const row of rows) {
    const [query, page] = row.key;
    if (!query || !page || row.impressions < MIN_IMPRESSIONS) continue;
    const group = groups.get(query) || [];
    group.push(row);
    groups.set(query, group);
  }
  return [...groups.entries()]
    .filter(([, matches]) => matches.length >= 2)
    .map(([query, matches]) => ({ query, matches: matches.sort((a, b) => b.impressions - a.impressions) }));
}

export function markdownReport({ ranges, byDimension, opportunities, cannibalization }) {
  const lines = [
    '# Google Search Console performance report',
    '',
    `Current period: ${ranges.current.startDate} to ${ranges.current.endDate}`,
    `Previous period: ${ranges.previous.startDate} to ${ranges.previous.endDate}`,
    '',
  ];
  for (const [dimension, rows] of Object.entries(byDimension)) {
    lines.push(`## Top ${dimension}s`, '', '| Row | Clicks | Impressions | CTR | Position |', '| --- | ---: | ---: | ---: | ---: |');
    for (const row of rows.slice(0, 10)) lines.push(`| ${row.label.replaceAll('|', '\\|')} | ${row.clicks} | ${row.impressions} | ${(row.ctr * 100).toFixed(2)}% | ${row.position.toFixed(1)} |`);
    lines.push('');
  }
  lines.push('## Opportunity flags', '');
  if (!opportunities.length) lines.push('No review flags met the current data-sufficiency rules.', '');
  for (const flag of opportunities.slice(0, 30)) lines.push(`- **${flag.action}** — ${flag.row.label}: ${flag.reason}`);
  lines.push('', '## Potential cannibalization', '');
  if (!cannibalization.length) lines.push('No query had two URLs with at least the minimum impression threshold.', '');
  for (const item of cannibalization) lines.push(`- **CANNIBALIZATION REVIEW** — ${item.query}: ${item.matches.map((row) => row.key[1]).join(', ')}`);
  lines.push('', '_These are review signals, not automatic SEO decisions._', '');
  return lines.join('\n');
}

async function query(searchconsole, range, dimensions, limit) {
  const response = await searchconsole.searchanalytics.query({
    siteUrl: GSC_SITE_URL,
    requestBody: { ...range, dimensions, rowLimit: limit, dataState: 'final' },
  });
  return normalizeRows(response.data?.rows, dimensions);
}

export async function run(config, clients = createGscClients(), now = new Date()) {
  const ranges = dateRanges(config.days, now);
  const byDimension = {};
  const previousByDimension = {};
  for (const dimension of config.dimensions) {
    byDimension[dimension] = await query(clients.searchconsole, ranges.current, [dimension], config.limit);
    previousByDimension[dimension] = await query(clients.searchconsole, ranges.previous, [dimension], config.limit);
  }
  const opportunities = config.dimensions.flatMap((dimension) => classifyOpportunities(byDimension[dimension], previousByDimension[dimension]));
  const queryPage = await query(clients.searchconsole, ranges.current, ['query', 'page'], config.limit);
  const cannibalization = findCannibalization(queryPage);
  return { ranges, byDimension, opportunities, cannibalization };
}

function print(result) {
  console.log('Google Search Console performance report');
  console.log(`Current: ${result.ranges.current.startDate} to ${result.ranges.current.endDate}`);
  console.log(`Previous: ${result.ranges.previous.startDate} to ${result.ranges.previous.endDate}`);
  for (const [dimension, rows] of Object.entries(result.byDimension)) {
    console.log(`\nTop ${dimension}s`);
    for (const row of rows.slice(0, 10)) console.log(`- ${row.label} — ${row.clicks} clicks, ${row.impressions} impressions, ${(row.ctr * 100).toFixed(2)}% CTR, position ${row.position.toFixed(1)}`);
  }
  console.log(`\nOpportunity flags: ${result.opportunities.length}`);
  for (const flag of result.opportunities.slice(0, 20)) console.log(`- ${flag.action}: ${flag.row.label} — ${flag.reason}`);
  console.log(`Potential cannibalization candidates: ${result.cannibalization.length}`);
}

async function main() {
  const config = parseArgs(process.argv.slice(2));
  const result = await run(config);
  print(result);
  if (config.report) {
    const path = resolve('reports', `gsc-performance-${result.ranges.current.endDate}.md`);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, markdownReport(result));
    console.log(`Report: ${path}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`[GSC] Performance reporting failed: ${error.message}`);
    process.exitCode = 1;
  });
}
