const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3456', { waitUntil: 'networkidle2' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshot-home.png' });
  
  // Click Projects tab
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.textContent?.includes('Projects')) btn.click();
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshot-projects.png' });
  
  // Click Chat tab
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.textContent?.includes('Chat')) btn.click();
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshot-chat.png' });
  
  // Click Create tab
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.textContent?.includes('Create')) btn.click();
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshot-create.png' });
  
  // Click Files tab
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.textContent?.includes('Files')) btn.click();
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshot-files.png' });
  
  await browser.close();
  console.log('Screenshots saved!');
})();
