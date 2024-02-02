import type { Context } from 'react';
import type {
    DetailedTestRecord,
    ParsedRetriedRecords,
    SuiteDetails,
    TestDetails,
} from './parsed-records';
import type {
    AssertionRecord,
    ImageRecord,
    RetriedRecord,
    SuiteRecordDetails,
    TestRecordDetails,
} from './test-entity-related';
import type TestRunRecord from './test-run-records';
import { OverviewContext } from './parsed-overview-records';

export default interface DetailedPageProperties {
    detailsOfTestRun: TestRunRecord;
    tests: TestRecordDetails[];
    suites: SuiteRecordDetails[];
    assertions: AssertionRecord[];
    images: ImageRecord[];
    retriedRecords: RetriedRecord[];
}

export interface ValuesInDetailedContext {
    detailsOfTestRun: DetailedTestRecord;
    suites: SuiteDetails;
    tests: TestDetails;
    retriedRecords: ParsedRetriedRecords;
}

export const DetailedContext = OverviewContext as Context<
    ValuesInDetailedContext | undefined
>;
