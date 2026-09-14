import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const profile = await fs.mkdtemp('/tmp/german-preparacion-e2e-');
const launch = () => chromium.launchPersistentContext(profile, {
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  viewport: { width: 390, height: 844 },
});

async function enterAssessment(page) {
  await page.goto('http://127.0.0.1:3030', { waitUntil: 'networkidle' });
  if (await page.locator('input[type="email"], input[type="password"], .google-button').count()) throw new Error('Authentication UI is still present');
  await page.getByRole('button', { name: /^Empezar/ }).click();
  await page.locator('video').evaluate(async (video) => {
    if (video.readyState < 1) await new Promise((resolve) => video.addEventListener('loadedmetadata', resolve, { once: true }));
    video.muted = true;
    video.playbackRate = 16;
    if (video.paused) await video.play();
  });
  await page.getByRole('button', { name: /^Ingresar/ }).click();
  await page.getByText('Presentación en audio').waitFor();
  await page.locator('audio.presentation-audio').evaluate((audio) => audio.dispatchEvent(new Event('ended', { bubbles: true })));
  await page.getByRole('button', { name: /^Ingresar/ }).click();
  await page.locator('.question-card, .result-screen').waitFor();
}

async function answerCurrentQuestion(page) {
  await page.locator('.answer-confirm').first().click();
  await page.getByRole('button', { name: /^Continuar/ }).click();
}

let context = await launch();
let page = context.pages()[0] ?? await context.newPage();
await enterAssessment(page);
await page.getByLabel('Pregunta 1 de 24').waitFor();

for (let question = 1; question <= 3; question++) await answerCurrentQuestion(page);
await page.getByLabel('Pregunta 4 de 24').waitFor();

await page.reload({ waitUntil: 'networkidle' });
await enterAssessment(page);
await page.getByLabel('Pregunta 4 de 24').waitFor();

await context.close();
context = await launch();
page = context.pages()[0] ?? await context.newPage();
await enterAssessment(page);
await page.getByLabel('Pregunta 4 de 24').waitFor();

for (let question = 4; question <= 24; question++) await answerCurrentQuestion(page);
await page.getByText('HAY ALGO BASTANTE CLARO EN TUS RESPUESTAS').waitFor({ timeout: 5000 });

const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('german-preparacion:assessment:v2')));
if (!stored || Object.keys(stored.answers).length !== 24 || !stored.completedAt) throw new Error('Completed assessment was not persisted locally');

await page.reload({ waitUntil: 'networkidle' });
await enterAssessment(page);
await page.getByText('HAY ALGO BASTANTE CLARO EN TUS RESPUESTAS').waitFor();

const expectedMessages = [
  'Hola Germán, yo ya tengo la app. ¿Cómo empezamos?',
  'Hola Germán, terminé mi evaluación en Preparación y quiero ser parte del Asistente Germán.',
];
const links = page.locator('.future-actions a');
if (await links.count() !== 2) throw new Error('Expected two independent WhatsApp actions');
for (let index = 0; index < 2; index++) {
  const link = links.nth(index);
  const href = new URL(await link.getAttribute('href'));
  if (!await link.isVisible() || !await link.isEnabled()) throw new Error(`WhatsApp action ${index + 1} is not actionable`);
  if (href.hostname !== 'wa.me' || href.pathname !== '/5492236151152' || href.searchParams.get('text') !== expectedMessages[index]) throw new Error(`WhatsApp action ${index + 1} is incorrect`);
}

for (const viewport of [{ width: 390, height: 844 }, { width: 430, height: 932 }]) {
  await page.setViewportSize(viewport);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  if (overflow) throw new Error(`Horizontal overflow at ${viewport.width}px`);
  for (let index = 0; index < 2; index++) {
    const box = await links.nth(index).boundingBox();
    if (!box || box.x < 0 || box.x + box.width > viewport.width) throw new Error(`WhatsApp action ${index + 1} is outside the mobile viewport`);
  }
}

console.log(JSON.stringify({
  ok: true,
  noLogin: true,
  resumedQuestion: 4,
  persistedAfterBrowserRestart: true,
  completedAnswers: Object.keys(stored.answers).length,
  restoredResult: true,
  whatsappActions: 2,
}));
await context.close();
