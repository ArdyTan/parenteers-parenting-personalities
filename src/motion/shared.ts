import { gsap } from 'gsap';

import { triggerHaptic } from '../core/haptics';
import type { SceneName } from '../core/navigation';
import type { SceneMotionHooks } from '../scenes/scene';

const ENTER_EASE = 'power3.out';
const EXIT_EASE = 'power2.in';

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function createSceneMotion(
  root: HTMLElement,
  options: Readonly<{
    enterTargets?: gsap.TweenTarget;
    enterY?: number;
    onEnter?: () => void | Promise<void>;
    onExit?: () => void;
    onDestroy?: () => void;
  }> = {},
): SceneMotionHooks {
  let active: gsap.core.Animation | null = null;
  const targets = options.enterTargets ?? Array.from(root.children);

  return {
    async enter() {
      active?.kill();
      const reduced = prefersReducedMotion();
      active = gsap.fromTo(
        targets,
        { autoAlpha: 0, y: reduced ? 0 : (options.enterY ?? 24) },
        {
          autoAlpha: 1,
          y: 0,
          duration: reduced ? 0 : 0.62,
          stagger: reduced ? 0 : 0.055,
          ease: ENTER_EASE,
          clearProps: 'opacity,visibility,transform',
        },
      );
      await tweenToPromise(active);
      await options.onEnter?.();
    },
    async exit(_to: SceneName) {
      active?.kill();
      options.onExit?.();
      const reduced = prefersReducedMotion();
      active = gsap.to(root, {
        autoAlpha: 0,
        y: reduced ? 0 : -14,
        duration: reduced ? 0 : 0.28,
        ease: EXIT_EASE,
      });
      await tweenToPromise(active);
    },
    destroy() {
      active?.kill();
      gsap.killTweensOf(root);
      gsap.killTweensOf(root.querySelectorAll('*'));
      options.onDestroy?.();
    },
  };
}

export function bindPressFeedback(
  targets: Iterable<Element>,
  signal: AbortSignal,
): void {
  if (prefersReducedMotion()) return;

  for (const target of targets) {
    const element = target as HTMLElement;
    const reset = (): void => {
      gsap.to(element, {
        scale: 1,
        duration: 0.42,
        ease: 'elastic.out(1, 0.55)',
        overwrite: true,
        clearProps: 'transform',
      });
    };

    element.addEventListener(
      'pointerdown',
      (event) => {
        if (!event.isPrimary) return;
        gsap.to(element, {
          scale: 0.975,
          duration: 0.12,
          ease: 'power2.out',
          overwrite: true,
        });
      },
      { signal },
    );
    element.addEventListener('pointerup', reset, { signal });
    element.addEventListener('pointercancel', reset, { signal });
    element.addEventListener('pointerleave', reset, { signal });
  }
}

export function splitTextForReveal(element: HTMLElement): HTMLElement[] {
  const text = element.textContent ?? '';
  const fragment = document.createDocumentFragment();
  const characters: HTMLElement[] = [];
  element.textContent = '';
  element.setAttribute('aria-label', text);

  for (const token of text.split(/(\s+)/)) {
    if (!token) continue;
    if (/^\s+$/.test(token)) {
      fragment.append(document.createTextNode(' '));
      continue;
    }

    const word = document.createElement('span');
    word.className = 'split-word';
    word.setAttribute('aria-hidden', 'true');
    for (const character of Array.from(token)) {
      const mask = document.createElement('span');
      mask.className = 'split-char-mask';
      const inner = document.createElement('span');
      inner.className = 'split-char';
      inner.textContent = character;
      mask.append(inner);
      word.append(mask);
      characters.push(inner);
    }
    fragment.append(word);
  }

  element.append(fragment);
  return characters;
}

export function revealSplitText(characters: HTMLElement[]): void {
  if (characters.length === 0) return;
  const reduced = prefersReducedMotion();
  gsap.fromTo(
    characters,
    { yPercent: reduced ? 0 : 118, rotate: reduced ? 0 : 3 },
    {
      yPercent: 0,
      rotate: 0,
      duration: reduced ? 0 : 0.72,
      stagger: reduced ? 0 : 0.018,
      ease: 'power4.out',
      clearProps: 'transform',
    },
  );
}

