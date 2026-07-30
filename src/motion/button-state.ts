import { gsap } from 'gsap';

import { triggerHaptic } from '../core/haptics';
import { prefersReducedMotion } from './shared';

export type AsyncButtonResultState = 'success' | 'error' | 'idle';

export type AsyncButtonController = Readonly<{
  run: <T>(
    task: () => Promise<T>,
    classify?: (result: T) => AsyncButtonResultState,
  ) => Promise<T | undefined>;
}>;

export function createAsyncButtonController(
  button: HTMLButtonElement,
  signal: AbortSignal,
): AsyncButtonController {
  button.classList.add('async-button');
  const label = document.createElement('span');
  label.className = 'async-button__label';
  label.textContent = button.textContent ?? '';

  const spinner = document.createElement('span');
  spinner.className = 'async-button__spinner';
  spinner.setAttribute('aria-hidden', 'true');

  const tick = document.createElement('span');
  tick.className = 'async-button__tick';
  tick.textContent = '✓';
  tick.setAttribute('aria-hidden', 'true');

  button.replaceChildren(label, spinner, tick);
  let revision = 0;
  let active: gsap.core.Timeline | null = null;
  let settle: gsap.core.Tween | null = null;

  const setState = (state: 'idle' | 'loading' | 'success' | 'error'): void => {
    active?.kill();
    settle?.kill();
    button.dataset.state = state;
    button.setAttribute('aria-busy', String(state === 'loading'));
    button.disabled = state === 'loading';

    const reduced = prefersReducedMotion();
    active = gsap.timeline();
    if (state === 'loading') {
      active
        .to(label, { autoAlpha: 0, scale: 0.88, duration: reduced ? 0 : 0.16 }, 0)
        .fromTo(
          spinner,
          { autoAlpha: 0, rotate: 0 },
          {
            autoAlpha: 1,
            rotate: 360,
            duration: reduced ? 0 : 0.72,
            repeat: reduced ? 0 : -1,
            ease: 'none',
          },
          0,
        );
      return;
    }

    gsap.set(spinner, { autoAlpha: 0, rotate: 0 });
    if (state === 'success') {
      triggerHaptic('tick');
      active
        .fromTo(
          tick,
          { autoAlpha: 0, scale: 0.55 },
          {
            autoAlpha: 1,
            scale: 1,
            duration: reduced ? 0 : 0.36,
            ease: 'back.out(1.6)',
          },
        )
        .fromTo(
          button,
          { scale: reduced ? 1 : 0.96 },
          { scale: 1, duration: reduced ? 0 : 0.34, ease: 'back.out(1.4)' },
          0,
        );
    } else if (state === 'error') {
      triggerHaptic('boundary');
      active
        .set(label, { autoAlpha: 1, scale: 1 })
        .fromTo(
          button,
          { x: reduced ? 0 : -8 },
          { x: 0, duration: reduced ? 0 : 0.42, ease: 'elastic.out(1.4, 0.35)' },
        );
    } else {
      active.to(label, {
        autoAlpha: 1,
        scale: 1,
        duration: reduced ? 0 : 0.18,
      });
      gsap.set(tick, { autoAlpha: 0, scale: 0.55 });
      button.removeAttribute('data-state');
      button.removeAttribute('aria-busy');
    }

    if (state === 'success' || state === 'error') {
      settle = gsap.delayedCall(reduced ? 0.35 : 1.25, () => setState('idle'));
    }
  };

  const run = async <T>(
    task: () => Promise<T>,
    classify: (result: T) => AsyncButtonResultState = () => 'success',
  ): Promise<T | undefined> => {
    if (button.dataset.state === 'loading' || signal.aborted) return undefined;
    const current = ++revision;
    setState('loading');

    try {
      const result = await task();
      if (signal.aborted || current !== revision) return result;
      setState(classify(result));
      return result;
    } catch (error) {
      if (!signal.aborted && current === revision) setState('error');
      throw error;
    }
  };

  signal.addEventListener(
    'abort',
    () => {
      revision += 1;
      active?.kill();
      settle?.kill();
      gsap.killTweensOf([button, label, spinner, tick]);
    },
    { once: true },
  );

  return { run };
}
