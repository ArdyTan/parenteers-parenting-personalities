import { describe, expect, it } from 'vitest';

import {
  applyRubberBand,
  decayVelocity,
  nearestSnap,
  rubberBand,
  stepFriction,
  stepSpring,
  type SpringStep,
} from './spring';

describe('rubber-band resistance', () => {
  it('preserves direction and asymptotically limits the applied pull', () => {
    expect(rubberBand(0, 120)).toBe(0);
    expect(rubberBand(120, 120)).toBe(60);
    expect(rubberBand(-120, 120)).toBe(-60);
    expect(rubberBand(100_000, 120)).toBeLessThan(120);
  });

  it('maps values only after they cross either boundary', () => {
    expect(applyRubberBand(50, 0, 100)).toEqual({
      value: 50,
      edge: null,
      rawOverscroll: 0,
      appliedOverscroll: 0,
    });
    expect(applyRubberBand(-120, 0, 100, 120)).toEqual({
      value: -60,
      edge: 'min',
      rawOverscroll: 120,
      appliedOverscroll: 60,
    });
    expect(applyRubberBand(220, 0, 100, 120)).toEqual({
      value: 160,
      edge: 'max',
      rawOverscroll: 120,
      appliedOverscroll: 60,
    });
  });
});

describe('friction helpers', () => {
  it('matches the guide retention at 60fps and remains frame-rate independent', () => {
    expect(decayVelocity(1_000, 1 / 60)).toBeCloseTo(940);
    expect(decayVelocity(1_000, 2 / 60)).toBeCloseTo(883.6);

    const oneLargeStep = decayVelocity(1_000, 1 / 30);
    const twoSmallSteps = decayVelocity(decayVelocity(1_000, 1 / 60), 1 / 60);
    expect(oneLargeStep).toBeCloseTo(twoSmallSteps);
  });

  it('advances position and settles tiny residual velocity', () => {
    const moving = stepFriction({ position: 0, velocity: 600 }, 1 / 60);
    expect(moving.position).toBeGreaterThan(0);
    expect(moving.velocity).toBeCloseTo(564);

    expect(stepFriction({ position: 10, velocity: 0.1 }, 1 / 60)).toEqual({
      position: 10 + 0.1 * 0.5 / 60,
      velocity: 0,
    });
  });
});

describe('spring integrator and snapping', () => {
  it('converges to the target using only caller-provided delta time', () => {
    let state: SpringStep = { position: 0, velocity: 0, settled: false };
    for (let index = 0; index < 300 && !state.settled; index += 1) {
      state = stepSpring(state, 100, 1 / 60);
    }

    expect(state).toEqual({ position: 100, velocity: 0, settled: true });
  });

  it('clamps unusually large ticker gaps for stability', () => {
    const options = { maxDeltaSeconds: 1 / 60, stiffness: 100, damping: 0 };
    expect(stepSpring({ position: 0, velocity: 0 }, 10, 1, options)).toEqual(
      stepSpring({ position: 0, velocity: 0 }, 10, 1 / 60, options),
    );
  });

  it('snaps relative to a bounded minimum', () => {
    expect(nearestSnap(64, 50, 10, 160)).toBe(60);
    expect(nearestSnap(-100, 50, 10, 160)).toBe(10);
    expect(nearestSnap(999, 50, 10, 160)).toBe(160);
  });
});

describe('gesture math validation', () => {
  it('rejects invalid ranges and time steps', () => {
    expect(() => rubberBand(10, 0)).toThrow(/give/);
    expect(() => applyRubberBand(0, 10, 0)).toThrow(/min/);
    expect(() => decayVelocity(10, -1)).toThrow(/deltaSeconds/);
    expect(() => decayVelocity(10, 1, 2)).toThrow(/frameRetention/);
    expect(() => stepSpring({ position: 0, velocity: 0 }, 1, -1)).toThrow(/deltaSeconds/);
    expect(() => nearestSnap(0, 0, 0, 1)).toThrow(/pitch/);
  });
});
