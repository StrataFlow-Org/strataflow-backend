import { test } from 'node:test';
import assert from 'node:assert';
import Fastify from 'fastify';
import { Keypair, TransactionBuilder } from '@stellar/stellar-sdk';
import { authRoutes } from '../src/routes/auth.js';
import { sep10Service } from '../src/services/sep10-auth.js';

test('Auth Route: POST /api/auth/challenge returns valid challenge', async () => {
  const app = Fastify();
  await app.register(authRoutes);

  const keypair = Keypair.random();
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/challenge',
    payload: {
      publicKey: keypair.publicKey(),
    },
  });

  assert.strictEqual(res.statusCode, 200);
  const data = JSON.parse(res.payload);
  assert.strictEqual(data.success, true);
  assert.ok(data.challengeXdr);
});

test('Auth Route: POST /api/auth/challenge rejects invalid public key', async () => {
  const app = Fastify();
  await app.register(authRoutes);

  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/challenge',
    payload: {
      publicKey: 'NOT_A_VALID_KEY',
    },
  });

  assert.strictEqual(res.statusCode, 400);
});

test('Auth Route: POST /api/auth/token returns JWT on valid signature', async () => {
  const app = Fastify();
  await app.register(authRoutes);

  const clientKeypair = Keypair.random();
  const challenge = sep10Service.generateChallenge(clientKeypair.publicKey());

  const tx = TransactionBuilder.fromXDR(
    challenge.challengeXdr,
    challenge.networkPassphrase
  );
  tx.sign(clientKeypair);
  const signedXdr = tx.toXDR();

  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/token',
    payload: {
      publicKey: clientKeypair.publicKey(),
      signedXdr,
    },
  });

  assert.strictEqual(res.statusCode, 200);
  const data = JSON.parse(res.payload);
  assert.strictEqual(data.success, true);
  assert.ok(data.token);
  assert.strictEqual(data.publicKey, clientKeypair.publicKey());
});

test('Auth Route: GET /api/auth/me returns authenticated address', async () => {
  const app = Fastify();
  await app.register(authRoutes);

  const clientKeypair = Keypair.random();
  const token = sep10Service.generateToken(clientKeypair.publicKey());

  const res = await app.inject({
    method: 'GET',
    url: '/api/auth/me',
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.strictEqual(res.statusCode, 200);
  const data = JSON.parse(res.payload);
  assert.strictEqual(data.authenticated, true);
  assert.strictEqual(data.publicKey, clientKeypair.publicKey());
});
