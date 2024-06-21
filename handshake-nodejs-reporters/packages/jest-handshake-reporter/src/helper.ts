export const joinConstant = ' > ';

export default function joinAncestorTitles(ancestorTitles: string[]): string {
  return ancestorTitles.join(joinConstant);
}

export function testID(startedAt?: number | null): string {
  return `test-${startedAt || 0}`;
}
