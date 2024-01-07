import type { RecurringFields } from './session-records';

export type suiteType = 'SUITE' | 'TEST';

export interface SuiteRecordDetails extends RecurringFields {
    suiteID: string;
    session_id: string;
    description: string;
    file: string;
    parent: string;
    suiteType: suiteType;
    errors: string;
    title: string;
    tags: string;
}

export interface Tag {
    name: string;
    id: string;
    location: { line: number; column: number };
    astNodeId: string;
}

export interface AttachmentContent {
    title: string;
    value: string;
}

export interface Attachment {
    attachmentValue: string;
    type: 'PNG' | 'ASSERT' | 'DESC' | 'LINK';
    description: string;
    entity_id: string;
}

export interface RetriedRecord {
    suite_id: string;
    tests: string[];
    length: number;
}

export interface ImageRecord {
    path: string;
    title: string;
    description?: string;
}
