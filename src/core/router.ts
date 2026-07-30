import type { AppRoute } from './navigation';

const FIRST_QUESTION = 1;
const LAST_QUESTION = 12;

export type RouteListener = (route: AppRoute) => void;

export interface RouterWindow {
  addEventListener(type: 'popstate', listener: () => void): void;
  removeEventListener(type: 'popstate', listener: () => void): void;
}

export interface RouterHistory {
  pushState(data: unknown, unused: string, url?: string | URL | null): void;
  replaceState(data: unknown, unused: string, url?: string | URL | null): void;
}

export interface RouterLocation {
  readonly pathname: string;
}

export interface RouterEnvironment {
  readonly window: RouterWindow;
  readonly history: RouterHistory;
  readonly location: RouterLocation;
}

export interface HistoryRouter {
  current(): AppRoute;
  start(): AppRoute;
  stop(): void;
  subscribe(listener: RouteListener): () => void;
  navigate(route: AppRoute): void;
  replace(route: AppRoute): void;
}

/**
 * Canonicalize a pathname without interpreting its route.
 *
 * The router normally receives `location.pathname`, but stripping a query/hash
 * here keeps the pure parser unsurprising when it is called directly in tests
 * or by build tooling. Interior slashes are intentionally preserved.
 */
export function normalizePathname(pathname: string): string {
  const suffixIndex = pathname.search(/[?#]/);
  const pathOnly = suffixIndex === -1 ? pathname : pathname.slice(0, suffixIndex);
  const rooted = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  const withoutTrailingSlashes = rooted.replace(/\/+$/, '');

  return withoutTrailingSlashes || '/';
}

/** Translate a pathname into machine state. This function owns no guards. */
export function parseRoute(pathname: string): AppRoute {
  const normalizedPath = normalizePathname(pathname);
  const segments = decodeSegments(normalizedPath);

  if (segments === null) {
    return { scene: 'notFound', path: normalizedPath };
  }

  if (segments.length === 0) {
    return { scene: 'landing' };
  }

  if (segments.length === 1) {
    switch (segments[0]) {
      case 'intro':
        return { scene: 'intro' };
      case 'baking':
        return { scene: 'calculating' };
      case 'story':
        return { scene: 'story' };
      case 'gallery':
        return { scene: 'gallery' };
      case 'end':
        return { scene: 'end' };
      default:
        return { scene: 'notFound', path: normalizedPath };
    }
  }

  if (segments.length === 2) {
    const prefix = segments[0];
    const value = segments[1];

    if (prefix === 'q' && value !== undefined && isQuestionSegment(value)) {
      return { scene: 'question', question: Number(value) };
    }

    if (prefix === 'r' && value !== undefined && value.length > 0) {
      return { scene: 'result', slug: value };
    }
  }

  return { scene: 'notFound', path: normalizedPath };
}

/** Translate machine state into its canonical pathname. */
export function buildRoutePath(route: AppRoute): string {
  switch (route.scene) {
    case 'landing':
      return '/';
    case 'intro':
      return '/intro';
    case 'question':
      assertQuestionNumber(route.question);
      return `/q/${route.question}`;
    case 'calculating':
      return '/baking';
    case 'result':
      if (route.slug.length === 0) {
        throw new RangeError('A result route requires a non-empty slug.');
      }
      return `/r/${encodeURIComponent(route.slug)}`;
    case 'story':
      return '/story';
    case 'gallery':
      return '/gallery';
    case 'end':
      return '/end';
    case 'notFound':
      return normalizePathname(route.path);
  }
}

export function createHistoryRouter(environment: RouterEnvironment = browserEnvironment()): HistoryRouter {
  const listeners = new Set<RouteListener>();
  let started = false;

  const current = (): AppRoute => parseRoute(environment.location.pathname);

  const publish = (route: AppRoute): void => {
    if (!started) {
      return;
    }

    for (const listener of listeners) {
      listener(route);
    }
  };

  const onPopState = (): void => {
    publish(current());
  };

  return {
    current,

    start(): AppRoute {
      const route = current();

      if (!started) {
        started = true;
        environment.window.addEventListener('popstate', onPopState);
        publish(route);
      }

      return route;
    },

    stop(): void {
      if (!started) {
        return;
      }

      environment.window.removeEventListener('popstate', onPopState);
      started = false;
    },

    subscribe(listener: RouteListener): () => void {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },

    navigate(route: AppRoute): void {
      environment.history.pushState(null, '', buildRoutePath(route));
      publish(route);
    },

    replace(route: AppRoute): void {
      environment.history.replaceState(null, '', buildRoutePath(route));
      publish(route);
    },
  };
}

function decodeSegments(pathname: string): string[] | null {
  if (pathname === '/') {
    return [];
  }

  const decoded: string[] = [];

  for (const segment of pathname.slice(1).split('/')) {
    try {
      decoded.push(decodeURIComponent(segment));
    } catch {
      return null;
    }
  }

  return decoded;
}

function isQuestionSegment(segment: string): boolean {
  return /^(?:[1-9]|1[0-2])$/.test(segment);
}

function assertQuestionNumber(question: number): void {
  if (!Number.isInteger(question) || question < FIRST_QUESTION || question > LAST_QUESTION) {
    throw new RangeError(`Question must be an integer from ${FIRST_QUESTION} to ${LAST_QUESTION}.`);
  }
}

function browserEnvironment(): RouterEnvironment {
  if (typeof window === 'undefined') {
    throw new Error('A RouterEnvironment is required outside a browser.');
  }

  return {
    window: {
      addEventListener: (_type, listener) => window.addEventListener('popstate', listener),
      removeEventListener: (_type, listener) => window.removeEventListener('popstate', listener),
    },
    history: {
      pushState: (data, unused, url) => window.history.pushState(data, unused, url),
      replaceState: (data, unused, url) => window.history.replaceState(data, unused, url),
    },
    location: window.location,
  };
}
