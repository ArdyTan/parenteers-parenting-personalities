import type { PerformanceTier } from '../core/store';

export type TierProfile = Readonly<{
  maxDpr: number;
  particleCount: number;
  noiseOctaves: 2 | 3 | 4;
  trailEnabled: boolean;
  trailLength: number;
  targetIdleFps: number;
}>;

export const TIER_PROFILES: Readonly<Record<PerformanceTier, TierProfile>> = Object.freeze({
  high: Object.freeze({
    maxDpr: 2,
    particleCount: 200,
    noiseOctaves: 4,
    trailEnabled: true,
    trailLength: 1,
    targetIdleFps: 60,
  }),
  mid: Object.freeze({
    maxDpr: 1.5,
    particleCount: 175,
    noiseOctaves: 3,
    trailEnabled: true,
    trailLength: 0.65,
    targetIdleFps: 30,
  }),
  low: Object.freeze({
    maxDpr: 1,
    particleCount: 150,
    noiseOctaves: 2,
    trailEnabled: false,
    trailLength: 0,
    targetIdleFps: 15,
  }),
});

export const FPS_THRESHOLDS = Object.freeze({ high: 52, mid: 38 });

export type FrameScheduler = Readonly<{
  request(callback: (timestampMs: number) => void): number;
  cancel(handle: number): void;
}>;

export type FpsProbeResult = Readonly<{
  tier: PerformanceTier;
  averageFps: number;
  sampleCount: number;
  elapsedMs: number;
  cancelled: boolean;
}>;

export type FpsProbe = Readonly<{
  result: Promise<FpsProbeResult>;
  cancel(): void;
}>;

export type CreateFpsProbeOptions = Readonly<{
  durationMs?: number;
  minimumSamples?: number;
  fallbackTier?: PerformanceTier;
  scheduler?: FrameScheduler;
  now?: () => number;
}>;

export function getTierProfile(tier: PerformanceTier): TierProfile {
  return TIER_PROFILES[tier];
}

export function clampDpr(deviceDpr: number, tier: PerformanceTier): number {
  const safeDpr = Number.isFinite(deviceDpr) && deviceDpr > 0 ? deviceDpr : 1;
  return Math.min(safeDpr, getTierProfile(tier).maxDpr, 2);
}

export function classifyAverageFps(averageFps: number): PerformanceTier {
  if (!Number.isFinite(averageFps) || averageFps < FPS_THRESHOLDS.mid) {
    return 'low';
  }
  return averageFps >= FPS_THRESHOLDS.high ? 'high' : 'mid';
}

/**
 * Starts the short boot probe used to select a quality tier. The scheduler is
 * injectable so tests and non-window runtimes never have to wait in real time.
 */
export function createFpsProbe(options: CreateFpsProbeOptions = {}): FpsProbe {
  const durationMs = positiveFinite(options.durationMs, 2_000);
  const minimumSamples = Math.max(1, Math.floor(positiveFinite(options.minimumSamples, 2)));
  const fallbackTier = options.fallbackTier ?? 'mid';
  const scheduler = options.scheduler ?? createBrowserFrameScheduler();
  const now = options.now ?? defaultNow;

  let pendingHandle: number | undefined;
  let startedAt: number | undefined;
  let lastTimestamp: number | undefined;
  let sampleCount = 0;
  let settled = false;
  let settleResult: ((value: FpsProbeResult) => void) | undefined;

  const result = new Promise<FpsProbeResult>((resolve) => {
    settleResult = resolve;
  });

  const finish = (value: FpsProbeResult): void => {
    if (settled) return;
    settled = true;
    pendingHandle = undefined;
    settleResult?.(Object.freeze(value));
  };

  const schedule = (): void => {
    if (settled) return;
    try {
      pendingHandle = scheduler.request(onFrame);
    } catch {
      finish(fallbackResult(fallbackTier));
    }
  };

  const onFrame = (timestampMs: number): void => {
    if (settled) return;
    pendingHandle = undefined;
    const timestamp = Number.isFinite(timestampMs) ? timestampMs : now();

    if (startedAt === undefined) {
      startedAt = timestamp;
      lastTimestamp = timestamp;
      schedule();
      return;
    }

    if (lastTimestamp !== undefined && timestamp > lastTimestamp) {
      sampleCount += 1;
      lastTimestamp = timestamp;
    }

    const elapsedMs = Math.max(0, timestamp - startedAt);
    if (elapsedMs >= durationMs && sampleCount >= minimumSamples) {
      const averageFps = elapsedMs > 0 ? (sampleCount * 1_000) / elapsedMs : 0;
      finish({
        tier: classifyAverageFps(averageFps),
        averageFps,
        sampleCount,
        elapsedMs,
        cancelled: false,
      });
      return;
    }

    schedule();
  };

  schedule();

  return Object.freeze({
    result,
    cancel(): void {
      if (settled) return;
      if (pendingHandle !== undefined) {
        scheduler.cancel(pendingHandle);
      }
      finish(fallbackResult(fallbackTier));
    },
  });
}

export async function probePerformanceTier(
  options: CreateFpsProbeOptions = {},
): Promise<PerformanceTier> {
  const { tier } = await createFpsProbe(options).result;
  return tier;
}

function createBrowserFrameScheduler(): FrameScheduler {
  if (
    typeof globalThis.requestAnimationFrame !== 'function' ||
    typeof globalThis.cancelAnimationFrame !== 'function'
  ) {
    throw new Error('An animation-frame scheduler is required outside a browser.');
  }

  return {
    request: (callback) => globalThis.requestAnimationFrame(callback),
    cancel: (handle) => globalThis.cancelAnimationFrame(handle),
  };
}

function defaultNow(): number {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}

function positiveFinite(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) && value > 0 ? value : fallback;
}

function fallbackResult(tier: PerformanceTier): FpsProbeResult {
  return {
    tier,
    averageFps: 0,
    sampleCount: 0,
    elapsedMs: 0,
    cancelled: true,
  };
}
