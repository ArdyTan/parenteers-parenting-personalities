/**
 * Memory + frame-budget probe. Walks every route at 390x844, reports JS heap,
 * decoded-image footprint, DOM/listener counts and WebGL buffer size, then
 * measures sustained FPS on the heaviest screens under CPU throttling, then
 * checks for a heap leak across a full quiz run.
 */
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
await cmd('Performance.enable');
await cmd('HeapProfiler.enable');
await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true, screenWidth: 390, screenHeight: 844 });
await cmd('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });

const MB = (bytes) => Math.round((bytes / 1024 / 1024) * 100) / 100;

async function metrics() {
  const { metrics: list } = await cmd('Performance.getMetrics');
  const get = (name) => list.find((m) => m.name === name)?.value ?? 0;
  return {
    jsHeapMB: MB(get('JSHeapUsedSize')),
    jsHeapTotalMB: MB(get('JSHeapTotalSize')),
    nodes: get('Nodes'),
    listeners: get('JSEventListeners'),
    layouts: get('LayoutCount'),
    styleRecalcs: get('RecalcStyleCount'),
  };
}

async function go(path, settle = 1200) {
  await cmd('Page.navigate', { url: `${base}${path}` });
  const deadline = Date.now() + 20000;
  for (;;) {
    await wait(250);
    const ready = await ev(
      `(() => { const s = document.querySelector('.scene'); return !!s && s.children.length > 0 && !document.querySelector('.experience-preloader'); })()`,
    ).catch(() => false);
    if (ready) break;
    if (Date.now() > deadline) throw new Error(`${path} never mounted`);
  }
  await wait(settle);
}

/** Decoded pixel memory is the real cost on a low-RAM phone, not the wire size. */
const IMAGE_FOOTPRINT = `(() => {
  const live = [...document.images].filter((i) => i.naturalWidth > 0);
  const unique = new Map();
  for (const i of live) unique.set(i.currentSrc || i.src, i.naturalWidth * i.naturalHeight * 4);
  const decodedBytes = [...unique.values()].reduce((a, b) => a + b, 0);
  const res = performance.getEntriesByType('resource');
  const transferred = res.reduce((a, r) => a + (r.encodedBodySize || 0), 0);
  const canvases = [...document.querySelectorAll('canvas')].map((c) => ({
    w: c.width, h: c.height, bytes: c.width * c.height * 4,
  }));
  return {
    imgElements: document.images.length,
    uniqueImages: unique.size,
    decodedBytes,
    transferredBytes: transferred,
    requests: res.length,
    canvases,
    dpr: devicePixelRatio,
    tier: (() => { try { return JSON.parse(localStorage.getItem('pb1.tier') ?? 'null'); } catch { return null; } })(),
    webgl: (() => {
      const c = document.querySelector('[data-world-canvas]');
      if (!c) return null;
      const gl = c.getContext('webgl2') || c.getContext('webgl');
      if (!gl) return { present: true, context: false };
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        present: true,
        bufferW: gl.drawingBufferWidth,
        bufferH: gl.drawingBufferHeight,
        bufferBytes: gl.drawingBufferWidth * gl.drawingBufferHeight * 4,
        renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : null,
      };
    })(),
  };
})()`;

/** Sustained FPS over a real sampling window, so throttling actually shows up. */
const SAMPLE_FPS = (ms) => `new Promise((res) => {
  let frames = 0; const t0 = performance.now(); let worst = 0; let last = t0;
  const loop = (t) => {
    const dt = t - last; last = t;
    if (frames > 0) worst = Math.max(worst, dt);
    frames++;
    if (t - t0 < ${ms}) requestAnimationFrame(loop);
    else res({ fps: Math.round((frames * 1000) / (t - t0) * 10) / 10, worstFrameMs: Math.round(worst) });
  };
  requestAnimationFrame(loop);
})`;

/**
 * Does the WebGL canvas contribute any pixels? Capture the route, hide the
 * canvas, capture again, and diff. Identical output means it is rendering every
 * frame behind an opaque surface.
 */
async function canvasContribution() {
  const shot = async () => {
    const { data } = await cmd('Page.captureScreenshot', { format: 'png' });
    return Buffer.from(data, 'base64');
  };
  const withCanvas = await shot();
  await ev(`(() => { const c = document.querySelector('[data-world-canvas]'); if (!c) return; c.dataset.perfHidden = '1'; c.style.display = 'none'; })()`);
  await wait(500);
  const withoutCanvas = await shot();
  await ev(`(() => { const c = document.querySelector('[data-world-canvas]'); if (!c) return; c.style.display = ''; delete c.dataset.perfHidden; })()`);
  await wait(300);
  if (withCanvas.equals(withoutCanvas)) return { identicalPng: true, changedPixels: 0, maxDelta: 0 };
  const sharp = (await import('sharp')).default;
  const [a, b] = await Promise.all([
    sharp(withCanvas).raw().toBuffer({ resolveWithObject: true }),
    sharp(withoutCanvas).raw().toBuffer({ resolveWithObject: true }),
  ]);
  let changed = 0;
  let maxDelta = 0;
  for (let i = 0; i < a.data.length; i += a.info.channels) {
    const d = Math.max(
      Math.abs(a.data[i] - b.data[i]),
      Math.abs(a.data[i + 1] - b.data[i + 1]),
      Math.abs(a.data[i + 2] - b.data[i + 2]),
    );
    if (d > 2) changed += 1;
    if (d > maxDelta) maxDelta = d;
  }
  const total = a.info.width * a.info.height;
  return {
    identicalPng: false,
    changedPixels: changed,
    changedPercent: Math.round((changed / total) * 10000) / 100,
    maxDelta,
  };
}

const report = { routes: {}, throttled: {}, leak: null };

for (const [name, path] of [
  ['landing', '/'],
  ['intro', '/intro'],
  ['question', '/q/1'],
  ['baking', '/baking'],
  ['result', '/r/pgde'],
  ['gallery', '/gallery'],
  ['story', '/story'],
]) {
  await ev(`sessionStorage.setItem('pb1.answers', JSON.stringify(${JSON.stringify(
    Array.from({ length: 12 }, (_, i) => ({ q: i + 1, pole: i < 3 ? 'P' : i < 6 ? 'G' : i < 9 ? 'D' : 'E' })),
  )}))`).catch(() => {});
  await go(path);
  const foot = await ev(IMAGE_FOOTPRINT);
  report.routes[name] = {
    ...(await metrics()),
    decodedImagesMB: MB(foot.decodedBytes),
    transferredKB: Math.round(foot.transferredBytes / 1024),
    requests: foot.requests,
    imgElements: foot.imgElements,
    uniqueImages: foot.uniqueImages,
    canvasMB: MB(foot.canvases.reduce((a, c) => a + c.bytes, 0)),
    canvases: foot.canvases,
    webglBufferMB: foot.webgl?.bufferBytes ? MB(foot.webgl.bufferBytes) : null,
    webglBuffer: foot.webgl ? `${foot.webgl.bufferW}x${foot.webgl.bufferH}` : null,
    renderer: foot.webgl?.renderer ?? null,
    dpr: foot.dpr,
    tier: foot.tier,
    canvasContribution: await canvasContribution(),
  };
}

// Frame budget on the three animation-heavy screens, at increasing CPU handicaps.
for (const rate of [1, 4, 6, 8]) {
  await cmd('Emulation.setCPUThrottlingRate', { rate });
  report.throttled[`${rate}x`] = {};
  for (const [name, path] of [['question', '/q/1'], ['baking', '/baking'], ['result', '/r/pgde']]) {
    await go(path, 900);
    report.throttled[`${rate}x`][name] = await ev(SAMPLE_FPS(2500));
  }
}
await cmd('Emulation.setCPUThrottlingRate', { rate: 1 });

// Leak check: the scene manager tears down per route, so heap should return flat.
await go('/');
await cmd('HeapProfiler.collectGarbage');
await wait(400);
const before = (await metrics()).jsHeapMB;
for (const path of ['/intro', '/q/1', '/q/2', '/q/3', '/q/4', '/q/5', '/q/6', '/q/7', '/q/8', '/q/9', '/q/10', '/q/11', '/q/12', '/baking', '/r/pgde', '/gallery', '/story', '/']) {
  await go(path, 250);
}
await cmd('HeapProfiler.collectGarbage');
await wait(600);
const after = await metrics();
report.leak = { heapBeforeMB: before, heapAfterFullRunMB: after.jsHeapMB, growthMB: Math.round((after.jsHeapMB - before) * 100) / 100, nodesAfter: after.nodes, listenersAfter: after.listeners };

console.log(JSON.stringify(report, null, 2));
ws.close();
