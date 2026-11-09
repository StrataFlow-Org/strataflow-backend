import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SlidingWindowRateLimiter } from '../src/services/rate-limiter';
import { getCorsConfig } from '../src/config/cors';
import { RequestTracer } from '../src/services/request-tracer';
import { timingSafeEqual } from '../src/utils/timing-safe';
import { WebhookVerifier } from '../src/services/webhook-verifier';
import { PayloadGuard } from '../src/services/payload-guard';
import { IpBlacklistService } from '../src/services/ip-blacklist';
import { NonceTracker } from '../src/services/nonce-tracker';
import { AdminAuthGuard } from '../src/middleware/admin-auth';
import { BruteForceGuard } from '../src/services/brute-force-guard';
import { LogSanitizer } from '../src/services/log-sanitizer';
import { CryptoSalt } from '../src/utils/crypto-salt';
import { InjectionGuard } from '../src/services/injection-guard';
import { DeepPayloadSanitizer } from '../src/services/payload-sanitizer';
import { CspBuilder } from '../src/services/csp-builder';
import { DbReconnectService } from '../src/services/db-reconnect';
import { ShutdownCoordinator } from '../src/services/shutdown-coordinator';
import { HealthProbeService } from '../src/services/health-probes';

describe('Batch 7 Security & Infrastructure Tests', () => {
  it('SlidingWindowRateLimiter: throttles after threshold exceeded', () => {
    const limiter = new SlidingWindowRateLimiter(1000, 2);
    assert.equal(limiter.isAllowed('user1').allowed, true);
    assert.equal(limiter.isAllowed('user1').allowed, true);
    assert.equal(limiter.isAllowed('user1').allowed, false);
  });

  it('CorsPolicy: generates correct allowed headers and origins', () => {
    const config = getCorsConfig({ CORS_ALLOWED_ORIGINS: 'https://strataflow.org' });
    assert.deepEqual(config.origin, ['https://strataflow.org']);
    assert.equal(config.credentials, true);
  });

  it('RequestTracer: formats valid W3C traceparent', () => {
    const ctx = RequestTracer.createTraceContext('test-corr-id');
    assert.equal(ctx.correlationId, 'test-corr-id');
    const header = RequestTracer.formatTraceparent(ctx.traceId, ctx.spanId);
    assert.match(header, /^00-[a-f0-9]{32}-[a-f0-9]{16}-01$/);
  });

  it('timingSafeEqual: securely checks equality without timing leak', () => {
    assert.equal(timingSafeEqual('secret_token', 'secret_token'), true);
    assert.equal(timingSafeEqual('secret_token', 'wrong_token'), false);
    assert.equal(timingSafeEqual('short', 'longer_string'), false);
  });

  it('WebhookVerifier: validates HMAC signature', () => {
    const secret = 'super-webhook-secret';
    const payload = JSON.stringify({ event: 'test' });
    const sig = WebhookVerifier.computeSignature(payload, secret);
    assert.equal(WebhookVerifier.verifySignature(payload, sig, secret), true);
    assert.equal(WebhookVerifier.verifySignature(payload, 'bad_sig', secret), false);
  });

  it('PayloadGuard: enforces size boundaries', () => {
    assert.equal(PayloadGuard.isWithinLimit(500, 1000), true);
    assert.equal(PayloadGuard.isWithinLimit(1500, 1000), false);
  });

  it('IpBlacklistService: blocks banned IPs and handles expiration', () => {
    const service = new IpBlacklistService();
    service.banIp('198.51.100.1', 100000);
    assert.equal(service.isBanned('198.51.100.1'), true);
    assert.equal(service.isBanned('198.51.100.2'), false);
  });

  it('NonceTracker: detects replayed nonces', () => {
    const tracker = new NonceTracker();
    assert.equal(tracker.consumeNonce('nonce_abc123'), true);
    assert.equal(tracker.consumeNonce('nonce_abc123'), false); // replay
  });

  it('AdminAuthGuard: validates API key hash', () => {
    const key = 'strata-admin-secret-key';
    const hash = AdminAuthGuard.hashApiKey(key);
    assert.equal(AdminAuthGuard.validateApiKey(key, hash), true);
    assert.equal(AdminAuthGuard.validateApiKey('wrong-key', hash), false);
  });

  it('BruteForceGuard: enforces lockout on consecutive failures', () => {
    const guard = new BruteForceGuard(3, 5000);
    guard.recordAttempt('actor1', false);
    guard.recordAttempt('actor1', false);
    const third = guard.recordAttempt('actor1', false);
    assert.equal(third.blocked, true);
    assert.ok(third.retryAfterSeconds > 0);
  });

  it('LogSanitizer: redacts stellar secret keys and passwords', () => {
    const secret = 'S' + 'A'.repeat(55);
    const sanitized = LogSanitizer.sanitizeString(`Deploying with ${secret}`);
    assert.ok(!sanitized.includes(secret));
    assert.ok(sanitized.includes('[REDACTED_STELLAR_SECRET]'));
  });

  it('CryptoSalt: generates high entropy salt and tokens', () => {
    const salt = CryptoSalt.generateSalt(16);
    assert.equal(salt.length, 32); // 16 bytes hex is 32 chars
    const hash = CryptoSalt.hashWithSalt('password', salt);
    assert.equal(typeof hash, 'string');
  });

  it('InjectionGuard: catches SQL patterns and path traversal', () => {
    assert.equal(InjectionGuard.detectSqlPatterns("SELECT * FROM users"), true);
    assert.equal(InjectionGuard.detectPathTraversal("../../etc/passwd"), true);
    assert.equal(InjectionGuard.detectSqlPatterns("healthy agreement title"), false);
  });

  it('DeepPayloadSanitizer: strips prototype pollution vectors', () => {
    const dirty = JSON.parse('{"__proto__": {"polluted": true}, "name": "clean"}');
    const cleaned = DeepPayloadSanitizer.deepSanitize(dirty);
    assert.equal((cleaned as any).name, 'clean');
    assert.equal((cleaned as any).__proto__.polluted, undefined);
  });

  it('CspBuilder: formats CSP header with nonce', () => {
    const csp = CspBuilder.buildPolicy({ defaultSrc: ["'self'"], scriptSrc: ["'self'"] }, '12345');
    assert.ok(csp.includes("default-src 'self'"));
    assert.ok(csp.includes("'nonce-12345'"));
  });

  it('DbReconnectService: retries and returns result', async () => {
    let runs = 0;
    const res = await DbReconnectService.executeWithRetry(async () => {
      runs++;
      if (runs < 2) throw new Error('temporary db failure');
      return 'connected';
    }, 3, 10);
    assert.equal(res, 'connected');
    assert.equal(runs, 2);
  });

  it('ShutdownCoordinator: calls handlers during shutdown', async () => {
    const coordinator = new ShutdownCoordinator();
    let handled = false;
    coordinator.registerHandler(async () => { handled = true; });
    await coordinator.shutdown();
    assert.equal(handled, true);
    assert.equal(coordinator.getStatus(), true);
  });

  it('HealthProbeService: reports liveness and readiness statuses', () => {
    const live = HealthProbeService.getLiveness();
    assert.equal(live.status, 'UP');
    assert.ok(live.uptimeSeconds >= 0);

    const ready = HealthProbeService.getReadiness(true, true);
    assert.equal(ready.status, 'READY');

    const notReady = HealthProbeService.getReadiness(false, true);
    assert.equal(notReady.status, 'NOT_READY');
  });
});
