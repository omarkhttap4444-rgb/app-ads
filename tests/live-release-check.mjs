// Read-only checks for this explicitly authorized production rollout.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
const origin = 'https://souqphone.com';
const mediaHost = 'xcjbjqndflhzmsxiasdb.supabase.co';
const decodeXml = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&apos;', "'");
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
async function get(value, headers = {}) {
  const url = new URL(value, origin);
  assert.ok([new URL(origin).hostname, mediaHost].includes(url.hostname));
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200, `${url.pathname}: ${response.status}`);
  return response;
}
const home = await (await get('/')).text();
assert.ok(home.includes('/icon-48.png'), 'Updated favicon metadata not live');
assert.ok(home.includes('max-image-preview:large'));
for (const path of ['/login', '/signup', '/mobiles/add', '/robots.txt']) await get(path);
const favicon = Buffer.from(await (await get('/favicon.ico')).arrayBuffer());
assert.equal(sha(favicon), sha(await readFile(new URL('../public/favicon.ico', import.meta.url))));
for (const size of [16, 32, 48, 96, 192, 512]) {
  const response = await get(`/icon-${size}.png`);
  const info = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
  assert.equal(info.width, size);
  assert.equal(info.height, size);
}
const manifest = await (await get('/manifest.webmanifest')).json();
assert.ok(manifest.icons.some(icon => icon.src === '/icon-512.png'));
const index = await (await get('/sitemap.xml')).text();
const maps = [...index.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => decodeXml(match[1]));
assert.ok(maps.some(url => url.includes('/sitemaps/products/')));
let productXml = '';
for (const url of maps) {
  const xml = await (await get(url)).text();
  assert.ok(xml.includes('<urlset'));
  if (url.includes('/sitemaps/products/')) productXml += xml;
}
const images = [...new Set([...productXml.matchAll(/<image:loc>(.*?)<\/image:loc>/g)].map(match => decodeXml(match[1])))];
const products = [...productXml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => decodeXml(match[1]));
assert.ok(images.length > 0 && products.length > 0);
for (const url of images.slice(0, 12)) await get(url);
for (const url of ['/logo.png', ...images.slice(0, 6)]) {
  const params = new URLSearchParams({ url, w: '128', q: '75' });
  const response = await get(`/_next/image?${params}`, { Accept: 'image/webp' });
  const info = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
  assert.equal(info.format, 'webp');
  assert.ok(info.width > 0 && info.width <= 128);
}
const productHtml = await (await get(products[0])).text();
const title = productHtml.match(/<title>(.*?)<\/title>/)?.[1] || '';
assert.ok(title.includes('سوق فون'));
assert.equal((title.match(/سوق فون/g) || []).length, 1);
assert.ok(productHtml.includes('"@type":"Product"'));
assert.ok(productHtml.includes('"@type":"ItemPage"'));
assert.ok(productHtml.includes('rel="canonical"'));
console.log(JSON.stringify({ production: origin, iconMatchesRelease: true, pngSizesVerified: 6,
  sitemaps: maps.length, indexedProducts: products.length, imageEntries: images.length,
  originalImagesChecked: Math.min(12, images.length), optimizedImagesChecked: Math.min(6, images.length) + 1,
  productMetadataVerified: true }, null, 2));
