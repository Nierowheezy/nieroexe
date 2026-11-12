const { chromium } = require('playwright');

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ 
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2
  });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 60000 });
  
  // Wait for Three.js to initialize and render
  await page.waitForTimeout(5000);
  
  // Screenshot 1: Full dashboard view
  await page.screenshot({ 
    path: 'docs/screenshot-dashboard.png', 
    fullPage: true 
  });
  console.log('Captured: screenshot-dashboard.png');
  
  // Screenshot 2: Open portfolio modal
  try {
    await page.click('button:has-text("Projects")');
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'docs/screenshot-portfolio.png', 
      fullPage: true 
    });
    console.log('Captured: screenshot-portfolio.png');
  } catch (e) {
    console.log('Could not capture portfolio modal');
  }
  
  // Screenshot 3: Customizer modal
  try {
    await page.click('button:has-text("Garage")');
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'docs/screenshot-customizer.png', 
      fullPage: true 
    });
    console.log('Captured: screenshot-customizer.png');
  } catch (e) {
    console.log('Could not capture customizer modal');
  }
  
  // Screenshot 4: Mobile view
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'docs/screenshot-mobile.png', 
      fullPage: true 
    });
    console.log('Captured: screenshot-mobile.png');
  } catch (e) {
    console.log('Could not capture mobile view');
  }
  
  // Screenshot 5: Driving view - simulate some interaction
  try {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.mouse.down();
    await page.mouse.move(1000, 500);
    await page.mouse.up();
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'docs/screenshot-driving.png', 
      fullPage: true 
    });
    console.log('Captured: screenshot-driving.png');
  } catch (e) {
    console.log('Could not capture driving view');
  }
  
  await browser.close();
  console.log('All screenshots captured!');
}

captureScreenshots().catch(console.error);