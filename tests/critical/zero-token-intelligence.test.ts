import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildBenchmarksFromProducts,
  evaluatePriceAgainstBenchmark,
  extractHotDeals,
  normalizeMarketModelKey,
} from '../../src/lib/market-deal-intelligence';
import {
  buildSmartSearchChips,
  parseSmartSearchQuery,
} from '../../src/lib/smart-search-parser';
import {
  analyzeListingTrust,
  scanIncomingMessagesForFraud,
  scanTextForFraud,
} from '../../src/lib/trust-safety-analyzer';
import {
  computeDHashFromRgba9x8,
  hammingDistanceHex64,
} from '../../src/lib/duplicate-listing-guard';

describe('Zero-Token Intelligence Engines (Web)', () => {
  it('System #1: normalizes Arabic/English models and extracts genuine Hot Deals while blocking scams', () => {
    assert.equal(
      normalizeMarketModelKey('آيفون ١٤ برو ماكس 256 جيجا'),
      'iphone 14 pro max',
    );
    assert.equal(
      normalizeMarketModelKey('سامسونج جالاكسي S24 الترا'),
      'samsung s24 ultra',
    );

    const pool = [
      { id: '1', name: 'iPhone 13 Pro', price: 30000, condition: 'مستعمل', location: 'القاهرة', specifications: { brand: 'آبل', model: 'iPhone 13 Pro' } },
      { id: '2', name: 'iPhone 13 Pro', price: 31000, condition: 'مستعمل', location: 'الجيزة', specifications: { brand: 'آبل', model: 'iPhone 13 Pro' } },
      { id: '3', name: 'iPhone 13 Pro', price: 29500, condition: 'مستعمل', location: 'القاهرة', specifications: { brand: 'آبل', model: 'iPhone 13 Pro' } },
      { id: 'hot', name: 'iPhone 13 Pro', price: 24000, condition: 'مستعمل', location: 'الإسكندرية', specifications: { brand: 'آبل', model: 'iPhone 13 Pro' } },
      { id: 'scam', name: 'iPhone 13 Pro', price: 10000, condition: 'مستعمل', location: 'القاهرة', specifications: { brand: 'آبل', model: 'iPhone 13 Pro' } },
    ];

    const benchmarks = buildBenchmarksFromProducts(pool, false);
    const deals = extractHotDeals(pool, benchmarks, 5);
    assert.equal(deals.length, 1);
    assert.equal(deals[0].product.id, 'hot');
    assert.equal(deals[0].assessment.tier, 'hot_deal');

    const bm = benchmarks.get('iphone 13 pro|used');
    assert.ok(bm);
    const scamEval = evaluatePriceAgainstBenchmark(10000, bm);
    assert.equal(scamEval?.tier, 'suspiciously_low');
  });

  it('System #2: parses colloquial Arabic/English natural language search queries', () => {
    const parsed = parseSmartSearchQuery('ايفون ١٣ برو تحت 25 الف في القاهرة مستعمل 256 جيجا');
    assert.equal(parsed.maxPrice, 25000);
    assert.equal(parsed.detectedLocation, 'القاهرة');
    assert.equal(parsed.detectedCondition, 'مستعمل');
    assert.equal(parsed.detectedBrand, 'آبل');
    assert.equal(parsed.detectedStorage, '256 GB');
    assert.equal(parsed.hasStructuredFilters, true);

    const chips = buildSmartSearchChips(parsed, false);
    assert.ok(chips.some((c) => c.includes('25,000') || c.includes('٢٥')));
    assert.ok(chips.some((c) => c.includes('القاهرة')));
  });

  it('System #3: detects advance-deposit fraud, OTP phishing, and scores listing trust', () => {
    const deposit = scanTextForFraud('حول لي 500 جنيه عربون انستاباي قبل ما ابعت المندوب');
    assert.equal(deposit?.code, 'ADVANCE_PAYMENT_SCAM');
    assert.equal(deposit?.severity, 'high');

    const otp = scanIncomingMessagesForFraud([
      'أهلاً الجهاز متاح',
      'ممكن تبعتلي كود التحقق اللي وصلك دلوقتي؟',
    ]);
    assert.equal(otp?.code, 'OTP_PHISHING');

    const safe = scanTextForFraud('نتقابل في سيتي ستارز الساعة 7 للمعاينة');
    assert.equal(safe, null);

    const report = analyzeListingTrust({
      title: 'iPhone 15 Pro',
      condition: 'مستعمل',
      description: 'حالة ممتازة مع الكرتونة الأصلية وجميع المشتملات وفاتورة الشراء بدون آي كلاود',
      price: 42000,
      isSaudi: false,
      imagesCount: 4,
      specifications: { brand: 'آبل', model: 'iPhone 15 Pro', storage: '256' },
      isStore: true,
      sellerVerified: true,
      sellerRating: 4.9,
      sellerCreatedAt: '2024-01-01T00:00:00Z',
    });
    assert.equal(report.level, 'verified_high');
    assert.ok(report.score >= 85);
    assert.equal(report.pillars.length, 4);
    assert.equal(
      report.warnings.some((w) => w.code === 'LOCKED_OR_BYPASS_DEVICE'),
      false,
    );

    const risky = analyzeListingTrust({
      title: 'iPhone 15 Pro Max هاي كوبي',
      condition: 'جديد',
      description: 'الجهاز تقليد فرست كوبي وفيه كسر شاشة وعليه ضريبة غير مدفوعة',
      price: 9000,
      isSaudi: false,
      imagesCount: 1,
      specifications: {},
    });
    assert.equal(risky.level, 'high_risk');
    assert.ok(risky.score <= 42);
    assert.ok(risky.warnings.some((w) => w.code === 'REPLICA_DEVICE'));
    assert.ok(risky.warnings.some((w) => w.code === 'CONDITION_CONTRADICTION'));
    assert.ok(risky.warnings.some((w) => w.code === 'UNPAID_CUSTOMS_TAX'));
  });

  it('System #4: computes cross-platform 64-bit perceptual dHash identical to Flutter', () => {
    const grad = new Uint8Array(9 * 8 * 4);
    const inv = new Uint8Array(9 * 8 * 4);
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 9; x++) {
        const idx = (y * 9 + x) * 4;
        const lum = Math.max(0, Math.min(255, 240 - x * 25));
        grad[idx] = lum;
        grad[idx + 1] = lum;
        grad[idx + 2] = lum;
        grad[idx + 3] = 255;

        const invLum = Math.max(0, Math.min(255, 20 + x * 25));
        inv[idx] = invLum;
        inv[idx + 1] = invLum;
        inv[idx + 2] = invLum;
        inv[idx + 3] = 255;
      }
    }
    const hGrad = computeDHashFromRgba9x8(grad);
    const hInv = computeDHashFromRgba9x8(inv);
    assert.equal(hGrad, 'ffffffffffffffff');
    assert.equal(hInv, '0000000000000000');
    assert.equal(hammingDistanceHex64(hGrad, hInv), 64);
  });
});
