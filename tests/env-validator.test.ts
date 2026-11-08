import { describe, it } from 'node:test';
import assert from 'node:assert';
import { EnvironmentValidator } from '../src/config/env-validator.js';

describe('EnvironmentValidator Unit Tests', () => {
  it('successfully validates default development environment variables', () => {
    const validated = EnvironmentValidator.validate({});
    assert.strictEqual(validated.PORT, 3001);
    assert.strictEqual(validated.NODE_ENV, 'development');
    assert.ok(validated.STRATAFLOW_CONTRACT_ID.startsWith('C'));
    assert.ok(validated.SERVER_SECRET_KEY.startsWith('S'));
  });

  it('rejects invalid contract address with clear descriptive issue', () => {
    assert.throws(() => {
      EnvironmentValidator.validate({
        STRATAFLOW_CONTRACT_ID: 'MALFORMED_CONTRACT_ID',
      });
    }, /STRATAFLOW_CONTRACT_ID must be a valid 56-character StrKey contract ID/);
  });

  it('rejects invalid server secret key', () => {
    assert.throws(() => {
      EnvironmentValidator.validate({
        SERVER_SECRET_KEY: 'GBBD47IF6LWK7P7MDEVTESTWINNINGTALKER2026COMMITS', // public key instead of secret seed
      });
    }, /SERVER_SECRET_KEY must be a valid Stellar secret seed/);
  });

  it('enforces 32-character minimum JWT secret in production mode', () => {
    assert.throws(() => {
      EnvironmentValidator.validate({
        NODE_ENV: 'production',
        JWT_SECRET: 'short-secret-12345',
      });
    }, /JWT_SECRET must be at least 32 characters in production/);
  });
});
