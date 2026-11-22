import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';

describe('SQL Migration: 20261122120000_market_deal_intelligence.sql (Real Postgres)', () => {
  it('installs cleanly and passes normalization, EG/SA isolation, condition buckets, benchmarks, and hot deals', async () => {
    const db = new PGlite();

    await db.exec(`
      CREATE ROLE anon;
      CREATE ROLE authenticated;
      CREATE TABLE public.products (
        id uuid PRIMARY KEY,
        seller_id uuid,
        name text,
        price double precision,
        condition text,
        location text,
        is_sold boolean DEFAULT false,
        specifications jsonb DEFAULT '{}'::jsonb,
        created_at timestamptz DEFAULT now()
      );
      CREATE TABLE public.phone_market_prices (
        id uuid PRIMARY KEY,
        model_name text,
        market_price numeric
      );
    `);

    const migrationPath = path.resolve(
      process.cwd(),
      '..',
      'supabase',
      'migrations',
      '20261122120000_market_deal_intelligence.sql',
    );
    const sql = fs.readFileSync(migrationPath, 'utf8');
    await db.exec(sql);

    const unit = await db.query<{
      k1: string;
      k2: string;
      eg_nasr: boolean;
      sa_riyadh: boolean;
      sa_madinah: boolean;
      cond_used: string;
      cond_new: string;
    }>(`
      SELECT
        public.normalize_market_model_key('آيفون ١٥ برو ماكس 256 جيجا') AS k1,
        public.normalize_market_model_key('ايفون 15 برو') AS k2,
        public.is_saudi_location('القاهرة - مدينة نصر') AS eg_nasr,
        public.is_saudi_location('الرياض - العليا') AS sa_riyadh,
        public.is_saudi_location('المدينة المنورة') AS sa_madinah,
        public.market_condition_bucket('شبه جديد') AS cond_used,
        public.market_condition_bucket('جديد متبرشم') AS cond_new;
    `);

    const u = unit.rows[0];
    assert.equal(u.k1, 'iphone 15 pro max');
    assert.equal(u.k2, 'iphone 15 pro');
    assert.equal(u.eg_nasr, false);
    assert.equal(u.sa_riyadh, true);
    assert.equal(u.sa_madinah, true);
    assert.equal(u.cond_used, 'used');
    assert.equal(u.cond_new, 'new');

    await db.exec(`
      INSERT INTO public.products (id, seller_id, name, price, condition, location, specifications) VALUES
        ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'iPhone 13 Pro', 30000, 'مستعمل', 'القاهرة - مدينة نصر', '{"brand":"آبل","model":"iPhone 13 Pro"}'),
        ('11111111-1111-1111-1111-111111111112', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'iPhone 13 Pro', 31000, 'مستعمل', 'الجيزة', '{"brand":"آبل","model":"iPhone 13 Pro"}'),
        ('11111111-1111-1111-1111-111111111113', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'iPhone 13 Pro', 29500, 'مستعمل', 'الإسكندرية', '{"brand":"آبل","model":"iPhone 13 Pro"}'),
        ('11111111-1111-1111-1111-111111111114', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'iPhone 13 Pro', 30500, 'مستعمل', 'القاهرة', '{"brand":"آبل","model":"iPhone 13 Pro"}'),
        ('11111111-1111-1111-1111-111111111115', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'iPhone 13 Pro', 24000, 'مستعمل', 'القاهرة', '{"brand":"آبل","model":"iPhone 13 Pro"}'),
        ('11111111-1111-1111-1111-111111111116', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', 'iPhone 13 Pro', 10000, 'مستعمل', 'القاهرة', '{"brand":"آبل","model":"iPhone 13 Pro"}'),
        ('11111111-1111-1111-1111-111111111117', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', 'iPhone 13 Pro', 2500, 'مستعمل', 'الرياض', '{"brand":"آبل","model":"iPhone 13 Pro"}'),
        ('11111111-1111-1111-1111-111111111118', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', 'iPhone 13 Pro', 2600, 'مستعمل', 'المدينة المنورة', '{"brand":"آبل","model":"iPhone 13 Pro"}');
    `);

    const bmEg = await db.query<{
      model_key: string;
      sample_count: number;
      distinct_sellers: number;
      median_price: string;
    }>(`SELECT * FROM public.get_market_price_benchmarks('EG')`);

    assert.equal(bmEg.rows.length, 1);
    assert.equal(bmEg.rows[0].model_key, 'iphone 13 pro');
    assert.equal(bmEg.rows[0].sample_count, 6);
    assert.equal(bmEg.rows[0].distinct_sellers, 6);
    // Saudi prices (2500/2600) MUST NOT leak into Egypt median
    assert.ok(Number(bmEg.rows[0].median_price) >= 29000);

    const dealsEg = await db.query<{
      product_id: string;
      discount_percent: number;
    }>(`SELECT * FROM public.get_today_hot_deals('EG', 12)`);

    // Genuine 24000 deal (~20% off) is returned; scam 10000 (>65% off) is excluded
    assert.equal(dealsEg.rows.length, 1);
    assert.equal(dealsEg.rows[0].product_id, '11111111-1111-1111-1111-111111111115');
    assert.ok(dealsEg.rows[0].discount_percent >= 10 && dealsEg.rows[0].discount_percent <= 44);
  });
});
