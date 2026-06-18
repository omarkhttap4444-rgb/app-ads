const puppeteer = require('puppeteer');

async function test() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Intercept console messages
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
  await page.goto('http://localhost:3000/signup');
  console.log('Navigated to /signup');

  // Fill form
  await page.type('input[placeholder="مثال: أحمد محمد"]', 'Test Name');
  await page.type('input[type="email"]', 'newemail' + Date.now() + '@example.com');
  await page.type('input[placeholder="•••••••• (6 أحرف على الأقل)"]', 'password123');
  await page.type('input[placeholder="أعد إدخال كلمة المرور"]', 'password123');
  
  console.log('Filled out form, clicking submit...');
  await page.click('button[type="submit"]');

  // Wait for network idle or step change
  await new Promise(r => setTimeout(r, 3000));
  
  const content = await page.content();
  if (content.includes('رمز التحقق (OTP)')) {
    console.log('SUCCESS: OTP page appeared!');
  } else if (content.includes('البريد الإلكتروني مسجل بالفعل')) {
    console.log('ERROR: Email already registered error shown.');
  } else {
    console.log('FAILED: OTP page did not appear. Looking for error alerts...');
    const alert = await page.evaluate(() => {
      const el = document.querySelector('.bg-rose-50');
      return el ? el.innerText : null;
    });
    console.log('Alert text:', alert);
  }
  
  await browser.close();
}

test();
