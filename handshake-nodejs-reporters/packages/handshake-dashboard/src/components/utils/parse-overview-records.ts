import dayjs from 'dayjs';
import type { OverviewOfEntities } from 'types/parsed-overview-records';
import type { SuiteRecordDetails } from 'types/test-entity-related';

export function parseEntitiesForOverview(
    records: SuiteRecordDetails[],
): OverviewOfEntities[] {
    return records.map((record) => ({
        duration: dayjs.duration({ milliseconds: record.duration }),
        ended: dayjs(record.ended),
        started: dayjs(record.started),
        title: record.title,
        id: record.suiteID,
        type: record.suiteType,
        passed: record.passed,
        failed: record.failed,
        skipped: record.skipped,
        standing: record.standing,
        numberOfErrors: record.numberOfErrors,
        numberOfAssertions: record.numberOfAssertions ?? 0,
    }));
}
