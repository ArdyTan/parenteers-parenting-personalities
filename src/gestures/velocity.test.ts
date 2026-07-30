import { describe, expect, it } from 'vitest';

import { createVelocityTracker } from './velocity';

describe('velocity tracker', () => {
  it('reports a two-dimensional velocity in pixels per second', () => {
    const tracker = createVelocityTracker();
    tracker.add(0, 0, 0);
    tracker.add(30, 40, 50);

    expect(tracker.velocity(50)).toEqual({ x: 600, y: 800, speed: 1_000 });
  });

  it('smooths over its sample window and keeps a bounded history', () => {
    const tracker = createVelocityTracker({ maxSamples: 3, windowMs: 40 });
    tracker.add(0, 0, 0);
    tracker.add(10, 0, 10);
    tracker.add(30, 0, 30);
    tracker.add(60, 0, 60);

    expect(tracker.sampleCount).toBeLessThanOrEqual(3);
    expect(tracker.velocity(60).x).toBeCloseTo(1_000);
  });

  it('returns zero after inactivity and when movement has stopped', () => {
    const tracker = createVelocityTracker({ inactivityMs: 60 });
    tracker.add(0, 0, 0);
    tracker.add(10, 0, 10);
    expect(tracker.velocity(71)).toEqual({ x: 0, y: 0, speed: 0 });

    tracker.reset({ x: 4, y: 9, time: 100 });
    tracker.add(4, 9, 120);
    expect(tracker.velocity(120)).toEqual({ x: 0, y: 0, speed: 0 });
  });

  it('caps extreme samples without changing their direction', () => {
    const tracker = createVelocityTracker({ maxSpeed: 500 });
    tracker.add(0, 0, 0);
    tracker.add(30, 40, 10);
    const velocity = tracker.velocity(10);

    expect(velocity.speed).toBeCloseTo(500);
    expect(velocity.x / velocity.y).toBeCloseTo(3 / 4);
  });

  it('uses its injected clock when times are omitted', () => {
    let time = 0;
    const tracker = createVelocityTracker({ now: () => time });
    tracker.add(0, 0);
    time = 20;
    tracker.add(10, 0);
    expect(tracker.velocity().x).toBe(500);
  });

  it('replaces a sample at the same timestamp and rejects time travel', () => {
    const tracker = createVelocityTracker();
    tracker.add(0, 0, 0);
    tracker.add(5, 0, 10);
    tracker.add(10, 0, 10);
    expect(tracker.sampleCount).toBe(2);
    expect(tracker.velocity(10).x).toBe(1_000);
    expect(() => tracker.add(0, 0, 9)).toThrow(/chronological/);
    expect(() => tracker.velocity(9)).toThrow(/before the latest/);
  });

  it('validates options and samples', () => {
    expect(() => createVelocityTracker({ windowMs: 0 })).toThrow(/windowMs/);
    expect(() => createVelocityTracker({ maxSamples: 1 })).toThrow(/maxSamples/);
    expect(() => createVelocityTracker({ maxSpeed: 0 })).toThrow(/maxSpeed/);
    const tracker = createVelocityTracker();
    expect(() => tracker.add(Number.NaN, 0, 0)).toThrow(/x/);
  });
});
