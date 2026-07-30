import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const endpoint = 'http://127.0.0.1:9223';
const baseUrl = 'http://127.0.0.1:5173';
const outputDirectory = resolve('artifacts', 'phase4-qa');
await mkdir(outputDirectory, { recursive: true });

const targets = await fetch(`${endpoint}/json/list`).then((response) => response.json());
const target = targets.find((candidate) => candidate.type === 'page');
if (!target) throw new Error('No Chrome page target is available.');

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolveOpen, rejectOpen) => {
  socket.addEventListener('open', resolveOpen, { once: true });
  socket.addEventListener('error', rejectOpen, { once: true });
});

let sequence = 0;
const pending = new Map();
const consoleErrors = [];
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const handler = pending.get(message.id);
    if (!handler) return;
    pending.delete(message.id);
    if (message.error) handler.reject(new Error(message.error.message));
    else handler.resolve(message.result);
    return;
  }
  if (message.method === 'Runtime.exceptionThrown') {
    consoleErrors.push(message.params.exceptionDetails.text);
  }
  if (
    message.method === 'Runtime.consoleAPICalled'
    && ['error', 'warning'].includes(message.params.type)
  ) {
    consoleErrors.push(
      message.params.args.map((argument) => argument.value ?? argument.description ?? '').join(' '),
    );
  }
});

function command(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolveCommand, rejectCommand) => {
    pending.set(id, { resolve: resolveCommand, reject: rejectCommand });
  });
}

await command('Page.enable');
await command('Runtime.enable');
await command('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
  screenWidth: 390,
  screenHeight: 844,
});
await command('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await command('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
});

const routes = [
  ['landing', '/'],
  ['intro', '/intro'],
  ['question', '/q/1'],
  ['result', '/r/pcte'],
  ['gallery', '/gallery'],
  ['end', '/end'],
  ['not-found', '/missing'],
];
const results = [];

for (const [name, path] of routes) {
  await command('Page.navigate', { url: `${baseUrl}${path}` });
  await delay(name === 'landing' ? 2800 : 1750);
  if (name === 'question') {
    await evaluate(`document.querySelector('.answer-card')?.click()`);
    await delay(180);
  }
  if (name === 'gallery') {
    await evaluate(`document.querySelector('.gallery__type-link')?.click()`);
    await delay(480);
  }

  const state = await evaluate(`(() => {
    const root = document.documentElement;
    const scene = document.querySelector('.scene');
    const host = document.querySelector('.scene-host');
    const brokenImages = [...document.images]
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.getAttribute('src'));
    return {
      name: scene?.dataset.scene ?? null,
      presentation: root.dataset.presentation ?? null,
      viewport: [innerWidth, innerHeight],
      overflow: Math.max(
        document.body.scrollWidth,
        root.scrollWidth,
        host?.scrollWidth ?? 0
      ) - innerWidth,
      brokenImages,
      answerControlsVisible:
        document.querySelector('.scene-actions')?.hidden === false,
      gallerySheetOpen: document.querySelector('.gallery-sheet')?.hasAttribute('open') ?? false,
      title: document.title,
    };
  })()`);
  results.push({ route: path, ...state });

  const screenshot = await command('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  });
  await writeFile(
    resolve(outputDirectory, `${name}.png`),
    Buffer.from(screenshot.data, 'base64'),
  );
}

await evaluate(`sessionStorage.setItem('pb1.answers', JSON.stringify([
  {q:1,pole:'P'},{q:2,pole:'P'},{q:3,pole:'P'},
  {q:4,pole:'C'},{q:5,pole:'C'}
]))`);
await command('Page.navigate', { url: `${baseUrl}/q/6` });
await delay(1850);
await evaluate(`document.querySelector('.answer-card')?.click()`);
await delay(160);
await evaluate(`document.querySelector('.scene--question .scene-actions .button--primary')?.click()`);
await delay(900);
const interstitial = await evaluate(`(() => ({
  name: document.querySelector('.scene')?.dataset.scene ?? null,
  temperature: document.querySelector('.interstitial__temperature')?.textContent ?? null,
  overflow: document.documentElement.scrollWidth - innerWidth
}))()`);
const interstitialShot = await command('Page.captureScreenshot', {
  format: 'png',
  fromSurface: true,
  captureBeyondViewport: false,
});
await writeFile(
  resolve(outputDirectory, 'interstitial.png'),
  Buffer.from(interstitialShot.data, 'base64'),
);

await evaluate(`sessionStorage.setItem('pb1.answers', JSON.stringify([
  {q:1,pole:'P'},{q:2,pole:'P'},{q:3,pole:'P'},
  {q:4,pole:'C'},{q:5,pole:'C'},{q:6,pole:'C'},
  {q:7,pole:'T'},{q:8,pole:'T'},{q:9,pole:'T'},
  {q:10,pole:'E'},{q:11,pole:'E'},{q:12,pole:'E'}
]))`);
await command('Page.navigate', { url: `${baseUrl}/baking` });
await delay(1900);
const calculatingEarly = await evaluate(`(() => ({
  name: document.querySelector('.scene')?.dataset.scene ?? null,
  temperature: document.querySelector('.calculating__temperature')?.textContent ?? null,
  visibleLines: [...document.querySelectorAll('.loading-lines > li')]
    .filter((line) => Number.parseFloat(getComputedStyle(line).opacity) > 0.1).length,
  continueHidden: document.querySelector('.calculating__continue')?.hidden ?? null
}))()`);
await delay(5500);
const calculatingSkippable = await evaluate(`(() => ({
  temperature: document.querySelector('.calculating__temperature')?.textContent ?? null,
  continueHidden: document.querySelector('.calculating__continue')?.hidden ?? null,
  brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).length
}))()`);
const calculatingShot = await command('Page.captureScreenshot', {
  format: 'png',
  fromSurface: true,
  captureBeyondViewport: false,
});
await writeFile(
  resolve(outputDirectory, 'calculating.png'),
  Buffer.from(calculatingShot.data, 'base64'),
);

await command('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
});
await command('Page.navigate', { url: `${baseUrl}/r/pcte` });
await delay(900);
const reducedMotion = await evaluate(`(() => ({
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  confetti: document.querySelectorAll('.confetti-piece').length,
  illustrationTransform: getComputedStyle(document.querySelector('.result__illustration')).transform,
  brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).length
}))()`);

console.log(JSON.stringify({
  results,
  interstitial,
  calculatingEarly,
  calculatingSkippable,
  reducedMotion,
  consoleErrors,
}, null, 2));
socket.close();

async function evaluate(expression) {
  const response = await command('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.text);
  }
  return response.result.value;
}

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}
