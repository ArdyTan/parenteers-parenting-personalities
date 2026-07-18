# Technique 69 — Shared-Element Card → Detail

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** Mobile · GSAP
**Dependencies:** `vendor/gsap.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

The App Store expand: the tapped card's exact geometry becomes the detail view's starting rect, then FLIPs to fullscreen — one continuous object. Close reverses to the precise card.

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

## Full working source (`69.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
<title>69 — Shared-Element Card → Detail</title>
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

  .scroll{position:absolute;inset:0;overflow-y:auto;overscroll-behavior:contain}
  .scroll::-webkit-scrollbar{display:none}
  .head{padding:62px 22px 8px}
  .head p{font-family:'Space Mono',monospace;font-size:10px;color:var(--mut);letter-spacing:.12em}
  .head h1{font-family:'Instrument Serif',serif;font-weight:400;font-size:30px;margin-top:4px}
  .tcard{position:relative;margin:14px 18px;height:300px;border-radius:20px;overflow:hidden;cursor:pointer;-webkit-tap-highlight-color:transparent}
  .tcard img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .tcard .sh{position:absolute;inset:0;background:linear-gradient(rgba(0,0,0,.35),transparent 35%,transparent 60%,rgba(0,0,0,.65))}
  .tcard .k{position:absolute;top:16px;left:18px;font-family:'Space Mono',monospace;font-size:9.5px;letter-spacing:.16em;color:rgba(255,255,255,.8)}
  .tcard h2{position:absolute;left:18px;bottom:16px;font-family:'Instrument Serif',serif;font-weight:400;font-size:28px;line-height:1;max-width:75%}
  .tcard:active{transform:scale(.975)}
  .tcard{transition:transform .2s}

  /* the detail is the shared element: hero geometry FLIPs from the tapped card */
  .detail{position:absolute;z-index:30;border-radius:20px;overflow:hidden;background:#101016;visibility:hidden;will-change:transform}
  .detail .hero{position:relative;height:300px;flex-shrink:0}
  .detail .hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .detail .hero .sh{position:absolute;inset:0;background:linear-gradient(rgba(0,0,0,.35),transparent 35%,transparent 60%,rgba(0,0,0,.65))}
  .detail .hero .k{position:absolute;top:16px;left:18px;font-family:'Space Mono',monospace;font-size:9.5px;letter-spacing:.16em;color:rgba(255,255,255,.8)}
  .detail .hero h2{position:absolute;left:18px;bottom:16px;font-family:'Instrument Serif',serif;font-weight:400;font-size:28px;line-height:1;max-width:75%}
  .detail .close{position:absolute;top:56px;right:16px;z-index:5;width:34px;height:34px;border-radius:50%;border:none;background:rgba(15,15,20,.6);backdrop-filter:blur(8px);color:#fff;font-size:15px;cursor:pointer;opacity:0}
  .detail .body{padding:20px 22px 40px;opacity:0}
  .detail .body p{color:var(--mut);font-size:14px;line-height:1.7;margin-bottom:14px}
  .detail .body .metaRow{display:flex;gap:10px;margin-bottom:18px}
  .detail .body .metaRow span{font-family:'Space Mono',monospace;font-size:9.5px;letter-spacing:.1em;color:var(--accent);border:1px solid #2c3800;border-radius:20px;padding:6px 12px}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">69 / Card → Detail</span>
  </nav>
  <div class="caption">
    <b>The App Store expand.</b> Tap a card: its exact geometry is measured, the detail view starts as that rectangle and FLIPs to fullscreen — same image, same title, so your eye reads one continuous object. Body copy fades up late; close reverses to the precise card rect.
  </div>

  <div class="stage">
    <div class="phone">
      <div class="pnotch"></div>
      <div class="scroll" id="scroll">
        <div class="head"><p id="date">FRIDAY 11 JULY</p><h1>Today</h1></div>
        <div id="cards"></div>
        <div style="height:40px"></div>
      </div>
      <div class="detail" id="detail">
        <button class="close" id="close">✕</button>
        <div class="hero"><img id="dImg"><div class="sh"></div><span class="k" id="dK"></span><h2 id="dT"></h2></div>
        <div class="body" id="dBody">
          <div class="metaRow"><span>TECHNIQUE</span><span>MOBILE</span><span>FLIP</span></div>
          <p id="dCopy"></p>
          <p>The trick is honesty: the detail hero and the card are pixel-identical at the moment of the swap, so the FLIP tween is the only thing your eye can attribute the change to.</p>
          <p>Scale text containers, never font-size — and stagger the body copy in <i>after</i> the geometry lands. Arrivals first, furniture second.</p>
        </div>
      </div>
      <div class="phome"></div>
    </div>
  </div>

  <script src="vendor/gsap.min.js"></script>
  <script>
    const buzz = ms => navigator.vibrate && navigator.vibrate(ms);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const phone = document.querySelector('.phone');
    const detail = document.getElementById('detail');
    const CARDS = [
      { img:'1620121684840-edffcfc4b878', k:'FEATURED · WEBGL', t:'Night shaders, decoded', copy:'A guided teardown of the displacement pass behind this month\'s most-shared hero. GPU budgets included.' },
      { img:'1604871000636-074fa5117945', k:'COLLECTION · MOTION', t:'Easing is a voice', copy:'Nine springs, three studios, one argument: your ease curve is your brand. Steal these presets.' },
      { img:'1633186710895-309db2eca9e4', k:'STORY · SPATIAL', t:'Monolith, revisited', copy:'The spatial study that started as a napkin sketch and ended on three award shortlists.' },
    ];
    document.getElementById('cards').innerHTML = CARDS.map((c, i) => `
      <div class="tcard" data-i="${i}">
        <img src="assets/img/photo-${c.img}.jpg" draggable="false"><div class="sh"></div>
        <span class="k">${c.k}</span><h2>${c.t}</h2>
      </div>`).join('');

    let open = false, busy = false, srcCard = null;
    const pr = () => phone.getBoundingClientRect();

    function openDetail(card){
      if(busy || open) return; busy = true; open = true; srcCard = card;
      buzz(10);
      const c = CARDS[+card.dataset.i];
      document.getElementById('dImg').src = `assets/img/photo-${c.img}.jpg`;
      document.getElementById('dK').textContent = c.k;
      document.getElementById('dT').textContent = c.t;
      document.getElementById('dCopy').textContent = c.copy;

      const p = pr(), r = card.getBoundingClientRect();
      const from = { left: r.left - p.left, top: r.top - p.top, width: r.width, height: r.height, radius: 20 };
      card.style.visibility = 'hidden';
      detail.style.visibility = 'visible';
      gsap.set(detail, { left: from.left, top: from.top, width: from.width, height: from.height, borderRadius: from.radius });
      gsap.timeline({ onComplete(){ busy = false; } })
        .to(detail, { left: 0, top: 0, width: p.width, height: p.height, borderRadius: innerWidth > 760 ? 48 : 0,
          duration: reduced ? 0 : .55, ease: 'expo.out' })
        .to('#dBody', { opacity: 1, duration: .35 }, .3)
        .fromTo('#dBody > *', { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: .07, duration: reduced ? 0 : .4, ease: 'power3.out' }, .3)
        .to('#close', { opacity: 1, duration: .25 }, .35);
    }

    function closeDetail(){
      if(busy || !open) return; busy = true;
      buzz(8);
      const p = pr(), r = srcCard.getBoundingClientRect();
      const to = { left: r.left - p.left, top: r.top - p.top, width: r.width, height: r.height };
      gsap.timeline({ onComplete(){
        detail.style.visibility = 'hidden';
        srcCard.style.visibility = 'visible';
        open = false; busy = false;
      } })
        .to(['#dBody', '#close'], { opacity: 0, duration: .18 }, 0)
        .to(detail, { ...to, borderRadius: 20, duration: reduced ? 0 : .45, ease: 'power3.inOut' }, .05);
    }

    document.querySelectorAll('.tcard').forEach(c => c.addEventListener('click', () => openDetail(c)));
    document.getElementById('close').addEventListener('click', closeDetail);
  </script>
</body>
</html>
```