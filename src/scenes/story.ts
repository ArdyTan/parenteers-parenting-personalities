import { gsap } from 'gsap';

import {
  buildResultShareUrl,
  composeResultStoryCard,
  createBrowserShareAdapter,
  deliverResultImage,
  deliverShareLink,
  displayShareHost,
  formatShareCaption,
  formatTypeCode,
  instagramHandle,
  type ImageDeliveryOutcome,
  type LinkDeliveryOutcome,
} from '../core/share';
import { playSfx } from '../core/audio';
import { triggerHaptic } from '../core/haptics';
import type { PersonalityType } from '../core/quiz-types';
import {
  createAsyncButtonController,
  type AsyncButtonController,
} from '../motion/button-state';
import {
  bindPressFeedback,
  createSceneMotion,
  prefersReducedMotion,
} from '../motion/shared';
import { createToastStack, type ToastStack } from '../motion/toast';
import { actionButton, element, externalLink, localizedList } from './dom';
import { FunctionalScene, type SceneContext } from './scene';

export function createStoryScene(): FunctionalScene {
  return new FunctionalScene('story', (root, context, signal) => {
    const { result } = context.store.get();
    const personality = context.data.types.find((type) => type.code === result);

    if (!personality) {
      root.append(element('p', { text: context.t('error.generic'), attributes: { role: 'alert' } }));
      return;
    }

    const runtime = root.closest<HTMLElement>('.app-runtime');
    if (runtime) runtime.dataset.storyMode = '';

    const shareUrl = buildResultShareUrl(
      `/r/${personality.slug}`,
      context.data.config,
      window.location.href,
    );
    const language = context.store.get().lang;
    const captionTemplate = context.data.translations[language]['share.caption_template'] ?? '';
    const caption = formatShareCaption(
      captionTemplate,
      personality,
      language,
      shareUrl,
    );
    const toaster = createToastStack(root, signal);

    root.dataset.typeCode = personality.code;
    root.style.setProperty('--type-accent', personality.accent);

    const allPanels = createPanels(personality, shareUrl, context);
    const panelCount = Math.min(allPanels.length, Math.max(1, context.data.config.story.panels));
    const panels = allPanels.slice(0, panelCount);
    let activeIndex = -1;

    const segments = element(
      'ol',
      { className: 'story__segments', attributes: { 'aria-hidden': 'true' } },
      panels.map(() =>
        element('li', { className: 'story__segment' }, [
          element('span', { className: 'story__segment-fill' }),
        ]),
      ),
    );

    const previousButton = actionButton(
      context.t('nav.back'),
      () => showPanel(activeIndex - 1),
      signal,
      { className: 'story__previous' },
    );
    const nextButton = actionButton(
      context.t('nav.next'),
      () => showPanel(activeIndex + 1),
      signal,
      { className: 'story__next button--primary' },
    );

    const viewport = element('div', {
      className: 'story__viewport',
      attributes: { 'aria-live': 'polite' },
    }, panels);
    const resultPath = `/r/${personality.slug}`;
    const chrome = element('div', { className: 'story__chrome' }, [
      segments,
      // One way out, now that the journey ends at the result: back to the card.
      element('div', { className: 'story__exit-controls' }, [
        actionButton(
          context.t('gallery.back_to_result'),
          () => context.navigate(resultPath),
          signal,
        ),
      ]),
    ]);
    const navigation = element('nav', {
      className: 'story__navigation',
      attributes: { 'aria-label': context.t('share.title') },
    }, [
      previousButton,
      nextButton,
    ]);
    const captureHint = element('p', {
      className: 'story__capture-hint',
      text: context.t('share.hold_hint'),
    });
    const shareActions = createShareActions(
      personality,
      shareUrl,
      caption,
      context,
      toaster,
      signal,
    );

    root.append(viewport, chrome, navigation, captureHint, shareActions);
    showPanel(0, false);
    bindPressFeedback(root.querySelectorAll('.button'), signal);
    bindStoryGestures(
      root,
      viewport,
      panels.length,
      () => activeIndex,
      (index) => showPanel(index, false),
      () => context.navigate(resultPath),
      signal,
    );

    function showPanel(index: number, moveFocus = true): void {
      if (index < 0 || index >= panels.length) {
        triggerHaptic('boundary');
        playSfx('boundary');
        return;
      }

      const previousIndex = activeIndex;
      activeIndex = index;
      panels.forEach((panel, panelIndex) => {
        const isActive = panelIndex === activeIndex;
        panel.hidden = !isActive;
        panel.setAttribute('aria-hidden', String(!isActive));
      });
      [...segments.children].forEach((segment, segmentIndex) => {
        segment.toggleAttribute('data-complete', segmentIndex < activeIndex);
        if (segmentIndex === activeIndex) segment.setAttribute('aria-current', 'step');
        else segment.removeAttribute('aria-current');
      });

      previousButton.disabled = activeIndex === 0;
      nextButton.disabled = activeIndex === panels.length - 1;
      viewport.dataset.activePanel = String(activeIndex + 1);
      triggerHaptic('tick');
      // Panels advance by swipe or tap-third; either way the movement is what
      // the cue describes, so it is the swipe voice rather than a selection.
      playSfx('swipe');

      const activePanel = panels[activeIndex];
      if (activePanel && previousIndex >= 0 && !prefersReducedMotion()) {
        gsap.fromTo(
          activePanel,
          { autoAlpha: 0, xPercent: activeIndex >= previousIndex ? 10 : -10 },
          {
            autoAlpha: 1,
            xPercent: 0,
            duration: 0.42,
            ease: 'power3.out',
            clearProps: 'opacity,visibility,transform',
          },
        );
      }
      if (moveFocus) activePanel?.focus();
    }

    return createSceneMotion(root, {
      enterTargets: [viewport, chrome, navigation, captureHint, shareActions],
      onDestroy() {
        if (runtime) delete runtime.dataset.storyMode;
      },
    });
  });
}

