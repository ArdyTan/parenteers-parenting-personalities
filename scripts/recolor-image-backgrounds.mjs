import { mkdir, readdir } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';

import sharp from 'sharp';

const workspace = process.cwd();
const sourceFolders = [
  join(workspace, 'images', 'opening-image'),
  join(workspace, 'images', 'Pastries-personalities'),
  join(workspace, 'images', 'scene-art'),
];
const target = { r: 0xfe, g: 0xf2, b: 0xe1, alpha: 1 };
const targetHex = '#FEF2E1';
const threshold = 46;
const thresholdSquared = threshold ** 2;

const apply = process.argv.includes('--apply');
const previewArgument = process.argv.find((argument) => argument.startsWith('--preview='));
const previewRoot = previewArgument
  ? previewArgument.slice('--preview='.length)
  : undefined;

if (apply && previewRoot) {
  throw new Error('Choose either --apply or --preview=<directory>, not both.');
}

const files = [];
for (const folder of sourceFolders) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.png')) {
      files.push(join(folder, entry.name));
    }
  }
}
files.sort((left, right) => left.localeCompare(right));

let totalChanged = 0;
let totalPixels = 0;

for (const source of files) {
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const mask = findEdgeConnectedBackground(data, info.width, info.height);
  let changed = 0;

  for (let pixel = 0; pixel < mask.length; pixel += 1) {
    if (mask[pixel] === 0) continue;
    const offset = pixel * 4;
    if (
      data[offset] !== target.r ||
      data[offset + 1] !== target.g ||
      data[offset + 2] !== target.b ||
      data[offset + 3] !== 255
    ) {
      changed += 1;
    }
    data[offset] = target.r;
    data[offset + 1] = target.g;
    data[offset + 2] = target.b;
    data[offset + 3] = 255;
  }

  totalChanged += changed;
  totalPixels += mask.length;
  const percent = ((changed / mask.length) * 100).toFixed(1);
  console.log(`${relative(workspace, source)}: ${changed.toLocaleString()} px (${percent}%)`);

  const destination = apply
    ? source
    : previewRoot
      ? join(previewRoot, relative(workspace, source))
      : undefined;
  if (!destination) continue;

  await mkdir(dirname(destination), { recursive: true });
  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .removeAlpha()
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(destination);
}

const mode = apply ? 'updated' : previewRoot ? `previewed in ${previewRoot}` : 'analyzed';
console.log(
  `Backgrounds ${mode}: ${files.length} PNGs, ${totalChanged.toLocaleString()} of ${totalPixels.toLocaleString()} pixels -> ${targetHex}.`,
);

function findEdgeConnectedBackground(data, width, height) {
  const pixelCount = width * height;
  const mask = new Uint8Array(pixelCount);
  const queue = new Uint32Array(pixelCount);
  let head = 0;
  let tail = 0;

  const enqueue = (pixel) => {
    if (mask[pixel] !== 0 || !isBackgroundPixel(data, pixel)) return;
    mask[pixel] = 1;
    queue[tail] = pixel;
    tail += 1;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }

  while (head < tail) {
    const pixel = queue[head];
    head += 1;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    if (x > 0) enqueue(pixel - 1);
    if (x + 1 < width) enqueue(pixel + 1);
    if (y > 0) enqueue(pixel - width);
    if (y + 1 < height) enqueue(pixel + width);
  }

  return mask;
}

function isBackgroundPixel(data, pixel) {
  const offset = pixel * 4;
  const r = data[offset];
  const g = data[offset + 1];
  const b = data[offset + 2];
  const alpha = data[offset + 3];
  const redDifference = r - target.r;
  const greenDifference = g - target.g;
  const blueDifference = b - target.b;
  const distanceSquared =
    redDifference ** 2 + greenDifference ** 2 + blueDifference ** 2;

  return (
    alpha > 245 &&
    r >= 224 &&
    g >= 205 &&
    b >= 184 &&
    r >= g &&
    g >= b &&
    distanceSquared <= thresholdSquared
  );
}
