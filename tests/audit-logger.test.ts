import { test } from 'node:test';
import assert from 'node:assert';
import { auditLogger } from '../src/services/audit-logger.js';

test('AuditLoggerService Credential Redaction Tests', async () => {
  auditLogger.clear();

  const entry = auditLogger.log({
    actorAddress: 'GC_ACTOR_1',
    ip: '192.168.1.1',
    method: 'POST',
    path: '/api/auth/token',
    statusCode: 200,
    durationMs: 45,
    details: {
      publicKey: 'GC_ACTOR_1',
      token: 'secret-jwt-token-value',
      jwt: 'another-secret',
      signature: 'ed25519-sig-data',
      userObject: {
        nestedSecret: 'nested-value',
        safeProperty: 'visible',
      },
    },
  });

  assert.strictEqual(entry.actorAddress, 'GC_ACTOR_1');
  assert.strictEqual(entry.statusCode, 200);

  // Assert sensitive fields are redacted
  assert.strictEqual(entry.details?.token, '[REDACTED]');
  assert.strictEqual(entry.details?.jwt, '[REDACTED]');
  assert.strictEqual(entry.details?.signature, '[REDACTED]');

  const nested = entry.details?.userObject as Record<string, unknown>;
  assert.strictEqual(nested?.nestedSecret, '[REDACTED]');
  assert.strictEqual(nested?.safeProperty, 'visible');

  // Verify memory log retrieval
  const logs = auditLogger.getRecentLogs(10, 'GC_ACTOR_1');
  assert.strictEqual(logs.length, 1);
});
