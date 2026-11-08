import { test } from 'node:test';
import assert from 'node:assert';
import Fastify from 'fastify';
import { AgreementStatus } from '@prisma/client';
import { agreementRoutes } from '../src/routes/agreements.js';
import { agreementRepo } from '../src/repositories/agreement-repo.js';
import { setupBigIntSerialization } from '../src/services/serializer.js';

setupBigIntSerialization();

async function buildTestApp() {
  const app = Fastify({ logger: false });
  await app.register(agreementRoutes);
  return app;
}

test('Agreement Routes Integration Tests', async (t) => {
  agreementRepo.setUseDatabase(false);
  agreementRepo.clearInMemory();

  const app = await buildTestApp();

  await agreementRepo.upsertAgreement({
    onChainId: 501n,
    clientAddress: 'G_CLIENT_X',
    providerAddress: 'G_PROVIDER_Y',
    arbiterAddress: 'G_ARBITER_Z',
    tokenAddress: 'CD_TOKEN_A',
    totalAmount: '5000000',
    balance: '5000000',
    status: AgreementStatus.FUNDED,
    deadline: new Date(Date.now() + 86400000 * 7),
    title: 'Integration Test Escrow',
    milestones: [
      { index: 0, description: 'Alpha release', amount: '2500000' },
      { index: 1, description: 'Beta release', amount: '2500000' },
    ],
  });

  await t.test('GET /api/agreements returns paginated agreements list', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/agreements',
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 1);
    assert.strictEqual(body.pagination.total, 1);
  });

  await t.test('GET /api/agreements/:onChainId returns agreement details with progress', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/agreements/501',
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.title, 'Integration Test Escrow');
    assert.strictEqual(body.data.progress.totalMilestones, 2);
    assert.strictEqual(body.data.progress.approvedMilestones, 0);
  });

  await t.test('GET /api/agreements/:onChainId returns 404 for unknown agreement', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/agreements/999999',
    });

    assert.strictEqual(res.statusCode, 404);
  });

  await t.test('GET /api/stats returns analytics', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/stats',
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.stats.totalAgreements, 1);
    assert.strictEqual(body.stats.activeEscrows, 1);
    assert.strictEqual(body.stats.totalVolume, '5000000');
  });

  await app.close();
});
