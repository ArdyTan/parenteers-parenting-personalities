import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';

import { playSfx } from '../core/audio';
import { triggerHaptic } from '../core/haptics';
import { randomizeQuestionAnswers } from '../core/randomize';
import type { Question } from '../core/quiz-types';
import {
  bindPressFeedback,
  burstAt,
  createSceneMotion,
  prefersReducedMotion,
} from '../motion/shared';
import { actionButton, element, sceneBody, sceneBottom, sceneCaption } from './dom';
import { FunctionalScene, type SceneContext } from './scene';

gsap.registerPlugin(Flip);

export function createQuestionScene(question: Question): FunctionalScene {
  return new FunctionalScene('question', (root, context, signal) => {
    const { lang, answers } = context.store.get();
    const randomized = randomizeQuestionAnswers(question);
    let selectedPole = answers.find(({ q }) => q === question.id)?.pole;

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
      () => context.navigate(backPath),
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
      const labelKey = index === 0 ? 'quiz.answer_a_label' : 'quiz.answer_b_label';
      const button = element('button', {
        className: 'answer-card',
        attributes: {
          type: 'button',
          'aria-pressed': String(selectedPole === answer.pole),
          'data-pole': answer.pole,
        },
      }, [
        element('span', { className: 'answer-card__label', text: context.t(labelKey) }),
        element('span', { className: 'answer-card__copy', text: answer[lang] }),
      ]);

      button.addEventListener(
        'click',
        () => selectAnswer(answer.pole, button),
        { signal },
      );

      return button;
    });

    // One always-present CTA. Its label carries the affordance instead of a
    // separate "change answer" link, which is what used to shove the button
    // around as the answer state flipped.
    const nextPath = question.id === 12 ? '/baking' : `/q/${question.id + 1}`;
    const next = actionButton(
      context.t('quiz.cta_pick'),
      () => context.navigate(nextPath),
      signal,
      { className: 'button--primary question__cta' },
    );

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
    const stack = element('div', { className: 'question__stack' }, [
      element('h1', {
        className: 'question__title',
        text: question.scenario[lang],
        attributes: { tabindex: '-1' },
      }),
      answerGrid,
    ]);

    root.append(
      sceneBody('question__body', [indicator, artBand, stack]),
      sceneBottom('question__bottom', [next, instruction]),
      exitDialog,
    );

    let answerStateInitialized = false;
    updateAnswerState();
    bindPressFeedback(root.querySelectorAll('.button, .answer-card'), signal);
    answerButtons.forEach((button) => bindAnswerGesture(button));
    bindBackEdgeGesture();

    function updateAnswerState(): void {
      const flipState = answerStateInitialized && !prefersReducedMotion()
        ? Flip.getState([answerGrid])
        : null;
      answerButtons.forEach((button) => {
        const selected = button.dataset.pole === selectedPole;
        button.classList.toggle('is-selected', selected);
        button.setAttribute('aria-pressed', String(selected));
        if (selected && !prefersReducedMotion()) {
          gsap.fromTo(
            button,
            { scale: 0.98 },
            {
              scale: 1,
              duration: 0.5,
              ease: 'elastic.out(1, 0.55)',
              clearProps: 'transform',
            },
          );
        }
      });
      const pending = selectedPole === undefined;
      next.disabled = pending;
      next.setAttribute('aria-disabled', String(pending));
      const label = context.t(pending ? 'quiz.cta_pick' : 'nav.next');
      const labelHost = next.querySelector('.async-button__label') ?? next;
      if (labelHost.textContent !== label) labelHost.textContent = label;
      if (flipState) {
        Flip.from(flipState, {
          duration: 0.38,
          ease: 'power2.out',
          absolute: false,
          nested: true,
          prune: true,
        });
      }
      answerStateInitialized = true;
    }

    function selectAnswer(pole: typeof selectedPole, button: HTMLButtonElement): void {
      if (!pole) return;
      selectedPole = pole;
      context.store.upsertAnswer({ q: question.id, pole });
      updateAnswerState();
      const rect = button.getBoundingClientRect();
      // Visual pulse, haptic tick and audio cue stay paired (conventions.md §1).
      // The tick used to ride the removed WebGL burst listener in app.ts; it
      // belongs here, next to the burst it accompanies.
      burstAt(button, rect.width / 2, rect.height / 2);
      triggerHaptic('tick');
      // A swipe-to-choose reaches this same path, so the selection cue covers
      // both input styles; layering a swipe whoosh on top only muddies it.
      playSfx('select');
    }

    function bindAnswerGesture(button: HTMLButtonElement): void {
      let pointerId = -1;
      let startX = 0;
      let startY = 0;
      let startTime = 0;
      let dragging = false;

      button.addEventListener(
        'pointerdown',
        (event) => {
          if (!event.isPrimary) return;
          pointerId = event.pointerId;
          startX = event.clientX;
          startY = event.clientY;
          startTime = performance.now();
          dragging = false;
          button.setPointerCapture(pointerId);
        },
        { signal },
      );
      button.addEventListener(
        'pointermove',
        (event) => {
          if (event.pointerId !== pointerId) return;
          const dx = event.clientX - startX;
          const dy = event.clientY - startY;
          if (!dragging && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) dragging = true;
          if (!dragging) return;
          gsap.set(button, { x: dx, rotate: dx * 0.025 });
        },
        { signal },
      );
      button.addEventListener(
        'pointerup',
        (event) => {
          if (event.pointerId !== pointerId) return;
          const dx = event.clientX - startX;
          const elapsed = Math.max(1, performance.now() - startTime);
          const velocity = Math.abs(dx) / elapsed;
          const shouldChoose = dragging && (Math.abs(dx) > 64 || velocity > 0.55);

          if (shouldChoose) {
            selectAnswer(button.dataset.pole as typeof selectedPole, button);
          }
          gsap.to(button, {
            x: 0,
            rotate: 0,
            duration: prefersReducedMotion() ? 0 : 0.52,
            ease: 'elastic.out(1, 0.55)',
            clearProps: 'transform',
          });
          pointerId = -1;
          dragging = false;
        },
        { signal },
      );
    }

    function bindBackEdgeGesture(): void {
      let edgePointer = -1;
      let edgeStart = 0;
      root.addEventListener(
        'pointerdown',
        (event) => {
          const rect = root.getBoundingClientRect();
          if (!event.isPrimary || event.clientX - rect.left > 24) return;
          edgePointer = event.pointerId;
          edgeStart = event.clientX;
        },
        { signal },
      );
      root.addEventListener(
        'pointerup',
        (event) => {
          if (event.pointerId !== edgePointer) return;
          if (event.clientX - edgeStart > 72) context.navigate(backPath);
          edgePointer = -1;
        },
        { signal },
      );
    }

    const currentStop = progressStops.children.item(question.id - 1);

    return createSceneMotion(root, {
      enterTargets: [
        indicator,
        scenarioArt,
        root.querySelector('.question__title'),
        ...answerButtons,
        root.querySelector('.question__bottom'),
      ].filter((target): target is Element => target instanceof Element),
      onEnter() {
        if (prefersReducedMotion() || !currentStop) return;
        // The star for this question pops in — the rail is a better home for the
        // "one more step" beat than a rolling digit ever was.
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
      },
    });
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
