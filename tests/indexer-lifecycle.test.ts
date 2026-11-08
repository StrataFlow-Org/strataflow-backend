import { describe, it } from 'node:test';
import assert from 'node:assert';
import { agreementRepo } from '../src/repositories/agreement-repo.js';
import { AgreementStatus, MilestoneStatus } from '@prisma/client';

describe('Indexer Full Agreement Lifecycle Integration Tests', () => {
  agreementRepo.setUseDatabase(false);
  const onChainId = BigInt(Date.now());

  it('1. Creates new agreement from indexed AgreementCreated event', async () => {
    const agreement = await agreementRepo.upsertAgreement({
      onChainId,
      clientAddress: 'GBBD47IF6LWK7P7MDEVTESTWINNINGTALKER2026COMMITS',
      providerAddress: 'GCP777PROVIDERTESTNETWINNINGTALKER2026XYZ',
      arbiterAddress: 'GAK777ARBITERTESTNETWINNINGTALKER2026XYZ',
      tokenAddress: 'CDLZ73VU7Y4Z45ETK26QU62NDXQJ2277NY2Y57C2ZFU7SS7M6HWT7G4H',
      totalAmount: '10000000000',
      balance: '0',
      status: AgreementStatus.CREATED,
      deadline: new Date(Date.now() + 86400 * 30 * 1000),
      title: 'Full Lifecycle Escrow Test',
      milestones: [
        {
          index: 0,
          description: 'Phase 1: Architecture Specification',
          amount: '4000000000',
          status: MilestoneStatus.PENDING,
        },
        {
          index: 1,
          description: 'Phase 2: Delivery & QA',
          amount: '6000000000',
          status: MilestoneStatus.PENDING,
        },
      ],
    });

    assert.strictEqual(agreement.onChainId, onChainId);
    assert.strictEqual(agreement.status, AgreementStatus.CREATED);
    assert.strictEqual(agreement.balance, '0');
    assert.strictEqual(agreement.milestones?.length, 2);
  });

  it('2. Updates balance and status on indexed AgreementFunded event', async () => {
    const updated = await agreementRepo.updateAgreementStatus(
      onChainId,
      AgreementStatus.FUNDED,
      '10000000000'
    );

    assert.ok(updated);
    assert.strictEqual(updated.status, AgreementStatus.FUNDED);
    assert.strictEqual(updated.balance, '10000000000');
  });

  it('3. Records proof submission on indexed MilestoneSubmitted event', async () => {
    const proofHash = 'ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
    const milestone = await agreementRepo.updateMilestoneStatus(
      onChainId,
      0,
      MilestoneStatus.SUBMITTED,
      proofHash
    );

    assert.ok(milestone);
    assert.strictEqual(milestone.status, MilestoneStatus.SUBMITTED);
    assert.strictEqual(milestone.proofHash, proofHash);
  });

  it('4. Updates remaining balance on indexed MilestoneApproved event', async () => {
    await agreementRepo.updateMilestoneStatus(onChainId, 0, MilestoneStatus.APPROVED);
    const updated = await agreementRepo.updateAgreementStatus(
      onChainId,
      AgreementStatus.FUNDED,
      '6000000000' // 10,000,000,000 - 4,000,000,000
    );

    assert.ok(updated);
    assert.strictEqual(updated.balance, '6000000000');

    const agreement = await agreementRepo.getAgreementByOnChainId(onChainId);
    const m0 = agreement?.milestones?.find((m) => m.index === 0);
    assert.strictEqual(m0?.status, MilestoneStatus.APPROVED);
  });
});
