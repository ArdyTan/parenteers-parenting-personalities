# Technique 13 — Preloader & Counter

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** GSAP
**Dependencies:** `vendor/gsap.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

Counter preload → accent curtain wipe → staggered hero entrance. The whole first-impression sequence.

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

## Full working source (`13.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>13 — Preloader & Counter</title>
<link href="vendor/fonts.css" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  :root{--bg:#0b0b0f;--fg:#f4f1ea;--mut:#73737d;--accent:#c8ff00}
  html,body{height:100%;background:var(--bg);color:var(--fg);font-family:'Space Grotesk',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}
  .nav{position:fixed;top:0;left:0;width:100%;display:flex;justify-content:space-between;align-items:center;padding:20px 28px;z-index:1000;mix-blend-mode:difference}
  .nav a{color:var(--fg);text-decoration:none;font-size:12px;letter-spacing:.06em;text-transform:uppercase}
  .nav .id{font-size:12px;letter-spacing:.1em}
  .caption{position:fixed;left:28px;bottom:24px;max-width:340px;font-size:12px;line-height:1.55;color:var(--mut);z-index:1000;mix-blend-mode:difference}
  .caption b{color:var(--fg);font-weight:500}

  /* preloader */
  .loader{position:fixed;inset:0;z-index:900;background:var(--bg);display:flex;align-items:flex-end;justify-content:space-between;padding:7vw}
  .count{font-family:'Instrument Serif',serif;font-size:clamp(90px,26vw,360px);line-height:.8;font-weight:400}
  .count small{font-size:.22em;vertical-align:super;color:var(--mut);font-family:'Space Grotesk'}
  .loader .word{font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:var(--mut);overflow:hidden}
  .bar{position:fixed;left:0;bottom:0;height:2px;background:var(--accent);width:0;z-index:901}
  .panel{position:fixed;inset:0;background:var(--accent);z-index:899;transform:translateY(100%)}

  /* page */
  .hero{height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 7vw}
  .hero .k{font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--mut);margin-bottom:24px;overflow:hidden}
  .hero h1{font-family:'Instrument Serif',serif;font-size:clamp(44px,10vw,170px);font-weight:400;line-height:.92}
  .hero .line{overflow:hidden}
  .replay{position:fixed;right:28px;bottom:24px;z-index:1000;background:none;border:1px solid #2a2a32;color:var(--fg);padding:11px 20px;border-radius:40px;font:inherit;font-size:13px;cursor:pointer}
  .replay:hover{background:var(--fg);color:var(--bg)}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">13 / Preloader</span>
  </nav>
  <div class="caption">
    <b>Counter preload → curtain wipe → staggered entrance.</b> The whole first-impression sequence: a number counts to 100, an accent panel wipes up over the loader, then the hero copy reveals line-by-line.
  </div>

  <button class="replay" id="replay">↻ Replay</button>

  <div class="panel" id="panel"></div>
  <div class="loader" id="loader">
    <div class="count" id="count">0<small>%</small></div>
    <div class="word" id="ldword"><span>Loading experience</span></div>
  </div>
  <div class="bar" id="bar"></div>

  <main class="hero">
    <div class="k"><span>Studio · Est. 2026 · Worldwide</span></div>
    <h1>
      <span class="line"><span class="ln">Worth the</span></span>
      <span class="line"><span class="ln">wait.</span></span>
    </h1>
  </main>

  <script src="vendor/gsap.min.js"></script>
  <script>
    function run(){
      gsap.set('#panel',{yPercent:100});
      gsap.set('#loader',{autoAlpha:1});
      gsap.set('#bar',{width:0});
      gsap.set(['.ln','#ldword span'],{yPercent:110});
      gsap.set('.k span',{yPercent:110});

      const counter = { v: 0 };
      const tl = gsap.timeline();
      tl.to('#ldword span',{yPercent:0,duration:.7,ease:'expo.out'})
        .to(counter,{ v:100, duration:2.4, ease:'power2.inOut',
            onUpdate:()=>{ document.getElementById('count').innerHTML = Math.round(counter.v)+'<small>%</small>'; }
          },0)
        .to('#bar',{ width:'100%', duration:2.4, ease:'power2.inOut' },0)
        // curtain: accent panel wipes up over loader, then loader leaves upward
        .to('#ldword span',{yPercent:-110,duration:.5,ease:'power3.in'},'+=.1')
        .to('#panel',{yPercent:0,duration:.7,ease:'expo.inOut'},'-=.1')
        .set('#loader',{autoAlpha:0})
        .to('#panel',{yPercent:-100,duration:.8,ease:'expo.inOut'},'+=.05')
        // hero entrance
        .to('.k span',{yPercent:0,duration:.7,ease:'expo.out'},'-=.5')
        .to('.ln',{yPercent:0,duration:1.1,ease:'expo.out',stagger:.12},'-=.5');
    }
    run();
    document.getElementById('replay').addEventListener('click', run);
  </script>
</body>
</html>
```