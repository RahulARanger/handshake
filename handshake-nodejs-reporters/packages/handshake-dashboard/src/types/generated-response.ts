import type { ParsedSuiteRecord } from './parsed-records';
import type SessionRecordDetails from './session-records';
import type { RetriedRecord, SuiteRecordDetails } from './test-entity-related';

export interface SWRResponse<Details> {
    data?: Details;
    error?: string;
    isLoading: boolean;
}
interface Order {
    '@order': string[];
}

export type RetriedRecords = Record<string, RetriedRecord>;

export type TestDetails = Record<string, SuiteRecordDetails>;