function createShareActions(
  personality: PersonalityType,
  shareUrl: string,
  caption: string,
  context: SceneContext,
  toaster: ToastStack,
  signal: AbortSignal,
): HTMLElement {
  const shareData = {
    title: context.t('share.title'),
    text: caption,
    url: shareUrl,
  };
  const adapter = createBrowserShareAdapter(context.copyLink);

  let saveController: AsyncButtonController;
  const saveButton = actionButton(
    context.t('result.save_image'),
    () => {
      void saveController.run(
        async () => {
          const blob = await composeResultStoryCard({
            personality,
            language: context.store.get().lang,
            shareUrl,
            instagramUrl: context.data.config.links.instagram,
            labels: {
              intro: context.t('result.intro_label'),
              superpowers: context.t('result.superpowers_label'),
              watchout: context.t('result.watchout_label'),
              disclaimer: context.t('footer.disclaimer'),
            },
          });
          return deliverResultImage(
            blob,
            `parenting-bake-${personality.slug}.png`,
            shareData,
            adapter,
          );
        },
        (outcome) => imageOutcomeState(outcome),
      ).then((outcome) => {
        if (outcome) announceImageOutcome(outcome, context, toaster);
      }).catch(() => toaster.show(context.t('error.save_failed'), 'error'));
    },
    signal,
    { className: 'story__save button--primary' },
  );
  saveController = createAsyncButtonController(saveButton, signal);

  let shareController: AsyncButtonController;
  const nativeShareButton = actionButton(
    context.t('share.other'),
    () => {
      void shareController.run(
        () => deliverShareLink(shareData, adapter),
        (outcome) => linkOutcomeState(outcome),
      ).then((outcome) => {
        if (!outcome || outcome === 'cancelled') return;
        if (outcome === 'failed') toaster.show(context.t('error.generic'), 'error');
        else {
          toaster.show(
            context.t(outcome === 'copied' ? 'result.copied' : 'share.link_shared'),
            'success',
          );
        }
      }).catch(() => toaster.show(context.t('error.generic'), 'error'));
    },
    signal,
    { className: 'story__share-link' },
  );
  shareController = createAsyncButtonController(nativeShareButton, signal);

  let copyController: AsyncButtonController;
  const copyButton = actionButton(
    context.t('result.copy_link'),
    () => {
      void copyController.run(
        () => context.copyLink(shareUrl),
        (copied) => copied ? 'success' : 'error',
      ).then((copied) => {
        if (copied === undefined) return;
        toaster.show(
          context.t(copied ? 'result.copied' : 'error.generic'),
          copied ? 'success' : 'error',
        );
      }).catch(() => toaster.show(context.t('error.generic'), 'error'));
    },
    signal,
    { className: 'story__copy-link' },
  );
  copyController = createAsyncButtonController(copyButton, signal);

  const whatsapp = externalLink(
    context.t('share.whatsapp'),
    `https://wa.me/?text=${encodeURIComponent(caption)}`,
    'story__whatsapp',
  );

  return element('aside', { className: 'story__share-actions' }, [
    element('p', { className: 'story__share-title', text: context.t('share.title') }),
    element('div', { className: 'story__share-grid' }, [
      saveButton,
      nativeShareButton,
      copyButton,
      whatsapp,
    ]),
  ]);
}

