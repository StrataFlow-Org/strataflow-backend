import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IpfsVerifierService, formatGatewayUrl } from '../src/services/ipfs-verifier.js';

test('Batch 6 IPFS: verifies valid v0 CID', () => {
  const cid = 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco';
  const res = IpfsVerifierService.verifyCid(cid);
  assert.equal(res.isValid, true);
  assert.equal(res.version, 'v0');
  assert.equal(formatGatewayUrl(cid), `https://ipfs.io/ipfs/${cid}`);
});

test('Batch 6 IPFS: rejects malformed CID string', () => {
  const invalid = 'not-a-cid-12345';
  const res = IpfsVerifierService.verifyCid(invalid);
  assert.equal(res.isValid, false);
});
