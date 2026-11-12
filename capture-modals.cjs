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
  
  // Screenshot 1: Open portfolio modal - try different selectors
  try {
    // Try to find and click the Projects button in the bottom dock
    const projectsBtn = await page.$('button:has-text("Projects")');
    if (!projectsBtn) {
      // Try finding by icon or other attributes
      await page.click('button >> text=Projects');
    } else {
      await projectsBtn.click();
    }
    await page.waitForTimeout(1500);
    await page.screenshot({ 
      path: 'docs/screenshot-portfolio.png', 
      fullPage: true 
    });
    console.log('Captured: screenshot-portfolio.png');
  } catch (e) {
    console.log('Could not capture portfolio modal:', e.message);
  }
  
  // Screenshot 2: Customizer modal
  try {
    const garageBtn = await page.$('button:has-text("Garage")');
    if (!garageBtn) {
      await page.click('button >> text=Garage');
    } else {
      await garageBtn.click();
    }
    await page.waitForTimeout(1500);
    await page.screenshot({ 
      path: 'docs/screenshot-customizer.png', 
      fullPage: true 
    });
    console.log('Captured: screenshot-customizer.png');
  } catch (e) {
    console.log('Could not capture customizer modal:', e.message);
  }
  
  // Screenshot 3: Weather dropdown
  try {
    await page.click('button >> text=Lagos');
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
  console.log('Additional screenshots captured!');
}

captureScreenshots().catch(console.error);