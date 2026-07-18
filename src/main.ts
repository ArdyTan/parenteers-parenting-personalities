import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/dev-shell.css';

import { readDeviceSignals, shouldShowDesktopGate } from './core/device';

const root = document.querySelector<HTMLDivElement>('#app');

if (!root) {
  throw new Error('Missing #app mount point.');
}

const framed = shouldShowDesktopGate(readDeviceSignals());

document.documentElement.dataset.presentation = framed ? 'framed' : 'edge';

const phaseZeroShell = `
  <main class="phase-zero-shell" data-phase="0">
    <div class="phase-zero-glow" aria-hidden="true"></div>
    <section class="phase-zero-card" aria-labelledby="phase-zero-title">
      <p class="phase-zero-kicker">Parenteers presents</p>
      <h1 id="phase-zero-title">Parenting Bakes</h1>
      <p class="phase-zero-copy">The oven is preheating. Phase 0 is alive.</p>
      <div class="phase-zero-status" role="status">
        <span aria-hidden="true">&#9679;</span>
        Vite &middot; TypeScript &middot; Cloudflare Workers
      </div>
    </section>
  </main>
`;

root.innerHTML = framed
  ? `<div class="phone-frame-stage"><div class="phone-frame"><div class="phone-frame__screen">${phaseZeroShell}</div></div></div>`
  : phaseZeroShell;
