# Technique 01 — Smooth Scroll & Reveal

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** Lenis · GSAP · ScrollTrigger
**Dependencies:** `vendor/gsap.min.js`, `vendor/ScrollTrigger.min.js`, `vendor/lenis.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

Lenis lerped scrolling + masked line reveals on enter. The base layer of almost every premium site.

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

## Full working source (`1.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>01 — Smooth Scroll & Reveal</title>
<link href="vendor/fonts.css" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  :root{--bg:#0b0b0f;--fg:#f4f1ea;--mut:#73737d;--accent:#c8ff00}
  html,body{background:var(--bg);color:var(--fg);font-family:'Space Grotesk',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  body{overflow-x:hidden}
  .nav{position:fixed;top:0;left:0;width:100%;display:flex;justify-content:space-between;align-items:center;padding:20px 28px;z-index:1000;mix-blend-mode:difference}
  .nav a{color:var(--fg);text-decoration:none;font-size:12px;letter-spacing:.06em;text-transform:uppercase}
  .nav .id{font-size:12px;letter-spacing:.1em;color:var(--fg)}
  .caption{position:fixed;left:28px;bottom:24px;max-width:360px;font-size:12px;line-height:1.55;color:var(--mut);z-index:1000;mix-blend-mode:difference}
  .caption b{color:var(--fg);font-weight:500}
  section{padding:14vh 8vw;min-height:90vh;display:flex;flex-direction:column;justify-content:center}
  .hero{height:100vh;justify-content:flex-end;padding-bottom:10vh}
  h1{font-family:'Instrument Serif',serif;font-weight:400;font-size:clamp(48px,11vw,170px);line-height:.92;letter-spacing:-.02em}
  h1 em{font-style:italic;color:var(--accent)}
  .lead{font-size:clamp(20px,3.2vw,44px);line-height:1.18;max-width:18ch;font-weight:400}
  .row{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:end;margin-top:8vh}
  .col p{color:var(--mut);font-size:15px;line-height:1.7;max-width:42ch}
  .reveal{will-change:transform,opacity}
  .line-mask{overflow:hidden;display:block}
  .big-num{font-family:'Instrument Serif',serif;font-size:clamp(80px,20vw,300px);line-height:1;color:#15151b}
  .spacer{height:30vh}
  .label{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--mut);margin-bottom:24px}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">01 / Smooth Scroll</span>
  </nav>
  <div class="caption">
    <b>Lenis smooth scroll + GSAP ScrollTrigger.</b> The foundation of nearly every Awwwards site. Lenis lerps the scroll position; ScrollTrigger drives masked line reveals as elements enter the viewport.
  </div>

  <section class="hero">
    <div class="label reveal">Foundations / 01</div>
    <h1><span class="line-mask"><span class="reveal-line">Motion that</span></span><span class="line-mask"><span class="reveal-line"><em>feels</em> inevitable.</span></span></h1>
  </section>

  <section>
    <p class="lead reveal-line">Smooth scrolling is the invisible layer that makes everything else read as premium.</p>
    <div class="row">
      <div class="col"><p class="reveal-line">Native scroll is stepwise and abrupt. Lenis interpolates between the current and target scroll position every frame, producing the weighted, gliding feel you see on award-winning sites.</p></div>
      <div class="col"><p class="reveal-line">Pair it with ScrollTrigger and a single timeline reveals copy line-by-line, masked behind <code>overflow:hidden</code> wrappers — cheap, GPU-friendly, and endlessly reusable.</p></div>
    </div>
  </section>

  <section>
    <div class="big-num reveal-line">↓ keep scrolling</div>
    <div class="spacer"></div>
    <p class="lead reveal-line">Every block below animates on enter — staggered, masked, and tied to scroll progress.</p>
  </section>

  <section style="gap:2vh">
    <h1 class="reveal-line">No jank.</h1>
    <h1 class="reveal-line" style="color:var(--mut)">No stutter.</h1>
    <h1 class="reveal-line"><em>Just flow.</em></h1>
  </section>

  <div class="spacer"></div>

  <script src="vendor/gsap.min.js"></script>
  <script src="vendor/ScrollTrigger.min.js"></script>
  <script src="vendor/lenis.min.js"></script>
  <script>
    // 1 — Lenis smooth scroll, synced to GSAP's ticker
    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
    lenis.on('scroll', () => ScrollTrigger.update());
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);

    // 2 — Masked line reveals on scroll enter
    gsap.utils.toArray('.reveal-line').forEach((el) => {
      gsap.from(el, {
        yPercent: 120, opacity: 0, duration: 1.1, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });
    gsap.utils.toArray('.reveal').forEach((el) => {
      gsap.from(el, { y: 30, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 92%' } });
    });
  </script>
</body>
</html>
```