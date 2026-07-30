import { access, mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import sharp from 'sharp';

const workspace = process.cwd();
const typeRegistry = JSON.parse(
  await readFile(join(workspace, 'src', 'data', 'types.json'), 'utf8'),
);
const force = process.argv.includes('--force');

let created = 0;
let preserved = 0;

for (const type of typeRegistry) {
  const relativeImagePath = type.image.replace(/^\//, '');
  const outputPath = join(workspace, 'public', relativeImagePath);

  if (!force && (await exists(outputPath))) {
    preserved += 1;
    continue;
  }

  await mkdir(dirname(outputPath), { recursive: true });

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
      <path d="M45 139c-11-54 23-102 78-108 56-6 102 32 106 88 4 57-35 105-91 109-53 4-83-35-93-89Z" fill="${type.accent}"/>
      <path d="M73 95c19-31 78-42 111-10" fill="none" stroke="#f0f1f5" stroke-linecap="round" stroke-width="12" opacity=".78"/>
      <text x="128" y="157" fill="#f0f1f5" font-family="Arial, sans-serif" font-size="42" font-weight="700" text-anchor="middle">${type.code}</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .webp({ quality: 82, alphaQuality: 100, effort: 6 })
    .toFile(outputPath);
  created += 1;
}

console.log(`Character placeholders: ${created} created, ${preserved} existing assets preserved.`);

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
