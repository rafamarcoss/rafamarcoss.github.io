import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';

const ROOT = new URL('../', import.meta.url);
const STATUS_PATH = new URL('../rafaops/status.json', import.meta.url);
const TELEMETRY_PATH = new URL('../rafaops/ai-signal-run.json', import.meta.url);
const FEED_PATH = new URL('../news/feed.json', import.meta.url);
const SITE_URL = process.env.RAFAOPS_SITE_URL || 'https://rafaelmarcos.tech';
const PRODUCTION_ARTICLE_MODEL = 'deepseek-v4-pro';
const startedAt = Date.now();

async function readJson(path, fallback = null) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return fallback;
  }
}

async function probe(id, name, url, { critical = true, parse = null } = {}) {
  const checkStartedAt = Date.now();
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'RafaOps/1.0 (+https://rafaelmarcos.tech/rafaops/)' },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = parse ? await response.text() : '';
    const detail = parse ? parse(body) : `HTTP ${response.status}`;
    return {
      id, name, url, critical, status: 'healthy', detail,
      latencyMs: Date.now() - checkStartedAt,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      id, name, url, critical, status: 'failed', detail: error.message,
      latencyMs: Date.now() - checkStartedAt,
      checkedAt: new Date().toISOString(),
    };
  }
}

function validateFeed(feed) {
  if (!Array.isArray(feed?.articles) || feed.articles.length === 0) {
    throw new Error('Feed sin artículos');
  }
  const latest = feed.articles[0];
  if (!Array.isArray(latest.sources) || latest.sources.length !== 10) {
    throw new Error('La última edición no contiene 10 fuentes');
  }
  for (const language of ['es', 'en']) {
    const article = latest.content?.[language];
    if (!article?.title || !article?.intro || !Array.isArray(article.sections) || article.sections.length < 3) {
      throw new Error(`Edición ${language} incompleta`);
    }
  }
  const ageHours = Math.round((Date.now() - new Date(latest.generatedAt).getTime()) / 3_600_000);
  if (!Number.isFinite(ageHours) || ageHours > 48) {
    throw new Error(`Última edición con ${ageHours} h de antigüedad`);
  }
  return `${latest.sources.length} fuentes · ES/EN · ${Math.max(0, ageHours)} h`;
}

async function checkLocalFeed() {
  const checkedAt = new Date().toISOString();
  try {
    const feed = await readJson(FEED_PATH);
    return {
      id: 'feed-integrity',
      name: 'Integridad editorial',
      url: `${SITE_URL}/news/feed.json`,
      critical: true,
      status: 'healthy',
      detail: validateFeed(feed),
      latencyMs: 0,
      checkedAt,
    };
  } catch (error) {
    return {
      id: 'feed-integrity',
      name: 'Integridad editorial',
      url: `${SITE_URL}/news/feed.json`,
      critical: true,
      status: 'failed',
      detail: error.message,
      latencyMs: 0,
      checkedAt,
    };
  }
}

