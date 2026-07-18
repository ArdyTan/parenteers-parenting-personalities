# Technique 17 — Page Transition Overlay

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** GSAP · CSS
**Dependencies:** `vendor/gsap.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

Barba-style route change: columns sweep up to cover, content swaps, columns sweep away as lines reveal.

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

## Full working source (`17.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>17 — Page Transition Overlay</title>
<link href="vendor/fonts.css" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  :root{--bg:#0b0b0f;--fg:#f4f1ea;--mut:#73737d;--accent:#c8ff00}
  html,body{height:100%;background:var(--bg);color:var(--fg);font-family:'Space Grotesk',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}
  .nav{position:fixed;top:0;left:0;width:100%;display:flex;justify-content:space-between;align-items:center;padding:20px 28px;z-index:1200;mix-blend-mode:difference}
  .nav a{color:var(--fg);text-decoration:none;font-size:12px;letter-spacing:.06em;text-transform:uppercase}
  .nav .id{font-size:12px;letter-spacing:.1em}
  .caption{position:fixed;left:28px;bottom:24px;max-width:340px;font-size:12px;line-height:1.55;color:var(--mut);z-index:1200;mix-blend-mode:difference}
  .caption b{color:var(--fg);font-weight:500}
  .menu{position:fixed;top:0;right:0;height:100%;display:flex;flex-direction:column;justify-content:center;gap:6px;padding:0 5vw;z-index:1100;font-family:'Space Mono',monospace}
  .menu a{color:var(--mut);text-decoration:none;font-size:14px;letter-spacing:.05em;text-transform:uppercase;transition:color .2s;text-align:right}
  .menu a:hover,.menu a.active{color:var(--fg)}
  .menu a.active::before{content:'— ';color:var(--accent)}
  main{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:0 7vw;max-width:70vw}
  .page-idx{font-family:'Space Mono',monospace;font-size:13px;color:var(--accent);margin-bottom:24px}
  h1{font-family:'Instrument Serif',serif;font-size:clamp(48px,11vw,170px);font-weight:400;line-height:.9}
  .ln{display:block;overflow:hidden}
  .ln>span{display:block}
  .desc{margin-top:30px;color:var(--mut);max-width:42ch;line-height:1.65;overflow:hidden}
  .desc>span{display:block}
  /* transition panels */
  .overlay{position:fixed;inset:0;z-index:1000;display:flex;pointer-events:none}
  .overlay .col{flex:1;background:var(--accent);transform:scaleY(0);transform-origin:bottom}
  .overlay.dark .col{background:var(--fg)}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">17 / Page Transition</span>
  </nav>
  <div class="caption">
    <b>Column-wipe route transition.</b> The Barba.js / studio pattern: on nav, vertical columns sweep up to cover the screen, content swaps behind them, then they sweep away as the new page's lines reveal. Staggered columns give the diagonal feel.
  </div>

  <div class="menu" id="menu">
    <a data-page="0" class="active">Home</a>
    <a data-page="1">Studio</a>
    <a data-page="2">Work</a>
    <a data-page="3">Contact</a>
  </div>

  <main id="main">
    <div class="page-idx" id="pidx">00 — HOME</div>
    <h1 id="title"><span class="ln"><span>Transitions</span></span><span class="ln"><span>that hide</span></span><span class="ln"><span>the seams.</span></span></h1>
    <p class="desc" id="desc"><span>Click the menu. Watch the page leave and arrive as one continuous gesture — no white flash, no jump.</span></p>
  </main>

  <div class="overlay" id="overlay">
    <div class="col"></div><div class="col"></div><div class="col"></div><div class="col"></div><div class="col"></div>
  </div>

  <script src="vendor/gsap.min.js"></script>
  <script>
    const PAGES = [
      { idx:'00 — HOME',    title:['Transitions','that hide','the seams.'], desc:'Click the menu. Watch the page leave and arrive as one continuous gesture — no white flash, no jump.' },
      { idx:'01 — STUDIO',  title:['A studio','built for','the unreal.'], desc:'Twelve people, one obsession: interfaces that move like they have a pulse. Direction, design and engineering under one roof.' },
      { idx:'02 — WORK',    title:['Selected','work, 2026','and beyond.'], desc:'WebGL flagships, brand systems and the occasional impossible deadline. Forty launches, nine awards, zero templates.' },
      { idx:'03 — CONTACT', title:['Let’s make','something','they remember.'], desc:'New projects, collaborations or just to say hello — hello@studio.com. We reply faster than our animations.' },
    ];
    const cols = gsap.utils.toArray('.overlay .col');
    const overlay = document.getElementById('overlay');
    let current = 0, busy = false;

    function setContent(p){
      document.getElementById('pidx').textContent = p.idx;
      document.getElementById('title').innerHTML = p.title.map(l=>`<span class="ln"><span>${l}</span></span>`).join('');
      document.getElementById('desc').innerHTML = `<span>${p.desc}</span>`;
    }
    function revealIn(){
      gsap.fromTo('#title .ln>span',{yPercent:110},{yPercent:0,duration:1,ease:'expo.out',stagger:.08});
      gsap.fromTo('#desc>span',{yPercent:110},{yPercent:0,duration:.9,ease:'expo.out',delay:.2});
      gsap.fromTo('#pidx',{opacity:0,y:10},{opacity:1,y:0,duration:.6,delay:.1});
    }

    // every transition sweeps a different colour — picked at random, never the same twice in a row
    const SWEEPS = ['#c8ff00','#ff5436','#4b7bff','#ff8ac2','#ffd76b','#20cfd5','#9d4bff','#f4f1ea'];
    let lastSweep = -1;
    function pickSweep(){
      let i; do { i = Math.floor(Math.random()*SWEEPS.length); } while(i === lastSweep);
      lastSweep = i; return SWEEPS[i];
    }

    function go(i){
      if(busy || i===current) return; busy = true;
      document.querySelectorAll('.menu a').forEach((a,k)=>a.classList.toggle('active',k===i));
      const sweep = pickSweep();
      const tl = gsap.timeline({ onComplete:()=>{ busy=false; } });
      // columns sweep UP to cover
      tl.set(cols,{transformOrigin:'bottom',backgroundColor:sweep})
        .to(cols,{ scaleY:1, duration:.6, ease:'power3.inOut', stagger:.06 })
        .add(()=>{ setContent(PAGES[i]); current=i;
          // the arriving page adopts the sweep colour as its accent
          document.documentElement.style.setProperty('--accent', sweep); })
        // columns sweep further UP to uncover (origin flips to top)
        .set(cols,{transformOrigin:'top'})
        .to(cols,{ scaleY:0, duration:.6, ease:'power3.inOut', stagger:.06 }, '+=.05')
        .add(revealIn, '-=.5');
    }
    document.querySelectorAll('.menu a').forEach(a => a.addEventListener('click', () => go(+a.dataset.page)));
    revealIn();
  </script>
</body>
</html>
```