import { fileURLToPath } from 'node:url';
import path, { join } from 'node:path';
import { readFileSync } from 'node:fs';

export default function sqlFile(fileName: string): string {
    return readFileSync(
        join(path.dirname(fileURLToPath(import.meta.url)), fileName),
        { encoding: 'utf8' },
    );
}
