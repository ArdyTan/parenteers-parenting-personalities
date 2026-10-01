/** Local CDP interaction gate for the one-action question flow. Requires Vite
 * on 127.0.0.1:5173 and Chrome remote debugging on 127.0.0.1:9223. */
const base = 'http://127.0.0.1:5173';
const targets = await fetch('http://127.0.0.1:9223/json/list').then((response) => response.json());
const target = targets.find((entry) => entry.type === 'page');
if (!target) throw new Error('Chrome has no page target');

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
let sequence = 0;
const pending = new Map();
const errors = [];
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const action = pending.get(message.id);
    if (!action) return;
    pending.delete(message.id);
    if (message.error) action.reject(new Error(message.error.message));
    else action.resolve(message.result);
  } else if (message.method === 'Runtime.exceptionThrown') {
    errors.push(message.params.exceptionDetails.text);
  }
});

function command(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
async function evaluate(expression) {
  const { result, exceptionDetails } = await command('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) throw new Error(exceptionDetails.text ?? 'Evaluation failed');
  return result.value;
}
async function waitUntil(expression, label, timeoutMs = 12_000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (await evaluate(expression).catch(() => false)) return;
    if (Date.now() > deadline) {
      const state = await evaluate(`(() => { const b = document.querySelector('.answer-card[data-side="left"]'); const r = b?.getBoundingClientRect(); const x = r ? r.x + r.width / 2 : 0; const y = r ? r.y + r.height / 2 : 0; return { path: location.pathname, scene: document.querySelector('.scene')?.dataset.scene, answers: sessionStorage.getItem('pb1.answers'), viewport: [innerWidth, innerHeight], button: r && [r.x, r.y, r.width, r.height], hit: document.elementFromPoint(x, y)?.className }; })()`).catch(() => null);
      throw new Error(`Timed out waiting for ${label}: ${JSON.stringify(state)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
}
async function tap(x, y) {
  await command('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
  await command('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
async function drag(x, y, dx, dy) {
  await command('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
  for (let step = 1; step <= 6; step += 1) {
    await command('Input.dispatchTouchEvent', {
      type: 'touchMove', touchPoints: [{ x: x + dx * step / 6, y: y + dy * step / 6, id: 1 }],
    });
  }
  await command('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
async function center(selector) {
  const point = await evaluate(`(() => {
    const node = document.querySelector(${JSON.stringify(selector)});
    if (!node) return null;
    const box = node.getBoundingClientRect();
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  })()`);
  if (!point) throw new Error(`Missing ${selector}`);
  return point;
}
async function waitQuestion(q) {
  await waitUntil(
    `location.pathname === '/q/${q}' && Number(document.querySelector('.quiz-progress__bar')?.value) === ${q}`,
    `Q${q}`,
  );
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

await command('Page.enable');
await command('Runtime.enable');
await command('Emulation.setDeviceMetricsOverride', {
  width: 390, height: 844, deviceScaleFactor: 2, mobile: true,
  screenWidth: 390, screenHeight: 844,
});
await command('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
const report = [];

for (const lang of ['id', 'en']) {
  await evaluate(`sessionStorage.setItem('pb1.answers', '[]'); localStorage.setItem('pb1.lang', '${lang}'); localStorage.setItem('pb1.sound', 'off')`);
  await command('Page.navigate', { url: `${base}/q/1` });
  await waitQuestion(1);
  for (let q = 1; q <= 12; q += 1) {
    await waitQuestion(q);
    const side = q % 2 === 0 ? 'right' : 'left';
    const mode = q % 3 === 0 ? 'keyboard' : 'tap';
    const displayed = await evaluate(`(() => ({
      pole: document.querySelector('.answer-card[data-side="${side}"]')?.dataset.pole,
      title: document.querySelector('.question__title')?.textContent,
      answer: document.querySelector('.answer-card[data-side="${side}"] .answer-card__copy')?.textContent,
      lang: document.documentElement.lang,
    }))()`);
    assert(displayed.pole && displayed.title && displayed.answer, `${lang} Q${q}: visible answer missing`);
    assert(displayed.lang === lang, `${lang} Q${q}: wrong language ${displayed.lang}`);

    if (q === 1) {
      const point = await center('.question__art-band');
      await drag(point.x, point.y, 130, 0);
      assert((await evaluate(`JSON.parse(sessionStorage.getItem('pb1.answers') ?? '[]').length`)) === 0,
        `${lang} Q1: art swipe saved an answer`);
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (q === 2) {
      const point = await center('.question__art-band');
      await drag(point.x, point.y, 20, 110);
      assert((await evaluate(`JSON.parse(sessionStorage.getItem('pb1.answers') ?? '[]').length`)) === 1,
        `${lang} Q2: vertical drag saved an answer`);
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    if (mode === 'keyboard') {
      // Wait for the scene's programmed h1 focus after its short entrance.
      await new Promise((resolve) => setTimeout(resolve, 120));
      await evaluate(`document.querySelector('.answer-card[data-side="${side}"]').focus()`);
      await command('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
      await command('Input.dispatchKeyEvent', { type: 'char', key: 'Enter', code: 'Enter', text: '\r', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
      await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
    } else {
      const point = await center(`.answer-card[data-side="${side}"]`);
      await tap(point.x, point.y);
    }

    const nextPath = q === 12 ? '/baking' : `/q/${q + 1}`;
    await waitUntil(`location.pathname === '${nextPath}' && !!document.querySelector('.scene[data-scene]')`, `${lang} after Q${q}`);
    const saved = await evaluate(`JSON.parse(sessionStorage.getItem('pb1.answers') ?? '[]')`);
    assert(saved.length === q, `${lang} Q${q}: expected ${q} answers, got ${saved.length}`);
    assert(saved[q - 1]?.q === q && saved[q - 1]?.pole === displayed.pole,
      `${lang} Q${q}: stored pole differs from displayed ${side} answer`);
    report.push({ lang, q, side, mode, pole: displayed.pole });
  }

  assert(!(await evaluate(`!!document.querySelector('.baking__edit')`)),
    `${lang}: Baking still shows an edit button`);

  // Baking advances on a timer. If it is still visible, exercise the tap skip.
  if (await evaluate(`location.pathname === '/baking' && !!document.querySelector('.baking__title')`)) {
    const bakePoint = await center('.baking__title');
    await tap(bakePoint.x, bakePoint.y);
  }
  await waitUntil(`location.pathname.startsWith('/r/') && !!document.querySelector('.scene--result')`, `${lang} result`);
  report.push({ lang, result: await evaluate('location.pathname') });
}

socket.close();
assert(errors.length === 0, `Runtime errors: ${errors.join('; ')}`);
console.log(JSON.stringify({ actions: report, runtimeErrors: errors, passed: true }, null, 2));
