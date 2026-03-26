import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('Navigating to http://localhost:5191...');
  await page.goto('http://localhost:5191', { waitUntil: 'networkidle' });
  
  // Wait for Monaco editors
  console.log('Waiting for page to load...');
  await page.waitForTimeout(2000);
  
  // Check for nodes
  const nodeCount = await page.locator('.rete-node').count();
  console.log(`Found ${nodeCount} nodes`);
  
  // Check initial connection count
  const initialPaths = await page.locator('svg path.connection-path').count();
  console.log(`Initial connection paths: ${initialPaths}`);
  
  // Find output sockets (orange) and input sockets (green)
  const outputSockets = await page.locator('.socket-output').all();
  const inputSockets = await page.locator('.socket-input').all();
  
  console.log(`Found ${outputSockets.length} output sockets, ${inputSockets.length} input sockets`);
  
  if (outputSockets.length >= 1 && inputSockets.length >= 1) {
    const outputBox = await outputSockets[0].boundingBox();
    const inputBox = await inputSockets[0].boundingBox();
    
    if (outputBox && inputBox) {
      console.log(`Output socket at: (${outputBox.x}, ${outputBox.y})`);
      console.log(`Input socket at: (${inputBox.x}, ${inputBox.y})`);
      
      // Perform drag from output to input
      console.log('Starting drag from output to input...');
      await page.mouse.move(outputBox.x + outputBox.width/2, outputBox.y + outputBox.height/2);
      await page.mouse.down();
      await page.waitForTimeout(100);
      await page.mouse.move(inputBox.x + inputBox.width/2, inputBox.y + inputBox.height/2, { steps: 10 });
      await page.waitForTimeout(100);
      await page.mouse.up();
      
      await page.waitForTimeout(500);
      
      // Check final connection count
      const finalPaths = await page.locator('svg path.connection-path').count();
      console.log(`Final connection paths: ${finalPaths}`);
      
      if (finalPaths > initialPaths) {
        console.log('✅ Connection created successfully!');
      } else {
        console.log('❌ No new connection created');
      }
    }
  }
  
  await browser.close();
})();
