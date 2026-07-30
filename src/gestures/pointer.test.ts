import { describe, expect, it, vi } from 'vitest';

import { createPointerGesture, type PointerEndReason } from './pointer';

describe('pointer gesture binding', () => {
  it('tracks one captured pointer through start, move, and release', () => {
    const target = new FakePointerTarget('pan-y');
    let time = 10;
    const onStart = vi.fn();
    const onMove = vi.fn();
    const onEnd = vi.fn();
    const binding = createPointerGesture(
      target.asElement(),
      { onStart, onMove, onEnd },
      { now: () => time, preventDefault: true, touchAction: 'none' },
    );

    binding.attach();
    binding.attach();
    expect(binding.attached).toBe(true);
    expect(target.style.touchAction).toBe('none');
    expect(target.listenerCount('pointerdown')).toBe(1);

    const down = pointerEvent({ pointerId: 7, clientX: 12, clientY: 20 });
    target.emit('pointerdown', down);
    expect(binding.activePointerId).toBe(7);
    expect(target.captured).toContain(7);
    expect(down.preventDefault).toHaveBeenCalledOnce();
    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({ deltaX: 0, deltaY: 0, stepX: 0, stepY: 0, elapsedMs: 0 }),
      down,
    );

    time = 26;
    const move = pointerEvent({ pointerId: 7, clientX: 32, clientY: 14 });
    target.emit('pointermove', move);
    expect(onMove).toHaveBeenCalledWith(
      expect.objectContaining({ deltaX: 20, deltaY: -6, stepX: 20, stepY: -6, deltaMs: 16 }),
      move,
    );

    time = 30;
    target.emit('pointermove', pointerEvent({ pointerId: 99, clientX: 200, clientY: 200 }));
    expect(onMove).toHaveBeenCalledTimes(1);

    time = 42;
    const up = pointerEvent({ pointerId: 7, clientX: 36, clientY: 16 });
    target.emit('pointerup', up);
    expect(binding.activePointerId).toBeNull();
    expect(target.captured).not.toContain(7);
    expect(onEnd).toHaveBeenCalledWith(
      expect.objectContaining({ deltaX: 24, deltaY: -4, stepX: 4, stepY: 2, elapsedMs: 32 }),
      'up',
      up,
    );

    binding.detach();
    binding.detach();
    expect(binding.attached).toBe(false);
    expect(target.style.touchAction).toBe('pan-y');
    expect(target.listenerCount('pointerdown')).toBe(0);
  });

  it('ends an active gesture on detach and releases capture', () => {
    const target = new FakePointerTarget();
    const reasons: PointerEndReason[] = [];
    const binding = createPointerGesture(
      target.asElement(),
      { onEnd: (_sample, reason) => reasons.push(reason) },
      { now: () => 5 },
    );

    binding.attach();
    target.emit('pointerdown', pointerEvent({ pointerId: 3 }));
    binding.detach();

    expect(reasons).toEqual(['detach']);
    expect(target.captured.size).toBe(0);
  });

  it.each([
    ['pointercancel', 'cancel'],
    ['lostpointercapture', 'lost-capture'],
  ] as const)('reports %s with the matching reason', (eventName, reason) => {
    const target = new FakePointerTarget();
    const onEnd = vi.fn();
    const binding = createPointerGesture(target.asElement(), { onEnd }, { now: () => 1 });
    binding.attach();
    target.emit('pointerdown', pointerEvent({ pointerId: 1 }));
    target.emit(eventName, pointerEvent({ pointerId: 1 }));
    expect(onEnd).toHaveBeenCalledWith(expect.any(Object), reason, expect.any(Object));
  });

  it('filters non-primary, non-left-button, and consumer-rejected pointers', () => {
    const target = new FakePointerTarget();
    const onStart = vi.fn();
    const binding = createPointerGesture(target.asElement(), { onStart }, {
      accept: (event) => event.pointerType !== 'pen',
      now: () => 0,
    });
    binding.attach();

    target.emit('pointerdown', pointerEvent({ pointerId: 1, isPrimary: false }));
    target.emit('pointerdown', pointerEvent({ pointerId: 2, button: 2 }));
    target.emit('pointerdown', pointerEvent({ pointerId: 3, pointerType: 'pen' }));
    expect(onStart).not.toHaveBeenCalled();

    target.emit('pointerdown', pointerEvent({ pointerId: 4, pointerType: 'touch' }));
    target.emit('pointerdown', pointerEvent({ pointerId: 5, pointerType: 'touch' }));
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(binding.activePointerId).toBe(4);
  });
});

interface FakeEventOverrides {
  readonly button?: number;
  readonly cancelable?: boolean;
  readonly clientX?: number;
  readonly clientY?: number;
  readonly isPrimary?: boolean;
  readonly pointerId?: number;
  readonly pointerType?: string;
}

function pointerEvent(overrides: FakeEventOverrides = {}): PointerEvent & { preventDefault: ReturnType<typeof vi.fn> } {
  return {
    button: overrides.button ?? 0,
    cancelable: overrides.cancelable ?? true,
    clientX: overrides.clientX ?? 0,
    clientY: overrides.clientY ?? 0,
    isPrimary: overrides.isPrimary ?? true,
    pointerId: overrides.pointerId ?? 1,
    pointerType: overrides.pointerType ?? 'touch',
    preventDefault: vi.fn(),
  } as unknown as PointerEvent & { preventDefault: ReturnType<typeof vi.fn> };
}

class FakePointerTarget {
  readonly style: { touchAction: string };
  readonly captured = new Set<number>();
  private readonly listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();

  constructor(touchAction = '') {
    this.style = { touchAction };
  }

  asElement(): HTMLElement {
    return this as unknown as HTMLElement;
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject | null): void {
    if (listener === null) return;
    const listeners = this.listeners.get(type) ?? new Set<EventListenerOrEventListenerObject>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject | null): void {
    if (listener !== null) this.listeners.get(type)?.delete(listener);
  }

  setPointerCapture(pointerId: number): void {
    this.captured.add(pointerId);
  }

  hasPointerCapture(pointerId: number): boolean {
    return this.captured.has(pointerId);
  }

  releasePointerCapture(pointerId: number): void {
    this.captured.delete(pointerId);
  }

  listenerCount(type: string): number {
    return this.listeners.get(type)?.size ?? 0;
  }

  emit(type: string, event: PointerEvent): void {
    for (const listener of this.listeners.get(type) ?? []) {
      if (typeof listener === 'function') listener(event);
      else listener.handleEvent(event);
    }
  }
}
