import { gsap } from 'gsap';

import {
  bindPressFeedback,
  createSceneMotion,
  prefersReducedMotion,
  revealSplitText,
  splitTextForReveal,
} from '../motion/shared';
import { actionButton, element, sceneBody, sceneBottom, sceneCaption } from './dom';
import { FunctionalScene, type SceneContext } from './scene';

export function createLandingScene(): FunctionalScene {
  return new FunctionalScene('landing', renderLanding);
}

function renderLanding(
  root: HTMLElement,
  context: SceneContext,
  signal: AbortSignal,
): ReturnType<typeof createSceneMotion> {
  // `Capsules-warm`: the eyebrow slot the design file puts above the headline.
  // The 3-minute line it used to hold now sits under the CTA as plain text.
  const eyebrow = element('p', {
    className: 'landing__eyebrow',
    text: context.t('landing.eyebrow'),
  });

  const openingArt = element('figure', { className: 'landing__art' }, [
    element('img', {
      className: 'landing__art-image',
      attributes: {
        src: context.data.sceneArt.continuity.landing,
        alt: '',
        width: '540',
        height: '960',
        decoding: 'async',
        loading: 'eager',
        fetchpriority: 'high',
      },
    }),
  ]);

  const title = element('h1', {
    className: 'landing__title',
    text: context.t('landing.h1'),
    attributes: { id: 'landing-title' },
  });
  const titleCharacters = splitTextForReveal(title);
  const subtitle = element('p', {
    className: 'landing__subtitle',
    text: context.t('landing.subtitle'),
  });
  const header = element('div', { className: 'landing__header' }, [
    eyebrow,
    title,
    subtitle,
  ]);

  const startButton = actionButton(
    context.t('landing.cta_start'),
    () => {
      context.store.clearAnswers();
      context.store.clearResult();
      context.navigate('/intro');
    },
    signal,
    {
      className: 'landing__cta landing__cta--start button--primary',
    },
  );

  // Header first, art second: the art fills whatever the copy leaves, so the
  // subtitle can never end up printed over the illustration.
  const body = sceneBody('landing__body', [header, openingArt]);
  const bottom = sceneBottom('landing__bottom', [
    startButton,
    sceneCaption(context.t('landing.trust'), 'landing__caption'),
  ]);

  root.setAttribute('aria-labelledby', 'landing-title');
  root.append(body, bottom);

  bindPressFeedback(root.querySelectorAll('.button'), signal);

  return createSceneMotion(root, {
    // Keep the artwork visible independently of the entrance timeline.
    // It stays static so the full-bleed band cannot reveal a tilted edge.
    enterTargets: [eyebrow, title, subtitle, bottom],
    onEnter() {
      revealSplitText(titleCharacters);
      if (prefersReducedMotion()) return;
      // The warm capsule lands with a little pop so the first thing on screen
      // already reads as playful rather than administrative.
      gsap.fromTo(
        eyebrow,
        { scale: 0.86 },
        { scale: 1, duration: 0.62, ease: 'elastic.out(1, 0.5)', clearProps: 'transform' },
      );
    },
  });
}
