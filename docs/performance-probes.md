# Performance probes — memory, frame budget, and layer occlusion

**Authoritative for:** how this project measures runtime cost, the recorded baselines, and the
interpretation traps. The budgets themselves live in `plan.md` §10; this document is how you check
them and how to read the output without fooling yourself.

Added 2026-08-02, when the user asked whether the app would run on a Samsung A23 and whether the
persistent WebGL canvas was needed. Both were answered by measurement, and the canvas was removed
as a result (`plan.md` §6).

## The three harnesses

| Script | Command | Answers |
|---|---|---|
| `scripts/perf-probe.mjs` | `npm run perf:probe` | What does each route cost — JS heap, decoded-image bytes, DOM nodes, listeners, network, canvas/GL buffers — and does it hold frame rate under CPU throttling, and does the heap grow across a full run? |
| `scripts/perf-canvas-audit.mjs` | `npm run perf:canvas` | Does any background layer actually contribute visible pixels, per route? |
| `scripts/perf-canvas-map.mjs` | `node ./scripts/perf-canvas-map.mjs /intro intro` | *Where* does a layer contribute? Writes a red overlay mask to `artifacts/phase55-spot/canvas-map-<name>.png`. |

### Prerequisites

Both need the dev server plus a CDP-attached Chrome. Same setup as `qa:phase55`:

```bash
npm run dev
```

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --remote-debugging-port=9223 --user-data-dir="$TEMP/pb-qa-profile" --no-first-run --hide-scrollbars about:blank
```

> **Drop `--disable-gpu` if you want GPU-representative numbers.** The 2026-08-02 baseline was
> captured with it, so Chrome reported `Microsoft Basic Render Driver` — a software rasteriser.
> Everything CPU- and memory-related in that run is valid; nothing GPU-related is.

## Recorded baseline — 2026-08-02

Captured at 390×844 with touch emulation. `before` = with the WebGL world layer, `after` = with it
removed.

| | before | after |
|---|---|---|
| JS gzip | 214.86 KB | **78.84 KB** |
| raw JS to parse | 753.52 KB | 215.26 KB |
| GL drawing buffer | 2.83 MB (585×1266 @ mid tier) | none |
| JS heap, landing → result | 11.95 → 17.32 MB | 9.32 → 12.04 MB |
| decoded images, peak | 8.1 MB (baking / gallery) | 8.1 MB (baking) |
| DOM nodes, peak | 2,716 | 2,133 |
| listeners on Result | 416 | 275 |
| heap after a full 19-route run | +0.06 MB | **−0.33 MB** |

Sustained fps over a 2.5 s window, `after`:

| CPU throttle | question | baking | result |
|---|---|---|---|
| 1× | 60.2 | 60.2 | 60.2 |
| 4× | 60.3 | 60.4 | 60.3 |
| 6× | 60.7 | 60.2 | 59.4 (worst frame 33 ms) |
| 8× | 60.4 | 60.6 | **51.0** (worst frame 33 ms) |

Before the removal, Result at 8× was 40.4 fps with a **100 ms** worst frame. Result is consistently
the heaviest screen — confetti, scroll parallax, reveal observers and the docked share bar all run
together.

### Low-end device read (Samsung A23 class, Snapdragon 680)

**Memory is not the constraint.** ~12 MB heap plus ≤8 MB of decoded images against 4 GB of RAM. The
share compositor adds a transient 8.3 MB (a 1080×1920 canvas) and releases it.

**Frame budget looks fine** — 60 fps to 6× throttle, 51 fps at 8×.

Treat 8× as a rough proxy for A23-class single-thread JS and 4–5× for the A55. Two things this
method cannot tell you, and which still need a real device:

1. **GPU cost** — never measured (see the `--disable-gpu` note above).
2. **Memory bandwidth** — CPU throttling does not model it.

## Interpretation traps

Every one of these produced a wrong reading during the 2026-08-02 session. They cost real time.

1. **Enable touch emulation or you measure the QR gate, not the app.**
   `shouldShowDesktopGate` returns true for `pointer: fine` with zero touch points, so a CDP session
   without `Emulation.setTouchEmulationEnabled` renders the gate. A naive "scene has children"
   readiness check passes on the gate, so the mistake is silent. This is what made one ad-hoc intro
   measurement report zero canvas contribution when the real answer was non-zero.

2. **Freeze motion before any pixel diff, and always take a control capture.**
   The first canvas audit reported 28% of pixels changed on `baking` — that was the marquee moving
   between the two captures. Run under `prefers-reduced-motion: reduce` and capture the same frame
   twice first; if that control diff is not zero, the scene is still animating and any subsequent
   diff is meaningless.

3. **Settle generously.** The canvas fade-in and lazy image decodes land well after the scene
   mounts and will masquerade as a layer diff. The audit waits 3 s after readiness.

4. **A non-zero pixel diff does not mean the layer is visible.** After freezing motion, hiding the
   canvas still changed 0.4–1.5% of pixels on three routes. Mapping them showed they sat exactly on
   glyph edges: removing a composited layer flips text from subpixel to grayscale antialiasing.
   **Always map a diff before concluding anything from its magnitude** — that is what
   `perf-canvas-map.mjs` is for.

5. **Measure layout with `offsetWidth`, not `getBoundingClientRect()`, on anything tweened.**
   The Result character has a squash-and-stretch entrance; a rect read mid-flight reported 385 px
   instead of 390 and produced a phantom failure in `qa:phase55`.

6. **The in-app Browser pane must be visible or nothing mounts.** When the pane is hidden the page
   does not composite, `requestAnimationFrame` never fires, `gsap.ticker` is frozen, and the
   preloader never resolves — so no scene ever mounts. That is why these probes drive a separate
   CDP Chrome instead of the preview pane.

## Standing rule this produced

Recorded in `conventions.md`: **before adding any background layer, prove it contributes visible
pixels.** `npm run perf:canvas` is that proof. A layer behind opaque paint is invisible atmosphere —
it costs bundle, GPU and battery for nothing, and it degrades text antialiasing on top.

## When to re-run

- **`perf:probe`** — after adding a screen, a media-heavy feature, or a dependency; before any
  device-matrix pass; whenever a `plan.md` §10 budget is in question.
- **`perf:canvas`** — whenever a full-bleed or fixed-position decorative layer is introduced, and as
  a regression guard that none has crept back in behind the flat editorial surfaces.
- **`perf-canvas-map.mjs`** — only when `perf:canvas` reports a non-zero diff and you need to know
  whether it is real content or antialiasing.

If a budget is breached, `plan.md` §10 is the contract to satisfy, not this file — update the
baseline table here only after the breach is resolved or the budget is deliberately renegotiated.
