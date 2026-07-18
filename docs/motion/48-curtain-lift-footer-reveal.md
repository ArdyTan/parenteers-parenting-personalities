# Technique 48 — Curtain-Lift Footer Reveal

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** GSAP · ScrollTrigger · Lenis · CSS
**Dependencies:** `vendor/gsap.min.js`, `vendor/ScrollTrigger.min.js`, `vendor/lenis.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

The footer is fixed behind everything; the page gets margin-bottom equal to its height, so scrolling lifts the content away like a curtain. One CSS trick + parallax garnish.

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

## Full working source (`48.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>48 — Curtain-Lift Footer Reveal</title>
<link href="vendor/fonts.css" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  :root{--bg:#0b0b0f;--fg:#f4f1ea;--mut:#73737d;--accent:#c8ff00;--footer-h:92vh}
  html,body{background:var(--bg);color:var(--fg);font-family:'Space Grotesk',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  body{overflow-x:hidden}
  .nav{position:fixed;top:0;left:0;width:100%;display:flex;justify-content:space-between;align-items:center;padding:20px 28px;z-index:1000;mix-blend-mode:difference}
  .nav a{color:var(--fg);text-decoration:none;font-size:12px;letter-spacing:.06em;text-transform:uppercase}
  .nav .id{font-size:12px;letter-spacing:.1em}
  .caption{position:fixed;left:28px;bottom:24px;max-width:340px;font-size:12px;line-height:1.55;color:var(--mut);z-index:1000;mix-blend-mode:difference;pointer-events:none}
  .caption b{color:var(--fg);font-weight:500}

  /* page rides ABOVE the fixed footer; its bottom margin opens the reveal window */
  .page{position:relative;z-index:2;background:var(--bg);margin-bottom:var(--footer-h);box-shadow:0 40px 80px rgba(0,0,0,.6)}
  .hero{height:100vh;display:flex;flex-direction:column;justify-content:center;padding:0 8vw}
  .hero h1{font-family:'Instrument Serif',serif;font-weight:400;font-size:clamp(44px,9vw,140px);line-height:.94}
  .hero p{margin-top:20px;color:var(--mut);max-width:44ch;line-height:1.7}
  .block{padding:14vh 8vw;border-top:1px solid #15151b}
  .block h2{font-family:'Instrument Serif',serif;font-weight:400;font-size:clamp(28px,5vw,64px)}
  .block p{margin-top:16px;color:var(--mut);max-width:52ch;line-height:1.7}

  /* the footer waits underneath everything */
  .footer{position:fixed;left:0;bottom:0;width:100%;height:var(--footer-h);z-index:1;background:var(--accent);color:#101204;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:4vh;overflow:hidden}
  .footer .inner{will-change:transform,opacity}
  .footer h2{font-family:'Instrument Serif',serif;font-weight:400;font-size:clamp(52px,12vw,190px);line-height:.9;letter-spacing:-.02em}
  .footer a.mail{font-family:'Space Mono',monospace;font-size:clamp(14px,1.8vw,20px);color:#101204;text-decoration:none;border-bottom:2px solid #101204;padding-bottom:4px}
  .footer .links{display:flex;gap:30px;font-family:'Space Mono',monospace;font-size:12px;letter-spacing:.1em;text-transform:uppercase}
  .footer .links a{color:#3c4204;text-decoration:none}
  .footer .links a:hover{color:#101204}
  .footer .fine{position:absolute;bottom:20px;width:100%;display:flex;justify-content:space-between;padding:0 28px;font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.1em;color:#3c4204}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">48 / Footer Reveal</span>
  </nav>
  <div class="caption">
    <b>The page is a curtain.</b> The footer is <code>position:fixed</code> behind everything; the page gets <code>margin-bottom</code> equal to the footer's height so scrolling lifts the content away and reveals it — with an inner parallax so the footer "arrives".
  </div>

  <div class="page">
    <section class="hero">
      <h1>Every page<br>ends. Make it<br><em>an event.</em></h1>
      <p>Scroll to the bottom. Instead of the footer scrolling in like any other block, the entire page lifts off like a curtain and the footer is just… there, waiting. One CSS trick, zero JS required — the parallax garnish is three lines of GSAP.</p>
    </section>
    <section class="block"><h2>Why it works</h2><p>The footer never moves — your brain reads the page as a physical sheet sliding off a table. Depth from layering, not from tweens. The shadow under the page sells the lift.</p></section>
    <section class="block"><h2>The recipe</h2><p>footer: fixed, bottom 0, z-index 1. page: relative, z-index 2, margin-bottom equal to footer height, plus a drop shadow. That's the entire pattern. Keep scrolling ↓</p></section>
  </div>

  <footer class="footer">
    <div class="inner" id="finner">
      <h2>Let's talk.</h2>
      <a class="mail" href="mailto:hello@studio.com">hello@studio.com</a>
      <div class="links" style="margin-top:4vh"><a href="#">Instagram</a><a href="#">Twitter/X</a><a href="#">LinkedIn</a><a href="#">Dribbble</a></div>
    </div>
    <div class="fine"><span>© 2026 — STUDIO</span><span>MADE WITH RESTRAINT</span></div>
  </footer>

  <script src="vendor/gsap.min.js"></script>
  <script src="vendor/ScrollTrigger.min.js"></script>
  <script src="vendor/lenis.min.js"></script>
  <script>
    const lenis = new Lenis({ lerp: 0.09 });
    lenis.on('scroll', () => ScrollTrigger.update());
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);

    // garnish: the footer content parallaxes up + fades in as the curtain lifts
    gsap.fromTo('#finner', { y: '-18vh', opacity: .25, scale: .96 }, {
      y: 0, opacity: 1, scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.page', start: 'bottom bottom', end: 'bottom top', scrub: true }
    });
  </script>
</body>
</html>
```