#!/usr/bin/env node

import { execFile, spawn } from 'node:child_process';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

const execFileAsync = promisify(execFile);
const DEFAULT_ENDPOINT = 'http://localhost:5678/webhook/rafaops-night-supervisor';
const STATE_DIR = path.join(process.env.LOCALAPPDATA || os.tmpdir(), 'RafaOps', 'night-agent');
const STATE_FILE = path.join(STATE_DIR, 'latest.json');
const STOP_FILE = path.join(STATE_DIR, 'stop-requested');
const MAX_OUTPUT = 24_000;

export function validateGoal(input) {
  if (!input || typeof input !== 'object') throw new Error('Goal config must be a JSON object');
  const goal = String(input.goal || '').trim();
  if (goal.length < 20) throw new Error('goal must contain at least 20 characters');
  const repoPath = path.resolve(String(input.repoPath || ''));
  const acceptance = Array.isArray(input.acceptance) ? input.acceptance.map(String).filter(Boolean).slice(0, 12) : [];
  if (!acceptance.length) throw new Error('At least one acceptance criterion is required');
  const testCommands = Array.isArray(input.testCommands) ? input.testCommands.map(String).filter(Boolean).slice(0, 8) : [];
  if (!testCommands.length) throw new Error('At least one explicit test command is required');
  return {
    label: String(input.label || 'Night agent goal').slice(0, 80),
    goal,
    repoPath,
    acceptance,
    testCommands,
    maxIterations: clamp(input.maxIterations, 1, 8, 4),
    maxMinutes: clamp(input.maxMinutes, 10, 480, 180),
    targetScore: clamp(input.targetScore, 60, 100, 90),
    plannerEndpoint: String(input.plannerEndpoint || DEFAULT_ENDPOINT),
  };
}

function clamp(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.floor(number))) : fallback;
}

function parseArguments(argv) {
  const [command = 'status', ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    if (!rest[index].startsWith('--')) continue;
    options[rest[index].slice(2)] = rest[index + 1] && !rest[index + 1].startsWith('--') ? rest[++index] : true;
  }
  return { command, options };
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function fileExists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

async function runProcess(command, args, options = {}) {
  if (options.input !== undefined) {
    return new Promise((resolve) => {
      const child = spawn(command, args, { cwd: options.cwd, windowsHide: true });
      let stdout = '';
      let stderr = '';
      const timer = setTimeout(() => child.kill(), options.timeout || 120_000);
      child.stdout.on('data', (chunk) => { stdout = (stdout + chunk).slice(-MAX_OUTPUT); });
      child.stderr.on('data', (chunk) => { stderr = (stderr + chunk).slice(-MAX_OUTPUT); });
      child.on('close', (code) => {
        clearTimeout(timer);
        resolve({ code: code ?? 1, stdout, stderr });
      });
      child.stdin.end(options.input);
    });
  }
  try {
    const result = await execFileAsync(command, args, {
      cwd: options.cwd,
      timeout: options.timeout || 120_000,
      maxBuffer: 4 * 1024 * 1024,
      windowsHide: true,
    });
    return { code: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    return {
      code: Number.isInteger(error.code) ? error.code : 1,
      stdout: String(error.stdout || ''),
      stderr: String(error.stderr || error.message || error),
    };
  }
}

async function runShell(command, cwd, timeout = 300_000) {
  return new Promise((resolve) => {
    const child = spawn(command, { cwd, shell: true, windowsHide: true });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => child.kill(), timeout);
    child.stdout.on('data', (chunk) => { stdout = (stdout + chunk).slice(-MAX_OUTPUT); });
    child.stderr.on('data', (chunk) => { stderr = (stderr + chunk).slice(-MAX_OUTPUT); });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ command, code: code ?? 1, stdout, stderr });
    });
  });
}

export function unwrapOrca(response) {
  if (!response?.ok) throw new Error(response?.error?.message || 'Orca command failed');
  return response.result;
}

async function orca(args, timeout = 120_000) {
  const result = await runProcess('orca', [...args, '--json'], { timeout });
  const raw = result.stdout.trim() || result.stderr.trim();
  let response;
  try {
    response = JSON.parse(raw);
  } catch {
    throw new Error(`Orca returned non-JSON output: ${raw.slice(0, 1000)}`);
  }
  return unwrapOrca(response);
}

export function findValue(root, keys) {
  if (!root || typeof root !== 'object') return null;
  for (const [key, value] of Object.entries(root)) {
    if (keys.includes(key) && value !== undefined && value !== null) return value;
  }
  for (const value of Object.values(root)) {
    if (value && typeof value === 'object') {
      const found = findValue(value, keys);
      if (found !== null) return found;
    }
  }
  return null;
}

