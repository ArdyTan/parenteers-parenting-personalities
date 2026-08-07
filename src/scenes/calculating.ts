import { gsap } from 'gsap';

import { scorePersistedAnswers } from '../core/scoring';
import { characterThumbnail } from '../data';
import {
  createSceneMotion,
  prefersReducedMotion,
} from '../motion/shared';
import { element, localizedList, sceneBody } from './dom';
import { FunctionalScene } from './scene';

/** Three rows read as a whole bakery drifting past rather than a two-line ticker. */
const ROWS = 3;

export function createCalculatingScene(): FunctionalScene {
  return new FunctionalScene('calculating', (root, context, signal) => {
    const code = scorePersistedAnswers(context.store.get().answers);
    context.store.setResult(code);
    const resultPath = `/r/${code.toLowerCase()}`;

    // One line, held still for the whole wait. The four lines used to hand over
    // to each other on a timer, which at this length reads as flashing text
    // rather than progress; picking one per run keeps all four in rotation the
    // same way the marquee shuffles the cast.
    const lines = [1, 2, 3, 4].map((line) => context.t(`loading.line${line}`));
    const statusLine = lines[Math.floor(Math.random() * lines.length)] ?? lines[0] ?? '';
    const loadingList = localizedList([statusLine], 'loading-lines');

    const title = element('h1', {
      className: 'baking__title',
      text: context.t('loading.title'),
      attributes: { tabindex: '-1' },
    });

    // Every bake drifts past while the oven heats — the whole cast, shuffled, so
    // no two runs look the same. Thumbnails keep all 16 inside the image budget.
    const shuffled = shuffle(context.data.types.map((type) => type.image));
    const perRow = Math.ceil(shuffled.length / ROWS);
    const marquees = Array.from({ length: ROWS }, (_, rowIndex) => {
      const sources = shuffled.slice(rowIndex * perRow, (rowIndex + 1) * perRow);
      const track = element(
        'div',
        { className: 'baking__marquee-track' },
        sources.map((source) => marqueeItem(source)),
      );
      const marquee = element(
        'div',
        {
          className: 'baking__marquee',
          attributes: { 'aria-hidden': 'true', 'data-direction': rowIndex % 2 === 0 ? '1' : '-1' },
        },
        [track],
      );
      return { marquee, track, sources };
    });

    const marqueeStage = element(
      'div',
      { className: 'baking__marquees' },
      marquees.map(({ marquee }) => marquee),
    );

    root.setAttribute('aria-label', context.t('loading.a11y'));
    root.append(sceneBody('baking__body', [title, marqueeStage, loadingList]));

    let holdTimer: number | undefined;
    let advanced = false;
    let tick: ((time: number, deltaTime: number) => void) | null = null;
    let heatTween: gsap.core.Tween | null = null;
    const heat = { value: 45 };
    const holdMs = context.data.config.loading.holdMs;

    /** Idempotent: the tap shortcut and the timer race, and only one may win. */
    function advance(): void {
      if (advanced || signal.aborted) return;
      advanced = true;
      window.clearTimeout(holdTimer);
      context.navigate(resultPath);
    }

    // No visible control, but the wait is still skippable: a tap anywhere goes
    // straight through, so nobody is held hostage by a timer they can't see.
    root.addEventListener('pointerdown', advance, { signal });

    return createSceneMotion(root, {
      enterTargets: [title, marqueeStage],
      onEnter() {
        holdTimer = window.setTimeout(advance, holdMs);
        if (prefersReducedMotion()) return;
        startMarquee();
        heatTween = gsap.to(heat, {
          value: 180,
          duration: holdMs / 1000,
          ease: 'none',
        });
      },
      onDestroy() {
        window.clearTimeout(holdTimer);
        holdTimer = undefined;
        heatTween?.kill();
        heatTween = null;
        if (tick) gsap.ticker.remove(tick);
        tick = null;
      },
    });

    /**
     * Technique 10, adapted: clone each row until the copies cover 2x the stage,
     * then translate the strip with a modulo wrap so the loop never gaps. Speed
     * rides the oven ramp instead of scroll velocity, so the cast visibly picks
     * up pace as the temperature climbs.
     */
    function startMarquee(): void {
      const rows = marquees.map(({ marquee, track, sources }, index) => {
        const direction = index % 2 === 0 ? 1 : -1;
        const unit = track.getBoundingClientRect().width || marquee.clientWidth || 1;
        const copies = Math.max(2, Math.ceil((marquee.clientWidth * 2) / unit) + 1);
        for (let copy = 1; copy < copies; copy += 1) {
          track.append(...sources.map((source) => marqueeItem(source)));
        }
        return { track, unit, direction, offset: direction > 0 ? 0 : -unit };
      });

      tick = (_time, deltaTime) => {
        const warmth = (heat.value - 45) / 135;
        const speed = 0.05 + warmth * 0.09;
        for (const row of rows) {
          row.offset -= row.direction * row.unit * speed * (deltaTime / 1000);
          row.offset = ((row.offset % row.unit) + row.unit) % row.unit - row.unit;
          row.track.style.transform = `translate3d(${row.offset}px, 0, 0)`;
        }
      };
      gsap.ticker.add(tick);
    }
  });
}

function marqueeItem(source: string): HTMLElement {
  return element('img', {
    className: 'baking__marquee-item',
    attributes: {
      src: characterThumbnail(source),
      alt: '',
      width: '360',
      height: '360',
      decoding: 'async',
      loading: 'eager',
    },
  });
}

function shuffle<T>(items: readonly T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swap]] = [shuffled[swap] as T, shuffled[index] as T];
  }
  return shuffled;
}
