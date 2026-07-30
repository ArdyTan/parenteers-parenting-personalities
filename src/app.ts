import { readDeviceSignals, shouldShowDesktopGate } from './core/device';
import { BRAND_ASSETS } from './core/brand';
import { triggerHaptic } from './core/haptics';
import { createTranslator, type InterpolationValues } from './core/i18n';
import type { AppRoute } from './core/navigation';
import { createQrSvg, deriveMobileQuizUrl } from './core/qr';
import { createHistoryRouter, parseRoute, type HistoryRouter } from './core/router';
import { createAppStore, type AppStore } from './core/store';
import type { Language, PersonalityType } from './core/quiz-types';
import { appData } from './data';
import { createFpsProbe, type FpsProbe } from './gl/tiers';
import { createGsapFrameScheduler, createWorld, type World } from './gl/world';
import { runExperiencePreloader } from './motion/preloader';
import { createCalculatingScene } from './scenes/calculating';
import { createEndScene } from './scenes/end';
import { createGalleryScene } from './scenes/gallery';
import { createGateScene } from './scenes/gate';
import { createInterstitialScene } from './scenes/interstitial';
import { createIntroScene } from './scenes/intro';
import { createLandingScene } from './scenes/landing';
import { SceneManager } from './scenes/manager';
import { createNotFoundScene } from './scenes/not-found';
import { createQuestionScene } from './scenes/question';
import { createResultScene } from './scenes/result';
import type { Scene, SceneContext } from './scenes/scene';
import { createStoryScene } from './scenes/story';

type InterstitialIntent = Readonly<{
  afterQuestion: 6 | 9;
  nextPath: string;
}>;

export class ParentingBakesApp {
  readonly #store: AppStore;
  readonly #router: HistoryRouter;
  readonly #root: HTMLElement;
  #manager: SceneManager | null = null;
  #header: HTMLElement | null = null;
  #rotateLock: HTMLElement | null = null;
  #surfaceController: AbortController | null = null;
  #world: World | null = null;
  #fpsProbe: FpsProbe | null = null;
  #qualityProbeComplete = false;
  #unsubscribeRoute: (() => void) | null = null;
  #unsubscribeStore: (() => void) | null = null;
  #currentRoute: AppRoute = { scene: 'landing' };
  #interstitial: InterstitialIntent | null = null;
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
    this.#unsubscribeStore = this.#store.subscribe((state, previous) => {
      if (state.lang !== previous.lang) {
        this.#syncDocumentCopy();
        this.#renderChrome();
        void this.#renderCurrentExperience();
      }
      if (state.tier !== previous.tier) {
        this.#world?.setTier(state.tier);
        document.documentElement.dataset.qualityTier = state.tier;
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
    this.#teardownWorld();
    this.#manager?.destroy();
    this.#manager = null;
    this.#unsubscribeRoute?.();
    this.#unsubscribeRoute = null;
    this.#unsubscribeStore?.();
    this.#unsubscribeStore = null;
    this.#router.stop();
    this.#routerStarted = false;
    this.#root.replaceChildren();
  }

  #mountRuntime(container: HTMLElement): void {
    this.#surfaceController?.abort();
    this.#teardownWorld();
    this.#surfaceController = new AbortController();

    const runtime = document.createElement('div');
    runtime.className = 'app-runtime mobile-app';

    const worldCanvas = document.createElement('canvas');

    const header = document.createElement('header');
    header.className = 'app-header';

    const sceneHost = document.createElement('main');
    sceneHost.className = 'scene-host';
    sceneHost.id = 'scene-host';

    const rotateLock = document.createElement('aside');
    rotateLock.className = 'rotate-lock';
    rotateLock.setAttribute('aria-hidden', 'true');

    runtime.append(worldCanvas, header, sceneHost, rotateLock);
    container.replaceChildren(runtime);

