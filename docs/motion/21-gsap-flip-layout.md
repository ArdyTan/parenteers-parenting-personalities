# Technique 21 — GSAP Flip Layout

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** GSAP
**Dependencies:** `vendor/gsap.min.js`, `vendor/Flip.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

Flip.from() records the old layout and tweens the delta — expand a tile or toggle grid↔list, items animate.

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

## Full working source (`21.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>21 — GSAP Flip Layout</title>
<link href="vendor/fonts.css" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  :root{--bg:#0b0b0f;--fg:#f4f1ea;--mut:#73737d;--accent:#c8ff00}
  html,body{min-height:100%;background:var(--bg);color:var(--fg);font-family:'Space Grotesk',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  .nav{position:fixed;top:0;left:0;width:100%;display:flex;justify-content:space-between;align-items:center;padding:20px 28px;z-index:1000;mix-blend-mode:difference}
  .nav a{color:var(--fg);text-decoration:none;font-size:12px;letter-spacing:.06em;text-transform:uppercase}
  .nav .id{font-size:12px;letter-spacing:.1em}
  .caption{position:fixed;left:28px;bottom:24px;max-width:340px;font-size:12px;line-height:1.55;color:var(--mut);z-index:1000;mix-blend-mode:difference}
  .caption b{color:var(--fg);font-weight:500}
  .wrap{padding:16vh 5vw 12vh}
  .top{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:5vh;gap:20px}
  .top h1{font-family:'Instrument Serif',serif;font-size:clamp(34px,6vw,84px);font-weight:400;line-height:.96}
  .toggle{display:flex;gap:8px;font-family:'Space Mono',monospace}
  .toggle button{font-size:12px;color:var(--mut);border:1px solid #1c1c22;background:none;padding:9px 16px;border-radius:30px;cursor:pointer;transition:.2s}
  .toggle button.active{background:var(--fg);color:#000;border-color:var(--fg)}
  .gallery{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
  .gallery.list{grid-template-columns:1fr}
  .item{position:relative;aspect-ratio:1;border-radius:10px;overflow:hidden;cursor:pointer;background:#15151b}
  .gallery.list .item{aspect-ratio:auto;height:120px}
  .item.active{grid-column:1/-1;aspect-ratio:21/9;cursor:zoom-out}
  .gallery.list .item.active{height:46vh}
  .item img{width:100%;height:100%;object-fit:cover;filter:brightness(.82)}
  .item .lab{position:absolute;left:18px;bottom:14px;z-index:2}
  .item .lab span{font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.1em;color:#d8d3c6}
  .item .lab h3{font-family:'Instrument Serif',serif;font-size:clamp(20px,2.4vw,40px);font-weight:400;line-height:1}
  .item .n{position:absolute;top:14px;right:16px;font-family:'Space Mono',monospace;font-size:11px;color:#fff;mix-blend-mode:difference;z-index:2}
  @media(max-width:800px){.gallery{grid-template-columns:repeat(2,1fr)}}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">21 / GSAP Flip</span>
  </nav>
  <div class="caption">
    <b>FLIP layout animation (free plugin).</b> Change the DOM/CSS to the final layout, and <code>Flip.from()</code> records the before-state and tweens the delta automatically. Click a tile to expand it; toggle grid↔list — the same items animate between layouts.
  </div>

  <div class="wrap">
    <div class="top">
      <h1>Flip between<br>any layout.</h1>
      <div class="toggle">
        <button id="bGrid" class="active">Grid</button>
        <button id="bList">List</button>
      </div>
    </div>
    <div class="gallery" id="gallery">
      <div class="item" data-img="assets/img/photo-1618005182384-a83a8bd57fbe.jpg"><span class="n">01</span><img src="assets/img/photo-1618005182384-a83a8bd57fbe.jpg"><div class="lab"><span>IDENTITY</span><h3>Aether</h3></div></div>
      <div class="item" data-img="assets/img/photo-1620121684840-edffcfc4b878.jpg"><span class="n">02</span><img src="assets/img/photo-1620121684840-edffcfc4b878.jpg"><div class="lab"><span>WEBGL</span><h3>Nocturne</h3></div></div>
      <div class="item" data-img="assets/img/photo-1635776062127-d379bfcba9f8.jpg"><span class="n">03</span><img src="assets/img/photo-1635776062127-d379bfcba9f8.jpg"><div class="lab"><span>DIRECTION</span><h3>Form &amp; Void</h3></div></div>
      <div class="item" data-img="assets/img/photo-1604871000636-074fa5117945.jpg"><span class="n">04</span><img src="assets/img/photo-1604871000636-074fa5117945.jpg"><div class="lab"><span>MOTION</span><h3>Kinetik</h3></div></div>
      <div class="item" data-img="assets/img/photo-1633186710895-309db2eca9e4.jpg"><span class="n">05</span><img src="assets/img/photo-1633186710895-309db2eca9e4.jpg"><div class="lab"><span>SPATIAL</span><h3>Monolith</h3></div></div>
      <div class="item" data-img="assets/img/photo-1618556450991-2f1af64e8191.jpg"><span class="n">06</span><img src="assets/img/photo-1618556450991-2f1af64e8191.jpg"><div class="lab"><span>STUDY</span><h3>Drift</h3></div></div>
      <div class="item" data-img="assets/img/photo-1618005198919-d3d4b5a92ead.jpg"><span class="n">07</span><img src="assets/img/photo-1618005198919-d3d4b5a92ead.jpg"><div class="lab"><span>SYSTEM</span><h3>Grid</h3></div></div>
      <div class="item" data-img="assets/img/photo-1614851099511-773084f6911d.jpg"><span class="n">08</span><img src="assets/img/photo-1614851099511-773084f6911d.jpg"><div class="lab"><span>3D</span><h3>Render</h3></div></div>
    </div>
  </div>

  <script src="vendor/gsap.min.js"></script>
  <script src="vendor/Flip.min.js"></script>
  <script>
    gsap.registerPlugin(Flip);
    const gallery = document.getElementById('gallery');
    const items = gsap.utils.toArray('.item');

    /* absolute:true pulls every item out of flow mid-tween, which collapses the
       gallery and yanks the page scroll to the top. Freezing the gallery's height
       for the duration of the flip keeps the document stable. */
    function lockHeight(){
      gallery.style.minHeight = gallery.offsetHeight + 'px';
    }
    function unlockHeight(){
      gallery.style.minHeight = '';
    }

    // Click a tile → expand (and load a larger source), animated with Flip
    items.forEach(item => item.addEventListener('click', () => {
      const state = Flip.getState(items, { props:'borderRadius' });
      lockHeight();
      const wasActive = item.classList.contains('active');
      items.forEach(i => i.classList.remove('active'));
      if(!wasActive){
        item.classList.add('active');
        const big = item.dataset.img, img = item.querySelector('img');
        if(img.src !== big) img.src = big;
      }
      Flip.from(state, { duration:.7, ease:'power3.inOut', absolute:true, stagger:.03,
        onComplete(){
          unlockHeight();
          // keep the expanded tile in view without jumping the page
          if(!wasActive) item.scrollIntoView({ behavior:'smooth', block:'nearest' });
        } });
    }));

    // Grid ↔ List toggle — same Flip technique on a layout class swap
    const bGrid = document.getElementById('bGrid'), bList = document.getElementById('bList');
    function setLayout(list){
      const state = Flip.getState(items);
      lockHeight();
      gallery.classList.toggle('list', list);
      items.forEach(i => i.classList.remove('active'));
      bGrid.classList.toggle('active', !list);
      bList.classList.toggle('active', list);
      Flip.from(state, { duration:.65, ease:'power3.inOut', absolute:true, stagger:.025,
        onComplete: unlockHeight });
    }
    bGrid.addEventListener('click', ()=>setLayout(false));
    bList.addEventListener('click', ()=>setLayout(true));
  </script>
</body>
</html>
```