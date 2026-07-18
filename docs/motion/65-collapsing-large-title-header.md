# Technique 65 — Collapsing Large-Title Header

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** Mobile · Navigation · CSS
**Dependencies:** `vendor/gsap.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

The iOS pattern: the oversized title shrinks into a frosted compact bar as you scroll, the search field folds away, and pulling past the top stretches the title. scrollTop → transforms only.

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

## Full working source (`65.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
<title>65 — Collapsing Large-Title Header</title>
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

  /* compact bar (always there, fades in) */
  .bar{position:absolute;top:0;left:0;width:100%;height:96px;z-index:20;display:flex;align-items:flex-end;justify-content:center;padding-bottom:12px;pointer-events:none;border-bottom:1px solid transparent;transition:border-color .25s}
  .bar .bg{position:absolute;inset:0;background:rgba(14,14,19,.72);backdrop-filter:blur(16px);opacity:0;transition:opacity .25s}
  .bar.solid{border-bottom-color:#1e1e26}
  .bar.solid .bg{opacity:1}
  .bar .t{position:relative;font-size:16px;font-weight:600;opacity:0;transform:translateY(8px);transition:.28s}
  .bar.solid .t{opacity:1;transform:translateY(0)}

  .scroll{position:absolute;inset:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
  .scroll::-webkit-scrollbar{display:none}
  .head{padding:104px 22px 6px}
  .big{font-family:'Instrument Serif',serif;font-weight:400;font-size:40px;line-height:1;transform-origin:left bottom;will-change:transform,opacity}
  .search{margin:16px 0 8px;height:42px;border-radius:13px;background:#191921;display:flex;align-items:center;gap:9px;padding:0 15px;color:var(--mut);font-size:14px;will-change:transform,opacity}
  .sect{padding:18px 22px 6px;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.14em;color:var(--accent);position:sticky;top:95px;background:linear-gradient(#0e0e13 78%,transparent);z-index:5}
  .person{display:flex;gap:14px;align-items:center;padding:12px 22px}
  .person .av{width:44px;height:44px;border-radius:50%;background-size:cover;background-position:center;flex-shrink:0}
  .person .av.tx{display:grid;place-items:center;background:#1e1e28;font-family:'Space Mono',monospace;font-size:12px;color:var(--accent)}
  .person h3{font-size:14.5px;font-weight:500}
  .person p{font-family:'Space Mono',monospace;font-size:10px;color:var(--mut);letter-spacing:.06em;margin-top:3px}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">65 / Large Title</span>
  </nav>
  <div class="caption">
    <b>The iOS large-title collapse.</b> Scroll and the oversized title shrinks and fades into a compact centrally-titled bar while frosted blur and a hairline border arrive; the search field folds away; pull down past the top and the title stretches. All driven by <code>scrollTop</code>, transforms only.
  </div>

  <div class="stage">
    <div class="phone">
      <div class="pnotch"></div>
      <div class="bar" id="bar"><span class="bg"></span><span class="t">Contacts</span></div>
      <div class="scroll" id="scroll">
        <div class="head">
          <h1 class="big" id="big">Contacts</h1>
          <div class="search" id="search">⌕&nbsp; Search 214 people</div>
        </div>
        <div id="list"></div>
        <div style="height:60px"></div>
      </div>
      <div class="phome"></div>
    </div>
  </div>

  <script src="vendor/gsap.min.js"></script>
  <script>
    const IMGS = ['1618005182384-a83a8bd57fbe','1620121684840-edffcfc4b878','1635776062127-d379bfcba9f8','1604871000636-074fa5117945','1633186710895-309db2eca9e4','1550684848-fac1c5b4e853','1557672172-298e090bd0f1','1618556450991-2f1af64e8191'];
    const GROUPS = {
      A: ['Aether Aki','Anders Voll','Anna Strøm'], B: ['Bea Nakamura','Bruno Falk'],
      C: ['Cass Idris','Cato Lindqvist','Chiara Mont'], D: ['Dario Vex','Dmitri Kova'],
      E: ['Ember Lys','Erik Halvorsen'], F: ['Freya Dahl','Finn Ostergaard'],
      K: ['Kinetik Kai','Klara Vinter'], M: ['Monolith Mo','Mira Solberg','Mats Engen'],
    };
    let imgI = 0;
    document.getElementById('list').innerHTML = Object.entries(GROUPS).map(([letter, names]) => `
      <div class="sect">${letter}</div>` + names.map((n, i) => `
      <div class="person">
        ${(imgI + i) % 3 === 0 ? `<div class="av" style="background-image:url('assets/img/photo-${IMGS[(imgI++) % IMGS.length]}.jpg')"></div>`
                               : `<div class="av tx">${n.split(' ').map(w => w[0]).join('')}</div>`}
        <div><h3>${n}</h3><p>MOTION · ${String((i * 7 + 12) % 60).padStart(2, '0')} MUTUALS</p></div>
      </div>`).join('')).join('');

    const scroll = document.getElementById('scroll');
    const big = document.getElementById('big');
    const search = document.getElementById('search');
    const bar = document.getElementById('bar');
    const RANGE = 64; // px of scroll over which the collapse plays

    let raf = null;
    scroll.addEventListener('scroll', () => {
      if(raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const t = scroll.scrollTop;
        const p = gsap.utils.clamp(0, 1, t / RANGE);
        // title shrinks & fades up; below zero it stretches (rubber pull)
        if(t < 0){
          const stretch = 1 + Math.min(-t / 300, .12);
          big.style.transform = `scale(${stretch})`;
          big.style.opacity = 1;
        } else {
          big.style.transform = `scale(${1 - p * .28}) translateY(${-p * 6}px)`;
          big.style.opacity = 1 - p * 1.15;
        }
        // search folds away slightly faster
        const ps = gsap.utils.clamp(0, 1, t / (RANGE * .8));
        search.style.opacity = 1 - ps;
        search.style.transform = `translateY(${-ps * 14}px) scaleY(${1 - ps * .35})`;
        search.style.pointerEvents = ps > .6 ? 'none' : 'auto';
        // compact bar takes over
        bar.classList.toggle('solid', p >= 1);
      });
    }, { passive: true });
  </script>
</body>
</html>
```