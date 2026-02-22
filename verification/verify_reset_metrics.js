const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('Navigating to app...');
    await page.goto('http://localhost:3000');

    // Trigger process to generate metrics
    console.log('Triggering process...');
    await page.click('#trigger-process');

    // Wait for success
    console.log('Waiting for success message...');
    await page.waitForSelector('.success-message');

    // Wait for metrics to be fetched (interval is 2000ms)
    console.log('Waiting for metrics update...');
    await page.waitForTimeout(2500);

    // Check if metrics are displayed
    const metricsVisible = await page.isVisible('text=Requests:');
    if (!metricsVisible) {
      console.log('Metrics not visible!');
    }

    // Take screenshot BEFORE reset
    await page.screenshot({ path: 'verification/before_reset.png', fullPage: true });

    // Click Reset
    console.log('Clicking Reset Metrics...');
    await page.click('#reset-metrics-button');

    // Wait for reset to apply
    console.log('Waiting for reset...');
    await page.waitForTimeout(1000);

    // Take screenshot AFTER reset
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'verification/reset_metrics.png', fullPage: true });

    console.log('Done.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
