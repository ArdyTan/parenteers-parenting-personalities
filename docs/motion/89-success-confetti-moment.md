# Technique 89 — Success Confetti Moment

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** Mobile · GSAP
**Dependencies:** `vendor/gsap.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

The payoff: the ring sweeps, the check draws itself, copy and receipt rise in sequence, and a canvas confetti burst rains once with gravity, drift and flutter — then fully stops. No idle loop, battery-friendly.

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

## Full working source (`89.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
<title>89 — Success Confetti Moment</title>
<link href="vendor/fonts.css" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  :root{--bg:#0b0b0f;--fg:#f4f1ea;--mut:#73737d;--accent:#c8ff00;--ok:#3ba55d}
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

  .screen{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 34px;text-align:center}
  confetti,canvas.confetti{position:absolute;inset:0;z-index:5;pointer-events:none}
  .badge{width:118px;height:118px;border-radius:50%;background:rgba(59,165,93,.14);display:grid;place-items:center;margin-bottom:26px}
  .badge svg{width:64px;height:64px}
  .badge circle{fill:none;stroke:var(--ok);stroke-width:5;stroke-dasharray:283;stroke-dashoffset:283;transform:rotate(-90deg);transform-origin:center}
  .badge path{fill:none;stroke:var(--ok);stroke-width:6;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:48;stroke-dashoffset:48}
  .screen h1{font-family:'Instrument Serif',serif;font-weight:400;font-size:34px;line-height:1;opacity:0}
  .screen .sub{margin-top:10px;color:var(--mut);font-size:14px;opacity:0}
  .receipt{margin-top:22px;width:100%;background:#15151b;border:1px solid #1f1f28;border-radius:16px;padding:16px 18px;opacity:0}
  .receipt .r{display:flex;justify-content:space-between;font-size:13px;padding:5px 0;color:var(--mut)}
  .receipt .r b{color:var(--fg);font-weight:500}
  .receipt .r.big{font-size:16px;font-weight:600;padding-top:11px;margin-top:6px;border-top:1px solid #23232b}
  .receipt .r.big b{color:var(--accent)}
  .done{margin-top:22px;width:100%;height:52px;border:none;border-radius:15px;background:var(--accent);color:#101204;font:inherit;font-size:15px;font-weight:600;cursor:pointer;opacity:0}
  .again{position:absolute;top:56px;right:20px;z-index:8;background:none;border:1px solid #26262e;border-radius:20px;color:var(--accent);font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.1em;padding:8px 14px;cursor:pointer}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">89 / Confetti Moment</span>
  </nav>
  <div class="caption">
    <b>The payoff moment.</b> Order complete: the ring sweeps closed, the check draws itself, the copy and receipt rise in sequence, and a canvas confetti burst rains once with real gravity, drift and flutter — then fully stops (no looping rAF, battery-friendly). Tap "Replay" to fire it again.
  </div>

  <div class="stage">
    <div class="phone">
      <div class="pnotch"></div>
      <canvas class="confetti" id="cvs"></canvas>
      <button class="again" id="again">↻ REPLAY</button>
      <div class="screen">
        <div class="badge">
          <svg viewBox="0 0 70 70">
            <circle id="ring" cx="35" cy="35" r="30"/>
            <path id="check" d="M20 36 L31 47 L51 24"/>
          </svg>
        </div>
        <h1 id="title">You're all set.</h1>
        <p class="sub" id="sub">Order #A-2617 confirmed</p>
        <div class="receipt" id="receipt">
          <div class="r"><span>Kinetik — motion license</span><b>$118</b></div>
          <div class="r"><span>Extended support</span><b>$32</b></div>
          <div class="r big"><span>Paid</span><b>$150.00</b></div>
        </div>
        <button class="done" id="doneBtn">Back to library</button>
      </div>
      <div class="phome"></div>
    </div>
  </div>

  <script src="vendor/gsap.min.js"></script>
  <script>
    const buzz = ms => navigator.vibrate && navigator.vibrate(ms);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const phone = document.querySelector('.phone');
    const cvs = document.getElementById('cvs');
    const ctx = cvs.getContext('2d');
    const DPR = Math.min(devicePixelRatio, 2);
    function sizeCanvas(){
      cvs.width = phone.clientWidth * DPR; cvs.height = phone.clientHeight * DPR;
      cvs.style.width = phone.clientWidth + 'px'; cvs.style.height = phone.clientHeight + 'px';
    }
    sizeCanvas(); addEventListener('resize', sizeCanvas);

    const ring = document.getElementById('ring');
    const check = document.getElementById('check');

    function playScene(){
      gsap.set(ring, { strokeDashoffset: 283 });
      gsap.set(check, { strokeDashoffset: 48 });
      gsap.set(['#title', '#sub', '#receipt', '#doneBtn'], { opacity: 0, y: 16 });
      const tl = gsap.timeline();
      tl.to(ring, { strokeDashoffset: 0, duration: reduced ? 0 : .6, ease: 'power2.inOut' })
        .to(check, { strokeDashoffset: 0, duration: reduced ? 0 : .35, ease: 'power2.out', onStart: () => buzz([12, 40, 12]) }, '-=.1')
        .add(fireConfetti, '-=.15')
        .to('#title', { opacity: 1, y: 0, duration: reduced ? 0 : .5, ease: 'power3.out' }, '-=.2')
        .to('#sub', { opacity: 1, y: 0, duration: .4 }, '-=.3')
        .to('#receipt', { opacity: 1, y: 0, duration: .45, ease: 'power3.out' }, '-=.2')
        .to('#doneBtn', { opacity: 1, y: 0, duration: .4 }, '-=.25');
    }

    /* one-shot confetti with real physics; the rAF stops when all pieces settle */
    const COLORS = ['#c8ff00', '#ff2d6f', '#37e6ff', '#ffd23f', '#f4f1ea', '#9d7bff'];
    let pieces = [], raf = null;
    function fireConfetti(){
      if(reduced) return;
      const W = cvs.width, cx = W / 2, cy = cvs.height * .34;
      pieces = [];
      for(let i = 0; i < 130; i++){
        const a = -Math.PI / 2 + gsap.utils.random(-.9, .9);
        const sp = gsap.utils.random(6, 16) * DPR;
        pieces.push({
          x: cx + gsap.utils.random(-20, 20) * DPR, y: cy,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - gsap.utils.random(2, 6) * DPR,
          w: gsap.utils.random(6, 11) * DPR, h: gsap.utils.random(8, 15) * DPR,
          rot: gsap.utils.random(0, Math.PI * 2), vr: gsap.utils.random(-.3, .3),
          color: COLORS[i % COLORS.length], flip: gsap.utils.random(0, Math.PI * 2), vf: gsap.utils.random(.1, .3),
          life: 1,
        });
      }
      if(!raf) raf = requestAnimationFrame(step);
    }
    function step(){
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      let alive = 0;
      const grav = .28 * DPR, drag = .992, floor = cvs.height + 40;
      for(const p of pieces){
        if(p.y > floor){ continue; }
        alive++;
        p.vy += grav; p.vx *= drag; p.vy *= drag;
        p.x += p.vx; p.y += p.vy;
        p.rot += p.vr; p.flip += p.vf;
        if(p.y > cvs.height * .8) p.life -= .03;    // fade near the bottom
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.cos(p.flip));             // flutter — thin edge-on
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if(alive > 0) raf = requestAnimationFrame(step);
      else { ctx.clearRect(0, 0, cvs.width, cvs.height); raf = null; }   // fully stop — no idle loop
    }

    document.getElementById('again').addEventListener('click', playScene);
    document.getElementById('doneBtn').addEventListener('click', () => {
      buzz(6);
      gsap.to('.screen', { scale: .96, opacity: .4, duration: .3, yoyo: true, repeat: 1 });
    });
    document.fonts && document.fonts.ready ? document.fonts.ready.then(playScene) : playScene();
  </script>
</body>
</html>
```