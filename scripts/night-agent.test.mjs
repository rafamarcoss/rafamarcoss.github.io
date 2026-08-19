import assert from 'node:assert/strict';
import test from 'node:test';
import { findMessages, findValue, unwrapOrca, validateGoal } from './night-agent.mjs';

test('validateGoal enforces acceptance and explicit tests', () => {
  assert.throws(() => validateGoal({ goal: 'too short' }), /20 characters/);
  const goal = validateGoal({
    goal: 'Build a constrained local-only coding improvement.',
    repoPath: '.',
    acceptance: ['tests pass'],
    testCommands: ['node --test'],
    maxIterations: 99,
  });
  assert.equal(goal.maxIterations, 8);
  assert.deepEqual(goal.testCommands, ['node --test']);
});

test('Orca helpers unwrap responses and locate lifecycle data', () => {
  assert.deepEqual(unwrapOrca({ ok: true, result: { id: 'run_1' } }), { id: 'run_1' });
  assert.throws(() => unwrapOrca({ ok: false, error: { message: 'blocked' } }), /blocked/);
  const payload = { result: { delivery: { deliveryId: 'delivery_1', messages: [{ type: 'worker_done', id: 'message_1' }] } } };
  assert.equal(findValue(payload, ['deliveryId']), 'delivery_1');
  assert.equal(findMessages(payload).length, 1);
});
