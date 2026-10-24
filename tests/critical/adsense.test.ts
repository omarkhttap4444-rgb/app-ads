import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  isAdExcludedPath,
  isAdsEnabled,
  getAdSenseClient,
  EXCLUDED_AD_PATHS,
} from '../../src/lib/ads-config';

test('isAdExcludedPath rejects private and restricted paths', () => {
  for (const path of EXCLUDED_AD_PATHS) {
    assert.equal(isAdExcludedPath(path), true, `Expected EXCLUDED_AD_PATH ${path} to be excluded`);
  }

  const privatePaths = [
    '/login',
    '/login/',
    '/LOGIN',
    '/signup',
    '/signup/',
    '/auth',
    '/auth/callback',
    '/profile',
    '/profile/edit',
    '/profile/settings',
    '/chat',
    '/chat/12345',
    '/notifications',
    '/notifications/unread',
    '/mobiles/add',
    '/mobiles/add/',
    '/favorites',
    '/checkout',
    '/orders',
    '/payment',
    '/admin',
    '/admin/users',
    '/dashboard',
    '/account',
    '/settings',
    '/cart',
    null,
    undefined,
    '',
  ];

  for (const path of privatePaths) {
    assert.equal(
      isAdExcludedPath(path),
      true,
      `Expected ${path} to be excluded from ads`
    );
  }
});

test('isAdExcludedPath allows public pages', () => {
  const publicPaths = [
    '/',
    '/mobiles',
    '/mobiles/',
    '/mobiles/iphone-14-pro-max',
    '/mobiles/samsung-galaxy-s24-ultra',
    '/about',
    '/privacy',
    '/terms',
    '/contact',
    '/help/buying-used-phone',
    '/help/selling-used-phone',
    '/help/check-used-phone',
    '/help/phone-safety',
    '/store/seller-id-123',
  ];

  for (const path of publicPaths) {
    assert.equal(
      isAdExcludedPath(path),
      false,
      `Expected ${path} to be allowed for ads`
    );
  }
});

test('isAdsEnabled respects NEXT_PUBLIC_ENABLE_ADS environment variable', () => {
  const original = process.env.NEXT_PUBLIC_ENABLE_ADS;
  try {
    process.env.NEXT_PUBLIC_ENABLE_ADS = 'true';
    assert.equal(isAdsEnabled(), true);

    process.env.NEXT_PUBLIC_ENABLE_ADS = 'TRUE ';
    assert.equal(isAdsEnabled(), true);

    process.env.NEXT_PUBLIC_ENABLE_ADS = 'false';
    assert.equal(isAdsEnabled(), false);

    delete process.env.NEXT_PUBLIC_ENABLE_ADS;
    assert.equal(isAdsEnabled(), false);

    process.env.NEXT_PUBLIC_ENABLE_ADS = '';
    assert.equal(isAdsEnabled(), false);

    process.env.NEXT_PUBLIC_ENABLE_ADS = '1';
    assert.equal(isAdsEnabled(), false);
  } finally {
    process.env.NEXT_PUBLIC_ENABLE_ADS = original;
  }
});

test('getAdSenseClient retrieves client from env and trims it', () => {
  const original = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  try {
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT = '  ca-pub-test123456  ';
    assert.equal(getAdSenseClient(), 'ca-pub-test123456');

    delete process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
    assert.equal(getAdSenseClient(), '');
  } finally {
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT = original;
  }
});

test('ads.txt and app-ads.txt exist and contain authorized publisher entry', () => {
  const adsPath = resolve(__dirname, '../../public/ads.txt');
  const appAdsPath = resolve(__dirname, '../../public/app-ads.txt');

  assert.equal(existsSync(adsPath), true, 'public/ads.txt must exist');
  assert.equal(existsSync(appAdsPath), true, 'public/app-ads.txt must exist');

  const adsContent = readFileSync(adsPath, 'utf8').trim();
  const appAdsContent = readFileSync(appAdsPath, 'utf8').trim();

  const expectedLine = 'google.com, pub-6148113554332836, DIRECT, f08c47fec0942fa0';

  assert.equal(adsContent, expectedLine);
  assert.equal(appAdsContent, expectedLine);
  assert.equal(adsContent, appAdsContent, 'ads.txt and app-ads.txt must have identical content');
});

test('Publisher ID is NOT hardcoded in source code', () => {
  const filesToCheck = [
    resolve(__dirname, '../../src/lib/ads-config.ts'),
    resolve(__dirname, '../../src/lib/ads-context.tsx'),
    resolve(__dirname, '../../src/components/GoogleAdSense.tsx'),
    resolve(__dirname, '../../src/components/SuppressAds.tsx'),
    resolve(__dirname, '../../src/app/layout.tsx'),
    resolve(__dirname, '../../src/app/mobiles/page.tsx'),
  ];

  const publisherIdPattern = /pub-6148113554332836|ca-pub-6148113554332836/;

  for (const file of filesToCheck) {
    if (existsSync(file)) {
      const content = readFileSync(file, 'utf8');
      assert.doesNotMatch(
        content,
        publisherIdPattern,
        `File ${file} should not hardcode AdSense publisher ID`
      );
    }
  }
});

test('robots.ts explicitly includes Mediapartners-Google allow rule', () => {
  const robotsPath = resolve(__dirname, '../../src/app/robots.ts');
  const content = readFileSync(robotsPath, 'utf8');
  assert.match(content, /Mediapartners-Google/);
  assert.match(content, /allow:\s*['"]\/['"]/);
});

test('build HTML contains AdSense script on public pages and omits it on private pages', () => {
  const buildAppDir = resolve(__dirname, '../../.next/server/app');
  if (!existsSync(buildAppDir)) {
    // If not built yet, skip
    return;
  }

  const publicHtmlFiles = [
    'index.html',
    'about.html',
    'privacy.html',
    'terms.html',
    'contact.html',
    'help/buying-used-phone.html',
  ];

  const excludedHtmlFiles = [
    'login.html',
    'signup.html',
    'chat.html',
    'notifications.html',
    'profile.html',
    'favorites.html',
    'mobiles/add.html',
    'auth/callback.html',
  ];

  for (const file of publicHtmlFiles) {
    const fullPath = resolve(buildAppDir, file);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, 'utf8');
      assert.equal(
        content.includes('adsbygoogle.js'),
        true,
        `Expected public page ${file} to contain adsbygoogle.js in build HTML`
      );
    }
  }

  for (const file of excludedHtmlFiles) {
    const fullPath = resolve(buildAppDir, file);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, 'utf8');
      assert.equal(
        content.includes('adsbygoogle.js'),
        false,
        `Expected private page ${file} to NOT contain adsbygoogle.js in build HTML`
      );
    }
  }
});
