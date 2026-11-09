import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateEscrowVelocity } from '../src/services/analytics.js';
import { validateMilestoneProofFormat } from '../src/services/sanitizer.js';

test('Batch 6 Analytics: computes escrow velocity accurately', () => {
  const velocity = calculateEscrowVelocity('10000', 4);
  assert.equal(velocity, '2500');
});

test('Batch 6 Sanitizer: validates proof hash syntax', () => {
  assert.equal(validateMilestoneProofFormat('ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco'), true);
  assert.equal(validateMilestoneProofFormat('bafybeicg2gg3'), true);
  assert.equal(validateMilestoneProofFormat('http://evil.com'), false);
});
