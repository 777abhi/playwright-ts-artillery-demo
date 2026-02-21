const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    console.log('Navigating to app...');
    await page.goto('http://localhost:3000');

    // Click Network Jitter preset
    console.log('Clicking Network Jitter preset...');
    await page.click('#preset-network-jitter');

    // Verify inputs
    const jitterValue = await page.inputValue('#jitter-input');
    console.log('Jitter input value:', jitterValue);
    if (jitterValue !== '500') {
      console.error('Expected jitter 500, got ' + jitterValue);
      process.exit(1);
    }

    // Trigger process
    console.log('Triggering process...');
    await page.click('#trigger-process');

    // Wait for success message
    console.log('Waiting for success message...');
    await page.waitForSelector('.success-message', { timeout: 10000 });

    // Take screenshot
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'verification/jitter_verification.png' });

    console.log('Verification successful, screenshot saved.');

    await browser.close();
  } catch (error) {
    console.error('Error during verification:', error);
    process.exit(1);
  }
})();
