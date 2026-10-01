import { createPointerGesture, type PointerGestureBinding } from './pointer';
import { createVelocityTracker } from './velocity';

export type AnswerSide = 'left' | 'right';
type Intent = 'pending' | 'horizontal' | 'vertical';

export function swipeSide(dx: number, speedX: number, width: number): AnswerSide | null {
  const distance = Math.min(96, Math.max(64, width * 0.24));
  if (Math.abs(dx) >= distance) return dx < 0 ? 'left' : 'right';
  if (Math.abs(dx) >= 32 && Math.abs(speedX) >= 650 && Math.sign(dx) === Math.sign(speedX)) {
    return dx < 0 ? 'left' : 'right';
  }
  return null;
}

export function createAnswerSwipe(
  card: HTMLElement,
  frame: HTMLElement,
  callbacks: Readonly<{
    preview: (dx: number, side: AnswerSide | null, dragging: boolean) => void;
    commit: (side: AnswerSide) => void;
    cancel: () => void;
  }>,
): PointerGestureBinding {
  const velocity = createVelocityTracker({ windowMs: 100, inactivityMs: 100 });
  let intent: Intent = 'pending';
  let lastX = 0;
  const binding = createPointerGesture(card, {
    onStart(sample) {
      intent = 'pending';
      lastX = sample.x;
      velocity.reset({ x: sample.x, y: sample.y, time: sample.time });
    },
    onMove(sample) {
      lastX = sample.x;
      velocity.add(sample.x, sample.y, sample.time);
      if (intent === 'pending') intent = resolveSwipeIntent(sample.deltaX, sample.deltaY);
      if (intent !== 'horizontal') return;
      const side = swipeSide(sample.deltaX, velocity.velocity(sample.time).x, card.clientWidth);
      callbacks.preview(sample.deltaX, side, true);
    },
    onEnd(sample, reason) {
      if (reason === 'up' && intent === 'horizontal') {
        // The final position is sampled even if no pointermove arrived there.
        if (sample.x !== lastX) velocity.add(sample.x, sample.y, sample.time);
        const side = swipeSide(sample.deltaX, velocity.velocity(sample.time).x, card.clientWidth);
        if (side) {
          callbacks.commit(side);
          intent = 'pending';
          return;
        }
      }
      intent = 'pending';
      callbacks.cancel();
    },
  }, {
    touchAction: 'pan-y',
    accept(event) {
      const bounds = frame.getBoundingClientRect();
      return event.clientX >= bounds.left + 24 && event.clientX <= bounds.right - 24;
    },
  });
  return binding;
}

export function resolveSwipeIntent(dx: number, dy: number): Intent {
  const x = Math.abs(dx);
  const y = Math.abs(dy);
  if (y >= 12 && y >= x / 1.3) return 'vertical';
  if (x >= 12 && x > y * 1.3) return 'horizontal';
  return 'pending';
}
