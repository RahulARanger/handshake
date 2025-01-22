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

    const filePath = path.join(
        process.env.TEST_RESULTS ?? '',
        'Attachments',
        ...(id as string[]),
    );

    response.status(200);
    fs.createReadStream(filePath).pipe(response);
}