    this.#header = header;
    this.#rotateLock = rotateLock;
    this.#manager = new SceneManager(sceneHost);
    this.#mountWorld(worldCanvas, runtime);
    this.#syncDocumentCopy();
    this.#renderChrome();
  }

  #mountWorld(canvas: HTMLCanvasElement, runtime: HTMLElement): void {
    const signal = this.#surfaceController?.signal;
    if (!signal) return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const framedViewport = runtime.closest<HTMLElement>('.phone-frame__screen');

    try {
      const world = createWorld(canvas, {
        reducedMotion: motionQuery.matches,
        tier: this.#store.get().tier,
        ...(framedViewport ? { viewport: framedViewport } : {}),
      });
      this.#world = world;
      runtime.dataset.webgl = 'ready';

      const moveWorldPointer = (event: PointerEvent): void => {
        if (!event.isPrimary) return;
        const point = normalizedPointer(runtime, event);
        if (!point) return;
        const strength = event.pressure > 0 ? event.pressure : 0.7;
        world.pointer(point.x, point.y, strength);
      };

      runtime.addEventListener('pointerdown', moveWorldPointer, { passive: true, signal });
      runtime.addEventListener('pointermove', moveWorldPointer, { passive: true, signal });
      runtime.addEventListener(
        'pointerup',
        (event) => {
          if (!event.isPrimary || !(event.target instanceof Element)) return;
          if (!event.target.closest('.answer-card')) return;
          const point = normalizedPointer(runtime, event);
          if (!point) return;
          world.burst(point.x, point.y, 18);
          triggerHaptic('tick');
        },
        { passive: true, signal },
      );
      motionQuery.addEventListener(
        'change',
        (event) => world.setReducedMotion(event.matches),
        { signal },
      );

      if (!this.#qualityProbeComplete) this.#startQualityProbe();
    } catch (error) {
      runtime.dataset.webgl = 'fallback';
      console.warn('[world] WebGL atmosphere unavailable; using the CSS fallback.', error);
    }
  }

  #startQualityProbe(): void {
    this.#fpsProbe?.cancel();
    const probe = createFpsProbe({ scheduler: createGsapFrameScheduler() });
    this.#fpsProbe = probe;

    void probe.result.then((result) => {
      if (this.#fpsProbe !== probe) return;
      this.#fpsProbe = null;
      if (result.cancelled) return;
      this.#qualityProbeComplete = true;
      this.#store.set({ tier: result.tier });
    });
  }

  #teardownWorld(): void {
    this.#fpsProbe?.cancel();
    this.#fpsProbe = null;
    this.#world?.destroy();
    this.#world = null;
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
    header.replaceChildren(brand, language);

    const rotateContent = document.createElement('div');
    rotateContent.className = 'rotate-lock__content';
    const rotateTitle = document.createElement('h2');
    rotateTitle.textContent = t('landing.h1');
    const rotateBody = document.createElement('p');
    rotateBody.textContent = t('landing.subtitle');
    rotateContent.append(rotateTitle, rotateBody);
    rotateLock.replaceChildren(rotateContent);
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
      this.#interstitial = null;
      void this.#renderRoute(route);
    });
    this.#router.start();
  }

  async #renderCurrentExperience(): Promise<void> {
    if (this.#gateVisible) {
      await this.#renderGate();
      return;
    }

    if (this.#interstitial) {
      await this.#showInterstitial(this.#interstitial);
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
    this.#syncWorld({ scene: 'landing' });
    await manager.show(
      createGateScene(qrSvg, () => this.#continueInFrame()),
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
    this.#syncWorld(route);
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
      case 'end':
        return createEndScene();
      case 'notFound':
        return createNotFoundScene();
    }
  }

  #findPersonality(slug: string): PersonalityType | undefined {
    return appData.types.find((personality) => personality.slug === slug.toLowerCase());
  }

  #syncWorld(route: AppRoute): void {
    const world = this.#world;
    if (!world) return;

    let heat = 0;
    let personality: PersonalityType | undefined;

    switch (route.scene) {
      case 'question':
        heat = route.question / appData.questions.length;
        break;
      case 'calculating':
      case 'result':
      case 'story':
      case 'gallery':
      case 'end':
        heat = 1;
        break;
      case 'notFound':
        heat = 0.35;
        break;
      case 'landing':
      case 'intro':
        heat = 0;
        break;
    }

    if (route.scene === 'result') personality = this.#findPersonality(route.slug);
    if (route.scene === 'story' || route.scene === 'gallery' || route.scene === 'end') {
      const result = this.#store.get().result;
      personality = appData.types.find((type) => type.code === result);
    }

    world.setHeat(heat);
    const defaultAccent = getComputedStyle(document.documentElement)
      .getPropertyValue('--brand-orange')
      .trim();
    if (personality) world.setAccent(personality.accent);
    else if (defaultAccent) world.setAccent(defaultAccent);
  }

  async #showInterstitial(intent: InterstitialIntent): Promise<void> {
    const manager = this.#manager;
    if (!manager) return;

    this.#interstitial = intent;
    this.#store.set({ scene: 'interstitial' });
    this.#world?.setHeat(intent.afterQuestion / appData.questions.length);
    await manager.show(
      createInterstitialScene(intent.afterQuestion, intent.nextPath),
      this.#sceneContext(),
    );
    this.#focusScene();
  }

  #sceneContext(): SceneContext {
    return {
      store: this.#store,
      data: appData,
      t: this.#translator(),
      navigate: (path, options) => this.#navigate(path, options),
      presentInterstitial: (afterQuestion, nextPath) => {
        void this.#showInterstitial({ afterQuestion, nextPath });
      },
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
    document.documentElement.dataset.qualityTier = state.tier;

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

function normalizedPointer(
  element: HTMLElement,
  event: Readonly<Pick<PointerEvent, 'clientX' | 'clientY'>>,
): Readonly<{ x: number; y: number }> | null {
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;

  return {
    x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
    y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
  };
}
