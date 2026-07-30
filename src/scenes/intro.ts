import { actionButton, element, localizedList } from './dom';
import { bindPressFeedback, createSceneMotion } from '../motion/shared';
import { FunctionalScene, type SceneContext } from './scene';

export function createIntroScene(): FunctionalScene {
  return new FunctionalScene('intro', renderIntro);
}

function renderIntro(
  root: HTMLElement,
  context: SceneContext,
  signal: AbortSignal,
): ReturnType<typeof createSceneMotion> {
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

  const disclaimer = element('p', {
    className: 'intro__disclaimer',
    text: context.t('intro.disclaimer_short'),
  });
  const begin = actionButton(
    context.t('intro.cta_begin'),
    () => context.navigate('/q/1'),
    signal,
    { className: 'intro__cta button--primary' },
  );

  root.setAttribute('aria-labelledby', 'intro-title');
  const illustration = element('img', {
    className: 'intro__art',
    attributes: {
      src: context.data.sceneArt.continuity.intro,
      alt: '',
      width: '540',
      height: '960',
      decoding: 'async',
      loading: 'eager',
    },
  });
  root.appendChild(
    element('div', { className: 'intro__content' }, [
      title,
      illustration,
      points,
      element('div', { className: 'intro__actions' }, [begin, disclaimer]),
    ]),
  );
  bindPressFeedback(root.querySelectorAll('.button, .intro__point'), signal);
  return createSceneMotion(root, {
    enterTargets: [title, illustration, ...Array.from(points.children), root.querySelector('.intro__actions')].filter(
      (target): target is Element => target instanceof Element,
    ),
  });
}
