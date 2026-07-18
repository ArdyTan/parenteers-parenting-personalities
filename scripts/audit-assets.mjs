import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import sharp from 'sharp';

const sourceDirectory = resolve('images');
const strict = process.argv.includes('--strict');
const files = (await readdir(sourceDirectory)).filter((file) => file.endsWith('.png')).sort();

if (files.length === 0) {
  throw new Error(`No PNG assets found in ${sourceDirectory}.`);
}

const rows = await Promise.all(
  files.map(async (file) => {
    const metadata = await sharp(resolve(sourceDirectory, file)).metadata();
    const character = /^[pf][cg][td][en]-/.test(file);
    const issues = [];

    if (metadata.width !== metadata.height) issues.push('not-square');
    if ((metadata.width ?? 0) < 1_024) issues.push('below-ui-resolution');
    if (character && !metadata.hasAlpha) issues.push('character-needs-alpha');

    return {
      file,
      size: `${metadata.width ?? '?'}x${metadata.height ?? '?'}`,
      format: metadata.format ?? 'unknown',
      alpha: metadata.hasAlpha === true ? 'yes' : 'no',
      issues: issues.join(', ') || 'none',
    };
  }),
);

console.table(rows);

const characterCount = rows.filter(({ file }) => /^[pf][cg][td][en]-/.test(file)).length;
const issueCount = rows.filter(({ issues }) => issues !== 'none').length;

console.log(`Asset intake: ${rows.length} PNGs, ${characterCount} characters, ${issueCount} files need attention.`);

if (strict && issueCount > 0) {
  process.exitCode = 1;
}
