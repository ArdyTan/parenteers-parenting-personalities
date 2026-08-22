import { gsap } from 'gsap';

import { playSfx } from '../core/audio';
import type { Language, PersonalityType } from '../core/quiz-types';
import { characterThumbnail } from '../data';
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
/** A deliberate first swipe should reveal save without waiting for long-form copy. */
const DOCK_ENTER_SCROLL_RATIO = 0.28;
/** Keep enough hysteresis that a small reverse scroll does not chatter the dock. */
const DOCK_EXIT_SCROLL_RATIO = 0.12;
/** How many of the other bakes are on screen at once in the teaser row. */
const OTHER_TYPE_SLOTS = 3;
/** One tile changes at a time — a shuffle, not a strobe. */
const OTHER_TYPE_SWAP_MS = 520;

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

    const parentStory = createParentStorySection(personality, language, context);
    const { support: parentSupport, weekly: weeklyActions } = createParentSupportSections(
      personality,
      language,
      context,
    );
    // The booklet is a committed static file, linked rather than generated:
    // Instagram's WebView silently drops both `download` and `blob:`, so a real
    // URL it can hand to a viewer is the only form that survives there.
    const pdfHref = `/pdf/${language}/${personality.slug}.pdf`;
    const watchPdfOpen = createBlockedOpenWatcher(() => {
      toaster.show(context.t('error.pdf_failed'), 'error');
    }, signal);
    const pdfSection = createPdfSection(pdfHref, context, watchPdfOpen);

    const softSell = element(
      'aside',
      { className: 'result__soft-sell' },
      createProductContent(context),
    );
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
                cta: context.t('share.card_cta'),
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
    // something to press. Icons come from the existing 16-icon family. The
    // gallery left this tray for a section of its own; `/end` no longer exists,
    // so "continue" left with it.
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

    const chipTray = element('div', { className: 'result__chips' }, [copyButton, retakeChip]);

    const otherTypes = createOtherTypesSection(context, personality, signal);

    const detail = element('div', { className: 'result__detail' }, [
      parentStory,
      parentSupport,
      weeklyActions,
      pdfSection,
      powers,
      watchout,
      popCousin,
      otherTypes,
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
      const scrolled = 'scrollTop' in scrollSurface ? scrollSurface.scrollTop : window.scrollY;
      dock(scrolled);
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
 * The download surface. One entry point by design: a full section where a reader
 * who finished the support layer already is. The dock stays a single primary
 * action — the save that feeds the Instagram Story.
 */
function pdfLink(
  href: string,
  text: string,
  onActivate: () => void,
  options: { className: string },
): HTMLAnchorElement {
  const link = element('a', {
    className: options.className,
    text,
    // No `download` attribute anywhere: it is the form most likely to do
    // nothing at all inside the Instagram in-app browser.
    attributes: { href, target: '_blank', rel: 'noopener' },
  });
  link.addEventListener('click', onActivate);
  return link;
}

function createPdfSection(
  href: string,
  context: SceneContext,
  onActivate: () => void,
): HTMLElement {
  const section = element('section', { className: 'result__section result__pdf' }, [
    element('h2', { text: context.t('result.pdf_title') }),
    element('p', { text: context.t('result.pdf_body') }),
    pdfLink(href, context.t('result.pdf_cta'), onActivate, {
      className: 'button button--secondary result__pdf-link',
    }),
  ]);
  section.dataset.reveal = '';
  return section;
}

/**
 * A blocked navigation inside a WebView is not observable, so this measures the
 * only proxy available: if nothing took focus off the page within a beat, the
 * open did nothing and the reader is offered the copy-link route instead.
 */
function createBlockedOpenWatcher(onBlocked: () => void, signal: AbortSignal): () => void {
  const GRACE_MS = 1500;
  return () => {
    let left = false;
    const mark = (): void => {
      left = true;
    };
    window.addEventListener('blur', mark, { once: true, signal });
    document.addEventListener('visibilitychange', mark, { once: true, signal });
    window.setTimeout(() => {
      window.removeEventListener('blur', mark);
      document.removeEventListener('visibilitychange', mark);
      if (left || signal.aborted || document.visibilityState === 'hidden') return;
      onBlocked();
    }, GRACE_MS);
  };
}

/**
 * The story is real prose, not a disguised checklist. Its illustration is inserted
 * from the data contract after paragraph two, creating a deliberate visual breath
 * before the parent returns to the child in the closing half.
 */
function createParentStorySection(
  personality: PersonalityType,
  language: Language,
  context: SceneContext,
): HTMLElement {
  const story = personality.parentStory;
  const paragraphs = story.body[language].split('\n\n').filter(Boolean);
  const prose: Node[] = [];

  paragraphs.forEach((paragraph, index) => {
    if (index === story.imageAfterParagraph) {
      prose.push(
        element('figure', { className: 'result__story-figure' }, [
          element('img', {
            className: 'result__story-image',
            attributes: {
              src: story.image,
              alt: story.imageAlt[language],
              width: '1200',
              height: '800',
              loading: 'lazy',
              decoding: 'async',
            },
          }),
        ]),
      );
    }
    prose.push(element('p', { className: 'result__story-paragraph', text: paragraph }));
  });

  const section = element(
    'section',
    {
      className: 'result__section result__parent-story',
      attributes: { 'data-story-image-after': String(story.imageAfterParagraph) },
    },
    [
      element('p', {
        className: 'result__story-label',
        text: context.t('result.story_label'),
      }),
      element('h2', { className: 'result__story-title', text: story.title[language] }),
      element('div', { className: 'result__story-prose' }, prose),
    ],
  );
  section.dataset.reveal = '';
  return section;
}

/** Parent capacity is acknowledged before the child-facing takeaway by design. */
function createParentSupportSections(
  personality: PersonalityType,
  language: Language,
  context: SceneContext,
): Readonly<{ support: HTMLElement; weekly: HTMLElement }> {
  const support = personality.parentSupport;
  const takeaways = [
    ['realLife', 'result.real_life_label'],
    ['guiltRelease', 'result.guilt_release_label'],
    ['careForYou', 'result.care_for_you_label'],
    ['forYourChild', 'result.for_child_label'],
  ] as const;

  const list = element(
    'ul',
    { className: 'result__support-list' },
    takeaways.map(([field, label], index) =>
      element(
        'li',
        {
          className: 'result__support-item',
          attributes: { 'data-support-order': String(index + 1), 'data-support-field': field },
        },
        [
          element('strong', {
            className: 'result__support-label',
            text: context.t(label),
          }),
          element('p', { text: support[field][language] }),
        ],
      ),
    ),
  );

  const actions = element(
    'ol',
    { className: 'result__weekly-list' },
    support.tryThisWeek[language].map((action) => element('li', { text: action })),
  );

  const supportSection = element('section', { className: 'result__section result__parent-support' }, [
    element('h2', { text: context.t('result.summary_label') }),
    list,
  ]);
  supportSection.dataset.reveal = '';

  const weeklySection = element('section', { className: 'result__section result__weekly-section' }, [
    element('h3', {
      className: 'result__weekly-title',
      text: context.t('result.try_this_week_label'),
    }),
    actions,
  ]);
  weeklySection.dataset.reveal = '';

  return { support: supportSection, weekly: weeklySection };
}

/**
 * Technique 65, reduced to what this page needs: one deliberate first swipe
 * reveals the save action, while a return near the top retreats it again.
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
    const threshold = window.innerHeight
      * (docked ? DOCK_EXIT_SCROLL_RATIO : DOCK_ENTER_SCROLL_RATIO);
    const next = scrolled > threshold;
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
 * The other fifteen bakes, at the same weight as "Your pop-culture cousin":
 * a heading, three tiles that keep quick-changing through the rest of the cast,
 * and one wide button into the gallery. Three tiles rather than fifteen keeps
 * the page short and the image cost to whatever the cycle has actually shown.
 */
function createOtherTypesSection(
  context: SceneContext,
  current: PersonalityType,
  signal: AbortSignal,
): HTMLElement {
  const others = shuffle(context.data.types.filter((type) => type.code !== current.code));
  // Dealt round-robin so each tile owns a disjoint deck — no two tiles can ever
  // show the same bake at the same time.
  const decks = Array.from({ length: OTHER_TYPE_SLOTS }, (_, slot) =>
    others.filter((_, index) => index % OTHER_TYPE_SLOTS === slot),
  );

  const tiles = decks.map((deck) =>
    element('img', {
      className: 'result__other-tile',
      attributes: {
        src: characterThumbnail((deck[0] ?? current).image),
        alt: '',
        width: '360',
        height: '360',
        decoding: 'async',
        loading: 'lazy',
      },
    }),
  );

  const strip = element(
    'div',
    { className: 'result__other-strip', attributes: { 'aria-hidden': 'true' } },
    tiles,
  );

  const seeAll = actionButton(
    context.t('result.see_all'),
    () => context.navigate('/gallery'),
    signal,
    { className: 'result__see-all' },
  );

  const section = element('section', { className: 'result__section result__other-types' }, [
    element('h2', { text: context.t('result.other_types_label') }),
    strip,
    seeAll,
  ]);
  section.dataset.reveal = '';
  bindTypeShuffle(section, tiles, decks, signal);
  return section;
}

/**
 * Runs the tile cycle only while the section is on screen — the result page is
 * taller than the viewport and this sits well below the fold, so there is no
 * reason to be swapping images (or fetching them) while the user is still
 * reading the hero. Reduced motion keeps the three static bakes.
 */
function bindTypeShuffle(
  section: HTMLElement,
  tiles: readonly HTMLImageElement[],
  decks: readonly (readonly PersonalityType[])[],
  signal: AbortSignal,
): void {
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;

  let scheduled: gsap.core.Tween | null = null;
  let step = 0;

  const swapNext = (): void => {
    const slot = step % tiles.length;
    const round = Math.floor(step / tiles.length) + 1;
    step += 1;
    const tile = tiles[slot];
    const deck = decks[slot];
    const next = deck?.[round % Math.max(1, deck.length)];
    if (!tile || !next) return;
    tile.src = characterThumbnail(next.image);
    gsap.fromTo(
      tile,
      { scale: 0.76, autoAlpha: 0.25 },
      {
        scale: 1,
        autoAlpha: 1,
        duration: 0.42,
        ease: 'back.out(2.2)',
        clearProps: 'transform,opacity,visibility',
        overwrite: true,
      },
    );
  };

  const schedule = (): void => {
    scheduled = gsap.delayedCall(OTHER_TYPE_SWAP_MS / 1000, () => {
      swapNext();
      schedule();
    });
  };

  const stop = (): void => {
    scheduled?.kill();
    scheduled = null;
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.some((entry) => entry.isIntersecting);
      if (visible && !scheduled) {
        // Warm every face once the row is in play, so a swap can never land on
        // a tile that has not been fetched yet.
        decks.flat().forEach((type) => {
          const image = new Image();
          image.src = characterThumbnail(type.image);
        });
        schedule();
      } else if (!visible) {
        stop();
      }
    },
    { threshold: 0.25 },
  );

  observer.observe(section);
  signal.addEventListener(
    'abort',
    () => {
      observer.disconnect();
      stop();
    },
    { once: true },
  );
}

function shuffle<T>(items: readonly T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swap]] = [shuffled[swap] as T, shuffled[index] as T];
  }
  return shuffled;
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

