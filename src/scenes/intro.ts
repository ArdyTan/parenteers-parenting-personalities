import { gsap } from 'gsap';

import {
  actionButton,
  element,
  localizedList,
  sceneBody,
  sceneBottom,
  sceneCaption,
} from './dom';
import { bindPressFeedback, createSceneMotion, prefersReducedMotion } from '../motion/shared';
import { FunctionalScene, type SceneContext } from './scene';

export function createIntroScene(): FunctionalScene {
  return new FunctionalScene('intro', renderIntro);
}

function renderIntro(
  root: HTMLElement,
  context: SceneContext,
  signal: AbortSignal,
): ReturnType<typeof createSceneMotion> {
  // Full-bleed 3:2 band. The source is a native 720x480 derivative whose canvas
  // is already `#FEF2E1`, so the band needs no mask and crops nothing.
  const illustration = element('img', {
    className: 'intro__art',
    attributes: {
      src: context.data.sceneArt.continuity.intro,
      alt: '',
      width: '720',
      height: '480',
      decoding: 'async',
      loading: 'eager',
      fetchpriority: 'high',
    },
  });

  const title = element('h1', {
    className: 'intro__title',
    text: context.t('intro.h2'),
    attributes: { id: 'intro-title' },
  });
  const points = localizedList(
    [context.t('intro.point1'), context.t('intro.point2'), context.t('intro.point3')],
    'intro__points',
  );
  for (const point of points.children) {
    point.classList.add('intro__point');
  }

  // The band centres the illustration in whatever space the copy leaves and
  // clips it symmetrically if that space is tight — the image itself is never
  // scaled up or down from its native 3:2.
  const artBand = element('figure', { className: 'intro__art-band' }, [illustration]);
  const header = element('div', { className: 'intro__header' }, [title, points]);

  const begin = actionButton(
    context.t('intro.cta_begin'),
    () => context.navigate('/q/1'),
    signal,
    { className: 'intro__cta button--primary' },
  );
  const bottom = sceneBottom('intro__bottom', [
    begin,
    sceneCaption(context.t('intro.disclaimer_short'), 'intro__caption'),
  ]);

  root.setAttribute('aria-labelledby', 'intro-title');
  root.append(sceneBody('intro__body', [artBand, header]), bottom);

  bindPressFeedback(root.querySelectorAll('.button, .intro__point'), signal);

  return createSceneMotion(root, {
    enterTargets: [illustration, title, ...Array.from(points.children), bottom],
    onEnter() {
      if (prefersReducedMotion()) return;
      // Each numbered bullet proofs up like dough after its line lands.
      gsap.fromTo(
        points.querySelectorAll('.intro__point'),
        { scale: 0.94 },
        {
          scale: 1,
          duration: 0.5,
          stagger: 0.07,
          ease: 'elastic.out(1, 0.6)',
          clearProps: 'transform',
        },
      );
    },
  });
}
