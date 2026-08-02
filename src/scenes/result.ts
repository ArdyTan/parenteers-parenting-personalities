import { gsap } from 'gsap';

import { playSfx } from '../core/audio';
import type { PersonalityType } from '../core/quiz-types';
import {
  buildResultShareUrl,
  composeResultStoryCard,
  createBrowserShareAdapter,
  deliverResultImage,
  type ImageDeliveryOutcome,
} from '../core/share';
import {
  createAsyncButtonController,
  type AsyncButtonController,
} from '../motion/button-state';
import {
  bindPressFeedback,
  createSceneMotion,
  prefersReducedMotion,
  revealOnScroll,
  runConfetti,
} from '../motion/shared';
import { createToastStack } from '../motion/toast';
import {
  actionButton,
  element,
  externalLink,
  localizedList,
  sceneBody,
  sceneBottom,
} from './dom';
import { FunctionalScene, type SceneContext } from './scene';

/** Guards against the docked bar flashing during a fast flick past the hero. */
const DOCK_DWELL_MS = 180;

export function createResultScene(personality: PersonalityType): FunctionalScene {
  return new FunctionalScene('result', (root, context, signal) => {
    const language = context.store.get().lang;
    const name = personality.name[language];
    const resultUrl = buildResultShareUrl(
      `/r/${personality.slug}`,
      context.data.config,
      window.location.href,
    );
    const toaster = createToastStack(root, signal);
    const shareAdapter = createBrowserShareAdapter(context.copyLink);

    root.dataset.typeCode = personality.code;
    root.style.setProperty('--type-accent', personality.accent);

    // Art first. The design file leads with the character at full width and only
    // then names it, which is the opposite of the old identity-above-image order.
    const illustration = element('img', {
      className: 'result__illustration',
      attributes: {
        src: personality.image,
        alt: context.t('a11y.type_illustration_alt', { type: name }),
        decoding: 'async',
        fetchpriority: 'high',
      },
    });

    const heading = element('h1', { className: 'result__name', text: name });
    heading.tabIndex = -1;
    // "The Croquembouche" has no break opportunity, so at 48px it ran past the
    // viewport and — because the hero column is content-sized — dragged the
    // character illustration out with it. Long single words step down a size.
    const longestWord = Math.max(...name.split(/\s+/).map((word) => word.length));
    if (longestWord > 10) heading.dataset.longName = '';

    const identity = element('div', { className: 'result__identity' }, [
      element('p', { className: 'result__intro', text: context.t('result.intro_label') }),
      heading,
      element('p', {
        className: 'result__code',
        text: `${context.t('result.your_code')}: ${formatCode(personality.code)}`,
        attributes: { 'data-code': personality.code },
      }),
      element('p', {
        className: 'result__tagline',
        text: personality.tagline[language],
      }),
    ]);

    const scrollCue = element('div', { className: 'result__scroll-cue' }, [
      element('span', { text: context.t('result.scroll_hint') }),
      element('span', {
        className: 'result__scroll-arrow',
        text: '↓',
        attributes: { 'aria-hidden': 'true' },
      }),
    ]);

    const hero = element('section', { className: 'result__hero' }, [
      illustration,
      identity,
      scrollCue,
    ]);

    const powers = element('section', { className: 'result__section result__powers' }, [
      element('h2', { text: context.t('result.superpowers_label') }),
      localizedList(personality.superpowers[language], 'result__power-list'),
    ]);
    powers.dataset.reveal = '';

    const watchout = element('section', { className: 'result__section result__reflection' }, [
      element('h2', { text: context.t('result.watchout_label') }),
      element('p', { text: personality.watchout[language] }),
    ]);
    watchout.dataset.reveal = '';

    const popCousin = element('section', { className: 'result__section result__reflection' }, [
      element('h2', { text: context.t('result.popcousin_label') }),
      element('p', { text: personality.popCousin[language] }),
    ]);
    popCousin.dataset.reveal = '';

    const activityTags = element(
      'ul',
      { className: 'result__activity-tags' },
      personality.activityTags.map((tag) =>
        element('li', {
          text: context.t(`activity.${tag}`),
          attributes: { 'data-activity-tag': tag },
        }),
      ),
    );

    const softSell = element('aside', { className: 'result__soft-sell' }, [
      element('p', { text: context.t('result.softsell_body') }),
      activityTags,
      createActivityAction(context, signal),
    ]);
    softSell.dataset.reveal = '';

    const copyStatus = element('p', {
      className: 'result__copy-status',
      attributes: { role: 'status', 'aria-live': 'polite' },
    });
    let copyController: AsyncButtonController;
    const copyButton = actionButton(
      context.t('result.copy_link'),
      () => {
        void copyController.run(
          () => context.copyLink(resultUrl),
          (copied) => copied ? 'success' : 'error',
        ).then((copied) => {
          if (copied === undefined || signal.aborted) return;
          const message = context.t(copied ? 'result.copied' : 'error.generic');
          copyStatus.textContent = message;
          toaster.show(message, copied ? 'success' : 'error');
        }).catch(() => toaster.show(context.t('error.generic'), 'error'));
      },
      signal,
      { className: 'result__chip result__copy-link' },
    );
    copyController = createAsyncButtonController(copyButton, signal);
    decorateChip(copyButton, 'share');

    let saveController: AsyncButtonController;
    // The one primary action. `deliverResultImage` already falls back to Story
    // mode when the WebView can only offer a screenshot, so this single button
    // covers what used to be two separate share entry points.
    const saveButton = actionButton(
      context.t('result.save_image'),
      () => {
        void saveController.run(
          async () => {
            const caption = context.t('share.caption_template', {
              type: name,
              emoji: personality.emoji,
              link: resultUrl,
            });
            const blob = await composeResultStoryCard({
              personality,
              language,
              shareUrl: resultUrl,
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
              { title: context.t('share.title'), text: caption, url: resultUrl },
              shareAdapter,
            );
          },
          (outcome) => resultImageState(outcome),
        ).then((outcome) => {
          if (!outcome || outcome === 'cancelled' || signal.aborted) return;
          if (outcome === 'screenshot') {
            context.navigate('/story');
            return;
          }
          toaster.show(
            context.t(outcome === 'shared' ? 'share.image_shared' : 'share.image_saved'),
            'success',
          );
        }).catch(() => toaster.show(context.t('error.save_failed'), 'error'));
      },
      signal,
      { className: 'button--primary result__save-image' },
    );
    saveController = createAsyncButtonController(saveButton, signal);

    // A tray of warm capsule chips rather than a stack of underlined links: same
    // destinations, but they read as part of the bakery and each one has
    // something to press. Icons come from the existing 16-icon family.
    const galleryChip = actionButton(
      context.t('result.see_all'),
      () => context.navigate('/gallery'),
      signal,
      { className: 'result__chip' },
    );
    decorateChip(galleryChip, 'star-featured');

    const retakeChip = actionButton(
      context.t('result.retake'),
      () => {
        context.store.clearAnswers();
        context.store.clearResult();
        context.navigate('/intro');
      },
      signal,
      { className: 'result__chip' },
    );
    decorateChip(retakeChip, 'stopwatch');

    const endChip = actionButton(
      context.t('nav.continue'),
      () => context.navigate('/end'),
      signal,
      { className: 'result__chip' },
    );
    decorateChip(endChip, 'thumbs-up');

    const chipTray = element('div', { className: 'result__chips' }, [
      copyButton,
      galleryChip,
      retakeChip,
      endChip,
    ]);

    const detail = element('div', { className: 'result__detail' }, [
      powers,
      watchout,
      popCousin,
      element('hr', { className: 'result__rule' }),
      softSell,
      element('p', { className: 'result__disclaimer', text: context.t('footer.disclaimer') }),
      chipTray,
      copyStatus,
    ]);

    const body = sceneBody('result__body', [hero, detail]);
    const bottom = sceneBottom('result__bottom', [saveButton]);
    bottom.dataset.docked = 'false';

    root.append(body, bottom);

    revealOnScroll(body, signal);
    bindPressFeedback(root.querySelectorAll('.button'), signal);
    bindChipWiggle(chipTray, signal);

    const scrollSurface = root.closest<HTMLElement>('.phone-frame__screen') ?? window;
    const dock = createShareBarDock(bottom, signal);
    const updateHero = (): void => {
      const top = root.getBoundingClientRect().top;
      const progress = Math.max(0, Math.min(1, -top / 260));
      illustration.style.transform = `translateY(${-progress * 25.6}px) scale(${1 - progress * 0.06})`;
      identity.style.transform = `translateY(${-progress * 12.8}px)`;
      dock(-top);
    };
    scrollSurface.addEventListener('scroll', updateHero, { passive: true, signal });
    dock(0);

    return createSceneMotion(root, {
      enterTargets: [illustration, identity, scrollCue, powers],
      onEnter() {
        // The chord swells under the confetti sparkle rather than after it, so
        // the reveal reads as one event.
        playSfx('reveal');
        runConfetti(root, signal);
        if (prefersReducedMotion()) return;
        // The character lands with a squash-and-stretch before its name arrives.
        gsap.fromTo(
          illustration,
          { scaleX: 1.07, scaleY: 0.9, transformOrigin: '50% 100%' },
          { scaleX: 1, scaleY: 1, duration: 0.78, ease: 'elastic.out(1, 0.42)', clearProps: 'transform' },
        );
      },
    });
  });
}

/**
 * Technique 65, reduced to what this page needs: the share bar docks once the
 * first composition has scrolled away and retreats when the user returns to the
 * top. Driven by scroll offset rather than a sentinel, because the hero is
 * taller than the viewport — an element-based observer would read as "already
 * scrolled past" on first paint.
 */
function createShareBarDock(
  bar: HTMLElement,
  signal: AbortSignal,
): (scrolled: number) => void {
  let dwell: number | undefined;
  let docked = false;
  bar.dataset.docked = 'false';

  signal.addEventListener('abort', () => window.clearTimeout(dwell), { once: true });

  return (scrolled: number): void => {
    // Asymmetric thresholds so a scroll sitting near the boundary cannot chatter.
    const next = docked
      ? scrolled > window.innerHeight * 0.35
      : scrolled > window.innerHeight * 0.55;
    if (next === docked) return;
    docked = next;
    window.clearTimeout(dwell);
    if (!docked) {
      bar.dataset.docked = 'false';
      return;
    }
    dwell = window.setTimeout(() => {
      if (!signal.aborted) bar.dataset.docked = 'true';
    }, prefersReducedMotion() ? 0 : DOCK_DWELL_MS);
  };
}

/**
 * Prepends the chip's icon without touching its label. Prepending rather than
 * replacing matters for the copy chip: `createAsyncButtonController` rebuilds a
 * button's children from its text, so anything it owns has to stay in place.
 */
function decorateChip(button: HTMLButtonElement, icon: string): void {
  button.prepend(
    element('img', {
      className: 'result__chip-icon',
      attributes: {
        src: `/icons/${icon}.svg`,
        alt: '',
        width: '64',
        height: '64',
        'aria-hidden': 'true',
        decoding: 'async',
        loading: 'lazy',
      },
    }),
  );
}

/** The icon gives a little kick on press — the chips should feel pressable. */
function bindChipWiggle(tray: HTMLElement, signal: AbortSignal): void {
  if (prefersReducedMotion()) return;

  tray.addEventListener(
    'pointerdown',
    (event) => {
      if (!event.isPrimary || !(event.target instanceof Element)) return;
      const icon = event.target.closest('.result__chip')?.querySelector('.result__chip-icon');
      if (!icon) return;
      gsap.fromTo(
        icon,
        { rotate: -14, scale: 0.86 },
        {
          rotate: 0,
          scale: 1,
          duration: 0.58,
          ease: 'elastic.out(1, 0.42)',
          clearProps: 'transform',
          overwrite: true,
        },
      );
    },
    { signal },
  );
}

function createActivityAction(context: SceneContext, signal: AbortSignal): HTMLElement {
  const { activities } = context.data.config.links;

  if (activities !== 'TBD') {
    return externalLink(context.t('result.activities_cta'), activities, 'result__activities-cta');
  }

  const disabledAction = actionButton(
    context.t('result.activities_cta'),
    () => undefined,
    signal,
    {
      className: 'result__activities-cta',
      attributes: { 'aria-disabled': 'true' },
    },
  );
  disabledAction.disabled = true;
  return disabledAction;
}

function formatCode(code: string): string {
  return [...code].join(' ');
}

function resultImageState(outcome: ImageDeliveryOutcome): 'success' | 'error' | 'idle' {
  if (outcome === 'cancelled') return 'idle';
  return outcome === 'screenshot' ? 'error' : 'success';
}
