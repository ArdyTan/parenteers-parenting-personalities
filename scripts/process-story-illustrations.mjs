import { mkdir, readdir } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

import sharp from 'sharp';

const sourceDir = resolve(process.cwd(), 'images', 'story-illustrations');
const outputDir = resolve(process.cwd(), 'public', 'story-illustrations');

await mkdir(outputDir, { recursive: true });

const sources = (await readdir(sourceDir))
  .filter((file) => file.endsWith('-story.png'))
  .sort();

if (sources.length !== 16) {
  throw new Error(`Expected 16 story illustration sources, found ${sources.length}.`);
}

for (const source of sources) {
  const stem = basename(source, '.png');
  await sharp(resolve(sourceDir, source))
    .resize(1200, 800, { fit: 'cover', position: 'centre' })
    .webp({ quality: 82, effort: 6 })
    .toFile(resolve(outputDir, `${stem}.webp`));
}

console.log(`Built ${sources.length} story illustrations in ${outputDir}.`);
