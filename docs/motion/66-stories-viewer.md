# Technique 66 — Stories Viewer

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** Mobile · Navigation · GSAP
**Dependencies:** `vendor/gsap.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

Segmented bars auto-advance on a tween; tap thirds to skip or rewind, hold anywhere to pause (chrome fades), and swipe down to drag the whole story off — shrinking as it follows your finger.

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

## Full working source (`66.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
<title>66 — Stories Viewer</title>
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

  /* the "app" behind the story */
  .behind{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px}
  .behind h2{font-family:'Instrument Serif',serif;font-weight:400;font-size:28px}
  .behind button{background:var(--accent);border:none;border-radius:30px;color:#101204;font:inherit;font-weight:600;font-size:13px;padding:13px 26px;cursor:pointer}

  .story{position:absolute;inset:0;z-index:10;background:#000;will-change:transform;touch-action:none;overflow:hidden;border-radius:inherit}
  .slide{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0}
  .slide.on{opacity:1}
  .slide::after{content:"";position:absolute;inset:0;background:linear-gradient(rgba(0,0,0,.42),transparent 26%,transparent 68%,rgba(0,0,0,.5))}
  .bars{position:absolute;top:16px;left:12px;right:12px;display:flex;gap:5px;z-index:6}
  .bars i{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.28);overflow:hidden}
  .bars i b{display:block;height:100%;width:100%;background:#fff;transform:scaleX(0);transform-origin:left}
  .who{position:absolute;top:30px;left:16px;z-index:6;display:flex;align-items:center;gap:11px}
  .who .av{width:36px;height:36px;border-radius:50%;background-size:cover;border:2px solid var(--accent)}
  .who h3{font-size:13.5px;font-weight:600}
  .who p{font-family:'Space Mono',monospace;font-size:9.5px;color:rgba(255,255,255,.65);letter-spacing:.08em}
  .cap{position:absolute;left:20px;bottom:86px;z-index:6;font-family:'Instrument Serif',serif;font-weight:400;font-size:30px;line-height:1.05;max-width:80%;text-shadow:0 2px 18px rgba(0,0,0,.55)}
  .reply{position:absolute;left:16px;right:16px;bottom:26px;z-index:6;display:flex;gap:10px}
  .reply input{flex:1;height:44px;border-radius:24px;border:1px solid rgba(255,255,255,.35);background:rgba(0,0,0,.25);color:#fff;font:inherit;font-size:13px;padding:0 18px;outline:none}
  .reply button{width:44px;height:44px;border-radius:50%;border:none;background:rgba(255,255,255,.15);color:#fff;font-size:17px;cursor:pointer}
  .pausedTag{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:7;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.2em;color:#fff;background:rgba(0,0,0,.45);padding:9px 16px;border-radius:20px;opacity:0;pointer-events:none}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">66 / Stories</span>
  </nav>
  <div class="caption">
    <b>The Stories grammar.</b> Segmented bars auto-advance on a tween; tap right/left thirds to skip/rewind; <i>hold anywhere</i> to pause (chrome fades away); swipe down and the whole story follows your finger, shrinking — release past the threshold to dismiss to the app underneath.
  </div>

  <div class="stage">
    <div class="phone">
      <div class="pnotch"></div>
      <div class="behind"><h2>Story closed.</h2><button id="reopen">▶ &nbsp;Watch again</button></div>
      <div class="story" id="story">
        <div class="bars" id="bars"></div>
        <div class="who">
          <div class="av" style="background-image:url('assets/img/photo-1550684848-fac1c5b4e853.jpg')"></div>
          <div><h3>motionlibrary</h3><p id="whoTime">2H AGO</p></div>
        </div>
        <div id="slides"></div>
        <h2 class="cap" id="cap"></h2>
        <div class="pausedTag" id="pausedTag">❚❚ PAUSED</div>
        <div class="reply"><input placeholder="Send a message…" readonly><button>♥</button></div>
      </div>
      <div class="phome"></div>
    </div>
  </div>

  <script src="vendor/gsap.min.js"></script>
  <script>
    const buzz = ms => navigator.vibrate && navigator.vibrate(ms);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const STORIES = [
      { img:'1618005182384-a83a8bd57fbe', cap:'Gradient fields,\nrendered live.', t:'2H AGO' },
      { img:'1620121684840-edffcfc4b878', cap:'The WebGL hero\nshipped today.', t:'2H AGO' },
      { img:'1633186710895-309db2eca9e4', cap:'Spatial study,\nframe 034.', t:'1H AGO' },
      { img:'1557672172-298e090bd0f1', cap:'See you at the\nawards. ✳', t:'44M AGO' },
    ];
    const DUR = 4.2;
    const story = document.getElementById('story');
    const phone = document.querySelector('.phone');
    const bars = document.getElementById('bars');
    const slidesEl = document.getElementById('slides');
    const cap = document.getElementById('cap');

    STORIES.forEach(s => {
      bars.innerHTML += '<i><b></b></i>';
      slidesEl.innerHTML += `<div class="slide" style="background-image:url('assets/img/photo-${s.img}.jpg')"></div>`;
    });
    const fills = [...bars.querySelectorAll('b')];
    const slides = [...slidesEl.children];

    let idx = -1, tween = null, closed = false;

    function show(i){
      if(i >= STORIES.length) return dismiss(true);   // finished
      if(i < 0) i = 0;
      idx = i;
      buzz(5);
      slides.forEach((s, k) => s.classList.toggle('on', k === i));
      fills.forEach((f, k) => gsap.set(f, { scaleX: k < i ? 1 : 0 }));
      document.getElementById('whoTime').textContent = STORIES[i].t;
      cap.innerHTML = STORIES[i].cap.replace(/\n/g, '<br>');
      gsap.fromTo(cap, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: reduced ? 0 : .5, ease: 'power3.out' });
      gsap.fromTo(slides[i], { scale: 1.06 }, { scale: 1, duration: reduced ? 0 : DUR + .5, ease: 'none' });
      tween && tween.kill();
      tween = gsap.fromTo(fills[i], { scaleX: 0 }, { scaleX: 1, duration: reduced ? 1.5 : DUR, ease: 'none', onComplete: () => show(idx + 1) });
    }

    /* tap zones + hold to pause + swipe-down dismiss — one pointer path */
    let downT = 0, sx = 0, sy = 0, draggingDown = false, holdTimer = null, paused = false;
    const chrome = ['.bars', '.who', '.cap', '.reply'].map(s => story.querySelector(s));

    function pause(){
      if(paused) return; paused = true;
      tween && tween.pause();
      gsap.to(chrome, { opacity: 0, duration: .25 });
      gsap.to('#pausedTag', { opacity: 1, duration: .25 });
    }
    function resume(){
      if(!paused) return; paused = false;
      tween && tween.play();
      gsap.to(chrome, { opacity: 1, duration: .25 });
      gsap.to('#pausedTag', { opacity: 0, duration: .2 });
    }

    story.addEventListener('pointerdown', e => {
      if(closed) return;
      downT = performance.now(); sx = e.clientX; sy = e.clientY; draggingDown = false;
      story.setPointerCapture(e.pointerId);
      holdTimer = setTimeout(pause, 220);
    });
    story.addEventListener('pointermove', e => {
      if(closed || !downT) return;
      const dy = e.clientY - sy;
      if(!draggingDown && dy > 14 && Math.abs(e.clientX - sx) < 40){
        draggingDown = true; clearTimeout(holdTimer); pause();
      }
      if(draggingDown){
        const p = gsap.utils.clamp(0, 1, dy / phone.clientHeight);
        gsap.set(story, { y: dy * .9, scale: 1 - p * .12, borderRadius: 40 });
      }
    });
    story.addEventListener('pointerup', e => {
      if(closed) return;
      clearTimeout(holdTimer);
      const dy = e.clientY - sy, held = performance.now() - downT;
      if(draggingDown){
        if(dy > phone.clientHeight * .22) return dismiss(false);
        gsap.to(story, { y: 0, scale: 1, borderRadius: 0, duration: reduced ? 0 : .4, ease: 'back.out(1.4)' });
        resume();
      } else if(paused){
        resume();
      } else if(held < 220){
        // tap: right two-thirds forward, left third back
        const r = phone.getBoundingClientRect();
        (e.clientX - r.left) < r.width / 3 ? show(idx - 1) : show(idx + 1);
      }
      downT = 0; draggingDown = false;
    });

    function dismiss(finished){
      closed = true;
      tween && tween.kill();
      buzz(10);
      gsap.to(story, { y: phone.clientHeight * (finished ? .35 : 1), scale: .8, opacity: 0,
        duration: reduced ? 0 : .4, ease: 'power3.in',
        onComplete(){ story.style.visibility = 'hidden'; } });
    }
    document.getElementById('reopen').addEventListener('click', () => {
      closed = false; paused = false;
      story.style.visibility = 'visible';
      gsap.fromTo(story, { y: phone.clientHeight * .5, scale: .85, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, borderRadius: 0, duration: reduced ? 0 : .45, ease: 'power3.out' });
      gsap.set(chrome, { opacity: 1 });
      show(0);
    });

    show(0);
  </script>
</body>
</html>
```