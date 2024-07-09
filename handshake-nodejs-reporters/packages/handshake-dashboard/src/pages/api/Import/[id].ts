import { readFileSync } from 'node:fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import { join } from 'node:path';

type ResponseData = {
    message: string;
};

export default async function handler(
    request: NextApiRequest,
    response: NextApiResponse<ResponseData>,
) {
    const { id } = request.query;

    switch (id) {
        case 'runs.json':
        case 'projects.json': {
            break;
        }
        default: {
            throw new Error(`Invalid request for the file: ${id}`);
        }
    }

    const filePath = join(process.env.TEST_RESULTS ?? '', 'Import', id);

    const value = JSON.parse(readFileSync(filePath, { encoding: 'utf8' }));
    response.status(200).json(value);
}
