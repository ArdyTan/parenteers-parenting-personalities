import { readFile } from 'node:fs/promises';
import { basename, join, parse } from 'node:path';

import sharp from 'sharp';

const workspace = process.cwd();
const sceneArtSource = join(workspace, 'images', 'scene-art');
const sceneArtRegistry = JSON.parse(
  await readFile(join(workspace, 'src', 'data', 'scene-art.json'), 'utf8'),
);

const TARGET_WIDTH = 1536;
const TARGET_HEIGHT = 1024;

for (const asset of sceneArtRegistry.questions) {
  const stem = parse(asset.image).name;
  const source = join(sceneArtSource, `${stem}.png`);
  const image = sharp(source);
  const metadata = await image.metadata();

  if (metadata.width === TARGET_WIDTH && metadata.height === TARGET_HEIGHT) {
    console.log(`${basename(source)} already ${TARGET_WIDTH}x${TARGET_HEIGHT}`);
    continue;
  }

  if ((metadata.width ?? 0) < (metadata.height ?? 0)) {
    throw new Error(
      `${basename(source)} is portrait and must be regenerated as a native landscape composition`,
    );
  }

  const normalized = image.resize(TARGET_WIDTH, TARGET_HEIGHT, {
    fit: 'contain',
    position: 'centre',
    background: { r: 254, g: 242, b: 225, alpha: 1 },
  });
  const output = await normalized
    .resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: 'fill' })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();

  await sharp(output).toFile(source);
  console.log(
    `${basename(source)} normalized from ${metadata.width}x${metadata.height} to ${TARGET_WIDTH}x${TARGET_HEIGHT}`,
  );
}
