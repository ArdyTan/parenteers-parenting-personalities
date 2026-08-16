import { displayShareHost } from '../core/share';
import { actionButton, element } from './dom';
import { FunctionalScene } from './scene';

/**
 * The desktop fallback. Two columns on a wide screen: what this is on the left,
 * how to get it on your phone on the right. It is the only surface a desktop
 * visitor ever sees, so it has to sell the quiz as well as redirect them.
 *
 * The page header already carries the wordmark and the language toggle, so the
 * card deliberately does not repeat the logo.
 */
export function createGateScene(
  qrSvg: string,
  quizUrl: string,
  continueHere: () => void,
): FunctionalScene {
  return new FunctionalScene('gate', (root, context, signal) => {
    const qr = element('div', { className: 'gate__qr' });
    qr.innerHTML = qrSvg;

    const title = element('h1', {
      className: 'gate__title',
      text: context.t('landing.h1'),
      attributes: { tabindex: '-1' },
    });

    const copy = element('div', { className: 'gate__copy' }, [
      element('p', { className: 'gate__eyebrow', text: context.t('landing.eyebrow') }),
      title,
      element('p', { className: 'gate__lead', text: context.t('landing.subtitle') }),
      element(
        'ul',
        { className: 'gate__meta' },
        [
          context.t('landing.meta_time'),
          context.t('landing.meta_questions'),
          context.t('landing.meta_share'),
        ].map((fact) => element('li', { text: fact })),
      ),
      element('p', { className: 'gate__reason', text: context.t('gate.reason') }),
      actionButton(context.t('gate.continue_anyway'), continueHere, signal, {
        className: 'button--secondary gate__continue',
      }),
    ]);

    const scan = element('aside', { className: 'gate__scan' }, [
      element('p', { className: 'gate__scan-title', text: context.t('gate.scan_title') }),
      qr,
      // The host on its own line is the manual path: a visitor who cannot scan
      // can still read four words and type them.
      element('p', { className: 'gate__url', text: displayShareHost(quizUrl) }),
      element('p', { className: 'gate__hint', text: context.t('gate.scan_hint') }),
    ]);

    // The bakery artwork is a 540x960 portrait, and it only reads well at
    // roughly 4:3 or taller (the landing crops it to 4:3). Across a wide
    // two-column card a full-width band is a ~10% horizontal slice that
    // decapitates the characters at every object-position worth trying, so the
    // wide layout is deliberately typographic and the art is shown only once
    // the card stacks and there is width to spare. CSS owns that switch.
    const art = element('img', {
      className: 'gate__art',
      attributes: {
        src: context.data.sceneArt.continuity.gate,
        alt: '',
        width: '540',
        height: '960',
        decoding: 'async',
        loading: 'eager',
      },
    });

    root.append(
      element('div', { className: 'gate' }, [
        element('div', { className: 'gate__card' }, [
          element('div', { className: 'gate__main' }, [copy, scan]),
          art,
        ]),
      ]),
    );
  });
}
