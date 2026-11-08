import { describe, it } from 'node:test';
import assert from 'node:assert';
import { agreementRepository } from '../src/services/agreement-repository';
import { AgreementStatus, MilestoneStatus } from '../src/types/agreement';

describe('Indexer Full Agreement Lifecycle Integration Tests', () => {
  const onChainId = `lifecycle-${Date.now()}`;

  it('1. Creates new agreement from indexed AgreementCreated event', async () => {
    const agreement = await agreementRepository.upsert({
      onChainId,
      clientAddress: 'GBBD47IF6LWK7P7MDEVTESTWINNINGTALKER2026COMMITS',
      providerAddress: 'GCP777PROVIDERTESTNETWINNINGTALKER2026XYZ',
      arbiterAddress: 'GAK777ARBITERTESTNETWINNINGTALKER2026XYZ',
      tokenAddress: 'CDLZ73VU7Y4Z45ETK26QU62NDXQJ2277NY2Y57C2ZFU7SS7M6HWT7G4H',
      totalAmount: 10_000_000_000n,
      balance: 0n,
      status: AgreementStatus.CREATED,
      deadline: new Date(Date.now() + 86400 * 30 * 1000),
      title: 'Full Lifecycle Escrow Test',
      milestones: [
        {
          index: 0,
          description: 'Phase 1: Architecture Specification',
          amount: 4_000_000_000n,
          status: MilestoneStatus.PENDING,
        },
        {
          index: 1,
          description: 'Phase 2: Delivery & QA',
          amount: 6_000_000_000n,
          status: MilestoneStatus.PENDING,
        },
      ],
    });

    assert.strictEqual(agreement.onChainId, onChainId);
    assert.strictEqual(agreement.status, AgreementStatus.CREATED);
    assert.strictEqual(agreement.balance, 0n);
    assert.strictEqual(agreement.milestones.length, 2);
  });

  it('2. Updates balance and status on indexed AgreementFunded event', async () => {
    const updated = await agreementRepository.updateStatus(
      onChainId,
      AgreementStatus.FUNDED,
      10_000_000_000n
    );

    assert.strictEqual(updated.status, AgreementStatus.FUNDED);
    assert.strictEqual(updated.balance, 10_000_000_000n);
  });

  it('3. Records proof submission on indexed MilestoneSubmitted event', async () => {
    const proofHash = 'ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
    const updated = await agreementRepository.updateMilestone(
      onChainId,
      0,
      MilestoneStatus.SUBMITTED,
      proofHash
    );

    const m0 = updated.milestones.find((m) => m.index === 0);
    assert.strictEqual(m0?.status, MilestoneStatus.SUBMITTED);
    assert.strictEqual(m0?.proofHash, proofHash);
  });

  it('4. Updates remaining balance on indexed MilestoneApproved event', async () => {
    await agreementRepository.updateMilestone(onChainId, 0, MilestoneStatus.APPROVED);
    const updated = await agreementRepository.updateStatus(
      onChainId,
      AgreementStatus.FUNDED,
      6_000_000_000n // 10,000,000,000 - 4,000,000,000
    );

    assert.strictEqual(updated.balance, 6_000_000_000n);
    const m0 = updated.milestones.find((m) => m.index === 0);
    assert.strictEqual(m0?.status, MilestoneStatus.APPROVED);
  });
});
