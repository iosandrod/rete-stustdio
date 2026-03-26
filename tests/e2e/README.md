End-to-end tests for Vue Rete Studio connections

- Starts a Playwright test that:
  - Loads http://localhost:5173
  - Takes a screenshot before dragging a node labeled 'Variable'
  - Drags the node by a set offset
  - Takes a screenshot after dragging
  - Verifies the SVG connection line end-points move with the node within a tolerance
- Screenshots are saved to tests/e2e/screenshots/before_drag.png and after_drag.png
- Console errors during the test are surfaced via Playwright's console capture (see test harness)

Usage:
- Ensure the dev server is running on http://localhost:5173
- Install Playwright and run tests:
  npm install -D @playwright/test
  npx playwright install
  npx playwright test
