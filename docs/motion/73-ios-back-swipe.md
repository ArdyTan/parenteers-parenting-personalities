# Technique 73 — iOS Back-Swipe

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** Mobile · GSAP
**Dependencies:** `vendor/gsap.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

Edge-drag the detail screen off 1:1 while the list parallax-returns from −30% under a fading dim — two screens at different rates read as physical layers. Velocity or half-way pops.

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

## Full working source (`73.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
<title>73 — iOS Back-Swipe</title>
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

  .screen{position:absolute;inset:0;background:#0e0e13;will-change:transform}
  .screen .bar{padding:58px 22px 12px;display:flex;align-items:center;gap:12px}
  .screen h1{font-family:'Instrument Serif',serif;font-weight:400;font-size:24px}
  .rowi{display:flex;gap:14px;align-items:center;padding:13px 22px;cursor:pointer;-webkit-tap-highlight-color:transparent}
  .rowi:active{background:#13131a}
  .rowi .th{width:56px;height:56px;border-radius:13px;background-size:cover;background-position:center;flex-shrink:0}
  .rowi h3{font-size:14.5px;font-weight:500}
  .rowi p{font-family:'Space Mono',monospace;font-size:10px;color:var(--mut);letter-spacing:.08em;margin-top:4px}
  .rowi .chev{margin-left:auto;color:#3c3c46;font-size:16px}
  .dimmer{position:absolute;inset:0;background:#000;opacity:0;pointer-events:none;z-index:5}

  .detail{position:absolute;inset:0;z-index:10;background:#101017;transform:translateX(101%);will-change:transform;box-shadow:-24px 0 60px rgba(0,0,0,.5)}
  .backbtn{background:none;border:none;color:var(--accent);font:inherit;font-size:14px;cursor:pointer;display:flex;align-items:center;gap:5px;padding:0}
  .detail .hero{height:250px;background-size:cover;background-position:center}
  .detail .body{padding:20px 22px}
  .detail h2{font-family:'Instrument Serif',serif;font-weight:400;font-size:26px}
  .detail .k{font-family:'Space Mono',monospace;font-size:10px;color:var(--accent);letter-spacing:.12em;margin:6px 0 14px}
  .detail p{color:var(--mut);font-size:13.5px;line-height:1.7;margin-bottom:12px}
  .edgezone-hint{position:absolute;left:0;top:50%;transform:translateY(-50%);width:4px;height:90px;border-radius:0 4px 4px 0;background:linear-gradient(180deg,transparent,var(--accent),transparent);opacity:.5;z-index:12;animation:ehint 2.4s ease-in-out infinite;pointer-events:none}
  @keyframes ehint{0%,100%{opacity:.15}50%{opacity:.6}}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">73 / Back-Swipe</span>
  </nav>
  <div class="caption">
    <b>The iOS back gesture.</b> Open a row: the detail slides over while the list parallaxes to −30% under a dim. Then drag from the left edge — the detail follows your finger 1:1 while the list slides back into daylight in counter-motion. Velocity or half-way decides the pop.
  </div>

  <div class="stage">
    <div class="phone">
      <div class="pnotch"></div>

      <div class="screen" id="list">
        <div class="bar"><h1>Case studies</h1></div>
        <div id="rows"></div>
      </div>
      <div class="dimmer" id="dimmer"></div>

      <div class="detail" id="detail">
        <div class="bar" style="padding:56px 22px 10px"><button class="backbtn" id="back">‹ Studies</button></div>
        <div class="hero" id="dHero"></div>
        <div class="body">
          <h2 id="dTitle"></h2>
          <div class="k" id="dK"></div>
          <p>Slide your finger from the very left edge of the screen — the previous screen is already there, waiting underneath at 70% of the journey.</p>
          <p>That counter-parallax is the whole illusion: two screens moving at different rates read as physical layers, not a route change.</p>
        </div>
        <div class="edgezone-hint"></div>
      </div>
      <div class="phome"></div>
    </div>
  </div>

  <script src="vendor/gsap.min.js"></script>
  <script>
    const buzz = ms => navigator.vibrate && navigator.vibrate(ms);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const phone = document.querySelector('.phone');
    const list = document.getElementById('list');
    const detail = document.getElementById('detail');
    const dimmer = document.getElementById('dimmer');
    const ROWS = [
      ['1618005182384-a83a8bd57fbe','Aether','IDENTITY · 2026'],
      ['1620121684840-edffcfc4b878','Nocturne','WEBGL · 2026'],
      ['1635776062127-d379bfcba9f8','Form & Void','EDITORIAL · 2025'],
      ['1604871000636-074fa5117945','Kinetik','MOTION · 2025'],
      ['1633186710895-309db2eca9e4','Monolith','SPATIAL · 2025'],
      ['1550684848-fac1c5b4e853','Ember','CAMPAIGN · 2024'],
    ];
    document.getElementById('rows').innerHTML = ROWS.map((r, i) => `
      <div class="rowi" data-i="${i}"><div class="th" style="background-image:url('assets/img/photo-${r[0]}.jpg')"></div>
      <div><h3>${r[1]}</h3><p>${r[2]}</p></div><span class="chev">›</span></div>`).join('');

    let open = false, p = 0, anim = null; // p: 0 list … 1 detail
    const W = () => phone.clientWidth;

    function render(){
      detail.style.transform = `translateX(${(1 - p) * 101}%)`;
      list.style.transform = `translateX(${p * -30}%)`;
      dimmer.style.opacity = p * .45;
    }
    function settle(toOpen, fling){
      anim && anim.kill();
      buzz(8);
      open = toOpen;
      anim = gsap.to({ v: p }, { v: toOpen ? 1 : 0, duration: reduced ? 0 : (fling ? .28 : .45),
        ease: toOpen ? 'power3.out' : 'power3.inOut',
        onUpdate(){ p = this.targets()[0].v; render(); } });
    }

    document.querySelectorAll('.rowi').forEach(row => row.addEventListener('click', () => {
      const r = ROWS[+row.dataset.i];
      document.getElementById('dHero').style.backgroundImage = `url('assets/img/photo-${r[0]}.jpg')`;
      document.getElementById('dTitle').textContent = r[1];
      document.getElementById('dK').textContent = r[2] + ' · SWIPE FROM THE LEFT EDGE TO GO BACK';
      settle(true, false);
    }));
    document.getElementById('back').addEventListener('click', () => settle(false, false));

    /* the edge gesture */
    let dragging = false, sx = 0, lastX = 0, lastT = 0, vx = 0;
    phone.addEventListener('pointerdown', e => {
      if(!open || anim && anim.isActive() && p < 1) return;
      const r = phone.getBoundingClientRect();
      if(e.clientX - r.left > 32) return;               // must start at the edge
      dragging = true; sx = e.clientX; lastX = e.clientX; lastT = performance.now(); vx = 0;
      phone.setPointerCapture(e.pointerId);
      anim && anim.kill();
    });
    phone.addEventListener('pointermove', e => {
      if(!dragging) return;
      const now = performance.now();
      vx = (e.clientX - lastX) / Math.max(1, now - lastT) * 1000;
      lastX = e.clientX; lastT = now;
      p = gsap.utils.clamp(0, 1, 1 - (e.clientX - sx) / W());
      render();
    });
    const up = () => {
      if(!dragging) return; dragging = false;
      if(vx > 350) settle(false, true);
      else if(vx < -350) settle(true, true);
      else settle(p > .5, false);
    };
    phone.addEventListener('pointerup', up);
    phone.addEventListener('pointercancel', up);

    render();
  </script>
</body>
</html>
```