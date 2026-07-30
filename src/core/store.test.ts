import { describe, expect, it, vi } from 'vitest';

import { createAppStore, STORAGE_KEYS, type StorageAdapter } from './store';

class MemoryStorage implements StorageAdapter {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe('app store', () => {
  it('hydrates the versioned storage shapes and returns an immutable snapshot', () => {
    const local = new MemoryStorage();
    const session = new MemoryStorage();
    local.values.set(STORAGE_KEYS.lang, 'en');
    local.values.set(STORAGE_KEYS.lastResult, JSON.stringify({ code: 'FGDN', ts: 123 }));
    session.values.set(
      STORAGE_KEYS.answers,
      JSON.stringify([
        { q: 4, pole: 'G' },
        { q: 1, pole: 'P' },
      ]),
    );

    const state = createAppStore({ localStorage: local, sessionStorage: session }).get();

    expect(state).toEqual({
      lang: 'en',
      scene: 'landing',
      answers: [
        { q: 1, pole: 'P' },
        { q: 4, pole: 'G' },
      ],
      result: 'FGDN',
      tier: 'mid',
    });
    expect(Object.isFrozen(state)).toBe(true);
    expect(Object.isFrozen(state.answers)).toBe(true);
    expect(state.answers.every(Object.isFrozen)).toBe(true);
  });

  it.each([
    ['missing values', undefined, undefined, undefined],
    ['invalid language', 'fr', undefined, undefined],
    ['malformed JSON', undefined, '{oops', '{oops'],
    [
      'wrong-dimension and invalid result shapes',
      undefined,
      JSON.stringify([{ q: 1, pole: 'C' }]),
      JSON.stringify({ code: 'XXXX', ts: 1 }),
    ],
    [
      'duplicate question ids and invalid timestamp',
      undefined,
      JSON.stringify([
        { q: 1, pole: 'P' },
        { q: 1, pole: 'F' },
      ]),
      JSON.stringify({ code: 'PCTE', ts: 'yesterday' }),
    ],
  ])('falls back safely for %s', (_label, language, answers, result) => {
    const local = new MemoryStorage();
    const session = new MemoryStorage();
    if (language !== undefined) local.values.set(STORAGE_KEYS.lang, language);
    if (answers !== undefined) session.values.set(STORAGE_KEYS.answers, answers);
    if (result !== undefined) local.values.set(STORAGE_KEYS.lastResult, result);

    expect(createAppStore({ localStorage: local, sessionStorage: session }).get()).toEqual({
      lang: 'id',
      scene: 'landing',
      answers: [],
      tier: 'mid',
    });
  });

  it('upserts answers in question order, persists them, and clears the session key', () => {
    const session = new MemoryStorage();
    const store = createAppStore({ localStorage: null, sessionStorage: session });

    store.upsertAnswer({ q: 4, pole: 'C' });
    store.upsertAnswer({ q: 1, pole: 'P' });
    store.upsertAnswer({ q: 1, pole: 'F' });

    expect(store.get().answers).toEqual([
      { q: 1, pole: 'F' },
      { q: 4, pole: 'C' },
    ]);
    expect(JSON.parse(session.values.get(STORAGE_KEYS.answers) ?? 'null')).toEqual(
      store.get().answers,
    );

    store.clearAnswers();
    expect(store.get().answers).toEqual([]);
    expect(session.values.has(STORAGE_KEYS.answers)).toBe(false);
  });

  it('persists language and timestamped results only in local storage', () => {
    const local = new MemoryStorage();
    const session = new MemoryStorage();
    const store = createAppStore({
      localStorage: local,
      sessionStorage: session,
      now: () => 1_789_000,
    });

    store.setLanguage('en');
    store.setResult('PCTE');

    expect(local.values.get(STORAGE_KEYS.lang)).toBe('en');
    expect(JSON.parse(local.values.get(STORAGE_KEYS.lastResult) ?? 'null')).toEqual({
      code: 'PCTE',
      ts: 1_789_000,
    });
    expect(session.values.has(STORAGE_KEYS.lastResult)).toBe(false);

    store.clearResult();
    expect(store.get().result).toBeUndefined();
    expect(local.values.has(STORAGE_KEYS.lastResult)).toBe(false);
  });

  it('publishes previous and immutable next snapshots, then unsubscribes', () => {
    const store = createAppStore({ localStorage: null, sessionStorage: null });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    const initial = store.get();
    store.set({ scene: 'intro', tier: 'high' });
    store.set({ scene: 'intro' });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(store.get(), initial);
    expect(Object.isFrozen(store.get())).toBe(true);

    unsubscribe();
    store.setLanguage('en');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid programmatic writes and survives inaccessible storage', () => {
    const broken: StorageAdapter = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    const store = createAppStore({ localStorage: broken, sessionStorage: broken });

    expect(() => store.upsertAnswer({ q: 1, pole: 'C' })).toThrow(/matching dimension/i);
    expect(() => store.setResult('XXXX' as 'PCTE')).toThrow(/invalid result code/i);
    expect(() => store.setLanguage('en')).not.toThrow();
    expect(store.get().lang).toBe('en');
    expect(() => store.clearAnswers()).not.toThrow();
  });
});
