import { describe, expect, it } from 'vitest';

import type { PerformanceTier } from '../core/store';
import {
  clampDpr,
  classifyAverageFps,
  createFpsProbe,
  getTierProfile,
  probePerformanceTier,
  type FrameScheduler,
} from './tiers';

class ManualFrameScheduler implements FrameScheduler {
  private nextHandle = 1;
  private readonly callbacks = new Map<number, (timestampMs: number) => void>();

  request(callback: (timestampMs: number) => void): number {
    const handle = this.nextHandle;
    this.nextHandle += 1;
    this.callbacks.set(handle, callback);
    return handle;
  }

  cancel(handle: number): void {
    this.callbacks.delete(handle);
  }

  frame(timestampMs: number): void {
    const entry = this.callbacks.entries().next().value as
      | [number, (timestampMs: number) => void]
      | undefined;
    if (entry === undefined) throw new Error('No frame is pending.');
    const [handle, callback] = entry;
    this.callbacks.delete(handle);
    callback(timestampMs);
  }

  get pendingCount(): number {
    return this.callbacks.size;
  }
}

describe('quality tier profiles', () => {
  it('maps every tier to bounded, progressively cheaper settings', () => {
    const high = getTierProfile('high');
    const mid = getTierProfile('mid');
    const low = getTierProfile('low');

    expect(high).toMatchObject({
      maxDpr: 2,
      particleCount: 200,
      noiseOctaves: 4,
      trailEnabled: true,
      targetIdleFps: 60,
    });
    expect(mid.particleCount).toBe(175);
    expect(low).toMatchObject({
      maxDpr: 1,
      particleCount: 150,
      noiseOctaves: 2,
      trailEnabled: false,
      trailLength: 0,
      targetIdleFps: 15,
    });
    expect(high.trailLength).toBeGreaterThan(mid.trailLength);
    expect(mid.targetIdleFps).toBeGreaterThan(low.targetIdleFps);
    expect(Object.isFrozen(high)).toBe(true);
  });

  it('clamps DPR to the selected tier and the global ceiling', () => {
    expect(clampDpr(3, 'high')).toBe(2);
    expect(clampDpr(2, 'mid')).toBe(1.5);
    expect(clampDpr(1.75, 'low')).toBe(1);
    expect(clampDpr(Number.NaN, 'high')).toBe(1);
  });
});

describe('fps classification and probe', () => {
  it.each<[number, PerformanceTier]>([
    [60, 'high'],
    [52, 'high'],
    [51.9, 'mid'],
    [38, 'mid'],
    [37.9, 'low'],
    [Number.NaN, 'low'],
  ])('classifies %s fps as %s', (fps, expected) => {
    expect(classifyAverageFps(fps)).toBe(expected);
  });

  it('classifies injected frames without waiting in real time', async () => {
    const scheduler = new ManualFrameScheduler();
    const probe = createFpsProbe({ durationMs: 100, minimumSamples: 2, scheduler });

    for (const timestamp of [0, 16, 32, 48, 64, 80, 100]) {
      scheduler.frame(timestamp);
    }

    await expect(probe.result).resolves.toMatchObject({
      tier: 'high',
      sampleCount: 6,
      elapsedMs: 100,
      cancelled: false,
    });
    expect(scheduler.pendingCount).toBe(0);
  });

  it('exposes a tier-only convenience promise', async () => {
    const scheduler = new ManualFrameScheduler();
    const tier = probePerformanceTier({ durationMs: 100, minimumSamples: 2, scheduler });

    for (const timestamp of [0, 25, 50, 75, 100]) scheduler.frame(timestamp);

    await expect(tier).resolves.toBe('mid');
  });

  it('cancels a pending probe and resolves its configured fallback', async () => {
    const scheduler = new ManualFrameScheduler();
    const probe = createFpsProbe({ scheduler, fallbackTier: 'low' });

    expect(scheduler.pendingCount).toBe(1);
    probe.cancel();

    await expect(probe.result).resolves.toEqual({
      tier: 'low',
      averageFps: 0,
      sampleCount: 0,
      elapsedMs: 0,
      cancelled: true,
    });
    expect(scheduler.pendingCount).toBe(0);
  });
});
