import { existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Resolve a directory under the project's src/ tree regardless of whether
 * this module is executing compiled (dist/src/...) or from source (src/...)
 * via tsx.
 */
export function underSrc(moduleDir: string, name: string): string {
  const inSourceTree = resolve(moduleDir, '..', name);
  if (existsSync(inSourceTree)) return inSourceTree;
  return resolve(moduleDir, '..', '..', '..', 'src', name);
}
