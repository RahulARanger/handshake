import fs from 'node:fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'node:path';

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

    const filePath = path.join(process.env.TEST_RESULTS ?? '', 'Import', id);

    const value = JSON.parse(fs.readFileSync(filePath, {encoding: 'binary'}));
    response.status(200).json(value);
}
