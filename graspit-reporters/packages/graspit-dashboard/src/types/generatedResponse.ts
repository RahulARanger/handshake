import type { ShareToOtherPages } from './parsedRecords';
import type SessionRecordDetails from './sessionRecords';
import type {
    Attachment,
    RetriedRecord,
    SuiteRecordDetails,
} from './testEntityRelated';

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

export interface DetailedTestRunPageProps extends ShareToOtherPages {
    fallback: Record<string, unknown>;
}
