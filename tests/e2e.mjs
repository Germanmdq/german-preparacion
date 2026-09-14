import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
await fs.mkdir('.impeccable/review', { recursive: true });

async function enterAssessment(page) {
  await page.goto('http://127.0.0.1:3030', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Entrar' }).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByRole('heading', { name: /Antes de empezar/ }).waitFor();
  await page.getByRole('button', { name: /Empezar/ }).click();
  await page.locator('.question-card').waitFor();
  await page.waitForTimeout(450);
}

for (const width of [375, 390, 414]) {
  const page = await browser.newPage({ viewport: { width, height: 844 } });
  await enterAssessment(page);
  await page.screenshot({ path: `.impeccable/review/mobile-${width}.png`, fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  if (overflow) throw new Error(`Horizontal overflow at ${width}px`);
  await page.close();
}

const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await enterAssessment(page);
await page.screenshot({ path: '.impeccable/review/desktop.png', fullPage: true });
if (await page.getByRole('button', { name: /Continuar/ }).isEnabled()) throw new Error('Continue enabled without selection');
await page.locator('.radio-select').nth(0).click();
await page.getByRole('button', { name: /Continuar/ }).click();
await page.getByRole('button', { name: /Volver/ }).click();
await page.locator('.radio-select').nth(1).click();
await page.getByRole('button', { name: /Continuar/ }).click();
for (let i = 1; i < 24; i++) {
  const options = page.locator('.radio-select');
  await options.nth(0).click();
  await page.getByRole('button', { name: /Continuar/ }).click();
}
await page.getByText('HAY ALGO BASTANTE CLARO EN TUS RESPUESTAS').waitFor({ timeout: 5000 });
const stored = await page.evaluate(() => {
  const key = Object.keys(localStorage).find((candidate) => candidate.startsWith('german-preparacion:assessment:v1:'));
  return key ? JSON.parse(localStorage.getItem(key)) : null;
});
if (Object.keys(stored.answers).length !== 24 || !stored.completedAt) throw new Error('Incomplete persisted assessment');
await page.reload({ waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'Entrar' }).waitFor({ timeout: 15000 });
await page.getByRole('button', { name: 'Entrar' }).click();
await page.getByRole('button', { name: /Empezar/ }).click();
await page.getByText('HAY ALGO BASTANTE CLARO EN TUS RESPUESTAS').waitFor();
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: '.impeccable/review/result-mobile-390.png', fullPage: true });
console.log(JSON.stringify({ ok: true, sessionId: stored.sessionId, answers: Object.keys(stored.answers).length, primaryPattern: stored.primaryPattern }));
await browser.close();
