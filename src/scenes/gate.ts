import { BRAND_ASSETS } from '../core/brand';
import { actionButton, element } from './dom';
import { FunctionalScene } from './scene';

export function createGateScene(qrSvg: string, continueHere: () => void): FunctionalScene {
  return new FunctionalScene('gate', (root, context, signal) => {
    const qr = element('div', { className: 'gate-qr' });
    qr.innerHTML = qrSvg;

    root.append(
      element('div', { className: 'scene-content scene-content--center gate-content flow' }, [
        element('img', {
          className: 'gate-brand',
          attributes: {
            src: BRAND_ASSETS.wordmarkBlue,
            alt: context.t('landing.by_brand'),
            width: '572',
            height: '86',
          },
        }),
        element('h1', { text: context.t('landing.h1'), attributes: { tabindex: '-1' } }),
        element('p', { className: 'scene-lead', text: context.t('landing.subtitle') }),
        element('img', {
          className: 'gate-art',
          attributes: {
            src: context.data.sceneArt.continuity.gate,
            alt: '',
            width: '540',
            height: '960',
            decoding: 'async',
            loading: 'eager',
          },
        }),
        qr,
        element('p', {
          className: 'gate-meta',
          text: `${context.t('landing.meta_time')} · ${context.t('landing.meta_questions')}`,
        }),
        actionButton(context.t('nav.continue'), continueHere, signal, {
          className: 'button--secondary',
        }),
      ]),
    );
  });
}
