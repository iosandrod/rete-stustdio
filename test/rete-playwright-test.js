const { chromium } = require('playwright');
(async () => {
  const TARGET_URL = 'http://localhost:5175';
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleErrors.push({ type: msg.type(), text: msg.text(), location: msg.location() });
    }
  });

  console.log(`Navigating to ${TARGET_URL}`);
  try {
    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
  } catch (err) {
    console.error('Navigation failed:', err);
    await browser.close();
    process.exit(1);
  }

  // Phase 2: Wait for the graph editor to load
  const selectors = ['.rete', '#rete', '.node', '.graph-container', 'canvas', 'svg'];
  let loaded = false;
  for (const sel of selectors) {
    try {
      await page.waitForSelector(sel, { timeout: 8000 });
      console.log(`Graph editor detected with selector: ${sel}`);
      loaded = true;
      break;
    } catch (e) {
      // ignore and try next
    }
  }
  if (!loaded) {
    console.log('Warning: Graph editor load indicator not found. Proceeding with best effort.');
  }

  // Phase 3: Check console errors (captured above)
  // Phase 4: Take a screenshot of the loaded page
  await page.screenshot({ path: './rete-initial.png', fullPage: true }).catch(() => {});

  // Phase 5: Try to drag a node by clicking it and moving with drag
  const firstNode = page.locator('.node').first();
  const nodeCount = await page.locator('.node').count();
  const box = nodeCount > 0 ? await firstNode.boundingBox() : null;
  let moved = false;
  if (box) {
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    const endX = startX + 200; // drag 200px to the right
    const endY = startY;
    await page.mouse.move(endX, endY, { steps: 20 });
    await page.mouse.up();
    // Allow graph to settle
    await page.waitForTimeout(600);

    const newBox = await firstNode.boundingBox();
    if (newBox) {
      moved = Math.abs(newBox.x - box.x) > 5 || Math.abs(newBox.y - box.y) > 5;
    }
  } else {
    console.log('No node element found to drag.');
  }

  // Phase 6: Take a screenshot after dragging
  await page.screenshot({ path: './rete-after-drag.png', fullPage: true }).catch(() => {});

  // Phase 7: Report what happened
  console.log('Console errors captured:', JSON.stringify(consoleErrors, null, 2));
  console.log(`Node moved: ${moved ? 'Yes' : 'No'}`);

  await browser.close();
})();
