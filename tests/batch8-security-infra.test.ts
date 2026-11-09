import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SessionFingerprintService } from '../src/services/session-fingerprint';
import { AuthCodeGenerator } from '../src/utils/auth-code';
import { CidrMatcher } from '../src/utils/cidr-matcher';
import { HeaderMask } from '../src/middleware/header-mask';
import { TlsGuard } from '../src/config/tls-guard';
import { DisputeRateGuard } from '../src/services/dispute-rate-guard';
import { PubkeyValidator } from '../src/utils/pubkey-validator';
import { RedirectGuard } from '../src/services/redirect-guard';
import { HppGuard } from '../src/middleware/hpp-guard';
import { PreimageGuard } from '../src/services/preimage-guard';
import { JitteredBackoff } from '../src/utils/jittered-backoff';
import { HeapMonitor } from '../src/services/heap-monitor';
import { EventLoopMonitor } from '../src/services/eventloop-monitor';
import { PrometheusFormatter } from '../src/services/prometheus-formatter';
import { PoolWatchdog } from '../src/services/pool-watchdog';
import { CircuitBreaker } from '../src/services/circuit-breaker';
import { TimeoutSignal } from '../src/utils/timeout-signal';

describe('Batch 8 Security & Infrastructure Tests', () => {
  it('SessionFingerprintService: generates deterministic hash and validates', () => {
    const ctx = { userAgent: 'Mozilla/5.0', ipAddress: '10.0.0.1', acceptLanguage: 'en-US' };
    const fp = SessionFingerprintService.generateFingerprint(ctx);
    assert.equal(SessionFingerprintService.validateFingerprint(ctx, fp), true);
    assert.equal(SessionFingerprintService.validateFingerprint({ ...ctx, ipAddress: '10.0.0.2' }, fp), false);
  });

  it('AuthCodeGenerator: generates valid digits and length', () => {
    const code = AuthCodeGenerator.generateNumericCode(6);
    assert.equal(code.length, 6);
    assert.match(code, /^\d{6}$/);

    const token = AuthCodeGenerator.generateAlphanumericToken(8);
    assert.equal(token.length, 8);
  });

  it('CidrMatcher: matches IPv4 within subnet range', () => {
    assert.equal(CidrMatcher.isIpInCidr('192.168.1.50', '192.168.1.0/24'), true);
    assert.equal(CidrMatcher.isIpInCidr('192.168.2.50', '192.168.1.0/24'), false);
    assert.equal(CidrMatcher.isIpInCidr('10.5.2.1', '10.0.0.0/8'), true);
  });

  it('HeaderMask: redacts sensitive authentication headers', () => {
    const headers = {
      Authorization: 'Bearer secret_jwt',
      'X-API-Key': 'secret_key',
      'Content-Type': 'application/json',
    };
    const masked = HeaderMask.maskHeaders(headers);
    assert.equal(masked['Authorization'], '[REDACTED]');
    assert.equal(masked['X-API-Key'], '[REDACTED]');
    assert.equal(masked['Content-Type'], 'application/json');
  });

  it('TlsGuard: enforces TLS versions and safe ciphers', () => {
    assert.equal(TlsGuard.isProtocolAllowed('TLSv1.3'), true);
    assert.equal(TlsGuard.isProtocolAllowed('TLSv1.0'), false);
    assert.equal(TlsGuard.validateCipherSuite('ECDHE-RSA-AES128-GCM-SHA256'), true);
    assert.equal(TlsGuard.validateCipherSuite('RC4-MD5'), false);
  });

  it('DisputeRateGuard: limits dispute frequency per participant', () => {
    const guard = new DisputeRateGuard(2, 60000);
    assert.equal(guard.canFileDispute('G_USER_1'), true);
    assert.equal(guard.canFileDispute('G_USER_1'), true);
    assert.equal(guard.canFileDispute('G_USER_1'), false);
    assert.equal(guard.canFileDispute('G_USER_2'), true);
  });

  it('PubkeyValidator: validates Stellar public keys and contract IDs', () => {
    assert.equal(PubkeyValidator.isValidEd25519PublicKey('GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'), true);
    assert.equal(PubkeyValidator.isValidEd25519PublicKey('invalid_key'), false);
    assert.equal(PubkeyValidator.isValidContractId('CDXVD3AA43SE2D52ZBJSH3RDKAPOYG6OCDAZGSQD6M5TCBQIG3HTLY6J'), true);
    assert.equal(PubkeyValidator.isValidHexHash('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'), true);
  });

  it('RedirectGuard: permits whitelisted domains and rejects open redirects', () => {
    const guard = new RedirectGuard(['strataflow.org', 'localhost']);
    assert.equal(guard.isSafeRedirectUrl('https://strataflow.org/dashboard'), true);
    assert.equal(guard.isSafeRedirectUrl('http://localhost:3000/agreements'), true);
    assert.equal(guard.isSafeRedirectUrl('https://evil-phishing.com/login'), false);
    assert.equal(guard.isSafeRedirectUrl('javascript:alert(1)'), false);
  });

  it('HppGuard: mitigates parameter pollution by taking last parameter', () => {
    assert.equal(HppGuard.sanitizeQueryParam(['first', 'second']), 'second');
    assert.equal(HppGuard.sanitizeQueryParam('single'), 'single');
    assert.equal(HppGuard.sanitizeQueryParam(undefined), undefined);
  });

  it('PreimageGuard: verifies SHA-256 and blocks replay', () => {
    const guard = new PreimageGuard();
    const preimage = 'secret_passphrase';
    // SHA256 of "secret_passphrase"
    const hash = '9a961203e76d4080f8c5f37deac471f185836ddd44d8a6d386586710151dd2be';
    assert.equal(guard.verifyAndConsume(preimage, hash), true);
    assert.equal(guard.verifyAndConsume(preimage, hash), false); // replayed!
  });

  it('JitteredBackoff: calculates delays within boundaries', () => {
    const delay = JitteredBackoff.calculate(2, 100, 1000);
    assert.ok(delay >= 0 && delay <= 400);
  });

  it('HeapMonitor & EventLoopMonitor: sample system health metrics', () => {
    const pct = HeapMonitor.getHeapUsagePercentage();
    assert.ok(pct >= 0 && pct <= 100);
    const loop = new EventLoopMonitor();
    assert.equal(typeof loop.sample(), 'number');
  });

  it('PrometheusFormatter: formats metrics in Prometheus exposition style', () => {
    const gauge = PrometheusFormatter.formatGauge('test_metric', 'A test gauge', 42);
    assert.ok(gauge.includes('# HELP test_metric A test gauge'));
    assert.ok(gauge.includes('test_metric 42'));
  });

  it('PoolWatchdog: assesses connection pool health', () => {
    const healthy = PoolWatchdog.evaluatePoolHealth({ totalCount: 10, idleCount: 5, waitingCount: 0 });
    assert.equal(healthy.healthy, true);
    assert.equal(healthy.saturation, 50);

    const saturated = PoolWatchdog.evaluatePoolHealth({ totalCount: 10, idleCount: 0, waitingCount: 3 });
    assert.equal(saturated.healthy, false);
  });

  it('CircuitBreaker: transitions CLOSED -> OPEN -> HALF_OPEN', () => {
    const breaker = new CircuitBreaker(2, 100);
    breaker.recordFailure();
    assert.equal(breaker.getState(), 'CLOSED');
    breaker.recordFailure();
    assert.equal(breaker.getState(), 'OPEN');
    assert.equal(breaker.canExecute(), false);
  });

  it('TimeoutSignal: enforces deadline on long-running promises', async () => {
    const fast = TimeoutSignal.withTimeout(Promise.resolve('done'), 500);
    assert.equal(await fast, 'done');

    const slow = TimeoutSignal.withTimeout(new Promise(resolve => setTimeout(resolve, 200)), 50);
    await assert.rejects(slow, /timed out/);
  });
});