function bindStoryGestures(
  root: HTMLElement,
  viewport: HTMLElement,
  panelCount: number,
  getActiveIndex: () => number,
  showPanel: (index: number) => void,
  dismiss: () => void,
  signal: AbortSignal,
): void {
  let pointer = -1;
  let startX = 0;
  let startY = 0;
  let downAt = 0;
  let draggingDown = false;
  let captureActive = false;
  let holdTimer = 0;

  const setCleanCapture = (active: boolean): void => {
    captureActive = active;
    root.toggleAttribute('data-clean-capture', active);
  };
  const clearHold = (): void => {
    window.clearTimeout(holdTimer);
    holdTimer = 0;
  };
  const resetTransform = (): void => {
    gsap.to(root, {
      y: 0,
      scale: 1,
      borderRadius: 0,
      duration: prefersReducedMotion() ? 0 : 0.36,
      ease: 'back.out(1.35)',
      clearProps: 'transform,border-radius',
    });
  };

  viewport.addEventListener(
    'pointerdown',
    (event) => {
      if (!event.isPrimary) return;
      pointer = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      downAt = performance.now();
      draggingDown = false;
      viewport.setPointerCapture(event.pointerId);
      holdTimer = window.setTimeout(() => setCleanCapture(true), 240);
    },
    { signal },
  );
  viewport.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerId !== pointer) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (!draggingDown && dy > 14 && Math.abs(dx) < 48) {
        draggingDown = true;
        clearHold();
        setCleanCapture(true);
      }
      if (Math.abs(dx) > 12 || dy < -8) clearHold();
      if (!draggingDown) return;

      const progress = Math.max(0, Math.min(1, dy / Math.max(1, viewport.clientHeight)));
      gsap.set(root, {
        y: Math.max(0, dy * 0.88),
        scale: 1 - progress * 0.1,
        borderRadius: progress * 42,
      });
    },
    { signal },
  );

  const release = (event: PointerEvent): void => {
    if (event.pointerId !== pointer) return;
    clearHold();
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    const heldFor = performance.now() - downAt;
    pointer = -1;

    if (draggingDown) {
      draggingDown = false;
      if (dy > viewport.clientHeight * 0.2) {
        triggerHaptic('boundary');
        playSfx('swipe');
        gsap.to(root, {
          y: viewport.clientHeight,
          scale: 0.88,
          autoAlpha: 0,
          duration: prefersReducedMotion() ? 0 : 0.34,
          ease: 'power3.in',
          onComplete: dismiss,
        });
        return;
      }
      setCleanCapture(false);
      resetTransform();
      return;
    }

    if (captureActive) {
      setCleanCapture(false);
      return;
    }

    if (heldFor < 240 && Math.abs(dx) < 18 && Math.abs(dy) < 18) {
      const rect = viewport.getBoundingClientRect();
      const relativeX = event.clientX - rect.left;
      showPanel(getActiveIndex() + (relativeX < rect.width / 3 ? -1 : 1));
    }
  };

  viewport.addEventListener('pointerup', release, { signal });
  viewport.addEventListener(
    'pointercancel',
    (event) => {
      if (event.pointerId !== pointer) return;
      clearHold();
      pointer = -1;
      draggingDown = false;
      setCleanCapture(false);
      resetTransform();
    },
    { signal },
  );

  signal.addEventListener(
    'abort',
    () => {
      clearHold();
      gsap.killTweensOf(root);
    },
    { once: true },
  );

  if (panelCount < 2) root.dataset.singlePanel = '';
}

