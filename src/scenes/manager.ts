import type { Scene, SceneContext } from './scene';

export class SceneManager {
  #current: Scene | null = null;
  #revision = 0;

  constructor(private readonly host: HTMLElement) {}

  get current(): Scene | null {
    return this.#current;
  }

  async show(next: Scene, context: SceneContext): Promise<void> {
    const revision = ++this.#revision;
    const previous = this.#current;

    if (previous) await previous.exit(next.name);
    if (revision !== this.#revision) return;

    previous?.unmount();
    this.host.replaceChildren(next.el);
    this.#current = next;
    next.mount(context);
    await next.enter(previous?.name ?? null);
  }

  destroy(): void {
    this.#revision += 1;
    this.#current?.unmount();
    this.#current = null;
    this.host.replaceChildren();
  }
}
