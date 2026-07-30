import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import {
  FLOUR_TRAIL_CAPACITY,
  createFlourTrail,
} from './flour-trail';

function emptyTarget(): Vector3[] {
  return Array.from(
    { length: FLOUR_TRAIL_CAPACITY },
    () => new Vector3(),
  );
}

describe('FlourTrail', () => {
  it('keeps a fixed ring and overwrites its oldest point', () => {
    const trail = createFlourTrail();

    for (let index = 0; index <= FLOUR_TRAIL_CAPACITY; index += 1) {
      trail.pointer(index / FLOUR_TRAIL_CAPACITY, 0.25, 1);
    }

    const target = emptyTarget();
    trail.copyInto(target);

    expect(trail.count).toBe(FLOUR_TRAIL_CAPACITY);
    expect(target[0]?.x).toBe(1);
    expect(target[1]?.x).toBeCloseTo(1 / FLOUR_TRAIL_CAPACITY);
  });

  it('clamps pointer inputs to normalized UV and strength ranges', () => {
    const trail = createFlourTrail();
    const target = emptyTarget();

    trail.pointer(-2, 4, 8);
    trail.copyInto(target);

    expect(target[0]?.toArray()).toEqual([0, 1, 1]);
  });

  it('decays strength independently from the caller frame interval', () => {
    const oneFrame = createFlourTrail();
    const twoHalfFrames = createFlourTrail();
    const firstTarget = emptyTarget();
    const secondTarget = emptyTarget();

    oneFrame.pointer(0.5, 0.5);
    twoHalfFrames.pointer(0.5, 0.5);
    oneFrame.tick(1 / 60);
    twoHalfFrames.tick(1 / 120);
    twoHalfFrames.tick(1 / 120);
    oneFrame.copyInto(firstTarget);
    twoHalfFrames.copyInto(secondTarget);

    expect(firstTarget[0]?.z).toBeCloseTo(0.92);
    expect(secondTarget[0]?.z).toBeCloseTo(firstTarget[0]?.z ?? 0);
  });

  it('clears state on dispose and rejects undersized shader targets', () => {
    const trail = createFlourTrail();

    trail.pointer(0.2, 0.8);
    expect(() => trail.copyInto([])).toThrow(RangeError);

    trail.dispose();
    expect(trail.count).toBe(0);
    expect(trail.active).toBe(false);
  });
});
