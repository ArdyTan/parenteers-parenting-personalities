import { gsap } from 'gsap';

import { BRAND_ASSETS } from '../core/brand';
import { prefersReducedMotion } from './shared';

export async function runExperiencePreloader(
  runtime: HTMLElement,
  label: string,
  illustrationSource: string,
): Promise<void> {
  const overlay = document.createElement('div');
  overlay.className = 'experience-preloader';
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-live', 'polite');
  overlay.setAttribute('aria-label', label);

  const logo = document.createElement('img');
  logo.className = 'experience-preloader__logo';
  logo.src = BRAND_ASSETS.wordmarkBlue;
  logo.alt = '';
  logo.width = 572;
  logo.height = 86;

  const temperature = document.createElement('strong');
  temperature.className = 'experience-preloader__temperature';
  temperature.textContent = '45°C';
  temperature.setAttribute('aria-hidden', 'true');

  const meter = document.createElement('span');
  meter.className = 'experience-preloader__meter';
  const fill = document.createElement('i');
  fill.className = 'experience-preloader__fill';
  meter.append(fill);
  const illustration = document.createElement('img');
  illustration.className = 'experience-preloader__art';
  illustration.src = illustrationSource;
  illustration.alt = '';
  illustration.width = 540;
  illustration.height = 960;
  illustration.decoding = 'async';
  overlay.append(logo, illustration, temperature, meter);
  runtime.append(overlay);

  const progress = { value: 45 };
  const update = (): void => {
    temperature.textContent = `${Math.round(progress.value)}°C`;
    fill.style.transform = `scaleX(${Math.max(0, (progress.value - 45) / 135)})`;
  };
  const reduced = prefersReducedMotion();
  const preload = Promise.all([
    ...[BRAND_ASSETS.wordmarkBlue, illustrationSource, '/opening/var-1.webp'].map(loadImage),
    document.fonts?.ready ?? Promise.resolve(),
  ]);
  const progressTween = gsap.to(progress, {
    value: 174,
    duration: reduced ? 0 : 0.72,
    ease: 'power2.out',
    onUpdate: update,
  });

  await preload;
  progressTween.kill();
  await tweenPromise(
    gsap.to(progress, {
      value: 180,
      duration: reduced ? 0 : 0.22,
      ease: 'power2.out',
      onUpdate: update,
    }),
  );

  await tweenPromise(
    gsap.to(overlay, {
      yPercent: -102,
      duration: reduced ? 0 : 0.72,
      ease: 'power4.inOut',
    }),
  );
  overlay.remove();
}

function loadImage(source: string): Promise<void> {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = source;
  });
}

function tweenPromise(animation: gsap.core.Animation): Promise<void> {
  if (animation.totalDuration() === 0) {
    animation.progress(1);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    animation.eventCallback('onComplete', resolve);
    animation.eventCallback('onInterrupt', resolve);
  });
}
