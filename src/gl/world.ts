import { gsap } from 'gsap';
import {
  Color,
  OrthographicCamera,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
  type ColorRepresentation,
} from 'three';

import { BRAND_COLORS } from '../core/brand';
import type { PerformanceTier } from '../core/store';
import { createDoughGradient, type DoughGradient } from './dough-gradient';
import { createFlourTrail, type FlourTrail } from './flour-trail';
import { FlourParticles } from './particles';
import {
  clampDpr,
  getTierProfile,
  type FrameScheduler,
  type TierProfile,
} from './tiers';

export type WorldOptions = Readonly<{
  viewport?: HTMLElement;
  tier?: PerformanceTier;
  reducedMotion?: boolean;
}>;

export interface World {
  readonly canvas: HTMLCanvasElement;
  readonly tier: PerformanceTier;
  setHeat(value: number): void;
  setAccent(value: ColorRepresentation): void;
  setTier(value: PerformanceTier): void;
  setReducedMotion(value: boolean): void;
  pointer(x: number, y: number, strength?: number): void;
  burst(x: number, y: number, count?: number): number;
  resize(): void;
  pause(): void;
  resume(): void;
  warmup(): void;
  destroy(): void;
}

export type SharedTicker = Readonly<{
  add(callback: (time: number) => void): unknown;
  remove(callback: (time: number) => void): void;
}>;

const ACTIVE_FPS = 60;
const INTERACTION_TAIL_SECONDS = 0.2;
const DEFAULT_ACCENT = BRAND_COLORS.orange;

export class ParentingBakesWorld implements World {
  readonly canvas: HTMLCanvasElement;

  readonly #viewport: HTMLElement | null;
  readonly #renderer: WebGLRenderer;
  readonly #scene = new Scene();
  readonly #camera = new OrthographicCamera(-1, 1, 1, -1, 0, 2);
  readonly #trail: FlourTrail;
  readonly #particles: FlourParticles;
  readonly #controller = new AbortController();
  readonly #resizeObserver: ResizeObserver | null;
  readonly #accent = new Color(DEFAULT_ACCENT);
  readonly #ticker = (time: number): void => this.#tick(time);

  #gradient: DoughGradient;
  #profile: TierProfile;
  #tier: PerformanceTier;
  #heat = 0;
  #pointerX = 0.5;
  #pointerY = 0.5;
  #reducedMotion: boolean;
  #paused = true;
  #destroyed = false;
  #contextLost = false;
  #lastRenderTime = Number.NEGATIVE_INFINITY;
  #lastUpdateTime = gsap.ticker.time;
  #interactionUntil = Number.NEGATIVE_INFINITY;

