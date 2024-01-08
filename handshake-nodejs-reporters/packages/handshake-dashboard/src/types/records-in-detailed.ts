import { createContext } from 'react';
import type { DetailedTestRecord } from './parsed-records';
import type {
    AssertionRecord,
    ImageRecord,
    SuiteRecordDetails,
    TestRecordDetails,
} from './test-entity-related';
import type TestRunRecord from './test-run-records';

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
}

export const DetailedContext = createContext<
    ValuesInDetailedContext | undefined
>(undefined);
