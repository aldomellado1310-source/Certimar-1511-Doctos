import { chromium } from 'playwright-core';

const BASE = process.env.SMOKE_URL || 'http://localhost:3002';
const execPath = process.env.PW_CHROME;

const browser = await chromium.launch({ headless: true, executablePath: execPath });
const ctx = await browser.newContext({ acceptDownloads: true });
const page = await ctx.newPage();

const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
  if (m.text().includes('[acta-debug]')) console.log('DBG>', m.text());
});
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

// Seed admin session before app boots
await page.addInitScript(() => {
  localStorage.setItem('certimar-session', JSON.stringify({
    role: 'admin', email: 'smoke@test.cl', expiry: Date.now() + 8 * 3600 * 1000,
  }));
  localStorage.setItem('certimar-changelog-seen', '2026-06-03-v14');
});

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);

// Dismiss any changelog / welcome modal
for (const label of ['^No volver a mostrar novedades$', '^Comenzar Registro$']) {
  const b = page.getByRole('button', { name: new RegExp(label, 'i') });
  if (await b.count()) { await b.first().click().catch(() => {}); await page.waitForTimeout(800); }
}

// Navigate to the Certificado tab where the document generation buttons live
const certTab = page.getByRole('button', { name: /^Certificado$/i });
if (await certTab.count()) { await certTab.first().click().catch(() => {}); await page.waitForTimeout(1500); }

await page.waitForTimeout(1000);
await page.screenshot({ path: 'C:/tmp/acta-informe-tab.png', fullPage: true });

let actaBtn = page.getByRole('button', { name: /Descargar Acta de Inspección|Generando PDF/i });
let found = await actaBtn.count();
console.log('acta button count after nav:', found);

if (!found) {
  // Scroll to bottom in case it's below the fold, then re-list ALL buttons
  await page.mouse.wheel(0, 6000);
  await page.waitForTimeout(800);
  actaBtn = page.getByRole('button', { name: /Descargar Acta de Inspección|Generando PDF/i });
  found = await actaBtn.count();
  console.log('acta button count after scroll:', found);
  const texts = await page.$$eval('button', (bs) => bs.map((b) => b.textContent?.trim()).filter(Boolean));
  console.log('ALL BUTTONS:', JSON.stringify(texts, null, 1));
}

if (found) {
  const downloadPromise = page.waitForEvent('download', { timeout: 30000 }).catch(() => null);
  await actaBtn.first().click();
  console.log('clicked acta button, waiting for PDF generation...');
  const dl = await downloadPromise;
  await page.waitForTimeout(2000);
  // Save the raw acta HTML and render it with Playwright's OWN engine (independent of
  // html2canvas) to see the true full-page layout.
  const actaHtml = await page.evaluate(() => window.__actaHtml || null);
  if (actaHtml) {
    const { writeFileSync } = await import('node:fs');
    writeFileSync('C:/tmp/acta-raw.html', actaHtml);
    const p2 = await ctx.newPage();
    await p2.setViewportSize({ width: 816, height: 1400 });
    await p2.setContent(actaHtml, { waitUntil: 'load' });
    await p2.waitForTimeout(600);
    const dims = await p2.evaluate(() => ({ w: document.body.scrollWidth, h: document.body.scrollHeight }));
    console.log('PW-RENDER dims:', JSON.stringify(dims));
    await p2.screenshot({ path: 'C:/tmp/acta-pw-render.png', fullPage: true });
    console.log('PW screenshot saved');
    await p2.close();
  }

  // Save the raw html2canvas image to inspect the capture directly
  const dataUrl = await page.evaluate(() => window.__actaCanvasDataUrl || null);
  const place = await page.evaluate(() => window.__actaPlace || null);
  console.log('PLACE>', JSON.stringify(place));
  if (dataUrl) {
    const { writeFileSync } = await import('node:fs');
    const b64 = dataUrl.split(',')[1];
    writeFileSync('C:/tmp/acta-canvas.jpg', Buffer.from(b64, 'base64'));
    console.log('CANVAS saved to C:/tmp/acta-canvas.jpg');
  }
  if (dl) {
    const savePath = 'C:/tmp/acta-smoke-output.pdf';
    await dl.saveAs(savePath);
    const { statSync, readFileSync } = await import('node:fs');
    const size = statSync(savePath).size;
    const head = readFileSync(savePath).subarray(0, 5).toString('latin1');
    console.log('DOWNLOAD OK:', dl.suggestedFilename(), '| bytes:', size, '| header:', JSON.stringify(head));
  } else {
    console.log('NO DOWNLOAD EVENT (check errors)');
  }
}

console.log('--- CONSOLE ERRORS (' + errors.length + ') ---');
const oklch = errors.filter((e) => /oklch/i.test(e));
const timeout = errors.filter((e) => /timeout/i.test(e));
console.log('oklch errors:', oklch.length);
console.log('timeout errors:', timeout.length);
errors.slice(0, 15).forEach((e) => console.log('  •', e.slice(0, 160)));

await browser.close();
console.log('DONE');
