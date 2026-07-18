# Technique 72 — Stacked Modal Sheets

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** Mobile · GSAP
**Dependencies:** `vendor/gsap.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

iOS modal depth: every sheet pushes everything behind it back — scaled, tucked, dimmed, corners rounded — with each layer's pose derived from its depth in the stack. Drag-dismissable.

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

## Full working source (`72.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
<title>72 — Stacked Modal Sheets</title>
<link href="vendor/fonts.css" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  :root{--bg:#0b0b0f;--fg:#f4f1ea;--mut:#73737d;--accent:#c8ff00}
  html,body{height:100%;background:var(--bg);color:var(--fg);font-family:'Space Grotesk',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}
  .nav{position:fixed;top:0;left:0;width:100%;display:flex;justify-content:space-between;align-items:center;padding:20px 28px;z-index:1000;mix-blend-mode:difference}
  .nav a{color:var(--fg);text-decoration:none;font-size:12px;letter-spacing:.06em;text-transform:uppercase}
  .nav .id{font-size:12px;letter-spacing:.1em}
  .caption{position:fixed;left:28px;bottom:24px;max-width:300px;font-size:12px;line-height:1.55;color:var(--mut);z-index:1000;mix-blend-mode:difference;pointer-events:none}
  .caption b{color:var(--fg);font-weight:500}
  @media(max-width:760px){.caption{display:none}}

  .stage{position:fixed;inset:0;display:grid;place-items:center;z-index:1}
  .phone{position:relative;width:390px;height:min(844px,92vh);background:#000;overflow:hidden;border-radius:48px;box-shadow:0 0 0 11px #17171d,0 0 0 13px #2a2a33,0 44px 110px rgba(0,0,0,.65)}
  .pnotch{position:absolute;top:12px;left:50%;transform:translateX(-50%);width:118px;height:32px;border-radius:20px;background:#000;z-index:60}
  .phome{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:130px;height:5px;border-radius:3px;background:rgba(255,255,255,.28);z-index:60;pointer-events:none}
  @media(max-width:760px){.phone{width:100vw;height:100dvh;border-radius:0;box-shadow:none}.pnotch{display:none}}

  .layer{position:absolute;inset:0;background:#0e0e13;will-change:transform;transform-origin:center top;overflow:hidden}
  .layer .inner{padding:58px 22px 20px}
  .layer h1{font-family:'Instrument Serif',serif;font-weight:400;font-size:26px}
  .layer .k{font-family:'Space Mono',monospace;font-size:10px;color:var(--mut);letter-spacing:.12em;margin-top:5px}
  .openbtn{margin-top:22px;background:var(--accent);border:none;border-radius:14px;color:#101204;font:inherit;font-weight:600;font-size:14px;padding:15px 22px;cursor:pointer;width:100%}
  .layer .ph{margin-top:20px;height:170px;border-radius:14px;background-size:cover;background-position:center}
  .depth{margin-top:20px;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.12em;color:var(--accent)}

  .sheet{position:absolute;left:0;top:0;width:100%;height:100%;z-index:10;will-change:transform;transform:translateY(101%)}
  .sheet .pane{position:absolute;left:0;top:26px;width:100%;height:calc(100% - 26px);background:#171720;border-radius:20px 20px 0 0;box-shadow:0 -14px 44px rgba(0,0,0,.55);padding:0 22px 20px;overflow:hidden}
  .sheet .grab{padding:11px 0 6px;display:grid;place-items:center;cursor:grab;touch-action:none}
  .sheet .grab i{width:40px;height:5px;border-radius:3px;background:#33333d}
  .sheet h2{font-family:'Instrument Serif',serif;font-weight:400;font-size:23px;margin-top:6px}
  .sheet .k{font-family:'Space Mono',monospace;font-size:10px;color:var(--mut);letter-spacing:.12em;margin-top:5px}
  .sheet .ph{margin-top:16px;height:150px;border-radius:14px;background-size:cover;background-position:center}
  .sheet .row{display:flex;gap:10px;margin-top:16px}
  .sheet .row button{flex:1;background:#22222c;border:none;border-radius:13px;color:var(--fg);font:inherit;font-size:13px;padding:14px 0;cursor:pointer}
  .sheet .row button.acc{background:var(--accent);color:#101204;font-weight:600}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">72 / Stacked Modals</span>
  </nav>
  <div class="caption">
    <b>iOS modal depth.</b> Each sheet that opens pushes <i>everything behind it</i> back — scaled down, tucked under the notch, corners rounded — so the stack reads as physical cards. Sheets are drag-dismissable; every layer's transform is derived from its depth in the stack.
  </div>

  <div class="stage">
    <div class="phone">
      <div class="pnotch"></div>

      <div class="layer" id="base">
        <div class="inner">
          <h1>Your library</h1>
          <div class="k">STACK DEPTH: <span id="depthLbl">0</span></div>
          <div class="ph" style="background-image:url('assets/img/photo-1618005182384-a83a8bd57fbe.jpg')"></div>
          <button class="openbtn" data-open="0">Open item ↑</button>
        </div>
      </div>

      <div class="sheet" id="s0">
        <div class="pane">
          <div class="grab"><i></i></div>
          <h2>Aether — edition 01</h2>
          <div class="k">SHEET 1 · DRAG DOWN TO DISMISS</div>
          <div class="ph" style="background-image:url('assets/img/photo-1620121684840-edffcfc4b878.jpg')"></div>
          <div class="row"><button data-close>Close</button><button class="acc" data-open="1">Details ↑</button></div>
        </div>
      </div>

      <div class="sheet" id="s1">
        <div class="pane">
          <div class="grab"><i></i></div>
          <h2>Purchase options</h2>
          <div class="k">SHEET 2 · THE FIRST SHEET TUCKED BACK TOO</div>
          <div class="ph" style="background-image:url('assets/img/photo-1635776062127-d379bfcba9f8.jpg')"></div>
          <div class="row"><button data-close>Close</button><button class="acc" data-close>Buy · $128</button></div>
        </div>
      </div>
      <div class="phome"></div>
    </div>
  </div>

  <script src="vendor/gsap.min.js"></script>
  <script>
    const buzz = ms => navigator.vibrate && navigator.vibrate(ms);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const phone = document.querySelector('.phone');
    const base = document.getElementById('base');
    const sheets = [document.getElementById('s0'), document.getElementById('s1')];
    let stack = []; // indexes of open sheets, bottom→top

    /* every layer's pose comes from how deep it is under the top sheet */
    function pose(){
      document.getElementById('depthLbl').textContent = stack.length;
      const layers = [base, ...stack.map(i => sheets[i])];
      layers.forEach((el, k) => {
        const depth = layers.length - 1 - k;      // 0 = frontmost
        const target = el === base
          ? { scale: 1 - depth * .05, y: depth ? 14 : 0, borderRadius: depth ? 22 : (innerWidth > 760 ? 48 : 0), filter: `brightness(${1 - depth * .25})` }
          : { scale: 1 - depth * .04, y: depth * -12, filter: `brightness(${1 - depth * .22})` };
        gsap.to(el === base ? base : el.querySelector('.pane'), { ...target, duration: reduced ? 0 : .5, ease: 'power3.out' });
      });
    }

    function openSheet(i){
      if(stack.includes(i)) return;
      stack.push(i);
      buzz(10);
      sheets[i].style.zIndex = 10 + stack.length;
      gsap.to(sheets[i], { y: '0%', duration: reduced ? 0 : .55, ease: 'expo.out' });
      gsap.set(sheets[i].querySelector('.pane'), { y: 0, scale: 1, filter: 'brightness(1)' });
      pose();
    }
    function closeSheet(){
      const i = stack.pop();
      if(i === undefined) return;
      buzz(8);
      gsap.to(sheets[i], { y: '101%', duration: reduced ? 0 : .42, ease: 'power3.in' });
      pose();
    }

    document.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => openSheet(+b.dataset.open)));
    document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeSheet));

    /* drag the top sheet down to dismiss */
    sheets.forEach((sheet, i) => {
      const grab = sheet.querySelector('.grab');
      let dragging = false, sy = 0, lastY = 0, lastT = 0, vy = 0;
      grab.addEventListener('pointerdown', e => {
        if(stack[stack.length - 1] !== i) return;
        dragging = true; sy = e.clientY; lastY = e.clientY; lastT = performance.now(); vy = 0;
        grab.setPointerCapture(e.pointerId);
      });
      grab.addEventListener('pointermove', e => {
        if(!dragging) return;
        const now = performance.now();
        vy = (e.clientY - lastY) / Math.max(1, now - lastT) * 1000;
        lastY = e.clientY; lastT = now;
        const dy = Math.max(0, e.clientY - sy);
        gsap.set(sheet, { y: dy });
      });
      const up = () => {
        if(!dragging) return; dragging = false;
        const dy = gsap.getProperty(sheet, 'y');
        if(vy > 500 || dy > phone.clientHeight * .3) closeSheet();
        else gsap.to(sheet, { y: 0, duration: reduced ? 0 : .4, ease: 'back.out(1.2)' });
      };
      grab.addEventListener('pointerup', up);
      grab.addEventListener('pointercancel', up);
    });
  </script>
</body>
</html>
```