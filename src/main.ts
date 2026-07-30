import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/scenes.css';
import './styles/motion.css';

import { bootParentingBakes } from './app';
import { appData, validateBundledData } from './data';

if (import.meta.env.DEV) {
  const { warnings } = validateBundledData();
  warnings.forEach((warning) => console.warn(`[data] ${warning}`));
}

const root = document.querySelector<HTMLDivElement>('#app');

if (!root) {
  throw new Error('Missing #app mount point.');
}

void bootParentingBakes(root).catch((error: unknown) => {
  console.error('[boot] Parenting Bakes could not start.', error);
  root.replaceChildren();
  const message = document.createElement('p');
  message.className = 'boot-error';
  message.setAttribute('role', 'alert');
  message.textContent = appData.translations.id['error.generic']!;
  root.append(message);
});