export function findMessages(root) {
  const messages = [];
  const visit = (value) => {
    if (!value || typeof value !== 'object') return;
    if (!Array.isArray(value) && ['worker_done', 'question', 'escalation'].includes(value.type)) messages.push(value);
    for (const child of Object.values(value)) visit(child);
  };
  visit(root);
  return messages;
}

async function callSupervisor(config, payload) {
  const response = await fetch(config.plannerEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(260_000),
  });
  if (!response.ok) throw new Error(`Supervisor HTTP ${response.status}`);
  const result = await response.json();
  if (!result?.ok || !['continue', 'accept', 'human_review'].includes(result.decision)) {
    throw new Error('Supervisor returned an invalid contract');
  }
  return result;
}

function publicState(state) {
  const worktreeName = typeof state.worktreeId === 'string'
    ? state.worktreeId.replaceAll('\\', '/').split('/').at(-1)
    : null;
  return {
    schemaVersion: 1,
    runId: state.runId || null,
    status: state.status,
    goalLabel: state.goalLabel,
    iteration: state.iteration,
    maxIterations: state.maxIterations,
    score: state.score ?? null,
    targetScore: state.targetScore,
    updatedAt: state.updatedAt,
    worktreeName,
    summary: String(state.summary || '').slice(0, 300),
  };
}

