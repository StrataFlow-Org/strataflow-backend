import { test } from 'node:test';
import assert from 'node:assert';
import Fastify from 'fastify';
import { securityPlugin } from '../src/plugins/security.js';

test('Security Headers Verification', async () => {
  const app = Fastify();
  await app.register(securityPlugin, { enableRateLimit: false });

  app.get('/test', async () => ({ status: 'ok' }));

  const response = await app.inject({
    method: 'GET',
    url: '/test',
  });

  assert.strictEqual(response.statusCode, 200);

  // Check CSP
  const csp = response.headers['content-security-policy'];
  assert.ok(csp, 'CSP header should be present');
  assert.match(csp as string, /default-src 'self'/);

  // Check X-Frame-Options (frameguard)
  assert.strictEqual(response.headers['x-frame-options'], 'DENY');

  // Check X-Content-Type-Options
  assert.strictEqual(response.headers['x-content-type-options'], 'nosniff');

  // Check Strict-Transport-Security (HSTS)
  const hsts = response.headers['strict-transport-security'];
  assert.ok(hsts, 'HSTS header should be present');
  assert.match(hsts as string, /max-age=31536000/);

  // Check Request ID header
  assert.ok(response.headers['x-request-id'], 'X-Request-ID header should be injected');

  await app.close();
});
