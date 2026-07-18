import { describe, expect, it } from 'vitest';

import { DESKTOP_GATE_WIDTH, shouldShowDesktopGate } from './device';

describe('shouldShowDesktopGate', () => {
  it('gates viewports at the desktop threshold', () => {
    expect(
      shouldShowDesktopGate({
        viewportWidth: DESKTOP_GATE_WIDTH,
        finePointer: false,
        maxTouchPoints: 5,
      }),
    ).toBe(true);
  });

  it('gates a fine pointer device without touch', () => {
    expect(
      shouldShowDesktopGate({
        viewportWidth: 720,
        finePointer: true,
        maxTouchPoints: 0,
      }),
    ).toBe(true);
  });

  it('keeps a touch phone edge-to-edge', () => {
    expect(
      shouldShowDesktopGate({
        viewportWidth: 390,
        finePointer: false,
        maxTouchPoints: 5,
      }),
    ).toBe(false);
  });
});
