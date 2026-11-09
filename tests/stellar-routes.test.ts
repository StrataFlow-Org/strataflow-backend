import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import Fastify, { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { stellarRoutes } from '../src/routes/stellar.js';

describe('Stellar Routes & SEP-0001 Integration Tests', () => {
  let app: FastifyInstance;

  before(async () => {
    app = Fastify();
    await app.register(swagger, {
      openapi: {
        info: {
          title: 'StrataFlow Protocol API',
          version: '1.2.0',
        },
      },
    });
    await app.register(swaggerUi, {
      routePrefix: '/documentation',
    });
    await app.register(stellarRoutes);
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  it('GET /.well-known/stellar.toml returns SEP-0001 compliant TOML', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/.well-known/stellar.toml',
    });

    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.headers['content-type']?.includes('text/plain'));
    assert.strictEqual(res.headers['access-control-allow-origin'], '*');
    assert.ok(res.body.includes('VERSION="2.0.0"'));
    assert.ok(res.body.includes('StrataFlow Protocol'));
    assert.ok(res.body.includes('STRATAFLOW_ESCROW='));
  });

  it('GET /api/stellar/account/:publicKey rejects malformed public key', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/stellar/account/invalid_key_format',
    });

    assert.strictEqual(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.ok(body.error.includes('Invalid Stellar'));
  });

  it('POST /api/stellar/simulate rejects empty body', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/stellar/simulate',
      payload: {},
    });

    assert.strictEqual(res.statusCode, 400);
  });

  it('GET /documentation/json returns valid OpenAPI 3.0 specification', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/documentation/json',
    });

    assert.strictEqual(res.statusCode, 200);
    const doc = JSON.parse(res.body);
    assert.strictEqual(doc.info.title, 'StrataFlow Protocol API');
    assert.strictEqual(doc.info.version, '1.2.0');
  });
});
