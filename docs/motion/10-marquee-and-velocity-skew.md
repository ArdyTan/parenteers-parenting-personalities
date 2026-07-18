# Technique 10 — Marquee & Velocity Skew

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** GSAP · ScrollTrigger
**Dependencies:** `vendor/gsap.min.js`, `vendor/ScrollTrigger.min.js`, `vendor/lenis.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

Seamless infinite ticker plus content that skews and flips direction based on scroll velocity.

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

## Full working source (`10.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>10 — Marquee & Velocity Skew</title>
<link href="vendor/fonts.css" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  :root{--bg:#0b0b0f;--fg:#f4f1ea;--mut:#73737d;--accent:#ff5436}
  html,body{background:var(--bg);color:var(--fg);font-family:'Space Grotesk',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  body{overflow-x:hidden}
  .nav{position:fixed;top:0;left:0;width:100%;display:flex;justify-content:space-between;align-items:center;padding:20px 28px;z-index:1000;mix-blend-mode:difference}
  .nav a{color:var(--fg);text-decoration:none;font-size:12px;letter-spacing:.06em;text-transform:uppercase}
  .nav .id{font-size:12px;letter-spacing:.1em}
  .caption{position:fixed;left:28px;bottom:24px;max-width:340px;font-size:12px;line-height:1.55;color:var(--mut);z-index:1000;mix-blend-mode:difference}
  .caption b{color:var(--fg);font-weight:500}
  .pad{height:60vh;display:flex;align-items:flex-end;padding:0 7vw 6vh}
  .pad h1{font-family:'Instrument Serif',serif;font-size:clamp(36px,7vw,100px);font-weight:400;line-height:.96}
  .pad p{color:var(--mut);max-width:40ch;margin-top:18px}
  .marquees{display:flex;flex-direction:column;gap:10px;padding:6vh 0}
  .marquee{overflow:hidden;white-space:nowrap;position:relative}
  .marquee .row{display:inline-flex;align-items:center;will-change:transform}
  .marquee span{font-family:'Instrument Serif',serif;font-size:clamp(48px,10vw,150px);line-height:1;padding:0 .35em;font-weight:400}
  .marquee.alt span{color:transparent;-webkit-text-stroke:1px var(--mut)}
  .marquee.alt:hover span{-webkit-text-stroke-color:var(--fg)}
  .marquee.accent span{color:var(--accent)}
  .marquee.small span{font-size:clamp(18px,2.4vw,30px);font-family:'Space Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--mut);padding:0 .8em}
  /* image strip row */
  .marquee.imgs .row{gap:14px;padding:8px 7px}
  .marquee.imgs i{flex:0 0 auto;width:clamp(150px,18vw,260px);aspect-ratio:3/2;border-radius:8px;background-size:cover;background-position:center;filter:brightness(.75) saturate(.9);transition:filter .4s}
  .marquee.imgs:hover i{filter:brightness(1) saturate(1.1)}
  /* tilted ribbon */
  .ribbon{transform:rotate(-3deg) scale(1.06);background:var(--accent);margin:7vh 0}
  .ribbon span{color:#180702 !important;font-family:'Space Mono',monospace !important;font-size:clamp(14px,1.8vw,22px) !important;letter-spacing:.15em;text-transform:uppercase;padding:14px .9em !important}
  .skew{will-change:transform}
  .tail{height:60vh;display:flex;align-items:center;justify-content:center;color:var(--mut);text-align:center;padding:0 7vw}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">10 / Marquee</span>
  </nav>
  <div class="caption">
    <b>Infinite marquee + scroll-velocity skew.</b> Rows are cloned until they cover 2× the viewport and wrapped with modulo, so the loop never gaps. Scroll velocity flips direction, multiplies speed and skews the block; hovering a row eases it to half speed.
  </div>

  <section class="pad"><div><h1>Type in <em>motion.</em></h1><p>The seamless looping marquee, five ways — editorial serif, outlined, image strip, micro-label and a tilted ribbon. Scroll fast to whip the skew; hover a row to slow it.</p></div></section>

  <div class="marquees skew" id="skew">
    <div class="marquee" data-speed="0.7"><div class="row"><span>Design</span><span>·</span><span>Motion</span><span>·</span><span>WebGL</span><span>·</span><span>Code</span><span>·</span></div></div>
    <div class="marquee alt" data-speed="-1"><div class="row"><span>Awwwards</span><span>★</span><span>FWA</span><span>★</span><span>CSSDA</span><span>★</span><span>Webby</span><span>★</span></div></div>
    <div class="marquee imgs" data-speed="0.5"><div class="row">
      <i style="background-image:url('assets/img/photo-1618005182384-a83a8bd57fbe.jpg')"></i>
      <i style="background-image:url('assets/img/photo-1620121684840-edffcfc4b878.jpg')"></i>
      <i style="background-image:url('assets/img/photo-1635776062127-d379bfcba9f8.jpg')"></i>
      <i style="background-image:url('assets/img/photo-1604871000636-074fa5117945.jpg')"></i>
      <i style="background-image:url('assets/img/photo-1633186710895-309db2eca9e4.jpg')"></i>
    </div></div>
    <div class="marquee accent" data-speed="0.9"><div class="row"><span>Let's build</span><span>—</span><span>something</span><span>—</span><span>unforgettable</span><span>—</span></div></div>
    <div class="marquee small" data-speed="-0.6"><div class="row"><span>Est. 2026</span><span>/</span><span>Studio for kinetic interfaces</span><span>/</span><span>Available worldwide</span><span>/</span></div></div>
  </div>

  <div class="marquee ribbon" data-speed="1.1"><div class="row"><span>Now booking Q3</span><span>✳</span><span>hello@studio.com</span><span>✳</span><span>Now booking Q3</span><span>✳</span><span>hello@studio.com</span><span>✳</span></div></div>

  <section class="tail">scroll velocity drives direction, speed & skew ↑<br>hover any row to slow it down</section>

  <script src="vendor/gsap.min.js"></script>
  <script src="vendor/ScrollTrigger.min.js"></script>
  <script src="vendor/lenis.min.js"></script>
  <script>
    const lenis = new Lenis({ lerp: 0.09 });
    lenis.on('scroll', () => ScrollTrigger.update());
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);

    /* Seamless marquee: clone the base row until copies cover 2× viewport,
       then translate the whole strip and wrap with modulo. Re-measured after
       fonts load and on resize, so the loop never gaps or jumps. */
    const marquees = [...document.querySelectorAll('.marquee')];
    function build(m){
      const base = m.querySelector('.row');
      m._strip && m._strip.remove();
      const strip = document.createElement('div');
      strip.className = 'row'; strip.style.display = 'inline-flex';
      const first = base.cloneNode(true);
      first.style.display = 'inline-flex';
      strip.appendChild(first);
      m._strip = strip; base.style.display = 'none';
      m.appendChild(strip);
      let unit = first.getBoundingClientRect().width || innerWidth;
      const copies = Math.max(2, Math.ceil((innerWidth * 2) / unit) + 1);
      for(let i = 1; i < copies; i++){
        const c = base.cloneNode(true);
        c.style.display = 'inline-flex';
        strip.appendChild(c);
      }
      m._unit = unit; m._x = m._x || 0;
    }
    marquees.forEach(m => {
      m._dir = 1; m._hover = 1;
      m._speed = parseFloat(m.dataset.speed);
      build(m);
      m.addEventListener('mouseenter', () => gsap.to(m, { _hover: .35, duration: .5 }));
      m.addEventListener('mouseleave', () => gsap.to(m, { _hover: 1, duration: .5 }));
    });
    document.fonts && document.fonts.ready.then(() => marquees.forEach(build));
    addEventListener('resize', () => marquees.forEach(build));

    let boost = 1; // scroll velocity multiplies marquee speed
    gsap.ticker.add((time, dt) => {
      marquees.forEach(m => {
        m._x -= (m.dataset.speed < 0 ? -1 : 1) * m._dir * Math.abs(m._speed) * m._hover * boost * dt * 0.06;
        // modulo wrap: x always lives in (-unit, 0]
        const u = m._unit; m._x = ((m._x % u) + u) % u * -1;
        m._strip.style.transform = `translateX(${m._x}px)`;
      });
      boost += (1 - boost) * 0.05; // ease boost back to resting speed
    });

    // Velocity → direction flip + speed boost + skew
    ScrollTrigger.create({
      onUpdate: (self) => {
        const v = self.getVelocity();
        marquees.forEach(m => m._dir = self.direction);
        boost = gsap.utils.clamp(1, 4, 1 + Math.abs(v) / 900);
        const skew = gsap.utils.clamp(-12, 12, v / -220);
        gsap.to('#skew', { skewY: skew, duration: .2, overwrite: true,
          onComplete: () => gsap.to('#skew', { skewY: 0, duration: .6, ease: 'power3' }) });
      }
    });
  </script>
</body>
</html>
```