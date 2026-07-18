# Technique 08 — Particle Galaxy

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** Three.js · WebGL · Shaders
**Dependencies:** `vendor/three.min.js`
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

30,000 GPU points on a spiral, sized & tinted in a custom shader, with drift and mouse parallax.

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

## Full working source (`8.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>08 — Particle Galaxy</title>
<link href="vendor/fonts.css" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  :root{--bg:#04040a;--fg:#f4f1ea;--mut:#73737d}
  html,body{height:100%;background:var(--bg);color:var(--fg);font-family:'Space Grotesk',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}
  .nav{position:fixed;top:0;left:0;width:100%;display:flex;justify-content:space-between;align-items:center;padding:20px 28px;z-index:1000;mix-blend-mode:difference}
  .nav a{color:var(--fg);text-decoration:none;font-size:12px;letter-spacing:.06em;text-transform:uppercase}
  .nav .id{font-size:12px;letter-spacing:.1em}
  .caption{position:fixed;left:28px;bottom:24px;max-width:340px;font-size:12px;line-height:1.55;color:var(--mut);z-index:1000;mix-blend-mode:difference}
  .caption b{color:var(--fg);font-weight:500}
  #gl{position:fixed;inset:0;z-index:1}
  .overlay{position:fixed;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;pointer-events:none}
  h1{font-family:'Instrument Serif',serif;font-size:clamp(44px,10vw,160px);font-weight:400;line-height:.92;mix-blend-mode:screen}
  p{margin-top:20px;color:#b9b4c9;letter-spacing:.04em}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">08 / Particles</span>
  </nav>
  <div class="caption">
    <b>GPU particle galaxy, 30k points.</b> Positions/colors generated on a spiral and uploaded as buffer attributes; a custom shader sizes & tints each point. Drift + mouse parallax. Move the mouse.
  </div>

  <canvas id="gl"></canvas>
  <div class="overlay"><h1>Stardust</h1><p>30,000 points · one draw call</p></div>

  <script src="vendor/three.min.js"></script>
  <script>
    const canvas = document.getElementById('gl');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.setClearColor(0x04040a, 1);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, .1, 100);
    camera.position.set(0, 1.2, 6);

    const COUNT = 30000, ARMS = 4;
    const pos = new Float32Array(COUNT*3);
    const col = new Float32Array(COUNT*3);
    const scl = new Float32Array(COUNT);
    const inner = new THREE.Color(0xffd9a0), outer = new THREE.Color(0x6d7bff);
    for(let i=0;i<COUNT;i++){
      const r = Math.pow(Math.random(),0.6)*5;
      const arm = (i%ARMS)/ARMS * Math.PI*2;
      const spin = r*0.9;
      const spread = (Math.random()-0.5)*Math.pow(1-r/5,2)*1.2;
      const a = arm + spin + spread;
      pos[i*3]   = Math.cos(a)*r + (Math.random()-0.5)*0.25;
      pos[i*3+1] = (Math.random()-0.5)*0.5*(1-r/6);
      pos[i*3+2] = Math.sin(a)*r + (Math.random()-0.5)*0.25;
      const c = inner.clone().lerp(outer, r/5);
      col[i*3]=c.r; col[i*3+1]=c.g; col[i*3+2]=c.b;
      scl[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos,3));
    g.setAttribute('color', new THREE.BufferAttribute(col,3));
    g.setAttribute('aScale', new THREE.BufferAttribute(scl,1));

    const mat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
      uniforms:{ uTime:{value:0}, uSize:{value:26.0*renderer.getPixelRatio()} },
      vertexShader:`
        uniform float uTime,uSize; attribute float aScale; varying vec3 vColor;
        void main(){ vColor=color; vec3 p=position;
          float ang=uTime*0.06*(1.0/(length(p.xz)+0.4));
          float s=sin(ang),c=cos(ang);
          p.xz=mat2(c,-s,s,c)*p.xz;
          vec4 mv=modelViewMatrix*vec4(p,1.0);
          gl_Position=projectionMatrix*mv;
          gl_PointSize=uSize*aScale*(1.0/-mv.z); }`,
      fragmentShader:`
        varying vec3 vColor;
        void main(){ float d=distance(gl_PointCoord,vec2(0.5));
          if(d>0.5) discard; float a=smoothstep(0.5,0.0,d);
          gl_FragColor=vec4(vColor,a); }`,
      vertexColors:true
    });
    const points = new THREE.Points(g, mat);
    scene.add(points);

    const mouse = {x:0,y:0};
    addEventListener('mousemove', e => { mouse.x=(e.clientX/innerWidth-0.5); mouse.y=(e.clientY/innerHeight-0.5); });

    const clock = new THREE.Clock();
    (function loop(){ requestAnimationFrame(loop);
      mat.uniforms.uTime.value = clock.getElapsedTime();
      camera.position.x += (mouse.x*2.2 - camera.position.x)*0.04;
      camera.position.y += (1.2 - mouse.y*2.0 - camera.position.y)*0.04;
      camera.lookAt(0,0,0);
      renderer.render(scene, camera);
    })();

    addEventListener('resize', () => {
      camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });
  </script>
</body>
</html>
```