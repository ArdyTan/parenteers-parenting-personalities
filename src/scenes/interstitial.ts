import { actionButton, element } from './dom';
import { bindPressFeedback, createSceneMotion } from '../motion/shared';
import { FunctionalScene } from './scene';

export function createInterstitialScene(
  afterQuestion: 6 | 9,
  nextPath: string,
): FunctionalScene {
  return new FunctionalScene('interstitial', (root, context, signal) => {
    const messageKey = afterQuestion === 6 ? 'quiz.interstitial_q6' : 'quiz.interstitial_q9';
    const temperature = element('span', {
      className: 'interstitial__temperature',
      text: `${Math.round((afterQuestion / 12) * 180)}°C`,
      attributes: { 'aria-hidden': 'true' },
    });
    const art = context.data.sceneArt.checkpoints.find(
      (asset) => asset.afterQuestion === afterQuestion,
    );
    const progressPill = element('p', {
      className: 'interstitial__progress-pill',
      text: context.t('quiz.progress', { n: afterQuestion, total: 12 }),
    });
    progressPill.prepend(temperature);
    const illustration = element('img', {
      className: 'interstitial__art',
      attributes: {
        src: art?.image ?? '',
        alt: '',
        width: '600',
        height: '900',
        decoding: 'async',
        loading: 'eager',
        fetchpriority: 'high',
        style: `object-position: ${art?.objectPosition ?? 'center'}`,
      },
    });
    const continueButton = actionButton(
      context.t('nav.continue'),
      () => context.navigate(nextPath),
      signal,
      { className: 'interstitial__continue button--primary' },
    );
    const content = element('div', { className: 'interstitial__content' }, [
      progressPill,
      element('h1', { text: context.t(messageKey), attributes: { tabindex: '-1' } }),
      illustration,
      continueButton,
    ]);
    root.append(
      element('div', { className: 'interstitial__wipe', attributes: { 'aria-hidden': 'true' } }),
      content,
    );
    bindPressFeedback(root.querySelectorAll('.button'), signal);
    return createSceneMotion(root, {
      enterTargets: [root.querySelector('.interstitial__wipe'), content].filter(
        (target): target is Element => target instanceof Element,
      ),
      enterY: 0,
    });
  });
}
