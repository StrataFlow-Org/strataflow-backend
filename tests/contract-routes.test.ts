import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import Fastify, { FastifyInstance } from 'fastify';
import { contractRoutes } from '../src/routes/contract';

describe('Contract HTTP Routes Integration Tests', () => {
  let app: FastifyInstance;

  before(async () => {
    app = Fastify();
    await app.register(contractRoutes);
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  it('GET /api/contract/info returns metadata and supported token contracts', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/contract/info',
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);

    assert.strictEqual(body.success, true);
    assert.ok(body.data.contractId.startsWith('C'));
    assert.strictEqual(body.data.network, 'TESTNET');
    assert.ok(body.data.version);
    assert.strictEqual(typeof body.data.isPaused, 'boolean');
    assert.ok(body.data.tokens.native);
  });

  it('GET /api/contract/fees returns protocol fee configuration', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/contract/fees',
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);

    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.feeBps, 50);
    assert.ok(body.data.recipient.startsWith('G'));
  });

  it('GET /api/contract/ttl/:agreementId returns storage TTL evaluation', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/contract/ttl/42?currentLedger=500000&liveUntilLedger=550000',
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);

    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.agreementId, '42');
    assert.strictEqual(body.data.remainingLedgers, 50000);
    assert.strictEqual(body.data.needsExtension, true);
    assert.ok(body.data.remainingDays > 0);
  });
});

