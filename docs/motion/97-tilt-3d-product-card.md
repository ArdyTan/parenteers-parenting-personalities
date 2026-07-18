# Technique 97 — Tilt 3D Product Card

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** Mobile · Sensors · CSS
**Dependencies:** `vendor/gsap.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

Pointer or gyro drives rotateX/Y on a preserve-3d card while a specular glare and holographic sheen track the tilt independently; content rides raised translateZ layers for depth.

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

## Full working source (`97.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
<title>97 — Tilt 3D Product Card</title>
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

  .screen{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 30px;perspective:900px}
  .tiltcard{position:relative;width:100%;aspect-ratio:.72;border-radius:24px;transform-style:preserve-3d;will-change:transform;background:linear-gradient(150deg,#20202c,#101015)}
  .tiltcard .art{position:absolute;inset:0;border-radius:24px;overflow:hidden}
  .tiltcard .art img{width:100%;height:100%;object-fit:cover;transform:translateZ(0)}
  .tiltcard .art::after{content:"";position:absolute;inset:0;background:linear-gradient(transparent 50%,rgba(0,0,0,.7))}
  /* the moving specular glare */
  .glare{position:absolute;inset:0;border-radius:24px;background:radial-gradient(circle at var(--gx,50%) var(--gy,25%),rgba(255,255,255,.5),rgba(255,255,255,.12) 22%,transparent 45%);mix-blend-mode:overlay;pointer-events:none}
  .holo{position:absolute;inset:0;border-radius:24px;background:linear-gradient(115deg,transparent 30%,rgba(200,255,0,.25),rgba(157,123,255,.25),transparent 70%);background-size:200% 200%;mix-blend-mode:color-dodge;opacity:.5;pointer-events:none;background-position:var(--hx,50%) 50%}
  .content{position:absolute;left:22px;bottom:20px;transform:translateZ(50px);z-index:3}
  .content .tag{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.16em;color:var(--accent)}
  .content h2{font-family:'Instrument Serif',serif;font-weight:400;font-size:32px;line-height:1;margin-top:6px}
  .content p{font-size:12px;color:rgba(244,241,234,.7);margin-top:4px}
  .badge{position:absolute;top:18px;right:18px;transform:translateZ(70px);background:var(--accent);color:#101204;font-family:'Space Mono',monospace;font-size:10px;font-weight:700;letter-spacing:.06em;padding:7px 12px;border-radius:20px;z-index:3}
  .perm{position:absolute;left:50%;bottom:56px;transform:translateX(-50%);z-index:20;background:none;border:1px solid #26262e;border-radius:24px;color:var(--accent);font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.08em;padding:11px 18px;cursor:pointer}
  .hint{position:absolute;left:50%;top:60px;transform:translateX(-50%);z-index:6;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.14em;color:var(--mut);pointer-events:none}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">97 / Tilt 3D Card</span>
  </nav>
  <div class="caption">
    <b>A card that catches the light.</b> Pointer (or gyro) drives <code>rotateX/Y</code> on a preserve-3d card while a specular glare and a holographic sheen track the tilt independently — content sits on raised <code>translateZ</code> layers for real depth. On a phone, tilt to move the light.
  </div>

  <div class="stage">
    <div class="phone">
      <div class="pnotch"></div>
      <div class="hint">MOVE THE POINTER — OR TILT THE PHONE</div>
      <div class="screen" id="screen">
        <div class="tiltcard" id="card">
          <div class="art"><img src="assets/img/photo-1604871000636-074fa5117945.jpg" draggable="false"></div>
          <div class="holo" id="holo"></div>
          <div class="glare" id="glare"></div>
          <span class="badge">LIMITED</span>
          <div class="content"><div class="tag">MOTION SERIES · 01/50</div><h2>Kinetik</h2><p>Holographic edition</p></div>
        </div>
      </div>
      <button class="perm" id="perm">✦ Enable tilt</button>
      <div class="phome"></div>
    </div>
  </div>

  <script src="vendor/gsap.min.js"></script>
  <script>
    const buzz = ms => navigator.vibrate && navigator.vibrate(ms);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const card = document.getElementById('card');
    const glare = document.getElementById('glare');
    const holo = document.getElementById('holo');
    const screen = document.getElementById('screen');
    let tx = 0, ty = 0, cx = 0, cy = 0;   // target + current tilt, -1..1

    gsap.ticker.add(() => {
      cx += (tx - cx) * 0.1;
      cy += (ty - cy) * 0.1;
      const rotY = cx * 18, rotX = -cy * 18;
      card.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg)`;
      // glare tracks the "light" from top; opposite the tilt
      glare.style.setProperty('--gx', (50 - cx * 40) + '%');
      glare.style.setProperty('--gy', (25 - cy * 30) + '%');
      holo.style.setProperty('--hx', (50 + cx * 60) + '%');
    });

    screen.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      tx = gsap.utils.clamp(-1, 1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2));
      ty = gsap.utils.clamp(-1, 1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2));
    });
    screen.addEventListener('pointerleave', () => {
      gsap.to({ x: tx, y: ty }, { x: 0, y: 0, duration: .8, ease: 'power2.out', onUpdate(){ tx = this.targets()[0].x; ty = this.targets()[0].y; } });
    });

    function onOrient(e){
      tx = gsap.utils.clamp(-1, 1, (e.gamma || 0) / 30);
      ty = gsap.utils.clamp(-1, 1, ((e.beta || 0) - 45) / 30);
    }
    const perm = document.getElementById('perm');
    const needsPermission = typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function';
    if(!('DeviceOrientationEvent' in window)){ perm.style.display = 'none'; }
    perm.addEventListener('click', async () => {
      if(needsPermission){
        try { const r = await DeviceOrientationEvent.requestPermission(); if(r === 'granted'){ addEventListener('deviceorientation', onOrient); perm.style.display = 'none'; buzz(10); } } catch {}
      } else { addEventListener('deviceorientation', onOrient); perm.style.display = 'none'; buzz(10); }
    });
  </script>
</body>
</html>
```