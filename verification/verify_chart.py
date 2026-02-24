import time
from playwright.sync_api import sync_playwright

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Go to frontend
        print("Navigating to frontend...")
        try:
            page.goto("http://localhost:3000")
        except Exception as e:
            print(f"Failed to load page: {e}")
            return

        # Wait for the page to load
        try:
            page.wait_for_selector('h1', timeout=10000) # Wait for title
        except Exception as e:
             print(f"Timeout waiting for page load: {e}")

        # Check if the chart container exists
        # In MetricsChart.tsx: <h3>Metrics History</h3>
        print("Checking for chart...")
        try:
            if page.get_by_text("Metrics History").is_visible():
                print("Chart header found.")
            else:
                print("Chart header NOT found.")
        except Exception as e:
            print(f"Error finding chart header: {e}")

        # Trigger a process to generate some metrics
        print("Triggering process...")
        try:
            page.get_by_role("button", name="Trigger Process").click()
        except Exception as e:
            print(f"Error clicking trigger: {e}")

        # Wait for a bit to accumulate metrics
        time.sleep(5)

        # Take a screenshot
        screenshot_path = "verification/chart_verification.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    main()
