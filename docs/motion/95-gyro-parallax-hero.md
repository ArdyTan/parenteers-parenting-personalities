# Technique 95 — Gyro Parallax Hero

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** Mobile · Sensors · GSAP
**Dependencies:** `vendor/gsap.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

Layered planes shift by DeviceOrientation — background barely moves, foreground swings hardest — for real tilt-parallax depth. iOS 13+ permission tap handled; pointer drives the same lerped path on desktop.

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

## Full working source (`95.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
<title>95 — Gyro Parallax Hero</title>
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

  .scene{position:absolute;inset:0;overflow:hidden;perspective:600px}
  .layer{position:absolute;inset:-14%;will-change:transform;background-size:cover;background-position:center}
  .l-bg{background:radial-gradient(120% 90% at 50% 20%,#1a1330,#0a0a10);}
  .l-stars{background-image:radial-gradient(1.5px 1.5px at 20% 30%,#fff,transparent),radial-gradient(1px 1px at 70% 60%,#ffd9a0,transparent),radial-gradient(1.5px 1.5px at 40% 80%,#9db4ff,transparent),radial-gradient(1px 1px at 85% 25%,#fff,transparent),radial-gradient(1px 1px at 55% 45%,#fff,transparent),radial-gradient(1.5px 1.5px at 30% 65%,#fff,transparent),radial-gradient(1px 1px at 90% 75%,#ffd9a0,transparent)}
  .l-mountain{background:url('assets/img/photo-1633186710895-309db2eca9e4.jpg') center/cover;filter:brightness(.5) saturate(.8);clip-path:polygon(0 62%,18% 46%,34% 58%,52% 38%,70% 54%,86% 42%,100% 56%,100% 100%,0 100%)}
  .l-fg{background:url('assets/img/photo-1557672172-298e090bd0f1.jpg') center/cover;filter:brightness(.7);clip-path:polygon(0 82%,26% 74%,50% 84%,76% 72%,100% 80%,100% 100%,0 100%)}
  .htext{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;z-index:5;will-change:transform;pointer-events:none;mix-blend-mode:difference}
  .htext h1{font-family:'Instrument Serif',serif;font-weight:400;font-size:52px;line-height:.95}
  .htext p{margin-top:12px;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.18em}
  .glow{position:absolute;top:16%;left:50%;transform:translateX(-50%);width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(200,255,0,.35),transparent 65%);z-index:2;will-change:transform}

  .perm{position:absolute;left:50%;bottom:70px;transform:translateX(-50%);z-index:20;background:var(--accent);color:#101204;border:none;border-radius:30px;font:inherit;font-size:13px;font-weight:600;padding:14px 24px;cursor:pointer;box-shadow:0 14px 34px rgba(200,255,0,.25)}
  .hud{position:absolute;top:56px;right:20px;z-index:20;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.08em;color:var(--mut);text-align:right;pointer-events:none}
  .hud b{color:var(--accent)}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">95 / Gyro Parallax</span>
  </nav>
  <div class="caption">
    <b>Tilt the world.</b> Layered planes shift by <code>DeviceOrientation</code> — background barely moves, foreground swings hardest, so the scene gains parallax depth as you tilt the phone. iOS 13+ needs a permission tap (the button handles it); on desktop the pointer drives the same code, lerped.
  </div>

  <div class="stage">
    <div class="phone">
      <div class="pnotch"></div>
      <div class="scene" id="scene">
        <div class="layer l-bg" data-depth="0.15"></div>
        <div class="layer l-stars" data-depth="0.4"></div>
        <div class="glow" data-depth="0.6"></div>
        <div class="layer l-mountain" data-depth="0.85"></div>
        <div class="htext" data-depth="0.55"><h1>Altitude</h1><p>TILT TO EXPLORE</p></div>
        <div class="layer l-fg" data-depth="1.4"></div>
      </div>
      <div class="hud">SOURCE: <b id="src">POINTER</b><br>β <b id="beta">0</b>° · γ <b id="gamma">0</b>°</div>
      <button class="perm" id="perm">✦ Enable tilt (gyro)</button>
      <div class="phome"></div>
    </div>
  </div>

  <script src="vendor/gsap.min.js"></script>
  <script>
    const buzz = ms => navigator.vibrate && navigator.vibrate(ms);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = document.getElementById('scene');
    const layers = [...scene.querySelectorAll('[data-depth]')].map(el => ({ el, d: parseFloat(el.dataset.depth) }));
    // target normalized tilt (-1..1) and its lerped follower
    let tx = 0, ty = 0, cx = 0, cy = 0;

    function apply(){
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      layers.forEach(({ el, d }) => {
        const mult = 26 * d;
        const rot = 4 * d;
        el.style.transform = `translate3d(${-cx * mult}px, ${-cy * mult}px, 0) rotateY(${cx * rot}deg) rotateX(${-cy * rot}deg)`;
      });
    }
    gsap.ticker.add(apply);

    /* pointer fallback (desktop + any device before permission) */
    scene.addEventListener('pointermove', e => {
      const r = scene.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width * 2 - 1;
      ty = (e.clientY - r.top) / r.height * 2 - 1;
    });
    scene.addEventListener('pointerleave', () => { tx = 0; ty = 0; });

    /* device orientation */
    function onOrient(e){
      // gamma: left-right (-90..90), beta: front-back (-180..180)
      const g = (e.gamma || 0), b = (e.beta || 0);
      tx = gsap.utils.clamp(-1, 1, g / 35);
      ty = gsap.utils.clamp(-1, 1, (b - 45) / 35);   // neutral hold ≈ 45°
      document.getElementById('gamma').textContent = Math.round(g);
      document.getElementById('beta').textContent = Math.round(b);
    }
    function startGyro(){
      addEventListener('deviceorientation', onOrient);
      document.getElementById('src').textContent = 'GYRO';
      document.getElementById('perm').style.display = 'none';
      buzz(10);
    }

    const perm = document.getElementById('perm');
    // iOS 13+ requires an explicit permission request from a user gesture
    const needsPermission = typeof DeviceOrientationEvent !== 'undefined'
      && typeof DeviceOrientationEvent.requestPermission === 'function';
    if(!('DeviceOrientationEvent' in window)){
      perm.textContent = 'Gyro unavailable — pointer active';
      perm.disabled = true; perm.style.opacity = .5;
    }
    perm.addEventListener('click', async () => {
      if(needsPermission){
        try {
          const res = await DeviceOrientationEvent.requestPermission();
          if(res === 'granted') startGyro();
          else { perm.textContent = 'Permission denied'; }
        } catch { perm.textContent = 'Permission error'; }
      } else {
        startGyro();
      }
    });
  </script>
</body>
</html>
```