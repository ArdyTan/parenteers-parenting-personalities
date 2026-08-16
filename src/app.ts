import { audioEngine, playSfx, resetAudioEngine, type MusicTrack } from './core/audio';
import { readDeviceSignals, shouldShowDesktopGate } from './core/device';
import { BRAND_ASSETS } from './core/brand';
import { createTranslator, type InterpolationValues } from './core/i18n';
import type { AppRoute, SceneName } from './core/navigation';
import { createQrSvg, deriveMobileQuizUrl } from './core/qr';
import { createHistoryRouter, parseRoute, type HistoryRouter } from './core/router';
import { createAppStore, type AppStore } from './core/store';
import type { Language, PersonalityType } from './core/quiz-types';
import { appData } from './data';
import { runExperiencePreloader } from './motion/preloader';
import { createCalculatingScene } from './scenes/calculating';
import { createGalleryScene } from './scenes/gallery';
import { createGateScene } from './scenes/gate';
import { createIntroScene } from './scenes/intro';
import { createLandingScene } from './scenes/landing';
import { SceneManager } from './scenes/manager';
import { createNotFoundScene } from './scenes/not-found';
import { createQuestionScene } from './scenes/question';
import { createResultScene } from './scenes/result';
import type { Scene, SceneContext } from './scenes/scene';
import { createStoryScene } from './scenes/story';

/**
 * Which bed belongs to which scene. Anything absent fades music out — Story
 * above all, since that is the clean-capture surface where a screen recording
 * must not pick up our music.
 */
const SCENE_MUSIC: Readonly<Partial<Record<SceneName, MusicTrack>>> = Object.freeze({
  landing: 'theme',
  intro: 'theme',
  question: 'theme',
  calculating: 'theme',
  result: 'result',
});

export class ParentingBakesApp {
  readonly #store: AppStore;
  readonly #router: HistoryRouter;
  readonly #root: HTMLElement;
  #manager: SceneManager | null = null;
  #header: HTMLElement | null = null;
  #rotateLock: HTMLElement | null = null;
  #surfaceController: AbortController | null = null;
  #unsubscribeRoute: (() => void) | null = null;
  #unsubscribeStore: (() => void) | null = null;
  #currentRoute: AppRoute = { scene: 'landing' };
  #routerStarted = false;
  #gateVisible = false;
  #renderRevision = 0;
  #hasPreloaded = false;

  constructor(root: HTMLElement) {
    this.#root = root;
    this.#store = createAppStore();
    this.#router = createHistoryRouter();
  }

  async start(): Promise<void> {
    // Restore the persisted preference without unlocking: no gesture has
    // happened yet, so the context stays suspended until one does.
    audioEngine().setEnabled(this.#store.get().sound);

    this.#unsubscribeStore = this.#store.subscribe((state, previous) => {
      if (state.sound !== previous.sound) {
        this.#applySound(state.sound);
      }
      if (state.lang !== previous.lang) {
        this.#syncDocumentCopy();
        this.#renderChrome();
        void this.#renderCurrentExperience();
      }
    });

    if (shouldShowDesktopGate(readDeviceSignals())) {
      document.documentElement.dataset.presentation = 'gate';
      this.#gateVisible = true;
      this.#mountRuntime(this.#root);
      await this.#renderGate();
      return;
    }

