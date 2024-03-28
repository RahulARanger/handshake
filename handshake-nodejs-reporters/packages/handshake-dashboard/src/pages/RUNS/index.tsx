export { default } from 'components/core/ListOfRuns/page';
import getConnection from 'scripts/connection';
import { type GetStaticPropsResult } from 'next';
import currentExportConfig from 'scripts/config';
import sqlFile from 'scripts/run-page/script';
import { parseTestConfig } from 'components/parse-utils';
import type { TestRecord } from 'types/test-run-records';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export async function getStaticProps(): Promise<
    GetStaticPropsResult<{ runs?: TestRecord[]; about?: string }>
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
        props: {
            runs: allRuns.map((record) => parseTestConfig(record)) ?? [],
            about: String(readFileSync(join(process.cwd(), 'src', 'about.md'))),
        },
    };
}
