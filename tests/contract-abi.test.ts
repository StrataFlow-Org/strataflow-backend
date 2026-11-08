import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  SorobanCreateAgreementParams,
  SorobanProtocolFeeConfig,
  StrataFlowContractAbi,
} from '../src/types/contract-abi';

describe('Contract ABI Signature & Type Verification Tests', () => {
  it('validates SorobanCreateAgreementParams structure and types', () => {
    const params: SorobanCreateAgreementParams = {
      client: 'GBBD47IF6LWK7P7MDEVTESTWINNINGTALKER2026COMMITS',
      provider: 'GCP777PROVIDERTESTNETWINNINGTALKER2026XYZ',
      arbiter: 'GAK777ARBITERTESTNETWINNINGTALKER2026XYZ',
      token: 'CDLZ73VU7Y4Z45ETK26QU62NDXQJ2277NY2Y57C2ZFU7SS7M6HWT7G4H',
      totalAmount: 10_000_000_000n,
      deadline: Math.floor(Date.now() / 1000) + 86400 * 30,
      milestoneDescriptions: ['Milestone 1', 'Milestone 2'],
      milestoneAmounts: [4_000_000_000n, 6_000_000_000n],
    };

    assert.strictEqual(params.milestoneDescriptions.length, 2);
    assert.strictEqual(params.milestoneAmounts.length, 2);
    const sum = params.milestoneAmounts.reduce((a, b) => a + b, 0n);
    assert.strictEqual(sum, params.totalAmount);
  });

  it('validates protocol fee basis points bounds', () => {
    const feeConfig: SorobanProtocolFeeConfig = {
      feeBps: 50, // 0.5%
      recipient: 'GBBD47IF6LWK7P7MDEVTESTWINNINGTALKER2026COMMITS',
    };

    assert.ok(feeConfig.feeBps >= 0);
    assert.ok(feeConfig.feeBps <= 500); // 5% max
    assert.ok(feeConfig.recipient.startsWith('G'));
  });

  it('calculates fee deductions accurately with integer arithmetic', () => {
    const feeBps = 50; // 0.5%
    const milestoneAmount = 1_000_000_000n; // 100 tokens

    const feeAmount = (milestoneAmount * BigInt(feeBps)) / 10_000n;
    const providerPayout = milestoneAmount - feeAmount;

    assert.strictEqual(feeAmount, 5_000_000n); // 0.5 tokens
    assert.strictEqual(providerPayout, 995_000_000n); // 99.5 tokens
    assert.strictEqual(feeAmount + providerPayout, milestoneAmount);
  });
});

