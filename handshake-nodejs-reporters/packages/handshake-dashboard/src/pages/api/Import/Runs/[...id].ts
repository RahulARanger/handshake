import { readFileSync } from 'node:fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

type ResponseData = {
    message: string;
};

export default async function handler(
    request: NextApiRequest,
    response: NextApiResponse<ResponseData>,
) {
    const { id } = request.query;

    await sleep(3000); // 😴 [3 seconds]

    const filePath = join(
        process.env.TEST_RESULTS ?? '',
        'Import',
        ...(id as string[]),
    );

    const value = JSON.parse(readFileSync(filePath, { encoding: 'utf8' }));
    await sleep;
    response.status(200).json(value);
}