    document.documentElement.dataset.presentation = 'edge';
    this.#mountRuntime(this.#root);
    await this.#launchExperience();
  }

  destroy(): void {
    this.#renderRevision += 1;
    this.#surfaceController?.abort();
    this.#surfaceController = null;
    this.#manager?.destroy();
    this.#manager = null;
    this.#unsubscribeRoute?.();
    this.#unsubscribeRoute = null;
    this.#unsubscribeStore?.();
    this.#unsubscribeStore = null;
    resetAudioEngine();
    this.#router.stop();
    this.#routerStarted = false;
    this.#root.replaceChildren();
  }

  #mountRuntime(container: HTMLElement): void {
    this.#surfaceController?.abort();
    this.#surfaceController = new AbortController();

    const runtime = document.createElement('div');
    runtime.className = 'app-runtime mobile-app';

    const header = document.createElement('header');
    header.className = 'app-header';

    const sceneHost = document.createElement('main');
    sceneHost.className = 'scene-host';
    sceneHost.id = 'scene-host';

    const rotateLock = document.createElement('aside');
    rotateLock.className = 'rotate-lock';
    rotateLock.setAttribute('aria-hidden', 'true');

    runtime.append(header, sceneHost, rotateLock);
    container.replaceChildren(runtime);

    this.#header = header;
    this.#rotateLock = rotateLock;
    this.#manager = new SceneManager(sceneHost);
    this.#syncDocumentCopy();
    this.#renderChrome();
    this.#bindAudioLifecycle(runtime);
  }

  /**
   * Autoplay-with-sound is refused on every mobile surface this app targets, so
   * the context can only start inside a real gesture. The first pointer or
   * keyboard interaction anywhere is that gesture. An explicit stored "off"
   * still makes the engine no-op.
   */
  #bindAudioLifecycle(runtime: HTMLElement): void {
    const signal = this.#surfaceController?.signal;
    if (!signal) return;

    const unlockFromFirstInteraction = (event: Event): void => {
      runtime.removeEventListener('pointerdown', unlockFromFirstInteraction);
      document.removeEventListener('keydown', unlockFromFirstInteraction);
      const engine = audioEngine();
      engine.unlock();
      // If the first gesture is the sound toggle itself, its ensuing click owns
      // the decision. This prevents a tiny music blip when a fresh visitor's
      // first action is explicitly turning the default-on preference off.
      if (event.target instanceof Element && event.target.closest('.sound-toggle')) return;
      this.#syncMusic(this.#store.get().scene);
    };
    runtime.addEventListener('pointerdown', unlockFromFirstInteraction, { signal });
    document.addEventListener('keydown', unlockFromFirstInteraction, { signal });

    // In-app browsers suspend the context on share sheets and tab switches;
    // without this the bed comes back silent after the user returns.
    document.addEventListener(
      'visibilitychange',
      () => {
        const engine = audioEngine();
        if (document.visibilityState === 'hidden') engine.pauseForHidden();
        else engine.resumeFromHidden();
      },
      { signal },
    );
  }

  #applySound(enabled: boolean): void {
    const engine = audioEngine();
    engine.setEnabled(enabled);
    if (enabled) {
      // This runs inside the toggle's click, so it is a valid unlock point.
      engine.unlock();
      playSfx('press');
      this.#syncMusic(this.#store.get().scene);
    }
    this.#renderChrome();
  }

  /**
   * The theme runs under the quiz and hands over to the result bed at the
   * reveal — a crossfade, not a cut. Everything past that is silent again.
   */
  #syncMusic(scene: SceneName): void {
    const engine = audioEngine();
    const track = this.#store.get().sound ? SCENE_MUSIC[scene] : undefined;
    if (track) engine.startMusic(track);
    else engine.stopMusic();
  }

  #renderChrome(): void {
    const header = this.#header;
    const rotateLock = this.#rotateLock;
    const signal = this.#surfaceController?.signal;
    if (!header || !rotateLock || !signal) return;

    const state = this.#store.get();
    const t = this.#translator();

    const brand = document.createElement('button');
    brand.className = 'app-header__brand';
    brand.type = 'button';
    brand.setAttribute('aria-label', t('nav.home'));
    brand.disabled = !this.#routerStarted;

    const brandLogo = document.createElement('img');
    brandLogo.className = 'app-header__brand-logo';
    brandLogo.src = BRAND_ASSETS.wordmarkBlue;
    brandLogo.alt = '';
    brandLogo.width = 572;
    brandLogo.height = 86;
    brand.append(brandLogo);
    brand.addEventListener(
      'click',
      () => this.#navigate('/', { replace: false }),
      { signal },
    );

    const languageSwitch = document.createElement('div');
    languageSwitch.className = 'language-switch';
    languageSwitch.dataset.lang = state.lang;
    languageSwitch.setAttribute('role', 'group');
    languageSwitch.setAttribute('aria-label', t('nav.lang_toggle_label'));
    const languageThumb = document.createElement('span');
    languageThumb.className = 'language-switch__thumb';
    languageThumb.setAttribute('aria-hidden', 'true');
    languageSwitch.append(
      languageThumb,
      this.#languageButton('id', state.lang, t, signal),
      this.#languageButton('en', state.lang, t, signal),
    );
    this.#bindLanguageSwitch(languageSwitch, state.lang, signal);

    const language = document.createElement('div');
    language.className = 'app-header__language';
    language.append(languageSwitch);

    // The sound toggle sits outside `.app-header__language` on purpose: that
    // container is hidden on Quiz Opening and Q1-Q12, which is precisely where
    // the theme plays. WCAG 1.4.2 needs the control reachable while audio runs.
    const controls = document.createElement('div');
    controls.className = 'app-header__controls';
    controls.append(this.#soundToggle(state.sound, t, signal), language);
    header.replaceChildren(brand, controls);

    const rotateContent = document.createElement('div');
    rotateContent.className = 'rotate-lock__content';
    const rotateTitle = document.createElement('h2');
    rotateTitle.textContent = t('landing.h1');
    const rotateBody = document.createElement('p');
    rotateBody.textContent = t('landing.subtitle');
    rotateContent.append(rotateTitle, rotateBody);
    rotateLock.replaceChildren(rotateContent);
  }

  /**
   * WCAG 1.4.2 requires a control for anything that plays longer than three
   * seconds, so this button is not optional decoration — it is what lets the
   * theme exist at all.
   */
  #soundToggle(
    enabled: boolean,
    t: (key: string, values?: InterpolationValues) => string,
    signal: AbortSignal,
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'sound-toggle';
    button.type = 'button';
    button.dataset.state = enabled ? 'on' : 'off';
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', t(enabled ? 'a11y.sound_off' : 'a11y.sound_on'));
    button.title = t('nav.sound_label');

    // Mirrors `.language-switch`: an outline pill wrapping a 28x32 capsule that
    // fills brand blue when active. The icon is a mask so it can invert against
    // that fill the way the ID/EN labels do.
    const capsule = document.createElement('span');
    capsule.className = 'sound-toggle__capsule';
    capsule.setAttribute('aria-hidden', 'true');

    const icon = document.createElement('span');
    icon.className = 'sound-toggle__icon';
    capsule.append(icon);
    button.append(capsule);

    button.addEventListener(
      'click',
      () => this.#store.setSound(!this.#store.get().sound),
      { signal },
    );
    return button;
  }

  #languageButton(
    language: Language,
    currentLanguage: Language,
    t: (key: string, values?: InterpolationValues) => string,
    signal: AbortSignal,
  ): HTMLButtonElement {
    const labelKey = language === 'id' ? 'nav.lang_id' : 'nav.lang_en';
    const label = t(labelKey);
    const button = document.createElement('button');
    button.className = 'language-switch__button';
    button.type = 'button';
    button.textContent = label;
    button.setAttribute('aria-pressed', String(language === currentLanguage));
    button.setAttribute('aria-label', t('a11y.lang_switch', { lang: label }));
    button.addEventListener('click', () => this.#store.setLanguage(language), { signal });
    return button;
  }

  #startRouter(): void {
    if (this.#routerStarted) return;

    this.#routerStarted = true;
    this.#gateVisible = false;
    this.#renderChrome();
    this.#unsubscribeRoute = this.#router.subscribe((route) => {
      this.#currentRoute = route;
      void this.#renderRoute(route);
    });
    this.#router.start();
  }

  async #renderCurrentExperience(): Promise<void> {
    if (this.#gateVisible) {
      await this.#renderGate();
      return;
    }

    await this.#renderRoute(this.#currentRoute);
  }

  async #renderGate(): Promise<void> {
    const manager = this.#manager;
    if (!manager) return;

    const revision = ++this.#renderRevision;
    const t = this.#translator();
    const quizUrl = deriveMobileQuizUrl(window.location);
    const qrSvg = await createQrSvg(quizUrl, { label: t('landing.h1') });
    if (revision !== this.#renderRevision || !this.#gateVisible) return;

    this.#store.set({ scene: 'gate' });
    await manager.show(
      createGateScene(qrSvg, quizUrl, () => this.#continueInFrame()),
      this.#sceneContext(),
    );
    this.#focusScene();
  }

  #continueInFrame(): void {
    this.#gateVisible = false;
    this.#manager?.destroy();

    const stage = document.createElement('div');
    stage.className = 'phone-frame-stage';
    const frame = document.createElement('div');
    frame.className = 'phone-frame';
    const screen = document.createElement('div');
    screen.className = 'phone-frame__screen';
    frame.append(screen);
    stage.append(frame);
    this.#root.replaceChildren(stage);

    document.documentElement.dataset.presentation = 'framed';
    this.#mountRuntime(screen);
    void this.#launchExperience();
  }

  async #launchExperience(): Promise<void> {
    if (!this.#hasPreloaded) {
      const runtime = this.#root.querySelector<HTMLElement>('.app-runtime')
        ?? document.querySelector<HTMLElement>('.app-runtime');
      if (runtime) {
        await runExperiencePreloader(
          runtime,
          this.#translator()('a11y.loading'),
          appData.sceneArt.continuity.preloader,
        );
      }
      this.#hasPreloaded = true;
    }
    this.#startRouter();
  }

  #bindLanguageSwitch(
    control: HTMLElement,
    currentLanguage: Language,
    signal: AbortSignal,
  ): void {
    let startX = 0;
    let dragging = false;
    const thumb = control.querySelector<HTMLElement>('.language-switch__thumb');
    if (!thumb) return;

    control.addEventListener(
      'pointerdown',
      (event) => {
        if (!event.isPrimary) return;
        dragging = true;
        startX = event.clientX;
        control.setPointerCapture(event.pointerId);
      },
      { signal },
    );
    control.addEventListener(
      'pointermove',
      (event) => {
        if (!dragging || !event.isPrimary) return;
        const direction = currentLanguage === 'id' ? 1 : -1;
        const offset = Math.max(0, Math.min(1, ((event.clientX - startX) * direction) / 38));
        thumb.style.setProperty('--language-drag', `${offset * direction * 38}px`);
      },
      { signal },
    );
    const settle = (event: PointerEvent): void => {
      if (!dragging) return;
      dragging = false;
      const distance = event.clientX - startX;
      thumb.style.removeProperty('--language-drag');
      if (Math.abs(distance) < 18) return;
      playSfx('swipe');
      this.#store.setLanguage(distance > 0 ? 'en' : 'id');
    };
    control.addEventListener('pointerup', settle, { signal });
    control.addEventListener('pointercancel', settle, { signal });
  }

  async #renderRoute(route: AppRoute): Promise<void> {
    const manager = this.#manager;
    if (!manager) return;

    const guarded = this.#guardRoute(route);
    if (guarded !== route) {
      this.#router.replace(guarded);
      return;
    }

    const scene = this.#sceneForRoute(route);
    this.#store.set({ scene: scene.name });
    this.#syncMusic(scene.name);
    this.#syncDocumentCopy(route);
    await manager.show(scene, this.#sceneContext());
    this.#focusScene();
  }

  #guardRoute(route: AppRoute): AppRoute {
    const answeredQuestions = new Set(this.#store.get().answers.map(({ q }) => q));

    if (route.scene === 'question') {
      const missingEarlier = appData.questions.find(
        ({ id }) => id < route.question && !answeredQuestions.has(id),
      );
      return missingEarlier ? { scene: 'question', question: missingEarlier.id } : route;
    }

    if (route.scene === 'calculating' && answeredQuestions.size !== appData.questions.length) {
      const firstMissing = appData.questions.find(({ id }) => !answeredQuestions.has(id));
      return { scene: 'question', question: firstMissing?.id ?? 1 };
    }

    if (route.scene === 'story' && this.#store.get().result === undefined) {
      return { scene: 'landing' };
    }

    return route;
  }

  #sceneForRoute(route: AppRoute): Scene {
    switch (route.scene) {
      case 'landing':
        return createLandingScene();
      case 'intro':
        return createIntroScene();
      case 'question': {
        const question = appData.questions.find(({ id }) => id === route.question);
        return question ? createQuestionScene(question) : createNotFoundScene();
      }
      case 'calculating':
        return createCalculatingScene();
      case 'result': {
        const personality = this.#findPersonality(route.slug);
        if (!personality) return createNotFoundScene();
        this.#store.setResult(personality.code);
        this.#store.clearAnswers();
        return createResultScene(personality);
      }
      case 'story':
        return createStoryScene();
      case 'gallery':
        return createGalleryScene();
      case 'notFound':
        return createNotFoundScene();
    }
  }

  #findPersonality(slug: string): PersonalityType | undefined {
    return appData.types.find((personality) => personality.slug === slug.toLowerCase());
  }



  #sceneContext(): SceneContext {
    return {
      store: this.#store,
      data: appData,
      t: this.#translator(),
      navigate: (path, options) => this.#navigate(path, options),
      copyLink,
    };
  }

  #navigate(path: string, options: Readonly<{ replace?: boolean }> = {}): void {
    if (!this.#routerStarted) return;
    const route = parseRoute(path);
    if (options.replace) this.#router.replace(route);
    else this.#router.navigate(route);
  }

  #translator(): (key: string, values?: InterpolationValues) => string {
    return createTranslator(appData.translations, this.#store.get().lang);
  }

  #syncDocumentCopy(route: AppRoute = this.#currentRoute): void {
    const state = this.#store.get();
    const t = this.#translator();
    document.documentElement.lang = state.lang;

    if (route.scene === 'result') {
      const personality = this.#findPersonality(route.slug);
      document.title = personality
        ? `${personality.name[state.lang]} — ${t('meta.title')}`
        : t('meta.title');
    } else {
      document.title = t('meta.title');
    }

    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = t('meta.description');
  }

  #focusScene(): void {
    const focusTarget = this.#manager?.current?.el.querySelector<HTMLElement>(
      'h1[tabindex="-1"], [tabindex="-1"], h1',
    );
    focusTarget?.focus({ preventScroll: true });
  }
}

export async function bootParentingBakes(root: HTMLElement): Promise<ParentingBakesApp> {
  const app = new ParentingBakesApp(root);
  await app.start();
  return app;
}

async function copyLink(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    // Clipboard access is frequently unavailable inside in-app browsers.
  }

  const textarea = document.createElement('textarea');
  textarea.className = 'visually-hidden';
  textarea.value = url;
  textarea.readOnly = true;
  document.body.append(textarea);
  textarea.select();

  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}
