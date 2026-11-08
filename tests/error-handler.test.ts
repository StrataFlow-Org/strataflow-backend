import { test } from 'node:test';
import assert from 'node:assert';
import Fastify from 'fastify';
import { z } from 'zod';
import { errorHandlerPlugin } from '../src/plugins/error-handler.js';

test('Centralized Error Handler Tests', async (t) => {
  const app = Fastify();
  await app.register(errorHandlerPlugin);

  app.get('/test-500', async () => {
    throw new Error('Database password leak attempt');
  });

  app.post('/test-zod', async (request) => {
    const schema = z.object({
      age: z.number().min(18),
    });
    return schema.parse(request.body);
  });

  await t.test('formats ZodError into 400 with path details', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/test-zod',
      payload: { age: 10 },
    });

    assert.strictEqual(res.statusCode, 400);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.statusCode, 400);
    assert.strictEqual(body.error, 'Bad Request');
    assert.ok(body.details.length > 0);
  });

  await t.test('masks internal error details on 500 in non-dev environments', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/test-500',
    });

    assert.strictEqual(res.statusCode, 500);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.statusCode, 500);
    assert.strictEqual(body.error, 'Internal Server Error');
    assert.ok(body.requestId);
  });

  await app.close();
});
