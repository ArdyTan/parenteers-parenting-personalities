# Technique 71 — Splash → Hero Launch

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** Mobile · GSAP
**Dependencies:** `vendor/gsap.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

The app-launch moment: the splash logo FLIP-flies into the header brand mark (position, scale, radius) while the splash sinks away and the UI cascades in from where it landed.

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

## Full working source (`71.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
<title>71 — Splash → Hero Launch</title>
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

  /* the app underneath */
  .appbar{padding:58px 22px 12px;display:flex;align-items:center;gap:10px}
  .brandmark{width:30px;height:30px;border-radius:9px;background:var(--accent);display:grid;place-items:center;color:#101204;font-size:16px;font-weight:700}
  .appbar h1{font-family:'Instrument Serif',serif;font-weight:400;font-size:22px}
  .appbar .replay{margin-left:auto;background:none;border:1px solid #26262e;border-radius:20px;color:var(--accent);font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.1em;padding:8px 14px;cursor:pointer}
  .card{margin:0 18px 14px;background:#15151b;border:1px solid #1f1f28;border-radius:16px;overflow:hidden}
  .card .ph{height:140px;background-size:cover;background-position:center}
  .card .tx{padding:13px 16px}
  .card h3{font-size:14.5px;font-weight:500}
  .card p{font-family:'Space Mono',monospace;font-size:10px;color:var(--mut);letter-spacing:.08em;margin-top:4px}
  .tabs{position:absolute;left:16px;right:16px;bottom:24px;height:60px;background:rgba(22,22,29,.92);backdrop-filter:blur(16px);border:1px solid #23232b;border-radius:22px;display:flex;z-index:10}
  .tabs span{flex:1;display:grid;place-items:center;font-size:17px;color:var(--mut)}
  .tabs span:first-child{color:var(--accent)}

  /* splash on top */
  .splash{position:absolute;inset:0;z-index:40;background:var(--accent);display:grid;place-items:center}
  .biglogo{width:92px;height:92px;border-radius:26px;background:#101204;display:grid;place-items:center;color:var(--accent);font-size:50px;font-weight:700;will-change:transform}
  .splash .wordmark{position:absolute;bottom:70px;left:0;width:100%;text-align:center;font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.3em;color:rgba(16,18,4,.65)}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">71 / App Launch</span>
  </nav>
  <div class="caption">
    <b>The launch is the first animation.</b> The splash logo doesn't cut away — it FLIP-flies into the header's brand mark (position + scale + radius), the splash sinks away beneath it, and the UI cascades in from the point it landed. One continuous thought, ~1.2s.
  </div>

  <div class="stage">
    <div class="phone">
      <div class="pnotch"></div>

      <div class="appbar"><div class="brandmark" id="mark">✳</div><h1 id="brandT">Motion Daily</h1><button class="replay" id="replay">↻ REPLAY</button></div>
      <div id="feed"></div>
      <div class="tabs" id="tabs"><span>⌂</span><span>◎</span><span>♥</span><span>▤</span></div>

      <div class="splash" id="splash">
        <div class="biglogo" id="biglogo">✳</div>
        <div class="wordmark">MOTION DAILY — EST. 2026</div>
      </div>
      <div class="phome"></div>
    </div>
  </div>

  <script src="vendor/gsap.min.js"></script>
  <script>
    const buzz = ms => navigator.vibrate && navigator.vibrate(ms);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const POSTS = [
      ['1620121684840-edffcfc4b878','The WebGL hero shipped','TODAY · NOCTURNE'],
      ['1618556450991-2f1af64e8191','Drift: motion study 04','YESTERDAY · LAB'],
      ['1550684848-fac1c5b4e853','Ember campaign wrap','THIS WEEK · CASE'],
    ];
    document.getElementById('feed').innerHTML = POSTS.map(p => `
      <div class="card"><div class="ph" style="background-image:url('assets/img/photo-${p[0]}.jpg')"></div>
      <div class="tx"><h3>${p[1]}</h3><p>${p[2]}</p></div></div>`).join('');

    const splash = document.getElementById('splash');
    const biglogo = document.getElementById('biglogo');
    const mark = document.getElementById('mark');
    const phone = document.querySelector('.phone');

    function launch(){
      const cards = document.querySelectorAll('.card');
      const p = phone.getBoundingClientRect();
      // reset
      splash.style.display = 'grid';
      gsap.set(splash, { opacity: 1, y: 0 });
      gsap.set(biglogo, { x: 0, y: 0, scale: 1, opacity: 1, borderRadius: 26 });
      gsap.set(mark, { opacity: 0 });
      gsap.set(['.appbar h1', '.appbar .replay'], { opacity: 0, y: 8 });
      gsap.set(cards, { opacity: 0, y: 34 });
      gsap.set('#tabs', { y: 110 });

      const b = biglogo.getBoundingClientRect();
      const m = mark.getBoundingClientRect();
      const dx = (m.left + m.width / 2) - (b.left + b.width / 2);
      const dy = (m.top + m.height / 2) - (b.top + b.height / 2);
      const s = m.width / b.width;

      buzz(10);
      gsap.timeline()
        .to(biglogo, { scale: 1.12, duration: reduced ? 0 : .3, ease: 'power2.out', delay: .35 })       // breathe
        .to(biglogo, { x: dx, y: dy, scale: s, borderRadius: 9 / s, duration: reduced ? 0 : .65, ease: 'expo.inOut' })
        .to(splash, { opacity: 0, y: 26, duration: reduced ? 0 : .45, ease: 'power2.inOut',
          onComplete(){ splash.style.display = 'none'; gsap.set(mark, { opacity: 1 }); } }, '-=.38')
        .to('.appbar h1', { opacity: 1, y: 0, duration: reduced ? 0 : .4, ease: 'power3.out' }, '-=.25')
        .to('.appbar .replay', { opacity: 1, y: 0, duration: .3 }, '<.05')
        .to(cards, { opacity: 1, y: 0, stagger: .09, duration: reduced ? 0 : .55, ease: 'power3.out' }, '<')
        .to('#tabs', { y: 0, duration: reduced ? 0 : .55, ease: 'back.out(1.3)' }, '<.1');
    }

    document.getElementById('replay').addEventListener('click', launch);
    document.fonts && document.fonts.ready ? document.fonts.ready.then(launch) : launch();
  </script>
</body>
</html>
```