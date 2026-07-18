# Technique 77 — Touch Parallax Cards

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** Mobile · CSS
**Dependencies:** `vendor/gsap.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

Parallax that survives phones: no background-attachment, just over-sized images, badges and captions translating at three different rates from one rAF-throttled scroll read.

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

## Full working source (`77.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
<title>77 — Touch Parallax Cards</title>
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
  .top{padding:62px 22px 16px}
  .top h1{font-family:'Instrument Serif',serif;font-weight:400;font-size:28px}
  .top p{font-family:'Space Mono',monospace;font-size:10px;color:var(--mut);letter-spacing:.12em;margin-top:5px}

  .pcard{position:relative;margin:0 18px 18px;height:240px;border-radius:18px;overflow:hidden}
  .pcard .img{position:absolute;left:0;top:-20%;width:100%;height:140%;background-size:cover;background-position:center;will-change:transform}
  .pcard .veil{position:absolute;inset:0;background:linear-gradient(transparent 45%,rgba(0,0,0,.62))}
  .pcard .badge{position:absolute;top:16px;left:16px;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.14em;color:#101204;background:var(--accent);border-radius:16px;padding:6px 11px;will-change:transform}
  .pcard .tx{position:absolute;left:18px;bottom:14px;will-change:transform}
  .pcard h2{font-family:'Instrument Serif',serif;font-weight:400;font-size:26px;line-height:1}
  .pcard p{font-family:'Space Mono',monospace;font-size:9.5px;letter-spacing:.1em;color:rgba(255,255,255,.7);margin-top:6px}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">77 / Touch Parallax</span>
  </nav>
  <div class="caption">
    <b>Parallax that survives phones.</b> No <code>background-attachment:fixed</code> (dead on iOS) — each card's over-sized image, badge and caption translate at different rates from one rAF-throttled scroll read. Three layers per card, transforms only, 60fps on mid-range devices.
  </div>

  <div class="stage">
    <div class="phone">
      <div class="pnotch"></div>
      <div class="scroll" id="scroll">
        <div class="top"><h1>Field notes</h1><p>SCROLL — THREE LAYERS PER CARD, THREE SPEEDS</p></div>
        <div id="cards"></div>
        <div style="height:60px"></div>
      </div>
      <div class="phome"></div>
    </div>
  </div>

  <script src="vendor/gsap.min.js"></script>
  <script>
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const CARDS = [
      ['1618005182384-a83a8bd57fbe','Aether','GRADIENT FIELDS · 01'],
      ['1620121684840-edffcfc4b878','Nocturne','WEBGL FLAGSHIP · 02'],
      ['1635776062127-d379bfcba9f8','Void','DARK MATTER · 03'],
      ['1633186710895-309db2eca9e4','Monolith','SPATIAL STUDY · 04'],
      ['1550684848-fac1c5b4e853','Ember','CAMPAIGN · 05'],
      ['1557672172-298e090bd0f1','Relic','TEXTURE PASS · 06'],
    ];
    document.getElementById('cards').innerHTML = CARDS.map(c => `
      <div class="pcard">
        <div class="img" style="background-image:url('assets/img/photo-${c[0]}.jpg')"></div>
        <div class="veil"></div>
        <span class="badge">FEATURED</span>
        <div class="tx"><h2>${c[1]}</h2><p>${c[2]}</p></div>
      </div>`).join('');

    const scroll = document.getElementById('scroll');
    const cards = [...document.querySelectorAll('.pcard')].map(el => ({
      el,
      img: el.querySelector('.img'),
      badge: el.querySelector('.badge'),
      tx: el.querySelector('.tx'),
    }));

    let raf = null;
    function update(){
      raf = null;
      if(reduced) return;
      const sr = scroll.getBoundingClientRect();
      const mid = sr.top + sr.height / 2;
      cards.forEach(c => {
        const r = c.el.getBoundingClientRect();
        if(r.bottom < sr.top - 60 || r.top > sr.bottom + 60) return;   // offscreen: skip
        // -1 … 1 as the card travels through the viewport
        const p = gsap.utils.clamp(-1, 1, (r.top + r.height / 2 - mid) / (sr.height / 2 + r.height / 2));
        c.img.style.transform   = `translateY(${p * 34}px)`;   // slowest — the depth layer
        c.badge.style.transform = `translateY(${p * -14}px)`;  // floats against the image
        c.tx.style.transform    = `translateY(${p * -8}px)`;   // caption leads slightly
      });
    }
    scroll.addEventListener('scroll', () => { if(!raf) raf = requestAnimationFrame(update); }, { passive: true });
    addEventListener('resize', update);
    update();
  </script>
</body>
</html>
```