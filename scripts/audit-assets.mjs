import { readFile, readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import sharp from 'sharp';

const workspace = process.cwd();
const strict = process.argv.includes('--strict');
const registry = JSON.parse(
  await readFile(join(workspace, 'src', 'data', 'types.json'), 'utf8'),
);
const sceneArtRegistry = JSON.parse(
  await readFile(join(workspace, 'src', 'data', 'scene-art.json'), 'utf8'),
);
const productsRegistry = JSON.parse(
  await readFile(join(workspace, 'src', 'data', 'products.json'), 'utf8'),
);
const characterDirectory = resolve('images', 'Pastries-personalities');
const characterFiles = (await readdir(characterDirectory))
  .filter((file) => file.endsWith('.png'))
  .sort();
const issues = [];

const characterRows = await Promise.all(
  characterFiles.map(async (file) => {
    const code = file.slice(0, 4).toUpperCase();
    const personality = registry.find((type) => type.code === code);
    const sourcePath = join(characterDirectory, file);
    const source = await sharp(sourcePath).metadata();
    const runtimePath = personality
      ? resolve('public', personality.image.replace(/^\//, ''))
      : '';
    const thumbnailPath = personality
      ? resolve('public', 'characters', 'thumbs', personality.image.split('/').at(-1))
      : '';
    const runtime = runtimePath ? await sharp(runtimePath).metadata() : {};
    const thumbnail = thumbnailPath ? await sharp(thumbnailPath).metadata() : {};
    const runtimeBytes = runtimePath ? (await stat(runtimePath)).size : 0;
    const thumbnailBytes = thumbnailPath ? (await stat(thumbnailPath)).size : 0;
    const rowIssues = [];

    if (!personality) rowIssues.push('not-in-registry');
    if (source.width !== 1254 || source.height !== 1254) rowIssues.push('unexpected-source-size');
    if (source.hasAlpha) rowIssues.push('source-expected-opaque');
    if (runtime.format !== 'webp') rowIssues.push('runtime-not-webp');
    if ((runtime.width ?? Infinity) > 1024 || (runtime.height ?? Infinity) > 1024) {
      rowIssues.push('runtime-too-large');
    }
    if (runtimeBytes > 120_000) rowIssues.push('runtime-over-120kb');
    if (thumbnail.format !== 'webp') rowIssues.push('thumbnail-not-webp');
    if ((thumbnail.width ?? Infinity) > 400 || (thumbnail.height ?? Infinity) > 400) {
      rowIssues.push('thumbnail-too-large');
    }
    if (thumbnailBytes > 25_000) rowIssues.push('thumbnail-over-25kb');
    issues.push(...rowIssues.map((issue) => `${file}: ${issue}`));

    return {
      source: file,
      sourceSize: `${source.width ?? '?'}x${source.height ?? '?'}`,
      runtime: runtimePath.replace(`${workspace}\\`, ''),
      runtimeSize: `${runtime.width ?? '?'}x${runtime.height ?? '?'}`,
      runtimeKB: Math.ceil(runtimeBytes / 1024),
      thumbnailKB: Math.ceil(thumbnailBytes / 1024),
      issues: rowIssues.join(', ') || 'none',
    };
  }),
);

console.table(characterRows);

const openingRows = await Promise.all(
  [1, 2, 3, 4].map(async (variant) => {
    const sourcePath = resolve('images', 'opening-image', `var-${variant}.png`);
    const runtimePath = resolve('public', 'opening', `var-${variant}.webp`);
    const source = await sharp(sourcePath).metadata();
    const runtime = await sharp(runtimePath).metadata();
    const runtimeBytes = (await stat(runtimePath)).size;
    const rowIssues = [];

    if (source.width !== 941 || source.height !== 1672) rowIssues.push('unexpected-source-size');
    if (runtime.format !== 'webp') rowIssues.push('runtime-not-webp');
    if (runtimeBytes > 40_000) rowIssues.push('runtime-over-40kb');
    issues.push(...rowIssues.map((issue) => `var-${variant}.png: ${issue}`));
    return {
      source: `var-${variant}.png`,
      runtime: `opening/var-${variant}.webp`,
      runtimeSize: `${runtime.width ?? '?'}x${runtime.height ?? '?'}`,
      runtimeKB: Math.ceil(runtimeBytes / 1024),
      issues: rowIssues.join(', ') || 'none',
    };
  }),
);

console.table(openingRows);

const sceneArtRows = await Promise.all(
  [...sceneArtRegistry.questions, ...sceneArtRegistry.checkpoints].map(async (asset) => {
    const sourcePath = resolve(
      'images',
      'scene-art',
      `${asset.image.split('/').at(-1).replace(/\.webp$/, '')}.png`,
    );
    const runtimePath = resolve('public', asset.image.replace(/^\//, ''));
    const source = await sharp(sourcePath).metadata();
    const runtime = await sharp(runtimePath).metadata();
    const runtimeBytes = (await stat(runtimePath)).size;
    const checkpoint = 'afterQuestion' in asset;
    const rowIssues = [];

    if (!checkpoint && (source.width !== 1536 || source.height !== 1024)) {
      rowIssues.push('question-source-not-1536x1024');
    }
    if (runtime.format !== 'webp') rowIssues.push('runtime-not-webp');
    const expectedRuntimeSize = checkpoint ? [600, 900] : [720, 480];
    if (runtime.width !== expectedRuntimeSize[0] || runtime.height !== expectedRuntimeSize[1]) {
      rowIssues.push('runtime-unexpected-size');
    }
    if (runtimeBytes > (checkpoint ? 100_000 : 80_000)) {
      rowIssues.push(checkpoint ? 'checkpoint-over-100kb' : 'question-over-80kb');
    }
    issues.push(...rowIssues.map((issue) => `${asset.image}: ${issue}`));

    return {
      source: sourcePath.replace(`${workspace}\\`, ''),
      sourceSize: `${source.width ?? '?'}x${source.height ?? '?'}`,
      runtime: asset.image,
      runtimeSize: `${runtime.width ?? '?'}x${runtime.height ?? '?'}`,
      runtimeKB: Math.ceil(runtimeBytes / 1024),
      issues: rowIssues.join(', ') || 'none',
    };
  }),
);

console.table(sceneArtRows);

const productRows = await Promise.all(
  productsRegistry.map(async (product) => {
    const runtimePath = resolve('public', product.image.replace(/^\//, ''));
    const metadata = await sharp(runtimePath).metadata();
    const bytes = (await stat(runtimePath)).size;
    const rowIssues = [];
    if (metadata.format !== 'webp') rowIssues.push('product-not-webp');
    if (metadata.width !== 400 || metadata.height !== 400) {
      rowIssues.push('product-not-400x400');
    }
    if (bytes > 30_000) rowIssues.push('product-over-30kb');
    issues.push(...rowIssues.map((issue) => `${product.image}: ${issue}`));
    return {
      product: product.id,
      runtime: product.image,
      runtimeSize: `${metadata.width ?? '?'}x${metadata.height ?? '?'}`,
      runtimeKB: Math.ceil(bytes / 1024),
      issues: rowIssues.join(', ') || 'none',
    };
  }),
);

console.table(productRows);

const brandCopies = [
  ['brand/favicon.png', 'public/brand/favicon.png'],
  ['brand/favicon-2.png', 'public/brand/apple-touch-icon.png'],
  ['brand/logo/logo-blue-s.png', 'public/brand/parenteers-mark-blue.png'],
  ['brand/logo/logo-white-s.png', 'public/brand/parenteers-mark-white.png'],
  ['brand/logo/logo-type-blue-s.png', 'public/brand/parenteers-wordmark-blue.png'],
  ['brand/logo/logo-type-white-s.png', 'public/brand/parenteers-wordmark-white.png'],
];
const brandRows = await Promise.all(
  brandCopies.map(async ([source, runtime]) => {
    const sourceBytes = await readFile(resolve(source));
    const runtimeBytes = await readFile(resolve(runtime));
    const matches = sourceBytes.equals(runtimeBytes);
    if (!matches) issues.push(`${runtime}: runtime-copy-drift`);
    return { source, runtime, exactCopy: matches ? 'yes' : 'no' };
  }),
);

console.table(brandRows);

const ogDefinitions = [
  { file: 'default.png', width: 1200, height: 630 },
  ...registry.map(({ slug }) => ({ file: `${slug}.png`, width: 1080, height: 1350 })),
];
const ogRows = await Promise.all(
  ogDefinitions.map(async ({ file, width, height }) => {
    const runtimePath = resolve('public', 'og', file);
    const metadata = await sharp(runtimePath).metadata();
    const bytes = (await stat(runtimePath)).size;
    const rowIssues = [];
    if (metadata.format !== 'png') rowIssues.push('og-not-png');
    if (metadata.width !== width || metadata.height !== height) {
      rowIssues.push('og-unexpected-size');
    }
    if (bytes > 650_000) rowIssues.push('og-over-650kb');
    issues.push(...rowIssues.map((issue) => `public/og/${file}: ${issue}`));
    return {
      runtime: `public/og/${file}`,
      size: `${metadata.width ?? '?'}x${metadata.height ?? '?'}`,
      runtimeKB: Math.ceil(bytes / 1024),
      issues: rowIssues.join(', ') || 'none',
    };
  }),
);

console.table(ogRows);

// The preloader clip is the one runtime asset that is not an image, so it is
// audited on the two things that actually decide whether it helps or hurts:
// its weight, and whether `moov` reaches the browser before `mdat`. Without
// faststart nothing can be decoded until the whole file has arrived, which for
// a preloader is worse than having no clip at all.
const preloaderRows = await (async () => {
  const runtimePath = resolve('public', sceneArtRegistry.continuity.preloader.replace(/^\//, ''));
  const rowIssues = [];
  let bytes = 0;
  let order = 'missing';

  try {
    bytes = (await stat(runtimePath)).size;
    const head = await readFile(runtimePath);
    const moov = head.indexOf('moov', 0, 'latin1');
    const mdat = head.indexOf('mdat', 0, 'latin1');
    order = moov >= 0 && mdat >= 0 ? (moov < mdat ? 'faststart' : 'moov-last') : 'unknown';
    if (order !== 'faststart') rowIssues.push('not-faststart');
    if (bytes > 2_000_000) rowIssues.push('preloader-over-2mb');
  } catch {
    rowIssues.push('preloader-clip-missing');
  }

  issues.push(...rowIssues.map((issue) => `${sceneArtRegistry.continuity.preloader}: ${issue}`));
  return [{
    runtime: sceneArtRegistry.continuity.preloader,
    runtimeKB: Math.ceil(bytes / 1024),
    atomOrder: order,
    issues: rowIssues.join(', ') || 'none',
  }];
})();

console.table(preloaderRows);
console.log(
  `Asset intake: ${characterRows.length} character derivatives, ${openingRows.length} opening derivatives, ${sceneArtRows.length} scene-art derivatives, ${productRows.length} product images, ${ogRows.length} OG images, ${preloaderRows.length} preloader clip, ${issues.length} issues.`,
);

if (strict && issues.length > 0) {
  console.error(issues.join('\n'));
  process.exitCode = 1;
}
