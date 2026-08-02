/**
 * Renders a mask of exactly which pixels the WebGL world canvas contributes on a
 * given route, so its visual value can be judged rather than assumed.
 * Usage: node ./scripts/perf-canvas-map.mjs /intro intro
 */
import sharp from 'sharp';

const endpoint = 'http://127.0.0.1:9223';
const base = 'http://127.0.0.1:5173';
const path = process.argv[2] ?? '/intro';
const name = process.argv[3] ?? 'route';

const targets = await fetch(`${endpoint}/json/list`).then((r) => r.json());
const ws = new WebSocket(targets.find((c) => c.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0;
const pend = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { const h = pend.get(m.id); pend.delete(m.id); m.error ? h.reject(new Error(m.error.message)) : h.resolve(m.result); }
});
const cmd = (m, p = {}) => { const i = ++id; ws.send(JSON.stringify({ id: i, method: m, params: p })); return new Promise((res, rej) => pend.set(i, { resolve: res, reject: rej })); };
const ev = async (x) => { const r = await cmd('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description); return r.result.value; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

await cmd('Page.enable');
await cmd('Runtime.enable');
await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true, screenWidth: 390, screenHeight: 844 });
await cmd('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await cmd('Page.navigate', { url: `${base}${path}` });
for (let i = 0; i < 80; i += 1) {
  await wait(250);
  if (await ev(`(() => { const s = document.querySelector('.scene'); return !!s && s.children.length > 0 && !document.querySelector('.experience-preloader'); })()`).catch(() => false)) break;
}
await wait(3000);

const shot = async () => Buffer.from((await cmd('Page.captureScreenshot', { format: 'png' })).data, 'base64');
const withCanvas = await shot();
await ev(`document.querySelector('[data-world-canvas]').style.display = 'none'`);
await wait(800);
const without = await shot();

const A = await sharp(withCanvas).raw().toBuffer({ resolveWithObject: true });
const B = await sharp(without).raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = A.info;

const overlay = Buffer.alloc(width * height * 4, 0);
let minX = width; let maxX = 0; let minY = height; let maxY = 0; let hits = 0;
for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    const i = (y * width + x) * channels;
    const d = Math.max(
      Math.abs(A.data[i] - B.data[i]),
      Math.abs(A.data[i + 1] - B.data[i + 1]),
      Math.abs(A.data[i + 2] - B.data[i + 2]),
    );
    if (d <= 2) continue;
    hits += 1;
    const j = (y * width + x) * 4;
    overlay[j] = 232; overlay[j + 1] = 17; overlay[j + 2] = 17; overlay[j + 3] = 210;
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
}

const out = `artifacts/phase55-spot/canvas-map-${name}.png`;
await sharp(withCanvas)
  .composite([{ input: overlay, raw: { width, height, channels: 4 }, top: 0, left: 0 }])
  .png()
  .toFile(out);

const el = await ev(`(() => {
  const boxes = {};
  for (const sel of ['.scene', '.scene__body', '.app-header', '.intro__art-band', '.question__art-band', '.gallery__grid']) {
    const e = document.querySelector(sel);
    if (e) { const b = e.getBoundingClientRect(); boxes[sel] = [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; }
  }
  return { boxes, sceneH: document.querySelector('.scene')?.getBoundingClientRect().height, docH: document.documentElement.scrollHeight, innerH: innerHeight };
})()`);

console.log(JSON.stringify({
  route: path,
  hitPixels: hits,
  bboxCss: hits ? { x: Math.round(minX / 2), y: Math.round(minY / 2), w: Math.round((maxX - minX) / 2), h: Math.round((maxY - minY) / 2) } : null,
  layout: el,
  wrote: out,
}, null, 2));
ws.close();
