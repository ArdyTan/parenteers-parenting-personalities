export interface MotionState {
  readonly position: number;
  readonly velocity: number;
}

export interface SpringStep extends MotionState {
  readonly settled: boolean;
}

export interface SpringOptions {
  readonly damping?: number;
  readonly mass?: number;
  readonly maxDeltaSeconds?: number;
  readonly restDistance?: number;
  readonly restSpeed?: number;
  readonly stiffness?: number;
}

export interface FrictionOptions {
  readonly frameRetention?: number;
  readonly referenceFps?: number;
  readonly stopSpeed?: number;
}

export interface RubberBandResult {
  readonly value: number;
  readonly edge: 'max' | 'min' | null;
  readonly rawOverscroll: number;
  readonly appliedOverscroll: number;
}

const DEFAULT_MAX_DELTA_SECONDS = 1 / 15;

/** Sign-preserving form of y = x*c/(c+x), with `give` as the asymptotic limit. */
export function rubberBand(distance: number, give = 120): number {
  assertFinite(distance, 'distance');
  assertPositive(give, 'give');
  const magnitude = Math.abs(distance);
  if (magnitude === 0) return 0;
  return Math.sign(distance) * ((magnitude * give) / (give + magnitude));
}

export function applyRubberBand(value: number, min: number, max: number, give = 120): RubberBandResult {
  assertFinite(value, 'value');
  assertFinite(min, 'min');
  assertFinite(max, 'max');
  if (min > max) throw new RangeError('min must be less than or equal to max.');

  if (value < min) {
    const rawOverscroll = min - value;
    const appliedOverscroll = rubberBand(rawOverscroll, give);
    return { value: min - appliedOverscroll, edge: 'min', rawOverscroll, appliedOverscroll };
  }
  if (value > max) {
    const rawOverscroll = value - max;
    const appliedOverscroll = rubberBand(rawOverscroll, give);
    return { value: max + appliedOverscroll, edge: 'max', rawOverscroll, appliedOverscroll };
  }
  return { value, edge: null, rawOverscroll: 0, appliedOverscroll: 0 };
}

/** Frame-rate-independent equivalent of multiplying velocity once per reference frame. */
export function decayVelocity(
  velocity: number,
  deltaSeconds: number,
  frameRetention = 0.94,
  referenceFps = 60,
): number {
  assertFinite(velocity, 'velocity');
  assertNonNegative(deltaSeconds, 'deltaSeconds');
  if (!Number.isFinite(frameRetention) || frameRetention < 0 || frameRetention > 1) {
    throw new RangeError('frameRetention must be between 0 and 1.');
  }
  assertPositive(referenceFps, 'referenceFps');
  return velocity * Math.pow(frameRetention, deltaSeconds * referenceFps);
}

export function stepFriction(
  state: MotionState,
  deltaSeconds: number,
  options: FrictionOptions = {},
): MotionState {
  assertMotionState(state);
  assertNonNegative(deltaSeconds, 'deltaSeconds');
  const frameRetention = options.frameRetention ?? 0.94;
  const referenceFps = options.referenceFps ?? 60;
  const stopSpeed = options.stopSpeed ?? 0.5;
  assertNonNegative(stopSpeed, 'stopSpeed');

  const nextVelocity = decayVelocity(state.velocity, deltaSeconds, frameRetention, referenceFps);
  const velocity = Math.abs(nextVelocity) <= stopSpeed ? 0 : nextVelocity;
  const position = state.position + ((state.velocity + velocity) * 0.5 * deltaSeconds);
  return { position, velocity };
}

/** Semi-implicit Euler spring step. Feed it delta time from the app's shared ticker. */
export function stepSpring(
  state: MotionState,
  target: number,
  deltaSeconds: number,
  options: SpringOptions = {},
): SpringStep {
  assertMotionState(state);
  assertFinite(target, 'target');
  assertNonNegative(deltaSeconds, 'deltaSeconds');

  const stiffness = options.stiffness ?? 220;
  const damping = options.damping ?? 24;
  const mass = options.mass ?? 1;
  const maxDeltaSeconds = options.maxDeltaSeconds ?? DEFAULT_MAX_DELTA_SECONDS;
  const restDistance = options.restDistance ?? 0.1;
  const restSpeed = options.restSpeed ?? 0.1;
  assertNonNegative(stiffness, 'stiffness');
  assertNonNegative(damping, 'damping');
  assertPositive(mass, 'mass');
  assertPositive(maxDeltaSeconds, 'maxDeltaSeconds');
  assertNonNegative(restDistance, 'restDistance');
  assertNonNegative(restSpeed, 'restSpeed');

  const dt = Math.min(deltaSeconds, maxDeltaSeconds);
  const displacement = state.position - target;
  const acceleration = (-stiffness * displacement - damping * state.velocity) / mass;
  const velocity = state.velocity + acceleration * dt;
  const position = state.position + velocity * dt;
  const settled = Math.abs(position - target) <= restDistance && Math.abs(velocity) <= restSpeed;

  return settled ? { position: target, velocity: 0, settled: true } : { position, velocity, settled: false };
}

export function nearestSnap(value: number, pitch: number, min: number, max: number): number {
  assertFinite(value, 'value');
  assertPositive(pitch, 'pitch');
  assertFinite(min, 'min');
  assertFinite(max, 'max');
  if (min > max) throw new RangeError('min must be less than or equal to max.');
  const snapped = min + Math.round((value - min) / pitch) * pitch;
  return Math.min(max, Math.max(min, snapped));
}

function assertMotionState(state: MotionState): void {
  assertFinite(state.position, 'state.position');
  assertFinite(state.velocity, 'state.velocity');
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
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${label} must be positive.`);
}
