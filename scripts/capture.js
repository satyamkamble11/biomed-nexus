const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const outDir = path.join(process.cwd(), 'screenshots');
    fs.mkdirSync(outDir, { recursive: true });

    const url = process.env.URL || 'http://127.0.0.1:5000';
    console.log('Opening', url);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(outDir, 'home.png'), fullPage: true });
    console.log('Saved:', path.join(outDir, 'home.png'));

    // Try a second screenshot after waiting for interactive components
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'home-2.png'), fullPage: true });
    console.log('Saved:', path.join(outDir, 'home-2.png'));

    await browser.close();
    console.log('Screenshots completed');
    process.exit(0);
  } catch (err) {
    console.error('Capture failed:', err);
    process.exit(2);
  }
})();
