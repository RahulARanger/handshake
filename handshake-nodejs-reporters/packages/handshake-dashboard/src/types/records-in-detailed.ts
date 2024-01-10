import type { Context } from 'react';
import type { DetailedTestRecord, SuiteDetails } from './parsed-records';
import type {
    AssertionRecord,
    ImageRecord,
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
}

export interface ValuesInDetailedContext {
    detailsOfTestRun: DetailedTestRecord;
    images: ImageRecord[];
    suites: SuiteDetails;
}

export const DetailedContext = OverviewContext as Context<
    ValuesInDetailedContext | undefined
>;
