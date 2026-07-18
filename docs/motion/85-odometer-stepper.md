# Technique 85 — Odometer Stepper

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** Mobile · GSAP
**Dependencies:** `vendor/gsap.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

Numbers that roll, not swap: each digit is its own reel that rolls up on increment, down on decrement; only changed digits move, carries grow a new column, and the live price rolls too. Hold to auto-repeat.

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

## Full working source (`85.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
<title>85 — Odometer Stepper</title>
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

  .appbar{padding:58px 24px 10px}
  .appbar h1{font-family:'Instrument Serif',serif;font-weight:400;font-size:26px}
  .appbar p{font-family:'Space Mono',monospace;font-size:10px;color:var(--mut);letter-spacing:.12em;margin-top:5px}

  .prod{margin:8px 20px;background:#15151b;border:1px solid #1f1f28;border-radius:18px;overflow:hidden}
  .prod .ph{height:150px;background:url('assets/img/photo-1550684848-fac1c5b4e853.jpg') center/cover}
  .prod .body{padding:16px 18px 20px}
  .prod h2{font-family:'Instrument Serif',serif;font-weight:400;font-size:22px}
  .prod .sub{font-family:'Space Mono',monospace;font-size:9.5px;color:var(--mut);letter-spacing:.1em;margin-top:4px}

  .qtyrow{display:flex;align-items:center;justify-content:space-between;margin-top:18px}
  .qtyrow .k{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.12em;color:var(--mut)}
  .stepper{display:flex;align-items:center;gap:2px;background:#101015;border:1px solid #23232b;border-radius:14px;padding:5px}
  .stepper button{width:40px;height:40px;border:none;border-radius:10px;background:none;color:var(--fg);font-size:22px;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background .2s}
  .stepper button:active{background:#20202a}
  .stepper button:disabled{color:#333;cursor:default}
  .stepper .val{min-width:46px;text-align:center;font-size:20px;font-weight:600}

  /* generic rolling number */
  .roll{display:inline-flex;overflow:hidden;vertical-align:bottom}
  .roll .col{position:relative;overflow:hidden}
  .roll .col i{display:block;font-style:normal;will-change:transform}

  .totalrow{display:flex;align-items:baseline;justify-content:space-between;margin-top:22px;padding-top:16px;border-top:1px solid #23232b}
  .totalrow .lbl{font-size:15px;font-weight:500}
  .totalrow .amt{font-family:'Instrument Serif',serif;font-weight:400;font-size:34px;color:var(--accent);display:flex;align-items:baseline}
  .totalrow .amt .cur{font-size:20px;margin-right:2px}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">85 / Odometer Stepper</span>
  </nav>
  <div class="caption">
    <b>Numbers that roll, not swap.</b> Each digit is its own reel — incrementing rolls it up, decrementing rolls it down, and only the digits that actually change move. The quantity and the live price both animate; carries (9→10) grow a new column in place.
  </div>

  <div class="stage">
    <div class="phone">
      <div class="pnotch"></div>
      <div class="appbar"><h1>Cart</h1><p>ROLL THE QUANTITY — WATCH THE TOTAL</p></div>
      <div class="prod">
        <div class="ph"></div>
        <div class="body">
          <h2>Ember print</h2>
          <div class="sub">GICLÉE · A2 · $48 EACH</div>
          <div class="qtyrow">
            <span class="k">QUANTITY</span>
            <div class="stepper">
              <button id="dec" aria-label="Decrease">−</button>
              <span class="val roll" id="qty"></span>
              <button id="inc" aria-label="Increase">+</button>
            </div>
          </div>
          <div class="totalrow">
            <span class="lbl">Order total</span>
            <span class="amt"><span class="cur">$</span><span class="roll" id="total"></span></span>
          </div>
        </div>
      </div>
      <div class="phome"></div>
    </div>
  </div>

  <script src="vendor/gsap.min.js"></script>
  <script>
    const buzz = ms => navigator.vibrate && navigator.vibrate(ms);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const PRICE = 48;
    let qty = 1;

    /* a reusable rolling-digit display bound to an element */
    function makeRoller(el, digitH){
      let cur = '';
      return function set(str, dir){
        if(el.children.length !== str.length){
          // rebuild columns when the digit count changes (carry/borrow)
          el.innerHTML = [...str].map(ch => `<span class="col" style="height:${digitH}px"><i style="height:${digitH}px;line-height:${digitH}px">${ch}</i></span>`).join('');
          // grow-in the leading new column
          if(str.length > cur.length){
            gsap.fromTo(el.children[0], { width: 0, opacity: 0 }, { width: 'auto', opacity: 1, duration: reduced ? 0 : .35, ease: 'power3.out' });
          }
          cur = str;
          return;
        }
        [...str].forEach((ch, i) => {
          const col = el.children[i];
          const old = col.querySelector('i');
          if(old.textContent === ch) return;
          const neu = document.createElement('i');
          neu.textContent = ch;
          neu.style.height = digitH + 'px'; neu.style.lineHeight = digitH + 'px';
          col.appendChild(neu);
          gsap.fromTo(neu, { y: digitH * dir }, { y: 0, duration: reduced ? 0 : .42, ease: 'back.out(1.4)' });
          gsap.to(old, { y: -digitH * dir, duration: reduced ? 0 : .42, ease: 'back.out(1.4)', onComplete(){ old.remove(); } });
        });
        cur = str;
      };
    }

    const setQty = makeRoller(document.getElementById('qty'), 26);
    const setTotal = makeRoller(document.getElementById('total'), 40);
    const inc = document.getElementById('inc'), dec = document.getElementById('dec');

    function render(dir){
      setQty(String(qty), dir);
      setTotal(String(qty * PRICE), dir);
      dec.disabled = qty <= 1;
      inc.disabled = qty >= 99;
    }
    render(1);

    function bump(delta){
      const next = gsap.utils.clamp(1, 99, qty + delta);
      if(next === qty) return;
      qty = next;
      buzz(8);
      render(delta);
      const b = delta > 0 ? inc : dec;
      gsap.fromTo(b, { scale: .8 }, { scale: 1, duration: .35, ease: 'back.out(3)' });
    }
    inc.addEventListener('click', () => bump(1));
    dec.addEventListener('click', () => bump(-1));

    /* press-and-hold to auto-repeat, accelerating */
    [[inc, 1], [dec, -1]].forEach(([b, d]) => {
      let t = null, delay = 320;
      const start = () => {
        bump(d);
        const tick = () => { bump(d); delay = Math.max(70, delay * .82); t = setTimeout(tick, delay); };
        t = setTimeout(tick, delay);
      };
      const stop = () => { clearTimeout(t); delay = 320; };
      b.addEventListener('pointerdown', e => { e.preventDefault(); });
      b.addEventListener('pointerup', stop);
      b.addEventListener('pointerleave', stop);
      b.addEventListener('pointercancel', stop);
      // hold detection layered on top of click
      let holdT = null;
      b.addEventListener('pointerdown', () => { holdT = setTimeout(() => { stop(); start(); }, 400); });
      b.addEventListener('pointerup', () => clearTimeout(holdT));
      b.addEventListener('pointerleave', () => clearTimeout(holdT));
    });
  </script>
</body>
</html>
```