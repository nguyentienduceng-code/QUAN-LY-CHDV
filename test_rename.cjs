const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  // Override prompt
  await page.addInitScript(() => {
    window.prompt = () => 'Nhà A1';
  });

  await page.goto('http://localhost:5173/');
  
  // Login
  await page.waitForSelector('text=Nạp Dữ Liệu Mẫu', {timeout: 5000}).catch(() => {});
  const loadMock = await page.$('text=Nạp Dữ Liệu Mẫu');
  if (loadMock) await loadMock.click();
  
  await page.fill('input[type="text"]', 'admin');
  await page.fill('input[type="password"]', 'admin');
  await page.click('button:has-text("Đăng Nhập")');
  
  await page.waitForSelector('text=Quản lý Phòng');
  await page.click('text=Quản lý Phòng');
  
  // Find the edit button for Nhà A
  await page.waitForSelector('text=Nhà A');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const editBtn = buttons.find(b => b.title === 'Đổi tên' && b.previousSibling && b.previousSibling.textContent.includes('A'));
    if (editBtn) editBtn.click();
  });
  
  await page.waitForTimeout(2000);
  await browser.close();
})();
