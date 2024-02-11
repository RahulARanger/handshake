import getConnection from 'src/components/scripts/connection';
import currentExportConfig from 'src/components/scripts/config';
import { type GetStaticPathsResult } from 'next';
import sqlFile from './script';

export default async function staticPaths(): Promise<GetStaticPathsResult> {
    const connection = await getConnection();

    const exportConfig = await currentExportConfig(connection);

    const paths = await connection.all<Array<{ testID: string }>>(
        sqlFile('get-test-runs.sql'),
        Number(exportConfig?.maxTestRuns ?? -1),
    );
    await connection.close();

    return {
        paths: [
            ...paths.map((path) => ({ params: { id: path.testID } })),
            { params: { id: 'latest' } },
        ],
        fallback: false,
    };
}
