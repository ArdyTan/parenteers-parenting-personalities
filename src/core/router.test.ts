import { describe, expect, it, vi } from 'vitest';

import type { AppRoute } from './navigation';
import {
  buildRoutePath,
  createHistoryRouter,
  normalizePathname,
  parseRoute,
  type RouterEnvironment,
} from './router';

describe('route parsing', () => {
  it.each([
    ['/', { scene: 'landing' }],
    ['/intro', { scene: 'intro' }],
    ['/q/1', { scene: 'question', question: 1 }],
    ['/q/12', { scene: 'question', question: 12 }],
    ['/baking', { scene: 'calculating' }],
    ['/r/pcte', { scene: 'result', slug: 'pcte' }],
    ['/story', { scene: 'story' }],
    ['/gallery', { scene: 'gallery' }],
    ['/end', { scene: 'end' }],
  ] satisfies ReadonlyArray<readonly [string, AppRoute]>)('maps %s to its route', (path, route) => {
    expect(parseRoute(path)).toEqual(route);
  });

  it('normalizes trailing slashes and direct-parser query/hash suffixes', () => {
    expect(normalizePathname('intro///?from=test#top')).toBe('/intro');
    expect(parseRoute('/intro///')).toEqual({ scene: 'intro' });
    expect(parseRoute('/gallery?source=story')).toEqual({ scene: 'gallery' });
  });

  it('decodes route segments without throwing on malformed escapes', () => {
    expect(parseRoute('/r/choux%20pop')).toEqual({ scene: 'result', slug: 'choux pop' });
    expect(parseRoute('/r/%E0%A4%A')).toEqual({ scene: 'notFound', path: '/r/%E0%A4%A' });
  });

  it.each(['/q/0', '/q/01', '/q/13', '/q/2.5', '/q/1/extra', '/r', '/missing']) (
    'returns notFound for %s',
    (path) => {
      expect(parseRoute(path)).toEqual({ scene: 'notFound', path });
    },
  );
});

describe('route building', () => {
  it.each([
    [{ scene: 'landing' }, '/'],
    [{ scene: 'intro' }, '/intro'],
    [{ scene: 'question', question: 7 }, '/q/7'],
    [{ scene: 'calculating' }, '/baking'],
    [{ scene: 'result', slug: 'choux pop' }, '/r/choux%20pop'],
    [{ scene: 'story' }, '/story'],
    [{ scene: 'gallery' }, '/gallery'],
    [{ scene: 'end' }, '/end'],
    [{ scene: 'notFound', path: 'eaten///' }, '/eaten'],
  ] satisfies ReadonlyArray<readonly [AppRoute, string]>)('builds $expected', (route, expected) => {
    expect(buildRoutePath(route)).toBe(expected);
  });

  it('rejects machine states that cannot produce valid route paths', () => {
    expect(() => buildRoutePath({ scene: 'question', question: 0 })).toThrow(RangeError);
    expect(() => buildRoutePath({ scene: 'question', question: 13 })).toThrow(RangeError);
    expect(() => buildRoutePath({ scene: 'result', slug: '' })).toThrow(RangeError);
  });
});

describe('History API router', () => {
  it('publishes the initial route, programmatic navigation, replacement, and popstate', () => {
    const { environment, emitPopState, location, pushState, replaceState } = fakeEnvironment('/intro');
    const router = createHistoryRouter(environment);
    const listener = vi.fn<(route: AppRoute) => void>();
    const unsubscribe = router.subscribe(listener);

    expect(router.start()).toEqual({ scene: 'intro' });
    expect(listener).toHaveBeenLastCalledWith({ scene: 'intro' });

    router.navigate({ scene: 'question', question: 3 });
    expect(pushState).toHaveBeenCalledWith(null, '', '/q/3');
    expect(listener).toHaveBeenLastCalledWith({ scene: 'question', question: 3 });

    router.replace({ scene: 'result', slug: 'choux pop' });
    expect(replaceState).toHaveBeenCalledWith(null, '', '/r/choux%20pop');
    expect(listener).toHaveBeenLastCalledWith({ scene: 'result', slug: 'choux pop' });

    location.pathname = '/gallery';
    emitPopState();
    expect(listener).toHaveBeenLastCalledWith({ scene: 'gallery' });

    unsubscribe();
    router.navigate({ scene: 'end' });
    expect(listener).toHaveBeenCalledTimes(4);
  });

  it('starts and stops idempotently, and ignores popstate while stopped', () => {
    const { addEventListener, emitPopState, environment, location, removeEventListener } =
      fakeEnvironment('/');
    const router = createHistoryRouter(environment);
    const listener = vi.fn<(route: AppRoute) => void>();
    router.subscribe(listener);

    router.start();
    router.start();
    expect(addEventListener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(1);

    router.stop();
    router.stop();
    expect(removeEventListener).toHaveBeenCalledTimes(1);

    location.pathname = '/story';
    emitPopState();
    expect(listener).toHaveBeenCalledTimes(1);

    expect(router.current()).toEqual({ scene: 'story' });
  });
});

function fakeEnvironment(initialPath: string): {
  environment: RouterEnvironment;
  location: { pathname: string };
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  pushState: ReturnType<typeof vi.fn>;
  replaceState: ReturnType<typeof vi.fn>;
  emitPopState: () => void;
} {
  const listeners = new Set<() => void>();
  const location = { pathname: initialPath };
  const toPath = (url?: string | URL | null): string => (url === undefined || url === null ? '' : String(url));
  const addEventListener = vi.fn((_type: 'popstate', listener: () => void) => {
    listeners.add(listener);
  });
  const removeEventListener = vi.fn((_type: 'popstate', listener: () => void) => {
    listeners.delete(listener);
  });
  const pushState = vi.fn((_data: unknown, _unused: string, url?: string | URL | null) => {
    location.pathname = toPath(url);
  });
  const replaceState = vi.fn((_data: unknown, _unused: string, url?: string | URL | null) => {
    location.pathname = toPath(url);
  });

  return {
    environment: {
      window: { addEventListener, removeEventListener },
      history: { pushState, replaceState },
      location,
    },
    location,
    addEventListener,
    removeEventListener,
    pushState,
    replaceState,
    emitPopState: () => {
      for (const listener of listeners) {
        listener();
      }
    },
  };
}
