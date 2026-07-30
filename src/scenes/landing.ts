import { gsap } from 'gsap';

import {
  bindPressFeedback,
  createSceneMotion,
  prefersReducedMotion,
  revealSplitText,
  splitTextForReveal,
} from '../motion/shared';
import { actionButton, element } from './dom';
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

  const timePill = element('p', {
    className: 'landing__time-pill',
    text: context.t('landing.meta_time'),
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
  const hero = element('div', { className: 'landing__hero' }, [
    title,
    element('p', {
      className: 'landing__subtitle',
      text: context.t('landing.subtitle'),
    }),
  ]);

  const metadata = element('ul', { className: 'landing__meta' }, [
    element('li', { className: 'landing__meta-item', text: context.t('landing.meta_time') }),
    element('li', {
      className: 'landing__meta-item',
      text: context.t('landing.meta_questions'),
    }),
    element('li', {
      className: 'landing__meta-item',
      text: context.t('landing.meta_share'),
    }),
  ]);

  const actions = element('div', { className: 'landing__actions' });

  if (hasProgress) {
    const resumeStatus =
      resumeQuestion === undefined
        ? context.t('loading.title')
        : context.t('quiz.progress', {
            n: resumeQuestion,
            total: context.data.questions.length,
          });

    actions.appendChild(
      element('p', { className: 'landing__resume-status', text: resumeStatus }),
    );
    actions.appendChild(
      actionButton(
        context.t('nav.continue'),
        () => {
          context.navigate(resumeQuestion === undefined ? '/baking' : `/q/${resumeQuestion}`);
        },
        signal,
        { className: 'landing__cta landing__cta--resume button--primary' },
      ),
    );
  }

  actions.appendChild(
    actionButton(
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
    ),
  );

  root.setAttribute('aria-labelledby', 'landing-title');
  root.appendChild(
    element('div', { className: 'landing__content' }, [
      timePill,
      hero,
      openingArt,
      metadata,
      actions,
    ]),
  );
  root.appendChild(
    element('p', { className: 'landing__trust', text: context.t('landing.trust') }),
  );

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
    enterTargets: [timePill, hero, openingArt, metadata, actions, root.lastElementChild].filter(
      (target): target is Element => target instanceof Element,
    ),
    onEnter() {
      revealSplitText(titleCharacters);
    },
  });
}
