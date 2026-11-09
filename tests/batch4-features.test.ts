import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nativeToScVal } from '@stellar/stellar-sdk';
import { SorobanEventDecoder } from '../src/services/event-decoder.js';
import { agreementRepo } from '../src/repositories/agreement-repo.js';
import { AgreementStatus, MilestoneStatus } from '@prisma/client';

test('Batch 4 Event Decoder: decodes reject and mutual cancel events', () => {
  const topic0 = nativeToScVal('reject').toXDR('base64');
  const topic1 = nativeToScVal(1n).toXDR('base64');
  const topic2 = nativeToScVal(0).toXDR('base64');
  const value = nativeToScVal('feedback_hash').toXDR('base64');

  const rawReject = {
    id: 'test-evt-reject-1',
    contractId: 'CDXVD3AAMEKDJIUP3XTRK64H5O3P7M3GUG5A3R6J6435H7I5Z2H2TY6J',
    ledger: 1000,
    ledgerClosedAt: new Date().toISOString(),
    topic: [topic0, topic1, topic2],
    value,
  };

  const decoded = SorobanEventDecoder.decodeRpcEvent(rawReject);
  assert.equal(decoded.type, 'reject');
  assert.equal(decoded.agreementId, '1');
  assert.equal(decoded.data.milestoneIdx, 0);
  assert.equal(decoded.data.feedbackHash, 'feedback_hash');
});

test('Batch 4 AgreementRepo: handles milestone rejection and arbiter reassignment', async () => {
  agreementRepo.setUseDatabase(false);
  const onChainId = 8888n;

  await agreementRepo.upsertAgreement({
    onChainId,
    clientAddress: 'G_CLIENT_8888',
    providerAddress: 'G_PROVIDER_8888',
    arbiterAddress: 'G_ARBITER_ORIGINAL',
    tokenAddress: 'CD_TOKEN',
    totalAmount: '1000',
    balance: '1000',
    status: AgreementStatus.FUNDED,
    deadline: new Date(Date.now() + 86400000),
    milestones: [
      { index: 0, description: 'Milestone 1', amount: '1000', status: MilestoneStatus.SUBMITTED, proofHash: 'proof_1' },
    ],
  });

  // Rejection
  await agreementRepo.updateMilestoneRejection(onChainId, 0, 'needs revisions');
  const ag = await agreementRepo.getAgreementByOnChainId(onChainId);
  assert.equal(ag?.milestones?.[0].status, MilestoneStatus.PENDING);
  assert.equal(ag?.milestones?.[0].proofHash, '');

  // Arbiter reassignment
  await agreementRepo.updateAgreementArbiter(onChainId, 'G_ARBITER_NEW');
  const agUpdated = await agreementRepo.getAgreementByOnChainId(onChainId);
  assert.equal(agUpdated?.arbiterAddress, 'G_ARBITER_NEW');

  // Party filter query
  const byParty = await agreementRepo.getAgreementsByParty('G_CLIENT_8888', 'client');
  assert.equal(byParty.total >= 1, true);
  assert.equal(byParty.items[0].clientAddress, 'G_CLIENT_8888');
});
