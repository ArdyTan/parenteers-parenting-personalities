import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';

const privateArt = resolve('public/_figma');
const heldArt = resolve('.release-hold-_figma');
const outputArt = resolve('dist/_figma');

if (existsSync(heldArt)) {
  throw new Error(`Release hold already exists at ${heldArt}; restore it before building.`);
}

let held = false;
try {
  if (existsSync(privateArt)) {
    renameSync(privateArt, heldArt);
    held = true;
  }

  const build = spawnSync('npm', ['run', 'build'], {
    stdio: 'inherit',
    env: { ...process.env, PARENTING_BAKES_RELEASE: '1' },
  });
  if (build.error) throw build.error;
  if (build.status !== 0) {
    process.exitCode = build.status ?? 1;
  } else if (existsSync(outputArt)) {
    throw new Error(`Release blocked: private design art was copied into ${outputArt}.`);
  } else if (readdirSync(resolve('dist/assets')).some((name) => name.endsWith('.map'))) {
    throw new Error('Release blocked: a source map was copied into dist/assets.');
  } else {
    console.log('Release assets: private _figma folder and source maps excluded.');
  }
} finally {
  if (held) renameSync(heldArt, privateArt);
}
