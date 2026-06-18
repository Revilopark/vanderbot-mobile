const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('https://revilopark.github.io/vanderbot-mobile/', { 
    waitUntil: 'networkidle2', 
    timeout: 30000 
  });
  // Wait for React to hydrate
  await page.waitForFunction(() => {
    return document.querySelector('nav') !== null;
  }, { timeout: 10000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshot-live.png', fullPage: false });
  console.log('Screenshot saved');
  await browser.close();
})();
