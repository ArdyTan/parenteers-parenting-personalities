# Technique 02 — Split-Text Hero

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** GSAP · CSS
**Dependencies:** `vendor/gsap.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

Per-character & per-line staggered reveal with a DIY SplitText — the editorial hero open.

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

## Full working source (`2.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>02 — Split-Text Hero Reveal</title>
<link href="vendor/fonts.css" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  :root{--bg:#0b0b0f;--fg:#f4f1ea;--mut:#73737d;--accent:#ff5436}
  html,body{height:100%;background:var(--bg);color:var(--fg);font-family:'Space Grotesk',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}
  .nav{position:fixed;top:0;left:0;width:100%;display:flex;justify-content:space-between;align-items:center;padding:20px 28px;z-index:1000;mix-blend-mode:difference}
  .nav a{color:var(--fg);text-decoration:none;font-size:12px;letter-spacing:.06em;text-transform:uppercase}
  .nav .id{font-size:12px;letter-spacing:.1em}
  .caption{position:fixed;left:28px;bottom:24px;max-width:360px;font-size:12px;line-height:1.55;color:var(--mut);z-index:1000;mix-blend-mode:difference}
  .caption b{color:var(--fg);font-weight:500}
  .stage{height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 7vw}
  .kicker{font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--accent);margin-bottom:30px;opacity:0}
  h1{font-family:'Instrument Serif',serif;font-weight:400;font-size:clamp(44px,9.5vw,150px);line-height:.95;letter-spacing:-.02em}
  h1 em{font-style:italic}
  .word{display:inline-block;overflow:hidden;vertical-align:top}
  .char{display:inline-block;will-change:transform}
  .sub{margin-top:40px;font-size:clamp(15px,1.6vw,19px);color:var(--mut);max-width:46ch;line-height:1.6;overflow:hidden}
  .sub span{display:inline-block}
  .replay{margin-top:46px;background:none;border:1px solid #2a2a32;color:var(--fg);padding:12px 22px;border-radius:40px;font:inherit;font-size:13px;letter-spacing:.04em;cursor:pointer;opacity:0;transition:background .3s,color .3s}
  .replay:hover{background:var(--fg);color:var(--bg)}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">02 / Split Text</span>
  </nav>
  <div class="caption">
    <b>Per-character & per-line staggered reveal.</b> A lightweight DIY SplitText (no premium plugin): each word is masked, each character animates up with a staggered <code>expo.out</code> ease — the signature editorial hero open.
  </div>

  <div class="stage">
    <div class="kicker">Studio — Reel 2026</div>
    <h1 id="headline">We build <em>worlds</em> the web hasn't seen yet.</h1>
    <p class="sub" id="sub"><span>Direction, design and code for brands that refuse the template.</span></p>
    <button class="replay" id="replay">↻ Replay animation</button>
  </div>

  <script src="vendor/gsap.min.js"></script>
  <script>
    // DIY split: wrap each word in an overflow-hidden mask, each char in a span
    function splitChars(el){
      const words = el.textContent.trim().split(/(\s+)/);
      el.innerHTML = '';
      const chars = [];
      words.forEach(w => {
        if(/^\s+$/.test(w)){ el.appendChild(document.createTextNode(' ')); return; }
        const wrap = document.createElement('span'); wrap.className = 'word';
        [...w].forEach(c => {
          const s = document.createElement('span'); s.className='char'; s.textContent=c;
          wrap.appendChild(s); chars.push(s);
        });
        el.appendChild(wrap);
      });
      return chars;
    }

    const headline = document.getElementById('headline');
    // preserve <em> by splitting its parts; simplest: split whole text then re-italic 'worlds'
    const chars = splitChars(headline);

    function play(){
      gsap.killTweensOf('.char, .kicker, .sub span, .replay');
      const tl = gsap.timeline();
      tl.fromTo('.kicker', {y:20,opacity:0},{y:0,opacity:1,duration:.8,ease:'power2.out'})
        .fromTo(chars, {yPercent:115}, {yPercent:0,duration:1.1,ease:'expo.out',stagger:0.022}, '-=.5')
        .fromTo('#sub span', {yPercent:110},{yPercent:0,duration:.9,ease:'expo.out'}, '-=.7')
        .fromTo('.replay', {y:14,opacity:0},{y:0,opacity:1,duration:.6,ease:'power2.out'}, '-=.5');
    }
    play();
    document.getElementById('replay').addEventListener('click', play);
  </script>
</body>
</html>
```