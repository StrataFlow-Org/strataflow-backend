import { test } from 'node:test';
import assert from 'node:assert';
import { indexerService } from '../src/services/soroban-indexer.js';

test('Indexer: calculates exponential backoff with ceiling', () => {
  const backoff0 = indexerService.calculateBackoff(0);
  assert.ok(backoff0 >= 1000 && backoff0 <= 1500);

  const backoff3 = indexerService.calculateBackoff(3);
  assert.ok(backoff3 >= 8000 && backoff3 <= 8500);

  const backoff10 = indexerService.calculateBackoff(10);
  assert.ok(backoff10 >= 30000 && backoff10 <= 30500);
});

test('Indexer: records and filters events by agreementId and type', () => {
  indexerService.recordEvent({
    id: 'evt-1',
    contractId: 'C1',
    ledger: 100,
    timestamp: new Date().toISOString(),
    type: 'create',
    agreementId: '42',
    topicDetails: ['create', '42'],
    data: { totalAmount: '1000' },
  });

  indexerService.recordEvent({
    id: 'evt-2',
    contractId: 'C1',
    ledger: 101,
    timestamp: new Date().toISOString(),
    type: 'fund',
    agreementId: '42',
    topicDetails: ['fund', '42'],
    data: { amount: '1000' },
  });

  indexerService.recordEvent({
    id: 'evt-3',
    contractId: 'C1',
    ledger: 102,
    timestamp: new Date().toISOString(),
    type: 'create',
    agreementId: '99',
    topicDetails: ['create', '99'],
    data: { totalAmount: '500' },
  });

  const agreement42Events = indexerService.getEvents('42');
  assert.strictEqual(agreement42Events.length, 2);

  const createEvents = indexerService.getEvents(undefined, 'create');
  assert.ok(createEvents.length >= 2);
});
