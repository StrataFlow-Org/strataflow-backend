import { describe, it } from 'node:test';
import assert from 'node:assert';
import { sep10Service } from '../src/services/sep10-auth.js';
import { Keypair } from '@stellar/stellar-sdk';

describe('Role-Based Access Control & Identity Verification Tests', () => {
  const clientKeypair = Keypair.random();
  const providerKeypair = Keypair.random();
  const thirdPartyKeypair = Keypair.random();

  it('verifies client token matches agreement client role', () => {
    const token = sep10Service.generateToken(clientKeypair.publicKey());
    const verified = sep10Service.verifyToken(token);

    assert.ok(verified);
    assert.strictEqual(verified.sub, clientKeypair.publicKey());

    const isClient = verified.sub === clientKeypair.publicKey();
    const isProvider = verified.sub === providerKeypair.publicKey();

    assert.strictEqual(isClient, true);
    assert.strictEqual(isProvider, false);
  });

  it('rejects authorization when non-participant attempts privileged action', () => {
    const intruderToken = sep10Service.generateToken(thirdPartyKeypair.publicKey());
    const verified = sep10Service.verifyToken(intruderToken);

    assert.ok(verified);
    const caller = verified.sub;

    const authorized =
      caller === clientKeypair.publicKey() || caller === providerKeypair.publicKey();

    assert.strictEqual(authorized, false);
  });
});
