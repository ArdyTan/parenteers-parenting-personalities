export interface VelocitySample {
  readonly x: number;
  readonly y: number;
  readonly time: number;
}

export interface VelocityVector {
  readonly x: number;
  readonly y: number;
  readonly speed: number;
}

export interface VelocityTrackerOptions {
  readonly inactivityMs?: number;
  readonly maxSamples?: number;
  readonly maxSpeed?: number;
  readonly now?: () => number;
  readonly windowMs?: number;
}

export interface VelocityTracker {
  readonly sampleCount: number;
  add(x: number, y: number, time?: number): void;
  reset(sample?: VelocitySample): void;
  velocity(time?: number): VelocityVector;
}

const ZERO_VELOCITY: VelocityVector = Object.freeze({ x: 0, y: 0, speed: 0 });

export function createVelocityTracker(options: VelocityTrackerOptions = {}): VelocityTracker {
  const windowMs = options.windowMs ?? 80;
  const inactivityMs = options.inactivityMs ?? 100;
  const maxSamples = options.maxSamples ?? 8;
  const maxSpeed = options.maxSpeed ?? Number.POSITIVE_INFINITY;
  const now = options.now ?? performance.now.bind(performance);

  assertPositive(windowMs, 'windowMs');
  assertNonNegative(inactivityMs, 'inactivityMs');
  if (!Number.isInteger(maxSamples) || maxSamples < 2) {
    throw new RangeError('maxSamples must be an integer of at least 2.');
  }
  assertPositive(maxSpeed, 'maxSpeed');

  const samples: VelocitySample[] = [];

  const add = (x: number, y: number, time = now()): void => {
    assertFinite(x, 'x');
    assertFinite(y, 'y');
    assertFinite(time, 'time');

    const latest = samples.at(-1);
    if (latest !== undefined && time < latest.time) {
      throw new RangeError('Velocity samples must be added in chronological order.');
    }

    const sample = { x, y, time };
    if (latest?.time === time) samples[samples.length - 1] = sample;
    else samples.push(sample);

    while (samples.length > maxSamples) samples.shift();
    const cutoff = time - windowMs;
    while (samples.length > 2 && (samples[1]?.time ?? time) < cutoff) samples.shift();
  };

  return {
    get sampleCount() {
      return samples.length;
    },
    add,
    reset(sample) {
      samples.length = 0;
      if (sample !== undefined) add(sample.x, sample.y, sample.time);
    },
    velocity(time = now()) {
      assertFinite(time, 'time');
      const latest = samples.at(-1);
      if (latest === undefined || time < latest.time) {
        if (latest !== undefined && time < latest.time) {
          throw new RangeError('Velocity cannot be measured before the latest sample.');
        }
        return ZERO_VELOCITY;
      }
      if (samples.length < 2 || time - latest.time > inactivityMs) return ZERO_VELOCITY;

      const cutoff = time - windowMs;
      let firstIndex = samples.findIndex((sample) => sample.time >= cutoff);
      if (firstIndex === -1) firstIndex = samples.length - 1;
      if (firstIndex > 0) firstIndex -= 1;
      const first = samples[firstIndex];
      if (first === undefined || first === latest) return ZERO_VELOCITY;

      const elapsedSeconds = (latest.time - first.time) / 1_000;
      if (elapsedSeconds <= 0) return ZERO_VELOCITY;

      const rawX = (latest.x - first.x) / elapsedSeconds;
      const rawY = (latest.y - first.y) / elapsedSeconds;
      const rawSpeed = Math.hypot(rawX, rawY);
      if (rawSpeed === 0) return ZERO_VELOCITY;

      const scale = Math.min(1, maxSpeed / rawSpeed);
      const x = rawX * scale;
      const y = rawY * scale;
      return { x, y, speed: Math.hypot(x, y) };
    },
  };
}

function assertFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite.`);
}

function assertNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be a finite number greater than or equal to zero.`);
  }
}

function assertPositive(value: number, label: string): void {
  if ((!Number.isFinite(value) && value !== Number.POSITIVE_INFINITY) || value <= 0) {
    throw new RangeError(`${label} must be a positive number.`);
  }
}
