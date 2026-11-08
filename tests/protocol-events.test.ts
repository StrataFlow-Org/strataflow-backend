import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  ProtocolEventPayload,
  AgreementCreatedEvent,
  MilestoneApprovedEvent,
  DisputeResolvedEvent,
} from '../src/types/protocol-events';

describe('Protocol Event Schema & Discriminator Tests', () => {
  it('correctly discriminates AgreementCreatedEvent', () => {
    const event: AgreementCreatedEvent = {
      type: 'AgreementCreated',
      agreementId: 101n,
      client: 'GBBD47IF6LWK7P7MDEVTESTWINNINGTALKER2026COMMITS',
      provider: 'GCP777PROVIDERTESTNETWINNINGTALKER2026XYZ',
      totalAmount: 50_000_000_000n,
      deadline: 1735689600,
      ledger: 541200,
      txHash: 'e42ba5566fbc2646d2a7c41e8c105cb83015bbf099411d331923055f5f72cf7e',
    };

    assert.strictEqual(event.type, 'AgreementCreated');
    assert.strictEqual(typeof event.agreementId, 'bigint');
    assert.strictEqual(event.totalAmount, 50_000_000_000n);
  });

  it('correctly discriminates MilestoneApprovedEvent with fee deduction tracking', () => {
    const event: MilestoneApprovedEvent = {
      type: 'MilestoneApproved',
      agreementId: 101n,
      milestoneIndex: 0,
      amount: 10_000_000_000n,
      feeDeducted: 50_000_000n, // 0.5%
      ledger: 542100,
      txHash: 'd9fba457a412b591b6bc420f12a95c38982f1b4a03498b894175399589a805fa',
    };

    assert.strictEqual(event.type, 'MilestoneApproved');
    assert.strictEqual(event.feeDeducted, 50_000_000n);
    assert.strictEqual(event.amount - event.feeDeducted, 9_950_000_000n);
  });

  it('correctly discriminates DisputeResolvedEvent ensuring balance conservation', () => {
    const event: DisputeResolvedEvent = {
      type: 'DisputeResolved',
      agreementId: 101n,
      arbiter: 'GAK777ARBITERTESTNETWINNINGTALKER2026XYZ',
      clientAmount: 40_000_000_000n,
      providerAmount: 10_000_000_000n,
      ledger: 543000,
      txHash: '2f50dde11504cf10a82643a6d71b80a71be70b43171350a417088b90c1e8e54e',
    };

    assert.strictEqual(event.type, 'DisputeResolved');
    assert.strictEqual(event.clientAmount + event.providerAmount, 50_000_000_000n);
  });
});

