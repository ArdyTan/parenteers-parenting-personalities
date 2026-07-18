# Technique 30 — Floating Emoji Reactions

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** Interactive
**Dependencies:** none — vanilla HTML/CSS/JS
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

Click or hold to fling livestream-style reactions — particles with upward velocity, sine-sway, pop and fade. Hold to rapid-fire.

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

## Full working source (`30.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>30 — Floating Emoji Reactions</title>
<link href="vendor/fonts.css" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  :root{--bg:#0c0c11;--fg:#f4f1ea;--mut:#73737d;--accent:#c8ff00}
  html,body{height:100%;background:radial-gradient(120% 100% at 50% 120%,#16131f,#0a0a0d);color:var(--fg);font-family:'Space Grotesk',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}
  .nav{position:fixed;top:0;left:0;width:100%;display:flex;justify-content:space-between;align-items:center;padding:20px 28px;z-index:1000;mix-blend-mode:difference;pointer-events:none}
  .nav a{color:var(--fg);text-decoration:none;font-size:12px;letter-spacing:.06em;text-transform:uppercase;pointer-events:auto}
  .nav .id{font-size:12px;letter-spacing:.1em}
  .caption{position:fixed;left:28px;bottom:24px;max-width:330px;font-size:12px;line-height:1.55;color:var(--mut);z-index:1000;pointer-events:none}
  .caption b{color:var(--fg);font-weight:500}
  .arena{position:fixed;inset:0;z-index:1;overflow:hidden}
  .hint{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;transition:opacity .5s}
  .hint h1{font-family:'Instrument Serif',serif;font-size:clamp(40px,9vw,130px);font-weight:400;line-height:.92}
  .hint small{display:block;font-family:'Space Mono',monospace;font-size:13px;letter-spacing:.1em;color:var(--mut);margin-top:14px}
  .react{position:absolute;font-size:34px;pointer-events:none;will-change:transform,opacity;user-select:none}
  .bar{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:1000;display:flex;align-items:center;gap:6px;background:#16161dcc;backdrop-filter:blur(10px);border:1px solid #24242c;border-radius:50px;padding:8px 12px;box-shadow:0 10px 30px rgba(0,0,0,.5)}
  .bar button{font-size:24px;background:none;border:none;cursor:pointer;padding:6px 8px;border-radius:12px;transition:transform .15s,background .2s;line-height:1}
  .bar button:hover{transform:scale(1.25)}
  .bar button.active{background:#24242c;transform:scale(1.2)}
  .bar .sep{width:1px;height:26px;background:#2a2a32;margin:0 4px}
  .bar .total{font-family:'Space Mono',monospace;font-size:12px;color:var(--mut);padding:0 8px}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">30 / Reactions</span>
  </nav>
  <div class="caption">
    <b>Livestream-style reaction burst.</b> Click or hold anywhere to fling the selected emoji; each is a lightweight particle with upward velocity, horizontal sine-sway, gravity-light drift, scale pop and fade. Hold to rapid-fire.
  </div>

  <div class="arena" id="arena">
    <div class="hint" id="hint"><h1>Tap to react</h1><small>PICK AN EMOJI · CLICK · OR HOLD TO SPAM</small></div>
  </div>

  <div class="bar" id="bar">
    <button class="active">❤️</button>
    <button>🔥</button>
    <button>✨</button>
    <button>😂</button>
    <button>👏</button>
    <button>🚀</button>
    <span class="sep"></span>
    <span class="total" id="total">0</span>
  </div>

  <script>
    const arena=document.getElementById('arena');
    const hint=document.getElementById('hint');
    let emoji='❤️', total=0, particles=[];
    document.querySelectorAll('.bar button').forEach(b=>b.addEventListener('click',()=>{
      document.querySelectorAll('.bar button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active'); emoji=b.textContent;
    }));

    function spawn(x,y){
      hint.style.opacity=0;
      const el=document.createElement('div'); el.className='react'; el.textContent=emoji;
      el.style.left=x+'px'; el.style.top=y+'px';
      arena.appendChild(el);
      particles.push({ el, x, y, vx:(Math.random()-0.5)*2.2, vy:-(5+Math.random()*4),
        life:0, max:90+Math.random()*40, sway:Math.random()*Math.PI*2, rot:(Math.random()-0.5)*40, scale:0 });
      total++; document.getElementById('total').textContent=total;
    }

    let holding=false, hx=0, hy=0;
    arena.addEventListener('pointerdown',e=>{ holding=true; hx=e.clientX; hy=e.clientY; spawn(e.clientX,e.clientY); });
    arena.addEventListener('pointermove',e=>{ hx=e.clientX; hy=e.clientY; });
    const stop=()=>holding=false;
    addEventListener('pointerup',stop); addEventListener('pointercancel',stop);
    let frame=0;
    function loop(){
      requestAnimationFrame(loop);
      if(holding && frame%5===0) spawn(hx+(Math.random()-0.5)*20, hy+(Math.random()-0.5)*20);
      frame++;
      particles=particles.filter(p=>{
        p.life++; p.vy+=0.045; p.x+=p.vx+Math.sin(p.life*0.08+p.sway)*0.8; p.y+=p.vy;
        const t=p.life/p.max;
        p.scale=t<0.15? t/0.15 : 1;       // pop in
        const op=t<0.7?1:1-(t-0.7)/0.3;    // fade out tail
        p.el.style.transform=`translate(${p.x-parseFloat(p.el.style.left)}px,${p.y-parseFloat(p.el.style.top)}px) scale(${p.scale}) rotate(${p.rot*t}deg)`;
        p.el.style.opacity=op;
        if(p.life>=p.max){ p.el.remove(); return false; }
        return true;
      });
    }
    loop();
  </script>
</body>
</html>
```