import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ContractDataKeyHelper, ContractDataKeyType } from '../src/types/data-key';

describe('ContractDataKeyHelper Serialization Tests', () => {
  it('serializes and deserializes Admin DataKey', () => {
    const original: ContractDataKeyType = { kind: 'Admin' };
    const scVal = ContractDataKeyHelper.toScVal(original);
    const parsed = ContractDataKeyHelper.fromScVal(scVal);

    assert.deepStrictEqual(parsed, original);
  });

  it('serializes and deserializes AgreementCounter DataKey', () => {
    const original: ContractDataKeyType = { kind: 'AgreementCounter' };
    const scVal = ContractDataKeyHelper.toScVal(original);
    const parsed = ContractDataKeyHelper.fromScVal(scVal);

    assert.deepStrictEqual(parsed, original);
  });

  it('serializes and deserializes Agreement(u64) DataKey', () => {
    const original: ContractDataKeyType = { kind: 'Agreement', id: 42n };
    const scVal = ContractDataKeyHelper.toScVal(original);
    const parsed = ContractDataKeyHelper.fromScVal(scVal);

    assert.deepStrictEqual(parsed, original);
  });

  it('serializes and deserializes Milestone(u64, u32) DataKey', () => {
    const original: ContractDataKeyType = { kind: 'Milestone', agreementId: 101n, index: 2 };
    const scVal = ContractDataKeyHelper.toScVal(original);
    const parsed = ContractDataKeyHelper.fromScVal(scVal);

    assert.deepStrictEqual(parsed, original);
  });

  it('serializes and deserializes Dispute(u64) DataKey', () => {
    const original: ContractDataKeyType = { kind: 'Dispute', agreementId: 77n };
    const scVal = ContractDataKeyHelper.toScVal(original);
    const parsed = ContractDataKeyHelper.fromScVal(scVal);

    assert.deepStrictEqual(parsed, original);
  });

  it('serializes and deserializes FeeConfig and IsPaused DataKeys', () => {
    const feeKey: ContractDataKeyType = { kind: 'FeeConfig' };
    assert.deepStrictEqual(ContractDataKeyHelper.fromScVal(ContractDataKeyHelper.toScVal(feeKey)), feeKey);

    const pauseKey: ContractDataKeyType = { kind: 'IsPaused' };
    assert.deepStrictEqual(ContractDataKeyHelper.fromScVal(ContractDataKeyHelper.toScVal(pauseKey)), pauseKey);
  });
});

