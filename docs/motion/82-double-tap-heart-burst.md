# Technique 82 — Double-Tap Heart Burst

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** Mobile · GSAP
**Dependencies:** `vendor/gsap.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

The Instagram like: a heart pops at the tap point with back-ease, a dozen particles fan out on randomized vectors with gravity, the like button syncs, and the count rolls like an odometer.

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

## Full working source (`82.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
<title>82 — Double-Tap Heart Burst</title>
<link href="vendor/fonts.css" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  :root{--bg:#0b0b0f;--fg:#f4f1ea;--mut:#73737d;--accent:#c8ff00;--heart:#ff4d6a}
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

  .post{position:absolute;top:50%;left:18px;right:18px;transform:translateY(-50%);background:#15151b;border:1px solid #1f1f28;border-radius:18px;overflow:hidden}
  .post .who{display:flex;align-items:center;gap:10px;padding:13px 16px}
  .post .av{width:34px;height:34px;border-radius:50%;background:url('assets/img/photo-1550684848-fac1c5b4e853.jpg') center/cover;border:1.5px solid var(--accent)}
  .post .who b{font-size:13px;font-weight:600}
  .post .who p{font-family:'Space Mono',monospace;font-size:9px;color:var(--mut);letter-spacing:.1em;margin-top:2px}
  .canvasWrap{position:relative;height:340px;touch-action:manipulation;user-select:none;cursor:pointer;overflow:hidden}
  .canvasWrap img{width:100%;height:100%;object-fit:cover;pointer-events:none;-webkit-user-drag:none}
  .actions{display:flex;align-items:center;gap:16px;padding:13px 16px 15px}
  .actions button{background:none;border:none;color:var(--fg);font-size:22px;cursor:pointer;line-height:1;-webkit-tap-highlight-color:transparent}
  .actions .likebtn.on{color:var(--heart)}
  .likerow{display:flex;align-items:baseline;gap:6px;padding:0 16px 16px;font-size:13px}
  /* rolling counter */
  .odo{display:inline-flex;overflow:hidden;height:17px;font-weight:600}
  .odo .col{position:relative;width:.62em;height:17px}
  .odo .col i{position:absolute;left:0;top:0;font-style:normal;line-height:17px;will-change:transform}
  .bigheart{position:absolute;z-index:10;font-size:96px;color:var(--heart);pointer-events:none;opacity:0;filter:drop-shadow(0 8px 26px rgba(0,0,0,.5))}
  .p{position:absolute;z-index:9;pointer-events:none;font-size:16px;will-change:transform,opacity}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">82 / Heart Burst</span>
  </nav>
  <div class="caption">
    <b>The double-tap like.</b> A heart pops at the exact tap point with a back-ease, a dozen particles fan out on randomized vectors with gravity, the like button syncs with its own bounce, and the count rolls like an odometer — each digit sliding, not swapping.
  </div>

  <div class="stage">
    <div class="phone">
      <div class="pnotch"></div>
      <div class="post">
        <div class="who"><span class="av"></span><div><b>ember.haus</b><p>OSLO · 2H</p></div></div>
        <div class="canvasWrap" id="wrap">
          <img src="assets/img/photo-1618556450991-2f1af64e8191.jpg" draggable="false">
        </div>
        <div class="actions">
          <button class="likebtn" id="likebtn">♡</button>
          <button>💬</button>
          <button>↗</button>
        </div>
        <div class="likerow"><span class="odo" id="odo"></span><span style="color:var(--mut)">likes · double-tap the photo</span></div>
      </div>
      <div class="phome"></div>
    </div>
  </div>

  <script src="vendor/gsap.min.js"></script>
  <script>
    const buzz = ms => navigator.vibrate && navigator.vibrate(ms);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const phone = document.querySelector('.phone');
    const wrap = document.getElementById('wrap');
    const likebtn = document.getElementById('likebtn');
    const odo = document.getElementById('odo');

    /* odometer: one column per digit; on change each column slides to its new digit */
    let likes = 1284, liked = false;
    let colDigits = [];
    function renderOdo(n, dir = 1){
      const s = String(n);
      // (re)build columns if digit count changed
      if(odo.children.length !== s.length){
        odo.innerHTML = [...s].map(d => `<span class="col"><i>${d}</i></span>`).join('');
        colDigits = [...s];
        return;
      }
      [...s].forEach((d, i) => {
        if(colDigits[i] === d) return;
        const col = odo.children[i];
        const old = col.querySelector('i');
        const neu = document.createElement('i');
        neu.textContent = d;
        col.appendChild(neu);
        gsap.fromTo(neu, { y: 17 * dir }, { y: 0, duration: reduced ? 0 : .4, ease: 'power3.out' });
        gsap.to(old, { y: -17 * dir, duration: reduced ? 0 : .4, ease: 'power3.out', onComplete(){ old.remove(); } });
        colDigits[i] = d;
      });
    }
    renderOdo(likes);

    function setLiked(v, burstAt){
      if(v === liked) return;
      liked = v;
      likes += v ? 1 : -1;
      renderOdo(likes, v ? 1 : -1);
      likebtn.classList.toggle('on', v);
      likebtn.textContent = v ? '♥' : '♡';
      buzz(v ? [10, 40, 12] : 8);
      gsap.fromTo(likebtn, { scale: .5, rotation: v ? -14 : 0 }, { scale: 1, rotation: 0, duration: reduced ? 0 : .55, ease: 'back.out(3)' });
      if(v && burstAt && !reduced) burst(burstAt.x, burstAt.y);
    }

    function burst(x, y){
      const pr = phone.getBoundingClientRect();
      const px = x - pr.left, py = y - pr.top;
      // the big heart at the tap point
      const big = document.createElement('div');
      big.className = 'bigheart';
      big.textContent = '♥';
      big.style.left = (px - 48) + 'px';
      big.style.top = (py - 55) + 'px';
      phone.appendChild(big);
      gsap.timeline({ onComplete(){ big.remove(); } })
        .fromTo(big, { scale: .3, opacity: 0, rotation: gsap.utils.random(-16, 16) },
          { scale: 1, opacity: 1, duration: .28, ease: 'back.out(3)' })
        .to(big, { scale: 1.2, y: -46, opacity: 0, duration: .5, ease: 'power2.in' }, '+=.18');
      // particle fan: randomized vectors + gravity
      const GLYPHS = ['♥','♥','♥','✦','✧','●'];
      for(let i = 0; i < 14; i++){
        const p = document.createElement('span');
        p.className = 'p';
        p.textContent = GLYPHS[i % GLYPHS.length];
        p.style.color = i % 3 ? 'var(--heart)' : 'var(--accent)';
        p.style.left = px + 'px'; p.style.top = py + 'px';
        p.style.fontSize = gsap.utils.random(9, 19) + 'px';
        phone.appendChild(p);
        const a = gsap.utils.random(0, Math.PI * 2), sp = gsap.utils.random(60, 150);
        gsap.timeline({ onComplete(){ p.remove(); } })
          .to(p, { x: Math.cos(a) * sp, duration: .8, ease: 'power2.out' }, 0)
          .to(p, { y: Math.sin(a) * sp * .7, duration: .35, ease: 'power2.out' }, 0)      // launch
          .to(p, { y: '+=90', duration: .5, ease: 'power2.in' }, .32)                     // gravity
          .to(p, { opacity: 0, rotation: gsap.utils.random(-120, 120), duration: .45 }, .35);
      }
    }

    /* double-tap detect on the photo */
    let lastTap = 0, lastPos = null;
    wrap.addEventListener('pointerup', e => {
      const now = performance.now();
      if(now - lastTap < 300 && lastPos && Math.hypot(e.clientX - lastPos.x, e.clientY - lastPos.y) < 40){
        liked = false;                          // double-tap always likes (never unlikes)
        setLiked(true, { x: e.clientX, y: e.clientY });
        lastTap = 0;
      } else { lastTap = now; lastPos = { x: e.clientX, y: e.clientY }; }
    });
    likebtn.addEventListener('click', () => {
      const r = wrap.getBoundingClientRect();
      setLiked(!liked, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
    });
  </script>
</body>
</html>
```