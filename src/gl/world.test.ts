import { describe, expect, it, vi } from 'vitest';

import { createGsapFrameScheduler, type SharedTicker } from './world';

describe('createGsapFrameScheduler', () => {
  it('defers work scheduled during a flush until the following shared tick', () => {
    let listener: ((time: number) => void) | undefined;
    const ticker: SharedTicker = {
      add(callback) {
        listener = callback;
      },
      remove(callback) {
        if (listener === callback) listener = undefined;
      },
    };
    const scheduler = createGsapFrameScheduler(ticker);
    const calls: number[] = [];

    scheduler.request((timestamp) => {
      calls.push(timestamp);
      scheduler.request((nextTimestamp) => calls.push(nextTimestamp));
    });

    listener?.(1);
    expect(calls).toEqual([1_000]);
    expect(listener).toBeTypeOf('function');

    listener?.(2);
    expect(calls).toEqual([1_000, 2_000]);
    expect(listener).toBeUndefined();
  });

  it('detaches from the shared ticker after the last request is cancelled', () => {
    const remove = vi.fn();
    const ticker: SharedTicker = { add: vi.fn(), remove };
    const scheduler = createGsapFrameScheduler(ticker);
    const handle = scheduler.request(() => undefined);

    scheduler.cancel(handle);

    expect(remove).toHaveBeenCalledOnce();
  });
});
