import { gsap } from 'gsap';

import { scorePersistedAnswers } from '../core/scoring';
import {
  bindPressFeedback,
  createSceneMotion,
  prefersReducedMotion,
} from '../motion/shared';
import { actionButton, element, localizedList } from './dom';
import { FunctionalScene } from './scene';

export function createCalculatingScene(): FunctionalScene {
  return new FunctionalScene('calculating', (root, context, signal) => {
    const code = scorePersistedAnswers(context.store.get().answers);
    context.store.setResult(code);

    const lines = [1, 2, 3, 4].map((line) => context.t(`loading.line${line}`));
    const loadingList = localizedList(lines, 'loading-lines');
    const loadingItems = Array.from(loadingList.children);
    const ovenValue = element('strong', {
      className: 'calculating__temperature',
      text: '45°C',
      attributes: { 'aria-hidden': 'true' },
    });
    const oven = element('div', { className: 'calculating__oven' }, [
      element('span', { className: 'calculating__dial', attributes: { 'aria-hidden': 'true' } }),
      ovenValue,
    ]);
    const illustration = element('img', {
      className: 'calculating__art',
      attributes: {
        src: context.data.sceneArt.continuity.calculating,
        alt: '',
        width: '540',
        height: '960',
        decoding: 'async',
        loading: 'eager',
      },
    });
    const next = actionButton(
      context.t('nav.continue'),
      () => context.navigate(`/r/${code.toLowerCase()}`),
      signal,
      { className: 'button--primary calculating__continue' },
    );
    next.hidden = true;
    const content = element('div', { className: 'scene-content scene-content--center flow' }, [
      element('h1', { text: context.t('loading.title'), attributes: { tabindex: '-1' } }),
      element('div', { className: 'calculating__visual' }, [illustration, oven]),
      loadingList,
      next,
    ]);
    root.setAttribute('aria-label', context.t('loading.a11y'));
    root.append(content);
    bindPressFeedback([next], signal);
    if (!prefersReducedMotion()) {
      gsap.set(loadingItems, { autoAlpha: 0, y: 14 });
    }

    let loadingTimeline: gsap.core.Timeline | null = null;
    const heat = { value: 45 };
    return createSceneMotion(root, {
      enterTargets: [content.querySelector('h1'), illustration, oven].filter(Boolean) as Element[],
      onEnter() {
        if (prefersReducedMotion()) {
          next.hidden = false;
          gsap.set(loadingItems, { autoAlpha: 1 });
          ovenValue.textContent = '180°C';
          oven.style.setProperty('--oven-progress', '1');
          return;
        }

        const lineDuration = context.data.config.loading.lineMs / 1000;
        loadingTimeline = gsap.timeline();
        loadingTimeline.to(heat, {
          value: 180,
          duration: lineDuration * loadingItems.length,
          ease: 'none',
          onUpdate: () => {
            const progress = (heat.value - 45) / 135;
            ovenValue.textContent = `${Math.round(heat.value)}°C`;
            oven.style.setProperty('--oven-progress', String(progress));
            oven.style.setProperty('--oven-angle', `${progress}turn`);
            oven.style.setProperty('--oven-needle-angle', `${-118 + progress * 236}deg`);
          },
        }, 0);

        loadingItems.forEach((item, index) => {
          loadingTimeline?.to(
            item,
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.42,
              ease: 'power2.out',
              clearProps: 'opacity,visibility,transform',
            },
            index * lineDuration,
          );
          if (index + 1 === context.data.config.loading.skippableAfterLine) {
            loadingTimeline?.call(
              () => {
                next.hidden = false;
                gsap.fromTo(
                  next,
                  { autoAlpha: 0, y: 14 },
                  { autoAlpha: 1, y: 0, duration: 0.34, ease: 'power2.out', clearProps: 'all' },
                );
              },
              [],
              (index + 1) * lineDuration,
            );
          }
        });
      },
      onExit() {
        loadingTimeline?.pause();
      },
      onDestroy() {
        loadingTimeline?.kill();
        loadingTimeline = null;
      },
    });
  });
}
