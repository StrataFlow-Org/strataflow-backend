import { test } from 'node:test';
import assert from 'node:assert';
import { AgreementStatus } from '@prisma/client';
import { agreementRepo } from '../src/repositories/agreement-repo.js';

test('Platform Statistics Aggregation Tests', async (t) => {
  agreementRepo.setUseDatabase(false);
  agreementRepo.clearInMemory();

  await t.test('should compute zero stats on empty repository', async () => {
    const stats = await agreementRepo.getStats();
    assert.strictEqual(stats.totalAgreements, 0);
    assert.strictEqual(stats.totalVolume, '0');
    assert.strictEqual(stats.activeEscrows, 0);
    assert.strictEqual(stats.completedAgreements, 0);
    assert.strictEqual(stats.disputedAgreements, 0);
  });

  await t.test('should aggregate volume and counts correctly across statuses', async () => {
    // 1 Funded agreement: 1000 XLM / stroops
    await agreementRepo.upsertAgreement({
      onChainId: 1n,
      clientAddress: 'GC_A',
      providerAddress: 'GB_A',
      arbiterAddress: 'GA_A',
      tokenAddress: 'CD_A',
      totalAmount: '1000000000',
      balance: '1000000000',
      status: AgreementStatus.FUNDED,
      deadline: new Date(),
      milestones: [{ index: 0, description: 'M1', amount: '1000000000' }],
    });

    // 1 Completed agreement: 2500 XLM / stroops
    await agreementRepo.upsertAgreement({
      onChainId: 2n,
      clientAddress: 'GC_B',
      providerAddress: 'GB_B',
      arbiterAddress: 'GA_B',
      tokenAddress: 'CD_B',
      totalAmount: '2500000000',
      balance: '0',
      status: AgreementStatus.COMPLETED,
      deadline: new Date(),
      milestones: [
        { index: 0, description: 'M1', amount: '1500000000' },
        { index: 1, description: 'M2', amount: '1000000000' },
      ],
    });

    // 1 Disputed agreement: 500 XLM / stroops
    await agreementRepo.upsertAgreement({
      onChainId: 3n,
      clientAddress: 'GC_C',
      providerAddress: 'GB_C',
      arbiterAddress: 'GA_C',
      tokenAddress: 'CD_C',
      totalAmount: '500000000',
      balance: '500000000',
      status: AgreementStatus.DISPUTED,
      deadline: new Date(),
      milestones: [{ index: 0, description: 'M1', amount: '500000000' }],
    });

    const stats = await agreementRepo.getStats();

    assert.strictEqual(stats.totalAgreements, 3);
    assert.strictEqual(stats.totalVolume, '4000000000'); // 1000 + 2500 + 500 = 4000
    assert.strictEqual(stats.activeEscrows, 1);
    assert.strictEqual(stats.completedAgreements, 1);
    assert.strictEqual(stats.disputedAgreements, 1);
    assert.strictEqual(stats.totalMilestones, 4);
  });
});