function createPanels(
  personality: PersonalityType,
  shareUrl: string,
  context: SceneContext,
): HTMLElement[] {
  const language = context.store.get().lang;
  const name = personality.name[language];
  const illustrationAttributes = {
    src: personality.image,
    alt: context.t('a11y.type_illustration_alt', { type: name }),
    decoding: 'async',
  } as const;
  const footer = (): HTMLElement =>
    element('footer', { className: 'story__brand-footer' }, [
      element('strong', { text: instagramHandle(context.data.config.links.instagram) }),
      element('span', { text: displayShareHost(shareUrl) }),
    ]);

  const identity = element('article', {
    className: 'story__panel story__panel--identity',
    attributes: { tabindex: '-1', 'data-panel': 'identity' },
  }, [
    element('p', { className: 'story__eyebrow', text: context.t('result.intro_label') }),
    element('img', { className: 'story__illustration', attributes: illustrationAttributes }),
    element('h1', { className: 'story__name', text: name }),
    element('p', { className: 'story__code', text: formatTypeCode(personality.code) }),
    element('p', { className: 'story__tagline', text: personality.tagline[language] }),
    element('p', { className: 'story__disclaimer', text: context.t('footer.disclaimer') }),
    footer(),
  ]);

  const powers = element('article', {
    className: 'story__panel story__panel--powers',
    attributes: { tabindex: '-1', 'data-panel': 'powers' },
  }, [
    element('img', { className: 'story__illustration', attributes: illustrationAttributes }),
    element('h2', { text: context.t('result.superpowers_label') }),
    localizedList(personality.superpowers[language], 'story__power-list'),
    element('p', { className: 'story__name-signoff', text: `${name} ${personality.emoji}` }),
    footer(),
  ]);

  const reflection = element('article', {
    className: 'story__panel story__panel--reflection',
    attributes: { tabindex: '-1', 'data-panel': 'reflection' },
  }, [
    element('img', {
      className: 'story__illustration story__illustration--reflection',
      attributes: illustrationAttributes,
    }),
    element('h2', { text: context.t('result.watchout_label') }),
    element('p', { text: personality.watchout[language] }),
    element('h2', { text: context.t('result.popcousin_label') }),
    element('p', { text: personality.popCousin[language] }),
    element('p', { className: 'story__name-signoff', text: `${name} ${personality.emoji}` }),
    element('p', { className: 'story__disclaimer', text: context.t('footer.disclaimer') }),
    footer(),
  ]);

  return [identity, powers, reflection];
}

function imageOutcomeState(outcome: ImageDeliveryOutcome): 'success' | 'error' | 'idle' {
  if (outcome === 'cancelled') return 'idle';
  return outcome === 'screenshot' ? 'error' : 'success';
}

function linkOutcomeState(outcome: LinkDeliveryOutcome): 'success' | 'error' | 'idle' {
  if (outcome === 'cancelled') return 'idle';
  return outcome === 'failed' ? 'error' : 'success';
}

function announceImageOutcome(
  outcome: ImageDeliveryOutcome,
  context: SceneContext,
  toaster: ToastStack,
): void {
  if (outcome === 'cancelled') return;
  if (outcome === 'screenshot') {
    toaster.show(context.t('error.save_failed'), 'error');
  } else {
    toaster.show(
      context.t(outcome === 'shared' ? 'share.image_shared' : 'share.image_saved'),
      'success',
    );
  }
}
