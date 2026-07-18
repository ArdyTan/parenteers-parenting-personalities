# Technique 53 — Bottom Sheet

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** Mobile · GSAP
**Dependencies:** `vendor/gsap.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

Drag between peek / half / full snap points — a fast flick beats distance, the ends rubber-band with the iOS resistance curve, and the map scrim fades with height.

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

## Full working source (`53.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
<title>53 — Bottom Sheet</title>
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

  /* the "map" behind */
  .mapbg{position:absolute;inset:0;background:url('assets/img/photo-1614851099511-773084f6911d.jpg') center/cover;filter:saturate(.8) brightness(.85)}
  .mapbg::after{content:"";position:absolute;left:46%;top:38%;width:16px;height:16px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 6px rgba(200,255,0,.25),0 4px 14px rgba(0,0,0,.5)}
  .searchpill{position:absolute;top:58px;left:20px;right:20px;height:46px;border-radius:24px;background:rgba(14,14,19,.82);backdrop-filter:blur(12px);display:flex;align-items:center;gap:10px;padding:0 18px;font-size:14px;color:var(--mut);z-index:3}
  .scrim{position:absolute;inset:0;background:#000;opacity:0;pointer-events:none;z-index:4}

  /* the sheet */
  .sheet{position:absolute;left:0;width:100%;top:0;height:100%;z-index:5;background:#15151b;border-radius:22px 22px 0 0;box-shadow:0 -12px 40px rgba(0,0,0,.5);will-change:transform;touch-action:none}
  .grab{padding:10px 0 4px;display:grid;place-items:center;cursor:grab}
  .grab i{width:42px;height:5px;border-radius:3px;background:#33333d;transition:background .2s}
  .sheet.dragging .grab i{background:var(--accent)}
  .sheet header{padding:6px 22px 14px;border-bottom:1px solid #202028}
  .sheet header h2{font-family:'Instrument Serif',serif;font-weight:400;font-size:24px}
  .sheet header p{font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.1em;color:var(--mut);margin-top:4px}
  .list{padding:8px 22px 120px;height:calc(100% - 90px);overflow-y:auto;overscroll-behavior:contain}
  .row{display:flex;gap:14px;align-items:center;padding:14px 0;border-bottom:1px solid #1c1c24}
  .row .ph{width:52px;height:52px;border-radius:12px;background-size:cover;background-position:center;flex-shrink:0}
  .row h3{font-size:15px;font-weight:500}
  .row p{font-family:'Space Mono',monospace;font-size:10.5px;color:var(--mut);letter-spacing:.06em;margin-top:3px}
  .row .dist{margin-left:auto;font-family:'Space Mono',monospace;font-size:11px;color:var(--accent)}
  .snapLbl{position:absolute;right:16px;top:50%;transform:translateY(-50%);z-index:6;display:flex;flex-direction:column;gap:26px;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.1em;color:#3f3f49;pointer-events:none}
  .snapLbl span.on{color:var(--accent)}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">53 / Bottom Sheet</span>
  </nav>
  <div class="caption">
    <b>Snap-point bottom sheet.</b> Drag the grabber between <i>peek / half / full</i>; release picks the snap by position <b>and</b> velocity (a fast flick beats distance). Past the ends the sheet rubber-bands with the iOS resistance curve, and the map scrim fades with height.
  </div>

  <div class="stage">
    <div class="phone">
      <div class="pnotch"></div>
      <div class="mapbg"></div>
      <div class="searchpill">⌕&nbsp; Search this area…</div>
      <div class="scrim" id="scrim"></div>
      <div class="snapLbl"><span data-s="2">FULL</span><span data-s="1">HALF</span><span data-s="0">PEEK</span></div>

      <div class="sheet" id="sheet">
        <div class="grab" id="grab"><i></i></div>
        <header><h2>Nearby studios</h2><p id="stateLbl">PEEK — DRAG ME UP</p></header>
        <div class="list" id="list"></div>
      </div>
      <div class="phome"></div>
    </div>
  </div>

  <script src="vendor/gsap.min.js"></script>
  <script>
    const buzz = ms => navigator.vibrate && navigator.vibrate(ms);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const phone = document.querySelector('.phone');
    const sheet = document.getElementById('sheet');
    const scrim = document.getElementById('scrim');
    const stateLbl = document.getElementById('stateLbl');
    const snapSpans = [...document.querySelectorAll('.snapLbl span')];

    // demo data
    const IMGS = ['1618005182384-a83a8bd57fbe','1620121684840-edffcfc4b878','1635776062127-d379bfcba9f8','1604871000636-074fa5117945','1633186710895-309db2eca9e4','1550684848-fac1c5b4e853','1557672172-298e090bd0f1','1618556450991-2f1af64e8191'];
    const NAMES = ['Aether Studio','Nocturne Lab','Void Works','Kinetik Co','Monolith','Ember Haus','Relic Atelier','Drift Space'];
    document.getElementById('list').innerHTML = IMGS.map((id, i) => `
      <div class="row"><div class="ph" style="background-image:url('assets/img/photo-${id}.jpg')"></div>
      <div><h3>${NAMES[i]}</h3><p>OPEN · MOTION DESIGN</p></div><span class="dist">${(i * .7 + .4).toFixed(1)} KM</span></div>`).join('');

    /* snap points measured as the sheet's translateY from the top of the phone */
    let H, SNAPS; // [full, half, peek] in y-px
    function measure(){
      H = phone.clientHeight;
      SNAPS = [H * .08, H * .48, H - 128]; // full, half, peek
      y = SNAPS[state]; render();
    }
    let state = 2;              // start at peek (index into SNAPS: 0 full, 1 half, 2 peek)
    let y = 0;

    const NAMES_S = ['FULL — SWIPE DOWN TO CLOSE','HALF — KEEP GOING','PEEK — DRAG ME UP'];
    function render(){
      sheet.style.transform = `translateY(${y}px)`;
      // scrim: 0 at peek → .5 at full
      const p = gsap.utils.clamp(0, 1, (SNAPS[2] - y) / (SNAPS[2] - SNAPS[0]));
      scrim.style.opacity = p * .5;
      scrim.style.pointerEvents = 'none';
    }
    function setState(s, animate = true){
      state = s;
      stateLbl.textContent = NAMES_S[s];
      snapSpans.forEach(sp => sp.classList.toggle('on', +sp.dataset.s === 2 - s));
      buzz(8);
      if(reduced || !animate){ y = SNAPS[s]; render(); return; }
      gsap.to({ v: y }, { v: SNAPS[s], duration: .55, ease: 'back.out(1.1)',
        onUpdate(){ y = this.targets()[0].v; render(); } });
    }

    /* iOS rubber-band: y = x·c/(c+x) */
    const rubber = (excess, c = 120) => excess * c / (c + excess);

    let dragging = false, startY = 0, startSheetY = 0, lastY = 0, lastT = 0, vy = 0;
    const grab = document.getElementById('grab');
    const surfaces = [grab, sheet.querySelector('header')];
    surfaces.forEach(s => s.addEventListener('pointerdown', e => {
      dragging = true; startY = e.clientY; startSheetY = y; lastY = e.clientY; lastT = performance.now();
      sheet.classList.add('dragging');
      s.setPointerCapture(e.pointerId);
      gsap.killTweensOf('*');
    }));
    addEventListener('pointermove', e => {
      if(!dragging) return;
      const now = performance.now();
      vy = (e.clientY - lastY) / Math.max(1, now - lastT) * 1000;
      lastY = e.clientY; lastT = now;
      let ny = startSheetY + (e.clientY - startY);
      if(ny < SNAPS[0]) ny = SNAPS[0] - rubber(SNAPS[0] - ny);       // stretching past full
      if(ny > SNAPS[2]) ny = SNAPS[2] + rubber(ny - SNAPS[2]);       // squashing past peek
      y = ny; render();
    });
    addEventListener('pointerup', () => {
      if(!dragging) return; dragging = false;
      sheet.classList.remove('dragging');
      // velocity wins: a decisive flick goes one snap in its direction
      if(Math.abs(vy) > 500){
        const dir = vy > 0 ? 1 : -1;
        setState(gsap.utils.clamp(0, 2, state + dir));
      } else {
        // otherwise nearest snap
        let best = 0, bd = 1e9;
        SNAPS.forEach((s, i) => { const d = Math.abs(y - s); if(d < bd){ bd = d; best = i; } });
        setState(best);
      }
      vy = 0;
    });

    measure();
    addEventListener('resize', measure);
    setState(2, false);
  </script>
</body>
</html>
```