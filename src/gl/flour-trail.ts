import { Vector3 } from 'three';

export const FLOUR_TRAIL_CAPACITY = 16;

export interface FlourTrailOptions {
  /** Strength retained after one 60 Hz frame. */
  decay?: number;
}

export interface FlourTrailSource {
  readonly capacity: number;
  readonly count: number;
  copyInto(target: Vector3[]): void;
}

const DEFAULT_DECAY = 0.92;
const REFERENCE_FRAME_RATE = 60;
const MAX_TICK_SECONDS = 0.25;
const MIN_VISIBLE_STRENGTH = 0.0001;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalized(value: number, fallback: number): number {
  return Number.isFinite(value) ? clamp(value, 0, 1) : fallback;
}

/**
 * Fixed-size pointer history for the dough shader.
 * Coordinates use WebGL UV space: (0, 0) is bottom-left and (1, 1) is top-right.
 */
export class FlourTrail implements FlourTrailSource {
  readonly capacity = FLOUR_TRAIL_CAPACITY;

  private readonly samples = Array.from(
    { length: FLOUR_TRAIL_CAPACITY },
    () => new Vector3(0.5, 0.5, 0),
  );

  private readonly decay: number;
  private head = 0;
  private populated = 0;

  constructor(options: FlourTrailOptions = {}) {
    this.decay = normalized(options.decay ?? DEFAULT_DECAY, DEFAULT_DECAY);
  }

  get count(): number {
    return this.populated;
  }

  get active(): boolean {
    return this.samples.some((sample) => sample.z > 0);
  }

  pointer(x: number, y: number, strength = 1): void {
    this.samples[this.head]?.set(
      normalized(x, 0.5),
      normalized(y, 0.5),
      normalized(strength, 0),
    );

    this.head = (this.head + 1) % FLOUR_TRAIL_CAPACITY;
    this.populated = Math.min(this.populated + 1, FLOUR_TRAIL_CAPACITY);
  }

  /** Decays strengths independently of frame rate. `deltaSeconds` is wall-clock seconds. */
  tick(deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
      return;
    }

    const seconds = Math.min(deltaSeconds, MAX_TICK_SECONDS);
    const retention = Math.pow(this.decay, seconds * REFERENCE_FRAME_RATE);

    for (const sample of this.samples) {
      sample.z *= retention;

      if (sample.z < MIN_VISIBLE_STRENGTH) {
        sample.z = 0;
      }
    }
  }

  copyInto(target: Vector3[]): void {
    if (target.length < FLOUR_TRAIL_CAPACITY) {
      throw new RangeError(
        `Flour trail target needs ${FLOUR_TRAIL_CAPACITY} slots; received ${target.length}.`,
      );
    }

    for (let index = 0; index < FLOUR_TRAIL_CAPACITY; index += 1) {
      const source = this.samples[index];
      const destination = target[index];

      if (source && destination) {
        destination.copy(source);
      }
    }
  }

  clear(): void {
    for (const sample of this.samples) {
      sample.set(0.5, 0.5, 0);
    }

    this.head = 0;
    this.populated = 0;
  }

  dispose(): void {
    this.clear();
  }
}

export function createFlourTrail(options: FlourTrailOptions = {}): FlourTrail {
  return new FlourTrail(options);
}
