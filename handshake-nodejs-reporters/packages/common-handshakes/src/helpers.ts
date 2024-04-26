import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// eslint-disable-next-line import/prefer-default-export
export function sanitizePaths(specs?: string[]): string[] {
  return (specs ?? []).map((spec) => relative(
    process.cwd(),
    spec.startsWith('file:///') ? decodeURI(spec.slice(8)) : spec,
  ));
}

export function acceptableDateString(date: Date): string {
  return date.toISOString();
}

export function frameworksUsedString(frameworks: string[]): string {
  return frameworks.join(',');
}

export function checkVersion(exePath: string) {
  const observedVersion = execSync(`${exePath} v`).toString().trim();
  const currentDir = dirname(typeof __dirname !== 'undefined'
    ? __dirname
    : dirname(fileURLToPath(import.meta.url)));

  const expected = JSON.parse(readFileSync(join(currentDir, '.version'), 'utf-8'))?.version ?? '';
  return [expected, observedVersion, expected === observedVersion];
}
