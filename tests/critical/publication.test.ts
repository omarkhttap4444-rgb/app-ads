import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { SupabaseClient } from '@supabase/supabase-js';
import { preparePublication, commitPublication, readPendingPublication, PublicationError,
  type PublicationProduct } from '../../src/lib/product-publication';

const user = '11111111-1111-4111-8111-111111111111';
const product: PublicationProduct = { name: 'هاتف اختبار', description: 'وصف اختبار طويل وواضح', price: 100,
  category_id: 'phones', specifications: { model: 'test' }, is_negotiable: false,
  condition: 'مستعمل', location: 'القاهرة - مدينة نصر' };
const files = () => [new File(['one'], '1.jpg', { type: 'image/jpeg' }), new File(['two'], '2.png', { type: 'image/png' })];
function fixture() {
  const stored = new Map<string, string>();
  const journal = { getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => { stored.set(key, value); },
    removeItem: (key: string) => { stored.delete(key); } };
  const uploads: string[] = [], removals: string[][] = [], requests: Record<string, unknown>[] = [];
  const control = { failUpload: -1, rpcMode: 'success', commitCount: 0 };
  const committed = new Set<string>();
  const client = {
    storage: { from: () => ({
      upload: async (path: string) => {
        uploads.push(path);
        return { error: uploads.length === control.failUpload ? { message: 'failed' } : null };
      },
      remove: async (paths: string[]) => { removals.push(paths); return { error: null }; },
    }) },
    rpc: async (_name: string, args: Record<string, unknown>) => {
      requests.push(args);
      if (control.rpcMode === 'reject') return { data: null, error: { code: '22023' } };
      if (control.rpcMode === 'missing') return { data: null, error: { code: 'PGRST202' } };
      const id = args.p_product_id as string;
      if (!committed.has(id)) { committed.add(id); control.commitCount++; }
      if (control.rpcMode === 'lost-response') throw new Error('network failed after commit');
      if (control.rpcMode === 'fetch-error') return { data: null, error: { code: '', message: 'fetch failed' } };
      return { data: { id, slug: 'test', image_count: control.rpcMode === 'partial' ? 1 : 2 }, error: null };
    },
  } as unknown as SupabaseClient;
  return { journal, stored, client, uploads, removals, requests, control };
}
test('all images precede commit; success requires complete matching receipt', async () => {
  const f = fixture();
  const pending = await preparePublication(f.client, f.journal, user, product, files());
  assert.equal(f.requests.length, 0);
  assert.equal(f.uploads.length, 2);
  assert.deepEqual(readPendingPublication(f.journal, user), pending);
  product.name = 'modified after preparation';
  assert.equal(pending.product.name, 'هاتف اختبار');
  await commitPublication(f.client, f.journal, pending);
  assert.equal(f.stored.size, 0);
  assert.equal(f.control.commitCount, 1);
});
test('failure of second image prevents any product write and cleans owned paths', async () => {
  const f = fixture(); f.control.failUpload = 2;
  await assert.rejects(preparePublication(f.client, f.journal, user, product, files()), PublicationError);
  assert.equal(f.requests.length, 0);
  assert.equal(f.stored.size, 0);
  assert.deepEqual(f.removals[0], f.uploads);
});
test('unsupported/empty/too many images fail before network', async () => {
  const f = fixture();
  for (const invalid of [[], Array(5).fill(files()[0]), [new File(['x'], 'x.svg', { type: 'image/svg+xml' })],
    [new File([], 'x.jpg', { type: 'image/jpeg' })]]) {
    await assert.rejects(preparePublication(f.client, f.journal, user, product, invalid), PublicationError);
  }
  assert.equal(f.uploads.length, 0);
});
test('unavailable browser journal prevents the commit and cleans uploaded files', async () => {
  const f = fixture();
  f.journal.setItem = () => { throw new Error('quota'); };
  await assert.rejects(preparePublication(f.client, f.journal, user, product, files()), PublicationError);
  assert.equal(f.requests.length, 0);
  assert.equal(f.removals.length, 1);
});
test('lost commit response + reload retries same ID without reupload or duplicate', async () => {
  const f = fixture();
  const pending = await preparePublication(f.client, f.journal, user, product, files());
  f.control.rpcMode = 'lost-response';
  await assert.rejects(commitPublication(f.client, f.journal, pending), (e: PublicationError) => e.uncertain);
  assert.equal(f.removals.length, 0);
  assert.equal(f.control.commitCount, 1);
  const restored = readPendingPublication(f.journal, user)!;
  assert.equal(restored.productId, pending.productId);
  f.control.rpcMode = 'success';
  await commitPublication(f.client, f.journal, restored);
  assert.equal(f.control.commitCount, 1);
  assert.equal(f.uploads.length, 2);
  assert.equal(f.stored.size, 0);
});
for (const mode of ['partial', 'fetch-error']) {
  test(`${mode} cannot report success or delete possibly committed images`, async () => {
    const f = fixture(); f.control.rpcMode = mode;
    const pending = await preparePublication(f.client, f.journal, user, product, files());
    await assert.rejects(commitPublication(f.client, f.journal, pending), (e: PublicationError) => e.uncertain);
    assert.equal(f.removals.length, 0);
    assert.equal(f.stored.size, 1);
  });
}
for (const mode of ['reject', 'missing']) {
  test(`first explicit ${mode} fails closed and allows correcting the form`, async () => {
    const f = fixture(); f.control.rpcMode = mode;
    const pending = await preparePublication(f.client, f.journal, user, product, files());
    await assert.rejects(commitPublication(f.client, f.journal, pending), (e: PublicationError) => !e.uncertain);
    assert.equal(f.control.commitCount, 0);
    assert.equal(f.stored.size, 0);
  });
}
test('a later rejection does not erase an earlier uncertain receipt', async () => {
  const f = fixture();
  const pending = await preparePublication(f.client, f.journal, user, product, files());
  f.control.rpcMode = 'lost-response';
  await assert.rejects(commitPublication(f.client, f.journal, pending));
  f.control.rpcMode = 'reject';
  await assert.rejects(commitPublication(f.client, f.journal, pending), (e: PublicationError) => e.uncertain);
  assert.equal(f.stored.size, 1);
  assert.equal(f.removals.length, 0);
});
test('pending request cannot be overwritten; user journals are isolated', async () => {
  const f = fixture();
  await preparePublication(f.client, f.journal, user, product, files());
  await assert.rejects(preparePublication(f.client, f.journal, user, product, files()), PublicationError);
  assert.equal(readPendingPublication(f.journal, '22222222-2222-4222-8222-222222222222'), null);
  assert.equal(f.uploads.length, 2);
});
