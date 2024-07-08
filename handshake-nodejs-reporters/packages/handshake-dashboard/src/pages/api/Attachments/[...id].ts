import { createReadStream } from 'node:fs';
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

    const filePath = join(
        process.env.TEST_RESULTS ?? '',
        'Attachments',
        ...(id as string[]),
    );

    response.status(200);
    createReadStream(filePath).pipe(response);
}