  constructor(canvas: HTMLCanvasElement, options: WorldOptions) {
    this.canvas = canvas;
    this.#viewport = options.viewport ?? null;
    this.#tier = options.tier ?? 'mid';
    this.#profile = getTierProfile(this.#tier);
    this.#reducedMotion = options.reducedMotion ?? false;

    canvas.dataset.worldCanvas = '';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.setAttribute('role', 'presentation');

    this.#renderer = new WebGLRenderer({
      alpha: true,
      antialias: false,
      canvas,
      powerPreference: this.#tier === 'low' ? 'default' : 'high-performance',
    });
    this.#renderer.outputColorSpace = SRGBColorSpace;
    this.#renderer.setClearColor(0x000000, 0);

    this.#camera.position.z = 1;
    this.#trail = createFlourTrail();
    this.#gradient = this.#createGradient();
    this.#particles = new FlourParticles({
      deviceDpr: window.devicePixelRatio,
      reducedMotion: this.#reducedMotion,
      tier: this.#tier,
    });

    this.#scene.add(this.#gradient.mesh, this.#particles.points);

    canvas.addEventListener(
      'webglcontextlost',
      (event) => {
        event.preventDefault();
        this.#contextLost = true;
        this.pause();
      },
      { signal: this.#controller.signal },
    );
    canvas.addEventListener(
      'webglcontextrestored',
      () => {
        this.#contextLost = false;
        this.resize();
        this.warmup();
        this.resume();
      },
      { signal: this.#controller.signal },
    );
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden) this.pause();
        else this.resume();
      },
      { signal: this.#controller.signal },
    );

    if (typeof ResizeObserver === 'function') {
      this.#resizeObserver = new ResizeObserver(() => this.resize());
      if (this.#viewport) this.#resizeObserver.observe(this.#viewport);
      else this.#resizeObserver.observe(document.documentElement);
    } else {
      this.#resizeObserver = null;
      window.addEventListener('resize', () => this.resize(), {
        passive: true,
        signal: this.#controller.signal,
      });
    }

    this.resize();
    this.warmup();
    this.resume();
  }

  get tier(): PerformanceTier {
    return this.#tier;
  }

  setHeat(value: number): void {
    this.#heat = clamp01(value);
    this.#gradient.setHeat(this.#heat);
    this.#renderReducedFrame();
  }

  setAccent(value: ColorRepresentation): void {
    this.#accent.set(value);
    this.#gradient.setAccent(this.#accent);
    this.#renderReducedFrame();
  }

  setTier(value: PerformanceTier): void {
    if (this.#destroyed || value === this.#tier) return;

    const previousOctaves = this.#profile.noiseOctaves;
    this.#tier = value;
    this.#profile = getTierProfile(value);
    this.#particles.setTier(value);
    this.#particles.setPixelRatio(window.devicePixelRatio);

    if (!this.#profile.trailEnabled) this.#trail.clear();
    if (previousOctaves !== this.#profile.noiseOctaves) this.#replaceGradient();

    this.resize();
    this.warmup();
  }

  setReducedMotion(value: boolean): void {
    if (this.#destroyed || value === this.#reducedMotion) return;

    this.#reducedMotion = value;
    this.#particles.setReducedMotion(value);
    if (value) {
      this.#trail.clear();
      this.#gradient.clearTrail();
      this.pause();
      this.#renderOnce(0);
    } else {
      this.resume();
    }
  }

  /** Coordinates are normalized from the DOM's top-left origin. */
  pointer(x: number, y: number, strength = 1): void {
    if (this.#destroyed || this.#reducedMotion) return;

    this.#pointerX = clamp01(x);
    this.#pointerY = clamp01(y);
    const webGlY = 1 - this.#pointerY;
    this.#gradient.setPointer(this.#pointerX, webGlY);

    if (this.#profile.trailEnabled) {
      this.#trail.pointer(
        this.#pointerX,
        webGlY,
        clamp01(strength) * this.#profile.trailLength,
      );
    }

    this.#interactionUntil = gsap.ticker.time + INTERACTION_TAIL_SECONDS;
  }

  /** Coordinates are normalized from the DOM's top-left origin. */
  burst(x: number, y: number, count = 18): number {
    if (this.#destroyed) return 0;
    const emitted = this.#particles.burst(x, y, count);
    if (emitted > 0) {
      this.#interactionUntil = gsap.ticker.time + INTERACTION_TAIL_SECONDS;
    }
    return emitted;
  }

  resize(): void {
    if (this.#destroyed || this.#contextLost) return;

    const rect = this.#viewport?.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect?.width ?? window.innerWidth));
    const height = Math.max(1, Math.round(rect?.height ?? window.innerHeight));
    const pixelRatio = clampDpr(window.devicePixelRatio, this.#tier);

    this.#renderer.setPixelRatio(pixelRatio);
    this.#renderer.setSize(width, height, false);
    this.#particles.setPixelRatio(window.devicePixelRatio);
    this.#gradient.setResolution(width * pixelRatio, height * pixelRatio);
    this.#renderReducedFrame();
  }

  pause(): void {
    if (this.#paused) return;
    this.#paused = true;
    gsap.ticker.remove(this.#ticker);
  }

  resume(): void {
    if (
      this.#destroyed ||
      this.#contextLost ||
      this.#reducedMotion ||
      document.hidden ||
      !this.#paused
    ) {
      return;
    }

    this.#paused = false;
    this.#lastUpdateTime = gsap.ticker.time;
    gsap.ticker.add(this.#ticker);
  }

  warmup(): void {
    if (this.#destroyed || this.#contextLost) return;
    this.#renderer.compile(this.#scene, this.#camera);
    this.#renderOnce(this.#reducedMotion ? 0 : gsap.ticker.time);
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.pause();
    this.#controller.abort();
    this.#resizeObserver?.disconnect();
    this.#scene.remove(this.#gradient.mesh, this.#particles.points);
    this.#gradient.dispose();
    this.#trail.dispose();
    this.#particles.dispose();
    this.#renderer.dispose();
  }

  #createGradient(): DoughGradient {
    return createDoughGradient({
      accent: this.#accent,
      heat: this.#heat,
      noiseOctaves: this.#profile.noiseOctaves,
      pointer: { x: this.#pointerX, y: 1 - this.#pointerY },
    });
  }

  #replaceGradient(): void {
    const previous = this.#gradient;
    const next = this.#createGradient();
    next.syncTrail(this.#trail);
    this.#scene.remove(previous.mesh);
    this.#scene.add(next.mesh);
    previous.dispose();
    this.#gradient = next;
  }

  #tick(time: number): void {
    if (this.#paused || this.#destroyed || this.#contextLost) return;

    const active =
      this.#trail.active ||
      this.#particles.activeBurstCount > 0 ||
      time < this.#interactionUntil;
    const targetFps = active ? ACTIVE_FPS : this.#profile.targetIdleFps;
    const minimumFrameSeconds = 1 / targetFps;

    if (time - this.#lastRenderTime < minimumFrameSeconds) return;

    const deltaSeconds = Math.min(0.25, Math.max(0, time - this.#lastUpdateTime));
    this.#lastUpdateTime = time;
    this.#lastRenderTime = time;
    this.#trail.tick(deltaSeconds);
    this.#particles.tick(time, deltaSeconds);
    this.#renderOnce(time);
  }

  #renderOnce(time: number): void {
    if (this.#destroyed || this.#contextLost) return;
    this.#gradient.setTime(time);
    this.#gradient.syncTrail(this.#trail);
    this.#renderer.render(this.#scene, this.#camera);
  }

  #renderReducedFrame(): void {
    if (this.#reducedMotion && !this.#destroyed) this.#renderOnce(0);
  }
}

export function createWorld(canvas: HTMLCanvasElement, options: WorldOptions): World {
  return new ParentingBakesWorld(canvas, options);
}

/** Adapter used by the boot FPS probe so GSAP remains the application's only clock. */
export function createGsapFrameScheduler(ticker: SharedTicker = gsap.ticker): FrameScheduler {
  let nextHandle = 1;
  let listening = false;
  const callbacks = new Map<number, (timestampMs: number) => void>();
  const flush = (time: number): void => {
    const scheduled = [...callbacks.entries()];
    callbacks.clear();

    for (const [, callback] of scheduled) callback(time * 1_000);

    if (callbacks.size === 0) {
      listening = false;
      ticker.remove(flush);
    }
  };

  return {
    request(callback): number {
      const handle = nextHandle;
      nextHandle += 1;
      callbacks.set(handle, callback);
      if (!listening) {
        listening = true;
        ticker.add(flush);
      }
      return handle;
    },
    cancel(handle): void {
      callbacks.delete(handle);
      if (callbacks.size === 0 && listening) {
        listening = false;
        ticker.remove(flush);
      }
    },
  };
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(1, Math.max(0, value));
}
