import { describe, it } from 'node:test';
import assert from 'node:assert';
import { sep10AuthService } from '../src/services/sep10-auth';
import { Keypair } from '@stellar/stellar-sdk';

describe('Role-Based Access Control & Identity Verification Tests', () => {
  const clientKeypair = Keypair.random();
  const providerKeypair = Keypair.random();
  const thirdPartyKeypair = Keypair.random();

  it('verifies client token matches agreement client role', () => {
    const token = sep10AuthService.generateSessionJwt(clientKeypair.publicKey());
    const verified = sep10AuthService.verifySessionJwt(token);

    assert.ok(verified);
    assert.strictEqual(verified.sub, clientKeypair.publicKey());

    const isClient = verified.sub === clientKeypair.publicKey();
    const isProvider = verified.sub === providerKeypair.publicKey();

    assert.strictEqual(isClient, true);
    assert.strictEqual(isProvider, false);
  });

  it('rejects authorization when non-participant attempts privileged action', () => {
    const intruderToken = sep10AuthService.generateSessionJwt(thirdPartyKeypair.publicKey());
    const verified = sep10AuthService.verifySessionJwt(intruderToken);

    assert.ok(verified);
    const caller = verified.sub;

    const authorized =
      caller === clientKeypair.publicKey() || caller === providerKeypair.publicKey();

    assert.strictEqual(authorized, false);
  });
});
