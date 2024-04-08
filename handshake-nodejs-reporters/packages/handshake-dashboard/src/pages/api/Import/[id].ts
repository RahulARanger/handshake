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
    const { id } = request.query;

    let filePath = '';

    switch (id) {
        case 'runs.json': {
            filePath = join(
                dirname(process.env.DB_PATH ?? ''),
                'Import',
                'runs.json',
            );
            break;
        }
    }

    await sleep(10_000); // 😴 [2 seconds]

    const value = JSON.parse(readFileSync(filePath, { encoding: 'utf8' }));
    await sleep;
    response.status(200).json(value);
}
