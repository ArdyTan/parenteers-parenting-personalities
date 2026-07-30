import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const configPath = join(process.cwd(), 'src', 'data', 'config.json');
const config = JSON.parse(await readFile(configPath, 'utf8'));
const unresolved = findValuePaths(config, 'TBD');

if (unresolved.length > 0) {
  throw new Error(
    `Release blocked: replace TBD values at ${unresolved.join(', ')} before deploying.`,
  );
}

console.log('Release configuration: ready.');

function findValuePaths(value, target, prefix = 'config') {
  if (value === target) return [prefix];
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return [];

  return Object.entries(value).flatMap(([key, child]) =>
    findValuePaths(child, target, `${prefix}.${key}`),
  );
}
