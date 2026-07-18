import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readlinkSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

/**
 * Vite treats `#` as a URL fragment when an absolute Windows path reaches its
 * module graph. Keep the real workspace untouched and expose it through a
 * deterministic temporary junction for local tooling. CI paths normally skip
 * this branch entirely.
 */
export function getViteSafeRoot(workspace = process.cwd()): string {
  const resolvedWorkspace = resolve(workspace);

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
    throw new Error(`Vite safe-root path exists but is not a junction: ${alias}`);
  }

  const target = resolve(readlinkSync(alias));
  if (target.toLowerCase() !== resolvedWorkspace.toLowerCase()) {
    throw new Error(`Vite safe-root junction points to an unexpected workspace: ${target}`);
  }

  return alias;
}
