import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TokenRegistryService, convertToSmallestUnit } from '../src/services/token-registry.js';

test('Batch 6 Tokens: resolves supported tokens and decimals', () => {
  const tokens = TokenRegistryService.getSupportedTokens();
  assert.equal(tokens.length >= 2, true);

  const xlm = TokenRegistryService.findByContractAddress('CDLZ73VU7Y4Z45ETK26QU62NDXQJ2277NY2Y57C2ZFU7SS7M6HWT7G4H');
  assert.equal(xlm?.code, 'XLM');
  assert.equal(xlm?.decimals, 7);

  const stroops = convertToSmallestUnit('100.5', 7);
  assert.equal(stroops, 1005000000n);
});
