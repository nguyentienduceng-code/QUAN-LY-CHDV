import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    console.log('Logging in via backdoor (localStorage)...');
    await page.goto('http://localhost:5173/');
    await new Promise(r => setTimeout(r, 1000));
    
    // Inject backdoor user directly to local storage to bypass Firebase Auth
    await page.evaluate(() => {
      localStorage.setItem('chdv_user', JSON.stringify({ name: 'Admin Master', role: 'admin', email: 'admin@gmail.com', ownerId: 'demo-admin' }));
    });
    
    console.log('Step 1: Cấu hình');
    // Ensure we are on the dashboard with the injected session
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      const links = Array.from(document.querySelectorAll('.nav-link'));
      const el = links.find(l => l.innerText && l.innerText.includes('Cấu hình'));
      if (el) {
        el.style.outline = '4px solid #ef4444';
        el.style.outlineOffset = '2px';
        el.style.borderRadius = '8px';
        el.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.8)';
      }
    });
    await page.screenshot({ path: 'docs/screenshots/step1.png' });

    console.log('Step 2: Quản lý Phòng');
    await page.evaluate(() => {
      // clear previous
      document.querySelectorAll('.nav-link').forEach(l => {
        l.style.outline = 'none';
        l.style.boxShadow = 'none';
      });
      const links = Array.from(document.querySelectorAll('.nav-link'));
      const el = links.find(l => l.innerText && l.innerText.includes('Quản lý Phòng'));
      if (el) {
        el.style.outline = '4px solid #ef4444';
        el.style.outlineOffset = '2px';
        el.style.borderRadius = '8px';
        el.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.8)';
      }
    });
    await page.screenshot({ path: 'docs/screenshots/step2.png' });

    console.log('Step 3: Tạo hợp đồng');
    await page.goto('http://localhost:5173/finance', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 3000));
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.innerText && b.innerText.includes('Tạo Hợp Đồng'));
      if (btn) {
        btn.style.outline = '4px solid #ef4444';
        btn.style.outlineOffset = '2px';
        btn.style.borderRadius = '8px';
        btn.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.8)';
        btn.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'docs/screenshots/step3.png' });

    console.log('Step 4: Tạo hóa đơn');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      buttons.forEach(b => {
        b.style.outline = 'none';
        b.style.boxShadow = 'none';
      });
      const btn = buttons.find(b => b.innerText && b.innerText.includes('Tạo Hóa Đơn'));
      if (btn) {
        btn.style.outline = '4px solid #ef4444';
        btn.style.outlineOffset = '2px';
        btn.style.borderRadius = '8px';
        btn.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.8)';
        btn.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'docs/screenshots/step4.png' });
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
    console.log('Done generating annotated screenshots!');
  }
})();
