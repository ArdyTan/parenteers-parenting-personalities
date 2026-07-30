import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const endpoint = 'http://127.0.0.1:9223';
const baseUrl = 'http://127.0.0.1:5173';
const outputDirectory = resolve('artifacts', 'phase45-qa');
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
const runtimeErrors = [];
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
    runtimeErrors.push(message.params.exceptionDetails.text);
  }
  if (
    message.method === 'Runtime.consoleAPICalled'
    && message.params.type === 'error'
  ) {
    runtimeErrors.push(
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

await command('Page.navigate', { url: `${baseUrl}/` });
await delay(1850);

const questions = [];
for (const language of ['id', 'en']) {
  await evaluate(`localStorage.setItem('pb1.lang', ${JSON.stringify(language)})`);
  for (let question = 1; question <= 12; question += 1) {
    const answers = Array.from({ length: question - 1 }, (_, index) => ({
      q: index + 1,
      pole: poleForQuestion(index + 1),
    }));
    await evaluate(
      `sessionStorage.setItem('pb1.answers', ${JSON.stringify(JSON.stringify(answers))})`,
    );
    await command('Page.navigate', { url: `${baseUrl}/q/${question}` });
    await delay(1850);
    const state = await evaluate(`(() => {
      const art = document.querySelector('.question__art');
      const cards = [...document.querySelectorAll('.answer-card')];
      return {
        language: document.documentElement.lang,
        route: location.pathname,
        scene: document.querySelector('.scene')?.dataset.scene ?? null,
        art: art?.getAttribute('src') ?? null,
        artWidth: art?.naturalWidth ?? 0,
        progressStops: document.querySelectorAll('.quiz-progress__stop').length,
        overflow: document.documentElement.scrollWidth - innerWidth,
        brokenImages: [...document.images]
          .filter((image) => image.complete && image.naturalWidth === 0)
          .map((image) => image.getAttribute('src')),
        cardCopyWidths: cards.map((card) => card.querySelector('.answer-card__copy')?.getBoundingClientRect().width ?? 0),
      };
    })()`);
    questions.push(state);
  }
}

await evaluate(`localStorage.setItem('pb1.lang', 'id')`);
await evaluate(`sessionStorage.setItem('pb1.answers', JSON.stringify([
  {q:1,pole:'P'},{q:2,pole:'P'},{q:3,pole:'P'},
  {q:4,pole:'C'},{q:5,pole:'C'},{q:6,pole:'C'},
  {q:7,pole:'T'},{q:8,pole:'T'}
]))`);
await command('Page.navigate', { url: `${baseUrl}/q/9` });
await delay(1850);
await evaluate(`document.querySelector('.answer-card')?.click()`);
await delay(520);
const selectedAnswer = await evaluate(`(() => {
  const selected = document.querySelector('.answer-card.is-selected');
  const copy = selected?.querySelector('.answer-card__copy');
  return {
    cardWidth: selected?.getBoundingClientRect().width ?? 0,
    copyWidth: copy?.getBoundingClientRect().width ?? 0,
    overflow: selected ? selected.scrollWidth - selected.clientWidth : null,
  };
})()`);
await evaluate(`document.querySelector('.scene--question .scene-actions .button--primary')?.click()`);
await delay(900);
const checkpoint = await evaluate(`(() => ({
  scene: document.querySelector('.scene')?.dataset.scene ?? null,
  art: document.querySelector('.interstitial__art')?.getAttribute('src') ?? null,
  artWidth: document.querySelector('.interstitial__art')?.naturalWidth ?? 0,
  overflow: document.documentElement.scrollWidth - innerWidth,
  brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).length,
}))()`);
await capture('checkpoint-q9');

await command('Page.navigate', { url: `${baseUrl}/` });
await delay(1850);
const landing = await surfaceState('.landing__art-image');
await capture('landing');

await command('Page.navigate', { url: `${baseUrl}/r/pgdn` });
await delay(1850);
const result = await evaluate(`(() => {
  const name = document.querySelector('.result__name');
  const art = document.querySelector('.result__illustration');
  return {
    scene: document.querySelector('.scene')?.dataset.scene ?? null,
    artWidth: art?.naturalWidth ?? 0,
    nameOverflow: name ? name.scrollWidth - name.clientWidth : null,
    pageOverflow: document.documentElement.scrollWidth - innerWidth,
    brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).length,
  };
})()`);
await capture('result-pgdn');

const uniqueQuestionArt = new Set(questions.map(({ art }) => art));
const failures = [];
if (questions.length !== 24) failures.push(`expected 24 language/question checks; got ${questions.length}`);
if (uniqueQuestionArt.size !== 12) failures.push(`expected 12 unique question illustrations; got ${uniqueQuestionArt.size}`);
for (const row of questions) {
  if (row.scene !== 'question') failures.push(`${row.language} ${row.route}: wrong scene`);
  if (row.artWidth <= 0 || row.brokenImages.length > 0) failures.push(`${row.language} ${row.route}: broken art`);
  if (row.progressStops !== 12) failures.push(`${row.language} ${row.route}: progress rail drift`);
  if (row.overflow > 0) failures.push(`${row.language} ${row.route}: ${row.overflow}px page overflow`);
  if (row.cardCopyWidths.some((width) => width < 180)) {
    failures.push(`${row.language} ${row.route}: answer copy column too narrow`);
  }
}
if (selectedAnswer.copyWidth < 180 || selectedAnswer.overflow > 0) {
  failures.push('selected answer layout collapsed or overflowed');
}
if (checkpoint.scene !== 'interstitial' || checkpoint.artWidth <= 0 || checkpoint.overflow > 0) {
  failures.push('Q9 checkpoint failed');
}
if (landing.artWidth <= 0 || landing.overflow > 0 || landing.brokenImages > 0) {
  failures.push('landing surface failed');
}
if (result.artWidth <= 0 || result.nameOverflow > 0 || result.pageOverflow > 0 || result.brokenImages > 0) {
  failures.push('result hero failed');
}
if (runtimeErrors.length > 0) failures.push(`runtime errors: ${runtimeErrors.join(' | ')}`);

console.log(JSON.stringify({
  checkedQuestions: questions.length,
  uniqueQuestionArt: uniqueQuestionArt.size,
  selectedAnswer,
  checkpoint,
  landing,
  result,
  runtimeErrors,
  failures,
}, null, 2));

socket.close();
if (failures.length > 0) process.exitCode = 1;

async function surfaceState(selector) {
  return evaluate(`(() => {
    const art = document.querySelector(${JSON.stringify(selector)});
    return {
      artWidth: art?.naturalWidth ?? 0,
      overflow: document.documentElement.scrollWidth - innerWidth,
      brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).length,
    };
  })()`);
}

async function capture(name) {
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

async function evaluate(expression) {
  const response = await command('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  return response.result.value;
}

function poleForQuestion(question) {
  if (question <= 3) return 'P';
  if (question <= 6) return 'C';
  if (question <= 9) return 'T';
  return 'E';
}

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}
