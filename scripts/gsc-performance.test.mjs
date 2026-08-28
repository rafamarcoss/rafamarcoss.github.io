import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { classifyOpportunities, dateRanges, findCannibalization, normalizeRows, parseArgs, run } from './gsc-performance.mjs';

test('parses supported performance arguments', () => {
  assert.deepEqual(parseArgs(['--days=90', '--dimension=query', '--limit=50', '--no-report']), {
    days: 90, dimensions: ['query'], limit: 50, report: false,
  });
  assert.throws(() => parseArgs(['--dimension=country']), /Unknown argument/);
});

test('builds comparable complete-day ranges', () => {
  assert.deepEqual(dateRanges(28, new Date('2026-08-28T12:00:00Z')), {
    current: { startDate: '2026-07-31', endDate: '2026-08-27' },
    previous: { startDate: '2026-07-03', endDate: '2026-07-30' },
  });
});

test('normalizes malformed and empty Search Analytics rows', () => {
  assert.deepEqual(normalizeRows(undefined, ['query']), []);
  assert.deepEqual(normalizeRows([{ keys: ['agent observability'], clicks: 2, impressions: 20, ctr: 0.1, position: 9 }], ['query']), [{
    key: ['agent observability'], label: 'agent observability', clicks: 2, impressions: 20, ctr: 0.1, position: 9, dimensions: ['query'],
  }]);
});

test('flags review opportunities without treating them as decisions', () => {
  const current = normalizeRows([
    { keys: ['agent observability'], clicks: 2, impressions: 40, ctr: 0.05, position: 9 },
    { keys: ['agent guardrails'], clicks: 4, impressions: 40, ctr: 0.1, position: 4 },
  ], ['query']);
  const previous = normalizeRows([{ keys: ['agent observability'], clicks: 6, impressions: 60, ctr: 0.1, position: 8 }], ['query']);
  const actions = classifyOpportunities(current, previous).map((item) => item.action);
  assert.ok(actions.includes('OPTIMIZE'));
  assert.ok(actions.includes('REFRESH REVIEW'));
  assert.ok(actions.includes('TITLE/META REVIEW'));
  assert.ok(actions.includes('CONTENT EXPANSION'));
});

test('requires meaningful data for potential cannibalization', () => {
  const rows = normalizeRows([
    { keys: ['agent observability', 'https://example.com/a'], impressions: 20 },
    { keys: ['agent observability', 'https://example.com/b'], impressions: 15 },
    { keys: ['agent guardrails', 'https://example.com/a'], impressions: 9 },
    { keys: ['agent guardrails', 'https://example.com/b'], impressions: 9 },
  ], ['query', 'page']);
  assert.deepEqual(findCannibalization(rows).map((item) => item.query), ['agent observability']);
});

test('fails clearly without credentials', () => {
  const result = spawnSync(process.execPath, ['scripts/gsc-performance.mjs', '--no-report'], {
    cwd: process.cwd(), env: { ...process.env, GSC_SERVICE_ACCOUNT_JSON: '' }, encoding: 'utf8',
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /GSC_SERVICE_ACCOUNT_JSON/);
});

test('queries and normalizes a valid synthetic Search Analytics response', async () => {
  const calls = [];
  const clients = { searchconsole: { searchanalytics: { query: async ({ requestBody }) => {
    calls.push(requestBody);
    const rows = requestBody.dimensions.join(',') === 'query,page'
      ? [{ keys: ['agent observability', 'https://rafaelmarcos.tech/articles/a/'], impressions: 20, position: 9 }]
      : [{ keys: [requestBody.dimensions[0] === 'query' ? 'agent observability' : 'https://rafaelmarcos.tech/articles/a/'], clicks: 2, impressions: 20, ctr: 0.1, position: 9 }];
    return { data: { rows } };
  } } } };
  const result = await run(parseArgs(['--days=28', '--dimension=query', '--dimension=page', '--no-report']), clients, new Date('2026-08-28T12:00:00Z'));
  assert.equal(result.byDimension.query[0].label, 'agent observability');
  assert.equal(result.byDimension.page[0].clicks, 2);
  assert.equal(result.cannibalization.length, 0);
  assert.equal(calls.length, 5);
});