function createProductContent(context: SceneContext): readonly Node[] {
  const heading = element('h2', {
    className: 'result__products-heading',
    text: context.t('result.products_heading'),
  });

  if (context.store.get().lang === 'en') {
    return [
      element('div', { className: 'result__products-coming-soon' }, [
        heading,
        element('p', { text: context.t('result.products_coming_soon') }),
      ]),
    ];
  }

  const { activities } = context.data.config.links;
  const rail = element(
    'div',
    {
      className: 'result__product-rail',
      attributes: {
        'aria-label': context.t('result.products_heading'),
        tabindex: '0',
      },
    },
    context.data.products.map((product) =>
      element(
        'a',
        {
          className: 'result__product-card',
          attributes: {
            href: activities,
            target: '_blank',
            rel: 'noreferrer noopener',
            'data-product-id': product.id,
          },
        },
        [
          element('span', { className: 'result__product-media' }, [
            element('img', {
              attributes: {
                src: product.image,
                alt: product.alt,
                loading: 'lazy',
                decoding: 'async',
                width: '400',
                height: '400',
              },
            }),
          ]),
          element('span', { className: 'result__product-meta', text: product.meta }),
          element('span', { className: 'result__product-title', text: product.title }),
        ],
      ),
    ),
  );

  return [
    heading,
    element('p', { text: context.t('result.softsell_body') }),
    rail,
    externalLink(context.t('result.products_cta'), activities, 'result__activities-cta'),
  ];
}

function formatCode(code: string): string {
  return [...code].join(' ');
}

function resultImageState(outcome: ImageDeliveryOutcome): 'success' | 'error' | 'idle' {
  if (outcome === 'cancelled') return 'idle';
  return outcome === 'screenshot' ? 'error' : 'success';
}
