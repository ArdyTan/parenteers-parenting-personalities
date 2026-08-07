/**
 * Isolates whether the persistent WebGL world canvas contributes any visible
 * pixels, per route. Runs under `prefers-reduced-motion: reduce` so every scene
 * is static and the only variable between the two captures is the canvas itself.
 */
import sharp from 'sharp';

const endpoint = 'http://127.0.0.1:9223';
const base = 'http://127.0.0.1:5173';

const targets = await fetch(`${endpoint}/json/list`).then((r) => r.json());
const ws = new WebSocket(targets.find((c) => c.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0;
const pend = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { const h = pend.get(m.id); pend.delete(m.id); m.error ? h.reject(new Error(m.error.message)) : h.resolve(m.result); }
});
const cmd = (method, params = {}) => { const i = ++id; ws.send(JSON.stringify({ id: i, method, params })); return new Promise((res, rej) => pend.set(i, { resolve: res, reject: rej })); };
const ev = async (x) => {
  const r = await cmd('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
  return r.result.value;
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

await cmd('Page.enable');
await cmd('Runtime.enable');
await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true, screenWidth: 390, screenHeight: 844 });
await cmd('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });

const answers = JSON.stringify(
  Array.from({ length: 12 }, (_, i) => ({ q: i + 1, pole: i < 3 ? 'P' : i < 6 ? 'G' : i < 9 ? 'D' : 'E' })),
);

const shot = async () => Buffer.from((await cmd('Page.captureScreenshot', { format: 'png' })).data, 'base64');

async function diff(a, b) {
  if (a.equals(b)) return { identical: true, changedPixels: 0, changedPercent: 0, maxDelta: 0 };
  const [x, y] = await Promise.all([
    sharp(a).raw().toBuffer({ resolveWithObject: true }),
    sharp(b).raw().toBuffer({ resolveWithObject: true }),
  ]);
  let changed = 0;
  let maxDelta = 0;
  for (let i = 0; i < x.data.length; i += x.info.channels) {
    const d = Math.max(
      Math.abs(x.data[i] - y.data[i]),
      Math.abs(x.data[i + 1] - y.data[i + 1]),
      Math.abs(x.data[i + 2] - y.data[i + 2]),
    );
    if (d > 2) changed += 1;
    if (d > maxDelta) maxDelta = d;
  }
  const total = x.info.width * x.info.height;
  return {
    identical: false,
    changedPixels: changed,
    changedPercent: Math.round((changed / total) * 10000) / 100,
    maxDelta,
  };
}

const rows = [];
for (const [name, path] of [
  ['landing', '/'], ['intro', '/intro'], ['question', '/q/1'], ['baking', '/baking'],
  ['result', '/r/pgde'], ['gallery', '/gallery'], ['story', '/story'], ['404', '/nope'],
]) {
  await cmd('Page.navigate', { url: `${base}${path}` });
  const deadline = Date.now() + 20000;
  for (;;) {
    await wait(250);
    const ready = await ev(`(() => { const s = document.querySelector('.scene'); return !!s && s.children.length > 0 && !document.querySelector('.experience-preloader'); })()`).catch(() => false);
    if (ready) break;
    if (Date.now() > deadline) break;
  }
  await ev(`sessionStorage.setItem('pb1.answers', JSON.stringify(${answers}))`).catch(() => {});
  // Generous settle: the world canvas fades in and lazy art finishes decoding
  // well after the scene mounts, and either will masquerade as a canvas diff.
  await wait(3000);

  const before = await shot();
  await wait(700);
  // Control: two captures with nothing changed, to prove the scene is static.
  const control = await diff(before, await shot());

  await ev(`document.querySelector('[data-world-canvas]')?.style.setProperty('display', 'none')`);
  await wait(700);
  const hidden = await shot();
  await ev(`document.querySelector('[data-world-canvas]')?.style.removeProperty('display')`);

  const canvas = await diff(before, hidden);
  const info = await ev(`(() => {
    const c = document.querySelector('[data-world-canvas]');
    if (!c) return null;
    const cs = getComputedStyle(c);
    return { w: c.width, h: c.height, opacity: cs.opacity, zIndex: cs.zIndex, webgl: document.querySelector('.app-runtime')?.dataset.webgl };
  })()`);
  rows.push({ route: name, path, control, canvas, info });
}

console.log(JSON.stringify(rows, null, 2));
ws.close();
