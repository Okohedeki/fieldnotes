const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({headless: true, ...(process.env.BROWSER_CHANNEL ? {channel: process.env.BROWSER_CHANNEL} : {})});
  try {
    const page = await browser.newPage({viewport: {width: 1440, height: 900}});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => dialog.accept());
    await page.goto(`${process.env.FIELDNOTES_URL || 'http://127.0.0.1:8879'}/#write`);
    assert.equal(await page.locator('nav a').count(), 4);
    await page.getByLabel('Working title').fill('My existing draft');
    await page.getByLabel('Your post', {exact: true}).fill('Keep my original words.');
    const fixtures = [
      ['https://www.linkedin.com/posts/example-leadership', 'Leadership reference', 'Leadership'],
      ['https://twitter.com/example/status/123?s=20', 'AI reference', 'AI'],
      ['https://www.tiktok.com/@example/video/123', 'Video reference', 'AI']
    ];
    for (const [url, title, topic] of fixtures) {
      await page.locator('.save-reference summary').click();
      await page.getByLabel('Post URL', {exact: true}).fill(url);
      await page.getByLabel('What is it about?').fill(title);
      await page.locator('#inspiration-form [name=topic]').fill(topic);
      await page.getByLabel('What caught your attention?').fill('An angle to explore in my own experience.');
      await page.getByRole('button', {name: 'Save reference', exact: true}).click();
    }
    assert.equal(await page.locator('.reference-card').count(), 3);
    assert.equal(await page.getByLabel('Your post', {exact: true}).inputValue(), 'Keep my original words.');
    await page.reload();
    assert.equal(await page.locator('.reference-card').count(), 3);
    await page.getByLabel('Filter by topic').selectOption('Leadership');
    assert.equal(await page.locator('.reference-card').count(), 1);
    await page.getByLabel('Filter by topic').selectOption('all');
    await page.locator('.save-reference summary').click();
    await page.getByLabel('Post URL', {exact: true}).fill('https://x.com/example/status/123');
    await page.getByLabel('What is it about?').fill('Duplicate');
    await page.getByRole('button', {name: 'Save reference', exact: true}).click();
    assert.match(await page.locator('#inspiration-error').textContent(), /already saved/);
    await page.getByLabel('Post URL', {exact: true}).fill('https://example.com/not-social');
    await page.getByRole('button', {name: 'Save reference', exact: true}).click();
    assert.match(await page.locator('#inspiration-error').textContent(), /Use a LinkedIn post/);
    await page.locator('.reference-card').first().getByRole('button', {name: 'Edit', exact: true}).click();
    await page.getByLabel('What is it about?').fill('Revised video reference');
    await page.getByRole('button', {name: 'Save changes', exact: true}).click();
    await page.locator('.reference-card').first().getByRole('button', {name: 'Develop my take ↗'}).click();
    assert.equal(await page.getByLabel('Your post', {exact: true}).inputValue(), '');
    assert.match(await page.locator('.reference-context').textContent(), /Revised video reference/);
    await page.getByLabel('Your post', {exact: true}).fill('This is my own perspective.');
    await page.reload();
    assert.match(await page.locator('.reference-context').textContent(), /Revised video reference/);
    for (const width of [1440, 820, 390]) {
      await page.setViewportSize({width, height: width === 390 ? 844 : 900});
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if (process.env.SCREENSHOT_DIR) {
        await fs.mkdir(process.env.SCREENSHOT_DIR, {recursive: true});
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({path: path.join(process.env.SCREENSHOT_DIR, `inspiration-${width}.png`), fullPage: true});
      }
    }
    await page.locator('.reference-card').first().getByRole('button', {name: 'Remove', exact: true}).click();
    assert.equal(await page.getByLabel('Your post', {exact: true}).inputValue(), 'This is my own perspective.');
    assert.match(await page.locator('.reference-context').textContent(), /since been removed/);
    const data = await page.evaluate(() => JSON.stringify(state));
    await page.locator('#backup-file').setInputFiles({name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(data)});
    await page.waitForFunction(() => document.querySelector('#toast').textContent === 'Backup restored.');
    assert.equal(await page.locator('.reference-card').count(), 2);
    assert.deepEqual(errors, []);
    console.log('PASS: three platforms, save/edit/filter/remove, duplicate and unsafe URLs, draft provenance, reload, restore, 1440/820/390 layouts.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
