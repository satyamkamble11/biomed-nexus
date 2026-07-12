const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const outDir = path.join(process.cwd(), 'screenshots');
    fs.mkdirSync(outDir, { recursive: true });

    const url = process.env.URL || 'http://127.0.0.1:5000';
    console.log('Recording demo from', url);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      recordVideo: { dir: outDir, size: { width: 1280, height: 800 } }
    });
    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);

    // Perform some simple interactions if available
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1200);

    await context.close();
    await browser.close();

    const files = fs.readdirSync(outDir).filter((f) => f.endsWith('.webm'));
    if (files.length === 0) {
      throw new Error('No video file produced');
    }

    console.log('Demo video saved as', files[files.length - 1]);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