async function checkDailyWorkflow() {
  const repository = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;
  if (!repository || !token) {
    return {
      id: 'github-actions', name: 'GitHub Actions', critical: false, status: 'unknown',
      detail: 'Disponible durante la monitorización en GitHub', latencyMs: null,
      checkedAt: new Date().toISOString(), url: null,
    };
  }

  const checkStartedAt = Date.now();
  try {
    const response = await fetch(`https://api.github.com/repos/${repository}/actions/workflows/daily-ai-signal.yml/runs?per_page=1`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(`GitHub API HTTP ${response.status}`);
    const payload = await response.json();
    const run = payload.workflow_runs?.[0];
    if (!run) throw new Error('No hay ejecuciones registradas');
    const healthy = run.status === 'completed' && run.conclusion === 'success';
    return {
      id: 'github-actions', name: 'GitHub Actions', critical: false,
      status: healthy ? 'healthy' : run.status === 'in_progress' ? 'running' : 'failed',
      detail: run.status === 'completed' ? `Última ejecución: ${run.conclusion}` : `Ejecución ${run.status}`,
      latencyMs: Date.now() - checkStartedAt,
      checkedAt: new Date().toISOString(),
      url: run.html_url,
    };
  } catch (error) {
    return {
      id: 'github-actions', name: 'GitHub Actions', critical: false, status: 'unknown',
      detail: error.message, latencyMs: Date.now() - checkStartedAt,
      checkedAt: new Date().toISOString(), url: null,
    };
  }
}

function updateIncidents(previousIncidents, checks, now) {
  const incidents = Array.isArray(previousIncidents) ? previousIncidents.map((incident) => ({ ...incident })) : [];
  const failingIds = new Set(checks.filter((check) => check.status === 'failed').map((check) => check.id));

  for (const incident of incidents.filter((item) => item.status === 'open' && !failingIds.has(item.checkId))) {
    incident.status = 'resolved';
    incident.resolvedAt = now;
  }

  for (const check of checks.filter((item) => item.status === 'failed')) {
    if (incidents.some((incident) => incident.status === 'open' && incident.checkId === check.id)) continue;
    incidents.unshift({
      id: `${check.id}-${Date.now()}`,
      checkId: check.id,
      title: `${check.name} necesita atención`,
      detail: check.detail,
      severity: check.critical ? 'critical' : 'warning',
      status: 'open',
      detectedAt: now,
      recovery: check.id === 'feed-integrity'
        ? 'El supervisor reintentará con otro modelo en la siguiente generación.'
        : 'RafaOps volverá a comprobar el servicio en la siguiente ronda.',
    });
  }
  return incidents.slice(0, 20);
}

function buildPipeline(telemetry) {
  const tasks = new Map((telemetry?.attempts || []).map((attempt) => [attempt.task, attempt]));
  const pipeline = [
    { id: 'collect', name: 'RSS collector', type: 'tool', model: null },
    { id: 'select-top-10', name: 'News selector', type: 'agent', model: telemetry?.models?.selection || 'deepseek-v4-flash' },
    { id: 'write-spanish-edition', name: 'Editorial writer', type: 'agent', model: PRODUCTION_ARTICLE_MODEL },
    { id: 'validate', name: 'Schema validator', type: 'guardrail', model: null },
    { id: 'translate-english-edition', name: 'Translation agent', type: 'agent', model: telemetry?.models?.translation || 'deepseek-v4-flash' },
    { id: 'publish', name: 'Git publisher', type: 'tool', model: null },
    { id: 'monitor', name: 'RafaOps monitor', type: 'observer', model: null },
  ];
  return pipeline.map((step) => ({
    ...step,
    status: telemetry?.status === 'failed' && tasks.get(step.id)?.status === 'failed'
      ? 'failed'
      : telemetry ? 'healthy' : 'waiting',
  }));
}

async function main() {
  const previous = await readJson(STATUS_PATH, {});
  const telemetry = await readJson(TELEMETRY_PATH, null);
  const now = new Date().toISOString();
  const checks = await Promise.all([
    probe('website', 'Portfolio público', `${SITE_URL}/`, {
      parse: (html) => html.includes('Rafael Marcos') ? 'HTML y marca verificados' : (() => { throw new Error('Contenido inesperado'); })(),
    }),
    probe('news-page', 'AI Signal', `${SITE_URL}/news/`, {
      parse: (html) => html.includes('AI Signal') ? 'Archivo de noticias disponible' : (() => { throw new Error('Contenido inesperado'); })(),
    }),
    checkLocalFeed(),
    checkDailyWorkflow(),
  ]);

  checks.push({
    id: 'n8n-private', name: 'n8n · VM privada', critical: false, status: 'private',
    detail: 'Runtime aislado; conector local pendiente', latencyMs: null, checkedAt: now,
    url: null,
  });

  const criticalFailure = checks.some((check) => check.critical && check.status === 'failed');
  const warning = checks.some((check) => !check.critical && check.status === 'failed');
  const health = criticalFailure ? 'incident' : warning ? 'degraded' : 'operational';
  const incidents = updateIncidents(previous.incidents, checks, now);
  const successfulChecks = checks.filter((check) => check.status === 'healthy').length;
  const measurableChecks = checks.filter((check) => ['healthy', 'failed'].includes(check.status)).length;
  const runId = process.env.GITHUB_RUN_ID || `local-${Date.now()}`;
  const runUrl = process.env.GITHUB_RUN_ID && process.env.GITHUB_REPOSITORY
    ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null;
  const run = {
    id: String(runId),
    source: process.env.GITHUB_EVENT_NAME || 'local',
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: now,
    durationMs: Date.now() - startedAt,
    status: health,
    checks: checks.map(({ id, status, latencyMs }) => ({ id, status, latencyMs })),
    url: runUrl,
  };

  const status = {
    schemaVersion: 1,
    generatedAt: now,
    health,
    summary: criticalFailure
      ? 'RafaOps ha detectado un incidente que requiere revisión.'
      : telemetry?.metrics?.supervisedRecoveries
        ? `Operativo después de ${telemetry.metrics.supervisedRecoveries} recuperación supervisada.`
        : 'Todos los sistemas críticos responden correctamente.',
    metrics: {
      availability: measurableChecks ? Math.round((successfulChecks / measurableChecks) * 1000) / 10 : 0,
      healthyChecks: successfulChecks,
      totalChecks: checks.length,
      openIncidents: incidents.filter((incident) => incident.status === 'open').length,
      supervisedRecoveries: telemetry?.metrics?.supervisedRecoveries || 0,
      modelCalls: telemetry?.metrics?.modelCalls || 0,
      totalTokens: telemetry?.metrics?.totalTokens || 0,
      lastRunDurationMs: telemetry?.durationMs || run.durationMs,
    },
    checks,
    pipeline: buildPipeline(telemetry),
    routing: {
      worker: PRODUCTION_ARTICLE_MODEL,
      supervisor: telemetry?.models?.supervisor || 'glm-5.2',
      fallback: telemetry?.models?.fallback || 'deepseek-v4-flash',
      policy: '2 reintentos de transporte → supervisor independiente → fallback de modelo',
    },
    latestAgentRun: telemetry,
    incidents,
    runs: [run, ...(Array.isArray(previous.runs) ? previous.runs.filter((item) => item.id !== run.id) : [])].slice(0, 20),
  };

  await mkdir(new URL('../rafaops/', import.meta.url), { recursive: true });
  await writeFile(STATUS_PATH, `${JSON.stringify(status, null, 2)}\n`, 'utf8');
  console.log(`RafaOps: ${health} · ${successfulChecks}/${measurableChecks} comprobaciones correctas`);

  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `health=${health}\n`, 'utf8');
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
