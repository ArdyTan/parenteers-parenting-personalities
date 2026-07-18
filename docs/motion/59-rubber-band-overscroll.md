# Technique 59 — Rubber-Band Overscroll

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** Mobile · GSAP
**Dependencies:** `vendor/gsap.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

The iOS elastic edge, annotated: overscroll runs through y = x·c/(c+x) so resistance grows with the pull; a HUD shows raw vs applied pixels, edges glow, release springs home.

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

## Full working source (`59.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
<title>59 — Rubber-Band Overscroll</title>
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

  .scroller{position:absolute;inset:0;touch-action:none;cursor:grab;overflow:hidden}
  .scroller:active{cursor:grabbing}
  .content{position:absolute;left:0;top:0;width:100%;padding:64px 22px 60px;will-change:transform}
  .content h1{font-family:'Instrument Serif',serif;font-weight:400;font-size:34px;line-height:1;margin-bottom:6px}
  .content .sub{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.12em;color:var(--mut);margin-bottom:22px}
  .block{background:#15151b;border:1px solid #1f1f28;border-radius:16px;padding:18px;margin-bottom:12px}
  .block h3{font-size:15px;font-weight:500}
  .block p{font-size:13px;color:var(--mut);line-height:1.6;margin-top:6px}
  .block .ph{height:120px;border-radius:10px;background-size:cover;background-position:center;margin-bottom:12px}

  .glow{position:absolute;left:0;width:100%;height:110px;pointer-events:none;opacity:0;z-index:10}
  .glow.top{top:0;background:radial-gradient(120% 100% at 50% 0%,rgba(200,255,0,.28),transparent 70%)}
  .glow.bot{bottom:0;background:radial-gradient(120% 100% at 50% 100%,rgba(200,255,0,.28),transparent 70%)}

  .hud{position:absolute;right:14px;top:64px;z-index:20;background:rgba(16,16,22,.85);backdrop-filter:blur(10px);border:1px solid #23232b;border-radius:12px;padding:12px 14px;font-family:'Space Mono',monospace;font-size:9.5px;letter-spacing:.06em;color:var(--mut);pointer-events:none;min-width:150px}
  .hud b{display:block;color:var(--accent);margin-bottom:6px;font-weight:400}
  .hud .v{color:var(--fg)}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">59 / Rubber-Band</span>
  </nav>
  <div class="caption">
    <b>The iOS elastic edge, annotated.</b> A transform scroller with flick momentum; past either end, displacement is remapped through <code>y = x·c/(c+x)</code> so resistance grows with the pull — the HUD shows your raw pull vs what's applied. Release springs back; edges glow with overscroll.
  </div>

  <div class="stage">
    <div class="phone">
      <div class="pnotch"></div>
      <div class="scroller" id="scroller"><div class="content" id="content">
        <h1>Elastic edges</h1>
        <div class="sub">DRAG PAST EITHER END — WATCH THE HUD</div>
      </div></div>
      <div class="glow top" id="glowT"></div>
      <div class="glow bot" id="glowB"></div>
      <div class="hud"><b>OVERSCROLL</b>
        RAW PULL <span class="v" id="hRaw">0</span>px<br>
        APPLIED <span class="v" id="hApp">0</span>px<br>
        c (GIVE) <span class="v">120</span>px<br>
        VELOCITY <span class="v" id="hVel">0</span>px/s
      </div>
      <div class="phome"></div>
    </div>
  </div>

  <script src="vendor/gsap.min.js"></script>
  <script>
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scroller = document.getElementById('scroller');
    const content = document.getElementById('content');
    const IMGS = ['1618005182384-a83a8bd57fbe','1620121684840-edffcfc4b878','1635776062127-d379bfcba9f8','1604871000636-074fa5117945','1633186710895-309db2eca9e4'];
    const COPY = [
      ['Why native feels native', 'Because edges push back. A hard clamp reads as broken; graded resistance reads as physical.'],
      ['The curve', 'y = x·c/(c+x). At small pulls it tracks your finger ~1:1, then asymptotes toward c — you can never drag past the give.'],
      ['The spring back', 'On release the offset tweens home with an ease-out — no bounce needed, the resistance already told the story.'],
      ['Momentum', 'Velocity is sampled from the last pointer deltas and decays by ~6% a frame — flick and let it run into the edge.'],
      ['Steal it', 'This exact scroller powers pull-to-refresh (54) and the bottom sheet (53). One curve, three techniques.'],
    ];
    content.innerHTML += COPY.map((c, i) => `
      <div class="block"><div class="ph" style="background-image:url('assets/img/photo-${IMGS[i]}.jpg')"></div>
      <h3>${c[0]}</h3><p>${c[1]}</p></div>`).join('');

    const C = 120;
    const rubber = x => x * C / (C + x);
    let y = 0, vy = 0, dragging = false, sy = 0, oy = 0, lastY = 0, lastT = 0;
    const minY = () => Math.min(0, scroller.clientHeight - content.offsetHeight);

    scroller.addEventListener('pointerdown', e => {
      dragging = true; sy = e.clientY; oy = y; lastY = e.clientY; lastT = performance.now(); vy = 0;
      scroller.setPointerCapture(e.pointerId);
    });
    scroller.addEventListener('pointermove', e => {
      if(!dragging) return;
      const now = performance.now();
      vy = (e.clientY - lastY) / Math.max(1, now - lastT) * 1000;
      lastY = e.clientY; lastT = now;
      y = oy + (e.clientY - sy);
    });
    const up = () => dragging = false;
    scroller.addEventListener('pointerup', up);
    scroller.addEventListener('pointercancel', up);
    scroller.addEventListener('wheel', e => { y -= e.deltaY; vy = 0; }, { passive: true });

    const hRaw = document.getElementById('hRaw'), hApp = document.getElementById('hApp'), hVel = document.getElementById('hVel');
    const glowT = document.getElementById('glowT'), glowB = document.getElementById('glowB');

    gsap.ticker.add(() => {
      const m = minY();
      if(!dragging){
        y += vy / 60; vy *= 0.94;
        // spring home from overscroll
        if(y > 0) y += (0 - y) * (reduced ? 1 : .14);
        if(y < m) y += (m - y) * (reduced ? 1 : .14);
      }
      // apply resistance to whatever part of y is out of range
      let applied = y, rawOver = 0;
      if(y > 0){ rawOver = y; applied = rubber(y); }
      else if(y < m){ rawOver = m - y; applied = m - rubber(m - y); }
      content.style.transform = `translateY(${applied}px)`;

      glowT.style.opacity = y > 0 ? Math.min(1, rubber(y) / 70) : 0;
      glowB.style.opacity = y < m ? Math.min(1, rubber(m - y) / 70) : 0;

      hRaw.textContent = Math.round(rawOver);
      hApp.textContent = Math.round(rawOver ? rubber(rawOver) : 0);
      hVel.textContent = Math.round(vy);
    });
  </script>
</body>
</html>
```