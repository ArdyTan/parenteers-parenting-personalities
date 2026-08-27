/**
 * Builds the runtime derivatives for the 54 commissioned booklet illustrations.
 *
 * Source of truth is `images/pdf-art/**` (committed PNGs, 1024x768 tiles and
 * 1536x768 / 1536x1024 bands). This script is the only thing that writes
 * `public/pdf-art/**`, mirroring the source -> derivative boundary every other
 * asset in this project uses; see docs/personality-pdf-art-brief.md §8.
 *
 * The derivative is a 1240px-wide WebP *master*, not the printed size. The PDF
 * generator re-encodes each frame to its own print width (publicImage), so this
 * layer only has to be big enough that a 174mm band never upsamples.
 *
 * Filenames are asserted against the two activity registries rather than merely
 * globbed: a tile whose id drifts would silently render as an empty frame in all
 * 32 booklets, and that failure is invisible until someone opens a PDF.
 */
import { mkdir, readdir, readFile, rm, stat } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

import sharp from 'sharp';

const root = process.cwd();
const sourceRoot = resolve(root, 'images', 'pdf-art');
const outputRoot = resolve(root, 'public', 'pdf-art');

/** Master width. Bands print at 174mm, so 1240px leaves headroom at ~180dpi. */
const MASTER_WIDTH = 1240;

const read = async (relative) => JSON.parse(await readFile(resolve(root, relative), 'utf8'));

const parentCare = await read('src/data/parent-care.json');
const childActivities = await read('src/data/child-activities.json');

/** Legal source geometry, from the art brief §6. */
const SIZES = {
  tile: [{ width: 1024, height: 768 }],
  band: [{ width: 1536, height: 768 }, { width: 1536, height: 1024 }],
};

const groups = [
  {
    dir: 'care',
    kind: 'tile',
    expected: parentCare.map((record) => record.id),
  },
  {
    dir: 'play',
    kind: 'tile',
    expected: childActivities.map((record) => record.id),
  },
  {
    dir: 'furniture',
    kind: 'band',
    expected: Array.from({ length: 9 }, (_, index) => `f${index + 1}`),
  },
];

const problems = [];
let written = 0;
let weight = 0;

await rm(outputRoot, { recursive: true, force: true });

for (const group of groups) {
  const sourceDir = resolve(sourceRoot, group.dir);
  const outputDir = resolve(outputRoot, group.dir);
  await mkdir(outputDir, { recursive: true });

  const found = (await readdir(sourceDir))
    .filter((file) => file.endsWith('.png'))
    .map((file) => basename(file, '.png'));

  for (const id of group.expected) {
    if (!found.includes(id)) problems.push(`${group.dir}: missing ${id}.png`);
  }
  for (const id of found) {
    if (!group.expected.includes(id)) problems.push(`${group.dir}: unexpected ${id}.png`);
  }

  for (const id of group.expected.filter((candidate) => found.includes(candidate))) {
    const source = resolve(sourceDir, `${id}.png`);
    const meta = await sharp(source).metadata();
    const legal = SIZES[group.kind]
      .some((size) => size.width === meta.width && size.height === meta.height);
    if (!legal) {
      problems.push(
        `${group.dir}/${id}.png is ${meta.width}x${meta.height}, expected `
        + SIZES[group.kind].map((size) => `${size.width}x${size.height}`).join(' or '),
      );
      continue;
    }

    const target = resolve(outputDir, `${id}.webp`);
    await sharp(source)
      .resize({ width: MASTER_WIDTH, withoutEnlargement: true })
      .flatten({ background: '#fdf2e1' })
      .webp({ quality: 82, effort: 6 })
      .toFile(target);
    weight += (await stat(target)).size;
    written += 1;
  }
}

if (problems.length > 0) {
  console.error(`\npdf-art derivative build failed:\n  ${problems.join('\n  ')}\n`);
  process.exit(1);
}

if (written !== 54) {
  console.error(`\nExpected 54 derivatives, wrote ${written}.\n`);
  process.exit(1);
}

console.log(
  `Built ${written} pdf-art derivatives in public/pdf-art/ `
  + `(${(weight / 1024 / 1024).toFixed(2)} MB).`,
);
