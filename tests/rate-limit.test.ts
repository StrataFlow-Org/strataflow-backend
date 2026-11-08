import { test } from 'node:test';
import assert from 'node:assert';
import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';

test('Rate Limiting Enforcement Integration Tests', async () => {
  const app = Fastify();

  // Test rate limiter capped at 3 requests
  await app.register(rateLimit, {
    max: 3,
    timeWindow: '1 minute',
    keyGenerator: () => 'test-ip',
  });

  app.get('/test-rate-limit', async () => ({ ok: true }));

  // First 3 requests should succeed
  for (let i = 0; i < 3; i++) {
    const res = await app.inject({
      method: 'GET',
      url: '/test-rate-limit',
    });
    assert.strictEqual(res.statusCode, 200);
  }

  // 4th request should trigger 429 Too Many Requests
  const throttled = await app.inject({
    method: 'GET',
    url: '/test-rate-limit',
  });
  assert.strictEqual(throttled.statusCode, 429);
  const body = JSON.parse(throttled.payload);
  assert.strictEqual(body.statusCode, 429);
  assert.match(body.message, /Rate limit exceeded/i);

  await app.close();
});
