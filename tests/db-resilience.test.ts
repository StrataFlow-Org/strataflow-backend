import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AgreementRepository } from '../src/services/agreement-repository';
import { AgreementStatus, MilestoneStatus } from '../src/types/agreement';

describe('Database Fallback Resilience Unit Tests', () => {
  it('seamlessly operates using in-memory store when database is disconnected', async () => {
    // Instantiate standalone repository instance
    const repo = new AgreementRepository();
    const id = `fallback-${Date.now()}`;

    const created = await repo.upsert({
      onChainId: id,
      clientAddress: 'GBBD47IF6LWK7P7MDEVTESTWINNINGTALKER2026COMMITS',
      providerAddress: 'GCP777PROVIDERTESTNETWINNINGTALKER2026XYZ',
      arbiterAddress: 'GAK777ARBITERTESTNETWINNINGTALKER2026XYZ',
      tokenAddress: 'CDLZ73VU7Y4Z45ETK26QU62NDXQJ2277NY2Y57C2ZFU7SS7M6HWT7G4H',
      totalAmount: 5_000_000_000n,
      balance: 5_000_000_000n,
      status: AgreementStatus.FUNDED,
      deadline: new Date(Date.now() + 86400 * 1000),
      title: 'Resilience Test',
      milestones: [
        {
          index: 0,
          description: 'Scope',
          amount: 5_000_000_000n,
          status: MilestoneStatus.PENDING,
        },
      ],
    });

    assert.strictEqual(created.onChainId, id);

    const found = await repo.findByOnChainId(id);
    assert.ok(found);
    assert.strictEqual(found.onChainId, id);
    assert.strictEqual(found.balance, 5_000_000_000n);
  });
});
