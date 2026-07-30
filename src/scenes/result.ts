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
  revealOnScroll,
  runConfetti,
} from '../motion/shared';
import { createToastStack } from '../motion/toast';
import { actionButton, element, externalLink, localizedList } from './dom';
import { FunctionalScene, type SceneContext } from './scene';

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

    const identity = element('header', { className: 'result__identity' }, [
      element('p', { className: 'result__intro', text: context.t('result.intro_label') }),
      heading,
      element('p', {
        className: 'result__code',
        text: `${context.t('result.your_code')}: ${formatCode(personality.code)}`,
        attributes: { 'data-code': personality.code },
      }),
    ]);
    const tagline = element('p', {
      className: 'result__tagline',
      text: personality.tagline[language],
    });
    const scrollCue = element('div', { className: 'result__scroll-cue' }, [
      element('span', {
        className: 'result__scroll-heart',
        text: '♥',
        attributes: { 'aria-hidden': 'true' },
      }),
      element('span', { text: context.t('result.scroll_hint') }),
      element('span', {
        className: 'result__scroll-arrow',
        text: '↓',
        attributes: { 'aria-hidden': 'true' },
      }),
    ]);
    const hero = element('section', { className: 'result__hero' }, [
      identity,
      illustration,
      tagline,
      scrollCue,
    ]);

    const powers = element('section', { className: 'result__section result__powers' }, [
      element('h2', { text: context.t('result.superpowers_label') }),
      localizedList(personality.superpowers[language], 'result__power-list'),
    ]);
    powers.dataset.reveal = '';

    const reflection = element('section', { className: 'result__section result__reflection' }, [
      element('h2', { text: context.t('result.watchout_label') }),
      element('p', { text: personality.watchout[language] }),
      element('h2', { text: context.t('result.popcousin_label') }),
      element('p', { text: personality.popCousin[language] }),
    ]);
    reflection.dataset.reveal = '';

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

    const activityAction = createActivityAction(context, signal);
    const softSell = element('aside', { className: 'result__soft-sell' }, [
      element('p', { text: context.t('result.softsell_body') }),
      activityTags,
      activityAction,
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
      { className: 'result__copy-link' },
    );
    copyController = createAsyncButtonController(copyButton, signal);

    let saveController: AsyncButtonController;
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
      { className: 'result__save-image' },
    );
    saveController = createAsyncButtonController(saveButton, signal);

    const actions = element('div', { className: 'result__actions' }, [
      actionButton(
        context.t('result.share_ig'),
        () => context.navigate('/story'),
        signal,
        { className: 'button--primary' },
      ),
      saveButton,
      copyButton,
      actionButton(
        context.t('nav.continue'),
        () => context.navigate('/end'),
        signal,
        { className: 'button--primary' },
      ),
      actionButton(context.t('result.see_all'), () => context.navigate('/gallery'), signal),
      actionButton(
        context.t('result.retake'),
        () => {
          context.store.clearAnswers();
          context.store.clearResult();
          context.navigate('/intro');
        },
        signal,
        { className: 'button--text' },
      ),
    ]);

    root.append(
      element('div', { className: 'result__content' }, [
        hero,
        powers,
        reflection,
        element('p', { className: 'result__disclaimer', text: context.t('footer.disclaimer') }),
        softSell,
        actions,
        copyStatus,
      ]),
    );

    const content = root.querySelector<HTMLElement>('.result__content');
    if (content) {
      revealOnScroll(content, signal);
    }
    bindPressFeedback(root.querySelectorAll('.button'), signal);

    const scrollSurface = root.closest<HTMLElement>('.phone-frame__screen') ?? window;
    const updateHero = (): void => {
      const top = root.getBoundingClientRect().top;
      const progress = Math.max(0, Math.min(1, -top / 260));
      illustration.style.transform = `translateY(${-progress * 25.6}px) scale(${1 - progress * 0.06})`;
      identity.style.transform = `translateY(${-progress * 12.8}px)`;
    };
    scrollSurface.addEventListener('scroll', updateHero, { passive: true, signal });

    return createSceneMotion(root, {
      enterTargets: [identity, illustration, tagline, scrollCue, powers],
      onEnter() {
        runConfetti(root, signal);
      },
    });
  });
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
  return [...code].join('·');
}

function resultImageState(outcome: ImageDeliveryOutcome): 'success' | 'error' | 'idle' {
  if (outcome === 'cancelled') return 'idle';
  return outcome === 'screenshot' ? 'error' : 'success';
}
