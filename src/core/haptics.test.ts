import { describe, expect, it, vi } from 'vitest';

import { HAPTIC_PATTERNS, triggerHaptic } from './haptics';

describe('triggerHaptic', () => {
  it('passes the named shared pattern to the vibration target', () => {
    const vibrate = vi.fn(() => true);

    expect(triggerHaptic('tick', { vibrate })).toBe(true);
    expect(vibrate).toHaveBeenCalledWith(HAPTIC_PATTERNS.tick);
  });

  it('is a safe no-op when vibration is unavailable or rejected', () => {
    expect(triggerHaptic('boundary', {})).toBe(false);
    expect(
      triggerHaptic('celebrate', {
        vibrate: () => {
          throw new Error('blocked');
        },
      }),
    ).toBe(false);
  });
});
