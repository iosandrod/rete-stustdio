import { test, expect } from '@playwright/test';

// Utility to extract the final endpoint (x,y) from a path 'd' attribute string
function extractEndPoint(d: string | null): { x: number; y: number } {
  if (!d) return { x: 0, y: 0 };
  // Take the last pair of numbers in the string as the end point
  const re = /(-?\d+\.?\d*)\s+(-?\d+\.?\d*)[^\d]*$/;
  const m = d.match(re);
  if (!m) {
    // Fallback: try to grab the last two numbers in the string
    const nums = (d.match(/-?\d+\.?\d*/g) ?? []).slice(-2);
    if (nums.length === 2) {
      return { x: parseFloat(nums[0]), y: parseFloat(nums[1]) };
    }
    return { x: 0, y: 0 };
  }
  return { x: parseFloat(m[1]), y: parseFloat(m[2]) };
}

test('Connection lines follow nodes during drag', async ({ page }) => {
  // Navigate to the app
  await page.goto('/');
  // Wait for at least one node to render (look for a common node label)
  // Adjust selector if needed based on actual node titles
  const nodeLabel = 'Variable';
  const node = page.locator(`:has-text("${nodeLabel}")`).first();
  await expect(node).toBeVisible({ timeout: 10000 });

  // Capture initial screenshot (before drag)
  await page.screenshot({ path: 'tests/e2e/screenshots/before_drag.png', fullPage: true });

  // Capture initial line path data
  const lines = page.locator('svg path');
  const beforeLineD = await lines.first().getAttribute('d');
  const beforeEnd = extractEndPoint(beforeLineD);

  // Obtain node bounding box to compute drag start position
  const bboxBefore = await node.boundingBox();
  if (!bboxBefore) throw new Error('Could not determine node position before drag');
  const startX = bboxBefore.x + bboxBefore.width / 2;
  const startY = bboxBefore.y + bboxBefore.height / 2;

  // Drag the node by a certain offset (e.g., to the right and slightly down)
  const dx = 260; // pixels to move
  const dy = 80;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  // Use a small number of steps for smoothness
  await page.mouse.move(startX + dx, startY + dy, { steps: 20 });
  await page.mouse.up();

  // Capture node position after drag
  const bboxAfter = await node.boundingBox();
  if (!bboxAfter) throw new Error('Could not determine node position after drag');
  const deltaXNode = bboxAfter.x - bboxBefore.x;
  const deltaYNode = bboxAfter.y - bboxBefore.y;

  // Capture final line path data
  const afterLineD = await lines.first().getAttribute('d');
  const afterEnd = extractEndPoint(afterLineD);

  // Take an after-drag screenshot
  await page.screenshot({ path: 'tests/e2e/screenshots/after_drag.png', fullPage: true });

  // Basic verification: lines should still exist and endpoints should move with the node
  expect(await lines.count()).toBeGreaterThan(0);

  // Compare line end movement with node movement
  const deltaLineX = afterEnd.x - beforeEnd.x;
  const deltaLineY = afterEnd.y - beforeEnd.y;

  const tolerance = 8; // px tolerance for UI movement variance
  const lineMatchesNodeX = Math.abs(deltaLineX - deltaXNode) <= tolerance;
  const lineMatchesNodeY = Math.abs(deltaLineY - deltaYNode) <= tolerance;

  // If both axes roughly match the node movement, we consider the test a pass
  const followOk = lineMatchesNodeX && lineMatchesNodeY;

  // Also ensure there were no console errors during drag (captured via page.on in global setup)
  // Note: This test infra prints console messages to the terminal if errors are present
  if (!followOk) {
    // Provide a helpful assertion message
    throw new Error(`Connection endpoints did not follow node. deltaLine=(${deltaLineX.toFixed(2)},${deltaLineY.toFixed(2)}), nodeDelta=(${deltaXNode.toFixed(2)},${deltaYNode.toFixed(2)}), tolerance=${tolerance}`);
  }
});
