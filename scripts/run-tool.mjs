import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readlinkSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const toolEntries = {
  tsc: 'node_modules/typescript/bin/tsc',
  vite: 'node_modules/vite/bin/vite.js',
  vitest: 'node_modules/vitest/vitest.mjs',
  wrangler: 'node_modules/wrangler/bin/wrangler.js',
};

const [tool, ...toolArguments] = process.argv.slice(2);

if (!(tool in toolEntries)) {
  throw new Error(`Unsupported local tool: ${tool ?? '(missing)'}`);
}

const workspace = resolve(process.cwd());
const safeRoot = tool === 'wrangler' ? workspace : getSafeRoot(workspace);
const nodeOptions = new Set((process.env.NODE_OPTIONS ?? '').split(/\s+/).filter(Boolean));

if (safeRoot !== workspace) {
  nodeOptions.add('--preserve-symlinks');
  nodeOptions.add('--preserve-symlinks-main');
}

const entry = resolve(safeRoot, toolEntries[tool]);
const result = spawnSync(process.execPath, [entry, ...toolArguments], {
  cwd: safeRoot,
  env: {
    ...process.env,
    NODE_OPTIONS: [...nodeOptions].join(' '),
    WRANGLER_LOG_PATH: join(safeRoot, '.wrangler', 'logs'),
  },
  stdio: 'inherit',
});

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;

function getSafeRoot(resolvedWorkspace) {
  if (process.platform !== 'win32' || !resolvedWorkspace.includes('#')) {
    return resolvedWorkspace;
  }

  const key = createHash('sha256').update(resolvedWorkspace).digest('hex').slice(0, 10);
  const alias = join(tmpdir(), `parenting-bakes-vite-${key}`);

  if (!existsSync(alias)) {
    symlinkSync(resolvedWorkspace, alias, 'junction');
    return alias;
  }

  const stat = lstatSync(alias);
  if (!stat.isSymbolicLink()) {
    throw new Error(`Safe tool path exists but is not a junction: ${alias}`);
  }

  const target = resolve(readlinkSync(alias));
  if (target.toLowerCase() !== resolvedWorkspace.toLowerCase()) {
    throw new Error(`Safe tool junction points to an unexpected workspace: ${target}`);
  }

  return alias;
}
