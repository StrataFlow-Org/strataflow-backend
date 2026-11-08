import { test } from 'node:test';
import assert from 'node:assert';
import Fastify from 'fastify';
import { healthRoutes } from '../src/routes/health.js';

test('GET /health returns status ok', async () => {
  const app = Fastify();
  await app.register(healthRoutes);

  const response = await app.inject({
    method: 'GET',
    url: '/health',
  });

  assert.strictEqual(response.statusCode, 200);
  const body = JSON.parse(response.payload);
  assert.strictEqual(body.status, 'ok');
  assert.strictEqual(body.service, 'strataflow-backend');
});
