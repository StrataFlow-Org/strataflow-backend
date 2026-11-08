import { test } from 'node:test';
import assert from 'node:assert';
import { WebhookDispatcherService } from '../src/services/webhook-dispatcher.js';

test('Webhook HMAC-SHA256 Signature Tests', async (t) => {
  const secret = 'whsec_test_secret_key_1234567890';
  const payload = { event: 'AgreementCreated', onChainId: '1001', amount: '5000000' };
  const timestamp = Math.floor(Date.now() / 1000);

  await t.test('calculates deterministic hex signature', () => {
    const sig1 = WebhookDispatcherService.signPayload(secret, payload, timestamp);
    const sig2 = WebhookDispatcherService.signPayload(secret, payload, timestamp);
    assert.strictEqual(sig1, sig2);
    assert.strictEqual(sig1.length, 64); // 256 bits = 64 hex characters
  });

  await t.test('validates valid signature within tolerance window', () => {
    const sig = WebhookDispatcherService.signPayload(secret, payload, timestamp);
    const valid = WebhookDispatcherService.verifySignature(secret, payload, sig, timestamp, 300);
    assert.strictEqual(valid, true);
  });

  await t.test('rejects tampered payload', () => {
    const sig = WebhookDispatcherService.signPayload(secret, payload, timestamp);
    const tampered = { ...payload, amount: '999999999' };
    const valid = WebhookDispatcherService.verifySignature(secret, tampered, sig, timestamp, 300);
    assert.strictEqual(valid, false);
  });

  await t.test('rejects wrong secret', () => {
    const sig = WebhookDispatcherService.signPayload(secret, payload, timestamp);
    const valid = WebhookDispatcherService.verifySignature('wrong_secret', payload, sig, timestamp, 300);
    assert.strictEqual(valid, false);
  });

  await t.test('rejects expired or replayed timestamp beyond tolerance window', () => {
    const expiredTimestamp = timestamp - 400; // 400s ago (> 300s tolerance)
    const sig = WebhookDispatcherService.signPayload(secret, payload, expiredTimestamp);
    const valid = WebhookDispatcherService.verifySignature(secret, payload, sig, expiredTimestamp, 300);
    assert.strictEqual(valid, false);
  });
});

