import getConnection from 'src/components/scripts/connection';
import currentExportConfig, {
    getAllTestRuns,
} from 'src/components/scripts/config';
import { type GetStaticPathsResult } from 'next';

export default async function staticPaths(): Promise<GetStaticPathsResult> {
    const connection = await getConnection();

    const exportConfig = await currentExportConfig(connection);
    const paths = await getAllTestRuns(
        connection,
        exportConfig?.maxTestRuns ?? 1,
    );
    await connection.close();

    return {
        paths: paths.map((path: string) => ({ params: { id: path } })),
        fallback: false,
    };
}
