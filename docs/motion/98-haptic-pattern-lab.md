# Technique 98 — Haptic Pattern Lab

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** Mobile · Sensors · GSAP
**Dependencies:** `vendor/gsap.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

Design a navigator.vibrate([on,off,…]) pattern — fire presets or tap-build your own; a synced playhead sweeps the timeline and a light pulse fires on each "on", so it reads even on iOS (no vibrate API).

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

## Full working source (`98.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
<title>98 — Haptic Pattern Lab</title>
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

  .screen{position:absolute;inset:0;display:flex;flex-direction:column;padding:56px 24px 24px}
  h1{font-family:'Instrument Serif',serif;font-weight:400;font-size:26px}
  .sub{font-family:'Space Mono',monospace;font-size:10px;color:var(--mut);letter-spacing:.1em;margin-top:5px}
  .support{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.06em;margin-top:8px;padding:7px 11px;border-radius:8px;display:inline-block;align-self:flex-start}
  .support.yes{color:#3ba55d;background:rgba(59,165,93,.12)}
  .support.no{color:#ff9f43;background:rgba(255,159,67,.12)}

  .presets{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:20px 0}
  .presets button{background:#15151b;border:1px solid #23232b;border-radius:14px;color:var(--fg);font:inherit;font-size:13px;font-weight:500;padding:16px 10px;cursor:pointer;text-align:left}
  .presets button:active{background:#1c1c24;border-color:var(--accent)}
  .presets button small{display:block;font-family:'Space Mono',monospace;font-size:8px;letter-spacing:.06em;color:var(--mut);margin-top:4px}

  /* the visual pattern timeline */
  .lab{margin-top:auto}
  .lab .lbl{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.12em;color:var(--mut);margin-bottom:8px}
  .timeline{position:relative;height:56px;background:#101015;border:1px solid #23232b;border-radius:12px;overflow:hidden;display:flex;align-items:center;padding:0 4px}
  .timeline .seg{height:34px;border-radius:6px;margin:0 1px;flex-shrink:0}
  .timeline .on{background:var(--accent)}
  .timeline .off{background:#1c1c24}
  .playhead{position:absolute;top:0;left:0;width:2px;height:100%;background:#fff;opacity:0;box-shadow:0 0 8px #fff}
  .pulse{position:absolute;left:50%;top:34%;transform:translate(-50%,-50%);width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(200,255,0,.4),transparent 65%);opacity:0;pointer-events:none;z-index:1}

  .builder{display:flex;gap:8px;margin-top:14px}
  .builder button{flex:1;background:#15151b;border:1px solid #23232b;border-radius:11px;color:var(--fg);font:inherit;font-size:12px;padding:12px 0;cursor:pointer}
  .builder button.play{background:var(--accent);color:#101204;font-weight:600}
  .code{font-family:'Space Mono',monospace;font-size:9.5px;color:var(--accent);margin-top:12px;word-break:break-all;min-height:14px}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">98 / Haptic Lab</span>
  </nav>
  <div class="caption">
    <b>Design a vibration pattern.</b> <code>navigator.vibrate([on, off, on, …])</code> takes a millisecond array; here you fire presets or build your own by tapping OFF/short/long segments. A synced playhead sweeps the timeline and a light pulse fires on every "on" — so the pattern reads even on iOS (no vibrate API).
  </div>

  <div class="stage">
    <div class="phone">
      <div class="pnotch"></div>
      <div class="pulse" id="pulse"></div>
      <div class="screen">
        <h1>Haptic Lab</h1>
        <div class="sub">TAP A PRESET — OR BUILD A PATTERN</div>
        <span class="support" id="support">CHECKING…</span>

        <div class="presets" id="presets"></div>

        <div class="lab">
          <div class="lbl">PATTERN TIMELINE</div>
          <div class="timeline" id="timeline"><div class="playhead" id="playhead"></div></div>
          <div class="builder">
            <button data-add="off">＋ Gap</button>
            <button data-add="short">＋ Tap</button>
            <button data-add="long">＋ Buzz</button>
            <button id="clear">Clear</button>
            <button class="play" id="play">▶ Play</button>
          </div>
          <div class="code" id="code">vibrate([])</div>
        </div>
      </div>
      <div class="phome"></div>
    </div>
  </div>

  <script src="vendor/gsap.min.js"></script>
  <script>
    const hasVibrate = 'vibrate' in navigator;
    const support = document.getElementById('support');
    support.className = 'support ' + (hasVibrate ? 'yes' : 'no');
    support.textContent = hasVibrate ? '✓ navigator.vibrate SUPPORTED — REAL BUZZ' : '⚠ NO VIBRATE API (iOS) — VISUAL ONLY';

    const PRESETS = {
      'Tick':       { p: [10], d: 'SINGLE 10MS' },
      'Success':    { p: [12, 40, 12], d: 'DOUBLE PULSE' },
      'Error':      { p: [20, 60, 20, 60, 20], d: 'TRIPLE ALERT' },
      'Heartbeat':  { p: [30, 120, 30, 400], d: 'LUB-DUB' },
      'Notification': { p: [8, 40, 8, 40, 40], d: 'RISING' },
      'SOS':        { p: [80, 80, 80, 80, 80, 200, 200, 80, 200, 80, 200, 200, 80, 80, 80], d: '· · · — — — · · ·' },
    };
    const presetsEl = document.getElementById('presets');
    Object.entries(PRESETS).forEach(([name, { p, d }]) => {
      const b = document.createElement('button');
      b.innerHTML = `${name}<small>${d}</small>`;
      b.addEventListener('click', () => play(p));
      presetsEl.appendChild(b);
    });

    const timeline = document.getElementById('timeline');
    const playhead = document.getElementById('playhead');
    const pulse = document.getElementById('pulse');
    const codeEl = document.getElementById('code');
    let pattern = [];

    function renderTimeline(){
      [...timeline.querySelectorAll('.seg')].forEach(s => s.remove());
      const total = pattern.reduce((a, b) => a + b, 0) || 1;
      const avail = timeline.clientWidth - 8;
      pattern.forEach((ms, i) => {
        const seg = document.createElement('div');
        seg.className = 'seg ' + (i % 2 === 0 ? 'on' : 'off');
        seg.style.width = Math.max(3, ms / total * avail) + 'px';
        timeline.insertBefore(seg, playhead);
      });
      codeEl.textContent = `navigator.vibrate([${pattern.join(', ')}])`;
    }

    function play(p){
      pattern = p.slice();
      renderTimeline();
      if(hasVibrate) navigator.vibrate(p);
      // visual playback: sweep the playhead, pulse the light on each "on" segment
      const total = p.reduce((a, b) => a + b, 0);
      gsap.killTweensOf(playhead); gsap.killTweensOf(pulse);
      gsap.set(playhead, { left: 0, opacity: 1 });
      gsap.to(playhead, { left: timeline.clientWidth - 2, duration: total / 1000, ease: 'none',
        onComplete(){ gsap.to(playhead, { opacity: 0, duration: .3 }); } });
      let t = 0;
      p.forEach((ms, i) => {
        if(i % 2 === 0){ // "on" segment → light pulse
          gsap.delayedCall(t / 1000, () => {
            gsap.fromTo(pulse, { opacity: .8, scale: .6 + Math.min(ms / 200, 1) }, { opacity: 0, scale: 1 + Math.min(ms / 120, 1.5), duration: Math.max(.2, ms / 1000), ease: 'power2.out' });
          });
        }
        t += ms;
      });
    }

    document.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', () => {
      const map = { off: 120, short: 20, long: 120 };
      // ensure alternation: even index = on, odd = off
      const wantOn = pattern.length % 2 === 0;
      if(b.dataset.add === 'off'){
        if(wantOn) pattern.push(1);        // tiny on to keep alternation valid
        pattern.push(120);
      } else {
        if(!wantOn) pattern.push(60);      // insert a gap first
        pattern.push(b.dataset.add === 'long' ? 120 : 20);
      }
      renderTimeline();
      if('vibrate' in navigator) navigator.vibrate(b.dataset.add === 'off' ? 0 : (b.dataset.add === 'long' ? 120 : 20));
    }));
    document.getElementById('clear').addEventListener('click', () => { pattern = []; renderTimeline(); });
    document.getElementById('play').addEventListener('click', () => { if(pattern.length) play(pattern); });

    play(PRESETS['Success'].p);
  </script>
</body>
</html>
```