async function publishState(state) {
  const payload = { ...state, updatedAt: new Date().toISOString() };
  await mkdir(STATE_DIR, { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  const remote = await runProcess('ssh', [
    '-p', '2222', 'rafamarcoss@127.0.0.1',
    'python3 -c "import pathlib,sys; pathlib.Path(\'/home/rafamarcoss/night-agent-status.json\').write_text(sys.stdin.read(), encoding=\'utf-8\')"',
  ], { input: JSON.stringify(publicState(payload), null, 2) + '\n', timeout: 20_000 });
  if (remote.code !== 0) console.error(`Telemetry warning: ${remote.stderr.trim()}`);
  return payload;
}

function workerTask(config, decision, iteration) {
  return `${decision.taskSpec}\n\nGOAL\n${config.goal}\n\nACCEPTANCE\n${config.acceptance.map((item) => `- ${item}`).join('\n')}\n\nVERIFICATION COMMANDS APPROVED BY THE OWNER\n${config.testCommands.map((item) => `- ${item}`).join('\n')}\n\nITERATION ${iteration}/${config.maxIterations}\nWork only in the current Orca worktree. Make one focused improvement. Inspect existing AGENTS.md first. Do not push, merge, publish, deploy, buy anything, send messages, change credentials, control desktop applications, or edit outside this repository. Avoid destructive commands. Run relevant tests and report concrete evidence. If a risky external decision is required, stop and ask the coordinator. Send worker_done exactly once when this focused step is complete.`;
}

async function collectEvidence(worktreePath, config, report) {
  const statusResult = await runProcess('git', ['status', '--short'], { cwd: worktreePath, timeout: 30_000 });
  const diffResult = await runProcess('git', ['diff', '--stat'], { cwd: worktreePath, timeout: 30_000 });
  const changedFiles = [];
  for (const line of statusResult.stdout.split(/\r?\n/).filter(Boolean).slice(0, 12)) {
    const relative = line.slice(3).split(' -> ').at(-1).trim();
    const absolute = path.resolve(worktreePath, relative);
    const boundary = path.relative(worktreePath, absolute);
    if (boundary.startsWith('..') || path.isAbsolute(boundary)) continue;
    try {
      const info = await stat(absolute);
      if (!info.isFile() || info.size > 100_000) continue;
      const buffer = await readFile(absolute);
      if (buffer.includes(0)) continue;
      changedFiles.push({ path: relative, content: buffer.toString('utf8').slice(0, 8000) });
    } catch {}
  }
  const tests = [];
  for (const command of config.testCommands) tests.push(await runShell(command, worktreePath));
  return {
    workerReport: report,
    gitStatus: statusResult.stdout.slice(0, MAX_OUTPUT),
    diffStat: diffResult.stdout.slice(0, MAX_OUTPUT),
    changedFiles,
    tests: tests.map((test) => ({ ...test, stdout: test.stdout.slice(-6000), stderr: test.stderr.slice(-6000) })),
    allTestsPassed: tests.every((test) => test.code === 0),
  };
}

async function answerQuestion(config, state, message) {
  const question = String(message.body || message.subject || findValue(message, ['question']) || '');
  const decision = await callSupervisor(config, {
    phase: 'question', goal: config.goal, acceptance: config.acceptance,
    iteration: state.iteration, maxIterations: config.maxIterations,
    history: state.history, question,
  });
  const messageId = message.id || findValue(message, ['messageId', 'message_id']);
  if (!messageId) throw new Error('Orca question has no message id');
  const answer = decision.decision === 'human_review'
    ? 'Stop this step and report the decision as blocked for human review.'
    : decision.answer;
  await orca(['orchestration', 'reply', '--id', String(messageId), '--body', answer]);
}

async function waitForWorker(config, state, dispatchId, deadline) {
  let pendingDelivery = null;
  while (Date.now() < deadline) {
    if (await fileExists(STOP_FILE)) {
      await orca(['orchestration', 'worker-stop', '--dispatch', dispatchId]);
      throw new Error('STOP_REQUESTED');
    }
    const delivery = await orca(['orchestration', 'check', '--wait', '--types', 'worker_done,escalation,question', '--timeout-ms', '60000'], 90_000);
    const messages = findMessages(delivery);
    pendingDelivery = findValue(delivery, ['deliveryId', 'delivery_id']) || pendingDelivery;
    for (const message of messages) {
      if (message.type === 'question') await answerQuestion(config, state, message);
      if (message.type === 'escalation') throw new Error(`Worker escalation: ${message.body || message.subject || 'unknown'}`);
      if (message.type === 'worker_done') {
        await orca(['orchestration', 'worker-release', '--dispatch', dispatchId]);
        if (pendingDelivery) await orca(['orchestration', 'check', '--ack', String(pendingDelivery)]);
        return message;
      }
    }
    state = await publishState({ ...state, status: 'working', summary: 'Codex sigue trabajando.' });
  }
  await orca(['orchestration', 'worker-stop', '--dispatch', dispatchId]);
  throw new Error('TIME_BUDGET_EXHAUSTED');
}

async function resolveWorkerLocation(dispatchId, fallbackId) {
  const worker = await orca(['orchestration', 'worker-show', '--dispatch', dispatchId]);
  const worktreeId = findValue(worker, ['worktreeId', 'worktree_id']) || fallbackId;
  let worktreePath = findValue(worker, ['worktreePath', 'worktree_path']);
  if (!worktreePath && typeof worktreeId === 'string' && worktreeId.includes('::')) worktreePath = worktreeId.split('::').slice(1).join('::');
  if (!worktreeId || !worktreePath) throw new Error('Could not resolve the worker worktree');
  return { worktreeId, worktreePath };
}

async function updateCard(worktreeId, status, comment) {
  await orca(['worktree', 'set', '--worktree', `id:${worktreeId}`, '--workspace-status', status, '--comment', String(comment).slice(0, 180)]);
}

async function runGoal(config, previousState = null) {
  await stat(config.repoPath);
  await rm(STOP_FILE, { force: true });
  const startedAt = Date.now();
  const deadline = startedAt + config.maxMinutes * 60_000;
  const run = await orca(['orchestration', 'run-create', '--objective', config.goal]);
  const runId = findValue(run, ['runId', 'run_id']) || findValue(run, ['id']);
  if (!runId) throw new Error('Orca did not return a run id');
  const priorHistory = Array.isArray(previousState?.history) ? previousState.history.slice(-6) : [];
  let state = await publishState({ runId, status: 'planning', goalLabel: config.label, iteration: 0, maxIterations: config.maxIterations, targetScore: config.targetScore, score: previousState?.score || 0, history: priorHistory, worktreeId: previousState?.worktreeId || null, worktreePath: previousState?.worktreePath || null, summary: 'DeepSeek prepara la primera tarea.' });
  let decision = await callSupervisor(config, { phase: 'plan', goal: config.goal, acceptance: config.acceptance, iteration: 0, maxIterations: config.maxIterations, history: priorHistory });
  let worktreeId = previousState?.worktreeId || null;
  let worktreePath = previousState?.worktreePath || null;

  for (let iteration = 1; iteration <= config.maxIterations; iteration += 1) {
    if (decision.decision !== 'continue') break;
    state = await publishState({ ...state, status: 'dispatching', iteration, score: decision.score, summary: decision.summary });
    const task = await orca(['orchestration', 'task-create', '--spec', workerTask(config, decision, iteration)]);
    const taskId = findValue(task, ['taskId', 'task_id']) || findValue(task, ['id']);
    if (!taskId) throw new Error('Orca did not return a task id');
    const startArgs = ['orchestration', 'worker-start', '--task', String(taskId)];
    if (worktreeId) startArgs.push('--worktree', `id:${worktreeId}`, '--agent', 'codex');
    else startArgs.push('--worktree', 'new-top-level', '--repo', `path:${config.repoPath.replaceAll('\\', '/')}`, '--name', `night-${String(runId).slice(-8)}`, '--agent', 'codex', '--setup', 'run');
    const worker = await orca(startArgs, 180_000);
    const dispatchId = findValue(worker, ['dispatchId', 'dispatch_id']) || findValue(worker, ['id']);
    if (!dispatchId) throw new Error('Orca did not return a dispatch id');
    const location = await resolveWorkerLocation(dispatchId, worktreeId);
    worktreeId = location.worktreeId;
    worktreePath = location.worktreePath;
    state = await publishState({ ...state, status: 'working', worktreeId, worktreePath, summary: `Codex ejecuta la iteración ${iteration}.` });
    const report = await waitForWorker(config, state, String(dispatchId), deadline);
    const evidence = await collectEvidence(worktreePath, config, report);
    decision = await callSupervisor(config, { phase: 'review', goal: config.goal, acceptance: config.acceptance, iteration, maxIterations: config.maxIterations, history: state.history, evidence });
    const historyEntry = { iteration, decision: decision.decision, score: decision.score, summary: decision.summary, allTestsPassed: evidence.allTestsPassed, diffStat: evidence.diffStat };
    state = await publishState({ ...state, status: decision.decision === 'continue' ? 'planning' : 'in_review', iteration, score: decision.score, summary: decision.summary, history: [...state.history, historyEntry].slice(-6) });
    if (decision.decision === 'accept' && decision.score < config.targetScore) decision = { ...decision, decision: 'continue', taskSpec: 'Improve the weakest acceptance criterion and add verifiable evidence.', summary: `Score ${decision.score} is below target ${config.targetScore}.` };
  }

  const finalStatus = decision.decision === 'accept' ? 'ready_for_review' : 'needs_human_review';
  state = await publishState({ ...state, status: finalStatus, score: decision.score, summary: decision.summary, finishedAt: new Date().toISOString() });
  if (worktreeId) await updateCard(worktreeId, 'in-review', `${config.label}: ${decision.score}/100 · ${decision.summary}`);
  console.log(JSON.stringify(publicState(state), null, 2));
}

async function main() {
  const { command, options } = parseArguments(process.argv.slice(2));
  if (command === 'status') {
    console.log(await readFile(STATE_FILE, 'utf8').catch(() => '{"status":"never_started"}\n'));
    return;
  }
  if (command === 'stop') {
    await mkdir(STATE_DIR, { recursive: true });
    await writeFile(STOP_FILE, `${new Date().toISOString()}\n`, 'utf8');
    console.log('Stop requested. The active worker will stop at the next checkpoint.');
    return;
  }
  if (!options.goal) throw new Error('Use --goal <path-to-json>');
  let config = validateGoal(await readJson(path.resolve(String(options.goal))));
  if (command === 'plan') {
    console.log(JSON.stringify(await callSupervisor(config, { phase: 'plan', goal: config.goal, acceptance: config.acceptance, iteration: 0, maxIterations: config.maxIterations, history: [] }), null, 2));
    return;
  }
  if (command === 'feedback') {
    const feedback = String(options.text || '').trim();
    if (feedback.length < 5) throw new Error('Use --text with concrete review feedback');
    const previousState = await readJson(STATE_FILE);
    if (!previousState.worktreeId || !previousState.worktreePath) throw new Error('No previous worktree is available to resume');
    config = { ...config, label: `${config.label} · feedback`, goal: `${config.goal}\n\nOWNER FEEDBACK FOR THE NEXT ROUND\n${feedback.slice(0, 6000)}` };
    await runGoal(config, previousState);
    return;
  }
  if (command !== 'run') throw new Error(`Unknown command: ${command}`);
  await runGoal(config);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(async (error) => {
    const status = error.message === 'STOP_REQUESTED' ? 'stopped' : error.message === 'TIME_BUDGET_EXHAUSTED' ? 'time_budget_exhausted' : 'failed';
    const current = await readJson(STATE_FILE).catch(() => ({ goalLabel: 'Night agent goal', iteration: 0, maxIterations: 0, targetScore: 0, history: [] }));
    await publishState({ ...current, status, summary: String(error.message || error), finishedAt: new Date().toISOString() }).catch(() => {});
    console.error(error.stack || error);
    process.exitCode = 1;
  });
}
