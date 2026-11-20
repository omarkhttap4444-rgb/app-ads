import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  isValidPublicIp,
  mapStorefrontAuthError,
  validateStrongPassword,
} from '../../src/lib/password-policy';

test('validateStrongPassword enforces unified 8-72 multi-class password policy', () => {
  assert.notEqual(validateStrongPassword('1234567'), null);
  assert.notEqual(validateStrongPassword('12345678'), null);
  assert.notEqual(validateStrongPassword('onlyletters'), null);
  assert.notEqual(validateStrongPassword('password123'), null);
  assert.notEqual(validateStrongPassword('souqphone123'), null);
  assert.notEqual(validateStrongPassword('a'.repeat(73)), null);

  assert.equal(validateStrongPassword('SouqPhone2026'), null);
  assert.equal(validateStrongPassword('strong-pass-word'), null);
});

test('mapStorefrontAuthError redacts raw Supabase messages and maps rate limits', () => {
  const loginMsg = mapStorefrontAuthError(
    { message: 'Invalid login credentials' },
    'login',
  );
  assert.doesNotMatch(loginMsg, /Invalid login credentials/i);

  const signupMsg = mapStorefrontAuthError(
    { message: 'Database internal trigger failure on auth.users' },
    'signup',
  );
  assert.doesNotMatch(signupMsg, /auth\.users/i);

  const rateMsg = mapStorefrontAuthError(
    { message: 'over_email_send_rate_limit (429)' },
    'recovery',
  );
  assert.match(rateMsg, /محاولات كثيرة/);
});

test('isValidPublicIp blocks private, loopback, metadata, and SSRF payloads', () => {
  for (const validIp of ['8.8.8.8', '156.204.10.25', '2606:4700:4700::1111']) {
    assert.equal(isValidPublicIp(validIp), true, `Expected valid public IP: ${validIp}`);
  }

  for (const blockedIp of [
    '',
    null,
    undefined,
    '127.0.0.1',
    '10.0.0.1',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '224.0.0.1',
    '999.999.999.999',
    '::1',
    '::',
    'fe80::1',
    'fc00::1',
    'fd12:3456::1',
    '::ffff:127.0.0.1',
    '8.8.8.8/../../admin',
    '8.8.8.8?foo=bar',
    'localhost',
  ]) {
    assert.equal(
      isValidPublicIp(blockedIp),
      false,
      `Expected blocked IP/payload: ${String(blockedIp)}`,
    );
  }
});

test('storefront_web auth routes and security headers regression guards', () => {
  assert.equal(existsSync('src/app/api/debug/route.ts'), false);
  assert.equal(existsSync('test_search.js'), false);
  assert.equal(existsSync('test-signup.js'), false);
  assert.equal(existsSync('test-users.js'), false);

  assert.equal(existsSync('src/app/forgot-password/page.tsx'), true);
  assert.equal(existsSync('src/app/reset-password/page.tsx'), true);
  assert.equal(existsSync('src/app/auth/confirm/page.tsx'), true);

  const signupSource = readFileSync('src/app/signup/page.tsx', 'utf8');
  assert.match(signupSource, /validateStrongPassword/);
  assert.doesNotMatch(signupSource, /البريد الإلكتروني مسجل بالفعل/);

  const loginSource = readFileSync('src/app/login/page.tsx', 'utf8');
  assert.match(loginSource, /\/forgot-password/);
  assert.match(loginSource, /mapStorefrontAuthError/);

  const resetSource = readFileSync('src/app/reset-password/page.tsx', 'utf8');
  assert.match(resetSource, /validateStrongPassword/);
  assert.match(resetSource, /scope:\s*'others'/);

  const nextConfigSource = readFileSync('next.config.ts', 'utf8');
  assert.match(nextConfigSource, /Strict-Transport-Security/);
  assert.match(nextConfigSource, /X-Content-Type-Options/);
  assert.match(nextConfigSource, /X-Frame-Options/);
  assert.match(nextConfigSource, /Referrer-Policy/);
  assert.match(nextConfigSource, /Permissions-Policy/);
});
