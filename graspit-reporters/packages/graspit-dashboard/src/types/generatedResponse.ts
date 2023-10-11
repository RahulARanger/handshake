import type { ShareToOtherPages } from './parsedRecords';
import type SessionRecordDetails from './sessionRecords';
import type { Attachment, SuiteRecordDetails } from './testEntityRelated';
import type { TestRunConfig, TestRunSummary } from './testRunRecords';
import type TestRunRecord from './testRunRecords';

export interface SWRResponse<Details> {
    data?: Details;
    error?: string;
    isLoading: boolean;
}
interface Order {
    '@order': string[];
}

export type SuiteDetails = Order & Record<string, SuiteRecordDetails>;

export type TestDetails = Record<string, SuiteRecordDetails>;

export type SessionDetails = Record<string, SessionRecordDetails>;
export type AttachmentDetails = Record<string, Attachment[]>;

export interface DetailedTestRunPageProps extends ShareToOtherPages {
    fallback: Record<
        string,
        | TestRunRecord
        | TestRunSummary
        | SuiteDetails
        | TestDetails
        | SessionDetails
        | AttachmentDetails
        | TestRunConfig[]
    >;
}
