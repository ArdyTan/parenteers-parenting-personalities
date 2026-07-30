import { gsap } from 'gsap';

import { triggerHaptic } from '../core/haptics';
import { prefersReducedMotion } from './shared';

export type ToastKind = 'success' | 'error' | 'info';

export type ToastStack = Readonly<{
  show: (message: string, kind?: ToastKind) => void;
}>;

type ToastRecord = {
  element: HTMLElement;
  life: gsap.core.Tween;
  dead: boolean;
};

export function createToastStack(host: HTMLElement, signal: AbortSignal): ToastStack {
  const layer = document.createElement('aside');
  layer.className = 'toast-stack';
  host.append(layer);

  const records = new Map<HTMLElement, ToastRecord>();

  const dismiss = (element: HTMLElement, quiet = false): void => {
    const record = records.get(element);
    if (!record || record.dead) return;
    record.dead = true;
    record.life.kill();
    if (!quiet) triggerHaptic('boundary');

    const before = capturePositions(layer);
    const reduced = prefersReducedMotion();
    gsap.to(element, {
      autoAlpha: 0,
      scale: reduced ? 1 : 0.88,
      y: reduced ? 0 : 14,
      duration: reduced ? 0 : 0.22,
      ease: 'power2.in',
      onComplete: () => {
        element.remove();
        records.delete(element);
        animateStackShift(layer, before, reduced);
      },
    });
  };

  const bindSwipe = (record: ToastRecord): void => {
    const { element } = record;
    let pointer = -1;
    let startX = 0;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;

    element.addEventListener(
      'pointerdown',
      (event) => {
        if (!event.isPrimary) return;
        pointer = event.pointerId;
        startX = event.clientX;
        lastX = event.clientX;
        lastTime = performance.now();
        velocity = 0;
        element.setPointerCapture(event.pointerId);
        record.life.pause();
      },
      { signal },
    );
    element.addEventListener(
      'pointermove',
      (event) => {
        if (event.pointerId !== pointer) return;
        const now = performance.now();
        const dx = event.clientX - startX;
        velocity = ((event.clientX - lastX) / Math.max(1, now - lastTime)) * 1_000;
        lastX = event.clientX;
        lastTime = now;
        gsap.set(element, {
          x: dx,
          rotate: dx * 0.015,
          opacity: 1 - Math.min(0.7, Math.abs(dx) / 240),
        });
      },
      { signal },
    );

    const settle = (event: PointerEvent): void => {
      if (event.pointerId !== pointer) return;
      const offset = Number(gsap.getProperty(element, 'x')) || 0;
      pointer = -1;
      if (Math.abs(offset) > 92 || Math.abs(velocity) > 520) {
        const direction = (offset || velocity) > 0 ? 1 : -1;
        record.dead = true;
        record.life.kill();
        triggerHaptic('boundary');
        gsap.to(element, {
          x: direction * 440,
          autoAlpha: 0,
          duration: prefersReducedMotion() ? 0 : 0.24,
          ease: 'power2.in',
          onComplete: () => {
            const before = capturePositions(layer);
            element.remove();
            records.delete(element);
            animateStackShift(layer, before, prefersReducedMotion());
          },
        });
        return;
      }

      gsap.to(element, {
        x: 0,
        rotate: 0,
        opacity: 1,
        duration: prefersReducedMotion() ? 0 : 0.34,
        ease: 'back.out(1.4)',
      });
      record.life.play();
    };

    element.addEventListener('pointerup', settle, { signal });
    element.addEventListener('pointercancel', settle, { signal });
  };

  const show = (message: string, kind: ToastKind = 'info'): void => {
    if (signal.aborted) return;
    const toast = document.createElement('div');
    toast.className = `toast toast--${kind}`;
    toast.setAttribute('role', kind === 'error' ? 'alert' : 'status');

    const icon = document.createElement('span');
    icon.className = 'toast__icon';
    icon.textContent = kind === 'success' ? '✓' : kind === 'error' ? '!' : 'i';
    icon.setAttribute('aria-hidden', 'true');
    const copy = document.createElement('p');
    copy.className = 'toast__copy';
    copy.textContent = message;
    const progress = document.createElement('span');
    progress.className = 'toast__progress';
    progress.setAttribute('aria-hidden', 'true');
    toast.append(icon, copy, progress);
    layer.append(toast);

    const reduced = prefersReducedMotion();
    gsap.fromTo(
      toast,
      { autoAlpha: 0, y: reduced ? 0 : 30, scale: reduced ? 1 : 0.92 },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: reduced ? 0 : 0.42,
        ease: 'back.out(1.45)',
      },
    );
    triggerHaptic(kind === 'error' ? 'boundary' : 'tick');
    const life = gsap.fromTo(
      progress,
      { scaleX: 1 },
      {
        scaleX: 0,
        duration: reduced ? 2 : 4,
        ease: 'none',
        onComplete: () => dismiss(toast),
      },
    );
    const record: ToastRecord = { element: toast, life, dead: false };
    records.set(toast, record);
    bindSwipe(record);

    const overflowCount = Math.max(0, layer.children.length - 3);
    [...layer.children]
      .slice(0, overflowCount)
      .forEach((oldest) => {
        if (oldest instanceof HTMLElement) dismiss(oldest, true);
      });
  };

  signal.addEventListener(
    'abort',
    () => {
      for (const { element, life } of records.values()) {
        life.kill();
        gsap.killTweensOf([element, ...element.children]);
      }
      records.clear();
      layer.remove();
    },
    { once: true },
  );

  return { show };
}

function capturePositions(container: HTMLElement): Map<Element, number> {
  return new Map(
    [...container.children].map((child) => [child, child.getBoundingClientRect().top]),
  );
}

function animateStackShift(
  container: HTMLElement,
  before: ReadonlyMap<Element, number>,
  reduced: boolean,
): void {
  for (const child of container.children) {
    const previous = before.get(child);
    if (previous === undefined) continue;
    const offset = previous - child.getBoundingClientRect().top;
    if (Math.abs(offset) < 1) continue;
    gsap.fromTo(
      child,
      { y: offset },
      { y: 0, duration: reduced ? 0 : 0.28, ease: 'power2.out' },
    );
  }
}
