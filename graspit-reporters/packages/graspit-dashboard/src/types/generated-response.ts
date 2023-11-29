import type { ShareToOtherPages } from './parsed-records';
import type SessionRecordDetails from './session-records';
import type {
    Attachment,
    RetriedRecord,
    SuiteRecordDetails,
} from './test-entity-related';

export interface SWRResponse<Details> {
    data?: Details;
    error?: string;
    isLoading: boolean;
}
interface Order {
    '@order': string[];
}

export type SuiteDetails = Order & Record<string, SuiteRecordDetails>;

export type RetriedRecords = Record<string, RetriedRecord>;

export type TestDetails = Record<string, SuiteRecordDetails>;

export type SessionDetails = Record<string, SessionRecordDetails>;
export type AttachmentDetails = Record<string, Attachment[]>;

export interface DetailedTestRunPageProperties extends ShareToOtherPages {
    fallback: Record<string, unknown>;
}
