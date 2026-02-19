const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000');

    // Wait for the preset button to be visible
    console.log('Waiting for preset buttons...');
    const presetButton = page.locator('#preset-db-latency');
    await presetButton.waitFor({ state: 'visible', timeout: 10000 });

    // Take initial screenshot
    await page.screenshot({ path: 'verification/initial_state.png' });

    // Click the preset button
    console.log('Clicking DB Latency preset...');
    await presetButton.click();

    // Wait for the input to update (it's immediate in React, but good to wait/verify)
    const delayInput = page.locator('#delay-input');
    await delayInput.waitFor({ state: 'visible' });

    // Verify the value
    const value = await delayInput.inputValue();
    if (value !== '1500') {
      console.error(`Expected delay to be 1500, but got ${value}`);
      process.exit(1);
    }

    // Take final screenshot showing the updated state
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'verification/presets_applied.png', fullPage: true });

    await browser.close();
    console.log('Verification complete.');
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
})();
