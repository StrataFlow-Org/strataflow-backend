import { test } from 'node:test';
import assert from 'node:assert';
import Fastify from 'fastify';
import { webhookRoutes } from '../src/routes/webhooks.js';
import { webhookDispatcher } from '../src/services/webhook-dispatcher.js';

test('Webhook Routes Integration Tests', async (t) => {
  webhookDispatcher.clear();
  const app = Fastify({ logger: false });
  await app.register(webhookRoutes);

  let createdId = '';

  await t.test('POST /api/webhooks/subscribe registers subscriber with secret', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/webhooks/subscribe',
      payload: {
        url: 'https://example.com/strataflow-webhook',
        eventTypes: ['AgreementCreated', 'AgreementFunded'],
        ownerAddress: 'GB_OWNER_1234567890',
      },
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.success, true);
    assert.ok(body.subscription.id);
    assert.ok(body.subscription.secret.startsWith('whsec_'));
    assert.strictEqual(body.subscription.url, 'https://example.com/strataflow-webhook');
    createdId = body.subscription.id;
  });

  await t.test('POST /api/webhooks/subscribe blocks SSRF loopback and private IPs', async () => {
    const loopbackRes = await app.inject({
      method: 'POST',
      url: '/api/webhooks/subscribe',
      payload: {
        url: 'http://localhost:3000/internal-admin',
        ownerAddress: 'GB_OWNER_1234567890',
      },
    });
    assert.strictEqual(loopbackRes.statusCode, 400);
    const loopbackBody = JSON.parse(loopbackRes.payload);
    assert.ok(loopbackBody.error.includes('SSRF Prevention'));

    const metadataRes = await app.inject({
      method: 'POST',
      url: '/api/webhooks/subscribe',
      payload: {
        url: 'http://169.254.169.254/latest/meta-data/',
        ownerAddress: 'GB_OWNER_1234567890',
      },
    });
    assert.strictEqual(metadataRes.statusCode, 400);

    const privateRes = await app.inject({
      method: 'POST',
      url: '/api/webhooks/subscribe',
      payload: {
        url: 'http://192.168.1.1/router-login',
        ownerAddress: 'GB_OWNER_1234567890',
      },
    });
    assert.strictEqual(privateRes.statusCode, 400);
  });

  await t.test('GET /api/webhooks lists subscriptions filtered by owner', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/webhooks?ownerAddress=GB_OWNER_1234567890',
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.count, 1);
    assert.strictEqual(body.subscriptions[0].id, createdId);
  });

  await t.test('POST /api/webhooks/test enqueues test dispatch', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/webhooks/test',
      payload: {
        eventType: 'AgreementCreated',
      },
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.success, true);
  });

  await t.test('DELETE /api/webhooks/:subscriptionId removes subscription', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/webhooks/${createdId}`,
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.success, true);

    // Verify it is gone
    const listRes = await app.inject({ method: 'GET', url: '/api/webhooks' });
    const listBody = JSON.parse(listRes.payload);
    assert.strictEqual(listBody.count, 0);
  });

  await app.close();
});

