# Technique 64 — Springy Segmented Control

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** Mobile · Navigation · GSAP
**Dependencies:** `vendor/gsap.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

Tap a segment or grab the thumb and fling it: it stretches while held, projects by release velocity, and settles with an elastic overshoot while content slides in from your direction.

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

## Full working source (`64.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
<title>64 — Springy Segmented Control</title>
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

  .appbar{padding:58px 24px 14px}
  .appbar h1{font-family:'Instrument Serif',serif;font-weight:400;font-size:26px}
  .appbar p{font-family:'Space Mono',monospace;font-size:10px;color:var(--mut);letter-spacing:.12em;margin-top:5px}

  .segwrap{padding:6px 20px 0}
  .seg{position:relative;display:flex;background:#16161d;border:1px solid #23232b;border-radius:16px;padding:4px;touch-action:none;user-select:none}
  .thumb{position:absolute;top:4px;left:4px;height:calc(100% - 8px);border-radius:12px;background:#2a2a35;box-shadow:0 4px 14px rgba(0,0,0,.4);will-change:transform}
  .thumb::after{content:"";position:absolute;left:50%;top:6px;transform:translateX(-50%);width:14px;height:2.5px;border-radius:2px;background:var(--accent);opacity:.9}
  .seg button{position:relative;flex:1;background:none;border:none;color:var(--mut);font:inherit;font-size:13px;font-weight:500;padding:12px 0 10px;cursor:pointer;z-index:1;transition:color .25s;-webkit-tap-highlight-color:transparent}
  .seg button.on{color:var(--fg)}

  .cards{position:relative;padding:22px 20px}
  .cardp{position:absolute;left:20px;right:20px;top:22px;opacity:0;pointer-events:none;will-change:transform,opacity}
  .cardp.on{opacity:1;pointer-events:auto}
  .tile{background:#15151b;border:1px solid #1f1f28;border-radius:16px;overflow:hidden;margin-bottom:12px}
  .tile .ph{height:130px;background-size:cover;background-position:center}
  .tile .tx{padding:13px 16px}
  .tile h3{font-size:14.5px;font-weight:500}
  .tile p{font-family:'Space Mono',monospace;font-size:10px;color:var(--mut);letter-spacing:.08em;margin-top:4px}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">64 / Segmented Control</span>
  </nav>
  <div class="caption">
    <b>A thumb you can throw.</b> Tap a segment or <i>drag</i> the thumb itself — it stretches while held, tracks your finger with a lerp, and settles onto the nearest segment with an elastic overshoot. Content slides in from the direction you came from.
  </div>

  <div class="stage">
    <div class="phone">
      <div class="pnotch"></div>
      <div class="appbar"><h1>Collection</h1><p>TAP A SEGMENT — OR GRAB THE THUMB AND FLING IT</p></div>
      <div class="segwrap">
        <div class="seg" id="seg">
          <div class="thumb" id="thumb"></div>
          <button class="on">All</button><button>Motion</button><button>WebGL</button>
        </div>
      </div>
      <div class="cards" id="cards"></div>
      <div class="phome"></div>
    </div>
  </div>

  <script src="vendor/gsap.min.js"></script>
  <script>
    const buzz = ms => navigator.vibrate && navigator.vibrate(ms);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const seg = document.getElementById('seg');
    const thumb = document.getElementById('thumb');
    const btns = [...seg.querySelectorAll('button')];
    const cards = document.getElementById('cards');

    const PAGES = [
      [['1618005182384-a83a8bd57fbe','Everything, curated','12 PIECES · ALL DISCIPLINES'],['1633186710895-309db2eca9e4','Latest drop','ADDED THIS WEEK']],
      [['1604871000636-074fa5117945','Kinetic identities','5 PIECES · PURE MOTION'],['1618556450991-2f1af64e8191','Easing studies','SPRINGS & OVERSHOOTS']],
      [['1620121684840-edffcfc4b878','Shader work','4 PIECES · GPU ONLY'],['1635776062127-d379bfcba9f8','Particle fields','30K POINTS AND UP']],
    ];
    PAGES.forEach((pg, i) => {
      const el = document.createElement('div');
      el.className = 'cardp' + (i ? '' : ' on');
      el.innerHTML = pg.map(t => `<div class="tile"><div class="ph" style="background-image:url('assets/img/photo-${t[0]}.jpg')"></div>
        <div class="tx"><h3>${t[1]}</h3><p>${t[2]}</p></div></div>`).join('');
      cards.appendChild(el);
    });
    const pages = [...cards.children];

    let cur = 0, x = 0, targetX = 0, dragging = false, held = false;
    const slotW = () => (seg.clientWidth - 8) / btns.length;
    const slotX = i => 4 + i * slotW();

    function setActive(i, dir){
      if(i === cur) return;
      buzz(8);
      btns.forEach((b, k) => b.classList.toggle('on', k === i));
      gsap.to(pages[cur], { opacity: 0, x: -22 * dir, duration: reduced ? 0 : .2, ease: 'power2.in',
        onComplete(){ pages.forEach((p, k) => p.classList.toggle('on', k === i)); } });
      gsap.fromTo(pages[i], { opacity: 0, x: 22 * dir }, { opacity: 1, x: 0, duration: reduced ? 0 : .35, ease: 'power3.out', delay: .12 });
      cur = i;
    }

    function snapTo(i, fling){
      const dir = i > cur ? 1 : i < cur ? -1 : 1;
      setActive(i, dir);
      targetX = slotX(i);
      gsap.to({ v: x }, { v: targetX, duration: reduced ? 0 : (fling ? .65 : .5), ease: 'elastic.out(1,.55)',
        onUpdate(){ x = this.targets()[0].v; draw(); } });
      gsap.to(thumb, { scaleX: 1, scaleY: 1, duration: .4, ease: 'elastic.out(1,.5)' });
      held = false;
    }
    function draw(){ thumb.style.width = slotW() + 'px'; thumb.style.transform = `translateX(${x - 4}px)`; }

    btns.forEach((b, i) => b.addEventListener('click', () => { if(!dragging) snapTo(i, false); }));

    /* grab the thumb directly */
    let sx = 0, ox = 0, lastX = 0, lastT = 0, vx = 0;
    seg.addEventListener('pointerdown', e => {
      const r = thumb.getBoundingClientRect();
      if(e.clientX < r.left - 8 || e.clientX > r.right + 8) return; // taps handled by buttons
      dragging = true; held = true;
      sx = e.clientX; ox = x; lastX = e.clientX; lastT = performance.now(); vx = 0;
      seg.setPointerCapture(e.pointerId);
      gsap.to(thumb, { scaleX: 1.12, scaleY: .9, duration: .2, ease: 'power2.out' });
      buzz(6);
    });
    seg.addEventListener('pointermove', e => {
      if(!dragging) return;
      const now = performance.now();
      vx = (e.clientX - lastX) / Math.max(1, now - lastT) * 1000;
      lastX = e.clientX; lastT = now;
      x = gsap.utils.clamp(4, 4 + slotW() * (btns.length - 1), ox + (e.clientX - sx));
      draw();
      // live preview: highlight the slot under the thumb
      const hover = Math.round((x - 4) / slotW());
      btns.forEach((b, k) => b.classList.toggle('on', k === hover));
    });
    const up = () => {
      if(!dragging) return; dragging = false;
      // fling: project position by velocity, then snap
      const proj = x + vx * .12;
      const i = gsap.utils.clamp(0, btns.length - 1, Math.round((proj - 4) / slotW()));
      snapTo(i, Math.abs(vx) > 400);
    };
    seg.addEventListener('pointerup', up);
    seg.addEventListener('pointercancel', up);

    const measure = () => { x = targetX = slotX(cur); draw(); };
    measure();
    addEventListener('resize', measure);
    document.fonts && document.fonts.ready.then(measure);
  </script>
</body>
</html>
```