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
  const state = context.store.get();
  const answeredQuestions = new Set(state.answers.map(({ q }) => q));
  const resumeQuestion = context.data.questions.find(
    ({ id }) => !answeredQuestions.has(id),
  )?.id;
  const hasProgress = state.answers.length > 0;

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
      className: `landing__cta landing__cta--start ${
        hasProgress ? 'button--secondary' : 'button--primary'
      }`,
    },
  );

  const bottomChildren: HTMLElement[] = [];

  if (hasProgress) {
    const resumeStatus =
      resumeQuestion === undefined
        ? context.t('loading.title')
        : context.t('quiz.progress', {
            n: resumeQuestion,
            total: context.data.questions.length,
          });

    bottomChildren.push(
      actionButton(
        context.t('nav.continue'),
        () => {
          context.navigate(resumeQuestion === undefined ? '/baking' : `/q/${resumeQuestion}`);
        },
        signal,
        { className: 'landing__cta landing__cta--resume button--primary' },
      ),
      element('p', { className: 'landing__resume-status', text: resumeStatus }),
    );
  }

  bottomChildren.push(startButton, sceneCaption(context.t('landing.trust'), 'landing__caption'));

  // Header first, art second: the art fills whatever the copy leaves, so the
  // subtitle can never end up printed over the illustration.
  const body = sceneBody('landing__body', [header, openingArt]);
  const bottom = sceneBottom('landing__bottom', bottomChildren);

  root.setAttribute('aria-labelledby', 'landing-title');
  root.append(body, bottom);

  bindPressFeedback(root.querySelectorAll('.button'), signal);

  if (!prefersReducedMotion()) {
    const moveArt = (event: PointerEvent): void => {
      if (!event.isPrimary) return;
      const rect = openingArt.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      gsap.to(openingArt, {
        rotateY: x * 2.2,
        rotateX: -y * 1.8,
        x: x * 3,
        y: y * 3,
        duration: 0.55,
        ease: 'power2.out',
        overwrite: true,
      });
    };
    root.addEventListener('pointermove', moveArt, { signal });
    window.addEventListener(
      'deviceorientation',
      (event) => {
        if (event.gamma === null || event.beta === null) return;
        gsap.to(openingArt, {
          rotateY: Math.max(-3.5, Math.min(3.5, event.gamma * 0.08)),
          rotateX: Math.max(-2.5, Math.min(2.5, (event.beta - 45) * -0.04)),
          duration: 0.65,
          ease: 'power2.out',
          overwrite: true,
        });
      },
      { signal },
    );
  }

  return createSceneMotion(root, {
    enterTargets: [eyebrow, title, subtitle, openingArt, bottom],
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
