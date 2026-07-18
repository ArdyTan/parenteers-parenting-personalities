# Technique 83 — Tactile Toggles

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** Mobile · GSAP
**Dependencies:** `vendor/gsap.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

Controls with mass: the switch knob squashes wide while pressed, can be tapped or dragged, and settles with an elastic snap; checkboxes draw their own tick; radio dots jelly in with overshoot.

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

## Full working source (`83.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
<title>83 — Tactile Toggles</title>
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

  .appbar{padding:58px 22px 14px}
  .appbar h1{font-family:'Instrument Serif',serif;font-weight:400;font-size:26px}
  .appbar p{font-family:'Space Mono',monospace;font-size:10px;color:var(--mut);letter-spacing:.12em;margin-top:5px}
  .group{margin:0 18px 16px;background:#15151b;border:1px solid #1f1f28;border-radius:16px;overflow:hidden}
  .grouplbl{padding:14px 18px 8px;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.14em;color:var(--accent)}
  .row{display:flex;align-items:center;gap:14px;padding:13px 18px;border-top:1px solid #1b1b23}
  .row h3{font-size:14px;font-weight:500}
  .row p{font-family:'Space Mono',monospace;font-size:9px;color:var(--mut);letter-spacing:.08em;margin-top:3px}
  .row .ctrl{margin-left:auto;flex-shrink:0}

  /* switch */
  .sw{position:relative;width:56px;height:32px;border-radius:17px;background:#26262f;cursor:pointer;touch-action:none;transition:background .3s;-webkit-tap-highlight-color:transparent}
  .sw.on{background:var(--accent)}
  .sw .knob{position:absolute;top:3px;left:3px;width:26px;height:26px;border-radius:14px;background:#f4f1ea;box-shadow:0 3px 8px rgba(0,0,0,.4);will-change:transform,width;transform-origin:center}
  .sw.on .knob{background:#101204}

  /* checkbox */
  .cb{position:relative;width:28px;height:28px;border-radius:9px;border:2px solid #2e2e39;background:none;cursor:pointer;transition:background .25s,border-color .25s;-webkit-tap-highlight-color:transparent}
  .cb.on{background:var(--accent);border-color:var(--accent)}
  .cb svg{position:absolute;inset:3px;pointer-events:none}
  .cb path{fill:none;stroke:#101204;stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:22;stroke-dashoffset:22}

  /* radio */
  .radios{display:flex;gap:10px}
  .rad{position:relative;width:26px;height:26px;border-radius:50%;border:2px solid #2e2e39;background:none;cursor:pointer;transition:border-color .25s;-webkit-tap-highlight-color:transparent}
  .rad i{position:absolute;inset:5px;border-radius:50%;background:var(--accent);transform:scale(0)}
  .rad.on{border-color:var(--accent)}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">83 / Tactile Toggles</span>
  </nav>
  <div class="caption">
    <b>Controls with mass.</b> The switch knob squashes wide while pressed, can be tapped <i>or dragged</i>, and settles with an elastic snap; the checkbox draws its own tick; radio dots jelly in with overshoot. Every commit ticks the haptics — state feels like a physical event.
  </div>

  <div class="stage">
    <div class="phone">
      <div class="pnotch"></div>
      <div class="appbar"><h1>Preferences</h1><p>TAP — OR DRAG THE SWITCH KNOBS</p></div>

      <div class="group">
        <div class="grouplbl">SWITCHES — PRESS, DRAG, FLING</div>
        <div class="row"><div><h3>Haptic feedback</h3><p>TICKS ON EVERY COMMIT</p></div><div class="ctrl sw on" data-sw><span class="knob"></span></div></div>
        <div class="row"><div><h3>Reduced data</h3><p>SMALLER PREVIEWS</p></div><div class="ctrl sw" data-sw><span class="knob"></span></div></div>
        <div class="row"><div><h3>Night shift</h3><p>WARMER AFTER SUNSET</p></div><div class="ctrl sw" data-sw><span class="knob"></span></div></div>
      </div>

      <div class="group">
        <div class="grouplbl">CHECKBOXES — THE TICK DRAWS ITSELF</div>
        <div class="row"><div><h3>Weekly digest</h3><p>MONDAYS 09:00</p></div><button class="ctrl cb on" data-cb><svg viewBox="0 0 22 22"><path d="M4 11.5 L9 16.5 L18 6"/></svg></button></div>
        <div class="row"><div><h3>Launch alerts</h3><p>ONLY THE BIG ONES</p></div><button class="ctrl cb" data-cb><svg viewBox="0 0 22 22"><path d="M4 11.5 L9 16.5 L18 6"/></svg></button></div>
      </div>

      <div class="group">
        <div class="grouplbl">RADIO — JELLY DOT</div>
        <div class="row"><div><h3>Playback quality</h3><p id="radLbl">HIGH · 1080P</p></div>
          <div class="ctrl radios" id="radios">
            <button class="rad" data-v="AUTO"><i></i></button>
            <button class="rad on" data-v="HIGH · 1080P"><i></i></button>
            <button class="rad" data-v="MAX · 4K"><i></i></button>
          </div></div>
      </div>
      <div class="phome"></div>
    </div>
  </div>

  <script src="vendor/gsap.min.js"></script>
  <script>
    const buzz = ms => navigator.vibrate && navigator.vibrate(ms);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const TRAVEL = 24; // knob travel px

    /* switches: tap or drag, squash while held, elastic settle */
    document.querySelectorAll('[data-sw]').forEach(sw => {
      const knob = sw.querySelector('.knob');
      let on = sw.classList.contains('on');
      let x = on ? TRAVEL : 0, dragging = false, moved = false, sx = 0, ox = 0;
      const draw = () => knob.style.transform = `translateX(${x}px)`;
      draw();

      function settle(newOn){
        if(newOn !== on){ on = newOn; buzz(10); }
        sw.classList.toggle('on', on);
        gsap.to({ v: x }, { v: on ? TRAVEL : 0, duration: reduced ? 0 : .45, ease: 'elastic.out(1,.55)',
          onUpdate(){ x = this.targets()[0].v; draw(); } });
        gsap.to(knob, { scaleX: 1, scaleY: 1, duration: reduced ? 0 : .45, ease: 'elastic.out(1,.5)' });
      }

      sw.addEventListener('pointerdown', e => {
        dragging = true; moved = false; sx = e.clientX; ox = x;
        sw.setPointerCapture(e.pointerId);
        gsap.to(knob, { scaleX: 1.28, scaleY: .88, duration: .18, ease: 'power2.out' }); // press squash
        buzz(5);
      });
      sw.addEventListener('pointermove', e => {
        if(!dragging) return;
        const dx = e.clientX - sx;
        if(Math.abs(dx) > 4) moved = true;
        x = gsap.utils.clamp(-4, TRAVEL + 4, ox + dx); // slight over-travel gives the rubber feel
        draw();
      });
      const up = () => {
        if(!dragging) return; dragging = false;
        settle(moved ? x > TRAVEL / 2 : !on);
      };
      sw.addEventListener('pointerup', up);
      sw.addEventListener('pointercancel', up);
    });

    /* checkboxes: elastic box pop + self-drawing tick */
    document.querySelectorAll('[data-cb]').forEach(cb => {
      const path = cb.querySelector('path');
      const set = on => {
        cb.classList.toggle('on', on);
        buzz(8);
        gsap.fromTo(cb, { scale: .82 }, { scale: 1, duration: reduced ? 0 : .5, ease: 'elastic.out(1.2,.5)' });
        gsap.to(path, { strokeDashoffset: on ? 0 : 22, duration: reduced ? 0 : (on ? .35 : .2), ease: on ? 'power2.out' : 'power2.in' });
      };
      if(cb.classList.contains('on')) gsap.set(path, { strokeDashoffset: 0 });
      cb.addEventListener('click', () => set(!cb.classList.contains('on')));
    });

    /* radios: jelly dot hops between options */
    const rads = [...document.querySelectorAll('.rad')];
    rads.forEach(r => {
      if(r.classList.contains('on')) gsap.set(r.querySelector('i'), { scale: 1 });
      r.addEventListener('click', () => {
        if(r.classList.contains('on')) return;
        buzz(8);
        rads.forEach(o => {
          const was = o.classList.contains('on');
          o.classList.remove('on');
          if(was) gsap.to(o.querySelector('i'), { scale: 0, duration: .18, ease: 'power2.in' });
        });
        r.classList.add('on');
        gsap.fromTo(r.querySelector('i'), { scale: 0 }, { scale: 1, duration: reduced ? 0 : .55, ease: 'elastic.out(1.4,.5)' });
        document.getElementById('radLbl').textContent = r.dataset.v;
      });
    });
  </script>
</body>
</html>
```