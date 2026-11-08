import { describe, it } from 'node:test';
import assert from 'node:assert';
import { agreementRepo } from '../src/repositories/agreement-repo.js';
import { AgreementStatus, MilestoneStatus } from '@prisma/client';

describe('Database Fallback Resilience Unit Tests', () => {
  agreementRepo.setUseDatabase(false);

  it('seamlessly operates using in-memory store when database is disconnected', async () => {
    const id = BigInt(Date.now());
    const amount = '5000000000';

    const created = await agreementRepo.upsertAgreement({
      onChainId: id,
      clientAddress: 'GBBD47IF6LWK7P7MDEVTESTWINNINGTALKER2026COMMITS',
      providerAddress: 'GCP777PROVIDERTESTNETWINNINGTALKER2026XYZ',
      arbiterAddress: 'GAK777ARBITERTESTNETWINNINGTALKER2026XYZ',
      tokenAddress: 'CDLZ73VU7Y4Z45ETK26QU62NDXQJ2277NY2Y57C2ZFU7SS7M6HWT7G4H',
      totalAmount: amount,
      balance: amount,
      status: AgreementStatus.FUNDED,
      deadline: new Date(Date.now() + 86400 * 1000),
      title: 'Resilience Test',
      milestones: [
        {
          index: 0,
          description: 'Scope',
          amount,
          status: MilestoneStatus.PENDING,
        },
      ],
    });

    assert.strictEqual(created.onChainId, id);

    const found = await agreementRepo.getAgreementByOnChainId(id);
    assert.ok(found);
    assert.strictEqual(found.onChainId, id);
    assert.strictEqual(found.balance, amount);
  });
});
