const { chromium } = require('playwright');

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ 
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2
  });
  
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 60000 });
  
  // Wait for Three.js to initialize and render - give it more time
  await page.waitForTimeout(8000);
  
  // Screenshot 1: Full dashboard view (initial load)
  await page.screenshot({ 
    path: 'docs/screenshot-dashboard.png', 
    fullPage: true 
  });
  console.log('Captured: screenshot-dashboard.png');
  
  // Screenshot 2: Slightly different angle - simulate mouse drag for orbit
  await page.mouse.move(960, 540);
  await page.mouse.down();
  await page.mouse.move(700, 540);
  await page.mouse.up();
  await page.waitForTimeout(1500);
  await page.screenshot({ 
    path: 'docs/screenshot-driving.png', 
    fullPage: true 
  });
  console.log('Captured: screenshot-driving.png');
  
  // Screenshot 3: Mobile view
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(2000);
  await page.screenshot({ 
    path: 'docs/screenshot-mobile.png', 
    fullPage: true 
  });
  console.log('Captured: screenshot-mobile.png');
  
  // Screenshot 4: Try to open portfolio modal by clicking the Projects button in bottom dock
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(1000);
  
  try {
    // The bottom dock has a "Projects" button - use a more specific selector
    await page.click('button:has-text("Projects")', { timeout: 5000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ 
      path: 'docs/screenshot-portfolio.png', 
      fullPage: true 
    });
    console.log('Captured: screenshot-portfolio.png');
  } catch (e) {
    console.log('Could not capture portfolio modal:', e.message);
    // Try alternative - the button might have the icon only on mobile, or text on desktop
    try {
      await page.click('button[aria-label*="Projects" i]', { timeout: 3000 });
      await page.waitForTimeout(1500);
      await page.screenshot({ 
        path: 'docs/screenshot-portfolio.png', 
        fullPage: true 
      });
      console.log('Captured: screenshot-portfolio.png (alt)');
    } catch (e2) {
      console.log('Could not capture portfolio modal (alt):', e2.message);
    }
  }
  
  // Screenshot 5: Customizer modal (Garage button)
  try {
    await page.click('button:has-text("Garage")', { timeout: 5000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ 
      path: 'docs/screenshot-customizer.png', 
      fullPage: true 
    });
    console.log('Captured: screenshot-customizer.png');
  } catch (e) {
    console.log('Could not capture customizer modal:', e.message);
  }
  
  // Screenshot 6: Weather dropdown
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
  
  await browser.close();
  console.log('All screenshots captured!');
}

captureScreenshots().catch(console.error);