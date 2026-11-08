import { test } from 'node:test';
import assert from 'node:assert';
import { Keypair, TransactionBuilder, Networks } from '@stellar/stellar-sdk';
import { sep10Service } from '../src/services/sep10-auth.js';

test('SEP-10: generates valid challenge transaction XDR', () => {
  const clientKeypair = Keypair.random();
  const challenge = sep10Service.generateChallenge(clientKeypair.publicKey());

  assert.ok(challenge.challengeXdr);
  assert.ok(challenge.challengeXdr.length > 50);
  assert.strictEqual(challenge.networkPassphrase, 'Test SDF Network ; September 2015');
});

test('SEP-10: throws error on invalid client public key', () => {
  assert.throws(() => {
    sep10Service.generateChallenge('INVALID_PUBLIC_KEY');
  }, /Invalid Stellar client public key/);
});

test('SEP-10: cryptographically verifies valid signed challenge', () => {
  const clientKeypair = Keypair.random();
  const challenge = sep10Service.generateChallenge(clientKeypair.publicKey());

  // Client signs the challenge transaction
  const tx = TransactionBuilder.fromXDR(
    challenge.challengeXdr,
    challenge.networkPassphrase
  );
  tx.sign(clientKeypair);
  const signedXdr = tx.toXDR();

  const isValid = sep10Service.verifyChallenge(clientKeypair.publicKey(), signedXdr);
  assert.strictEqual(isValid, true);
});

test('SEP-10: rejects challenge signed with wrong keypair', () => {
  const clientKeypair = Keypair.random();
  const attackerKeypair = Keypair.random();
  const challenge = sep10Service.generateChallenge(clientKeypair.publicKey());

  // Attacker signs with different key
  const tx = TransactionBuilder.fromXDR(
    challenge.challengeXdr,
    challenge.networkPassphrase
  );
  tx.sign(attackerKeypair);
  const signedXdr = tx.toXDR();

  const isValid = sep10Service.verifyChallenge(clientKeypair.publicKey(), signedXdr);
  assert.strictEqual(isValid, false);
});

test('SEP-10: generates and verifies tamper-proof JWT', () => {
  const clientKeypair = Keypair.random();
  const token = sep10Service.generateToken(clientKeypair.publicKey());

  assert.ok(token);
  assert.strictEqual(token.split('.').length, 3);

  const claims = sep10Service.verifyToken(token);
  assert.ok(claims);
  assert.strictEqual(claims?.sub, clientKeypair.publicKey());
  assert.strictEqual(claims?.iss, 'strataflow-protocol');
});

test('SEP-10: rejects tampered JWT signature', () => {
  const clientKeypair = Keypair.random();
  const token = sep10Service.generateToken(clientKeypair.publicKey());
  const tamperedToken = `${token}tampered`;

  const claims = sep10Service.verifyToken(tamperedToken);
  assert.strictEqual(claims, null);
});

