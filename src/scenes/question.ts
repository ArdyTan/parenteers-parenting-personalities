import { gsap } from 'gsap';
import { playSfx } from '../core/audio';
import { triggerHaptic } from '../core/haptics';
import { randomizeQuestionAnswers } from '../core/randomize';
import type { Question, QuestionAnswer } from '../core/quiz-types';
import { createAnswerSwipe, type AnswerSide } from '../gestures/answer-swipe';
import {
  bindPressFeedback,
  burstAt,
  createSceneMotion,
  prefersReducedMotion,
} from '../motion/shared';
import { actionButton, element, sceneBody, sceneBottom, sceneCaption } from './dom';
import { FunctionalScene, type SceneContext } from './scene';

export function createQuestionScene(question: Question): FunctionalScene {
  return new FunctionalScene('question', (root, context, signal) => {
    const { lang, answers } = context.store.get();
    const randomized = randomizeQuestionAnswers(question);
    const savedPole = answers.find(({ q }) => q === question.id)?.pole;
    let committing = false;
    let exitSide: AnswerSide | null = null;

    const progressText = context.t('quiz.progress', { n: question.id, total: 12 });
    const progress = element('progress', {
      className: 'quiz-progress__bar',
      attributes: {
        value: String(question.id),
        max: '12',
        'aria-label': context.t('a11y.progressbar', { n: question.id, total: 12 }),
      },
    });
    const progressStops = element(
      'div',
      { className: 'quiz-progress__stops', attributes: { 'aria-hidden': 'true' } },
      Array.from({ length: 12 }, (_, index) =>
        element('span', {
          className: `quiz-progress__stop${
            index + 1 <= question.id ? ' is-complete' : ''
          }`,
        }),
      ),
    );
    // One text node, matching the design file's `indicator-text`. The old
    // rolling-number window put the digit in its own inline-grid box, which is
    // what knocked it off the label's baseline.
    const progressLabel = element('p', {
      className: 'quiz-progress__label',
      text: progressText,
    });

    const backPath = question.id === 1 ? '/intro' : `/q/${question.id - 1}`;
    const back = actionButton(
      context.t('nav.back'),
      () => { if (!committing) context.navigate(backPath); },
      signal,
      {
        className: 'quiz-indicator__back button--icon',
        attributes: { 'aria-label': context.t('nav.back') },
      },
    );
    back.textContent = `← ${context.t('nav.back')}`;

    const exitDialog = createExitDialog(context, signal);
    const close = actionButton(
      context.t('nav.close'),
      () => openDialog(exitDialog),
      signal,
      {
        className: 'quiz-indicator__close button--icon',
        attributes: { 'aria-label': context.t('nav.close') },
      },
    );
    close.textContent = '×';

    const art = context.data.sceneArt.questions.find(({ id }) => id === question.id);
    const scenarioArt = element('img', {
      className: 'question__art',
      attributes: {
        src: art?.image ?? '',
        alt: '',
        width: '720',
        height: '480',
        decoding: 'async',
        loading: 'eager',
        fetchpriority: 'high',
        style: `object-position: ${art?.objectPosition ?? 'center'}`,
      },
    });

    const answerButtons = randomized.answers.map((answer, index) => {
      const side: AnswerSide = index === 0 ? 'left' : 'right';
      const button = element('button', {
        className: `answer-card${savedPole === answer.pole ? ' is-selected' : ''}`,
        attributes: {
          type: 'button',
          'aria-label': context.t(index === 0 ? 'a11y.answer_left' : 'a11y.answer_right', { answer: answer[lang] }),
          'aria-pressed': String(savedPole === answer.pole),
          'data-pole': answer.pole,
          'data-side': side,
        },
      }, [
        element('span', { className: 'answer-card__label', text: index === 0 ? '←' : '→', attributes: { 'aria-hidden': 'true' } }),
        element('span', { className: 'answer-card__copy', text: answer[lang] }),
        ...(savedPole === answer.pole ? [element('span', { className: 'answer-card__previous', text: context.t('quiz.previous_answer'), attributes: { 'aria-hidden': 'true' } })] : []),
      ]);

      button.addEventListener('click', () => commitAnswer(answer, side), { signal });

      return button;
    });

    const nextPath = question.id === 12 ? '/baking' : `/q/${question.id + 1}`;

    const title = element('h1', {
      className: 'question__title',
      text: question.scenario[lang],
      attributes: { tabindex: '-1' },
    });
    // The reference headline is ~20 characters; the real prompts run to 74. Two
    // step-downs keep even the longest scenario inside three lines so the art
    // band, the answers and the CTA all still fit a short phone viewport.
    const scenarioLength = question.scenario[lang].length;
    if (scenarioLength > 58) title.dataset.scale = 'sm';
    else if (scenarioLength > 40) title.dataset.scale = 'md';

    const answerGrid = element('div', { className: 'answer-grid' }, answerButtons);
    const instruction = sceneCaption(context.t('quiz.select_hint'), 'question__instruction');

    // Centres the scenario art in whatever space the headline and answers leave,
    // clipping symmetrically rather than rescaling the illustration.
    const artBand = element('figure', { className: 'question__art-band' }, [scenarioArt]);

    const progressRail = element('div', { className: 'quiz-progress__rail' }, [
      progress,
      progressStops,
    ]);
    const indicator = element('div', { className: 'quiz-indicator' }, [
      element('div', { className: 'quiz-indicator__row' }, [back, progressLabel, close]),
      progressRail,
    ]);
    const stack = element('div', { className: 'question__stack' }, [title]);
    const card = element('div', { className: 'question__card' }, [artBand, stack]);
    const peek = element('div', { className: 'question__peek', attributes: { 'aria-hidden': 'true' } });
    const deck = element('div', { className: 'question__deck' }, [peek, card]);
    const bottom = sceneBottom('question__bottom', [answerGrid, instruction]);

    root.append(
      sceneBody('question__body', [indicator, deck]),
      bottom,
      exitDialog,
    );

    bindPressFeedback(root.querySelectorAll('.button, .answer-card'), signal);
    const swipe = createAnswerSwipe(card, root, {
      preview(dx, side, dragging) {
        if (committing || signal.aborted) return;
        gsap.killTweensOf(card);
        if (!prefersReducedMotion()) gsap.set(card, { x: dx, rotate: Math.max(-8, Math.min(8, dx * 0.045)) });
        peek.classList.toggle('is-revealed', dragging);
        answerButtons.forEach((button) => button.classList.toggle('is-preview', button.dataset.side === side));
        instruction.textContent = side ? context.t('quiz.release_hint') : context.t('quiz.select_hint');
      },
      commit(side) {
        commitAnswer(randomized.answers[side === 'left' ? 0 : 1], side);
      },
      cancel() {
        if (committing || signal.aborted) return;
        answerButtons.forEach((button) => button.classList.remove('is-preview'));
        instruction.textContent = context.t('quiz.select_hint');
        peek.classList.remove('is-revealed');
        gsap.to(card, { x: 0, rotate: 0, duration: prefersReducedMotion() ? 0 : 0.2, ease: 'power2.out', overwrite: true });
      },
    });
    swipe.attach();
    const cancelDrag = () => { if (!signal.aborted && swipe.activePointerId !== null) { swipe.detach(); swipe.attach(); } };
    window.addEventListener('resize', cancelDrag, { signal });
    document.addEventListener('visibilitychange', cancelDrag, { signal });

    function commitAnswer(answer: QuestionAnswer, side: AnswerSide): void {
      if (committing || signal.aborted) return;
      committing = true;
      exitSide = side;
      context.store.upsertAnswer({ q: question.id, pole: answer.pole });
      answerButtons.forEach((button) => {
        const chosen = button.dataset.pole === answer.pole;
        button.classList.toggle('is-selected', chosen);
        button.classList.remove('is-preview');
        button.setAttribute('aria-pressed', String(chosen));
      });
      const button = answerButtons[side === 'left' ? 0 : 1]!;
      const rect = button.getBoundingClientRect();
      burstAt(button, rect.width / 2, rect.height / 2);
      triggerHaptic('tick');
      playSfx('select');
      context.navigate(nextPath);
    }

    const currentStop = progressStops.children.item(question.id - 1);

    function animateStar(): void {
      if (signal.aborted || committing || prefersReducedMotion() || !currentStop) return;
      gsap.fromTo(
        currentStop,
        { scale: 0.2, rotate: -35, opacity: 0.2 },
        {
          scale: 1,
          rotate: 0,
          opacity: 1,
          duration: 0.62,
          ease: 'elastic.out(1, 0.48)',
          clearProps: 'transform,opacity',
        },
      );
      const bounds = currentStop.getBoundingClientRect();
      const railBounds = progressRail.getBoundingClientRect();
      burstAt(
        progressRail,
        bounds.left - railBounds.left + bounds.width / 2,
        bounds.top - railBounds.top + bounds.height / 2,
      );
    }

    const motion = createSceneMotion(root, {
      enterTargets: [
        indicator,
        card,
        title,
        ...answerButtons,
        bottom,
      ],
      onEnter: animateStar,
      onDestroy() { swipe.detach(); },
    });
    return {
      ...motion,
      enter(from) {
        if (from !== 'question') return motion.enter?.(from);
        return new Promise<void>((resolve) => {
          gsap.fromTo(
            [indicator, card, bottom],
            { opacity: 0 },
            {
              opacity: 1,
              duration: prefersReducedMotion() ? 0 : 0.08,
              ease: 'power2.out',
              onComplete() { animateStar(); resolve(); },
              onInterrupt: resolve,
            },
          );
        });
      },
      exit(to) {
        if (exitSide === null || (to !== 'question' && to !== 'calculating')) {
          return motion.exit?.(to);
        }
        return new Promise<void>((resolve) => {
          gsap.to(card, {
            x: prefersReducedMotion() ? 0 : (exitSide === 'left' ? -root.clientWidth : root.clientWidth),
            rotate: prefersReducedMotion() ? 0 : (exitSide === 'left' ? -8 : 8),
            opacity: 0,
            duration: prefersReducedMotion() ? 0 : 0.1,
            ease: 'power2.in',
            overwrite: 'auto',
            onComplete: resolve,
            onInterrupt: resolve,
          });
        });
      },
    };
  });
}

