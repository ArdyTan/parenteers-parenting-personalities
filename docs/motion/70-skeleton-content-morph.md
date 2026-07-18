# Technique 70 — Skeleton → Content Morph

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** Mobile · GSAP
**Dependencies:** `vendor/gsap.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

Shimmer bones don't vanish — each scales and slides onto its real element as it fades, images bloom up through their placeholders, text rises beneath. Loading as choreography.

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

## Full working source (`70.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
<title>70 — Skeleton → Content Morph</title>
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

  .appbar{padding:58px 22px 12px;display:flex;justify-content:space-between;align-items:baseline}
  .appbar h1{font-family:'Instrument Serif',serif;font-weight:400;font-size:26px}
  .appbar button{background:none;border:1px solid #26262e;border-radius:20px;color:var(--accent);font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.1em;padding:8px 14px;cursor:pointer}
  .statusline{padding:0 22px 10px;font-family:'Space Mono',monospace;font-size:9.5px;letter-spacing:.12em;color:var(--mut)}
  .statusline b{color:var(--accent);font-weight:400}

  .tile{position:relative;margin:0 18px 14px;background:#15151b;border:1px solid #1f1f28;border-radius:16px;overflow:hidden}
  .tile .imgwrap{position:relative;height:150px;overflow:hidden}
  .tile .imgwrap img{width:100%;height:100%;object-fit:cover;opacity:0;transform:scale(1.08)}
  .tile .tx{padding:14px 16px 16px;position:relative}
  .tile h3{font-size:15px;font-weight:500;opacity:0;transform:translateY(8px)}
  .tile p{font-family:'Space Mono',monospace;font-size:10px;color:var(--mut);letter-spacing:.08em;margin-top:5px;opacity:0;transform:translateY(8px)}

  /* skeleton layer sits on top and morphs away */
  .bone{position:absolute;background:#1e1e27;border-radius:7px;overflow:hidden;will-change:transform,opacity}
  .bone::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.07) 50%,transparent 70%);animation:shimmer 1.4s linear infinite;transform:translateX(-100%)}
  @keyframes shimmer{to{transform:translateX(100%)}}
  .bone.bImg{inset:0;border-radius:0}
  .bone.bT{left:16px;top:14px;width:56%;height:15px}
  .bone.bP{left:16px;top:38px;width:38%;height:10px}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">70 / Skeleton Morph</span>
  </nav>
  <div class="caption">
    <b>Skeletons that become the content.</b> Shimmer bones don't just vanish — each one scales/slides onto its real element as it fades, while the image blooms from the bone and text rises beneath. The morph carries your eye from placeholder to fact. Tap RELOAD to replay.
  </div>

  <div class="stage">
    <div class="phone">
      <div class="pnotch"></div>
      <div class="appbar"><h1>Journal</h1><button id="reload">↻ RELOAD</button></div>
      <div class="statusline" id="status">FETCHING — <b>SKELETON PASS</b></div>
      <div id="feed"></div>
      <div class="phome"></div>
    </div>
  </div>

  <script src="vendor/gsap.min.js"></script>
  <script>
    const buzz = ms => navigator.vibrate && navigator.vibrate(ms);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const POSTS = [
      ['1618005182384-a83a8bd57fbe','Gradient fields, live','SHADERS · 6 MIN READ'],
      ['1633186710895-309db2eca9e4','Monolith case study','SPATIAL · 9 MIN READ'],
      ['1604871000636-074fa5117945','Easing is a voice','MOTION · 4 MIN READ'],
    ];
    const feed = document.getElementById('feed');
    const status = document.getElementById('status');

    function build(){
      feed.innerHTML = POSTS.map(p => `
        <div class="tile">
          <div class="imgwrap"><img src="assets/img/photo-${p[0]}.jpg"><div class="bone bImg"></div></div>
          <div class="tx"><h3>${p[1]}</h3><p>${p[2]}</p><div class="bone bT"></div><div class="bone bP"></div></div>
        </div>`).join('');
    }

    function reveal(){
      status.innerHTML = 'LOADED — <b>MORPH PASS</b>';
      buzz(8);
      document.querySelectorAll('.tile').forEach((tile, i) => {
        const d = i * .14;
        const img = tile.querySelector('img');
        const h3 = tile.querySelector('h3'), p = tile.querySelector('p');
        const bImg = tile.querySelector('.bImg'), bT = tile.querySelector('.bT'), bP = tile.querySelector('.bP');
        const tl = gsap.timeline({ delay: reduced ? 0 : d });
        // image bone: brightens then dissolves as the photo blooms up through it
        tl.to(img, { opacity: 1, scale: 1, duration: reduced ? 0 : .8, ease: 'power3.out' }, .1)
          .to(bImg, { opacity: 0, duration: reduced ? 0 : .5, ease: 'power2.inOut' }, .15)
          // text bones morph ONTO their targets: slide+shrink toward the baseline, then hand over
          .to(bT, { y: 6, scaleX: .6, transformOrigin: 'left center', opacity: 0, duration: reduced ? 0 : .4, ease: 'power2.in' }, .2)
          .to(h3, { opacity: 1, y: 0, duration: reduced ? 0 : .45, ease: 'power3.out' }, .38)
          .to(bP, { y: 5, scaleX: .55, transformOrigin: 'left center', opacity: 0, duration: reduced ? 0 : .4, ease: 'power2.in' }, .3)
          .to(p, { opacity: 1, y: 0, duration: reduced ? 0 : .45, ease: 'power3.out' }, .48);
      });
    }

    function load(){
      build();
      status.innerHTML = 'FETCHING — <b>SKELETON PASS</b>';
      gsap.from('.tile', { opacity: 0, y: 16, stagger: .06, duration: reduced ? 0 : .35, ease: 'power2.out' });
      gsap.delayedCall(reduced ? .3 : 1.6, reveal); // the pretend network
    }
    document.getElementById('reload').addEventListener('click', load);
    load();
  </script>
</body>
</html>
```