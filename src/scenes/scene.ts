import type { InterpolationValues } from '../core/i18n';
import type { SceneName } from '../core/navigation';
import type { AppStore } from '../core/store';
import type { ValidatedAppData } from '../data/validation';

export type NavigateOptions = Readonly<{ replace?: boolean }>;

export type SceneContext = Readonly<{
  store: AppStore;
  data: ValidatedAppData;
  t: (key: string, values?: InterpolationValues) => string;
  navigate: (path: string, options?: NavigateOptions) => void;
  presentInterstitial: (afterQuestion: 6 | 9, nextPath: string) => void;
  copyLink: (url: string) => Promise<boolean>;
}>;

export interface Scene {
  readonly name: SceneName;
  readonly el: HTMLElement;
  mount(context: SceneContext): void;
  enter(from: SceneName | null): Promise<void>;
  exit(to: SceneName): Promise<void>;
  unmount(): void;
  resize?(width: number, height: number): void;
  tick?(time: number, deltaTime: number): void;
}

export type SceneMotionHooks = Readonly<{
  enter?: (from: SceneName | null) => void | Promise<void>;
  exit?: (to: SceneName) => void | Promise<void>;
  destroy?: () => void;
}>;

export type SceneRenderer = (
  root: HTMLElement,
  context: SceneContext,
  signal: AbortSignal,
) => void | SceneMotionHooks;

export class FunctionalScene implements Scene {
  readonly el: HTMLElement;
  #controller: AbortController | null = null;
  #motion: SceneMotionHooks | null = null;

  constructor(
    readonly name: SceneName,
    private readonly render: SceneRenderer,
  ) {
    this.el = document.createElement('section');
    this.el.className = `scene scene--${name}`;
    this.el.dataset.scene = name;
  }

  mount(context: SceneContext): void {
    this.#controller?.abort();
    this.#controller = new AbortController();
    this.el.replaceChildren();
    this.#motion = this.render(this.el, context, this.#controller.signal) ?? null;
  }

  async enter(from: SceneName | null): Promise<void> {
    await this.#motion?.enter?.(from);
  }

  async exit(to: SceneName): Promise<void> {
    await this.#motion?.exit?.(to);
  }

  unmount(): void {
    this.#motion?.destroy?.();
    this.#motion = null;
    this.#controller?.abort();
    this.#controller = null;
    this.el.remove();
  }
}
