export type GestureTouchAction = 'auto' | 'manipulation' | 'none' | 'pan-x' | 'pan-y';

export type PointerEndReason = 'cancel' | 'detach' | 'lost-capture' | 'up';

export interface PointerGestureSample {
  readonly pointerId: number;
  readonly pointerType: string;
  readonly x: number;
  readonly y: number;
  readonly startX: number;
  readonly startY: number;
  readonly deltaX: number;
  readonly deltaY: number;
  readonly stepX: number;
  readonly stepY: number;
  readonly time: number;
  readonly elapsedMs: number;
  readonly deltaMs: number;
}

export interface PointerGestureHandlers {
  readonly onStart?: (sample: PointerGestureSample, event: PointerEvent) => void;
  readonly onMove?: (sample: PointerGestureSample, event: PointerEvent) => void;
  readonly onEnd?: (
    sample: PointerGestureSample,
    reason: PointerEndReason,
    event: PointerEvent | null,
  ) => void;
}

export interface PointerGestureOptions {
  readonly accept?: (event: PointerEvent) => boolean;
  readonly now?: () => number;
  readonly preventDefault?: boolean;
  readonly primaryOnly?: boolean;
  readonly touchAction?: GestureTouchAction;
}

export interface PointerGestureBinding {
  readonly attached: boolean;
  readonly activePointerId: number | null;
  attach(): void;
  detach(): void;
}

interface ActivePointer {
  readonly pointerId: number;
  readonly pointerType: string;
  readonly startX: number;
  readonly startY: number;
  readonly startTime: number;
  x: number;
  y: number;
  time: number;
}

const NON_PASSIVE: AddEventListenerOptions = { passive: false };

/**
 * Creates a single-pointer gesture binding without starting a clock of its own.
 * Consumers explicitly attach and detach it with their scene lifecycle.
 */
export function createPointerGesture(
  target: HTMLElement,
  handlers: PointerGestureHandlers,
  options: PointerGestureOptions = {},
): PointerGestureBinding {
  const now = options.now ?? performance.now.bind(performance);
  const primaryOnly = options.primaryOnly ?? true;
  const preventDefault = options.preventDefault ?? false;
  const touchAction = options.touchAction;
  let attached = false;
  let active: ActivePointer | null = null;
  let previousTouchAction: string | null = null;

  const makeSample = (pointer: ActivePointer, x: number, y: number, time: number): PointerGestureSample => ({
    pointerId: pointer.pointerId,
    pointerType: pointer.pointerType,
    x,
    y,
    startX: pointer.startX,
    startY: pointer.startY,
    deltaX: x - pointer.startX,
    deltaY: y - pointer.startY,
    stepX: x - pointer.x,
    stepY: y - pointer.y,
    time,
    elapsedMs: Math.max(0, time - pointer.startTime),
    deltaMs: Math.max(0, time - pointer.time),
  });

  const shouldAccept = (event: PointerEvent): boolean => {
    if (active !== null) return false;
    if (primaryOnly && !event.isPrimary) return false;
    if (event.button !== 0) return false;
    return options.accept?.(event) ?? true;
  };

  const capture = (pointerId: number): void => {
    try {
      target.setPointerCapture(pointerId);
    } catch {
      // Capture can fail when the pointer ends between dispatch and this call.
    }
  };

  const releaseCapture = (pointerId: number): void => {
    try {
      if (target.hasPointerCapture(pointerId)) target.releasePointerCapture(pointerId);
    } catch {
      // A cancelled pointer may already have lost capture.
    }
  };

  const finish = (reason: PointerEndReason, event: PointerEvent | null): void => {
    const pointer = active;
    if (pointer === null) return;
    if (event !== null && event.pointerId !== pointer.pointerId) return;

    const time = now();
    const x = event?.clientX ?? pointer.x;
    const y = event?.clientY ?? pointer.y;
    const sample = makeSample(pointer, x, y, time);
    active = null;

    if (reason !== 'lost-capture') releaseCapture(pointer.pointerId);
    handlers.onEnd?.(sample, reason, event);
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (!shouldAccept(event)) return;
    if (preventDefault && event.cancelable) event.preventDefault();

    const time = now();
    active = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      startTime: time,
      x: event.clientX,
      y: event.clientY,
      time,
    };
    capture(event.pointerId);
    handlers.onStart?.(makeSample(active, active.x, active.y, time), event);
  };

  const onPointerMove = (event: PointerEvent): void => {
    const pointer = active;
    if (pointer === null || event.pointerId !== pointer.pointerId) return;
    if (preventDefault && event.cancelable) event.preventDefault();

    const time = now();
    const sample = makeSample(pointer, event.clientX, event.clientY, time);
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.time = time;
    handlers.onMove?.(sample, event);
  };

  const onPointerUp = (event: PointerEvent): void => finish('up', event);
  const onPointerCancel = (event: PointerEvent): void => finish('cancel', event);
  const onLostPointerCapture = (event: PointerEvent): void => finish('lost-capture', event);

  return {
    get attached() {
      return attached;
    },
    get activePointerId() {
      return active?.pointerId ?? null;
    },
    attach() {
      if (attached) return;
      attached = true;
      if (touchAction !== undefined) {
        previousTouchAction = target.style.touchAction;
        target.style.touchAction = touchAction;
      }
      target.addEventListener('pointerdown', onPointerDown, NON_PASSIVE);
      target.addEventListener('pointermove', onPointerMove, NON_PASSIVE);
      target.addEventListener('pointerup', onPointerUp);
      target.addEventListener('pointercancel', onPointerCancel);
      target.addEventListener('lostpointercapture', onLostPointerCapture);
    },
    detach() {
      if (!attached) return;
      finish('detach', null);
      target.removeEventListener('pointerdown', onPointerDown, NON_PASSIVE);
      target.removeEventListener('pointermove', onPointerMove, NON_PASSIVE);
      target.removeEventListener('pointerup', onPointerUp);
      target.removeEventListener('pointercancel', onPointerCancel);
      target.removeEventListener('lostpointercapture', onLostPointerCapture);
      if (touchAction !== undefined && previousTouchAction !== null) {
        target.style.touchAction = previousTouchAction;
      }
      previousTouchAction = null;
      attached = false;
    },
  };
}
