import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';

import { randomizeQuestionAnswers } from '../core/randomize';
import type { Question } from '../core/quiz-types';
import {
  bindPressFeedback,
  burstAt,
  createSceneMotion,
  prefersReducedMotion,
} from '../motion/shared';
import { actionButton, element } from './dom';
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
            index + 1 < question.id
              ? ' is-complete'
              : index + 1 === question.id
                ? ' is-current'
                : ''
          }`,
        }),
      ),
    );
    const progressLabel = element('p', {
      className: 'eyebrow quiz-progress__label',
      attributes: { 'aria-label': progressText },
    });
    const progressMarker = String(question.id);
    const markerIndex = progressText.indexOf(progressMarker);
    const progressPrefix = markerIndex >= 0 ? progressText.slice(0, markerIndex) : progressText;
    const progressSuffix = markerIndex >= 0
      ? progressText.slice(markerIndex + progressMarker.length)
      : '';
    const oldProgressNumber = element('span', {
      className: 'quiz-progress__number quiz-progress__number--old',
      text: String(Math.max(0, question.id - 1)),
    });
    const currentProgressNumber = element('span', {
      className: 'quiz-progress__number quiz-progress__number--current',
      text: progressMarker,
    });
    const numberWindow = element(
      'span',
      { className: 'quiz-progress__number-window', attributes: { 'aria-hidden': 'true' } },
      [oldProgressNumber, currentProgressNumber],
    );
    progressLabel.append(
      document.createTextNode(progressPrefix),
      numberWindow,
      document.createTextNode(progressSuffix),
    );

    const backPath = question.id === 1 ? '/intro' : `/q/${question.id - 1}`;
    const back = actionButton(
      context.t('nav.back'),
      () => context.navigate(backPath),
      signal,
      {
        className: 'scene-toolbar__icon button--icon',
        attributes: { 'aria-label': context.t('nav.back') },
      },
    );
    back.textContent = '←';

    const exitDialog = createExitDialog(context, signal);
    const close = actionButton(
      context.t('nav.close'),
      () => openDialog(exitDialog),
      signal,
      {
        className: 'scene-toolbar__icon button--icon',
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

    const change = actionButton(
      context.t('quiz.change_answer'),
      () => {
        selectedPole = undefined;
        context.store.set(({ answers: currentAnswers }) => ({
          answers: currentAnswers.filter(({ q }) => q !== question.id),
        }));
        updateAnswerState();
      },
      signal,
      { className: 'button--text' },
    );

    const nextPath = question.id === 12 ? '/baking' : `/q/${question.id + 1}`;
    const next = actionButton(
      context.t('nav.next'),
      () => {
        if (question.id === 6 || question.id === 9) {
          context.presentInterstitial(question.id, nextPath);
        } else {
          context.navigate(nextPath);
        }
      },
      signal,
      { className: 'button--primary' },
    );

    const controls = element('div', { className: 'scene-actions' }, [change, next]);
    const answerGrid = element('div', { className: 'answer-grid' }, answerButtons);

    const progressRail = element('div', { className: 'quiz-progress__rail' }, [
      progress,
      progressStops,
    ]);

    root.append(
      element('header', { className: 'scene-toolbar' }, [back, progressLabel, close]),
      progressRail,
      element('div', { className: 'scene-content flow' }, [
        element('h1', { text: question.scenario[lang], attributes: { tabindex: '-1' } }),
        element('p', { className: 'scene-lead', text: context.t('quiz.select_hint') }),
        scenarioArt,
        answerGrid,
        controls,
      ]),
      exitDialog,
    );

    let answerStateInitialized = false;
    updateAnswerState();
    bindPressFeedback(root.querySelectorAll('.button, .answer-card'), signal);
    answerButtons.forEach((button) => bindAnswerGesture(button));
    bindBackEdgeGesture();

    function updateAnswerState(): void {
      const flipState = answerStateInitialized && !prefersReducedMotion()
        ? Flip.getState([answerGrid, controls])
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
      controls.hidden = selectedPole === undefined;
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
      burstAt(button, rect.width / 2, rect.height / 2);
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

    return createSceneMotion(root, {
      enterTargets: [
        root.querySelector('.scene-toolbar'),
        progressRail,
        root.querySelector('.scene-content > h1'),
        root.querySelector('.scene-lead'),
        scenarioArt,
        ...answerButtons,
      ].filter((target): target is Element => target instanceof Element),
      onEnter() {
        if (prefersReducedMotion()) {
          oldProgressNumber.hidden = true;
          return;
        }
        gsap.set(currentProgressNumber, { yPercent: 110 });
        gsap.timeline({
          defaults: { duration: 0.46, ease: 'power3.out' },
          onComplete: () => {
            oldProgressNumber.hidden = true;
            gsap.set(currentProgressNumber, { clearProps: 'transform' });
          },
        })
          .to(oldProgressNumber, { yPercent: -110 }, 0)
          .to(currentProgressNumber, { yPercent: 0 }, 0);
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
