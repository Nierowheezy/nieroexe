const { chromium } = require('playwright');

async function captureMoreScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ 
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2
  });
  
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(8000);
  
  // Screenshot 1: Customizer modal (Garage button)
  try {
    await page.click('button:has-text("Garage")', { timeout: 5000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ 
      path: 'docs/screenshot-customizer.png', 
      fullPage: true 
    });
    console.log('Captured: screenshot-customizer.png');
    
    // Close the modal by pressing Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  } catch (e) {
    console.log('Could not capture customizer modal:', e.message);
  }
  
  // Screenshot 2: Weather dropdown
  try {
    await page.click('button:has-text("Lagos")', { timeout: 5000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'docs/screenshot-weather.png', 
      fullPage: true 
    });
    console.log('Captured: screenshot-weather.png');
  } catch (e) {
    console.log('Could not capture weather dropdown:', e.message);
  }
  
  // Screenshot 3: Race timer HUD (start a race)
  try {
    // Click the race toggle button in the sub-header
    await page.click('button:has-text("Race")', { timeout: 5000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ 
      path: 'docs/screenshot-race.png', 
      fullPage: true 
    });
    console.log('Captured: screenshot-race.png');
  } catch (e) {
    console.log('Could not capture race HUD:', e.message);
  }
  
  await browser.close();
  console.log('Additional screenshots captured!');
}

captureMoreScreenshots().catch(console.error);