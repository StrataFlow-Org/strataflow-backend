import { test } from 'node:test';
import assert from 'node:assert';
import { nativeToScVal, xdr } from '@stellar/stellar-sdk';
import { SorobanEventDecoder } from '../src/services/event-decoder.js';

test('Event Decoder: decodes create event ScVal payload correctly', () => {
  const topic0 = nativeToScVal('create').toXDR('base64');
  const topic1 = nativeToScVal(1n).toXDR('base64');
  const val0 = nativeToScVal('GBBD47IF6LWK7P7MDEVTESTWINNINGTALKER2026COMMITS');
  const val1 = nativeToScVal('GCP7XYZTESTNETPROVIDERADDRESS2026COMMITS');
  const val2 = nativeToScVal(5000n);
  const value = xdr.ScVal.scvVec([val0, val1, val2]).toXDR('base64');

  const decoded = SorobanEventDecoder.decodeRpcEvent({
    id: '0000000001',
    contractId: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
    ledger: 123456,
    ledgerClosedAt: '2026-11-08T20:00:00Z',
    topic: [topic0, topic1],
    value,
  });

  assert.strictEqual(decoded.type, 'create');
  assert.strictEqual(decoded.agreementId, '1');
  assert.strictEqual(decoded.data.client, 'GBBD47IF6LWK7P7MDEVTESTWINNINGTALKER2026COMMITS');
  assert.strictEqual(decoded.data.provider, 'GCP7XYZTESTNETPROVIDERADDRESS2026COMMITS');
  assert.strictEqual(decoded.data.totalAmount, '5000');
});

test('Event Decoder: decodes submit milestone proof hash', () => {
  const topic0 = nativeToScVal('submit').toXDR('base64');
  const topic1 = nativeToScVal(1n).toXDR('base64');
  const topic2 = nativeToScVal(0).toXDR('base64');
  const value = nativeToScVal('QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco').toXDR('base64');

  const decoded = SorobanEventDecoder.decodeRpcEvent({
    id: '0000000002',
    contractId: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
    ledger: 123457,
    ledgerClosedAt: '2026-11-08T20:01:00Z',
    topic: [topic0, topic1, topic2],
    value,
  });

  assert.strictEqual(decoded.type, 'submit');
  assert.strictEqual(decoded.agreementId, '1');
  assert.strictEqual(decoded.data.milestoneIdx, 0);
  assert.strictEqual(decoded.data.proofHash, 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco');
});

test('Event Decoder: decodes release event milestone remaining balance', () => {
  const topic0 = nativeToScVal('release').toXDR('base64');
  const topic1 = nativeToScVal(1n).toXDR('base64');
  const topic2 = nativeToScVal(0).toXDR('base64');
  const value = nativeToScVal(3500n).toXDR('base64');

  const decoded = SorobanEventDecoder.decodeRpcEvent({
    id: '0000000003',
    contractId: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
    ledger: 123458,
    ledgerClosedAt: '2026-11-08T20:02:00Z',
    topic: [topic0, topic1, topic2],
    value,
  });

  assert.strictEqual(decoded.type, 'release');
  assert.strictEqual(decoded.agreementId, '1');
  assert.strictEqual(decoded.data.remainingBalance, '3500');
});
