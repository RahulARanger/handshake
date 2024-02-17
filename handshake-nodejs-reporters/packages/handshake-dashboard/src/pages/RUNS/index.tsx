export { default } from '@/core/ListOfRuns/page';
import getConnection from '@/scripts/connection';
import { type GetStaticPropsResult } from 'next';
import currentExportConfig from '@/components/scripts/config';
import sqlFile from '@/components/scripts/RunPage/script';
import { parseTestConfig } from '@/components/parse-utils';
import type { TestRecord } from '@/types/test-run-records';

export async function getStaticProps(): Promise<
    GetStaticPropsResult<{ runs?: TestRecord[] }>
> {
    if (process.env.isDynamic) {
        return { props: { runs: undefined } };
    }

    const connection = await getConnection();
    const exportConfig = await currentExportConfig(connection);

    const allRuns = await connection.all<TestRecord[]>(
        sqlFile('runs-page.sql'),
        Number(exportConfig?.maxTestRuns ?? -1),
    );

    await connection.close();

    return {
        props: { runs: allRuns.map((record) => parseTestConfig(record)) ?? [] },
    };
}
