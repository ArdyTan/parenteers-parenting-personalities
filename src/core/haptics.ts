export const HAPTIC_PATTERNS: Readonly<
  Record<'tick' | 'celebrate' | 'boundary', VibratePattern>
> = Object.freeze({
  tick: 10,
  celebrate: [18, 45, 28],
  boundary: 7,
});

export type HapticName = keyof typeof HAPTIC_PATTERNS;

export type VibrationTarget = Readonly<{
  vibrate?: (pattern: VibratePattern) => boolean;
}>;

export function triggerHaptic(
  name: HapticName,
  target: VibrationTarget = typeof navigator === 'undefined' ? {} : navigator,
): boolean {
  if (typeof target.vibrate !== 'function') return false;

  try {
    return target.vibrate(HAPTIC_PATTERNS[name]);
  } catch {
    return false;
  }
}
