import { readFileSync } from 'node:fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'node:path';

type ResponseData = {
    message: string;
};

export default async function handler(
    request: NextApiRequest,
    response: NextApiResponse<ResponseData>,
) {
    const id = request.query?.id as string[];
    id[id?.length - 1] += ".json"
    const filePath = path.join(
        process.env.TEST_RESULTS ?? '',
        'Import',
        ...(id as string[]),
    );

    const value = JSON.parse(readFileSync(filePath, { encoding: 'utf8' }));
    response.status(200).json(value);
}
