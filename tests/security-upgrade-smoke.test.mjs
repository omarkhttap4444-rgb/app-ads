// Read-only HTTP checks against a running production build (npm run start).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';

const origin = process.env.SECURITY_SMOKE_ORIGIN || 'http://127.0.0.1:3000';
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(new URL(origin).hostname),
  'Run these smoke checks against a local production build only.');
async function get(path, headers) {
  const response = await fetch(new URL(path, origin), { headers, signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200, `${path}: HTTP ${response.status}`);
  return response;
}

for (const path of ['/', '/login', '/signup', '/mobiles/add']) {
  test(`production route ${path}`, async () => {
    const html = await (await get(path)).text();
    assert.match(html, /سوق فون/);
    assert.ok(/<html[^>]*lang="ar-EG"/.test(html), 'Expected Egyptian Arabic document language');
    assert.doesNotMatch(html, /Application error: a (client|server)-side exception/);
    if (path === '/login') {
      assert.match(html, /تسجيل الدخول/);
      assert.match(html, /<meta name="robots" content="[^"]*noindex/);
    }
    if (path === '/') {
      assert.match(html, /max-image-preview:large/);
      assert.match(html, /href="\/icon-48\.png"/);
      const assets = [...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"?]+\.(?:js|css))"/g)];
      assert.ok(assets.length > 0, 'Expected compiled JS/CSS assets');
      await Promise.all([...new Set(assets.map(match => match[1]))].map(asset => get(asset)));
    }
  });
}
for (const size of [16, 32, 48, 96, 192, 512]) {
  test(`PNG favicon ${size} decodes with upgraded sharp`, async () => {
    const response = await get(`/icon-${size}.png`);
    const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
    assert.equal(metadata.format, 'png');
    assert.equal(metadata.width, size);
    assert.equal(metadata.height, size);
  });
}
test('favicon ICO signature and frame count', async () => {
  const bytes = Buffer.from(await (await get('/favicon.ico')).arrayBuffer());
  assert.equal(bytes.readUInt16LE(0), 0);
  assert.equal(bytes.readUInt16LE(2), 1);
  assert.equal(bytes.readUInt16LE(4), 3);
});
test('Next image optimizer produces a decodable WebP', async () => {
  const response = await get('/_next/image?url=%2Flogo.png&w=128&q=75', { Accept: 'image/webp' });
  assert.match(response.headers.get('content-type') || '', /^image\/webp/);
  const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
  assert.equal(metadata.format, 'webp');
  assert.equal(metadata.width, 128);
});
test('native image codec roundtrips PNG/JPEG/WebP/AVIF', async () => {
  for (const format of ['png', 'jpeg', 'webp', 'avif']) {
    const bytes = await sharp({ create: { width: 16, height: 16, channels: 3, background: '#078b43' } })
      .toFormat(format).toBuffer();
    const decoded = await sharp(bytes).raw().toBuffer({ resolveWithObject: true });
    assert.equal(decoded.info.width, 16);
    assert.equal(decoded.info.height, 16);
  }
});
test('manifest still references both install icons', async () => {
  const manifest = await (await get('/manifest.webmanifest')).json();
  assert.equal(manifest.dir, 'rtl');
  assert.deepEqual(manifest.icons.map(icon => icon.src), ['/icon-192.png', '/icon-512.png']);
});
test('robots and static sitemap remain readable', async () => {
  assert.match(await (await get('/robots.txt')).text(), /Sitemap: https:\/\/souqphone\.com\/sitemap.xml/);
  const xml = await (await get('/sitemaps/static.xml')).text();
  assert.match(xml, /<urlset/);
  assert.match(xml, /https:\/\/souqphone\.com/);
});
