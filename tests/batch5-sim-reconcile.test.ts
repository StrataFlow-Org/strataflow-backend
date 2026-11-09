import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimateMaxResourceFee } from '../src/services/tx-simulation.js';
import { EscrowReconciliationService } from '../src/services/reconciliation.js';
import { agreementRepo } from '../src/repositories/agreement-repo.js';
import { AgreementStatus } from '@prisma/client';

test('Batch 5 Simulation: applies safety margin multiplier accurately', () => {
  const minFee = '1000';
  const feeWithMargin = estimateMaxResourceFee(minFee, 1.25);
  assert.equal(feeWithMargin, '1250');
});

test('Batch 5 Reconciliation: audits agreement balance against repository state', async () => {
  agreementRepo.setUseDatabase(false);
  const onChainId = 9999n;

  await agreementRepo.upsertAgreement({
    onChainId,
    clientAddress: 'G_CLIENT_9999',
    providerAddress: 'G_PROVIDER_9999',
    arbiterAddress: 'G_ARBITER_9999',
    tokenAddress: 'CD_TOKEN_9999',
    totalAmount: '2500',
    balance: '2500',
    status: AgreementStatus.FUNDED,
    deadline: new Date(Date.now() + 86400000),
  });

  const audit = await EscrowReconciliationService.auditAgreement(onChainId);
  assert.equal(audit?.agreementId, '9999');
  assert.equal(audit?.dbBalance, '2500');
  assert.equal(typeof audit?.isBalanced, 'boolean');
});
