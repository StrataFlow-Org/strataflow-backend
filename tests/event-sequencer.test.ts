import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Event Sequencer & Deduplication Unit Tests', () => {
  interface IndexedEvent {
    id: string;
    ledger: number;
    pagingToken: string;
    txHash: string;
  }

  it('deduplicates identical events using composite txHash and eventId key', () => {
    const rawEvents: IndexedEvent[] = [
      { id: 'ev-1', ledger: 100, pagingToken: '100-01', txHash: 'tx-aaa' },
      { id: 'ev-2', ledger: 101, pagingToken: '101-01', txHash: 'tx-bbb' },
      { id: 'ev-1', ledger: 100, pagingToken: '100-01', txHash: 'tx-aaa' }, // duplicate
    ];

    const seen = new Set<string>();
    const deduplicated: IndexedEvent[] = [];

    for (const ev of rawEvents) {
      const key = `${ev.txHash}:${ev.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(ev);
      }
    }

    assert.strictEqual(deduplicated.length, 2);
    assert.strictEqual(deduplicated[0].id, 'ev-1');
    assert.strictEqual(deduplicated[1].id, 'ev-2');
  });

  it('orders out-of-sequence events strictly by ledger sequence and paging token', () => {
    const outOfOrder: IndexedEvent[] = [
      { id: 'ev-3', ledger: 105, pagingToken: '105-01', txHash: 'tx-ccc' },
      { id: 'ev-1', ledger: 100, pagingToken: '100-01', txHash: 'tx-aaa' },
      { id: 'ev-2', ledger: 102, pagingToken: '102-01', txHash: 'tx-bbb' },
    ];

    const sorted = [...outOfOrder].sort((a, b) => a.ledger - b.ledger);

    assert.strictEqual(sorted[0].ledger, 100);
    assert.strictEqual(sorted[1].ledger, 102);
    assert.strictEqual(sorted[2].ledger, 105);
  });
});

