import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { safeInternalRedirect } from '../../src/lib/safe-redirect';
import { visibleSellerContacts, formatWhatsAppNumber } from '../../src/lib/seller-contact';

for (const value of [null, '', 'https://evil.test', '//evil.test', '///evil.test',
  '/\\evil.test', '/\nevil.test', 'javascript:alert(1)', 'data:text/html,x',
  '/%2fevil.test', '/%5cevil.test', '/%252fevil.test', '/a/..//evil.test',
  '/%2e%2e//evil.test', '/%250a/evil.test', '/%zz', ' /mobiles',
]) {
  test(`reject unsafe redirect ${JSON.stringify(value)}`, () => {
    assert.equal(safeInternalRedirect(value), '/');
  });
}
for (const value of ['/', '/mobiles/add', '/mobiles/هاتف-للبيع', '/mobiles?brand=Apple#results',
  '/mobiles?next=https%3A%2F%2Fexample.com', '/profile/../mobiles']) {
  test(`accept internal redirect ${value}`, () => {
    const result = safeInternalRedirect(value);
    assert.equal(new URL(result, 'https://souqphone.com').origin, 'https://souqphone.com');
    assert.equal(result, new URL(value, 'https://souqphone.com').pathname + new URL(value, 'https://souqphone.com').search + new URL(value, 'https://souqphone.com').hash);
  });
}

for (const phoneVisible of [true, false, null, undefined]) {
  for (const whatsappVisible of [true, false, null, undefined]) {
    test(`independent consent: phone=${phoneVisible}, whatsapp=${whatsappVisible}`, () => {
      const result = visibleSellerContacts({ phone: '01000000000', contact_whatsapp: '01111111111',
        is_contact_phone_visible: phoneVisible, is_contact_whatsapp_visible: whatsappVisible });
      assert.equal(result.phone, phoneVisible === true ? '01000000000' : null);
      assert.equal(result.whatsapp, whatsappVisible === true ? '01111111111' : null);
    });
  }
}
test('missing WhatsApp never inherits a visible telephone', () => {
  const contact = visibleSellerContacts({ phone: '01000000000', is_contact_phone_visible: true,
    is_contact_whatsapp_visible: true, contact_whatsapp: '' });
  assert.equal(formatWhatsAppNumber(contact.whatsapp, false), '');
  assert.deepEqual(visibleSellerContacts(null), { phone: null, whatsapp: null });
  assert.equal(formatWhatsAppNumber('01000000000', false), '201000000000');
  assert.equal(formatWhatsAppNumber('+966 50 000 0000', true), '966500000000');
});
test('desktop/mobile components use only the dedicated WhatsApp contact', () => {
  for (const file of ['src/components/MobileContactBar.tsx', 'src/app/mobiles/[slug]/page.tsx']) {
    const source = readFileSync(file, 'utf8');
    assert.match(source, /formatWhatsAppNumber\(sellerWhatsapp,/);
    assert.doesNotMatch(source, /sellerWhatsapp\s*\|\|\s*sellerPhone/);
  }
  assert.match(readFileSync('src/app/login/page.tsx', 'utf8'), /safeInternalRedirect\(searchParams\.get\('redirectTo'\)\)/);
});
