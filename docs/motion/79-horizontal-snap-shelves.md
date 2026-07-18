# Technique 79 — Horizontal Snap Shelves

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** Mobile · CSS
**Dependencies:** `vendor/gsap.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

App Store shelves: native scroll-snap-x rows in a vertical feed with peek padding, a pointer-drag shim for mouse, and cards that cascade in the first time each shelf appears.

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

## Full working source (`79.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
<title>79 — Horizontal Snap Shelves</title>
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

  .scroll{position:absolute;inset:0;overflow-y:auto;overscroll-behavior:contain}
  .scroll::-webkit-scrollbar{display:none}
  .top{padding:62px 22px 14px}
  .top h1{font-family:'Instrument Serif',serif;font-weight:400;font-size:28px}
  .top p{font-family:'Space Mono',monospace;font-size:10px;color:var(--mut);letter-spacing:.12em;margin-top:5px}

  .shelf{margin-bottom:26px}
  .shead{display:flex;justify-content:space-between;align-items:baseline;padding:0 22px 10px}
  .shead h2{font-size:16px;font-weight:600}
  .shead span{font-family:'Space Mono',monospace;font-size:9.5px;letter-spacing:.1em;color:var(--accent)}
  .row{display:flex;gap:12px;overflow-x:auto;padding:2px 22px 6px;scroll-snap-type:x mandatory;scrollbar-width:none;cursor:grab}
  .row::-webkit-scrollbar{display:none}
  .row:active{cursor:grabbing}
  .scard{flex:0 0 168px;scroll-snap-align:start;border-radius:14px;overflow:hidden;background:#15151b;border:1px solid #1f1f28;opacity:0;transform:translateY(20px)}
  .scard .ph{height:110px;background-size:cover;background-position:center}
  .scard .tx{padding:11px 13px}
  .scard h3{font-size:12.5px;font-weight:500}
  .scard p{font-family:'Space Mono',monospace;font-size:9px;color:var(--mut);letter-spacing:.08em;margin-top:3px}
  .scard.big{flex:0 0 280px}
  .scard.big .ph{height:150px}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">79 / Snap Shelves</span>
  </nav>
  <div class="caption">
    <b>App Store shelves.</b> Native <code>scroll-snap-x</code> rows inside a vertical feed — snap stays buttery on touch, a pointer-drag shim adds mouse support, edge padding gives the "peek", and each shelf's cards cascade in the first time it scrolls into view.
  </div>

  <div class="stage">
    <div class="phone">
      <div class="pnotch"></div>
      <div class="scroll" id="scroll">
        <div class="top"><h1>Browse</h1><p>SNAP THE ROWS · SCROLL THE FEED</p></div>
        <div id="shelves"></div>
        <div style="height:60px"></div>
      </div>
      <div class="phome"></div>
    </div>
  </div>

  <script src="vendor/gsap.min.js"></script>
  <script>
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const IMGS = ['1618005182384-a83a8bd57fbe','1620121684840-edffcfc4b878','1635776062127-d379bfcba9f8','1604871000636-074fa5117945','1633186710895-309db2eca9e4','1550684848-fac1c5b4e853','1557672172-298e090bd0f1','1618556450991-2f1af64e8191','1618005198919-d3d4b5a92ead','1614851099511-773084f6911d'];
    const NAMES = ['Aether','Nocturne','Void','Kinetik','Monolith','Ember','Relic','Drift','Fold','Prism'];
    const SHELVES = [
      ['Featured this week', 'SEE ALL', true],
      ['New & noteworthy', 'SEE ALL', false],
      ['Motion essentials', 'SEE ALL', false],
      ['From the archive', 'SEE ALL', false],
    ];
    let seed = 0;
    document.getElementById('shelves').innerHTML = SHELVES.map(([title, cta, big]) => `
      <div class="shelf">
        <div class="shead"><h2>${title}</h2><span>${cta} ›</span></div>
        <div class="row">${Array.from({ length: 6 }, (_, i) => {
          const k = (seed++ + i * 3) % IMGS.length;
          return `<div class="scard${big ? ' big' : ''}">
            <div class="ph" style="background-image:url('assets/img/photo-${IMGS[k]}.jpg')"></div>
            <div class="tx"><h3>${NAMES[k]}</h3><p>EDITION ${String(k + 1).padStart(2, '0')}</p></div>
          </div>`; }).join('')}</div>
      </div>`).join('');

    /* cards cascade in the first time their shelf appears */
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if(!en.isIntersecting) return;
      io.unobserve(en.target);
      gsap.to(en.target.querySelectorAll('.scard'), {
        opacity: 1, y: 0, stagger: .06, duration: reduced ? 0 : .5, ease: 'power3.out' });
    }), { root: document.getElementById('scroll'), threshold: .15 });
    document.querySelectorAll('.shelf').forEach(s => io.observe(s));

    /* mouse-drag shim so desktop gets the same free-scroll feel as touch */
    document.querySelectorAll('.row').forEach(row => {
      let down = false, sx = 0, sl = 0, moved = 0;
      row.addEventListener('pointerdown', e => {
        if(e.pointerType !== 'mouse') return;           // touch already scrolls natively
        down = true; sx = e.clientX; sl = row.scrollLeft; moved = 0;
        row.setPointerCapture(e.pointerId);
        row.style.scrollSnapType = 'none';              // free while dragging
      });
      row.addEventListener('pointermove', e => {
        if(!down) return;
        moved += Math.abs(e.movementX);
        row.scrollLeft = sl - (e.clientX - sx);
      });
      const up = () => {
        if(!down) return; down = false;
        // ease onto the nearest snap position, then restore native snapping
        const card = row.querySelector('.scard');
        const pitch = card.offsetWidth + 12;
        const target = Math.round(row.scrollLeft / pitch) * pitch;
        gsap.to(row, { scrollLeft: target, duration: reduced ? 0 : .4, ease: 'power3.out',
          onComplete(){ row.style.scrollSnapType = ''; } });
      };
      row.addEventListener('pointerup', up);
      row.addEventListener('pointercancel', up);
    });
  </script>
</body>
</html>
```