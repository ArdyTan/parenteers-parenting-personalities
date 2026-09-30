import type { PersonalityType, TypeCode } from '../core/quiz-types';
import { characterThumbnail } from '../data';
import {
  bindPressFeedback,
  createSceneMotion,
  revealOnScroll,
} from '../motion/shared';
import { actionButton, element } from './dom';
import { FunctionalScene, type SceneContext } from './scene';

export function createGalleryScene(): FunctionalScene {
  return new FunctionalScene('gallery', (root, context, signal) => {
    const { lang, result } = context.store.get();
    const currentResult = result ? findPersonality(context.data.types, result) : undefined;
    const copyStatus = element('p', {
      className: 'gallery__copy-status',
      attributes: { role: 'status', 'aria-live': 'polite' },
    });

    const heading = element('h1', { className: 'gallery__title', text: context.t('gallery.title') });
    heading.tabIndex = -1;
    const grid = element(
      'ul',
      { className: 'gallery__grid' },
      context.data.types.map((personality) => {
        const isCurrent = personality.code === result;
        const link = createResultLink(personality, context, signal);

        link.append(
          element('img', {
            className: 'gallery__illustration',
            attributes: {
              src: characterThumbnail(personality.image),
              alt: context.t('a11y.type_illustration_alt', {
                type: personality.name[lang],
              }),
              loading: 'lazy',
              decoding: 'async',
            },
          }),
          element('span', { className: 'gallery__name', text: personality.name[lang] }),
          element('span', { className: 'gallery__code', text: formatCode(personality.code) }),
        );

        if (isCurrent) {
          link.append(
            element('span', {
              className: 'gallery__current-badge',
              text: context.t('gallery.your_type_badge'),
            }),
          );
        }

        const item = element('li', {
          className: 'gallery__item',
          attributes: { 'data-type-code': personality.code },
        }, [link]);
        item.style.setProperty('--type-accent', personality.accent);
        return item;
      }),
    );

    const quizUrl = buildQuizUrl(context);
    const sendButton = actionButton(
      context.t('gallery.send_quiz'),
      () => {
        sendButton.disabled = true;
        void context.copyLink(quizUrl).then((copied) => {
          if (signal.aborted) return;
          sendButton.disabled = false;
          copyStatus.textContent = copied ? context.t('result.copied') : context.t('error.generic');
          if (copied) sendButton.textContent = context.t('result.copied');
        });
      },
      signal,
      { className: 'button--primary gallery__send' },
    );

    const actions: Node[] = [sendButton];
    if (currentResult) {
      actions.push(
        actionButton(
          context.t('gallery.back_to_result'),
          () => context.navigate(`/r/${currentResult.slug}`),
          signal,
        ),
      );
    }

    root.append(
      element('div', { className: 'gallery__content' }, [
        heading,
        element('p', { className: 'gallery__intro', text: context.t('gallery.intro') }),
        grid,
        element('div', { className: 'gallery__actions' }, actions),
        copyStatus,
      ]),
    );
    revealOnScroll(root, signal);
    bindPressFeedback(root.querySelectorAll('.button, .gallery__type-link'), signal);
    return createSceneMotion(root, {
      enterTargets: [heading, root.querySelector('.gallery__intro'), grid].filter(
        (target): target is Element => target instanceof Element,
      ),
    });
  });
}

function createResultLink(
  personality: PersonalityType,
  context: SceneContext,
  signal: AbortSignal,
): HTMLAnchorElement {
  const path = `/r/${personality.slug}`;
  const link = element('a', {
    className: 'gallery__type-link',
    attributes: { href: path },
  });

  link.addEventListener(
    'click',
    (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      event.preventDefault();
      context.navigate(path);
    },
    { signal },
  );
  return link;
}

function findPersonality(
  personalities: readonly PersonalityType[],
  code: TypeCode,
): PersonalityType | undefined {
  return personalities.find((personality) => personality.code === code);
}

function buildQuizUrl(context: SceneContext): string {
  const configuredSite = context.data.config.links.site;
  const url = configuredSite === 'TBD' ? new URL('/', window.location.href) : new URL('/', configuredSite);
  const { source, medium, campaign } = context.data.config.utm;

  url.searchParams.set('utm_source', source);
  url.searchParams.set('utm_medium', medium);
  url.searchParams.set('utm_campaign', campaign);
  return url.href;
}

function formatCode(code: string): string {
  return [...code].join('·');
}
