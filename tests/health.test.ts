import { test } from 'node:test';
import assert from 'node:assert';
import Fastify from 'fastify';
import { healthRoutes } from '../src/routes/health.js';

test('GET /health returns status ok with database and indexer telemetry', async () => {
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
  assert.ok(body.network);
  assert.ok(body.rpc);
  assert.ok(typeof body.database?.healthy === 'boolean');
  assert.ok(typeof body.indexer?.lastLedger === 'number');
});
