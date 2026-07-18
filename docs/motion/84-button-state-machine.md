# Technique 84 — Button State Machine

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** Mobile · GSAP
**Dependencies:** `vendor/gsap.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

One node, one continuous shape: idle → pressed → loading (collapses to a spinning pill) → success (draws a tick, flashes green) or error (shakes red), then eases home. Fails 1-in-4 to show both branches.

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

## Full working source (`84.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
<title>84 — Button State Machine</title>
<link href="vendor/fonts.css" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  :root{--bg:#0b0b0f;--fg:#f4f1ea;--mut:#73737d;--accent:#c8ff00;--ok:#3ba55d;--err:#ff4d5e}
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

  .checkout{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:0 26px}
  .checkout .card{background:#15151b;border:1px solid #1f1f28;border-radius:18px;padding:20px;margin-bottom:26px}
  .checkout .card .ph{height:120px;border-radius:12px;background:url('assets/img/photo-1604871000636-074fa5117945.jpg') center/cover;margin-bottom:16px}
  .checkout .card .lineitem{display:flex;justify-content:space-between;font-size:14px;padding:5px 0;color:var(--mut)}
  .checkout .card .lineitem b{color:var(--fg);font-weight:500}
  .checkout .card .tot{display:flex;justify-content:space-between;font-size:17px;font-weight:600;padding-top:12px;margin-top:8px;border-top:1px solid #23232b}
  .checkout .card .tot .amt{font-family:'Instrument Serif',serif;font-weight:400;font-size:24px;color:var(--accent)}

  /* the button — one element, morphs across states */
  .sm{position:relative;height:58px;border:none;border-radius:16px;background:var(--accent);color:#101204;font:inherit;font-size:16px;font-weight:600;cursor:pointer;overflow:hidden;will-change:width,border-radius;-webkit-tap-highlight-color:transparent}
  .sm:active{transform:scale(.985)}
  .sm .lbl{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:8px;white-space:nowrap;will-change:transform,opacity}
  .sm .spin{position:absolute;top:50%;left:50%;width:24px;height:24px;margin:-12px 0 0 -12px;border-radius:50%;border:3px solid rgba(16,18,4,.25);border-top-color:#101204;opacity:0}
  .sm .tick{position:absolute;top:50%;left:50%;width:26px;height:26px;margin:-13px 0 0 -13px;opacity:0}
  .sm .tick path{fill:none;stroke:#fff;stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:30;stroke-dashoffset:30}
  .sm.loading{background:var(--accent);border-radius:29px}
  .sm.success{background:var(--ok)}
  .sm.error{background:var(--err)}
  .steps{margin-top:20px;display:flex;justify-content:center;gap:8px;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.12em;color:#3f3f49}
  .steps span.on{color:var(--accent)}
  .retry{margin-top:14px;text-align:center;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.1em;color:var(--mut);opacity:0}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">84 / Button States</span>
  </nav>
  <div class="caption">
    <b>One button, one continuous shape.</b> Idle → pressed → loading (it collapses to a pill and spins) → success (draws a tick, flashes green) or error (shakes red), then eases home. Never a flicker between separate elements — the same node morphs the whole way. It fails 1-in-4 to show the error branch.
  </div>

  <div class="stage">
    <div class="phone">
      <div class="pnotch"></div>
      <div class="checkout">
        <div class="card">
          <div class="ph"></div>
          <div class="lineitem"><span>Kinetik — motion license</span><b>$118</b></div>
          <div class="lineitem"><span>Extended support</span><b>$32</b></div>
          <div class="tot"><span>Total</span><span class="amt">$150</span></div>
        </div>
        <button class="sm" id="btn">
          <span class="lbl" id="lbl">Pay $150</span>
          <span class="spin" id="spin"></span>
          <svg class="tick" id="tick" viewBox="0 0 26 26"><path d="M5 13.5 L11 19 L21 7"/></svg>
        </button>
        <div class="steps" id="steps"><span class="on">IDLE</span><span>LOADING</span><span>RESULT</span></div>
        <div class="retry" id="retry">TAP AGAIN TO RETRY</div>
      </div>
      <div class="phome"></div>
    </div>
  </div>

  <script src="vendor/gsap.min.js"></script>
  <script>
    const buzz = ms => navigator.vibrate && navigator.vibrate(ms);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const btn = document.getElementById('btn');
    const lbl = document.getElementById('lbl');
    const spin = document.getElementById('spin');
    const tick = document.getElementById('tick');
    const tickPath = tick.querySelector('path');
    const steps = [...document.querySelectorAll('.steps span')];
    const retry = document.getElementById('retry');
    let state = 'idle', fullW = 0, spinTween = null, seq = 0;

    function setStep(i){ steps.forEach((s, k) => s.classList.toggle('on', k === i)); }

    btn.addEventListener('click', () => {
      if(state === 'loading') return;
      if(state === 'success') return;              // done
      run();
    });

    function run(){
      const mySeq = ++seq;
      state = 'loading';
      fullW = btn.offsetWidth;
      buzz(10);
      setStep(1);
      gsap.to(retry, { opacity: 0, duration: .2 });
      // reset any prior result styling
      btn.classList.remove('success', 'error');
      // collapse to a pill + spin
      gsap.timeline()
        .to(lbl, { opacity: 0, scale: .8, duration: .18, ease: 'power2.in' }, 0)
        .to(btn, { width: 58, duration: reduced ? 0 : .4, ease: 'power3.inOut', onStart(){ btn.classList.add('loading'); } }, .05)
        .add(() => {
          spin.style.opacity = 1;
          spinTween = gsap.to(spin, { rotation: 360, duration: .7, repeat: -1, ease: 'none' });
        });
      // resolve after a beat — 1 in 4 fails
      gsap.delayedCall(reduced ? .4 : 1.5, () => {
        if(mySeq !== seq) return;
        Math.random() < 0.25 ? fail() : succeed();
      });
    }

    function stopSpin(){ spinTween && spinTween.kill(); gsap.set(spin, { opacity: 0, rotation: 0 }); }

    function succeed(){
      state = 'success';
      stopSpin();
      setStep(2);
      buzz([12, 40, 12]);
      btn.classList.remove('loading');
      btn.classList.add('success');
      tick.style.opacity = 1;
      gsap.fromTo(btn, { scale: .9 }, { scale: 1, duration: .5, ease: 'elastic.out(1.1,.5)' });
      gsap.to(tickPath, { strokeDashoffset: 0, duration: reduced ? 0 : .4, ease: 'power2.out' });
      // settle back home after a moment
      gsap.delayedCall(reduced ? .5 : 1.8, reset);
    }

    function fail(){
      state = 'error';
      stopSpin();
      setStep(2);
      buzz([20, 60, 20, 60, 20]);
      btn.classList.remove('loading');
      btn.classList.add('error');
      lbl.textContent = '✕  Declined';
      gsap.to(btn, { width: fullW, borderRadius: 16, duration: .35, ease: 'power3.out',
        onComplete(){ gsap.to(lbl, { opacity: 1, scale: 1, duration: .2 }); } });
      // the shake
      gsap.fromTo(btn, { x: -10 }, { x: 0, duration: .5, ease: 'elastic.out(1.6,.3)', delay: .1 });
      gsap.to(retry, { opacity: 1, duration: .3, delay: .4 });
      state = 'idle';                              // allow retry
    }

    function reset(){
      btn.classList.remove('success', 'error', 'loading');
      tick.style.opacity = 0;
      gsap.set(tickPath, { strokeDashoffset: 30 });
      gsap.set(btn, { width: fullW, borderRadius: 16 });
      lbl.textContent = 'Pay $150';
      gsap.to(lbl, { opacity: 1, scale: 1, duration: .3 });
      setStep(0);
      state = 'idle';
    }
  </script>
</body>
</html>
```