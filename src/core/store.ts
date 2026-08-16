import { SCENE_NAMES, type SceneName } from './navigation';
import type { Language, PersistedAnswer, Pole, TypeCode } from './quiz-types';

export const STORAGE_KEYS = {
  lang: 'pb1.lang',
  answers: 'pb1.answers',
  lastResult: 'pb1.lastResult',
  sound: 'pb1.sound',
} as const;

/**
 * Fresh visitors see sound enabled, but mobile autoplay still keeps the bed
 * paused until the first trusted pointer or keyboard interaction. An explicit
 * stored "off" always wins, and the header toggle remains reachable anywhere
 * music can play (plan.md §14 decision 5).
 */
export const SOUND_DEFAULT = true;

export type AppState = Readonly<{
  lang: Language;
  scene: SceneName;
  answers: readonly PersistedAnswer[];
  sound: boolean;
  result?: TypeCode;
}>;

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type StoreListener = (state: AppState, previous: AppState) => void;

type StatePatch = Readonly<
  Partial<{
    lang: Language;
    scene: SceneName;
    answers: readonly PersistedAnswer[];
    sound: boolean;
    result: TypeCode;
  }>
>;

export type StateUpdate = StatePatch | ((state: AppState) => StatePatch);

export type CreateStoreOptions = Readonly<{
  localStorage?: StorageAdapter | null;
  sessionStorage?: StorageAdapter | null;
  initialScene?: SceneName;
  now?: () => number;
}>;

export interface AppStore {
  get(): AppState;
  set(update: StateUpdate): AppState;
  subscribe(listener: StoreListener): () => void;
  setLanguage(lang: Language): AppState;
  setSound(enabled: boolean): AppState;
  upsertAnswer(answer: PersistedAnswer): AppState;
  clearAnswers(): AppState;
  setResult(code: TypeCode): AppState;
  clearResult(): AppState;
}

const POLES = new Set<Pole>(['P', 'F', 'C', 'G', 'T', 'D', 'E', 'N']);
const TYPE_CODE_PATTERN = /^[PF][CG][TD][EN]$/;

export function createStore(options: CreateStoreOptions = {}): AppStore {
  const local = resolveStorage(options.localStorage, 'localStorage');
  const session = resolveStorage(options.sessionStorage, 'sessionStorage');
  const now = options.now ?? Date.now;
  const listeners = new Set<StoreListener>();

  let state = freezeState({
    lang: readLanguage(local),
    scene: options.initialScene ?? 'landing',
    answers: readAnswers(session),
    sound: readSound(local),
    result: readLastResult(local),
  });

  function set(update: StateUpdate): AppState {
    const patch = typeof update === 'function' ? update(state) : update;
    const next = freezeState({ ...state, ...patch });

    if (statesEqual(state, next)) {
      return state;
    }

    const previous = state;
    state = next;
    persistChanges(previous, next, local, session, now);
    listeners.forEach((listener) => listener(next, previous));
    return next;
  }

  return {
    get: () => state,
    set,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setLanguage: (lang) => set({ lang }),
    setSound: (enabled) => set({ sound: enabled }),
    upsertAnswer(answer) {
      assertAnswer(answer);
      return set(({ answers }) => ({
        answers: [...answers.filter(({ q }) => q !== answer.q), answer].sort(
          (left, right) => left.q - right.q,
        ),
      }));
    },
    clearAnswers() {
      const next = set({ answers: [] });
      safeRemove(session, STORAGE_KEYS.answers);
      return next;
    },
    setResult: (code) => set({ result: code }),
    clearResult() {
      if (state.result === undefined) {
        safeRemove(local, STORAGE_KEYS.lastResult);
        return state;
      }

      const previous = state;
      const { result: _result, ...withoutResult } = state;
      state = freezeState(withoutResult);
      safeRemove(local, STORAGE_KEYS.lastResult);
      listeners.forEach((listener) => listener(state, previous));
      return state;
    },
  };
}

export const createAppStore = createStore;

function freezeState(value: {
  lang: unknown;
  scene: unknown;
  answers: unknown;
  sound: unknown;
  result?: unknown;
}): AppState {
  if (value.lang !== 'id' && value.lang !== 'en') {
    throw new TypeError(`Invalid language "${String(value.lang)}".`);
  }
  if (!SCENE_NAMES.includes(value.scene as SceneName)) {
    throw new TypeError(`Invalid scene "${String(value.scene)}".`);
  }
  if (!isAnswerArray(value.answers)) {
    throw new TypeError('Answers must be unique, dimension-valid question records for questions 1–12.');
  }
  if (typeof value.sound !== 'boolean') {
    throw new TypeError(`Invalid sound preference "${String(value.sound)}".`);
  }
  if (value.result !== undefined && !isTypeCode(value.result)) {
    throw new TypeError(`Invalid result code "${String(value.result)}".`);
  }

  const answers = Object.freeze(
    [...value.answers]
      .sort((left, right) => left.q - right.q)
      .map((answer) => Object.freeze({ q: answer.q, pole: answer.pole })),
  );
  const base: Omit<AppState, 'result'> = {
    lang: value.lang as Language,
    scene: value.scene as SceneName,
    answers,
    sound: value.sound,
  };

  return Object.freeze(
    value.result === undefined ? base : { ...base, result: value.result as TypeCode },
  );
}

