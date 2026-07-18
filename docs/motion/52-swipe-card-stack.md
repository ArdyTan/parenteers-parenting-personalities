# Technique 52 — Swipe Card Stack

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** Mobile · GSAP
**Dependencies:** `vendor/gsap.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

The Tinder deck: drag rotates the card ∝ offset, release past a distance or velocity threshold flings it off; the next card scales up from beneath. Undo included.

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

## Full working source (`52.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
<title>52 — Swipe Card Stack</title>
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

  /* device frame: bezel on desktop, edge-to-edge on real phones */
  .stage{position:fixed;inset:0;display:grid;place-items:center;z-index:1}
  .phone{position:relative;width:390px;height:min(844px,92vh);background:#0e0e13;overflow:hidden;border-radius:48px;box-shadow:0 0 0 11px #17171d,0 0 0 13px #2a2a33,0 44px 110px rgba(0,0,0,.65)}
  .pnotch{position:absolute;top:12px;left:50%;transform:translateX(-50%);width:118px;height:32px;border-radius:20px;background:#000;z-index:60}
  .phome{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:130px;height:5px;border-radius:3px;background:rgba(255,255,255,.28);z-index:60;pointer-events:none}
  @media(max-width:760px){.phone{width:100vw;height:100dvh;border-radius:0;box-shadow:none}.pnotch{display:none}}

  /* app */
  .appbar{position:absolute;top:0;left:0;width:100%;padding:58px 24px 12px;z-index:5;display:flex;justify-content:space-between;align-items:baseline}
  .appbar h1{font-family:'Instrument Serif',serif;font-weight:400;font-size:26px}
  .appbar span{font-family:'Space Mono',monospace;font-size:11px;color:var(--mut);letter-spacing:.1em}
  .deck{position:absolute;inset:110px 20px 150px;touch-action:none}
  .scard{position:absolute;inset:0;border-radius:20px;overflow:hidden;background:#15151b;box-shadow:0 18px 40px rgba(0,0,0,.45);will-change:transform;user-select:none}
  .scard img{width:100%;height:100%;object-fit:cover;pointer-events:none;-webkit-user-drag:none}
  .scard .meta{position:absolute;left:0;bottom:0;width:100%;padding:70px 20px 18px;background:linear-gradient(transparent,rgba(0,0,0,.75))}
  .scard .meta h2{font-family:'Instrument Serif',serif;font-weight:400;font-size:30px;line-height:1}
  .scard .meta p{margin-top:6px;font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.1em;color:rgba(255,255,255,.75)}
  .stamp{position:absolute;top:26px;font-family:'Space Mono',monospace;font-size:26px;letter-spacing:.1em;font-weight:700;padding:8px 16px;border:4px solid;border-radius:10px;opacity:0;transform:rotate(-14deg)}
  .stamp.like{left:22px;color:#7dff8a;border-color:#7dff8a}
  .stamp.nope{right:22px;color:#ff5c6c;border-color:#ff5c6c;transform:rotate(14deg)}
  .actions{position:absolute;bottom:52px;left:0;width:100%;display:flex;justify-content:center;gap:26px;z-index:5}
  .actions button{width:64px;height:64px;border-radius:50%;border:1px solid #26262e;background:#14141a;color:var(--fg);font-size:24px;cursor:pointer;transition:transform .15s;box-shadow:0 10px 26px rgba(0,0,0,.4)}
  .actions button:active{transform:scale(.88)}
  .actions .no{color:#ff5c6c}.actions .yes{color:#7dff8a}
  .actions .undo{width:50px;height:50px;font-size:17px;color:var(--mut);align-self:center}
  .toastlbl{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Space Mono',monospace;font-size:12px;letter-spacing:.16em;color:var(--mut);opacity:0;z-index:4;pointer-events:none}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">52 / Swipe Stack</span>
  </nav>
  <div class="caption">
    <b>The Tinder deck.</b> Pointer drag rotates the card ∝ horizontal offset; release beyond a distance <i>or</i> velocity threshold flings it off along its vector, otherwise it springs home. The next card scales up from beneath. Works with mouse and touch (one Pointer Events path).
  </div>

  <div class="stage">
    <div class="phone">
      <div class="pnotch"></div>
      <div class="appbar"><h1>Discover</h1><span id="count">∞ NEARBY</span></div>
      <div class="deck" id="deck"></div>
      <div class="toastlbl" id="toast">DECK RESHUFFLED</div>
      <div class="actions">
        <button class="undo" id="undo" title="Undo">↩</button>
        <button class="no" id="btnNo" title="Nope">✕</button>
        <button class="yes" id="btnYes" title="Like">♥</button>
      </div>
      <div class="phome"></div>
    </div>
  </div>

  <script src="vendor/gsap.min.js"></script>
  <script>
    const buzz = ms => navigator.vibrate && navigator.vibrate(ms);
    const PROFILES = [
      { img:'assets/img/photo-1618005182384-a83a8bd57fbe.jpg', name:'Aether', sub:'GRADIENT FIELDS · 2KM' },
      { img:'assets/img/photo-1620121684840-edffcfc4b878.jpg', name:'Nocturne', sub:'WEBGL FLAGSHIP · 4KM' },
      { img:'assets/img/photo-1635776062127-d379bfcba9f8.jpg', name:'Void', sub:'DARK MATTER · 1KM' },
      { img:'assets/img/photo-1604871000636-074fa5117945.jpg', name:'Kinetik', sub:'MOTION SYSTEM · 6KM' },
      { img:'assets/img/photo-1633186710895-309db2eca9e4.jpg', name:'Monolith', sub:'SPATIAL STUDY · 3KM' },
      { img:'assets/img/photo-1550684848-fac1c5b4e853.jpg', name:'Ember', sub:'CAMPAIGN · 8KM' },
    ];
    const deck = document.getElementById('deck');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let cards = [], history = [];

    function makeCard(p){
      const el = document.createElement('div');
      el.className = 'scard';
      el.innerHTML = `<img src="${p.img}" draggable="false">
        <span class="stamp like">LIKE</span><span class="stamp nope">NOPE</span>
        <div class="meta"><h2>${p.name}</h2><p>${p.sub}</p></div>`;
      return el;
    }

    function layout(){
      cards.forEach((c, i) => {
        if(i > 2){ gsap.set(c, { opacity: 0 }); return; }
        gsap.to(c, { scale: 1 - i * .045, y: i * 14, opacity: 1, duration: reduced ? 0 : .35, ease: 'power2.out' });
        c.style.zIndex = 100 - i;
      });
    }

    function fill(){
      while(cards.length < 4){
        const p = PROFILES[(history.length + cards.length) % PROFILES.length];
        const el = makeCard(p);
        deck.appendChild(el);
        gsap.set(el, { scale: .85, y: 40, opacity: 0 });
        cards.push(el);
        attach(el);
      }
      layout();
    }

    /* one Pointer Events path for mouse + touch */
    function attach(card){
      let sx, sy, dx = 0, dy = 0, dragging = false, vx = 0, lastX = 0, lastT = 0;
      card.addEventListener('pointerdown', e => {
        if(cards[0] !== card) return;
        dragging = true; sx = e.clientX; sy = e.clientY; lastX = e.clientX; lastT = performance.now();
        card.setPointerCapture(e.pointerId);
        gsap.killTweensOf(card);
      });
      card.addEventListener('pointermove', e => {
        if(!dragging) return;
        dx = e.clientX - sx; dy = e.clientY - sy;
        const now = performance.now();
        vx = (e.clientX - lastX) / Math.max(1, now - lastT) * 1000; lastX = e.clientX; lastT = now;
        const rot = dx * 0.08;
        gsap.set(card, { x: dx, y: dy * .5, rotation: rot });
        const p = gsap.utils.clamp(0, 1, Math.abs(dx) / 110);
        card.querySelector(dx > 0 ? '.like' : '.nope').style.opacity = p;
        card.querySelector(dx > 0 ? '.nope' : '.like').style.opacity = 0;
      });
      const release = () => {
        if(!dragging) return; dragging = false;
        const commit = Math.abs(dx) > 130 || Math.abs(vx) > 600;
        if(commit) fling(card, (dx || vx) > 0 ? 1 : -1);
        else {
          gsap.to(card, { x: 0, y: 0, rotation: 0, duration: reduced ? 0 : .55, ease: 'elastic.out(1,.6)' });
          card.querySelectorAll('.stamp').forEach(s => gsap.to(s, { opacity: 0, duration: .2 }));
        }
        dx = dy = vx = 0;
      };
      card.addEventListener('pointerup', release);
      card.addEventListener('pointercancel', release);
    }

    function fling(card, dir){
      buzz(12);
      cards.shift(); history.push(card);
      card.querySelector(dir > 0 ? '.like' : '.nope').style.opacity = 1;
      gsap.to(card, { x: dir * (innerWidth < 760 ? innerWidth : 480), rotation: dir * 32, y: 60,
        duration: reduced ? 0 : .45, ease: 'power2.in',
        onComplete: () => { card.remove(); if(history.length > 10) history.shift(); } });
      fill();
    }

    document.getElementById('btnYes').addEventListener('click', () => cards[0] && fling(cards[0], 1));
    document.getElementById('btnNo').addEventListener('click', () => cards[0] && fling(cards[0], -1));
    document.getElementById('undo').addEventListener('click', () => {
      const last = history.pop();
      if(!last || !last.parentNode) {
        // card already removed — rebuild it at the front
        if(!last) return;
        deck.appendChild(last);
      }
      gsap.killTweensOf(last);
      cards.unshift(last);
      last.querySelectorAll('.stamp').forEach(s => s.style.opacity = 0);
      gsap.fromTo(last, { x: -320, rotation: -20, opacity: 1 }, { x: 0, y: 0, rotation: 0, duration: reduced ? 0 : .5, ease: 'power3.out' });
      layout();
      buzz(8);
    });

    fill();
  </script>
</body>
</html>
```