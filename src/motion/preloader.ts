import { gsap } from 'gsap';

import { BRAND_ASSETS } from '../core/brand';
import { prefersReducedMotion } from './shared';

/**
 * The clip is faststart, so its first frame arrives in a few KB. This is the
 * ceiling anyway: the preloader exists to cover the *app* loading, so it must
 * never end up waiting on its own decoration.
 */
const FIRST_FRAME_BUDGET_MS = 900;

export async function runExperiencePreloader(
  runtime: HTMLElement,
  label: string,
  motionSource: string,
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
  const reduced = prefersReducedMotion();

  // Decorative, so it carries no accessible name and no controls. `muted` plus
  // `playsinline` is what makes autoplay legal on a phone before any gesture,
  // and it keeps the preloader silent while sound is still off.
  const illustration = document.createElement('video');
  illustration.className = 'experience-preloader__art';
  illustration.src = motionSource;
  illustration.muted = true;
  illustration.defaultMuted = true;
  illustration.playsInline = true;
  illustration.loop = true;
  illustration.preload = 'auto';
  illustration.width = 500;
  illustration.height = 500;
  illustration.setAttribute('aria-hidden', 'true');
  illustration.setAttribute('disablepictureinpicture', '');
  // Reduced motion keeps the bake but not the stirring: the clip holds on its
  // first frame instead of looping.
  illustration.autoplay = !reduced;

  // The stage owns the wash that dissolves the clip's paper edge into the page.
  const stage = document.createElement('div');
  stage.className = 'experience-preloader__stage';
  stage.append(illustration);

  overlay.append(logo, stage, temperature, meter);
  runtime.append(overlay);
  if (!reduced) void illustration.play().catch(() => undefined);

  const progress = { value: 45 };
  const update = (): void => {
    temperature.textContent = `${Math.round(progress.value)}°C`;
    fill.style.transform = `scaleX(${Math.max(0, (progress.value - 45) / 135)})`;
  };
  const preload = Promise.all([
    ...[BRAND_ASSETS.wordmarkBlue, '/opening/var-1.webp'].map(loadImage),
    firstFrame(illustration, FIRST_FRAME_BUDGET_MS),
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
  // Removing the element cancels the range requests still in flight, so a
  // visitor only ever pays for the seconds of clip they actually saw.
  illustration.pause();
  illustration.removeAttribute('src');
  illustration.load();
  overlay.remove();
}

/**
 * Resolves once there is a picture to show, or when the budget runs out,
 * whichever is first. Never rejects: a clip that cannot play is a missing
 * decoration, not a broken launch.
 */
function firstFrame(video: HTMLVideoElement, budgetMs: number): Promise<void> {
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return Promise.resolve();
  return new Promise((resolve) => {
    const settle = (): void => {
      window.clearTimeout(timer);
      video.removeEventListener('loadeddata', settle);
      video.removeEventListener('error', settle);
      resolve();
    };
    const timer = window.setTimeout(settle, budgetMs);
    video.addEventListener('loadeddata', settle, { once: true });
    video.addEventListener('error', settle, { once: true });
  });
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
