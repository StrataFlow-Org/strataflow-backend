import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  SorobanContractErrorCode,
  SorobanErrorTranslator,
  ERROR_CODE_DESCRIPTIONS,
} from '../src/types/contract-errors';

describe('Soroban Error Code Translation & Handling Tests', () => {
  it('translates all defined error codes to non-empty descriptions', () => {
    const codes = Object.values(SorobanContractErrorCode).filter(
      (v) => typeof v === 'number'
    ) as number[];

    assert.ok(codes.length >= 20);

    for (const code of codes) {
      const msg = SorobanErrorTranslator.getErrorMessage(code);
      assert.ok(msg && msg.length > 5);
      assert.notStrictEqual(msg, `Soroban Contract Error #${code}`);
    }
  });

  it('parses Soroban simulation error pattern "Error(Contract, #12)"', () => {
    const rawError = 'HostError: Error(Contract, #12) thrown during invocation';
    const parsed = SorobanErrorTranslator.parseError(rawError);

    assert.strictEqual(parsed.code, 12);
    assert.strictEqual(parsed.message, ERROR_CODE_DESCRIPTIONS[SorobanContractErrorCode.DeadlinePassed]);
  });

  it('parses Soroban simulation error pattern without hash symbol "Error(Contract, 3)"', () => {
    const rawError = 'Transaction simulation failed: Error(Contract, 3)';
    const parsed = SorobanErrorTranslator.parseError(rawError);

    assert.strictEqual(parsed.code, 3);
    assert.strictEqual(parsed.message, ERROR_CODE_DESCRIPTIONS[SorobanContractErrorCode.Unauthorized]);
  });

  it('returns generic message for non-Soroban errors', () => {
    const rawError = new Error('Network connection timeout');
    const parsed = SorobanErrorTranslator.parseError(rawError);

    assert.strictEqual(parsed.code, undefined);
    assert.strictEqual(parsed.message, 'Network connection timeout');
  });
});
