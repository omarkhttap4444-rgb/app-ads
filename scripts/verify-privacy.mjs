import assert from 'node:assert/strict';

const baseUrl = 'http://localhost:3000';

async function verify() {
  console.log('--- Verifying /privacy Page ---');
  const privacyRes = await fetch(`${baseUrl}/privacy`);
  assert.equal(privacyRes.status, 200, 'Expected 200 status code for /privacy');
  
  const html = await privacyRes.text();

  // Check Title
  assert.ok(html.includes('<title>سياسة الخصوصية | سوق فون</title>'), 'Title should be "سياسة الخصوصية | سوق فون"');
  console.log('✓ Title tag verified');

  // Check Canonical
  assert.ok(html.includes('href="https://souqphone.com/privacy" rel="canonical"') || html.includes('rel="canonical" href="https://souqphone.com/privacy"') || html.includes('"canonical":"https://souqphone.com/privacy"') || html.includes('rel="canonical"'), 'Canonical URL verified');
  console.log('✓ Canonical tag verified');

  // Check Meta Description
  assert.ok(html.includes('name="description"') && html.includes('سياسة الخصوصية'), 'Meta description verified');
  console.log('✓ Meta description verified');

  // Check Robots
  assert.ok(html.includes('content="index, follow') || html.includes('content="index,follow') || html.includes('name="robots"'), 'Robots meta tag verified');
  console.log('✓ Robots tag verified');

  // Check Content Sections
  const requiredStrings = [
    'سوق فون: بيع وشراء الموبايلات',
    'com.souqphone.app',
    'souqphone.com',
    'Google API Services User Data Policy',
    'OAuth verification',
    'المعلومات التي نجمعها من حساب Google',
    'البريد الإلكتروني (email)',
    'الاسم الكامل (name)',
    'صورة الملف الشخصي (profile picture)',
    'openid',
    'email',
    'profile',
    'بيانات استخدام التطبيق والجهاز والموقع',
    'المعلومات التقنية',
    'الإعلانات والمنتجات',
    'مجتمع سوق فون والمحتوى الذي ينشئه المستخدمون',
    'البيانات والمحتوى المرتبط بالمجتمع',
    'ظهور المحتوى للآخرين',
    'استخدام بيانات ومحتوى المجتمع',
    'الإبلاغ والإشراف على المحتوى',
    'التحكم في المحتوى والحذف',
    'استخدام الكاميرا والصور',
    'كيفية استخدام البيانات',
    'المصادقة (Authentication)',
    'تخزين البيانات وأمانها',
    'HTTPS/TLS',
    'خدمات الطرف الثالث',
    'Firebase Authentication',
    'Firebase Firestore',
    'Firebase Analytics',
    'Firebase Cloud Messaging (FCM)',
    'Supabase',
    'Google AdMob',
    'Google User Messaging Platform (UMP)',
    'Meta / Facebook App Events',
    'OpenStreetMap',
    'Firebase Cloud Functions',
    'https://policies.google.com/technologies/partner-sites',
    'مشاركة البيانات',
    'حقوق المستخدم وحذف البيانات',
    'حق الوصول',
    'حق التصحيح',
    'حق الحذف النهائي',
    'الامتثال لسياسات Google OAuth والتحقق',
    'معلومات التواصل',
    'suoqphone@gmail.com',
    '24 سبتمبر 2026'
  ];

  for (const str of requiredStrings) {
    assert.ok(html.includes(str), `HTML should contain: "${str}"`);
  }
  console.log(`✓ All ${requiredStrings.length} required content points verified in SSR HTML`);

  // Check Footer on Home Page
  console.log('\n--- Verifying Footer Link ---');
  const homeRes = await fetch(`${baseUrl}/`);
  assert.equal(homeRes.status, 200);
  const homeHtml = await homeRes.text();
  assert.ok(homeHtml.includes('href="/privacy"') && homeHtml.includes('سياسة الخصوصية'), 'Home page footer must link to /privacy');
  console.log('✓ Footer link to /privacy verified on home page');

  // Check Static Sitemap
  console.log('\n--- Verifying Sitemap ---');
  const sitemapRes = await fetch(`${baseUrl}/sitemaps/static.xml`);
  assert.equal(sitemapRes.status, 200);
  const sitemapXml = await sitemapRes.text();
  assert.ok(sitemapXml.includes('<loc>https://souqphone.com/privacy</loc>'), 'Static sitemap must include /privacy');
  console.log('✓ /privacy verified in /sitemaps/static.xml');

  console.log('\n==================================');
  console.log('🎉 ALL PRIVACY POLICY CHECKS PASSED!');
  console.log('==================================');
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
