import { relative } from 'node:path';

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

export function escapeShell(command: string) {
  // To avoid shell related codeQL bugs
  // excluded: ":\
  return command.replace(/[!$&'()*+,;<=>?@^`{|}~\\]/g, '\\$&').trim();
}

export function inQuotes(command: string){
  return `\"${command}\"`
}