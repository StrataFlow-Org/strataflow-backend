import { test } from 'node:test';
import assert from 'node:assert';
import { webhookDispatcher } from '../src/services/webhook-dispatcher.js';

test('Webhook Retry Backoff Tests', async () => {
  // Test exponential growth
  const attempt1 = webhookDispatcher.calculateNextAttempt(1);
  const attempt2 = webhookDispatcher.calculateNextAttempt(2);
  const attempt3 = webhookDispatcher.calculateNextAttempt(3);

  // 2s * 2^1 = 4s (+ jitter)
  assert.ok(attempt1 >= 4000 && attempt1 <= 4600);

  // 2s * 2^2 = 8s (+ jitter)
  assert.ok(attempt2 >= 8000 && attempt2 <= 8600);

  // 2s * 2^3 = 16s (+ jitter)
  assert.ok(attempt3 >= 16000 && attempt3 <= 16600);

  assert.ok(attempt2 > attempt1);
  assert.ok(attempt3 > attempt2);
});