export function revealOnScroll(root: HTMLElement, signal: AbortSignal): void {
  const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
  if (targets.length === 0) return;

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    gsap.set(targets, { autoAlpha: 1, y: 0 });
    return;
  }

  gsap.set(targets, { autoAlpha: 0, y: 28 });
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        gsap.to(entry.target, {
          autoAlpha: 1,
          y: 0,
          duration: 0.64,
          ease: ENTER_EASE,
          clearProps: 'opacity,visibility,transform',
        });
      }
    },
    { threshold: 0.14, rootMargin: '0px 0px -8% 0px' },
  );

  targets.forEach((target) => observer.observe(target));
  signal.addEventListener('abort', () => observer.disconnect(), { once: true });
}

export function runConfetti(root: HTMLElement, signal: AbortSignal): void {
  if (prefersReducedMotion() || signal.aborted) return;
  const layer = document.createElement('div');
  layer.className = 'confetti-layer';
  layer.setAttribute('aria-hidden', 'true');
  root.append(layer);

  const colors = ['#182799', '#3073E9', '#E86811', '#F3B15B', '#F0F1F5'];
  const pieces = Array.from({ length: 34 }, (_, index) => {
    const piece = document.createElement('i');
    piece.className = 'confetti-piece';
    piece.style.setProperty('--confetti-color', colors[index % colors.length] ?? '#E86811');
    piece.style.setProperty('--confetti-left', `${8 + Math.random() * 84}%`);
    layer.append(piece);
    return piece;
  });

  const timeline = gsap.timeline({
    onComplete: () => layer.remove(),
  });
  timeline.fromTo(
    pieces,
    { y: -48, x: 0, rotate: 0, opacity: 1 },
    {
      y: () => window.innerHeight * (0.66 + Math.random() * 0.45),
      x: () => -60 + Math.random() * 120,
      rotate: () => -420 + Math.random() * 840,
      opacity: 0,
      duration: () => 1.15 + Math.random() * 0.8,
      stagger: 0.018,
      ease: 'power1.in',
    },
  );
  triggerHaptic('celebrate');

  signal.addEventListener(
    'abort',
    () => {
      timeline.kill();
      layer.remove();
    },
    { once: true },
  );
}

export function bindTiltCard(element: HTMLElement, signal: AbortSignal): void {
  if (prefersReducedMotion()) return;

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  const tick = (): void => {
    currentX += (targetX - currentX) * 0.12;
    currentY += (targetY - currentY) * 0.12;
    gsap.set(element, {
      rotateX: currentY,
      rotateY: currentX,
      transformPerspective: 900,
      transformOrigin: 'center',
    });
  };

  const point = (event: PointerEvent): void => {
    if (!event.isPrimary) return;
    const rect = element.getBoundingClientRect();
    targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
    targetY = -((event.clientY - rect.top) / rect.height - 0.5) * 7;
  };
  const reset = (): void => {
    targetX = 0;
    targetY = 0;
  };

  element.addEventListener('pointermove', point, { signal });
  element.addEventListener('pointerleave', reset, { signal });
  element.addEventListener('pointercancel', reset, { signal });
  gsap.ticker.add(tick);
  signal.addEventListener(
    'abort',
    () => {
      gsap.ticker.remove(tick);
      gsap.set(element, { clearProps: 'transform' });
    },
    { once: true },
  );
}

export function burstAt(target: HTMLElement, x: number, y: number): void {
  if (prefersReducedMotion()) return;
  const layer = document.createElement('span');
  layer.className = 'tap-burst';
  layer.setAttribute('aria-hidden', 'true');
  layer.style.left = `${x}px`;
  layer.style.top = `${y}px`;
  target.append(layer);

  const dots = Array.from({ length: 10 }, (_, index) => {
    const dot = document.createElement('i');
    dot.style.setProperty('--burst-angle', `${index * 36}deg`);
    layer.append(dot);
    return dot;
  });

  gsap.fromTo(
    dots,
    { x: 0, y: 0, scale: 1, opacity: 1 },
    {
      x: (index) => Math.cos((index * Math.PI * 2) / dots.length) * 34,
      y: (index) => Math.sin((index * Math.PI * 2) / dots.length) * 34,
      scale: 0,
      opacity: 0,
      duration: 0.46,
      stagger: 0.008,
      ease: 'power2.out',
      onComplete: () => layer.remove(),
    },
  );
}

function tweenToPromise(animation: gsap.core.Animation): Promise<void> {
  if (animation.totalDuration() === 0) {
    animation.progress(1);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    animation.eventCallback('onComplete', resolve);
    animation.eventCallback('onInterrupt', resolve);
  });
}
