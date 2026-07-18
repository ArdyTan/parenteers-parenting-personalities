# Technique 09 — Animated Shader Gradient

> Motion Library reference brief. Give this file to Claude Code (or any AI coding agent) and ask it
> to implement the technique in your project — it contains everything needed: the concept, an
> adaptation guide, and the complete working source.

**Tags:** WebGL · Shaders
**Dependencies:** none — vanilla HTML/CSS/JS
*(vendor/ files are local copies of public libraries — GSAP 3.12.5, Lenis 1.0.42, Three.js r128,
Matter.js 0.19 — swap in the CDN or npm equivalents in your own project if you prefer.)*

## What it is

A single fbm-noise fragment shader (no library) flowing between four colours — the aurora background.

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

## Full working source (`9.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>09 — Animated Shader Gradient</title>
<link href="vendor/fonts.css" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  :root{--fg:#0c0c10;--mut:rgba(12,12,16,.55)}
  html,body{height:100%;font-family:'Space Grotesk',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden;color:var(--fg)}
  .nav{position:fixed;top:0;left:0;width:100%;display:flex;justify-content:space-between;align-items:center;padding:20px 28px;z-index:1000}
  .nav a{color:var(--fg);text-decoration:none;font-size:12px;letter-spacing:.06em;text-transform:uppercase}
  .nav .id{font-size:12px;letter-spacing:.1em}
  .caption{position:fixed;left:28px;bottom:24px;max-width:340px;font-size:12px;line-height:1.55;color:var(--mut);z-index:1000}
  .caption b{color:var(--fg);font-weight:600}
  #gl{position:fixed;inset:0;z-index:1}
  .overlay{position:fixed;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;pointer-events:none;mix-blend-mode:difference;color:#fff}
  h1{font-family:'Instrument Serif',serif;font-size:clamp(46px,11vw,170px);font-weight:400;line-height:.9;letter-spacing:-.02em}
  h1 em{font-style:italic}
  p{margin-top:18px;font-size:14px;letter-spacing:.05em;color:#e6e6e6}
</style>
</head>
<body>
  <nav class="nav">
    <a href="index.html">← Index</a>
    <span class="id">09 / Shader Gradient</span>
  </nav>
  <div class="caption">
    <b>Raw WebGL mesh-gradient (no Three.js).</b> A single full-screen fragment shader layers fbm noise to flow between four colors — the Stripe / aurora background, at ~60fps for almost zero bytes.
  </div>

  <canvas id="gl"></canvas>
  <div class="overlay"><h1>Liquid <em>light</em></h1><p>FRAGMENT SHADER · 1 TRIANGLE · NO LIBRARY</p></div>

  <script>
    const canvas = document.getElementById('gl');
    const gl = canvas.getContext('webgl');
    function resize(){ canvas.width=innerWidth*Math.min(devicePixelRatio,2); canvas.height=innerHeight*Math.min(devicePixelRatio,2);
      canvas.style.width=innerWidth+'px'; canvas.style.height=innerHeight+'px'; gl.viewport(0,0,canvas.width,canvas.height); }
    resize(); addEventListener('resize', resize);

    const vsrc = `attribute vec2 p; void main(){ gl_Position=vec4(p,0.,1.); }`;
    const fsrc = `precision highp float;
      uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
      float fbm(vec2 p){ float v=0.,a=.5; for(int i=0;i<6;i++){ v+=a*noise(p); p*=2.0; a*=.5; } return v; }
      void main(){
        vec2 uv=gl_FragCoord.xy/uRes.xy; uv.x*=uRes.x/uRes.y;
        float t=uTime*0.22;
        vec2 mo=vec2(uMouse.x*uRes.x/uRes.y,uMouse.y);
        // cursor bends the field around itself
        float mw=smoothstep(0.85,0.0,distance(uv,mo));
        vec2 q=vec2(fbm(uv*1.4+t), fbm(uv*1.4+vec2(5.2,1.3)-t*1.3));
        vec2 r=vec2(fbm(uv*1.4+q*2.6+vec2(1.7,9.2)+t*0.9+mw*0.8),
                    fbm(uv*1.4+q*2.6+vec2(8.3,2.8)-t*0.5));
        float f=fbm(uv*1.4+r*2.2);
        // hard-separated electric palette
        vec3 c1=vec3(1.00,0.30,0.10); // hot coral
        vec3 c2=vec3(0.25,0.05,0.95); // ultraviolet
        vec3 c3=vec3(0.00,0.95,0.85); // electric teal
        vec3 c4=vec3(1.00,0.85,0.10); // signal yellow
        vec3 col=mix(c1,c2,smoothstep(0.15,0.75,f));
        col=mix(col,c3,smoothstep(0.35,0.95,length(q)));
        col=mix(col,c4,smoothstep(0.45,0.9,r.x));
        // contrast + saturation push so bands read as distinct ribbons
        col=pow(col,vec3(1.25));
        float l=dot(col,vec3(0.299,0.587,0.114));
        col=mix(vec3(l),col,1.45);
        col+=mw*0.18;
        // subtle animated grain keeps it alive even when flow is slow
        col+=(hash(gl_FragCoord.xy+fract(uTime)*61.7)-.5)*0.035;
        gl_FragColor=vec4(col,1.0);
      }`;
    function sh(t,s){ const o=gl.createShader(t); gl.shaderSource(o,s); gl.compileShader(o); return o; }
    const prog=gl.createProgram();
    gl.attachShader(prog,sh(gl.VERTEX_SHADER,vsrc));
    gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,fsrc));
    gl.linkProgram(prog); gl.useProgram(prog);
    const buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(prog,'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    const uRes=gl.getUniformLocation(prog,'uRes'), uTime=gl.getUniformLocation(prog,'uTime'), uMouse=gl.getUniformLocation(prog,'uMouse');
    let mx=0.5,my=0.5; addEventListener('mousemove',e=>{ mx=e.clientX/innerWidth; my=1-e.clientY/innerHeight; });
    const start=performance.now();
    (function loop(){ requestAnimationFrame(loop);
      gl.uniform2f(uRes,canvas.width,canvas.height);
      gl.uniform1f(uTime,(performance.now()-start)/1000);
      gl.uniform2f(uMouse,mx,my);
      gl.drawArrays(gl.TRIANGLES,0,3);
    })();
  </script>
</body>
</html>
```