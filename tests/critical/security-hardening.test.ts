import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkEdgeRateLimit, isBlockedProbePath } from '../../src/lib/edge-security';
import { serializeJsonLd } from '../../src/lib/seo';

test('next.config.ts enforces strict CSP, COOP, CORP, HSTS, and disables poweredByHeader', () => {
  const configSrc = readFileSync('next.config.ts', 'utf8');
  assert.match(configSrc, /poweredByHeader:\s*false/);
  assert.match(configSrc, /Content-Security-Policy/);
  assert.match(configSrc, /frame-ancestors 'none'/);
  assert.match(configSrc, /object-src 'none'/);
  assert.match(configSrc, /Cross-Origin-Opener-Policy/);
  assert.match(configSrc, /Cross-Origin-Resource-Policy/);
  assert.match(configSrc, /Strict-Transport-Security/);
  assert.match(configSrc, /images\.souqphone\.com/);
});

test('middleware blocks scanner & exploit probe paths while allowing legitimate pages', () => {
  for (const malicious of [
    '/.env',
    '/.env.local',
    '/.git/config',
    '/wp-admin/install.php',
    '/wp-login.php',
    '/xmlrpc.php',
    '/phpinfo.php',
    '/api/%2e%2e/etc/passwd',
  ]) {
    assert.equal(isBlockedProbePath(malicious), true, `should block ${malicious}`);
  }

  for (const valid of ['/', '/mobiles', '/maintenance', '/stores', '/login', '/api/country']) {
    assert.equal(isBlockedProbePath(valid), false, `should allow ${valid}`);
  }
});

test('edge rate limiter blocks requests exceeding threshold and resets after window', () => {
  const key = `test-ip-${crypto.randomUUID()}`;
  const t0 = 1_700_000_000_000;
  assert.equal(checkEdgeRateLimit(key, 3, 60_000, t0).allowed, true);
  assert.equal(checkEdgeRateLimit(key, 3, 60_000, t0 + 1000).allowed, true);
  assert.equal(checkEdgeRateLimit(key, 3, 60_000, t0 + 2000).allowed, true);

  const blocked = checkEdgeRateLimit(key, 3, 60_000, t0 + 3000);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSec >= 1);

  const afterReset = checkEdgeRateLimit(key, 3, 60_000, t0 + 61_000);
  assert.equal(afterReset.allowed, true);
});

test('serializeJsonLd neutralizes script breakout XSS payloads', () => {
  const payload = { name: '</script><script>alert(1)</script>' };
  const serialized = serializeJsonLd(payload);
  assert.equal(serialized.includes('</script>'), false);
  assert.equal(serialized.includes('<script>'), false);
});
