const { chromium } = require('playwright');

async function captureWeather() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ 
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2
  });
  
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(8000);
  
  // Weather dropdown - click the button in the header
  try {
    // Use the specific button with the Lagos text
    const lagosBtn = await page.$('button[title="Real-Time Lagos Weather & West Africa Time (Strictly Synced)"]');
    if (lagosBtn) {
      await lagosBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: 'docs/screenshot-weather.png', 
        fullPage: true 
      });
      console.log('Captured: screenshot-weather.png');
    } else {
      console.log('Could not find Lagos weather button');
    }
  } catch (e) {
    console.log('Could not capture weather dropdown:', e.message);
  }
  
  await browser.close();
}

captureWeather().catch(console.error);