/**
 * File-system utilities with sandboxing — ensures all file operations stay
 * within the project working directory.
 *
 * Exports:
 * - `safePath(p)` — resolves a path relative to `cwd()` and rejects traversal
 *   attempts (e.g. `../../etc/passwd`) by checking the resolved path is a
 *   prefix of the working directory
 *
 * Used by: all file I/O tools (`read.ts`, `write.ts`, `edit.ts`, `bash.ts`)
 */
import { resolve } from "path";
import { cwd } from "process";

const WORKDIR = cwd();

/**
 * Resolve a path relative to the working directory and validate it does not
 * escape. Throws if the resolved path is outside WORKDIR.
 */
export function safePath(p: string): string {
  const path = resolve(WORKDIR, p);
  if (!path.startsWith(WORKDIR)) {
    throw new Error(`Path escapes workspace: ${p}`);
  }
  return path;
}