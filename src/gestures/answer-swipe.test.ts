import { describe, expect, it } from 'vitest';

import { resolveSwipeIntent, swipeSide } from './answer-swipe';

describe('directional answer swipe', () => {
  it('commits by the displayed side at the width-scaled distance', () => {
    expect(swipeSide(-93, 0, 390)).toBeNull();
    expect(swipeSide(-94, 0, 390)).toBe('left');
    expect(swipeSide(94, 0, 390)).toBe('right');
    expect(swipeSide(64, 0, 200)).toBe('right');
    expect(swipeSide(63, 0, 200)).toBeNull();
  });

  it('allows a recent agreeing flick, but not a hold or reversal', () => {
    expect(swipeSide(31, 900, 390)).toBeNull();
    expect(swipeSide(32, 649, 390)).toBeNull();
    expect(swipeSide(32, 650, 390)).toBe('right');
    expect(swipeSide(-32, -650, 390)).toBe('left');
    expect(swipeSide(32, -900, 390)).toBeNull();
    expect(swipeSide(50, 0, 390)).toBeNull();
  });

  it('locks vertical movement before horizontal intent', () => {
    expect(resolveSwipeIntent(11, 1)).toBe('pending');
    expect(resolveSwipeIntent(12, 4)).toBe('horizontal');
    expect(resolveSwipeIntent(10, 14)).toBe('vertical');
    expect(resolveSwipeIntent(12, 12)).toBe('vertical');
  });
});
