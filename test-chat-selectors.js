/**
 * Test script to check if chat selectors are working
 */
const { chromium } = require('playwright');

async function testSelectors() {
  console.log('🔌 Launching browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🌐 Navigating to Coolhole.org...');
  await page.goto('https://coolhole.org', { waitUntil: 'domcontentloaded' });

  console.log('⏳ Waiting 5 seconds for page to load...');
  await page.waitForTimeout(5000);

  console.log('\n🔍 Testing selectors:');

  // Test #messagebuffer
  const messagebuffer = await page.$('#messagebuffer');
  console.log(`  #messagebuffer: ${messagebuffer ? '✅ FOUND' : '❌ NOT FOUND'}`);

  // Test #chatline
  const chatline = await page.$('#chatline');
  console.log(`  #chatline: ${chatline ? '✅ FOUND' : '❌ NOT FOUND'}`);

  // Test alternative selectors
  const chatInput = await page.$('.chat-input');
  console.log(`  .chat-input: ${chatInput ? '✅ FOUND' : '❌ NOT FOUND'}`);

  const textarea = await page.$('textarea');
  console.log(`  textarea: ${textarea ? '✅ FOUND' : '❌ NOT FOUND'}`);

  const textInput = await page.$('input[type="text"]');
  console.log(`  input[type="text"]: ${textInput ? '✅ FOUND' : '❌ NOT FOUND'}`);

  // Get all visible input elements
  console.log('\n📋 All input elements on page:');
  const allInputs = await page.$$('input, textarea');
  for (let i = 0; i < allInputs.length; i++) {
    const input = allInputs[i];
    const id = await input.getAttribute('id');
    const className = await input.getAttribute('class');
    const type = await input.getAttribute('type');
    const placeholder = await input.getAttribute('placeholder');
    const visible = await input.isVisible();

    if (visible) {
      console.log(`  Input ${i + 1}:`);
      console.log(`    id: ${id || 'none'}`);
      console.log(`    class: ${className || 'none'}`);
      console.log(`    type: ${type || 'text'}`);
      console.log(`    placeholder: ${placeholder || 'none'}`);
    }
  }

  // Check current URL
  console.log(`\n🌐 Current URL: ${page.url()}`);

  // Check page title
  console.log(`📄 Page title: ${await page.title()}`);

  console.log('\n✅ Test complete. Press Ctrl+C to exit.');

  // Keep browser open
  await page.waitForTimeout(300000); // 5 minutes

  await browser.close();
}

testSelectors().catch(console.error);
