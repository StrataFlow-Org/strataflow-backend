import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IpfsVerifierService, formatGatewayUrl } from '../src/services/ipfs-verifier.js';

test('Batch 6 IPFS: verifies valid v0 CID', () => {
  const cid = 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco';
  const res = IpfsVerifierService.verifyCid(cid);
  assert.equal(res.isValid, true);
  assert.equal(res.version, 'v0');
  assert.equal(formatGatewayUrl(cid), `https://ipfs.io/ipfs/${cid}`);
  assert.equal(res.fallbackGateways.length, 4);
  assert.ok(res.fallbackGateways.some((u) => u.includes('cloudflare-ipfs.com')));
  assert.ok(res.fallbackGateways.some((u) => u.includes('pinata.cloud')));
});

test('Batch 6 IPFS: verifies multi-gateway list resolver', () => {
  const cid = 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco';
  const urls = IpfsVerifierService.getAllGatewayUrls(`ipfs://${cid}`);
  assert.equal(urls.length, 4);
  assert.ok(urls[0].startsWith('https://ipfs.io/ipfs/'));
  assert.ok(urls[1].startsWith('https://cloudflare-ipfs.com/ipfs/'));
});

test('Batch 6 IPFS: rejects malformed CID string', () => {
  const invalid = 'not-a-cid-12345';
  const res = IpfsVerifierService.verifyCid(invalid);
  assert.equal(res.isValid, false);
  assert.equal(res.fallbackGateways.length, 0);
  assert.equal(IpfsVerifierService.getAllGatewayUrls(invalid).length, 0);
});
