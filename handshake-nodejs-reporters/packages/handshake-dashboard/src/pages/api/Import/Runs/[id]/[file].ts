import { readFileSync } from 'node:fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import { dirname, join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

type ResponseData = {
    message: string;
};

export default async function handler(
    request: NextApiRequest,
    response: NextApiResponse<ResponseData>,
) {
    const { id, file } = request.query as { id: string; file: string };

    switch (file) {
        case 'overview.json':
        case 'suites.json':
        case 'run.json': {
            break;
        }
        default: {
            throw new Error(`Not implemented for ${file}`);
        }
    }

    const filePath = join(
        dirname(process.env.DB_PATH ?? ''),
        'Import',
        id,
        file,
    );

    // await sleep(3_000); // 😴 [3 seconds]

    const value = JSON.parse(readFileSync(filePath, { encoding: 'utf8' }));
    await sleep;
    response.status(200).json(value);
}
