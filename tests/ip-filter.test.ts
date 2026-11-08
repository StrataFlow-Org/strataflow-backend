import { test } from 'node:test';
import assert from 'node:assert';
import { ipFilter } from '../src/services/ip-filter.js';

test('IpFilterService Security Tests', async () => {
  // Test default allowed localhost
  assert.strictEqual(ipFilter.isIpAllowed('127.0.0.1'), true);
  assert.strictEqual(ipFilter.isIpAllowed('::1'), true);
  assert.strictEqual(ipFilter.isIpBlocked('127.0.0.1'), false);

  // Test blocking abusive IP
  const abusiveIp = '203.0.113.42';
  ipFilter.blockIp(abusiveIp);
  assert.strictEqual(ipFilter.isIpBlocked(abusiveIp), true);
  assert.strictEqual(ipFilter.isIpBlocked(`::ffff:${abusiveIp}`), true);

  // Test unblocking
  ipFilter.unblockIp(abusiveIp);
  assert.strictEqual(ipFilter.isIpBlocked(abusiveIp), false);
});

