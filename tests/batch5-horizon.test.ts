import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getNativeXlmBalance, AccountTelemetry } from '../src/services/horizon-service.js';

test('Batch 5 Horizon Service: calculates native XLM balance accurately', () => {
  const telemetry: AccountTelemetry = {
    accountId: 'GBBD47IF6LWK7P7MDEVTESTWINNINGTALKER2026COMMITS',
    sequence: '1000',
    balances: [
      { asset: 'USDC:GBBD47IF6LWK7P7MDEVTESTWINNINGTALKER2026COMMITS', balance: '500.00' },
      { asset: 'XLM', balance: '125.7500000' },
    ],
    subentryCount: 2,
  };

  const xlm = getNativeXlmBalance(telemetry);
  assert.equal(xlm, '125.7500000');
});
