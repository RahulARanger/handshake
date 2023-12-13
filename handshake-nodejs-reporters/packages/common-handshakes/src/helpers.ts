import { relative } from 'path';

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
