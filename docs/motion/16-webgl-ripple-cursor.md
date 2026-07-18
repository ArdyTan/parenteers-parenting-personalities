# Technique 16 — WebGL Ripple Cursor

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** Three.js · WebGL · Shaders
**Dependencies:** `vendor/three.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

A flowmap-lite trail: the last 16 cursor positions feed a shader that swirls and disturbs the image.

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

## Full working source (`16.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>16 — WebGL Ripple Cursor</title>
<link href="vendor/fonts.css" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  :root{--bg:#08080b;--fg:#f4f1ea;--mut:#8a8a93}
  html,body{height:100%;background:var(--bg);color:var(--fg);font-family:'Space Grotesk',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}
  .nav{position:fixed;top:0;left:0;width:100%;display:flex;justify-content:space-between;align-items:center;padding:20px 28px;z-index:1000;mix-blend-mode:difference}
  .nav a{color:var(--fg);text-decoration:none;font-size:12px;letter-spacing:.06em;text-transform:uppercase}
  .nav .id{font-size:12px;letter-spacing:.1em}
  .caption{position:fixed;left:28px;bottom:24px;max-width:340px;font-size:12px;line-height:1.55;color:var(--mut);z-index:1000;mix-blend-mode:difference}
  .caption b{color:var(--fg);font-weight:500}
  #gl{position:fixed;inset:0;z-index:1}
  .overlay{position:fixed;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;pointer-events:none}
  h1{font-family:'Instrument Serif',serif;font-size:clamp(46px,11vw,180px);font-weight:400;line-height:.9;mix-blend-mode:difference}
  p{margin-top:18px;color:#cfcfd6;letter-spacing:.05em;mix-blend-mode:difference}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">16 / Ripple Cursor</span>
  </nav>
  <div class="caption">
    <b>Fluid trail distortion (flowmap-lite).</b> The last 16 cursor positions are fed to a shader as uniforms; each contributes a fading swirl that warps the image UVs. Drag your mouse across the image to disturb it.
  </div>

  <canvas id="gl"></canvas>
  <div class="overlay"><h1>Disturb<br>the surface</h1><p>MOVE YOUR CURSOR ACROSS THE IMAGE</p></div>

  <script src="vendor/three.min.js"></script>
  <script>
    const canvas = document.getElementById('gl');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    renderer.setSize(innerWidth, innerHeight);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1,1,1,-1,0,1);

    const N = 16;
    const trail = Array.from({length:N}, () => new THREE.Vector3(0.5,0.5,0)); // x,y,strength

    const uniforms = {
      uTex:    { value: null },
      uTrail:  { value: trail },
      uRes:    { value: new THREE.Vector2(innerWidth, innerHeight) },
      uImgRes: { value: new THREE.Vector2(1,1) },
      uTime:   { value: 0 }
    };

    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.0); }`,
      fragmentShader:`
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D uTex; uniform vec3 uTrail[${N}];
        uniform vec2 uRes, uImgRes; uniform float uTime;
        void main(){
          // cover-fit
          vec2 uv = vUv;
          float ra = uRes.x/uRes.y, ia = uImgRes.x/uImgRes.y;
          if(ra > ia){ uv.y = (uv.y-.5)*(ia/ra)+.5; } else { uv.x = (uv.x-.5)*(ra/ia)+.5; }
          float aspect = uRes.x/uRes.y;
          vec2 disp = vec2(0.0);
          for(int i=0;i<${N};i++){
            vec3 t = uTrail[i];
            vec2 d = vUv - t.xy; d.x *= aspect;
            float dist = length(d);
            float infl = smoothstep(0.18, 0.0, dist) * t.z;
            // swirl: rotate the direction 90deg for a fluid feel
            vec2 dir = normalize(d + 1e-4);
            vec2 swirl = vec2(-dir.y, dir.x);
            disp += (dir*0.6 + swirl*0.8) * infl * 0.06;
          }
          vec3 col;
          col.r = texture2D(uTex, uv + disp*1.0).r;
          col.g = texture2D(uTex, uv + disp*0.85).g;
          col.b = texture2D(uTex, uv + disp*0.7).b;
          float mag = length(disp)*7.0;
          col += mag*vec3(0.15,0.18,0.25);   // subtle highlight where it ripples
          gl_FragColor = vec4(col,1.0);
        }`
    });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2), mat));

    const loader = new THREE.TextureLoader(); loader.crossOrigin='anonymous';
    loader.load('assets/img/photo-1633186710895-309db2eca9e4.jpg', tex => {
      tex.minFilter = THREE.LinearFilter;
      uniforms.uTex.value = tex;
      uniforms.uImgRes.value.set(tex.image.width, tex.image.height);
    });

    let head = 0;
    const target = new THREE.Vector2(0.5,0.5), cur = new THREE.Vector2(0.5,0.5);
    let lastMove = -10;
    addEventListener('mousemove', e => { target.set(e.clientX/innerWidth, 1 - e.clientY/innerHeight); lastMove = performance.now(); });

    const clock = new THREE.Clock();
    (function loop(){ requestAnimationFrame(loop);
      const moving = (performance.now() - lastMove) < 90;
      cur.lerp(target, 0.25);
      // push current pos into the ring buffer with strength based on movement
      head = (head+1) % N;
      trail[head].set(cur.x, cur.y, moving ? 1.0 : 0.0);
      // decay all strengths
      for(let i=0;i<N;i++) trail[i].z *= 0.92;
      uniforms.uTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    })();

    addEventListener('resize', () => {
      renderer.setSize(innerWidth, innerHeight);
      uniforms.uRes.value.set(innerWidth, innerHeight);
    });
  </script>
</body>
</html>
```