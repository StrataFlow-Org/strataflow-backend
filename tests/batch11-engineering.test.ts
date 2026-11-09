import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TransactionManager } from '../src/services/tx-manager';
import { ApiResponseHelper } from '../src/utils/api-response';
import { EventSequencer } from '../src/services/event-sequencer';
import { StructuredLogger } from '../src/services/structured-logger';
import { LruCache } from '../src/utils/lru-cache';
import { CursorManager } from '../src/services/cursor-manager';
import { SorobanErrorParser } from '../src/utils/soroban-error-parser';
import { ServiceContainer } from '../src/services/container';
import { SchemaValidator } from '../src/config/schema-validator';
import { HealthRegistry } from '../src/services/health-registry';
import { AgreementStateMachine } from '../src/services/state-machine';
import { FeeEstimator } from '../src/services/fee-estimator';
import { SafeJson } from '../src/utils/safe-json';
import { BatchedTaskQueue } from '../src/utils/task-queue';
import { AbiCatalog } from '../src/services/abi-catalog';
import { WebhookFormatter } from '../src/services/webhook-formatter';
import { PaginationHelper } from '../src/utils/pagination';
import { RpcTelemetry } from '../src/services/rpc-telemetry';

describe('Batch 11 Codebase & Engineering Tests', () => {
  it('TransactionManager: executes and rolls back on error', async () => {
    let rolledBack = false;
    await assert.rejects(async () => {
      await TransactionManager.withTransaction(async () => {
        throw new Error('fail');
      }, async () => {
        rolledBack = true;
      });
    });
    assert.equal(rolledBack, true);
  });

  it('ApiResponseHelper: builds consistent response envelopes', () => {
    const success = ApiResponseHelper.success({ id: 1 }, 'req_123');
    assert.equal(success.success, true);
    assert.equal(success.meta?.requestId, 'req_123');

    const err = ApiResponseHelper.error('fail', 'CODE_400');
    assert.equal(err.success, false);
    assert.equal(err.error?.code, 'CODE_400');
  });

  it('EventSequencer: orders and deduplicates events', () => {
    const events = [
      { ledgerSequence: 2, txHash: 'tx1', eventId: 'b', timestamp: 100 },
      { ledgerSequence: 1, txHash: 'tx2', eventId: 'a', timestamp: 50 },
      { ledgerSequence: 1, txHash: 'tx2', eventId: 'a', timestamp: 50 }, // duplicate
    ];
    const unique = EventSequencer.deduplicate(events);
    assert.equal(unique.length, 2);
    const sorted = EventSequencer.sortEvents(unique);
    assert.equal(sorted[0].ledgerSequence, 1);
  });

  it('LruCache: evicts oldest key when full', () => {
    const cache = new LruCache<string, number>(2, 5000);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3); // evicts 'a'
    assert.equal(cache.get('a'), undefined);
    assert.equal(cache.get('b'), 2);
    assert.equal(cache.get('c'), 3);
  });

  it('SorobanErrorParser: parses Soroban simulation errors', () => {
    const parsed = SorobanErrorParser.parse('Transaction failed: Error(Contract, #24)');
    assert.equal(parsed.isSorobanError, true);
    assert.equal(parsed.errorCode, 24);
    assert.ok(parsed.description.includes('shorter than minimum'));
  });

  it('AgreementStateMachine: enforces valid state transitions', () => {
    assert.equal(AgreementStateMachine.canTransition('CREATED', 'FUNDED'), true);
    assert.equal(AgreementStateMachine.canTransition('FUNDED', 'COMPLETED'), true);
    assert.equal(AgreementStateMachine.canTransition('COMPLETED', 'DISPUTED'), false);
  });

  it('FeeEstimator: estimates surge fee correctly', () => {
    const fee = FeeEstimator.estimateFee(2, 1.5);
    assert.equal(fee, 300);
  });

  it('SafeJson: serializes BigInt and handles circular references safely', () => {
    const circular: any = { num: 42n };
    circular.self = circular;
    const str = SafeJson.stringify(circular);
    assert.ok(str.includes('"num":"42"'));
    assert.ok(str.includes('"self":"[Circular]"'));
  });

  it('PaginationHelper: calculates pages and slices accurately', () => {
    const items = [1, 2, 3, 4, 5, 6, 7];
    const paginated = PaginationHelper.paginate(items, { page: 2, limit: 3 });
    assert.deepEqual(paginated.items, [4, 5, 6]);
    assert.equal(paginated.totalPages, 3);
  });

  it('RpcTelemetry: records latency and calculates average', () => {
    const telem = new RpcTelemetry();
    telem.recordSample('node1', 100);
    telem.recordSample('node1', 200);
    assert.equal(telem.getAverageLatency('node1'), 150);
  });
});
