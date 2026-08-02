import { gsap } from 'gsap';

import { scorePersistedAnswers } from '../core/scoring';
import { characterThumbnail } from '../data';
import {
  bindPressFeedback,
  createSceneMotion,
  prefersReducedMotion,
} from '../motion/shared';
import { actionButton, element, localizedList, sceneBody, sceneBottom } from './dom';
import { FunctionalScene } from './scene';

/** Three rows read as a whole bakery drifting past rather than a two-line ticker. */
const ROWS = 3;

export function createCalculatingScene(): FunctionalScene {
  return new FunctionalScene('calculating', (root, context, signal) => {
    const code = scorePersistedAnswers(context.store.get().answers);
    context.store.setResult(code);

    const lines = [1, 2, 3, 4].map((line) => context.t(`loading.line${line}`));
    const loadingList = localizedList(lines, 'loading-lines');
    const loadingItems = Array.from(loadingList.children);

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

    const next = actionButton(
      context.t('nav.continue'),
      () => context.navigate(`/r/${code.toLowerCase()}`),
      signal,
      { className: 'button--primary baking__continue' },
    );
    next.hidden = true;

    root.setAttribute('aria-label', context.t('loading.a11y'));
    root.append(
      sceneBody('baking__body', [title, marqueeStage, loadingList]),
      sceneBottom('baking__bottom', [next]),
    );
    bindPressFeedback([next], signal);
    if (!prefersReducedMotion()) {
      gsap.set(loadingItems, { autoAlpha: 0, y: 14 });
    }

    let loadingTimeline: gsap.core.Timeline | null = null;
    let tick: ((time: number, deltaTime: number) => void) | null = null;
    const heat = { value: 45 };

    return createSceneMotion(root, {
      enterTargets: [title, marqueeStage],
      onEnter() {
        if (prefersReducedMotion()) {
          next.hidden = false;
          gsap.set(loadingItems, { autoAlpha: 1 });
          return;
        }

        startMarquee();

        // Lines share one cell and hand over to each other, so only the current
        // step is on screen — the wait reads as a sequence, not a growing list.
        loadingList.classList.add('loading-lines--sequential');

        const lineDuration = context.data.config.loading.lineMs / 1000;
        loadingTimeline = gsap.timeline();
        loadingTimeline.to(heat, {
          value: 180,
          duration: lineDuration * loadingItems.length,
          ease: 'none',
        }, 0);

        loadingItems.forEach((item, index) => {
          loadingTimeline?.to(
            item,
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.42,
              ease: 'power2.out',
            },
            index * lineDuration,
          );
          if (index < loadingItems.length - 1) {
            loadingTimeline?.to(
              item,
              { autoAlpha: 0, y: -14, duration: 0.34, ease: 'power2.in' },
              (index + 1) * lineDuration - 0.34,
            );
          }
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
