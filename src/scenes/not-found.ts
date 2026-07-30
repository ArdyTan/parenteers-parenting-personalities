import { gsap } from 'gsap';

import { bindPressFeedback, createSceneMotion, prefersReducedMotion } from '../motion/shared';
import { actionButton, element } from './dom';
import { FunctionalScene, type SceneContext } from './scene';

export function createNotFoundScene(): FunctionalScene {
  return new FunctionalScene('notFound', renderNotFound);
}

function renderNotFound(
  root: HTMLElement,
  context: SceneContext,
  signal: AbortSignal,
): ReturnType<typeof createSceneMotion> {
  const art = element('img', {
    className: 'not-found__art',
    attributes: {
      src: '/art/asset-404.webp',
      alt: '',
      width: '720',
      height: '720',
      decoding: 'async',
    },
  });
  const crumbs = element(
    'div',
    { className: 'not-found__crumbs', attributes: { 'aria-hidden': 'true' } },
    Array.from({ length: 12 }, (_, index) =>
      element('i', {
        className: 'not-found__crumb',
        attributes: { 'data-crumb': String(index) },
      }),
    ),
  );
  root.setAttribute('aria-labelledby', 'not-found-title');
  root.appendChild(
    element('div', { className: 'not-found__content' }, [
      crumbs,
      art,
      element('h1', {
        className: 'not-found__title',
        text: context.t('error.notfound_title'),
        attributes: { id: 'not-found-title' },
      }),
      actionButton(
        context.t('error.notfound_cta'),
        () => context.navigate('/', { replace: true }),
        signal,
        { className: 'not-found__cta button--primary' },
      ),
    ]),
  );
  bindPressFeedback(root.querySelectorAll('.button'), signal);
  let crumbTimeline: gsap.core.Timeline | null = null;
  return createSceneMotion(root, {
    enterTargets: [art, root.querySelector('.not-found__title'), root.querySelector('.not-found__cta')].filter(
      (target): target is Element => target instanceof Element,
    ),
    onEnter() {
      if (prefersReducedMotion()) return;
      const pieces = Array.from(crumbs.children);
      crumbTimeline = gsap.timeline({ repeat: -1, repeatDelay: 0.4 });
      crumbTimeline.fromTo(
        pieces,
        {
          x: () => -80 + Math.random() * 160,
          y: () => -30 + Math.random() * 70,
          scale: 0,
          opacity: 0,
        },
        {
          x: () => -120 + Math.random() * 240,
          y: () => 90 + Math.random() * 220,
          rotate: () => -180 + Math.random() * 360,
          scale: () => 0.5 + Math.random(),
          opacity: 0.72,
          duration: () => 1.6 + Math.random() * 1.2,
          stagger: 0.08,
          ease: 'power1.inOut',
        },
      );
    },
    onExit() {
      crumbTimeline?.pause();
    },
    onDestroy() {
      crumbTimeline?.kill();
      crumbTimeline = null;
    },
  });
}
