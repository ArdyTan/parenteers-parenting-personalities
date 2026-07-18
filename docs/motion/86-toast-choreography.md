# Technique 86 — Toast Choreography

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** Mobile · GSAP
**Dependencies:** `vendor/gsap.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

Snackbars stack and squish: new toasts push in from below with an auto-expire bar, swipe one off with velocity and the rest close the gap, and beyond three the oldest collapses out.

## How to implement this in an existing site

1. **Read the full source below first** — it is a self-contained, working page. The technique's core
   logic lives in the `<script>` block; the supporting layout/styles are in `<style>`.
2. **Port the core mechanism, not the demo chrome.** Skip the "← Index" nav, the fixed caption and
   the demo copy — those exist for the library. Keep the CSS that the effect itself depends on
   (transforms, positioning, will-change, perspective, clip-paths, etc.).
3. **Adapt to the host project:**
   - Swap fonts/colors for the project's design tokens, and replace the local `assets/`
     images/frames with the project's own media.
   - If the project uses React/Vue/Svelte, wrap setup in the framework's mount/effect lifecycle and
     clean up listeners, tickers and ScrollTriggers on unmount.
   - If the site already runs Lenis or ScrollTrigger, reuse the existing instance instead of
     creating a second one.
4. **Respect reduced motion:** gate the effect behind
   `window.matchMedia('(prefers-reduced-motion: reduce)')` and provide a static fallback.
5. **Performance notes:** animate only `transform`/`opacity` where possible, keep `will-change`
   on animated nodes, and throttle anything bound to `mousemove`/`scroll` through rAF or GSAP's
   ticker (the source already does this — preserve that structure).

## Full working source (`86.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
<title>86 — Toast Choreography</title>
<link href="vendor/fonts.css" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  :root{--bg:#0b0b0f;--fg:#f4f1ea;--mut:#73737d;--accent:#c8ff00;--ok:#3ba55d;--err:#ff4d5e;--info:#4b9bff}
  html,body{height:100%;background:var(--bg);color:var(--fg);font-family:'Space Grotesk',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}
  .nav{position:fixed;top:0;left:0;width:100%;display:flex;justify-content:space-between;align-items:center;padding:20px 28px;z-index:1000;mix-blend-mode:difference}
  .nav a{color:var(--fg);text-decoration:none;font-size:12px;letter-spacing:.06em;text-transform:uppercase}
  .nav .id{font-size:12px;letter-spacing:.1em}
  .caption{position:fixed;left:28px;bottom:24px;max-width:300px;font-size:12px;line-height:1.55;color:var(--mut);z-index:1000;mix-blend-mode:difference;pointer-events:none}
  .caption b{color:var(--fg);font-weight:500}
  @media(max-width:760px){.caption{display:none}}

  .stage{position:fixed;inset:0;display:grid;place-items:center;z-index:1}
  .phone{position:relative;width:390px;height:min(844px,92vh);background:#0e0e13;overflow:hidden;border-radius:48px;box-shadow:0 0 0 11px #17171d,0 0 0 13px #2a2a33,0 44px 110px rgba(0,0,0,.65)}
  .pnotch{position:absolute;top:12px;left:50%;transform:translateX(-50%);width:118px;height:32px;border-radius:20px;background:#000;z-index:60}
  .phome{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:130px;height:5px;border-radius:3px;background:rgba(255,255,255,.28);z-index:60;pointer-events:none}
  @media(max-width:760px){.phone{width:100vw;height:100dvh;border-radius:0;box-shadow:none}.pnotch{display:none}}

  .appbar{padding:58px 24px 10px}
  .appbar h1{font-family:'Instrument Serif',serif;font-weight:400;font-size:26px}
  .appbar p{font-family:'Space Mono',monospace;font-size:10px;color:var(--mut);letter-spacing:.12em;margin-top:5px}
  .triggers{padding:12px 20px;display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .triggers button{background:#15151b;border:1px solid #23232b;border-radius:14px;color:var(--fg);font:inherit;font-size:13px;font-weight:500;padding:15px 12px;cursor:pointer;-webkit-tap-highlight-color:transparent}
  .triggers button:active{background:#1c1c24}
  .triggers button.wide{grid-column:1/-1;background:none;color:var(--mut);font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.1em;padding:10px}

  /* toast stack — bottom, newest on top */
  .toaster{position:absolute;left:16px;right:16px;bottom:26px;z-index:30;display:flex;flex-direction:column;gap:0;align-items:stretch;pointer-events:none}
  .toast{position:relative;pointer-events:auto;background:#1b1b23;border:1px solid #2a2a33;border-radius:15px;padding:14px 15px;display:flex;align-items:center;gap:12px;box-shadow:0 12px 34px rgba(0,0,0,.5);touch-action:none;will-change:transform,opacity;overflow:hidden;margin-top:10px}
  .toast .ic{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;font-size:15px;flex-shrink:0}
  .toast.ok .ic{background:rgba(59,165,93,.18);color:var(--ok)}
  .toast.err .ic{background:rgba(255,77,94,.18);color:var(--err)}
  .toast.info .ic{background:rgba(75,155,255,.18);color:var(--info)}
  .toast h3{font-size:13.5px;font-weight:500}
  .toast p{font-family:'Space Mono',monospace;font-size:9px;color:var(--mut);letter-spacing:.06em;margin-top:2px}
  .toast .bar{position:absolute;left:0;bottom:0;height:2.5px;background:var(--accent);width:100%;transform-origin:left}
  .toast.ok .bar{background:var(--ok)}.toast.err .bar{background:var(--err)}.toast.info .bar{background:var(--info)}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">86 / Toast Stack</span>
  </nav>
  <div class="caption">
    <b>Snackbars that stack &amp; squish.</b> New toasts push in from below and shove the stack up; each carries an auto-expire progress bar. Swipe one sideways and it flies off with your velocity while the rest close the gap. Beyond three, the oldest collapses out.
  </div>

  <div class="stage">
    <div class="phone">
      <div class="pnotch"></div>
      <div class="appbar"><h1>Notifications</h1><p>FIRE TOASTS · SWIPE TO DISMISS</p></div>
      <div class="triggers">
        <button data-t="ok">✓ Success</button>
        <button data-t="err">✕ Error</button>
        <button data-t="info">→ Info</button>
        <button data-t="rapid">⚡ Rapid ×3</button>
        <button class="wide" id="clear">CLEAR ALL</button>
      </div>
      <div class="toaster" id="toaster"></div>
      <div class="phome"></div>
    </div>
  </div>

  <script src="vendor/gsap.min.js"></script>
  <script>
    const buzz = ms => navigator.vibrate && navigator.vibrate(ms);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const toaster = document.getElementById('toaster');
    const MAX = 3, LIFE = 4;
    const KINDS = {
      ok:   { ic: '✓', h: 'Saved to library', p: 'SYNCED · JUST NOW' },
      err:  { ic: '✕', h: 'Upload failed', p: 'TAP TO RETRY · NETWORK' },
      info: { ic: '→', h: 'New version available', p: 'v2.7 · SEE WHAT’S NEW' },
    };
    let n = 0;

    function toast(kind){
      const meta = KINDS[kind];
      const el = document.createElement('div');
      el.className = 'toast ' + kind;
      el.innerHTML = `<div class="ic">${meta.ic}</div><div style="flex:1"><h3>${meta.h}</h3><p>${meta.p} · #${++n}</p></div><div class="bar"></div>`;
      toaster.appendChild(el);
      buzz(kind === 'err' ? [12, 40, 12] : 8);
      // enter: rise from below with a slight overshoot
      gsap.fromTo(el, { y: 40, opacity: 0, scale: .9 },
        { y: 0, opacity: 1, scale: 1, duration: reduced ? 0 : .5, ease: 'back.out(1.5)' });
      // auto-expire progress bar
      const life = gsap.to(el.querySelector('.bar'), { scaleX: 0, duration: reduced ? 2 : LIFE, ease: 'none',
        onComplete: () => dismiss(el) });
      el._life = life;
      // trim overflow — collapse the oldest
      while(toaster.children.length > MAX) dismiss(toaster.firstChild, true);
      makeSwipe(el);
    }

    function dismiss(el, quiet){
      if(!el || el._dead) return; el._dead = true;
      el._life && el._life.kill();
      gsap.to(el, { height: 0, marginTop: 0, opacity: 0, paddingTop: 0, paddingBottom: 0,
        duration: reduced ? 0 : .3, ease: 'power2.in',
        onStart(){ el.style.height = el.offsetHeight + 'px'; },
        onComplete(){ el.remove(); } });
      if(!quiet) buzz(5);
    }

    function makeSwipe(el){
      let dragging = false, sx = 0, lastX = 0, lastT = 0, vx = 0;
      el.addEventListener('pointerdown', e => {
        dragging = true; sx = e.clientX; lastX = e.clientX; lastT = performance.now(); vx = 0;
        el.setPointerCapture(e.pointerId);
        el._life && el._life.pause();               // hovering/holding pauses expiry
      });
      el.addEventListener('pointermove', e => {
        if(!dragging) return;
        const now = performance.now();
        vx = (e.clientX - lastX) / Math.max(1, now - lastT) * 1000;
        lastX = e.clientX; lastT = now;
        const dx = e.clientX - sx;
        gsap.set(el, { x: dx, opacity: 1 - Math.min(Math.abs(dx) / 240, .7), rotation: dx * .02 });
      });
      const up = () => {
        if(!dragging) return; dragging = false;
        const dx = gsap.getProperty(el, 'x');
        if(Math.abs(vx) > 500 || Math.abs(dx) > 110){
          const dir = (dx || vx) > 0 ? 1 : -1;
          el._life && el._life.kill(); el._dead = true;
          gsap.to(el, { x: dir * 420, opacity: 0, duration: .3, ease: 'power2.in',
            onComplete(){ gsap.to(el, { height: 0, marginTop: 0, duration: .2, onStart(){ el.style.height = el.offsetHeight + 'px'; }, onComplete(){ el.remove(); } }); } });
          buzz(6);
        } else {
          gsap.to(el, { x: 0, opacity: 1, rotation: 0, duration: .4, ease: 'back.out(1.5)' });
          el._life && el._life.play();
        }
      };
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    }

    document.querySelectorAll('.triggers [data-t]').forEach(b => b.addEventListener('click', () => {
      const t = b.dataset.t;
      if(t === 'rapid'){
        const ks = ['ok', 'info', 'err'];
        ks.forEach((k, i) => gsap.delayedCall(i * .18, () => toast(k)));
      } else toast(t);
    }));
    document.getElementById('clear').addEventListener('click', () => {
      [...toaster.children].forEach((el, i) => gsap.delayedCall(i * .05, () => dismiss(el)));
    });

    toast('info');
  </script>
</body>
</html>
```