function persistChanges(
  previous: AppState,
  next: AppState,
  local: StorageAdapter | null,
  session: StorageAdapter | null,
  now: () => number,
): void {
  if (previous.lang !== next.lang) {
    safeSet(local, STORAGE_KEYS.lang, next.lang);
  }
  if (previous.sound !== next.sound) {
    safeSet(local, STORAGE_KEYS.sound, next.sound ? 'on' : 'off');
  }
  if (!answersEqual(previous.answers, next.answers)) {
    if (next.answers.length === 0) {
      safeRemove(session, STORAGE_KEYS.answers);
    } else {
      safeSet(session, STORAGE_KEYS.answers, JSON.stringify(next.answers));
    }
  }
  if (previous.result !== next.result && next.result !== undefined) {
    safeSet(local, STORAGE_KEYS.lastResult, JSON.stringify({ code: next.result, ts: now() }));
  }
}

function readLanguage(storage: StorageAdapter | null): Language {
  const value = safeGet(storage, STORAGE_KEYS.lang);
  return value === 'en' || value === 'id' ? value : 'id';
}

function readSound(storage: StorageAdapter | null): boolean {
  const value = safeGet(storage, STORAGE_KEYS.sound);
  if (value === 'on') return true;
  if (value === 'off') return false;
  return SOUND_DEFAULT;
}

function readAnswers(storage: StorageAdapter | null): readonly PersistedAnswer[] {
  const value = parseJson(safeGet(storage, STORAGE_KEYS.answers));
  return isAnswerArray(value) ? value : [];
}

function readLastResult(storage: StorageAdapter | null): TypeCode | undefined {
  const value = parseJson(safeGet(storage, STORAGE_KEYS.lastResult));
  if (!isRecord(value) || !isTypeCode(value.code)) {
    return undefined;
  }

  return typeof value.ts === 'number' && Number.isFinite(value.ts) && value.ts >= 0
    ? value.code
    : undefined;
}

function isAnswerArray(value: unknown): value is PersistedAnswer[] {
  if (!Array.isArray(value)) {
    return false;
  }

  const questions = new Set<number>();
  return value.every((answer) => {
    if (!isAnswer(answer) || questions.has(answer.q)) {
      return false;
    }
    questions.add(answer.q);
    return true;
  });
}

function isAnswer(value: unknown): value is PersistedAnswer {
  if (!isRecord(value) || !Number.isInteger(value.q) || !POLES.has(value.pole as Pole)) {
    return false;
  }

  return isPoleForQuestion(value.q as number, value.pole as Pole);
}

function assertAnswer(answer: PersistedAnswer): void {
  if (!isAnswer(answer)) {
    throw new TypeError('Answer must contain a question id from 1–12 and its matching dimension pole.');
  }
}

function isPoleForQuestion(question: number, pole: Pole): boolean {
  if (question >= 1 && question <= 3) return pole === 'P' || pole === 'F';
  if (question >= 4 && question <= 6) return pole === 'C' || pole === 'G';
  if (question >= 7 && question <= 9) return pole === 'T' || pole === 'D';
  if (question >= 10 && question <= 12) return pole === 'E' || pole === 'N';
  return false;
}

function isTypeCode(value: unknown): value is TypeCode {
  return typeof value === 'string' && TYPE_CODE_PATTERN.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function statesEqual(left: AppState, right: AppState): boolean {
  return (
    left.lang === right.lang &&
    left.scene === right.scene &&
    left.sound === right.sound &&
    left.result === right.result &&
    answersEqual(left.answers, right.answers)
  );
}

function answersEqual(left: readonly PersistedAnswer[], right: readonly PersistedAnswer[]): boolean {
  return (
    left.length === right.length &&
    left.every((answer, index) => {
      const other = right[index];
      return other !== undefined && answer.q === other.q && answer.pole === other.pole;
    })
  );
}

function parseJson(value: string | null): unknown {
  if (value === null) return undefined;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function resolveStorage(
  injected: StorageAdapter | null | undefined,
  browserKey: 'localStorage' | 'sessionStorage',
): StorageAdapter | null {
  if (injected !== undefined) return injected;
  if (typeof window === 'undefined') return null;

  try {
    return window[browserKey];
  } catch {
    return null;
  }
}

function safeGet(storage: StorageAdapter | null, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function safeSet(storage: StorageAdapter | null, key: string, value: string): void {
  try {
    storage?.setItem(key, value);
  } catch {
    // Persistence is progressive enhancement; in-memory state remains authoritative.
  }
}

function safeRemove(storage: StorageAdapter | null, key: string): void {
  try {
    storage?.removeItem(key);
  } catch {
    // Persistence is progressive enhancement; in-memory state remains authoritative.
  }
}