function createExitDialog(
  context: SceneContext,
  signal: AbortSignal,
): HTMLDialogElement {
  const dialog = element('dialog', { className: 'exit-dialog' });
  const stay = actionButton(
    context.t('quiz.exit_confirm_stay'),
    () => closeDialog(dialog),
    signal,
    { className: 'button--primary' },
  );
  const leave = actionButton(
    context.t('quiz.exit_confirm_leave'),
    () => {
      context.store.clearAnswers();
      context.store.clearResult();
      closeDialog(dialog);
      context.navigate('/');
    },
    signal,
    { className: 'button--text' },
  );

  dialog.append(
    element('div', { className: 'dialog-card flow' }, [
      element('h2', { text: context.t('quiz.exit_confirm_title') }),
      element('p', { text: context.t('quiz.exit_confirm_body') }),
      element('div', { className: 'scene-actions' }, [stay, leave]),
    ]),
  );
  dialog.addEventListener('cancel', () => closeDialog(dialog), { signal });
  return dialog;
}

function openDialog(dialog: HTMLDialogElement): void {
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
  const card = dialog.querySelector('.dialog-card');
  if (card) {
    gsap.fromTo(
      card,
      { autoAlpha: 0, y: prefersReducedMotion() ? 0 : 34, scale: prefersReducedMotion() ? 1 : 0.96 },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: prefersReducedMotion() ? 0 : 0.36,
        ease: 'power3.out',
        clearProps: 'opacity,visibility,transform',
      },
    );
  }
}

function closeDialog(dialog: HTMLDialogElement): void {
  if (typeof dialog.close === 'function' && dialog.open) dialog.close();
  else dialog.removeAttribute('open');
}
