import { mkdir, readFile } from 'node:fs/promises';
import { basename, join, parse } from 'node:path';

import sharp from 'sharp';

const workspace = process.cwd();
const characterSource = join(workspace, 'images', 'Pastries-personalities');
const openingSource = join(workspace, 'images', 'opening-image');
const componentSource = join(workspace, 'images', 'web-component');
const sceneArtSource = join(workspace, 'images', 'scene-art');
const typeRegistry = JSON.parse(
  await readFile(join(workspace, 'src', 'data', 'types.json'), 'utf8'),
);
const sceneArtRegistry = JSON.parse(
  await readFile(join(workspace, 'src', 'data', 'scene-art.json'), 'utf8'),
);

const outputs = [];

for (const personality of typeRegistry) {
  const output = join(workspace, 'public', personality.image.replace(/^\//, ''));
  const thumbnailOutput = join(
    workspace,
    'public',
    'characters',
    'thumbs',
    basename(personality.image),
  );
  const source = join(characterSource, `${personality.code.toLowerCase()}-${slugFromImage(personality.image)}.png`);
  await mkdir(join(workspace, 'public', 'characters'), { recursive: true });
  await mkdir(join(workspace, 'public', 'characters', 'thumbs'), { recursive: true });
  await sharp(source)
    .resize(900, 900, { fit: 'cover', position: 'centre', withoutEnlargement: true })
    .webp({ quality: 74, effort: 6, smartSubsample: true })
    .toFile(output);
  outputs.push([source, output]);
  await sharp(source)
    .resize(360, 360, { fit: 'cover', position: 'centre', withoutEnlargement: true })
    .webp({ quality: 66, effort: 6, smartSubsample: true })
    .toFile(thumbnailOutput);
  outputs.push([source, thumbnailOutput]);
}

await mkdir(join(workspace, 'public', 'opening'), { recursive: true });
for (let variant = 1; variant <= 4; variant += 1) {
  const source = join(openingSource, `var-${variant}.png`);
  const output = join(workspace, 'public', 'opening', `var-${variant}.webp`);
  await sharp(source)
    .resize(540, 960, { fit: 'cover', position: 'centre', withoutEnlargement: true })
    .webp({ quality: 66, effort: 6, smartSubsample: true })
    .toFile(output);
  outputs.push([source, output]);
}

await mkdir(join(workspace, 'public', 'art'), { recursive: true });
const errorSource = join(componentSource, 'asset-404.png');
const errorOutput = join(workspace, 'public', 'art', 'asset-404.webp');
await sharp(errorSource)
  .resize(720, 720, { fit: 'inside', withoutEnlargement: true })
  .webp({ quality: 74, effort: 6, smartSubsample: true })
  .toFile(errorOutput);
outputs.push([errorSource, errorOutput]);

await mkdir(join(workspace, 'public', 'art', 'scenes'), { recursive: true });
const sceneArtAssets = [
  ...sceneArtRegistry.questions,
  ...sceneArtRegistry.checkpoints,
];
for (const asset of sceneArtAssets) {
  const source = join(sceneArtSource, `${parse(asset.image).name}.png`);
  const output = join(workspace, 'public', asset.image.replace(/^\//, ''));
  const checkpoint = 'afterQuestion' in asset;
  await sharp(source)
    .resize(checkpoint ? 600 : 720, checkpoint ? 900 : 480, {
      fit: 'contain',
      position: 'centre',
      withoutEnlargement: true,
      background: { r: 250, g: 244, b: 234, alpha: 1 },
    })
    .webp({ quality: checkpoint ? 62 : 60, effort: 6, smartSubsample: true })
    .toFile(output);
  outputs.push([source, output]);
}

console.log(`Phase 4 assets: ${outputs.length} optimized derivatives written.`);
for (const [source, output] of outputs) {
  console.log(`${basename(source)} -> ${output.replace(`${workspace}\\`, '')}`);
}

function slugFromImage(image) {
  return parse(image).name.replace(/^[pf][cg][td][en]-/, '');
}
