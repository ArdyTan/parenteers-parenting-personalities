# Technique 60 — Flick Momentum Carousel

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** Mobile · GSAP
**Dependencies:** `vendor/gsap.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

Free flick with velocity sampling and friction; once it slows, a magnet eases onto the nearest card. Distance from center drives every card's scale, tilt and brightness.

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

## Full working source (`60.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
<title>60 — Flick Momentum Carousel</title>
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
  .phone{position:relative;width:390px;height:min(844px,92vh);background:#0e0e13;overflow:hidden;border-radius:48px;box-shadow:0 0 0 11px #17171d,0 0 0 13px #2a2a33,0 44px 110px rgba(0,0,0,.65)}
  .pnotch{position:absolute;top:12px;left:50%;transform:translateX(-50%);width:118px;height:32px;border-radius:20px;background:#000;z-index:60}
  .phome{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:130px;height:5px;border-radius:3px;background:rgba(255,255,255,.28);z-index:60;pointer-events:none}
  @media(max-width:760px){.phone{width:100vw;height:100dvh;border-radius:0;box-shadow:none}.pnotch{display:none}}

  .appbar{padding:58px 24px 8px}
  .appbar h1{font-family:'Instrument Serif',serif;font-weight:400;font-size:26px}
  .appbar p{font-family:'Space Mono',monospace;font-size:10px;color:var(--mut);letter-spacing:.12em;margin-top:5px}
  .carousel{position:absolute;top:0;bottom:0;left:0;width:100%;display:grid;place-items:center;touch-action:pan-y;cursor:grab;overflow:hidden}
  .carousel:active{cursor:grabbing}
  .track{position:relative;height:420px;width:100%}
  .ccard{position:absolute;left:50%;top:0;width:250px;height:100%;margin-left:-125px;border-radius:22px;overflow:hidden;background:#15151b;box-shadow:0 24px 60px rgba(0,0,0,.5);will-change:transform;user-select:none}
  .ccard img{width:100%;height:78%;object-fit:cover;pointer-events:none;-webkit-user-drag:none}
  .ccard .m{padding:14px 18px}
  .ccard h3{font-family:'Instrument Serif',serif;font-weight:400;font-size:22px}
  .ccard p{font-family:'Space Mono',monospace;font-size:10px;color:var(--mut);letter-spacing:.1em;margin-top:4px}
  .dots{position:absolute;bottom:66px;left:0;width:100%;display:flex;justify-content:center;gap:8px;z-index:5}
  .dots i{width:6px;height:6px;border-radius:4px;background:#2c2c35;transition:all .35s cubic-bezier(.16,1,.3,1)}
  .dots i.on{width:22px;background:var(--accent)}
  .veltag{position:absolute;top:58px;right:24px;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.1em;color:var(--mut)}
  .veltag b{color:var(--accent);font-weight:400}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">60 / Flick Carousel</span>
  </nav>
  <div class="caption">
    <b>Free flick + magnetic snap.</b> The strip runs on real momentum (velocity sampling → friction decay), then a magnet eases it onto the nearest card once it slows. Center card scales up and un-dims; distance from center drives every card's scale, tilt and brightness.
  </div>

  <div class="stage">
    <div class="phone">
      <div class="pnotch"></div>
      <div class="appbar"><h1>Editions</h1><p>FLICK HARD — IT COASTS, THEN SNAPS</p></div>
      <span class="veltag" id="vel"><b>0</b> PX/S</span>
      <div class="carousel" id="carousel"><div class="track" id="track"></div></div>
      <div class="dots" id="dots"></div>
      <div class="phome"></div>
    </div>
  </div>

  <script src="vendor/gsap.min.js"></script>
  <script>
    const buzz = ms => navigator.vibrate && navigator.vibrate(ms);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const track = document.getElementById('track');
    const carousel = document.getElementById('carousel');
    const dots = document.getElementById('dots');
    const IMGS = ['1618005182384-a83a8bd57fbe','1620121684840-edffcfc4b878','1635776062127-d379bfcba9f8','1604871000636-074fa5117945','1633186710895-309db2eca9e4','1550684848-fac1c5b4e853','1557672172-298e090bd0f1'];
    const NAMES = ['Aether','Nocturne','Void','Kinetik','Monolith','Ember','Relic'];
    const GAP = 272;          // card pitch in px
    const N = IMGS.length;

    const cards = IMGS.map((id, i) => {
      const el = document.createElement('div');
      el.className = 'ccard';
      el.innerHTML = `<img src="assets/img/photo-${id}.jpg" draggable="false">
        <div class="m"><h3>${NAMES[i]}</h3><p>EDITION ${String(i + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}</p></div>`;
      track.appendChild(el);
      const dot = document.createElement('i');
      dots.appendChild(dot);
      return el;
    });
    const dotEls = [...dots.children];

    let x = 0, vx = 0, dragging = false, sx = 0, ox = 0, lastX = 0, lastT = 0, active = -1;
    const maxX = () => (N - 1) * GAP;
    const rubber = (v, c = 110) => v * c / (c + v);

    carousel.addEventListener('pointerdown', e => {
      dragging = true; sx = e.clientX; ox = x; lastX = e.clientX; lastT = performance.now(); vx = 0;
      carousel.setPointerCapture(e.pointerId);
    });
    carousel.addEventListener('pointermove', e => {
      if(!dragging) return;
      const now = performance.now();
      vx = (e.clientX - lastX) / Math.max(1, now - lastT) * 1000;
      lastX = e.clientX; lastT = now;
      x = ox - (e.clientX - sx);
    });
    const up = () => dragging = false;
    carousel.addEventListener('pointerup', up);
    carousel.addEventListener('pointercancel', up);
    carousel.addEventListener('wheel', e => { x += (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY); vx = 0; }, { passive: true });

    const velEl = document.querySelector('#vel b');
    gsap.ticker.add(() => {
      if(!dragging){
        x -= vx / 60; vx *= 0.94;                        // coast
        // once slow, the magnet takes over
        if(Math.abs(vx) < 260){
          const snap = gsap.utils.clamp(0, maxX(), Math.round(x / GAP) * GAP);
          x += (snap - x) * (reduced ? 1 : .12);
        }
        // ends rubber-band home
        if(x < 0) x += (0 - x) * .18;
        if(x > maxX()) x += (maxX() - x) * .18;
      } else {
        // live rubber while dragging past the ends
        if(x < 0) x = -rubber(-x);
        if(x > maxX()) x = maxX() + rubber(x - maxX());
      }

      cards.forEach((c, i) => {
        const off = i * GAP - x;                          // px from center
        const p = gsap.utils.clamp(-1, 1, off / GAP);     // -1..1 within one pitch
        const scale = 1 - Math.min(Math.abs(off) / GAP, 1) * .14;
        c.style.transform = `translateX(${off}px) scale(${scale}) rotate(${p * 3}deg)`;
        c.style.filter = `brightness(${1 - Math.min(Math.abs(off) / GAP, 1) * .45})`;
        c.style.zIndex = 100 - Math.round(Math.abs(off));
      });

      const cur = gsap.utils.clamp(0, N - 1, Math.round(x / GAP));
      if(cur !== active){
        active = cur;
        dotEls.forEach((d, i) => d.classList.toggle('on', i === active));
        if(!dragging) buzz(6);
      }
      velEl.textContent = Math.abs(Math.round(vx));
    });
  </script>
</body>
</html>
```