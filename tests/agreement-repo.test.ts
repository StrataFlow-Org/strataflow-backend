import { test } from 'node:test';
import assert from 'node:assert';
import { AgreementStatus, MilestoneStatus } from '@prisma/client';
import { agreementRepo } from '../src/repositories/agreement-repo.js';

test('AgreementRepository Unit Tests', async (t) => {
  agreementRepo.setUseDatabase(false);
  agreementRepo.clearInMemory();

  await t.test('should upsert and retrieve an agreement', async () => {
    const onChainId = 101n;
    const client = 'GCK7...CLIENT';
    const provider = 'GBK7...PROVIDER';
    const arbiter = 'GAK7...ARBITER';
    const token = 'CDLZ7...TOKEN';

    const agreement = await agreementRepo.upsertAgreement({
      onChainId,
      clientAddress: client,
      providerAddress: provider,
      arbiterAddress: arbiter,
      tokenAddress: token,
      totalAmount: '1000000000',
      balance: '1000000000',
      status: AgreementStatus.CREATED,
      deadline: new Date(Date.now() + 86400000 * 14),
      title: 'Decentralized Milestone Escrow',
      milestones: [
        { index: 0, description: 'Milestone 1', amount: '500000000' },
        { index: 1, description: 'Milestone 2', amount: '500000000' },
      ],
    });

    assert.ok(agreement);
    assert.strictEqual(agreement.clientAddress, client);
    assert.strictEqual(agreement.milestones?.length, 2);

    const fetched = await agreementRepo.getAgreementByOnChainId(onChainId);
    assert.ok(fetched);
    assert.strictEqual(fetched.totalAmount, '1000000000');
  });

  await t.test('should update agreement status and balance', async () => {
    const onChainId = 101n;
    const updated = await agreementRepo.updateAgreementStatus(onChainId, AgreementStatus.FUNDED, '1000000000');

    assert.ok(updated);
    assert.strictEqual(updated.status, AgreementStatus.FUNDED);
    assert.strictEqual(updated.balance, '1000000000');
  });

  await t.test('should update milestone status and submission proof', async () => {
    const onChainId = 101n;
    const proofHash = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';

    const submitted = await agreementRepo.updateMilestoneStatus(
      onChainId,
      0,
      MilestoneStatus.SUBMITTED,
      proofHash
    );

    assert.ok(submitted);
    assert.strictEqual(submitted.status, MilestoneStatus.SUBMITTED);
    assert.strictEqual(submitted.proofHash, proofHash);
    assert.ok(submitted.submittedAt);

    const approved = await agreementRepo.updateMilestoneStatus(
      onChainId,
      0,
      MilestoneStatus.APPROVED
    );

    assert.ok(approved);
    assert.strictEqual(approved.status, MilestoneStatus.APPROVED);
    assert.ok(approved.approvedAt);
  });

  await t.test('should filter and paginate agreements', async () => {
    // Add a second agreement
    await agreementRepo.upsertAgreement({
      onChainId: 102n,
      clientAddress: 'GCK7...CLIENT_OTHER',
      providerAddress: 'GBK7...PROVIDER',
      arbiterAddress: 'GAK7...ARBITER',
      tokenAddress: 'CDLZ7...TOKEN',
      totalAmount: '2000000000',
      balance: '2000000000',
      status: AgreementStatus.DISPUTED,
      deadline: new Date(Date.now() + 86400000 * 30),
    });

    const all = await agreementRepo.getAgreements();
    assert.strictEqual(all.total, 2);

    const filtered = await agreementRepo.getAgreements({
      clientAddress: 'GCK7...CLIENT',
    });
    assert.strictEqual(filtered.total, 1);
    assert.strictEqual(filtered.items[0].clientAddress, 'GCK7...CLIENT');

    const disputed = await agreementRepo.getAgreements({
      status: AgreementStatus.DISPUTED,
    });
    assert.strictEqual(disputed.total, 1);
    assert.strictEqual(disputed.items[0].onChainId, 102n);
  });

  await t.test('should record and attach indexed events', async () => {
    await agreementRepo.recordEventLog({
      agreementId: '101',
      type: 'MilestoneApproved',
      ledger: 123456,
      txHash: 'tx_abc123',
      payload: { milestone_index: 0, amount: '500000000' },
    });

    const agreementWithEvents = await agreementRepo.getAgreementByOnChainId(101n);
    assert.ok(agreementWithEvents);
    assert.strictEqual(agreementWithEvents.events?.length, 1);
    assert.strictEqual(agreementWithEvents.events[0].type, 'MilestoneApproved');
  });
});
