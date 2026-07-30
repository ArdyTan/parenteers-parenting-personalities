import { actionButton, element, externalLink } from './dom';
import {
  buildResultShareUrl,
  createBrowserShareAdapter,
  deliverShareLink,
  formatShareCaption,
} from '../core/share';
import {
  createAsyncButtonController,
  type AsyncButtonController,
} from '../motion/button-state';
import {
  bindPressFeedback,
  createSceneMotion,
  revealOnScroll,
} from '../motion/shared';
import { createToastStack, type ToastStack } from '../motion/toast';
import { FunctionalScene, type SceneContext } from './scene';

export function createEndScene(): FunctionalScene {
  return new FunctionalScene('end', renderEnd);
}

function renderEnd(
  root: HTMLElement,
  context: SceneContext,
  signal: AbortSignal,
): ReturnType<typeof createSceneMotion> {
  const { config } = context.data;
  const toaster = createToastStack(root, signal);
  const content = element('div', { className: 'end__content' }, [
    element('h1', {
      className: 'end__title',
      text: context.t('end.h2'),
      attributes: { id: 'end-title' },
    }),
    element('p', { className: 'end__body', text: context.t('end.body') }),
    element('img', {
      className: 'end__art',
      attributes: {
        src: context.data.sceneArt.continuity.end,
        alt: '',
        width: '540',
        height: '960',
        decoding: 'async',
        loading: 'eager',
      },
    }),
  ]);

  if (config.flags.founderNote) {
    content.appendChild(
      element('aside', {
        className: 'end__founder-note',
        text: context.t('end.founder_note'),
      }),
    );
  }
  for (const child of content.children) {
    (child as HTMLElement).dataset.reveal = '';
  }

  const actions = element('div', { className: 'end__actions' });
  actions.appendChild(createActivitiesAction(context));

  if (isConfiguredLink(config.links.instagram)) {
    actions.appendChild(
      externalLink(
        context.t('end.cta_follow'),
        config.links.instagram,
        'end__cta end__cta--instagram button--secondary',
      ),
    );
  }

  let shareController: AsyncButtonController;
  const share = actionButton(
    context.t('end.cta_share'),
    () => {
      void shareController.run(
        () => shareQuiz(context),
        (outcome) => outcome === 'failed' ? 'error' : outcome === 'cancelled' ? 'idle' : 'success',
      ).then((outcome) => announceLinkOutcome(outcome, context, toaster))
        .catch(() => toaster.show(context.t('error.generic'), 'error'));
    },
    signal,
    { className: 'end__cta end__cta--share button--secondary' },
  );
  shareController = createAsyncButtonController(share, signal);
  actions.appendChild(share);

  actions.appendChild(
    actionButton(
      context.t('end.cta_retake'),
      () => {
        context.store.clearAnswers();
        context.store.clearResult();
        context.navigate('/intro');
      },
      signal,
      { className: 'end__cta end__cta--retake button--text' },
    ),
  );

  const footer = element('footer', { className: 'end__footer' }, [
    element('p', { className: 'end__disclaimer', text: context.t('footer.disclaimer') }),
    element('p', { className: 'end__made-by', text: context.t('footer.made_by') }),
    element('p', {
      className: 'end__copyright',
      text: context.t('footer.copyright', { year: new Date().getFullYear() }),
    }),
  ]);

  root.setAttribute('aria-labelledby', 'end-title');
  root.appendChild(content);
  root.appendChild(actions);
  root.appendChild(footer);
  actions.dataset.reveal = '';
  footer.dataset.reveal = '';
  revealOnScroll(root, signal);
  bindPressFeedback(root.querySelectorAll('.button'), signal);
  return createSceneMotion(root, {
    enterTargets: [content.querySelector('.end__title'), content.querySelector('.end__body')].filter(
      (target): target is Element => target instanceof Element,
    ),
  });
}

function createActivitiesAction(context: SceneContext): HTMLElement {
  const label = context.t('end.cta_activities');
  const href = context.data.config.links.activities;

  if (isConfiguredLink(href)) {
    return externalLink(
      label,
      href,
      'end__cta end__cta--activities button--primary',
    );
  }

  return element('button', {
    className: 'button end__cta end__cta--activities button--primary is-disabled',
    text: label,
    attributes: {
      type: 'button',
      disabled: '',
      'aria-disabled': 'true',
    },
  });
}

async function shareQuiz(context: SceneContext): ReturnType<typeof deliverShareLink> {
  const result = context.store.get().result;
  const personality = context.data.types.find((type) => type.code === result);
  const path = personality ? `/r/${personality.slug}` : '/';
  const shareUrl = buildResultShareUrl(path, context.data.config, window.location.href);
  const language = context.store.get().lang;
  const captionTemplate = context.data.translations[language]['share.caption_template'] ?? '';
  const caption = personality
    ? formatShareCaption(
        captionTemplate,
        personality,
        language,
        shareUrl,
      )
    : `${context.t('meta.og_description')} ${shareUrl}`;

  return deliverShareLink(
    { title: context.t('meta.og_title'), text: caption, url: shareUrl },
    createBrowserShareAdapter(context.copyLink),
  );
}

function announceLinkOutcome(
  outcome: Awaited<ReturnType<typeof deliverShareLink>> | undefined,
  context: SceneContext,
  toaster: ToastStack,
): void {
  if (!outcome || outcome === 'cancelled') return;
  if (outcome === 'failed') toaster.show(context.t('error.generic'), 'error');
  else {
    toaster.show(
      context.t(outcome === 'copied' ? 'result.copied' : 'share.link_shared'),
      'success',
    );
  }
}

function isConfiguredLink(value: string): boolean {
  const normalized = value.trim();
  return normalized.length > 0 && normalized.toUpperCase() !== 'TBD';
}
